// Shared 3D toolkit for every map of "Sống sót nơi công sở" (tầng Intern, phòng trọ).
// One palette, one set of prop builders, one character builder, one walk grid: similar problem, same solution.
// Pages: import * as Wd from './world.js'; const kit = Wd.makeKit(scene); ... Wd.makeWalkGrid({W, D, blockers: kit.blockers}).
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ---------- Design tokens for the 3D world (one palette for every map) ---------- */
export const P = {
  floorA:'#f7ecd6', floorB:'#f0ddbc', carpet:'#b2504a', hallA:'#e1e4e4', hallB:'#d5dadb',
  wallL:'#c8e8ee', wallB:'#e0f2f4', trim:'#fbfdfc', half:'#b5e2d1',
  wood:'#da9c60', woodDark:'#8e542d', dark:'#2f3542', screen:'#58cef8', paper:'#fdfdfb', metal:'#c0c6d0', metalDark:'#7e8895',
  red:'#f45561', yellow:'#fbd242', green:'#44ba6a', pot:'#e77e49', sky:'#96defa', blue:'#3c83ec', partition:'#77c096',
  skin:'#f3c9a5', hair:'#2b1d16', pants:'#3a4660', shirt:'#ffffff', glass:'#bfe6f5', leather:'#4a2c22', gold:'#e3b23c', ink:'#2a2230',
  // home (phòng trọ)
  plankA:'#ecc796', plankB:'#e2b783', tileA:'#eef7f9', tileB:'#d3eaf0', rug:'#9fd3c7', night:'#34407a', balA:'#eeb08c', balB:'#e39f78',
  cat:'#f0a04b', pajama:'#b8a9e6', pajamaTrim:'#fdfdfb'
};

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const reduce = reduceMotion;

// icon labels share one stroke style so they read as one set
export const ICON = {
  // rounded speech bubble, tail at bottom-left, small ellipsis (from Lily's reference)
  dots: '<svg class="bubble" viewBox="0 0 48 46" aria-hidden="true"><path d="M24 3C12.4 3 4 10.6 4 20c0 6 3.4 11.2 8.6 14.2L10.5 43l9.3-6.4c1.4.3 2.8.4 4.2.4 11.6 0 20-7.6 20-17S35.6 3 24 3z" fill="#f2d058" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/><circle cx="18.5" cy="21.5" r="1.9" fill="#111"/><circle cx="24" cy="21.5" r="1.9" fill="#111"/><circle cx="29.5" cy="21.5" r="1.9" fill="#111"/></svg>',
  // same bubble, '!' inside: today's card waits with this person
  alert: '<svg class="bubble" viewBox="0 0 48 46" aria-hidden="true"><path d="M24 3C12.4 3 4 10.6 4 20c0 6 3.4 11.2 8.6 14.2L10.5 43l9.3-6.4c1.4.3 2.8.4 4.2.4 11.6 0 20-7.6 20-17S35.6 3 24 3z" fill="#f2d058" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/><rect x="21.8" y="10" width="4.4" height="12.5" rx="2.2" fill="#111"/><circle cx="24" cy="27.6" r="2.5" fill="#111"/></svg>',
};

/* ---------- Builders + characters, bound to one scene ---------- */
export function makeKit(scene){
  const matCache = {};
  const mat = (c, extra={}) => { const k = c + JSON.stringify(extra); return matCache[k] ||= new T.MeshStandardMaterial({color:c, roughness:.8, ...extra}); };
  const blockers = []; // floor-plan rectangles nobody can walk through
  const hotMeshes = [];
  function box(x, z, y, w, d, h, color, o={}){
    const r = o.round ?? Math.min(.06, Math.min(w, d, h) * .25);
    const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new T.BoxGeometry(w, h, d);
    const mesh = new T.Mesh(g, o.faces || o.material || mat(color));
    mesh.position.set(x + w/2, y + h/2, z + d/2);
    mesh.castShadow = o.cast ?? true; mesh.receiveShadow = true;
    if (o.hot) { mesh.userData.hot = o.hot; hotMeshes.push(mesh); }
    if (o.shell) mesh.userData.shell = true; // floor and walls: stay drawn even while the room is closed
    scene.add(mesh);
    if (o.block) blockers.push({x0:x, z0:z, x1:x+w, z1:z+d});
    return mesh;
  }
  function textTex(text, {w=512, h=128, bg='#fff', fg=P.ink, size=64}={}){
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `800 ${size}px "Baloo 2", sans-serif`; x.fillText(text, w/2, h/2 + size*.06);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z. The camera sees +x, +y, +z.
  const faceMats = (base, idx, m) => { const a = Array(6).fill(mat(base)); a[idx] = m; return a; };
  const sign = (x, z, y, w, d, h, text, bg, fg, face, size=64, tw=512, th=128) =>
    box(x, z, y, w, d, h, bg, {round:0, cast:false, faces:faceMats(bg, face, new T.MeshStandardMaterial({map:textTex(text,{bg,fg,size,w:tw,h:th}), roughness:.8}))});
  const plant = (x, z, s=1) => { box(x, z, 0, .6*s, .6*s, .5*s, P.pot, {block:true});
    [[0,.95,0,.38],[.18,1.3,.1,.3],[-.14,1.25,-.12,.27],[0,1.6,0,.22]].forEach(([dx,y,dz,r])=>{
      const m = new T.Mesh(new T.IcosahedronGeometry(r*s,0), mat(P.green)); m.position.set(x+.3*s+dx*s, y*s, z+.3*s+dz*s); m.castShadow = true; scene.add(m); }); };
  function makeChar({hair=P.hair, shirt=P.shirt, pants=P.pants, tie=null, lanyard=false, style='short', bag=false, chefHat=false,
                     glasses=null, sunglasses=false, mustache=false, headphones=null, scarf=null, apron=false, clip=null, scale=[1,1,1]}={}){
    const g = new T.Group(); const parts = {};
    const add = (geo, c, x, y, z, parent=g) => { const m = new T.Mesh(geo, mat(c)); m.position.set(x,y,z); m.castShadow = true; parent.add(m); return m; };
    const rb = (w, h, d, r=.05) => new RoundedBoxGeometry(w, h, d, 2, r);
    const limb = (x, y, w, h, c) => { const p = new T.Group(); p.position.set(x, y, 0); g.add(p); add(rb(w, h, w+.02), c, 0, -h/2, 0, p); return p; };
    parts.legL = limb(-.12, .68, .19, .66, pants); parts.legR = limb(.12, .68, .19, .66, pants);
    add(rb(.52, .6, .32, .1), shirt, 0, .97, 0);
    parts.armL = limb(-.34, 1.22, .13, .52, shirt); parts.armR = limb(.34, 1.22, .13, .52, shirt);
    if (bag) add(rb(.12, .34, .44, .04), P.leather, .04, -.62, 0, parts.armR);
    if (lanyard) { add(new T.BoxGeometry(.12, .15, .02), P.blue, 0, .86, .17); add(new T.BoxGeometry(.03, .22, .02), P.red, -.07, 1.06, .165); add(new T.BoxGeometry(.03, .22, .02), P.red, .07, 1.06, .165); }
    if (tie) add(new T.BoxGeometry(.08, .4, .02), tie, 0, 1.02, .17);
    if (apron) { add(new T.BoxGeometry(.46, .62, .02), '#f2efe6', 0, .82, .17); add(new T.BoxGeometry(.2, .12, .02), P.red, 0, .78, .185); }
    if (scarf) { add(rb(.5, .1, .36, .04), scarf, 0, 1.27, 0); add(rb(.1, .3, .04, .02), scarf, .12, 1.1, .18); }
    const head = new T.Group(); head.position.y = 1.56; g.add(head); parts.head = head;
    add(rb(.6, .56, .54, .17), P.skin, 0, 0, 0, head);
    add(new T.SphereGeometry(.042, 10, 10), P.ink, -.12, .01, .275, head);
    add(new T.SphereGeometry(.042, 10, 10), P.ink, .12, .01, .275, head);
    add(new T.BoxGeometry(.1, .025, .02), P.ink, 0, -.13, .272, head);
    if (mustache) add(rb(.24, .06, .04, .02), hair, 0, -.075, .28, head);
    if (glasses || sunglasses) { const c = sunglasses ? '#111' : glasses;
      [-.12, .12].forEach(x => add(new T.BoxGeometry(.17, .12, .02), c, x, .02, .285, head));
      if (!sunglasses) [-.12, .12].forEach(x => add(new T.BoxGeometry(.11, .07, .025), '#e9f6fb', x, .02, .286, head));
      add(new T.BoxGeometry(.08, .025, .02), c, 0, .04, .285, head); }
    if (headphones) { add(rb(.7, .06, .08, .02), headphones, 0, .34, 0, head); [-.33, .33].forEach(x => add(rb(.08, .2, .18, .03), headphones, x, .04, 0, head)); }
    if (chefHat) { add(new T.CylinderGeometry(.28, .26, .32, 18), '#ffffff', 0, .5, 0, head); add(new T.SphereGeometry(.34, 16, 12), '#ffffff', 0, .72, 0, head); }
    const hairG = new T.Group(); head.add(hairG);
    parts.setHair = (st) => { hairG.clear();
      const top = () => add(rb(.64, .22, .58, .09), hair, 0, .24, -.01, hairG);
      const back = (h=.42) => add(rb(.64, h, .16, .06), hair, 0, .28 - h/2 - .0, -.23, hairG);
      if (st === 'bald') { [-.31, .31].forEach(x => add(rb(.06, .18, .4, .02), hair, x, .02, -.04, hairG)); back(.2).position.y = .0; return; }
      if (st === 'curly') { [[-.2,.26,.1],[0,.3,.12],[.2,.26,.1],[-.22,.24,-.14],[.02,.3,-.12],[.22,.24,-.14],[-.28,.1,-.2],[.28,.1,-.2]].forEach(([x,y,z]) => add(new T.SphereGeometry(.15, 10, 8), hair, x, y, z, hairG)); return; }
      top();
      if (st === 'spiky') { back(); [[-.18,.03],[0,-.05],[.18,.03],[-.08,.15],[.1,.15]].forEach(([x,z]) => { const c = add(new T.ConeGeometry(.08, .2, 6), hair, x, .43, z, hairG); c.rotation.z = x*.8; }); return; }
      if (st === 'short') { back(); add(rb(.42, .1, .2, .04), hair, .08, .2, .22, hairG); return; }
      if (st === 'bun') { back(.36); add(new T.SphereGeometry(.17, 14, 12), hair, 0, .44, -.1, hairG); return; }
      if (st === 'ponytail') { back(.36); const t = add(rb(.16, .5, .16, .06), hair, 0, -.05, -.36, hairG); t.rotation.x = .25; add(new T.SphereGeometry(.06, 8, 8), P.yellow, 0, .2, -.32, hairG); return; }
      if (st === 'bob') { back(.5); [-.31, .31].forEach(x => add(rb(.1, .44, .44, .04), hair, x, .02, -.04, hairG)); add(rb(.5, .1, .14, .04), hair, -.05, .18, .22, hairG); return; }
      // long
      back(); add(rb(.66, .62, .2, .08), hair, 0, -.12, -.24, hairG);
      [-.31, .31].forEach(x => add(rb(.12, .5, .4, .05), hair, x, -.04, -.06, hairG));
    };
    parts.setHair(style);
    if (clip) add(new T.SphereGeometry(.07, 10, 8), clip, .3, .2, .1, head);
    g.scale.set(...scale);
    scene.add(g); return {g, parts, path:[], phase:0};
  }
  const tagHot = (c, id) => c.g.traverse(m => { if (m.isMesh) { m.userData.hot = id; hotMeshes.push(m); } });
  return {mat, box, textTex, faceMats, sign, plant, makeChar, tagHot, blockers, hotMeshes};
}

/* ---------- Walk grid (0.5 tile cells) + A*; walkable(x, z) leaves out ground that is not part of the map ---------- */
export function makeWalkGrid({W, D, blockers, walkable = () => true}){
  const CELL = .5, GW = Math.round(W/CELL), GD = Math.round(D/CELL), R = .22;
  const blocked = new Uint8Array(GW*GD);
  function buildGrid(){ blocked.fill(0);
    for (let i=0;i<GW;i++) for (let j=0;j<GD;j++){
      if (!walkable((i+.5)*CELL, (j+.5)*CELL)) { blocked[i+j*GW] = 1; continue; }
      const x0 = i*CELL - R, x1 = (i+1)*CELL + R, z0 = j*CELL - R, z1 = (j+1)*CELL + R;
      for (const b of blockers) if (x0 < b.x1 && x1 > b.x0 && z0 < b.z1 && z1 > b.z0) { blocked[i+j*GW] = 1; break; }
    } }
  buildGrid();
  const cellOf = (x, z) => [Math.max(0, Math.min(GW-1, Math.floor(x/CELL))), Math.max(0, Math.min(GD-1, Math.floor(z/CELL)))];
  function nearestFree(i, j){
    if (!blocked[i+j*GW]) return [i,j];
    for (let r=1;r<8;r++) for (let di=-r;di<=r;di++) for (let dj=-r;dj<=r;dj++){
      const a=i+di, b=j+dj; if (a>=0&&b>=0&&a<GW&&b<GD&&!blocked[a+b*GW]) return [a,b]; }
    return null;
  }
  function astar(s, t){
    const key = (i,j) => i + j*GW, open = new Map(), came = new Map(), gS = new Map();
    const h = (i,j) => Math.hypot(i-t[0], j-t[1]);
    open.set(key(...s), h(...s)); gS.set(key(...s), 0);
    while (open.size){
      let cur, best = Infinity; for (const [k,f] of open) if (f < best) { best = f; cur = k; }
      open.delete(cur); const ci = cur % GW, cj = (cur/GW)|0;
      if (ci === t[0] && cj === t[1]) { const path = []; let k = cur; while (k !== undefined){ path.unshift([(k%GW+.5)*CELL, (((k/GW)|0)+.5)*CELL]); k = came.get(k); } return path; }
      for (let di=-1;di<=1;di++) for (let dj=-1;dj<=1;dj++){
        if (!di && !dj) continue; const ni = ci+di, nj = cj+dj;
        if (ni<0||nj<0||ni>=GW||nj>=GD||blocked[key(ni,nj)]) continue;
        if (di && dj && (blocked[key(ci+di,cj)] || blocked[key(ci,cj+dj)])) continue;
        const g = gS.get(cur) + Math.hypot(di,dj), nk = key(ni,nj);
        if (g < (gS.get(nk) ?? Infinity)) { gS.set(nk, g); came.set(nk, cur); open.set(nk, g + h(ni,nj)); }
      }
    }
    return null;
  }
  const free = (x, z) => { if (x < R || z < R || x > W-R || z > D-R || !walkable(x, z)) return false;
    for (const b of blockers) if (x+R > b.x0 && x-R < b.x1 && z+R > b.z0 && z-R < b.z1) return false; return true; };
  // shared by player and client: plan a path for any character
  function planPath(c, x, z){
    const s = nearestFree(...cellOf(c.g.position.x, c.g.position.z)), t = nearestFree(...cellOf(x, z));
    if (!s || !t) return false; const p = astar(s, t); if (!p) return false;
    if (free(x, z)) p[p.length-1] = [x, z];
    c.path = p.slice(1); return true;
  }
  return {buildGrid, free, planPath};
}

/* ---------- Movement for any character built by makeChar ---------- */
export function stepChar(c, dt, speed){ // returns true while walking
  if (!c.path.length) return false;
  const pos = c.g.position, [tx, tz] = c.path[0], dx = tx - pos.x, dz = tz - pos.z, d = Math.hypot(dx, dz), step = speed*dt;
  if (d <= step) { pos.x = tx; pos.z = tz; c.path.shift(); }
  else { pos.x += dx/d*step; pos.z += dz/d*step; c.g.rotation.y = Math.atan2(dx, dz); }
  return true;
}
export function animateWalk(c, moving, dt){
  c.phase = moving ? c.phase + dt*10 : c.phase * .8;
  const sw = reduce ? 0 : Math.sin(c.phase) * (moving ? .6 : 0);
  c.parts.legL.rotation.x = sw; c.parts.legR.rotation.x = -sw; c.parts.armL.rotation.x = -sw*.8; c.parts.armR.rotation.x = sw*.8;
  c.g.position.y = moving && !reduce ? Math.abs(Math.sin(c.phase))*.05 : 0;
}

// shuffle bag: every line comes up once before any repeats, and never the same line twice in a row
/* ---------- Colleagues' looks (keyed by story id): one source for tầng Intern and the rented room (visits) ---------- */
export const NPC_LOOKS = {
  tuan: {shirt:'#d8e4f5', pants:'#2b2f3a', tie:P.red, hair:'#5a5a5a', style:'bald', mustache:true, scale:[1.1,1.02,1.1]},
  mai: {shirt:'#7a5cc2', hair:'#3a2418', pants:'#2b2f3a', style:'bob', clip:'#ff8fb1'},
  hang: {shirt:'#f6c9d0', hair:'#5a3322', style:'bun', glasses:P.red, scale:[.95,.93,.95]},
  linh: {shirt:'#cfe8d6', hair:'#1f1a17', pants:'#4a3b52', style:'ponytail', scarf:P.yellow},
  minh: {shirt:'#fbe7b0', hair:'#2b1d16', pants:'#2f4a3a', style:'spiky', headphones:'#e8505b', scale:[1,1.08,1]},
  tung: {shirt:'#b9dcf2', hair:'#3b2a1e', pants:'#3a3f55', style:'curly', lanyard:true, glasses:'#222'},
  // people who only appear in staged events (engine.js EXTRA_PEOPLE): same body, own colours (Lily 15/11)
  sep_tong: {shirt:'#2f3542', pants:'#2f3542', tie:'#e3b23c', hair:'#d9d9d9', style:'short', glasses:'#222', scale:[1.08,1.05,1.08]},
  chu_tro:  {shirt:'#e9a6a6', pants:'#6b4a3a', hair:'#6b6b6b', style:'bun', scale:[1.05,.95,1.05]},
  shipper:  {shirt:'#2fb36b', pants:'#2b2f3a', hair:'#2b1d16', style:'short', bag:true},
  hang_xom: {shirt:'#f2c14e', pants:'#3a4660', hair:'#1f1a17', style:'spiky', headphones:'#3c83ec'},
};

/* ---------- Scene change office → room: one quote per day, every trip a different line ---------- */
/* ---------- The player's look (opening "Ảnh thẻ hồ sơ", mo-dau.js): looks only, no stats (Lily 15/11) ----------
   White shirt + intern lanyard stay fixed so you always spot yourself; hair styles and accessories avoid every NPC's signature look. */
export const LOOKS = {
  hair:  [{id:'short', label:'Ngắn'}, {id:'long', label:'Dài'}],
  color: [{id:'den', label:'Đen', hex:'#2b1d16'}, {id:'hatde', label:'Nâu hạt dẻ', hex:'#6b3a22'}, {id:'nausang', label:'Nâu sáng', hex:'#a8703f'}],
  extra: [{id:'none', label:'Không'}, {id:'glasses', label:'Kính gọng vàng', short:'Kính', set:{glasses:'#c9a227'}}, {id:'bag', label:'Cặp tài liệu', short:'Cặp', set:{bag:true}}, {id:'clip', label:'Kẹp tóc', short:'Kẹp', set:{clip:'#f7d046'}}],
};
const pick = (list, id) => list.find(o => o.id === id) || list[0];
// makeChar options for a look; base = what the page dresses you in (pyjamas at home)
export const playerLook = (look = {}, base = {}) => ({lanyard:true, ...base, style:pick(LOOKS.hair, look.hair).id, hair:pick(LOOKS.color, look.color).hex, ...pick(LOOKS.extra, look.extra).set});

export const HOME_QUOTES = [
  "Xe buýt đông, nhưng ít ra không ai giao việc trên xe.",
  "Hết giờ làm rồi. Điện thoại vẫn rung, nhưng mình quyết định không nghe thấy.",
  "Ra khỏi thang máy là ra khỏi vai intern. Ít nhất là đến 8 giờ sáng mai.",
  "Kẹt xe 40 phút. Bằng đúng thời gian họp mà không ai nhớ đã bàn gì.",
  "Trên đường về, mình nhẩm lại những việc đã làm hôm nay. Nhẩm mãi không ra.",
  "Đèn đỏ 90 giây. Lần đầu tiên trong ngày mình được ngồi yên.",
  "Về đến nhà, con mèo nhìn mình như sếp nhìn intern đi về đúng giờ.",
  "Tiền lương chưa về, nhưng mình thì về rồi.",
  "Hôm nay không ai khen, không ai mắng. Một ngày thành công.",
  "Gói xôi mua lúc sáng vẫn còn trong cặp. Coi như bữa tối có sẵn.",
  "Ngoài kia trời đã tối. Trong nhóm chat công ty vẫn sáng đèn.",
  "Mình tự thưởng một ly trà sữa. Lý do: đã sống sót qua thêm một ngày.",
  "Đi bộ từ trạm xe về phòng, mình nghĩ ra câu trả lời hay cho cuộc họp sáng nay. Muộn rồi.",
  "Shipper gọi đúng lúc mình vừa lên tới tầng năm. Phòng trọ không có thang máy.",
  "Mẹ nhắn hỏi đi làm vui không. Mình gửi lại một cái sticker.",
  "Mưa đúng giờ tan làm. Hình như ông trời cũng có KPI riêng.",
  "Ngày mai là một ngày mới. Deadline thì vẫn là deadline cũ.",
  "Trên xe có người ngủ gật dựa vào vai mình. Ít ra mình cũng có ích cho một ai đó.",
  "Mình về phòng với một tâm hồn mệt mỏi và một túi rau muống giảm giá.",
  "Cả ngày nói 'dạ vâng' 37 lần. Về phòng mới được nói 'thôi' với chính mình.",
  "Bác bảo vệ khu trọ chào mình. Lời chào thật lòng đầu tiên trong ngày.",
  "Gió chiều mát. Không có điều hòa chỉnh theo nhiệt độ của anh Minh.",
  "Lương intern không đủ mua nhà, nhưng đủ thuê một căn phòng có mèo.",
  "Hôm nay mình học được một điều: 'nhanh thôi em' không bao giờ nhanh.",
  "Leo năm tầng cầu thang. Tập thể dục miễn phí, theo lời chị Mai lễ tân.",
  "Bước qua cửa phòng, mình tắt chế độ chuyên nghiệp, bật chế độ nằm.",
  "Ai đó trong xóm trọ đang nấu canh chua. Mùi của sự bình yên.",
  "Mình đếm ngược ngày thử việc. Còn nhiều hơn số tiền trong ví.",
  "Về muộn nửa tiếng vì sếp bảo 'em ở lại chút xíu'. Chút xíu của sếp dài lắm.",
  "Đèn đường vừa bật. Một ngày nữa trôi qua, mình vẫn ổn, theo kiểu của mình.",
  "Ví còn 48 nghìn. Mì gói hôm nay sẽ có thêm trứng.",
  "Hết ngày rồi. Những gì chưa xong, cứ để mai mình tính.",
];
export const homeQuote = day => HOME_QUOTES[(day - 1) % HOME_QUOTES.length];

/* ---------- Scene change room → office: "Sáng hôm sau", one quote per day ---------- */
export const OFFICE_QUOTES = [
  "Báo thức kêu lần thứ hai. Lần thứ ba là sếp gọi.",
  "Thẻ đã quẹt. Tinh thần chưa.",
  "Cà phê sữa đá trên tay, 47 email trong hộp thư. Một ngày cân bằng.",
  "Thang máy đông quá. Mình đứng chờ, coi như đã bắt đầu làm việc.",
  "Đến sớm năm phút. Không ai thấy, trừ chị Mai lễ tân.",
  "Nhóm chat công ty có 12 tin nhắn mới từ lúc 6 giờ sáng.",
  "Hôm nay mình hứa sẽ không nói 'dạ để em làm luôn'. Hứa vậy thôi.",
  "Bánh mì ăn dở trong cặp, laptop sạc dở trên vai.",
  "Bước vào sảnh, mình bật lại chế độ chuyên nghiệp. Đang khởi động.",
  "Trời đẹp quá. Rất hợp để ngồi trong phòng điều hòa làm báo cáo.",
  "Sếp đến sớm hơn mình. Hôm nay sẽ là một ngày dài.",
  "Mình đi làm với một trái tim nhiệt huyết và một cái bụng chưa ăn sáng.",
  "Thứ duy nhất đúng giờ ở công ty là giờ vào làm.",
  "Kẹt xe 30 phút, nhưng vẫn kịp. Hôm nay mình là người may mắn.",
  "Mở laptop lên, máy đòi cập nhật. Máy cũng chưa muốn đi làm.",
  "Mỗi sáng là một cơ hội mới. Cơ hội được giao thêm việc.",
  "Đi qua phòng sếp, mình bước nhẹ như ninja.",
  "Hôm qua để việc lại cho hôm nay. Hôm nay đến rồi.",
  "Cái cây góc phòng vẫn xanh. Ít ra một trong hai đứa mình ổn.",
  "Đồng hồ ở sảnh nhanh năm phút. Mình đi muộn mà nó bảo mình đi sớm.",
  "Chị Linh đứng ở cửa, tay cầm sổ thu quỹ. Mình đổi lối đi.",
  "Ngày thử việc thứ mấy rồi nhỉ? Mình đếm, rồi thôi không đếm nữa.",
  "Mình lại nhớ ra cái file 'làm luôn nhé em' từ chiều qua.",
  "Áo khoác đã mang. Điều hòa của anh Minh đã sẵn sàng.",
  "Người ta bảo đi làm là để trưởng thành. Mình đang trưởng thành từng email một.",
  "Sáng nay không ai nhắn gì. Nghi lắm.",
  "Mình chào cả phòng thật to. Anh Minh tháo một bên tai nghe ra rồi đeo lại.",
  "Tuần này mình sẽ làm tốt hơn. Câu này mình nói từ tuần trước.",
  "Xe buýt đến đúng giờ. Có lẽ hôm nay thật sự là một ngày đặc biệt.",
  "Ly trà đá sáng nay 5 nghìn. Rẻ hơn mọi thứ khác ở tòa nhà này.",
  "Cửa thang máy mở. Một ngày nữa bắt đầu, dù mình đã sẵn sàng hay chưa.",
  "Ngủ được sáu tiếng. Với intern, thế là một giấc ngủ dài.",
];
export const officeQuote = day => OFFICE_QUOTES[(day - 1) % OFFICE_QUOTES.length];
// the two cards of the day: going home after work, waking up for the office
export const homeCard = (dayName, day) => ({eyebrow:`${dayName} · 18:40`, title:'Về phòng trọ', sub:homeQuote(day)});
export const morningCard = (dayName, day) => ({eyebrow:`${dayName} · 07:30`, title:'Sáng hôm sau', sub:officeQuote(day)});
export function paintFade({eyebrow = '', title = '', sub = ''}){
  document.getElementById('fade-eyebrow').textContent = eyebrow; document.getElementById('fade-title').textContent = title; document.getElementById('fade-sub').textContent = sub; }
// hand the card to the next page: its inline script paints it on the first frame, so the cut does not flash
export function carryFade(card){ try { sessionStorage.setItem('ssns-fade', JSON.stringify(card)); } catch {} }

export function makeLineBag(){
  const bags = {}, lastLine = {};
  function nextLine(key, pool){
    let b = bags[key];
    if (!b?.length) {
      b = bags[key] = [...pool];
      for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
      if (b.length > 1 && b[b.length - 1] === lastLine[key]) b.unshift(b.pop());
    }
    return lastLine[key] = b.pop();
  }
  return nextLine;
}
