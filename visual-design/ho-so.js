// Hồ sơ người chơi (profile): what the player has collected across runs. Kept apart from the save of one run:
// "Chơi lại" clears the run, never this. Same three-op store as the save (load / save / clear), so a server can replace it later.
// Pure logic first (emptyProfile, sync, finish, newThisRun), then the browser store, then the collection screen.
import {hasFlag} from './engine.js';
import {feedbackNode} from './gop-y.js';

export const PROFILE_VERSION = 1;
export const emptyProfile = () => ({
  v: PROFILE_VERSION, created: Date.now(),
  seen: {},            // 'e:<ending>' | 'b:<badge flag>' | 'p:<card id>' -> runId in which it was first collected (the "Mới" tag)
  endings: {},         // ending id -> times reached
  badges: [], played: [], best: {},   // best closeness ever per person
  runs: [],            // last 20 finished runs
  ever: {},            // facts the gifts look at: lowPin (5 days with Pin < 20 in one run), burnout
  counters: {runsStarted: 0, runsFinished: 0, secondRuns: 0, shares: 0, lastDay: 0},
});

const keyOf = (kind, id) => kind + ':' + id;
function mark(p, kind, id, runId) { const k = keyOf(kind, id); if (!(k in p.seen)) { p.seen[k] = runId; return true; } return false; }

// Union what this run shows into the profile. s.played (cards answered) falls back to s.used for saves made before it existed.
export function sync(p, s, {badges = []} = {}) {
  let changed = false;
  s.runId ||= 'old' + (s.day || 0) + (s.name || '');
  for (const f of badges) if (hasFlag(s, f) && !p.badges.includes(f)) { p.badges.push(f); mark(p, 'b', f, s.runId); changed = true; }
  for (const id of s.played || s.used || []) if (!p.played.includes(id)) { p.played.push(id); mark(p, 'p', id, s.runId); changed = true; }
  for (const [n, v] of Object.entries(s.close || {})) if (v > (p.best[n] || 0)) { p.best[n] = v; changed = true; }
  const low = Object.values(s.dayLog || {}).filter(d => d.r).length;
  if (low >= 5 && !p.ever.lowPin) { p.ever.lowPin = true; changed = true; }
  if (s.day > p.counters.lastDay) { p.counters.lastDay = s.day; changed = true; }
  return changed;
}

// A run reached its end screen: counted once per runId.
export function finish(p, s, endingId) {
  if (p.runs.some(r => r.id === s.runId)) return false;
  sync(p, s, {badges: []});
  p.endings[endingId] = (p.endings[endingId] || 0) + 1; mark(p, 'e', endingId, s.runId);
  if (endingId === 'burnout') p.ever.burnout = true;
  p.counters.runsFinished++;
  p.runs.push({id: s.runId, day: s.day, ending: endingId, stats: {...s.stats}, meals: s.counters?.actions?.an_trua_co_ba || 0, gift: s.gift || null});
  if (p.runs.length > 20) p.runs.shift();
  return true;
}
// what this run collected first: {endings: [ids], badges: [flags], played: [ids]}
export function newThisRun(p, s) {
  const out = {endings: [], badges: [], played: []}, pre = {e: 'endings', b: 'badges', p: 'played'};
  for (const [k, run] of Object.entries(p.seen)) if (run === s.runId) out[pre[k[0]]].push(k.slice(2));
  return out;
}

export class BrowserProfileStore {
  constructor(key = 'ssns-profile') { this.key = key; }
  async load() { try { const v = JSON.parse(localStorage.getItem(this.key)); return v && v.v === PROFILE_VERSION ? v : null; } catch { return null; } }
  async save(p) { try { localStorage.setItem(this.key, JSON.stringify(p)); } catch { /* private mode: nothing is kept */ } }
  async clear() { try { localStorage.removeItem(this.key); } catch { /* nothing saved */ } }
}

// Anonymous counter (do-luong.json): events are counted in the profile always; they are sent only when do-luong.json names an
// endpoint (empty = nothing leaves the browser) and the player has not turned counting off (p.noTrack, in the collection).
// Payload: {v, id, run, e, day, k, r, n}: a random browser id, a random run id, the event and a few numbers. Never a name.
// e: open (k = page) | time (n = seconds on the page) | run_start | day | kpi (k = KPI id, r = dat|truot|lam_lo)
//    | minigame (k = game id, r = grade) | buy (k = item id) | run_end (k = ending) | second_run | share
let cfg;
const config = async () => (cfg ??= await fetch('do-luong.json').then(r => r.json()).catch(() => ({})));
const anonId = p => (p.anon ||= Math.random().toString(36).slice(2) + Date.now().toString(36));
async function send(p, e, data = {}) {
  try {
    if (p.noTrack) return;
    if (!(await config()).endpoint) return;
    anonId(p);
    navigator.sendBeacon(cfg.endpoint, JSON.stringify({v: 2, id: p.anon, e, ...data}));
  } catch { /* counting must never break the game */ }
}

// What this run did since the last report: [[e, data]]. Moves p.sent forward, so each fact is reported once per run,
// whichever page (office, rented room, tea shop) saw it first. A run met for the first time after day 1 (a save from
// before the counter existed) only reports its day: what it did earlier is taken as already known.
export function pending(p, s) {
  const out = [], run = s.runId, kpis = s.kpiLog || [], games = Object.entries(s.counters?.minigames || {}), owned = s.home?.owned || {};
  let m = p.sent;
  if (m?.run !== run) {
    const old = s.day > 1;
    m = p.sent = {run, day: 0, kpi: old ? kpis.length : 0, mg: old ? games.map(([id]) => id) : [], buy: old ? {...owned} : {}};
    if (!old) out.push(['run_start', {run, day: s.day}]);
  }
  if (s.day > m.day) { m.day = s.day; out.push(['day', {run, day: s.day}]); }
  for (const k of kpis.slice(m.kpi)) out.push(['kpi', {run, day: s.day, k: k.id, r: k.ignored ? 'lam_lo' : k.ok ? 'dat' : 'truot'}]);
  m.kpi = kpis.length;
  for (const [id, grade] of games) if (!m.mg.includes(id)) { m.mg.push(id); out.push(['minigame', {run, day: s.day, k: id, r: grade}]); }
  for (const [id, n] of Object.entries(owned)) for (; (m.buy[id] || 0) < n; m.buy[id] = (m.buy[id] || 0) + 1) out.push(['buy', {run, day: s.day, k: id}]);
  return out;
}

// Seconds the page was actually in view: sent each time it is hidden (tab switched, phone locked, page left).
function timeOnPage(p) {
  let since = document.visibilityState === 'visible' ? Date.now() : 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { since = Date.now(); return; }
    if (!since) return;
    const n = Math.round((Date.now() - since) / 1000); since = 0;
    if (n > 0) send(p, 'time', {k: location.pathname, n: Math.min(n, 4 * 3600)});
  });
}

// One handle per page: loads the profile, fills it from the save in hand, keeps it saved when it changes.
export async function open({badges = [], store = new BrowserProfileStore()} = {}) {
  const p = (await store.load()) || emptyProfile();
  const report = s => { const out = pending(p, s); if (out.length) store.save(p); for (const [e, d] of out) send(p, e, d); };
  send(p, 'open', {k: location.pathname}); timeOnPage(p);
  const fb = (await config()).feedback;
  return {
    p, store,
    sync(s) { if (sync(p, s, {badges})) store.save(p); report(s); },
    finish(s, endingId) { const first = !p.runs.some(r => r.id === s.runId); sync(p, s, {badges}); finish(p, s, endingId); store.save(p); report(s); if (first) send(p, 'run_end', {run: s.runId, day: s.day, k: endingId}); },
    // run_start | share: counted locally; share is also sent (run_start is sent by report, which knows the run id)
    track(e) {
      if (e === 'run_start') { p.counters.runsStarted++; if (p.counters.runsStarted > 1) { p.counters.secondRuns++; send(p, 'second_run'); } }
      if (e === 'share') { p.counters.shares++; send(p, 'share'); }
      store.save(p);
    },
    // the player's switch in the collection: off = nothing is sent from this browser
    setTracking(on) { p.noTrack = !on; store.save(p); },
    // the feedback box (gop-y.js) for this page; null while do-luong.json has no feedback address
    feedback(context) { return feedbackNode({endpoint: fb, id: () => { const had = p.anon; anonId(p); if (!had) store.save(p); return p.anon; }, context}); },
  };
}

/* ---------- Collection screen: five lists, "đã mở n/total"; what is not found yet shows ??? and one hint ---------- */
// Every list: [{id, name, line?}] built from the game data, in the order the data has them.
export function catalogue(rv, cards) {
  const byType = t => cards.filter(c => c.type === t).map(c => ({id: c.id, name: c.title}));
  return [
    {kind: 'e', name: 'Kết cục', items: [...rv.endings.map(e => ({id: e.id, name: e.title, line: e.verdict})), ...Object.entries(rv.early).map(([id, e]) => ({id, name: e.title, line: e.verdict}))]},
    {kind: 'b', name: 'Huy hiệu', items: Object.entries(rv.badges).map(([id, b]) => ({id, name: b.name, line: b.line}))},
    {kind: 'p', name: 'Chuyện ở trọ và ở công ty', items: byType('event'), note: 'Sự kiện bất ngờ buổi tối ở phòng trọ và giữa buổi ở công ty'},
    {kind: 'p', name: 'Ngày đặc biệt', items: byType('special_day')},
    {kind: 'p', name: 'Chuyện riêng của mỗi người', items: byType('character_event')},
  ];
}
const has = (p, kind, id) => kind === 'e' ? (p.endings[id] || 0) > 0 : kind === 'b' ? p.badges.includes(id) : p.played.includes(id);
export const counts = (p, cat) => cat.map(sec => [sec.items.filter(i => has(p, sec.kind, i.id)).length, sec.items.length]);

let cssDone = false;
function css() {
  if (cssDone) return; cssDone = true;
  const st = document.createElement('style');
  st.textContent = `.coll{max-height:min(62vh,560px);overflow-y:auto;padding-right:6px}
.coll h3{font:700 15px var(--font-display);margin:14px 0 4px;display:flex;justify-content:space-between;gap:8px}
.coll h3 span{font:600 12px var(--font-body);color:var(--muted)}
.coll .it{display:grid;grid-template-columns:1fr auto;gap:2px 8px;padding:6px 0;border-top:1px solid var(--rule);font-size:14px}
.coll .it b{font-weight:600}
.coll .it small{grid-column:1/-1;color:var(--muted);font-size:12.5px;line-height:1.35}
.coll .it.off b{color:var(--muted);letter-spacing:.12em}
.coll .tag{font:700 10px var(--font-body);background:var(--yellow);border:1.5px solid var(--ink);border-radius:999px;padding:1px 7px;align-self:start;text-transform:uppercase;letter-spacing:.06em}
.coll .foot{font-size:12px;color:var(--muted);margin-top:12px}
.coll .track{display:flex;gap:8px;align-items:flex-start;cursor:pointer}
.coll .track input{margin:2px 0 0;width:16px;height:16px;flex:none}
.gift{background:#fce6b6;display:grid;place-items:center;padding:24px 16px}
.gift .box{width:min(520px,100%);display:grid;gap:14px;justify-items:start}
.gift h1{font-size:clamp(30px,6vw,44px)}
.gift .lead{font-size:16px;line-height:1.5}
.gift .g-card{width:100%;box-sizing:border-box;background:var(--paper);border:2px solid var(--ink);border-radius:16px;box-shadow:0 3px 0 var(--ink);padding:12px 14px;display:grid;gap:8px;justify-items:start}
.gift .g-card b{font:800 20px var(--font-display)}
.gift .g-card span{font-size:14px;line-height:1.45}
.gift .g-card select{font:600 14px var(--font-body);padding:3px 6px;border:2px solid var(--ink);border-radius:8px;background:var(--paper)}
.gift .g-card .op-big{min-height:44px;font-size:16px;padding:2px 20px}`;
  document.head.appendChild(st);
}
const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

// The node for a modal body. runId (this run) puts "Mới" on what this run opened first.
// h (the handle from open()) adds the counting switch and the feedback box under the lists.
export function collectionNode(p, rv, cards, runId = null, h = null, context) {
  css();
  const cat = catalogue(rv, cards), root = mk('div', 'coll'), hints = rv.collection?.hints || {};
  cat.forEach((sec, i) => {
    const [got, total] = counts(p, [sec])[0], h = mk('h3', null, sec.name); h.appendChild(mk('span', null, `đã mở ${got}/${total}`)); root.appendChild(h);
    for (const it of sec.items) {
      const on = has(p, sec.kind, it.id), row = mk('div', 'it' + (on ? '' : ' off'));
      row.appendChild(mk('b', null, on ? it.name : '???'));
      if (on && runId && p.seen[keyOf(sec.kind, it.id)] === runId) row.appendChild(mk('span', 'tag', 'Mới'));
      if (on && it.line) row.appendChild(mk('small', null, it.line));
      if (!on && hints[it.id]) row.appendChild(mk('small', null, hints[it.id]));
      root.appendChild(row);
    }
  });
  root.appendChild(mk('p', 'foot', 'Bộ sưu tập lưu trên trình duyệt này, ván mới không làm mất.'));
  if (h) {
    const row = mk('label', 'foot track'), box = mk('input'); box.type = 'checkbox'; box.checked = !p.noTrack;
    box.onchange = () => h.setTracking(box.checked);
    row.append(box, mk('span', null, 'Cho game đếm lượt chơi ẩn danh (không tên, không IP) để làm game hay hơn.'));
    const fbBox = h.feedback(context);
    root.append(row, ...(fbBox ? [fbBox] : []));
  }
  return root;
}
// one line for the end screen: "Ván này bạn mở thêm 1 kết cục, 3 huy hiệu. Tổng: 2/9 kết cục, 9/18 huy hiệu."
export function summaryLine(p, rv, cards, s) {
  const n = newThisRun(p, s), cat = catalogue(rv, cards), [e, b] = counts(p, cat);
  const listed = new Set(cat.filter(x => x.kind === 'p').flatMap(x => x.items.map(i => i.id))); n.played = n.played.filter(id => listed.has(id));   // only events, special days, character events count
  const bits = [n.endings.length && `${n.endings.length} kết cục`, n.badges.length && `${n.badges.length} huy hiệu`, n.played.length && `${n.played.length} chuyện`].filter(Boolean);
  return (bits.length ? `Ván này bạn mở thêm ${bits.join(', ')}. ` : 'Ván này không mở thêm gì mới. ') + `Tổng: ${e[0]}/${e[1]} kết cục, ${b[0]}/${b[1]} huy hiệu.`;
}

/* ---------- Gifts for the next run (than-thiet.json gifts): which ones this profile has earned, and the screen to pick one ---------- */
// needs: {best: n} someone you were once this close to | {ending: id} reached that ending | {ever: [facts]} any of these happened (burnout, lowPin)
export function unlockedGifts(p, gifts) {
  const out = [];
  for (const g of gifts) {
    const n = g.needs || {}; let npcs = null, ok = true;
    if (n.best != null) { npcs = Object.keys(p.best).filter(k => p.best[k] >= n.best); ok = npcs.length > 0; }
    else if (n.ending) ok = (p.endings[n.ending] || 0) > 0;
    else if (n.ever) ok = n.ever.some(k => p.ever[k]);
    if (ok) out.push({...g, npcs});
  }
  return out;
}
// full-screen choice before the prologue; resolves {id, npc} or null (no gift)
export function giftScreen(texts, gifts, npcName) {
  css();
  return new Promise(done => {
    const root = mk('div', 'op-screen gift'), box = mk('div', 'box');
    box.append(mk('div', 'op-tag', texts.eyebrow), mk('h1', null, texts.title), mk('p', 'lead', texts.lead));
    const none = () => { root.remove(); done(null); };
    for (const g of gifts) {
      const card = mk('div', 'g-card'); card.append(mk('b', null, g.name), mk('span', null, g.line));
      let sel = null;
      if (g.npcs) { sel = mk('select'); for (const n of g.npcs) sel.appendChild(Object.assign(mk('option', null, npcName[n] || n), {value: n})); const row = mk('label', null, texts.pickNpc + ' '); row.appendChild(sel); card.appendChild(row); }
      const take = mk('button', 'op-big', 'Mang theo'); take.onclick = () => { root.remove(); done({id: g.id, npc: sel ? sel.value : null}); };
      card.appendChild(take); box.appendChild(card);
    }
    const skip = mk('button', 'op-soft', texts.none); skip.onclick = none; box.appendChild(skip);
    root.appendChild(box); document.body.appendChild(root); root.querySelector('button')?.focus();
  });
}
