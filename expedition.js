// Fixed per-floor contents, reusable local keys and optional shifting shortcuts.
const TOMB_STYLES=[
 {name:'汉阙长陵',wall:12,floor:0,decor:0,filter:'sepia(.58) saturate(.9)',trap:1},
 {name:'千纹机关廊',wall:13,floor:1,decor:1,filter:'grayscale(.55) sepia(.18) brightness(.82)',trap:1},
 {name:'青铜兽影厅',wall:14,floor:2,decor:2,filter:'sepia(.45) hue-rotate(52deg) saturate(.8)',trap:2},
 {name:'巨鼎炼魂室',wall:15,floor:3,decor:3,filter:'brightness(.6) sepia(.55) saturate(1.35)',trap:3},
 {name:'石骨迷宫',wall:13,floor:4,decor:4,filter:'grayscale(.92) brightness(1.18) contrast(.9)',trap:4},
 {name:'荧光棺河',wall:13,floor:5,decor:5,filter:'hue-rotate(132deg) saturate(.72) brightness(.82)',trap:5},
 {name:'九字封印井',wall:15,floor:6,decor:6,filter:'sepia(.28) hue-rotate(242deg) saturate(1.15)',trap:6},
 {name:'暗影葬主殿',wall:12,floor:7,decor:7,filter:'hue-rotate(235deg) brightness(.5) saturate(.8)',trap:7},
 {name:'帝王沉眠室',wall:14,floor:8,decor:8,filter:'sepia(.9) saturate(1.42) contrast(1.05)',trap:8},
 {name:'永劫天陨塔',wall:15,floor:9,decor:9,filter:'hue-rotate(205deg) brightness(.66) saturate(1.3)',trap:9}
];
const Expedition={
 walls:[],switches:[],style:TOMB_STYLES[0],
 setup(){
  this.style=TOMB_STYLES[Game.lvl-1];this.walls=[];this.switches=[];Game.p.hasKey=false;
  Game.ents=Game.ents.filter(e=>!['coffin','ground_item','zombie','vermin'].includes(e.type));
  const rooms=World.rooms.filter(r=>!['entry','sanctuary'].includes(r.kind));
  let spots=FLOOR_PLANS[Game.lvl-1].coffinSlots.map(([x,y])=>({x,y,room:rooms.find(r=>World.inside(r,x,y))}));
  const royalRoom=Game.lvl===1?World.rooms.find(r=>r.kind==='main'):Game.exitRoom;
  const royalCenter={x:(royalRoom.x+royalRoom.w/2)*50,y:(royalRoom.y+royalRoom.h/2)*50};
  const main=spots.filter(p=>p.room===royalRoom).sort((a,b)=>Math.abs(Math.hypot(a.x-royalCenter.x,a.y-royalCenter.y)-80)-Math.abs(Math.hypot(b.x-royalCenter.x,b.y-royalCenter.y)-80))[0]||spots[0];spots=spots.filter(p=>p!==main);
  const mainCoffin=new Coffin(main.x,main.y,'exit_coffin');mainCoffin.royal=true;Game.spawn(mainCoffin);Game.mainCoffinPos={x:mainCoffin.x,y:mainCoffin.y};
  for(const offset of [-82,82])if(MapSys.canOccupy(mainCoffin.x+offset,mainCoffin.y-25,12))Game.spawn({type:'burial_decor',x:mainCoffin.x+offset,y:mainCoffin.y-25,sprite:this.style.decor,size:80,dead:0});
  const keySpot=spots.find(p=>p.room!==Game.exitRoom)||spots[0];spots=spots.filter(p=>p!==keySpot);
  const key=new Coffin(keySpot.x,keySpot.y,'key');Game.spawn(key);this.keyCoffin=key;
  // First find is a compass in a coffin; only one emergency wine sits in the open.
  this.zombieBudget=2*(3+Math.floor(Game.lvl/2));this.verminBudget=2*(1+Math.floor(Game.lvl/3));this.itemBudget=5+Game.lvl;
  const payloads=[{loot:['item_compass','item_candle']}];
  for(let i=1;i<this.zombieBudget;i++)payloads.push({enemy:i%3===1?'crawler':'zombie'});
  for(let i=0;i<this.verminBudget;i++)payloads.push({enemy:['worm','beetle','spider'][(i+Game.lvl-1)%3]});
  for(let i=0;i<this.itemBudget-3;i++){const code=i===0?'item_shovel':i===1?'item_jade':['item_wine','item_hoof','item_jade'][i%3];payloads.push({loot:[code]});}
  this.coffins=[];
  for(const payload of payloads){
   const p=spots.shift();if(!p){const c=this.coffins[this.coffins.length-1];c.extra.push(payload);continue;}
   const c=new Coffin(p.x,p.y,'cache');c.payload=payload;c.extra=[];this.coffins.push(c);Game.spawn(c);
  }
  const supply=this.coffins.filter(c=>c.payload.loot&&!c.payload.loot.includes('item_compass'));
  this.hidden=supply.slice(2,4);
  this.hidden.forEach(c=>{c.hidden=true;c.elevation=0;c.liftTarget=0;});

  Game.spawn(new GroundItem(Game.p.x+50,Game.p.y,'item_wine'));
  const scout=rooms[0];this.spawnEnemy('zombie',(scout.x+scout.w-1.5)*50,(scout.y+scout.h-1.5)*50);
  for(let i=0;i<rooms.length;i++){
   const r=rooms[i],size=r===Game.exitRoom?100:62;
   for(const side of [0,1])Game.spawn({type:'burial_decor',x:(r.x+(side?r.w-.65:.65))*50,y:(r.y+.8)*50,sprite:r===Game.exitRoom?this.style.decor:(this.style.decor+i%3)%10,size,dead:0});
  }
  Game.spawn({type:'arrival_coffin',x:Game.p.x,y:Game.p.y-65,dead:0});
  for(const [roomIndex,r] of World.rooms.filter(r=>r.kind!=='entry').entries()){
   for(let i=0;i<2;i++)Game.spawn({type:'bone_pile',x:(r.x+.75+i*(r.w-1.5))*50,y:(r.y+r.h-.7)*50,size:40+i*10,dead:0});
   if(r===Game.exitRoom||(roomIndex+Game.lvl)%3===0)Game.spawn({type:'tomb_remains',variant:(roomIndex+Game.lvl)%4,x:(r.x+r.w*.52)*50,y:(r.y+r.h*.68)*50,size:62+Math.min(20,Game.lvl*2),dead:0});
   if(Game.lvl>=7&&r===Game.exitRoom)Game.spawn({type:'tomb_remains',variant:2,x:(r.x+r.w*.28)*50,y:(r.y+r.h*.38)*50,size:88,dead:0});
  }
  this.buildWalls();this.placePots();TombDangers.setup();
 },
 spawnEnemy(kind,x,y,homeCoffin=null){
  if(kind==='zombie'||kind==='crawler'){
   const z=new Zombie(x,y,kind==='crawler'?0:SPECIES[Game.lvl-1].type);
   z.homeCoffin=homeCoffin||this.coffins?.slice().sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]||null;z.homeX=z.homeCoffin?.x??x;z.homeY=z.homeCoffin?z.homeCoffin.y+18:y;
   if(kind==='crawler'){z.crawler=true;z.spd=44+Game.lvl*2;z.species={...z.species,name:'伏地爬尸',en:'Crawling corpse',windup:.65,hop:2,size:68};}
   Game.spawn(z);
  }else Game.spawn(new TombCreature(x,y,kind));
 },
 spawnBloodCorpse(c){
  c.occupantEscaped=true;
  const base=SPECIES[Game.lvl-1],z=new Zombie(c.x,c.y+25,1);
  z.species={...base,name:'赤血厉尸',en:'Blood corpse',type:1,
   speed:Math.max(128,base.speed*1.32),sense:Math.max(285,base.sense+70),
   hop:Math.min(.45,base.hop*.7),windup:Math.min(.32,base.windup*.62),size:Math.max(94,base.size+14),
   filter:'saturate(1.9) hue-rotate(334deg) contrast(1.22) brightness(.82)'};
  z.zType=1;z.spd=z.species.speed;z.hp=12+Game.lvl*2;z.maxHp=z.hp;z.bloodCorpse=true;
  z.homeCoffin=c;z.homeX=c.x;z.homeY=c.y+18;Game.spawn(z);
  this.royalBeetleCount=3+Math.floor(Game.lvl/4);
  for(let i=0;i<this.royalBeetleCount;i++){
   const angle=Math.PI*.2+i*Math.PI*2/this.royalBeetleCount,bug=new TombCreature(c.x+Math.cos(angle)*32,c.y+35+Math.sin(angle)*22,'beetle');
   bug.stompable=true;Game.spawn(bug);
  }
  Game.msg(curLang==='CN'?'赤血厉尸破棺而出 · 尸鳖群涌出！':'A blood corpse erupts · corpse beetles swarm!','#dc4b48');
 },
 reveal(c){
  if(c.royal){this.spawnBloodCorpse(c);return true;}
  if(c.explosive){c.fuse=1.4;Game.msg(curLang==='CN'?'棺内火药嘶响！退后！':'Explosive coffin! Back away!','#ff986d');}
  if(c.content==='key'){Game.p.hasKey=true;Game.msg(curLang==='CN'?'青铜机关钥匙 · 可开启盗洞机关':'Bronze key · exit crank unlocked','#eac879');Game.updateHUD();return true;}
  if(c.content!=='cache')return false;
  for(const p of [c.payload,...c.extra]){
   if(p.enemy){if(p.enemy==='zombie'||p.enemy==='crawler')c.occupantEscaped=true;this.spawnEnemy(p.enemy,c.x,c.y+35,c);}
   if(p.loot)p.loot.forEach((code,i)=>{const item=new GroundItem(c.x+(i?35:-35),c.y+30,code);Game.spawn(item);});
  }
  Game.addText(c.x,c.y,c.payload.enemy?(curLang==='CN'?'棺中有异动！':'Something stirs!'):(curLang==='CN'?'取出随葬供物':'Burial supplies'),'#d2b38b');return true;
 },
 maybeDropRelic(c){
  if(c.relicRolled)return;c.relicRolled=true;
  if(!c.royal&&Math.random()>.3)return;
  const unlocked=Math.min(RELICS.length,3+Math.ceil((Game.lvl-1)/2)),index=Math.floor(Math.random()*unlocked);
  Game.spawn(new RelicItem(c.x+(Math.random()-.5)*42,c.y+42,index));
  Game.addText(c.x,c.y-18,curLang==='CN'?'棺中有古董冥器！':'An antique relic!','#f4d47f');
 },
 buildWalls(){
  this.sealedRooms=[];
  for(let y=2;y<MapSys.h-7&&this.walls.length<2;y++)for(let x=2;x<MapSys.w-7&&this.walls.length<2;x++){
   let solid=true;for(let yy=y;yy<y+5;yy++)for(let xx=x;xx<x+5;xx++)if(MapSys.t[yy*MapSys.w+xx]!==1)solid=false;
   if(!solid)continue;
   const sides=[{dx:2,dy:0,ox:2,oy:-1,ix:2,iy:1},{dx:2,dy:4,ox:2,oy:5,ix:2,iy:3},{dx:0,dy:2,ox:-1,oy:2,ix:1,iy:2},{dx:4,dy:2,ox:5,oy:2,ix:3,iy:2}];
   const side=sides.find(q=>MapSys.t[(y+q.oy)*MapSys.w+x+q.ox]!==1&&!this.sealedRooms.some(r=>World.inside(r,(x+q.ox)*50+25,(y+q.oy)*50+25)));
   if(!side)continue;
   const outside={x:(x+side.ox)*50+25,y:(y+side.oy)*50+25};
   if(Game.ents.some(e=>e.type==='coffin'&&Math.hypot(e.x-outside.x,e.y-outside.y)<65)||this.switches.some(e=>Math.hypot(e.x-outside.x,e.y-outside.y)<80))continue;
   const room={x:x+1,y:y+1,w:3,h:3,kind:'sealed',opened:false};const id=World.rooms.length;World.rooms.push(room);this.sealedRooms.push(room);
   for(let yy=y+1;yy<y+4;yy++)for(let xx=x+1;xx<x+4;xx++){MapSys.t[yy*MapSys.w+xx]=0;World.roomTiles[yy*MapSys.w+xx]=id;}
   const dx=x+side.dx,dy=y+side.dy;
   const wall={at:dy*MapSys.w+dx,x:dx*50+25,y:dy*50+25,type:'moving_wall',mode:this.walls.length?'slide':'lift',height:1,target:1,manual:true,room,dead:0};this.walls.push(wall);
   const loot=this.coffins.find(c=>!c.hidden&&!c.locked&&!c.sealed&&c.payload?.loot&&!c.payload.loot.includes('item_compass')&&!c.payload.loot.includes('item_candle'));
   if(!loot)throw new Error('Sealed chamber must contain supplies');
   if(loot){loot.x=(x+2)*50+25;loot.y=(y+2)*50+25;loot.sealed=true;}
   Game.spawn({type:'burial_decor',x:(x+3.4)*50,y:(y+1.5)*50,sprite:this.style.decor,size:48,dead:0});
  }
 },
 update(dt){
  TombDangers.update(dt);if(!Game.running)return;
  let changed=false;
  for(const c of this.hidden)if(c.hidden&&!c.rising&&Math.hypot(c.x-Game.p.x,c.y-Game.p.y)<100){c.rising=true;c.liftTarget=1;AudioSys.playOpen();}
  for(const c of this.hidden)if(c.rising){c.elevation=Math.max(0,Math.min(1,c.elevation+(c.liftTarget?1:-1)*dt*.65));if(c.elevation===c.liftTarget && (c.liftTarget===0||Math.hypot(c.x-Game.p.x,c.y-Game.p.y)>=34)){c.hidden=c.elevation===0;c.rising=false;}}
  for(const w of this.walls){
   const dx=Math.max(0,Math.abs(Game.p.x-w.x)-25),dy=Math.max(0,Math.abs(Game.p.y-w.y)-25);
   if(Math.hypot(dx,dy)<=12&&!w.triggered){w.triggered=true;Scene.invalidateTerrain();}
   w.target=w.triggered?0:1;
   if(!w.triggered)continue;
   w.height=Math.max(0,w.height-dt*.25);
   const solid=w.height>.08;
   if(!solid)w.room.opened=true;
   if((MapSys.t[w.at]===1)!==solid){MapSys.t[w.at]=solid?1:0;changed=true;}
  }
  if(changed){Scene.invalidateTerrain();ExitGate.rebuildDistance();}
 },
 visualWallAt(at){return this.walls?.some(w=>w.at===at&&w.triggered);},
 hiddenRoomAt(x,y){return this.sealedRooms?.find(r=>!r.opened&&World.inside(r,x,y));},
 drawHiddenRooms(ctx){ctx.save();ctx.filter='blur(13px)';ctx.fillStyle='rgba(3,6,8,.94)';for(const r of this.sealedRooms||[])if(!r.opened){const x=r.x*50+5,y=r.y*50+5,w=r.w*50-10,h=r.h*50-10;ctx.beginPath();ctx.roundRect?.(x,y,w,h,24);if(!ctx.roundRect)ctx.rect(x,y,w,h);ctx.fill();}ctx.restore();},
 placePots(){
  Game.ents=Game.ents.map(e=>e.type==='burial_decor'&&[4,5].includes(e.sprite)?new TombPot(e.x,e.y,e.sprite,e.size):e);
  for(const r of World.rooms.filter(r=>!['entry','sanctuary','sealed'].includes(r.kind))){
   for(const side of [0,1]){const x=(r.x+(side?r.w-1.5:1.5))*50,y=(r.y+r.h/2)*50;
    if(MapSys.canOccupy(x,y,12)&&!Game.ents.some(e=>Math.hypot(e.x-x,e.y-y)<65))Game.spawn(new TombPot(x,y,(Game.lvl+side)%2?4:5,78));
   }
  }
 },
 render(ctx,e){
  const cn=curLang==='CN';
  if(TombDangers.render(ctx,e))return true;
  if(e.type==='pot'){e.draw(ctx);return true;}
  if(e.type==='burial_decor'){Art.expeditionSprite(ctx,e.sprite,e.x,e.y,e.size);return true;}
  if(e.type==='moving_wall'){
   if(!e.triggered)return true;
   ctx.save();ctx.fillStyle='#04090baa';ctx.fillRect(e.x-25,e.y-25,50,50);
   if(e.height>.03){const shift=e.mode==='slide'?(1-e.height)*40:0;ctx.globalAlpha=e.height;Art.stoneSurface(ctx,true,Math.floor(e.x/50),Math.floor(e.y/50),e.x-25+shift,e.y-25-(e.mode==='lift'?e.height*18:0),50,50);}
   ctx.restore();return true;
  }
  if(e.type==='vermin'||e.crawler){
   const sprite=e.crawler?10:{worm:11,beetle:12,spider:13}[e.kind];
   const t=Game.elapsed*(e.crawler?6:9),size=e.crawler?72:e.kind==='spider'?36:29;
   ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.atan2(Game.p.y-e.y,Game.p.x-e.x)-Math.PI/2);
   if(e.crawler&&Art.crawlerMotion)Art.motionFrame(ctx,Art.crawlerMotion,Math.floor(t)%4,0,0,size);
   else {ctx.scale(1+Math.sin(t)*.08,1-Math.sin(t)*.035);Art.expeditionSprite(ctx,sprite,0,0,size);}
   ctx.restore();
   if(e.windup>0||e.attackState==='windup')Art.label(ctx,e.x,e.y-35,'!','#ff9b7b');return true;
  }
  return false;
 }
};
class TombPot{
 constructor(x,y,sprite=4,size=78){Object.assign(this,{x,y,sprite,size,type:'pot',hp:2,dead:0,hitTimer:0});}
 damage(amount=1){
  if(this.dead||this.hitTimer>0)return false;this.hp-=amount;this.hitTimer=.3;AudioSys.playStomp();
  if(this.hp>0)return true;
  this.dead=1;Game.spawn(new Effect(this.x,this.y,'dust'));
  const roll=Math.random();
  if(roll<.12){const code=['item_wine','item_candle','item_hoof'][Math.floor(Math.random()*3)];Game.spawn(new GroundItem(this.x,this.y,code));}
  else if(roll<.54){for(let i=0;i<1+Math.floor(Math.random()*3);i++){const bug=new TombCreature(this.x,this.y,i%2?'spider':'beetle');bug.stompable=true;Game.spawn(bug);}}
  return true;
 }
 update(dt){this.hitTimer=Math.max(0,this.hitTimer-dt);}
 draw(ctx){ctx.save();if(this.hitTimer>0)ctx.filter='brightness(1.35)';Art.expeditionSprite(ctx,this.sprite,this.x+Math.sin(this.hitTimer*70)*this.hitTimer*7,this.y,this.size);if(this.hp===1){ctx.strokeStyle='#17110ddd';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(this.x-5,this.y-this.size*.58);ctx.lineTo(this.x+3,this.y-this.size*.36);ctx.lineTo(this.x-6,this.y-this.size*.18);ctx.stroke();}ctx.restore();}
}
class TombCreature{
 constructor(x,y,kind){if(kind==='bat')kind='spider';Object.assign(this,{x,y,kind,type:'vermin',dead:0,cooldown:1,windup:0});}
 update(dt,p){
  if(this.dead)return;
  const d=Math.hypot(p.x-this.x,p.y-this.y);
  if(this.stompable&&d<20&&(p.moving||p.rollTime>0)){this.dead=1;AudioSys.playStomp();Game.spawn(new Effect(this.x,this.y,'dust'));return;}
  this.cooldown=Math.max(0,this.cooldown-dt);
  if(p.buffs.hoof>0){this.windup=0;return;}
  if(this.windup>0){this.windup=Math.max(0,this.windup-dt);if(!this.windup){if(d<34&&MapSys.lineClear(this.x,this.y,p.x,p.y))p.hit();this.cooldown=1.8;}return;}
  if(d<28&&!this.cooldown){this.windup=.55;return;}
  if(d>220||d<25)return;
  const speed={worm:24,beetle:49,spider:66}[this.kind]||42,angle=Math.atan2(p.y-this.y,p.x-this.x)+(this.kind==='spider'?Math.sin(Game.elapsed*3)*.5:0);
  const x=this.x+Math.cos(angle)*speed*dt,y=this.y+Math.sin(angle)*speed*dt;
  if(MapSys.canOccupy(x,this.y,7))this.x=x;if(MapSys.canOccupy(this.x,y,7))this.y=y;
 }
}
