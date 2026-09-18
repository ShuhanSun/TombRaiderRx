const test=require('node:test');
const assert=require('node:assert/strict');
const {setup}=require('./harness.cjs');
test('each royal coffin summons one distinct increasingly strong guardian after opening',()=>{
 const {Game,BossFight,BOSS_SPECS}=setup();let hp=0,speed=0;
 assert.equal(new Set(BOSS_SPECS.map(b=>b.name)).size,10);assert.equal(new Set(BOSS_SPECS.map(b=>b.pattern)).size,10);
 for(let level=1;level<=10;level++){
  Game.load(level);assert.equal(BossFight.boss,null);const c=Game.ents.find(e=>e.royal);c.open(Game.p);assert.equal(BossFight.boss,null);c.update(.61);
  const b=BossFight.boss;assert.ok(b);assert.equal(b.spec,BOSS_SPECS[level-1]);assert.ok(b.hp>hp&&b.speed>speed);hp=b.hp;speed=b.speed;
  c.reveal();BossFight.summon(c);assert.equal(Game.ents.filter(e=>e.type==='boss').length,1);assert.equal(b.damage(999),false);assert.ok(Game.p.hasShovel);
 }
});
test('boss blocks escape, receives auto melee and cleans hazards after defeat',()=>{
 const {Game,BossFight,ExitGate,World,TombDangers}=setup();Game.p.hasKey=true;World.altars.forEach(a=>a.done=true);assert.equal(ExitGate.open(),false);
 const c=Game.ents.find(e=>e.royal);c.reveal();const b=BossFight.boss;b.rise=0;Game.p.x=b.x;Game.p.y=b.y+40;Game.p.attackCooldown=0;
 assert.equal(Game.p.attack(),true);assert.equal(b.hp,b.maxHp-1);b.hitTimer=0;BossFight.mark(b.x,b.y);TombDangers.hurt(b,b.maxHp);
 assert.ok(b.dead&&BossFight.cleared);assert.equal(BossFight.marks.length,0);assert.ok(ExitGate.open());Game.load(2);assert.equal(BossFight.cleared,false);
});
test('all ten patterns produce distinct attacks and breath interrupts windup',()=>{
 const {Game,BossFight}=setup();
 for(let level=1;level<=10;level++){
  Game.load(level);Game.ents.find(e=>e.royal).reveal();const b=BossFight.boss;b.rise=0;b.cooldown=0;Game.p.x=b.x;Game.p.y=b.y+40;
  b.update(.01,Game.p);assert.ok(b.windup>0);Game.p.holdingBreath=true;b.update(.1,Game.p);assert.equal(b.windup,0);assert.equal(b.charge,0);
  Game.p.holdingBreath=false;b.cooldown=0;b.update(.01,Game.p);const hp=Game.p.hp;b.update(.1,Game.p);assert.equal(Game.p.hp,hp);b.update(2,Game.p);
  assert.ok(b.charge>0||BossFight.marks.length||Game.ents.some(e=>e.bossOwned));
 }
});
test('boss damage fields honor walls and charges cannot tunnel through stone',()=>{
 const {Game,MapSys,BossFight,TombBoss}=setup();const p=Game.p,b=new TombBoss(p.x,p.y,3);b.rise=0;
 const tx=Math.floor(p.x/50),ty=Math.floor(p.y/50);MapSys.t[ty*MapSys.w+tx+1]=1;
 b.move(200,0);assert.ok(b.x<(tx+1)*50);BossFight.mark(p.x+100,p.y,200,'blast',{delay:0});p.inv=0;const hp=p.hp;BossFight.update(.1);assert.equal(p.hp,hp);
});
