/* Original generated atlases. Explicit source rectangles preserve uneven atlas gutters. */
const Art = {
    ready:false,failed:false,sprites:null,materials:null,tiles:[],
    rects:[
        [0,0,314,321],[324,0,303,321],[638,0,302,321],[946,0,308,321],
        [0,326,314,299],[324,326,303,299],[637,326,303,299],[946,326,308,299],
        [0,630,314,288],[324,630,303,282],[637,630,303,288],[946,630,308,288],
        [0,924,314,330],[319,912,307,342],[635,934,305,320],[946,922,308,332]
    ],
    load() {
        const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
        return Promise.all([load('assets/tomb-sprites.png'),load('assets/tomb-materials.png')]).then(([sprites,materials])=>{
            this.sprites=sprites;this.materials=materials;
            const xs=[0,313,626,940,1254],ys=[0,302,618,918,1254];
            for(let i=0;i<16;i++) {
                const c=document.createElement('canvas');c.width=c.height=100;
                const x=i%4,y=Math.floor(i/4);
                c.getContext('2d').drawImage(materials,xs[x]+2,ys[y]+2,xs[x+1]-xs[x]-4,ys[y+1]-ys[y]-4,0,0,100,100);
                this.tiles.push(c);
            }
            this.ready=true;
        }).catch(()=>{this.failed=true;});
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
    label(ctx,x,y,text,color='#ead6a9') {
        ctx.font='12px system-ui';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=5;ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.shadowBlur=0;
    },
    progress(ctx,x,y,ratio,color) {
        ctx.fillStyle='#080e10d9';ctx.fillRect(x-23,y,46,5);ctx.fillStyle=color;ctx.fillRect(x-23,y,46*Math.min(1,ratio),5);
    }
};

const Scene = {
    draw(game) {
        const ctx=game.ctx,w=game.width,h=game.height,p=game.p,time=game.elapsed;
        ctx.setTransform(game.dpr,0,0,game.dpr,0,0);
        const cx=p.x-w/2+(Math.random()-.5)*game.shake,cy=p.y-h/2+(Math.random()-.5)*game.shake;
        ctx.fillStyle='#060b0d';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(-cx,-cy);
        const left=Math.max(0,Math.floor(cx/50)),right=Math.min(MapSys.w,Math.ceil((cx+w)/50));
        const top=Math.max(0,Math.floor(cy/50)),bottom=Math.min(MapSys.h,Math.ceil((cy+h)/50));
        for(let y=top;y<bottom;y++)for(let x=left;x<right;x++) {
            const type=MapSys.t[y*MapSys.w+x],room=World.rooms[World.roomTiles[y*MapSys.w+x]];
            let tile=type===1?World.theme.wall:type===2?10:World.theme.tile;
            if(type===0&&room?.kind==='sanctuary')tile=11;
            if(type===0&&room?.kind==='seal')tile=6;
            if(type===0&&room?.kind==='supply'&&World.theme.tile!==8)tile=1;
            ctx.drawImage(Art.tiles[tile],x%2*50,y%2*50,50,50,x*50,y*50,50,50);
            ctx.fillStyle=type===1?'#02070966':'#060a1138';ctx.fillRect(x*50,y*50,50,50);
            if(type===1&&MapSys.t[(y+1)*MapSys.w+x]!==1) {
                ctx.fillStyle='#0008';ctx.fillRect(x*50,(y+1)*50,50,13);
                ctx.fillStyle='#d5d3b638';ctx.fillRect(x*50,y*50,50,2);
            }
            if(type===2) {
                ctx.fillStyle=`rgba(122,214,207,${.05+.035*Math.sin(time*2+x*.9+y)})`;ctx.fillRect(x*50,y*50,50,50);
            }
        }
        for(const r of World.rooms) {
            if(r.x*50>cx+w||(r.x+r.w)*50<cx||r.y*50>cy+h||(r.y+r.h)*50<cy)continue;
            ctx.strokeStyle=World.theme.tint+'45';ctx.lineWidth=2;ctx.strokeRect(r.x*50+7,r.y*50+7,r.w*50-14,r.h*50-14);
        }
        for(const hazard of World.hazards) {
            const phase=World.phase(hazard),active=phase>4.5,warn=phase>3.2;
            ctx.save();ctx.translate(hazard.x,hazard.y);
            ctx.fillStyle=active?'#d9562270':'#0e1515a0';ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle=warn?(hazard.kind==='poison'?'#a6d74d':'#f39c61'):'#96917466';ctx.lineWidth=warn?3:1;
            ctx.setLineDash(active?[]:[4,5]);ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
            if(active)Art.glow(ctx,0,0,50,hazard.kind==='poison'?'#91b94490':'#ff732680');
            if(warn&&!active)Art.label(ctx,0,-36,curLang==='CN'?'避开':'MOVE','#ffc39b');
            ctx.restore();
        }
        const visible=e=>e.x>cx-100&&e.x<cx+w+100&&e.y>cy-100&&e.y<cy+h+100;
        const objects=[...World.props.map(e=>({...e,type:'decoration'})),...World.altars.map(e=>({...e,type:'altar'})),...game.ents.filter(e=>!e.dead),{...game.exitPos,type:'exit'}].filter(visible).sort((a,b)=>a.y-b.y);
        for(const e of objects)this.entity(ctx,e,game);
        for(const t of game.texts) {ctx.save();ctx.translate(t.x,t.y);t.draw(ctx);ctx.restore();}
        ctx.restore();
        const sight=World.sight(),shade=ctx.createRadialGradient(w/2,h/2,60,w/2,h/2,sight);
        shade.addColorStop(0,'#00000000');shade.addColorStop(.65,'#030a0d40');shade.addColorStop(1,'#020608ec');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
        // Keep the nearby actors readable through the torch falloff.
        ctx.save();ctx.translate(-cx,-cy);
        if(p.hasCompass || game.exit) {
            const target=World.target();
            if(target) {
                const angle=Math.atan2(target.y-p.y,target.x-p.x);
                ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.translate(65,0);
                ctx.fillStyle='#f2cf87';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-6,-6);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.restore();
            }
        }
        ctx.restore();
    },
    entity(ctx,e,game) {
        const time=game.elapsed,cn=curLang==='CN',distance=Math.hypot(e.x-game.p.x,e.y-game.p.y);
        if(e.type==='decoration') {if(e.glow)Art.glow(ctx,e.x,e.y-18,95,'#e9aa342b');Art.sprite(ctx,e.sprite,e.x,e.y,e.size);return;}
        if(e.type==='exit') {
            Art.sprite(ctx,15,e.x,e.y,85);Art.label(ctx,e.x,e.y-70,World.canExit()?(cn?'离开此层':'DESCEND'):(cn?'盗洞 · 未解锁':'EXIT · LOCKED'),World.canExit()?'#f5d592':'#bbb3a1');return;
        }
        if(e.type==='altar') {
            const col=e.kind==='seal'?'#e7be6c':'#8fdbbd';
            if(!e.done)Art.glow(ctx,e.x,e.y-10,60,col+'40');
            ctx.save();ctx.globalAlpha=e.done?.55:1;Art.sprite(ctx,14,e.x,e.y,76);ctx.restore();
            Art.label(ctx,e.x,e.y-60,e.done?(cn?'已使用':'USED'):e.kind==='seal'?(cn?'驻足破印':'BREAK SEAL'):(cn?'驻足祈愿':'REST HERE'),col);
            if(e.progress>0&&!e.done)Art.progress(ctx,e.x,e.y-51,e.progress/1.2,col);return;
        }
        if(['player','zombie'].includes(e.type)) {
            ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(e.x,e.y+4,18,8,0,0,Math.PI*2);ctx.fill();
            const player=e.type==='player',moving=player?Input.active:true;
            const bob=moving?Math.sin(time*(player?12:e.zType===1?15:7))*1.8:0;
            if(player) {
                Art.glow(ctx,e.x,e.y-12,85,'#f4bf5936');
                if(e.buffs.jade>0||e.buffs.hoof>0) {ctx.strokeStyle=e.buffs.jade>0?'#b8f0d2':'#d8b077';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y,25,12,0,0,Math.PI*2);ctx.stroke();}
                ctx.save();if(e.inv>0)ctx.globalAlpha=.6+.4*Math.sin(time*25)**2;
                Art.sprite(ctx,0,e.x,e.y+bob,76,e.facingLeft);ctx.restore();
            } else {Art.sprite(ctx,1+e.zType,e.x,e.y+bob,e.zType===1?78:74,e.x>game.p.x);}
            return;
        }
        if(e.type==='coffin') {
            ctx.save();
            if(game.p.y<e.y&&distance<85)ctx.globalAlpha=.62;
            Art.sprite(ctx,e.opened?5:4,e.x+(e.shake>0?Math.sin(time*50)*2:0),e.y,90);ctx.restore();
            if(!e.opened&&distance<130)Art.label(ctx,e.x,e.y-72,cn?'靠近开棺':'STAY TO OPEN');
            if(!e.opened&&e.interactTimer>0)Art.progress(ctx,e.x,e.y-61,e.interactTimer/.6,'#e8c981');return;
        }
        if(e.type==='ground_item') {
            const idx={item_candle:8,item_wine:9,item_hoof:10,item_jade:11,item_compass:12}[e.code];
            Art.glow(ctx,e.x,e.y-5,32,'#ddb65930');Art.sprite(ctx,idx,e.x,e.y+Math.sin(time*3)*2,38);
            if(distance<95)Art.label(ctx,e.x,e.y-38,LANG[curLang].items[e.code.replace('item_','')].n);return;
        }
        if(e.type==='trap') {
            Art.sprite(ctx,e.pType==='FIRE'?7:6,e.x,e.y,68);
            if(e.windup>0) {
                ctx.save();ctx.strokeStyle='#ff876bad';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.aim)*250,e.y+Math.sin(e.aim)*250);ctx.stroke();ctx.restore();
                Art.glow(ctx,e.x,e.y-10,35,'#ff5a3966');
            }return;
        }
        if(e.type==='effect'&&e.effectType==='gold') {ctx.save();ctx.globalAlpha=Math.max(0,e.life);Art.sprite(ctx,13,e.x,e.y-(1-e.life)*40,44);ctx.restore();return;}
        ctx.save();ctx.translate(e.x,e.y);if(e.draw)e.draw(ctx);ctx.restore();
    }
};
