// Off-screen Canvas verification; this is not a browser or touch-device test.
const {setup}=require('../tests/harness.cjs');
const fs=require('node:fs');
const path=require('node:path');
const output=process.argv[2]||'tmp/render-check';fs.mkdirSync(output,{recursive:true});
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
(async()=>{
    const {Game,Art,World}=setup(2026);
    Art.sprites=await loadImage('out/assets/tomb-sprites.png');
    Art.walker=await loadImage('out/assets/raider-walk.png');Art.prepareWalker(()=>createCanvas(1,1));
    Art.zombies=await loadImage('out/assets/jiangshi-motion.png');Art.traps=await loadImage('out/assets/trap-motion.png');
    const atlas=await loadImage('out/assets/tomb-materials.png');
    Art.tiles=[];
    const xs=[0,313,626,940,1254],ys=[0,302,618,918,1254];
    for(let i=0;i<16;i++) {
        const c=createCanvas(100,100),x=i%4,y=Math.floor(i/4);
        c.getContext('2d').drawImage(atlas,xs[x]+2,ys[y]+2,xs[x+1]-xs[x]-4,ys[y+1]-ys[y]-4,0,0,100,100);Art.tiles.push(c);
    }
    Art.ready=true;
    for(const floor of [1,4,7]) {
        Game.load(floor);
        const c=createCanvas(390,844);Game.ctx=c.getContext('2d');Game.cvs=c;Game.width=390;Game.height=844;Game.dpr=1;
        if(floor>1) {const r=World.rooms.find(r=>r.kind===(floor===7?'seal':'trap'));Game.p.x=(r.x+r.w/2)*50;Game.p.y=(r.y+r.h/2)*50+45;}
        Game.elapsed=4.2;Game.shake=0;Game.p.inv=0;Game.render();
        fs.writeFileSync(path.join(output,'floor-'+floor+'.png'),c.toBuffer('image/png'));
    }
    const sheet=createCanvas(900,700),sc=sheet.getContext('2d');sc.fillStyle='#243234';sc.fillRect(0,0,900,700);
    for(let row=0;row<4;row++)for(let col=0;col<4;col++){Art.raider(sc,{direction:row,walkFrame:col,moving:true},65+col*95,100+row*145,105);Art.frame(sc,Art.zombies,row*4+col,480+col*105,100+row*145,105,105,true);}
    fs.writeFileSync(path.join(output,'motion.png'),sheet.toBuffer('image/png'));
    console.log('Rendered floors 1, 4 and 7 at 390×844 using real Canvas and atlas PNGs.');
})();
