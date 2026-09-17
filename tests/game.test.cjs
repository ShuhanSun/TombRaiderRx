const {test}=require('node:test');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {setup}=require('./harness.cjs');

test('coffin opening only releases red blood, never clouds or green liquid',()=>{
 const {Game,TombDangers}=setup();
 for(let i=0;i<12;i++)TombDangers.coffinFX({x:125+i*50,y:175});
 assert.equal(TombDangers.clouds.length,0);
 assert.equal(TombDangers.stains.length,12);
 assert.ok(TombDangers.stains.every(s=>s.color==='#6f0915'));
 assert.ok(TombDangers.bursts.every(b=>b.blood));
 Game.load(2);assert.equal(TombDangers.stains.length,0);
});

test('room ambience is selective and decorative remains do not replace items or enemies',()=>{
 const {Game,World}=setup();
 for(let floor=1;floor<=10;floor++){
  Game.load(floor);
  const entry=World.rooms.find(r=>r.kind==='entry');assert.equal(entry.haze,false);assert.equal(entry.flicker,false);
  assert.ok(World.rooms.some(r=>r.haze));assert.ok(World.rooms.some(r=>!r.haze));
  assert.ok(Game.ents.some(e=>e.type==='tomb_remains'));
  Game.render();
 }
});

test('boot, language switches before and after play, and HiDPI sizing',()=>{
    const {Game,els}=setup();
    Game.toggleLang(); assert.equal(els['game-title'].innerText,'Tomb Raider');
    Game.toggleLang(); assert.equal(els['game-title'].innerText,'寻龙诀');
    assert.equal(Game.cvs.width,2400); assert.equal(Game.width,1200);
    assert.equal(els['exit-confirm-btn'].textContent,'进入下一层');
});

test('300 generated floors have one reachable relic, connected terrain and safe spawns',()=>{
    const {Game,MapSys,World}=setup(19);
    for(let n=0;n<300;n++) {
        Game.load(n%10+1);
        const relics=Game.ents.filter(e=>e.content==='artifact');assert.equal(relics.length,1);assert.equal(Game.ents.filter(e=>e.payload?.loot?.includes('item_candle')).length,1);
        const index=p=>Math.floor(p.y/50)*60+Math.floor(p.x/50);
        const seen=new Set([index(Game.p)]),queue=[index(Game.p)];
        for(let i=0;i<queue.length;i++) {
            const at=queue[i];
            for(const to of [at-60,at+60,at-1,at+1]) {
                if(to<0||to>=3600||Math.abs(to%60-at%60)>1||MapSys.t[to]===1||seen.has(to))continue;
                seen.add(to);queue.push(to);
            }
        }
        assert.ok(seen.has(index(relics[0])));assert.ok(seen.has(index(Game.exitPos)));
        for(const altar of World.altars) {assert.ok(seen.has(index(altar)));assert.ok(MapSys.canOccupy(altar.x,altar.y,10));}
        assert.equal(seen.size,[...MapSys.t].filter(t=>t!==1).length-World.rooms.filter(r=>r.kind==='sealed').reduce((n,r)=>n+r.w*r.h,0));
        for(const e of Game.ents.filter(e=>e.type==='zombie'||e.type==='trap')) assert.ok(Math.hypot(e.x-Game.p.x,e.y-Game.p.y)>150);
        assert.ok(MapSys.canOccupy(Game.p.x,Game.p.y,10));
        assert.ok(MapSys.canOccupy(Game.exitPos.x,Game.exitPos.y,10));
    }
});

test('pathological RNG still produces a relic, compass and a connected fallback',()=>{
    const env=setup();vm.runInContext('Math.random=()=>0;',env.context);env.Game.load(1);
    assert.equal(env.Game.ents.filter(e=>e.content==='artifact').length,1);
    assert.equal(env.Game.ents.filter(e=>e.payload?.loot?.includes('item_compass')).length,1);
    assert.equal(env.MapSys.get(-0.1,1200),1);
});

test('simulation speed is stable at 30, 60 and 144 Hz',()=>{
    const distances=[];
    for(const hz of [30,60,144]) {
        const env=setup(7),{Game,Input,MapSys,tick}=env;
        MapSys.t.fill(0);Game.ents=[Game.p];Game.p.x=400;Game.p.y=400;
        Input.keys.KeyD=true;Input.update();
        for(let i=0;i<=hz*2;i++)tick(i*1000/hz);
        distances.push(Game.p.x-400);
        assert.ok(Math.abs(Game.elapsed-2)<1/60+1e-9);
        assert.equal(env.frames.size,1);
    }
    assert.ok(Math.max(...distances)-Math.min(...distances)<=160/60+1e-8);
});

test('pause freezes coffin reveals and buffs; restart discards old reveals and extra loops',()=>{
    const env=setup(),{Game,tick,Coffin}=env;
    const coffin=new Coffin(Game.p.x+35,Game.p.y,'artifact');Game.ents=[Game.p,coffin];
    coffin.open();Game.p.buffs.jade=10;
    tick(0);Game.togglePause();tick(5000);
    assert.equal(coffin.revealTimer,0.6);assert.equal(Game.art,0);assert.equal(Game.p.buffs.jade,10);
    Game.togglePause();tick(5001);
    for(let i=1;i<=40;i++)tick(5001+i*1000/60);
    assert.equal(Game.art,1);
    Game.restart();Game.restart();assert.equal(env.frames.size,1);
    tick(10000);tick(10020);assert.equal(Game.art,0);assert.equal(Game.pause,false);
});

test('repel prevents zombie attacks but traps hurt; jade prevents trap damage',()=>{
    const {Game,Projectile,Zombie}=setup();
    Game.p.inv=0;Game.p.buffs.hoof=15;
    const z=new Zombie(Game.p.x,Game.p.y,0);z.update(1/60,Game.p);
    assert.ok(Number.isFinite(z.x)&&Number.isFinite(z.y));assert.equal(Game.p.hp,5);
    new Projectile(Game.p.x,Game.p.y,0,'ARROW').update(0,Game.p);assert.equal(Game.p.hp,4);
    Game.p.inv=0;Game.p.buffs.jade=15;
    new Projectile(Game.p.x,Game.p.y,0,'ARROW').update(0,Game.p);assert.equal(Game.p.hp,4);
});

test('compass renders before relic pickup, particles expire and text uses local coordinates',()=>{
    const {Game,Effect,FloatText,calls}=setup();
    Game.p.hasCompass=1;Game.exit=0;Game.shake=0;Game.render();
    assert.ok(calls.some(c=>c[0]==='translate'&&c[1]===65&&c[2]===0));
    const effect=new Effect(Game.p.x,Game.p.y,'gold');Game.ents=[Game.p,effect];
    for(let i=0;i<40;i++)Game.step(1/60);
    assert.ok(!Game.ents.includes(effect));
    calls.length=0;new FloatText(400,500,'test','#fff').draw(Game.ctx);
    assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='test'&&c[2]===0&&c[3]===0));
});

test('two pointers move and sprint independently; cancellation and blur clear input',()=>{
    const {Input,Game,els,windowEvents}=setup();
    const event=(pointerId,x=110)=>({pointerId,clientX:x,clientY:60,preventDefault(){}});
    els['joystick-zone'].handlers.pointerdown(event(1));assert.equal(Input.active,false);
    els['joystick-zone'].handlers.pointermove(event(1,114));assert.equal(Input.active,false);
    els['joystick-zone'].handlers.pointermove(event(1,155));assert.ok(Input.x>0);
    els['sprint-btn'].handlers.pointerdown(event(2));assert.equal(Input.sprint,true);
    els['sprint-btn'].handlers.pointercancel(event(2));assert.equal(Input.sprint,false);assert.equal(Input.active,true);
    els['joystick-zone'].handlers.pointercancel(event(1));assert.equal(Input.active,false);
    Input.keys.ShiftRight=true;Input.update();assert.equal(Input.sprint,true);
    windowEvents.blur();assert.equal(Input.sprint,false);assert.equal(Game.pause,true);
});

test('ten-floor progression preserves equipment and requires a gate crank before exit',()=>{
    const {Game,MapSys,els,World,Passage,ExitGate}=setup();
    Game.p.hp=4;Game.p.buffs.candle=20;Game.p.hasCompass=1;
    for(let floor=1;floor<=10;floor++) {
        assert.equal(Game.lvl,floor);assert.equal(Game.art,floor-1);
        if(!World.theme.water)assert.equal([...MapSys.t].filter(t=>t===2).length,0);
        Game.ents.find(e=>e.content==='key').reveal();Game.getArtifact();Game.ents.find(e=>e.content==='key').reveal();Game.getArtifact();assert.equal(Game.art,floor);
        assert.equal(ExitGate.remaining,0);
        World.altars.forEach(a=>a.done=true);ExitGate.open();Game.showExitModal();Game.confirmNextLevel();Passage.update(1.3);
        assert.equal(Game.p.hp,4);assert.equal(Game.p.buffs.candle,0);assert.equal(Game.p.hasCompass,1);
    }
    assert.equal(Game.running,0);assert.ok(els['victory-modal'].classList.contains('active'));
    Game.confirmNextLevel();assert.equal(Game.lvl,10);
    Game.restart();assert.equal(Game.p.hp,5);assert.equal(Game.p.hasCompass,0);
});

test('seals block the exit until all required altars are activated',()=>{
    const {Game,World,Passage,ExitGate}=setup();
    Game.load(7);Game.ents.find(e=>e.content==='key').reveal();Game.getArtifact();assert.equal(World.remaining(),2);assert.equal(World.canExit(),false);
    Game.p.x=Game.exitPos.x;Game.p.y=Game.exitPos.y;Game.step(1/60);assert.equal(Game.pause,false);
    Game.showExitModal();Game.confirmNextLevel();assert.equal(Game.lvl,7);Game.pause=false;
    for(const altar of World.altars.filter(a=>a.kind==='seal')) {
        Game.p.x=altar.x;Game.p.y=altar.y;
        for(let i=0;i<73;i++)World.update(1/60);
    }
    assert.equal(World.remaining(),0);assert.equal(World.canExit(),false);ExitGate.open();assert.equal(World.canExit(),true);
    Game.showExitModal();Game.confirmNextLevel();Passage.update(1.3);assert.equal(Game.lvl,8);
});

test('wine can be picked up at full health, sanctuary heals once and hidden traps fire only at close range',()=>{
    const {Game,World,MapSys}=setup();
    const wine=Game.ents.find(e=>e.code==='item_wine');Game.p.x=wine.x;Game.p.y=wine.y;
    wine.update(1/60,Game.p);assert.equal(wine.dead,1);assert.equal(Game.p.hp,5);Game.p.hp=4;
    const shrine=World.altars.find(a=>a.kind==='sanctuary');assert.ok(shrine);
    Game.p.x=shrine.x;Game.p.y=shrine.y;
    for(let i=0;i<150;i++)World.update(1/60);
    assert.equal(Game.p.hp,5);assert.equal(shrine.done,true);
    const trap=Game.ents.find(e=>e.type==='trap');MapSys.t.fill(0);trap.cd=0;
    Game.p.x=trap.x+200;Game.p.y=trap.y;
    const before=Game.ents.filter(e=>e.type==='proj').length;
    trap.update(1/60,Game.p);assert.equal(trap.windup,0);assert.equal(trap.revealT,0);
    Game.p.x=trap.x+100;trap.update(1/60,Game.p);assert.ok(trap.windup>0);assert.ok(trap.revealT>0);assert.equal(Game.ents.filter(e=>e.type==='proj').length,before);
    for(let i=0;i<7;i++)trap.update(1/60,Game.p);
    assert.equal(Game.ents.filter(e=>e.type==='proj').length,before+1);
});

test('media audio starts from unlock, muted stays silent, and pause/resume restores playback',async()=>{
    const {Sound,AudioSys,context}=setup();
    await Promise.resolve();assert.equal(Sound.music.paused,false);assert.ok(Sound.music.playCount>=1);
    assert.equal(context.navigator.audioSession.type,'playback');
    Sound.toggle();assert.equal(AudioSys.muted,true);assert.equal(Sound.music.paused,true);
    const count=Sound.music.playCount;Sound.unlock();assert.equal(Sound.music.playCount,count);
    Sound.toggle();await Promise.resolve();assert.equal(Sound.music.paused,false);
    Sound.pause();assert.equal(Sound.music.paused,true);
    Sound.unlock();await Promise.resolve();assert.equal(Sound.music.paused,false);
    Sound.test();await Promise.resolve();assert.equal(Sound.testClip.paused,false);
});

test('all floor renderers and generated atlas rectangles are valid',()=>{
    const {Game,Art,World}=setup();
    for(const [x,y,w,h] of Art.rects){assert.ok(x>=0&&y>=0&&x+w<=1254&&y+h<=1254);}
    for(let floor=1;floor<=10;floor++){
        Game.load(floor);Game.render();
        assert.equal(World.theme.tile,floor-1);
        for(const altar of World.altars)assert.ok(Number.isFinite(altar.x)&&Number.isFinite(altar.y));
    }
});

test('interrupted Web Audio is resumed using the supported window constructor',async()=>{
    const {Sound,AudioSys,context}=setup();let resumes=0;
    class Context {
        constructor(){this.state='suspended';this.destination={};}
        createGain(){return {gain:{value:0},connect(){}};}
        resume(){resumes++;this.state='running';return Promise.resolve();}
        suspend(){this.state='suspended';return Promise.resolve();}
    }
    context.window.webkitAudioContext=Context;
    Sound.unlock();await Promise.resolve();assert.ok(AudioSys.ctx instanceof Context);assert.equal(resumes,1);
    AudioSys.ctx.state='interrupted';Sound.unlock();await Promise.resolve();assert.equal(resumes,2);
    Sound.pause();assert.equal(AudioSys.ctx.state,'suspended');
    Sound.unlock();await Promise.resolve();assert.equal(AudioSys.ctx.state,'running');
});

test('four-way gait and footsteps follow distance, sprint cadence, water and wall collision',()=>{
    const {Game,MapSys,Input,AudioSys}=setup();MapSys.t.fill(0);Game.ents=[Game.p];
    const steps=[];AudioSys.playStep=(water,sprint)=>steps.push({water,sprint});
    const walk=(x,y,frames=60)=>{Input.x=x;Input.y=y;Input.active=true;for(let i=0;i<frames;i++)Game.p.update(1/60);};
    Game.p.x=500;Game.p.y=500;
    for(const [x,y,direction] of [[0,1,0],[-1,0,1],[1,0,2],[0,-1,3]]){walk(x,y,12);assert.equal(Game.p.direction,direction);assert.equal(Game.p.moving,true);}
    steps.length=0;Game.p.stepDistance=0;walk(1,0);const normal=steps.length;
    Input.sprint=true;steps.length=0;Game.p.stepDistance=0;walk(1,0);assert.ok(steps.length>normal);assert.ok(steps.every(s=>s.sprint));
    MapSys.t.fill(2);steps.length=0;walk(1,0);assert.ok(steps.length);assert.ok(steps.every(s=>s.water));
    MapSys.t.fill(1);steps.length=0;const oldX=Game.p.x;walk(1,0);assert.equal(Game.p.x,oldX);assert.equal(steps.length,0);assert.equal(Game.p.moving,false);
});

test('lamp expires at 20 seconds, fades last two, and pause freezes oil consumption',()=>{
    const {Game,World,MapSys,Input,tick}=setup();MapSys.t.fill(0);Game.ents=[Game.p];Input.active=false;
    const base=World.sight();Game.getItem('item_candle');assert.equal(Game.p.buffs.candle,20);assert.equal(World.sight(),base+170);
    for(let i=0;i<19*60;i++)Game.p.update(1/60);
    assert.ok(Math.abs(World.sight()-(base+85))<.01);
    tick(0);Game.togglePause();const oil=Game.p.buffs.candle;tick(5000);assert.equal(Game.p.buffs.candle,oil);
    Game.togglePause();for(let i=0;i<61;i++)Game.p.update(1/60);
    assert.equal(Game.p.buffs.candle,0);assert.equal(World.sight(),base);
});

test('zombies hop, land, telegraph melee, allow dodging and hit only once per strike',()=>{
    const {Game,MapSys,Zombie}=setup();MapSys.t.fill(0);Game.p.x=500;Game.p.y=500;Game.p.inv=0;Game.ents=[Game.p];
    const hopper=new Zombie(380,500,0);hopper.hopPhase=0;
    hopper.update(.15,Game.p);assert.ok(hopper.hopHeight>5);assert.ok(hopper.x>380);
    hopper.update(.61,Game.p);assert.equal(hopper.hopHeight,0);assert.ok(Game.ents.some(e=>e.effectType==='dust'));
    const z=new Zombie(475,500,0);z.update(.01,Game.p);assert.equal(z.attackState,'windup');assert.equal(Game.p.hp,5);
    Game.p.x=550;z.update(z.species.windup+.01,Game.p);assert.equal(z.attackState,'strike');assert.equal(Game.p.hp,5);
    const attacker=new Zombie(525,500,1);attacker.update(.01,Game.p);attacker.update(attacker.species.windup+.01,Game.p);assert.equal(Game.p.hp,4);assert.equal(attacker.dead,0);
    Game.p.inv=0;attacker.update(.05,Game.p);assert.equal(Game.p.hp,4);
});

test('spitter waits for windup and repel cancels attacks; trap recoil decays',()=>{
    const {Game,MapSys,Zombie,Trap}=setup();MapSys.t.fill(0);Game.p.x=600;Game.p.y=600;Game.ents=[Game.p];
    const z=new Zombie(500,600,2);z.update(.01,Game.p);assert.equal(z.attackState,'windup');assert.equal(Game.ents.length,1);
    z.update(.3,Game.p);assert.equal(Game.ents.length,1);z.update(.31,Game.p);assert.ok(Game.ents.some(e=>e.pType==='VENOM'));
    const cancelled=new Zombie(575,600,0);cancelled.update(.01,Game.p);Game.p.buffs.hoof=15;cancelled.update(.4,Game.p);assert.equal(cancelled.attackState,'');assert.equal(Game.p.hp,5);
    const trap=new Trap(500,600,0);trap.cd=0;trap.update(.01,Game.p);trap.update(.81,Game.p);assert.ok(trap.recoil>0);assert.ok(Game.ents.some(e=>e.effectType==='muzzle'));
    trap.update(.3,Game.p);assert.equal(trap.recoil,0);
});

test('walking and wading produce no footstep audio',()=>{
    const {Game,MapSys,Input,Sound}=setup();let calls=0;Sound.footstep=()=>calls++;
    Game.ents=[Game.p];Input.active=true;Input.x=1;Input.y=0;
    for(const terrain of [0,2]){MapSys.t.fill(terrain);for(let i=0;i<180;i++)Game.p.update(1/60);}
    assert.equal(calls,0);
});

test('passage hazards stay outside rooms and launchers mount beside walls on every floor',()=>{
    const {Game,World,MapSys}=setup(73);
    for(let floor=1;floor<=10;floor++){
        Game.load(floor);assert.ok(World.hazards.length>0);
        for(const h of World.hazards){assert.ok(!World.rooms.some(r=>World.inside(r,h.x,h.y)));assert.notEqual(MapSys.get(h.x,h.y),1);assert.ok(Math.hypot(h.x-Game.p.x,h.y-Game.p.y)>=220);}
        for(const trap of Game.ents.filter(e=>e.type==='trap')){
            const x=Math.floor(trap.x/50),y=Math.floor(trap.y/50),at=y*MapSys.w+x;
            assert.ok([at-1,at+1,at-MapSys.w,at+MapSys.w].some(i=>MapSys.t[i]===1));
        }
    }
});

test('concealed launcher snaps toward a close target and its muzzle matches the projectile',()=>{
    const {Game,MapSys,Trap,Art}=setup();MapSys.t.fill(0);Game.ents=[Game.p];Game.p.x=400;Game.p.y=500;
    assert.deepEqual(['ARROW','STONE','LOG','FIRE','fire','water','smoke','VENOM'].map(k=>Art.trapEmitterIndex(k)),[0,1,2,3,4,5,6,7]);
    const trap=new Trap(500,500,0);trap.update(.01,Game.p);assert.ok(trap.revealT>0);assert.equal(Game.ents.length,1);
    for(let i=0;i<11;i++)trap.update(.01,Game.p);
    const shot=Game.ents.find(e=>e.type==='proj');assert.ok(shot);
    assert.ok(Math.abs(Math.sin(shot.ang-trap.displayAim))<.001);
    assert.ok(Math.abs(shot.x-(trap.x+Math.cos(shot.ang)*20))<.001);
    assert.ok(Math.abs(shot.y-(trap.y+Math.sin(shot.ang)*20))<.001);
});

test('terrain detection still tracks entering and leaving water with playback disabled',()=>{
    const {Game,MapSys,Input,AudioSys}=setup();MapSys.t.fill(0);Game.ents=[Game.p];Game.p.x=499;Game.p.y=525;
    MapSys.t[10*MapSys.w+10]=2;const events=[];AudioSys.playStep=(water)=>events.push(water);
    Input.active=true;Input.x=1;Input.y=0;Game.p.update(1/60);assert.deepEqual(events,[true]);
    for(let i=0;i<30;i++)Game.p.update(1/60);assert.ok(events.length>1);assert.ok(events.every(Boolean));
    MapSys.t.fill(0);events.length=0;for(let i=0;i<60;i++)Game.p.update(1/60);assert.ok(events.length);assert.ok(events.every(v=>!v));
});

test('descent previews next theme, freezes play, ignores duplicate taps and can restart safely',()=>{
    const {Game,Passage,World,THEMES,els,tick,ExitGate}=setup();Game.ents.find(e=>e.content==='key').reveal();Game.getArtifact();ExitGate.open();Game.showExitModal();
    assert.equal(els['exit-title'].textContent,THEMES[1].name);assert.equal(Passage.mode,'bolts');
    Game.p.buffs.candle=10;const elapsed=Game.elapsed;Game.confirmNextLevel();Game.confirmNextLevel();
    tick(0);tick(100);assert.equal(Game.lvl,1);assert.equal(Game.elapsed,elapsed);assert.equal(Game.p.buffs.candle,10);
    Passage.update(1.3);assert.equal(Game.lvl,2);assert.equal(Passage.active,false);assert.equal(Game.pause,false);
    Game.ents.find(e=>e.content==='key').reveal();Game.getArtifact();World.altars.forEach(a=>a.done=true);ExitGate.open();Game.showExitModal();Game.confirmNextLevel();Game.restart();Passage.update(2);assert.equal(Game.lvl,1);
    assert.equal(new Set(Passage.modes).size,11);
    for(let next=1;next<=10;next++){Passage.open(next);Passage.update(.1);assert.ok(els['passage-description'].textContent.length>10);}
});

test('crank reveals the hidden exit, expires, requires rearming and can reopen',()=>{
 const {Game,ExitGate,World,Input,Scene,calls}=setup();Input.active=false;
 assert.equal(World.canExit(),false);assert.equal(ExitGate.open(),false);
 calls.length=0;Scene.draw(Game);assert.ok(!calls.some(c=>c[0]==='fillText'&&String(c[1]).startsWith('盗洞 ·')));
 Game.ents.find(e=>e.content==='key').reveal();Game.getArtifact();assert.equal(World.canExit(),false);assert.equal(ExitGate.radius,0);
 Game.p.x=ExitGate.switch.x;Game.p.y=ExitGate.switch.y;Game.p.moving=false;
 for(let i=0;i<61;i++)ExitGate.update(1/60);assert.ok(World.canExit());assert.ok(ExitGate.remaining>24);
 for(let i=0;i<26*60;i++)ExitGate.update(1/60);assert.equal(World.canExit(),false);assert.equal(ExitGate.remaining,0);
 ExitGate.update(2);assert.equal(ExitGate.remaining,0);
 Game.p.x+=100;ExitGate.update(.01);Game.p.x-=100;ExitGate.update(1.1);assert.ok(World.canExit());
});

test('flood grows along reachable tiles, respects walls, recedes, and resets each floor',()=>{
 const {Game,ExitGate,MapSys,World}=setup();Game.ents.find(e=>e.content==='key').reveal();Game.getArtifact();ExitGate.open();
 assert.equal(ExitGate.radius,0);ExitGate.update(2);assert.ok(ExitGate.levelAt(Game.exitPos.x,Game.exitPos.y)>0);
 for(let i=0;i<MapSys.t.length;i++)if(MapSys.t[i]===1)assert.equal(ExitGate.dist[i],-1);
 const far=ExitGate.dist.findIndex(d=>d>4);assert.equal(ExitGate.levelAt(far%60*50+25,Math.floor(far/60)*50+25),0);
 ExitGate.remaining=0;ExitGate.latched=true;const radius=ExitGate.radius;Game.p.x=ExitGate.switch.x+100;ExitGate.update(.2);assert.ok(ExitGate.radius<radius);
 for(let lvl=1;lvl<=10;lvl++){Game.load(lvl);assert.equal(ExitGate.radius,0);assert.equal(ExitGate.remaining,0);assert.ok(MapSys.canOccupy(ExitGate.switch.x,ExitGate.switch.y,10));assert.ok(!World.hazards.some(h=>Math.hypot(h.x-ExitGate.switch.x,h.y-ExitGate.switch.y)<65));}
});

test('each floor applies its guardian species and flood; pause freezes the gate',()=>{
 const {Game,SPECIES,FLOOD_TYPES,ExitGate,tick}=setup();assert.equal(new Set(SPECIES.map(s=>s.name)).size,10);assert.equal(new Set(FLOOD_TYPES.map(s=>s.sprite)).size,10);
 for(let lvl=1;lvl<=10;lvl++){Game.load(lvl);for(const z of Game.ents.filter(e=>e.type==='zombie')){assert.equal(z.species.name,SPECIES[lvl-1].name);assert.equal(z.spd,SPECIES[lvl-1].speed);}assert.equal(ExitGate.flood,FLOOD_TYPES[lvl-1]);}
 Game.load(1);Game.ents.find(e=>e.content==='key').reveal();Game.getArtifact();ExitGate.open();tick(0);Game.togglePause();tick(5000);assert.equal(ExitGate.remaining,25);assert.equal(ExitGate.radius,0);
});

test('flood effects slow or obscure and harmful contact has a grace period',()=>{
 const {Game,ExitGate,World}=setup();Game.ents.find(e=>e.content==='key').reveal();Game.getArtifact();ExitGate.open();ExitGate.radius=3;
 Game.p.x=Game.exitPos.x;Game.p.y=Game.exitPos.y;assert.ok(ExitGate.speed()<1);
 Game.load(5);Game.ents.find(e=>e.content==='key').reveal();Game.getArtifact();ExitGate.open();Game.p.x=Game.exitPos.x;Game.p.y=Game.exitPos.y;const clear=World.sight();ExitGate.radius=3;assert.ok(World.sight()<clear);
 Game.load(7);Game.ents.find(e=>e.content==='key').reveal();Game.getArtifact();World.altars.forEach(a=>a.done=true);ExitGate.open();ExitGate.radius=3;Game.p.x=Game.exitPos.x;Game.p.y=Game.exitPos.y;Game.p.inv=0;
 ExitGate.update(2);assert.equal(Game.p.hp,5);ExitGate.update(.3);assert.equal(Game.p.hp,4);
});

test('main chamber exit, remote crank and finite increasing floor populations',()=>{
 const {Game,World,ExitGate}=setup(113);
 for(let n=0;n<100;n++){
  Game.load(n%10+1);
  assert.ok(World.inside(Game.exitRoom,Game.exitPos.x,Game.exitPos.y));
  assert.ok(!World.inside(Game.exitRoom,ExitGate.switch.x,ExitGate.switch.y));
  assert.ok(Math.hypot(ExitGate.switch.x-Game.exitPos.x,ExitGate.switch.y-Game.exitPos.y)>=500);
  assert.ok(ExitGate.routeDistance<45,'route fits 25 seconds of normal movement plus flood slowdown');
  assert.equal(Game.ents.filter(e=>e.type==='ground_item').length,1);
  assert.equal(Game.ents.filter(e=>e.type==='zombie').length,1);
 }
});

test('jade persists until one blocked hit; compass loss hides map and can be recovered',()=>{
 const {Game,els,context,Projectile}=setup();
 Game.p.inv=0;Game.getItem('item_jade');Game.p.update(20);
 assert.equal(Game.p.buffs.jade,1);
 new Projectile(Game.p.x,Game.p.y,0,'FIRE').update(0,Game.p);
 assert.equal(Game.p.hp,5);assert.equal(Game.p.buffs.jade,0);
 Game.getItem('item_compass');assert.equal(els['map-panel'].style.display,'');
 vm.runInContext('Math.random=()=>0',context);Game.p.inv=0;Game.p.hit();
 assert.equal(Game.p.hp,4);assert.equal(Game.p.hasCompass,0);assert.equal(els['map-panel'].style.display,'none');
 const drop=Game.ents.find(e=>e.pickupDelay===2);assert.ok(drop);
 drop.update(1,Game.p);assert.equal(Game.p.hasCompass,0);
 drop.update(1,Game.p);drop.update(0,Game.p);
 assert.equal(Game.p.hasCompass,1);assert.equal(els['map-panel'].style.display,'');
});

 test('hidden floor selector pauses, cancels and starts a fresh selected floor',()=>{
 const {Game,els}=setup();
 for(let i=0;i<4;i++)Game.debugTap();assert.equal(Game.pause,false);
 Game.debugTap();assert.equal(Game.pause,true);Game.closeTest();assert.equal(Game.pause,false);
 Game.p.hasCompass=1;Game.p.hp=1;Game.testLevel(7);
 assert.equal(Game.lvl,7);assert.equal(Game.p.hp,5);assert.equal(Game.p.hasCompass,0);assert.equal(Game.art,0);assert.equal(Game.pause,false);
 Game.testLevel(11);assert.equal(Game.lvl,7);
 });

 test('direct floor selection initializes the viewport before the first game frame',()=>{
 const {Game,Art,tick}=setup();Game.width=undefined;Game.height=undefined;Game.dpr=undefined;Game.p=null;Game.running=0;
 Game.testLevel(4);assert.ok(Game.width>0&&Game.height>0);assert.ok(Game.cvs.width>0);tick(0);tick(17);assert.equal(Game.running,1);assert.equal(Game.lvl,4);
 });

test('fixed hidden contents, reachable single key, no duplicate coffin rewards',()=>{
 const {Game,Expedition,MapSys}=setup(31);
 for(let n=0;n<50;n++){
  Game.load(n%10+1);assert.equal(Game.ents.filter(e=>e.content==='key').length,1);
  assert.equal(Game.ents.filter(e=>e.type==='ground_item').length,1);
  assert.equal(Game.ents.filter(e=>e.type==='zombie').length,1);
  assert.ok(!Expedition.keyCoffin.hidden);assert.ok(MapSys.canOccupy(Expedition.keyCoffin.x,Expedition.keyCoffin.y,10));
  const coffins=Game.ents.filter(e=>e.type==='coffin');for(const c of coffins)c.reveal();
  assert.equal(Game.ents.filter(e=>e.type==='zombie').length,Expedition.zombieBudget);
  assert.equal(Game.ents.filter(e=>e.type==='vermin').length,Expedition.verminBudget);
  assert.equal(Game.ents.filter(e=>e.type==='ground_item').length,Expedition.itemBudget);
  const count=Game.ents.length;for(const c of coffins)c.reveal();assert.equal(Game.ents.length,count);
  assert.equal(Game.p.hasKey,true);
 }
});

test('auxiliary locks are removed; exit key remains necessary and hidden coffins rise nearby',()=>{
 const {Game,Expedition,ExitGate,World}=setup(72);Game.getArtifact();World.altars.forEach(a=>a.done=true);
 assert.equal(Expedition.switches.length,0);assert.equal(ExitGate.open(),false);
 Expedition.keyCoffin.reveal();assert.ok(ExitGate.open());
 Game.load(6);const hidden=Expedition.hidden[0];assert.ok(hidden);hidden.open();assert.equal(hidden.opened,0);
 Game.p.x=hidden.x;Game.p.y=hidden.y+65;Expedition.update(2);assert.equal(hidden.hidden,false);hidden.open();assert.equal(hidden.opened,1);
 assert.equal(Game.p.hasKey,false);
});

test('moving walls change collision and never close on an actor',()=>{
 const {Game,Expedition,MapSys}=setup(112);const wall=Expedition.walls[0];assert.ok(wall);
 Game.p.x=wall.x;Game.p.y=wall.y+50;Expedition.update(2);assert.equal(MapSys.t[wall.at],0);
 Game.p.x=wall.x;Game.p.y=wall.y;wall.target=1;Expedition.update(2);assert.equal(MapSys.t[wall.at],0);
 Game.p.x+=100;Expedition.update(2);assert.equal(MapSys.t[wall.at],1);
});

test('relic collection keeps actual icons and values; restarting clears it',()=>{
 const {Game,RELIC_VALUES,els}=setup();Game.getArtifact();Game.getArtifact();assert.deepEqual([...Game.collected],[0]);
 assert.ok(els['relic-strip'].innerHTML.includes(String(RELIC_VALUES[0])));
 Game.load(2);Game.getArtifact();assert.deepEqual([...Game.collected],[0,1]);
 assert.ok(els['relic-total'].textContent.includes(String(RELIC_VALUES[0]+RELIC_VALUES[1])));
 Game.restart();assert.equal(Game.collected.length,0);
});

test('creatures telegraph attacks, respect warding and use finite coffin spawns',()=>{
 const {Game,TombCreature}=setup();Game.p.inv=0;
 for(const kind of ['worm','beetle','spider','bat']){
  const c=new TombCreature(Game.p.x,Game.p.y,kind);c.cooldown=0;Game.p.hp=5;Game.p.inv=0;
  c.update(.01,Game.p);assert.equal(Game.p.hp,5);assert.ok(c.windup>0);
  c.update(.6,Game.p);assert.equal(Game.p.hp,4);
  c.cooldown=0;Game.p.inv=0;Game.p.buffs.hoof=1;c.update(1,Game.p);assert.equal(Game.p.hp,4);Game.p.buffs.hoof=0;
 }
});

test('sealed chambers have one moving entrance and required relic/key remain outside',()=>{
 const {Game,Expedition,World,MapSys}=setup(81);
 for(let lvl=1;lvl<=10;lvl++){
  Game.load(lvl);assert.ok(Expedition.sealedRooms.length);
  for(const r of Expedition.sealedRooms){
   const walls=Expedition.walls.filter(w=>w.room===r);assert.equal(walls.length,1);const w=walls[0];
   const perimeter=[];for(let x=r.x-1;x<=r.x+r.w;x++)perimeter.push((r.y-1)*60+x,(r.y+r.h)*60+x);
   for(let y=r.y;y<r.y+r.h;y++)perimeter.push(y*60+r.x-1,y*60+r.x+r.w);
   assert.ok(perimeter.every(at=>MapSys.t[at]===1));
   assert.ok(!World.inside(r,Expedition.keyCoffin.x,Expedition.keyCoffin.y));assert.ok(!World.inside(r,Game.artifactPos.x,Game.artifactPos.y));
   assert.equal(Expedition.switches.length,0);
   assert.ok(Game.ents.some(c=>c.type==='coffin'&&World.inside(r,c.x,c.y)&&c.payload?.loot?.some(k=>['item_shovel','item_jade'].includes(k))));
   Game.p.x=w.x;Game.p.y=w.y;Expedition.update(2);assert.equal(MapSys.t[w.at],0);
  }
 }
});

test('trap projectiles kill zombies and explosions respect walls',()=>{
 const {Game,MapSys,Zombie,Projectile,TombDangers}=setup();MapSys.t.fill(0);Game.p.x=200;Game.p.y=300;Game.ents=[Game.p];
 const z=new Zombie(150,100,0);Game.spawn(z);
 for(let i=0;i<3;i++){Game.elapsed=i;new Projectile(100,100,0,'ARROW').update(.3,Game.p);}assert.equal(z.dead,1);
 const other=new Zombie(150,150,0);Game.spawn(other);MapSys.t[2*60+3]=1;Game.elapsed=5;TombDangers.blast(175,75,120,3);assert.equal(other.dead,0);
 MapSys.t.fill(0);TombDangers.blast(175,75,120,3);assert.equal(other.dead,1);
});

test('explosive coffins warn before blast and only explode once',()=>{
 const {Game,Expedition,TombDangers}=setup();const c=Expedition.coffins.find(c=>c.explosive);assert.ok(c);c.reveal();assert.equal(c.fuse,1.4);
 Game.p.x=c.x;Game.p.y=c.y+35;Game.p.inv=0;TombDangers.vents=[];TombDangers.update(.5);assert.equal(Game.p.hp,5);TombDangers.update(1);assert.equal(Game.p.hp,4);
 const count=TombDangers.bursts.length;c.reveal();assert.equal(c.fuse,0);assert.equal(TombDangers.bursts.length,count);
});

test('beetle burrows respawn bounded stompable creatures; water rolls safely and smoke leaves sight radius unchanged',()=>{
 const {Game,TombDangers,MapSys,World}=setup();MapSys.t.fill(0);Game.ents=[Game.p];Game.p.x=500;Game.p.y=500;
 const source={x:500,y:500,kind:'beetle',timer:0};TombDangers.sources=[source];TombDangers.vents=[];
 for(let i=0;i<20;i++)TombDangers.update(4);assert.equal(Game.ents.filter(e=>e.source===source&&!e.dead).length,5);
 Game.p.moving=true;for(const e of Game.ents.filter(e=>e.source===source))e.update(.01,Game.p);assert.equal(Game.ents.filter(e=>e.source===source&&!e.dead).length,0);
 TombDangers.update(4);assert.equal(Game.ents.filter(e=>e.source===source&&!e.dead).length,1);
 const jet={x:450,y:500,angle:0,kind:'water',state:'active',timer:3,age:2,cooldown:0,length:180};TombDangers.vents=[jet];TombDangers.update(.1);assert.ok(Game.p.rollTime>0);
 MapSys.t[10*60+11]=1;Game.p.update(.45);assert.ok(Game.p.x<550);
 Game.p.x=500;jet.kind='smoke';const fog=World.sight();TombDangers.vents=[];assert.equal(World.sight(),fog);
 assert.ok(Game.settlement().includes('人民币'));Game.getArtifact();assert.ok(Game.settlement().includes('¥1,200'));
});


test('hidden jets trigger suddenly at close range, cool down, and smoke grows above the scene',()=>{
 const {Game,TombDangers,MapSys,World,calls,Scene}=setup();MapSys.t.fill(0);Game.ents=[Game.p];Game.p.x=900;Game.p.y=900;TombDangers.sources=[];
 const v={x:500,y:500,kind:'smoke',angle:0,state:'idle',timer:0,age:0,cooldown:0};TombDangers.vents=[v];
 TombDangers.update(5);assert.equal(v.state,'idle');assert.equal(TombDangers.clouds.length,0);
 Game.p.x=550;Game.p.y=500;TombDangers.update(.1);assert.equal(v.state,'active');assert.equal(TombDangers.clouds.length,1);
 const sight=World.sight();
 TombDangers.update(2);assert.ok(TombDangers.clouds[0].age>=2);assert.equal(World.sight(),sight);
 TombDangers.update(2);assert.equal(v.state,'cooldown');
 MapSys.t[10*60+10]=1;Game.p.x=500;Game.p.y=700;v.state='idle';TombDangers.update(.1);assert.equal(v.state,'idle');
});

test('duplicate equipment is always picked up without stacking jade protection',()=>{
 const {Game}=setup();Game.getItem('item_jade');Game.getItem('item_compass');
 const Item=Game.ents.find(e=>e.type==='ground_item').constructor;
 for(const code of ['item_jade','item_compass','item_wine']){const item=new Item(Game.p.x,Game.p.y,code);item.update(.01,Game.p);assert.equal(item.dead,1);}
 assert.equal(Game.p.buffs.jade,1);assert.equal(Game.p.hp,5);
});

test('traps are dispersed after coffin placement',()=>{
 const {Game,TombDangers}=setup(63);
 for(let lvl=1;lvl<=10;lvl++){Game.load(lvl);const traps=Game.ents.filter(e=>e.type==='trap');for(let i=0;i<traps.length;i++)for(let j=i+1;j<traps.length;j++)assert.ok(Math.hypot(traps[i].x-traps[j].x,traps[i].y-traps[j].y)>=175);assert.equal(TombDangers.vents.length,3);}
});

test('shovel pickup unlocks attack; melee respects cooldown, walls, range, pause and restart',()=>{
 const {Game,MapSys,Zombie,els}=setup();MapSys.t.fill(0);Game.ents=[Game.p];Game.p.x=125;Game.p.y=125;
 const z=new Zombie(185,125,0);Game.spawn(z);
 assert.equal(Game.p.attack(),false);Game.refreshBuffs();assert.equal(els['attack-btn'].style.display,'none');
 Game.getItem('item_shovel');assert.equal(els['attack-btn'].style.display,'flex');
 els['attack-btn'].handlers.click();assert.equal(z.hp,2);assert.equal(Game.p.attack(),false);
 Game.elapsed+=.7;Game.p.attackCooldown=0;MapSys.t[2*60+3]=1;Game.p.attack();assert.equal(z.hp,2);
 MapSys.t.fill(0);Game.p.attackCooldown=0;z.x=210;Game.p.attack();assert.equal(z.hp,2);
 z.x=185;Game.p.attackCooldown=0;Game.pause=1;assert.equal(Game.p.attack(),false);Game.pause=0;
 Game.p.attack();assert.equal(z.hp,1);Game.elapsed+=.7;Game.p.attackCooldown=0;Game.p.attack();assert.equal(z.dead,1);
 Game.restart();assert.equal(Game.p.hasShovel,false);assert.equal(els['attack-btn'].style.display,'none');
});

test('all continuous burrows contain beetles and stomping plays one sound',()=>{
 const {Game,TombCreature,AudioSys,TombDangers}=setup();let sounds=0;const play=AudioSys.playStomp;AudioSys.playStomp=()=>sounds++;
 assert.ok(TombDangers.sources.every(s=>s.kind==='beetle'));
 const c=new TombCreature(Game.p.x,Game.p.y,'beetle');c.stompable=true;Game.p.moving=true;c.update(.02,Game.p);c.update(.02,Game.p);assert.equal(c.dead,1);
 assert.equal(sounds,1);AudioSys.playStomp=play;AudioSys.muted=true;AudioSys.ctx={state:'running',createBuffer(){throw Error('muted sound');}};AudioSys.playStomp();
});

test('coffin pushing retains a displaced lid and non-loot decor never blocks movement',()=>{
 const {Game,Expedition,MapSys}=setup();const c=Expedition.coffins[0];Game.p.x=c.x;Game.p.y=c.y+40;
 c.interact(.3,Game.p);assert.equal(Game.p.pushingCoffin,c);assert.equal(Game.p.direction,3);assert.ok(c.interactTimer>0);
 c.interact(.31,Game.p);assert.equal(c.opened,1);assert.ok(Number.isFinite(c.lidDirX));
 c.update(.7);assert.equal(c.lidProgress,1);assert.equal(c.dead,0);
 const decor=Game.ents.find(e=>['burial_decor','bone_pile','tomb_remains'].includes(e.type));assert.ok(decor);MapSys.t.fill(0);assert.equal(MapSys.canOccupy(decor.x,decor.y,10),true);
});

test('jade suit break triggers its dedicated sound without losing health',()=>{
 const {Game,AudioSys}=setup();let breaks=0;AudioSys.playJadeBreak=()=>breaks++;Game.running=1;Game.p.inv=0;Game.p.buffs.jade=1;const hp=Game.p.hp;Game.p.hit();
 assert.equal(breaks,1);assert.equal(Game.p.hp,hp);assert.equal(Game.p.buffs.jade,0);
});
