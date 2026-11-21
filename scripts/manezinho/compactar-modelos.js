/* Consolida as faixas binárias de GLBs incorporados após substituir texturas. */
"use strict";
const fs = require("node:fs");

const meshopt = "EXT_meshopt_compression";
const align = size => Math.ceil(size / 4) * 4;

function packBufferViews(glb) {
  const jsonSize = glb.readUInt32LE(12);
  const binaryStart = 28 + jsonSize;
  if (glb.readUInt32LE(0) !== 0x46546c67 || glb.readUInt32LE(4) !== 2
      || glb.readUInt32LE(8) !== glb.length || glb.readUInt32LE(16) !== 0x4e4f534a
      || glb.readUInt32LE(binaryStart - 4) !== 0x004e4942
      || binaryStart + glb.readUInt32LE(binaryStart - 8) !== glb.length) {
    throw new Error("Contêiner GLB inválido ou com extensões de arquivo desconhecidas");
  }
  const model = JSON.parse(glb.toString("utf8", 20, 20 + jsonSize));
  const bytes = glb.subarray(binaryStart);
  const views = model.bufferViews;
  const ranges = new Map();
  const references = [];
  let length = 0;

  function move(range) {
    if (range.buffer !== 0 || model.buffers[0].uri) {
      throw new Error("O ativo usa dados binários externos");
    }
    const at = range.byteOffset ?? 0;
    const size = range.byteLength;
    if (!Number.isInteger(at) || at < 0 || !Number.isInteger(size) || size <= 0 || at + size > bytes.length) {
      throw new Error("Faixa binária inválida no ativo");
    }
    const key = at + "/" + size;
    if (!ranges.has(key)) {
      length = align(length);
      ranges.set(key, { at, size, destination: length });
      length += size;
    }
    range.byteOffset = ranges.get(key).destination;
  }

  function collectReferences(entry) {
    if (!entry || typeof entry !== "object") return;
    for (const [key, value] of Object.entries(entry)) {
      if (key === "bufferView" && Number.isInteger(value)) references.push([entry, value]);
      else if (key !== "bufferViews") collectReferences(value);
    }
  }

  collectReferences(model);
  const active = [...new Set(references.map(([, index]) => index))].sort((left, right) => left - right);
  const viewIndex = new Map(active.map((old, index) => [old, index]));
  model.bufferViews = active.map(index => {
    const view = views[index];
    const compressed = view.extensions?.[meshopt];
    if (view.buffer === 0) move(view);
    else if (!compressed || model.buffers[view.buffer].uri) throw new Error("Buffer externo ativo");
    if (compressed) move(compressed);
    return view;
  });
  for (const [parent, index] of references) parent.bufferView = viewIndex.get(index);
  model.buffers[0].byteLength = length;
  const json = Buffer.from(JSON.stringify(model));
  const binaryOffset = 28 + align(json.length);
  const output = Buffer.alloc(binaryOffset + align(length));
  glb.copy(output, 0, 0, 8);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(align(json.length), 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  output.fill(0x20, 20, binaryOffset - 8);
  json.copy(output, 20);
  output.writeUInt32LE(align(length), binaryOffset - 8);
  output.writeUInt32LE(0x004e4942, binaryOffset - 4);
  for (const { at, size, destination } of ranges.values()) {
    bytes.copy(output, binaryOffset + destination, at, at + size);
  }
  return output;
}

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output || input === output) {
  throw new Error("Informe o pacote de entrada e um caminho separado para o pacote compactado.");
}
const bundle = fs.readFileSync(input, "utf8");
let assets = 0;
const compacted = bundle.replace(/"([a-zA-Z0-9_-]+)"\s*:\s*"([A-Za-z0-9+/=]{200,})"/g, (entry, key, encoded) => {
  const packed = packBufferViews(Buffer.from(encoded, "base64")).toString("base64");
  assets++;
  if (packed.length >= encoded.length) return entry;
  return entry.replace(encoded, packed);
});
if (!assets) throw new Error("Nenhum modelo incorporado encontrado em " + input);
fs.writeFileSync(output, compacted);
console.log(JSON.stringify({ models: assets, bytesBefore: Buffer.byteLength(bundle), bytesAfter: Buffer.byteLength(compacted) }));