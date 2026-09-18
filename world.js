const THEMES = [
    {name:'汉阙长陵',en:'Han Ancestral Tomb',tile:0,wall:12,tint:'#c7924f',wallTint:'#6b3527',floorTint:'#9a7040',background:'#130c08',motif:'阙',sight:320,water:0,hazard:'sand',seals:0,zombies:[0,0,0],trap:'ARROW',trapCount:2,hazardCount:8,note:'赭石与朱砂铺出汉墓中轴。依次穿过墓道、左右耳室、前室、主室与后室，利用石碑和立柱挡住箭矢。',enNote:'Ochre and cinnabar mark a strict Han axis. Use stelae and pillars as projectile cover.'},
    {name:'千纹机关廊',en:'Hall of Hidden Bolts',tile:1,wall:13,tint:'#b7aa91',wallTint:'#4f5758',floorTint:'#827761',background:'#090d0e',motif:'弩',sight:305,water:0,hazard:'spikes',seals:0,zombies:[0,1],trap:'ARROW',trapCount:4,hazardCount:10,note:'铁灰机关廊连续折返，箭孔藏在墙缝中；支路补给能换来更安全的穿越路线。',enNote:'Iron-grey galleries fold back on themselves. Hidden bolt slits guard every shortcut.'},
    {name:'青铜兽影厅',en:'Bronze Guardians',tile:2,wall:14,tint:'#66a58f',wallTint:'#356f66',floorTint:'#657a61',background:'#07110f',motif:'兽',sight:295,water:0,hazard:'spikes',seals:0,zombies:[0,0,1],trap:'LOG',trapCount:4,hazardCount:12,note:'铜绿四兽厅围绕中央墓室成环，交叉通道会让青铜卫尸从侧翼逼近。',enNote:'Verdigris beast wings encircle the central hall, allowing guardians to flank through cross-passages.'},
    {name:'巨鼎炼魂室',en:'The Soul Furnace',tile:3,wall:15,tint:'#e26b32',wallTint:'#6e261d',floorTint:'#9b4429',background:'#150604',motif:'鼎',sight:315,water:0,hazard:'fire',seals:0,zombies:[1,0],trap:'FIRE',trapCount:6,hazardCount:14,note:'焦黑甬道环绕巨鼎形成放射结构，炉口与龙首喷嘴会在靠近后突然喷发。',enNote:'Charred passages radiate around the cauldron. Furnace mouths erupt at close range.'},
    {name:'石骨迷宫',en:'Labyrinth of Bones',tile:4,wall:13,tint:'#c8c1ad',wallTint:'#858278',floorTint:'#aaa38f',background:'#0d0d0c',motif:'骨',sight:215,water:0,hazard:'spikes',seals:0,zombies:[1,1,0],trap:'STONE',trapCount:6,hazardCount:16,note:'骨白墙体构成非对称迷宫，死路、回环与捷径彼此穿插；必须依靠已探索地图辨路。',enNote:'Bone-white walls form an asymmetric maze of dead ends, loops and hidden shortcuts.'},
    {name:'荧光棺河',en:'River of Lost Coffins',tile:5,wall:13,tint:'#3ad1c4',wallTint:'#205d68',floorTint:'#287d79',background:'#031013',motif:'河',sight:285,water:0.38,hazard:'poison',seals:0,zombies:[2,2,0],trap:'VENOM',trapCount:8,hazardCount:18,note:'青蓝棺河分成三股水道与数座干燥孤岛，积水迟滞脚步，绿毒尸会隔水封锁桥口。',enNote:'Three cyan river branches weave around dry islands. Spitters lock down the crossings.'},
    {name:'九字封印井',en:'Well of Nine Seals',tile:6,wall:15,tint:'#d3ad55',wallTint:'#3f315f',floorTint:'#6f568c',background:'#0b0714',motif:'封',sight:265,water:0,hazard:'poison',seals:4,zombies:[0,2],trap:'ARROW',trapCount:8,hazardCount:20,note:'墨紫九宫围绕中央封印井，四座祭坛分处不同象限，破印路线会反复穿越中心。',enNote:'An ink-violet nine-square grid surrounds the well. Four rites force repeated crossings of the core.'},
    {name:'暗影葬主殿',en:'Court of Shadows',tile:7,wall:15,tint:'#7656b8',wallTint:'#231c43',floorTint:'#46345f',background:'#050309',motif:'影',sight:185,water:0,hazard:'fire',seals:0,zombies:[1,1,2],trap:'FIRE',trapCount:10,hazardCount:22,note:'玄紫双环墓殿不断分流再汇合，短视野让暗处疾影可以从另一侧回环包抄。',enNote:'Two violet shadow rings split and recombine, letting fast guardians circle behind you.'},
    {name:'帝王沉眠室',en:'The Sleeping Emperor',tile:8,wall:14,tint:'#e1b743',wallTint:'#7b1e22',floorTint:'#8f6a24',background:'#130707',motif:'帝',sight:300,water:0,hazard:'spikes',seals:0,zombies:[0,1,2],trap:'STONE',trapCount:10,hazardCount:24,note:'帝王朱金陵寝由三重庭院套叠而成，正轴最险，左右宝库则提供补给与迂回路线。',enNote:'Three nested red-and-gold courts guard the imperial axis; side treasuries provide risky detours.'},
    {name:'永劫天陨塔',en:'Tower of the Fallen Star',tile:9,wall:15,tint:'#8ea6ff',wallTint:'#1d2557',floorTint:'#323a74',background:'#02030a',motif:'星',sight:270,water:0.2,hazard:'fire',seals:6,zombies:[0,1,2],trap:'MIX',trapCount:12,hazardCount:26,note:'星黑断塔以破碎螺旋连接六道封印，越接近核心，混合机关、尸群与水火地形越密集。',enNote:'A star-black broken spiral links six seals. Mixed traps, guardians and flooded fire lanes converge at the core.'}
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
            if(this.hazards.length>=this.theme.hazardCount)break;
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
        if(!BossFight.cleared)return BossFight.boss||Game.mainCoffinPos;
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
        Expedition.update(dt);BossFight.update(dt);ExitGate.update(dt);this.updateRoom();
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
