const THEMES = [
    {name:'沙海迷冢',en:'Buried in Sand',tile:0,wall:12,tint:'#b78c51',sight:320,water:0,hazard:'sand',seals:0,zombies:[0,0,0],trap:'ARROW',note:'沙下无声。驻足开棺，寻找镇墓之物。',enNote:'Stay beside coffins to uncover the relic.'},
    {name:'千纹机关廊',en:'Hall of Hidden Bolts',tile:1,wall:13,tint:'#a5b4aa',sight:320,water:0,hazard:'spikes',seals:0,zombies:[0,1],trap:'ARROW',note:'弩机亮起红线后发射，横向躲开。',enNote:'Crossbows warn with a red line. Dodge sideways.'},
    {name:'青铜兽影厅',en:'Bronze Guardians',tile:2,wall:14,tint:'#8da98c',sight:310,water:0,hazard:'spikes',seals:0,zombies:[0,0,1],trap:'LOG',note:'青铜卫尸巡游。疾行的声响会惊动远处守卫。',enNote:'Bronze guardians patrol. Sprinting attracts distant enemies.'},
    {name:'巨鼎炼魂室',en:'The Soul Furnace',tile:3,wall:15,tint:'#db8448',sight:340,water:0,hazard:'fire',seals:0,zombies:[1,0],trap:'FIRE',note:'地火先亮后燃。看清火圈，等它熄灭再走。',enNote:'Ember circles flare before burning. Wait for them to fade.'},
    {name:'石骨迷宫',en:'Labyrinth of Bones',tile:4,wall:13,tint:'#9cabb0',sight:240,water:0,hazard:'spikes',seals:0,zombies:[1,1,0],trap:'STONE',note:'深处灯影短。循已走过的地图寻找岔路。',enNote:'Light fades in the maze. Use explored paths to find new routes.'},
    {name:'荧光棺河',en:'River of Lost Coffins',tile:5,wall:13,tint:'#5fa9a3',sight:310,water:0.24,hazard:'poison',seals:0,zombies:[2,2,0],trap:'VENOM',note:'积水迟滞脚步。绿毒尸会隔水吐毒。',enNote:'Flooded tiles slow movement. Spitters attack across the water.'},
    {name:'九字封印井',en:'Well of Two Seals',tile:6,wall:15,tint:'#a68ec9',sight:290,water:0,hazard:'poison',seals:2,zombies:[0,2],trap:'ARROW',note:'两座封印锁住去路。靠近祭坛驻足破印。',enNote:'Two seals bar the exit. Stay beside each altar to break them.'},
    {name:'暗影葬主殿',en:'Court of Shadows',tile:7,wall:15,tint:'#7f91b8',sight:220,water:0,hazard:'fire',seals:0,zombies:[1,1,2],trap:'FIRE',note:'暗处疾影众多。善用油灯与黑驴蹄子。',enNote:'Swift shadows gather. Seek lamps and warding talismans.'},
    {name:'帝王沉眠室',en:'The Sleeping Emperor',tile:8,wall:14,tint:'#d6b671',sight:330,water:0,hazard:'spikes',seals:0,zombies:[0,1,2],trap:'STONE',note:'金殿供物丰厚，机关也更密。补给室值得绕行。',enNote:'Rich offerings, dense traps. Supply chambers reward detours.'},
    {name:'永劫天陨塔',en:'Tower of the Fallen Star',tile:9,wall:15,tint:'#8797c7',sight:300,water:0.12,hazard:'fire',seals:3,zombies:[0,1,2],trap:'MIX',note:'最后三道封印。取回彼岸花，从盗洞重见天光。',enNote:'Three final seals. Claim the Equinox Flower and escape.'}
];
const ROOM_TYPES = {
    entry:{cn:'落脚处',en:'Arrival',hint:'灯火尚安，整顿行装再向前。',enHint:'A quiet place to begin.'},
    burial:{cn:'陪葬室',en:'Burial chamber',hint:'石棺之中，可能是供物，也可能是守墓人。',enHint:'Coffins may hold offerings—or guardians.'},
    supply:{cn:'供奉室',en:'Offering chamber',hint:'这里留有补给；满血时糯米酒不会自动消耗。',enHint:'Supplies await. Wine is preserved while at full health.'},
    sanctuary:{cn:'安息室',en:'Sanctuary',hint:'靠近青色祭坛驻足，可恢复生命或获得短暂护身。',enHint:'Stay beside the teal altar to heal or gain a brief shield.'},
    trap:{cn:'机关室',en:'Trap chamber',hint:'红色预警亮起后，离开危险区域。',enHint:'Move away when red warning marks appear.'},
    seal:{cn:'封印室',en:'Seal chamber',hint:'靠近金色祭坛驻足，解除一道封印。',enHint:'Stay beside the gold altar to break a seal.'},
    exit:{cn:'归墟水道',en:'The way below',hint:'冥器入囊、封印尽解后，盗洞方可通行。',enHint:'The exit opens once the relic is found and all seals are broken.'}
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
            this.props.push({x:(r.x+.65)*50,y:(r.y+.65)*50,sprite:7,size:65,glow:true});
            this.props.push({x:(r.x+r.w-.65)*50,y:(r.y+.65)*50,sprite:7,size:65,glow:true});
            if(i>0&&i<rooms.length-1) {
                for(let y=r.y+1;y<r.y+r.h-1;y++)for(let x=r.x+1;x<r.x+r.w-1;x++) {
                    if(this.theme.water && ((x*13+y*7)%19)/19<this.theme.water) MapSys.t[y*MapSys.w+x]=TERRAIN.WATER;
                }
                if(r.kind==='supply') {
                    for(const [j,code] of ['item_wine','item_hoof',Game.lvl===9?'item_jade':'item_candle'].entries())
                        Game.spawn(new GroundItem((r.x+1.5+j)*50,(r.y+r.h-1.5)*50,code));
                    const coffin=Game.ents.find(e=>e.type==='coffin'&&this.inside(r,e.x,e.y));
                    if(coffin&&coffin.content!=='artifact')coffin.content='supply';
                }
                if(r.kind==='sanctuary') this.addAltar(r,'sanctuary');
                if(r.kind==='trap' || (Game.lvl===4&&r.kind==='burial')) {
                    for(let j=0;j<3;j++)this.hazards.push({x:(r.x+1.5+j*1.5)*50,y:(r.y+r.h-2)*50,offset:j*.6,kind:this.theme.hazard});
                }
            }
        });
        for(let i=0;i<this.theme.seals;i++) {
            const r=rooms[1+i%Math.max(1,rooms.length-2)];r.kind='seal';
            this.addAltar(r,'seal',i);
        }
        // Keep sanctuaries and arrival rooms free of spawned enemies and traps.
        Game.ents=Game.ents.filter(e=>!(['zombie','trap'].includes(e.type)&&rooms.some(r=>['sanctuary','entry'].includes(r.kind)&&this.inside(r,e.x,e.y))));
        Game.ents.forEach(e=>{
            if(e.type==='zombie') {
                e.zType=this.theme.zombies[Math.floor(Math.random()*this.theme.zombies.length)];
                e.spd=e.zType===1?125+Game.lvl*2:e.zType===2?42:48+Game.lvl*4;
            }
            if(e.type==='trap') {e.pType=this.theme.trap==='MIX'?['ARROW','FIRE','STONE'][Math.floor(Math.random()*3)]:this.theme.trap;e.cd=1.5+Math.random();e.windup=0;}
        });
        // The first compass is discoverable without having to search the entire floor.
        const compass=Game.ents.find(e=>e.code==='item_compass');
        if(compass&&!Game.p.hasCompass) {compass.x=Game.p.x+65;compass.y=Game.p.y+50;}
        this.baseSight=this.theme.sight;
        this.updateRoom();
    },
    addAltar(room,kind,offset=0) {
        this.altars.push({x:(room.x+1.5+(offset%3)*1.5)*50,y:(room.y+1.5)*50,kind,done:false,progress:0});
    },
    remaining() {return this.altars.filter(a=>a.kind==='seal'&&!a.done).length;},
    canExit() {return !!Game.exit&&this.remaining()===0;},
    target() {
        if(!Game.exit)return Game.artifactPos;
        const seals=this.altars.filter(a=>a.kind==='seal'&&!a.done).sort((a,b)=>Math.hypot(a.x-Game.p.x,a.y-Game.p.y)-Math.hypot(b.x-Game.p.x,b.y-Game.p.y));
        return seals[0]||Game.exitPos;
    },
    sight() {return Math.max(180,Game.p.sight+(this.baseSight||300)-300);},
    phase(h) {return (Game.elapsed+h.offset)%6;},
    updateRoom() {
        const r=this.rooms.find(r=>this.inside(r,Game.p.x,Game.p.y));
        if(r===this.room)return;
        this.room=r;
        const label=document.getElementById('room-name'),hint=document.getElementById('room-hint');
        const type=ROOM_TYPES[r?.kind],cn=curLang==='CN';
        label.textContent=type?(cn?type.cn:type.en):(cn?'连接甬道':'Connecting passage');
        hint.textContent=type?(cn?type.hint:type.enHint):(cn?'沿石壁前行，留意通向其他墓室的岔口。':'Follow the stone passage and watch for branching rooms.');
    },
    update(dt) {
        this.updateRoom();
        for(const a of this.altars) {
            if(a.done)continue;
            if(Math.hypot(a.x-Game.p.x,a.y-Game.p.y)<48) {
                a.progress+=dt;
                if(a.progress>=1.2) {
                    a.done=true;AudioSys.playItem(true);
                    if(a.kind==='seal') Game.msg(curLang==='CN'?`封印已破 · 还剩 ${this.remaining()} 道`:`Seal broken · ${this.remaining()} remain`,'#e5be72');
                    else {
                        if(Game.p.hp<5)Game.p.hp++;else Game.p.buffs.jade=Math.max(Game.p.buffs.jade,8);
                        Game.msg(curLang==='CN'?'祭火护佑 · 生命恢复或护身八秒':'Altar blessing · healed or shielded for 8s','#9bd4b9');
                    }
                    Game.updateHUD();
                }
            } else a.progress=0;
        }
        for(const h of this.hazards) {
            if(this.phase(h)>4.5&&Math.hypot(h.x-Game.p.x,h.y-Game.p.y)<28)Game.p.hit();
        }
    }
};
