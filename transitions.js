/* A paused, theme-specific descent preview; all motion uses the existing game clock. */
const Passage={
    active:false,departing:false,time:0,travel:0,floor:0,
    modes:['sand','bolts','bronze','embers','dust','water','seals','shadows','gold','meteors','daylight'],
    reset(){this.active=false;this.departing=false;this.travel=0;},
    open(completed){
        this.active=true;this.departing=false;this.time=0;this.travel=0;this.floor=completed;
        this.theme=THEMES[Math.min(completed,9)];this.mode=this.modes[completed];
        this.reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const cn=curLang==='CN',escape=completed===10,t=this.theme;
        document.getElementById('passage-kicker').textContent=cn?'机关已解 · 盗洞已开':'GATE UNLOCKED · PASSAGE OPEN';
        document.getElementById('passage-floor').textContent=escape?(cn?'终章 / 重见天光':'EPILOGUE / DAYLIGHT'):(cn?`下一层 · ${String(completed+1).padStart(2,'0')} / 10`:`NEXT FLOOR · ${String(completed+1).padStart(2,'0')} / 10`);
        document.getElementById('exit-title').textContent=escape?(cn?'归途见曙光':'Return to the light'):(cn?t.name:t.en);
        document.getElementById('passage-description').textContent=escape?(cn?'十层机关已突破。穿过最后的盗洞，离开地下长夜。':'Ten floors survived. Leave the buried night behind.'):(cn?`${t.note} 守墓者：${SPECIES[completed].name}。拉闸后${FLOOD_TYPES[completed].name}扩散。`:`${t.enNote} Guardian: ${SPECIES[completed].en}. Opening the gate releases ${FLOOD_TYPES[completed].en}.`);
        document.getElementById('passage-detail').textContent=escape?(cn?'此行功成 · 带着发现重返人间':'Expedition complete · carry your discoveries home'):(cn?`${t.seals?`${t.seals} 道封印 · `:''}${t.water?'积水区域 · ':''}残油铜灯 20 秒 · 本层无法返回`:`${t.seals?`${t.seals} seals · `:''}${t.water?'Flooded areas · ':''}20-second lamp · No return`);
        Game.renderRelicReport('passage-relics');
        const btn=document.getElementById('exit-confirm-btn');btn.disabled=false;btn.textContent=escape?(cn?'重返人间':'Return above'):(cn?'沿盗洞深入':'Descend');
        document.getElementById('passage-status').textContent=cn?'整顿行装，准备好后继续':'Take a breath. Continue when ready.';
        document.getElementById('passage-progress-fill').style.width='0%';this.draw();
    },
    depart(){
        if(!this.active||this.departing)return;
        this.departing=true;this.travel=0;document.getElementById('exit-confirm-btn').disabled=true;
        document.getElementById('passage-status').textContent=curLang==='CN'?'正在穿过盗洞…':'Moving through the passage…';
    },
    update(dt){
        if(!this.active||document.hidden)return;
        this.time+=dt;
        if(this.departing){
            this.travel+=dt;const duration=this.reduced?.2:1.25;
            document.getElementById('passage-progress-fill').style.width=Math.min(100,this.travel/duration*100)+'%';
            if(this.travel>=duration){this.reset();Game.finishNextLevel();return;}
        }
        if(!this.reduced||this.departing)this.draw();
    },
    draw(){
        const c=document.getElementById('passage-scene'),ctx=c.getContext('2d'),w=c.width,h=c.height,t=this.reduced?0:this.time,theme=this.theme;
        if(!theme||!Art.ready)return;
        ctx.save();ctx.fillStyle='#070d10';ctx.fillRect(0,0,w,h);
        const rush=this.departing?1+this.travel*.6:1;
        ctx.translate(w/2,h/2);ctx.scale(rush,rush);ctx.translate(-w/2,-h/2);
        // Successively smaller stone portals give depth without introducing new assets.
        for(let i=0;i<7;i++){
            const scale=Math.pow(.74,i),rw=w*scale,rh=h*scale,x=(w-rw)/2,y=(h-rh)/2;
            ctx.globalAlpha=.7-i*.075;ctx.drawImage(Art.tiles[theme.wall],x,y,rw,rh);
            ctx.fillStyle='#04090ce0';ctx.fillRect(x+14*scale,y+12*scale,rw-28*scale,rh-24*scale);
        }
        ctx.globalAlpha=1;Art.glow(ctx,w/2,h/2,145,theme.tint+'36');
        const mode=this.mode;
        if(mode==='water'){
            for(let i=0;i<8;i++){const r=15+((t*25+i*21)%170);ctx.strokeStyle='#79c9be66';ctx.beginPath();ctx.ellipse(w/2,h*.65,r,r*.24,0,0,Math.PI*2);ctx.stroke();}
        } else if(mode==='seals'||mode==='bronze'){
            ctx.save();ctx.translate(w/2,h/2);ctx.rotate(t*(mode==='seals'?.22:-.35));
            ctx.strokeStyle=theme.tint+'aa';ctx.lineWidth=2;
            for(let i=0;i<(mode==='seals'?2:3);i++){ctx.rotate(Math.PI/5);ctx.strokeRect(-48-i*15,-48-i*15,96+i*30,96+i*30);}ctx.restore();
        } else if(mode==='shadows'){
            for(let i=0;i<4;i++){ctx.fillStyle='#020509cc';ctx.fillRect(((t*65+i*170)%(w+180))-180,0,100,h);}
        } else if(mode==='daylight')Art.glow(ctx,w/2,h*.36,200,'#fff2bdcf');
        for(let i=0;i<32;i++){
            const seed=(i*97%631)/631,speed=18+(i%7)*6;
            let x=(i*113)%w,y=(i*61)%h;
            if(mode==='embers'||mode==='gold'){y=h-((y+t*speed)%h);x+=Math.sin(t+i)*10;}
            else if(mode==='bolts'){x=(x+t*speed*4)%w;}
            else if(mode==='meteors'){x=(x+t*speed*2)%w;y=(y+t*speed*1.5)%h;}
            else {x=(x+t*(mode==='sand'?speed:6))%w;y=(y+t*speed*.4)%h;}
            ctx.globalAlpha=.2+seed*.5;ctx.fillStyle=mode==='embers'?'#ffad59':theme.tint;
            if(mode==='bolts')Art.frame(ctx,Art.traps,0,x,y,28,28);
            else if(mode==='meteors'){ctx.save();ctx.translate(x,y);ctx.rotate(.6);ctx.fillRect(-18,0,24,2);ctx.restore();}
            else if(mode!=='water')ctx.fillRect(x,y,mode==='gold'?3:2,mode==='gold'?6:2);
        }
        ctx.globalAlpha=1;ctx.restore();
    }
};
