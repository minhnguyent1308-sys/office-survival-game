// The opening (welcome, "Ảnh thẻ hồ sơ", "Phiếu thông tin nhân viên mới", 4 story cards) and the coach bubble used by the
// Day-1 tutorial and the first-time tips. Text lives in kich-ban/mo-dau.json; the page owns the 3D world and the save.
// DOM only: every screen returns a Promise that resolves with what the player chose (Lily 15/11).
import {LOOKS} from './world.js';

const STYLE = `
.op{position:fixed;z-index:9;font-family:var(--font-body)}
.op h1,.op h2{margin:0;font-family:var(--font-display);font-weight:800;line-height:1.05;text-wrap:balance}
.op .eyebrow{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);font-weight:600}
.op p{margin:0}
.op .row{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.op .btn{font-size:15px;padding:10px 18px}
.op-welcome{left:50%;top:calc(24px + env(safe-area-inset-top,0px));transform:translateX(-50%);width:min(520px,calc(100% - 32px));box-sizing:border-box;padding:20px 22px;display:grid;gap:10px;text-align:center}
.op-welcome h1{font-size:clamp(34px,7vw,52px);text-transform:uppercase;letter-spacing:.01em}
.op-welcome .sub{font-size:17px;font-weight:600}
.op-welcome .quote{font-size:13px;color:var(--muted);font-style:italic}
.op-welcome .row{justify-content:center;margin-top:6px}
.op-welcome .btn small{display:block;font-weight:400;font-size:12px;opacity:.8}
.op-welcome .foot{font-size:11px;color:var(--muted)}
.op-panel{right:max(16px,env(safe-area-inset-right,0px));top:50%;transform:translateY(-50%);width:min(340px,calc(100% - 32px));box-sizing:border-box;padding:18px;display:grid;gap:12px;max-height:calc(100% - 32px);overflow:auto}
.op-panel h2{font-size:28px}
.op-panel .lead{font-size:14px;line-height:1.5;color:var(--muted)}
.op-panel .lbl{font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px}
.op-opts{display:flex;flex-wrap:wrap;gap:6px}
.op-opt{font:600 13px var(--font-body);background:var(--paper);color:var(--ink);border:2px solid var(--ink);border-radius:999px;padding:5px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.op-opt[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
.op-opt i{width:14px;height:14px;border-radius:50%;border:1.5px solid var(--ink);display:inline-block}
.op-opt[aria-pressed="true"] i{border-color:var(--paper)}
.op-panel .hint2{font-size:12px;color:var(--muted)}
.op-flash{position:fixed;inset:0;background:#fff;z-index:11;opacity:0;pointer-events:none;transition:opacity .35s ease}
.op-flash.on{opacity:1;transition:none}
.op-wrap{inset:0;background:rgba(42,34,48,.35);display:grid;grid-template-columns:minmax(0,460px);place-content:center;align-items:center;padding:16px;box-sizing:border-box}
.op-form{width:100%;min-width:0;grid-template-columns:minmax(0,1fr);box-sizing:border-box;padding:20px;display:grid;gap:12px;background:#fff7e3;position:relative;max-height:calc(100vh - 32px);overflow:auto}
.op-form h2{font-size:24px;padding-right:96px}
.op-form .photo{position:absolute;top:16px;right:16px;width:80px;height:100px;object-fit:cover;border:2px solid var(--ink);border-radius:4px;background:#3c83ec;transform:rotate(2deg)}
.op-form .stamp{position:absolute;top:96px;right:28px;color:var(--accent);border:2px solid var(--accent);border-radius:6px;padding:1px 6px;font:800 13px var(--font-display);transform:rotate(-12deg);opacity:.85}
.op-form table{border-collapse:collapse;font-size:14px;width:100%}
.op-form td{padding:6px 0;border-bottom:1px dashed var(--lock);vertical-align:top}
.op-form td:first-child{color:var(--muted);width:42%;padding-right:8px}
.op-form td i{color:var(--muted)}
.op-form label{font-size:13px;font-weight:600}
.op-name{display:flex;gap:8px}
.op-name input{flex:1;min-width:0;font:600 18px var(--font-body);color:var(--ink);background:var(--paper);border:2px solid var(--ink);border-radius:10px;padding:8px 12px}
.op-name input:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.op-react{min-height:20px;font-size:13px;line-height:1.45}
.op-react b{color:var(--accent)}
.op-react.bad{color:var(--accent)}
.op-sig{font:800 26px var(--font-display);transform:rotate(-4deg);color:#2b4a9a;text-align:right;min-height:30px;opacity:0;transition:opacity .4s}
.op-sig.on{opacity:1}
.op-story{cursor:pointer}
.op-story .op-next{position:absolute;left:50%;bottom:calc(28px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);font-size:12px;opacity:.6;letter-spacing:.06em}
.op-story .op-skip{position:absolute;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px));background:transparent;color:var(--paper);border:2px solid var(--paper);border-radius:10px;font:600 13px var(--font-body);padding:6px 14px;cursor:pointer}
.op-story .op-dots{position:absolute;left:50%;top:calc(24px + env(safe-area-inset-top,0px));transform:translateX(-50%);display:flex;gap:6px}
.op-story .op-dots i{width:8px;height:8px;border-radius:50%;background:var(--paper);opacity:.3}
.op-story .op-dots i.on{opacity:1;background:var(--yellow)}
.op-story span{max-width:440px!important}
.coach{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(56px + env(safe-area-inset-bottom,0px));width:min(440px,calc(100% - 32px));box-sizing:border-box;padding:12px 14px;display:grid;gap:8px;z-index:7}
.coach .who{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);font-weight:600}
.coach p{margin:0;font-size:15px;line-height:1.5}
.coach .row{display:flex;justify-content:flex-end;gap:8px}
.coach .row:empty{display:none}
.coach .btn{padding:6px 14px}
.coach-ring{outline:3px solid var(--yellow)!important;outline-offset:1px;animation:coach-ring 1s ease-in-out infinite}
@keyframes coach-ring{50%{outline-color:var(--accent)}}
@media (max-width:640px){.op-panel{top:auto;bottom:calc(12px + env(safe-area-inset-bottom,0px));transform:none;left:16px;right:16px;width:auto;max-height:52vh;padding:14px;gap:10px}.op-panel h2{font-size:22px}.op-panel .lead{display:none}}
@media (prefers-reduced-motion:reduce){.coach-ring{animation:none}.op-flash,.op-sig{transition:none}}
`;
let styled = false;
const style = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = STYLE; document.head.appendChild(s); };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const btn = (label, ghost, onClick) => { const b = el('button', 'btn' + (ghost ? ' ghost' : ''), label); b.type = 'button'; b.onclick = onClick; return b; };
const pickOne = list => list[Math.floor(Math.random() * list.length)];
export const fill = (text, name) => String(text ?? '').replace(/\{ten\}/g, name).replace(/\{TEN\}/g, name.toUpperCase());

/* ---------- per-browser memory: tutorial finished or switched off, tips already shown ---------- */
const KEY = 'ssns-huong-dan';
let mem = null;
export function guide(){ if (!mem) { try { mem = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { mem = {}; } } return mem; }
export function setGuide(patch){ mem = {...guide(), ...patch}; try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch {} return mem; }
export const tutorialOn = s => !!s && s.day === 1 && !guide().done && !guide().off;
export function tipOnce(id){ const g = guide(); if (g.off || (g.tips || []).includes(id)) return false; setGuide({tips:[...(g.tips || []), id]}); return true; }

/* ---------- 1. Welcome ---------- */
// resume: null (no save) or a short line about the saved run ("Ngày 12 · Thứ Sáu · Lan")
export function welcome(data, resume){
  style(); const w = data.welcome;
  return new Promise(done => {
    const box = el('div', 'op op-welcome card'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', w.title);
    box.append(el('h1', null, w.title), el('p', 'sub', w.sub), el('p', 'quote', pickOne(w.quotes)));
    const row = el('div', 'row'), end = v => { box.remove(); done(v); };
    if (resume) {
      const go = btn(w.continue, false, () => end('continue')); go.appendChild(el('small', null, resume));
      let armed = false;
      const fresh = btn(w.newRun, true, () => { if (armed) return end('new'); armed = true; fresh.textContent = w.newRunConfirm; });
      row.append(fresh, go);
    } else row.append(btn(w.start, false, () => end('new')));
    box.append(row, el('p', 'foot', w.footer));
    document.body.appendChild(box); box.querySelector('.btn:last-child')?.focus();
  });
}

/* ---------- 2. Ảnh thẻ hồ sơ: hair, hair colour, accessory ---------- */
// onChange(look) redresses the character on screen; shoot() takes the photo (a data URL) when the player is done
export function lookPicker(data, look, {onChange, shoot}){
  style(); const d = data.look; look = {...look};
  return new Promise(done => {
    const box = el('div', 'op op-panel card'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', d.title);
    box.append(el('div', 'eyebrow', d.eyebrow), el('h2', null, d.title), el('p', 'lead', d.lead));
    const groups = {};
    for (const key of ['hair', 'color', 'extra']) {
      const wrap = el('div'), opts = el('div', 'op-opts'); opts.setAttribute('role', 'group'); opts.setAttribute('aria-label', d.rows[key]);
      wrap.append(el('div', 'lbl', d.rows[key]), opts); groups[key] = opts;
      for (const o of LOOKS[key]) {
        const b = el('button', 'op-opt'); b.type = 'button'; b.dataset.id = o.id;
        if (o.hex) { const dot = el('i'); dot.style.background = o.hex; b.appendChild(dot); }
        b.append(o.label); b.onclick = () => { look[key] = o.id; sync(); }; opts.appendChild(b);
      }
      box.appendChild(wrap);
    }
    const sync = () => { for (const [k, g] of Object.entries(groups)) for (const b of g.children) b.setAttribute('aria-pressed', b.dataset.id === look[k]); onChange({...look}); };
    const row = el('div', 'row');
    row.append(btn(d.random, true, () => { for (const k of Object.keys(groups)) look[k] = pickOne(LOOKS[k]).id; sync(); }),
      btn(d.shoot, false, async () => {
        const flash = el('div', 'op-flash on'); document.body.appendChild(flash);
        const photo = shoot(); box.remove();
        requestAnimationFrame(() => requestAnimationFrame(() => flash.classList.remove('on')));
        setTimeout(() => flash.remove(), 500);
        done({look, photo});
      }));
    box.append(el('p', 'hint2', d.hint), row);
    document.body.appendChild(box); sync();
  });
}

/* ---------- 3. Phiếu thông tin nhân viên mới: the name ---------- */
const NAME_OK = /^[\p{L} ]*$/u;
export const tidyName = (raw, max = 12) => raw.normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, max)
  .split(' ').map(w => w.charAt(0).toLocaleUpperCase('vi') + w.slice(1)).join(' ');
export function nameForm(data, {name = '', photo = null} = {}){
  style(); const d = data.name;
  return new Promise(done => {
    const wrap = el('div', 'op op-wrap'), form = el('form', 'op-form card'); form.setAttribute('aria-label', d.title); form.noValidate = true;
    if (photo) { const img = el('img', 'photo'); img.src = photo; img.alt = 'Ảnh thẻ của bạn'; form.appendChild(img); }
    form.append(el('div', 'eyebrow', d.eyebrow), el('h2', null, d.title));
    if (photo) form.appendChild(el('div', 'stamp', d.stamp));
    const label = el('label', null, d.label); label.htmlFor = 'op-name';
    const input = el('input'); input.id = 'op-name'; input.maxLength = d.max; input.autocomplete = 'off'; input.spellcheck = false; input.value = name; input.placeholder = d.placeholder;
    const field = el('div', 'op-name'); field.append(input, btn(d.suggest, true, () => { suggested = pickOne(d.suggestions.filter(n => n !== input.value)); input.value = suggested; react(); input.focus(); }));
    const table = el('table'); for (const [k, v] of d.rows) { const tr = el('tr'); tr.append(el('td', null, k), el('td', null, v)); table.appendChild(tr); }
    const say = el('p', 'op-react'), sig = el('div', 'op-sig');
    let suggested = pickOne(d.suggestions);
    function react(){
      const v = input.value; say.className = 'op-react'; say.replaceChildren();
      if (!NAME_OK.test(v)) { say.classList.add('bad'); say.textContent = d.invalid; return false; }
      const n = tidyName(v, d.max), key = n.toLocaleLowerCase('vi');
      const line = d.special[key] || (d.taken[key] && d.takenLine.replace('{npc}', d.taken[key]));
      if (line) say.append(el('b', null, d.who + ': '), fill(line, n));
      return true;
    }
    input.oninput = react;
    form.append(label, field, say, table, sig);
    const row = el('div', 'row'), sign = btn(d.sign, false, null); sign.type = 'submit'; row.appendChild(sign); form.appendChild(row);
    form.onsubmit = e => {
      e.preventDefault(); if (!react()) { input.focus(); return; }
      const n = tidyName(input.value, d.max) || suggested; input.value = n; sign.disabled = true;
      sig.textContent = n; sig.classList.add('on');
      setTimeout(() => { wrap.remove(); done(n); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 800);
    };
    wrap.appendChild(form); document.body.appendChild(wrap); input.focus(); react();
  });
}

/* ---------- 4. The story: four full-screen cards in the scene-change style; Bỏ qua on every card ---------- */
// resolves with close(): fades the last card out over the game once the page has set the scene underneath
export function prologue(data, name){
  style(); const d = data.prologue;
  return new Promise(done => {
    const box = el('div', 'fade on op-story'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-live', 'polite');
    const eb = el('small'), ti = el('b'), sub = el('span'), dots = el('div', 'op-dots'), next = el('div', 'op-next', d.next);
    d.cards.forEach(() => dots.appendChild(el('i')));
    const skip = el('button', 'op-skip', d.skip); skip.type = 'button';
    box.append(dots, eb, ti, sub, next, skip); document.body.appendChild(box);
    let i = -1;
    const close = () => new Promise(r => { box.classList.remove('on'); setTimeout(() => { box.remove(); r(); }, 550); });
    const finish = () => { removeEventListener('keydown', onKey); box.onclick = null; eb.textContent = ''; ti.textContent = ''; sub.textContent = ''; next.hidden = true; skip.hidden = true; dots.hidden = true; done(close); };
    const show = () => { i++; if (i >= d.cards.length) return finish(); const c = d.cards[i];
      eb.textContent = fill(c.eyebrow, name); ti.textContent = fill(c.title, name); sub.textContent = fill(c.sub, name);
      [...dots.children].forEach((x, k) => x.classList.toggle('on', k === i)); };
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); finish(); } else if (['Enter', ' ', 'ArrowRight'].includes(e.key)) { e.preventDefault(); show(); } };
    box.onclick = e => { if (e.target !== skip) show(); };
    skip.onclick = finish; addEventListener('keydown', onKey); skip.focus(); show();
  });
}

/* ---------- Coach: one speech bubble for the Day-1 tutorial and the first-time tips ---------- */
// show({key, who, text, buttons:[{label, ghost, onClick}]}): the same key twice keeps what is on screen
export function makeCoach(){
  style();
  const box = el('div', 'coach card'), who = el('div', 'who'), p = el('p'), row = el('div', 'row');
  box.setAttribute('role', 'status'); box.append(who, p, row); box.hidden = true; document.body.appendChild(box);
  let key = null;
  return {
    get key(){ return key; },
    show({key: k, who: w = '', text, buttons = []}){
      if (k === key && !box.hidden) return; key = k;
      who.textContent = w; p.textContent = text; row.replaceChildren(...buttons.map(b => btn(b.label, b.ghost, b.onClick))); box.hidden = false;
    },
    hide(){ box.hidden = true; key = null; },
    get shown(){ return !box.hidden; },
  };
}
