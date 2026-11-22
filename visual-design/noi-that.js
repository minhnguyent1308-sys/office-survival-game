// Furniture for the rented room (phòng trọ), Lily 17/11. Data (names, prices, sizes, perks) lives in kich-ban/noi-that.json;
// this file only draws. One model = one function that returns a THREE.Group whose origin is the item's back-left floor corner,
// front facing +z (toward the camera), same box conventions as world.js. Adding a shop item = a json entry + one function here.
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {P} from './world.js';

// local builders: like world.js box(), but into a group, so an item can be moved, rotated, hidden or removed as one piece
function kitFor(g, mat){
  const box = (x, z, y, w, d, h, color, o = {}) => {
    const r = o.round ?? Math.min(.06, Math.min(w, d, h) * .25);
    const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new T.BoxGeometry(w, h, d);
    const m = new T.Mesh(geo, o.material || mat(color)); m.position.set(x + w/2, y + h/2, z + d/2);
    m.castShadow = o.cast ?? true; m.receiveShadow = true; g.add(m); return m;
  };
  const cyl = (x, y, z, rt, rb, h, color, o = {}) => {
    const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, o.seg || 18), o.material || mat(color)); m.position.set(x, y, z);
    m.castShadow = o.cast ?? true; m.receiveShadow = true; g.add(m); return m;
  };
  const ball = (x, y, z, r, color, s = [1, 1, 1], o = {}) => {
    const m = new T.Mesh(o.ico ? new T.IcosahedronGeometry(r, o.ico === true ? 0 : o.ico) : new T.SphereGeometry(r, 20, 14), o.material || mat(color));
    m.position.set(x, y, z); m.scale.set(...s); m.castShadow = o.cast ?? true; m.receiveShadow = true; g.add(m); return m;
  };
  return {box, cyl, ball};
}
const glow = (mat, c, k = .7) => mat(c, {emissive: c, emissiveIntensity: k});

export const MODELS = {
  // folding desk under the window (fixed slot): the laptop moves onto it
  banHoc(g, mat){ const {box} = kitFor(g, mat);
    box(0, 0, .72, 1.6, .75, .05, P.wood);
    box(0, 0, 0, .06, .75, .72, P.woodDark, {round: 0}); box(1.54, 0, 0, .06, .75, .72, P.woodDark, {round: 0});
    box(.06, .05, .4, 1.48, .04, .04, P.woodDark, {round: 0});                       // back brace
  },
  // plain wooden chair, back toward the camera (you sit facing the desk)
  gheGo(g, mat){ const {box} = kitFor(g, mat);
    box(0, 0, .45, .6, .56, .06, P.wood); box(0, .5, .5, .6, .06, .55, P.wood);
    [[.02, .02], [.54, .02], [.02, .48], [.54, .48]].forEach(([x, z]) => box(x, z, 0, .05, .05, .45, P.woodDark, {round: 0}));
  },
  // fabric wardrobe on a metal frame: sky-blue cover, zip down the middle, the right flap rolled up showing two shirts
  tuQuanAo(g, mat){ const {box, cyl} = kitFor(g, mat);
    box(0, 0, 1.5, 1.2, .55, .06, P.trim, {round: .02});                              // top
    [[0, 0], [1.16, 0], [0, .51], [1.16, .51]].forEach(([x, z]) => box(x, z, 0, .04, .04, 1.52, P.metalDark, {round: 0}));
    box(.02, .02, .12, 1.16, .51, 1.38, P.sky, {round: .04});                         // cover
    box(.59, .53, .14, .02, .015, 1.32, P.metalDark, {round: 0, cast: false});        // zip
    box(.64, .53, .5, .5, .02, .96, '#7fcbe9', {round: .02, cast: false});            // open panel
    box(.7, .55, .78, .16, .02, .62, P.shirt, {round: .02, cast: false}); box(.9, .55, .8, .16, .02, .6, P.pajama, {round: .02, cast: false});
    cyl(.89, 1.47, .555, .05, .05, .52, P.blue).rotation.z = Math.PI/2;               // rolled-up flap
  },
  // bean bag: a squashed blob with a raised back
  gheLuoi(g, mat){ const {ball} = kitFor(g, mat);
    ball(.45, .2, .5, .44, P.partition, [1, .52, 1]);
    ball(.45, .42, .22, .34, P.partition, [1.15, .9, .6]);
    ball(.45, .3, .62, .2, '#8fd0a8', [1.4, .35, .9]);                                // seat dent highlight
  },
  // bookshelf: 3 boards, books on the lower two, the badges you own on the top one (opts.badges = how many)
  keSach(g, mat, opts = {}){ const {box, cyl} = kitFor(g, mat);
    box(0, 0, 0, 1.0, .05, 1.4, P.woodDark, {round: 0});                              // back panel
    box(0, 0, 0, .05, .35, 1.4, P.wood, {round: 0}); box(.95, 0, 0, .05, .35, 1.4, P.wood, {round: 0});
    [0, .45, .9, 1.35].forEach(y => box(0, 0, y, 1.0, .35, .05, P.wood, {round: 0}));
    const books = [[P.red, .3], [P.blue, .34], [P.yellow, .28], [P.green, .32], [P.paper, .3], [P.red, .26], [P.blue, .33]];
    let x = .08; for (const [c, h] of books) { box(x, .07, .05, .1, .24, h, c, {round: .01}); x += .12; }
    x = .1; for (const [c, h] of books.slice(2, 6)) { box(x, .07, .5, .12, .24, h + .02, c, {round: .01}); x += .14; }
    box(.72, .1, .5, .18, .2, .06, P.paper, {round: .01}); box(.73, .1, .56, .16, .2, .05, P.yellow, {round: .01}); // lying stack
    const n = opts.badges ?? 3;
    for (let i = 0; i < Math.min(n, 4); i++) { cyl(.18 + i*.21, .99, .2, .07, .07, .02, P.gold).rotation.x = Math.PI/2; box(.16 + i*.21, .12, .95, .04, .04, .03, P.woodDark, {round: 0}); }
  },
  // big fiddle-leaf plant: tall pot, thin trunk, big leaves going up
  cayLon(g, mat){ const {cyl, ball} = kitFor(g, mat);
    cyl(.3, .22, .3, .26, .2, .44, P.pot); cyl(.3, .45, .3, .23, .23, .03, '#7a4a2a');
    cyl(.3, 1.0, .3, .03, .04, 1.1, P.woodDark, {seg: 8});
    const leaves = [[.12, .75, .05, .6], [-.14, .9, .1, -.5], [.1, 1.08, -.12, .9], [-.1, 1.22, -.05, -.9], [.13, 1.36, .1, .3], [-.12, 1.5, .05, -.3], [0, 1.65, -.04, 0]];
    for (const [dx, y, dz, a] of leaves) { const m = ball(.3 + dx, y, .3 + dz, .17, P.green, [1, .35, 1.25], {ico: 1}); m.rotation.set(.4, a, dx > 0 ? -.5 : .5); }
  },
  // low table with a notebook and a cup
  banTra(g, mat){ const {box} = kitFor(g, mat);
    box(0, 0, .26, 1.3, .9, .06, P.wood);
    [[.06, .06], [1.14, .06], [.06, .74], [1.14, .74]].forEach(([x, z]) => box(x, z, 0, .1, .1, .27, P.woodDark, {round: .02}));
    box(.3, .25, .32, .3, .3, .02, P.paper, {round: .01}); box(.8, .3, .32, .16, .16, .14, P.sky, {round: .04});
  },
  // nightstand: drawer, alarm clock, small lamp
  tuDauGiuong(g, mat){ const {box, cyl} = kitFor(g, mat);
    box(0, 0, 0, .55, .5, .5, P.wood); box(.05, .49, .28, .45, .02, .16, P.woodDark, {round: .01}); box(.24, .5, .34, .08, .02, .03, P.gold, {round: .01});
    box(.33, .12, .5, .14, .12, .1, P.red, {round: .03}); box(.36, .24, .53, .08, .01, .05, P.paper, {round: 0, cast: false});  // alarm clock + face
    cyl(.15, .56, .2, .05, .07, .12, P.dark); cyl(.15, .76, .2, .1, .16, .2, P.yellow, {material: glow(mat, P.yellow, .6)});
    const l = new T.PointLight('#ffd27a', 6, 5, 1.6); l.position.set(.3, 1.1, .3); g.add(l);   // the bedside glow comes with the nightstand
  },
  // floor lamp: round base, thin pole, warm shade (the page adds a small light at `light`)
  denCay(g, mat){ const {cyl} = kitFor(g, mat);
    cyl(.2, .02, .2, .17, .19, .04, P.dark); cyl(.2, .75, .2, .025, .025, 1.42, P.metalDark, {seg: 8});
    cyl(.2, 1.5, .2, .13, .2, .26, '#ffe2a0', {material: glow(mat, '#ffe2a0', .8)});
    const l = new T.PointLight('#ffd27a', 3, 3.2, 1.6); l.position.set(.2, 1.3, .2); g.add(l);
  },
  // rug: mint with a cream border and three stripes
  tham(g, mat){ const {box} = kitFor(g, mat);
    box(0, 0, 0, 2.6, 2.0, .02, P.trim, {round: 0, cast: false});
    box(.1, .1, .005, 2.4, 1.8, .02, P.rug, {round: 0, cast: false});
    [.55, .95, 1.35].forEach(z => box(.25, z, .01, 2.1, .08, .02, '#c6e8df', {round: 0, cast: false}));
  },
  // red floor cushion (the cat's favourite spot)
  demNgoi(g, mat){ const {box} = kitFor(g, mat);
    box(0, 0, 0, .5, .5, .1, P.red, {round: .05, cast: false}); box(.22, .22, .09, .06, .06, .02, '#c93c48', {round: .01, cast: false});
  },
  // fairy lights coiled in a glass jar: a dozen little glowing dots
  denDomDom(g, mat){ const {cyl, ball} = kitFor(g, mat);
    cyl(.15, .17, .15, .12, .12, .32, P.glass, {material: new T.MeshStandardMaterial({color: P.glass, transparent: true, opacity: .35, roughness: .1, depthWrite: false}), cast: false});
    cyl(.15, .35, .15, .1, .1, .05, P.woodDark);
    const dot = glow(mat, '#ffe27a', 1.4);
    g.userData.twinkle = dot;                                                          // the page makes it blink in the evening
    for (let i = 0; i < 12; i++) { const a = i * 2.4, r = .06 + (i % 3) * .015; ball(.15 + Math.cos(a)*r, .05 + i*.022, .15 + Math.sin(a)*r, .018, null, [1, 1, 1], {material: dot, cast: false}); }
  },
  // storage box (thùng đồ, Lily 17/11): sold first in Chợ Trọ (40 nghìn); bought items that are not placed live in it
  thungDo(g, mat){ const {box} = kitFor(g, mat);
    box(0, 0, 0, .62, .46, .4, '#c8925a', {round: .02});
    box(-.02, -.02, .4, .66, .5, .05, '#b37d47', {round: .02});                         // lid
    box(.04, .2, .44, .54, .06, .02, '#e8d3a8', {round: 0, cast: false});                // tape
    box(.16, .465, .12, .3, .01, .14, P.paper, {round: 0, cast: false});                 // label
  },
  // small pothos: little pot, a few leaves, one trailing over the edge
  chauCayNho(g, mat){ const {cyl, ball} = kitFor(g, mat);
    cyl(.15, .1, .15, .13, .1, .2, P.pot);
    [[0, .3, 0, .1], [.07, .36, -.04, .08], [-.07, .34, .03, .085], [.02, .42, .02, .07]].forEach(([dx, y, dz, r]) => ball(.15 + dx, y, .15 + dz, r, P.green, [1, .8, 1], {ico: 0}));
    [[.12, .16, .22], [.16, .09, .26]].forEach(([dx, y, dz]) => ball(.15 + dx, y, dz, .05, P.green, [1, .6, 1], {ico: 0})); // trailing vine
  },
  /* ---------- Room styles (Lily 18/11, concepts in visual-design/phong-cach/). Wall items (`wall` in the json): back against z = 0, hung above the floor ---------- */
  // Ấm cúng: a string of warm bulbs, sagging in two loops across the wall
  dayDenTuong(g, mat){ const {ball} = kitFor(g, mat), bulb = glow(mat, '#ffd98a', 1.6);
    for (let i = 0; i <= 16; i++) { const t = i/16; ball(.05 + t*1.9, 2.45 - Math.sin(t*Math.PI*2) ** 2 * .3, .06, .04, null, [1, 1, 1], {material: bulb, cast: false}); }
    const l = new T.PointLight('#ffcf7a', 1.6, 2.6, 1.6); l.position.set(1, 2.1, .4); g.add(l);
  },
  // Ấm cúng: round wool rug, three rings of terracotta and cream
  thamTronLen(g, mat){ const {cyl} = kitFor(g, mat);
    cyl(.8, .01, .8, .8, .8, .02, '#f2dcc0', {seg: 40, cast: false}); cyl(.8, .02, .8, .62, .62, .02, '#c8663f', {seg: 40, cast: false}); cyl(.8, .03, .8, .4, .4, .02, '#f2dcc0', {seg: 40, cast: false});
  },
  // Ấm cúng: rattan basket with a folded wool blanket
  gioMay(g, mat){ const {cyl, box} = kitFor(g, mat);
    cyl(.25, .2, .25, .25, .2, .4, '#c99a5b'); cyl(.25, .4, .25, .26, .26, .03, '#a87a40');
    box(.03, .09, .32, .44, .3, .16, '#c8553d', {round: .07}); box(.1, .17, .4, .3, .2, .16, '#f6e3c8', {round: .07});
  },
  // Ấm cúng: wall shelf with three pots of trailing pothos
  keCayRu(g, mat){ const {box, cyl, ball} = kitFor(g, mat);
    box(0, 0, 1.9, 1.2, .3, .05, P.wood, {round: .01}); [.08, 1.08].forEach(x => box(x, 0, 1.75, .04, .25, .15, P.woodDark, {round: 0}));
    [[.2, .45], [.6, .65], [1.0, .35]].forEach(([x, len]) => { cyl(x, 2.05, .15, .1, .08, .2, P.pot);
      for (let k = 0; k < 6; k++) ball(x + (k % 2 ? .05 : -.05), 2.1 - k*len/5, .2, .06, P.green, [1, .7, 1], {ico: 0}); });
  },
  // Ấm cúng: three vanilla candles on a wooden tray, flames glowing
  nenThom(g, mat){ const {box, cyl, ball} = kitFor(g, mat), flame = glow(mat, '#ffb347', 2);
    box(.02, .02, 0, .31, .31, .03, P.wood, {round: .01});
    [[.1, .12, .12], [.22, .14, .09], [.14, .24, .07]].forEach(([x, z, h]) => { cyl(x, .03 + h/2, z, .045, .045, h, '#fff1dc'); ball(x, .03 + h + .03, z, .02, null, [1, 1.6, 1], {material: flame, cast: false}); });
    const l = new T.PointLight('#ffb35a', 1.2, 1.8, 1.6); l.position.set(.17, .45, .17); g.add(l);
  },
  // Dễ thương: big teddy bear with a pink bow, sitting
  gauBong(g, mat){ const {ball, box} = kitFor(g, mat), c = '#d9a074', l = '#f6d7b8';
    ball(.35, .3, .33, .32, c, [1, .95, .9]); ball(.35, .78, .38, .24, c); [-.17, .17].forEach(a => ball(.35 + a, .98, .36, .08, c));
    ball(.35, .74, .6, .09, l, [1, .8, .7]); ball(.35, .3, .62, .16, l, [1, 1, .4]); [-.08, .08].forEach(a => ball(.35 + a, .82, .58, .025, P.ink));
    [-.3, .3].forEach(a => ball(.35 + a, .38, .43, .1, c, [1, 1.4, 1])); [-.15, .15].forEach(a => ball(.35 + a, .08, .6, .11, c, [1, .8, 1.3]));
    box(.27, .48, .58, .16, .06, .07, '#ff8fab', {round: .03});
  },
  // Dễ thương: cloud-shaped wall lamp, soft white
  denMay(g, mat){ const {ball} = kitFor(g, mat), m = mat('#ffffff', {emissive: '#fff4f8', emissiveIntensity: .45});
    [[.3, 2.05, .22], [.58, 2.15, .3], [.86, 2.07, .24], [.58, 1.95, .24]].forEach(([x, y, r]) => ball(x, y, .08, r, null, [1, .8, .3], {material: m, cast: false}));
    const l = new T.PointLight('#fff1e0', 1.6, 2.6, 1.6); l.position.set(.55, 2, .5); g.add(l);
  },
  // Dễ thương: bunting, ten pastel triangles on a sagging string
  coPastel(g, mat){ const cols = ['#ffc4d6', '#cdeee0', '#ffe08a', '#d6c8ff'];
    for (let k = 0; k < 10; k++) { const t = (k + .5)/10, m = new T.Mesh(new T.ConeGeometry(.1, .22, 3), mat(cols[k % 4])); m.rotation.x = Math.PI;
      m.position.set(.1 + k*.24, 2.63 - Math.sin(t*Math.PI) * .2, .06); m.castShadow = true; g.add(m); }
  },
  // Dễ thương: round pink rug with two cat ears
  thamTaiMeo(g, mat){ const {cyl} = kitFor(g, mat);
    cyl(.85, .01, .9, .8, .8, .02, '#ffffff', {seg: 40, cast: false}); cyl(.85, .02, .9, .73, .73, .02, '#ffd6e2', {seg: 40, cast: false});
    [-.42, .42].forEach(a => { const e = cyl(.85 + a, .015, .24, .26, .26, .02, '#ffd6e2', {seg: 3, cast: false}); e.rotation.y = Math.PI/2; });
  },
  // Dễ thương: big glass jar of five-colour sweets
  huKeo(g, mat){ const {cyl, ball} = kitFor(g, mat);
    ['#ff8fab', '#8fd6a3', '#ffe08a', '#b9a7ff', '#7ad7ff', '#ff8fab', '#ffe08a'].forEach((c, k) => ball(.15 + Math.cos(k*1.7)*.06, .06 + k*.045, .15 + Math.sin(k*1.7)*.06, .05, c));
    cyl(.15, .2, .15, .12, .12, .4, P.glass, {material: new T.MeshStandardMaterial({color: P.glass, transparent: true, opacity: .35, roughness: .1, depthWrite: false}), cast: false});
    cyl(.15, .42, .15, .125, .125, .05, '#ff8fab');
  },
  // Wibu: two posters of original chibi girls (no real anime character), "がんばって" / "おつかれ"
  posterAnime(g, mat){ const {box} = kitFor(g, mat);
    const chibi = (hair, eye, bg, word) => { const c = document.createElement('canvas'); c.width = 220; c.height = 300; const x = c.getContext('2d');
      x.fillStyle = bg; x.fillRect(0, 0, 220, 300); x.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 14; k++) { x.beginPath(); x.arc((k*53) % 220, (k*97) % 300, 3 + k % 4, 0, 7); x.fill(); }
      x.fillStyle = hair; x.beginPath(); x.arc(110, 130, 78, Math.PI, 0); x.lineTo(188, 250); x.lineTo(32, 250); x.closePath(); x.fill();
      x.fillStyle = '#ffe3d1'; x.beginPath(); x.ellipse(110, 150, 60, 64, 0, 0, 7); x.fill();
      x.fillStyle = hair; x.beginPath(); x.moveTo(48, 130); x.quadraticCurveTo(110, 60, 172, 130); x.lineTo(150, 112); x.lineTo(128, 135); x.lineTo(108, 108); x.lineTo(86, 135); x.lineTo(66, 112); x.closePath(); x.fill();
      [86, 134].forEach(a => { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(a, 160, 13, 18, 0, 0, 7); x.fill(); x.fillStyle = eye; x.beginPath(); x.ellipse(a, 163, 10, 14, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(a - 4, 156, 4, 0, 7); x.fill(); });
      x.fillStyle = '#ff9fb5'; [70, 150].forEach(a => { x.beginPath(); x.ellipse(a, 185, 10, 5, 0, 0, 7); x.fill(); });
      x.strokeStyle = '#7a3a4a'; x.lineWidth = 3; x.beginPath(); x.arc(110, 186, 8, .2, Math.PI - .2); x.stroke();
      x.fillStyle = '#fff'; x.font = '700 30px sans-serif'; x.textAlign = 'center'; x.fillText(word, 110, 285);
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return new T.MeshStandardMaterial({map: t, roughness: .8}); };
    [[0, chibi('#ff8fc8', '#5b4bd6', '#7ad7ff', 'がんばって')], [.85, chibi('#ffd166', '#2f9e6e', '#ff8fc8', 'おつかれ')]].forEach(([x, face]) => {
      box(x + .02, 0, 1.38, .74, .03, .99, '#f4f4fa', {round: .01, cast: false});
      const faces = Array(6).fill(mat('#f4f4fa')); faces[4] = face;
      box(x + .04, .02, 1.4, .7, .03, .95, null, {round: 0, cast: false, material: faces}); });
  },
  // Wibu: lit glass cabinet, three shelves of little figures
  tuFigure(g, mat){ const {box, cyl, ball} = kitFor(g, mat), w = '#eeeef4';
    box(0, 0, 0, .6, .04, 1.5, w, {round: 0}); box(0, 0, 0, .03, .4, 1.5, w, {round: 0}); box(.57, 0, 0, .03, .4, 1.5, w, {round: 0});
    box(0, 0, 0, .6, .4, .38, w, {round: .02}); box(0, 0, 1.48, .6, .4, .04, w, {round: 0});
    box(.03, .37, .4, .54, .02, 1.08, '#cfefff', {round: 0, cast: false, material: new T.MeshStandardMaterial({color: '#cfefff', transparent: true, opacity: .22, roughness: .05, depthWrite: false})});
    [.4, .76, 1.12].forEach((y, r) => { box(.03, .03, y, .54, .34, .03, '#ffffff', {round: 0});
      ['#ff8fc8', '#7ad7ff', '#ffd166'].forEach((c, k) => { const fx = .12 + k*.18, fz = .2;
        cyl(fx, y + .06, fz, .035, .045, .06, '#2c3152'); cyl(fx, y + .15, fz, .03, .045, .12, ['#ffffff', '#2c3152', '#ff5d8f'][(k + r) % 3]);
        ball(fx, y + .27, fz, .055, '#ffe3d1'); ball(fx, y + .3, fz - .01, .06, c, [1, .8, 1]); }); });
    const l = new T.PointLight('#ffffff', .8, 1.4, 1.6); l.position.set(.3, 1.3, .5); g.add(l);
  },
  // Wibu: long body pillow lying on the bed (fixed spot tren_giuong)
  goiOm(g, mat){ const {box} = kitFor(g, mat);
    box(0, 0, .48, .28, 1.2, .16, '#ffffff', {round: .08});
    box(.02, .08, .63, .24, .36, .02, '#ffd166', {round: .01, cast: false}); box(.04, .5, .63, .2, .55, .02, '#ff8fc8', {round: .01, cast: false});
  },
  // Wibu: LED strip high on the wall, five colours
  ledRgb(g, mat){ const {box} = kitFor(g, mat), cols = ['#ff5d8f', '#ff8fc8', '#b18cff', '#7ad7ff', '#7dffc8'];
    for (let k = 0; k < 10; k++) box(k*.3, .01, 2.82, .3, .04, .05, null, {round: 0, cast: false, material: glow(mat, cols[k % 5], 1.6)});
    const l = new T.PointLight('#ff8fc8', 1.6, 3.5, 1.6); l.position.set(1.5, 2.5, .6); g.add(l);
  },
  // Wibu: beckoning lucky cat on a small wooden stand
  meoVayTay(g, mat){ const {box, ball} = kitFor(g, mat), w = '#ffffff';
    box(.02, .02, 0, .31, .31, .5, P.wood, {round: .02});
    ball(.17, .62, .17, .1, w, [1, 1.1, .9]); ball(.17, .78, .17, .085, w); ball(.26, .82, .2, .03, w, [1, 1.6, 1]);
    [-.05, .05].forEach(a => { const e = new T.Mesh(new T.ConeGeometry(.03, .06, 4), mat(w)); e.position.set(.17 + a, .87, .17); g.add(e); });
    ball(.17, .69, .25, .03, '#ffd166'); box(.13, .23, .66, .08, .02, .015, '#ff5d8f', {round: 0, cast: false});
    [-.03, .03].forEach(a => ball(.17 + a, .79, .245, .012, P.ink));
  },
  // Tầng Junior (Lily 22/11): the bigger room is sold as its key, on a tag with the room number
  chiaKhoa(g, mat){ const {box, cyl} = kitFor(g, mat);
    box(.04, .04, 0, .32, .32, .04, P.trim, {round: .02});                           // little dish it lies in
    cyl(.14, .08, .16, .07, .07, .02, P.gold); cyl(.14, .08, .16, .035, .035, .03, P.trim);  // key ring end
    box(.13, .2, .06, .04, .14, .02, P.gold, {round: .005}); box(.17, .3, .06, .04, .03, .02, P.gold, {round: .005}); // blade + tooth
    box(.2, .06, .06, .12, .1, .015, P.red, {round: .01});                             // tag
  },
  // wallpaper / flooring (surface items): a corner of a room with the two walls or the floor in the item's colours
  gocPhong(g, mat, {item} = {}){ const {box} = kitFor(g, mat), wall = item?.surface === 'wall', floor = item?.surface === 'floor';
    const tex = (w, h, side = 0) => new T.MeshStandardMaterial({map: surfaceTexture(item, w, h, 32, side), roughness: .9});
    box(0, 0, 0, .9, .9, .06, P.plankB, {round: 0, material: floor ? tex(.9, .9) : mat(P.plankB)});
    box(0, 0, .06, .05, .9, .8, P.wallL, {round: 0, material: wall ? tex(.9, .8) : mat(P.wallL)});
    box(.05, 0, .06, .85, .05, .8, P.wallB, {round: 0, material: wall ? tex(.9, .8, 1) : mat(P.wallB)});
  },
};
// Wallpaper and flooring as a texture, w x h in room units (Lily 22/11). Colours and pattern come from noi-that.json; on a wall the
// first colour is the left wall, so the back wall passes side = 1. k = pixels per unit (nearest filter keeps the blocky look).
export function surfaceTexture(item, w, h, k = 16, side = 0){
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w*k)); c.height = Math.max(1, Math.round(h*k)); const x = c.getContext('2d');
  const [a, b] = item.colors, base = item.surface === 'wall' ? item.colors[side] : a;
  x.fillStyle = base; x.fillRect(0, 0, c.width, c.height);
  const u = Math.max(1, Math.round(k/4));
  if (item.pattern === 'soc') { x.fillStyle = shade(base, -.07); for (let i = 0; i < c.width; i += u*2) x.fillRect(i, 0, Math.max(1, u >> 1), c.height); }
  if (item.pattern === 'cham') { x.fillStyle = '#ffffff'; for (let i = 0; i < c.width; i += u*2) for (let j = (i/(u*2)) % 2 ? u : 0; j < c.height; j += u*2) x.fillRect(i, j, Math.max(1, u >> 1), Math.max(1, u >> 1)); }
  if (item.pattern === 'van_go') for (let j = 0; j < c.height; j += u) for (let i = 0; i < c.width; i += u*4) { x.fillStyle = ((i/(u*4) + j/u) % 2) ? b : a; x.fillRect(i + ((j/u) % 2) * u*2, j, u*4, u); }
  if (item.pattern === 'gach') for (let i = 0; i < c.width; i += u*2) for (let j = 0; j < c.height; j += u*2) { x.fillStyle = ((i + j)/(u*2)) % 2 ? b : a; x.fillRect(i, j, u*2, u*2); }
  if (item.pattern === 'tham') for (let i = 0; i < c.width; i++) for (let j = 0; j < c.height; j++) if ((i*7 + j*13) % 5 === 0) { x.fillStyle = b; x.fillRect(i, j, 1, 1); }
  const t = new T.CanvasTexture(c); t.magFilter = T.NearestFilter; t.colorSpace = T.SRGBColorSpace; return t;
}
const shade = (hex, k) => '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 + k)))).toString(16).padStart(2, '0')).join('');

// Builds one item from its json entry and places it: x, z = floor corner after rotation, rot = quarter turns (1 = front faces +x).
// Returns {g, rect} where rect is the footprint on the floor (for blockers and hotspots later).
export function placeItem(scene, mat, item, {x = 0, z = 0, rot = 0} = {}, opts = {}){
  const inner = new T.Group(); MODELS[item.model](inner, mat, {...opts, item});
  const [w, d] = item.size, turned = rot % 2 === 1, W = turned ? d : w, D = turned ? w : d;
  inner.position.set(-w/2, 0, -d/2);
  const g = new T.Group(); g.add(inner); g.rotation.y = rot * Math.PI/2; g.position.set(x + W/2, 0, z + D/2);
  g.userData.item = item.id; scene.add(g);
  return {g, rect: {x0: x, z0: z, x1: x + W, z1: z + D}};
}
