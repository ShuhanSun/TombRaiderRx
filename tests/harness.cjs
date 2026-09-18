const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=['levels.js','audio.js','escape.js','dangers.js','expedition.js','world.js','art.js','transitions.js','bosses.js','game.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
// Run the real game with a strict DOM fixture and a controllable animation clock.
function setup(seed=1) {
    const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,'HTML IDs must be unique');
    const calls=[];
    const ctx=new Proxy({}, {get(target,key) {
        if(key==='getImageData') return ()=>({data:new Uint8Array(16)});
        if(key==='createRadialGradient'||key==='createLinearGradient') return ()=>({addColorStop(){}});
        return target[key]??((...args)=>calls.push([key,...args]));
    },set(target,key,value){target[key]=value;return true;}});
    function element(id) {
        const classes=new Set(), handlers={};
        return {id,style:{},innerHTML:'',textContent:'',width:180,height:180,handlers,
            classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k,on){if(on)classes.add(k);else classes.delete(k);}},
            setAttribute(){},getContext:()=>ctx,appendChild(){},remove(){},focus(){},
            getBoundingClientRect:()=>({left:0,top:0,width:120,height:120}),setPointerCapture(){},
            addEventListener(k,fn){handlers[k]=fn;}
        };
    }
    const els=Object.fromEntries(ids.map(id=>[id,element(id)]));
    const windowEvents={}, documentEvents={}, frames=new Map(), timers=new Map(); let next=0;
    const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    class Media {
        constructor(src){this.src=src;this.paused=true;this.playCount=0;this.currentTime=0;}
        play(){this.paused=false;this.playCount++;return Promise.resolve();}
        pause(){this.paused=true;}
        addEventListener(){}
    }
    class Picture {set src(value){this._src=value;this.width=this.height=1254;this.onload?.();}}
    const context=vm.createContext({Math:math,Date,Uint8Array,Int16Array,console,Audio:Media,Image:Picture,navigator:{audioSession:{}},
        document:{getElementById:id=>els[id]||null,documentElement:{},hidden:false,
            querySelectorAll:()=>Object.values(els).filter(e=>/modal$/.test(e.id)),createElement:()=>element(''),addEventListener(k,fn){documentEvents[k]=fn;}},
        window:{innerWidth:1200,innerHeight:800,devicePixelRatio:2,addEventListener(k,fn){windowEvents[k]=fn;}},
        requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id),
        setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)
    });
    vm.runInContext(source+'\nthis.api={Game,MapSys,Input,Player,Coffin,Zombie,Trap,Projectile,Effect,FloatText,AudioSys,CONFIG,TERRAIN,World,Art,Scene,Sound,THEMES,Passage,ExitGate,SPECIES,FLOOD_TYPES,Expedition,TombCreature,FLOOR_PLANS,TombDangers,BossFight,TombBoss,BOSS_SPECS};',context);
    const api=context.api;
    api.Art.ready=true;api.Art.sprites={};api.Art.walker={};api.Art.zombies={};api.Art.traps={};api.Art.trapEmitters={width:400,height:200};api.Art.mechanisms={};api.Art.tiles=Array(16).fill({});
    api.Game.resize();api.Game.restart();
    const tick=t=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(t));};
    return {...api,els,frames,timers,tick,calls,windowEvents,documentEvents,context};
}


module.exports={setup};
