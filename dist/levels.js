// Ten hand-authored floor graphs. Every room, route and coffin position is deterministic.
// Coordinates are tiles; generated coffinSlots are derived only from these saved room plans.
const room = (x,y,w,h,kind,layoutRole) => ({x,y,w,h,kind,...(layoutRole?{layoutRole}:{})});
const savedPlan = (size,layout,rooms,links) => {
    // Preserve each authored topology and Han symmetry: double center spacing,
    // enlarge room dimensions by about 50%, leaving substantially longer passages.
    size*=2;
    rooms=rooms.map(r=>{const w=2*Math.ceil(r.w*.75),h=2*Math.ceil(r.h*.75);return {...r,x:r.x*2+r.w-w/2,y:r.y*2+r.h-h/2,w,h};});
    const coffinSlots=[];
    const seen=new Set();
    const add=(x,y)=>{
        const px=Math.round(x*50),py=Math.round(y*50),key=`${px}:${py}`;
        if(!seen.has(key)){seen.add(key);coffinSlots.push([px,py]);}
    };
    // Five deliberately spaced anchors per usable room keep item placement fixed while
    // distributing discoveries across branches instead of clustering them at the entrance.
    for(const r of rooms){
        if(['entry','sanctuary'].includes(r.kind))continue;
        const x1=r.x+1.5,x2=r.x+r.w-1.5,y1=r.y+1.5,y2=r.y+r.h-1.5;
        [[x1,y1],[x2,y2],[x2,y1],[x1,y2],[r.x+r.w/2,r.y+r.h/2]].forEach(p=>add(...p));
    }
    return {size,layout,rooms,links,coffinSlots};
};

const FLOOR_PLANS = [
    // 1 · Han dynasty axial tomb: strict bilateral symmetry and a clear processional route.
    savedPlan(36,'han_axial',[
        room(16,30,4,4,'entry','tomb_road'),
        room(15,26,6,3,'burial','tomb_road'),
        room(3,20,6,6,'ear_left'),
        room(27,20,6,6,'ear_right'),
        room(12,19,12,7,'front'),
        room(11,10,14,7,'main'),
        room(3,10,6,5,'burial','ear_left'),
        room(27,10,6,5,'burial','ear_right'),
        room(15,3,6,5,'rear')
    ],[[0,1],[1,4],[4,2],[4,3],[4,5],[5,6],[5,7],[5,8]]),

    // 2 · A long S-shaped bolt gallery with optional supply and sanctuary detours.
    savedPlan(40,'serpentine_bolts',[
        room(3,33,5,5,'entry'),room(10,31,7,6,'trap'),room(25,30,9,7,'trap'),
        room(26,21,8,6,'burial'),room(10,20,8,6,'trap'),room(3,13,7,6,'supply'),
        room(14,10,7,7,'trap'),room(28,10,7,7,'burial'),room(5,3,8,7,'sanctuary'),
        room(27,2,9,7,'exit')
    ],[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[6,8],[7,9],[4,8]]),

    // 3 · Four bronze-beast wings circle a central hall; cross-links let patrols flank.
    savedPlan(44,'bronze_beast_cross',[
        room(18,37,7,5,'entry'),room(17,28,10,7,'burial'),room(4,28,8,7,'trap'),
        room(32,28,8,7,'trap'),room(17,17,10,8,'burial'),room(3,16,9,8,'supply'),
        room(32,16,9,8,'sanctuary'),room(17,6,10,7,'trap'),room(4,5,8,7,'burial'),
        room(32,4,8,8,'burial'),room(3,37,8,5,'supply'),room(17,1,10,4,'exit')
    ],[[0,1],[1,2],[1,3],[1,4],[2,5],[3,6],[4,5],[4,6],[4,7],[5,8],[6,9],[7,8],[7,9],[7,11],[10,2]]),

    // 4 · A radial furnace: outer ring, four spokes, and a dangerous crucible core.
    savedPlan(48,'cauldron_radial',[
        room(20,41,8,5,'entry'),room(19,32,10,7,'trap'),room(5,32,9,8,'supply'),
        room(34,32,9,8,'burial'),room(18,19,12,10,'trap'),room(3,19,10,9,'burial'),
        room(35,19,10,9,'trap'),room(18,7,12,8,'sanctuary'),room(4,6,9,8,'burial'),
        room(35,6,9,8,'supply'),room(3,41,9,5,'burial'),room(36,41,9,5,'trap'),
        room(10,15,7,6,'trap'),room(31,15,7,6,'trap'),room(20,1,8,5,'exit')
    ],[[0,1],[1,2],[1,3],[1,4],[2,5],[3,6],[4,5],[4,6],[4,7],[5,8],[6,9],[7,8],[7,9],[7,14],[10,2],[11,3],[12,4],[12,5],[13,4],[13,6]]),

    // 5 · An asymmetric bone maze with false branches, loops and reconnecting shortcuts.
    savedPlan(52,'bone_maze',[
        room(3,44,6,5,'entry'),room(12,42,7,7,'burial'),room(24,43,8,6,'trap'),
        room(39,42,9,7,'supply'),room(39,32,8,7,'burial'),room(25,31,8,8,'trap'),
        room(10,31,8,7,'burial'),room(3,22,7,7,'sanctuary'),room(15,20,8,8,'trap'),
        room(29,21,7,7,'burial'),room(42,20,7,8,'trap'),room(39,10,9,7,'supply'),
        room(25,9,8,8,'burial'),room(10,10,8,7,'trap'),room(2,3,8,7,'burial'),
        room(18,2,8,7,'supply'),room(34,2,9,7,'trap'),room(44,3,6,6,'burial'),
        room(23,18,5,5,'burial'),room(24,2,8,6,'exit')
    ],[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,19],[15,16],[16,17],[5,8],[8,18],[18,9],[12,16],[6,13],[4,10]]),

    // 6 · Three flooded branches weave around dry islands and meet at the royal quay.
    savedPlan(56,'coffin_river_delta',[
        room(24,49,7,5,'entry'),room(23,40,10,7,'burial'),room(7,40,9,8,'supply'),
        room(40,40,9,8,'trap'),room(4,29,10,8,'burial'),room(23,29,10,8,'sanctuary'),
        room(42,28,10,9,'burial'),room(8,18,9,8,'trap'),room(24,18,8,8,'burial'),
        room(40,17,10,8,'supply'),room(3,7,10,8,'burial'),room(20,7,9,8,'trap'),
        room(37,6,10,8,'burial'),room(47,8,7,7,'trap'),room(10,30,7,6,'trap'),
        room(35,30,7,6,'burial'),room(14,1,9,5,'supply'),room(31,1,10,5,'trap'),
        room(23,1,8,5,'exit')
    ],[[0,1],[1,2],[1,3],[2,4],[1,5],[3,6],[4,7],[5,8],[6,9],[7,10],[8,11],[9,12],[9,13],[2,14],[14,7],[3,15],[15,9],[10,16],[11,16],[11,17],[12,17],[16,18],[17,18],[4,5],[5,6],[7,8],[8,9]]),

    // 7 · Nine chambers form a seal grid around a central well, with four locked rites.
    savedPlan(60,'nine_seal_well',[
        room(26,53,8,5,'entry'),room(25,44,10,7,'burial'),
        room(5,38,10,9,'seal'),room(25,36,10,8,'seal'),room(45,38,10,9,'seal'),
        room(5,23,10,9,'trap'),room(24,22,12,10,'burial'),room(45,23,10,9,'supply'),
        room(5,8,10,9,'sanctuary'),room(25,7,10,10,'seal'),room(45,8,10,9,'trap'),
        room(14,31,8,7,'burial'),room(38,31,8,7,'burial'),room(14,16,8,7,'trap'),
        room(38,16,8,7,'trap'),room(2,50,9,7,'supply'),room(49,50,9,7,'burial'),
        room(2,2,9,6,'trap'),room(49,2,9,6,'supply'),room(25,1,10,5,'exit')
    ],[[0,1],[1,2],[1,3],[1,4],[2,5],[3,6],[4,7],[5,8],[6,9],[7,10],[8,9],[9,10],[2,11],[11,6],[4,12],[12,6],[5,13],[13,9],[7,14],[14,9],[15,2],[16,4],[17,8],[18,10],[9,19],[8,17],[10,18]]),

    // 8 · Two offset shadow rings repeatedly split and recombine around the burial court.
    savedPlan(64,'shadow_double_ring',[
        room(28,57,8,5,'entry'),room(27,48,10,7,'burial'),room(8,49,10,8,'trap'),
        room(46,49,10,8,'trap'),room(3,37,10,8,'burial'),room(19,38,9,8,'supply'),
        room(36,38,9,8,'burial'),room(51,36,10,9,'sanctuary'),room(4,23,10,9,'trap'),
        room(20,24,9,8,'burial'),room(35,23,10,9,'trap'),room(51,21,10,9,'supply'),
        room(7,9,10,8,'burial'),room(22,10,9,8,'trap'),room(37,9,9,8,'burial'),
        room(51,7,10,8,'trap'),room(2,55,9,6,'supply'),room(53,55,9,6,'burial'),
        room(2,2,9,6,'trap'),room(18,2,9,6,'burial'),room(36,2,9,6,'supply'),
        room(53,1,9,6,'trap'),room(27,1,10,6,'exit')
    ],[[0,1],[1,2],[1,3],[2,4],[2,5],[3,6],[3,7],[4,8],[5,9],[6,10],[7,11],[8,12],[9,13],[10,14],[11,15],[12,13],[13,14],[14,15],[4,5],[5,6],[6,7],[8,9],[9,10],[10,11],[16,2],[17,3],[18,12],[19,13],[20,14],[21,15],[13,22],[14,22]]),

    // 9 · Monumental nested imperial courts, flanking treasuries and a guarded axis.
    savedPlan(68,'imperial_nested_courts',[
        room(30,61,8,5,'entry'),room(27,52,14,7,'burial'),room(7,53,11,9,'supply'),
        room(50,53,11,9,'trap'),room(26,40,16,9,'burial'),room(5,40,11,9,'trap'),
        room(52,40,11,9,'sanctuary'),room(25,27,18,10,'trap'),room(4,27,12,9,'burial'),
        room(52,27,12,9,'supply'),room(24,14,20,10,'burial'),room(4,14,12,9,'trap'),
        room(52,14,12,9,'burial'),room(27,3,14,8,'trap'),room(7,3,11,8,'supply'),
        room(50,3,11,8,'burial'),room(18,54,7,7,'trap'),room(43,54,7,7,'burial'),
        room(17,42,7,7,'supply'),room(44,42,7,7,'trap'),room(17,29,7,7,'burial'),
        room(44,29,7,7,'trap'),room(17,16,7,7,'burial'),room(44,16,7,7,'supply'),
        room(29,1,10,5,'exit')
    ],[[0,1],[1,2],[1,3],[1,4],[2,5],[3,6],[4,5],[4,6],[4,7],[5,8],[6,9],[7,8],[7,9],[7,10],[8,11],[9,12],[10,11],[10,12],[10,13],[11,14],[12,15],[13,14],[13,15],[13,24],[16,1],[17,1],[18,4],[19,4],[20,7],[21,7],[22,10],[23,10]]),

    // 10 · A vast broken spiral, star chambers and three seal spokes around the final core.
    savedPlan(72,'fallen_star_spiral',[
        room(32,65,8,5,'entry'),room(29,56,14,7,'burial'),room(8,58,11,9,'seal'),
        room(52,57,12,10,'trap'),room(4,45,12,9,'supply'),room(24,46,10,9,'burial'),
        room(40,45,11,10,'trap'),room(57,43,11,10,'seal'),room(4,30,12,10,'burial'),
        room(22,32,11,9,'trap'),room(39,31,11,10,'sanctuary'),room(56,28,12,10,'burial'),
        room(6,16,12,10,'trap'),room(24,18,10,9,'seal'),room(40,17,11,10,'burial'),
        room(57,14,11,10,'supply'),room(9,3,12,9,'burial'),room(27,5,11,9,'trap'),
        room(44,4,11,9,'burial'),room(60,2,9,9,'trap'),room(17,49,7,7,'trap'),
        room(47,49,7,7,'burial'),room(17,35,7,7,'supply'),room(49,34,7,7,'trap'),
        room(18,21,7,7,'burial'),room(50,19,7,7,'trap'),room(20,8,7,7,'supply'),
        room(39,8,7,7,'burial'),room(32,22,8,7,'trap'),room(31,1,10,5,'exit')
    ],[[0,1],[1,2],[1,3],[2,4],[3,7],[4,5],[5,6],[6,7],[4,8],[5,9],[6,10],[7,11],[8,12],[9,13],[10,14],[11,15],[12,16],[13,17],[14,18],[15,19],[16,17],[17,18],[18,19],[17,29],[20,5],[21,6],[22,9],[23,10],[24,13],[25,14],[26,17],[27,18],[28,9],[28,10],[2,20],[3,21],[8,22],[11,23],[12,24],[15,25]] )
];
