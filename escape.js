// Relics unlock the crank; only the crank reveals the timed escape shaft.
const FLOOD_TYPES=[
 {name:'流沙',en:'Quicksand',sprite:4,slow:.48,color:'#d89537',base:'#57321c',edge:'#ffe1a0'},
 {name:'地下水',en:'Groundwater',sprite:5,slow:.65,color:'#36bce7',base:'#063e63',edge:'#a2edff'},
 {name:'尸甲虫',en:'Tomb beetles',sprite:6,slow:.85,harm:2.8,color:'#9a5b3b',base:'#231014',edge:'#e4b593'},
 {name:'岩浆',en:'Lava',sprite:7,slow:.9,harm:1.8,color:'#ff651c',base:'#8b1809',edge:'#fff4b0'},
 {name:'迷雾',en:'Mist',sprite:8,slow:1,fog:.62,color:'#dde5f6',base:'#8292b7',edge:'#ffffff'},
 {name:'尸水',en:'Corpse water',sprite:9,slow:.5,harm:3.2,color:'#59bca2',base:'#173c35',edge:'#bce6c6'},
 {name:'毒气',en:'Poison gas',sprite:10,slow:1,harm:2.2,color:'#b1eb49',base:'#385b1b',edge:'#e2ff9f'},
 {name:'藤蔓',en:'Creeping vines',sprite:11,slow:.46,color:'#45aa59',base:'#173f25',edge:'#bef497'},
 {name:'硫酸',en:'Acid',sprite:12,slow:.82,harm:1.9,color:'#e1ef39',base:'#687517',edge:'#f9ffc3'},
 {name:'星陨瘴尘',en:'Starfall miasma',sprite:13,slow:.7,harm:2.5,fog:.8,color:'#be89ee',base:'#442365',edge:'#f1d1ff'}
];
const SPECIES=[
 {name:'沙埋枯尸',en:'Sand husk',type:0,speed:47,sense:150,hop:1.1,windup:.6,filter:'sepia(.6)',size:76},
 {name:'甬道疾尸',en:'Passage runner',type:1,speed:125,sense:210,hop:.48,windup:.35,filter:'saturate(.7)',size:74},
 {name:'青铜卫尸',en:'Bronze guardian',type:0,speed:61,sense:210,hop:.9,windup:.65,filter:'sepia(.8) hue-rotate(15deg)',size:88},
 {name:'焚骨火尸',en:'Ember spitter',type:2,speed:65,sense:250,hop:.7,windup:.8,shot:'FIRE',filter:'hue-rotate(290deg)',size:82},
 {name:'白骨潜尸',en:'Bone stalker',type:0,speed:98,sense:130,hop:.63,windup:.3,filter:'grayscale(.9) brightness(1.3)',size:70},
 {name:'溺亡水尸',en:'Drowned dead',type:2,speed:66,sense:230,hop:1,windup:.65,shot:'VENOM',filter:'hue-rotate(60deg)',size:80,aquatic:true},
 {name:'封印毒尸',en:'Seal poisoner',type:2,speed:45,sense:285,hop:1.2,windup:.9,shot:'VENOM',filter:'saturate(1.5)',size:86},
 {name:'缠根影尸',en:'Rootbound shadow',type:1,speed:150,sense:175,hop:.43,windup:.42,filter:'hue-rotate(85deg) brightness(.8)',size:73},
 {name:'蚀金帝卫',en:'Corroded imperial guard',type:2,speed:72,sense:300,hop:.8,windup:.7,shot:'VENOM',filter:'sepia(.7) saturate(1.7)',size:92},
 {name:'陨星灾尸',en:'Starfall revenant',type:1,speed:160,sense:320,hop:.4,windup:.28,filter:'hue-rotate(260deg)',size:87}
];
const ExitGate={
 duration:25,remaining:0,radius:0,progress:0,latched:false,exposure:0,notice:-1,
 ready(){return !!Game.exit&&World.remaining()===0&&!!Game.p.hasKey&&BossFight.cleared;},
 setup(){
  this.remaining=0;this.radius=0;this.progress=0;this.latched=false;this.exposure=0;this.notice=-1;
  this.flood=FLOOD_TYPES[Game.lvl-1];const queue=this.rebuildDistance();
  const usable=at=>{const x=(at%MapSys.w)*50+25,y=Math.floor(at/MapSys.w)*50+25;return !World.hazards.some(h=>Math.hypot(h.x-x,h.y-y)<65)&&!Game.ents.some(e=>['coffin','trap'].includes(e.type)&&Math.hypot(e.x-x,e.y-y)<55);};
  const candidates=queue.filter(at=>{const x=at%MapSys.w*50+25,y=Math.floor(at/MapSys.w)*50+25;return usable(at)&&!World.inside(Game.exitRoom,x,y)&&Math.hypot(x-Game.exitPos.x,y-Game.exitPos.y)>=500;});
  candidates.sort((a,b)=>Math.abs(this.dist[a]-24)-Math.abs(this.dist[b]-24));
  const at=candidates[0]??queue.filter(usable).sort((a,b)=>this.dist[b]-this.dist[a])[0];
  this.routeDistance=this.dist[at];
  this.switch={x:at%MapSys.w*50+25,y:Math.floor(at/MapSys.w)*50+25,type:'gate_switch'};
 },
 rebuildDistance(){
  this.dist=new Int16Array(MapSys.w*MapSys.h).fill(-1);
  const origin=Math.floor(Game.exitPos.y/50)*MapSys.w+Math.floor(Game.exitPos.x/50),queue=[origin];this.dist[origin]=0;
  for(let i=0;i<queue.length;i++){
   const at=queue[i];for(const to of [at-1,at+1,at-MapSys.w,at+MapSys.w]){
    if(to<0||to>=this.dist.length||Math.abs(to%MapSys.w-at%MapSys.w)>1||this.dist[to]>=0||MapSys.t[to]===1)continue;
    this.dist[to]=this.dist[at]+1;queue.push(to);
   }
  }
  return queue;
 },
 open(){
  if(!this.ready()||this.remaining>0)return false;
  this.remaining=this.duration;this.latched=true;this.progress=0;AudioSys.playOpen();
  Game.msg(curLang==='CN'?`闸门已开 · ${this.duration} 秒 · ${this.flood.name}正在涌出 · 速回主墓室`:`Gate open · ${this.duration}s · ${this.flood.en} spreading`,this.flood.color);Game.updateHUD();return true;
 },
 levelAt(x,y){const i=Math.floor(y/50)*MapSys.w+Math.floor(x/50);return this.dist?.[i]>=0?Math.max(0,Math.min(1,this.radius-this.dist[i])):0;},
 speed(){return (this.levelAt(Game.p.x,Game.p.y)>.25?this.flood.slow:1)*BossFight.slow();},
 update(dt){
  const wasOpen=this.remaining>0;
  if(wasOpen){this.remaining=Math.max(0,this.remaining-dt);this.radius+=dt*.7;}
  else this.radius=Math.max(0,this.radius-dt*3);
  if(wasOpen&&!this.remaining){this.latched=true;Game.msg(curLang==='CN'?'闸门闭合 · 返回机械开关重新拉闸':'Gate closed · return to the crank','#e6bc85');this.progress=0;}
  const near=Math.hypot(Game.p.x-this.switch.x,Game.p.y-this.switch.y)<55;
  if(!near)this.latched=false;
  if(near&&!Game.p.moving&&this.ready()&&!this.remaining&&!this.latched){this.progress+=dt;if(this.progress>=1)this.open();}else this.progress=0;
  const affected=this.levelAt(Game.p.x,Game.p.y)>.25;
  if(affected&&this.flood.harm){this.exposure+=dt;if(this.exposure>=this.flood.harm){Game.p.hit();this.exposure=0;}}else this.exposure=0;
  const count=Math.ceil(this.remaining);if(count!==this.notice){this.notice=count;Game.updateHUD();}
 },
 draw(ctx,left,right,top,bottom){
  if(this.radius<=0)return;
  const fog=this.flood.fog;
  ctx.save();ctx.beginPath();
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(MapSys.t[y*MapSys.w+x]!==1)ctx.rect(x*50,y*50,50,50);
  ctx.clip();
  for(let y=top-1;y<bottom+1;y++)for(let x=left-1;x<right+1;x++){
   const amount=this.levelAt(x*50+25,y*50+25);if(!amount)continue;
   const seed=Math.sin(x*127.1+y*311.7),px=x*50+25+seed*15,py=y*50+25+Math.cos(x*73+y*29)*15;
   const radius=38+amount*20+Math.sin(Game.elapsed*1.4+seed*5)*3;
   const gradient=ctx.createRadialGradient(px,py,0,px,py,radius);
   gradient.addColorStop(0,this.flood.base+'f0');gradient.addColorStop(.5,this.flood.color+'dd');gradient.addColorStop(.8,this.flood.color+'bb');gradient.addColorStop(1,this.flood.color+'00');
   ctx.globalAlpha=amount*(fog?.85:.95);ctx.fillStyle=gradient;ctx.fillRect(px-radius,py-radius,radius*2,radius*2);
   // Directional ripples and dual-tone highlights stay visible on every floor.
   ctx.globalAlpha=amount*.8;ctx.strokeStyle=this.flood.edge;ctx.lineWidth=this.flood.sprite===4?1.5:1;
   for(let k=0;k<3;k++){
    const shift=(Game.elapsed*(this.flood.sprite===4?9:5)+k*13+seed*10)%36;
    ctx.beginPath();
    if(this.flood.sprite===4){const sy=py-16+shift;ctx.moveTo(px-12,sy);ctx.bezierCurveTo(px-5,sy+3,px+seed*8,sy-3,px+13,sy+1);}
    else if(this.flood.fog){ctx.globalAlpha=amount*.18;ctx.ellipse(px+seed*7,py-16+shift,16+k*3,5+k,seed*.4,Math.PI*.15,Math.PI*.85);}
    else {ctx.ellipse(px+seed*7,py-16+shift,11+k*3,2.5+k,seed*.4,Math.PI*.15,Math.PI*.85);}
    ctx.stroke();
   }
   if((x*3+y*7)%4===0){ctx.globalAlpha=amount*.5;Art.mechanism(ctx,this.flood.sprite,px,py,72+seed*16);}
  }
  ctx.restore();
 }
};
