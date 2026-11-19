// Kiểm tra ngày Giếng thần gặp ngay khi vào game, kể cả khi đụng độ chuyện khác (Lily 19/11). Chạy: node kiem-tra-gieng-than.mjs (Node 18+)
// Giếng thần là "ngày ngoài lịch": đến sáng gần nhất ở văn phòng (trừ ngày 1), ngày thật được giữ nguyên và đến ngay sau.
import * as G from '../../visual-design/engine.js';
import fs from 'fs';
const rd = f => JSON.parse(fs.readFileSync(new URL('../' + f, import.meta.url)));
const CD = rd('cards.json'), CARDS = CD.cards, MG = rd('minigames.json'), EV = rd('su-kien.json');
G.useMinigames(MG); G.useRhythm(rd('nhip-choi.json')); G.usePerks(rd('than-thiet.json')); G.useEvents(EV, '2026-11-20');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
const WELL = EV.events[0].firstOpen, UNLOCKS = CARDS.filter(c => c.type === 'unlock');
function rngOf(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 2 ** 32; }; }

// one step of a plain bot (first choice, a safe afternoon), the way the pages move a run along
function step(s, rng, onMorning = () => {}) {
  if (s.part === 'morning') {
    onMorning(s);
    const u = G.todaysUnlock(s, CARDS); if (u) G.chooseOption(s, u, 0);
    const sp = G.todaysSpecial(s, CARDS); if (sp) G.chooseOption(s, sp, 0);
    if (G.kpiToAnnounce(s)) G.kpiSeen(s);
    if (s.part !== 'morning') return;
    const eg = G.eventGameToPlay(s); if (eg) G.playEventGame(s, eg.event.id, 'dat');
    if (s.today.minigame) { G.playMinigame(s, 'dat'); return; }
    const c = G.todaysCard(s, CARDS); if (!c) { s.part = 'afternoon'; return; }
    G.chooseOption(s, c, 0); return;
  }
  if (s.part === 'afternoon') { const ev = G.todaysEvent(s, CARDS); if (ev) { G.chooseOption(s, ev, 0); return; }
    const opts = {sitting: s.today.canteen, partner: s.today.canteen[0], senior: G.SENIORS[0]};
    const a = s.stats.pin < 40 && G.actionAvailable(s, 'an_trua_co_ba', opts).ok ? 'an_trua_co_ba' : ['lam_task', 'bao_cao_sep', 'giup_chi_mai', 'hoi_senior'].find(x => G.actionAvailable(s, x, opts).ok);
    G.doAction(s, a, opts, rng); return; }
  if (s.part === 'evening' && !G.isAtHome(s)) { if (!G.endOfDay(s)) G.goHome(s); return; }                     // 17:55, then the rented room
  if (s.part === 'evening') { const n = G.drawNight(s, CARDS, rng); if (n) G.chooseOption(s, n, 0); G.nextDay(s, CARDS, rng); return; }
  if (s.part === 'weekend') { const c = G.todaysCard(s, CARDS); if (c) G.chooseOption(s, c, 0); G.endWeekend(s, CARDS, rng); }
}
// a run stopped where `pred` first holds (looks across seeds); null if none
function find(pred, seeds = 400) {
  for (let i = 1; i <= seeds; i++) { const rng = rngOf(i * 2654435761), s = G.newGame({rng, startRooms: CD.rooms?.start}); G.startMorning(s, CARDS, rng);
    for (let g = 0; g < 600; g++) { if (pred(s)) return {s, rng}; if (s.part === 'over') break; step(s, rng); } }
  return null;
}
// play on until the well day is answered; returns what it saw
function playToWell(s, rng) {
  const seen = []; let well = null;
  for (let g = 0; g < 60 && s.part !== 'over' && !well; g++) step(s, rng, x => { if (!x.today.seenHere) { x.today.seenHere = true; seen.push(x.today.extra ? 'x' : x.day); }
    if (x.today.specialId === WELL && !x.today.specialDone) well = {day: x.day, extra: !!x.today.extra, card: x.today.cardId, mornings: seen.length}; });
  return {seen, well};
}
const fresh = s => s.part === 'morning' && !s.today.cardDone && !s.today.specialDone && !s.today.unlockDone;
const cases = [
  ['sáng ngày thường chưa làm gì', s => fresh(s) && s.day > 2 && !s.today.specialId && !s.today.unlockId && !s.today.minigame, 'now'],
  ['sáng có ngày đặc biệt khác của tuần (chưa trả lời)', s => fresh(s) && s.today.specialId && s.today.specialId !== WELL, 'now'],
  ['sáng ngày mở phòng', s => fresh(s) && s.today.unlockId, 'now'],
  ['sáng ngày mini-game', s => fresh(s) && s.today.minigame && s.day < G.TOTAL_DAYS, 'now'],
  ['sáng thứ Hai có giấy KPI', s => fresh(s) && G.kpiToAnnounce(s), 'now'],
  ['sáng có sự kiện giữa buổi', s => fresh(s) && s.today.eventId, 'now'],
  ['sáng ngày 40', s => fresh(s) && s.day === G.TOTAL_DAYS, 'now'],
  ['ngày 1 (chị Mai hướng dẫn)', s => s.day === 1 && s.part === 'morning', 'later'],
  ['tối ngày 1 ở phòng trọ', s => s.day === 1 && s.part === 'evening' && G.isAtHome(s), 'later'],
  ['sáng ngày 2 (mở lại save)', s => fresh(s) && s.day === 2, 'now'],
  ['buổi chiều', s => s.part === 'afternoon' && s.day > 2, 'later'],
  ['tối hôm trước ngày đặc biệt khác', s => s.part === 'evening' && s.week?.specialDay === s.day + 1, 'later'],
  ['tối hôm trước ngày mini-game', s => s.part === 'evening' && G.isMinigameDay(s.day + 1) && s.day + 1 < G.TOTAL_DAYS, 'later'],
  ['tối hôm trước ngày mở phòng', s => s.part === 'evening' && UNLOCKS.some(u => u.day === s.day + 1), 'later'],
  ['tối thứ Sáu (cuối tuần chen giữa)', s => s.part === 'evening' && G.weekday(s.day) === 4 && s.day > 2, 'later'],
  ['cuối tuần ở phòng trọ', s => s.part === 'weekend', 'later'],
  ['tối ở phòng trọ', s => s.part === 'evening' && G.isAtHome(s) && s.day > 2, 'later'],
];
for (const [name, pred, want] of cases) {
  const f = find(pred); if (!f) { ok(false, `${name}: không tìm được ván mẫu`); continue; }
  const {s, rng} = f, day = s.day, part = s.part, before = {...s.today}, weekSp = s.week?.specialId, weekDay = s.week?.specialDay, kpi = s.week?.kpi;
  const r = G.queueEventDay(s, CARDS, WELL, rng);
  ok(r === want, `${name} (ngày ${day}, ${part}): ${r}`);
  if (r === 'now') {
    ok(s.today.extra && s.today.specialId === WELL && G.todaysSpecial(s, CARDS)?.id === WELL && s.day === day, `  ${name}: Giếng thần hiện ngay, ngoài lịch, vẫn ngày ${day}`);
    ok(!G.todaysUnlock(s, CARDS) && !G.kpiToAnnounce(s) && !s.today.minigame && !G.eventGameToPlay(s), `  ${name}: không có chuyện nào khác chen vào ngày Giếng thần`);
    ok(CARDS.find(c => c.id === s.today.cardId)?.deck === 'gieng_than', `  ${name}: lá buổi sáng rút từ bộ chuyện lạ`);
  }
  const {seen, well} = playToWell(s, rng);
  ok(well && well.extra, `  ${name}: gặp Giếng thần ${well ? `sau ${well.mornings} buổi sáng, ngày ${well.day} (ngoài lịch)` : 'KHÔNG'}`);
  if (r === 'later' && day > 1) ok(well && well.mornings === (part === 'morning' ? 2 : 1), `  ${name}: đúng sáng kế tiếp ở văn phòng`);
  if (r === 'later' && day === 1) ok(well && well.day === 3 && well.mornings === (part === 'morning' ? 3 : 2), `  ${name}: chơi xong ngày 1 và ngày 2 rồi mới gặp, trước ngày 3`);
  for (let g = 0; g < 10 && s.part !== 'over' && !(s.part === 'morning' && !s.today.extra); g++) step(s, rng);   // the well day ends
  // the held day comes back whole: same day number, same room opening / special / mini-game / midday event / morning card
  if (r === 'now') { const back = s.today;
    ok(s.day === day && back.unlockId === before.unlockId && back.specialId === before.specialId && back.minigame === before.minigame && back.eventId === before.eventId && back.cardId === before.cardId,
      `  ${name}: hôm sau là đúng ngày ${day} cũ, giữ nguyên chuyện của ngày đó`); }
  ok(s.week?.specialId === weekSp && s.week?.specialDay === weekDay || s.week?.n !== G.weekOf(day), `  ${name}: ngày đặc biệt của tuần không bị đổi`);
  if (kpi) ok(s.week?.kpi === kpi || s.week?.n !== G.weekOf(day), `  ${name}: KPI tuần giữ nguyên`);
}
// once per run, and the run's calendar is unchanged
{ const f = find(s => fresh(s) && s.day === 9); const {s, rng} = f; G.queueEventDay(s, CARDS, WELL, rng); playToWell(s, rng);
  ok(G.queueEventDay(s, CARDS, WELL, rng) === 'done', 'đã gặp trong ván thì không gặp lại (done)'); }
{ const f = find(s => s.part === 'over' && s.ending === 'review'); const {s, rng} = f;
  ok(G.queueEventDay(s, CARDS, WELL, rng) === 'later' && s.pendingSpecial === WELL, 'ván đã xong: chờ ván sau'); }
{ const f = find(s => fresh(s) && s.day === G.TOTAL_DAYS); const {s, rng} = f; G.queueEventDay(s, CARDS, WELL, rng);
  ok(G.isExtraDay(s) && !G.isLastDay(s), 'Giếng thần trước ngày 40 không phải ngày phán quyết');
  for (let g = 0; g < 5 && s.part === 'morning'; g++) step(s, rng); ok(s.part === 'afternoon', 'ngày Giếng thần trước ngày 40 vẫn có buổi chiều');
  for (let g = 0; g < 10 && G.isExtraDay(s); g++) step(s, rng); ok(s.day === G.TOTAL_DAYS && !s.ending && G.isLastDay(s), 'sau đó mới tới ngày 40 thật');
  for (let g = 0; g < 20 && s.part !== 'over'; g++) step(s, rng); ok(s.ending === 'review' || s.ending === 'burnout' || s.ending === 'fired', 'ngày 40 thật kết thúc ván như cũ: ' + s.ending); }
{ const f = find(s => s.day === 1 && s.part === 'morning'); const {s, rng} = f; G.queueEventDay(s, CARDS, WELL, rng);
  for (let g = 0; g < 10 && s.day < 2; g++) step(s, rng);
  ok(s.day === 2 && !G.isExtraDay(s) && G.queueEventDay(s, CARDS, WELL, rng) === 'later' && !G.isExtraDay(s), 'ván mới: sáng ngày 2 mở lại trang vẫn là ngày 2 thường, giếng chờ đến trước ngày 3'); }
{ const s = G.tryDay(CARDS, WELL); ok(s.today.extra && G.todaysSpecial(s, CARDS)?.id === WELL && s.day === 11, 'ván nháp ?thu=gieng_than mở đúng ngày Giếng thần'); }
{ G.useEvents(EV, '2026-12-02'); const f = find(s => fresh(s) && s.day === 9);
  ok(G.queueEventDay(f.s, CARDS, WELL, f.rng) === null && !f.s.today.extra, 'hết event (2/12): không có Giếng thần'); G.useEvents(EV, '2026-11-20'); }

// brute force: enter at every step of many runs; nothing may be lost or moved
let entries = 0, met = 0; const bad = {};
const note = (k, v) => { (bad[k] ||= []).push(v); };
for (let i = 1; i <= 30; i++) for (let e = 0; e < 300; e += 3) {
  const rng = rngOf(i * 2654435761), s = G.newGame({rng, startRooms: CD.rooms?.start}); G.startMorning(s, CARDS, rng);
  let entered = false, done = false; const specials = new Map(), unlocks = new Set(), mg = [], days = [];
  for (let g = 0; g < 500 && s.part !== 'over'; g++) {
    if (!entered && g >= e) { entered = true; entries++; }
    if (entered && !done && G.queueEventDay(s, CARDS, WELL, rng) === 'done') done = true;
    if (s.week?.specialId && !specials.has(s.week.specialId)) specials.set(s.week.specialId, s.week.specialDay);
    step(s, rng, x => { if (x.today.seenHere) return; x.today.seenHere = true; if (!x.today.extra) days.push(x.day);
      if (x.today.unlockId) unlocks.add(x.day); if (x.today.minigame) mg.push(x.day); if (x.today.extra && (x.today.unlockId || x.today.minigame || x.today.eventId)) note('ngày ngoài lịch có chuyện khác', i); });
  }
  if (!entered) continue;
  if ((s.played || []).includes(WELL)) met++; else if (s.ending === 'review' && s.pendingSpecial !== WELL) note('không gặp Giếng thần', `${i}/${e}`);
  for (const [id, d] of specials) if (d != null && d < s.day && !(s.played || []).includes(id)) note('mất ngày đặc biệt ' + id, i);
  for (const u of UNLOCKS) if (u.day < s.day && !unlocks.has(u.day)) note('mất ngày mở phòng ' + u.day, i);
  for (const d of MG.games.flatMap(g => g.days || [])) if (d < s.day && !mg.includes(d)) note('mất ngày mini-game ' + d, i);
  if (days.some((d, k) => k && d <= days[k - 1])) note('lịch bị lệch', i);
  if (s.ending === 'review' && s.day !== G.TOTAL_DAYS) note('phán quyết không rơi vào ngày 40', i);
}
ok(!Object.keys(bad).length, `vào game ở ${entries} thời điểm: gặp Giếng thần ${met} lần; không mất ngày đặc biệt, ngày mở phòng, mini-game; lịch 40 ngày không lệch ${JSON.stringify(bad).slice(0, 300)}`);

// option C (Lily 19/11): each well day gives wellDay [2, 3] shards; missing some, the well brings the player back the next morning
{ const E = EV.events[0], SH = E.shards, [lo, hi] = SH.wellDay, sh = s => s.events?.[E.id]?.shards || 0;
  const r1 = rngOf(5), a = G.tryDay(CARDS, WELL, {rng: r1}), heldDay = a.day, heldCard = a.heldDay.cardId;
  const got = sh(a) - (a.heldDay.shard ? 1 : 0);
  ok(got >= lo && got <= hi, `ngày Giếng thần cho ${got} mảnh (trong khoảng ${lo}–${hi})`);
  ok(G.wellReturns(a, CARDS) === sh(a) < SH.count, 'chưa đủ mảnh thì báo trước: sáng mai giếng kéo về lại');
  // play the run on: count the well days in a row, then the held day
  const days = []; let g = 0, game = null;
  while (g++ < 200 && a.part !== 'over' && game == null) { step(a, r1, x => { if (x.today.seenHere) return; x.today.seenHere = true;
      days.push({extra: !!x.today.extra, again: x.today.again || 1, day: x.day, shards: sh(x), card: x.today.cardId, special: x.today.specialId}); });
    if (!a.today.extra && G.eventGameToPlay(a)) game = a.day; }
  const wells = days.filter(d => d.extra);
  ok(wells.length >= 1 && wells.every((d, k) => d.again === k + 1 && d.day === heldDay && d.special === WELL), `ở 2005 ${wells.length} ngày liền, đánh số lần 1, 2…, ngày thật vẫn là ngày ${heldDay}`);
  ok(!a.today.extra && a.day === heldDay && a.today.cardId === heldCard && sh(a) >= SH.count, `đủ ${SH.count} mảnh mới về hẳn 2026: đúng ngày ${heldDay}, lá buổi sáng giữ nguyên`);
  ok(game === heldDay, `sáng ngày ${heldDay} chơi ghép báo cáo ngay`);
  // the event ends while shards are missing: the well stops pulling
  const r2 = rngOf(9), b = G.tryDay(CARDS, WELL, {rng: r2}); b.events[E.id].shards = 1;
  G.useEvents(EV, '2026-12-02'); ok(!G.wellReturns(b, CARDS), 'hết event (2/12) thì giếng thôi kéo về, dù còn thiếu mảnh'); G.useEvents(EV, '2026-11-20');
  // many runs: how many 2005 days until every shard is found, the real day after
  const count = {}; let gameNext = 0, N = 300;
  for (let i = 1; i <= N; i++) { const r = rngOf(i * 2654435761), x = G.tryDay(CARDS, WELL, {rng: r}), d0 = x.day; let n = 1, k = 0;
    while (k++ < 200 && x.part !== 'over') { const was = x.today.extra; step(x, r); if (was && x.today.extra && x.part === 'morning' && !x.today.cardDone && x.today.again === n + 1) n++; if (!x.today.extra && x.part === 'morning') break; }
    count[n] = (count[n] || 0) + 1; if (sh(x) >= SH.count && x.day === d0 && G.eventGameToPlay(x)) gameNext++; }
  ok(Object.keys(count).every(n => n >= 1 && n <= Math.ceil(SH.count / lo)) && gameNext === N, `${N} ván: số ngày 2005 ${JSON.stringify(count)}, ván nào cũng ghép báo cáo ngay sáng hôm sau`);
}
console.log(fail ? `${fail} mục sai` : 'Tất cả đều đúng');
process.exit(fail ? 1 : 0);
