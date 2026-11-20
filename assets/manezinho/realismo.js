/* Manezinho TA — geometrias de rosto e mãos para personagens próximos. */
window.MTAPeople = (() => {
  "use strict";

  const cache = new WeakMap();
  const gauss = (d, radius) => Math.exp(-((d / radius) ** 2));
  const shade = (skin, value, warmth = 0) =>
    skin.map((channel, i) => Math.min(1, channel * value * (i === 0 ? 1 + warmth : 1 - warmth / 2)));

  function head(source, shape, mature) {
    let shapes = cache.get(source);
    if (!shapes) cache.set(source, shapes = new Map());
    const key = shape + Number(mature) * 3;
    if (shapes.has(key)) return shapes.get(key);
    const geometry = source.clone();
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      const jaw = Math.min(1, Math.max(0, (-y - .02) / .48));
      const front = Math.max(0, z * 2);
      const narrower = [.96, 1.01, 1.055][shape];
      const cheek = gauss(y + .035, .19) * gauss(Math.abs(x) - .30, .18);
      const socket = gauss(Math.abs(x) - .203, .12) * gauss(y - .115, .081);
      const nose = gauss(x, .107) * (gauss(y + .015, .15) * .126 + gauss(y - .117, .15) * .034);
      const lip = gauss(x, .18) * gauss(y + .23, .073) * .029;
      position.setXYZ(i, x * narrower * (1 - jaw * (mature ? .22 : .27)),
        y * 1.035, z + front * (cheek * .046 - socket * .081 + nose + lip));
    }
    geometry.computeVertexNormals();
    shapes.set(key, geometry);
    return geometry;
  }

  function addFace(out, appearance, tools) {
    const { sphere, faceSphere, matrix } = tools;
    const { skin, hair, iris, mature, shape, y, scale = 1 } = appearance;
    const base = head(faceSphere, shape, mature);
    const xScale = [.192, .197, .20][shape];
    const mixSkin = (v) => shade(skin,
      1 + .04 * gauss(v.y - y, .05) - .13 * gauss(v.y - (y - .09 * scale), .05),
      .04 * gauss(v.y - (y - .01 * scale), .045) * gauss(v.z - .10 * scale, .04));
    const feature = (x, dy, z, sx, sy, sz, arr, roll = 0) =>
      out.add(sphere, matrix(x * scale, y + dy * scale, z * scale,
        0, sx * scale, sy * scale, sz * scale, 0, roll), arr);

    out.add(base, matrix(0, y, 0, 0, xScale * scale, .236 * scale, .208 * scale), mixSkin);
    for (const side of [-1, 1]) {
      const x = side * .038;
      feature(side * .095, -.014, -.011, .024, .049, .032, skin, -side * .10);
      feature(side * .101, -.013, .001, .008, .026, .012, shade(skin, .59, .1));
      feature(x, .028, .088, .028, .012, .015, [.73, .70, .64], side * .05);
      feature(x, .027, .094, .011, .011, .008, iris);
      feature(x, .027, .098, .0045, .0047, .003, [.018, .016, .015]);
      feature(x, .034, .093, .031, .005, .009, shade(skin, .72), side * .07);
      feature(x, .051, .092, .033, .006, .010, shade(hair, .84), side * .11);
      feature(side * .011, -.019, .119, .008, .005, .008, shade(skin, .47, .1));
      if (mature) {
        feature(x + side * .021, .013, .088, .023, .0025, .005, shade(skin, .73, .067), -side * .27);
        feature(side * .03, -.046, .099, .007, .019, .006, shade(skin, .76, .06), -side * .42);
      }
    }
    feature(0, -.052, .102, .044, .0065, .012, shade(skin, .65, .24));
    feature(0, -.059, .100, .039, .005, .012, shade(skin, .89, .24));
  }

  function addHand(out, options, tools) {
    const { sphere, matrix } = tools;
    const { radius, skin, side } = options;
    const hand = (x, y, z, w, h, d, tilt = 0) => out.add(sphere,
      matrix(x * radius, y, z, 0, radius * w, radius * h, radius * d, 0, tilt), skin);
    hand(0, -.273, .012, 1.44, 1.51, .73);
    for (const [i, length] of [1.03, 1.20, 1.15, .85].entries()) {
      hand((i - 1.5) * .33, -.312 - length * .007, .017, .32, length, .38, (i - 1.5) * .06);
    }
    hand(-side * .72, -.291, .025, .47, 1.07, .47, -side * .44);
  }


  function shapeAnimalTorso(Sphere, broad) {
    const geometry = new Sphere(.5, 30, 20);
    const position = geometry.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      const z = position.getZ(i);
      const length = z + .5;
      const shoulder = gauss(length - .69, .24);
      const rump = gauss(length - .29, .29);
      const width = broad ? .48 + .11 * rump + .035 * shoulder : .285 + .068 * shoulder;
      const depth = broad ? .47 + .15 * rump + .10 * shoulder : .31 + .15 * shoulder;
      const center = broad ? .56 + .045 * shoulder : .59 + .032 * shoulder;
      position.setXYZ(i, position.getX(i) * width, center + position.getY(i) * depth,
        z * (broad ? 1.35 : 1.01) + (broad ? .02 : -.027));
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  function sculptLeg(Sphere, broad, length, lower=false) {
    const geometry = new Sphere(.5, 14, 14);
    const position = geometry.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      const y = position.getY(i);
      const down = .5 - y;
      const thigh = gauss(down-.28,.27);
      const taper = lower ? .82-.38*down : .61+.56*thigh;
      const profile = broad ? (lower?.126:.173) : (lower?.095:.137);
      const knee = gauss(down-.53,.31)*(lower?.010:.019);
      const top = lower ? .047 : .086;
      position.setXYZ(i,position.getX(i)*profile*taper,
        top-down*(length+top+.034),position.getZ(i)*profile*taper*1.15+knee);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  function sculptTail(Cylinder) {
    const geometry = new Cylinder(.009, .058, 1, 12, 13);
    const position = geometry.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      const t = position.getY(i) + .5;
      const radius = position.getZ(i);
      position.setXYZ(i, position.getX(i) + .14 * t * t,
        .631 + .272 * t ** 1.45 + radius * .87,
        -.340 - .399 * t + radius * .51);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  function coatMaterial(material) {
    material.onBeforeCompile = program => {
      program.vertexShader = "varying vec3 vMtaCoat;\n" + program.vertexShader
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvMtaCoat = position;");
      program.fragmentShader = `
varying vec3 vMtaCoat;
float mtaHairCell(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float mtaHairNoise(vec3 p) {
  vec3 cube = floor(p);
  vec3 phase = fract(p);
  phase = phase * phase * (3.0 - 2.0 * phase);
  float low = mix(mix(mtaHairCell(cube),mtaHairCell(cube+vec3(1,0,0)),phase.x),
                  mix(mtaHairCell(cube+vec3(0,1,0)),mtaHairCell(cube+vec3(1,1,0)),phase.x),phase.y);
  float high = mix(mix(mtaHairCell(cube+vec3(0,0,1)),mtaHairCell(cube+vec3(1,0,1)),phase.x),
                   mix(mtaHairCell(cube+vec3(0,1,1)),mtaHairCell(cube+vec3(1,1,1)),phase.x),phase.y);
  return mix(low,high,phase.z);
}
` + program.fragmentShader.replace("#include <color_fragment>", `
  #include <color_fragment>
  float mtaFurMask = smoothstep(0.036,0.12,max(max(diffuseColor.r,diffuseColor.g),diffuseColor.b));
  vec3 mtaHairPosition = vec3(vMtaCoat.x*123.0, (vMtaCoat.y+vMtaCoat.z*0.37)*116.0, vMtaCoat.z*28.0);
  float mtaHairDetail = 1.0 - smoothstep(0.32,0.94,length(fwidth(mtaHairPosition)));
  float mtaCoatGrain = mix(0.5,mtaHairNoise(mtaHairPosition),mtaHairDetail);
  float mtaDapples = mtaHairNoise(vMtaCoat * vec3(12.0,14.0,13.0));
  diffuseColor.rgb *= mix(1.0, 0.76 + 0.31*mtaCoatGrain + 0.20*mtaDapples,mtaFurMask);
`).replace("#include <emissivemap_fragment>", `
  #include <emissivemap_fragment>
  totalEmissiveRadiance += diffuseColor.rgb * 0.15;
`);
    };
    return material;
  }

  function buildAnimal(kind, tools) {
    const { Sphere, Cylinder, merge, colorize } = tools;
    const capybara = kind === "capybara";
    const fur = capybara ? 0x8a6141 : 0xbd7945;
    const dark = capybara ? 0x5b4130 : 0x714333;
    const pieces = [];
    let tail=null;
    function ellipsoid(out, location, scale, paint, pitch = 0, roll = 0) {
      const mesh = new Sphere(.5, 18, 12);
      mesh.scale(...scale).rotateX(pitch).rotateZ(roll).translate(...location);
      out.push(colorize(mesh, paint));
    }

    if (capybara) {
      pieces.push(colorize(shapeAnimalTorso(Sphere, true), fur));
      ellipsoid(pieces, [0, .667, .67], [.38, .43, .55], 0x93704e, -.13);
      ellipsoid(pieces, [0, .612, .895], [.306, .283, .335], 0x81694d);
      ellipsoid(pieces, [0, .678, .997], [.179, .082, .08], dark);
      ellipsoid(pieces, [0, .506, .889], [.258, .15, .273], 0x6d4d37);
      for (const s of [-1, 1]) {
        ellipsoid(pieces, [s * .134, .83, .582], [.108, .15, .075], dark, .10, -s * .23);
        ellipsoid(pieces, [s * .142, .834, .608], [.061, .097, .035], 0x9a7262, .08, -s * .23);
        ellipsoid(pieces, [s * .165, .728, .775], [.052, .037, .054], 0x292821);
        ellipsoid(pieces, [s * .184, .743, .789], [.012, .012, .012], 0xae9879);
      }
    } else {
      pieces.push(colorize(shapeAnimalTorso(Sphere, false), fur));
      ellipsoid(pieces, [0, .706, .386], [.227, .34, .33], fur, -.46);
      ellipsoid(pieces, [0, .797, .518], [.259, .279, .36], fur);
      ellipsoid(pieces, [0, .747, .692], [.176, .141, .25], 0xcc9b6d, .13);
      ellipsoid(pieces, [0, .781, .798], [.088, .064, .073], 0x272220);
      for (const s of [-1, 1]) {
        ellipsoid(pieces, [s * .113, .816, .473], [.084, .221, .104], dark, -.21, -s * .46);
        ellipsoid(pieces, [s * .096, .835, .606], [.049, .038, .046], 0x28231e);
        ellipsoid(pieces, [s * .115, .845, .622], [.011, .010, .011], 0xccb89c);
      }
      tail=colorize(sculptTail(Cylinder).translate(0,-.631,.340),fur);
    }

    const upper=capybara?.225:.234, lower=capybara?.217:.215;
    const limbs = [];
    ellipsoid(limbs,[0,.007,.026],[capybara?.137:.091,.080,.151],dark);
    const toe=capybara?.031:.022;
    for (const side of [-1,0,1]) {
      ellipsoid(limbs,[side*toe,-.006,.086],
        [toe*1.06,.036,capybara?.045:.037],dark,-.13);
    }
    const hips = capybara ? [[.141,.44,.33],[-.141,.44,.33],[.148,.44,-.32],[-.148,.44,-.32]]
      : [[.101,.45,.223],[-.101,.45,.223],[.098,.45,-.193],[-.098,.45,-.193]];
    return {
      body:merge(pieces), leg:colorize(sculptLeg(Sphere,capybara,upper),fur),
      shin:colorize(sculptLeg(Sphere,capybara,lower,true),fur), paw:merge(limbs),
      tail, hip:hips, upper, lower,
    };
  }

  function poseAnimalLimbs(kind, animal, index, ground, time, groundAt, root, local, result) {
    const dog=kind.key==="dog";
    const speed=animal.spd, size=kind.scale;
    const pace=Math.min(1,speed/(dog?1.24:.91));
    const trot=dog?Math.min(1,Math.max(0,(speed-1.34)/1.36)):0;
    const stance=dog?.65-.09*trot:.65;
    const stride=(dog?.195:.173)*pace*(1+.26*trot);
    const sinYaw=Math.sin(animal.yaw),cosYaw=Math.cos(animal.yaw);
    const up=kind.geo.upper,low=kind.geo.lower;
    for(let i=0;i<kind.geo.hip.length;i++){
      const [x,hipY,hipZ]=kind.geo.hip[i];
      const walkPhase=[0,.5,.74,.24][i];
      const trotPhase=[0,.5,.5,0][i];
      const advance=animal.ph/(2*Math.PI)+walkPhase+(trotPhase-walkPhase)*trot;
      const phase=advance-Math.floor(advance);
      const liftPhase=phase<stance?0:(phase-stance)/(1-stance);
      const reach=phase<stance?1-2*phase/stance:-1+2*liftPhase*liftPhase*(3-2*liftPhase);
      const dz=reach*stride;
      const wx=animal.x+(x*cosYaw+(hipZ+dz)*sinYaw)*size;
      const wz=animal.z+((hipZ+dz)*cosYaw-x*sinYaw)*size;
      const terrace=Math.max(-.098,Math.min(.103,(groundAt(wx,wz,ground+.74)-ground)/size));
      const footY=.049+terrace+Math.sin(Math.PI*liftPhase)**1.7*pace*(dog?.098:.068);
      const down=hipY-footY;
      const length=Math.hypot(down,dz)||.001;
      const dist=Math.min(up+low-.013,Math.max(Math.abs(up-low)+.018,length));
      const reachY=down/length,reachZ=dz/length;
      const advanceKnee=(up*up-low*low+dist*dist)/(2*dist);
      const bend=Math.sqrt(Math.max(0,up*up-advanceKnee*advanceKnee))*(i<2?-1:1);
      const kneeDown=reachY*advanceKnee-reachZ*bend;
      const kneeZ=reachZ*advanceKnee+reachY*bend;
      const shinDown=reachY*dist-kneeDown,shinZ=reachZ*dist-kneeZ;
      const joint=index*4+i;
      local.makeRotationX(Math.atan2(-kneeZ,kneeDown)).setPosition(x,hipY,hipZ);
      kind.legIM.setMatrixAt(joint,result.multiplyMatrices(root,local));
      local.makeRotationX(Math.atan2(-shinZ,shinDown)).setPosition(x,hipY-kneeDown,hipZ+kneeZ);
      kind.shinIM.setMatrixAt(joint,result.multiplyMatrices(root,local));
      const point=liftPhase===0?0:Math.sin(Math.PI*liftPhase)*-.32;
      local.makeRotationX(point).setPosition(x,hipY-reachY*dist,hipZ+reachZ*dist);
      kind.pawIM.setMatrixAt(joint,result.multiplyMatrices(root,local));
    }
    if(kind.tailIM){
      const wave=time*(animal.follow>0?8.8:4.7)+animal.home[0]*.051;
      const amplitude=animal.follow>0?.39:.13;
      local.makeRotationY(Math.sin(wave)*amplitude+(speed>2?.075:0)).setPosition(0,.631,-.340);
      kind.tailIM.setMatrixAt(index,result.multiplyMatrices(root,local));
    }
  }

  return Object.freeze({ addFace, addHand, buildAnimal, coatMaterial, poseAnimalLimbs });
})();
