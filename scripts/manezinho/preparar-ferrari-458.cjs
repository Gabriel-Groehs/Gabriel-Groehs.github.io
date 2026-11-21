"use strict";

// Source Ferrari 458 Italia by vicent091036, CC BY 4.0.
// Published in https://threejs.org/examples/webgl_materials_car.html
// License recorded at https://github.com/mrdoob/three.js/issues/23089
const fs = require("node:fs");
const crypto = require("node:crypto");
const { NodeIO } = require("@gltf-transform/core");
const { ALL_EXTENSIONS, KHRMaterialsClearcoat } = require("@gltf-transform/extensions");
const { prune, dedup, weld, meshopt } = require("@gltf-transform/functions");
const { MeshoptEncoder, MeshoptDecoder } = require("meshoptimizer");
const draco = require("draco3dgltf");
global.window = {};
require(process.argv[4]);
const { MeshoptSimplifier } = global.window;
delete global.window;

const sourceChecksum = "cafe3f48da6797aa9bde75ca768bc5b57db366575fd233e90df186ae988a876e";

async function prepare(input, output) {
  const original = fs.readFileSync(input);
  const hash = crypto.createHash("sha256").update(original).digest("hex");
  if (hash !== sourceChecksum) throw new Error("A origem não corresponde ao arquivo Three.js r180 documentado.");
  await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "draco3d.decoder": await draco.createDecoderModule(),
    "meshopt.encoder": MeshoptEncoder,
    "meshopt.decoder": MeshoptDecoder,
  });

  const doc = await io.read(input);
  const root = doc.getRoot();
  const count = () => root.listMeshes().reduce((total, mesh) => total + mesh.listPrimitives()
    .reduce((n, primitive) => n + primitive.getIndices().getCount() / 3, 0), 0);
  const before = count();
  root.listExtensionsUsed().find(ext => ext.extensionName === "KHR_draco_mesh_compression")?.dispose();
  root.setExtras({
    author: "vicent091036", title: "Ferrari 458 Italia",
    license: "https://creativecommons.org/licenses/by/4.0/",
    original: "https://threejs.org/examples/webgl_materials_car.html",
    adaptation: "Manezinho TA. Materiais, simplificação e nomes das articulações adaptados."
  });
  const coat = doc.createExtension(KHRMaterialsClearcoat);
  const clearcoat = (material, strength, roughness) => {
    material.setExtension("KHR_materials_clearcoat",
      coat.createClearcoat().setClearcoatFactor(strength).setClearcoatRoughnessFactor(roughness));
  };

  for (const node of root.listNodes()) {
    if (/^wheel_(fl|fr|rl|rr)$/.test(node.getName())) node.setName(node.getName().toUpperCase().replace("WHEEL_", "wheel_"));
  }
  // The source groups bumper liners and cockpit details together. Separate them for LOD.
  const bumperLiner = doc.createMaterial("grille-liner").setBaseColorFactor([.022,.025,.028,1])
    .setMetallicFactor(.15).setRoughnessFactor(.63);
  for (const node of root.listNodes().filter(n => /^interior_(dark|light)$/.test(n.getName()))) {
    const parent = node.getParentNode();
    const world = node.getWorldMatrix();
    const exterior = doc.createMesh("bumper_liner");
    for (const primitive of node.getMesh().listPrimitives()) {
      const positions = primitive.getAttribute("POSITION");
      const indices = primitive.getIndices();
      const style = indices.getArray().constructor;
      const src = indices.getArray();
      const cabin = [], liner = [];
      const worldZ = id => {
        const [x,y,z] = positions.getElement(id,[]);
        return world[2]*x + world[6]*y + world[10]*z + world[14];
      };
      for (let i = 0; i < src.length; i += 3) {
        const tri = src.subarray(i,i+3);
        const z = (worldZ(tri[0]) + worldZ(tri[1]) + worldZ(tri[2])) / 3;
        (z < -1.69 || z > 1.80 ? liner : cabin).push(...tri);
      }
      if (!liner.length) continue;
      if (!cabin.length) {
        primitive.setMaterial(bumperLiner);
        node.setName("bumper_liner");
        continue;
      }
      const faces = doc.createPrimitive().setMaterial(bumperLiner);
      for(const key of primitive.listSemantics()) faces.setAttribute(key,primitive.getAttribute(key));
      faces.setIndices(doc.createAccessor().setType("SCALAR").setBuffer(indices.getBuffer()).setArray(new style(liner)));
      exterior.addPrimitive(faces);
      primitive.setIndices(doc.createAccessor().setType("SCALAR").setBuffer(indices.getBuffer()).setArray(new style(cabin)));
    }
    if (exterior.listPrimitives().length) {
      parent.addChild(doc.createNode("bumper_liner_"+node.getName().split("_").at(-1)).setMatrix(node.getMatrix()).setMesh(exterior));
    }
  }
  const grilles = root.listNodes().find(node => node.getName() === "grills");
  const grillePaint = doc.createMaterial("grille-radiator").setBaseColorFactor([.013,.016,.019,1])
    .setMetallicFactor(.14).setRoughnessFactor(.68);
  for (const primitive of grilles?.getMesh().listPrimitives() ?? []) primitive.setMaterial(grillePaint);

  for (const material of root.listMaterials()) {
    switch (material.getName()) {
      case "Body_Color":
        material.setName("paint").setMetallicFactor(.34).setRoughnessFactor(.225);
        clearcoat(material, .82, .14);
        break;
      case "Glass_Gray":
        material.setName("glass").setBaseColorFactor([.062,.081,.102,.74])
          .setRoughnessFactor(.12).setMetallicFactor(.27);
        clearcoat(material, .75, .12);
        break;
      case "Projector_Glass":
        material.setName("lamp_front").setBaseColorFactor([.42,.49,.55,.81])
          .setRoughnessFactor(.2).setEmissiveFactor([.38,.44,.52]);
        break;
      case "Taillight_Glass":
        material.setName("lamp_red").setBaseColorFactor([.49,.006,.012,.88])
          .setRoughnessFactor(.2).setEmissiveFactor([.27,.018,.017]);
        break;
      case "Tires":
        material.setBaseColorFactor([.013,.015,.017,1]).setRoughnessFactor(.92).setMetallicFactor(0);
        break;
      case "metal_chrome":
        material.setBaseColorFactor([.46,.49,.52,1]).setRoughnessFactor(.27).setMetallicFactor(.84);
        break;
      case "metal_gray":
        material.setBaseColorFactor([.30,.33,.35,1]).setRoughnessFactor(.35).setMetallicFactor(.66);
        break;
      case "plastic_gray":
        material.setBaseColorFactor([.023,.026,.029,1]).setRoughnessFactor(.54).setMetallicFactor(.07);
        break;
      case "Carpet":
        material.setBaseColorFactor([.034,.036,.039,1]).setRoughnessFactor(1).setMetallicFactor(0);
        break;
      case "Carbon_Fiber":
        material.setBaseColorFactor([.035,.039,.045,1]).setRoughnessFactor(.32).setMetallicFactor(.26);
        break;
      default:
        break;
    }
  }
  // The source has no textures. Dropping unused UVs joins otherwise identical surface vertices.
  for (const mesh of root.listMeshes()) for (const primitive of mesh.listPrimitives()) {
    primitive.setAttribute("TEXCOORD_0", null);
  }
  await doc.transform(weld({ overwrite:true }));
  for (const mesh of root.listMeshes()) for (const primitive of mesh.listPrimitives()) {
    const index = primitive.getIndices(), indices = Uint32Array.from(index.getArray());
    if (indices.length < 300) continue;
    const position = primitive.getAttribute("POSITION");
    const normal = primitive.getAttribute("NORMAL");
    const material = primitive.getMaterial().getName();
    if (material === "grille-radiator") continue;
    const outer = /paint|glass|chrome|lamp|projector/i.test(material);
    const target = Math.max(180, Math.floor(indices.length * (outer ? .35 : .14) / 3) * 3);
    const flags = outer ? ["Permissive","ErrorAbsolute"] : ["Permissive","Prune","ErrorAbsolute"];
    const [reduced] = MeshoptSimplifier.simplifyWithAttributes(indices, position.getArray(), 3,
      normal.getArray(), 3, [.14,.14,.14], null, target, outer ? .0024 : .009, flags);
    if (reduced.length < 9 || reduced.length >= indices.length) continue;
    const [remap, count] = MeshoptSimplifier.compactMesh(reduced);
    const newIndex = doc.createAccessor().setType("SCALAR").setBuffer(index.getBuffer())
      .setArray(count <= 65535 ? Uint16Array.from(reduced) : reduced);
    primitive.setIndices(newIndex);
    for (const semantic of primitive.listSemantics()) {
      const attr = primitive.getAttribute(semantic);
      const source = attr.getArray();
      const size = attr.getElementSize();
      const packed = new source.constructor(count * size);
      for (let v = 0; v < remap.length; v++) {
        if (remap[v] >= count) continue;
        packed.set(source.subarray(v * size, (v + 1) * size), remap[v] * size);
      }
      primitive.setAttribute(semantic,doc.createAccessor().setType(attr.getType())
        .setBuffer(attr.getBuffer()).setNormalized(attr.getNormalized()).setArray(packed));
    }
  }
  await doc.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level:"medium" }));
  const after = count();
  for (const name of ["wheel_FL","wheel_FR","wheel_RL","wheel_RR","steering_wheel"]) {
    if (!root.listNodes().some(node => node.getName() === name)) throw new Error("Articulação ausente: " + name);
  }
  await io.write(output, doc);
  console.log(JSON.stringify({before, after, meshes:root.listMeshes().length, bytes:fs.statSync(output).size}));
}

prepare(process.argv[2], process.argv[3]).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
