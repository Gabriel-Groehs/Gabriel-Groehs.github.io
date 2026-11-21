/* Adapta o Camaro CC0 de sshiiden ao formato de rodas articuladas do Manezinho TA. */
"use strict";

const fs = require("node:fs");
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Uso: node preparar-camaro.js origem.glb destino.glb");

const file = fs.readFileSync(input);
if (file.toString("ascii", 0, 4) !== "glTF" || file.readUInt32LE(4) !== 2) {
  throw new Error("A entrada precisa ser um GLB 2.0.");
}
const jsonSize = file.readUInt32LE(12);
const model = JSON.parse(file.toString("utf8", 20, 20 + jsonSize));
const binary = file.subarray(28 + jsonSize);
const wheelNode = model.nodes.find(node => node.name === "Wheels");
if (!wheelNode || model.buffers.length !== 1) throw new Error("Malha combinada das rodas ausente.");

const WIDTH = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const WIDTH_BYTES = { 5123: 2, 5125: 4, 5126: 4 };
const chunks = [{ data: binary, offset: 0 }];
let cursor = binary.length;

function readAccessor(id) {
  const accessor = model.accessors[id];
  const view = model.bufferViews[accessor.bufferView];
  const width = WIDTH[accessor.type];
  const size = WIDTH_BYTES[accessor.componentType];
  if (!width || !size || accessor.sparse) throw new Error("Dados de roda em formato inesperado.");
  const stride = view.byteStride ?? width * size;
  const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const values = new Array(accessor.count * width);
  const read = accessor.componentType === 5126 ? "readFloatLE"
    : accessor.componentType === 5125 ? "readUInt32LE" : "readUInt16LE";
  for (let vertex = 0; vertex < accessor.count; vertex++) {
    for (let component = 0; component < width; component++) {
      values[vertex * width + component] = binary[read](offset + vertex * stride + component * size);
    }
  }
  return { values, width, type: accessor.type, componentType: accessor.componentType };
}

function addAccessor(data, type, componentType, target, min, max) {
  const bytes = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  cursor = Math.ceil(cursor / 4) * 4;
  const view = model.bufferViews.push({ buffer: 0, byteOffset: cursor, byteLength: bytes.length, target }) - 1;
  chunks.push({ data: bytes, offset: cursor });
  cursor += bytes.length;
  return model.accessors.push({
    bufferView: view, componentType, count: data.length / WIDTH[type], type,
    ...(min && max ? { min, max } : {}),
  }) - 1;
}

const wheelParts = model.meshes[wheelNode.mesh].primitives.map(primitive => ({
  material: primitive.material,
  attributes: Object.fromEntries(Object.entries(primitive.attributes).map(([name, id]) => [name, readAccessor(id)])),
  indices: readAccessor(primitive.indices).values,
}));
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
const tire = wheelParts.find(part => model.materials[part.material].name === "Tire");
if (!tire) throw new Error("Material de borracha ausente.");
const tires = tire.attributes.POSITION.values;
for (let offset = 0; offset < tires.length; offset += 3) {
  for (let axis = 0; axis < 3; axis++) {
    min[axis] = Math.min(min[axis], tires[offset + axis]);
    max[axis] = Math.max(max[axis], tires[offset + axis]);
  }
}
const center = min.map((value, axis) => (value + max[axis]) * .5);

function insideWheel(x, z, left, front) {
  return (x >= center[0]) === left && (z >= center[2]) === front;
}

function buildWheel(label, side, axle) {
  const lower = [Infinity, Infinity, Infinity];
  const upper = [-Infinity, -Infinity, -Infinity];
  for (let offset = 0; offset < tires.length; offset += 3) {
    if (!insideWheel(tires[offset], tires[offset + 2], side, axle)) continue;
    for (let axis = 0; axis < 3; axis++) {
      lower[axis] = Math.min(lower[axis], tires[offset + axis]);
      upper[axis] = Math.max(upper[axis], tires[offset + axis]);
    }
  }
  if (!lower.every(Number.isFinite)) throw new Error("Pneu ausente " + label);
  const pivot = lower.map((value, axis) => (value + upper[axis]) * .5);
  const parts = [];

  for (const original of wheelParts) {
    const positions = original.attributes.POSITION.values;
    const selected = [];
    const separate = new Map();
    const elements = [];
    for (let offset = 0; offset < original.indices.length; offset += 3) {
      const vertices = original.indices.slice(offset, offset + 3);
      const x = vertices.reduce((sum, v) => sum + positions[v * 3], 0) / 3;
      const z = vertices.reduce((sum, v) => sum + positions[v * 3 + 2], 0) / 3;
      if (!insideWheel(x, z, side, axle)) continue;
      for (const vertex of vertices) {
        if (!separate.has(vertex)) {
          separate.set(vertex, selected.length);
          selected.push(vertex);
        }
        elements.push(separate.get(vertex));
      }
    }
    if (!elements.length) continue;
    const indices = addAccessor(Uint16Array.from(elements), "SCALAR", 5123, 34963);
    const attributes = {};
    for (const [name, attr] of Object.entries(original.attributes)) {
      const values = new Float32Array(selected.length * attr.width);
      const lower = [Infinity, Infinity, Infinity];
      const upper = [-Infinity, -Infinity, -Infinity];
      for (let vertex = 0; vertex < selected.length; vertex++) {
        for (let component = 0; component < attr.width; component++) {
          const value = attr.values[selected[vertex] * attr.width + component];
          const out = name === "POSITION" ? value - pivot[component] : value;
          values[vertex * attr.width + component] = out;
          if (name === "POSITION") {
            lower[component] = Math.min(lower[component], out);
            upper[component] = Math.max(upper[component], out);
          }
        }
      }
      attributes[name] = addAccessor(values, attr.type, 5126, 34962,
        name === "POSITION" ? lower : null, name === "POSITION" ? upper : null);
    }
    parts.push({ attributes, indices, material: original.material, mode: 4 });
  }

  const mesh = model.meshes.push({ name: "Roda " + label, primitives: parts }) - 1;
  return model.nodes.push({ name: "wheel_" + label, mesh, translation: pivot }) - 1;
}

wheelNode.children = [
  buildWheel("FL", true, true), buildWheel("FR", false, true),
  buildWheel("RL", true, false), buildWheel("RR", false, false),
];
delete wheelNode.mesh;
function smoothPaint() {
  const body = model.nodes.find(node => node.name === "CarBody");
  const paint = model.meshes[body.mesh].primitives.find(part => model.materials[part.material].name === "Base");
  if (!paint) return;
  const { values: point } = readAccessor(paint.attributes.POSITION);
  const { values: normals } = readAccessor(paint.attributes.NORMAL);
  const groups = new Map();
  for (let offset = 0; offset < point.length; offset += 3) {
    const key = point.slice(offset, offset + 3).map(value => Math.round(value * 10000)).join("/");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(offset);
  }
  const out = Float32Array.from(normals);
  for (const group of groups.values()) {
    for (const at of group) {
      const x = normals[at], y = normals[at + 1], z = normals[at + 2];
      const sum = [0, 0, 0];
      for (const nearby of group) {
        if (x * normals[nearby] + y * normals[nearby + 1] + z * normals[nearby + 2] < .55) continue;
        sum[0] += normals[nearby];
        sum[1] += normals[nearby + 1];
        sum[2] += normals[nearby + 2];
      }
      const length = Math.hypot(...sum);
      if (length > 0) out.set(sum.map(value => value / length), at);
    }
  }
  paint.attributes.NORMAL = addAccessor(out, "VEC3", 5126, 34962);
}

smoothPaint();
for (const material of model.materials) {
  if (material.name === "Base") {
    material.name = "paint_body";
    material.pbrMetallicRoughness.metallicFactor = .36;
    material.pbrMetallicRoughness.roughnessFactor = .28;
  } else if (material.name === "Light") {
    material.name = "light_front_body";
    material.emissiveFactor = [1, .92, .81];
    material.extensions.KHR_materials_emissive_strength.emissiveStrength = 1.18;
  } else if (material.name === "Glass") {
    material.name = "glass";
    material.alphaMode = "OPAQUE";
    delete material.extensions.KHR_materials_transmission;
    material.pbrMetallicRoughness.metallicFactor = .21;
    material.pbrMetallicRoughness.baseColorFactor = [.066,.087,.12,1];
  }
}

model.asset.copyright = "sshiiden, CC0 1.0, https://sshiiden.itch.io/lowpoly-camaro";
model.buffers[0].byteLength = Math.ceil(cursor / 4) * 4;
const json = Buffer.from(JSON.stringify(model), "utf8");
const jsonPadded = Math.ceil(json.length / 4) * 4;
const out = Buffer.alloc(28 + jsonPadded + model.buffers[0].byteLength);
out.write("glTF");
out.writeUInt32LE(2, 4);
out.writeUInt32LE(out.length, 8);
out.writeUInt32LE(jsonPadded, 12);
out.writeUInt32LE(0x4e4f534a, 16);
out.fill(32, 20, 20 + jsonPadded);
json.copy(out, 20);
out.writeUInt32LE(model.buffers[0].byteLength, 20 + jsonPadded);
out.writeUInt32LE(0x004e4942, 24 + jsonPadded);
for (const chunk of chunks) chunk.data.copy(out, 28 + jsonPadded + chunk.offset);
fs.writeFileSync(output, out);
console.log("Quatro rodas articuladas. GLB de " + out.length + " bytes.");
