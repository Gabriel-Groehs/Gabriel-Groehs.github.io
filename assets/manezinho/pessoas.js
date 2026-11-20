/* Pedestres com texturas e animação esquelética. Fontes no catálogo do projeto. */
window.MTAActors = (() => {
  "use strict";

  const models = new Map();
  const lowDetailGeometry = new Map();
  let runtime = null;
  let regionalTask = null;
  let regionalFinished = false;
  const awaitingRegion = new Map();
  const regionalProfiles = new Set([
    "moradora-ilha", "corredora-ilha", "praia-ilha", "praia-moradora", "guarda-ilha",
  ]);
  const renderedModes = new Set(["idle", "walk", "run", "wave", "talk", "jog", "flee", "stand", "down", "air"]);
  const palette = [0xcad0db, 0xdde0cb, 0xe6c3ae, 0xd3c3dd, 0xabc4d3, 0xffffff];
  const maleStreet = ["walker", "sam", "jordan", "sam", "walker", "road-worker", "dog-walker"];
  const femaleStreet = ["maya", "harper", "maya", "harper", "cyclist"];
  const swatches = new WeakMap();

  function renderMeshes(root) {
    const meshes = [];
    root.traverse(node => { if (node.isMesh) meshes.push(node); });
    return meshes;
  }

  function loadBodyDetails(key, model, diagnostics) {
    const profile = key.slice(0, -4);
    const full = models.get(profile)?.scene;
    if (!full) throw new Error("Perfil original indisponível: " + profile);
    const high = renderMeshes(full);
    const medium = renderMeshes(model.scene);
    if (high.length !== medium.length || high.some((mesh, i) =>
      mesh.name !== medium[i].name || mesh.isSkinnedMesh !== medium[i].isSkinnedMesh)) {
      throw new Error("Estrutura de malha incompatível com " + profile);
    }
    lowDetailGeometry.set(profile, medium.map(mesh => mesh.geometry));
    diagnostics.ok.push("pessoa-lod:" + profile);
  }

  async function load(loader, payload, diagnostics, bytesFromBase64) {
    runtime ??= { loader, diagnostics, bytesFromBase64 };
    await Promise.all(Object.entries(payload || {}).map(async ([key, data]) => {
      try {
        const model = await loader.parseAsync(bytesFromBase64(data).buffer, "");
        if (key.endsWith("-lod")) {
          loadBodyDetails(key, model, diagnostics);
          return;
        }
        let skinned = false;
        model.scene.traverse(node => { skinned ||= node.isSkinnedMesh === true; });
        if (key !== "nora" && key !== "surf-face" && (!skinned || !model.animations.some(clip => /walk/i.test(clip.name)))) {
          throw new Error("Malha sem esqueleto ou animação de caminhada");
        }
        models.set(key, model);
        diagnostics.ok.push("pessoa:" + key);
      } catch (error) {
        diagnostics.fail.push("pessoa:" + key + ": " + error.message);
      }
    }));
  }

  function loadRegional() {
    if (!runtime || regionalTask) return regionalTask;
    const { loader, diagnostics, bytesFromBase64 } = runtime;
    regionalTask = new Promise(resolve => {
      const script = document.createElement("script");
      script.src = "assets/manezinho/pessoas-regionais-modelos.js";
      script.async = true;
      script.onload = () => {
        const payload = window.MTARegionalActorData;
        delete window.MTARegionalActorData;
        script.remove();
        resolve(load(loader, payload, diagnostics, bytesFromBase64));
      };
      script.onerror = () => {
        script.remove();
        diagnostics.fail.push("pessoas regionais: arquivo de modelos indisponível");
        resolve();
      };
      document.head.appendChild(script);
    }).then(() => {
      regionalFinished = true;
      for (const [actor, entry] of awaitingRegion) {
        awaitingRegion.delete(actor);
        try {
          attach(actor, entry.seed, entry.options, entry.tools);
        } catch (error) {
          diagnostics.fail.push("troca visual regional: " + error.message);
        }
      }
    });
    return regionalTask;
  }

  function clipMap(clips) {
    const find = (...names) => {
      for (const name of names) {
        const clip = clips.find(candidate => candidate.name.toLowerCase() === name);
        if (clip) return clip;
      }
      return null;
    };
    const idle = find("idle_standing", "idle");
    const walk = find("walk_relaxed", "walk", "walk_brisk");
    return {
      idle,
      walk,
      run: find("run", "jog", "walk_brisk") || walk,
      talk: find("look_around") || idle,
      wave: find("wave", "look_around") || idle,
      air: find("jump") || idle,
    };
  }

  function bind(model, clips) {
    const byName = new Map();
    model.traverse(node => { if (node.name) byName.set(node.name, node); });
    const cache = new Map();
    function bindings(clip) {
      if (!clip) return [];
      if (cache.has(clip)) return cache.get(clip);
      const links = [];
      for (const track of clip.tracks) {
        const dot = track.name.lastIndexOf(".");
        const node = byName.get(track.name.slice(0, dot));
        const prop = track.name.slice(dot + 1);
        if (!node || !["position", "quaternion", "scale"].includes(prop)) continue;
        links.push({
          node, prop,
          sample: track.createInterpolant(),
          previous: node[prop].clone(),
          rest: node[prop].clone(),
        });
      }
      cache.set(clip, links);
      return links;
    }
    const map = {};
    for (const [key, clip] of Object.entries(clips)) map[key] = { clip, links: bindings(clip) };
    return map;
  }

  function recolor(model, seed) {
    const color = palette[seed % palette.length];
    model.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.frustumCulled = false;
      const material = node.material;
      if (material && !Array.isArray(material) && /accessory|ankle lining/i.test(material.name)) node.visible = false;
      if (!material || Array.isArray(material)
          || !/(hoodie|sweater|casual.?top|original top|full-length top|business fabric|shirt|outer)/i.test(material.name)) return;
      if (!swatches.has(material)) swatches.set(material, new Map());
      const available = swatches.get(material);
      if (!available.has(color)) {
        const copy = material.clone();
        copy.color.setHex(color);
        available.set(color, copy);
      }
      node.material = available.get(color);
    });
  }

  function faceForward(root, Vector) {
    const leftFoot = root.getObjectByName("foot_l");
    const rightFoot = root.getObjectByName("foot_r");
    const leftToe = root.getObjectByName("ball_l");
    const rightToe = root.getObjectByName("ball_r");
    if (!leftFoot || !rightFoot || !leftToe || !rightToe) return;
    root.updateMatrixWorld(true);
    const toes = leftToe.getWorldPosition(new Vector()).add(rightToe.getWorldPosition(new Vector()));
    const heels = leftFoot.getWorldPosition(new Vector()).add(rightFoot.getWorldPosition(new Vector()));
    toes.sub(heels);
    root.rotation.y -= Math.atan2(toes.x, toes.z);
  }

  function attach(actor, seed, options, tools) {
    if (actor.actorVisual || options.prop || (options.dress && !options.old) || (options.army && actor.female)) return actor;
    const cast = actor.female ? femaleStreet : maleStreet;
    let profile = cast[seed % cast.length];
    if (options.army) profile = "guarda-ilha";
    else if (options.old) profile = actor.female ? "moradora-ilha" : "dog-walker";
    else if (options.swim) profile = actor.female ? "praia-moradora" : "praia-ilha";
    else if (options.jog) profile = actor.female ? "corredora-ilha" : "sam";
    const source = models.get(profile);
    if (!source) {
      if (!regionalFinished && regionalProfiles.has(profile) && !awaitingRegion.has(actor)) {
        awaitingRegion.set(actor, { seed, options, tools });
        const dispose = actor.dispose;
        actor.dispose = () => {
          awaitingRegion.delete(actor);
          dispose();
        };
      }
      return actor;
    }
    const body = actor.parts.body;
    const root = tools.clone(source.scene);
    const { Quaternion, Vector } = tools;
    root.name = "pedestre-texturizado";
    root.userData.profile = profile;
    faceForward(root, Vector);
    actor.root.add(root);
    recolor(root, seed);
    const seat=options.seated ? window.MTAHeroes?.mapSeatedPose(actor,root,source.animations,tools):null;
    const uprightRotation=root.quaternion.clone(), uprightPosition=root.position.clone();
    const clips = bind(root, clipMap(source.animations));
    const rest = { clip: null, links: clips.walk.links };
    const tmpQ = new Quaternion();
    const tmpV = new Vector();
    let active = null;
    let blend = 0;
    let time = 0;
    let pending = 0;
    let detail = 0;
    let castShadow = true;
    const meshes = renderMeshes(root);
    const features = meshes.filter(mesh => /teeth|eyelash|eyebrow|scalp roots/i.test(mesh.name));
    const detailedGeometry = meshes.map(mesh => mesh.geometry);
    let geometry = detailedGeometry;
    actor.setVisualDistance = distance => {
      const shadow = distance < 30;
      if (shadow !== castShadow) {
        castShadow = shadow;
        for (const mesh of meshes) mesh.castShadow = shadow;
      }
      const nextGeometry = distance > 26 ? lowDetailGeometry.get(profile) ?? detailedGeometry : detailedGeometry;
      if (geometry !== nextGeometry) {
        geometry = nextGeometry;
        for (let i = 0; i < meshes.length; i++) meshes[i].geometry = geometry[i];
      }
      const next = distance > 44 ? 2 : distance > 18 ? 1 : 0;
      if (next === detail) return;
      detail = next;
      for (const feature of features) feature.visible = detail === 0;
    };
    const originalPose = actor.pose;
    const originalDispose = actor.dispose;

    actor.pose = (dt, input) => {
      const { mode = "idle", speed = 0, hold } = input;
      const seated=seat && (mode==="sit" || mode==="lace") && !hold;
      const show = (seated || renderedModes.has(mode)) && !hold;
      body.visible = !show;
      root.visible = show;
      if(seated){
        originalPose(dt,{...input,relaxedSeat:mode==="sit"});
        root.position.copy(body.position);
        root.position.y-=seat.offset;
        root.quaternion.copy(body.quaternion).multiply(uprightRotation);
        window.MTAHeroes.followBodyPose(seat.mapping);
        root.userData.clip=mode==="lace"?"renda-de-bilro":"sentado";
        active=null;
        return;
      }
      root.position.copy(uprightPosition);
      root.quaternion.copy(uprightRotation);
      if (!show) {
        active = null;
        originalPose(dt, input);
        return;
      }
      const selected = mode === "wave" || mode === "talk" || mode === "air" ? clips[mode]
        : speed >= 2.6 ? clips.run : speed > .22 ? clips.walk : clips.idle;
      const motion = selected.clip && selected.links.length ? selected : rest;
      const changed = motion !== active;
      if (changed) {
        active = motion;
        pending = 0;
        blend = 0;
        time = motion.clip ? motion.clip.duration * ((seed % 41) / 41) : 0;
        for (const link of motion.links) link.previous.copy(link.node[link.prop]);
      }
      const moving = motion === clips.run || motion === clips.walk;
      const nativeRun = motion === clips.run && motion.clip !== clips.walk.clip;
      const reference = nativeRun ? 2.8 : 1.35;
      const rate = moving ? Math.max(.50, Math.min(2.05, speed / reference)) : 1;
      time += dt * rate;
      blend = Math.min(1, blend + dt / .18);
      pending += dt;
      if (!changed && detail > 0 && pending < (detail === 2 ? .083 : .033)) return;
      pending = 0;
      const step = motion.clip ? time % motion.clip.duration : 0;
      for (const { node, prop, sample, previous, rest: neutral } of motion.links) {
        let target = neutral;
        if (motion.clip) {
          const data = sample.evaluate(step);
          target = (prop === "quaternion" ? tmpQ : tmpV).fromArray(data);
        }
        if (prop === "quaternion") node.quaternion.copy(previous).slerp(target, blend).normalize();
        else node[prop].copy(previous).lerp(target, blend);
      }
      root.userData.clip = motion.clip?.name || "pose-neutra";
    };
    actor.dispose = () => {
      actor.root.remove(root);
      const skeletons = new Set();
      root.traverse(node => { if (node.isSkinnedMesh) skeletons.add(node.skeleton); });
      for (const skeleton of skeletons) skeleton.dispose();
      originalDispose();
    };
    actor.actorVisual = root;
    actor.pose(0, { mode: "idle" });
    return actor;
  }

  return Object.freeze({ load, loadRegional, attach, model: name => models.get(name) });
})();
