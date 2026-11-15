// Mini-game player for "Sống sót nơi công sở". Content lives in minigames.json; this file only knows how each KIND plays.
// A new game of an existing kind (sort | schedule | quiz) = a new object in minigames.json, no code.
// A new kind = one more entry in KINDS below: play(ctx) -> Promise<{score, max, extras?, detail?}>.
// The page owns the rules (engine.js gradeOf / playMinigame); this file never touches stats.

/* ---------- styles: use the page's design tokens (--ink, --paper, --accent ...) ---------- */
const CSS = `
.mg-wrap{position:fixed;inset:0;z-index:9;background:rgba(42,34,48,.55);display:grid;place-items:center;padding:16px}
.mg{width:min(720px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:16px 18px;display:grid;gap:10px;box-sizing:border-box}
.mg .eyebrow{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);font-weight:600}
.mg h2{margin:0;font:800 24px/1.1 var(--font-display)}
.mg p{margin:0;font-size:15px;line-height:1.5}
.mg .howto{font-size:13px;color:var(--muted)}
.mg .perk{font:600 12px var(--font-body);border:1.5px solid var(--ink);border-radius:999px;padding:2px 10px;background:var(--up);justify-self:start}
.mg .row{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
.mg-top{display:grid;grid-template-columns:1fr auto;gap:6px 12px;align-items:center}
.mg-time{grid-column:1/-1;height:10px;border-radius:99px;background:var(--rule);border:1.5px solid var(--ink);overflow:hidden}
.mg-time i{display:block;height:100%;background:var(--pin);transition:width .2s linear}
.mg-time.low i{background:var(--accent)}
.mg-score{font:800 18px var(--font-display);font-variant-numeric:tabular-nums}
.mg-count{display:grid;place-items:center;min-height:180px;font:800 72px var(--font-display)}
.mg-flash{animation:mg-pop .35s ease}
@keyframes mg-pop{0%{transform:scale(1.06)}100%{transform:none}}
/* sort */
.mg-mail{border:2px solid var(--ink);border-radius:12px;background:#fff;padding:14px 16px;box-shadow:0 3px 0 var(--ink);display:grid;gap:4px;touch-action:none;cursor:grab;user-select:none}
.mg-mail small{color:var(--muted);font-size:12px}
.mg-mail b{font-size:16px;line-height:1.35}
.mg-mail.ok{background:var(--up)} .mg-mail.bad{background:var(--down)}
.mg-left{font-size:12px;color:var(--muted)}
.mg-bins{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:8px}
.mg-bin{font:700 15px var(--font-body);min-height:72px;border:2px dashed var(--ink);border-radius:12px;background:var(--paper);color:var(--ink);cursor:pointer;display:grid;place-items:center;gap:2px;padding:8px}
.mg-bin kbd{font:600 11px var(--font-body);color:var(--muted)}
.mg-bin.hot{background:#fff4d6;border-style:solid}
/* schedule */
.mg-day{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:4px}
.mg-slot{min-height:64px;border:2px dashed var(--lock);border-radius:8px;display:grid;align-content:start;padding:3px;font-size:11px;color:var(--muted);background:var(--paper);cursor:pointer;position:relative}
.mg-slot.hot{border-color:var(--ink);background:#fff4d6}
.mg-slot.can{border-color:var(--ink)}
.mg-placed{position:absolute;top:18px;bottom:3px;left:3px;border:2px solid var(--ink);border-radius:6px;background:#dbe8fb;color:var(--ink);font:600 11px/1.25 var(--font-body);padding:3px 4px;overflow:hidden;cursor:pointer;z-index:1}
.mg-placed.late{background:var(--down);text-decoration:line-through}
.mg-placed.boss{background:#fde6e7}
.mg-tray{display:flex;flex-wrap:wrap;gap:6px;min-height:58px;border:2px dashed var(--rule);border-radius:10px;padding:6px}
.mg-task{border:2px solid var(--ink);border-radius:8px;background:#fff;padding:5px 8px;font-size:12px;line-height:1.3;cursor:grab;touch-action:none;user-select:none;max-width:220px;box-shadow:0 2px 0 var(--ink);text-align:left}
.mg-task b{display:block;font-size:13px}
.mg-task small{color:var(--muted)}
.mg-task.sel{background:#fff4d6;outline:3px solid var(--accent)}
.mg-task.boss{border-color:var(--accent)}
.mg-task.new{animation:mg-drop .4s ease}
@keyframes mg-drop{0%{transform:translateY(-14px);opacity:0}100%{transform:none;opacity:1}}
.mg-boss{font:600 13px var(--font-body);background:var(--accent);color:#fff;border:2px solid var(--ink);border-radius:12px;padding:6px 12px;justify-self:start}
.mg-empty{font-size:12px;color:var(--muted);align-self:center}
/* quiz */
.mg-q{font:800 20px/1.25 var(--font-display)}
.mg-answers{display:grid;gap:8px}
.mg-answer{text-align:left;font:500 14px/1.4 var(--font-body);background:var(--paper);color:var(--ink);border:2px solid var(--ink);border-radius:10px;padding:8px 12px;cursor:pointer;box-shadow:0 2px 0 var(--ink)}
.mg-answer:hover:not(:disabled){background:#fff4d6}
.mg-answer b{color:var(--accent);margin-right:6px}
.mg-answer small{display:block;color:var(--muted);font-size:12px;margin-top:2px}
.mg-answer.picked{background:#fff4d6}
.mg-answer:disabled{cursor:default}
.mg-ghost{position:fixed;z-index:11;pointer-events:none;opacity:.9;transform:translate(-50%,-50%) rotate(-2deg)}
@media (max-width:560px){.mg{padding:12px}.mg-slot{min-height:84px}.mg-placed{font-size:10px}.mg h2{font-size:21px}.mg-tray{display:grid;grid-template-columns:1fr 1fr}.mg-task{max-width:none;font-size:11px;padding:4px 6px}.mg-task b{font-size:12px}.mg-bin{min-height:88px}}
@media (prefers-reduced-motion:reduce){.mg-flash,.mg-task.new{animation:none}.mg-time i{transition:none}}
`;
let styled = false;
function style() { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const shuffled = (list, on = true) => { const a = [...list]; if (on) for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- clock: counts down, pauses while the tab is hidden, can lose time ---------- */
function clock(seconds, onTick) {
  let left = seconds, last = performance.now(), raf = 0, done, stopped = false;
  const finished = new Promise(r => (done = r));
  const vis = () => { last = performance.now(); };
  document.addEventListener('visibilitychange', vis);
  const step = now => {
    if (stopped) return;
    if (!document.hidden) left -= (now - last) / 1000;
    last = now; onTick(Math.max(0, left));
    if (left <= 0) return stop(); raf = requestAnimationFrame(step);
  };
  function stop() { if (stopped) return; stopped = true; cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); done(); }
  raf = requestAnimationFrame(step);
  return {finished, stop, lose: s => { left -= s; }, get left() { return left; }};
}
function timeBar(seconds) {
  const bar = el('div', 'mg-time'), i = el('i'); bar.appendChild(i); i.style.width = '100%';
  return {node: bar, set: left => { i.style.width = (left / seconds * 100) + '%'; bar.classList.toggle('low', left < Math.min(10, seconds * 0.25)); }};
}

/* ---------- drag or tap: pointer drag shows a ghost and drops on [data-drop]; a short press is a tap ---------- */
function draggable(node, {onTap, onDrop, onHover}) {
  node.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const x0 = e.clientX, y0 = e.clientY; let ghost = null, over = null;
    const target = ev => { const t = document.elementFromPoint(ev.clientX, ev.clientY); return t && t.closest('[data-drop]'); };
    const move = ev => {
      if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8) { ghost = node.cloneNode(true); ghost.classList.add('mg-ghost'); ghost.style.width = node.offsetWidth + 'px'; document.body.appendChild(ghost); }
      if (!ghost) return;
      ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
      const t = target(ev); if (t !== over) { over?.classList.remove('hot'); over = t; over?.classList.add('hot'); onHover?.(over); }
    };
    const up = ev => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      over?.classList.remove('hot'); onHover?.(null);
      if (ghost) { ghost.remove(); const t = ev.type === 'pointerup' ? target(ev) : null; if (t) onDrop(t); }
      else if (ev.type === 'pointerup') onTap();
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });
}

/* ---------- KINDS ---------- */
// ctx: {body (where to draw), top (header with timer + score), game, hasFlag(flag), badgeName(flag), setScore(text)}
export const KINDS = {
  // Sort items into bins before time runs out. Unsorted items count as wrong.
  sort: async ({body, game, setScore, timer}) => {
    const items = shuffled(game.items, game.shuffle !== false), bins = game.bins;
    let i = 0, score = 0, busy = false;
    const left = el('div', 'mg-left'), mail = el('div', 'mg-mail'), from = el('small'), text = el('b');
    mail.append(from, text);
    const binRow = el('div', 'mg-bins'); binRow.style.setProperty('--n', bins.length);
    const show = () => { const it = items[i]; from.textContent = 'Từ: ' + it.from; text.textContent = it.text; left.textContent = `Email ${i + 1} / ${items.length}`; mail.className = 'mg-mail mg-flash'; };
    const t = clock(game.seconds, l => timer(l, game.seconds));
    async function sortInto(bin) {
      if (busy || i >= items.length) return; busy = true;
      const ok = items[i].bin === bin; if (ok) score++;
      setScore(`${score} đúng`);
      mail.className = 'mg-mail ' + (ok ? 'ok' : 'bad');
      await wait(reduced() ? 120 : 260);
      i++; busy = false;
      if (i >= items.length) return t.stop();
      show();
    }
    for (const b of bins) {
      const btn = el('button', 'mg-bin'); btn.dataset.drop = b.id; btn.append(el('span', null, b.label));
      if (b.key) btn.appendChild(el('kbd', null, 'phím ' + b.key));
      btn.onclick = () => sortInto(b.id); binRow.appendChild(btn);
    }
    draggable(mail, {onTap: () => {}, onDrop: t => sortInto(t.dataset.drop)});
    const key = e => { const b = bins.find(x => x.key === e.key); if (b) { e.preventDefault(); sortInto(b.id); } };
    addEventListener('keydown', key);
    body.append(left, mail, binRow); show(); setScore('0 đúng');
    await t.finished; removeEventListener('keydown', key);
    return {score, max: items.length, detail: `${score}/${items.length} ${game.scoreLabel || ''}`.trim()};
  },

  // Plan a day: tasks drop into a tray; place each into consecutive hour slots. A task counts if its last slot starts by its `due` hour.
  schedule: async ({body, top, game, hasFlag, setScore, timer}) => {
    const bonus = game.bonusSlot && hasFlag(game.bonusSlot.flag) ? game.bonusSlot.slots : 0;
    const n = game.slots + bonus, h0 = game.startHour;
    const grid = Array(n).fill(null);                  // grid[k] = task index occupying slot k
    const tasks = game.tasks.map((t, k) => ({...t, k, arrived: false, at: null}));
    let sel = null, elapsed = 0;
    const day = el('div', 'mg-day'); day.style.setProperty('--n', n);
    const tray = el('div', 'mg-tray'), bossBox = el('div'), submit = el('button', 'btn', 'Nộp lịch');
    const slotEls = grid.map((_, k) => { const s = el('div', 'mg-slot'); s.dataset.drop = k; s.appendChild(el('span', null, `${h0 + k}h`)); s.onclick = () => { if (sel != null) place(sel, k); }; day.appendChild(s); return s; });
    const onTime = t => t.at != null && h0 + t.at + t.size - 1 <= t.due;
    const score = () => tasks.filter(onTime).reduce((a, t) => a + t.points, 0);
    function fits(t, k) { if (k + t.size > n) return false; for (let j = k; j < k + t.size; j++) if (grid[j] != null && grid[j] !== t.k) return false; return true; }
    function unplace(t) { for (let j = 0; j < n; j++) if (grid[j] === t.k) grid[j] = null; t.at = null; }
    function place(idx, k) {
      const t = tasks[idx]; if (!fits(t, k)) return;
      unplace(t); for (let j = k; j < k + t.size; j++) grid[j] = t.k; t.at = k; sel = null; draw();
    }
    const label = t => `${t.from}: ${t.text}`;
    const meta = t => `${t.size} ô · hạn ${t.due}h · ${t.points ? t.points + ' điểm' : 'QH +' + (t.effects?.qh || 0)}`;
    function draw() {
      tray.replaceChildren();
      const waiting = tasks.filter(t => t.arrived && t.at == null);
      if (!waiting.length) tray.appendChild(el('span', 'mg-empty', tasks.every(t => t.arrived) ? 'Khay trống.' : 'Task mới sẽ rơi xuống đây…'));
      for (const t of waiting) {
        const c = el('button', 'mg-task' + (t.boss ? ' boss' : '') + (sel === t.k ? ' sel' : '') + (t.fresh ? ' new' : '')); t.fresh = false;
        c.append(el('b', null, label(t)), el('small', null, meta(t)));
        draggable(c, {onTap: () => { sel = sel === t.k ? null : t.k; draw(); }, onDrop: d => place(t.k, +d.dataset.drop)});
        tray.appendChild(c);
      }
      slotEls.forEach((s, k) => { s.querySelector('.mg-placed')?.remove(); s.classList.toggle('can', sel != null && fits(tasks[sel], k)); });
      for (const t of tasks) if (t.at != null) {
        const p = el('div', 'mg-placed' + (onTime(t) ? '' : ' late') + (t.boss ? ' boss' : ''), t.text);
        p.title = label(t) + ' · ' + meta(t); p.style.width = `calc(${t.size * 100}% + ${8 * t.size - 14}px)`; // spans t.size cells across the 4px grid gaps
        p.onclick = e => { e.stopPropagation(); unplace(t); sel = t.k; draw(); };
        slotEls[t.at].appendChild(p);
      }
      setScore(`${score()} điểm`);
    }
    const t = clock(game.seconds, l => {
      timer(l, game.seconds); elapsed = game.seconds - l;
      // drops: tasks without arriveAt come one every dropEvery seconds, in order; arriveAt tasks come at that second
      let order = 0, changed = false;
      for (const x of tasks) {
        const due = x.arriveAt ?? order++ * (game.dropEvery || 0);
        if (!x.arrived && elapsed >= due) { x.arrived = true; x.fresh = true; changed = true; }
      }
      if (changed) draw();
    });
    // the boss asks every N seconds; an unplaced boss task costs time
    const boss = game.boss && setInterval(() => {
      if (document.hidden) return;
      const late = tasks.some(x => x.boss && x.arrived && x.at == null);
      bossBox.replaceChildren(el('div', 'mg-boss mg-flash', `${game.boss.from}: "${game.boss.line}"` + (late ? ` · −${game.boss.penalty} giây` : ' · Dạ, em xếp rồi ạ!')));
      if (late) t.lose(game.boss.penalty);
      setTimeout(() => bossBox.replaceChildren(), 2600);
    }, game.boss.every * 1000);
    submit.onclick = () => t.stop();
    const row = el('div', 'row'); row.appendChild(submit);
    const perk = bonus ? el('div', 'perk', game.bonusSlot.label) : null;
    body.append(...[perk, day, el('div', 'mg-left', 'Khay task (bấm task rồi bấm ô giờ, bấm task đã xếp để gỡ ra):'), tray, bossBox, row].filter(Boolean));
    draw();
    await t.finished; clearInterval(boss);
    const done = tasks.filter(onTime);
    return {score: score(), max: null, extras: done.filter(x => x.effects).map(x => ({effects: x.effects, npc: x.npc || null})),
            detail: `${score()} ${game.scoreLabel || 'điểm'} · xong ${done.length}/${tasks.length} task`};
  },

  // Answer questions against a short timer. Answers with needFlag show only when the player has that flag.
  quiz: async ({body, game, hasFlag, badgeName, setScore, timer}) => {
    let score = 0, max = 0;
    const qs = game.questions;
    for (let qi = 0; qi < qs.length; qi++) {
      const q = qs[qi], answers = shuffled(q.answers.filter(a => !a.needFlag || hasFlag(a.needFlag)), game.shuffle !== false);
      max += Math.max(0, ...answers.map(a => a.points));
      body.replaceChildren(el('div', 'mg-left', `Câu ${qi + 1} / ${qs.length}`), el('div', 'mg-q', q.q));
      const list = el('div', 'mg-answers'); body.appendChild(list);
      let picked = null;
      const t = clock(game.secondsPerQuestion, l => timer(l, game.secondsPerQuestion));
      const pick = (a, b) => { if (picked) return; picked = a; b.classList.add('picked'); list.querySelectorAll('button').forEach(x => (x.disabled = true)); t.stop(); };
      answers.forEach((a, i) => {
        const b = el('button', 'mg-answer'); b.innerHTML = `<b>${i + 1}</b>`; b.append(a.text);
        if (a.needFlag) b.appendChild(el('small', null, 'Nhờ huy hiệu: ' + badgeName(a.needFlag)));
        b.onclick = () => pick(a, b); list.appendChild(b);
      });
      const key = e => { const i = +e.key - 1; if (answers[i]) { e.preventDefault(); pick(answers[i], list.children[i]); } };
      addEventListener('keydown', key);
      list.querySelector('button')?.focus();
      await t.finished; removeEventListener('keydown', key);
      score += picked ? picked.points : 0; setScore(`${score} điểm`);
      if (!picked) body.appendChild(el('p', 'howto', 'Hết giờ. Anh Tuấn chuyển câu.'));
      await wait(reduced() ? 300 : 700);
    }
    return {score, max, detail: `${score}/${max} ${game.scoreLabel || 'điểm'}`};
  },
};

/* ---------- runner: intro -> 3-2-1 -> play -> returns the raw result; the page grades it ---------- */
// opts: {eyebrow, hasFlag(flag), badgeName(flag), npcName}
export async function runMinigame(game, opts) {
  style();
  const kind = KINDS[game.kind]; if (!kind) throw new Error(`minigames.json: kiểu chơi "${game.kind}" chưa có trong minigames.js`);
  const wrap = el('div', 'mg-wrap'), box = el('div', 'card mg'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', game.name);
  wrap.appendChild(box); document.body.appendChild(wrap);
  // intro
  const go = el('button', 'btn', 'Bắt đầu');
  const perk = game.bonusSlot && opts.hasFlag(game.bonusSlot.flag) ? el('div', 'perk', game.bonusSlot.label) : null;
  box.replaceChildren(...[el('div', 'eyebrow', opts.eyebrow), el('h2', null, game.name), el('p', null, game.intro), el('p', 'howto', game.howto), perk, (() => { const r = el('div', 'row'); r.appendChild(go); return r; })()].filter(Boolean));
  go.focus();
  await new Promise(r => (go.onclick = r));
  // 3-2-1
  const count = el('div', 'mg-count'); box.replaceChildren(el('div', 'eyebrow', opts.eyebrow), el('h2', null, game.name), count);
  for (const n of ['3', '2', '1']) { count.textContent = n; await wait(reduced() ? 350 : 650); }
  // play
  const head = el('div', 'mg-top'), name = el('h2', null, game.name), sc = el('div', 'mg-score'), bar = timeBar(1), body = el('div');
  body.style.display = 'grid'; body.style.gap = '10px';
  head.append(name, sc, bar.node);
  box.replaceChildren(el('div', 'eyebrow', opts.eyebrow), head, body);
  const timer = (left, total) => bar.set(left / total);
  const res = await kind({body, top: head, game, hasFlag: opts.hasFlag, badgeName: opts.badgeName || (f => f), setScore: t => (sc.textContent = t), timer});
  wrap.remove();
  return res;
}

/* ---------- data check: catches typos in minigames.json before a milestone morning breaks ---------- */
export function validateMinigames(data, grades = data.grades) {
  const problems = [], ids = new Set();
  for (const g of data.games || []) {
    if (ids.has(g.id)) problems.push(`${g.id}: trùng id`); ids.add(g.id);
    if (!KINDS[g.kind]) problems.push(`${g.id}: kiểu chơi "${g.kind}" chưa có`);
    for (const d of g.days || []) if (!data.days.includes(d)) problems.push(`${g.id}: ngày ${d} không nằm trong danh sách ngày mốc "days"`);
    for (const [gr] of grades) if (!g.rewards?.[gr]) problems.push(`${g.id}: thiếu phần thưởng cho "${gr}"`);
    for (const [gr] of grades.slice(0, -1)) if (g.thresholds?.[gr] == null) problems.push(`${g.id}: thiếu ngưỡng điểm "${gr}"`);
    if (g.kind === 'sort') for (const it of g.items || []) if (!g.bins.some(b => b.id === it.bin)) problems.push(`${g.id}: "${it.text}" vào giỏ lạ "${it.bin}"`);
  }
  for (const d of data.days) if (!(data.games || []).some(g => (g.days || []).includes(d))) problems.push(`ngày ${d}: chưa có mini-game nào được phép xuất hiện`);
  return problems;
}
