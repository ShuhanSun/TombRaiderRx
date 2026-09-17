/**
 * TombRaider Survival — expedition update
 * Fixed-step simulation, exploration map, lifecycle-safe interactions.
 */

const CONFIG = { TILE: 50, BASE_SIGHT: 300, ZOMBIE_SPD: 55, SPRINTER_SPD: 140, GREEN_SPD: 40, BREATH_MAX: 30 };
const TERRAIN = { FLOOR: 0, WALL: 1, WATER: 2 };

const LEVEL_NAMES_CN = ["汉阙长陵", "千纹机关廊", "青铜兽影厅", "巨鼎炼魂室", "石骨迷宫", "荧光棺河", "九字封印井", "暗影葬主殿", "帝王沉眠室", "永劫天陨塔"];
const LEVEL_NAMES_EN = ["Han Ancestral Tomb", "Thousand Traps", "Bronze Beast Hall", "Cauldron Chamber", "Bone Labyrinth", "Fluorescent River", "Nine Seal Well", "Shadow Burial", "Emperor's Sleep", "Eternal Fall Tower"];

const TRAP_NAMES_CN = ["连弩塔", "投石机", "滚木阵", "喷火口", "混合阵", "飞刀口", "巨石阵", "鬼火阵", "万箭阵", "绝境塔"];
const TRAP_NAMES_EN = ["Crossbow", "Catapult", "Log Trap", "Flamer", "Mix Trap", "Knives", "Boulders", "Ghost Fire", "Arrow Rain", "Despair Tower"];

const LEVELS_DATA = [
    { delay: 1.5, type: 'ARROW', col: '#5d4037' }, { delay: 2.0, type: 'STONE', col: '#4e342e' },
    { delay: 2.5, type: 'LOG', col: '#3e2723' }, { delay: 3.0, type: 'FIRE', col: '#bf360c' },
    { delay: 1.8, type: 'MIX', col: '#263238' }, { delay: 1.2, type: 'ARROW', col: '#455a64' },
    { delay: 4.0, type: 'STONE', col: '#33691e' }, { delay: 3.0, type: 'FIRE', col: '#311b92' },
    { delay: 1.0, type: 'ARROW', col: '#212121' }, { delay: 2.0, type: 'MIX', col: '#b71c1c' }
];

const WALL_COLORS = ['#6b3527','#4f5758','#356f66','#6e261d','#858278','#205d68','#3f315f','#231c43','#7b1e22','#1d2557'];

const SPECIAL_ITEMS = ['item_candle', 'item_wine', 'item_hoof', 'item_jade', 'item_compass'];
const PROJ_TYPES = {
    ARROW: { spd: 350, size: 3, col: '#eee', trail: true },
    STONE: { spd: 180, size: 10, col: '#795548', trail: false },
    FIRE: { spd: 220, size: 6, col: '#ff5722', trail: true },
    LOG: { spd: 150, size: 15, col: '#5d4037', trail: false, shape: 'rect' },
    VENOM: { spd: 180, size: 5, col: '#00ff00', trail: true } // For green zombie
};

// --- Localization ---
const LANG = {
    CN: {
        title: "寻龙诀",
        ver: "古墓新篇 · 画境与回声",
        p1: "一盏灯，十重墓。你要找到每层的<b>机关钥匙</b>，在机关与守墓尸的追逐中寻到盗洞。供奉室留有补给，安息室可借祭火护身；越往深处，越要留意封印与地火。",
        startBtn: "点灯摸金",
        level: "第 %s 层 | %m",
        trapLabel: "机关",
        modalBtn: "收入囊中",
        endTitle: "灯尽于此",
        endDesc: "记住来路，下一次离天光更近。",
        endBtn: "再探古墓",
        winTitle: "摸金校尉 凯旋",
        winDesc: "穿越十层，逃出生天！",
        winBtn: "再来一局",
        items: {
            shovel: {n:"兵工铲", d:"近战武器：靠近僵尸时自动挥击。"},
            candle: {n:"残油铜灯", d:"<b>添油续火</b>: 扩大视野 20 秒，每层仅一盏。"},
            wine: {n:"糯米酒", d:"<b>祛阴补阳</b>: 恢复 1 点生命值。"},
            hoof: {n:"黑驴蹄子", d:"<b>生人勿近</b>: 僵尸退避 15 秒。"},
            jade: {n:"金缕玉衣", d:"<b>刀枪不入</b>: 抵挡下一次伤害后破损，不叠加。"},
            compass: {n:"风水罗盘", d:"<b>寻龙分金</b>: 持有时显示小地图并指引目标；受伤可能掉落。"}
        },
        msgs: {
            start: "进入第 %s 层",
            hurt: "受到伤害!",
            empty: "棺中只余尘土",
            trap: "机括声起 · 速退",
            zombie: "棺中有变 · 守墓尸苏醒",
            candle: "添油续火 · 照明 20 秒",
            compass: "罗盘在手! 寻龙分金!",
            heal: "生命恢复!",
            repel: "尸畏 15秒!",
            immune: "玉衣护身 · 可抵挡一次伤害",
            hole: "水脉倒灌 · 盗洞已开"
        },
        levelNames: LEVEL_NAMES_CN,
        trapNames: TRAP_NAMES_CN,
        labels: { coffin: "石棺", exit: "盗洞", sprinter: "疾行尸", green: "绿毒尸" },
        exitModal: { t: "发现盗洞", d: "是否进入下一层？<br>(进入后无法返回)", yes: "进入下一层" }
    },
    EN: {
        title: "Tomb Raider",
        ver: "TEN FLOORS · ONE FLAME",
        p1: "One lantern. Ten buried floors. Find each <b>bronze key</b>, evade ancient traps, and reach the exit. Seek supplies and sanctuary altars; deeper chambers hide fire and seals.",
        startBtn: "Start Raid",
        level: "Level %s | %m",
        trapLabel: "Trap",
        modalBtn: "Collect",
        endTitle: "You Died",
        endDesc: "Better luck next time.",
        endBtn: "Try Again",
        winTitle: "Victory!",
        winDesc: "Artifacts found. You survived!",
        winBtn: "Play Again",
        items: {
            shovel: {n:"Entrenching Shovel", d:"Automatically strikes nearby zombies."},
            candle: {n:"Oil Lamp", d:"<b>Last Oil</b>: Wider sight for 20 seconds. One lamp per floor."},
            wine: {n:"Rice Wine", d:"<b>Vitality</b>: Restore 1 HP."},
            hoof: {n:"Donkey Hoof", d:"<b>Repel</b>: Zombies fear you for 15s."},
            jade: {n:"Jade Suit", d:"<b>Invincible</b>: Blocks one hit, then breaks. Does not stack."},
            compass: {n:"Compass", d:"<b>Feng Shui</b>: Unlocks the minimap and guides you. May drop when hurt."}
        },
        msgs: {
            start: "Entered Level %s",
            hurt: "Took Damage!",
            empty: "Empty...",
            trap: "Trap Triggered!",
            zombie: "Zombie Rise!",
            candle: "Lamp lit · 20 seconds",
            compass: "Compass Active!",
            heal: "HP Restored!",
            repel: "Repel 15s!",
            immune: "Jade suit · blocks one hit",
            hole: "Exit Opened! Water Rising!"
        },
        levelNames: LEVEL_NAMES_EN,
        trapNames: TRAP_NAMES_EN,
        labels: { coffin: "Coffin", exit: "Exit", sprinter: "Sprinter", green: "Spitter" },
        exitModal: { t: "Exit Found", d: "Enter next level?<br>(No return)", yes: "Enter" }
    }
};

let curLang = 'CN';

// --- Audio ---
const AudioSys = {
    ctx: null, gain: null, lastHurt: 0, muted: false,
    init: function() { Sound.unlock(); },
    tone: function(f, type, dur, vol=0.1, slide=null) {
        if(!this.ctx||this.muted||this.ctx.state!=='running') return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(f, t);
        if(slide) osc.frequency.linearRampToValueAtTime(slide, t+dur);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t+dur*0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t+dur);
        osc.connect(g); g.connect(this.gain);
        osc.start(t); osc.stop(t+dur+0.2);
    },
    playStomp: function() {
        if(!this.ctx||this.muted||this.ctx.state!=='running')return;
        const t=this.ctx.currentTime,buffer=this.ctx.createBuffer(1,Math.ceil(this.ctx.sampleRate*.12),this.ctx.sampleRate),data=buffer.getChannelData(0);
        for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*5);
        const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();
        source.buffer=buffer;filter.type='lowpass';filter.frequency.value=1700;gain.gain.setValueAtTime(.32,t);gain.gain.exponentialRampToValueAtTime(.001,t+.12);
        source.connect(filter);filter.connect(gain);gain.connect(this.gain);source.start(t);source.stop(t+.13);
        this.tone(85,'sine',.09,.14,38);
    },
    playStep: function(water=false,sprint=false) { /* Footstep and wading audio disabled by request. */ },
    playOpen: function() {
        if(!this.ctx||this.muted||this.ctx.state!=='running') return;
        const t=this.ctx.currentTime, o=this.ctx.createOscillator(), g=this.ctx.createGain(), f=this.ctx.createBiquadFilter();
        o.type='triangle'; o.frequency.setValueAtTime(50,t); o.frequency.exponentialRampToValueAtTime(30,t+0.8);
        f.type='lowpass'; f.frequency.value=200;
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.6,t+0.1); g.gain.linearRampToValueAtTime(0,t+1.0);
        o.connect(f); f.connect(g); g.connect(this.gain); o.start(t); o.stop(t+1.1);
    },
    playItem: function(s) {
        if(s) { this.tone(523, 'sine', 0.5, 0.2); setTimeout(()=>this.tone(784, 'sine', 1.0, 0.2), 100); }
        else this.tone(880, 'sine', 0.1, 0.1);
    },
    playTrap: function(dist) {
        const maxDist = 600; if(dist > maxDist) return;
        const vol = Math.max(0, 1 - dist/maxDist) * 0.4;
        this.tone(600, 'sawtooth', 0.2, vol, 200);
    },
    playAttack: function() { this.tone(150, 'sawtooth', 0.3, 0.3, 50); },
    playHurt: function() {
        const now = Date.now();
        if(now - this.lastHurt > 1000) {
            if(this.ctx) {
                this.tone(120, 'sine', 0.2, 0.5, 80);
                setTimeout(()=>this.tone(60, 'triangle', 0.3, 0.4), 50);
            }
            this.lastHurt = now;
        }
    },
    playJadeBreak: function() {
        this.tone(1180,'triangle',.08,.24,760);
        setTimeout(()=>this.tone(690,'sine',.16,.18,310),45);
        setTimeout(()=>this.tone(1450,'square',.045,.07,900),90);
    },
    playUse: function() { this.tone(400, 'sine', 1.0, 0.2, 800); }
};

// --- Input ---
const Input = {
    x:0, y:0, active:false, keys:{}, sprint:false, pointer:null, sprintPointer:null,
    touchX:0, touchY:0,
    update() {
        let x=(this.keys.KeyD||this.keys.ArrowRight?1:0)-(this.keys.KeyA||this.keys.ArrowLeft?1:0);
        let y=(this.keys.KeyS||this.keys.ArrowDown?1:0)-(this.keys.KeyW||this.keys.ArrowUp?1:0);
        const len=Math.hypot(x,y);
        if(len) { x/=len; y/=len; } else { x=this.touchX; y=this.touchY; }
        this.x=x; this.y=y; this.active=Math.hypot(x,y)>0.08;
        this.sprint=!!(this.keys.ShiftLeft||this.keys.ShiftRight||this.sprintPointer!==null);
    },
    reset() {
        this.keys={}; this.pointer=null; this.sprintPointer=null;this.breathPointer=null;
        this.touchX=0; this.touchY=0; this.update();
        document.getElementById('joystick-zone').classList.remove('steering');
        document.getElementById('sprint-btn').classList.remove('pressed');
        Game.p?.stopHoldingBreath?.();
    }
};
(function(){
    const zone=document.getElementById('joystick-zone'), knob=document.getElementById('joystick-knob');
    const move=e=>{
        if(e.pointerId!==Input.pointer) return;
        const dx=e.clientX-Input.originX,dy=e.clientY-Input.originY,distance=Math.hypot(dx,dy);
        const power=Math.min(1,Math.max(0,(distance-7)/32));
        Input.touchX=distance?dx/distance*power:0;Input.touchY=distance?dy/distance*power:0;Input.update();
        if(distance>65){Input.originX=e.clientX-dx/distance*65;Input.originY=e.clientY-dy/distance*65;}
        knob.style.left=Input.originX+'px';knob.style.top=Input.originY+'px';
        knob.style.transform=`translate(-50%,-50%) rotate(${Math.atan2(dy,dx)}rad)`;
    };
    zone.addEventListener('pointerdown',e=>{
        if(!Game.running||Game.pause||Input.pointer!==null) return;
        e.preventDefault(); Input.pointer=e.pointerId;Input.originX=e.clientX;Input.originY=e.clientY;zone.classList.add('steering');zone.setPointerCapture(e.pointerId);move(e);
    });
    zone.addEventListener('pointermove',move);
    const release=e=>{
        if(e.pointerId!==Input.pointer) return;
        Input.pointer=null; Input.touchX=0; Input.touchY=0; Input.update();
        zone.classList.remove('steering');
    };
    ['pointerup','pointercancel','lostpointercapture'].forEach(name=>zone.addEventListener(name,release));
    const breath=document.getElementById('breath-btn');
    breath.addEventListener('pointerdown',e=>{
        if(!Game.running||Game.pause||Input.breathPointer!==null)return;
        e.preventDefault();Input.breathPointer=e.pointerId;breath.setPointerCapture(e.pointerId);Game.p?.startHoldingBreath();
    });
    const releaseBreath=e=>{
        if(e.pointerId!==Input.breathPointer)return;
        Input.breathPointer=null;Game.p?.stopHoldingBreath();
    };
    ['pointerup','pointercancel','lostpointercapture'].forEach(name=>breath.addEventListener(name,releaseBreath));
    document.addEventListener('dblclick',e=>{
        if(e.target?.closest?.('button,#joystick-zone'))e.preventDefault();
    },{capture:true,passive:false});
    const sprint=document.getElementById('sprint-btn');
    sprint.addEventListener('pointerdown',e=>{
        if(!Game.running||Game.pause||Input.sprintPointer!==null) return;
        e.preventDefault(); Input.sprintPointer=e.pointerId; sprint.setPointerCapture(e.pointerId);
        sprint.classList.add('pressed'); Input.update();
    });
    const releaseSprint=e=>{
        if(e.pointerId!==Input.sprintPointer) return;
        Input.sprintPointer=null; sprint.classList.remove('pressed'); Input.update();
    };
    ['pointerup','pointercancel','lostpointercapture'].forEach(name=>sprint.addEventListener(name,releaseSprint));
    const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'];
    window.addEventListener('keydown',e=>{
        if(e.code==='KeyB'&&Game.running&&!Game.pause){e.preventDefault();if(!e.repeat)Game.p.startHoldingBreath();return;}
        if(e.code==='Escape'&&!e.repeat) { Game.togglePause(); return; }
        if(e.code==='KeyM'&&!e.repeat) { Game.toggleSound(); return; }
        if(!Game.running||Game.pause||!movement.includes(e.code)) return;
        e.preventDefault(); Input.keys[e.code]=true; Input.update();
    });
    window.addEventListener('keyup',e=>{if(e.code==='KeyB')Game.p?.stopHoldingBreath();delete Input.keys[e.code]; Input.update(); });
    window.addEventListener('blur',()=>{ Input.reset(); Game.togglePause(true); });
    document.addEventListener('visibilitychange',()=>{ if(document.hidden) { Input.reset(); Game.togglePause(true); } });
})();

class FloatText {
    constructor(x,y,t,c){this.x=x;this.y=y;this.t=t;this.c=c;this.life=1;}
    update(dt){this.y-=30*dt;this.life-=dt;}
    draw(ctx){
        ctx.globalAlpha=Math.max(0,this.life); ctx.fillStyle=this.c; ctx.font="bold 16px serif"; ctx.textAlign="center";
        ctx.fillText(this.t,0,0); ctx.globalAlpha=1;
    }
}

class Effect {
    constructor(x,y,type){this.x=x;this.y=y;this.type='effect';this.effectType=type;this.life=1.0;}
    update(dt){this.life-=dt*2; if(this.life<0)this.dead=1;}
    draw(ctx){
        ctx.save();
        ctx.globalAlpha=Math.max(0,this.life);
        if(this.effectType==='gold') {
            ctx.strokeStyle='#ffd700'; ctx.lineWidth=2;
            for(let i=0;i<8;i++){ ctx.rotate(0.785); ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(30+Math.random()*10,0); ctx.stroke(); }
        } else if(this.effectType==='burst') {
            ctx.fillStyle='#b71c1c'; ctx.beginPath(); ctx.arc(0,0,(1-this.life)*50,0,6.28); ctx.fill();
        }
        ctx.restore();
    }
}

// --- Entities ---
class Entity { constructor(x,y,t){this.x=x;this.y=y;this.type=t;this.dead=0;} }

class GroundItem extends Entity {
    constructor(x,y,code) { super(x,y,'ground_item'); this.code=code; }
    update(dt, p) {
        if(this.dead)return;
        if(this.pickupDelay>0){this.pickupDelay=Math.max(0,this.pickupDelay-dt);return;}
        const key=this.code.replace('item_','');
        if(Math.hypot(this.x-p.x, this.y-p.y) < 30) { const previous=p.buffs[key]||0;Game.getItem(this.code);if(this.remaining!==undefined&&key!=='compass')p.buffs[key]=Math.max(previous,this.remaining); this.dead = 1; }
    }
    draw(ctx) {
        const iKey = this.code.replace('item_', '');
        const colors = {candle:'#ff8a80', wine:'#fff', hoof:'#a1887f', jade:'#a5d6a7', compass:'#ffd700',shovel:'#c9d5cf'};
        const yOff = Math.sin(Date.now()/300)*5;
        const iconMap = {candle:'🪔', wine:'🍶', hoof:'🐴', jade:'🥋', compass:'🧭',shovel:'⚒'};
        ctx.font = "24px serif"; ctx.textAlign = "center";
        ctx.fillText(iconMap[iKey], 0, yOff);
        ctx.fillStyle = '#fff'; ctx.font = "12px serif";
        ctx.fillText(LANG[curLang].items[iKey].n, 0, yOff - 20);

        ctx.shadowBlur=15; ctx.shadowColor=colors[iKey];
        ctx.beginPath(); ctx.arc(0,10,8,0,6.28); ctx.fillStyle=colors[iKey]; ctx.fill(); ctx.shadowBlur=0;
    }
}

class Coffin extends Entity {
    constructor(x,y,c){super(x,y,'coffin');this.content=c;this.opened=0;this.shake=0;this.lidOffset=0;this.lidProgress=0;this.lidDirX=1;this.lidDirY=0;this.interactTimer=0;this.revealTimer=0;}
    interact(dt, p) {
        if(this.opened||this.hidden||this.rising||this.locked) return;
        if(Math.hypot(this.x-p.x, this.y-p.y) < 45) {
            const angle=Math.atan2(this.y-p.y,this.x-p.x);p.direction=Math.abs(Math.cos(angle))>Math.abs(Math.sin(angle))?(Math.cos(angle)<0?1:2):(Math.sin(angle)<0?3:0);p.pushDirection=p.direction;
            p.pushingCoffin=this;p.pushUntil=Game.elapsed+.12;
            this.interactTimer += dt;
            if(this.interactTimer > 0.6) {
                this.open(p);
            }
        } else {
            this.interactTimer = 0;
        }
    }
    open(p=Game.p) {
        if(this.opened||this.hidden||this.rising||this.locked) return;
        const dx=this.x-(p?.x??this.x-1),dy=this.y-(p?.y??this.y),d=Math.hypot(dx,dy)||1;
        this.lidDirX=dx/d;this.lidDirY=dy/d;this.lidProgress=0;
        if(p){const angle=Math.atan2(this.y-p.y,this.x-p.x);p.direction=Math.abs(Math.cos(angle))>Math.abs(Math.sin(angle))?(Math.cos(angle)<0?1:2):(Math.sin(angle)<0?3:0);p.pushDirection=p.direction;p.pushingCoffin=this;p.pushUntil=Game.elapsed+.72;}
        this.opened = 1;TombDangers.coffinFX(this); this.shake = 0.5; this.revealTimer = 0.6; AudioSys.playOpen();
    }
    reveal() {
            if(this.revealed)return;this.revealed=true;
            if(Expedition.reveal(this))return;
            if(this.content === 'supply') {
                Game.spawn(new GroundItem(this.x+35,this.y,'item_wine'));
                Game.spawn(new GroundItem(this.x-35,this.y,'item_jade'));
                Game.addText(this.x,this.y,curLang==='CN'?'供物尚存':'Offerings remain','#aaddbb');
            }
            else if(this.content === 'zombie') {
                Game.spawn(new Zombie(this.x,this.y+20));
                Game.addText(this.x, this.y, LANG[curLang].msgs.zombie, '#f44336');
                Game.spawn(new Effect(this.x,this.y,'burst'));
                AudioSys.playAttack();
            }
            else if(this.content === 'trap') {
                 const launcher=new Trap(this.x,this.y+40, Game.lvl-1);World.mountTrap(launcher);Game.spawn(launcher);
                 Game.addText(this.x, this.y, LANG[curLang].msgs.trap, '#f44336');
                 AudioSys.playTrap(0);
            }
            else {
                Game.addText(this.x, this.y, LANG[curLang].msgs.empty, '#aaa');
            }
    }
    update(dt) {
        this.shake=Math.max(0,this.shake-dt);
        if(this.revealTimer>0) {
            this.revealTimer=Math.max(0,this.revealTimer-dt);
            if(this.revealTimer===0) this.reveal();
        }
        if(this.opened)this.lidProgress=Math.min(1,this.lidProgress+dt/0.68);
    }
    draw(ctx) {
        if(this.shake>0){ctx.translate((Math.random()-.5)*4,0);}
        if(!this.opened) {
            ctx.fillStyle = '#aaa'; ctx.font='12px serif'; ctx.textAlign='center';
            ctx.fillText(LANG[curLang].labels.coffin, 0, -50);
        }
        ctx.save();
        ctx.rotate(Math.PI/2);

        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.moveTo(-18, -35); ctx.lineTo(18, -35); ctx.lineTo(14, 35); ctx.lineTo(-14, 35); ctx.closePath(); ctx.fill();

        if(this.opened) {
            ctx.save();
            ctx.translate(this.lidOffset, -this.lidOffset);
            ctx.rotate(-0.2);
        }

        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.moveTo(-18, -35); ctx.lineTo(18, -35); ctx.lineTo(14, 35); ctx.lineTo(-14, 35); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#616161'; ctx.beginPath(); ctx.arc(0, -20, 5, 0, Math.PI*2); ctx.fill();

        if(!this.opened) {
            ctx.fillStyle='#ffd700'; ctx.fillRect(-5,-10,10,20);
            ctx.fillStyle='#b71c1c'; ctx.font='12px serif'; ctx.textAlign="left"; ctx.fillText('敕',-6,5);
        }

        if(this.opened) ctx.restore();
        ctx.restore();

        if(this.interactTimer > 0 && !this.opened) {
            ctx.fillStyle = '#0f0';
            ctx.fillRect(-20, -60, 40 * (this.interactTimer/0.6), 5);
        }
    }
}

class Zombie extends Entity {
    constructor(x,y,type=SPECIES[Game.lvl-1].type){super(x,y,'zombie');
        this.zType = type; // 0: Blue, 1: Red (Sprinter), 2: Green (Spitter)
        this.species={...SPECIES[Game.lvl-1],windup:type===SPECIES[Game.lvl-1].type?SPECIES[Game.lvl-1].windup:type===2?.6:.38};this.zType=type;this.spd=this.species.speed;
        this.dir = Math.random()*6.28; this.changeDirT = 0;
        this.attackCD=0;this.attackState='';this.attackClock=0;this.attackAim=0;this.hopPhase=Math.random();this.hopHeight=0;this.landT=0;this.moving=false;this.homeCoffin=null;this.homeX=x;this.homeY=y;this.stealthLostT=0;this.returningToCoffin=false;this.sink=0;
    }
    update(dt,p) {
        const dx=p.x-this.x,dy=p.y-this.y,d=Math.hypot(dx,dy),repel=p.buffs.hoof>0;
        this.attackCD=Math.max(0,this.attackCD-dt);
        this.landT=Math.max(0,this.landT-dt);this.moving=false;
        const concealed=p.holdingBreath;
        if((repel||concealed)&&this.attackState) {this.attackState='';this.attackClock=0;this.attackCD=.6;}
        if(!concealed){this.stealthLostT=0;this.returningToCoffin=false;this.sink=0;}
        if(!concealed&&this.attackState) {
            this.hopHeight=0;this.attackClock-=dt;
            if(this.attackClock<=0) {
                if(this.attackState==='windup') {
                    this.attackState='strike';this.attackClock=.24;
                    if(this.zType===2) {
                        Game.spawn(new Projectile(this.x,this.y,this.attackAim,this.species.shot||'VENOM','enemy'));
                        const fx=new Effect(this.x,this.y,'spit');fx.angle=this.attackAim;Game.spawn(fx);
                        AudioSys.playTrap(d);
                    } else {
                        const facing=(dx*Math.cos(this.attackAim)+dy*Math.sin(this.attackAim))/(d||1);
                        if(d<43&&(facing>.3||d<18)&&MapSys.lineClear(this.x,this.y,p.x,p.y))p.hit();
                        const fx=new Effect(this.x+Math.cos(this.attackAim)*20,this.y+Math.sin(this.attackAim)*20,'slash');fx.angle=this.attackAim;Game.spawn(fx);
                        if(d<220)AudioSys.playAttack();
                    }
                } else if(this.attackState==='strike') {this.attackState='recover';this.attackClock=.32;}
                else {this.attackState='';this.attackCD=this.zType===2?1.8:this.zType===1?1.1:1.4;}
            }
            return;
        }
        const inRange=this.zType===2?d<this.species.sense:d<36;
        if(!concealed&&!repel&&inRange&&this.attackCD<=0&&MapSys.lineClear(this.x,this.y,p.x,p.y)) {
            this.attackState='windup';this.attackClock=this.species.windup;
            this.attackAim=Math.atan2(dy,dx);this.hopHeight=0;return;
        }
        let vx=0,vy=0;
        if(concealed) {
            this.stealthLostT+=dt;
            if(this.stealthLostT<.85){this.hopHeight=0;this.hopPhase=0;return;}
            const hx=this.homeCoffin?.x??this.homeX,hy=this.homeCoffin?this.homeCoffin.y+18:this.homeY,hdx=hx-this.x,hdy=hy-this.y,homeDist=Math.hypot(hdx,hdy);
            this.returningToCoffin=true;
            if(homeDist<25){this.sink=Math.min(1,this.sink+dt/.8);this.hopHeight=0;this.moving=false;if(this.sink>=1)this.dead=1;return;}
            vx=hdx/(homeDist||1);vy=hdy/(homeDist||1);
        }
        else if(repel&&d<350) {vx=-dx/(d||1);vy=-dy/(d||1);}
        else if(this.zType===1) {
            if(d<this.species.sense) {vx=dx/(d||1);vy=dy/(d||1);}
            else {
                this.changeDirT-=dt;
                if(this.changeDirT<=0){this.changeDirT=1+Math.random();this.dir=Math.random()*Math.PI*2;}
                vx=Math.cos(this.dir);vy=Math.sin(this.dir);
            }
        } else if(d<this.species.sense||(Input.active&&d<(Input.sprint?420:250))) {vx=dx/(d||1);vy=dy/(d||1);}
        if(Math.hypot(vx,vy)<.01) {this.hopHeight=0;this.hopPhase=0;return;}
        const period=this.species.hop,previous=this.hopPhase;
        this.hopPhase=(this.hopPhase+dt/period)%1;
        const airborne=this.hopPhase<.68;
        this.hopHeight=airborne?Math.sin(this.hopPhase/.68*Math.PI)*(this.zType===1?17:13):0;
        const speed=this.spd*(repel?1.5:concealed?.22:1)*(MapSys.get(this.x,this.y)===TERRAIN.WATER&&!this.species.aquatic?.45:1);
        const distance=airborne?speed*dt/.68:0,oldX=this.x,oldY=this.y;
        const nx=this.x+vx*distance,ny=this.y+vy*distance;
        if(MapSys.canOccupy(nx,this.y,9))this.x=nx;else if(this.zType===1)this.dir=Math.PI-this.dir;
        if(MapSys.canOccupy(this.x,ny,9))this.y=ny;else if(this.zType===1)this.dir=-this.dir;
        this.moving=Math.hypot(this.x-oldX,this.y-oldY)>.001||airborne;
        if(previous<.68&&this.hopPhase>=.68) {
            this.landT=.13;
            if(d<280)Game.spawn(new Effect(this.x,this.y+4,'dust'));
        }
    }
    draw(ctx){
        ctx.translate(0,this.hop||0);
        if(Game.p.buffs.hoof>0) { ctx.fillStyle='#f00'; ctx.font='20px serif'; ctx.fillText('!', 0, -50); }

        let color = '#283593'; // Blue
        if(this.zType === 1) color = '#b71c1c'; // Red
        if(this.zType === 2) color = '#2e7d32'; // Green

        ctx.fillStyle = '#000'; ctx.fillRect(-10,-42,20,5); ctx.fillRect(-6,-48,12,6); // Hat
        ctx.fillStyle = this.zType===1 ? '#ff5252' : '#e53935'; ctx.beginPath(); ctx.arc(0,-50,3,0,6.28); ctx.fill();

        ctx.fillStyle = color; ctx.fillRect(-12,-25,24,25); // Robe
        ctx.fillStyle='#e0e0e0'; ctx.beginPath(); ctx.arc(0,-30,9,0,6.28); ctx.fill(); // Head
        ctx.fillStyle = color; ctx.fillRect(-14, -28, 6, 20); ctx.fillRect(8, -28, 6, 20); // Arms
        ctx.fillStyle='#ffea00'; ctx.fillRect(-3,-38,6,12); // Tag

        if(this.zType === 2) { // Green particle
             ctx.fillStyle='rgba(0,255,0,0.5)'; ctx.beginPath(); ctx.arc(0,0,15,0,6.28); ctx.fill();
        }
    }
}

class Trap extends Entity {
    constructor(x,y,lvlIndex){
        super(x,y,'trap');
        this.life=3;this.cd=0;this.windup=0;this.aim=0;this.displayAim=0;this.recoil=0;this.revealT=0;this.revealed=false;
        const data = LEVELS_DATA[Math.min(lvlIndex,9)];
        this.pType = data.type === 'MIX' ? Object.keys(PROJ_TYPES)[Math.floor((x+y)/50)%4] : data.type;
        this.color = data.col;
        this.name = LANG[curLang].trapNames[Math.min(lvlIndex,9)];
        this.lvlIdx = Math.min(lvlIndex,9);
    }
    update(dt,p){
        if(this.vent)return;
        const dist=Math.hypot(this.x-p.x,this.y-p.y);
        this.recoil=Math.max(0,this.recoil-dt);
        this.revealT=Math.max(0,this.revealT-dt);
        if(this.windup>0) {
            this.windup-=dt;
            if(this.windup<=0) {
                this.displayAim=this.aim;
                Game.spawn(new Projectile(this.x+Math.cos(this.aim)*20,this.y+Math.sin(this.aim)*20,this.aim,this.pType));
                this.recoil=.28;
                const fx=new Effect(this.x+Math.cos(this.aim)*20,this.y+Math.sin(this.aim)*20,'muzzle');fx.angle=this.aim;Game.spawn(fx);
                AudioSys.playTrap(dist);
                this.cd=LEVELS_DATA[this.lvlIdx].delay+0.4;
            }
        } else {
            this.cd=Math.max(0,this.cd-dt);
            if(this.cd<=0&&dist<175&&MapSys.lineClear(this.x,this.y,p.x,p.y)) {
                this.aim=Math.atan2(p.y-this.y,p.x-this.x);this.displayAim=this.aim;this.windup=.1;this.revealT=.8;this.revealed=true;
            }
        }
    }
    draw(ctx){
        ctx.fillStyle=this.color; ctx.fillRect(-15,-20,30,20);
        ctx.fillStyle='#212121'; ctx.beginPath(); ctx.moveTo(-15,-20); ctx.lineTo(-18,0); ctx.lineTo(18,0); ctx.lineTo(15,-20); ctx.fill();
        ctx.fillStyle='#f44336'; const pulse = 3 + Math.sin(Date.now()/100)*2; ctx.beginPath(); ctx.arc(0,-28, pulse, 0, 6.28); ctx.fill();
        ctx.fillStyle = '#ff5252'; ctx.font = 'bold 12px serif'; ctx.textAlign='center';
        ctx.fillText(LANG[curLang].trapNames[this.lvlIdx], 0, -45);
    }
}

class Projectile extends Entity {
    constructor(x,y,a,type,source='trap'){super(x,y,'proj');
        this.source=source;this.pType=type;this.age=0;this.info = PROJ_TYPES[type] || PROJ_TYPES.ARROW;
        this.vx=Math.cos(a)*this.info.spd; this.vy=Math.sin(a)*this.info.spd;
        this.life=3.0; this.ang=a;
    }
    update(dt,p){
        this.age+=dt;this.life-=dt; if(this.life<0){this.dead=1;return;}
        const steps=Math.max(1,Math.ceil(Math.hypot(this.vx*dt,this.vy*dt)/8));
        for(let i=0;i<steps&&!this.dead;i++){
            this.x+=this.vx*dt/steps;this.y+=this.vy*dt/steps;
            if(MapSys.get(this.x,this.y)===TERRAIN.WALL){this.dead=1;Game.spawn(new Effect(this.x,this.y,'dust'));break;}
            if(World.projectileBlockerAt(this.x,this.y,this.info.size)){
                this.dead=1;Game.spawn(new Effect(this.x,this.y,'dust'));break;
            }
            if(this.source==='trap'){
                const victim=TombDangers.enemies().find(e=>Math.hypot(this.x-e.x,this.y-e.y)<this.info.size+13);
                if(victim){TombDangers.hurt(victim,this.pType==='STONE'||this.pType==='LOG'?2:1);this.dead=1;break;}
            }
            if(Math.hypot(this.x-p.x,this.y-p.y)<this.info.size+10){p.hit();this.dead=1;}
        }
    }
    draw(ctx){
        ctx.rotate(this.ang); ctx.fillStyle=this.info.col;
        if(this.info.shape === 'rect') { ctx.fillRect(-10, -5, 20, 10); }
        else { ctx.beginPath(); ctx.arc(0,0,this.info.size,0,6.28); ctx.fill(); }
        if(this.info.trail) { ctx.strokeStyle=this.info.col; ctx.globalAlpha=0.5; ctx.beginPath(); ctx.moveTo(-5,0); ctx.lineTo(-20,0); ctx.stroke(); ctx.globalAlpha=1; }
    }
}

class Player extends Entity {
    constructor(x,y){super(x,y,'player');this.hp=5;this.sight=CONFIG.BASE_SIGHT;this.inv=0;this.buffs={hoof:0,candle:0,jade:0};this.walkT=0;this.hasCompass=0;this.hasShovel=false;this.attackCooldown=0;this.attackT=0;this.attackAngle=0;this.holdingBreath=false;this.breathRemaining=CONFIG.BREATH_MAX;this.breathExhausted=false;this.stepPhase=0;this.direction=0;this.walkFrame=1;this.walkDistance=0;this.stepDistance=0;this.moving=false;this.inWater=MapSys.get(x,y)===TERRAIN.WATER;}
    nearestTarget(){
        let nearest,best=78*78;
        for(const e of Game.ents){
            if(e.dead||e.type!=='zombie')continue;
            const distance=(e.x-this.x)**2+(e.y-this.y)**2;
            if(distance>best||(nearest&&distance===best)||!MapSys.lineClear(this.x,this.y,e.x,e.y))continue;
            nearest=e;best=distance;
        }
        return nearest;
    }
    attack(target=this.nearestTarget()){
        if(!Game.running||Game.pause||!this.hasShovel||this.holdingBreath||this.attackCooldown>0||this.rollTime>0||!target)return false;
        this.attackCooldown=.68;this.attackT=.48;
        this.attackAngle=Math.atan2(target.y-this.y,target.x-this.x);
        AudioSys.tone(220,'triangle',.1,.09,70);
        const slash=new Effect(this.x+Math.cos(this.attackAngle)*42,this.y+Math.sin(this.attackAngle)*42,'slash');slash.angle=this.attackAngle;Game.spawn(slash);
        if(target&&TombDangers.hurt(target,1)){Game.spawn(new Effect(target.x,target.y,'dust'));AudioSys.playStomp();}
        return true;
    }
    startHoldingBreath(){
        if(!Game.running||Game.pause||this.holdingBreath||this.breathRemaining<=0)return false;
        this.holdingBreath=true;this.breathExhausted=false;document.getElementById('breath-btn').classList.add('pressed');
        Game.msg(curLang==='CN'?'屏气隐匿 · 守墓尸无法察觉':'Breath held · tomb guardians cannot detect you','#b9f4e2');
        Game.refreshBuffs();return true;
    }
    stopHoldingBreath(exhausted=false){
        const wasHolding=this.holdingBreath;
        this.holdingBreath=false;this.breathExhausted=exhausted;
        if(!exhausted)this.breathRemaining=CONFIG.BREATH_MAX;
        document.getElementById('breath-btn').classList.remove('pressed');
        if(wasHolding)Game.msg(curLang==='CN'?(exhausted?'气息耗尽 · 守墓尸重新索敌':'恢复呼吸 · 守墓尸重新索敌'):(exhausted?'Breath exhausted · guardians can detect you':'Breathing resumed · guardians can detect you'),'#e7c58f');
        Game.refreshBuffs();
    }
    update(dt){
        this.attackCooldown=Math.max(0,this.attackCooldown-dt);this.attackT=Math.max(0,this.attackT-dt);
        if(this.holdingBreath){this.breathRemaining=Math.max(0,this.breathRemaining-dt);if(this.breathRemaining===0)this.stopHoldingBreath(true);}
        else if(this.hasShovel)this.attack();
        if(this.inv>0)this.inv-=dt;
        if(this.buffs.hoof>0) this.buffs.hoof-=dt;
        if(this.buffs.candle>0) this.buffs.candle=Math.max(0,this.buffs.candle-dt);


        if(this.rollTime>0){
            const step=Math.min(dt,this.rollTime),parts=Math.max(1,Math.ceil(290*step/6));this.rollTime=Math.max(0,this.rollTime-dt);
            const clear=(x,y)=>MapSys.canOccupy(x,y,10);
            for(let i=0;i<parts;i++){
                const nx=this.x+this.rollVX*step/parts,ny=this.y+this.rollVY*step/parts;
                if(clear(nx,this.y))this.x=nx;if(clear(this.x,ny))this.y=ny;
            }
            this.moving=true;this.stepPhase+=dt*20;return;
        }
        const oldX=this.x, oldY=this.y;
        let s=160*ExitGate.speed();
        if(Input.sprint) s *= 1.5; // Sprint!
        if(this.holdingBreath)s*=.38;
        if(MapSys.get(this.x,this.y)===TERRAIN.WATER) s*=0.5;

        if(Input.active){
            this.direction=Math.abs(Input.x)>Math.abs(Input.y)?(Input.x<0?1:2):(Input.y<0?3:0);
            if(Math.abs(Input.x)>.08)this.facingLeft=Input.x<0;
            const nx=this.x+Input.x*s*dt, ny=this.y+Input.y*s*dt;

            if(MapSys.canOccupy(nx,this.y,10))this.x=nx;
            if(MapSys.canOccupy(this.x,ny,10))this.y=ny;

        }
        const moved=Math.hypot(this.x-oldX,this.y-oldY);
        if(Game.tutorialActive){Game.tutorialDistance+=moved;if(Game.tutorialDistance>=100){Game.tutorialActive=false;document.getElementById('move-tutorial').style.display='none';}}
this.moving=moved>.01;
        const water=MapSys.get(this.x,this.y)===TERRAIN.WATER,enteredWater=water&&!this.inWater;
        this.inWater=water;
        if(enteredWater&&this.moving){AudioSys.playStep(true,Input.sprint);this.stepDistance=0;}
        if(this.moving) {
            this.walkDistance+=moved;this.stepDistance+=moved;
            this.walkFrame=Math.floor(this.walkDistance/28)%4;this.stepPhase=this.walkDistance/112*Math.PI*2;
            const stride=water?26:56;
            if(!enteredWater&&this.stepDistance>=stride) {this.stepDistance%=stride;AudioSys.playStep(water,Input.sprint);}
        } else {this.walkFrame=1;this.stepPhase=0;this.stepDistance=0;}
        if(this.pushingCoffin&&this.pushUntil>Game.elapsed){const angle=Math.atan2(this.pushingCoffin.y-this.y,this.pushingCoffin.x-this.x);this.direction=Math.abs(Math.cos(angle))>Math.abs(Math.sin(angle))?(Math.cos(angle)<0?1:2):(Math.sin(angle)<0?3:0);this.pushDirection=this.direction;}

    }
    hit(){
        if(!Game.running || this.inv>0)return;
        if(this.buffs.jade>0){this.buffs.jade=0;this.inv=1.5;AudioSys.playJadeBreak();Game.msg(curLang==='CN'?'玉衣碎裂 · 抵挡了一次伤害':'Jade suit shattered · one hit blocked','#a5d6a7');Game.refreshBuffs();return;}
        this.hp--; this.inv=1.5; Game.shake=10; AudioSys.playHurt();
        Game.updateHUD(); Game.msg(LANG[curLang].msgs.hurt,"#f00");
        const held=[...(this.hasCompass?['compass']:[]),...['candle','hoof'].filter(k=>this.buffs[k]>0)];
        if(held.length&&Math.random()<.35){
            const key=held[Math.floor(Math.random()*held.length)],remaining=this.buffs[key];
            if(key==='compass')this.hasCompass=0;else this.buffs[key]=0;
            const item=new GroundItem(this.x,this.y,'item_'+key);item.pickupDelay=2;item.remaining=remaining;Game.spawn(item);
            Game.msg(curLang==='CN'?`受伤掉落：${LANG.CN.items[key].n} · 可返回拾回`:`Dropped ${key} · recover it from the ground`,'#e5b779');
        }
        Game.drawMinimap();Game.refreshBuffs();
        if(this.hp<=0)Game.over();
    }
    draw(ctx){
        if(this.inv>0&&Date.now()%100<50)return;
        if(this.buffs.hoof>0) { ctx.beginPath(); ctx.arc(0,0,25,0,6.28); ctx.fillStyle='rgba(161,136,127,0.3)'; ctx.fill(); }
        if(this.buffs.jade>0) { ctx.beginPath(); ctx.arc(0,0,25,0,6.28); ctx.strokeStyle='#a5d6a7'; ctx.lineWidth=2; ctx.stroke(); }
        ctx.rotate(Math.atan2(Input.y,Input.x));
        const lOffset = Math.sin(this.stepPhase) * 6;
        ctx.fillStyle='#3e2723'; ctx.fillRect(-8, -5 + lOffset, 6, 12); ctx.fillRect(2, -5 + Math.sin(this.stepPhase + Math.PI) * 6, 6, 12);
        ctx.fillStyle='#d7ccc8'; ctx.fillRect(-8, 5 + lOffset, 6, 4); ctx.fillRect(2, 5 + Math.sin(this.stepPhase + Math.PI) * 6, 6, 4);
        ctx.fillStyle='#5d4037'; ctx.fillRect(-10,-10,20,18); ctx.fillStyle='#8d6e63'; ctx.fillRect(-8,-8,16,10);
        ctx.fillStyle='#1a1a1a'; ctx.beginPath(); ctx.arc(0,0,7,0,6.28); ctx.fill();
        ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.arc(12, 5, 3, 0, 6.28); ctx.fill();
        ctx.globalAlpha=0.2;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,50,-0.5,0.5);ctx.fill();ctx.globalAlpha=1;
    }
}

// --- Map ---
const MapSys = {
    w:60, h:60, t:[],
    gen: function(l){
        const plan=FLOOR_PLANS[l-1];this.w=this.h=plan.size;
        this.t=new Uint8Array(this.w*this.h).fill(TERRAIN.WALL);
        const rms=plan.rooms.map(r=>({...r}));
        for(const r of rms)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)this.t[y*this.w+x]=0;
        for(const [from,to] of plan.links){
            const a=rms[from],b=rms[to];let x=Math.floor(a.x+a.w/2),y=Math.floor(a.y+a.h/2);
            const bx=Math.floor(b.x+b.w/2),by=Math.floor(b.y+b.h/2);
            const carve=()=>{this.t[y*this.w+x]=0;this.t[y*this.w+x+1]=0;};
            carve();while(x!==bx){x+=Math.sign(bx-x);carve();}while(y!==by){y+=Math.sign(by-y);carve();}
        }
        return rms;
    },
    lineClear: function(x1,y1,x2,y2) {
        const steps=Math.ceil(Math.hypot(x2-x1,y2-y1)/12);
        for(let i=1;i<steps;i++)if(this.get(x1+(x2-x1)*i/steps,y1+(y2-y1)*i/steps)===TERRAIN.WALL)return false;
        return true;
    },
    canOccupy: function(x,y,radius) {
        return [[-radius,-radius],[radius,-radius],[-radius,radius],[radius,radius]].every(([dx,dy])=>this.get(x+dx,y+dy)!==TERRAIN.WALL);
    },
    get: function(px,py){
        const tx=Math.floor(px/CONFIG.TILE), ty=Math.floor(py/CONFIG.TILE);
        if(tx<0||tx>=this.w||ty<0||ty>=this.h) return 1;
        return this.t[ty*this.w+tx];
    }
};

// --- Game Engine ---
const Game = {
    cvs:document.getElementById('gameCanvas'), ctx:document.getElementById('gameCanvas').getContext('2d'),
    ents:[], texts:[], lvl:1, exit:0, pause:0, shake:0, running:0, mainCoffinPos: null, items: [], raf:null, lastTime:null, accumulator:0, elapsed:0, hudTimer:0,

    toggleLang: function() {
        curLang = curLang === 'CN' ? 'EN' : 'CN';
        this.updateUI();
    },

    updateUI: function() {
        const txt = LANG[curLang];
        document.getElementById('game-title').innerText = txt.title;
        document.getElementById('game-ver').innerText = txt.ver;
        document.getElementById('intro-p1').innerHTML = txt.p1;
        document.getElementById('start-btn-text').innerText = txt.startBtn;
        document.getElementById('end-title').innerText = txt.endTitle;
        document.getElementById('end-desc').innerText = txt.endDesc;
        document.getElementById('end-btn').innerText = txt.endBtn;
        document.getElementById('win-title').innerText = txt.winTitle;
        document.getElementById('win-desc').innerText = txt.winDesc;
        document.getElementById('win-btn').innerText = txt.winBtn;

        const exitTxt = LANG[curLang].exitModal;
        document.getElementById('exit-title').innerText = exitTxt.t;
        document.documentElement.lang=curLang==='CN'?'zh-CN':'en';
        const cn=curLang==='CN';
        const labels={
            'guide-move':cn?'循光探路':'EXPLORE',
            'guide-move-desc':cn?'拖动移动，按住疾行；危险时可屏气潜行，最多 30 秒。':'Drag to move, hold sprint, or sneak while holding your breath for up to 30 seconds.',
            'guide-find':cn?'驻足开棺':'DISCOVER',
            'guide-find-desc':cn?'驻足开棺寻找钥匙与补给，留意通往主墓室的路线。':'Stay beside a coffin to open it. Find the bronze key on each floor.',
            'guide-exit':cn?'寻龙脱身':'ESCAPE',
            'guide-exit-desc':cn?'棺中寻钥匙；解印拉闸后，25秒内回主墓室。':'Find the key, break seals, then turn the crank. Reach the exit within 25 seconds.',
            'pause-title':cn?'灯火未熄':'The flame awaits',
            'pause-desc':cn?'歇息片刻，古墓中的时间已暂停。':'Take a breath. The tomb is paused.',
            'resume-btn':cn?'继续探索':'Resume exploration',
            'map-caption':cn?'探索地图 · 金点为目标':'Explored map · gold = target',
            'control-hint':cn?'WASD 移动 · Shift 疾行 · B 屏气 · Esc 暂停':'WASD Move · Shift Sprint · B Hold Breath · Esc Pause',

        };
        for(const [id,value] of Object.entries(labels)) document.getElementById(id).textContent=value;
        document.getElementById('pause-btn').setAttribute('aria-label',cn?'暂停':'Pause');
        this.updateSoundButton();
        Sound.status();
        document.getElementById('sound-test-btn').textContent=cn?'开启 / 试音':'Enable / Test sound';
        document.getElementById('pause-sound-btn').textContent=cn?'开启 / 试音':'Enable / Test sound';
        document.getElementById('game-ver').textContent=cn?'古墓新篇 · 画境与回声':'EXPEDITION · STONE & ECHO';
        if(this.p) { this.updateHUD();World.room=null;World.updateRoom(); }
    },

    init: function(){
        if(!Art.ready&&!Art.failed)return;
        this.resize(); window.onresize=()=>this.resize();
        document.getElementById('start-screen').style.display='none';
        AudioSys.init();
        this.restart();
    },

    debugTap: function() {
        const now=Date.now();this.debugTaps=now-(this.debugLast||0)<900?(this.debugTaps||0)+1:1;this.debugLast=now;
        if(this.debugTaps<5)return;this.debugTaps=0;
        this.debugWasPaused=this.pause;this.pause=true;Input.reset();
        document.getElementById('test-levels').innerHTML=THEMES.map((t,i)=>`<button class="btn" onclick="Game.testLevel(${i+1})">${i+1} · ${curLang==='CN'?t.name:t.en}</button>`).join('');
        document.getElementById('test-modal').classList.add('active');
    },
    closeTest: function(){document.getElementById('test-modal').classList.remove('active');this.pause=!!this.debugWasPaused;this.lastTime=null;},
    testLevel: function(level){
        if(!Number.isInteger(level)||level<1||level>10)return;
        if(!Art.ready){this.msg(curLang==='CN'?'墓室图案加载中，请稍后再选':'Artwork loading; try again shortly','#d7c49e');return;}
        this.resize();window.onresize=()=>this.resize();
        document.getElementById('start-screen').style.display='none';this.restart();this.art=0;this.load(level);
        this.msg(curLang==='CN'?'测试选关 · 全新装备与物资':'Test floor · fresh equipment','#d7c49e');
    },
    restart: function() {
        AudioSys.init();
        Passage.reset();this.lvl = 1; this.saved = null; this.items = [];
        document.getElementById('game-over-modal').classList.remove('active');
        document.getElementById('victory-modal').classList.remove('active');
        this.running = 1;
        this.elapsed=0; this.pause=false; Input.reset();
        document.querySelectorAll('.overlay:not(#start-screen)').forEach(el=>el.classList.remove('active'));
        if(this.raf!==null) cancelAnimationFrame(this.raf);
        this.lastTime=null; this.accumulator=0;
        this.load(1); this.raf=requestAnimationFrame(t=>this.loop(t));
    },

    resize: function(){
        this.width=window.innerWidth; this.height=window.innerHeight;
        this.dpr=Math.min(window.devicePixelRatio||1,2);
        this.cvs.width=Math.round(this.width*this.dpr); this.cvs.height=Math.round(this.height*this.dpr);
        this.cvs.style.width=this.width+'px'; this.cvs.style.height=this.height+'px';
        if(this.p) this.render();
    },
    togglePause: function(force=false) {
        if(!this.running || document.getElementById('exit-modal').classList.contains('active')) return;
        if(force&&this.pause) return;
        this.pause=force||!this.pause; Input.reset(); this.lastTime=null; this.accumulator=0;
        document.getElementById('pause-modal').classList.toggle('active',!!this.pause);
        if(this.pause) {Sound.pause();document.getElementById('resume-btn').focus();}
        else {Sound.unlock();document.getElementById('pause-btn').focus();}
    },
    toggleSound: function() { Sound.toggle(); },
    updateSoundButton: function() {
        const btn=document.getElementById('sound-btn');
        btn.classList.toggle('muted',AudioSys.muted);
        btn.setAttribute('aria-pressed',String(AudioSys.muted));
        btn.setAttribute('aria-label',curLang==='CN'?(AudioSys.muted?'开启声音':'静音'):(AudioSys.muted?'Unmute':'Mute'));
    },

    showExitModal: function() {
        if(!World.canExit())return;
        Passage.open(this.lvl);document.getElementById('exit-modal').classList.add('active');
        this.pause = true; Input.reset();Sound.pause();
        document.getElementById('exit-confirm-btn').focus();
    },
    confirmNextLevel: function() {
        if(!this.running||!World.canExit()||!document.getElementById('exit-modal').classList.contains('active')) return;
        Sound.unlock();Passage.depart();
    },
    finishNextLevel: function() {
        document.getElementById('exit-modal').classList.remove('active');
        this.pause = false;Sound.unlock();
        if(this.lvl>=10){ this.victory(); }
        else {
            this.saved={hp:this.p.hp,hasCompass:this.p.hasCompass,hasShovel:this.p.hasShovel};
            this.load(this.lvl+1);
        }
    },

    addText: function(x, y, text, color) {
        this.texts.push(new FloatText(x, y, text, color));
    },

    load: function(l){
        this.lvl=l; this.ents=[]; this.texts=[]; this.exit=1; this.mainCoffinPos = null; this.shake=0; this.pause=false; Input.reset();
        this.hudTimer=0; this.lastTime=null; this.accumulator=0;
        this.buffHTML=null;this.itemHTML=null;Scene.invalidateTerrain();
        document.getElementById('item-bar').innerHTML = '';

        const rms=MapSys.gen(l), s=rms[0], e=rms[rms.length-1];
        this.explored=new Uint8Array(MapSys.w*MapSys.h);
        this.p=new Player((s.x+s.w/2)*CONFIG.TILE, (s.y+s.h/2)*CONFIG.TILE);
        if(this.saved) { Object.assign(this.p,this.saved); }
        this.tutorialDistance=0;this.tutorialActive=l===1;this.tutorialDelay=l===1?3.2:0;
        document.getElementById('move-tutorial').style.display='none';
        document.getElementById('tutorial-copy').textContent=curLang==='CN'?'按住空白处拖动 → 人物移动；松手停止。电脑使用 WASD / 方向键。试着走几步！':'Hold and drag the play area to move; release to stop. On desktop use WASD / arrows. Try a few steps!';
        this.p.inv=2; // Safe arrival on every floor.
        this.ents.push(this.p);

        const trapCount = THEMES[l-1].trapCount;
        const dangerRooms=rms.filter((r,i)=>i>0&&!['sanctuary','entry'].includes(r.kind));
        let trapsPlaced = 0;
        while(trapsPlaced < trapCount) {
             const r=dangerRooms[(trapsPlaced*3+l)%dangerRooms.length];
             const tx = (r.x + 1.5 + (trapsPlaced*2+l)%(r.w-2)) * CONFIG.TILE;
             const ty = (r.y+.5) * CONFIG.TILE;
             this.ents.push(new Trap(tx, ty, l-1));
             trapsPlaced++;
        }

        this.exitRoom = e;
        this.exitPos = {x:(e.x+Math.floor(e.w/2)+.5)*CONFIG.TILE, y:(e.y+Math.floor(e.h/2)+.5)*CONFIG.TILE};

        World.setup(rms);
        document.getElementById('level-note').textContent=curLang==='CN'?World.theme.note:World.theme.enNote;
        clearTimeout(this.msgTimer); document.getElementById('msg-box').classList.remove('msg-show');
        this.updateHUD(); this.refreshBuffs(); this.refreshExploration(); this.drawMinimap();

        const lName = LANG[curLang].levelNames[Math.min(l-1,9)];
        const splash = document.getElementById('level-title-text');
        const levelStr = LANG[curLang].level.replace('%s', l).split('|')[0].trim();
        splash.innerText = `${levelStr} · ${lName}`;
        document.getElementById('level-title-box').classList.remove('show-level-title');
        void document.getElementById('level-title-box').offsetWidth;
        document.getElementById('level-title-box').classList.add('show-level-title');
    },

    getItem: function(c) {
        AudioSys.playItem(true);
        const key = c.replace('item_','');
        const colors = {candle:'#ff8a80', wine:'#fff', hoof:'#a1887f', jade:'#a5d6a7', compass:'#ffd700',shovel:'#c9d5cf'};
        const col = colors[key];

        // Direct Pickup (No Modal)
        AudioSys.playUse();

        if(c==='item_shovel'){this.p.hasShovel=true;this.msg(curLang==='CN'?'兵工铲入手 · 靠近僵尸自动攻击':'Shovel acquired · approach zombies to attack automatically',col);this.refreshBuffs();}
        if(c==='item_candle'){ this.p.buffs.candle=20; this.msg(LANG[curLang].msgs.candle, col); }
        if(c==='item_compass'){ this.p.hasCompass=1; this.drawMinimap(); this.msg(LANG[curLang].msgs.compass, col); }
        if(c==='item_wine'){ this.p.hp=Math.min(5,this.p.hp+1); this.msg(LANG[curLang].msgs.heal, col); this.updateHUD(); }
        if(c==='item_hoof'){ this.p.buffs.hoof=15; this.msg(LANG[curLang].msgs.repel, col); }
        if(c==='item_jade'){ this.p.buffs.jade=1; this.msg(LANG[curLang].msgs.immune, col); }
    },

    spawn: function(e){this.ents.push(e);},
    msg: function(t,c){const b=document.getElementById('msg-box');b.textContent=t;b.style.color=c;b.classList.add('msg-show');clearTimeout(this.msgTimer);this.msgTimer=setTimeout(()=>b.classList.remove('msg-show'),2500);},
    updateHUD: function(){
        document.getElementById('hp-bar').innerText="♥".repeat(Math.max(0,this.p.hp))+"♡".repeat(Math.max(0,5-this.p.hp));

        const lName = LANG[curLang].levelNames[Math.min(this.lvl-1,9)];
        const levelBase = LANG[curLang].level.split('|')[0].replace('%s', this.lvl).trim();
        document.getElementById('level-num').innerText = `${levelBase} | ${lName}`;

        const cn=curLang==='CN';
        const objective=!this.p.hasKey?(cn?'① 驻足开棺 · 寻找机关钥匙':'① Open coffins · find the bronze key'):World.remaining()?(cn?`② 破除剩余 ${World.remaining()} 道封印`:`② Break ${World.remaining()} remaining seals`):ExitGate.remaining>0?(cn?`③ 返回主墓室 · 盗洞 ${Math.ceil(ExitGate.remaining)}秒`:`③ Return to the tomb · ${Math.ceil(ExitGate.remaining)}s`):(cn?'③ 找到机械开关 · 驻足拉闸开启盗洞':'③ Find the crank · stand beside it to open the exit');
        document.getElementById('objective').textContent=objective;
        document.getElementById('exit-confirm-btn').textContent=this.lvl===10?(cn?'逃出生天':'Escape the tomb'):LANG[curLang].exitModal.yes;
    },
    over: function(){
        this.running=0; Input.reset();Sound.pause();
        document.getElementById('end-desc').textContent=this.runSummary();
        document.getElementById('game-over-modal').classList.add('active');
        document.getElementById('end-btn').focus();
    },
    victory: function(){
        this.running=0; Input.reset();Sound.pause();
        document.getElementById('win-desc').textContent=this.runSummary();
        document.getElementById('victory-modal').classList.add('active');
        document.getElementById('win-btn').focus();
    },

    runSummary: function() {
        const time=`${Math.floor(this.elapsed/60)}:${String(Math.floor(this.elapsed%60)).padStart(2,'0')}`;
        return curLang==='CN'?`抵达第 ${this.lvl} 层 · 探索 ${time}`:`Floor ${this.lvl} · ${time}`;
    },
    loop: function(timestamp){
        this.raf=null;
        if(!this.running) return;
        if(this.lastTime===null) this.lastTime=timestamp;
        const delta=Math.min(Math.max((timestamp-this.lastTime)/1000,0),0.1);
        this.lastTime=timestamp;
        if(Passage.active)Passage.update(delta);
        if(!this.pause) {
            this.accumulator+=delta;
            const dt=1/60;
            while(this.accumulator>=dt && this.running && !this.pause) {
                this.step(dt); this.accumulator-=dt;
            }
            this.render();
        } else this.accumulator=0;
        if(this.running) this.raf=requestAnimationFrame(t=>this.loop(t));
    },
    step: function(dt) {
        this.elapsed+=dt;
        if(this.tutorialActive&&this.tutorialDelay>0){this.tutorialDelay=Math.max(0,this.tutorialDelay-dt);if(this.tutorialDelay===0)document.getElementById('move-tutorial').style.display='block';}
        this.shake=this.shake>0.1?this.shake*Math.pow(0.9,dt*60):0;
        this.ents=this.ents.filter(e=>!e.dead);
        // Player first; entities spawned during a step start updating on the next step.
        if(!(this.p.pushingCoffin&&this.p.pushUntil>this.elapsed))this.p.pushingCoffin=null;
        this.p.update(dt);
        for(const e of [...this.ents]) {
            if(!this.running||this.pause) break;
            if(e===this.p||e.dead) continue;
            if(e.update) e.update(dt,this.p);
        }
        const coffins=this.ents.filter(e=>e.type==='coffin'&&!e.dead),nearest=coffins.filter(e=>!e.opened&&!e.hidden&&!e.rising&&!e.locked&&Math.hypot(e.x-this.p.x,e.y-this.p.y)<45).sort((a,b)=>Math.hypot(a.x-this.p.x,a.y-this.p.y)-Math.hypot(b.x-this.p.x,b.y-this.p.y))[0];
        for(const c of coffins)if(c!==nearest&&!c.opened)c.interactTimer=0;
        nearest?.interact(dt,this.p);
        this.texts=this.texts.filter(t=>t.life>0);
        this.texts.forEach(t=>t.update(dt));
        if(!this.running) return;
        World.update(dt);
        if(!this.running)return;
        this.hudTimer-=dt;
        if(this.hudTimer<=0) { this.refreshExploration(); this.refreshBuffs(); this.drawMinimap(); this.hudTimer=0.1; }
        if(World.canExit()&&Math.hypot(this.exitPos.x-this.p.x,this.exitPos.y-this.p.y)<30) this.showExitModal();
    },
    refreshBuffs: function() {
        const breath=document.getElementById('breath-btn'),count=document.getElementById('breath-count'),status=document.getElementById('breath-status');
        count.textContent=String(Math.ceil(this.p.breathRemaining));breath.setAttribute('aria-pressed',String(this.p.holdingBreath));
        breath.setAttribute('aria-label',curLang==='CN'?`按住屏气，剩余 ${Math.ceil(this.p.breathRemaining)} 秒`:`Hold breath, ${Math.ceil(this.p.breathRemaining)} seconds remaining`);
        const seconds=Math.ceil(this.p.breathRemaining),ratio=Math.max(0,this.p.breathRemaining/CONFIG.BREATH_MAX);
        status.classList.toggle('active',this.p.holdingBreath);status.classList.toggle('low',this.p.holdingBreath&&seconds<=10);status.classList.toggle('exhausted',this.p.breathExhausted);
        status.style.setProperty?.('--breath-angle',`${ratio*360}deg`);
        document.getElementById('breath-status-time').textContent=`${seconds}s`;
        document.getElementById('breath-status-title').textContent=curLang==='CN'?(this.p.breathExhausted?'气息耗尽':'屏气隐匿中'):(this.p.breathExhausted?'OUT OF BREATH':'HOLDING BREATH');
        document.getElementById('breath-status-copy').textContent=curLang==='CN'?(this.p.breathExhausted?'松开按钮后可再次屏气':'缓慢潜行 · 僵尸将返回原棺 · 松开恢复呼吸'):(this.p.breathExhausted?'Release to recover':'Sneak slowly · guardians return to their coffins');
        let html='';
        if(this.p.buffs.hoof>0) html+=`<div class="buff buff-hoof">🐴 ${Math.ceil(this.p.buffs.hoof)}s</div>`;
        if(this.p.buffs.jade>0) html+=`<div class="buff buff-jade">🥋 ${curLang==='CN'?'护身 ×1':'Shield ×1'}</div>`;
        if(this.p.hasCompass) html+=`<div class="buff buff-compass">🧭 ${curLang==='CN'?'寻龙':'Compass'}</div>`;
        const bar=document.getElementById('buff-bar');
        if(this.buffHTML!==html){bar.innerHTML=html;this.buffHTML=html;}
        const itemBar=document.getElementById('item-bar');
        const lamp=this.p.buffs.candle>0?`<div class="item-slot ${this.p.buffs.candle<5?'lamp-low':''}">🪔 ${curLang==='CN'?'灯油':'Oil'} ${Math.ceil(this.p.buffs.candle)}s</div>`:'';
        const shovel=this.p.hasShovel?`<div class="item-slot shovel-slot"><img src="assets/entrenching-shovel.png" alt="">${curLang==='CN'?'兵工铲':'Shovel'}</div>`:'';
        if(this.itemHTML!==lamp+shovel){itemBar.innerHTML=lamp+shovel;this.itemHTML=lamp+shovel;}
    },
    refreshExploration: function() {
        const px=Math.floor(this.p.x/CONFIG.TILE), py=Math.floor(this.p.y/CONFIG.TILE);
        const radius=Math.max(2,Math.floor(World.sight()/CONFIG.TILE*0.65));
        for(let y=Math.max(0,py-radius);y<=Math.min(MapSys.h-1,py+radius);y++) {
            for(let x=Math.max(0,px-radius);x<=Math.min(MapSys.w-1,px+radius);x++) {
                if(Math.hypot(x-px,y-py)<=radius) this.explored[y*MapSys.w+x]=1;
            }
        }
    },
    drawMinimap: function() {
        const canvas=document.getElementById('minimap'), ctx=canvas.getContext('2d'), scale=canvas.width/MapSys.w;
        document.getElementById('map-panel').style.display=this.p.hasCompass?'':'none';
        if(!this.p.hasCompass){ctx.clearRect(0,0,canvas.width,canvas.height);return;}
        ctx.fillStyle='#09110f'; ctx.fillRect(0,0,canvas.width,canvas.height);
        for(let i=0;i<this.explored.length;i++) {
            if(!this.explored[i]) continue;
            ctx.fillStyle=MapSys.t[i]===TERRAIN.WALL?'#25332d':MapSys.t[i]===TERRAIN.WATER?'#327b83':'#7b8066';
            ctx.fillRect((i%MapSys.w)*scale,Math.floor(i/MapSys.w)*scale,scale,scale);
        }
        const dot=(p,color,r)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x/CONFIG.TILE*scale,p.y/CONFIG.TILE*scale,r,0,Math.PI*2);ctx.fill();};
        for(const e of this.ents) {
            const index=Math.floor(e.y/CONFIG.TILE)*MapSys.w+Math.floor(e.x/CONFIG.TILE);
            if(e.type==='coffin'&&!e.opened&&this.explored[index]) dot(e,'#c3aa8a',2);
        }
        const target=World.target();
        if(target&&this.p.hasCompass) dot(target,'#ffd47d',3);
        for(const a of World.altars) {
            const index=Math.floor(a.y/50)*MapSys.w+Math.floor(a.x/50);
            if(!a.done&&(this.explored[index]||(this.exit&&a.kind==='seal')))dot(a,a.kind==='seal'?'#e9bd75':'#80dcb9',2.5);
        }
        dot(this.p,'#c3ffe5',3);
    },

    render: function(){
        if(Art.ready) {Scene.draw(this);return;}
        const w=this.width, h=this.height, ctx=this.ctx;
        ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
        let cx=this.p.x-w/2 + (Math.random()-.5)*this.shake, cy=this.p.y-h/2 + (Math.random()-.5)*this.shake;

        ctx.fillStyle='#000'; ctx.fillRect(0,0,w,h);
        ctx.save(); ctx.translate(-cx,-cy);

        const cs=Math.floor(cx/CONFIG.TILE), ce=cs+w/CONFIG.TILE+2;
        const rs=Math.floor(cy/CONFIG.TILE), re=rs+h/CONFIG.TILE+2;
        const wallCol = WALL_COLORS[Math.min(this.lvl-1,9)];
        const now = Date.now();

        for(let y=rs;y<re;y++)for(let x=cs;x<ce;x++){
            if(x>=0&&x<MapSys.w&&y>=0&&y<MapSys.h){
                const t = MapSys.t[y*MapSys.w+x];
                const px=x*CONFIG.TILE, py=y*CONFIG.TILE;

                if(t==0){
                    ctx.fillStyle='#2d241e'; ctx.fillRect(px,py,50,50);
                    ctx.fillStyle='rgba(0,0,0,0.1)'; if((x+y)%5===0) ctx.fillRect(px+10,py+10,5,5);
                }
                else if(t==2) {
                    ctx.fillStyle='#01579b';ctx.fillRect(px,py,50,50);
                    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=2;
                    ctx.beginPath(); const off = Math.sin(now/400 + x/2)*10;
                    ctx.moveTo(px, py+25+off); ctx.lineTo(px+50, py+25-off); ctx.stroke();
                }
                else {
                    ctx.fillStyle = wallCol; ctx.fillRect(px, py, 50, 50);
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(px, py); ctx.lineTo(px+50, py); ctx.moveTo(px, py+25); ctx.lineTo(px+50, py+25);
                    ctx.moveTo(px, py+50); ctx.lineTo(px+50, py+50);
                    ctx.moveTo(px, py); ctx.lineTo(px, py+25); ctx.moveTo(px+25, py+25); ctx.lineTo(px+25, py+50); ctx.moveTo(px+50, py); ctx.lineTo(px+50, py+25);
                    ctx.stroke();
                }
            }
        }

        if(World.canExit()) {
            ctx.save(); ctx.translate(this.exitPos.x, this.exitPos.y);
            ctx.fillStyle='#000';ctx.beginPath();ctx.arc(0,0,30,0,6.28);ctx.fill();
            ctx.strokeStyle='#795548'; ctx.lineWidth=4;
            ctx.beginPath(); ctx.moveTo(-12,-30); ctx.lineTo(-12,30); ctx.moveTo(12,-30); ctx.lineTo(12,30);
            for(let i=-2; i<=2; i++) { ctx.moveTo(-12, i*12); ctx.lineTo(12, i*12); }
            ctx.stroke();
            ctx.fillStyle='#ffd700';ctx.font='14px serif';ctx.textAlign='center';
            ctx.fillText(LANG[curLang].labels.exit,0,-40);
            ctx.fillText("⬇",0,0);
            ctx.restore();
        }

        this.ents.filter(e=>!e.dead&&e.x>cx-80&&e.x<cx+w+80&&e.y>cy-80&&e.y<cy+h+80).sort((a,b)=>a.y-b.y).forEach(e=>{
            ctx.save(); ctx.translate(e.x,e.y);
            if(e.draw)e.draw(ctx);
            ctx.restore();
        });

        this.texts.forEach(t=>{
            ctx.save(); ctx.translate(t.x,t.y); t.draw(ctx); ctx.restore();
        });

        if(this.p.hasCompass && (this.exit || this.mainCoffinPos)) {
            let target = this.exitPos;
            if(!this.exit && this.mainCoffinPos) target = this.mainCoffinPos;
            const dx=target.x-this.p.x, dy=target.y-this.p.y;
            const ang=Math.atan2(dy,dx);
            ctx.translate(this.p.x, this.p.y); ctx.rotate(ang); ctx.translate(70, 0);
            ctx.shadowBlur=10; ctx.shadowColor='#ffd700';
            ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.moveTo(15,0); ctx.lineTo(-10,10); ctx.lineTo(-10,-10); ctx.fill();
            ctx.shadowBlur=0;
        }

        ctx.restore();

        if(this.p.buffs.candle <= 0) {
            const g=ctx.createRadialGradient(w/2,h/2,30,w/2,h/2,this.p.sight);
            g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,0.98)');
            ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
        }
    }
};

Game.updateUI();
const startButton=document.getElementById('start-btn-text');
startButton.disabled=true;
const assetStatus=document.getElementById('asset-status');
assetStatus.textContent=curLang==='CN'?'正在整理行装…':'Preparing expedition…';
Art.load().then(()=>{
    startButton.disabled=Art.failed;
    assetStatus.textContent=Art.failed?(curLang==='CN'?'图案未加载完成，请刷新页面后重试。':'Artwork failed to load. Refresh the page to retry.'):(curLang==='CN'?'行装已备 · 点灯入墓':'Ready · light your lantern');
});
