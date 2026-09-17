const THEMES = [
    {name:'汉阙长陵',en:'Han Ancestral Tomb',tile:0,wall:12,tint:'#b78c51',sight:320,water:0,hazard:'sand',seals:0,zombies:[0,0,0],trap:'ARROW',note:'沿中轴墓道进入前室，探索左右耳室、主室与后室。石碑和立柱可以挡住机关射击。',enNote:'Follow the central axis through the front, twin side chambers, main chamber and rear chamber. Stelae and pillars block trap fire.'},
    {name:'千纹机关廊',en:'Hall of Hidden Bolts',tile:1,wall:13,tint:'#a5b4aa',sight:320,water:0,hazard:'spikes',seals:0,zombies:[0,1],trap:'ARROW',note:'箭孔藏在墙缝中，靠近时会突然开启。',enNote:'Arrow slits hide in the masonry and fire when approached.'},
    {name:'青铜兽影厅',en:'Bronze Guardians',tile:2,wall:14,tint:'#8da98c',sight:310,water:0,hazard:'spikes',seals:0,zombies:[0,0,1],trap:'LOG',note:'青铜卫尸巡游。疾行的声响会惊动远处守卫。',enNote:'Bronze guardians patrol. Sprinting attracts distant enemies.'},
    {name:'巨鼎炼魂室',en:'The Soul Furnace',tile:3,wall:15,tint:'#db8448',sight:340,water:0,hazard:'fire',seals:0,zombies:[1,0],trap:'FIRE',note:'炉口与龙首喷嘴平时闭合，靠近后突然喷发。',enNote:'Furnace mouths and dragon nozzles erupt at close range.'},
    {name:'石骨迷宫',en:'Labyrinth of Bones',tile:4,wall:13,tint:'#9cabb0',sight:240,water:0,hazard:'spikes',seals:0,zombies:[1,1,0],trap:'STONE',note:'深处灯影短。循已走过的地图寻找岔路。',enNote:'Light fades in the maze. Use explored paths to find new routes.'},
    {name:'荧光棺河',en:'River of Lost Coffins',tile:5,wall:13,tint:'#5fa9a3',sight:310,water:0.24,hazard:'poison',seals:0,zombies:[2,2,0],trap:'VENOM',note:'积水迟滞脚步。绿毒尸会隔水吐毒。',enNote:'Flooded tiles slow movement. Spitters attack across the water.'},
    {name:'九字封印井',en:'Well of Two Seals',tile:6,wall:15,tint:'#a68ec9',sight:290,water:0,hazard:'poison',seals:2,zombies:[0,2],trap:'ARROW',note:'两座封印锁住去路。靠近祭坛驻足破印。',enNote:'Two seals bar the exit. Stay beside each altar to break them.'},
    {name:'暗影葬主殿',en:'Court of Shadows',tile:7,wall:15,tint:'#7f91b8',sight:220,water:0,hazard:'fire',seals:0,zombies:[1,1,2],trap:'FIRE',note:'暗处疾影众多。善用油灯与黑驴蹄子。',enNote:'Swift shadows gather. Seek lamps and warding talismans.'},
    {name:'帝王沉眠室',en:'The Sleeping Emperor',tile:8,wall:14,tint:'#d6b671',sight:330,water:0,hazard:'spikes',seals:0,zombies:[0,1,2],trap:'STONE',note:'金殿供物丰厚，机关也更密。补给室值得绕行。',enNote:'Rich offerings, dense traps. Supply chambers reward detours.'},
    {name:'永劫天陨塔',en:'Tower of the Fallen Star',tile:9,wall:15,tint:'#8797c7',sight:300,water:0.12,hazard:'fire',seals:3,zombies:[0,1,2],trap:'MIX',note:'最后三道封印。拉开闸门，从盗洞重见天光。',enNote:'Three final seals. Turn the final crank and escape.'}
];
const ROOM_TYPES = {
    sealed:{cn:'封闭陪葬室',en:'Sealed chamber',hint:'室内藏有珍贵供物，靠近机关石壁即可打开唯一入口。',enHint:'Precious supplies inside. Approach the moving wall to open the only entrance.'},
    entry:{cn:'落脚处',en:'Arrival',hint:'灯火尚安，整顿行装再向前。',enHint:'A quiet place to begin.'},
    burial:{cn:'陪葬室',en:'Burial chamber',hint:'石棺之中，可能是供物，也可能是守墓人。',enHint:'Coffins may hold offerings—or guardians.'},
    supply:{cn:'供奉室',en:'Offering chamber',hint:'这里留有补给；靠近即可拾取供物，已有装备也可拾取。',enHint:'Supplies await. All items can be picked up.'},
    sanctuary:{cn:'安息室',en:'Sanctuary',hint:'靠近青色祭坛驻足，可恢复生命或获得短暂护身。',enHint:'Stay beside the teal altar to heal or gain a brief shield.'},
    trap:{cn:'机弩侧室',en:'Crossbow chamber',hint:'壁弩会转向追踪；甬道中的地面机关先预警后触发。',enHint:'Wall launchers turn to aim. Floor hazards guard the passages.'},
    seal:{cn:'封印室',en:'Seal chamber',hint:'靠近金色祭坛驻足，解除一道封印。',enHint:'Stay beside the gold altar to break a seal.'},
    exit:{cn:'主墓室',en:'Main burial chamber',hint:'找到钥匙、封印尽解后，驻足机械开关拉闸；盗洞限时 25 秒。',enHint:'After the key and seals, stand by the crank. The exit opens for 25 seconds.'}
    ,tomb_road:{cn:'墓道',en:'Tomb passage',hint:'沿中轴向北进入前墓室；两侧结构保持汉墓常见的规整对称。',enHint:'Follow the central axis north into the front chamber.'}
    ,ear_left:{cn:'左耳室',en:'Left side chamber',hint:'陪葬侧室与右耳室对称，石碑可遮挡机关射击。',enHint:'This burial side chamber mirrors the right chamber. Its stele blocks trap fire.'}
    ,ear_right:{cn:'右耳室',en:'Right side chamber',hint:'陪葬侧室与左耳室对称，利用大型陪葬物作掩体。',enHint:'This chamber mirrors the left side. Use large funerary objects as cover.'}
    ,front:{cn:'前墓室',en:'Front chamber',hint:'前室连接墓道、左右耳室与主墓室，是整座汉墓的交通核心。',enHint:'The front chamber joins the passage, side chambers and main chamber.'}
    ,main:{cn:'主墓室',en:'Main chamber',hint:'墓葬中轴核心。立柱可以截断弓弩、飞石和火弹。',enHint:'The tomb core. Pillars stop arrows, stones and fireballs.'}
    ,rear:{cn:'后墓室',en:'Rear chamber',hint:'中轴最深处，机械开关与盗洞藏在这里。',enHint:'The deepest axial chamber, containing the crank and escape passage.'}
};

const World = {
    rooms:[],props:[],hazards:[],altars:[],theme:THEMES[0],room:null,roomNotice:0,
    inside(r,x,y) {return x>=r.x*50&&x<(r.x+r.w)*50&&y>=r.y*50&&y<(r.y+r.h)*50;},
    setup(rooms) {
        this.theme=THEMES[Game.lvl-1]; this.rooms=rooms; this.props=[];this.hazards=[];this.altars=[];this.room=null;this.roomNotice=0;
        this.roomTiles=new Int16Array(MapSys.w*MapSys.h).fill(-1);
        const types=['burial','supply','trap','sanctuary','burial','trap'];
        rooms.forEach((r,i)=>{
            r.kind=r.kind||(i===0?'entry':i===rooms.length-1?'exit':types[(i-1)%types.length]);
            r.haze=i>0&&(r.kind==='exit'||(i+Game.lvl*2)%4===0||r.kind==='burial'&&Game.lvl>=6);
            r.flicker=i>0&&((i*3+Game.lvl)%5===0||r.kind==='exit'&&Game.lvl%2===0);
            for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)this.roomTiles[y*MapSys.w+x]=i;
            if(i===0||r.kind==='sanctuary'||i%3===0)this.props.push({x:(r.x+.65)*50,y:(r.y+.65)*50,sprite:7,size:65,glow:true});
            if(i>0&&i<rooms.length-1) {
                for(let y=r.y+1;y<r.y+r.h-1;y++)for(let x=r.x+1;x<r.x+r.w-1;x++) {
                    if(this.theme.water && ((x*13+y*7)%19)/19<this.theme.water) MapSys.t[y*MapSys.w+x]=TERRAIN.WATER;
                }
                if(r.kind==='supply') {
                }
                if(r.kind==='sanctuary') this.addAltar(r,'sanctuary');

            }
        });
        this.placeProjectileCover();
        this.placePassageHazards();
        for(let i=0;i<this.theme.seals;i++) {
            const r=rooms.filter(r=>r.kind==='seal')[i]||rooms[1+i%Math.max(1,rooms.length-2)];r.kind='seal';
            this.addAltar(r,'seal',i);
        }
        // Keep sanctuaries and arrival rooms free of spawned enemies and traps.
        Game.ents=Game.ents.filter(e=>!(['zombie','trap'].includes(e.type)&&rooms.some(r=>['sanctuary','entry'].includes(r.kind)&&this.inside(r,e.x,e.y))));
        Game.ents.forEach(e=>{
            if(e.type==='zombie') {
                e.species=SPECIES[Game.lvl-1];e.zType=e.species.type;e.spd=e.species.speed;
            }
            if(e.type==='trap') {this.mountTrap(e);e.pType=this.theme.trap==='MIX'?['ARROW','FIRE','STONE'][Game.lvl%3]:this.theme.trap;e.cd=1.5+(e.x%50)/50;e.windup=0;}
        });
        // The first compass is discoverable without having to search the entire floor.
        const compass=Game.ents.find(e=>e.code==='item_compass');
        if(compass&&!Game.p.hasCompass) {compass.x=Game.p.x+65;compass.y=Game.p.y+50;}
        Expedition.setup();ExitGate.setup();this.baseSight=this.theme.sight;
        this.updateRoom();
    },
    placeProjectileCover() {
        const add=(x,y,sprite,size=76)=>this.props.push({x,y,sprite,size,atlas:'expedition',blocksProjectiles:true,blockRadius:size*.28});
        if(Game.lvl===1) {
            const left=this.rooms.find(r=>r.kind==='ear_left'),right=this.rooms.find(r=>r.kind==='ear_right'),front=this.rooms.find(r=>r.kind==='front'),main=this.rooms.find(r=>r.kind==='main');
            if(left)add((left.x+left.w-1.1)*50,(left.y+1.25)*50,0,74);
            if(right)add((right.x+1.1)*50,(right.y+1.25)*50,0,74);
            if(front){add((front.x+2)*50,(front.y+2)*50,6,84);add((front.x+front.w-2)*50,(front.y+2)*50,6,84);}
            if(main){add((main.x+2.1)*50,(main.y+2)*50,8,90);add((main.x+main.w-2.1)*50,(main.y+2)*50,8,90);}
            return;
        }
        for(const [i,r] of this.rooms.entries())if(i>0&&r.w>=8&&r.h>=7&&['burial','trap','exit','main'].includes(r.kind)){
            add((r.x+r.w*.28)*50,(r.y+r.h*.42)*50,i%2?0:6,72+Math.min(18,Game.lvl));
        }
    },
    projectileBlockerAt(x,y,radius=0) {
        return this.props.find(p=>p.blocksProjectiles&&Math.hypot(x-p.x,y-p.y)<=p.blockRadius+radius);
    },
    placePassageHazards() {
        const candidates=[];
        for(let y=2;y<MapSys.h-2;y++)for(let x=2;x<MapSys.w-2;x++) {
            const at=y*MapSys.w+x,px=x*50+25,py=y*50+25;
            if(MapSys.t[at]===TERRAIN.WALL||this.roomTiles[at]!==-1)continue;
            const horizontal=MapSys.t[at-1]!==1&&MapSys.t[at+1]!==1,vertical=MapSys.t[at-MapSys.w]!==1&&MapSys.t[at+MapSys.w]!==1;
            if(!horizontal&&!vertical)continue;
            if(Math.hypot(px-Game.p.x,py-Game.p.y)<220||Math.hypot(px-Game.exitPos.x,py-Game.exitPos.y)<100)continue;
            candidates.push({x:px,y:py,kind:this.theme.hazard,offset:(x*7+y*3)%60/10});
        }
        // Spread danger out, leaving room to wait for a safe phase before crossing.
        candidates.sort((a,b)=>((a.x*7+a.y*13+Game.lvl*37)%991)-((b.x*7+b.y*13+Game.lvl*37)%991));
        for(const h of candidates) {
            if(this.hazards.every(other=>Math.hypot(other.x-h.x,other.y-h.y)>=180))this.hazards.push(h);
            if(this.hazards.length>=Math.min(14,5+Game.lvl))break;
        }
    },
    mountTrap(trap) {
        let best=null,score=Infinity;
        for(let y=1;y<MapSys.h-1;y++)for(let x=1;x<MapSys.w-1;x++) {
            const at=y*MapSys.w+x,px=x*50+25,py=y*50+25;
            if(MapSys.t[at]===1||Math.hypot(px-Game.p.x,py-Game.p.y)<180)continue;
            if(Math.hypot(px-trap.x,py-trap.y)>=score)continue;
            const room=this.rooms[this.roomTiles[at]];
            if(room&&['entry','sanctuary','sealed'].includes(room.kind))continue;
            if(Game.ents.some(e=>e!==trap&&((e.type==='trap'&&Math.hypot(e.x-px,e.y-py)<200)||(e.type==='coffin'&&Math.hypot(e.x-px,e.y-py)<50))))continue;
            for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(MapSys.t[at+dx+dy*MapSys.w]===1) {
                const dist=Math.hypot(px-trap.x,py-trap.y);
                if(dist<score){score=dist;best={x:px+dx*9,y:py+dy*9,angle:Math.atan2(-dy,-dx)};}
            }
        }
        if(best){trap.x=best.x;trap.y=best.y;trap.aim=trap.displayAim=best.angle;}
    },
    addAltar(room,kind,offset=0) {
        this.altars.push({x:(room.x+1.5+(offset%3)*1.5)*50,y:(room.y+1.5)*50,kind,done:false,progress:0});
    },
    remaining() {return this.altars.filter(a=>a.kind==='seal'&&!a.done).length;},
    canExit() {return ExitGate.ready()&&ExitGate.remaining>0;},
    target() {
        if(!Game.p.hasKey)return Expedition.keyCoffin;
        if(!Game.exit)return Game.mainCoffinPos;
        const seals=this.altars.filter(a=>a.kind==='seal'&&!a.done).sort((a,b)=>Math.hypot(a.x-Game.p.x,a.y-Game.p.y)-Math.hypot(b.x-Game.p.x,b.y-Game.p.y));
        return seals[0]||(ExitGate.remaining>0?Game.exitPos:ExitGate.switch);
    },
    sight() {return Math.max(70,((this.baseSight||300)+(Game.p.buffs.candle>0?170*Math.min(1,Game.p.buffs.candle/2):0))*(ExitGate.levelAt(Game.p.x,Game.p.y)>.25?(ExitGate.flood.fog||1):1));},
    phase(h) {return (Game.elapsed+h.offset)%6;},
    updateRoom() {
        const r=this.rooms.find(r=>this.inside(r,Game.p.x,Game.p.y));
        if(r===this.room)return;
        this.room=r;
        const label=document.getElementById('room-name'),hint=document.getElementById('room-hint');
        const role=r?.layoutRole||r?.kind,type=ROOM_TYPES[role],cn=curLang==='CN';
        label.textContent=type?(r?.kind==='exit'?(cn?Expedition.style.name+' · 主墓室':this.theme.en+' · Main tomb'):(cn?type.cn:type.en)):(cn?'连接甬道':'Connecting passage');
        hint.textContent=type?(cn?type.hint:type.enHint):(cn?'沿石壁前行，留意通向其他墓室的岔口。':'Follow the stone passage and watch for branching rooms.');
    },
    update(dt) {
        Expedition.update(dt);ExitGate.update(dt);this.updateRoom();
        for(const a of this.altars) {
            if(a.done)continue;
            if(Math.hypot(a.x-Game.p.x,a.y-Game.p.y)<48) {
                a.progress+=dt;
                if(a.progress>=1.2) {
                    a.done=true;AudioSys.playItem(true);
                    if(a.kind==='seal') Game.msg(curLang==='CN'?`封印已破 · 还剩 ${this.remaining()} 道`:`Seal broken · ${this.remaining()} remain`,'#e5be72');
                    else {
                        if(Game.p.hp<5)Game.p.hp++;else Game.p.buffs.jade=1;
                        Game.msg(curLang==='CN'?'祭火护佑 · 生命恢复或抵挡一次伤害':'Altar blessing · healed or one-hit shield','#9bd4b9');
                    }
                    Game.updateHUD();
                }
            } else a.progress=0;
        }
        for(const h of this.hazards) {
            if(this.phase(h)>4.5){
                if(Math.abs(h.x-Game.p.x)<21&&Math.abs(h.y-Game.p.y)<21)Game.p.hit();
                for(const e of TombDangers.enemies())if(Math.abs(h.x-e.x)<24&&Math.abs(h.y-e.y)<24)TombDangers.hurt(e,1);
            }
        }
    }
};
