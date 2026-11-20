/* Asfalto e concreto CC0 combinados com a sinalização do mapa. */
window.MTASurfaces = (() => {
  "use strict";

  const decoded = new Map();

  async function load(payload) {
    await Promise.all(Object.entries(payload || {}).map(([name, url]) => new Promise(resolve => {
      const image = new Image();
      image.onload = () => { decoded.set(name, image); resolve(); };
      image.onerror = resolve;
      image.src = url;
    })));
  }

  function paintRoad(context, width, height) {
    const source = decoded.get("asphalt-color");
    if (!source) return;
    const side = width / 3;
    const length = height / 4;
    context.save();
    context.globalAlpha = .61;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 3; x++) {
        context.drawImage(source, x * side, y * length, Math.ceil(side), Math.ceil(length));
      }
    }
    context.globalAlpha = .30;
    context.fillStyle = "#252834";
    context.fillRect(0, 0, width, height);
    context.restore();
  }

  function terrain(base) {
    const material = decoded.get("fairway-grass-color");
    if (!material) return base;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(material, 0, 0, 512, 512);
    const image = context.getImageData(0, 0, 512, 512);
    const pixels = image.data;
    let total = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      total += pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722;
    }
    const average = total / (pixels.length / 4);
    for (let i = 0; i < pixels.length; i += 4) {
      const luminance = pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722;
      const shade = 217 + (luminance - average) * 1.16;
      pixels[i] = shade;
      pixels[i + 1] = shade;
      pixels[i + 2] = shade;
      pixels[i + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    context.globalAlpha = .24;
    context.drawImage(base, 0, 0, 512, 512);
    return canvas;
  }

  function textures(makeTexture, aniso) {
    const detail = name => {
      const image = decoded.get(name);
      if (!image) return null;
      const texture = makeTexture(image, { srgb: false, aniso });
      texture.channel = 1;
      return texture;
    };
    const paving = decoded.get("paving-slabs-color");
    const walk = paving ? makeTexture(paving, { aniso }) : null;
    if (walk) walk.repeat.set(2, 2);
    return {
      walk,
      roadRelief: detail("asphalt-normal"),
      walkRelief: detail("paving-slabs-normal"),
    };
  }

  function addDetailUV(geometry, Attribute, tileSize) {
    const position = geometry.getAttribute("position");
    const coordinates = new Float32Array(position.count * 2);
    for (let index = 0; index < position.count; index++) {
      coordinates[2 * index] = position.getX(index) / tileSize;
      coordinates[2 * index + 1] = position.getZ(index) / tileSize;
    }
    geometry.setAttribute("uv1", new Attribute(coordinates, 2));
  }

  function addCrosswalks(edges, builder, groundAt, junctionSize, paint) {
    for (const edge of edges) {
      if (!edge.urban || !edge.walk || edge.calcadao || edge.median || edge.bridge || edge.len < 29) continue;
      const sides = [[edge.a,1],[edge.b,-1]];
      for (const [junction,direction] of sides) {
        if (junction.edges.filter(street => street.urban || street.walk).length < 3) continue;
        const inset = Math.max(6.8,junctionSize(junction)+2);
        if (inset > edge.len*.38) continue;
        const center = direction > 0 ? inset : edge.len-inset;
        const x = edge.a.x+edge.dx*center, z = edge.a.z+edge.dz*center;
        const half = edge.w*.5;
        (edge.crosswalks ??= {})[-direction] = { center,x,z,dx:edge.dx,dz:edge.dz,half };
        const point = (along,across) => {
          const px=x+edge.dx*along-edge.dz*across, pz=z+edge.dz*along+edge.dx*across;
          return [px,groundAt(px,pz)+.142,pz];
        };
        for (let across=-half+.31; across+.55<half-.18; across+=1.03) {
          builder.quad(point(-1.52,across),point(-1.52,across+.55),
            point(1.52,across+.55),point(1.52,across),paint,
            [[0,0],[0,1],[1,1],[1,0]],[0,1,0]);
        }
      }
    }
  }

  function crossingIsClear(pedestrian, crossing, vehicles) {
    if (pedestrian.activeCrosswalk === crossing) return true;
    for (const car of vehicles) {
      if (car.isBoat || car.isHeli || car.isJet || Math.abs(car.pos.y-pedestrian.pos.y)>2.5) continue;
      const x=car.pos.x-crossing.x, z=car.pos.z-crossing.z;
      const across=Math.abs(z*crossing.dx-x*crossing.dz);
      if (across>crossing.half+car.t.Wd*.5) continue;
      const along=x*crossing.dx+z*crossing.dz;
      if (Math.abs(along)>54) continue;
      const alignment=Math.abs(Math.sin(car.yaw)*crossing.dx+Math.cos(car.yaw)*crossing.dz);
      if (alignment<.62) continue;
      const clearance=car.t.L*.5+1.7;
      if (Math.abs(along)<clearance) return false;
      const speed=car.vx*crossing.dx+car.vz*crossing.dz;
      if (along*speed<0 && (Math.abs(along)-clearance)/Math.abs(speed)<2.65) return false;
    }
    pedestrian.activeCrosswalk=crossing;
    return true;
  }

  function crossingSpeedLimit(car, pedestrian, forwardX, forwardZ) {
    const crossing=pedestrian.activeCrosswalk;
    if(!crossing || pedestrian.state!=="walk" || Math.abs(car.pos.y-pedestrian.pos.y)>2.5) return Infinity;
    const alignment=Math.abs(forwardX*crossing.dx+forwardZ*crossing.dz);
    if(alignment<.79) return Infinity;
    const x=crossing.x-car.pos.x,z=crossing.z-car.pos.z;
    const along=x*forwardX+z*forwardZ, across=Math.abs(z*forwardX-x*forwardZ);
    if(along<0 || along>44 || across>crossing.half+1.45) return Infinity;
    const distance=Math.max(0,along-car.t.L*.5-2.25);
    return Math.sqrt(7.2*distance);
  }

  return Object.freeze({ load, paintRoad, terrain, textures, addDetailUV, addCrosswalks, crossingIsClear, crossingSpeedLimit });
})();
