// One unique guardian per royal coffin; telegraphs lock their aim before damage.
const BOSS_SPECS=[
 {name:'玄甲镇陵侯',en:'Marquis of the Tomb',skill:'长戟横扫',pattern:'cleave',color:'#c6a06d'},
 {name:'千机弩魁',en:'Thousand-Bolt Sentinel',skill:'扇形连弩',pattern:'fan',color:'#91a5ab'},
 {name:'饕餮铜尊',en:'Bronze Taotie',skill:'蓄力冲撞',pattern:'charge',color:'#68c5ad'},
 {name:'赤鼎焚魂魈',en:'Soul Furnace',skill:'三重焚魂火',pattern:'fire',color:'#ff884d'},
 {name:'白骨织迷君',en:'Bone Weaver',skill:'交叉骨刺',pattern:'bones',color:'#e4dccb'},
 {name:'沉河萤棺姬',en:'River Coffin Queen',skill:'毒潮与迟滞水域',pattern:'tide',color:'#60d9e8'},
 {name:'九篆缚灵司',en:'Nine-Seal Warden',skill:'环阵缚灵',pattern:'sigils',color:'#c295ef'},
 {name:'无面葬影',en:'Faceless Shadow',skill:'瞬移影袭',pattern:'shadow',color:'#ae96df'},
 {name:'赤金不朽帝',en:'Undying Emperor',skill:'金石弹幕与禁卫',pattern:'emperor',color:'#efbf64'},
 {name:'陨星永劫君',en:'Eternal Starfall',skill:'陨星、火环与冲锋',pattern:'starfall',color:'#91bafa'}
];
const BossFight={
 boss:null,cleared:false,marks:[],
 ui(active){for(const id of ['room-panel','map-panel','objective']){const el=document.getElementById(id);if(el)el.style.visibility=active?'hidden':'';}},
 reset(){this.boss=null;this.cleared=false;this.marks=[];this.ui(false);},
 summon(c){
  if(!c.royal||this.boss||this.cleared)return false;
  const b=new TombBoss(c.x,c.y,Game.lvl);this.boss=b;Game.spawn(b);this.ui(true);
  if(!Game.p.hasShovel)Game.getItem('item_shovel');
  ExitGate.remaining=0;ExitGate.progress=0;
  Game.msg(curLang==='CN'?`${b.spec.name}苏醒！避开红色预警，靠近自动攻击。`:`${b.spec.en} awakens! Dodge warnings and approach to attack.`,b.spec.color);Game.updateHUD();return true;
 },
 defeat(b){
  if(b.dead)return;
  Game.spawn(new BossDeath(b));
  b.dead=1;this.cleared=true;this.marks=[];this.ui(false);
  for(const e of Game.ents)if(e.bossOwned)e.dead=1;
  Game.p.hp=Math.min(5,Game.p.hp+1);Game.msg(curLang==='CN'?`${b.spec.name}已败 · 恢复一格体力`:`${b.spec.en} defeated · one heart restored`,b.spec.color);Game.updateHUD();
 },
 mark(x,y,r=55,kind='blast',extra={}){if(MapSys.get(x,y)!==1)this.marks.push({x,y,r,kind,delay:.85,life:kind==='pool'?4:.3,...extra});},
 contains(m,p){if(m.kind==='line'){const dx=p.x-m.x,dy=p.y-m.y;const along=dx*Math.cos(m.angle)+dy*Math.sin(m.angle);return along>=0&&along<=m.length&&Math.abs(-dx*Math.sin(m.angle)+dy*Math.cos(m.angle))<m.r;}return Math.hypot(p.x-m.x,p.y-m.y)<m.r;},
 update(dt){
  for(const m of this.marks){if(m.delay>0){m.delay-=dt;if(m.delay>0)continue;if(m.kind==='shadow'&&this.boss&&!this.boss.dead&&MapSys.canOccupy(m.x,m.y,12)){this.boss.x=m.x;this.boss.y=m.y;this.boss.phaseT=.45;}}else m.life-=dt;
   if(!m.harmless&&m.kind!=='pool'&&this.contains(m,Game.p)&&MapSys.lineClear(m.x,m.y,Game.p.x,Game.p.y))Game.p.hit();
  }this.marks=this.marks.filter(m=>m.life>0);
 },
 slow(){return this.marks.some(m=>m.kind==='pool'&&m.delay<=0&&this.contains(m,Game.p))?.55:1;},
 drawMarks(ctx){for(const m of this.marks){ctx.save();ctx.translate(m.x,m.y);ctx.strokeStyle=m.delay>0?'#ffae76':'#ff634d';ctx.fillStyle=m.delay>0?'#ff4a3425':'#fc523953';ctx.lineWidth=2;ctx.beginPath();if(m.kind==='line'){ctx.rotate(m.angle);ctx.rect(0,-m.r,m.length,m.r*2);}else ctx.arc(0,0,m.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}},
 drawHUD(ctx,w){const b=this.boss;if(!b||b.dead)return;const width=Math.min(300,w-32),x=(w-width)/2,y=155;ctx.save();ctx.fillStyle='#080c13ed';ctx.fillRect(x-8,y-29,width+16,66);ctx.textAlign='center';ctx.fillStyle=b.spec.color;ctx.font='bold 16px serif';ctx.fillText((curLang==='CN'?b.spec.name:b.spec.en)+(b.enraged?' · '+(curLang==='CN'?'狂暴':'ENRAGED'):''),w/2,y-9,width);ctx.fillStyle='#403033';ctx.fillRect(x,y,width,9);ctx.fillStyle=b.spec.color;ctx.fillRect(x,y,width*b.hp/b.maxHp,9);ctx.font='12px sans-serif';ctx.fillStyle='#e4d9cc';ctx.fillText(curLang==='CN'?b.spec.skill+' · 避开红色预警':'Dodge warnings · approach to attack',w/2,y+26,width);ctx.restore();}
};
class TombBoss{
 constructor(x,y,level){Object.assign(this,{x,y,level,type:'boss',dead:0,spec:BOSS_SPECS[level-1],maxHp:12+level*4,hp:12+level*4,speed:42+level*3.5,rise:1.6,cooldown:1.4,windup:0,charge:0,hitTimer:0,attackIndex:0,aim:0,enraged:false,animTime:0,stride:0,moving:false,facing:1,attackT:0,attackPattern:null,phaseT:0});}
 damage(n){if(this.dead||this.rise>0||this.hitTimer>0)return false;this.hp=Math.max(0,this.hp-n);this.hitTimer=.45;Game.addText(this.x,this.y,'−'+n,'#ffd4a3');if(!this.hp)BossFight.defeat(this);else this.enraged=this.hp<=this.maxHp/2;return true;}
 move(dx,dy){const ox=this.x,oy=this.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/8));for(let i=0;i<steps;i++){if(MapSys.canOccupy(this.x+dx/steps,this.y,12))this.x+=dx/steps;if(MapSys.canOccupy(this.x,this.y+dy/steps,12))this.y+=dy/steps;}const distance=Math.hypot(this.x-ox,this.y-oy);this.moving=distance>.01;this.stride+=distance*.12;if(Math.abs(this.x-ox)>.01)this.facing=this.x>ox?1:-1;}
 waypoint(p){
  if(MapSys.lineClear(this.x,this.y,p.x,p.y))return p;
  const w=MapSys.w,start=Math.floor(this.y/50)*w+Math.floor(this.x/50),end=Math.floor(p.y/50)*w+Math.floor(p.x/50),prev=new Int16Array(w*MapSys.h).fill(-1),q=[start];prev[start]=start;
  for(let i=0;i<q.length&&prev[end]<0;i++)for(const to of [q[i]-1,q[i]+1,q[i]-w,q[i]+w]){if(to<0||to>=prev.length||prev[to]>=0||Math.abs(to%w-q[i]%w)>1||MapSys.t[to]===1)continue;prev[to]=q[i];q.push(to);}
  if(prev[end]<0)return this;let next=end;while(prev[next]!==start&&next!==start)next=prev[next];return {x:next%w*50+25,y:Math.floor(next/w)*50+25};
 }
 shoot(angle,type='ARROW'){const s=new Projectile(this.x,this.y,angle,type,'boss');s.bossOwned=true;Game.spawn(s);}
 release(){
  const p=this.locked,n=this.enraged?2:0;let pattern=this.spec.pattern;
  if(pattern==='starfall')pattern=['meteors','ring','charge'][this.attackIndex%3];this.attackIndex++;
  this.attackPattern=pattern;this.attackT=.62;
  if(pattern==='cleave')BossFight.mark(this.x,this.y,30,'line',{angle:this.aim,length:155,delay:.18});
  if(pattern==='fan')for(let i=0;i<5+n;i++)this.shoot(this.aim+(i-(4+n)/2)*.19);
  if(pattern==='charge')this.charge=.62;
  if(pattern==='fire'||pattern==='meteors')for(let i=0;i<(pattern==='fire'?3+n:6+n);i++){const a=i*2.4,r=i?45+i*12:0;BossFight.mark(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,pattern==='fire'?44:50);}
  if(pattern==='bones')for(let i=0;i<2;i++)BossFight.mark(p.x-Math.cos(this.aim+i*Math.PI/2)*95,p.y-Math.sin(this.aim+i*Math.PI/2)*95,19,'line',{angle:this.aim+i*Math.PI/2,length:190});
  if(pattern==='tide'){for(let i=0;i<7+n;i++)this.shoot(this.aim+i*Math.PI*2/(7+n),'VENOM');BossFight.mark(p.x,p.y,90,'pool');}
  if(pattern==='sigils')for(let i=0;i<4+n;i++){const a=i*Math.PI*2/(4+n);BossFight.mark(p.x+Math.cos(a)*78,p.y+Math.sin(a)*78,48);}
  if(pattern==='shadow')BossFight.mark(p.x,p.y,65,'shadow');
  if(pattern==='emperor'){for(let i=0;i<8+n;i++)this.shoot(i*Math.PI*2/(8+n),'STONE');if(Game.ents.filter(e=>e.bossOwned&&e.type==='zombie'&&!e.dead).length<2){const z=new Zombie(this.x,this.y,0);z.bossOwned=true;Game.spawn(z);}}
  if(pattern==='ring')for(let i=0;i<12+n;i++)this.shoot(i*Math.PI*2/(12+n),'FIRE');
 }
 update(dt,p){
  if(this.dead)return;this.animTime+=dt;this.moving=false;this.attackT=Math.max(0,this.attackT-dt);this.phaseT=Math.max(0,this.phaseT-dt);this.hitTimer=Math.max(0,this.hitTimer-dt);if(this.rise>0){this.rise=Math.max(0,this.rise-dt);return;}
  if(p.holdingBreath||p.buffs.hoof>0){this.windup=0;this.charge=0;this.attackT=0;return;}
  if(this.charge>0){this.charge-=dt;this.move(Math.cos(this.aim)*(350+this.level*8)*dt,Math.sin(this.aim)*(350+this.level*8)*dt);if(Math.hypot(p.x-this.x,p.y-this.y)<35&&MapSys.lineClear(this.x,this.y,p.x,p.y))p.hit();return;}
  if(this.windup>0){this.windup=Math.max(0,this.windup-dt);if(!this.windup){this.release();this.cooldown=(3.1-this.level*.13)*(this.enraged?.8:1);}return;}
  this.cooldown=Math.max(0,this.cooldown-dt);const d=Math.hypot(p.x-this.x,p.y-this.y);
  if(d>52){this.pathTimer=(this.pathTimer||0)-dt;if(this.pathTimer<=0){this.waypointTarget=this.waypoint(p);this.pathTimer=.35;}const target=MapSys.lineClear(this.x,this.y,p.x,p.y)?p:this.waypointTarget;const a=Math.atan2(target.y-this.y,target.x-this.x);this.move(Math.cos(a)*this.speed*dt,Math.sin(a)*this.speed*dt);}
  if(!this.cooldown&&d<310&&MapSys.lineClear(this.x,this.y,p.x,p.y)){this.aim=Math.atan2(p.y-this.y,p.x-this.x);this.locked={x:p.x,y:p.y};this.windup=1.05-this.level*.035;const pattern=this.spec.pattern;if(pattern==='charge'||pattern==='starfall'&&this.attackIndex%3===2)BossFight.mark(this.x,this.y,28,'line',{angle:this.aim,length:270,delay:this.windup,life:.62,harmless:true});}
 }
 pose(){
  const spectral=['tide','sigils','shadow'].includes(this.spec.pattern),step=this.moving?Math.sin(this.stride):0;
  const strike=this.attackT>0?Math.sin((1-this.attackT/.62)*Math.PI):0,wind=this.windup>0?1-this.windup/(1.05-this.level*.035):0;
  const melee=['cleave','charge','bones'].includes(this.attackPattern),hit=this.hitTimer/.45;
  return {x:(melee?Math.cos(this.aim)*strike*20:-Math.cos(this.aim)*strike*7)-Math.cos(this.aim)*wind*8-Math.cos(this.aim)*hit*7,
   y:(spectral?Math.sin(this.animTime*2.5)*5:-Math.abs(step)*5)-strike*(melee?3:12)+this.rise*20+Math.sin(this.animTime*63)*hit*2,
   rotation:step*(spectral?.025:.045)+this.facing*(wind*-.10+strike*(melee?.21:-.07))+Math.sin(this.animTime*65)*hit*.045,
   sx:1+wind*.04+strike*.06,sy:1-wind*.09-strike*.04+Math.sin(this.animTime*2)*.012,step,spectral};
 }
 draw(ctx){
  const sprite=Art.bossSprites?.[this.level-1];if(!sprite)return;const size=138+this.level*3,pose=this.pose(),strike=this.attackT>0?1-this.attackT/.62:0;
  ctx.save();ctx.translate(this.x,this.y);ctx.fillStyle='#00000065';ctx.beginPath();ctx.ellipse(0,7,size*.23,size*.07,0,0,Math.PI*2);ctx.fill();
  if(this.windup>0||this.attackT>0||this.enraged){ctx.save();ctx.strokeStyle=this.spec.color;ctx.globalAlpha=this.windup>0?.4+Math.sin(this.animTime*18)*.2:.3;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,36+(this.windup>0?8*Math.sin(this.animTime*6):strike*42),12+strike*15,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  if(this.charge>0||this.phaseT>0){for(let i=3;i>0;i--){ctx.save();ctx.globalAlpha=.1*(4-i);ctx.translate(-Math.cos(this.aim)*i*14,-Math.sin(this.aim)*i*14);ctx.scale(this.facing,1);ctx.drawImage(sprite,-size/2,-size*.84,size,size);ctx.restore();}}
  ctx.save();ctx.translate(pose.x,pose.y);ctx.rotate(pose.rotation);ctx.scale(pose.sx*this.facing,pose.sy);
  ctx.globalAlpha=(this.rise>0?Math.max(.1,1-this.rise/1.6):1)*(this.phaseT>0?.5:1);
  if(this.hitTimer>0)ctx.filter=`brightness(${1+this.hitTimer/.45*1.5}) saturate(.5)`;
  // Warp the existing artwork gently along the body; feet counter-swing as it walks.
  const strips=20,sw=sprite.width,sh=sprite.height;
  for(let i=0;i<strips;i++){const t=i/strips,warp=pose.step*Math.sin(t*Math.PI*2)*(pose.spectral?2:3);ctx.drawImage(sprite,0,sh*t,sw,sh/strips, -size/2+warp,-size*.84+size*t,size,size/strips+.4);}
  ctx.restore();
  if(this.attackT>0){ctx.save();ctx.strokeStyle=this.spec.color;ctx.globalAlpha=Math.sin(strike*Math.PI)*.8;ctx.lineWidth=5*(1-strike)+1;
   if(['cleave','bones'].includes(this.attackPattern)){ctx.rotate(this.aim);ctx.beginPath();ctx.arc(0,-15,55+strike*30,-1.2+strike,.6+strike);ctx.stroke();}
   else if(this.attackPattern==='fan'){ctx.rotate(this.aim);for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(20,i*5-20);ctx.lineTo(35+strike*50,i*12-20);ctx.stroke();}}
   else{for(let i=0;i<6;i++){const a=i*Math.PI/3+this.animTime*2,r=22+strike*40;ctx.beginPath();ctx.arc(Math.cos(a)*r,-30+Math.sin(a)*r*.5,2+strike*3,0,Math.PI*2);ctx.stroke();}}
   ctx.restore();}
  if(this.hitTimer>0){ctx.save();ctx.globalAlpha=this.hitTimer/.45;ctx.strokeStyle='#ffe5c2';ctx.lineWidth=2;for(let i=0;i<5;i++){const a=i*Math.PI*2/5,r=12+(1-this.hitTimer/.45)*20;ctx.beginPath();ctx.moveTo(Math.cos(a)*r,-38+Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+9),-38+Math.sin(a)*(r+9));ctx.stroke();}ctx.restore();}
  ctx.restore();if(this.windup>0)Art.label(ctx,this.x,this.y-size*.85,curLang==='CN'?'蓄力！快躲开':'DODGE!',this.spec.color);
 }
}

// A non-combat remnant survives entity cleanup without remaining targetable.
class BossDeath{
 constructor(b){Object.assign(this,{type:'boss_death',x:b.x,y:b.y,level:b.level,facing:b.facing,color:b.spec.color,age:0,dead:0});}
 update(dt){this.age+=dt;if(this.age>=1.8)this.dead=1;}
 draw(ctx){const sprite=Art.bossSprites?.[this.level-1];if(!sprite)return;const t=Math.min(1,this.age/1.8),size=138+this.level*3;ctx.save();ctx.translate(this.x,this.y);ctx.scale(this.facing,1);ctx.rotate(Math.sin(t*Math.PI)*.13);ctx.filter=`grayscale(${t}) brightness(${1+Math.max(0,.25-t)*4})`;
  for(let i=0;i<20;i++){const row=i/20;ctx.globalAlpha=Math.max(0,1-t*1.7+(row-.5)*.7);const drift=Math.sin(i*2.7)*t*t*35;ctx.drawImage(sprite,0,sprite.height*row,sprite.width,sprite.height/20,-size/2+drift,-size*.84+size*row+t*t*30,size,size/20+.4);}
  ctx.filter='none';ctx.globalAlpha=(1-t)*.7;ctx.strokeStyle=this.color;ctx.lineWidth=3*(1-t);ctx.beginPath();ctx.ellipse(0,4,20+t*85,7+t*25,0,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<18;i++){const a=i*2.4,r=10+t*(30+i%5*9);ctx.globalAlpha=(1-t)*(.3+i%3*.2);ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(Math.cos(a)*r,-25+Math.sin(a)*r*.55-t*55,1+i%3,0,Math.PI*2);ctx.fill();}ctx.restore();}
}
