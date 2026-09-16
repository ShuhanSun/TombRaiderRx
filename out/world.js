const THEMES = [
    {name:'沙海迷冢',en:'Buried in Sand',tile:0,wall:12,tint:'#b78c51',sight:320,water:0,hazard:'sand',seals:0,zombies:[0,0,0],trap:'ARROW',note:'沙下无声。驻足开棺，寻找镇墓之物。',enNote:'Stay beside coffins to uncover the relic.'},
    {name:'千纹机关廊',en:'Hall of Hidden Bolts',tile:1,wall:13,tint:'#a5b4aa',sight:320,water:0,hazard:'spikes',seals:0,zombies:[0,1],trap:'ARROW',note:'弩机亮起红线后发射，横向躲开。',enNote:'Crossbows warn with a red line. Dodge sideways.'},
    {name:'青铜兽影厅',en:'Bronze Guardians',tile:2,wall:14,tint:'#8da98c',sight:310,water:0,hazard:'spikes',seals:0,zombies:[0,0,1],trap:'LOG',note:'青铜卫尸巡游。疾行的声响会惊动远处守卫。',enNote:'Bronze guardians patrol. Sprinting attracts distant enemies.'},
    {name:'巨鼎炼魂室',en:'The Soul Furnace',tile:3,wall:15,tint:'#db8448',sight:340,water:0,hazard:'fire',seals:0,zombies:[1,0],trap:'FIRE',note:'地火先亮后燃。看清喷火口，等火势熄灭再走。',enNote:'Floor vents glow before burning. Wait for them to fade.'},
    {name:'石骨迷宫',en:'Labyrinth of Bones',tile:4,wall:13,tint:'#9cabb0',sight:240,water:0,hazard:'spikes',seals:0,zombies:[1,1,0],trap:'STONE',note:'深处灯影短。循已走过的地图寻找岔路。',enNote:'Light fades in the maze. Use explored paths to find new routes.'},
    {name:'荧光棺河',en:'River of Lost Coffins',tile:5,wall:13,tint:'#5fa9a3',sight:310,water:0.24,hazard:'poison',seals:0,zombies:[2,2,0],trap:'VENOM',note:'积水迟滞脚步。绿毒尸会隔水吐毒。',enNote:'Flooded tiles slow movement. Spitters attack across the water.'},
    {name:'九字封印井',en:'Well of Two Seals',tile:6,wall:15,tint:'#a68ec9',sight:290,water:0,hazard:'poison',seals:2,zombies:[0,2],trap:'ARROW',note:'两座封印锁住去路。靠近祭坛驻足破印。',enNote:'Two seals bar the exit. Stay beside each altar to break them.'},
    {name:'暗影葬主殿',en:'Court of Shadows',tile:7,wall:15,tint:'#7f91b8',sight:220,water:0,hazard:'fire',seals:0,zombies:[1,1,2],trap:'FIRE',note:'暗处疾影众多。善用油灯与黑驴蹄子。',enNote:'Swift shadows gather. Seek lamps and warding talismans.'},
    {name:'帝王沉眠室',en:'The Sleeping Emperor',tile:8,wall:14,tint:'#d6b671',sight:330,water:0,hazard:'spikes',seals:0,zombies:[0,1,2],trap:'STONE',note:'金殿供物丰厚，机关也更密。补给室值得绕行。',enNote:'Rich offerings, dense traps. Supply chambers reward detours.'},
    {name:'永劫天陨塔',en:'Tower of the Fallen Star',tile:9,wall:15,tint:'#8797c7',sight:300,water:0.12,hazard:'fire',seals:3,zombies:[0,1,2],trap:'MIX',note:'最后三道封印。取回彼岸花，从盗洞重见天光。',enNote:'Three final seals. Claim the Equinox Flower and escape.'}
];
const ROOM_TYPES = {
    sealed:{cn:'封闭陪葬室',en:'Sealed chamber',hint:'唯一出入口为机关石壁，内外移壁锁均可开启。',enHint:'The moving wall is the only door; use either lock to open it.'},
    entry:{cn:'落脚处',en:'Arrival',hint:'灯火尚安，整顿行装再向前。',enHint:'A quiet place to begin.'},
    burial:{cn:'陪葬室',en:'Burial chamber',hint:'石棺之中，可能是供物，也可能是守墓人。',enHint:'Coffins may hold offerings—or guardians.'},
    supply:{cn:'供奉室',en:'Offering chamber',hint:'这里留有补给；靠近即可拾取供物，已有装备也可拾取。',enHint:'Supplies await. All items can be picked up.'},
    sanctuary:{cn:'安息室',en:'Sanctuary',hint:'靠近青色祭坛驻足，可恢复生命或获得短暂护身。',enHint:'Stay beside the teal altar to heal or gain a brief shield.'},
    trap:{cn:'机弩侧室',en:'Crossbow chamber',hint:'壁弩会转向追踪；甬道中的地面机关先预警后触发。',enHint:'Wall launchers turn to aim. Floor hazards guard the passages.'},
    seal:{cn:'封印室',en:'Seal chamber',hint:'靠近金色祭坛驻足，解除一道封印。',enHint:'Stay beside the gold altar to break a seal.'},
    exit:{cn:'主墓室',en:'Main burial chamber',hint:'冥器入囊、封印尽解后，驻足机械开关拉闸；盗洞限时 25 秒。',enHint:'After the relic and seals, stand by the crank. The exit opens for 25 seconds.'}
};

const World = {
    rooms:[],props:[],hazards:[],altars:[],theme:THEMES[0],room:null,roomNotice:0,
    inside(r,x,y) {return x>=r.x*50&&x<(r.x+r.w)*50&&y>=r.y*50&&y<(r.y+r.h)*50;},
    setup(rooms) {
        this.theme=THEMES[Game.lvl-1]; this.rooms=rooms; this.props=[];this.hazards=[];this.altars=[];this.room=null;this.roomNotice=0;
        this.roomTiles=new Int16Array(MapSys.w*MapSys.h).fill(-1);
        const types=['burial','supply','trap','sanctuary','burial','trap'];
        rooms.forEach((r,i)=>{
            r.kind=i===0?'entry':i===rooms.length-1?'exit':types[(i-1)%types.length];
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
        this.placePassageHazards();
        for(let i=0;i<this.theme.seals;i++) {
            const r=rooms[1+i%Math.max(1,rooms.length-2)];r.kind='seal';
            this.addAltar(r,'seal',i);
        }
        // Keep sanctuaries and arrival rooms free of spawned enemies and traps.
        Game.ents=Game.ents.filter(e=>!(['zombie','trap'].includes(e.type)&&rooms.some(r=>['sanctuary','entry'].includes(r.kind)&&this.inside(r,e.x,e.y))));
        Game.ents.forEach(e=>{
            if(e.type==='zombie') {
                e.species=SPECIES[Game.lvl-1];e.zType=e.species.type;e.spd=e.species.speed;
            }
            if(e.type==='trap') {this.mountTrap(e);e.pType=this.theme.trap==='MIX'?['ARROW','FIRE','STONE'][Math.floor(Math.random()*3)]:this.theme.trap;e.cd=1.5+Math.random();e.windup=0;}
        });
        // The first compass is discoverable without having to search the entire floor.
        const compass=Game.ents.find(e=>e.code==='item_compass');
        if(compass&&!Game.p.hasCompass) {compass.x=Game.p.x+65;compass.y=Game.p.y+50;}
        Expedition.setup();ExitGate.setup();this.baseSight=this.theme.sight;
        this.updateRoom();
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
        for(let i=candidates.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
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
        if(!Game.exit)return Game.artifactPos;
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
        const type=ROOM_TYPES[r?.kind],cn=curLang==='CN';
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
