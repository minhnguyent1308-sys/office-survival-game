// The opening (welcome, "Ảnh thẻ hồ sơ", "Phiếu thông tin nhân viên mới", 4 story cards) and the coach bubble used by the
// Day-1 tutorial and the first-time tips. Text lives in kich-ban/mo-dau.json; the page owns the 3D world and the save.
// DOM only: every screen returns a Promise that resolves with what the player chose (Lily 15/11).
// Look: direction B "Tòa nhà bảy tầng" (Lily 15/11): the welcome is the building, the photo is a mirror in the
// elevator, the name form sits on chị Mai's reception desk. Each screen covers the whole page, the 3D floor stays hidden.
import {LOOKS} from './world.js';

const STYLE = `
.op-screen{position:fixed;inset:0;z-index:9;overflow:auto;box-sizing:border-box;font-family:var(--font-body);color:var(--ink)}
.op-screen h1,.op-screen h2{margin:0;font-family:var(--font-display);font-weight:800;line-height:1;text-wrap:balance}
.op-screen p,.op-screen dl,.op-screen dd{margin:0}
.op-big{font:800 20px var(--font-display);color:#fff;background:var(--accent);border:2px solid var(--ink);border-radius:999px;box-shadow:0 4px 0 var(--ink);min-height:58px;padding:4px 26px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:10px;line-height:1.05}
.op-big small{display:block;font:600 12px var(--font-body);text-align:left}
.op-soft{font:600 17px var(--font-display);color:var(--ink);background:var(--paper);border:2px solid var(--ink);border-radius:999px;box-shadow:0 3px 0 var(--ink);min-height:50px;padding:0 22px;cursor:pointer}
.op-big:active,.op-soft:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}
.op-big:disabled{opacity:.7;cursor:default}
.op-screen button:focus-visible,.op-screen input:focus-visible{outline:3px solid var(--xp);outline-offset:3px}
.op-up{width:30px;height:30px;border-radius:50%;background:var(--yellow);border:2px solid var(--ink);display:grid;place-items:center;flex:none}
.op-bubble{position:relative;background:var(--paper);border:2px solid var(--ink);border-radius:16px;box-shadow:0 3px 0 var(--ink);padding:10px 14px;font-weight:600;font-size:14px;line-height:1.45}
.op-bubble b{display:block;font:600 13px var(--font-display);margin-top:3px;color:#5e5459}
.op-bubble.bad{color:var(--accent)}
.op-tag{justify-self:start;background:var(--ink);color:var(--paper);border-radius:8px;padding:4px 14px;font:600 14px var(--font-display);letter-spacing:.12em;text-transform:uppercase}

/* 1. welcome: the building on the right, words and buttons on the left; on a phone the building sits between them */
.op-hello{background:#fce6b6;min-height:100%;display:grid;grid-template-columns:minmax(0,480px) auto;grid-template-rows:1fr auto;grid-template-areas:"text bld" "act bld";justify-content:center;column-gap:64px;padding:32px 32px 120px}
.op-hello .ground{position:fixed;left:0;right:0;bottom:0;height:120px;background:#eadfcd;border-top:3px solid var(--ink)}
.op-hello .sky{position:fixed;top:7%;right:7%;pointer-events:none}
.op-hello .text{grid-area:text;align-self:end;display:grid;gap:14px;padding-bottom:22px;position:relative}
.op-hello h1{font-size:clamp(40px,5.6vw,72px);line-height:.95}
.op-hello .sub{font-size:20px;font-weight:600}
.op-hello .op-bubble{justify-self:start;max-width:400px}
.op-hello .act{grid-area:act;display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding-bottom:30px;position:relative}
.op-hello .foot{flex-basis:100%;font-size:12px;color:#5e5459;font-weight:600}
.op-hello .bld{grid-area:bld;align-self:end;height:min(560px,calc(100vh - 170px));aspect-ratio:312/542;position:relative}
.op-bld{display:block;width:100%;height:100%}

/* 2. Ảnh thẻ hồ sơ: a mirror in the elevator (its own small 3D view, page side), the buttons beside it */
.op-lift{background-color:#ece5d9;background-image:repeating-linear-gradient(90deg,transparent 0 79px,#dcd2c2 79px 81px);min-height:100%;display:grid;grid-template-columns:auto minmax(0,400px);grid-template-areas:"mirror head" "mirror panel" "mirror act";justify-content:center;align-content:center;column-gap:90px;row-gap:16px;padding:36px 140px}
.op-lift::before,.op-lift::after{content:"";position:fixed;top:0;bottom:0;width:110px;background:#d6cdbf}
.op-lift::before{left:0;border-right:3px solid var(--ink)}
.op-lift::after{right:0;border-left:3px solid var(--ink)}
.op-lift .head{grid-area:head;display:grid;gap:8px;align-self:end}
.op-floor{justify-self:start;display:flex;align-items:center;gap:10px;background:var(--ink);color:var(--yellow);border-radius:10px;padding:5px 16px;font:800 18px var(--font-display)}
.op-floor span{font-weight:600;font-size:13px;color:var(--paper);letter-spacing:.08em;text-transform:uppercase}
.op-lift h1{font-size:44px}
.op-lift .lead{font-size:15px;line-height:1.5;color:#5e5459}
.op-mirror{grid-area:mirror;align-self:center;justify-self:center;position:relative;height:min(470px,calc(100vh - 110px));aspect-ratio:33/47;box-sizing:border-box;border:3px solid var(--ink);border-radius:50% 50% 22px 22px/35% 35% 22px 22px;background:#eef4fb;box-shadow:0 0 0 9px var(--ut),0 0 0 12px var(--ink),0 12px 0 12px var(--ink);overflow:hidden;margin:12px}
.op-mirror canvas{position:absolute;inset:0;width:100%!important;height:100%!important;touch-action:none;cursor:grab}
.op-mirror .shine{position:absolute;background:rgba(255,255,255,.85);transform:rotate(24deg);pointer-events:none}
.op-mirror .hint{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);white-space:nowrap;background:var(--paper);border:2px solid var(--ink);border-radius:12px;padding:3px 12px;font:600 13px var(--font-display);pointer-events:none}
.op-keys{grid-area:panel;background:var(--paper);border:2px solid var(--ink);border-radius:16px;box-shadow:0 3px 0 var(--ink);padding:12px 14px;display:grid;grid-template-columns:80px 1fr;align-items:center;gap:8px 6px}
.op-keys .lbl{font:600 14px var(--font-display)}
.op-keys .opts{display:flex;flex-wrap:wrap;gap:8px}
.op-key{min-width:48px;height:48px;box-sizing:border-box;padding:0 14px;border-radius:999px;border:2px solid var(--ink);background:#ece5d9;font:600 13px var(--font-body);color:var(--ink);cursor:pointer}
.op-key[aria-pressed="true"]{background:var(--yellow);font-weight:700;box-shadow:0 0 0 4px rgba(247,208,70,.45)}
.op-key.sw{width:48px;padding:0}
.op-key.sw[aria-pressed="true"]{box-shadow:0 0 0 4px var(--yellow),0 0 0 6px var(--ink)}
.op-lift .act{grid-area:act;display:flex;gap:12px}
.op-lift .act .op-big{flex:1}
.op-flash{position:fixed;inset:0;background:#fff;z-index:11;opacity:0;pointer-events:none;transition:opacity .35s ease}
.op-flash.on{opacity:1;transition:none}

/* 3. Phiếu thông tin nhân viên mới: chị Mai at the reception desk, the form on a clipboard */
.op-lobby{background:linear-gradient(#fce6b6 0 74%,var(--ink) 74% calc(74% + 3px),#eadfcd 0);min-height:100%;margin:0;display:grid;grid-template-columns:minmax(0,560px) minmax(0,470px);grid-template-areas:"scene board" "scene act";justify-content:center;align-content:center;column-gap:70px;row-gap:24px;padding:40px 32px}
.op-scene{grid-area:scene;position:relative;align-self:center}
.op-scene svg{display:block;width:100%;height:auto}
.op-scene .op-bubble{position:absolute;left:50%;top:24%;width:46%;box-sizing:border-box}
.op-scene .op-bubble::before{content:"";position:absolute;left:-10px;top:22px;width:14px;height:14px;background:var(--paper);border-left:2px solid var(--ink);border-bottom:2px solid var(--ink);transform:rotate(45deg)}
.op-board{grid-area:board;position:relative;background:#b9814b;border:3px solid var(--ink);border-radius:16px;box-shadow:0 4px 0 var(--ink);padding:28px 12px 12px;transform:rotate(-1.5deg)}
.op-board::before{content:"";position:absolute;top:-14px;left:50%;margin-left:-50px;width:100px;height:32px;box-sizing:border-box;background:#cfc8c0;border:3px solid var(--ink);border-radius:8px 8px 4px 4px}
.op-paper{position:relative;background:var(--paper);border:2px solid var(--ink);border-radius:4px;padding:20px 18px 16px;display:grid;gap:6px}
.op-paper .eyebrow{font:600 13px var(--font-display);letter-spacing:.1em;text-transform:uppercase;color:#6d6267}
.op-paper h2{font-size:28px;line-height:1.1;margin-bottom:8px}
.op-paper.has-photo .eyebrow,.op-paper.has-photo h2{padding-right:100px}
.op-paper .photo{position:absolute;top:14px;right:16px;width:86px;height:104px;object-fit:cover;border:2px solid var(--ink);border-radius:4px;transform:rotate(3deg);background:#fff2c4}
.op-paper label{font:600 14px var(--font-display)}
.op-paper input{height:50px;box-sizing:border-box;padding:0 14px;border:2px solid var(--ink);border-radius:12px;background:#fff;font:600 17px var(--font-body);color:var(--ink);box-shadow:inset 0 3px 0 #eadfcd;min-width:0}
.op-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:2px}
.op-chips span{font-size:12.5px;color:#6d6267;font-weight:600}
.op-chips button{height:36px;padding:0 13px;border:2px solid var(--ink);border-radius:18px;background:#fff2c4;font:600 13px var(--font-body);color:var(--ink);cursor:pointer}
.op-chips button.more{width:36px;padding:0;background:var(--paper);display:grid;place-items:center}
.op-paper dl{margin-top:10px;padding-top:12px;border-top:2px dashed #eadfcd;display:grid;grid-template-columns:auto 1fr;gap:8px 12px;font-size:13px;line-height:1.35}
.op-paper dt{color:#6d6267}
.op-paper dd{font-weight:600}
.op-stamp{position:absolute;right:14px;bottom:16px;border:3px solid var(--accent);border-radius:8px;color:var(--accent);padding:2px 10px;font:800 17px var(--font-display);letter-spacing:.08em;transform:rotate(-10deg);opacity:.85;pointer-events:none}
.op-sig{font:800 28px var(--font-display);transform:rotate(-4deg);color:#2b4a9a;min-height:34px;opacity:0;transition:opacity .4s;padding-right:120px}
.op-sig.on{opacity:1}
.op-lobby .act{grid-area:act;display:grid}

/* phone: one column, top to bottom */
@media (max-width:760px){
  .op-hello{height:100%;min-height:0;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;grid-template-areas:"text" "bld" "act";padding:calc(24px + env(safe-area-inset-top,0px)) 0 0;column-gap:0}
  .op-hello .ground{display:none}
  .op-hello .sky{display:none}
  .op-hello .text{padding:0 20px 10px;justify-items:center;text-align:center;gap:8px}
  .op-hello .op-tag{justify-self:center}
  .op-hello h1{font-size:clamp(34px,10.5vw,44px)}
  .op-hello .sub{font-size:15px}
  .op-hello .op-bubble{justify-self:center;font-size:13px;padding:8px 12px}
  .op-hello .bld{height:100%;width:100%;aspect-ratio:auto;min-height:0}
  .op-hello .act{background:#eadfcd;border-top:3px solid var(--ink);padding:16px 20px calc(18px + env(safe-area-inset-bottom,0px));flex-direction:column;align-items:stretch;gap:10px}
  .op-hello .foot{flex-basis:auto;text-align:center}
  .op-lift{grid-template-columns:minmax(0,1fr);grid-template-areas:"head" "mirror" "panel" "act";padding:calc(18px + env(safe-area-inset-top,0px)) 16px calc(20px + env(safe-area-inset-bottom,0px));row-gap:12px;align-content:start}
  .op-lift::before,.op-lift::after{display:none}
  .op-lift .head{justify-items:center;text-align:center;gap:4px}
  .op-floor{justify-self:center}
  .op-lift h1{font-size:30px}
  .op-lift .lead{font-size:13px}
  .op-mirror{height:clamp(180px,34vh,300px);aspect-ratio:236/290;border-radius:50% 50% 18px 18px/41% 41% 18px 18px}
  .op-keys{grid-template-columns:64px 1fr;padding:12px}
  .op-keys .opts{gap:6px}
  .op-key{min-width:44px;height:44px;padding:0 10px}
  .op-key.sw{width:44px}
  .op-lobby{background:linear-gradient(#fce6b6 0 182px,var(--ink) 182px 185px,#eadfcd 0);grid-template-columns:minmax(0,1fr);grid-template-areas:"scene" "board" "act";align-content:start;padding:calc(12px + env(safe-area-inset-top,0px)) 16px calc(22px + env(safe-area-inset-bottom,0px));row-gap:20px}
  .op-scene{width:min(100%,250px);justify-self:center}
  .op-scene .op-bubble{font-size:12px;padding:7px 10px;top:12%;width:150px;left:46%}
  .op-paper{padding:16px 14px 14px}
  .op-paper dl{gap:6px 10px}
  .op-paper h2{font-size:23px}
  .op-sig{padding-right:110px}
}
@media (max-width:760px) and (max-height:700px){.op-hello .op-bubble{display:none}}

/* 4. the story cards (the scene-change card of the page) */
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
@media (prefers-reduced-motion:reduce){.coach-ring{animation:none}.op-flash,.op-sig{transition:none}.op-big:active,.op-soft:active{transform:none}}
`;
let styled = false;
const style = () => { if (styled) return; styled = true; const s = document.createElement('style'); s.textContent = STYLE; document.head.appendChild(s); };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const btn = (label, ghost, onClick) => { const b = el('button', 'btn' + (ghost ? ' ghost' : ''), label); b.type = 'button'; b.onclick = onClick; return b; };
const big = (label, onClick, cls = 'op-big') => { const b = el('button', cls, label); b.type = 'button'; b.onclick = onClick; return b; };
const pickOne = list => list[Math.floor(Math.random() * list.length)];
const pickSome = (list, n) => [...list].sort(() => Math.random() - .5).slice(0, n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
const svgFrom = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const ICON_UP = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15l7-7 7 7"/></svg>';
const ICON_CAM = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
const ICON_PEN = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/></svg>';
const ICON_MORE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>';
const withIcon = (b, icon) => { b.insertAdjacentHTML('afterbegin', icon); return b; };
export const fill = (text, name) => String(text ?? '').replace(/\{ten\}/g, name).replace(/\{TEN\}/g, name.toUpperCase());

/* ---------- per-browser memory: tutorial finished or switched off, tips already shown ---------- */
const KEY = 'ssns-huong-dan';
let mem = null;
export function guide(){ if (!mem) { try { mem = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { mem = {}; } } return mem; }
export function setGuide(patch){ mem = {...guide(), ...patch}; try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch {} return mem; }
export const tutorialOn = s => !!s && s.day === 1 && !guide().done && !guide().off;
export function tipOnce(id){ const g = guide(); if (g.off || (g.tips || []).includes(id)) return false; setGuide({tips:[...(g.tips || []), id]}); return true; }

/* ---------- drawings (flat, same ink outline as the cards) ---------- */
// the building: 7 floors, the fish tank on 7, Junior on 2, you at the door of 1; floors = {"7":"Sếp", ...} from mo-dau.json
function building(floors){
  const label = n => esc(floors?.[n] ? `${n} · ${floors[n]}` : n);
  return svgFrom(`<svg class="op-bld" viewBox="8 160 312 542" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
<line x1="270" y1="176" x2="270" y2="214" stroke="#2a2230" stroke-width="3"></line>
<circle cx="270" cy="172" r="5" fill="#e8505b" stroke="#2a2230" stroke-width="2.5"></circle>
<rect x="85" y="230" width="220" height="470" fill="#fffdf8" stroke="#2a2230" stroke-width="3"></rect>
<rect x="78" y="214" width="234" height="20" rx="3" fill="#e8505b" stroke="#2a2230" stroke-width="3"></rect>
<rect x="172" y="234" width="46" height="370" fill="#eadfcd"></rect>
<line x1="172" y1="234" x2="172" y2="604" stroke="#2a2230" stroke-width="2"></line>
<line x1="218" y1="234" x2="218" y2="604" stroke="#2a2230" stroke-width="2"></line>
<rect x="177" y="548" width="36" height="50" rx="3" fill="#f7d046" stroke="#2a2230" stroke-width="2.5"></rect>
<path d="M189 568 L195 560 L201 568" fill="none" stroke="#2a2230" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
<g stroke="#eadfcd" stroke-width="3"><line x1="87" y1="294" x2="172" y2="294"></line><line x1="218" y1="294" x2="303" y2="294"></line><line x1="87" y1="356" x2="172" y2="356"></line><line x1="218" y1="356" x2="303" y2="356"></line><line x1="87" y1="418" x2="172" y2="418"></line><line x1="218" y1="418" x2="303" y2="418"></line><line x1="87" y1="480" x2="172" y2="480"></line><line x1="218" y1="480" x2="303" y2="480"></line><line x1="87" y1="542" x2="172" y2="542"></line><line x1="218" y1="542" x2="303" y2="542"></line></g>
<line x1="87" y1="604" x2="303" y2="604" stroke="#2a2230" stroke-width="3"></line>
<g stroke="#2a2230" stroke-width="2.5">
<rect x="100" y="248" width="58" height="34" rx="4" fill="#8fc1f5"></rect>
<rect x="232" y="248" width="58" height="34" rx="4" fill="#f7d046"></rect>
<rect x="100" y="310" width="58" height="34" rx="4" fill="#d8e6fc"></rect>
<rect x="232" y="310" width="58" height="34" rx="4" fill="#f7d046"></rect>
<rect x="100" y="372" width="58" height="34" rx="4" fill="#f7d046"></rect>
<rect x="232" y="372" width="58" height="34" rx="4" fill="#d8e6fc"></rect>
<rect x="100" y="434" width="58" height="34" rx="4" fill="#d8e6fc"></rect>
<rect x="232" y="434" width="58" height="34" rx="4" fill="#f7d046"></rect>
<rect x="100" y="496" width="58" height="34" rx="4" fill="#f7d046"></rect>
<rect x="232" y="496" width="58" height="34" rx="4" fill="#f7d046"></rect>
<rect x="100" y="558" width="58" height="34" rx="4" fill="#d8e6fc"></rect>
<rect x="232" y="558" width="58" height="34" rx="4" fill="#f7d046"></rect>
</g>
<path d="M114 266 q8 -8 16 0 q-8 8 -16 0 z M130 266 l6 -5 v10 z" fill="#e8505b" stroke="#2a2230" stroke-width="1.8" stroke-linejoin="round"></path>
<circle cx="146" cy="258" r="2.5" fill="#fffdf8" stroke="#2a2230" stroke-width="1.5"></circle>
<path d="M108 282 v-8 M116 282 v-6 M150 282 v-9" stroke="#44ba6a" stroke-width="3" stroke-linecap="round"></path>
<g font-family="Baloo 2, sans-serif" font-weight="600" font-size="13" fill="#5e5459" text-anchor="end">
${[7, 6, 5, 4, 3, 2].map((n, i) => `<text x="76" y="${268 + i * 62}">${label(n)}</text>`).join('')}<text x="76" y="660">${label(1)}</text>
</g>
<rect x="140" y="612" width="110" height="16" rx="3" fill="#e8505b" stroke="#2a2230" stroke-width="2.5"></rect>
<rect x="160" y="630" width="70" height="70" fill="#d8e6fc" stroke="#2a2230" stroke-width="3"></rect>
<line x1="195" y1="630" x2="195" y2="700" stroke="#2a2230" stroke-width="2.5"></line>
<rect x="104" y="676" width="24" height="24" rx="3" fill="#e3b23c" stroke="#2a2230" stroke-width="2.5"></rect>
<circle cx="110" cy="660" r="10" fill="#44ba6a" stroke="#2a2230" stroke-width="2.5"></circle>
<circle cx="124" cy="654" r="11" fill="#44ba6a" stroke="#2a2230" stroke-width="2.5"></circle>
<circle cx="116" cy="644" r="9" fill="#44ba6a" stroke="#2a2230" stroke-width="2.5"></circle>
<g transform="translate(240 606) scale(.67)"><ellipse cx="50" cy="134" rx="30" ry="5" fill="#2a2230" opacity=".15"></ellipse><rect x="33" y="102" width="14" height="28" rx="3" fill="#3a3340" stroke="#2a2230" stroke-width="3"></rect><rect x="53" y="102" width="14" height="28" rx="3" fill="#3a3340" stroke="#2a2230" stroke-width="3"></rect><rect x="13" y="70" width="14" height="30" rx="4" fill="#fffdf8" stroke="#2a2230" stroke-width="3"></rect><rect x="73" y="62" width="14" height="30" rx="4" fill="#fffdf8" stroke="#2a2230" stroke-width="3" transform="rotate(-150 80 66)"></rect><rect x="25" y="64" width="50" height="44" rx="5" fill="#fffdf8" stroke="#2a2230" stroke-width="3"></rect><path d="M40 65 L50 84 L60 65" fill="none" stroke="#3c83ec" stroke-width="4" stroke-linejoin="round"></path><rect x="43" y="82" width="14" height="17" rx="2" fill="#f7d046" stroke="#2a2230" stroke-width="2.5"></rect><rect x="22" y="12" width="56" height="54" rx="7" fill="#f6d2ae" stroke="#2a2230" stroke-width="3"></rect><path d="M20 34 V18 a8 8 0 0 1 8 -8 H72 a8 8 0 0 1 8 8 V34 H70 V24 H30 V34 Z" fill="#2b1d16" stroke="#2a2230" stroke-width="3" stroke-linejoin="round"></path><rect x="35" y="36" width="7" height="10" rx="2" fill="#2a2230"></rect><rect x="58" y="36" width="7" height="10" rx="2" fill="#2a2230"></rect><ellipse cx="32" cy="51" rx="5" ry="3" fill="#f45561" opacity=".45"></ellipse><ellipse cx="68" cy="51" rx="5" ry="3" fill="#f45561" opacity=".45"></ellipse><path d="M44 52 Q50 59 56 52" fill="#fffdf8" stroke="#2a2230" stroke-width="2.5" stroke-linecap="round"></path></g>
</svg>`);
}
const SKY = '<svg class="sky" width="190" height="120" viewBox="0 0 190 120" aria-hidden="true"><circle cx="140" cy="46" r="38" fill="#f7d046" stroke="#2a2230" stroke-width="3"/><rect x="4" y="70" width="96" height="26" rx="13" fill="#fffdf8" stroke="#2a2230" stroke-width="2.5"/><rect x="32" y="56" width="46" height="24" rx="12" fill="#fffdf8" stroke="#2a2230" stroke-width="2.5"/></svg>';
// chị Mai behind the reception desk (bob, pink clip, purple shirt: her look in world.js NPC_LOOKS)
function lobbyScene(label){
  return svgFrom(`<svg viewBox="0 0 560 440" aria-hidden="true">
<rect x="40" y="20" width="200" height="40" rx="8" fill="#2a2230"/>
<text x="140" y="46" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="600" font-size="16" fill="#fffdf8" letter-spacing="2">${esc(label.toLocaleUpperCase('vi'))}</text>
<circle cx="500" cy="48" r="28" fill="#fffdf8" stroke="#2a2230" stroke-width="3"/>
<path d="M500 48 V31 M500 48 L511 54" stroke="#2a2230" stroke-width="3" stroke-linecap="round"/>
<g transform="translate(64 152) scale(2)">
<rect x="13" y="70" width="14" height="30" rx="4" fill="#8a6cc9" stroke="#2a2230" stroke-width="3"></rect><rect x="73" y="70" width="14" height="30" rx="4" fill="#8a6cc9" stroke="#2a2230" stroke-width="3"></rect><rect x="16" y="18" width="68" height="50" rx="9" fill="#2b1d16" stroke="#2a2230" stroke-width="3"></rect><rect x="25" y="64" width="50" height="44" rx="5" fill="#8a6cc9" stroke="#2a2230" stroke-width="3"></rect><path d="M40 65 L50 74 L60 65" fill="#fffdf8" stroke="#2a2230" stroke-width="2.5" stroke-linejoin="round"></path><rect x="22" y="12" width="56" height="54" rx="7" fill="#f6d2ae" stroke="#2a2230" stroke-width="3"></rect><path d="M18 52 V20 a10 10 0 0 1 10 -10 H72 a10 10 0 0 1 10 10 V52 H74 V26 H44 V22 H26 V52 Z" fill="#2b1d16" stroke="#2a2230" stroke-width="3" stroke-linejoin="round"></path><circle cx="70" cy="18" r="5.5" fill="#f45561" stroke="#2a2230" stroke-width="2"></circle><path d="M34 41 q4 -5 8 0 M58 41 q4 -5 8 0" fill="none" stroke="#2a2230" stroke-width="3" stroke-linecap="round"></path><ellipse cx="33" cy="51" rx="5" ry="3" fill="#f45561" opacity=".5"></ellipse><ellipse cx="67" cy="51" rx="5" ry="3" fill="#f45561" opacity=".5"></ellipse><path d="M44 52 Q50 59 56 52" fill="#fffdf8" stroke="#2a2230" stroke-width="2.5" stroke-linecap="round"></path>
</g>
<rect x="10" y="340" width="540" height="32" rx="6" fill="#f5c862" stroke="#2a2230" stroke-width="3"/>
<rect x="26" y="370" width="508" height="68" fill="#e3b23c" stroke="#2a2230" stroke-width="3"/>
<rect x="392" y="302" width="30" height="38" rx="3" fill="#e8505b" stroke="#2a2230" stroke-width="2.5"/>
<rect x="430" y="314" width="58" height="26" rx="3" fill="#fffdf8" stroke="#2a2230" stroke-width="2.5"/>
<path d="M400 302 v-14 M414 302 v-20" stroke="#44ba6a" stroke-width="3" stroke-linecap="round"/>
</svg>`);
}

/* ---------- 1. Welcome: the building ---------- */
// resume: null (no save) or a short line about the saved run ("Ngày 12 · Thứ Sáu · Lan")
export function welcome(data, resume){
  style(); const w = data.welcome;
  return new Promise(done => {
    const box = el('div', 'op-screen op-hello'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', w.title);
    const text = el('div', 'text'), quote = el('p', 'op-bubble', pickOne(w.quotes));
    text.append(el('div', 'op-tag', w.tag), el('h1', null, w.title), el('p', 'sub', w.sub), quote);
    const bld = el('div', 'bld'); bld.appendChild(building(w.floors));
    const act = el('div', 'act'), end = v => { box.remove(); done(v); };
    let first;
    if (resume) {
      first = withIcon(big(w.continue, () => end('continue')), `<span class="op-up">${ICON_UP}</span>`);
      first.lastChild.replaceWith(Object.assign(el('span'), {textContent: w.continue}));
      first.lastChild.appendChild(el('small', null, resume));
      let armed = false;
      const fresh = big(w.newRun, () => { if (armed) return end('new'); armed = true; fresh.textContent = w.newRunConfirm; }, 'op-soft');
      act.append(first, fresh);
    } else act.appendChild(first = withIcon(big(w.start, () => end('new')), `<span class="op-up">${ICON_UP}</span>`));
    act.appendChild(el('p', 'foot', w.footer));
    box.append(el('div', 'ground'), svgFrom(SKY), text, bld, act);
    document.body.appendChild(box); first.focus();
  });
}

/* ---------- 2. Ảnh thẻ hồ sơ: hair, hair colour, accessory, in the elevator mirror ---------- */
// mirror(host) is the page's 3D view inside the mirror: {wear(look), shoot() -> photo data URL or null, close()}
export function lookPicker(data, look, mirror){
  style(); const d = data.look; look = {...look};
  return new Promise(done => {
    const box = el('div', 'op-screen op-lift'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', d.title);
    const head = el('div', 'head'), floor = el('div', 'op-floor');
    floor.insertAdjacentHTML('beforeend', '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4l9 12H3z"/></svg>');
    floor.append(d.floor, el('span', null, d.eyebrow));
    head.append(floor, el('h1', null, d.title), el('p', 'lead', d.lead));
    const glass = el('div', 'op-mirror');
    const shine = (t, l, w, h) => { const s = el('i', 'shine'); Object.assign(s.style, {top: t, left: l, width: w, height: h, borderRadius: w}); return s; };
    glass.append(shine('13%', '15%', '7%', '38%'), shine('18%', '27%', '3%', '26%'), el('div', 'hint', d.hint));
    const keys = el('div', 'op-keys'), groups = {};
    for (const key of ['hair', 'color', 'extra']) {
      const opts = el('div', 'opts'); opts.setAttribute('role', 'group'); opts.setAttribute('aria-label', d.rows[key]); groups[key] = opts;
      for (const o of LOOKS[key]) {
        const b = el('button', 'op-key' + (o.hex ? ' sw' : ''), o.hex ? null : o.short || o.label); b.type = 'button'; b.dataset.id = o.id;
        if (o.hex) { b.style.background = o.hex; b.setAttribute('aria-label', o.label); }
        if (o.short) b.title = o.label;
        b.onclick = () => { look[key] = o.id; sync(); }; opts.appendChild(b);
      }
      keys.append(el('div', 'lbl', d.rows[key]), opts);
    }
    let view = null;
    const sync = () => { for (const [k, g] of Object.entries(groups)) for (const b of g.children) b.setAttribute('aria-pressed', b.dataset.id === look[k]); view?.wear({...look}); };
    const act = el('div', 'act');
    act.append(big(d.random, () => { for (const k of Object.keys(groups)) look[k] = pickOne(LOOKS[k]).id; sync(); }, 'op-soft'),
      withIcon(big(d.shoot, () => {
        const flash = el('div', 'op-flash on'); document.body.appendChild(flash);
        const photo = view?.shoot() ?? null; view?.close(); box.remove();
        requestAnimationFrame(() => requestAnimationFrame(() => flash.classList.remove('on')));
        setTimeout(() => flash.remove(), 500);
        done({look, photo});
      }), ICON_CAM));
    box.append(head, glass, keys, act);
    document.body.appendChild(box);
    try { view = mirror?.(glass) || null; } catch { view = null; }   // no WebGL: the mirror stays empty, the choice still works
    sync(); act.lastChild.focus();
  });
}

/* ---------- 3. Phiếu thông tin nhân viên mới: the name, on chị Mai's desk ---------- */
const NAME_OK = /^[\p{L} ]*$/u;
export const tidyName = (raw, max = 12) => raw.normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, max)
  .split(' ').map(w => w.charAt(0).toLocaleUpperCase('vi') + w.slice(1)).join(' ');
export function nameForm(data, {name = '', photo = null} = {}){
  style(); const d = data.name;
  return new Promise(done => {
    const form = el('form', 'op-screen op-lobby'); form.setAttribute('aria-label', d.title); form.noValidate = true;
    const scene = el('div', 'op-scene'), say = el('div', 'op-bubble'); say.setAttribute('aria-live', 'polite');
    scene.append(lobbyScene(d.lobby), say);
    const board = el('div', 'op-board'), paper = el('div', 'op-paper' + (photo ? ' has-photo' : ''));
    if (photo) { const img = el('img', 'photo'); img.src = photo; img.alt = 'Ảnh thẻ của bạn'; paper.appendChild(img); }
    const label = el('label', null, d.label); label.htmlFor = 'op-name';
    const input = el('input'); input.id = 'op-name'; input.maxLength = d.max; input.autocomplete = 'off'; input.spellcheck = false; input.value = name; input.placeholder = d.placeholder;
    const chips = el('div', 'op-chips'); chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', d.suggest);
    const more = withIcon(el('button', 'more'), ICON_MORE); more.type = 'button'; more.setAttribute('aria-label', d.suggestMore);
    const deal = () => { chips.replaceChildren(el('span', null, d.suggest + ':'), ...pickSome(d.suggestions.filter(n => n !== input.value), 3).map(n => {
      const b = el('button', null, n); b.type = 'button'; b.onclick = () => { input.value = n; react(); input.focus(); }; return b; }), more); };
    more.onclick = deal;
    const dl = el('dl'); for (const [k, v] of d.rows) dl.append(el('dt', null, k), el('dd', null, v));
    const sig = el('div', 'op-sig');
    paper.append(el('div', 'eyebrow', d.eyebrow), el('h2', null, d.title), label, input, chips, dl, sig, el('div', 'op-stamp', d.stamp));
    board.appendChild(paper);
    const act = el('div', 'act'), sign = withIcon(el('button', 'op-big', d.sign), ICON_PEN); sign.type = 'submit'; act.appendChild(sign);
    const speak = (who, text, bad) => { say.className = 'op-bubble' + (bad ? ' bad' : ''); say.replaceChildren(text, el('b', null, who)); };
    function react(){
      const v = input.value;
      if (!NAME_OK.test(v)) { speak(d.who, d.invalid, true); return false; }
      const n = tidyName(v, d.max), key = n.toLocaleLowerCase('vi');
      const line = d.special[key] || (d.taken[key] && d.takenLine.replace('{npc}', d.taken[key]));
      if (line) speak(d.who, fill(line, n)); else speak(d.whoFull, d.ask);
      return true;
    }
    input.oninput = react;
    form.onsubmit = e => {
      e.preventDefault(); if (!react()) { input.focus(); return; }
      const n = tidyName(input.value, d.max) || pickOne(d.suggestions); input.value = n; sign.disabled = true;
      sig.textContent = n; sig.classList.add('on');
      setTimeout(() => { form.remove(); done(n); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 800);
    };
    form.append(scene, board, act); document.body.appendChild(form); deal(); react(); input.focus();
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
