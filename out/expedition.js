// Fixed per-floor contents, reusable local keys and optional shifting shortcuts.
const TOMB_STYLES=[
 {name:'黄沙石祠',wall:12,floor:0,decor:0,filter:'sepia(.5)',trap:1},
 {name:'木构机弩廊',wall:13,floor:1,decor:1,filter:'sepia(.7) brightness(.85)',trap:1},
 {name:'青铜兽面殿',wall:14,floor:2,decor:2,filter:'sepia(.5) hue-rotate(35deg)',trap:2},
 {name:'焦石炼魂炉',wall:15,floor:3,decor:3,filter:'brightness(.65) sepia(.4)',trap:3},
 {name:'白骨石椁窟',wall:13,floor:4,decor:4,filter:'grayscale(1) brightness(1.25)',trap:4},
 {name:'水蚀棺河殿',wall:13,floor:5,decor:5,filter:'hue-rotate(125deg) saturate(.6)',trap:5},
 {name:'朱砂封印宫',wall:15,floor:6,decor:6,filter:'sepia(.5) hue-rotate(290deg)',trap:6},
 {name:'古根葬林',wall:12,floor:7,decor:7,filter:'sepia(.7) hue-rotate(40deg)',trap:7},
 {name:'鎏金帝陵',wall:14,floor:8,decor:8,filter:'sepia(.8) saturate(1.3)',trap:8},
 {name:'天陨玄宫',wall:15,floor:9,decor:9,filter:'hue-rotate(220deg) brightness(.8)',trap:9}
];
const RELIC_VALUES=[1200,1800,2600,3300,4200,5600,6800,8500,12000,18000];
const Expedition={
 walls:[],switches:[],style:TOMB_STYLES[0],
 setup(){
  this.style=TOMB_STYLES[Game.lvl-1];this.walls=[];this.switches=[];Game.p.hasKey=false;
  Game.ents=Game.ents.filter(e=>!['coffin','ground_item','zombie','vermin'].includes(e.type));
  const rooms=World.rooms.filter(r=>!['entry','sanctuary'].includes(r.kind));
  let spots=[];
  for(const r of rooms)for(let y=r.y+1;y<r.y+r.h-1;y+=2)for(let x=r.x+1;x<r.x+r.w-1;x+=2){
   const p={x:x*50+25,y:y*50+25,room:r};
   if(Math.hypot(p.x-Game.exitPos.x,p.y-Game.exitPos.y)<85||World.altars.some(a=>Math.hypot(a.x-p.x,a.y-p.y)<75))continue;
   spots.push(p);
  }
  for(let i=spots.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[spots[i],spots[j]]=[spots[j],spots[i]];}
  const main=spots.filter(p=>p.room===Game.exitRoom).sort((a,b)=>Math.abs(Math.hypot(a.x-Game.exitPos.x,a.y-Game.exitPos.y)-120)-Math.abs(Math.hypot(b.x-Game.exitPos.x,b.y-Game.exitPos.y)-120))[0]||spots[0];spots=spots.filter(p=>p!==main);
  const relic=new Coffin(main.x,main.y,'artifact');relic.royal=true;Game.spawn(relic);Game.artifactPos={x:relic.x,y:relic.y};
  for(const offset of [-82,82])if(MapSys.canOccupy(relic.x+offset,relic.y-25,12))Game.spawn({type:'burial_decor',x:relic.x+offset,y:relic.y-25,sprite:this.style.decor,size:80,dead:0});
  const keySpot=spots.find(p=>p.room!==Game.exitRoom)||spots[0];spots=spots.filter(p=>p!==keySpot);
  const key=new Coffin(keySpot.x,keySpot.y,'key');Game.spawn(key);this.keyCoffin=key;
  // First find is a compass in a coffin; only one emergency wine sits in the open.
  this.zombieBudget=3+Math.floor(Game.lvl/2);this.verminBudget=1+Math.floor(Game.lvl/3);this.itemBudget=5+Game.lvl;
  const payloads=[{loot:['item_compass','item_candle']}];
  for(let i=1;i<this.zombieBudget;i++)payloads.push({enemy:i%3===1?'crawler':'zombie'});
  for(let i=0;i<this.verminBudget;i++)payloads.push({enemy:['worm','beetle','spider','bat'][(i+Game.lvl-1)%4]});
  for(let i=0;i<this.itemBudget-3;i++){const code=['item_wine','item_hoof','item_jade'][i%3];payloads.push({loot:[code]});}
  this.coffins=[];
  for(const payload of payloads){
   const p=spots.shift();if(!p){const c=this.coffins[this.coffins.length-1];c.extra.push(payload);continue;}
   const c=new Coffin(p.x,p.y,'cache');c.payload=payload;c.extra=[];this.coffins.push(c);Game.spawn(c);
  }
  const supply=this.coffins.filter(c=>c.payload.loot&&!c.payload.loot.includes('item_compass'));
  this.hidden=supply.slice(0,Math.min(2,supply.length));
  this.hidden.forEach(c=>{c.hidden=true;c.elevation=0;c.liftTarget=0;});
  this.lockedCoffin=supply.find(c=>!this.hidden.includes(c));if(this.lockedCoffin)this.lockedCoffin.locked=true;
  Game.spawn(new GroundItem(Game.p.x+50,Game.p.y,'item_wine'));
  const scout=rooms[0];this.spawnEnemy('zombie',(scout.x+scout.w-1.5)*50,(scout.y+scout.h-1.5)*50);
  for(let i=0;i<rooms.length;i++){
   const r=rooms[i],size=r===Game.exitRoom?100:62;
   for(const side of [0,1])Game.spawn({type:'burial_decor',x:(r.x+(side?r.w-.65:.65))*50,y:(r.y+.8)*50,sprite:r===Game.exitRoom?this.style.decor:(this.style.decor+i%3)%10,size,dead:0});
  }
  const switchRoom=rooms.find(r=>r!==Game.exitRoom)||rooms[0];
  const freeSpot=(r,offset)=>{for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){
   const p={x:x*50+25,y:y*50+25};if(Math.hypot(p.x-Game.exitPos.x,p.y-Game.exitPos.y)>100&&!Game.ents.some(e=>e.type==='coffin'&&Math.hypot(e.x-p.x,e.y-p.y)<65)&&!this.switches.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<90)&&!World.altars.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<65))return p;
  }return {x:(r.x+.5)*50,y:(r.y+.5+offset)*50};};
  for(const [i,kind] of ['coffin','wall','trap'].entries())this.switches.push({...freeSpot(switchRoom,i),type:'lock_switch',kind,progress:0,latched:false,cooldown:0});
  this.buildWalls();
 },
 spawnEnemy(kind,x,y){
  if(kind==='zombie'||kind==='crawler'){
   const z=new Zombie(x,y,kind==='crawler'?0:SPECIES[Game.lvl-1].type);
   if(kind==='crawler'){z.crawler=true;z.spd=44+Game.lvl*2;z.species={...z.species,name:'伏地爬尸',en:'Crawling corpse',windup:.65,hop:2,size:68};}
   Game.spawn(z);
  }else Game.spawn(new TombCreature(x,y,kind));
 },
 reveal(c){
  if(c.content==='key'){Game.p.hasKey=true;Game.msg(curLang==='CN'?'青铜机关钥匙 · 本层开关已解锁':'Bronze key · floor mechanisms unlocked','#eac879');Game.updateHUD();return true;}
  if(c.content!=='cache')return false;
  for(const p of [c.payload,...c.extra]){
   if(p.enemy)this.spawnEnemy(p.enemy,c.x,c.y+35);
   if(p.loot)p.loot.forEach((code,i)=>{const item=new GroundItem(c.x+(i?35:-35),c.y+30,code);Game.spawn(item);});
  }
  Game.addText(c.x,c.y,c.payload.enemy?(curLang==='CN'?'棺中有异动！':'Something stirs!'):(curLang==='CN'?'取出随葬供物':'Burial supplies'),'#d2b38b');return true;
 },
 buildWalls(){
  const candidates=[];
  for(let y=2;y<MapSys.h-2;y++)for(let x=2;x<MapSys.w-2;x++){
   const at=y*MapSys.w+x;if(MapSys.t[at]!==1)continue;
   const h=MapSys.t[at-1]!==1&&MapSys.t[at+1]!==1,v=MapSys.t[at-MapSys.w]!==1&&MapSys.t[at+MapSys.w]!==1;
   if(!h&&!v)continue;
   const px=x*50+25,py=y*50+25;
   if(Math.hypot(px-Game.p.x,py-Game.p.y)<150||Math.hypot(px-Game.exitPos.x,py-Game.exitPos.y)<140)continue;
   if(this.walls.some(w=>Math.hypot(w.x-px,w.y-py)<220))continue;
   candidates.push({at,x:px,y:py,axis:h?'y':'x'});
  }
  if(!candidates.length){
   outer:for(const room of World.rooms.filter(r=>r.kind!=='entry'))for(let y=room.y+1;y<room.y+room.h-1;y++)for(let x=room.x+1;x<room.x+room.w-1;x++){
    const px=x*50+25,py=y*50+25,at=y*MapSys.w+x;
    if(Math.hypot(px-Game.exitPos.x,py-Game.exitPos.y)<100||Game.ents.some(e=>Math.hypot(e.x-px,e.y-py)<65)||World.altars.some(e=>Math.hypot(e.x-px,e.y-py)<70)||this.switches.some(e=>Math.hypot(e.x-px,e.y-py)<70))continue;
    if([-61,-60,-59,-1,0,1,59,60,61].some(d=>MapSys.t[at+d]===1))continue;
    MapSys.t[at]=1;candidates.push({at,x:px,y:py,axis:'x'});break outer;
   }
  }
  // These are additional shortcuts through previously solid walls, never the only route.
  for(const [i,p] of candidates.slice(0,4).entries())this.walls.push({...p,type:'moving_wall',mode:i%2?'slide':'lift',height:1,target:1,phase:i*2,manual:i===0,dead:0});
 },
 useSwitch(s){
  if(!Game.p.hasKey){Game.msg(curLang==='CN'?'需要青铜钥匙 · 在普通棺材中寻找':'Find the bronze key inside a coffin','#d7ba8d');return false;}
  if(s.kind==='coffin'){
   this.hidden.filter(c=>!c.opened).forEach(c=>{c.liftTarget=c.liftTarget?0:1;c.rising=true;c.hidden=true;});
   if(this.lockedCoffin){this.lockedCoffin.locked=false;this.lockedCoffin.open();}
  }
  if(s.kind==='wall')this.walls.forEach(w=>{w.manual=true;w.target=w.target?0:1;});
  if(s.kind==='trap'){s.warning=1.2;s.cooldown=5;Game.msg(curLang==='CN'?'机关失控！离开红色区域':'Trap armed! Leave the red area','#f39b7b');}
  else Game.msg(curLang==='CN'?(s.kind==='coffin'?'地宫升棺 · 隐藏石椁显现':'石壁移位 · 甬道改道'):'Mechanism activated','#d2b483');
  AudioSys.playOpen();return true;
 },
 update(dt){
  let changed=false;
  for(const c of this.hidden)if(c.rising){c.elevation=Math.max(0,Math.min(1,c.elevation+(c.liftTarget?1:-1)*dt*.65));if(c.elevation===c.liftTarget){c.hidden=c.elevation===0;c.rising=false;}}
  for(const s of this.switches){
   const near=Math.hypot(s.x-Game.p.x,s.y-Game.p.y)<48;
   s.cooldown=Math.max(0,s.cooldown-dt);
   if(!near)s.latched=false;
   if(near&&!Game.p.moving&&!s.latched&&!s.cooldown){s.progress+=dt;if(s.progress>=.8){s.latched=true;s.progress=0;this.useSwitch(s);}}else s.progress=0;
   if(s.warning>0){s.warning=Math.max(0,s.warning-dt);if(s.warning===0){for(let i=0;i<8;i++)Game.spawn(new Projectile(s.x,s.y,i*Math.PI/4,World.theme.trap==='MIX'?'ARROW':World.theme.trap));if(Math.hypot(s.x-Game.p.x,s.y-Game.p.y)<65)Game.p.hit();}}
  }
  for(const w of this.walls){
   if(!w.manual){const phase=(Game.elapsed+w.phase)%12;w.warning=phase>5&&phase<6||phase>11;w.target=phase<6?1:0;}
   const occupied=Game.ents.some(e=>['player','zombie','vermin'].includes(e.type)&&Math.abs(e.x-w.x)<39&&Math.abs(e.y-w.y)<39);
   if(w.target&&occupied)continue;
   w.height=Math.max(0,Math.min(1,w.height+(w.target?1:-1)*dt*.55));
   const solid=w.height>.65;
   if((MapSys.t[w.at]===1)!==solid){MapSys.t[w.at]=solid?1:0;changed=true;}
  }
  if(changed)ExitGate.rebuildDistance();
 },
 render(ctx,e){
  const cn=curLang==='CN';
  if(e.type==='burial_decor'){Art.expeditionSprite(ctx,e.sprite,e.x,e.y,e.size);return true;}
  if(e.type==='lock_switch'){
   Art.mechanism(ctx,14,e.x,e.y,52);const labels={coffin:'升棺锁',wall:'移壁锁',trap:'兽面锁'};
   if(Math.hypot(Game.p.x-e.x,Game.p.y-e.y)<150)Art.label(ctx,e.x,e.y-44,(cn?labels[e.kind]:e.kind)+(Game.p.hasKey?(cn?' · 驻足开启':' · activate'):' · 🔑'),'#e3c798');
   if(e.progress)Art.progress(ctx,e.x,e.y-30,e.progress/.8,'#daba76');
   if(e.warning>0){ctx.strokeStyle='#ff684b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,65,0,Math.PI*2);ctx.stroke();Art.label(ctx,e.x,e.y-65,cn?'退后！':'BACK!','#ff8266');}return true;
  }
  if(e.type==='moving_wall'){
   ctx.save();ctx.fillStyle='#04090baa';ctx.fillRect(e.x-25,e.y-25,50,50);
   if(e.height>.03){const shift=e.mode==='slide'?(1-e.height)*40:0;ctx.globalAlpha=e.height;Art.stoneSurface(ctx,true,Math.floor(e.x/50),Math.floor(e.y/50),e.x-25+shift,e.y-25-(e.mode==='lift'?e.height*18:0),50,50);}
   ctx.globalAlpha=1;ctx.strokeStyle=e.target?'#c59861':'#7eaba1';ctx.lineWidth=2;ctx.strokeRect(e.x-24,e.y-24,48,48);if(e.warning&&Math.hypot(Game.p.x-e.x,Game.p.y-e.y)<180)Art.label(ctx,e.x,e.y-46,cn?'石壁将动':'WALL SHIFT','#e9ae76');ctx.restore();return true;
  }
  if(e.type==='vermin'||e.crawler){
   const sprite=e.crawler?10:{worm:11,beetle:12,spider:13,bat:14}[e.kind];
   const t=Game.elapsed*(e.crawler?5:e.kind==='bat'?15:9),size=e.crawler?65:e.kind==='bat'?49:e.kind==='spider'?36:29;
   ctx.save();ctx.translate(e.x,e.y+(e.kind==='bat'?-14:0));ctx.rotate(Math.atan2(Game.p.y-e.y,Game.p.x-e.x)-Math.PI/2);ctx.scale(1+Math.sin(t)*.08,1-Math.sin(t)*.035);Art.expeditionSprite(ctx,sprite,0,0,size);ctx.restore();
   if(e.windup>0||e.attackState==='windup')Art.label(ctx,e.x,e.y-35,'!','#ff9b7b');return true;
  }
  return false;
 }
};
class TombCreature{
 constructor(x,y,kind){Object.assign(this,{x,y,kind,type:'vermin',dead:0,cooldown:1,windup:0});}
 update(dt,p){
  const d=Math.hypot(p.x-this.x,p.y-this.y);this.cooldown=Math.max(0,this.cooldown-dt);
  if(p.buffs.hoof>0){this.windup=0;return;}
  if(this.windup>0){this.windup=Math.max(0,this.windup-dt);if(!this.windup){if(d<34&&MapSys.lineClear(this.x,this.y,p.x,p.y))p.hit();this.cooldown=1.8;}return;}
  if(d<28&&!this.cooldown){this.windup=.55;return;}
  if(d>220||d<25)return;
  const speed={worm:24,beetle:49,spider:66,bat:88}[this.kind],angle=Math.atan2(p.y-this.y,p.x-this.x)+(this.kind==='spider'?Math.sin(Game.elapsed*3)*.5:0);
  const x=this.x+Math.cos(angle)*speed*dt,y=this.y+Math.sin(angle)*speed*dt;
  if(MapSys.canOccupy(x,this.y,7))this.x=x;if(MapSys.canOccupy(this.x,y,7))this.y=y;
 }
}
