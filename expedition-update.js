/**
 * 寻龙诀 — tomb expedition content update
 * Adds floor identity, coffin-centric loot/enemies, dynamic tomb structures,
 * environmental hazards, creature nests, trap-vs-enemy damage, and RMB relic values.
 */
(() => {
    'use strict';

    const FLOOR_THEMES = [
        {name:'秦砖地宫', mark:'秦', motif:'seal', floor:'#2b211b', accent:'#8d6e63', zombies:2, pests:'beetle'},
        {name:'汉代陵寝', mark:'汉', motif:'cloud', floor:'#2c241d', accent:'#b08d57', zombies:2, pests:'spider'},
        {name:'唐墓壁画', mark:'唐', motif:'mural', floor:'#30231d', accent:'#b85c38', zombies:3, pests:'bat'},
        {name:'宋代水墓', mark:'宋', motif:'wave', floor:'#1f2927', accent:'#5f9ea0', zombies:2, pests:'beetle'},
        {name:'元代沙窟', mark:'元', motif:'sand', floor:'#33291e', accent:'#c2a878', zombies:3, pests:'beetle'},
        {name:'明代石室', mark:'明', motif:'brick', floor:'#24282b', accent:'#8b9aa3', zombies:3, pests:'spider'},
        {name:'清代毒陵', mark:'清', motif:'poison', floor:'#1f2a21', accent:'#6b8e23', zombies:3, pests:'beetle'},
        {name:'机关长廊', mark:'机', motif:'gear', floor:'#29241f', accent:'#c17d3a', zombies:4, pests:'bat'},
        {name:'帝王玄宫', mark:'帝', motif:'royal', floor:'#221f27', accent:'#8c6ab1', zombies:4, pests:'spider'},
        {name:'幽冥天宫', mark:'冥', motif:'abyss', floor:'#17191d', accent:'#a33c3c', zombies:4, pests:'beetle'}
    ];

    const RELIC_VALUES = [
        680000, 920000, 1500000, 1200000, 1880000,
        2600000, 980000, 3200000, 8800000, 12600000
    ];
    ARTIFACTS.forEach((a, i) => { a.value = RELIC_VALUES[i]; });

    const fmtRmb = v => `¥${Math.round(v).toLocaleString('zh-CN')}`;
    const rand = (a,b) => a + Math.random()*(b-a);

    class ThemeDecor extends Entity {
        constructor(x,y,theme,idx){ super(x,y,'theme_decor'); this.theme=theme; this.idx=idx; }
        draw(ctx){
            const t=this.theme; ctx.save(); ctx.globalAlpha=.55; ctx.strokeStyle=t.accent; ctx.fillStyle=t.accent; ctx.lineWidth=2;
            if(t.motif==='seal'||t.motif==='royal'){
                ctx.strokeRect(-16,-16,32,32); ctx.font='bold 18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(t.mark,0,1);
            } else if(t.motif==='cloud'||t.motif==='wave'){
                for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(i*12,0,10,Math.PI,0);ctx.stroke();}
            } else if(t.motif==='mural'){
                ctx.beginPath(); ctx.moveTo(-20,8); ctx.quadraticCurveTo(0,-22,20,8); ctx.stroke(); ctx.beginPath(); ctx.arc(0,-3,5,0,Math.PI*2); ctx.fill();
            } else if(t.motif==='sand'){
                for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(-16+i*8,Math.sin(i)*5,2,0,Math.PI*2);ctx.fill();}
            } else if(t.motif==='brick'){
                ctx.strokeRect(-20,-12,40,24); ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(0,0);ctx.moveTo(-20,0);ctx.lineTo(20,0);ctx.stroke();
            } else if(t.motif==='poison'){
                ctx.beginPath();ctx.arc(-7,0,7,0,Math.PI*2);ctx.arc(7,0,7,0,Math.PI*2);ctx.stroke();
            } else if(t.motif==='gear'){
                ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.stroke(); for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.fillRect(11,-2,8,4);}
            } else {
                ctx.beginPath();ctx.moveTo(-18,-8);ctx.lineTo(0,16);ctx.lineTo(18,-8);ctx.stroke();
            }
            ctx.restore();
        }
    }

    class CrawlingZombie extends Entity {
        constructor(x,y){ super(x,y,'zombie'); this.hp=2; this.spd=78+Game.lvl*3; this.attackCD=0; }
        hit(d=1){ this.hp-=d; if(this.hp<=0){this.dead=1;Game.spawn(new Effect(this.x,this.y,'burst'));} }
        update(dt,p){
            this.attackCD=Math.max(0,this.attackCD-dt);
            const dx=p.x-this.x,dy=p.y-this.y,d=Math.hypot(dx,dy)||1;
            if(d<330){
                const oldX=this.x,oldY=this.y, repel=p.buffs.hoof>0, dir=repel?-1:1;
                this.x+=dx/d*this.spd*dt*dir; if(!MapSys.canOccupy(this.x,this.y,8))this.x=oldX;
                this.y+=dy/d*this.spd*dt*dir; if(!MapSys.canOccupy(this.x,this.y,8))this.y=oldY;
                if(!repel&&d<18&&this.attackCD<=0){p.hit();this.attackCD=1.2;}
            }
        }
        draw(ctx){
            ctx.save();ctx.translate(0,4);ctx.fillStyle='#425b45';ctx.fillRect(-17,-6,34,12);ctx.fillStyle='#d4c7b8';ctx.beginPath();ctx.arc(15,0,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d32f2f';ctx.fillRect(17,-2,3,3);ctx.restore();
        }
    }

    class Pest extends Entity {
        constructor(x,y,kind){ super(x,y,'pest'); this.kind=kind; this.dir=Math.random()*Math.PI*2; this.life=18; this.speed=kind==='bat'?95:70; this.change=0; }
        update(dt,p){
            this.life-=dt; if(this.life<=0){this.dead=1;return;}
            this.change-=dt;if(this.change<=0){this.change=rand(.4,1.3);this.dir+=rand(-1.4,1.4);}
            const oldX=this.x,oldY=this.y;this.x+=Math.cos(this.dir)*this.speed*dt;this.y+=Math.sin(this.dir)*this.speed*dt;
            if(!MapSys.canOccupy(this.x,this.y,5)){this.x=oldX;this.y=oldY;this.dir+=Math.PI*.7;}
            if(Math.hypot(this.x-p.x,this.y-p.y)<15){ this.dead=1; Game.addText(this.x,this.y,'×','#bdbdbd'); }
        }
        draw(ctx){
            ctx.save();ctx.fillStyle=this.kind==='spider'?'#3b2a23':'#5d4a66';
            if(this.kind==='bat'){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-13,-7);ctx.lineTo(-8,5);ctx.lineTo(0,1);ctx.lineTo(8,5);ctx.lineTo(13,-7);ctx.closePath();ctx.fill();}
            else {ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#5f4b43';for(let i=-1;i<=1;i+=2){for(let j=-1;j<=1;j++){ctx.beginPath();ctx.moveTo(i*4,j*3);ctx.lineTo(i*11,j*7);ctx.stroke();}}}
            ctx.restore();
        }
    }

    class CreatureNest extends Entity {
        constructor(x,y,kind){ super(x,y,'nest'); this.kind=kind; this.cd=rand(.5,2); this.closed=0; }
        update(dt,p){
            if(this.closed)return;
            if(Math.hypot(this.x-p.x,this.y-p.y)<16){this.closed=1;Game.addText(this.x,this.y,curLang==='CN'?'踩塌虫洞':'Nest crushed','#c8b38d');return;}
            this.cd-=dt;if(this.cd<=0){this.cd=rand(2.8,5.0); const live=Game.ents.filter(e=>e.type==='pest').length;if(live<8)Game.spawn(new Pest(this.x+rand(-8,8),this.y+rand(-8,8),this.kind));}
        }
        draw(ctx){ctx.save();ctx.fillStyle=this.closed?'#4a4036':'#090909';ctx.beginPath();ctx.ellipse(0,0,14,8,0,0,Math.PI*2);ctx.fill();if(!this.closed){ctx.strokeStyle='#6d4c41';ctx.stroke();}ctx.restore();}
    }

    class DynamicWall extends Entity {
        constructor(x,y,mode='slide'){ super(x,y,'dynamic_wall'); this.mode=mode; this.phase=Math.random()*Math.PI*2; this.blocking=true; this.timer=rand(2,4); this.r=21; }
        update(dt){
            this.timer-=dt;if(this.timer<=0){this.timer=rand(2.2,4.5);this.blocking=!this.blocking;}
            this.phase+=dt;
        }
        blocks(x,y,r=0){return this.blocking&&Math.abs(x-this.x)<this.r+r&&Math.abs(y-this.y)<this.r+r;}
        draw(ctx){ctx.save();ctx.globalAlpha=this.blocking?1:.22;ctx.fillStyle='#4e4540';ctx.fillRect(-23,-23,46,46);ctx.strokeStyle='#8a7c71';ctx.strokeRect(-19,-19,38,38);ctx.fillStyle='#bca18a';ctx.font='16px serif';ctx.textAlign='center';ctx.fillText(this.mode==='lift'?'升':'移',0,6);ctx.restore();}
    }

    class RisingCoffin extends Coffin {
        constructor(x,y,content){super(x,y,content);this.type='coffin';this.rise=0;this.hidden=1;}
        interact(dt,p){
            const d=Math.hypot(this.x-p.x,this.y-p.y);
            if(this.hidden&&d<95){this.hidden=0;Game.addText(this.x,this.y,curLang==='CN'?'地砖震动…暗棺升起':'A hidden coffin rises…','#d7ccc8');}
            if(this.hidden)return;
            super.interact(dt,p);
        }
        update(dt){if(!this.hidden)this.rise=Math.min(1,this.rise+dt*.8);super.update(dt);}
        draw(ctx){if(this.hidden)return;ctx.save();ctx.translate(0,(1-this.rise)*45);super.draw(ctx);ctx.restore();}
    }

    class HazardVent extends Entity {
        constructor(x,y,kind){ super(x,y,'hazard'); this.kind=kind; this.cd=0; this.pulse=0; this.range=kind==='smoke'?120:105; }
        update(dt,p){
            this.pulse+=dt;this.cd-=dt;const d=Math.hypot(this.x-p.x,this.y-p.y);
            if(d<this.range&&this.cd<=0){
                if(this.kind==='fire'){p.hit();this.cd=1.2;}
                if(this.kind==='water'){const dx=p.x-this.x,dy=p.y-this.y,m=Math.hypot(dx,dy)||1;const nx=p.x+dx/m*70,ny=p.y+dy/m*70;if(MapSys.canOccupy(nx,ny,10)){p.x=nx;p.y=ny;}this.cd=1.5;Game.addText(p.x,p.y,curLang==='CN'?'水压冲退':'Water blast','#90caf9');}
            }
            if(this.kind==='fire'){
                for(const e of Game.ents){if(e.type==='zombie'&&!e.dead&&Math.hypot(e.x-this.x,e.y-this.y)<this.range*.7){if(typeof e.hit==='function')e.hit(1);else e.dead=1;}}
            }
        }
        draw(ctx){
            ctx.save();const wave=.75+.25*Math.sin(this.pulse*7);
            if(this.kind==='fire'){ctx.globalAlpha=.65*wave;ctx.fillStyle='#ff5722';ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffcc80';ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(0,-38-wave*15);ctx.lineTo(9,0);ctx.fill();}
            else if(this.kind==='water'){ctx.globalAlpha=.65;ctx.strokeStyle='#4fc3f7';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-55-wave*25);ctx.stroke();}
            else {ctx.globalAlpha=.18+.10*wave;ctx.fillStyle='#b0bec5';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(Math.cos(i*1.7)*25,Math.sin(i*1.2)*18,25+i*4,0,Math.PI*2);ctx.fill();}}
            ctx.restore();
        }
    }

    class Explosion extends Entity {
        constructor(x,y){super(x,y,'explosion');this.life=.45;this.hitDone=false;}
        update(dt,p){
            if(!this.hitDone){this.hitDone=true; if(Math.hypot(this.x-p.x,this.y-p.y)<95)p.hit(); for(const e of Game.ents){if(e.type==='zombie'&&Math.hypot(this.x-e.x,this.y-e.y)<100)e.dead=1;}}
            this.life-=dt;if(this.life<=0)this.dead=1;
        }
        draw(ctx){ctx.save();ctx.globalAlpha=Math.max(0,this.life/.45);ctx.fillStyle='#ff6d00';ctx.beginPath();ctx.arc(0,0,(1-this.life/.45)*100+15,0,Math.PI*2);ctx.fill();ctx.restore();}
    }

    // Dynamic walls participate in collision without rewriting the generated map.
    const baseCanOccupy = MapSys.canOccupy.bind(MapSys);
    MapSys.canOccupy = function(x,y,radius){
        if(!baseCanOccupy(x,y,radius))return false;
        const walls=Game.ents?Game.ents.filter(e=>e.type==='dynamic_wall'&&!e.dead):[];
        return !walls.some(w=>w.blocks(x,y,radius));
    };

    // Coffins may now contain supplies, crawling corpses, pests, traps, or explosives.
    const baseReveal = Coffin.prototype.reveal;
    Coffin.prototype.reveal = function(){
        if(this.content==='explosive'){Game.spawn(new Explosion(this.x,this.y));Game.addText(this.x,this.y,curLang==='CN'?'火药棺！':'Explosive coffin!','#ff7043');return;}
        if(this.content==='crawler'){Game.spawn(new CrawlingZombie(this.x,this.y+20));Game.addText(this.x,this.y,curLang==='CN'?'伏地尸！':'Crawler!','#9ccc65');return;}
        if(this.content&&this.content.startsWith('item_')){Game.getItem(this.content);Game.addText(this.x,this.y,LANG[curLang].items[this.content.replace('item_','')].n,'#ffe082');return;}
        if(this.content==='nest'){Game.spawn(new CreatureNest(this.x,this.y+20,FLOOR_THEMES[Game.lvl-1].pests));Game.addText(this.x,this.y,curLang==='CN'?'虫穴裂开':'Nest opened','#a1887f');return;}
        baseReveal.call(this);
    };

    // Projectiles from tomb mechanisms can hit undead as well as the player.
    const baseProjectileUpdate = Projectile.prototype.update;
    Projectile.prototype.update = function(dt,p){
        const ox=this.x,oy=this.y;baseProjectileUpdate.call(this,dt,p);
        if(this.dead&&Math.hypot(this.x-p.x,this.y-p.y)<this.info.size+10)return;
        for(const e of Game.ents){
            if(e.type!=='zombie'||e.dead)continue;
            const d=Math.hypot(this.x-e.x,this.y-e.y);
            if(d<this.info.size+13){if(typeof e.hit==='function')e.hit(1);else e.dead=1;this.dead=1;Game.addText(e.x,e.y,curLang==='CN'?'机关击杀':'Trap hit','#ffcc80');break;}
        }
        if(!Number.isFinite(this.x)||!Number.isFinite(this.y)){this.x=ox;this.y=oy;this.dead=1;}
    };

    const baseLoad = Game.load.bind(Game);
    Game.load = function(l){
        baseLoad(l);
        const theme=FLOOR_THEMES[l-1];
        Game.theme=theme;

        // Remove all free-roaming enemies and most loose supplies. The tomb should feel coffin-centric.
        Game.ents = Game.ents.filter(e => e===Game.p || (e.type!=='zombie' && e.type!=='ground_item'));

        const coffins=Game.ents.filter(e=>e.type==='coffin');
        const artifact=coffins.find(c=>c.content==='artifact');
        const others=coffins.filter(c=>c!==artifact);
        for(const c of others)c.content='empty';

        // Fixed undead count per floor, mostly sealed inside coffins.
        const shuffled=[...others].sort(()=>Math.random()-.5);
        const zombieCount=Math.min(theme.zombies,shuffled.length);
        for(let i=0;i<zombieCount;i++)shuffled[i].content=(i===zombieCount-1&&l>=3)?'crawler':'zombie';

        // Supplies are mostly in coffins; keep one compass accessible through a coffin as well.
        const loot=['item_compass','item_wine','item_hoof','item_jade','item_candle'];
        for(let i=zombieCount;i<Math.min(shuffled.length,zombieCount+Math.min(3,loot.length));i++)shuffled[i].content=loot[(i-zombieCount+l)%loot.length];
        if(shuffled.length>zombieCount+3)shuffled[zombieCount+3].content='nest';
        if(l>=2&&shuffled.length>zombieCount+4)shuffled[zombieCount+4].content='explosive';

        // Replace one ordinary coffin with a hidden rising coffin on later floors.
        if(l>=3&&others.length){
            const source=others[others.length-1];
            source.dead=1;
            const hidden=new RisingCoffin(source.x,source.y,source.content||'empty');
            Game.ents.push(hidden);
        }

        // Distinct floor decoration, hazards and creature ecology.
        const walkable=[];
        for(let y=2;y<MapSys.h-2;y++)for(let x=2;x<MapSys.w-2;x++)if(MapSys.t[y*MapSys.w+x]===TERRAIN.FLOOR)walkable.push({x:x*CONFIG.TILE+25,y:y*CONFIG.TILE+25});
        const far=walkable.filter(q=>Math.hypot(q.x-Game.p.x,q.y-Game.p.y)>180);
        const take=()=>far.splice(Math.floor(Math.random()*far.length),1)[0];
        for(let i=0;i<Math.min(12,far.length);i+=2){const q=take();if(q)Game.ents.push(new ThemeDecor(q.x,q.y,theme,l-1));}
        ['fire','water','smoke'].slice(0,1+(l>=4?1:0)+(l>=7?1:0)).forEach(kind=>{const q=take();if(q)Game.ents.push(new HazardVent(q.x,q.y,kind));});
        const nq=take();if(nq)Game.ents.push(new CreatureNest(nq.x,nq.y,theme.pests));

        // A sealed chamber uses one dynamic wall as its only usable entrance when a suitable room opening exists.
        const rooms=Game.exitRoom?[Game.exitRoom]:[];
        const target=rooms[0];
        if(target){
            const openings=[];
            for(let x=target.x;x<target.x+target.w;x++){
                for(const y of [target.y,target.y+target.h-1]) if(MapSys.t[y*MapSys.w+x]===TERRAIN.FLOOR)openings.push({x:x*CONFIG.TILE+25,y:y*CONFIG.TILE+25});
            }
            for(let y=target.y;y<target.y+target.h;y++){
                for(const x of [target.x,target.x+target.w-1]) if(MapSys.t[y*MapSys.w+x]===TERRAIN.FLOOR)openings.push({x:x*CONFIG.TILE+25,y:y*CONFIG.TILE+25});
            }
            if(openings.length){
                const entry=openings[0];Game.ents.push(new DynamicWall(entry.x,entry.y,l%2?'slide':'lift'));
            }
        }

        Game.collectedValue = Game.collectedValue || 0;
        Game.updateHUD();
    };

    const baseGetArtifact = Game.getArtifact.bind(Game);
    Game.getArtifact = function(){
        if(Game.exit||!Game.running)return;
        const relic=ARTIFACTS[Game.lvl-1];
        Game.collectedValue=(Game.collectedValue||0)+(relic.value||0);
        baseGetArtifact();
        Game.msg(`${curLang==='CN'?relic.n:relic.en} · ${fmtRmb(relic.value)} · ${LANG[curLang].msgs.hole}`,'#dfc58c');
    };

    const baseRestart=Game.restart.bind(Game);
    Game.restart=function(){Game.collectedValue=0;baseRestart();};

    const baseSummary=Game.runSummary.bind(Game);
    Game.runSummary=function(){
        const base=baseSummary();
        return curLang==='CN'?`${base} · 冥器估值 ${fmtRmb(Game.collectedValue||0)}`:`${base} · Relic value ${fmtRmb(Game.collectedValue||0)}`;
    };

    // Add theme identity to the HUD without altering the stable engine renderer.
    const baseHUD=Game.updateHUD.bind(Game);
    Game.updateHUD=function(){
        baseHUD();
        const theme=FLOOR_THEMES[Math.max(0,Game.lvl-1)];
        if(theme){
            const level=document.getElementById('level-num');
            if(level&&!level.textContent.includes(theme.name)) level.textContent += ` · ${theme.name}`;
            const art=document.getElementById('artifact-bar');
            if(art) art.textContent += ` · ${fmtRmb(Game.collectedValue||0)}`;
        }
    };

    window.TombExpeditionUpdate = { FLOOR_THEMES, RELIC_VALUES };
})();
