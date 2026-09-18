const fs=require('node:fs');
const {setup}=require('../tests/harness.cjs');
const {createCanvas,loadImage,GlobalFonts}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','QA');
(async()=>{
 const {Game,Art,BossFight}=setup();
 Art.bossSprites=await Promise.all(Array.from({length:10},(_,i)=>loadImage(`assets/boss-${i+1}.webp`)));
 const canvas=createCanvas(1200,1000),ctx=canvas.getContext('2d');ctx.fillStyle='#202b30';ctx.fillRect(0,0,1200,1000);
 for(const [row,level] of [1,3,6,10].entries()){
  Game.load(level);Game.ents.find(e=>e.royal).reveal();const b=BossFight.boss;b.rise=0;b.aim=.3;b.locked={x:b.x+30,y:b.y};
  for(let col=0;col<6;col++){
   ctx.save();ctx.translate(col*200+100,row*250+185);b.x=0;b.y=0;b.attackT=0;b.hitTimer=0;b.windup=0;b.moving=false;b.animTime=1;
   if(col===0){b.moving=true;b.stride=1.2;}
   if(col===1){b.windup=.35;}
   if(col===2){b.release();b.attackT=.31;}
   if(col===3)b.hitTimer=.32;
   if(col<4)b.draw(ctx);else{if(col===4){b.hitTimer=0;b.damage(b.maxHp);}const d=Game.ents.find(e=>e.type==='boss_death');d.age=col===4?.4:1.15;d.draw(ctx);}
   ctx.restore();ctx.fillStyle='#eee';ctx.textAlign='center';ctx.font='14px QA';ctx.fillText(`${level} / ${['MOVE','WINDUP','ATTACK','HIT','DEATH .4s','DEATH 1.15s'][col]}`,col*200+100,row*250+230);
  }
 }
 fs.mkdirSync('tmp/render-check',{recursive:true});fs.writeFileSync('tmp/render-check/boss-animation-states.png',canvas.toBuffer('image/png'));
})();
