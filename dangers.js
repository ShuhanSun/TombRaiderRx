const TombDangers={
 sources:[],vents:[],bursts:[],clouds:[],stains:[],
 enemies(){return Game.ents.filter(e=>!e.dead&&(e.type==='zombie'||e.type==='vermin'));},
 hurt(e,amount=1){
  if(e.dead||Game.elapsed<(e.hurtUntil||0))return false;
  e.hp=(e.hp??(e.type==='zombie'?(e.crawler?2:3):1))-amount;e.hurtUntil=Game.elapsed+.45;
  Game.addText(e.x,e.y,'−'+amount,'#e89975');
  if(e.hp<=0){e.dead=1;Game.spawn(new Effect(e.x,e.y,'burst'));}return true;
 },
 blast(x,y,radius,damage=3){
  this.bursts.push({x,y,radius,life:.65});Game.shake=12;AudioSys.playTrap(0);
  if(Math.hypot(Game.p.x-x,Game.p.y-y)<radius&&MapSys.lineClear(x,y,Game.p.x,Game.p.y))Game.p.hit();
  for(const e of this.enemies())if(Math.hypot(e.x-x,e.y-y)<radius&&MapSys.lineClear(x,y,e.x,e.y))this.hurt(e,damage);
 },
 setup(){
  this.sources=[];this.vents=[];this.bursts=[];this.clouds=[];this.stains=[];
  const options=Expedition.coffins.filter(c=>!c.hidden&&!c.locked&&!c.sealed);
  for(const c of options.slice(-Math.min(6,2+Math.floor(Game.lvl/2))))c.explosive=true;
  const anchors=Game.ents.filter(e=>e.type==='coffin'&&!e.hidden&&!e.sealed);
  const picked=[];
  const anchor=()=>{const choices=anchors.filter(c=>!picked.includes(c));choices.sort((a,b)=>{
   const score=c=>picked.length?Math.min(...picked.map(p=>Math.hypot(c.x-p.x,c.y-p.y))):c.royal?10000:0;return score(b)-score(a);
  });const c=choices[0]||Game.exitPos;picked.push(c);return c;};
  for(const t of Game.ents.filter(e=>e.type==='trap')){const c=anchor();t.x=c.x;t.y=c.y;World.mountTrap(t);}
  for(const kind of ['fire','water','smoke','fire','water','smoke']){
   const c=anchor(),t=new Trap(c.x,c.y,Game.lvl-1);World.mountTrap(t);t.vent=true;Game.spawn(t);
   this.vents.push({x:t.x,y:t.y,type:'jet',kind,angle:t.aim,length:0,cooldown:0,age:0,state:'idle',timer:0,revealed:false});
  }
  const rooms=World.rooms.filter(r=>!['entry','sealed','sanctuary'].includes(r.kind));
  for(let i=0;i<4;i++){const r=rooms[(i*3+Game.lvl)%rooms.length];
   let point;for(let yy=r.y;yy<r.y+r.h&&!point;yy++)for(let xx=r.x;xx<r.x+r.w&&!point;xx++){
    const p={x:xx*50+25,y:yy*50+25};if(!Game.ents.some(e=>['coffin','trap'].includes(e.type)&&Math.hypot(e.x-p.x,e.y-p.y)<60)&&Math.hypot(p.x-Game.exitPos.x,p.y-Game.exitPos.y)>90&&!Expedition.switches.some(s=>Math.hypot(s.x-p.x,s.y-p.y)<65))point=p;
   }
   if(point)this.sources.push({...point,type:'burrow',kind:'beetle',timer:3+i,dead:0});
  }
 },
 inJet(v,p){const dx=p.x-v.x,dy=p.y-v.y,along=dx*Math.cos(v.angle)+dy*Math.sin(v.angle),across=-dx*Math.sin(v.angle)+dy*Math.cos(v.angle);return along>5&&along<v.length&&Math.abs(across)<16+along*.1&&MapSys.lineClear(v.x,v.y,p.x,p.y);},
 addCloud(x,y,color='#66736b',duration=14){
  const dist=new Int16Array(MapSys.w*MapSys.h).fill(-1),at=Math.floor(y/50)*MapSys.w+Math.floor(x/50),queue=[at];dist[at]=0;
  for(let i=0;i<queue.length;i++)for(const to of [queue[i]-1,queue[i]+1,queue[i]-MapSys.w,queue[i]+MapSys.w]){
   if(to<0||to>=dist.length||Math.abs(to%MapSys.w-queue[i]%MapSys.w)>1||MapSys.t[to]===1||dist[to]>=0||dist[queue[i]]>=9)continue;
   dist[to]=dist[queue[i]]+1;queue.push(to);
  }
  this.clouds.push({x,y,color,dist,age:0,life:duration});if(this.clouds.length>12)this.clouds.shift();
 },
 coffinFX(c){
  this.stains.push({x:c.x,y:c.y,age:0,color:'#6f0915'});
  for(let i=0;i<5;i++)this.bursts.push({x:c.x+(i-2)*6,y:c.y+8+i%2*4,radius:16+i*3,life:.28+i*.035,blood:true});
 },
 drawStains(ctx,left=0,right=MapSys.w,top=0,bottom=MapSys.h){
  for(const s of this.stains){
   if(s.x<left*50-100||s.x>right*50+100||s.y<top*50-100||s.y>bottom*50+100)continue;
   const spread=1-Math.exp(-s.age*.38),r=9+47*spread;ctx.save();ctx.beginPath();
   const tx=Math.floor(s.x/50),ty=Math.floor(s.y/50);
   for(let y=ty-2;y<=ty+2;y++)for(let x=tx-2;x<=tx+2;x++)if(x>=0&&y>=0&&x<MapSys.w&&y<MapSys.h&&MapSys.t[y*MapSys.w+x]!==1)ctx.rect(x*50,y*50,50,50);
   ctx.clip();
   for(let i=0;i<7;i++){
    const angle=i*Math.PI*2/7+s.x*.01,px=s.x+Math.cos(angle)*r*.64,py=s.y+Math.sin(angle)*r*.52;
    const pool=ctx.createRadialGradient(px,py,1,px,py,r*.65);pool.addColorStop(0,'#36040cee');pool.addColorStop(.68,'#810d1be8');pool.addColorStop(1,'#a51b2940');
    ctx.fillStyle=pool;ctx.beginPath();ctx.ellipse(px,py,r*.65,r*.22,.06*Math.sin(angle),0,Math.PI*2);ctx.fill();
   }
   for(let i=0;i<8;i++){
    const angle=i*Math.PI/4+s.x*.013,len=spread*(34+(i%3)*8),sx=s.x+Math.cos(angle)*8,sy=s.y+Math.sin(angle)*6;
    ctx.strokeStyle=i%3===1?'#b51e2b':'#670714';ctx.lineWidth=2.2+(i%3);ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(sx+Math.cos(angle+.25)*len*.4,sy+Math.sin(angle+.25)*len*.3,sx+Math.cos(angle-.2)*len*.72,sy+Math.sin(angle-.2)*len*.65,sx+Math.cos(angle)*len,sy+Math.sin(angle)*len*.84);ctx.stroke();
   }
   ctx.strokeStyle='#e261633d';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(s.x-8,s.y+24,r*.45,r*.12,-.2,Math.PI,Math.PI*1.7);ctx.stroke();ctx.restore();
  }
 },
 drawClouds(ctx,left,right,top,bottom){
  for(const c of this.clouds){const radius=Math.min(360,c.age*34),fade=Math.min(1,c.life/3),density=Math.min(.25,c.age*.1)*fade;
   const reach=Math.ceil(radius/50)+2,cx=Math.floor(c.x/50),cy=Math.floor(c.y/50),cells=[];
   for(let y=Math.max(top,cy-reach);y<Math.min(bottom,cy+reach+1);y++)for(let x=Math.max(left,cx-reach);x<Math.min(right,cx+reach+1);x++){
    const dist=c.dist[y*MapSys.w+x];if(dist<0)continue;const amount=Math.max(0,Math.min(1,(radius-dist*50)/65));if(!amount)continue;
    cells.push({x,y,amount});
   }
   if(!cells.length)continue;ctx.save();ctx.beginPath();for(const p of cells)ctx.rect(p.x*50,p.y*50,50,50);ctx.clip();
   const puff=Art.smokePuff(c.color);for(const p of cells){const px=p.x*50+25+Math.sin(c.age*.8+p.y)*7,py=p.y*50+25+Math.cos(c.age*.6+p.x)*7;ctx.globalAlpha=density*p.amount;ctx.drawImage(puff,px-68,py-68,136,136);}ctx.restore();
  }
 },
 update(dt){
  this.clouds=this.clouds.filter(c=>{c.age+=dt;c.life-=dt;return c.life>0;});for(const s of this.stains)s.age+=dt;
  for(const c of Game.ents.filter(e=>e.fuse>0)){c.fuse=Math.max(0,c.fuse-dt);if(!c.fuse)this.blast(c.x,c.y,110,3);}
  this.bursts=this.bursts.filter(b=>(b.life-=dt)>0);
  for(const s of this.sources){
   // Dormant off-screen; the local population stays bounded without ending the source.
   if(Math.hypot(Game.p.x-s.x,Game.p.y-s.y)>650)continue;
   s.timer-=dt;if(s.timer<=0){s.timer=3.5;if(Game.ents.filter(e=>e.source===s&&!e.dead).length<5){const c=new TombCreature(s.x,s.y,s.kind);c.stompable=true;c.source=s;Game.spawn(c);}}
  }
  for(const v of this.vents){
   v.age+=dt;v.cooldown=Math.max(0,v.cooldown-dt);v.state=v.state||'idle';v.timer=v.timer||0;
   if(v.state==='idle'){
    if(Math.hypot(Game.p.x-v.x,Game.p.y-v.y)<165&&MapSys.lineClear(v.x,v.y,Game.p.x,Game.p.y)){v.state='active';v.timer=3.5;v.revealed=true;if(v.kind==='smoke')this.addCloud(v.x,v.y);}else continue;
   }else if(v.state==='active'){
    v.timer-=dt;if(v.timer<=0){v.state='cooldown';v.timer=5;}
   }else if(v.state==='cooldown'){
    v.timer-=dt;if(v.timer<=0)v.state='idle';continue;
   }
   v.length=0;for(let r=10;r<=200;r+=10){if(MapSys.get(v.x+Math.cos(v.angle)*r,v.y+Math.sin(v.angle)*r)===1)break;v.length=r;}
   if(v.state!=='active')continue;
   if(v.kind==='fire'){
    if(this.inJet(v,Game.p))Game.p.hit();
    for(const e of this.enemies())if(this.inJet(v,e))this.hurt(e,1);
   }
   if(v.kind==='water'&&!v.cooldown&&this.inJet(v,Game.p)&&!Game.p.rollTime){
    Game.p.rollTime=.65;Game.p.rollVX=Math.cos(v.angle)*290;Game.p.rollVY=Math.sin(v.angle)*290;v.cooldown=2;
   }
  }
 },
 render(ctx,e){
  if(e.type==='burrow'){
   ctx.save();ctx.fillStyle='#000';ctx.shadowColor='#050303';ctx.shadowBlur=10;ctx.beginPath();ctx.ellipse(e.x,e.y,20,12,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#766b51';ctx.lineWidth=4;ctx.stroke();ctx.restore();
   if(Math.hypot(e.x-Game.p.x,e.y-Game.p.y)<150)Art.label(ctx,e.x,e.y-28,curLang==='CN'?'尸鳖洞 · 移动踩杀':'BEETLE NEST · STOMP','#bca586');return true;
  }
  return false;
 },
 drawJets(ctx,left=0,right=MapSys.w,top=0,bottom=MapSys.h){
  for(const v of this.vents){
   if(!v.revealed&&v.state!=='active')continue;
   if(v.x<left*50-250||v.x>right*50+250||v.y<top*50-250||v.y>bottom*50+250)continue;
   ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.angle);
   ctx.filter=Expedition.style.filter;Art.trapEmitter(ctx,v.kind,0,0,52);ctx.filter='none';
   if(v.state!=='active'){ctx.restore();continue;}
   const colors={fire:['#ff4b1688','#ffce6877'],water:['#277ac0aa','#c0f6ffbb'],smoke:['#c0c8d588','#dde3eb44']},col=colors[v.kind];
   if(v.kind==='smoke'){ctx.restore();continue;}
   if(v.length>0){
    const plume=ctx.createLinearGradient(0,0,v.length,0);plume.addColorStop(0,col[1]);plume.addColorStop(.45,col[0]);plume.addColorStop(1,'#ffffff00');
    ctx.fillStyle=plume;ctx.beginPath();ctx.moveTo(9,-4);ctx.bezierCurveTo(v.length*.35,-12,v.length*.75,-22,v.length,-26);ctx.lineTo(v.length,26);ctx.bezierCurveTo(v.length*.75,22,v.length*.35,12,9,4);ctx.closePath();ctx.fill();
   }
   for(let i=0;i<18;i++){
    const d=(Game.elapsed*(v.kind==='water'?160:90)+i*17)%Math.max(1,v.length),width=3+d*.07;
    const cross=Math.sin(i*2.4+Game.elapsed*3)*width;
    ctx.globalAlpha=1-d/Math.max(1,v.length)*.75;
    if(v.kind==='smoke'){
     const puff=ctx.createRadialGradient(d,cross,0,d,cross,21);puff.addColorStop(0,'#bbc6d577');puff.addColorStop(1,'#bbc6d500');ctx.fillStyle=puff;ctx.fillRect(d-21,cross-21,42,42);
    }else if(v.kind==='fire'){
     ctx.fillStyle=i%3?'#ff831f88':'#ffe5a799';ctx.beginPath();ctx.moveTo(d-7,cross-3);ctx.quadraticCurveTo(d+8,cross-5,d+15,cross);ctx.quadraticCurveTo(d+2,cross+5,d-7,cross+3);ctx.fill();
    }else {ctx.strokeStyle=i%2?'#c5f8ffbb':'#7bc7f399';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(d-8,cross);ctx.lineTo(d+6,cross+1);ctx.stroke();}
   }
   ctx.restore();
  }
  for(const b of this.bursts){ctx.save();ctx.globalAlpha=Math.max(0,b.life/(b.blood?.42:.65));if(b.blood){ctx.fillStyle='#7b0817';ctx.beginPath();ctx.ellipse(b.x,b.y+(1-b.life/.42)*20,3+b.radius*.08,7,0,0,Math.PI*2);ctx.fill();}else{Art.glow(ctx,b.x,b.y,b.radius,'#ff6b2788');ctx.strokeStyle='#ffc369';ctx.lineWidth=8*b.life;ctx.beginPath();ctx.arc(b.x,b.y,b.radius*(1-b.life/.65),0,Math.PI*2);ctx.stroke();}ctx.restore();}
 }
};
