// Balance simulation for tầng Intern. Run: node mo-phong.mjs   (from this folder; Node 22+)
// Env: N (runs per style, default 2000), SLACK=4 NOISE=0.65 (the calibrated hard-working bot), CARDS (path to another cards.json),
//      TEA (off|self|colleague|smart, default smart), MG (mini-game grade rates %, default 25,50,25), TASKXP (override lam_task XP), PF / XF (scale Pin cost / XP of the new night cards N*, V*),
//      KPI (smart|nhan|lo, default smart: how the bot answers anh Tuấn's weekly KPI note). See README.md.
import * as G from '../../visual-design/engine.js';
import fs from 'fs';
const DATA = JSON.parse(fs.readFileSync(new URL(process.env.CARDS || '../cards.json', import.meta.url))); const CARDS = DATA.cards;
if (process.env.TASKXP) G.ACTIONS.lam_task.effects.xp = +process.env.TASKXP;
const PF = +(process.env.PF||1), XF = +(process.env.XF||1);
for (const c of CARDS) if (c.when==='night' && /^[NV]/.test(c.id)) for (const ch of c.choices) { if (ch.effects.pin<0) ch.effects.pin = Math.round(ch.effects.pin*PF); ch.effects.xp = Math.round(ch.effects.xp*XF); }
const REVIEW = JSON.parse(fs.readFileSync(new URL('../danh-gia.json', import.meta.url)));
const HB = JSON.parse(fs.readFileSync(new URL('../handbook.json', import.meta.url)));
// mini-game library: milestone days and rewards come from minigames.json; the grade a player gets is drawn from MG="Xuất sắc,Đạt,Trượt" (%)
G.useMinigames(JSON.parse(fs.readFileSync(new URL('../minigames.json', import.meta.url))));
// play rhythm (Lily 15/11): midday office events, special days, weekly KPI. RHYTHM=0 runs without it
if (process.env.RHYTHM !== '0') G.useRhythm(JSON.parse(fs.readFileSync(new URL('../nhip-choi.json', import.meta.url))));
// closeness perks (than-thiet.json). PERKS=off runs without them; PERKS=tuan40,hang40 runs only those (to measure each one alone)
if (process.env.PERKS !== 'off') { const PD = JSON.parse(fs.readFileSync(new URL('../than-thiet.json', import.meta.url)));
  if (process.env.PERKS) PD.perks = PD.perks.filter(p => process.env.PERKS.split(',').includes(p.id)); G.usePerks(PD); }
const MGR = (process.env.MG || '25,50,25').split(',').map(x => +x / 100);
function rngOf(seed){ let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 2**32; }; }
const W = {chamchi:{xp:3, ut:1.6, qh:.6, pin:.25}, xahoi:{xp:1, ut:1, qh:3, pin:.3}, coba:{xp:1, ut:1, qh:3, pin:.3}}; // coba: the same, but every afternoon is lunch with cô Ba (to check the secret ending is reachable)
const TEA = process.env.TEA || 'smart'; // quán trà sữa: off | self | colleague | smart (the bot's own weights)
let NOISE = +(process.env.NOISE ?? 0.65); let RNG = Math.random;
function pick(s, c, w){ if (RNG() < NOISE) return Math.floor(RNG()*c.choices.length); let b=0,bv=-1e9; c.choices.forEach((ch,i)=>{ const e=ch.effects||{}; const v=(e.xp||0)*w.xp+(e.ut||0)*w.ut+(e.qh||0)*w.qh+(e.pin||0)*w.pin*(s.stats.pin<35?4:1)+((ch.addFlags||[]).includes('ghi_diem_voi_sep')?4:0); if(v>bv){bv=v;b=i;} }); return b; }
// Weekly KPI note: Nhận or Làm lơ (Lily 15/11). Nhận never costs anything (a missed KPI is not punished) while Làm lơ costs 2-5 of a stat,
// so the bot's best answer is always Nhận; like card choices, with probability NOISE it answers at random instead (a real player's whim).
const KPI_MODE = process.env.KPI || 'smart';
function answerKpi(s){ const lo = KPI_MODE === 'lo' || (KPI_MODE === 'smart' && RNG() < NOISE && RNG() < 0.5); if (lo) G.kpiIgnore(s, RNG); else G.kpiSeen(s); }
function afternoon(s, kind, sitting){
  const A = s.counters.actions, can = G.roomOpen(s,'canteen');
  if (kind === 'coba' && can) return 'an_trua_co_ba';
  if (s.stats.pin < 30 && can) return 'an_trua_co_ba';
  const left = 40 - s.day; 
  const need = [];
  if (can && (A.an_trua_co_ba||0) < 3) need.push('an_trua_co_ba');
  if ((A.bao_cao_sep||0) < 3) need.push('bao_cao_sep');
  if ((A.giup_chi_mai||0) < 2) need.push('giup_chi_mai');
  if ((A.lam_task||0) < 5) need.push('lam_task');
  if (can && (s.counters.gossipWith.length < 3 || !Object.values(s.close).some(v=>v>=40))) need.push('tam_chuyen');
  if (kind==='xahoi') return can ? (need.includes('bao_cao_sep')&&s.day>20 ? 'bao_cao_sep' : 'tam_chuyen') : 'hoi_senior';
  const workdaysLeft = Math.round(left*5/7);
  if (need.length && (need.length >= workdaysLeft - +(process.env.SLACK ?? 4))) { const a = need.find(a => a!=='lam_task') || need[0]; return a; }
  if (can && s.day > 18 && s.stats.qh < 50) return 'tam_chuyen';
  const k = G.kpiStatus(s);                                          // weekly KPI (nhip-choi.json): chase an action KPI when nothing else is urgent
  if (k && !k.done && k.kpi.goal.type === 'action_count' && (k.kpi.goal.action !== 'tam_chuyen' || sitting?.length)) return k.kpi.goal.action;
  return s.stats.ut < 62 && s.day % 2 ? 'bao_cao_sep' : 'lam_task';
}
export function run(kind, seed){
  const rng = rngOf(seed), w = W[kind]; RNG = rngOf(seed ^ 0x9e3779b9); const s = G.newGame({rng, startRooms: DATA.rooms?.start}); if (process.env.GIFT) G.applyGift(s, process.env.GIFT, process.env.GIFT_NPC || 'tung');   // GIFT=thu_gioi_thieu|kinh_nghiem|tieng_lanh|goi_quen (GIFT_NPC for the letter)
  G.startMorning(s, CARDS, rng); let visits = 0, nights = 0, firstVisit = null, teaDay = null, events = 0, specials = 0;
  const mis = () => G.checkMissions(s, HB);
  for (let guard=0; guard<300 && s.part!=='over'; guard++){
    if (s.part==='morning'){
      for (const r of s.rooms) G.recordRoom(s, r); if (s.day <= 12) for (const n of G.NPC_IDS) if (n!=='coba'||G.roomOpen(s,'canteen')) G.recordTalk(s,n);
      const u = G.todaysUnlock(s, CARDS); if (u) { G.chooseOption(s, u, pick(s,u,w)); mis(); }
      const sp = G.todaysSpecial(s, CARDS); if (sp) { G.chooseOption(s, sp, pick(s,sp,w)); mis(); specials++; }
      if (G.kpiToAnnounce(s)) answerKpi(s);
      if (s.part !== 'morning') continue;                               // a special day can skip the morning (mưa ngập)
      if (s.today.minigame){ const r = rng(); let g = r<MGR[0]?'xuat_sac':r<MGR[0]+MGR[1]?'dat':'truot';
        const up = g !== 'xuat_sac' && G.perksOf(s,'minigame_upgrade').find(x => !G.perkUsed(s, x.id));   // anh Minh's tip: a near miss (assumed 30% of misses) goes up one grade, once
        if (up && rng() < .3) { (s.perksUsed ||= []).push(up.id); g = g === 'truot' ? 'dat' : 'xuat_sac'; }
        G.playMinigame(s, g); mis(); continue; }
      const c = G.todaysCard(s, CARDS); if (!c){ s.part='afternoon'; continue; }
      G.chooseOption(s, c, G.autoResolves(s,c)?0:pick(s,c,w)); mis(); if (c.sceneAt==='trasua') teaDay ??= s.day; continue;
    }
    if (s.part==='afternoon'){
      const ev = G.todaysEvent(s, CARDS); if (ev) { const keep = NOISE; if (G.perkOn(s, 'mai60')) NOISE = 0;   // chị Mai's hint: the player picks the best choice
        G.chooseOption(s, ev, pick(s,ev,w)); NOISE = keep; mis(); events++; continue; }
      const sitting = s.today.canteen; let a = afternoon(s, kind, sitting);
      let partner = sitting[0]; if (a==='tam_chuyen'){ const fresh = sitting.find(n=>!s.counters.gossipWith.includes(n)); const best = [...sitting].sort((x,y)=>s.close[y]-s.close[x])[0]; partner = s.counters.gossipWith.length<3 && fresh ? fresh : best; }
      if (!G.actionAvailable(s,a,{sitting}).ok) a = ['lam_task','bao_cao_sep','giup_chi_mai','hoi_senior'].find(x => G.actionAvailable(s,x,{sitting}).ok);
      G.doAction(s,a,{sitting, partner, senior: G.SENIORS[Math.floor(rng()*4)]}, rng); mis();
      if (TEA !== 'off') { const kind = TEA !== 'smart' ? TEA : 2*w.pin*(s.stats.pin<35?4:1) > 1*w.qh ? 'self' : 'colleague'; G.buyTea(s, kind); mis(); } // quán trà sữa: one cup a day
      continue;
    }
    if (s.part==='evening'){
      if (G.endOfDay(s)) break;
      G.goHome(s); const n = G.drawNight(s, CARDS, rng); if (n) { nights++; if (n.type==='visit'){ visits++; firstVisit ??= s.day; } G.chooseOption(s, n, pick(s,n,w)); mis(); }
      const r = G.nextDay(s, CARDS, rng);
      if (r.weekend){ const c = G.todaysCard(s, CARDS); if (c) { G.chooseOption(s, c, pick(s,c,w)); mis(); } G.endWeekend(s, CARDS, rng); }
      continue;
    }
  }
  if (s.ending === 'review') G.review(s, HB, REVIEW);   // s.endingId: which of the verdict endings
  const ut = s.stats.ut + (s.stats.qh >= 70 ? 5 : 0);
  const junior = s.ending==='review' && s.stats.xp>=100 && ut>=60 && s.stats.qh>=50 && s.missionsDone.length===HB.missions.length;
  return {s, junior, visits, nights, firstVisit, teaDay, events, specials};
}
const N = +(process.env.N ?? 2000);
if (N > 0)
for (const kind of (process.env.KINDS || 'chamchi,xahoi').split(',')) {
  let td=[], jr=0, xp=0, end={}, v=0, vr=0, ni=0, fails={xp:0,ut:0,qh:0,mis:0}, minPin=0, qh70=0, ev=0, sd=0, kpiOk=0, kpiN=0, kpiBadge=0, kpiIg=0;
  for (let i=1;i<=N;i++){ const r = run(kind, i*2654435761 + (+process.env.SEED || 0)); const s=r.s; jr+=r.junior; xp+=s.stats.xp; end[s.endingId||s.ending]=(end[s.endingId||s.ending]||0)+1; v+=r.visits; vr+=r.visits>0; ni+=r.nights; qh70+=s.stats.qh>=70; ev+=r.events; sd+=r.specials; kpiN+=(s.kpiLog||[]).filter(k=>!k.ignored).length; kpiIg+=(s.kpiLog||[]).filter(k=>k.ignored).length; kpiOk+=(s.kpiLog||[]).filter(k=>k.ok).length; kpiBadge+=s.flags.includes('nhan_vien_kpi'); td.push(r.teaDay ?? 99);
    if (s.stats.xp<100) fails.xp++; if (s.stats.ut+(s.stats.qh>=70?5:0)<60) fails.ut++; if (s.stats.qh<50) fails.qh++; if (s.missionsDone.length<10) fails.mis++; }
  console.log(kind.padEnd(8), 'Junior', (100*jr/N).toFixed(1)+'%', 'XP', (xp/N).toFixed(1), JSON.stringify(end), 'thiếu', JSON.stringify(fails), 'qh70', (100*qh70/N).toFixed(0)+'%', 'visit/ván', (v/N).toFixed(2), 'có visit', (100*vr/N).toFixed(0)+'%', 'lá tối/ván', (ni/N).toFixed(1), 'mở quán: trung vị ngày', td.sort((a,b)=>a-b)[N>>1], 'chưa mở', (100*td.filter(x=>x===99).length/N).toFixed(0)+'%', 'sự kiện giữa buổi/ván', (ev/N).toFixed(1), 'ngày đặc biệt/ván', (sd/N).toFixed(1), 'KPI đạt', kpiN ? (100*kpiOk/kpiN).toFixed(0)+'%' : '-', 'huy hiệu KPI', (100*kpiBadge/N).toFixed(0)+'%', 'KPI làm lơ/ván', (kpiIg/N).toFixed(2));
}
