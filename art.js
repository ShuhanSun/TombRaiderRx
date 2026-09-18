/* Original generated atlases. Explicit source rectangles preserve uneven atlas gutters. */
const Art = {
    ready:false,failed:false,sprites:null,materials:null,tiles:[],smokePuffs:{},
    rects:[
        [0,0,314,321],[324,0,303,321],[638,0,302,321],[946,0,308,321],
        [0,326,314,299],[324,326,303,299],[637,326,303,299],[946,326,308,299],
        [0,630,314,288],[324,630,303,282],[637,630,303,288],[946,630,308,288],
        [0,924,314,330],[319,912,307,342],[635,934,305,320],[946,922,308,332]
    ],
    load() {
        const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
        const relicPaths=['relic-jade-bi','relic-boshan-incense','relic-bronze-mirror','relic-gold-belt-hook','relic-lacquer-box','relic-jade-cicada','relic-gilt-jue','relic-jade-plaque'].map(n=>`assets/${n}.webp`);
        return Promise.all([load('assets/tomb-sprites.png'),load('assets/tomb-materials.png'),load('assets/raider-walk.png'),load('assets/jiangshi-motion.png'),load('assets/trap-motion.png'),load('assets/tomb-mechanisms.png'),load('assets/tomb-stone-realistic.png'),load('assets/tomb-expedition.png'),load('assets/tomb-coffin-details.png'),load('assets/raider-shovel-attack.png'),load('assets/entrenching-shovel.png'),load('assets/tomb-remains.png'),load('assets/raider-coffin-push.png'),load('assets/coffin-lid.png'),load('assets/trap-emitters.png'),load('assets/raider-hold-breath.png'),load('assets/crawling-zombie-motion.webp'),load('assets/bat-flight-motion.webp'),load('assets/tomb-wall-candle.webp'),Promise.all(relicPaths.map(load))]).then(([sprites,materials,walker,zombies,traps,mechanisms,stone,expedition,coffinDetails,shovelAttack,shovelItem,remains,coffinPush,coffinLid,trapEmitters,breathRaider,crawlerMotion,batMotion,wallCandle,relics])=>{
            this.sprites=sprites;this.materials=materials;this.walker=walker;this.zombies=zombies;this.traps=traps;this.mechanisms=mechanisms;this.stone=stone;this.expedition=expedition;this.coffinDetails=coffinDetails;this.shovelAttack=shovelAttack;this.shovelItem=shovelItem;this.remains=remains;this.coffinPush=coffinPush;this.coffinLid=coffinLid;this.trapEmitters=trapEmitters;this.breathRaider=breathRaider;this.crawlerMotion=crawlerMotion;this.batMotion=batMotion;this.wallCandleImage=wallCandle;this.relics=relics;
            const xs=[0,313,626,940,1254],ys=[0,302,618,918,1254];
            for(let i=0;i<16;i++) {
                const c=document.createElement('canvas');c.width=c.height=400;
                const x=i%4,y=Math.floor(i/4);
                c.getContext('2d').drawImage(materials,xs[x]+2,ys[y]+2,xs[x+1]-xs[x]-4,ys[y+1]-ys[y]-4,0,0,400,400);
                this.tiles.push(c);
            }
            this.prepareWalker();this.prepareBreathRaider();this.ready=true;
        }).catch(()=>{this.failed=true;});
    },
    coffinDetail(ctx,index,x,y,size){
        if(!this.coffinDetails)return;const w=this.coffinDetails.width/2,h=this.coffinDetails.height/2;
        ctx.drawImage(this.coffinDetails,index%2*w,Math.floor(index/2)*h,w,h,x-size/2,y-size*.8,size,size);
    },
    shovelRaider(ctx,e,x,y,size){
        if(!this.shovelAttack||e.attackT<=0){this.raider(ctx,e,x,y,size*.88);return;}
        const xs=[0,330,650,997,1247],ys=[0,306,618,925,1261];
        const progress=e.attackT>0?1-e.attackT/.48:0;
        const pose=e.attackT>0?Math.min(3,Math.floor(progress*4)):0;
        const direction=Math.abs(Math.cos(e.attackAngle))>Math.abs(Math.sin(e.attackAngle))?(Math.cos(e.attackAngle)<0?1:2):(Math.sin(e.attackAngle)<0?3:0);
        // Mirror the coherent right-facing row for left-facing strikes.
        ctx.save();
        ctx.translate(x,y);if(direction===1)ctx.scale(-1,1);
        const row=direction===1?2:direction,sx=xs[pose]+4,sy=ys[row]+4,sw=xs[pose+1]-sx-4,sh=ys[row+1]-sy-4;
        ctx.drawImage(this.shovelAttack,sx,sy,sw,sh,-size/2,-size*.94,size,size);ctx.restore();
    },
    pushRaider(ctx,e,x,y,size){
        const c=e.pushingCoffin,progress=Math.min(.999,c?.pushProgress??Math.min(1,(c?.interactTimer||0)/.6));
        const dx=(c?.x??e.x)-e.x,dy=(c?.y??e.y)-e.y;
        // Resolve the live target, not a cached direction from before movement.
        const direction=Math.hypot(dx,dy)<.01?(e.pushDirection??e.direction??0):Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);
        if(!this.coffinPush){this.raider(ctx,{...e,direction},x,y,size);return;}
        // Inspected push atlas: DOWN, RIGHT, LEFT, UP (walk atlas swaps the side rows).
        const row=[0,2,1,3][direction];
        const pose=Math.min(3,Math.floor(progress*4));
        // Generated atlas gutters are uneven; equal quarters clip hats and leak adjacent poses.
        const xs=[0,307,625,950,1225],ys=[0,320,640,944,1284];
        const sx=xs[pose]*this.coffinPush.width/1225,sy=ys[row]*this.coffinPush.height/1284;
        const sw=(xs[pose+1]-xs[pose])*this.coffinPush.width/1225,sh=(ys[row+1]-ys[row])*this.coffinPush.height/1284;
        ctx.drawImage(this.coffinPush,sx,sy,sw,sh,x-size/2,y-size*.94,size,size);
    },
    motionFrame(ctx,atlas,index,x,y,size){const sw=atlas.width/4,sh=atlas.height;ctx.drawImage(atlas,(index%4)*sw,0,sw,sh,x-size/2,y-size*.72,size,size*.72);},
    relic(ctx,index,x,y,size=54){const image=this.relics?.[index];if(image)ctx.drawImage(image,x-size/2,y-size/2,size,size);},
    wallCandle(ctx,x,y,size=38,side='top'){
        if(!this.wallCandleImage)return;const lean=side==='left'?-.08:side==='right'?.08:0;
        ctx.save();ctx.translate(x,y);ctx.rotate(lean);ctx.drawImage(this.wallCandleImage,-size*.42,-size*.62,size*.84,size);ctx.restore();
    },
    coffinLidSprite(ctx,e,size=92){
        if(!this.coffinLid)return;
        const ease=1-Math.pow(1-(e.lidProgress||0),3),dx=(e.lidDirX||1)*ease*72,dy=(e.lidDirY||0)*ease*72;
        ctx.save();ctx.translate(e.x+dx,e.y+dy);ctx.rotate((e.lidDirX||1)*ease*.16);ctx.drawImage(this.coffinLid,-size*.31,-size*.55,size*.62,size);ctx.restore();
    },
    remainsSprite(ctx,index,x,y,size){
        if(!this.remains)return;
        const sw=this.remains.width/2,sh=this.remains.height/2;
        ctx.drawImage(this.remains,index%2*sw,Math.floor(index/2)*sh,sw,sh,x-size/2,y-size*.62,size,size*.67);
    },
    expeditionSprite(ctx,index,x,y,size){
        if(!this.expedition)return;
        const w=this.expedition.width/4,h=this.expedition.height/4;
        ctx.drawImage(this.expedition,index%4*w,Math.floor(index/4)*h,w,h,x-size/2,y-size*.8,size,size);
    },
    trapEmitterIndex(kind){return {ARROW:0,STONE:1,LOG:2,FIRE:3,fire:4,water:5,smoke:6,VENOM:7}[kind]??0;},
    trapEmitter(ctx,kind,x,y,size=48){
        if(!this.trapEmitters)return;
        const index=this.trapEmitterIndex(kind),sw=this.trapEmitters.width/4,sh=this.trapEmitters.height/2;
        ctx.drawImage(this.trapEmitters,index%4*sw,Math.floor(index/4)*sh,sw,sh,x-size/2,y-size/2,size,size);
    },
    stoneSurface(ctx,wall,x,y,dx=x*50,dy=y*50,dw=50,dh=50){
        if(!this.stone){ctx.drawImage(this.tiles[wall?12:0],dx,dy,dw,dh);return;}
        const half=this.stone.width/2,rows=12,cols=6;
        const tx=((x%cols)+cols)%cols,ty=((y%rows)+rows)%rows;
        // Mirror alternate repetitions to avoid a hard seam at atlas boundaries.
        const flipX=Math.abs(Math.floor(x/cols))%2,flipY=Math.abs(Math.floor(y/rows))%2;
        ctx.save();ctx.translate(dx+(flipX?dw:0),dy+(flipY?dh:0));ctx.scale(flipX?-1:1,flipY?-1:1);
        ctx.drawImage(this.stone,(wall?half:0)+(flipX?cols-1-tx:tx)*half/cols,(flipY?rows-1-ty:ty)*this.stone.height/rows,half/cols,this.stone.height/rows,0,0,dw+.2,dh+.2);ctx.restore();
    },
    prepareWalker(canvasFactory=()=>document.createElement('canvas')) {
        this.walker=this.keyedCharacter(this.walker,canvasFactory);
    },
    prepareBreathRaider(canvasFactory=()=>document.createElement('canvas')) {
        this.breathRaider=this.keyedCharacter(this.breathRaider,canvasFactory);
    },
    keyedCharacter(atlas,canvasFactory=()=>document.createElement('canvas')) {
        const c=canvasFactory();c.width=atlas.width;c.height=atlas.height;
        const ctx=c.getContext('2d');ctx.drawImage(atlas,0,0);
        const frame=ctx.getImageData(0,0,c.width,c.height),d=frame.data;
        // This atlas uses neutral grey/white as a color key. Brown clothing is retained.
        for(let i=0;i<d.length;i+=4) {
            const lo=Math.min(d[i],d[i+1],d[i+2]),hi=Math.max(d[i],d[i+1],d[i+2]);
            if(lo>145&&hi-lo<19)d[i+3]=0;
        }
        ctx.putImageData(frame,0,0);return c;
    },
    frame(ctx,atlas,index,x,y,w,h=w,feet=false) {
        if(!atlas)return;
        const bounds=[0,314,627,941,1254],col=index%4,row=Math.floor(index/4);
        const rows=atlas===this.walker?[0,319,625,919,1254]:atlas===this.traps?[0,310,604,890,1254]:[0,330,636,954,1254];
        let sy=rows[row],ey=rows[row+1];
        if(atlas===this.zombies) {
            const cuts=[[0,330,636,954,1254],[0,314,615,939,1254],[0,325,636,947,1254],[0,327,631,960,1254]][col];sy=cuts[row];ey=cuts[row+1];
        }
        ctx.drawImage(atlas,bounds[col],sy,bounds[col+1]-bounds[col],ey-sy,x-w/2,y-(feet?h*.94:h/2),w,h);
    },
    raider(ctx,e,x,y,size) {
        const top=y-size*.94,split=top+size*.73;
        // Stable torso plus an articulated boot section keeps the lantern consistent.
        ctx.save();ctx.beginPath();ctx.rect(x-size/2,top,size,size*.73);ctx.clip();
        this.frame(ctx,this.walker,e.direction*4,x,y,size,size,true);ctx.restore();
        ctx.save();ctx.beginPath();ctx.rect(x-size/2,split,size,size*.32);ctx.clip();
        ctx.translate(x,split);
        const passing=e.moving&&(e.walkFrame===1||e.walkFrame===3),front=e.direction===0||e.direction===3;
        const mirror=front&&e.moving&&e.walkFrame>=2?-1:1;
        ctx.scale(mirror*(passing?.7:1),passing?.92:1);
        this.frame(ctx,this.walker,e.direction*4+(front?0:e.moving?e.walkFrame:3),0,y-split,size,size,true);ctx.restore();
    },
    breathRaiderSprite(ctx,e,x,y,size) {
        if(!this.breathRaider){this.raider(ctx,e,x,y,size);return;}
        const sw=this.breathRaider.width/4,sh=this.breathRaider.height/4,frame=e.moving?e.walkFrame%4:0;
        ctx.drawImage(this.breathRaider,frame*sw,e.direction*sh,sw,sh,x-size/2,y-size*.88,size,size);
    },

    mechanism(ctx,index,x,y,size) {
        const xs=[0,319,638,956,1275],ys=[0,402,665,941,1233],col=index%4,row=Math.floor(index/4);
        ctx.drawImage(this.mechanisms,xs[col],ys[row],xs[col+1]-xs[col],ys[row+1]-ys[row],x-size/2,y-size/2,size,size);
    },
    sprite(ctx,index,x,y,size,flip=false) {
        if(!this.ready)return;
        const r=this.rects[index];ctx.save();ctx.translate(x,y);
        if(flip)ctx.scale(-1,1);
        ctx.drawImage(this.sprites,...r,-size/2,-size*.82,size,size);ctx.restore();
    },
    glow(ctx,x,y,r,color) {
        const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');
        ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    },
    smokePuff(color){
        if(this.smokePuffs[color])return this.smokePuffs[color];
        const c=this.smokeCanvasFactory?this.smokeCanvasFactory():document.createElement('canvas');c.width=c.height=136;const p=c.getContext('2d');
        const g=p.createRadialGradient(68,68,8,68,68,68);g.addColorStop(0,color+'a8');g.addColorStop(.65,color+'62');g.addColorStop(1,color+'00');
        p.fillStyle=g;p.fillRect(0,0,136,136);return this.smokePuffs[color]=c;
    },
    label(ctx,x,y,text,color='#ead6a9') {
        ctx.font='12px system-ui';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=5;ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.shadowBlur=0;
    },
    progress(ctx,x,y,ratio,color) {
        ctx.fillStyle='#080e10d9';ctx.fillRect(x-23,y,46,5);ctx.fillStyle=color;ctx.fillRect(x-23,y,46*Math.min(1,ratio),5);
    }
};

const Scene = {
    terrainCache:new Map(),
    invalidateTerrain(){this.terrainCache.clear();},
    drawTerrain(ctx,left,right,top,bottom,game,layer='base'){
        // Small, lazily rasterized chunks bound both first-use work and retained memory.
        const scale=Math.min(game.dpr,2),size=4,pixels=size*50;
        if(this.terrainMap!==MapSys.t||this.terrainScale!==scale||this.terrainStyle!==Expedition.style||this.terrainStone!==Art.stone){
            this.invalidateTerrain();this.terrainMap=MapSys.t;this.terrainScale=scale;
            this.terrainStyle=Expedition.style;this.terrainStone=Art.stone;
        }
        for(let cy=Math.floor(top/size);cy<Math.ceil(bottom/size);cy++)for(let cx=Math.floor(left/size);cx<Math.ceil(right/size);cx++){
            const key=cy*Math.ceil(MapSys.w/size)+cx;
            let canvas=this.terrainCache.get(key);
            if(!canvas){
                canvas=this.canvasFactory?this.canvasFactory():document.createElement('canvas');
                canvas.width=canvas.height=Math.ceil(pixels*scale);
                const tileCtx=canvas.getContext('2d');
                tileCtx.setTransform(scale,0,0,scale,-cx*pixels*scale,-cy*pixels*scale);
                this.paintTerrain(tileCtx,cx*size,Math.min(MapSys.w,(cx+1)*size),cy*size,Math.min(MapSys.h,(cy+1)*size));
                canvas.masonry=this.canvasFactory?this.canvasFactory():document.createElement('canvas');
                canvas.masonry.width=canvas.masonry.height=canvas.width;
                const wallCtx=canvas.masonry.getContext('2d');
                wallCtx.setTransform(scale,0,0,scale,-cx*pixels*scale,-cy*pixels*scale);
                wallCtx.save();wallCtx.filter=Expedition.style.filter;
                this.masonry(wallCtx,cx*size,Math.min(MapSys.w,(cx+1)*size),cy*size,Math.min(MapSys.h,(cy+1)*size));wallCtx.restore();
            }
            // Refresh insertion order for least-recently-used eviction.
            this.terrainCache.delete(key);this.terrainCache.set(key,canvas);
            ctx.drawImage(layer==='base'?canvas:canvas.masonry,cx*pixels,cy*pixels,pixels,pixels);
        }
        const visible=Math.ceil((right-left)/size+1)*Math.ceil((bottom-top)/size+1);
        const limit=Math.max(visible,Math.floor(32*1024*1024/(Math.ceil(pixels*scale)**2*8)));
        while(this.terrainCache.size>limit)this.terrainCache.delete(this.terrainCache.keys().next().value);
        if(layer!=='base')return;
        // Water remains animated above the static stone layer.
        for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(MapSys.t[y*MapSys.w+x]===2){
            ctx.fillStyle=`rgba(122,214,207,${.05+.035*Math.sin(game.elapsed*2+x*.9+y)})`;ctx.fillRect(x*50,y*50,50,50);
        }
    },
    paintTerrain(ctx,left,right,top,bottom){
        for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
            const at=y*MapSys.w+x,type=MapSys.t[at]===1&&Expedition.visualWallAt(at)?0:MapSys.t[at];
            const bleed=0,dx=x*50-bleed,dy=y*50-bleed,dsize=50+bleed*2;
            ctx.save();ctx.filter=Expedition.style.filter;Art.stoneSurface(ctx,type===1,x,y,dx,dy,dsize,dsize);
            ctx.globalAlpha=type===1?0:.2;ctx.drawImage(Art.tiles[type===1?Expedition.style.wall:Expedition.style.floor],x%8*50,y%8*50,50,50,dx,dy,dsize,dsize);ctx.restore();
            ctx.fillStyle=(type===1?World.theme.wallTint:World.theme.floorTint)+'38';ctx.fillRect(dx,dy,dsize,dsize);
            if(type!==1){ctx.fillStyle=World.theme.tint+'16';ctx.fillRect(x*50,y*50,50,50);}
            ctx.fillStyle=type===1?'#02070988':'#111c2520';ctx.fillRect(x*50,y*50,50,50);
        }
    },

    draw(game) {
        const ctx=game.ctx,w=game.width,h=game.height,p=game.p,time=game.elapsed;
        ctx.setTransform(game.dpr,0,0,game.dpr,0,0);
        const cx=p.x-w/2+(Math.random()-.5)*game.shake,cy=p.y-h/2+(Math.random()-.5)*game.shake;
        ctx.fillStyle=World.theme.background||'#060b0d';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(-cx,-cy);
        const left=Math.max(0,Math.floor(cx/50)),right=Math.min(MapSys.w,Math.ceil((cx+w)/50));
        const top=Math.max(0,Math.floor(cy/50)),bottom=Math.min(MapSys.h,Math.ceil((cy+h)/50));
        this.drawTerrain(ctx,left,right,top,bottom,game);
        const main=game.ents.find(e=>e.royal);
        if(main){ctx.save();ctx.fillStyle='#060c1399';ctx.fillRect(main.x-58,main.y-25,116,50);ctx.fillStyle=World.theme.tint+'55';ctx.fillRect(main.x-54,main.y-32,108,43);ctx.strokeStyle='#b4a28566';ctx.lineWidth=2;ctx.strokeRect(main.x-52,main.y-30,104,40);ctx.restore();}
        TombDangers.drawStains(ctx,left,right,top,bottom);
        this.roomAtmosphere(ctx,time,'under',left,right,top,bottom);
        ExitGate.draw(ctx,left,right,top,bottom);
        this.drawTerrain(ctx,left,right,top,bottom,game,'masonry');
        for(const wall of Expedition.walls)Expedition.render(ctx,wall);
        this.tombTraces(ctx,left,right,top,bottom);
        for(const hazard of World.hazards) {
            if(hazard.x<(left-1)*50||hazard.x>(right+1)*50||hazard.y<(top-1)*50||hazard.y>(bottom+1)*50)continue;
            const phase=World.phase(hazard),active=phase>4.5,warn=phase>3.2;
            const kind=hazard.kind==='poison'?12:hazard.kind==='fire'?8:6;
            const index=kind===6?6:kind+(active?2:warn?1:0);
            if(active||warn)Art.glow(ctx,hazard.x,hazard.y,43,hazard.kind==='poison'?'#8bc85038':'#f99a4538');
            Art.frame(ctx,Art.traps,index,hazard.x,hazard.y,50);
            if(active&&kind===6) {
                // Raise the spikes over the plate during the first 0.12 seconds.
                ctx.save();ctx.globalAlpha=Math.min(1,(phase-4.5)/.12);
                Art.frame(ctx,Art.traps,7,hazard.x,hazard.y-2,50);ctx.restore();
            }
            if(warn&&!active)Art.label(ctx,hazard.x,hazard.y-37,curLang==='CN'?'避开机关':'MOVE AWAY','#ffc39b');
        }
        const visible=e=>!Expedition.hiddenRoomAt(e.x,e.y)&&e.x>cx-100&&e.x<cx+w+100&&e.y>cy-100&&e.y<cy+h+100;
        const objects=[...World.props.map(e=>({...e,type:'decoration'})),...World.altars.map(e=>({...e,type:'altar'})),...game.ents.filter(e=>!e.dead&&(!e.hidden||e.rising)),...Expedition.switches,...TombDangers.sources,ExitGate.switch,...(World.canExit()?[{...game.exitPos,type:'exit'}]:[])].filter(visible).sort((a,b)=>a.y-b.y);
        // Ground remains must never cover an actor's body when their sort anchors overlap.
        for(const e of objects.filter(e=>['tomb_remains','bone_pile'].includes(e.type)))this.entity(ctx,e,game);
        for(const e of objects.filter(e=>!['tomb_remains','bone_pile'].includes(e.type)))this.entity(ctx,e,game);
        TombDangers.drawJets(ctx,left,right,top,bottom);
        this.roomAtmosphere(ctx,time,'over',left,right,top,bottom);
        for(const t of game.texts) {ctx.save();ctx.translate(t.x,t.y);t.draw(ctx);ctx.restore();}
        ctx.restore();
        this.drawDarkness(ctx,w,h,cx,cy,time,left,right,top,bottom,game);
        // The carried lamp always keeps the player readable.
        ctx.save();ctx.translate(-cx,-cy);
        this.entity(ctx,p,game);
        if(p.hasCompass) {
            const target=World.target();
            if(target) {
                const angle=Math.atan2(target.y-p.y,target.x-p.x);
                ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.translate(65,0);
                ctx.fillStyle='#f2cf87';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-6,-6);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.restore();
            }
        }
        TombDangers.drawClouds(ctx,left,right,top,bottom);
        World.drawRoomLighting(ctx,time);
        this.emissiveLights(ctx,time,left,right,top,bottom,game);
        Expedition.drawHiddenRooms(ctx);
        ctx.restore();
    },
    roomAtmosphere(ctx,time,layer,left=0,right=MapSys.w,top=0,bottom=MapSys.h){
        for(const r of World.rooms){
            if(r.x+r.w<left||r.x>right||r.y+r.h<top||r.y>bottom)continue;
            const x=r.x*50,y=r.y*50,w=r.w*50,h=r.h*50;
            if(layer==='under'&&r.flicker){
                const pulse=.72+.18*Math.sin(time*7+r.x)+.1*Math.sin(time*17+r.y);
                const lx=(r.x+r.w*.34)*50,ly=(r.y+r.h*.42)*50;
                ctx.save();const glow=ctx.createRadialGradient(lx,ly,6,lx,ly,Math.max(95,w*.55));
                glow.addColorStop(0,`rgba(231,151,54,${.22*pulse})`);glow.addColorStop(.5,`rgba(128,70,24,${.09*pulse})`);glow.addColorStop(1,'rgba(20,8,4,0)');ctx.fillStyle=glow;ctx.fillRect(x,y,w,h);
                ctx.fillStyle=`rgba(255,184,70,${.6*pulse})`;ctx.beginPath();ctx.ellipse(lx,ly,3.5,8,Math.sin(time*5)*.12,0,Math.PI*2);ctx.fill();ctx.restore();
            }
            if(layer==='over'&&r.haze){
                ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
                const fog=Art.smokePuff('#9aa6a0'),radius=Math.max(70,w*.32);
                for(let i=0;i<5;i++){
                    const px=x+((i*.23+.11+Math.sin(time*.08+i)*.05)%1)*w,py=y+(i%2?.34:.7)*h+Math.sin(time*.22+i*2)*14;
                    ctx.globalAlpha=.16;ctx.drawImage(fog,px-radius,py-radius,radius*2,radius*2);
                }
                ctx.restore();
            }
        }
    },
    masonry(ctx,left,right,top,bottom){
        const open=(x,y)=>x>=0&&y>=0&&x<MapSys.w&&y<MapSys.h&&MapSys.t[y*MapSys.w+x]!==1;
        const edges=[],fronts=[];
        for(let y=Math.max(0,top-2);y<Math.min(MapSys.h,bottom+2);y++)for(let x=Math.max(0,left-2);x<Math.min(MapSys.w,right+2);x++){
            if(MapSys.t[y*MapSys.w+x]!==1||Expedition.visualWallAt(y*MapSys.w+x))continue;
            const px=x*50,py=y*50-12;
            if(open(x,y+1)){edges.push([[px,py+50],[px+50,py+50]]);fronts.push({x:px,y:py+50});}
            if(open(x,y-1))edges.push([[px+50,py],[px,py]]);
            if(open(x-1,y))edges.push([[px,py],[px,py+50]]);
            if(open(x+1,y))edges.push([[px+50,py+50],[px+50,py]]);
        }
        // Merge adjoining faces into one slab: no per-tile rounded ends or shadow seams.
        fronts.sort((a,b)=>a.y-b.y||a.x-b.x);
        for(let i=0;i<fronts.length;){const start=fronts[i++];let end=start.x+50;while(i<fronts.length&&fronts[i].y===start.y&&fronts[i].x===end){end+=50;i++;}
            const y=start.y,face=ctx.createLinearGradient(0,y,0,y+39);face.addColorStop(0,'#a49c8177');face.addColorStop(.12,'#303736ee');face.addColorStop(1,'#101717');
            ctx.save();ctx.fillStyle=face;ctx.beginPath();ctx.roundRect(start.x-1,y,end-start.x+2,39,10);ctx.fill();
            const shadow=ctx.createLinearGradient(0,y+33,0,y+72);shadow.addColorStop(0,'#000000c0');shadow.addColorStop(1,'#00000000');ctx.fillStyle=shadow;ctx.fillRect(start.x-7,y+33,end-start.x+14,39);ctx.restore();
        }
        const key=p=>p.join(','),remaining=new Map(edges.map(e=>[key(e[0]),e]));
        ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
        while(remaining.size){const first=remaining.values().next().value,path=[first[0],first[1]];remaining.delete(key(first[0]));let next;
            while((next=remaining.get(key(path[path.length-1])))){remaining.delete(key(next[0]));path.push(next[1]);}
            const closed=key(path[0])===key(path[path.length-1]);if(closed)path.pop();
            const point=(from,to,d)=>{const length=Math.hypot(to[0]-from[0],to[1]-from[1]);return [from[0]+(to[0]-from[0])*d/length,from[1]+(to[1]-from[1])*d/length];};
            if(closed){const start=point(path[0],path[path.length-1],10);ctx.moveTo(...start);}else ctx.moveTo(...path[0]);
            for(let i=closed?0:1;i<(closed?path.length:path.length-1);i++){
                const prev=path[(i+path.length-1)%path.length],p=path[i],after=path[(i+1)%path.length],before=point(p,prev,10),out=point(p,after,10);
                ctx.lineTo(...before);ctx.quadraticCurveTo(...p,...out);
            }
            if(closed)ctx.closePath();else ctx.lineTo(...path[path.length-1]);
        }
        ctx.strokeStyle='#070d0fde';ctx.lineWidth=13;ctx.shadowColor='#000';ctx.shadowBlur=12;ctx.shadowOffsetY=8;ctx.stroke();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#b5ad9066';ctx.lineWidth=3;ctx.stroke();ctx.restore();
    },
    drawDarkness(ctx,w,h,cx,cy,time,left,right,top,bottom,game){
        const pad=24;
        const mask=this.lightMask||(this.lightMask=this.canvasFactory?this.canvasFactory():document.createElement('canvas'));
        if(mask.width!==w+pad*2||mask.height!==h+pad*2){mask.width=w+pad*2;mask.height=h+pad*2;}
        const m=mask.getContext('2d');m.clearRect(0,0,mask.width,mask.height);
        // A translucent earth-brown ambient veil preserves stone texture and
        // wall height. Darkness comes from light falloff, never a pure-black slab.
        m.fillStyle='rgba(8,10,10,.78)';m.fillRect(0,0,mask.width,mask.height);
        m.save();m.globalCompositeOperation='destination-out';
        const illuminate=(x,y,r,color,strength=1)=>{
            if(x+r<cx||x-r>cx+w||y+r<cy||y-r>cy+h||Expedition.hiddenRoomAt(x,y))return;
            m.save();m.beginPath();
            // Rays stop at stone so a lamp cannot illuminate the next room through a wall.
            for(let i=0;i<=64;i++){
                const a=i/64*Math.PI*2,dx=Math.cos(a),dy=Math.sin(a);let d=8;
                for(;d<r;d+=9){const tx=Math.floor((x+dx*d)/50),ty=Math.floor((y+dy*d)/50);if(tx<0||ty<0||tx>=MapSys.w||ty>=MapSys.h||MapSys.t[ty*MapSys.w+tx]===1)break;}
                const px=x-cx+pad+dx*Math.min(r,d+16),py=y-cy+pad+dy*Math.min(r,d+16);if(i===0)m.moveTo(px,py);else m.lineTo(px,py);
            }
            m.closePath();m.clip();const g=m.createRadialGradient(x-cx+pad,y-cy+pad,0,x-cx+pad,y-cy+pad,r);g.addColorStop(0,`rgba(0,0,0,${strength})`);g.addColorStop(.28,`rgba(0,0,0,${strength*.82})`);g.addColorStop(.7,`rgba(0,0,0,${strength*.28})`);g.addColorStop(1,'rgba(0,0,0,0)');m.fillStyle=g;m.fillRect(x-cx+pad-r,y-cy+pad-r,r*2,r*2);m.restore();
        };
        illuminate(game.p.x,game.p.y,World.sight(),'#ffd090',.96);
        World.drawRoomLighting(m,time,illuminate);this.emissiveLights(m,time,left,right,top,bottom,game,illuminate);
        m.restore();ctx.save();ctx.filter='blur(7px)';ctx.drawImage(mask,-pad,-pad);ctx.restore();
    },
    emissiveLights(ctx,time,left,right,top,bottom,game,illuminate=null){
        const light=(x,y,r,color,alpha=1)=>{if(x<(left-3)*50||x>(right+3)*50||y<(top-3)*50||y>(bottom+3)*50||Expedition.hiddenRoomAt(x,y))return;if(illuminate){illuminate(x,y,r,color,Math.min(.85,alpha*.8));return;}ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;Art.glow(ctx,x,y,r,color);ctx.restore();};
        const pulse=.86+.12*Math.sin(time*7.4);
        for(const p of World.props)if(p.glow)light(p.x,p.y-15,125,'#ec9d3d66',pulse);
        for(const h of World.hazards)if(h.kind==='fire'){const phase=World.phase(h);if(phase>3.2)light(h.x,h.y,phase>4.5?125:78,'#ff6b2488',pulse);}
        for(const v of TombDangers.vents)if(v.kind==='fire'&&v.revealed){light(v.x,v.y,105,'#ff73269a',pulse);if(v.state==='active')light(v.x+Math.cos(v.angle)*v.length*.38,v.y+Math.sin(v.angle)*v.length*.38,155,'#ff913a86',pulse);}
        for(const e of game.ents)if(e.type==='burial_decor'&&e.sprite===3)light(e.x,e.y-12,135,'#ee8d3670',pulse);
        for(const e of game.ents)if((e.type==='proj'&&e.pType==='FIRE')||e.fuse>0)light(e.x,e.y,e.fuse>0?110:64,'#ff762f88',pulse);
        if(ExitGate.flood?.name==='岩浆'&&ExitGate.radius>0)for(let y=top;y<bottom;y+=2)for(let x=left;x<right;x+=2){const px=x*50+25,py=y*50+25,l=ExitGate.levelAt(px,py);if(l>.18)light(px,py,78,'#ff541c70',Math.min(1,l)*pulse);}
    },
    tombTraces(ctx,left,right,top,bottom){
        for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
            if(MapSys.t[y*MapSys.w+x]===1)continue;
            const seed=(x*73+y*191+Game.lvl*31)%97,px=x*50+25,py=y*50+25;
            if(seed<5){
                ctx.save();ctx.fillStyle='#4a1014b0';
                for(let i=0;i<9;i++){const a=i*2.4+seed,r=3+i*1.8;ctx.beginPath();ctx.ellipse(px+Math.cos(a)*r,py+Math.sin(a)*r*.5,2+(i%4)*2,1+i%3, a,0,Math.PI*2);ctx.fill();}
                ctx.strokeStyle='#58131799';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.bezierCurveTo(px+6,py+12,px-5,py+16,px+8,py+23);ctx.stroke();ctx.restore();
            }
            if(seed===9){ctx.save();ctx.translate(px,py);ctx.rotate(x+y);ctx.strokeStyle='#c3b89a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-8,-2);ctx.lineTo(9,3);ctx.moveTo(-5,7);ctx.lineTo(6,-7);ctx.stroke();ctx.fillStyle='#a89e87';ctx.beginPath();ctx.ellipse(11,-5,5,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#161b16';ctx.fillRect(8,-7,2,2);ctx.fillRect(12,-7,2,2);ctx.restore();}
            const room=World.rooms[World.roomTiles[y*MapSys.w+x]];
            if(room&&x===room.x+1&&y===room.y+1){ctx.save();ctx.globalAlpha=.48;ctx.translate(px,py);ctx.strokeStyle=World.theme.tint;ctx.lineWidth=2;ctx.strokeRect(-18,-18,36,36);ctx.font='24px serif';ctx.textAlign='center';ctx.fillStyle=World.theme.tint;ctx.fillText(room.kind==='exit'?'奠':World.theme.motif,0,9);ctx.restore();}
        }
    },
    entity(ctx,e,game) {
        if(Expedition.render(ctx,e))return;
        const time=game.elapsed,cn=curLang==='CN',distance=Math.hypot(e.x-game.p.x,e.y-game.p.y);
        if(e.type==='arrival_coffin'){Art.coffinDetail(ctx,1,e.x,e.y,155);return;}
        if(e.type==='bone_pile'){Art.coffinDetail(ctx,3,e.x,e.y,e.size);return;}
        if(e.type==='tomb_remains'){Art.remainsSprite(ctx,e.variant,e.x,e.y,e.size);return;}
        if(e.type==='decoration') {if(e.glow)Art.glow(ctx,e.x,e.y-18,95,'#e9aa342b');if(e.atlas==='expedition')Art.expeditionSprite(ctx,e.sprite,e.x,e.y,e.size);else Art.sprite(ctx,e.sprite,e.x,e.y,e.size);return;}
        if(e.type==='gate_switch') {
            const open=ExitGate.remaining>0;
            Art.glow(ctx,e.x,e.y,65,open?'#e4b95555':'#d4bd7040');
            Art.mechanism(ctx,open?1:0,e.x,e.y-15,84);
            Art.label(ctx,e.x,e.y-65,open?(cn?`闸门开启 ${Math.ceil(ExitGate.remaining)}秒`:`OPEN ${Math.ceil(ExitGate.remaining)}s`):ExitGate.ready()?(cn?'驻足拉闸 · 开启盗洞':'STAND TO TURN CRANK'):(cn?(game.p.hasKey?'机械开关 · 封印未解除':'机械开关 · 需要棺中钥匙'):'CRANK · KEY / SEALS REQUIRED'));
            if(ExitGate.progress>0)Art.progress(ctx,e.x,e.y-52,ExitGate.progress,'#efd496');return;
        }
        if(e.type==='exit') {
            Art.coffinDetail(ctx,0,e.x,e.y,160);Art.label(ctx,e.x,e.y-125,cn?`盗洞 · ${Math.ceil(ExitGate.remaining)}秒`:`EXIT · ${Math.ceil(ExitGate.remaining)}s`,'#f5d592');return;
        }
        if(e.type==='altar') {
            const col=e.kind==='seal'?'#e7be6c':'#8fdbbd';
            if(!e.done)Art.glow(ctx,e.x,e.y-10,60,col+'40');
            ctx.save();ctx.globalAlpha=e.done?.55:1;Art.sprite(ctx,14,e.x,e.y,76);ctx.restore();
            Art.label(ctx,e.x,e.y-60,e.done?(cn?'已使用':'USED'):e.kind==='seal'?(cn?'驻足破印':'BREAK SEAL'):(cn?'驻足祈愿':'REST HERE'),col);
            if(e.progress>0&&!e.done)Art.progress(ctx,e.x,e.y-51,e.progress/1.2,col);return;
        }
        if(['player','zombie'].includes(e.type)) {
            const player=e.type==='player',lift=player?0:e.hopHeight||0;
            ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(e.x,e.y+4,18-lift*.3,7-lift*.1,0,0,Math.PI*2);ctx.fill();
            if(player) {
                if(e.buffs.candle>0)Art.glow(ctx,e.x,e.y-12,85,'#f4bf5945');
                if(e.holdingBreath){
                    const pulse=.55+.25*Math.sin(time*4);
                    Art.glow(ctx,e.x,e.y-12,62,`rgba(111,218,199,${.12+pulse*.08})`);
                    ctx.save();ctx.strokeStyle=e.breathRemaining<=10?'#ff9e78':'#a6ead7';ctx.globalAlpha=.45+pulse*.25;ctx.lineWidth=2.5;ctx.setLineDash?.([5,7]);ctx.beginPath();ctx.ellipse(e.x,e.y-5,29+pulse*4,17+pulse*2,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash?.([]);
                    for(let i=0;i<3;i++){const a=time*.55+i*2.1,r=28+i*4;ctx.globalAlpha=.22;ctx.fillStyle='#c9fff0';ctx.beginPath();ctx.arc(e.x+Math.cos(a)*r,e.y-18+Math.sin(a)*8-i*5,2.2,0,Math.PI*2);ctx.fill();}ctx.restore();
                    Art.label(ctx,e.x,e.y-74,`${curLang==='CN'?'屏气':'HOLD'} ${Math.ceil(e.breathRemaining)}s`,e.breathRemaining<=10?'#ffab83':'#c7f7e9');
                }
                if(e.buffs.jade>0||e.buffs.hoof>0) {ctx.strokeStyle=e.buffs.jade>0?'#b8f0d2':'#d8b077';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y,25,12,0,0,Math.PI*2);ctx.stroke();}
                ctx.save();if(e.inv>0)ctx.globalAlpha=.6+.4*Math.sin(time*25)**2;
                const bob=e.moving?-Math.abs(Math.sin(e.stepPhase))*1.8:0;
                if(e.holdingBreath){ctx.filter='brightness(.52) saturate(.42) contrast(.92)';Art.breathRaiderSprite(ctx,e,e.x,e.y+bob+5,82);}else if(e.rollTime>0){ctx.translate(e.x,e.y-20);ctx.rotate((.65-e.rollTime)/.65*Math.PI*2);Art.raider(ctx,e,0,20,74);}else if(e.pushingCoffin)Art.pushRaider(ctx,e,e.x,e.y,82);else if(e.hasShovel)Art.shovelRaider(ctx,e,e.x,e.y+bob,84);else Art.raider(ctx,e,e.x,e.y+bob,74);ctx.restore();
                if(e.hasShovel&&e.attackT>0){const progress=1-e.attackT/.48;ctx.save();ctx.translate(e.x,e.y-18);ctx.rotate(e.attackAngle);ctx.globalAlpha=Math.sin(progress*Math.PI)*.8;for(let i=0;i<3;i++){ctx.strokeStyle=i===0?'#f5dfb8':'#aab6ac';ctx.lineWidth=5-i*1.4;ctx.beginPath();ctx.arc(0,0,47+i*5,-1.05+progress*.7,.25+progress*.7);ctx.stroke();}ctx.restore();}
            } else {
                const pose=e.attackState==='windup'?2:e.attackState==='strike'?3:lift>2?1:0;
                const lunge=e.attackState==='strike'?Math.sin((1-e.attackClock/.24)*Math.PI)*11:0;
                if(e.bloodCorpse){
                    const pulse=.72+.2*Math.sin(time*6);
                    Art.glow(ctx,e.x,e.y-18,82,`rgba(186,18,30,${.22*pulse})`);
                    ctx.save();ctx.strokeStyle=`rgba(239,55,58,${.35*pulse})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(e.x,e.y+2,27+pulse*4,10+pulse*2,0,0,Math.PI*2);ctx.stroke();
                    for(let i=0;i<4;i++){ctx.fillStyle='#d92931';ctx.globalAlpha=.25+.15*pulse;ctx.beginPath();ctx.arc(e.x+Math.sin(time*1.8+i*2.1)*(25+i*3),e.y-20-((time*15+i*17)%42),2+i%2,0,Math.PI*2);ctx.fill();}ctx.restore();
                }
                ctx.save();ctx.globalAlpha=1-(e.sink||0);ctx.translate(e.x+Math.cos(e.attackAim)*lunge,e.y-lift+Math.sin(e.attackAim)*lunge+(e.sink||0)*22);ctx.scale(1,1-(e.sink||0)*.25);
                if(e.x>game.p.x)ctx.scale(-1,1);
                if(e.landT>0)ctx.scale(1.06,.94);
                ctx.filter=e.species.filter;Art.frame(ctx,Art.zombies,e.zType*4+pose,0,0,e.species.size,e.species.size,true);ctx.restore();
                if(e.bloodCorpse&&distance<230)Art.progress(ctx,e.x,e.y-e.species.size+8,e.hp/e.maxHp,'#d52c35');
                if(distance<180)Art.label(ctx,e.x,e.y-e.species.size-4,cn?e.species.name:e.species.en,e.bloodCorpse?'#ff8174':'#d9bd99');
                if(e.attackState==='windup')Art.label(ctx,e.x,e.y-77,cn?'!':'!','#ffae83');
            }
            return;
        }
        if(e.type==='coffin') {
            if(e.fuse>0){Art.glow(ctx,e.x,e.y,110,'#ff6a2944');Art.label(ctx,e.x,e.y-88,cn?'火药引燃 · 快退！':'EXPLOSIVE!','#ff9870');}
            ctx.save();
            if(game.p.y<e.y&&distance<85)ctx.globalAlpha=.62;
            if(e.rising){ctx.globalAlpha=e.elevation;ctx.translate(0,(1-e.elevation)*30);}
            if(e.royal&&!e.opened){ctx.filter=Expedition.style.filter;Art.expeditionSprite(ctx,15,e.x,e.y,115);}else if(e.opened){Art.coffinDetail(ctx,2,e.x,e.y,95);Art.coffinLidSprite(ctx,e,e.royal?112:94);}else Art.sprite(ctx,4,e.x+(e.shake>0?Math.sin(time*50)*2:0),e.y,90);ctx.restore();
            if(!e.opened&&distance<130)Art.label(ctx,e.x,e.y-72,e.royal?(cn?'主棺 · 当心守墓尸':'ROYAL COFFIN · BEWARE'):(cn?'靠近开棺':'STAY TO OPEN'));
            if(!e.opened&&e.interactTimer>0)Art.progress(ctx,e.x,e.y-61,e.interactTimer/.6,'#e8c981');return;
        }
        if(e.type==='ground_item') {
            const idx={item_candle:8,item_wine:9,item_hoof:10,item_jade:11,item_compass:12}[e.code];
            Art.glow(ctx,e.x,e.y-5,32,'#ddb65930');if(e.code==='item_shovel')Art.shovel(ctx,e.x,e.y,1);else Art.sprite(ctx,idx,e.x,e.y+Math.sin(time*3)*2,38);
            if(distance<95)Art.label(ctx,e.x,e.y-38,LANG[curLang].items[e.code.replace('item_','')].n);return;
        }
        if(e.type==='relic_item'){
            const r=RELICS[e.relicIndex],bob=Math.sin(time*3+e.phase)*3;Art.glow(ctx,e.x,e.y+bob,46,'#eac66955');Art.relic(ctx,e.relicIndex,e.x,e.y+bob,58);
            if(distance<110)Art.label(ctx,e.x,e.y-45+bob,cn?`${r.name} · ${r.price} 万元`:`${r.en} · ${r.price}0K CNY`,'#f4d98d');return;
        }
        if(e.type==='trap') {
            if(e.vent)return;
            if(!e.revealed&&!(e.revealT>0||e.windup>0||e.recoil>0))return;
            const kick=(e.recoil||0)/.28*7;
            ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.displayAim);ctx.translate(-kick,0);
            ctx.filter=Expedition.style.filter;
            Art.trapEmitter(ctx,e.pType,0,0,52);ctx.restore();return;
        }
        if(e.type==='proj') {
            const specs={ARROW:[0,42,42],STONE:[1,28,28],LOG:[2,44,28],FIRE:[3,42,42],VENOM:[4,30,30]};
            const [index,sw,sh]=specs[e.pType]||specs.ARROW;
            ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.ang+(e.pType==='STONE'?e.age*5:0));
            if(e.pType==='FIRE'||e.pType==='VENOM')Art.glow(ctx,0,0,25,e.pType==='FIRE'?'#ed892a55':'#92c84344');
            Art.frame(ctx,Art.traps,index,0,0,sw,sh);ctx.restore();return;
        }
        if(e.type==='effect'&&['dust','slash','spit','muzzle'].includes(e.effectType)) {
            const index={dust:12,slash:13,spit:14,muzzle:15}[e.effectType],progress=1-e.life;
            ctx.save();ctx.globalAlpha=Math.max(0,e.life)*(e.effectType==='dust'?.45:1);
            ctx.translate(e.x,e.y);if(e.effectType!=='dust')ctx.rotate(e.angle||0);
            const size=e.effectType==='slash'?48:e.effectType==='dust'?20+progress*35:28+progress*22;
            Art.frame(ctx,Art.zombies,index,0,-(e.effectType==='dust'?progress*6:0),size);ctx.restore();return;
        }
        if(e.type==='effect'&&e.effectType==='gold') {ctx.save();ctx.globalAlpha=Math.max(0,e.life);Art.sprite(ctx,13,e.x,e.y-(1-e.life)*40,44);ctx.restore();return;}
        ctx.save();ctx.translate(e.x,e.y);if(e.draw)e.draw(ctx);ctx.restore();
    }
};

Art.shovel=function(ctx,x,y,scale){
 if(Art.shovelItem){ctx.save();ctx.translate(x,y);ctx.rotate(-.18);ctx.drawImage(Art.shovelItem,-31*scale,-25*scale,62*scale,51*scale);ctx.restore();return;}
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.strokeStyle='#997449';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(12,0);ctx.stroke();ctx.fillStyle='#6e7b78';ctx.beginPath();ctx.moveTo(10,-8);ctx.lineTo(28,-10);ctx.lineTo(31,0);ctx.lineTo(28,10);ctx.lineTo(10,8);ctx.closePath();ctx.fill();ctx.restore();
};
