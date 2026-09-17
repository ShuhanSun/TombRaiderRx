// Off-screen Canvas verification; this is not a browser or touch-device test.
const {setup}=require('../tests/harness.cjs');
const fs=require('node:fs');
const path=require('node:path');
const output=process.argv[2]||'tmp/render-check';fs.mkdirSync(output,{recursive:true});
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
(async()=>{
    const {Game,Art,World,Passage,els,ExitGate,Expedition,TombDangers}=setup(2026);
    Art.coffinDetails=await loadImage('assets/tomb-coffin-details.png');
    Art.expedition=await loadImage('assets/tomb-expedition.png');
    Art.stone=await loadImage('assets/tomb-stone-realistic.png');
    Art.sprites=await loadImage('assets/tomb-sprites.png');
    Art.walker=await loadImage('assets/raider-walk.png');Art.prepareWalker(()=>createCanvas(1,1));
    Art.zombies=await loadImage('assets/jiangshi-motion.png');Art.traps=await loadImage('assets/trap-motion.png');
    Art.mechanisms=await loadImage('assets/tomb-mechanisms.png');
    Art.shovelAttack=await loadImage('assets/raider-shovel-attack.png');
    Art.shovelItem=await loadImage('assets/entrenching-shovel.png');
    Art.remains=await loadImage('assets/tomb-remains.png');
    Art.coffinPush=await loadImage('assets/raider-coffin-push.png');
    Art.coffinLid=await loadImage('assets/coffin-lid.png');
    const atlas=await loadImage('assets/tomb-materials.png');
    Art.tiles=[];
    const xs=[0,313,626,940,1254],ys=[0,302,618,918,1254];
    for(let i=0;i<16;i++) {
        const c=createCanvas(400,400),x=i%4,y=Math.floor(i/4);
        c.getContext('2d').drawImage(atlas,xs[x]+2,ys[y]+2,xs[x+1]-xs[x]-4,ys[y+1]-ys[y]-4,0,0,400,400);Art.tiles.push(c);
    }
    Art.ready=true;
    for(const floor of [1,4,7]) {
        Game.load(floor);
        const c=createCanvas(390,844);Game.ctx=c.getContext('2d');Game.cvs=c;Game.width=390;Game.height=844;Game.dpr=1;
        if(floor>1) {const r=World.rooms.find(r=>r.kind===(floor===7?'seal':'trap'));Game.p.x=(r.x+r.w/2)*50;Game.p.y=(r.y+r.h/2)*50+45;}
        Game.getItem('item_shovel');Game.p.attackT=.18;Game.p.attackAngle=0;Game.elapsed=4.2;Game.shake=0;Game.p.inv=0;Game.render();
        fs.writeFileSync(path.join(output,'floor-'+floor+'.png'),c.toBuffer('image/png'));
    }
    const sheet=createCanvas(900,700),sc=sheet.getContext('2d');sc.fillStyle='#243234';sc.fillRect(0,0,900,700);
    for(let row=0;row<4;row++)for(let col=0;col<4;col++){Art.raider(sc,{direction:row,walkFrame:col,moving:true},65+col*95,100+row*145,105);Art.frame(sc,Art.zombies,row*4+col,480+col*105,100+row*145,105,105,true);}
    fs.writeFileSync(path.join(output,'motion.png'),sheet.toBuffer('image/png'));
    const pc=createCanvas(640,320);els['passage-scene'].width=640;els['passage-scene'].height=320;els['passage-scene'].getContext=()=>pc.getContext('2d');
    for(const next of [1,3,5,6,8,9,10]){Passage.open(next);Passage.time=2;Passage.draw();fs.writeFileSync(path.join(output,'passage-'+next+'.png'),pc.toBuffer('image/png'));}
    Game.load(4);const hazard=World.hazards[0];Game.p.x=hazard.x;Game.p.y=hazard.y+80;Game.elapsed=4.7;Game.render();fs.writeFileSync(path.join(output,'corridor.png'),Game.cvs.toBuffer('image/png'));
    for(const lvl of [1,2,3,4,5,6,7,8,9,10]){Game.load(lvl);Game.p.hasKey=true;Game.getArtifact();World.altars.forEach(a=>a.done=true);Game.p.x=ExitGate.switch.x;Game.p.y=ExitGate.switch.y+65;Game.render();fs.writeFileSync(path.join(output,'crank-'+lvl+'.png'),Game.cvs.toBuffer('image/png'));ExitGate.open();ExitGate.radius=5;Game.p.x=Game.exitPos.x;Game.p.y=Game.exitPos.y+100;Game.render();fs.writeFileSync(path.join(output,'flood-'+lvl+'.png'),Game.cvs.toBuffer('image/png'));}
    for(const lvl of [1,3,6,9,10]){Game.load(lvl);const royal=Game.ents.find(e=>e.royal);Game.p.x=royal.x;Game.p.y=royal.y+110;Game.render();fs.writeFileSync(path.join(output,'royal-'+lvl+'.png'),Game.cvs.toBuffer('image/png'));}
    Game.load(8);for(const c of Expedition.coffins.filter(c=>c.payload.enemy))c.reveal();const crawler=Game.ents.find(e=>e.crawler);Game.p.x=crawler.x+35;Game.p.y=crawler.y+80;Game.render();fs.writeFileSync(path.join(output,'crawler.png'),Game.cvs.toBuffer('image/png'));
    Game.load(4);for(const v of TombDangers.vents){v.age=3;v.state='active';v.timer=3;v.length=150;if(v.kind==='smoke'){TombDangers.addCloud(v.x,v.y);TombDangers.clouds[0].age=6;}Game.p.x=v.x+Math.cos(v.angle)*90;Game.p.y=v.y+Math.sin(v.angle)*90;Game.elapsed=3;Game.render();fs.writeFileSync(path.join(output,'jet-'+v.kind+'.png'),Game.cvs.toBuffer('image/png'));}
    const wall=Expedition.walls[0];if(wall){Game.p.x=wall.x;Game.p.y=wall.y+70;Game.render();fs.writeFileSync(path.join(output,'sealed-room.png'),Game.cvs.toBuffer('image/png'));}
    Game.load(8);const room=World.rooms.find(r=>r.kind==='burial');room.haze=true;room.flicker=true;
    const coffin=Game.ents.find(e=>e.type==='coffin'&&World.inside(room,e.x,e.y));
    Game.p.x=(room.x+room.w/2)*50;Game.p.y=(room.y+room.h/2)*50;Game.p.hasShovel=true;
    if(coffin){coffin.open();Game.p.x=coffin.x;Game.p.y=coffin.y+95;}
    TombDangers.stains.forEach(s=>s.age=6);Game.elapsed=5;Game.p.attackT=0;Game.render();fs.writeFileSync(path.join(output,'horror-room.png'),Game.cvs.toBuffer('image/png'));
    const attacks=createCanvas(760,440),ac=attacks.getContext('2d');ac.fillStyle='#33423e';ac.fillRect(0,0,760,440);
    for(let row=0;row<4;row++)for(let col=0;col<4;col++)Art.shovelRaider(ac,{direction:row,attackAngle:[Math.PI/2,Math.PI,0,-Math.PI/2][row],attackT:col===0?0:.48*(1-(col+.2)/4)},70+col*180,100+row*110,105);
    fs.writeFileSync(path.join(output,'shovel-motion.png'),attacks.toBuffer('image/png'));
    const walking=createCanvas(760,440),wc=walking.getContext('2d');wc.fillStyle='#33423e';wc.fillRect(0,0,760,440);
    for(let row=0;row<4;row++)for(let col=0;col<4;col++)Art.shovelRaider(wc,{direction:row,attackT:0,moving:true,walkFrame:col},70+col*180,100+row*110,105);
    fs.writeFileSync(path.join(output,'shovel-walk.png'),walking.toBuffer('image/png'));
    Game.load(5);const opening=Expedition.coffins[0];Game.p.x=opening.x;Game.p.y=opening.y+40;
    for(let i=0;i<4;i++){opening.interact(.16,Game.p);opening.update(.16);Game.elapsed+=.16;Game.render();fs.writeFileSync(path.join(output,'coffin-push-'+i+'.png'),Game.cvs.toBuffer('image/png'));}
    opening.open(Game.p);for(let i=0;i<4;i++){opening.update(.17);Game.elapsed+=.17;Game.render();fs.writeFileSync(path.join(output,'coffin-lid-'+i+'.png'),Game.cvs.toBuffer('image/png'));}
    console.log('Rendered floors 1, 4 and 7 at 390×844 using real Canvas and atlas PNGs.');
})();
