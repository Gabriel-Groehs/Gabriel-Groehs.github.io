
/* Offline glTF preparation for the MakeHuman-derived adult cast. */
"use strict";
globalThis.optimizeManezinhoActor = async function optimizeManezinhoActor(binary, simplifier, options = {}) {


  const components = {
    5120: { Array: Int8Array, bytes: 1 },
    5121: { Array: Uint8Array, bytes: 1 },
    5122: { Array: Int16Array, bytes: 2 },
    5123: { Array: Uint16Array, bytes: 2 },
    5125: { Array: Uint32Array, bytes: 4 },
    5126: { Array: Float32Array, bytes: 4 },
  };
  const width = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const decoder = new TextDecoder();
  const raw = new Uint8Array(binary);
  const header = new DataView(binary);
  const jsonLength = header.getUint32(12, true);
  const model = JSON.parse(decoder.decode(raw.subarray(20, 20 + jsonLength)));
  const source = raw.subarray(28 + jsonLength);
  if (model.buffers.length !== 1 || model.extensionsRequired?.includes("EXT_meshopt_compression")) {
    throw new Error("A entrada precisa ser GLB com dados sem compactação por extensão.");
  }
  if (options.headCrop !== undefined) {
    const keep = new Set();
    for (const node of model.nodes) {
      if (!Number.isInteger(node.mesh)) continue;
      const mesh = model.meshes[node.mesh];
      const isWardrobe = part => {
        const name = model.materials[part.material].name.toLowerCase();
        return !name.includes("anatomical body") && !name.includes("hair roots") || name.includes("shoes");
      };
      if (mesh.primitives.every(isWardrobe)) {
        delete node.mesh;
      } else {
        keep.add(node.mesh);
      }
    }
    delete model.skins;
    delete model.animations;
    for (const node of model.nodes) delete node.skin;
    for (const mesh of model.meshes) for (const part of mesh.primitives) {
      delete part.attributes.JOINTS_0;
      delete part.attributes.WEIGHTS_0;
    }
    const remap = new Map();
    model.meshes = model.meshes.filter((_, index) => {
      if (!keep.has(index)) return false;
      remap.set(index, remap.size);
      return true;
    });
    for (const node of model.nodes) if (Number.isInteger(node.mesh)) node.mesh = remap.get(node.mesh);
    const materialRemap = new Map();
    for (const mesh of model.meshes) for (const part of mesh.primitives) {
      if (!materialRemap.has(part.material)) materialRemap.set(part.material, materialRemap.size);
      part.material = materialRemap.get(part.material);
    }
    model.materials = [...materialRemap.keys()].map(index => model.materials[index]);
    const texRemap = new Map();
    for (const material of model.materials) {
      for (const property of Object.values({...material, ...material.pbrMetallicRoughness})) {
        if (!Number.isInteger(property?.index)) continue;
        if (!texRemap.has(property.index)) texRemap.set(property.index, texRemap.size);
        property.index = texRemap.get(property.index);
      }
    }
    model.textures = [...texRemap.keys()].map(index => model.textures[index]);
    const imageRemap = new Map();
    for (const texture of model.textures) {
      if (!imageRemap.has(texture.source)) imageRemap.set(texture.source, imageRemap.size);
      texture.source = imageRemap.get(texture.source);
    }
    model.images = [...imageRemap.keys()].map(index => model.images[index]);
  }
  if (options.geometryOnly) {
    model.materials = model.materials.map(({ name, doubleSided }) => ({ name, doubleSided }));
    model.images = [];
    model.animations = [];
    delete model.textures;
    delete model.samplers;
  }
  if (options.clips && model.animations) {
    const allowed = new Set(options.clips);
    model.animations = model.animations.filter(clip => allowed.has(clip.name));
  }
  const relativeError = options.relativeError ?? .017;
  const ratio = options.ratio ?? .185;
  const maxTexture = options.maxTexture ?? 512;
  const metrics = { sourceBytes: raw.length, sourceTriangles: 0, triangles: 0, animationKeys: 0 };

  const nextData = new Map();
  const blobOf = index => {
    const view = model.bufferViews[index];
    return nextData.get(index) ?? source.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
  };

  function read(id) {
    const info = model.accessors[id];
    if (info.sparse) throw new Error("Acessório esparso não é aceito nesta conversão.");
    const view = model.bufferViews[info.bufferView];
    const type = components[info.componentType];
    const n = width[info.type];
    const stride = view.byteStride ?? n * type.bytes;
    const offset = info.byteOffset ?? 0;
    const data = blobOf(info.bufferView);
    const size = info.count * n;
    if (stride === n * type.bytes && (data.byteOffset + offset) % type.bytes === 0) {
      return new type.Array(data.buffer, data.byteOffset + offset, size);
    }
    const result = new type.Array(size);
    const bytes = new Uint8Array(result.buffer);
    for (let i = 0; i < info.count; i++) {
      const start = i * stride + offset;
      bytes.set(data.subarray(start, start + n * type.bytes), i * n * type.bytes);
    }
    return result;
  }

  function view(data, target) {
    const index = model.bufferViews.length;
    model.bufferViews.push(target ? { buffer: 0, byteLength: data.byteLength, target }
      : { buffer: 0, byteLength: data.byteLength });
    nextData.set(index, new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    return index;
  }

  function accessor(data, template, target, bounds = false) {
    const n = width[template.type];
    const next = { bufferView: view(data, target), componentType: template.componentType,
      count: data.length / n, type: template.type };
    if (template.normalized) next.normalized = true;
    if (bounds) {
      const lo = Array(n).fill(Infinity), hi = Array(n).fill(-Infinity);
      for (let i = 0; i < data.length; i++) {
        const k = i % n;
        lo[k] = Math.min(lo[k], data[i]);
        hi[k] = Math.max(hi[k], data[i]);
      }
      next.min = lo;
      next.max = hi;
    }
    return model.accessors.push(next) - 1;
  }

  for (const mesh of model.meshes) for (const primitive of mesh.primitives) {
    if ((primitive.mode ?? 4) !== 4 || primitive.indices === undefined || primitive.targets) {
      throw new Error("A malha precisa usar triângulos indexados sem morph targets.");
    }
    let original = Uint32Array.from(read(primitive.indices));
    const positions = read(primitive.attributes.POSITION);
    const name = model.materials[primitive.material].name;
    if (options.headCrop !== undefined && /anatomical body.body$/i.test(name)) {
      const face = [];
      for (let i = 0; i < original.length; i += 3) {
        const a = original[i], b = original[i + 1], c = original[i + 2];
        if (Math.min(positions[a * 3 + 1], positions[b * 3 + 1], positions[c * 3 + 1]) >= options.headCrop) {
          face.push(a, b, c);
        }
      }
      original = Uint32Array.from(face);
    }
    const target = Math.max(84, 3 * Math.floor(original.length * ratio / 3));
    metrics.sourceTriangles += original.length / 3;
    let reduced = original;
    if (original.length > target) {
      const normals = primitive.attributes.NORMAL === undefined ? null : read(primitive.attributes.NORMAL);
      const uv = primitive.attributes.TEXCOORD_0 === undefined ? null : read(primitive.attributes.TEXCOORD_0);
      if (normals && uv) {
        const count = positions.length / 3;
        const attributes = new Float32Array(count * 5);
        for (let i = 0; i < count; i++) {
          attributes.set(normals.subarray(i * 3, i * 3 + 3), i * 5);
          attributes.set(uv.subarray(i * 2, i * 2 + 2), i * 5 + 3);
        }
        [reduced] = simplifier.simplifyWithAttributes(original, positions, 3, attributes, 5,
          [.12, .12, .12, .25, .25], null, target, relativeError, ["RegularizeLight"]);
      } else {
        [reduced] = simplifier.simplify(original, positions, 3, target, relativeError);
      }
      if (reduced.length < 3) reduced = original;
    }
    metrics.triangles += reduced.length / 3;
    const reindex = new Int32Array(positions.length / 3).fill(-1);
    const referenced = [];
    const indices = reduced.map(index => {
      if (reindex[index] === -1) {
        reindex[index] = referenced.length;
        referenced.push(index);
      }
      return reindex[index];
    });
    const short = referenced.length <= 65536;
    primitive.indices = accessor(short ? Uint16Array.from(indices) : indices,
      { componentType: short ? 5123 : 5125, type: "SCALAR" }, 34963);
    for (const [name, id] of Object.entries(primitive.attributes)) {
      const template = model.accessors[id];
      const originalAttribute = read(id);
      const channels = width[template.type];
      const compact = new originalAttribute.constructor(referenced.length * channels);
      for (let i = 0; i < referenced.length; i++) {
        const start = referenced[i] * channels;
        compact.set(originalAttribute.subarray(start, start + channels), i * channels);
      }
      primitive.attributes[name] = accessor(compact, template, 34962, name === "POSITION");
    }
  }

  for (const clip of model.animations ?? []) {
    const inputCache = new Map();
    for (const sample of clip.samplers) {
      const start = read(sample.input);
      const values = read(sample.output);
      const template = model.accessors[sample.output];
      const n = width[template.type];
      const spline = sample.interpolation === "CUBICSPLINE";
      if (start.length < 3 || values.length !== start.length * n * (spline ? 3 : 1)) continue;
      const stride = start.length > 150 ? 3 : 2;
      const keyframes = [];
      for (let i = 0; i < start.length - 1; i += stride) keyframes.push(i);
      keyframes.push(start.length - 1);
      if (!inputCache.has(sample.input)) {
        inputCache.set(sample.input, accessor(Float32Array.from(keyframes, index => start[index]),
          { componentType: 5126, type: "SCALAR" }, undefined, true));
      }
      const keyValues = new Float32Array(keyframes.length * n);
      for (let i = 0; i < keyframes.length; i++) {
        const offset = (spline ? 3 * keyframes[i] + 1 : keyframes[i]) * n;
        keyValues.set(values.subarray(offset, offset + n), i * n);
      }
      sample.input = inputCache.get(sample.input);
      sample.output = accessor(keyValues, template);
      sample.interpolation = sample.interpolation === "STEP" ? "STEP" : "LINEAR";
      metrics.animationKeys += keyframes.length;
    }
  }

  const alphaTextures = new Set(
    model.materials.filter(material => material.alphaMode === "MASK" || material.alphaMode === "BLEND")
      .map(material => material.pbrMetallicRoughness?.baseColorTexture?.index)
      .filter(Number.isInteger).map(index => model.textures[index].source),
  );
  for (const [index, image] of model.images.entries()) {
    const b = new Blob([blobOf(image.bufferView)], {type:image.mimeType});
    const bitmap = await createImageBitmap(b, {premultiplyAlpha:"none",colorSpaceConversion:"none"});
    const canvas = document.createElement("canvas");
    const max = /teeth|eye|shoes/i.test(image.name ?? "") ? Math.min(256,maxTexture) : maxTexture;
    const scale = Math.min(1, max / Math.max(bitmap.width,bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const alpha = alphaTextures.has(index);
    canvas.getContext("2d", {alpha}).drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close();
    const optimized = await new Promise(resolve => canvas.toBlob(resolve, alpha ? "image/png" : "image/jpeg", .9));
    const pixels = new Uint8Array(await optimized.arrayBuffer());
    image.bufferView = view(pixels);
    image.mimeType = optimized.type;
  }

  const used = new Set();
  for (const mesh of model.meshes) for (const primitive of mesh.primitives) {
    used.add(primitive.indices);
    for (const index of Object.values(primitive.attributes)) used.add(index);
  }
  for (const skin of model.skins ?? []) if(skin.inverseBindMatrices !== undefined) used.add(skin.inverseBindMatrices);
  for (const clip of model.animations ?? []) for (const sample of clip.samplers) {
    used.add(sample.input);
    used.add(sample.output);
  }
  const indices = new Map();
  const accessors = [];
  for (const index of used) {
    indices.set(index,accessors.length);
    accessors.push(model.accessors[index]);
  }
  model.accessors = accessors;
  for (const mesh of model.meshes) for (const primitive of mesh.primitives) {
    primitive.indices = indices.get(primitive.indices);
    for (const name in primitive.attributes) primitive.attributes[name]=indices.get(primitive.attributes[name]);
  }
  for (const skin of model.skins ?? []) if(skin.inverseBindMatrices !== undefined) {
    skin.inverseBindMatrices = indices.get(skin.inverseBindMatrices);
  }
  for (const clip of model.animations ?? []) for (const sample of clip.samplers) {
    sample.input = indices.get(sample.input);
    sample.output = indices.get(sample.output);
  }

  const views = new Map();
  const activeViews = [];
  const blobs = [];
  const layouts = new Map();
  for (const data of model.accessors) {
    if (!layouts.has(data.bufferView)) layouts.set(data.bufferView, []);
    layouts.get(data.bufferView).push(data);
  }
  let size = 0;
  let fallbackSize = 0;
  let saved = 0;
  const extension = "EXT_meshopt_compression";
  for (const holder of [...model.accessors, ...model.images]) {
    const old = holder.bufferView;
    if (!views.has(old)) {
      const rawBytes = blobOf(old);
      const layout = layouts.get(old);
      const buffer = model.bufferViews[old];
      let bytes = rawBytes;
      size = Math.ceil(size / 4) * 4;
      const details = { ...buffer, byteOffset: size };

      if (options.encoder && layout?.length === 1 && rawBytes.byteLength >= 256) {
        const item = layout[0];
        const stride = width[item.type] * components[item.componentType].bytes;
        const triangles = buffer.target === 34963;
        if (item.count * stride === rawBytes.byteLength
            && (triangles ? item.count % 3 === 0 && (stride === 2 || stride === 4) : stride % 4 === 0)) {
          const mode = triangles ? "TRIANGLES" : "ATTRIBUTES";
          const compressed = options.encoder.encodeGltfBuffer(rawBytes, item.count, stride, mode);
          if (compressed.byteLength + 128 < rawBytes.byteLength) {
            bytes = compressed;
            fallbackSize = Math.ceil(fallbackSize / 4) * 4;
            details.buffer = 1;
            details.byteOffset = fallbackSize;
            details.extensions = { [extension]: {
              buffer: 0, byteOffset: size, byteLength: bytes.byteLength,
              byteStride: stride, count: item.count, mode,
            } };
            fallbackSize += rawBytes.byteLength;
            saved += rawBytes.byteLength - bytes.byteLength;
          }
        }
      }
      blobs.push({ bytes, offset: size });
      views.set(old, activeViews.length);
      activeViews.push(details);
      size += bytes.byteLength;
    }
    holder.bufferView = views.get(old);
  }
  model.bufferViews = activeViews;
  model.buffers[0].byteLength = size;
  if (saved) {
    model.extensionsRequired = [...(model.extensionsRequired || []), extension];
    model.extensionsUsed = [...(model.extensionsUsed || []), extension];
    model.buffers.push({ byteLength: fallbackSize, extensions: { [extension]: { fallback: true } } });
  }
  metrics.meshoptSaved = saved;
  const text = new TextEncoder().encode(JSON.stringify(model));
  const padded = Math.ceil(text.length/4)*4;
  const bLength = Math.ceil(size/4)*4;
  const result = new Uint8Array(28+padded+bLength);
  const headerOut = new DataView(result.buffer);
  result.set(raw.subarray(0,8),0);
  headerOut.setUint32(8,result.length,true);
  headerOut.setUint32(12,padded,true);
  headerOut.setUint32(16,0x4e4f534a,true);
  result.fill(32,20,20+padded);
  result.set(text,20);
  headerOut.setUint32(20+padded,bLength,true);
  headerOut.setUint32(24+padded,0x004e4942,true);
  for(const {bytes,offset} of blobs)result.set(bytes,28+padded+offset);
  return { binary:result, ...metrics, bytes:result.length };
};
