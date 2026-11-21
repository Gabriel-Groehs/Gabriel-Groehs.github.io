"use strict";

const fs = require("node:fs");
const { NodeIO } = require("@gltf-transform/core");
const { ALL_EXTENSIONS, KHRMaterialsClearcoat } = require("@gltf-transform/extensions");
const { dedup, prune, meshopt } = require("@gltf-transform/functions");
const { MeshoptEncoder, MeshoptDecoder } = require("meshoptimizer");

const zones = {
  bonnet_body: { label: "capo", bottom: .775, max: 2.9, min: .995, accepts: n=>n[1] > .03 },
  body: { label: "teto", bottom: 1.265, max: .72, min: -1.40, accepts: n=>n[1] > .20 },
  boot_body: { label: "porta-malas", bottom: .954, max: -1.805, min: -2.52,
    accepts: n=>n[1] > .09 || (n[2] < -.48 && n[1] > -.08) },
};

const bands = [-.345, -.075, .075, .345];
const semTypes = { POSITION:"VEC3", NORMAL:"VEC3", TEXCOORD_0:"VEC2" };
const tail = (a, b) => a.map((n,i) => b[i]-n);
const cross = ([x,y,z],[a,b,c]) => [y*c-z*b,z*a-x*c,x*b-y*a];

function worldPoint(m,[x,y,z]) {
  return [m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14]];
}

function interpolate(a,b,t) {
  const sample = (l,r) => l.map((v,i)=>v+(r[i]-v)*t);
  return { p:sample(a.p,b.p), attrib:a.attrib.map((arr,i)=>sample(arr,b.attrib[i])) };
}

function clip(points, axis, line, toward) {
  if (!points.length) return points;
  const result = [];
  let previous = points.at(-1);
  let distance = toward * (previous.p[axis]-line);
  for (const current of points) {
    const side = toward * (current.p[axis]-line);
    if ((distance>=0) !== (side>=0)) result.push(interpolate(previous,current,distance/(distance-side)));
    if (side>=0) result.push(current);
    previous=current;
    distance=side;
  }
  return result;
}

function newBatch(semantics) {
  const indices=[], values=semantics.map(()=>[]), seen=new Map();
  function add(vertex) {
    const key=vertex.attrib.flat().map(x=>Math.round(x*1000000)).join("/");
    if(!seen.has(key)) {
      seen.set(key,seen.size);
      vertex.attrib.forEach((data,i) => values[i].push(...data));
    }
    return seen.get(key);
  }
  function append(points) {
    for(let i=1;i<points.length-1;i++) {
      const [a,b,c]=[points[0],points[i],points[i+1]];
      if(Math.hypot(...cross(tail(a.p,b.p),tail(a.p,c.p)))<1e-9)continue;
      indices.push(add(a),add(b),add(c));
    }
  }
  return { indices, values, append, size:()=>seen.size };
}

function exportPrimitive(doc, batch, semantics, material, buffer) {
  const mesh = doc.createPrimitive().setMaterial(material);
  const IndexType = batch.size()>65535?Uint32Array:Uint16Array;
  mesh.setIndices(doc.createAccessor().setType("SCALAR").setBuffer(buffer).setArray(new IndexType(batch.indices)));
  semantics.forEach((name,i) => {
    mesh.setAttribute(name,doc.createAccessor().setType(semTypes[name]).setBuffer(buffer)
      .setArray(new Float32Array(batch.values[i])));
  });
  return mesh;
}

function applyStripes(doc, node, zone, stripe, buffer) {
  const model = node.getMesh();
  const coat = model.listPrimitives().find(primitive => primitive.getMaterial().getName() === "paint_body");
  if(!coat)throw new Error("A superfície não está separada: "+node.getName());
  const order=coat.getIndices().getArray();
  const semantics=coat.listSemantics();
  const matrix=node.getWorldMatrix();
  const position=semantics.indexOf("POSITION");
  const white=newBatch(semantics), graphite=newBatch(semantics);
  const vertices=Array.from({length:coat.getAttribute("POSITION").getCount()},(_,i)=>{
    const attrib=semantics.map(name=>coat.getAttribute(name).getElement(i,[]));
    return { p:worldPoint(matrix,attrib[position]),attrib };
  });
  const planes=[[1,zone.bottom,1],[2,zone.min,1],[2,zone.max,-1]];
  for(let i=0;i<order.length;i+=3) {
    const triangle=[vertices[order[i]], vertices[order[i+1]], vertices[order[i+2]]];
    const [a,b,c]=triangle.map(vertex=>vertex.p);
    const n=cross(tail(a,b),tail(a,c));
    const length=Math.hypot(...n);
    if(length<1e-10 || !zone.accepts(n.map(v=>v/length))) {
      white.append(triangle);
      continue;
    }
    let polygon=triangle;
    for(const [axis,line,direction] of planes) {
      white.append(clip(polygon,axis,line,-direction));
      polygon=clip(polygon,axis,line,direction);
    }
    for(let part=0;part<bands.length;part++) {
      (part%2===0?white:graphite).append(clip(polygon,0,bands[part],-1));
      polygon=clip(polygon,0,bands[part],1);
    }
    white.append(polygon);
  }
  if (!graphite.indices.length) throw new Error("Faixa ausente em "+zone.label);
  model.addPrimitive(exportPrimitive(doc,white,semantics,coat.getMaterial(),buffer));
  model.addPrimitive(exportPrimitive(doc,graphite,semantics,stripe,buffer));
  model.removePrimitive(coat);
  coat.dispose();
  return { panel:zone.label, stripeTriangles:graphite.indices.length/3, width:bands[1]-bands[0], gap:bands[2]-bands[1] };
}


const smooth = (lo,hi,n) => {
  const t=Math.max(0,Math.min(1,(n-lo)/(hi-lo)));
  return t*t*(3-2*t);
};
const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);

// Sculpt the ends without moving the wheel arches, the door cuts or the axle pivots.
function ends([x,y,z]) {
  const front=smooth(1.83,2.36,z);
  const rear=smooth(1.87,2.38,-z);
  const corner=smooth(.43,.875,Math.abs(x));
  const lower=1-smooth(.20,.64,y);
  const flared=smooth(.49,.86,Math.abs(x));
  return [
    x*(1-flared*(.011*front+.060*rear)*(lower+.40)),
    y+.016*lower*(front+rear),
    z-front*(.105*corner+.019*lower)+rear*(.183*corner+.053*lower),
  ];
}

function reshapeEnds(doc, root, buffer) {
  for(const node of root.listNodes()) {
    const mesh=node.getMesh();
    if(!mesh || /^(wheel_|caliper_|steering_)/.test(node.getName()))continue;
    const m=node.getWorldMatrix();
    const axes=[m.slice(0,3),m.slice(4,7),m.slice(8,11)];
    const cofactors=axes.map((_,i)=>cross(axes[(i+1)%3],axes[(i+2)%3]));
    const determinant=dot(axes[0],cofactors[0]);
    const toLocal=delta=>cofactors.map(axis=>dot(delta,axis)/determinant);
    for(const p of mesh.listPrimitives()) {
      const vertex=p.getAttribute("POSITION"), normal=p.getAttribute("NORMAL");
      if(!vertex || !normal)continue;
      const positions=new Float32Array(vertex.getCount()*3);
      const normals=new Float32Array(normal.getCount()*3);
      let changed=false;
      for(let i=0;i<vertex.getCount();i++) {
        const a=vertex.getElement(i,[]), n=normal.getElement(i,[]);
        const xyz=worldPoint(m,a), shaped=ends(xyz);
        const displacement=tail(xyz,shaped);
        const different=Math.abs(displacement[0])+Math.abs(displacement[1])+Math.abs(displacement[2])>1e-8;
        if(!different) {
          positions.set(a,i*3);
          normals.set(n,i*3);
          continue;
        }
        changed=true;
        positions.set(toLocal(displacement).map((v,k)=>v+a[k]),i*3);
        const jacobian=axes.map(axis=>toLocal(tail(shaped,ends(xyz.map((v,j)=>v+axis[j]*.0001)))).map(v=>v/.0001));
        const corrected=[0,0,0];
        jacobian.forEach((_,k)=>{
          const c=cross(jacobian[(k+1)%3],jacobian[(k+2)%3]);
          for(let j=0;j<3;j++)corrected[j]+=n[k]*c[j];
        });
        const size=Math.hypot(...corrected)||1;
        normals.set(corrected.map(v=>v/size),i*3);
      }
      if(!changed)continue;
      p.setAttribute("POSITION",doc.createAccessor().setType("VEC3").setBuffer(buffer).setArray(positions));
      p.setAttribute("NORMAL",doc.createAccessor().setType("VEC3").setBuffer(buffer).setArray(normals));
    }
  }
}

function splitByBox(points, planes) {
  let inside=points;
  const remainder=[];
  for(const [axis,line,dir] of planes) {
    const outside=clip(inside,axis,line,-dir);
    if(outside.length>=3)remainder.push(outside);
    inside=clip(inside,axis,line,dir);
  }
  return {inside,remainder};
}

function paintBumperShoulders(doc, shell, paint, buffer) {
  const bumper=shell.getMesh();
  const trim=bumper.listPrimitives().find(p=>/^trim_matte(_body)?$/.test(p.getMaterial().getName()));
  if(!trim || !paint)throw new Error("Materiais do para-choque ausentes");
  const index=trim.getIndices().getArray(), semantics=trim.listSemantics(), m=shell.getWorldMatrix();
  const position=semantics.indexOf("POSITION");
  const vertices=Array.from({length:trim.getAttribute("POSITION").getCount()},(_,i)=>{
    const attrib=semantics.map(name=>trim.getAttribute(name).getElement(i,[]));
    return { p:worldPoint(m,attrib[position]),attrib };
  });
  const white=newBatch(semantics), dark=newBatch(semantics);
  const regions=[
    { outer:[[2,-2.025,-1],[1,.277,1],[1,.60,-1]], recess:null },
    { outer:[[2,2.055,1],[1,.379,1],[1,.467,-1],[0,-.61,1],[0,.61,-1]], recess:null },
    ...[-1,1].map(side=>({
      outer:[[2,2.005,1],[1,.257,1],[1,.64,-1],[0,side*.51,side]],
      recess:[[0,side*.578,side],[0,side*.815,-side],[1,.319,1],[1,.462,-1]],
    })),
  ];
  for(let i=0;i<index.length;i+=3) {
    let rest=[[vertices[index[i]],vertices[index[i+1]],vertices[index[i+2]]]];
    for(const {outer,recess} of regions) {
      const next=[];
      for(const poly of rest) {
        const {inside,remainder}=splitByBox(poly,outer);
        next.push(...remainder);
        if(recess) {
          const fog=splitByBox(inside,recess);
          dark.append(fog.inside);
          fog.remainder.forEach(white.append);
        } else white.append(inside);
      }
      rest=next;
    }
    rest.forEach(dark.append);
  }
  if(!white.indices.length)return;
  bumper.addPrimitive(exportPrimitive(doc,white,semantics,paint,buffer));
  if(dark.indices.length)bumper.addPrimitive(exportPrimitive(doc,dark,semantics,trim.getMaterial(),buffer));
  bumper.removePrimitive(trim);
  trim.dispose();
}


function addReflectors(doc, root, buffer) {
  const scene=root.getDefaultScene()??root.listScenes()[0];
  const red=doc.createMaterial("lamp_red").setBaseColorFactor([.47,.019,.024,1])
    .setMetallicFactor(.09).setRoughnessFactor(.21).setEmissiveFactor([.34,.021,.014]);
  const gold=doc.createMaterial("emblema-ltz").setBaseColorFactor([.73,.42,.075,1])
    .setMetallicFactor(.69).setRoughnessFactor(.23);
  const fog=doc.createMaterial("lamp_front_fog").setBaseColorFactor([.68,.62,.48,1])
    .setMetallicFactor(.35).setRoughnessFactor(.18).setEmissiveFactor([.23,.17,.095]);
  const silver=doc.createMaterial("aro-optico").setBaseColorFactor([.38,.41,.445,1])
    .setMetallicFactor(.87).setRoughnessFactor(.23);
  const materialBatches=new Map();

  function triangle(mat,points,front) {
    if(!materialBatches.has(mat))materialBatches.set(mat,newBatch(["POSITION","NORMAL","TEXCOORD_0"]));
    const raw=cross(tail(points[0],points[1]),tail(points[0],points[2]));
    const length=Math.hypot(...raw)||1;
    if(raw[2]*front<0){points.reverse();for(let i=0;i<3;i++)raw[i]*=-1;}
    const normal=raw.map(n=>n/length);
    materialBatches.get(mat).append(points.map(p=>({p,attrib:[p,normal,[p[0]/2+.5,p[1]/1.475]]})));
  }
  const quad=(m,points,front)=>{triangle(m,points.slice(0,3),front);triangle(m,[points[0],points[2],points[3]],front)};


  function panelDepth(expression, sign) {
    const faces=[];
    for(const node of root.listNodes().filter(node=>expression.test(node.getName()))) {
      const world=node.getWorldMatrix();
      for(const p of node.getMesh()?.listPrimitives()??[]) {
        const position=p.getAttribute("POSITION"), ix=p.getIndices().getArray();
        const points=Array.from({length:position.getCount()},(_,j)=>worldPoint(world,position.getElement(j,[])));
        for(let j=0;j<ix.length;j+=3) {
          const [a,b,c]=[points[ix[j]],points[ix[j+1]],points[ix[j+2]]];
          if(Math.max(a[2]*sign,b[2]*sign,c[2]*sign)<1.92)continue;
          const denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
          if(Math.abs(denominator)<1e-8)continue;
          faces.push({a,b,c,denominator,loX:Math.min(a[0],b[0],c[0]),hiX:Math.max(a[0],b[0],c[0]),
            loY:Math.min(a[1],b[1],c[1]),hiY:Math.max(a[1],b[1],c[1])});
        }
      }
    }
    return (x,y,safe)=>{
      let depth=-Infinity;
      for(const {a,b,c,denominator,loX,hiX,loY,hiY} of faces) {
        if(x<loX || x>hiX || y<loY || y>hiY)continue;
        const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/denominator;
        const v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/denominator;
        const w=1-u-v;
        if(Math.min(u,v,w)<-1e-6)continue;
        depth=Math.max(depth,sign*(u*a[2]+v*b[2]+w*c[2]));
      }
      return Number.isFinite(depth)?depth*sign:safe;
    };
  }

  const bumperDepth=panelDepth(/^(body|grille_slats|grille_bars)$/,1);
  const rearDepth=panelDepth(/^(boot_body|taillamp_lens_[LR])$/,-1);
  const frontLensDepth=panelDepth(/^headlamp_lens_[LR]$/,1);
  // Coat and reflectors sit on the OEM-style surfaces, including their curved edges.
  function ring(x,y,rX,rY,inner,material,height,front,zAt) {
    const at=(angle,scale,d)=>{
      const px=x+rX*Math.cos(angle)*scale, py=y+rY*Math.sin(angle)*scale;
      return [px,py,zAt(px,py)+d*front];
    };
    for(let j=0;j<30;j++) {
      const s=j*2*Math.PI/30,t=(j+1)*2*Math.PI/30;
      if(inner===0)triangle(material,[at(0,0,height+.004),at(s,1,height),at(t,1,height)],front);
      else quad(material,[at(s,1,height),at(t,1,height),at(t,inner,height+.002),at(s,inner,height+.002)],front);
    }
  }

  const tailFace=(x,y)=>rearDepth(x,y,ends([x,y,-2.390+.049*smooth(.49,.90,Math.abs(x))])[2]);
  const fogFace=(x,y)=>bumperDepth(x,y,ends([x,y,2.395-.096*smooth(.46,.88,Math.abs(x))])[2]);
  const lensFace=(x,y)=>frontLensDepth(x,y,ends([x,y,2.337])[2]);
  const fogY=.407;
  for(const side of [-1,1]){
    const outside=side*.786, inside=side*.641;
    ring(outside,.958,.061,.053,.63,red,.007,-1,tailFace);
    ring(inside,.958,.053,.044,.56,red,.008,-1,tailFace);
    ring(side*.709,fogY,.050,.049,.72,silver,.005,1,fogFace);
    ring(side*.709,fogY,.033,.036,0,fog,.006,1,fogFace);
    ring(side*.662,.732,.042,.032,.76,silver,.004,1,lensFace);
  }

  const bowTie=[[-.090,.950],[-.025,.950],[-.025,.979],[.024,.979],[.024,.950],[.087,.950],
    [.078,.924],[.024,.924],[.024,.908],[-.025,.908],[-.025,.924],[-.086,.924]];
  for(let i=0;i<bowTie.length;i++){
    const toPoint=([x,y])=>[x,y,rearDepth(x,y,-2.412)-.006];
    triangle(gold,[toPoint([0,.939]),toPoint(bowTie[i]),toPoint(bowTie[(i+1)%bowTie.length])],-1);
  }
  const mesh=doc.createMesh("Oticas e acabamento LTZ");
  for(const [material,batch] of materialBatches){
    mesh.addPrimitive(exportPrimitive(doc,batch,["POSITION","NORMAL","TEXCOORD_0"],material,buffer));
  }
  scene.addChild(doc.createNode("oticas-ltz").setMesh(mesh));
  const previousLights=root.listNodes().find(n=>n.getName()==="taillamp_internals");
  previousLights?.dispose();
}

async function prepare(source, target) {
  await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
  const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "meshopt.encoder":MeshoptEncoder, "meshopt.decoder":MeshoptDecoder
  });
  const doc=await io.read(source);
  const root=doc.getRoot(), buffer=root.listBuffers()[0];
  const coat=doc.createExtension(KHRMaterialsClearcoat);
  const addCoat=(mat,factor,roughness)=>mat.setExtension("KHR_materials_clearcoat",
    coat.createClearcoat().setClearcoatFactor(factor).setClearcoatRoughnessFactor(roughness));
  const stripe=doc.createMaterial("faixa-preta-LTZ")
    .setBaseColorFactor([.0095,.0105,.012,1]).setMetallicFactor(.09).setRoughnessFactor(.252);
  addCoat(stripe,.74,.147);

  const proof=[];
  for(const [name,zone] of Object.entries(zones)) {
    const node=root.listNodes().find(n=>n.getName()===name);
    if(!node)throw new Error("Painel ausente: "+name);
    proof.push(applyStripes(doc,node,zone,stripe,buffer));
  }
  const body=root.listNodes().find(n=>n.getName()==="body");
  const painted=body.getMesh().listPrimitives().find(p=>p.getMaterial().getName()==="paint_body").getMaterial();
  for(const panel of root.listNodes().filter(n=>/^(body|grille_slats)$/.test(n.getName()))) {
    paintBumperShoulders(doc,panel,painted,buffer);
  }
  reshapeEnds(doc,root,buffer);
  addReflectors(doc,root,buffer);
  for(const material of root.listMaterials()) {
    const name=material.getName();
    if(/^paint(_body)?$/.test(name)) {
      material.setBaseColorTexture(null).setBaseColorFactor([.896,.909,.925,1])
        .setMetallicFactor(.12).setRoughnessFactor(.22);
      addCoat(material,.89,.132);
    }
    if(name==="glass") {
      material.setBaseColorFactor([.040,.063,.094,.82]).setAlphaMode("BLEND")
        .setRoughnessFactor(.146).setMetallicFactor(.20);
      material.setExtension("KHR_materials_transmission",null);
      addCoat(material,.60,.16);
    }
    if(name==="rim_paint") {
      material.setBaseColorFactor([.076,.080,.086,1]).setMetallicFactor(.73).setRoughnessFactor(.29);
    }
    if(name==="rim_machined") {
      material.setBaseColorFactor([.42,.44,.465,1]).setMetallicFactor(.87).setRoughnessFactor(.265);
    }
  }
  root.setExtras({
    title:"Chevrolet Cruze LTZ 2014 · branco com duas faixas",
    source:"https://tevy.dev/models/family-sedan",
    adaptation:"Carroceria-base Tevy, CC0 1.0. Para-choques esculpidos, materiais e painéis recortados para o Manezinho TA.",
    stripes:{ width:.27,gap:.15,panels:["bonnet_body","body","boot_body"] },
  });
  await doc.transform(dedup(),prune(),meshopt({encoder:MeshoptEncoder,level:"medium"}));
  await io.write(target,doc);
  console.log(JSON.stringify({panels:proof,bytes:fs.statSync(target).size}));
}

prepare(process.argv[2],process.argv[3]).catch(error=>{
  console.error(error);
  process.exitCode=1;
});
