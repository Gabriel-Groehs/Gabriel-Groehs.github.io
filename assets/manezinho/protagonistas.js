/* Adaptação da malha do Manezinho ao esqueleto de controle do jogo. */
window.MTAHeroes = (() => {
  "use strict";

  const joints = {
    head: "head",
    shL: "upperarm_l", elL: "lowerarm_l",
    shR: "upperarm_r", elR: "lowerarm_r",
    hipL: "thigh_l", kneeL: "calf_l",
    hipR: "thigh_r", kneeR: "calf_r",
  };

  const motionJoints = {
    head: "Head",
    shL: "LeftArm", elL: "LeftForeArm",
    shR: "RightArm", elR: "RightForeArm",
    hipL: "LeftUpLeg", kneeL: "LeftLeg",
    hipR: "RightUpLeg", kneeR: "RightLeg",
  };

  function align(source, Vector) {
    const toeL = source.getObjectByName("ball_l");
    const toeR = source.getObjectByName("ball_r");
    const footL = source.getObjectByName("foot_l");
    const footR = source.getObjectByName("foot_r");
    if (!toeL || !toeR || !footL || !footR) return;
    const toes = toeL.getWorldPosition(new Vector()).add(toeR.getWorldPosition(new Vector()));
    const feet = footL.getWorldPosition(new Vector()).add(footR.getWorldPosition(new Vector()));
    toes.sub(feet);
    source.rotation.y -= Math.atan2(toes.x, toes.z);
  }

  function standing(model, clips) {
    const clip = clips.find(candidate => candidate.name === "Idle_Standing" || candidate.name === "Idle");
    if (!clip) return;
    for (const track of clip.tracks) {
      const dot = track.name.lastIndexOf(".");
      const node = model.getObjectByName(track.name.slice(0, dot));
      const property = track.name.slice(dot + 1);
      if (node && ["position", "quaternion", "scale"].includes(property)) {
        node[property].fromArray(track.createInterpolant().evaluate(.15));
      }
    }
  }

  function solveGrip(shoulder, elbow, palm, target) {
    const Vector = palm.position.constructor;
    const Quaternion = shoulder.quaternion.constructor;
    const start = shoulder.getWorldPosition(new Vector());
    const joint = elbow.getWorldPosition(new Vector());
    const end = palm.getWorldPosition(new Vector());
    const wish = target.getWorldPosition(new Vector()).sub(start);
    const upper = joint.distanceTo(start);
    const lower = joint.distanceTo(end);
    const distance = Math.min(upper + lower - .006, Math.max(Math.abs(upper - lower) + .006, wish.length()));
    if (distance <= .02 || upper <= .02 || lower <= .02 || wish.lengthSq() <= 1e-5) return;
    const forward = wish.normalize();
    const bend = joint.clone().sub(start);
    bend.addScaledVector(forward, -bend.dot(forward));
    if (bend.lengthSq() < .0001) {
      bend.set(0, -1, 0).addScaledVector(forward, forward.y);
    }
    bend.normalize();
    const projection = (upper * upper - lower * lower + distance * distance) / (2 * distance);
    const nextElbow = start.clone().addScaledVector(forward, projection)
      .addScaledVector(bend, Math.sqrt(Math.max(0, upper * upper - projection * projection)));
    const nextPalm = start.clone().addScaledVector(forward, distance);

    function pointAt(bone, current, aim) {
      const change = new Quaternion().setFromUnitVectors(current.normalize(), aim.normalize());
      const world = bone.getWorldQuaternion(new Quaternion());
      const parent = bone.parent.getWorldQuaternion(new Quaternion()).invert();
      bone.quaternion.copy(parent.multiply(change).multiply(world)).normalize();
      bone.updateWorldMatrix(false, true);
    }

    pointAt(shoulder, joint.clone().sub(start), nextElbow.clone().sub(start));
    const elbowNow = elbow.getWorldPosition(new Vector());
    pointAt(elbow, palm.getWorldPosition(new Vector()).sub(elbowNow), nextPalm.sub(elbowNow));
  }

  function alignVehicleHands(actor, control) {
    const marks = control?.grips;
    if (!marks || !actor) return;
    for (const side of ["L", "R"]) {
      const shoulder = actor.rideBones?.["sh" + side] ?? actor.parts["sh" + side];
      const elbow = actor.rideBones?.["el" + side] ?? actor.parts["el" + side];
      const handle = actor.parts["sh" + side]?.userData.grip;
      if (shoulder?.parent && elbow?.parent && handle) solveGrip(shoulder, elbow, handle, marks[side]);
    }
  }

  function beginCabinEntry(driver, car, seat) {
    const cabin=car.special.detailed;
    driver.cabinEntry=null;
    if(!cabin?.door || driver.enter?.car!==car) {
      cabin?.finishDoor(false);
      return;
    }
    car.chassis.updateWorldMatrix(true,false);
    const from=car.chassis.worldToLocal(driver.pos.clone());
    const to=from.clone().set(seat.x,seat.y-.78*seat.s,seat.z);
    driver.cabinEntry={ car,from,to,time:0 };
  }

  function advanceCabinEntry(driver, car, delta) {
    const entry=driver.cabinEntry;
    if(!entry || entry.car!==car)return true;
    entry.time=Math.min(1,entry.time+delta/.31);
    const progress=entry.time;
    const move=progress*progress*(3-2*progress);
    const root=driver.H.root;
    root.position.lerpVectors(entry.from,entry.to,move);
    root.position.y+=Math.sin(Math.PI*progress)*.075;
    root.rotation.set(.13*Math.sin(Math.PI*progress),-.34*(1-move)*Math.sign(entry.from.x),0);
    if(progress>=1) {
      driver.cabinEntry=null;
      car.special.detailed.finishDoor(false);
    }
    return progress>=.79;
  }

  function makeShirtPrint(mesh, tools) {
    if (!mesh.isSkinnedMesh || !mesh.geometry.index) return null;
    const { index, attributes } = mesh.geometry;
    const positions = attributes.position;
    const normals = attributes.normal;
    const region = [];
    for (let offset = 0; offset < index.count; offset += 3) {
      const a = index.getX(offset), b = index.getX(offset + 1), c = index.getX(offset + 2);
      const x = (positions.getX(a) + positions.getX(b) + positions.getX(c)) / 3;
      const y = (positions.getY(a) + positions.getY(b) + positions.getY(c)) / 3;
      const z = (positions.getZ(a) + positions.getZ(b) + positions.getZ(c)) / 3;
      if (Math.abs(x) < .24 && y > 1.19 && y < 1.49 && z > .08
          && (!normals || (normals.getZ(a) + normals.getZ(b) + normals.getZ(c)) > 1.35)) region.push(a, b, c);
    }
    if (region.length < 9) return null;
    const logo = mesh.clone();
    logo.name = "estampa-santa-catarina";
    logo.castShadow = false;
    logo.geometry = mesh.geometry.clone();
    logo.geometry.setIndex(region);
    const uv = new Float32Array(positions.count * 2);
    for (let i = 0; i < positions.count; i++) {
      uv[i * 2] = positions.getX(i) / .43 + .5;
      uv[i * 2 + 1] = (positions.getY(i) - 1.18) / .30;
    }
    logo.geometry.setAttribute("uv", new tools.Attribute(uv, 2));
    logo.material = new tools.Material({
      map: tools.shirtTexture(), transparent: true, alphaTest: .27, roughness: .88,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    logo.renderOrder = 1;
    return logo;
  }

  const hairTextures = new WeakMap();

  function silverHair(material, tools) {
    const map = material.map;
    if (!map?.image) return null;
    if (hairTextures.has(map)) return hairTextures.get(map);
    const source = map.image;
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(source.width, 512);
    canvas.height = Math.min(source.height, 512);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = image.data;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const luminance = (.21 * pixels[offset] + .72 * pixels[offset + 1] + .07 * pixels[offset + 2]) / 255;
      const shade = 83 + Math.sqrt(luminance) * 133;
      pixels[offset] = shade;
      pixels[offset + 1] = shade + 1;
      pixels[offset + 2] = shade + 6;
    }
    context.putImageData(image, 0, 0);
    const recolored = tools.makeTexture(canvas, { repeat: false, aniso: 4 });
    recolored.flipY = map.flipY;
    hairTextures.set(map, recolored);
    return recolored;
  }

  function fitGlasses(actor, figure, attachments, Vector) {
    const head = figure.getObjectByName("Head");
    const left = figure.getObjectByName("LeftEye");
    const right = figure.getObjectByName("RightEye");
    if (!head || !left || !right) return;
    const L = left.getWorldPosition(new Vector());
    const R = right.getWorldPosition(new Vector());
    const midpoint = L.clone().add(R).multiplyScalar(.5);
    for (const node of actor.parts.head.children.slice()) {
      if (!node.userData.mtaEyewear && !node.userData.mtaEarring) continue;
      const side = Math.sign(node.position.x);
      let point = (side > 0 ? L : side < 0 ? R : midpoint).clone();
      const orientation = node.quaternion.clone();
      if (node.userData.mtaEarring) {
        point = midpoint.clone().add(new Vector(side * .075, -.043, -.047));
      } else {
        point.y -= .003;
        point.z += .024;
      }
      attachments.push([node.parent, node]);
      head.attach(node);
      node.position.copy(head.worldToLocal(point));
      node.quaternion.copy(orientation);
      node.scale.multiplyScalar(node.userData.mtaEyewear ? .81 : .71);
    }
  }

  function naturalGait(figure, source, tools) {
    const locomotion = [
      { pace: "walk", names: ["walk_brisk", "walk", "walk_relaxed"], speed: 2.75 },
      { pace: "run", names: ["run", "jog"], speed: 5.4 },
    ];
    const byName = new Map();
    figure.traverse(node => { if (node.name && node.isBone) byName.set(node.name, node); });
    const clips = new Map();
    const driven = /^(?:thigh_[lr]|calf_[lr]|upperarm_[lr]|lowerarm_[lr]|LeftUpLeg|RightUpLeg|LeftLeg|RightLeg|LeftArm|RightArm|LeftForeArm|RightForeArm)$/;
    const hands = /arm/i;
    for (const style of locomotion) {
      const clip = style.names.map(name => source.animations.find(candidate => candidate.name.toLowerCase() === name))
        .find(Boolean);
      if (!clip || clip.duration <= 0) continue;
      const channels = [];
      for (const track of clip.tracks) {
        if (!track.name.endsWith(".quaternion")) continue;
        const name = track.name.slice(0, -11);
        const bone = byName.get(name);
        if (bone && driven.test(name)) channels.push({ bone, arm: hands.test(name), sample: track.createInterpolant() });
      }
      if (channels.length >= 4) clips.set(style.pace, { clip, channels, speed: style.speed });
    }
    const tmp = new tools.Quaternion();
    let current = null;
    let phase = 0;
    let weight = 0;
    return (dt, input, board) => {
      const speed = input.speed || 0;
      const moving = input.mode === "walk" || input.mode === "run";
      const pace = clips.get(speed > 4.3 ? "run" : "walk");
      const next = moving && speed > .4 && !input.action ? pace : null;
      if (next && next !== current) {
        current = next;
        weight *= .58;
      }
      if (!current) return;
      const target = next ? .88 : 0;
      weight += (target - weight) * Math.min(1, dt * (target ? 10 : 14));
      if (weight < .005 && !next) {
        current = null;
        return;
      }
      const rate = Math.min(1.58, Math.max(.72, speed / current.speed));
      phase = (phase + dt * rate / current.clip.duration) % 1;
      const time = phase * current.clip.duration;
      for (const { bone, arm, sample } of current.channels) {
        if (arm && (board || input.hold || input.aim)) continue;
        bone.quaternion.slerp(tmp.fromArray(sample.evaluate(time)), weight).normalize();
      }
    };
  }

  function mapBodyPose(actor,figure,Quaternion,jointNames) {
    const mapping=[];
    for(const [key,name] of Object.entries(jointNames)){
      const driver=actor.parts[key];
      const receiver=figure.getObjectByName(name);
      if(!driver || !receiver?.parent)return null;
      const fromDriver=receiver.parent.getWorldQuaternion(new Quaternion()).invert()
        .multiply(driver.parent.getWorldQuaternion(new Quaternion()));
      const rest=driver.quaternion.clone().invert()
        .multiply(fromDriver.clone().invert()).multiply(receiver.quaternion);
      mapping.push({ key,driver,receiver,fromDriver,targetRest:rest });
    }
    return mapping;
  }

  function followBodyPose(mapping) {
    for(const {driver,receiver,fromDriver,targetRest} of mapping)
      receiver.quaternion.copy(fromDriver).multiply(driver.quaternion).multiply(targetRest).normalize();
  }

  function mapSeatedPose(actor,figure,animations,tools) {
    if(!figure.getObjectByName("LeftArm"))return null;
    const {Quaternion,Vector}=tools;
    actor.pose(.34,{mode:"idle"});
    standing(figure,animations);
    figure.updateWorldMatrix(true,true);
    actor.root.updateWorldMatrix(true,true);
    const mapping=mapBodyPose(actor,figure,Quaternion,motionJoints);
    if(!mapping)return null;
    const hip=figure.getObjectByName("Hips");
    const height=hip?actor.root.worldToLocal(hip.getWorldPosition(new Vector())).y:actor.hipY||.8;
    const offset=Math.max(-.16,Math.min(.18,height-(actor.hipY||.8)-.045));
    return { mapping,offset };
  }

  function attachHumanoid(actor, profile, tools) {
    const fisherman = profile === "mane";
    const source = window.MTAActors?.model(fisherman ? "sam" : profile + "-ara");
    if (!source) return actor;
    const { Group, Quaternion, Vector } = tools;
    const shell = new Group();
    shell.name = profile === "mane" ? "manezinho-visual" : profile + "-corpo-texturizado";
    const figure = tools.clone(source.scene);
    align(figure, Vector);
    standing(figure, source.animations);
    figure.updateMatrixWorld(true);
    for (const side of ["l", "r"]) {
      const shin = figure.getObjectByName("calf_" + side);
      const foot = figure.getObjectByName("foot_" + side);
      // The imported foot is an independent root control. Its boot needs to follow the shin.
      if (shin && foot && foot.parent !== shin) shin.attach(foot);
    }
    if (fisherman) figure.scale.set(1.13, 1.055, 1.08);
    else if (profile === "rendeira") figure.scale.setScalar(1.086);
    shell.add(figure);
    shell.updateMatrixWorld(true);
    actor.root.updateMatrixWorld(true);

    const mapping = mapBodyPose(actor,figure,Quaternion,fisherman?joints:motionJoints);
    if(!mapping)return actor;
    const rideBones=Object.fromEntries(mapping.map(({key,receiver})=>[key,receiver]));

    // Keep the old rig as the source of locomotion and of item attachment points.
    const visualOnly = new Set([actor.parts.hat, actor.parts.fish, actor.boardCarry,
      actor.parts.shL.userData.grip, actor.parts.shR.userData.grip]);
    const apron = actor.parts.body.children.find(node => node.userData.mtaRendeiraApron);
    if (apron) {
      visualOnly.add(apron);
      apron.position.set(0, .116, -.113);
      apron.scale.setScalar(.78);
    }
    const oldMeshes = [];
    function keepAttachments(node) {
      if (visualOnly.has(node) || node.userData.mtaEyewear || node.userData.mtaEarring) return;
      if (node.isMesh && node.visible) {
        oldMeshes.push(node);
        node.visible = false;
      }
      for (const child of node.children) keepAttachments(child);
    }
    keepAttachments(actor.root);
    actor.root.add(shell);
    const materials = new Set();
    const skeletons = new Set();
    const prints = [];
    figure.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.frustumCulled = false;
      if (node.isSkinnedMesh) skeletons.add(node.skeleton);
      const material = node.material;
      if (!material || Array.isArray(material)) return;
      if (/accessory|ankle lining/i.test(material.name)) {
        node.visible = false;
        return;
      }
      if (profile === "rendeira" && material.name === "Hair") {
        const map = silverHair(material, tools);
        if (map) {
          const copy = material.clone();
          copy.map = map;
          copy.color.setHex(0xffffff);
          node.material = copy;
          materials.add(copy);
        }
      }
      if (/original top|original bottom/i.test(material.name)) {
        const copy = material.clone();
        copy.color.setHex(/original top/i.test(material.name) ? 0xddd4a9 : 0x494e37);
        copy.roughness = .89;
        node.material = copy;
        materials.add(copy);
        if (/original top/i.test(material.name)) {
          const stamp = makeShirtPrint(node, tools);
          if (stamp) prints.push([node.parent, stamp]);
        }
      }
    });
    for (const [parent, stamp] of prints) parent.add(stamp);

    const body = actor.parts.body;
    const hat = actor.parts.hat;
    if (hat) {
      hat.position.set(0, .15, -.014);
      hat.scale.multiplyScalar(.86);
    }
    const sockets = [];
    if (profile === "rendeira") fitGlasses(actor, figure, sockets, Vector);
    for (const [side, sideName, key] of [["l", "Left", "shL"], ["r", "Right", "shR"]]) {
      const hand = figure.getObjectByName(fisherman ? "hand_" + side : sideName + "Hand");
      const grip = actor.parts[key]?.userData.grip;
      if (!hand || !grip) continue;
      const middle = figure.getObjectByName(fisherman ? "middle_01_" + side : sideName + "HandMiddle1");
      const ring = figure.getObjectByName(fisherman ? "ring_01_" + side : sideName + "HandRing1");
      const at = hand.getWorldPosition(new Vector());
      if (middle && ring) {
        at.lerp(middle.getWorldPosition(new Vector()).add(ring.getWorldPosition(new Vector())).multiplyScalar(.5), .82);
      }
      sockets.push([grip.parent, grip]);
      hand.attach(grip);
      grip.position.copy(hand.worldToLocal(at));
    }
    const pose = actor.pose;
    const applyGait = naturalGait(figure, source, tools);
    actor.pose = (dt, input) => {
      pose(dt, input);
      shell.quaternion.copy(body.quaternion);
      shell.position.copy(body.position);
      if (input.mode === "sit" || input.mode === "pedal" || input.mode === "ride") {
        shell.position.y -= fisherman ? .10 : profile === "rendeira" ? .015 : .105;
        if (input.mode === "pedal") shell.position.z -= .10;
      }
      followBodyPose(mapping);
      const board = actor.boardCarry;
      applyGait(dt, input, board?.visible);
      const arm = actor.parts.shL.userData.grip;
      if (board?.visible && board.parent && arm) {
        const at = arm.getWorldPosition(new Vector());
        board.position.copy(board.parent.worldToLocal(at));
        board.position.add(new Vector(.03, -.14, .045));
      }
    };
    actor.releaseHeroVisual = () => {
      for (const [parent, grip] of sockets) parent.add(grip);
      shell.removeFromParent();
      for (const skeleton of skeletons) skeleton.dispose();
      for (const material of materials) material.dispose();
      for (const [, print] of prints) {
        print.geometry.dispose();
        print.material.dispose();
      }
      for (const mesh of oldMeshes) mesh.visible = true;
    };
    actor.heroVisual = shell;
    actor.rideBones = rideBones;
    return actor;
  }

  function joinNeck(head, tools, shape, color, length, y, z) {
    const geometry = new tools.Cylinder(shape[0], shape[1], length, 20, 3);
    const material = new tools.Material({ color, roughness: .82 });
    const neck = new tools.Mesh(geometry, material);
    neck.name = "pescoço";
    neck.position.set(0, y, z);
    neck.castShadow = true;
    head.add(neck);
    return () => {
      neck.removeFromParent();
      geometry.dispose();
      material.dispose();
    };
  }

  function attachSurfista(actor, tools) {
    const source = window.MTAActors?.model("surf-face");
    if (!source || !actor.model || !actor.parts.head) return actor;
    const head = actor.parts.head;
    let torso = null;
    actor.root.traverse(node => { if (node.isSkinnedMesh && !torso) torso = node; });
    const index = torso?.geometry.index;
    const weights = torso?.geometry.attributes.skinWeight;
    const joints = torso?.geometry.attributes.skinIndex;
    const position = torso?.geometry.attributes.position;
    const headBone = torso?.skeleton.bones.indexOf(head);
    if (!index || !weights || !joints || headBone < 0) return actor;

    const oldGeometry = torso.geometry;
    const geometry = oldGeometry.clone();
    const hide = new Uint8Array(position.count);
    for (let i = 0; i < hide.length; i++) {
      const x = joints.getX(i) === headBone ? weights.getX(i) : 0;
      const y = joints.getY(i) === headBone ? weights.getY(i) : 0;
      const z = joints.getZ(i) === headBone ? weights.getZ(i) : 0;
      const w = joints.getW(i) === headBone ? weights.getW(i) : 0;
      hide[i] = position.getY(i) > 1.61 && x + y + z + w >= .30 ? 1 : 0;
    }
    const body = [];
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
      if (hide[a] + hide[b] + hide[c] < 2) body.push(a, b, c);
    }
    if (body.length === index.count) return actor;
    geometry.setIndex(body);
    torso.geometry = geometry;
    const eyes = actor.parts.eyes || [];
    for (const eye of eyes) eye.visible = false;

    const face = source.scene.clone(true);
    face.name = "surfista-rosto-texturizado";
    face.scale.set(1.19, 1.13, 1.08);
    face.position.set(0, -1.809, -.019);
    const materials = [];
    face.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      const material = node.material;
      if (!material || Array.isArray(material)) return;
      if (/short01|hair roots|anatomical body.body/i.test(material.name)) {
        node.material = material.clone();
        if (/short01|hair roots/i.test(material.name)) node.material.color.setRGB(2.1, 1.75, 1.05);
        else node.material.color.setHex(0xf5cfae);
        materials.push(node.material);
      }
    });
    head.add(face);
    const releaseNeck = joinNeck(head, tools, [.071, .094], 0xae7753, .212, -.103, .043);
    actor.heroVisual = face;
    actor.releaseHeroVisual = () => {
      releaseNeck();
      for (const material of materials) material.dispose();
      face.removeFromParent();
      torso.geometry = oldGeometry;
      geometry.dispose();
      for (const eye of eyes) eye.visible = true;
    };
    return actor;
  }

  function attachRendeira(actor, tools) {
    const source = window.MTAActors?.model("nora");
    if (!source || !actor.parts.head) return actor;
    const head = actor.parts.head;
    const face = source.scene.clone(true);
    face.name = "rendeira-rosto-texturizado";
    face.scale.set(1.15, 1.14, 1.06);
    face.position.set(0, -1.458, -.003);
    face.traverse(node => {
      if (node.isMesh) node.castShadow = true;
    });
    const old = head.children.filter(node => node.userData.mtaRendeiraFace);
    for (const node of old) node.visible = false;
    for (const node of head.children) {
      if (node.userData.mtaEyewear) {
        node.position.x *= .68;
        node.position.y -= .035;
        node.position.z += .009;
        node.scale.multiplyScalar(.83);
      }
      if (node.userData.mtaEarring) {
        node.position.x *= .58;
        node.position.y += .016;
        node.position.z += .029;
      }
    }
    head.add(face);
    const releaseNeck = joinNeck(head, tools, [.051, .062], 0xbb8c6e, .155, .024, .042);
    actor.heroVisual = face;
    actor.releaseHeroVisual = () => {
      releaseNeck();
      face.removeFromParent();
      for (const node of old) node.visible = true;
    };
    return actor;
  }

  function attach(actor, name, tools) {
    const detailed = attachHumanoid(actor, name, tools);
    if (detailed.heroVisual || name === "mane") return detailed;
    if (name === "surfista") return attachSurfista(actor, tools);
    if (name === "rendeira") return attachRendeira(actor, tools);
    return actor;
  }

  return Object.freeze({ attach, alignVehicleHands, beginCabinEntry, advanceCabinEntry, mapSeatedPose, followBodyPose });
})();
