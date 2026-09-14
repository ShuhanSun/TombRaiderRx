/**
 * TombRaider Survival — expedition update
 * Fixed-step simulation, exploration map, lifecycle-safe interactions.
 */

const CONFIG = { TILE: 50, BASE_SIGHT: 300, ZOMBIE_SPD: 55, SPRINTER_SPD: 140, GREEN_SPD: 40 };
const TERRAIN = { FLOOR: 0, WALL: 1, WATER: 2 };

const LEVEL_NAMES_CN = ["沙海迷冢", "千纹机关廊", "青铜兽影厅", "巨鼎炼魂室", "石骨迷宫", "荧光棺河", "九字封印井", "暗影葬主殿", "帝王沉眠室", "永劫天陨塔"];
const LEVEL_NAMES_EN = ["Sand Sea Tomb", "Thousand Traps", "Bronze Beast Hall", "Cauldron Chamber", "Bone Labyrinth", "Fluorescent River", "Nine Seal Well", "Shadow Burial", "Emperor's Sleep", "Eternal Fall Tower"];

const TRAP_NAMES_CN = ["连弩塔", "投石机", "滚木阵", "喷火口", "混合阵", "飞刀口", "巨石阵", "鬼火阵", "万箭阵", "绝境塔"];
const TRAP_NAMES_EN = ["Crossbow", "Catapult", "Log Trap", "Flamer", "Mix Trap", "Knives", "Boulders", "Ghost Fire", "Arrow Rain", "Despair Tower"];

const LEVELS_DATA = [
    { delay: 1.5, type: 'ARROW', col: '#5d4037' }, { delay: 2.0, type: 'STONE', col: '#4e342e' },
    { delay: 2.5, type: 'LOG', col: '#3e2723' }, { delay: 3.0, type: 'FIRE', col: '#bf360c' },
    { delay: 1.8, type: 'MIX', col: '#263238' }, { delay: 1.2, type: 'ARROW', col: '#455a64' },
    { delay: 4.0, type: 'STONE', col: '#33691e' }, { delay: 3.0, type: 'FIRE', col: '#311b92' },
    { delay: 1.0, type: 'ARROW', col: '#212121' }, { delay: 2.0, type: 'MIX', col: '#b71c1c' }
];

const WALL_COLORS = ['#4e342e', '#3e2723', '#263238', '#1b1b1b', '#37474f', '#212121', '#1a237e', '#b71c1c', '#004d40', '#000000'];

const ARTIFACTS = [
    {n: "战国玉蝉", en: "Jade Cicada", i: "🪲", d: "玉质温润，含于口中可保尸身不腐。", end: "Keeps the body from decaying."},
    {n: "错金铜镜", en: "Gold Mirror", i: "📀", d: "精美的青铜镜，背面错金工艺繁复。", end: "Exquisite bronze craftsmanship."},
    {n: "盘龙金印", en: "Dragon Seal", i: "🧧", d: "王侯之印，盘龙钮栩栩如生。", end: "Seal of an ancient prince."},
    {n: "象牙酒杯", en: "Ivory Cup", i: "🍷", d: "象牙雕刻而成的酒杯，价值连城。", end: "Priceless ivory carving."},
    {n: "水晶头骨", en: "Crystal Skull", i: "💀", d: "通体透明的水晶头骨，眼神深邃。", end: "Mysterious transparent skull."},
    {n: "越王古剑", en: "King's Sword", i: "🗡️", d: "千年不锈，寒光凛凛的绝世名剑。", end: "Sharp after thousands of years."},
    {n: "凤头金钗", en: "Phoenix Pin", i: "🥢", d: "宫廷御用金钗，做工极尽奢华。", end: "Luxury from the royal court."},
    {n: "夜明龙珠", en: "Night Pearl", i: "🔮", d: "黑暗中发出幽幽绿光的稀世奇珍。", end: "Glows in the dark."},
    {n: "传国玉玺", en: "Imperial Seal", i: "👑", d: "受命于天，既寿永昌。", end: "Symbol of supreme power."},
    {n: "彼岸花",   en: "Equinox Flower", i: "🌺", d: "通往彼岸的神秘之花，终极宝藏。", end: "The ultimate treasure."}
];

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
        ver: "十层古墓 · 一盏孤灯",
        p1: "传说中的古墓埋藏着无数金银财宝，但也由古代机关和复活的僵尸守卫。玩家扮演一名摸金校尉，需深入十层地下迷宫。每一层都有无数危险，只有开启棺材，<b>找到镇墓冥器</b>，才能打开通往下一层的盗洞，带着荣耀重返人间。",
        startBtn: "点灯摸金",
        level: "第 %s 层 | %m",
        trapLabel: "机关",
        artLabel: "冥器",
        modalBtn: "收入囊中",
        endTitle: "胜败乃兵家常事",
        endDesc: "大侠请重新来过",
        endBtn: "再探古墓",
        winTitle: "摸金校尉 凯旋",
        winDesc: "找到冥器，逃出生天！",
        winBtn: "再来一局",
        items: {
            candle: {n:"千年油灯", d:"<b>长明不灭</b>: 视野大幅扩大。"},
            wine: {n:"糯米酒", d:"<b>祛阴补阳</b>: 恢复 1 点生命值。"},
            hoof: {n:"黑驴蹄子", d:"<b>生人勿近</b>: 僵尸退避 15 秒。"},
            jade: {n:"金缕玉衣", d:"<b>刀枪不入</b>: 免疫所有伤害 15 秒。"},
            compass: {n:"风水罗盘", d:"<b>寻龙分金</b>: 指向冥器棺材，得手后指向盗洞。"}
        },
        msgs: {
            start: "进入第 %s 层",
            hurt: "受到伤害!",
            empty: "空空如也...",
            trap: "大凶! 机关触发!",
            zombie: "起尸了!",
            candle: "灯火通明!",
            compass: "罗盘在手! 寻龙分金!",
            heal: "生命恢复!",
            repel: "尸畏 15秒!",
            immune: "无敌 15秒!",
            hole: "盗洞已开启! 水脉逆流!"
        },
        levelNames: LEVEL_NAMES_CN,
        trapNames: TRAP_NAMES_CN,
        labels: { coffin: "石棺", exit: "盗洞", sprinter: "疾行尸", green: "绿毒尸" },
        exitModal: { t: "发现盗洞", d: "是否进入下一层？<br>(进入后无法返回)", yes: "进入下一层" }
    },
    EN: {
        title: "Tomb Raider",
        ver: "TEN FLOORS · ONE FLAME",
        p1: "Ancient tombs hold countless treasures. As a Raider, descend 10 levels. Find the <b>Artifact</b> to unlock the exit. Use the Feng Shui Compass to guide your way.",
        startBtn: "Start Raid",
        level: "Level %s | %m",
        trapLabel: "Trap",
        artLabel: "Relic",
        modalBtn: "Collect",
        endTitle: "You Died",
        endDesc: "Better luck next time.",
        endBtn: "Try Again",
        winTitle: "Victory!",
        winDesc: "Artifacts found. You survived!",
        winBtn: "Play Again",
        items: {
            candle: {n:"Ancient Lamp", d:"<b>Eternal Flame</b>: Max Vision Range."},
            wine: {n:"Rice Wine", d:"<b>Vitality</b>: Restore 1 HP."},
            hoof: {n:"Donkey Hoof", d:"<b>Repel</b>: Zombies fear you for 15s."},
            jade: {n:"Jade Suit", d:"<b>Invincible</b>: Immune to ALL damage for 15s."},
            compass: {n:"Compass", d:"<b>Feng Shui</b>: Points to Artifact, then Exit."}
        },
        msgs: {
            start: "Entered Level %s",
            hurt: "Took Damage!",
            empty: "Empty...",
            trap: "Trap Triggered!",
            zombie: "Zombie Rise!",
            candle: "Lamp Lit!",
            compass: "Compass Active!",
            heal: "HP Restored!",
            repel: "Repel 15s!",
            immune: "Invincible 15s!",
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
    init: function() {
        if(this.ctx) { this.ctx.resume().catch(()=>{}); return; }
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.gain = this.ctx.createGain();
            this.gain.gain.value = this.muted ? 0 : 0.5;
            this.gain.connect(this.ctx.destination);
            const d=this.ctx.createDelay(); d.delayTime.value=0.2;
            const dg=this.ctx.createGain(); dg.gain.value=0.2;
            this.gain.connect(d); d.connect(dg); dg.connect(this.ctx.destination);
            this.ctx.resume().catch(()=>{});
        } catch(e) {}
    },
    tone: function(f, type, dur, vol=0.1, slide=null) {
        if(!this.ctx) return;
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
    playStep: function() { if(this.ctx) this.tone(60, 'square', 0.1, 0.15, 30); },
    playOpen: function() {
        if(!this.ctx) return;
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
        this.keys={}; this.pointer=null; this.sprintPointer=null;
        this.touchX=0; this.touchY=0; this.update();
        document.getElementById('joystick-knob').style.transform='translate(-50%,-50%)';
        document.getElementById('sprint-btn').classList.remove('pressed');
    }
};
(function(){
    const zone=document.getElementById('joystick-zone'), knob=document.getElementById('joystick-knob');
    const move=e=>{
        if(e.pointerId!==Input.pointer) return;
        const r=zone.getBoundingClientRect(), radius=r.width/2;
        const dx=e.clientX-r.left-radius, dy=e.clientY-r.top-r.height/2;
        const distance=Math.hypot(dx,dy), scale=distance>radius?radius/distance:1;
        Input.touchX=dx*scale/radius; Input.touchY=dy*scale/radius; Input.update();
        knob.style.transform=`translate(calc(-50% + ${Input.touchX*radius}px), calc(-50% + ${Input.touchY*radius}px))`;
    };
    zone.addEventListener('pointerdown',e=>{
        if(!Game.running||Game.pause||Input.pointer!==null) return;
        e.preventDefault(); Input.pointer=e.pointerId; zone.setPointerCapture(e.pointerId); move(e);
    });
    zone.addEventListener('pointermove',move);
    const release=e=>{
        if(e.pointerId!==Input.pointer) return;
        Input.pointer=null; Input.touchX=0; Input.touchY=0; Input.update();
        knob.style.transform='translate(-50%,-50%)';
    };
    ['pointerup','pointercancel','lostpointercapture'].forEach(name=>zone.addEventListener(name,release));
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
        if(e.code==='Escape'&&!e.repeat) { Game.togglePause(); return; }
        if(e.code==='KeyM'&&!e.repeat) { Game.toggleSound(); return; }
        if(!Game.running||Game.pause||!movement.includes(e.code)) return;
        e.preventDefault(); Input.keys[e.code]=true; Input.update();
    });
    window.addEventListener('keyup',e=>{ delete Input.keys[e.code]; Input.update(); });
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
        if(Math.hypot(this.x-p.x, this.y-p.y) < 30) { Game.getItem(this.code); this.dead = 1; }
    }
    draw(ctx) {
        const iKey = this.code.replace('item_', '');
        const colors = {candle:'#ff8a80', wine:'#fff', hoof:'#a1887f', jade:'#a5d6a7', compass:'#ffd700'};
        const yOff = Math.sin(Date.now()/300)*5;
        const iconMap = {candle:'🪔', wine:'🍶', hoof:'🐴', jade:'🥋', compass:'🧭'};
        ctx.font = "24px serif"; ctx.textAlign = "center";
        ctx.fillText(iconMap[iKey], 0, yOff);
        ctx.fillStyle = '#fff'; ctx.font = "12px serif";
        ctx.fillText(LANG[curLang].items[iKey].n, 0, yOff - 20);

        ctx.shadowBlur=15; ctx.shadowColor=colors[iKey];
        ctx.beginPath(); ctx.arc(0,10,8,0,6.28); ctx.fillStyle=colors[iKey]; ctx.fill(); ctx.shadowBlur=0;
    }
}

class Coffin extends Entity {
    constructor(x,y,c){super(x,y,'coffin');this.content=c;this.opened=0;this.shake=0;this.lidOffset=0;this.interactTimer=0;this.revealTimer=0;}
    interact(dt, p) {
        if(this.opened) return;
        if(Math.hypot(this.x-p.x, this.y-p.y) < 45) {
            this.interactTimer += dt;
            if(this.interactTimer > 0.6) {
                this.open();
            }
        } else {
            this.interactTimer = 0;
        }
    }
    open() {
        if(this.opened) return;
        this.opened = 1; this.shake = 0.5; this.revealTimer = 0.6; AudioSys.playOpen();
    }
    reveal() {
            if(this.content === 'artifact') {
                Game.getArtifact();
                Game.addText(this.x, this.y, ARTIFACTS[Game.lvl-1][curLang==='CN'?'n':'en'], '#ffd700');
                Game.spawn(new Effect(this.x,this.y,'gold'));
            }
            else if(this.content === 'zombie') {
                Game.spawn(new Zombie(this.x,this.y+20, 0));
                Game.addText(this.x, this.y, LANG[curLang].msgs.zombie, '#f44336');
                Game.spawn(new Effect(this.x,this.y,'burst'));
                AudioSys.playAttack();
            }
            else if(this.content === 'trap') {
                 Game.spawn(new Trap(this.x,this.y+40, Game.lvl-1));
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
        if(this.opened && this.lidOffset < 20) {
            this.lidOffset += dt * 20;
        }
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
    constructor(x,y,type=0){super(x,y,'zombie');
        this.zType = type; // 0: Blue, 1: Red (Sprinter), 2: Green (Spitter)
        this.spd = type===1 ? CONFIG.SPRINTER_SPD : (type===2 ? CONFIG.GREEN_SPD : CONFIG.ZOMBIE_SPD + Game.lvl*5);
        this.dir = Math.random()*6.28; this.changeDirT = 0;
        this.attackCD = 0;
    }
    update(dt,p) {
        const oldX=this.x, oldY=this.y;
        const dx=p.x-this.x, dy=p.y-this.y, d=Math.hypot(dx,dy);
        let repel = p.buffs.hoof > 0;

        if(this.zType === 0 || this.zType === 2) { // Blue or Green
            let active = d<200 || (Input.active && d<350);
            if(active || repel) {
                let tx=dx, ty=dy, s=this.spd;
                if(repel && d<350) { tx=-dx; ty=-dy; s=this.spd*1.5; }
                if(MapSys.get(this.x,this.y)===TERRAIN.WATER) s*=0.4;
                if(!repel || d<350) {
                    this.x += (tx/(d||1))*s*dt; if(MapSys.get(this.x,this.y)===TERRAIN.WALL) this.x=oldX;
                    this.y += (ty/(d||1))*s*dt; if(MapSys.get(this.x,this.y)===TERRAIN.WALL) this.y=oldY;
                }
            }

            // Blue Attack
            if(this.zType === 0) {
                if(this.attackCD > 0) this.attackCD -= dt;
                if(!repel && d<20 && this.attackCD <= 0) {
                    p.hit(); AudioSys.playAttack(); this.attackCD = 1.0;
                }
            }

            // Green Attack (Spit)
            if(this.zType === 2) {
                this.attackCD -= dt;
                if(!repel && d < 250 && this.attackCD <= 0) {
                    const ang = Math.atan2(dy, dx);
                    Game.spawn(new Projectile(this.x, this.y, ang, 'VENOM'));
                    AudioSys.playTrap(d);
                    this.attackCD = 2.0 + Math.random();
                }
            }

        } else { // Red Sprinter
            this.changeDirT -= dt;
            if(this.changeDirT <= 0) { this.changeDirT = 1.0 + Math.random(); this.dir = Math.random() * 6.28; }
            let vx = Math.cos(this.dir) * this.spd; let vy = Math.sin(this.dir) * this.spd;
            this.x += vx * dt; if(MapSys.get(this.x, this.y) === TERRAIN.WALL) { this.x = oldX; this.dir = Math.PI - this.dir; }
            this.y += vy * dt; if(MapSys.get(this.x, this.y) === TERRAIN.WALL) { this.y = oldY; this.dir = -this.dir; }

            if(!repel && d<20) {
                p.hit();
                Game.spawn(new Effect(this.x, this.y, 'burst'));
                AudioSys.playAttack();
                this.dead = 1;
            }
        }
        this.hop = Math.abs(Math.sin(Date.now()/(this.zType===1?100:200)))*-8;
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
        this.life=3; this.cd=Math.random();
        const data = LEVELS_DATA[Math.min(lvlIndex,9)];
        this.pType = data.type === 'MIX' ? Object.keys(PROJ_TYPES)[Math.floor(Math.random()*4)] : data.type;
        this.color = data.col;
        this.name = LANG[curLang].trapNames[Math.min(lvlIndex,9)];
        this.lvlIdx = Math.min(lvlIndex,9);
    }
    update(dt,p){
        const dist = Math.hypot(this.x-p.x, this.y-p.y);
        if(dist < 400) {
            this.cd-=dt;
            if(this.cd<0){
                this.cd = LEVELS_DATA[this.lvlIdx].delay + Math.random()*0.3;
                const pdx=p.x-this.x, pdy=p.y-this.y, ang=Math.atan2(pdy,pdx);
                Game.spawn(new Projectile(this.x,this.y,ang,this.pType));
                AudioSys.playTrap(dist);
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
    constructor(x,y,a,type){super(x,y,'proj');
        this.info = PROJ_TYPES[type] || PROJ_TYPES.ARROW;
        this.vx=Math.cos(a)*this.info.spd; this.vy=Math.sin(a)*this.info.spd;
        this.life=3.0; this.ang=a;
    }
    update(dt,p){
        this.life-=dt; if(this.life<0)this.dead=1;
        this.x+=this.vx*dt; this.y+=this.vy*dt;
        if(Math.hypot(this.x-p.x,this.y-p.y)<this.info.size+10){
            if(p.buffs.jade > 0) this.dead = 1; else { p.hit(); this.dead=1; }
        }
        if(MapSys.get(this.x,this.y)===TERRAIN.WALL) this.dead=1;
    }
    draw(ctx){
        ctx.rotate(this.ang); ctx.fillStyle=this.info.col;
        if(this.info.shape === 'rect') { ctx.fillRect(-10, -5, 20, 10); }
        else { ctx.beginPath(); ctx.arc(0,0,this.info.size,0,6.28); ctx.fill(); }
        if(this.info.trail) { ctx.strokeStyle=this.info.col; ctx.globalAlpha=0.5; ctx.beginPath(); ctx.moveTo(-5,0); ctx.lineTo(-20,0); ctx.stroke(); ctx.globalAlpha=1; }
    }
}

class Player extends Entity {
    constructor(x,y){super(x,y,'player');this.hp=5;this.sight=CONFIG.BASE_SIGHT;this.inv=0;this.buffs={hoof:0,candle:0,jade:0};this.walkT=0;this.hasCompass=0;this.stepPhase=0;}
    update(dt){
        if(this.inv>0)this.inv-=dt;
        if(this.buffs.hoof>0) this.buffs.hoof-=dt;
        if(this.buffs.candle>0) this.buffs.candle-=dt;
        if(this.buffs.jade>0) this.buffs.jade-=dt;

        const oldX=this.x, oldY=this.y;
        let s=160;
        if(Input.sprint) s *= 1.5; // Sprint!
        if(MapSys.get(this.x,this.y)===TERRAIN.WATER) s*=0.5;

        if(Input.active){
            const nx=this.x+Input.x*s*dt, ny=this.y+Input.y*s*dt;

            if(MapSys.canOccupy(nx,this.y,10))this.x=nx;
            if(MapSys.canOccupy(this.x,ny,10))this.y=ny;

            // Coffin Collision
            Game.ents.forEach(e => {
                if(e.type === 'coffin') {
                    if(Math.hypot(this.x-e.x, this.y-e.y) < 30) {
                        this.x = oldX; this.y = oldY;
                    }
                }
            });

            this.stepPhase += dt * 10;
            this.walkT+=dt; if(this.walkT > 0.4) { AudioSys.playStep(); this.walkT=0; }
        } else { this.stepPhase = 0; }
    }
    hit(){
        if(!Game.running || this.inv>0 || this.buffs.jade>0)return;
        this.hp--; this.inv=1.5; Game.shake=10; AudioSys.playHurt();
        Game.updateHUD(); Game.msg(LANG[curLang].msgs.hurt,"#f00");
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
        this.t=new Uint8Array(this.w*this.h).fill(1);
        const rms=[];
        for(let i=0;i<250 && rms.length<7+l;i++){
            const w=6+Math.floor(Math.random()*6), h=6+Math.floor(Math.random()*6);
            const x=2+Math.floor(Math.random()*(this.w-w-4)), y=2+Math.floor(Math.random()*(this.h-h-4));
            if(!rms.some(r=>x<r.x+r.w+1 && x+w+1>r.x && y<r.y+r.h+1 && y+h+1>r.y)){
                rms.push({x,y,w,h});
                for(let Y=y;Y<y+h;Y++)for(let X=x;X<x+w;X++) this.t[Y*this.w+X] = 0;
                if(rms.length>1){
                    let p=rms[rms.length-2], cx1=p.x+p.w/2|0, cy1=p.y+p.h/2|0, cx2=x+w/2|0, cy2=y+h/2|0;
                    while(cx1!=cx2){cx1+=cx1<cx2?1:-1;if(this.t[cy1*this.w+cx1]==1)this.t[cy1*this.w+cx1]=0;}
                    while(cy1!=cy2){cy1+=cy1<cy2?1:-1;if(this.t[cy1*this.w+cx1]==1)this.t[cy1*this.w+cx1]=0;}
                }
            }
        }
        // A deterministic fallback guarantees a playable map even with pathological randomness.
        if(rms.length<3) {
            this.t.fill(TERRAIN.WALL); rms.length=0;
            for(const x of [4,24,44]) {
                const room={x,y:24,w:8,h:8}; rms.push(room);
                for(let y=24;y<32;y++) for(let xx=x;xx<x+8;xx++) this.t[y*this.w+xx]=TERRAIN.FLOOR;
            }
            for(let x=8;x<48;x++) this.t[28*this.w+x]=TERRAIN.FLOOR;
        }
        return rms;
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
    ents:[], texts:[], lvl:1, art:0, exit:0, pause:0, shake:0, running:0, artifactPos: null, items: [], raf:null, lastTime:null, accumulator:0, elapsed:0, hudTimer:0,

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
            'guide-move-desc':cn?'WASD / 方向键移动，Shift 疾行；手机使用摇杆。':'Move with WASD / arrows. Hold Shift to sprint, or use touch controls.',
            'guide-find':cn?'驻足开棺':'DISCOVER',
            'guide-find-desc':cn?'靠近石棺停留片刻，寻找本层唯一的镇墓冥器。':'Stay beside a coffin to open it. Find the relic on each floor.',
            'guide-exit':cn?'寻龙脱身':'ESCAPE',
            'guide-exit-desc':cn?'拾取罗盘指引方向，取得冥器后前往盗洞。':'Collect a compass to locate the relic, then follow it to the exit.',
            'pause-title':cn?'灯火未熄':'The flame awaits',
            'pause-desc':cn?'歇息片刻，古墓中的时间已暂停。':'Take a breath. The tomb is paused.',
            'resume-btn':cn?'继续探索':'Resume exploration',
            'map-caption':cn?'探索地图 · 金点为目标':'Explored map · gold = target',
            'control-hint':cn?'WASD 移动 · Shift 疾行 · Esc 暂停 · M 静音':'WASD Move · Shift Sprint · Esc Pause · M Mute',
            'sprint-btn':cn?'疾行':'RUN'
        };
        for(const [id,value] of Object.entries(labels)) document.getElementById(id).textContent=value;
        document.getElementById('pause-btn').setAttribute('aria-label',cn?'暂停':'Pause');
        this.updateSoundButton();
        if(this.p) this.updateHUD();
    },

    init: function(){
        this.resize(); window.onresize=()=>this.resize();
        document.getElementById('start-screen').style.display='none';
        AudioSys.init();
        this.restart();
    },

    restart: function() {
        this.lvl = 1; this.art = 0; this.saved = null; this.items = [];
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
        if(this.pause) document.getElementById('resume-btn').focus();
        else document.getElementById('pause-btn').focus();
    },
    toggleSound: function() {
        AudioSys.muted=!AudioSys.muted;
        if(AudioSys.gain) AudioSys.gain.gain.value=AudioSys.muted?0:0.5;
        this.updateSoundButton();
    },
    updateSoundButton: function() {
        const btn=document.getElementById('sound-btn');
        btn.textContent=AudioSys.muted?'×♪':'♪';
        btn.setAttribute('aria-pressed',String(AudioSys.muted));
        btn.setAttribute('aria-label',curLang==='CN'?(AudioSys.muted?'开启声音':'静音'):(AudioSys.muted?'Unmute':'Mute'));
    },

    showExitModal: function() {
        document.getElementById('exit-modal').classList.add('active');
        this.pause = true; Input.reset();
        document.getElementById('exit-confirm-btn').focus();
    },
    confirmNextLevel: function() {
        if(!this.running||!this.exit||!document.getElementById('exit-modal').classList.contains('active')) return;
        document.getElementById('exit-modal').classList.remove('active');
        this.pause = false;
        if(this.lvl>=10){ this.victory(); }
        else {
            this.saved={hp:this.p.hp,sight:this.p.sight,hasCompass:this.p.hasCompass};
            this.load(this.lvl+1);
        }
    },

    addText: function(x, y, text, color) {
        this.texts.push(new FloatText(x, y, text, color));
    },

    load: function(l){
        this.lvl=l; this.ents=[]; this.texts=[]; this.exit=0; this.artifactPos = null; this.shake=0; this.pause=false; Input.reset();
        this.explored=new Uint8Array(MapSys.w*MapSys.h); this.hudTimer=0; this.lastTime=null; this.accumulator=0;
        document.getElementById('item-bar').innerHTML = '';

        const rms=MapSys.gen(l), s=rms[0], e=rms[rms.length-1];
        this.p=new Player((s.x+s.w/2)*CONFIG.TILE, (s.y+s.h/2)*CONFIG.TILE);
        if(this.saved) { Object.assign(this.p,this.saved); }
        this.p.inv=2; // Safe arrival on every floor.
        this.ents.push(this.p);

        const corners=[];
        rms.forEach(r => {
             corners.push({x:r.x*CONFIG.TILE+25, y:r.y*CONFIG.TILE+25});
             corners.push({x:(r.x+r.w)*CONFIG.TILE-25, y:(r.y+r.h)*CONFIG.TILE-25});
        });

        ['item_compass', 'item_wine', 'item_hoof', 'item_jade', 'item_candle', 'item_candle', 'item_candle'].forEach(code => {
             if(corners.length>0) {
                 const ri = Math.floor(Math.random()*corners.length);
                 this.ents.push(new GroundItem(corners[ri].x, corners[ri].y, code));
                 corners.splice(ri,1);
             }
        });

        const spots=[];
        for(let i=1;i<rms.length-1;i++) spots.push({x:(rms[i].x+rms[i].w/2)*CONFIG.TILE, y:(rms[i].y+rms[i].h/2)*CONFIG.TILE});

        if(spots.length>0) {
            const ai = Math.floor(Math.random()*spots.length);
            this.ents.push(new Coffin(spots[ai].x, spots[ai].y, 'artifact'));
            this.artifactPos = {x: spots[ai].x, y: spots[ai].y};
            spots.splice(ai,1);
        }

        spots.forEach(p => {
             const c = Math.random()<0.5?'empty':'zombie';
             this.ents.push(new Coffin(p.x, p.y, c));
        });

        const trapCount = Math.floor(1 + Math.pow(l, 1.2));
        let trapsPlaced = 0;
        while(trapsPlaced < trapCount) {
             const r=rms[1+Math.floor(Math.random()*(rms.length-1))];
             const tx = (r.x + 1 + Math.floor(Math.random()*(r.w-2))) * CONFIG.TILE;
             const ty = r.y * CONFIG.TILE;
             this.ents.push(new Trap(tx, ty, l-1));
             trapsPlaced++;
        }

        this.exitRoom = e;
        this.exitPos = {x:(e.x+e.w/2)*CONFIG.TILE, y:(e.y+0.5)*CONFIG.TILE};

        for(let i=0;i<4+l*2;i++){
            const r=rms[1+Math.floor(Math.random()*(rms.length-1))];
            const isSprinter = Math.random() < 0.2 ? 1 : 0;
            const isGreen = Math.random() < 0.1 ? 2 : 0;
            const zType = isSprinter ? 1 : (isGreen ? 2 : 0);
            this.ents.push(new Zombie((r.x+2)*CONFIG.TILE, (r.y+2)*CONFIG.TILE, zType));
        }
        clearTimeout(this.msgTimer); document.getElementById('msg-box').classList.remove('msg-show');
        this.updateHUD(); this.refreshBuffs(); this.refreshExploration(); this.drawMinimap();

        const lName = LANG[curLang].levelNames[Math.min(l-1,9)];
        const splash = document.getElementById('level-title-text');
        const levelStr = LANG[curLang].level.replace('%s', l).split('|')[0].trim();
        splash.innerText = `${levelStr} | ${lName}`;
        document.getElementById('level-title-box').classList.remove('show-level-title');
        void document.getElementById('level-title-box').offsetWidth;
        document.getElementById('level-title-box').classList.add('show-level-title');
    },

    getArtifact: function() {
        if(this.exit||!this.running) return;
        AudioSys.playItem(true);
        const a = ARTIFACTS[this.lvl-1];
        const name = curLang === 'CN' ? a.n : a.en;



        this.art++; this.exit=1;
        this.msg(`${name} · ${LANG[curLang].msgs.hole}`, "#dfc58c");
        this.updateHUD();

        const r = this.exitRoom;
        for(let y=r.y; y<r.y+r.h; y++){
            for(let x=r.x; x<r.x+r.w; x++){
                 if(MapSys.get(x*CONFIG.TILE, y*CONFIG.TILE) === TERRAIN.FLOOR) {
                     MapSys.t[y*MapSys.w+x] = 2;
                 }
            }
        }
    },
    getItem: function(c) {
        AudioSys.playItem(true);
        const key = c.replace('item_','');
        const colors = {candle:'#ff8a80', wine:'#fff', hoof:'#a1887f', jade:'#a5d6a7', compass:'#ffd700'};
        const col = colors[key];

        // Direct Pickup (No Modal)
        AudioSys.playUse();

        if(c==='item_candle'){ this.p.sight=Math.min(750,this.p.sight+150); this.msg(LANG[curLang].msgs.candle, col); }
        if(c==='item_compass'){ this.p.hasCompass=1; this.msg(LANG[curLang].msgs.compass, col); }
        if(c==='item_wine'){ this.p.hp=Math.min(5,this.p.hp+1); this.msg(LANG[curLang].msgs.heal, col); this.updateHUD(); }
        if(c==='item_hoof'){ this.p.buffs.hoof=15; this.msg(LANG[curLang].msgs.repel, col); }
        if(c==='item_jade'){ this.p.buffs.jade=15; this.msg(LANG[curLang].msgs.immune, col); }
    },

    spawn: function(e){this.ents.push(e);},
    msg: function(t,c){const b=document.getElementById('msg-box');b.textContent=t;b.style.color=c;b.classList.add('msg-show');clearTimeout(this.msgTimer);this.msgTimer=setTimeout(()=>b.classList.remove('msg-show'),2500);},
    updateHUD: function(){
        document.getElementById('hp-bar').innerText="♥".repeat(Math.max(0,this.p.hp))+"♡".repeat(Math.max(0,5-this.p.hp));

        const lName = LANG[curLang].levelNames[Math.min(this.lvl-1,9)];
        const levelBase = LANG[curLang].level.split('|')[0].replace('%s', this.lvl).trim();
        document.getElementById('level-num').innerText = `${levelBase} | ${lName}`;

        document.getElementById('artifact-bar').innerText = `${LANG[curLang].artLabel}: ${this.art}/10`;
        const cn=curLang==='CN';
        document.getElementById('objective').textContent=this.exit?(cn?'盗洞已开启 · 前往金色标记':'Exit unlocked · reach the gold marker'):(cn?'寻找镇墓冥器 · 靠近石棺自动开启':'Find the relic · stay beside a coffin to open');
        document.getElementById('exit-confirm-btn').textContent=this.lvl===10?(cn?'逃出生天':'Escape the tomb'):LANG[curLang].exitModal.yes;
    },
    over: function(){
        this.running=0; Input.reset();
        document.getElementById('end-desc').textContent=this.runSummary();
        document.getElementById('game-over-modal').classList.add('active');
        document.getElementById('end-btn').focus();
    },
    victory: function(){
        this.running=0; Input.reset();
        document.getElementById('win-desc').textContent=this.runSummary();
        document.getElementById('victory-modal').classList.add('active');
        document.getElementById('win-btn').focus();
    },

    runSummary: function() {
        const time=`${Math.floor(this.elapsed/60)}:${String(Math.floor(this.elapsed%60)).padStart(2,'0')}`;
        return curLang==='CN'?`抵达第 ${this.lvl} 层 · 收集 ${this.art}/10 件冥器 · 探索 ${time}`:`Floor ${this.lvl} · ${this.art}/10 relics · ${time}`;
    },
    loop: function(timestamp){
        this.raf=null;
        if(!this.running) return;
        if(this.lastTime===null) this.lastTime=timestamp;
        const delta=Math.min(Math.max((timestamp-this.lastTime)/1000,0),0.1);
        this.lastTime=timestamp;
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
        this.shake=this.shake>0.1?this.shake*Math.pow(0.9,dt*60):0;
        this.ents=this.ents.filter(e=>!e.dead);
        // Player first; entities spawned during a step start updating on the next step.
        this.p.update(dt);
        for(const e of [...this.ents]) {
            if(!this.running||this.pause) break;
            if(e===this.p||e.dead) continue;
            if(e.update) e.update(dt,this.p);
            if(e.type==='coffin') e.interact(dt,this.p);
        }
        this.texts=this.texts.filter(t=>t.life>0);
        this.texts.forEach(t=>t.update(dt));
        if(!this.running) return;
        this.hudTimer-=dt;
        if(this.hudTimer<=0) { this.refreshExploration(); this.refreshBuffs(); this.drawMinimap(); this.hudTimer=0.1; }
        if(this.exit&&Math.hypot(this.exitPos.x-this.p.x,this.exitPos.y-this.p.y)<30) this.showExitModal();
    },
    refreshBuffs: function() {
        let html='';
        if(this.p.buffs.hoof>0) html+=`<div class="buff buff-hoof">🐴 ${Math.ceil(this.p.buffs.hoof)}s</div>`;
        if(this.p.buffs.jade>0) html+=`<div class="buff buff-jade">🥋 ${Math.ceil(this.p.buffs.jade)}s</div>`;
        if(this.p.hasCompass) html+=`<div class="buff buff-compass">🧭 ${curLang==='CN'?'寻龙':'Compass'}</div>`;
        const bar=document.getElementById('buff-bar');
        if(bar.innerHTML!==html) bar.innerHTML=html;
        const itemBar=document.getElementById('item-bar');
        const lamp=this.p.sight>CONFIG.BASE_SIGHT?`<div class="item-slot">🪔 ${curLang==='CN'?'灯火':'Light'} +${this.p.sight-CONFIG.BASE_SIGHT}</div>`:'';
        if(itemBar.innerHTML!==lamp) itemBar.innerHTML=lamp;
    },
    refreshExploration: function() {
        const px=Math.floor(this.p.x/CONFIG.TILE), py=Math.floor(this.p.y/CONFIG.TILE);
        const radius=Math.max(2,Math.floor(this.p.sight/CONFIG.TILE*0.65));
        for(let y=Math.max(0,py-radius);y<=Math.min(MapSys.h-1,py+radius);y++) {
            for(let x=Math.max(0,px-radius);x<=Math.min(MapSys.w-1,px+radius);x++) {
                if(Math.hypot(x-px,y-py)<=radius) this.explored[y*MapSys.w+x]=1;
            }
        }
    },
    drawMinimap: function() {
        const canvas=document.getElementById('minimap'), ctx=canvas.getContext('2d'), scale=canvas.width/MapSys.w;
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
        const target=this.exit?this.exitPos:this.artifactPos;
        if(target&&(this.exit||this.p.hasCompass)) dot(target,'#ffd47d',3);
        dot(this.p,'#c3ffe5',3);
    },

    render: function(){
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

        if(this.exit) {
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

        if(this.p.hasCompass && (this.exit || this.artifactPos)) {
            let target = this.exitPos;
            if(!this.exit && this.artifactPos) target = this.artifactPos;
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
