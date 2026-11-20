/* Grades originais para as carrocerias inspiradas em modelos reais. */
window.MTAFronts = (() => {
  "use strict";

  const layouts = {
    cruze: { width: .932, low: .225, high: .607 },
    camaro: { width: .73, low: .265, high: .548 },
    "camaro-ss": { width: .975, low: .202, high: .608 },
    compass: { width: .55, low: .425, high: .665 },
    raptor: { width: .74, low: .365, high: .65 },
    ranger: { width: .66, low: .365, high: .62 },
  };
  const materials = new Map();
  const meshes = new Map();

  function makeMaterial(style, tools) {
    if (materials.has(style)) return materials.get(style);
    const canvas = document.createElement("canvas");
    canvas.width = 384;
    canvas.height = 192;
    const context = canvas.getContext("2d");
    context.scale(384, 192);

    function polygon(points) {
      context.beginPath();
      context.moveTo(...points[0]);
      for (const point of points.slice(1)) context.lineTo(...point);
      context.closePath();
    }
    function grille(points, chrome, horizontal) {
      const border = context.createLinearGradient(0, .01, 0, .95);
      border.addColorStop(0, chrome ? "#b4b8bb" : "#555b60");
      border.addColorStop(.45, chrome ? "#767d80" : "#32383d");
      border.addColorStop(1, "#262a2f");
      polygon(points);
      context.fillStyle = "#191c20";
      context.fill();
      context.save();
      context.clip();
      context.fillStyle = horizontal ? "#32373d" : "#242930";
      for (let row = 0; row < 22; row++) {
        const y = row / 22;
        if (horizontal) context.fillRect(0, y, 1, .010);
        else for (let column = 0; column < 35; column++) {
          context.fillRect((column + .47 * (row % 2)) / 35, y, .012, .014);
        }
      }
      context.restore();
      polygon(points);
      context.strokeStyle = border;
      context.lineWidth = chrome ? .014 : .009;
      context.stroke();
    }

    if (style === "cruze") {
      grille([[.239,.211],[.761,.211],[.71,.351],[.29,.351]],true,false);
      grille([[.229,.423],[.771,.423],[.71,.701],[.29,.701]],true,false);
      grille([[.314,.802],[.686,.802],[.659,.900],[.341,.900]],false,true);
      for (const sign of [-1, 1]) {
        const mirrored = points => points.map(([x,y]) => [.5 + sign * x,y]);
        const seam = mirrored([[.308,.578],[.422,.527],[.424,.744],[.329,.784],[.292,.71]]);
        polygon(seam);
        context.fillStyle = "#25262a";
        context.fill();
        const reflector = mirrored([[.314,.685],[.402,.654],[.402,.684],[.32,.726]]);
        polygon(reflector);
        context.fillStyle = "#858680";
        context.fill();
        const lens = mirrored([[.253,.216],[.384,.13],[.467,.09],[.464,.243],[.425,.368],[.313,.407],[.272,.356]]);
        const gradient = context.createLinearGradient(0,.13,0,.42);
        gradient.addColorStop(0,"#2b3139");
        gradient.addColorStop(.40,"#adb7b8");
        gradient.addColorStop(.67,"#555963");
        gradient.addColorStop(1,"#949598");
        polygon(lens);
        context.fillStyle = gradient;
        context.fill();
        context.strokeStyle = "#242630";
        context.lineWidth = .0075;
        context.stroke();
        const x = .5 + .345 * sign;
        const beam = context.createRadialGradient(x,.278,.007,x,.278,.055);
        beam.addColorStop(0,"#fbf9ea");
        beam.addColorStop(.43,"#dadcda");
        beam.addColorStop(.65,"#898e8c");
        beam.addColorStop(1,"#3a4250");
        polygon(mirrored([[.29,.236],[.39,.212],[.402,.262],[.377,.33],[.306,.338],[.289,.302]]));
        context.fillStyle = beam;
        context.fill();
        polygon(mirrored([[.438,.197],[.463,.169],[.463,.237],[.443,.274]]));
        context.fillStyle = "#b27a38";
        context.fill();
      }
      polygon([[.447,.255],[.478,.255],[.478,.214],[.522,.214],[.522,.255],[.553,.255],
        [.553,.301],[.522,.301],[.522,.337],[.478,.337],[.478,.301],[.447,.301]]);
      context.fillStyle = "#bd963b";
      context.fill();
      context.strokeStyle = "#c5c4bf";
      context.lineWidth = .006;
      context.stroke();
    } else if (style === "compass") {
      for (let slot = 0; slot < 7; slot++) {
        const x = .064 + slot * .128;
        grille([[x,.105],[x+.092,.082],[x+.09,.843],[x+.008,.878]],true,true);
      }
    } else if (style === "camaro-ss") {
      grille([[.069,.224],[.475,.258],[.525,.258],[.931,.224],[.927,.453],[.74,.494],[.26,.494],[.073,.453]],false,true);
      grille([[.196,.606],[.804,.606],[.758,.795],[.242,.795]],false,true);
      polygon([[.071,.845],[.224,.805],[.764,.805],[.927,.845],[.869,.891],[.13,.891]]);
      context.fillStyle="#202024";
      context.fill();
      for (const side of [-1, 1]) {
        const mirror = points => points.map(([x,y]) => [.5+x*side,y]);
        polygon(mirror([[.292,.579],[.424,.533],[.439,.726],[.321,.755]]));
        context.fillStyle="#28282c";
        context.fill();
        const x = .5 + .371 * side;
        const lens = context.createRadialGradient(x,.337,.014,x,.337,.059);
        lens.addColorStop(0,"#1a2027");
        lens.addColorStop(.58,"#4d575e");
        lens.addColorStop(.70,"#a8b2b8");
        lens.addColorStop(.84,"#565f65");
        lens.addColorStop(1,"#171a1d");
        polygon(mirror([[.272,.289],[.402,.256],[.405,.412],[.367,.44],[.268,.424]]));
        context.fillStyle=lens;
        context.fill();
        const fog=context.createRadialGradient(x,.646,.010,x,.646,.040);
        fog.addColorStop(0,"#a3a3a0");
        fog.addColorStop(.64,"#777875");
        fog.addColorStop(.76,"#303439");
        fog.addColorStop(1,"#222427");
        context.fillStyle=fog;
        context.beginPath();
        context.ellipse(x,.646,.044,.070,0,0,Math.PI*2);
        context.fill();
      }
      polygon([[.451,.344],[.478,.344],[.478,.318],[.522,.318],[.522,.344],[.549,.344],
        [.541,.381],[.522,.381],[.522,.406],[.478,.406],[.478,.381],[.459,.381]]);
      context.fillStyle="#b59041";
      context.fill();
      context.strokeStyle="#b4ada1";
      context.lineWidth=.006;
      context.stroke();
    } else if (style === "camaro") {
      grille([[.055,.11],[.945,.11],[.908,.37],[.092,.37]],false,true);
      grille([[.112,.49],[.888,.49],[.82,.89],[.18,.89]],false,true);
    } else {
      grille([[.065,.115],[.935,.115],[.9,.77],[.1,.81]],false,true);
      const y = style === "raptor" ? .39 : .44;
      context.fillStyle = "#686e72";
      context.fillRect(.122, y, .756, .08);
      context.fillStyle = "#6e7377";
      context.fillRect(.21, .15, .58, .025);
    }

    const material = new tools.Material({
      map: tools.makeTexture(canvas, { repeat: false, aniso: 4 }),
      roughness: .72, metalness: .10,
      transparent: true, alphaTest: .24, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });
    materials.set(style, material);
    return material;
  }

  function project(original, car, layout, tools, direction = 1) {
    const side = typeof layout.sideCenter === "number";
    const columns = layout.columns ?? 22;
    const rows = 10;
    const stride = columns + 1;
    const count = stride * (rows + 1);
    const grid = new Float32Array(count).fill(-Infinity);
    const width = (side ? car.L : car.Wd) * layout.width;
    const offset = layout.sideCenter ?? 0;
    const depthThreshold = side ? car.Wd * .30 : car.L * .33;
    const bottom = car.H * layout.low;
    const rise = car.H * (layout.high - layout.low);
    const point = new tools.Vector();
    original.updateWorldMatrix(true, true);

    original.traverse(mesh => {
      if (!mesh.isMesh || !mesh.visible || /glass|mirror|lamp|plate/i.test(mesh.material?.name || "")) return;
      for (let node = mesh; node && node !== original; node = node.parent) {
        if (/^(wheel|steer)_/i.test(node.name)) return;
      }
      const source = mesh.geometry.getAttribute("position");
      const index = mesh.geometry.getIndex();
      const transformed = new Float32Array(source.count * 3);
      for (let i = 0; i < source.count; i++) {
        point.fromBufferAttribute(source, i).applyMatrix4(mesh.matrixWorld);
        transformed[i * 3] = (((side ? point.z : point.x) - offset) / width + .5) * columns;
        transformed[i * 3 + 1] = (point.y - bottom) / rise * rows;
        transformed[i * 3 + 2] = (side ? point.x : point.z) * direction;
      }
      const vertices = index?.count ?? source.count;
      for (let i = 0; i + 2 < vertices; i += 3) {
        const a = (index ? index.getX(i) : i) * 3;
        const b = (index ? index.getX(i + 1) : i + 1) * 3;
        const c = (index ? index.getX(i + 2) : i + 2) * 3;
        const az = transformed[a + 2], bz = transformed[b + 2], cz = transformed[c + 2];
        if (Math.max(az, bz, cz) < depthThreshold) continue;
        const ax = transformed[a], ay = transformed[a + 1];
        const bx = transformed[b], by = transformed[b + 1];
        const cx = transformed[c], cy = transformed[c + 1];
        const x0 = Math.max(0, Math.ceil(Math.min(ax, bx, cx)));
        const x1 = Math.min(columns, Math.floor(Math.max(ax, bx, cx)));
        const y0 = Math.max(0, Math.ceil(Math.min(ay, by, cy)));
        const y1 = Math.min(rows, Math.floor(Math.max(ay, by, cy)));
        if (x1 < x0 || y1 < y0) continue;
        const determinant = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
        if (Math.abs(determinant) < .00001) continue;
        for (let row = y0; row <= y1; row++) {
          for (let column = x0; column <= x1; column++) {
            const u = ((by - cy) * (column - cx) + (cx - bx) * (row - cy)) / determinant;
            const v = ((cy - ay) * (column - cx) + (ax - cx) * (row - cy)) / determinant;
            const w = 1 - u - v;
            if (Math.min(u, v, w) < -.0001) continue;
            const distance = u * az + v * bz + w * cz;
            const sample = row * stride + column;
            if (distance > depthThreshold - .038 && distance > grid[sample]) grid[sample] = distance;
          }
        }
      }
    });

    const pos = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);
    const faces = [];
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= columns; col++) {
        const i = row * stride + col;
        const u = col / columns, v = row / rows;
        const along = (u - .5) * width + offset;
        const height = bottom + v * rise;
        const depth = Number.isFinite(grid[i]) ? (grid[i] + (side ? .0055 : .009)) * direction : 0;
        pos.set(side ? [depth,height,along] : [along,height,depth], i * 3);
        uv.set([u, v], i * 2);
      }
    }
    const addFace = (a,b,c) => {
      const depth = [grid[a], grid[b], grid[c]];
      if (depth.every(Number.isFinite) && Math.max(...depth) - Math.min(...depth) < .15) {
        if (direction === (side ? -1 : 1)) faces.push(a,b,c);
        else faces.push(a,c,b);
      }
    };
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const i = row * stride + col;
        addFace(i,i+1,i+stride);
        addFace(i+1,i+stride+1,i+stride);
      }
    }
    if (!faces.length) return null;
    const geometry = new tools.Geometry();
    geometry.setAttribute("position", new tools.Attribute(pos, 3));
    geometry.setAttribute("uv", new tools.Attribute(uv, 2));
    geometry.setIndex(faces);
    geometry.computeVertexNormals();
    return geometry;
  }

  function mount(key, car, original, tools) {
    const style = key === "camaro_ss" ? "camaro-ss" : car.customBody?.design;
    const layout = layouts[style];
    if (!layout) return null;
    if (!meshes.has(key)) meshes.set(key, project(original, car, layout, tools));
    const geometry = meshes.get(key);
    if (!geometry) return null;
    const grille = new tools.Mesh(geometry, makeMaterial(style, tools));
    grille.name = "grade-" + style;
    grille.renderOrder = 2;
    grille.receiveShadow = true;
    return grille;
  }

  function mountCamaroSides(key, car, original, tools) {
    if (key !== "camaro_ss") return [];
    const name = "camaro-ss-laterais";
    const layout = { width: .50, low: .36, high: .69, sideCenter: -.30, columns: 24 };
    if (!materials.has(name)) {
      const canvas=document.createElement("canvas");
      canvas.width=384;
      canvas.height=160;
      const ctx=canvas.getContext("2d");
      ctx.scale(384,160);
      function stroke(points, color, width) {
        ctx.beginPath();
        points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
        ctx.strokeStyle=color;
        ctx.lineWidth=width;
        ctx.lineCap="round";
        ctx.stroke();
      }
      stroke([[.40,.03],[.38,.192],[.367,.49],[.362,.80],[.400,.881],[.838,.875],[.883,.82],[.898,.393],[.904,.035]],"#2f211a",.006);
      stroke([[.446,.161],[.502,.158],[.526,.181],[.494,.199],[.446,.194],[.432,.177],[.446,.161]],"#39271b",.015);
      stroke([[.446,.167],[.511,.169]],"#b3966d",.007);
      for (const x of [.098,.128,.158]) {
        stroke([[x+.012,.339],[x+.008,.442],[x,.556]],"#5b3e26",.009);
        stroke([[x+.022,.342],[x+.018,.448],[x+.010,.555]],"#d4b284",.004);
      }
      materials.set(name, new tools.Material({
        map:tools.makeTexture(canvas,{repeat:false,aniso:4}),roughness:.58,metalness:.07,
        transparent:true,alphaTest:.22,depthWrite:false,
        polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
      }));
    }
    return [-1,1].flatMap(direction => {
      const key2=name+direction;
      if(!meshes.has(key2))meshes.set(key2, project(original,car,layout,tools,direction));
      const shape=meshes.get(key2);
      if(!shape)return [];
      const part=new tools.Mesh(shape, materials.get(name));
      part.name=name;
      part.renderOrder=2;
      return [part];
    });
  }

  function mountCamaroTail(key, car, original, tools) {
    if (key !== "camaro_ss") return null;
    const cacheKey = key + "-traseira";
    if (!meshes.has(cacheKey)) {
      meshes.set(cacheKey, project(original, car, { width: .94, low: .38, high: .58 }, tools, -1));
    }
    const geometry = meshes.get(cacheKey);
    if (!geometry) return null;
    if (!materials.has(cacheKey)) {
      const canvas = document.createElement("canvas");
      canvas.width = 384;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      const fill = ctx.createLinearGradient(0, 18, 0, 97);
      fill.addColorStop(0, "#d7474e");
      fill.addColorStop(.32, "#9e1b2e");
      fill.addColorStop(.67, "#691320");
      fill.addColorStop(1, "#bf283f");
      for (const left of [19, 101, 205, 287]) {
        ctx.fillStyle = "#281820";
        ctx.fillRect(left, 22, 76, 67);
        ctx.fillStyle = fill;
        ctx.fillRect(left + 4, 26, 68, 59);
        ctx.fillStyle = "#8d2331";
        ctx.fillRect(left + 7, 54, 62, 3);
      }
      const map = tools.makeTexture(canvas, { repeat: false, aniso: 4 });
      materials.set(cacheKey, new tools.Material({
        map, emissiveMap: map, roughness: .53, metalness: .03,
        emissive: 0xffffff, emissiveIntensity: .12,
        transparent: true, alphaTest: .25, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      }));
    }
    const lamp = new tools.Mesh(geometry, materials.get(cacheKey).clone());
    lamp.name = "lanternas-camaro";
    lamp.renderOrder = 2;
    return lamp;
  }

  return Object.freeze({ mount, mountCamaroSides, mountCamaroTail });
})();
