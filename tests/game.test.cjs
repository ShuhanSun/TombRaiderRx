const {test}=require('node:test');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {setup}=require('./harness.cjs');

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
        assert.equal(seen.size,[...MapSys.t].filter(t=>t!==1).length);
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

test('wine is preserved at full health, sanctuary heals once and trap shots are telegraphed',()=>{
    const {Game,World,MapSys}=setup();
    const wine=Game.ents.find(e=>e.code==='item_wine');Game.p.x=wine.x;Game.p.y=wine.y;
    wine.update(1/60,Game.p);assert.equal(wine.dead,0);Game.p.hp=3;
    wine.update(1/60,Game.p);assert.equal(wine.dead,1);assert.equal(Game.p.hp,4);
    const shrine=World.altars.find(a=>a.kind==='sanctuary');assert.ok(shrine);
    Game.p.x=shrine.x;Game.p.y=shrine.y;
    for(let i=0;i<150;i++)World.update(1/60);
    assert.equal(Game.p.hp,5);assert.equal(shrine.done,true);
    const trap=Game.ents.find(e=>e.type==='trap');MapSys.t.fill(0);trap.cd=0;
    Game.p.x=trap.x+100;Game.p.y=trap.y;
    const before=Game.ents.filter(e=>e.type==='proj').length;
    trap.update(1/60,Game.p);assert.ok(trap.windup>0);assert.equal(Game.ents.filter(e=>e.type==='proj').length,before);
    for(let i=0;i<50;i++)trap.update(1/60,Game.p);
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

test('launcher turns smoothly across angle wrap and its muzzle matches the fired projectile',()=>{
    const {Game,MapSys,Trap}=setup();MapSys.t.fill(0);Game.ents=[Game.p];Game.p.x=400;Game.p.y=500;
    const trap=new Trap(500,500,0);trap.displayAim=Math.PI-.1;trap.aim=-Math.PI+.1;trap.windup=.01;
    trap.update(.01,Game.p);assert.ok(Math.abs(trap.displayAim-(Math.PI-.1))<=.03801);assert.equal(Game.ents.length,1);
    for(let i=0;i<10;i++)trap.update(.01,Game.p);
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

test('keys gate every lock; hidden coffins rise and trap switches telegraph damage',()=>{
 const {Game,Expedition,ExitGate,World}=setup(72);Game.getArtifact();World.altars.forEach(a=>a.done=true);
 assert.equal(ExitGate.open(),false);for(const s of Expedition.switches)assert.equal(Expedition.useSwitch(s),false);
 const hidden=Expedition.hidden[0];assert.ok(hidden);hidden.open();assert.equal(hidden.opened,0);
 Expedition.keyCoffin.reveal();assert.ok(ExitGate.open());
 const lift=Expedition.switches.find(s=>s.kind==='coffin');Expedition.useSwitch(lift);Expedition.update(2);assert.equal(hidden.hidden,false);hidden.open();assert.equal(hidden.opened,1);
 const trap=Expedition.switches.find(s=>s.kind==='trap');Game.p.x=trap.x;Game.p.y=trap.y;Game.p.inv=0;
 Expedition.useSwitch(trap);Expedition.update(.5);assert.equal(Game.p.hp,5);Expedition.update(.8);assert.equal(Game.p.hp,4);
 Game.load(2);assert.equal(Game.p.hasKey,false);
});

test('moving walls change collision and never close on an actor',()=>{
 const {Game,Expedition,MapSys}=setup(112);const wall=Expedition.walls[0];assert.ok(wall);
 wall.manual=true;wall.target=0;Expedition.update(2);assert.equal(MapSys.t[wall.at],0);
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
