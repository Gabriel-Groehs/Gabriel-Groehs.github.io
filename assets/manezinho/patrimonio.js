/* Espaços visitáveis do distrito histórico e do comércio em São José.
   Referências dos marcos: https://saojose.sc.gov.br/centro-historico-turismo/38616/
   Os interiores e comércios são cenários autorais do jogo. */
window.MTAHeritage = (() => {
  "use strict";

  const sites = [
    { id: "loja-roupas", name: "Loja de Roupa do Kobrasol", type: "roupas", x: -840, z: 205,
      angle: Math.PI / 2, front: -1, w: 13, d: 12, h: 4.4, color: 0xa38e77 },
    { id: "posto-conveniencia", name: "Posto · Conveniência", type: "posto", x: -916, z: 566,
      angle: Math.PI / 2, front: -1, w: 18, d: 14, h: 4.7, color: 0xc9c5b7 },
    { id: "casa-acoriana", name: "Casa Açoriana", type: "casa", x: -966, z: 662,
      angle: Math.PI / 2, front: 1, w: 12, d: 13, h: 4.3, color: 0xc9ba92 },
    { id: "padaria-historica", name: "Padaria da Freguesia", type: "padaria", x: -933, z: 712,
      angle: Math.PI / 2, front: -1, w: 13, d: 14, h: 4.6, color: 0xc8af8a },
    { id: "igreja-matriz-sj", name: "Igreja Matriz de São José", type: "igreja", x: -877, z: 703,
      angle: 0, front: 1, w: 16, d: 26, h: 8.3, color: 0xebe5d8 },
    { id: "theatro-adolpho", name: "Theatro Adolpho Mello", type: "teatro", x: -848, z: 774,
      angle: 0, front: -1, w: 19, d: 22, h: 7.8, color: 0xe2b84f },
    { id: "museu-historico-sj", name: "Museu Histórico de São José", type: "museu", x: -814, z: 773,
      angle: 0, front: -1, w: 19, d: 19, h: 6.5, color: 0xc9bb9f },
    { id: "farmacia-freguesia", name: "Farmácia da Freguesia", type: "farmacia", x: -806, z: 725,
      angle: 0, front: 1, w: 13, d: 12, h: 4.4, color: 0xaeb9ab },
  ];

  const roads = [
    ["hist0", -946, 511], ["hist1", -956, 596],
    ["hist2", -942, 674], ["hist3", -904, 738],
    ["hist4", -858, 749], ["hist5", -784, 749], ["hist6", -767, 790],
  ];

  function register(node, edge) {
    roads.forEach(([id, x, z], i) => {
      node(id, x, z);
      edge(i ? roads[i - 1][0] : "ledio6", id, "sj-local", { sides: [], smooth: 5 });
    });
  }

  function prepare(flatten, protect) {
    for (const site of sites) {
      flatten({ name: site.id, cx: site.x, cz: site.z, ang: site.angle,
        hl: site.w / 2 + 1, hw: site.d / 2 + 1, blend: 5 });
      protect.push([site.x, site.z, Math.hypot(site.w, site.d) * .55]);
    }
  }

  function fill(type, box, width, depth, tint) {
    const wood = tint(0x735239), metal = tint(0x504b47), stone = tint(0xc8baa4);
    const cloth = tint(0x8f4844), paper = tint(0xe8e0cd), dark = tint(0x3c312b);
    const w = width / 2, d = depth - 1;

    const furniture = (x, z, sizeX, sizeZ, height, color, y = 0) =>
      box(x - sizeX / 2, x + sizeX / 2, z - sizeZ / 2, z + sizeZ / 2, y, height + y, color);
    if (type === "igreja" || type === "teatro") {
      for (let z = 4; z < d - 5; z += 2) {
        for (const side of [-1, 1]) {
          const x = side * (w / 2 + .40);
          furniture(x, z, w - 2.5, .50, .11, type === "igreja" ? wood : cloth, .43);
          furniture(x, z - .27, w - 2.5, .085, .47, type === "igreja" ? wood : cloth, .44);
          for (const end of [-1, 1]) furniture(x + end * (w - 2.7) * .5, z, .095, .46, .43, wood);
        }
      }
      furniture(0, d - 1.3, width * .76, 2.75, .25, stone);
      if (type === "igreja") {
        furniture(0, d - 1.25, 2.9, 1.10, .76, stone, .25);
        furniture(0, d + .02, .17, .15, 2.55, wood, .80);
        furniture(0, d + .02, 1.36, .15, .16, wood, 2.58);
      } else {
        for (const x of [-w + .85, w - .85]) furniture(x, d - 1.63, 1.1, .42, 3.85, cloth, .27);
      }
      return;
    }

    if (type === "roupas") {
      for (const x of [-w + 2, w - 2]) {
        for (const z of [3.2, 6.5, 9.1]) {
          furniture(x, z, 1.10, .075, .045, metal, 1.52);
          for (const dx of [-.52, .52]) furniture(x + dx, z, .049, .069, 1.52, metal);
          for (const [j,c] of [0x12645a,0x9b5944,0x9faebb,0x3d495e].entries()) {
            furniture(x + (j - 1.5) * .24, z, .155, .12, .64, tint(c), .79);
          }
        }
      }
    } else if (type === "casa") {
      furniture(-w + 2.3, 4.4, 2.55, .98, .62, cloth);
      furniture(-w + 2.3, 4.84, 2.58, .22, .41, cloth, .55);
      furniture(w - 2.0, 7.4, 2.42, .73, .94, wood);
      furniture(w - 3.1, 4.3, 1.25, .72, .06, wood, .75);
      for (const x of [w - 3.6,w - 2.6]) furniture(x, 4.3, .07, .64, .75, wood);
    } else if (type === "museu") {
      for (const x of [-w + 2.0, w - 2.0]) for (const z of [4.2, 7.5, 10.8, 14.1]) {
        furniture(x, z, .95, 1.15, .94, wood);
        furniture(x, z, .76, .86, .031, stone, .94);
      }
      furniture(-w + .39, 8, .064, 2.15, 1.42, wood, 1.4);
      furniture(-w + .46, 8, .039, 1.82, 1.18, paper, 1.53);
    } else {
      for (const x of [-w + 1.1, w - 1.1]) {
        for (const z of [3.9, 6.9, 9.9]) {
          if (z + 1.1 >= depth) continue;
          furniture(x, z, .67, 2.03, .08, metal, .68);
          furniture(x, z, .67, 2.03, .08, metal, 1.16);
          for (let k = 0; k < 8; k++) {
            furniture(x, z + (k - 3.5) * .23, .22, .17, .19,
              type === "farmacia" ? paper : k % 2 ? paper : cloth, .76);
          }
        }
      }
    }
    if (type !== "casa") furniture(w - 1.82, d - 1.05, 2.08, .82, 1.02,
      type === "padaria" ? wood : dark);
  }

  function historicFacade(site,pose,batch,y,tint) {
    const facade=site.front*site.d/2, outer=site.w/2;
    const builder=batch.vc;
    const ocher=tint(0xc89946), lime=tint(0xece4d4), stone=tint(0xc2b6a1);
    const ocherShadow=tint(0xa97935), deep=tint(0x263839), blue=tint(0x6a858c);
    const plaster=tint(site.color);
    const point=(x,level,depth)=> {
      const [px,pz]=pose.P(x,facade+site.front*depth);
      return [px,y+level,pz];
    };
    const normal=[Math.sin(-pose.ang)*site.front,0,Math.cos(-pose.ang)*site.front];
    const uv=[[0,0],[1,0],[1,1],[0,1]];
    const plane=(points,paint,depth=.22)=>{
      const world=points.map(([x,h])=>point(x,h,depth));
      if(world.length===4)builder.quad(...world,paint,uv,normal);
      else if(site.front>0)builder.tri(...world,paint);
      else builder.tri(world[0],world[2],world[1],paint);
    };
    const frame=(x,level,width,height,depth,color,offset=.24,roll=0)=>
      pose.box(builder,x,facade+site.front*offset,y+level,width,height,depth,color,0,0,roll);
    const pilaster=(x,height,topColor,width=.34)=>{
      frame(x,height*.5+.05,width,height,.27,topColor);
      frame(x,.195,width+.18,.33,.39,stone);
      frame(x,height+.12,width+.15,.26,.36,topColor);
    };

    function arch(x,bottom,inner,outer,crown,paint) {
      const at=(angle,r)=>[x+Math.cos(angle)*r,bottom+Math.sin(angle)*r];
      for(let j=0;j<12;j++){
        const a=j*Math.PI/12,b=(j+1)*Math.PI/12;
        if(crown)plane([[x,bottom-.008],at(a,inner),at(b,inner)],crown,.18);
        plane([at(a,inner),at(a,outer),at(b,outer),at(b,inner)],paint,.43);
      }
    }

    if(site.type==="igreja"){
      const gable=site.h+.12, peak=gable+1.92;
      plane([[-outer+.25,gable],[outer-.25,gable],[0,peak]],plaster,.18);
      frame(0,gable,site.w+.25,.24,.35,ocher,.24);
      for(const sign of [-1,1]) {
        const angle=-sign*Math.atan2(peak-gable,outer-.24);
        frame(sign*(outer-.24)*.5,(gable+peak)*.5,Math.hypot(outer-.24,peak-gable),.225,.32,ocher,.27,angle);
      }
      for(const x of [-outer+.63,outer-.63])pilaster(x,site.h-.26,ocher,.47);
      pilaster(-2.17,3.63,ocher,.38);
      pilaster(2.17,3.63,ocher,.38);
      frame(0,3.65,4.87,.225,.44,ocher);
      plane([[-2.43,3.77],[2.43,3.77],[0,4.85]],ocher,.48);
      plane([[-1.90,3.91],[1.90,3.91],[0,4.61]],lime,.52);
      for(let column=-3;column<=3;column++){
        const x=column*.38,y1=4.03,y2=4.52-.095*Math.abs(column);
        plane([[x-.10,y1],[x+.10,y1],[x,y2]],blue,.525);
      }
      const at=(angle,r)=>[Math.cos(angle)*r,6.12+Math.sin(angle)*r];
      for(let j=0;j<20;j++){
        const a=j*Math.PI/10,b=(j+1)*Math.PI/10;
        plane([[0,6.12],at(a,.64),at(b,.64)],deep,.19);
        plane([at(a,.64),at(a,.80),at(b,.80),at(b,.64)],ocher,.42);
      }
      frame(0,6.12,.073,1.16,.041,blue,.22);
      frame(0,6.12,1.16,.073,.041,blue,.22);
      frame(0,peak+.56,.13,1.21,.15,ocher);
      frame(0,peak+.61,.65,.13,.15,ocher);

      const tower=-outer*.62, towerBase=site.h-.75, towerTop=site.h+3.84;
      const coreZ=facade-site.front*1.31;
      pose.box(builder,tower,coreZ,y+towerBase+.99,3.10,2.25,3.08,plaster);
      pose.box(builder,tower,coreZ,y+towerTop-.49,3.10,1.0,3.08,plaster);
      for(const dir of [-1,1]) {
        pose.box(builder,tower+dir*1.25,coreZ,y+towerBase+2.84,.58,2.04,3.09,plaster);
        frame(tower+dir*1.08,towerBase+2.63,.19,2.16,.22,ocher,.27);
      }
      frame(tower,towerBase+2.53,1.74,2.03,.105,deep,.20);
      arch(tower,towerBase+3.24,.78,.98,deep,ocher);
      for(const level of [towerBase+.12,towerBase+1.46,towerTop]) {
        pose.box(builder,tower,coreZ,y+level,3.37,.20,3.31,ocher);
      }
      const roof=tint(0x827669);
      pose.box(builder,tower,coreZ,y+towerTop+.23,2.81,.40,2.80,roof);
      pose.box(builder,tower,coreZ,y+towerTop+.68,2.15,.51,2.14,roof);
      pose.box(builder,tower,coreZ,y+towerTop+1.10,1.38,.43,1.46,roof);
      pose.box(builder,tower,coreZ,y+towerTop+1.68,.14,1.06,.14,ocherShadow);
      pose.box(builder,tower,coreZ,y+towerTop+1.82,.66,.12,.14,ocherShadow);
      return;
    }

    for(const x of [-outer+.45,-7.54,-2.57,2.57,7.54,outer-.45])pilaster(x,5.77,lime,.39);
    for(const x of [-5.15,0,5.15]){
      frame(x-1.36,1.68,.22,3.35,.37,lime);
      frame(x+1.36,1.68,.22,3.35,.37,lime);
      arch(x,3.36,1.26,1.49,deep,lime);
      for(let j=-2;j<=2;j++)frame(x+j*.29,3.58,.057,.41,.09,blue,.25);
    }
    frame(0,5.76,site.w+.14,.24,.45,lime);
    frame(0,6.47,site.w+.20,.19,.49,lime);
    frame(0,site.h+.11,site.w+.20,.25,.60,lime);
    for(let x=-outer+.55;x<outer-.38;x+=.66){
      if(Math.abs(x)<2.5)continue;
      frame(x,site.h+.58,.18,.68,.31,lime);
    }
    frame(-5.30,site.h+.90,8.15,.16,.39,lime);
    frame(5.30,site.h+.90,8.15,.16,.39,lime);
    plane([[-3.25,site.h+.16],[3.25,site.h+.16],[0,site.h+1.44]],lime,.36);
    plane([[-2.48,site.h+.33],[2.48,site.h+.33],[0,site.h+1.24]],plaster,.43);
    for(const x of [-7.68,7.68]){
      frame(x,site.h+1.12,.58,.26,.39,stone);
      frame(x,site.h+1.42,.38,.39,.29,stone);
      frame(x,site.h+1.66,.15,.13,.19,lime);
    }
  }

  function buildMuseum(site, pose, batch, room, y, tint, surface) {
    const edge=site.front*site.d/2, half=site.w*.5;
    const wine=tint(0x834640), wall=tint(0xb8a294), glass=tint(0x3e5a63), wood=tint(0x70513c);
    const stone=tint(0xa9957a), deck=tint(0x8a6b50), cream=tint(0xe4d7be);
    const frame=(x,level,w,h,d,paint,offset=.22) =>
      pose.box(batch.vc,x,edge+site.front*offset,y+level,w,h,d,paint);
    for(const sign of [-1,1])frame(sign*(half+1.36)*.5,.23,half-1.36,.32,.28,stone);
    frame(0,3.68,site.w+.26,.18,.40,wine);
    frame(0,6.20,site.w+.25,.23,.42,wine);
    for(const sign of [-1,1]){
      frame(sign*(half-.41),3.23,.48,6.28,.30,wine);
      frame(sign*1.77,1.55,.29,3.02,.28,wine);
    }
    const curve=(x,h,r,angle,depth)=>{
      const [px,pz]=pose.P(x+Math.cos(angle)*r,edge+site.front*depth);
      return [px,y+h+Math.sin(angle)*r,pz];
    };
    for(const x of [-6.8,-3.42,0,3.42,6.8]){
      const radius=.63, base=4.86, bottom=3.99;
      frame(x,(base+bottom)*.5,1.28,base-bottom,.043,glass,.173);
      for(let j=0;j<12;j++){
        const a=j*Math.PI/12,b=(j+1)*Math.PI/12;
        const p=curve(x,base,0,0,.173),q=curve(x,base,radius,a,.173),r=curve(x,base,radius,b,.173);
        batch.vc.tri(p,site.front>0?q:r,site.front>0?r:q,glass);
        batch.vc.quad(curve(x,base,radius,a,.28),curve(x,base,.795,a,.28),
          curve(x,base,.795,b,.28),curve(x,base,radius,b,.28),wine,undefined,[Math.sin(-pose.ang)*site.front,0,Math.cos(pose.ang)*site.front]);
      }
      for(const side of [-1,1])frame(x+side*.708,(base+bottom)*.5,.16,base-bottom,.24,wine);
      frame(x,bottom-.042,1.68,.12,.34,wine);
      frame(x,4.50,.061,1.0,.064,wall,.23);
      frame(x,4.47,1.23,.057,.063,wall,.23);
    }

    const x0=-half+.58,x1=x0+2.18;
    const foot=3.1,count=14,tread=.48,rise=.212;
    const back=foot+count*tread;
    function platform(left,right,near,far,height){
      room.bx(batch.inner,left,right,near,far,Math.max(0,height-.18),height,deck);
      const [cx,cz]=pose.P((left+right)*.5,edge-site.front*(near+far)*.5);
      surface({name:"galeria-museu",cx,cz,ang:pose.ang,hl:(right-left)*.5,hw:(far-near)*.5,
        curb:true,tol:.28,h:()=>y+height});
    }
    for(let i=0;i<count;i++)platform(x0,x1,foot+i*tread,foot+(i+1)*tread,(i+1)*rise);
    const height=count*rise, left=-half+.50,right=half-.48;
    platform(left,right,back,site.d-.49,height);
    for(let i=0;i<6;i++){
      const x=x1+.34+i*1.37;
      room.bx(batch.inner,x,x+.09,back+.05,back+.16,height,height+1.02,wood);
    }
    room.bx(batch.inner,x1, right,back+.05,back+.17,height+.94,height+1.08,wood);
    for(const x of [-5.6,-2.8,0,2.8,5.6]){
      room.bx(batch.inner,x-.51,x+.51,site.d-.71,site.d-.57,height+1.06,height+2.27,wood);
      room.bx(batch.inner,x-.42,x+.42,site.d-.76,site.d-.67,height+1.15,height+2.17,cream);
      room.bx(batch.inner,x-.32,x+.32,site.d-.81,site.d-.75,height+1.26,height+2.06,
        tint(0x776d58));
    }
  }

  function drawForecourt(site,pose,builder,groundAt,tint) {
    const lengths={igreja:12,teatro:6.65,museu:5.8};
    const length=lengths[site.type];
    if(!length)return;
    const half=site.w*.5+(site.type==="igreja"?3.52:1.2);
    const edge=site.front*site.d*.5;
    const stone=tint(0xa79b88), center=tint(0xc3b8a1);
    function point(x,depth){
      const [px,pz]=pose.P(x,edge+site.front*depth);
      return [px,groundAt(px,pz)+.047,pz];
    }
    const columns=Math.ceil(half*2/1.62), rows=Math.ceil(length/1.45);
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const x0=-half+col*half*2/columns,x1=x0+half*2/columns;
      const near=.03+row*length/rows,far=near+length/rows;
      const p=[point(x0,near),point(x1,near),point(x1,far),point(x0,far)];
      const uv=p.map(([x,,z])=>[x/3.8,z/3.8]);
      builder.quad(...p,col===0||col===columns-1||row===rows-1?stone:center,uv,[0,1,0]);
    }
  }

  function stepVisitor(actor, player, delta, groundAt, collisions) {
    const points = actor.spot.visit;
    const visit = actor.visitState ??= { index: 1, wait: .8, speed: 0 };
    const pos = actor.pos;
    visit.speed = 0;
    if (visit.wait > 0) {
      visit.wait = Math.max(0,visit.wait-delta);
      return;
    }
    const [x,z,pause] = points[visit.index];
    const dx = x-pos.x, dz = z-pos.z;
    const distance = Math.hypot(dx,dz);
    if (distance < .09) {
      visit.index = (visit.index + 1) % points.length;
      visit.wait = pause;
      return;
    }
    const angle = Math.atan2(dx,dz);
    const turn = Math.atan2(Math.sin(angle-actor.yaw),Math.cos(angle-actor.yaw));
    actor.yaw += turn * Math.min(1,delta*7);
    if (Math.abs(turn) > .78) return;
    const speed = 1.22;
    const step = Math.min(distance, speed*delta) / distance;
    const nextX = pos.x+dx*step, nextZ = pos.z+dz*step;
    if (player.mode === "foot" && Math.abs(player.pos.y-pos.y) < 1.2
        && Math.hypot(nextX-player.pos.x,nextZ-player.pos.z) < .65) return;
    const floor = groundAt(nextX,nextZ,pos.y+.9);
    const moved = collisions.resolve(nextX,nextZ,.282,floor+.16,1.34,visit.out ??= {x:0,z:0});
    const travel = Math.hypot(moved.x-pos.x,moved.z-pos.z);
    pos.set(moved.x,groundAt(moved.x,moved.z,pos.y+.9),moved.z);
    if (delta > 0 && travel > .002) visit.speed = Math.min(speed,travel/delta);
  }

  function draw(scene, textures, col, locals, world, tools) {
    const { tile, transform, openBuilding, materials, attach, makeSign, signTexture, groundAt, tint,
      Builder, Mesh, Material, surface } = tools;
    const shared = materials(textures, world);
    const court=new Builder();
    for (const s of sites) {
      const batch = new tile(s.x, s.z, 870, 175);
      const pose = transform(s.x, s.z, s.angle);
      const style = tint(s.color);
      const historic = ["igreja", "teatro", "museu", "casa"].includes(s.type);
      const y = groundAt(s.x, s.z) + .06;
      const room = openBuilding(batch, batch.inner, col, pose, s.front, y, s.w, s.d, s.h, {
        name: s.name, wall: style, front: style, floor: tint(s.type === "igreja" ? 0x9b8b73 : 0x8c7b66),
        inWall: tint(historic ? 0xe4dcca : 0xd5d0c9), door: s.type === "igreja" ? 3.1 : 2.65,
        solidFront: historic,
        doors: s.type==="teatro" ? [-5.15,0,5.15] : null,
      });
      fill(s.type, (x0,x1,z0,z1,y0,y1,color) =>
        room.bx(batch.inner,x0,x1,z0,z1,y0,y1,color), s.w,s.d,tint);
      drawForecourt(s,pose,court,groundAt,tint);
      if(s.type==="museu")buildMuseum(s,pose,batch,room,y,tint,surface);

      const frontage = s.front * s.d / 2;
      const portal = pose.P(0, frontage);
      const approach = pose.P(0, frontage + s.front * 2.8);
      const inside = pose.P(0, frontage - s.front * 3.0);
      s.path = { portal, approach, inside, y };
      if (locals) {
        const slot = sites.indexOf(s);
        const yaw = Math.atan2(portal[0]-approach[0],portal[1]-approach[1]);
        locals.add({ x:approach[0],z:approach[1],y:groundAt(...approach),yaw,
          kind:"visitante",pose:"idle",female:slot%2===0,seed:7120+slot*17,destination:s.id,
          visit:[[...approach,1.5],[...portal,0],[...inside,2+slot%3],[...portal,0]] });
      }
      const frame = tint(historic ? 0x857c73 : 0x424c54);
      for (const side of [-1, 1]) {
        pose.box(batch.vc, side * 1.62, frontage + s.front * .075, y + 1.58, .21, 3.16, .18, frame);
      }
      const isChurch=s.type==="igreja", isTheater=s.type==="teatro", isMuseum=s.type==="museu";
      const sign = pose.P(isChurch?5.03:isMuseum?5.32:0, frontage + s.front * (isChurch || isTheater ? .48 : .22));
      const yaw = -s.angle + (s.front > 0 ? 0 : Math.PI);
      const texture = signTexture([isTheater ? "THEATRO MUNICIPAL" : s.name.toUpperCase()], {
        bg:isTheater?"#d8b965":historic?"#453c32":"#26363c",fg:isTheater?"#30332f":"#fff1d3",
      });
      makeSign(world,scene,texture,isChurch?4.12:isMuseum?5.30:Math.min(s.w-1,11),.68,
        sign[0],y+(isChurch?1.31:isTheater?6.08:isMuseum?1.60:3.73),sign[1],yaw,{always:true,far:450});


      if (historic) {
        const roofColor=tint(s.type==="casa"?0x8c4534:0x714733);
        const halfWidth=s.w/2, rim=s.h+.18;
        const slope=s.type==="igreja"?.30:s.type==="teatro"?.14:.27;
        for (const side of [-1,1]) {
          pose.box(batch.vc,side*halfWidth*.52,0,y+rim+halfWidth*.15,
            halfWidth*1.13,.19,s.d+.69,roofColor,0,0,-side*slope);
          for (let t=-s.d*.34;t<s.d*.38;t+=3.1) {
            pose.box(batch.vc,side*(halfWidth+.045),t,y+s.h*.57,.14,s.h*.33,1.00,
              tint(s.type==="igreja"?0x4a6572:0x4f6159));
            pose.box(batch.vc,side*(halfWidth+.076),t,y+s.h*.388,.22,.13,1.21,frame);
          }
        }
        for (const x of [-halfWidth+.45,halfWidth-.45]) {
          pose.box(batch.vc,x,frontage+s.front*.08,y+s.h*.48,.42,s.h-.13,.28,frame);
        }
        pose.box(batch.vc,0,frontage+s.front*.12,y+s.h*.79,s.w+.25,.29,.32,frame);
      }

      if (s.type === "igreja") {

        // Window recess and amber-blue glazing on the nave walls.
        for (const q of [-1,1]) for (const depth of [5.1,9.4,13.7,18.0,22.3]) {
          const edge=q*(s.w/2-.49);
          const z=s.front*(s.d/2-depth);
          const glassColors=[0x6d7a9e,0xae8356,0x6b8594,0x92746e];
          pose.box(batch.inner,edge,z,y+3.74,.055,2.21,1.19,tint(0x4f5868));
          for (let col=0;col<2;col++) for (let row=0;row<3;row++) {
            pose.box(batch.inner,edge-q*.04,z+(col-.5)*.50,y+3.03+row*.635,
              .034,.57,.455,tint(glassColors[(col+row)%glassColors.length]));
          }
          pose.box(batch.inner,edge-q*.10,z,y+2.55,.21,.105,1.48,tint(0xbfb19b));
        }

        historicFacade(s,pose,batch,y,tint);
      }
      if (s.type === "teatro") historicFacade(s,pose,batch,y,tint);
      if (s.type === "posto") {
        const canopyZ = frontage + s.front * 6.2;
        pose.box(batch.vc,0,canopyZ,y+3.95,s.w-1,.30,5.4,tint(0x74736a));
        for (const x of [-5.0,5.0]) {
          pose.box(batch.vc,x,canopyZ,y+1.99,.23,3.95,.23,frame);
          pose.col(col,x,canopyZ,.20,.20,y-.6,y+4,"bld");
          pose.box(batch.vc,x + (x>0?-1.5:1.5),canopyZ,y+.82,.57,1.65,.54,tint(0xc5b891));
        }
      }
      if (locals && !historic) {
        const p=pose.P(s.w*.30,-s.front*(s.d*.24));
        locals.add({x:p[0],z:p[1],y,kind:"vendor",pose:"idle",yaw,
          name:s.name,lines:["Pode entrar e olhar à vontade."],r:11});
      }
      attach(scene,batch,shared);
      world.markers[s.id]={x:s.x,z:s.z};
    }
    if(!court.empty){
      const floor=new Material({map:textures.streetDetail?.walk??textures.paving,vertexColors:true,
        roughness:.92,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
      const mesh=new Mesh(court.build(),floor);
      mesh.receiveShadow=true;
      scene.add(mesh);
      world.envMats.push(floor);
    }
  }

  return Object.freeze({ register, prepare, draw, stepVisitor, sites });
})();
