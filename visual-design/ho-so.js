// Hồ sơ người chơi (profile): what the player has collected across runs. Kept apart from the save of one run:
// "Chơi lại" clears the run, never this. Same three-op store as the save (load / save / clear), so a server can replace it later.
// Pure logic first (emptyProfile, sync, finish, newThisRun), then the browser store, then the collection screen.
import {hasFlag} from './engine.js';

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

// Anonymous counter: events are counted in the profile always; they are sent only when do-luong.json names an endpoint (empty = nothing leaves the browser).
// The payload has a random browser id and the event, never a name.
let cfg;
async function send(p, e, data) {
  try {
    cfg ??= await fetch('do-luong.json').then(r => r.json()).catch(() => ({}));
    if (!cfg.endpoint) return;
    p.anon ||= Math.random().toString(36).slice(2) + Date.now().toString(36);
    navigator.sendBeacon(cfg.endpoint, JSON.stringify({v: 1, id: p.anon, e, ...data}));
  } catch { /* counting must never break the game */ }
}

// One handle per page: loads the profile, fills it from the save in hand, keeps it saved when it changes.
export async function open({badges = [], store = new BrowserProfileStore()} = {}) {
  const p = (await store.load()) || emptyProfile();
  return {
    p, store,
    sync(s) { if (sync(p, s, {badges})) store.save(p); },
    finish(s, endingId) { const first = !p.runs.some(r => r.id === s.runId); sync(p, s, {badges}); finish(p, s, endingId); store.save(p); if (first) send(p, 'run_end', {day: s.day, ending: endingId}); },
    // run_start | share: counted locally, sent if an endpoint is set
    track(e) {
      if (e === 'run_start') { p.counters.runsStarted++; if (p.counters.runsStarted > 1) { p.counters.secondRuns++; send(p, 'second_run', {}); } }
      if (e === 'share') p.counters.shares++;
      store.save(p); send(p, e, {});
    },
  };
}

/* ---------- Collection screen: the book of so.css with tabs Kết cục / Huy hiệu / Câu chuyện; what is not found yet is a "?" tile with one hint ---------- */
// Every list: [{id, name, line?}] built from the game data, in the order the data has them.
export function catalogue(rv, cards) {
  const byType = t => cards.filter(c => c.type === t).map(c => ({id: c.id, name: c.title, line: c.intro}));
  return [
    {kind: 'e', name: 'Kết cục', items: [...rv.endings.map(e => ({id: e.id, name: e.title, line: e.verdict})), ...Object.entries(rv.early).map(([id, e]) => ({id, name: e.title, line: e.verdict}))]},
    {kind: 'b', name: 'Huy hiệu', items: Object.entries(rv.badges).map(([id, b]) => ({id, name: b.name, line: b.line}))},
    {kind: 'p', name: 'Chuyện ở trọ và ở công ty', items: byType('event'), short: 'Ở trọ, ở công ty', note: 'Sự kiện bất ngờ buổi tối ở phòng trọ và giữa buổi ở công ty'},
    {kind: 'p', name: 'Ngày đặc biệt', items: byType('special_day')},
    {kind: 'p', name: 'Chuyện riêng của mỗi người', short: 'Chuyện riêng', items: byType('character_event')},
  ];
}
const has = (p, kind, id) => kind === 'e' ? (p.endings[id] || 0) > 0 : kind === 'b' ? p.badges.includes(id) : p.played.includes(id);
export const counts = (p, cat) => cat.map(sec => [sec.items.filter(i => has(p, sec.kind, i.id)).length, sec.items.length]);

let cssDone = false;
function css() {
  if (cssDone) return; cssDone = true;
  const st = document.createElement('style');
  st.textContent = `.gift{background:#fce6b6;display:grid;place-items:center;padding:24px 16px}
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

// The book (so.css, same as Chợ Trọ): three tabs, a progress line, sticker tiles, and one detail line for the tile you tap.
// Found first, then the empty slots; a hint shows only when you tap an empty slot. runId (this run) puts "Mới" on what this run opened first.
const TABS = [{kind: 'e', name: 'Kết cục', secs: [0]}, {kind: 'b', name: 'Huy hiệu', secs: [1]}, {kind: 'p', name: 'Câu chuyện', secs: [2, 3, 4]}];
const ICON = {   // one sticker per group until each item has its own picture
  e: '<path d="M6 3v18"/><path d="M6 4h11l-2 4 2 4H6"/>',
  b: '<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>',
  p: '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>',
};
// wrap: the page's empty, hidden <div class="cat-wrap">. The book closes with × or Escape; the page reads wrap.hidden to pause the game meanwhile.
export function openCollection(wrap, p, rv, cards, runId = null) {
  const cat = catalogue(rv, cards), hints = rv.collection?.hints || {}, isNew = (k, id) => runId && p.seen[keyOf(k, id)] === runId;
  const st = {tab: 0, sec: -1, sel: null};   // sec -1 = every list of the tab
  const book = mk('div', 'book'), tabs = mk('nav', 'tabs'), page = mk('div', 'page card'), x = mk('button', 'x', '×');
  const prog = mk('div', 'prog'), chips = mk('div', 'cats text'), grid = mk('div', 'grid'), detail = mk('div', 'detail');
  book.setAttribute('role', 'dialog'); book.setAttribute('aria-modal', 'true'); book.setAttribute('aria-label', 'Bộ sưu tập');
  tabs.setAttribute('role', 'tablist'); x.setAttribute('aria-label', 'Đóng'); chips.setAttribute('role', 'group');
  const head = mk('header'); head.append(mk('h2', null, 'Bộ sưu tập'), mk('p', null, 'Mở thêm qua mỗi ván chơi. Ván mới không làm mất.'));
  page.append(x, head, prog, chips, grid, detail); book.append(tabs, page); wrap.replaceChildren(book);
  const all = counts(p, cat).reduce((a, [g, t]) => [a[0] + g, a[1] + t], [0, 0]);
  const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };   // on the document: a re-render can drop the focus to <body>
  const close = () => { wrap.hidden = true; wrap.replaceChildren(); document.removeEventListener('keydown', onKey, true); };
  x.onclick = close; document.addEventListener('keydown', onKey, true);

  function render() {
    const tab = TABS[st.tab], secs = tab.secs.map(i => cat[i]);
    tabs.replaceChildren(...TABS.map((t, i) => { const b = mk('button', 'tab', t.name); b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', i === st.tab); b.onclick = () => { Object.assign(st, {tab: i, sec: -1, sel: null}); render(); }; return b; }));
    // progress: this tab, and the whole collection
    const [g, t] = counts(p, secs).reduce((a, [g, t]) => [a[0] + g, a[1] + t], [0, 0]), lbl = mk('div', 'lbl'), bar = mk('div', 'bar'), fill = mk('i');
    const half = (k, v) => { const s = mk('span', null, k + ': '); s.appendChild(mk('b', null, v)); return s; };
    lbl.append(half(tab.name, `${g}/${t}`), half('Cả bộ', `${all[0]}/${all[1]}`)); fill.style.width = (t ? 100 * g / t : 0) + '%'; bar.appendChild(fill); prog.replaceChildren(lbl, bar);
    // chips only where a tab holds several lists
    page.classList.toggle('no-cats', secs.length < 2); chips.hidden = secs.length < 2;
    chips.replaceChildren(...(secs.length < 2 ? [] : [{name: 'Tất cả'}, ...secs].map((s, i) => {
      const b = mk('button', null, (s.short || s.name) + ' '); b.setAttribute('aria-pressed', st.sec === i - 1);
      if (s.items) { const [sg, stt] = counts(p, [s])[0]; b.appendChild(mk('small', null, `${sg}/${stt}`)); }
      b.onclick = () => { Object.assign(st, {sec: i - 1, sel: null}); render(); }; return b; })));
    // tiles: found first (in data order), then the empty slots
    const items = (st.sec < 0 ? secs : [secs[st.sec]]).flatMap(s => s.items.map(i => ({...i, kind: s.kind, on: has(p, s.kind, i.id)})));
    items.sort((a, b) => b.on - a.on);
    grid.replaceChildren(...items.map(it => {
      const b = mk('button', 'tile ' + (it.on ? 'got' : 'off') + (st.sel === it.id ? ' sel' : ''));
      b.setAttribute('aria-label', it.on ? it.name : 'Chưa mở');
      if (it.on && isNew(it.kind, it.id)) b.appendChild(mk('span', 'pin new', 'Mới'));
      const pic = mk('span', 'pic', it.on ? null : '?'); if (it.on) pic.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[it.kind]}</svg>`;
      b.append(pic, mk('span', 'nm', it.on ? it.name : '???'));
      b.onclick = () => { st.sel = it.id; render(); grid.querySelector('.sel')?.focus(); };
      return b;
    }));
    // detail: the line of what you found, or the hint for an empty slot
    const it = items.find(i => i.id === st.sel), box = mk('div');
    if (!it) detail.replaceChildren(mk('p', 'hint-line', 'Bấm một ô để xem chi tiết.'));
    else if (it.on) { box.append(mk('b', null, it.name), mk('span', null, it.line || '')); detail.replaceChildren(box); }
    else { box.append(mk('b', null, 'Chưa mở'), mk('span', 'lock', hints[it.id] ? 'Gợi ý: ' + hints[it.id] : 'Chơi thêm vài ván, biết đâu lại gặp.')); detail.replaceChildren(box); }
  }
  render(); wrap.hidden = false; x.focus();
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
