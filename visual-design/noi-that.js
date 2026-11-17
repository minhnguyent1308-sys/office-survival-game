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
};

// Builds one item from its json entry and places it: x, z = floor corner after rotation, rot = quarter turns (1 = front faces +x).
// Returns {g, rect} where rect is the footprint on the floor (for blockers and hotspots later).
export function placeItem(scene, mat, item, {x = 0, z = 0, rot = 0} = {}, opts = {}){
  const inner = new T.Group(); MODELS[item.model](inner, mat, opts);
  const [w, d] = item.size, turned = rot % 2 === 1, W = turned ? d : w, D = turned ? w : d;
  inner.position.set(-w/2, 0, -d/2);
  const g = new T.Group(); g.add(inner); g.rotation.y = rot * Math.PI/2; g.position.set(x + W/2, 0, z + D/2);
  g.userData.item = item.id; scene.add(g);
  return {g, rect: {x0: x, z0: z, x1: x + W, z1: z + D}};
}
