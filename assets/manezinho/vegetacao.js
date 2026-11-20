/* Formas autorais de restinga, baseadas nas espécies descritas no Atlas de Florianópolis. */
window.MTAFlora = (() => {
  "use strict";

  const zones = [
    { name:"Joaquina", bounds:[857,944,-135,250], clusters:36 },
    { name:"Campeche", bounds:[855,949,646,1050], clusters:32 },
    { name:"Pântano do Sul", bounds:[650,795,1250,1371], clusters:24 },
    { name:"Jurerê", bounds:[185,443,-1412,-1327], clusters:26 },
    { name:"Canasvieiras", bounds:[543,832,-1475,-1382], clusters:26 },
  ];
  const turn = Math.PI * 2;

  function grass(Builder,tint,rng) {
    const mesh=new Builder();
    const colors=[0x53673c,0x788851,0x626d3d,0x908c5c,0x5d7748].map(tint);
    for(let i=0;i<18;i++){
      const angle=rng()*turn, ux=Math.cos(angle), uz=Math.sin(angle);
      const height=.15+rng()*.35, lean=.10+rng()*.26;
      const root=(.01+rng()*.175), width=.016+rng()*.025;
      const color=colors[i%colors.length];
      const point=(t,side)=>[ux*(root+lean*t*t)-uz*width*(1-t)*side,
        .016+height*t*(1-.23*t),uz*(root+lean*t*t)+ux*width*(1-t)*side];
      mesh.quad(point(0,-1),point(0,1),point(.38,1),point(.38,-1),color);
      mesh.quad(point(.38,-1),point(.38,1),point(.72,1),point(.72,-1),color);
      mesh.tri(point(.72,-1),point(.72,1),point(1,0),color);
    }
    return mesh.build();
  }

  function leaf(mesh, origin, angle, length, width, rise, paint, spine) {
    const [x,y,z]=origin, dx=Math.cos(angle), dz=Math.sin(angle);
    const at=(t,spread,h=0)=>[x+dx*t*length-dz*spread*width,y+rise*t+h,z+dz*t*length+dx*spread*width];
    const a=at(0,0), b=at(.43,0,width*.19), c=at(.70,0,width*.15), tip=at(1,0,-width*.18);
    for(const side of [-1,1]){
      const near=at(.28,side*.82), belly=at(.60,side), far=at(.88,side*.65,-width*.07);
      mesh.tri(a,near,b,spine);
      mesh.quad(near,belly,c,b,paint);
      mesh.quad(belly,far,tip,c,paint);
    }
  }

  function creeper(Builder,tint,rng) {
    const mesh=new Builder();
    const leafColors=[0x547240,0x658653,0x798d50,0x4a6840].map(tint);
    const brighter=tint(0x738654), petal=tint(0x906987), heart=tint(0x6d3e62);
    for(let branch=0;branch<6;branch++){
      const theta=branch*turn/6+rng()*.55;
      const x=Math.cos(theta),z=Math.sin(theta), reach=.32+rng()*.56;
      for(let i=0;i<5;i++){
        const distance=reach*i/5, side=i%2===0?1:-1;
        leaf(mesh,[x*distance,.026+.035*rng(),z*distance],theta+side*(.5+rng()*.65),
          .10+rng()*.11,.042+rng()*.041,.036+rng()*.044,leafColors[(branch+i)%4],brighter);
      }
      if(branch%3!==0)continue;
      const bx=x*reach*.64,bz=z*reach*.64, by=.115;
      const point=(angle,radius,height)=>[bx+Math.cos(angle)*radius,by+height,bz+Math.sin(angle)*radius];
      for(let i=0;i<5;i++){
        const phase=turn*i/5;
        mesh.quad(point(phase,.014,0),point(phase-.51,.049,.025),
          point(phase,.071,.04),point(phase+.51,.049,.027),petal);
        mesh.tri(point(phase,0,-.002),point(phase,.019,.007),point(phase+.62,.022,.013),heart);
      }
    }
    return mesh.build();
  }

  function shrub(Builder,tint,rng) {
    const mesh=new Builder();
    const color=[0x4e683d,0x60794c,0x78945f,0x526b45].map(tint), vein=tint(0x6e7750);
    for(let branch=0;branch<8;branch++){
      const heading=branch*turn/8+rng()*.45, dx=Math.cos(heading), dz=Math.sin(heading);
      const height=.32+rng()*.28, radius=.23+rng()*.25;
      for(let tier=1;tier<=5;tier++){
        const t=tier/5, reach=radius*t**1.3;
        const y=.04+height*t;
        const center=[dx*reach,y,dz*reach];
        for(const sign of [-1,1]){
          leaf(mesh,center,heading+sign*(.44+rng()*1.43),.10+rng()*.15,.028+rng()*.025,
            .025+rng()*.085,color[(branch+tier)%4],vein);
        }
      }
    }
    return mesh.build();
  }

  function populate(scene,collisions,mode,tools) {
    const { Builder, Material, side, seed, tint, matrix, groundAt, coastHeight,
      habitat, road, wind, instances }=tools;
    const rng=seed(603177);
    const types=[
      { geometry:grass(Builder,tint,rng), data:[], wind:.036 },
      { geometry:creeper(Builder,tint,rng), data:[], wind:.025 },
      { geometry:shrub(Builder,tint,rng), data:[], wind:.019 },
    ];
    const factor=mode==="baixa"?.50:mode==="media"?.76:1;
    const summary=[];
    function viable(x,z) {
      const shore=coastHeight(x,z);
      return shore>1.45 && shore<13.8 && habitat(x,z)>.24 && road(x,z)<.018
        && !collisions.pointBlocked(x,z,groundAt(x,z)+.46);
    }

    for(const zone of zones){
      const [left,right,top,bottom]=zone.bounds;
      const goal=Math.round(zone.clusters*factor);
      let clusters=0, plants=0, sample=null;
      for(let attempt=0;attempt<goal*28 && clusters<goal;attempt++){
        const x=left+rng()*(right-left), z=top+rng()*(bottom-top);
        if(!viable(x,z))continue;
        let added=0;
        const choice=rng();
        for(let j=0;j<6;j++){
          const px=x+(rng()-.5)*7.6, pz=z+(rng()-.5)*7.6;
          if(!viable(px,pz))continue;
          const type=choice<.53?0:choice<.84?1:rng()<.65?2:0;
          const size=(type===2?1.17:.94)*(.66+rng()*.73);
          types[type].data.push({m:matrix(px,groundAt(px,pz)-.014,pz,rng()*turn,
            size,size*(.81+rng()*.34),size)});
          added++;
        }
        if(added){clusters++;plants+=added;sample??=[x,z];}
      }
      summary.push({ zone:zone.name, clusters, plants, sample });
    }
    const count=types.map(type=>{
      const material=new Material({ vertexColors:true, side, roughness:.93, metalness:0 });
      wind(material,type.wind);
      const parts=instances(scene,type.geometry,material,type.data,78,{cast:false,recv:true,cull:145});
      return parts.length;
    });
    return { zones:summary, batches:count.reduce((sum,n)=>sum+n,0) };
  }

  function shapeCrown(geometry, width, height, center, variation) {
    const points=geometry.getAttribute("position");
    const normals=geometry.getAttribute("normal");
    for(let i=0;i<points.count;i++){
      const x=points.getX(i),y=points.getY(i),z=points.getZ(i);
      const lobes=Math.sin(x*6.0+z*3.9+y*2.7)*Math.cos(y*5.4-z*3.6);
      const scallop=Math.sin((x+y)*11.2+z*5.3)*.27;
      const radius=1+variation*(lobes*.73+scallop);
      points.setXYZ(i,x*radius*width,center+y*radius*height,z*radius*width);
      const nx=x/width,ny=y/height,nz=z/width;
      const length=Math.hypot(nx,ny,nz)||1;
      normals.setXYZ(i,nx/length,ny/length,nz/length);
    }
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  function leafLighting(material) {
    const prior=material.onBeforeCompile;
    material.onBeforeCompile=function(shader,renderer){
      prior.call(this,shader,renderer);
      shader.vertexShader="varying vec3 vMtaLeaves;\n"+shader.vertexShader.replace("#include <begin_vertex>",`
        #include <begin_vertex>
        vMtaLeaves = position;
        #ifdef USE_INSTANCING
          vMtaLeaves += instanceMatrix[3].xyz * .051;
        #endif
      `);
      shader.fragmentShader="varying vec3 vMtaLeaves;\n"+shader.fragmentShader.replace("#include <color_fragment>",`
        #include <color_fragment>
        vec3 leaves = vMtaLeaves * 7.0;
        float relief = sin(leaves.x + cos(leaves.y*.87 + leaves.z*.38)*1.19)
          * cos(leaves.z*.91 + sin(leaves.y*1.15)*1.06);
        float spread = sin(dot(vMtaLeaves, vec3(2.83,2.14,1.57))) * cos(vMtaLeaves.y*3.97);
        float reach = 1.0-smoothstep(.20,.82,length(fwidth(leaves)));
        diffuseColor.rgb *= 0.93 + 0.10*spread + 0.115*reach*relief;
      `);
    };
    return material;
  }

  return Object.freeze({ populate, shapeCrown, leafLighting });
})();