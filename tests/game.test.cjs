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
        const relics=Game.ents.filter(e=>e.content==='artifact');assert.equal(relics.length,1);
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
    assert.equal(env.Game.ents.filter(e=>e.code==='item_compass').length,1);
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
    els['joystick-zone'].handlers.pointerdown(event(1));assert.ok(Input.x>0);
    els['sprint-btn'].handlers.pointerdown(event(2));assert.equal(Input.sprint,true);
    els['sprint-btn'].handlers.pointercancel(event(2));assert.equal(Input.sprint,false);assert.equal(Input.active,true);
    els['joystick-zone'].handlers.pointercancel(event(1));assert.equal(Input.active,false);
    Input.keys.ShiftRight=true;Input.update();assert.equal(Input.sprint,true);
    windowEvents.blur();assert.equal(Input.sprint,false);assert.equal(Game.pause,true);
});

test('ten-floor progression preserves equipment, floods only on pickup, and ends once',()=>{
    const {Game,MapSys,els,World}=setup();
    Game.p.hp=4;Game.p.sight=600;Game.p.hasCompass=1;
    for(let floor=1;floor<=10;floor++) {
        assert.equal(Game.lvl,floor);assert.equal(Game.art,floor-1);
        if(!World.theme.water)assert.equal([...MapSys.t].filter(t=>t===2).length,0);
        Game.getArtifact();Game.getArtifact();assert.equal(Game.art,floor);
        assert.ok([...MapSys.t].some(t=>t===2));
        World.altars.forEach(a=>a.done=true);Game.showExitModal();Game.confirmNextLevel();
        assert.equal(Game.p.hp,4);assert.equal(Game.p.sight,600);assert.equal(Game.p.hasCompass,1);
    }
    assert.equal(Game.running,0);assert.ok(els['victory-modal'].classList.contains('active'));
    Game.confirmNextLevel();assert.equal(Game.lvl,10);
    Game.restart();assert.equal(Game.p.hp,5);assert.equal(Game.p.hasCompass,0);
});

test('seals block the exit until all required altars are activated',()=>{
    const {Game,World}=setup();
    Game.load(7);Game.getArtifact();assert.equal(World.remaining(),2);assert.equal(World.canExit(),false);
    Game.p.x=Game.exitPos.x;Game.p.y=Game.exitPos.y;Game.step(1/60);assert.equal(Game.pause,false);
    Game.showExitModal();Game.confirmNextLevel();assert.equal(Game.lvl,7);Game.pause=false;
    for(const altar of World.altars.filter(a=>a.kind==='seal')) {
        Game.p.x=altar.x;Game.p.y=altar.y;
        for(let i=0;i<73;i++)World.update(1/60);
    }
    assert.equal(World.remaining(),0);assert.equal(World.canExit(),true);
    Game.showExitModal();Game.confirmNextLevel();assert.equal(Game.lvl,8);
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
