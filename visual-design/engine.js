// Game engine for "Sống sót nơi công sở", floor 1 (40-day probation).
// Pure logic: no DOM, no 3D. The page (tang-intern.html) renders it; tests run it in Node.
// Content lives in data files (cards.json, handbook.json). Adding a card never touches this file.

export const SAVE_VERSION = 1;
export const TOTAL_DAYS = 40;
export const STATS = ['xp', 'pin', 'ut', 'qh'];
export const STAT_NAME = {xp: 'XP', pin: 'Pin', ut: 'Uy tín', qh: 'Quan hệ'};
const START = {xp: 0, pin: 80, ut: 30, qh: 30};
const CAP = {xp: 150, pin: 100, ut: 100, qh: 100};
export const JUNIOR_XP = 100;
export const CLOSE_START = 20, CLOSE_UNLOCK = 40;
export const NPC_IDS = ['tuan', 'hang', 'linh', 'minh', 'tung', 'mai', 'coba'];
export const NPC_NAME = {tuan: 'Anh Tuấn', hang: 'Chị Hằng', linh: 'Chị Linh', minh: 'Anh Minh', tung: 'Anh Tùng', mai: 'Chị Mai', coba: 'Cô Ba', client: 'Khách hàng',
  sep_tong: 'Sếp tổng', chu_tro: 'Chủ trọ', shipper: 'Anh shipper', hang_xom: 'Hàng xóm'};
// people who only appear in staged events (no closeness, no card of their own); their looks live in world.js NPC_LOOKS
export const EXTRA_PEOPLE = ['sep_tong', 'chu_tro', 'shipper', 'hang_xom'];
export const SENIORS = ['hang', 'linh', 'minh', 'tung'];
export const VISITORS = [...SENIORS, 'mai', 'tuan'];   // who can come to the rented room (type 'visit' cards)
export const ROOM_IDS = ['lobby', 'intern', 'boss', 'canteen', 'meeting'];
// places outside tầng 1 with their own page; a card with sceneAt plays its choices there and opens the place for good (Lily 14/11)
export const PLACES = {trasua: 'tra-sua.html'};
const WEEKDAY = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
const WEEKEND_CARD_CHANCE = 1 / 3;
export const WAKE_PIN = 5; // sleeping restores a little Pin every morning (Lily 14/11)
// evenings at the rented room: study cards + boss/client messages (Lily 14/11: more XP events at home); nhip-choi.json events.night overrides (Lily 15/11: 2/3)
let NIGHT_CARD_CHANCE = 1 / 2;

/* ---------- Calendar: day 1 is a Monday, day 40 a Friday ---------- */
export const weekday = day => (day - 1) % 7;               // 0 = Monday
export const weekdayName = day => WEEKDAY[weekday(day)];
export const isWeekend = day => weekday(day) >= 5;
export const phaseOf = day => (day <= 12 ? 1 : day <= 26 ? 2 : 3);

/* ---------- Mini-game library: content and scoring live in minigames.json ---------- */
// Each page loads minigames.json and calls useMinigames(data) once, before startMorning/nextDay.
// A day listed in data.days is a milestone: that morning draws one game whose own `days` include it (by weight,
// games not yet played this run first) instead of a card. The page plays it and reports a grade.
let MG = {days: [], games: [], grades: [['xuat_sac', 'Xuất sắc'], ['dat', 'Đạt'], ['truot', 'Trượt']]};
export function useMinigames(data) { if (data) MG = {...MG, ...data}; }
export const minigameGrades = () => MG.grades;
export const isMinigameDay = day => MG.days.includes(day);
export const minigameList = () => MG.games;
export const minigameById = id => MG.games.find(g => g.id === id) || null;
export const todaysMinigame = s => (s.today.minigame ? minigameById(s.today.minigame) : null);
export function drawMinigame(s, rng = Math.random) {
  if (!isMinigameDay(s.day)) return null;
  const fits = MG.games.filter(g => (g.days || []).includes(s.day) && (g.weight ?? 1) > 0 && requiresOk(s, g.requires));
  const fresh = fits.filter(g => !(g.id in s.counters.minigames));
  return weighted(fresh.length ? fresh : fits, rng);
}
// score -> grade: the first grade whose threshold the score reaches; the last grade (Trượt) catches the rest
export function gradeOf(game, score) {
  for (const [g] of MG.grades) if (game.thresholds?.[g] != null && score >= game.thresholds[g]) return g;
  return MG.grades.at(-1)[0];
}

/* ---------- Play rhythm (Lily 15/11): staged events, special days, weekly KPI. Content and odds live in nhip-choi.json ---------- */
// Each page loads nhip-choi.json and calls useRhythm(data) once, like useMinigames. Without it: no midday events, no special days, no KPI.
let RH = {events: {midday: 0}, specialDays: {weeks: [], chance: 0}, kpi: {weeks: [], pool: []}};
export function useRhythm(data) { if (!data) return; RH = {...RH, ...data}; if (data.events?.night != null) NIGHT_CARD_CHANCE = data.events.night; }
export const rhythm = () => RH;

/* ---------- Live events on real dates (su-kien.json, Lily 19/11): on from 00:00 of `from` to the end of `to`, the player's clock ---------- */
// Each page loads su-kien.json and calls useEvents(data, today?) once. Without it (the simulator): no event, the game is as before.
// today: 'YYYY-MM-DD' to try another date (the page passes ?ngay=...); left out = the device's date when asked.
// A card or mini-game with `event` only shows while that event is on; a card with `deck` only on a special day whose rules.deck names it.
let EV = {events: []}, TODAY = null;
export function useEvents(data, today = null) { if (data) EV = {...EV, ...data}; TODAY = /^\d{4}-\d{2}-\d{2}$/.test(today || '') ? today : null; }
const isoToday = () => { if (TODAY) return TODAY; const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
export const eventById = id => EV.events.find(e => e.id === id) || null;
export const eventOn = id => { const e = eventById(id), t = isoToday(); return !!e && t >= e.from && t <= e.to; };
export const liveEvents = () => EV.events.filter(e => eventOn(e.id));
const eventOk = c => !c.event || eventOn(c.event);
// shards (event.shards): one may turn up each ordinary working morning; enough of them = the event's mini-game, once per run.
// The well day (rules.shard) gives wellDay [min, max] of them, and comes back the next morning until all are found (wellReturns, Lily 19/11).
const eventState = (s, id) => ((s.events ||= {})[id] ||= {shards: 0});
function rollShards(s, cards, rng) {
  const well = rulesToday(s, cards).shard;                          // the well day: it sits outside the calendar, any morning
  if (!well && !ordinaryDay(s, cards, s.day)) return;
  for (const e of liveEvents()) {
    const sh = e.shards, st = eventState(s, e.id); if (!sh || st.shards >= sh.count) continue;
    if (!well && rng() >= sh.chance) continue;
    const [lo, hi] = sh.wellDay || [1, 1], n = well ? lo + Math.floor(rng() * (hi - lo + 1)) : 1;
    for (let k = 0; k < n && st.shards < sh.count; k++) {
      st.shards += 1; s.today.shard = e.id;
      say(s, `${sh.name} ${st.shards}/${sh.count}: ${sh.lines[Math.floor(rng() * sh.lines.length)]}`);
    }
    if (st.shards >= sh.count) say(s, sh.full);
  }
}
// today is a well day and its event still misses shards: Tan làm brings the player back to 2005 the next morning (Lily 19/11, option C).
// The held real day keeps waiting; it comes once every shard is found, or once the event is over.
export function wellReturns(s, cards) {
  const c = s.today?.extra && cardById(cards, s.today.specialId), e = c?.rules?.shard && eventById(c.event);
  return !!(e?.shards && eventOn(e.id) && (s.events?.[e.id]?.shards || 0) < e.shards.count);
}
// HUD line, same on every map: "Event Giếng thần · đến hết 1/12 · Mảnh báo cáo 2/5"
export function eventLines(s) {
  return liveEvents().map(e => { const sh = e.shards, st = s.events?.[e.id];
    const tail = !sh ? '' : st?.game ? ` · ${sh.name}: đã ghép` : ` · ${sh.name} ${Math.min(st?.shards || 0, sh.count)}/${sh.count}`;
    return e.hud + tail; });
}
// the mini-game waiting this morning: shards complete, not played yet (it stays playable if the event ended the same week)
export function eventGameToPlay(s) {
  if (s.part !== 'morning' || s.today.extra) return null;            // shards completed on the well day: the game waits for the next morning
  for (const e of EV.events) { const sh = e.shards, st = s.events?.[e.id];
    if (sh && st && st.shards >= sh.count && !st.game) { const game = minigameById(sh.game); if (game) return {event: e, game}; } }
  return null;
}
export function playEventGame(s, eventId, result, extras = []) {
  const e = eventById(eventId), st = eventState(s, eventId), game = minigameById(e.shards.game);
  const got = gameEffects(s, game, result, extras); st.game = result;
  if ((e.shards.badgeAt || []).includes(result)) addFlag(s, e.shards.badge);
  if (game.lines?.[result]) s.today.notes.push(game.lines[result]);
  return got;
}
export function validateEvents(data, cardData, mgData) {
  const problems = [], flags = cardData?.flagsBadges || [], ids = new Set();
  for (const e of data.events || []) {
    if (!e.id || ids.has(e.id)) problems.push(`event "${e.id}" thiếu id hoặc trùng`); ids.add(e.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(e.to || '') || e.from > e.to) problems.push(`${e.id}: from/to phải là YYYY-MM-DD và from ≤ to`);
    if (e.firstOpen && cardData && !cardData.cards.some(c => c.id === e.firstOpen && isSpecialDay(c) && c.event === e.id)) problems.push(`${e.id}: firstOpen "${e.firstOpen}" phải là lá special_day có event "${e.id}"`);
    const sh = e.shards; if (!sh) continue;
    if (!(sh.count > 0) || !(sh.chance >= 0 && sh.chance <= 1) || !(sh.lines || []).length) problems.push(`${e.id}: shards cần count > 0, chance 0–1, lines`);
    if (mgData && !(mgData.games || []).some(g => g.id === sh.game)) problems.push(`${e.id}: mini-game "${sh.game}" không có trong minigames.json`);
    if (cardData && !flags.includes(sh.badge)) problems.push(`${e.id}: huy hiệu "${sh.badge}" chưa có trong flagsBadges của cards.json`);
  }
  for (const c of cardData?.cards || []) if (c.event && !ids.has(c.event)) problems.push(`${c.id}: event "${c.event}" không có trong su-kien.json`);
  return problems;
}

/* ---------- Closeness perks (than-thiet.json): two per person, on at closeness 40 and 60; data-driven ---------- */
// effect.kind decides what the engine does with it (see the note in than-thiet.json). A perk is on while closeness >= at.
let PK = {perks: [], headsUp: {}, eventHints: {}, tiers: [40, 60, 80], title80: ''};
export function usePerks(data) { if (data) PK = {...PK, ...data}; }
export const perkData = () => PK;
// gift carried from an earlier run (than-thiet.json gifts): one per run, picked on the opening; never XP, never a ticked mission
export const giftById = id => PK.gifts?.list.find(g => g.id === id) || null;
export function applyGift(s, id, npc = null) {
  const g = giftById(id); if (!g) return false;
  const e = g.effect; s.gift = {id, npc: g.pick === 'npc' ? npc : null};
  if (e.kind === 'stat_start') s.stats[e.stat] = Math.max(s.stats[e.stat], e.value);
  if (e.kind === 'close_start' && NPC_IDS.includes(npc)) s.close[npc] = Math.max(s.close[npc], e.value);
  return true;
}
const giftWake = s => { const g = s.gift && giftById(s.gift.id); return g?.effect.kind === 'wake_days' && s.day <= g.effect.days ? g.effect.pin : WAKE_PIN; };
export const perksOf = (s, kind) => PK.perks.filter(p => p.effect.kind === kind && (s.close[p.npc] ?? 0) >= p.at);
export const perkOn = (s, id) => { const p = PK.perks.find(x => x.id === id); return !!p && (s.close[p.npc] ?? 0) >= p.at; };
export const perksFor = npc => PK.perks.filter(p => p.npc === npc);
export const perkUsed = (s, id) => (s.perksUsed || []).includes(id);
const perkSpend = (s, p) => { (s.perksUsed ||= []).push(p.id); say(s, p.effect.line); };      // a once-per-run perk is used up
// news for the page to show as toasts (a perk used, a perk unlocked)
const say = (s, text) => { if (text) (s.news ||= []).push(text); };
export const takeNews = s => { const n = s.news || []; s.news = []; return n; };
// perks that just turned on (closeness crossed 40 or 60): announced once each
export function newPerks(s) {
  const seen = (s.perksSeen ||= []), out = PK.perks.filter(p => (s.close[p.npc] ?? 0) >= p.at && !seen.includes(p.id));
  for (const p of out) seen.push(p.id);
  return out;
}
// a mini-game close to the next grade (within effect.within points) goes one grade up, once per run
export function gradeFor(s, game, score) {
  const grade = gradeOf(game, score), order = MG.grades.map(g => g[0]), i = order.indexOf(grade);
  const p = perksOf(s, 'minigame_upgrade').find(x => !perkUsed(s, x.id));
  if (p && i > 0) { const up = order[i - 1], need = game.thresholds?.[up]; if (need != null && score >= need - p.effect.within) { perkSpend(s, p); return {grade: up, upgraded: true}; } }
  return {grade, upgraded: false};
}
// more time on a timed mini-game (anh Tuấn's heads-up): returns a copy of the game with longer clocks
export function perkGame(s, game) {
  const m = perksOf(s, 'heads_up').find(p => p.effect.what === 'minigame')?.effect.timeMult; if (!m) return game;
  const g = {...game}; for (const k of ['seconds', 'secondsPerQuestion']) if (g[k]) g[k] = Math.round(g[k] * m); return g;
}
// everything a page should say after a change: perks just unlocked, once-per-run perks used, and the heads-up messages (one list, same on every map)
export function perkNews(s, cards) {
  return [...newPerks(s).map(p => `Thân với ${NPC_NAME[p.npc]}: ${p.name}`), ...takeNews(s), ...headsUp(s, cards)];
}
// messages that arrive before a day: tomorrow's mini-game (evening), tomorrow's special day (evening), today's midday event (morning). Once each per day.
export function headsUp(s, cards) {
  const out = [], tips = (s.today.tips ||= []), tell = (id, text) => { if (!tips.includes(id)) { tips.push(id); out.push(text); } };
  for (const p of perksOf(s, 'heads_up')) {
    const w = p.effect.what, line = PK.headsUp[w] || '';
    const next = s.today.extra ? s.day : s.day + 1;                  // after the day outside the calendar comes the held day itself
    if (w === 'minigame' && s.part === 'evening' && isMinigameDay(next)) tell(w, line);
    if (w === 'special_day' && s.part === 'evening' && s.week?.specialDay === next) tell(w, line.replace('{title}', cardById(cards, s.week.specialId)?.title || ''));
    if (w === 'midday_event' && s.part !== 'evening' && s.today.eventId && !s.today.eventDone) {
      const c = cardById(cards, s.today.eventId); tell(w, line.replace('{title}', c?.title || '').replace('{hint}', PK.eventHints[s.today.eventId] || ''));
    }
  }
  return out;
}
export const weekOf = day => Math.floor((day - 1) / 7) + 1;   // week 1 = days 1-5, week 6 = days 36-40
// stage: an event happens somewhere: "!" over the player, a scene change to stage.spot on stage.map, then the story (pages own the spots)
export const STAGE_MAPS = ['office', 'home'];
export const isStaged = c => !!c?.stage;
export const isMidday = c => c.when === 'midday';            // office, between the morning card and the afternoon turn
export const isSpecialDay = c => c.type === 'special_day';

/* ---------- Afternoon: one free action at one place ---------- */
// place = where the player does it in the 3D world (the page maps places to hotspots)
export const ACTIONS = {
  lam_task:      {place: 'desk',    label: 'Làm task',            effects: {xp: 2, ut: 1, pin: -10}, // xp 3 -> 2 (14/11): evenings at home now pay XP too
                  lines: ['Bạn xử lý xong 12 email và một file tên "final_v7".', 'Task xong. Không ai biết, trừ bạn.', 'Bạn làm việc chăm chỉ đến mức quên đi lấy nước.']},
  hoi_senior:    {place: 'desk',    label: 'Hỏi senior học việc', effects: {xp: 2, qh: 3, pin: -5}, needQh: 20, closeness: 'senior',
                  lines: ['{senior} chỉ bạn một mẹo. Kèm ba việc nhờ.', '{senior} giảng 20 phút. Bạn hiểu được 7 phút.', '{senior}: "Hỏi thế là đúng rồi. Lần sau hỏi sớm hơn."']},
  an_trua_co_ba: {place: 'canteen', label: 'Ăn trưa với cô Ba',   effects: {pin: 15}, closeness: 'coba', closenessGain: 3,
                  lines: ['Cô Ba múc thêm cho bạn một muôi cơm.', 'Hôm nay có cá kho. Pin của bạn cũng được kho lại.', 'Cô Ba: "Ăn từ từ thôi con."']},
  tam_chuyen:    {place: 'canteen', label: 'Ngồi tám chuyện',     effects: {qh: 5, pin: 5}, needSitting: true,
                  lines: ['Bạn biết thêm ba bí mật và một công thức trà sữa.', 'Cả bàn cười to đến mức cô Ba quay lại nhìn.', 'Bạn chưa nói câu nào, nhưng đã được nhận vào hội.']},
  bao_cao_sep:   {place: 'boss',    label: 'Báo cáo anh Tuấn',    effects: {ut: 5, pin: -5}, extraChance: 0.3, extra: {pin: -5},
                  lines: ['Sếp gật đầu ba lần. Đó là mức cao nhất.', 'Sếp: "Tốt. Em làm thêm phần này luôn nhé."', 'Sếp nghe hết, rồi hỏi bạn tên gì.']},
  giup_chi_mai:  {place: 'lobby',   label: 'Giúp chị Mai',        effects: {}, closeness: 'mai', closenessGain: 3,
                  lines: ['Chị Mai: "Nghe nói đợt này sếp chấm nặng phần thái độ."', 'Chị Mai: "Chị nghe phòng nhân sự bảo chỉ có một suất Junior."', 'Chị Mai: "Ai ăn trưa một mình cả tháng là sếp để ý đấy."']},
};
const PLACE_ROOM = {desk: 'intern', canteen: 'canteen', boss: 'boss', lobby: 'lobby'};
export const PLACE_ACTIONS = Object.entries(ACTIONS).reduce((m, [id, a]) => ((m[a.place] ||= []).push(id), m), {});

const DAY_ONE = {
  id: 'D1', title: 'Ngày đầu nhận việc', type: 'milestone', npc: 'mai', room: 'lobby', heavy: false,
  intro: 'Chị Mai nhìn phiếu: "{ten} đúng không? Chị là Mai, lễ tân. Sếp bảo chị kèm em hôm nay." Rồi đưa bạn cuốn "Sổ tay nhân viên mới": "10 nhiệm vụ, làm xong trước buổi đánh giá ngày 40 là được. Thiếu một ô thôi là sếp không ký đâu."',
  choices: [{label: 'Nhận sổ tay', effects: {}, addFlags: ['co_so_tay'], comment: 'Trang đầu sổ tay ghi tay: "Chúc em {ten} may mắn." Nét chữ run run.'}],
};

export const EARLY_ENDINGS = {
  burnout: {title: 'Burnout', line: 'Bạn đã xin nghỉ để về quê nuôi gà.'},
  fired:   {title: 'Bị cho nghỉ sớm', line: 'Em mạnh dạn, nhưng mạnh dạn ở chỗ khác nhé.'},
};

/* ---------- State: one plain JSON object (what a save store keeps) ---------- */
// startRooms: cards.json rooms.start (the map opens room by room through 'unlock' cards); left out = every room open.
// name + look come from the opening (mo-dau.js): looks only, never stats (Lily 15/11).
export function newGame({name = '', look = null, rng = Math.random, startRooms = ROOM_IDS} = {}) {
  return {
    v: SAVE_VERSION,
    runId: 'r' + Math.floor(rng() * 36 ** 8).toString(36) + Date.now().toString(36),
    day: 1, part: 'morning', name, look: look || {...DEFAULT_LOOK},
    rooms: [...startRooms],
    stats: {...START},
    close: Object.fromEntries(NPC_IDS.map(n => [n, CLOSE_START])),
    flags: [], used: [], followups: [], followupsMade: [], history: [],
    counters: {actions: {}, talked: [], rooms: [], gossipWith: [], minigames: {}},
    missionsDone: [], kpiLog: [],
    home: {wallet: null},   // phòng trọ (noi-that.json): wallet null = mẹ's gift not given yet; ensureHome fills the rest
    today: freshToday(),
    ending: null,
  };
}
export const DEFAULT_LOOK = {hair: 'short', color: 'den', extra: 'none'};
// saves from before the opening only had female (the old Nam/Nữ switch)
export const lookOf = s => s?.look || {...DEFAULT_LOOK, hair: s?.female ? 'long' : 'short'};
// {ten} / {TEN} in any text = the player's name (cards, intros, notes); saves without a name read "Intern"
export const playerName = s => s?.name || 'Intern';
export const fillName = (text, s) => (typeof text === 'string' && text.includes('{') ? text.replace(/\{ten\}/g, playerName(s)).replace(/\{TEN\}/g, playerName(s).toUpperCase()) : text);
function freshToday() { return {cardId: null, cardDone: false, action: null, minigame: null, delta: {xp: 0, pin: 0, ut: 0, qh: 0}, notes: []}; }

export const hasFlag = (s, f) => s.flags.includes(f);
// A room with no 'rooms' list (saves from before the map opened gradually) counts as open; room null = anywhere.
export const roomOpen = (s, room) => !room || !s.rooms || s.rooms.includes(room);
const addFlag = (s, f) => { if (!hasFlag(s, f)) s.flags.push(f); };
const addUnique = (arr, v) => { if (!arr.includes(v)) arr.push(v); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Applies stat changes with the approved limits; qh also feeds one person's closeness.
// Returns what actually changed (after caps), so the UI shows honest numbers. xpLoss: the one exception to "XP is never lost" (Làm lơ KPI).
export function applyEffects(s, effects = {}, closenessOf = null, {xpLoss = false} = {}) {
  const got = {};
  for (const k of STATS) {
    let d = effects[k] || 0;
    if (k === 'xp' && d < 0 && !xpLoss) d = 0;          // XP is never lost (except Làm lơ KPI)
    if (d < 0 && !xpLoss) { const f = perksOf(s, 'forgive_loss').find(p => p.effect.stat === k && d <= -p.effect.min && !perkUsed(s, p.id)); if (f) { perkSpend(s, f); d = 0; } }  // chị Hằng nói đỡ
    const before = s.stats[k], after = clamp(before + d, 0, CAP[k]);
    s.stats[k] = after; if (after !== before) got[k] = after - before; s.today.delta[k] += after - before;
  }
  if (closenessOf && NPC_IDS.includes(closenessOf) && effects.qh) changeCloseness(s, closenessOf, effects.qh, got);
  return got;
}
function changeCloseness(s, npc, d, got) {
  const before = s.close[npc], after = clamp(before + d, 0, 100);
  s.close[npc] = after; if (after !== before) (got.close ||= {})[npc] = after - before;
}

/* ---------- Card rules ---------- */
export function requiresOk(s, req) {
  if (!req) return true;
  if (req.flags && !req.flags.every(f => hasFlag(s, f))) return false;
  if (req.anyFlags && !req.anyFlags.some(f => hasFlag(s, f))) return false;
  if (req.notFlags && req.notFlags.some(f => hasFlag(s, f))) return false;
  if (req.stats && !Object.entries(req.stats).every(([k, v]) => s.stats[k] >= v)) return false;
  if (req.closeness && !Object.entries(req.closeness).every(([k, v]) => (s.close[k] ?? 0) >= v)) return false;
  if (req.closeCount && Object.values(s.close).filter(v => v >= req.closeCount.min).length < req.closeCount.count) return false;   // "at least N people at closeness >= min"
  if (req.actions && !Object.entries(req.actions).every(([k, v]) => (s.counters.actions[k] || 0) >= v)) return false;            // "did this afternoon action at least n times"
  return true;
}
const DRAWABLE = new Set(['normal', 'invitation', 'character_event']);
// when: "night" = a phone message that arrives in the evening at the rented room, never in the morning draw
export const isNightCard = c => c.when === 'night';
export const isVisit = c => c.type === 'visit';   // a colleague comes to the rented room to work with you (always a night card)

// Morning draw, in the approved order: due follow-ups, unlocked character events, filter, pacing, weight.
export function drawCard(s, cards, rng = Math.random) {
  const byId = id => cards.find(c => c.id === id);
  const due = s.followups.filter(f => f.due <= s.day).sort((a, b) => a.due - b.due);
  for (const f of due) {
    const c = byId(f.card);
    if (c && !roomOpen(s, c.room)) continue;                // waits in the queue until its room opens
    s.followups.splice(s.followups.indexOf(f), 1);
    if (c && requiresOk(s, c.requires)) return c;
  }
  const phase = phaseOf(s.day);
  const deck = rulesToday(s, cards).deck;                    // special day with its own deck (Giếng thần): only those cards; deck cards never come otherwise
  let pool = cards.filter(c => DRAWABLE.has(c.type) && !c.when && (c.phases || []).includes(phase) && requiresOk(s, c.requires) && eventOk(c)
    && roomOpen(s, c.room) && (!s.used.includes(c.id) || c.repeatable) && (c.weight ?? 0) > 0 && (!c.deck || c.deck === deck));
  if (deck && pool.some(c => c.deck === deck)) return weighted(pool.filter(c => c.deck === deck), rng);
  const only = rulesToday(s, cards).npc;                     // special day (e.g. sếp tổng ghé): the morning belongs to this person
  if (only && pool.some(c => c.npc === only)) return weighted(pool.filter(c => c.npc === only), rng);
  const event = pool.find(c => c.type === 'character_event');
  if (event) return event;
  const last = s.history.at(-1), prev = s.history.at(-2);
  const twoHeavy = last?.heavy && prev?.heavy;
  let paced = pool.filter(c => !(last && c.npc && c.npc === last.npc) && !(twoHeavy && c.heavy));
  if (!paced.length) paced = pool;                          // a small deck beats an empty morning
  return weighted(paced, rng);
}
function weighted(list, rng) {
  const w = c => c.weight ?? 1, total = list.reduce((a, c) => a + w(c), 0); if (!total) return null;
  let r = rng() * total;
  for (const c of list) { r -= w(c); if (r < 0) return c; }
  return list.at(-1);
}

/* ---------- Day flow ---------- */
// part: morning (card) -> afternoon (one free action) -> evening (17:55 summary, then the rented room) -> next working day
// milestone mornings: day 1 handbook, days 12/26/40 mini-game; the weekend is a short screen.
// Who sits in the canteen this afternoon: each senior 50%, never nobody (so gossip is always possible).
export function rollCanteen(rng = Math.random) {
  const here = SENIORS.filter(() => rng() < 0.5);
  return here.length ? here : [SENIORS[Math.floor(rng() * SENIORS.length)]];
}
export function startMorning(s, cards, rng = Math.random) {
  drawDay(s, cards, rng);
  const c = s.pendingSpecial && s.day > 2 && cardById(cards, s.pendingSpecial);   // an event's day waiting for the next morning (queueEventDay); never before day 3 (Lily 19/11: a new player first plays day 1 and day 2)
  if (c) { s.pendingSpecial = null; if (eventOk(c) && !(s.played || []).includes(c.id)) startExtraDay(s, cards, c, rng); }
}
function drawDay(s, cards, rng) {
  s.today = freshToday(); s.part = 'morning'; s.today.canteen = rollCanteen(rng);
  // 08:29 room opening: runs before the morning card and does not replace it
  const unlock = cards.find(c => c.type === 'unlock' && c.day === s.day && !roomOpen(s, c.unlocks));
  if (unlock) s.today.unlockId = unlock.id;
  if (s.week?.n !== weekOf(s.day)) startWeek(s, cards, rng);
  if (s.week.specialDay === s.day && !eventOk(cardById(cards, s.week.specialId) || {})) s.week.specialDay = null;   // its event ended before the day came
  if (s.week.specialDay === s.day) { s.today.specialId = s.week.specialId; s.today.specialRules = cardById(cards, s.week.specialId)?.rules?.actions || {}; } // 08:29, after a room opening, before the card
  if (s.day === 1) { s.today.cardId = DAY_ONE.id; return; }
  rollShards(s, cards, rng);                                 // live event (su-kien.json): maybe a shard this morning
  const mg = drawMinigame(s, rng);
  if (mg) { s.today.minigame = mg.id; return; }             // milestone morning: a mini-game instead of a card
  drawMidday(s, cards, rng);
  if (rulesToday(s, cards).skipMorningCard) return;         // e.g. mưa ngập: you arrive late, the special day's card ends the morning
  const c = drawCard(s, cards, rng);
  if (!c) { s.today.cardDone = true; s.part = 'afternoon'; s.today.notes.push('Sáng nay yên bình đến lạ.'); return; }
  s.today.cardId = c.id; addUnique(s.used, c.id);
  s.history.push({day: s.day, card: c.id, npc: c.npc, heavy: !!c.heavy});
}
// a quiet working day: not day 1, not a milestone (mini-game) day, not a room opening, not the last day
const ordinaryDay = (s, cards, day) => day > 1 && day < TOTAL_DAYS && !isWeekend(day) && !isMinigameDay(day) && !cards.some(c => c.type === 'unlock' && c.day === day);
// Office event between the morning card and the afternoon (when "midday"): rolled at 08:29, played once the morning is done.
function drawMidday(s, cards, rng) {
  if (!ordinaryDay(s, cards, s.day) || rng() >= (RH.events.midday || 0)) return;
  const phase = phaseOf(s.day);
  const pool = cards.filter(c => isMidday(c) && (c.phases || []).includes(phase) && !s.used.includes(c.id) && roomOpen(s, c.room) && requiresOk(s, c.requires) && eventOk(c));
  const c = weighted(pool, rng);
  if (c) { s.today.eventId = c.id; addUnique(s.used, c.id); }
}
// the event waiting right now: only after the morning card (or mini-game) is done and before the afternoon turn is used
export const todaysEvent = (s, cards) => (s.today.eventId && !s.today.eventDone && s.today.cardDone && s.part === 'afternoon' && !s.today.action ? cardById(cards, s.today.eventId) : null);

/* ---------- Week: a special day (maybe) and a KPI from anh Tuấn (nhip-choi.json) ---------- */
// saves from before 15/11 have no week: start it where the run stands, so the KPI shows today instead of next Monday
export function catchUpWeek(s, cards, rng = Math.random) {
  s.kpiLog ||= []; if (s.week?.n === weekOf(s.day) || isWeekend(s.day)) return;
  startWeek(s, cards, rng); if (weekday(s.day) > 2) s.week.kpi = null;   // from Thursday a week's KPI cannot be met: it starts next Monday
}
function startWeek(s, cards, rng) {
  const n = weekOf(s.day);
  s.week = {n, base: {actions: {...s.counters.actions}, stats: {...s.stats}}, low: {...s.stats}, kpi: null, kpiSeen: false, specialDay: null, specialId: null};
  if (RH.kpi.weeks.includes(n)) {
    const used = (s.kpiLog || []).map(k => k.id), fresh = RH.kpi.pool.filter(k => !used.includes(k.id));
    const k = weighted(fresh.length ? fresh : RH.kpi.pool, rng); if (k) s.week.kpi = k.id;
    const head = k?.goal.type === 'action_count' && perksOf(s, 'kpi_head')[0];            // anh Tùng sits next to you: one done already
    if (head) s.week.base.actions[k.goal.action] = (s.week.base.actions[k.goal.action] || 0) - head.effect.count;
  }
  if (RH.specialDays.weeks.includes(n)) {
    const phase = phaseOf(s.day), days = [0, 1, 2, 3, 4].map(w => (n - 1) * 7 + 1 + w).filter(d => d >= s.day && ordinaryDay(s, cards, d));
    const pool = cards.filter(c => isSpecialDay(c) && !s.used.includes(c.id) && (c.phases || [1, 2, 3]).includes(phase) && requiresOk(s, c.requires) && roomOpen(s, c.room) && !c.event   // an event's day comes only through queueEventDay (once per player)
      && days.some(d => c.weekday == null || weekday(d) === c.weekday));
    const c = rng() < RH.specialDays.chance ? weighted(pool, rng) : null;
    if (c) { const fit = days.filter(d => c.weekday == null || weekday(d) === c.weekday); s.week.specialDay = fit[Math.floor(rng() * fit.length)]; s.week.specialId = c.id; addUnique(s.used, c.id); }
  }
}
// A draft run that starts on the morning of one special day (?thu=<event id>, Lily 19/11: to see an event at once). Never saved by the page.
// day 11 = Thursday of week 2: not a room opening, not a mini-game day. The week's KPI counts as already read so the day opens on the special day.
export function tryDay(cards, specialId, {name = '', look = null, day = 11, rng = Math.random} = {}) {
  const s = newGame({name, look, rng}); s.day = day; addFlag(s, 'co_so_tay');
  startWeek(s, cards, rng); s.week.kpiSeen = true; startMorning(s, cards, rng);
  const c = cardById(cards, specialId); if (isSpecialDay(c || {}) && c.event) startExtraDay(s, cards, c, rng);
  else Object.assign(s.today, {specialId, specialRules: c?.rules?.actions || {}});
  return s;
}
// The event's day sits OUTSIDE the calendar (Lily 19/11): the real day is held (s.heldDay) with all it brought (room opening,
// the week's special day, KPI note, mini-game, morning card, midday event) and comes back untouched the morning after.
// So nothing is lost or moved: day numbers, weeks, KPI Friday, day 40 stay as they were. Stats and actions on it count as usual.
function startExtraDay(s, cards, c, rng, again = 0) {
  s.heldDay = s.today; s.today = freshToday(); s.part = 'morning';
  Object.assign(s.today, {extra: true, canteen: rollCanteen(rng), specialId: c.id, specialRules: c.rules?.actions || {}}); addUnique(s.used, c.id);
  if (again) s.today.again = again;                                   // the 2nd, 3rd... well day in a row (the page tells it differently)
  rollShards(s, cards, rng);
  if (!c.rules?.skipMorningCard) { const d = drawCard(s, cards, rng); if (d) { s.today.cardId = d.id; addUnique(s.used, d.id); s.history.push({day: s.day, card: d.id, npc: d.npc, heavy: !!d.heavy}); } }
}
// after the day outside the calendar: the held day starts, as it was, with this morning's wake-up;
// or, shards still missing (wellReturns), the well pulls the player back to 2005 for one more day before it
function endExtraDay(s, cards, rng) {
  const back = wellReturns(s, cards) && cardById(cards, s.today.specialId), again = (s.today.again || 1) + 1;
  s.today = {...s.heldDay, wakeShown: false}; s.heldDay = null; s.part = 'morning';
  if (back) startExtraDay(s, cards, back, rng, again);
}
export const isExtraDay = s => !!s.today?.extra;
export const isLastDay = s => s.day >= TOTAL_DAYS && !s.today?.extra;   // day 40 itself (the verdict), not a well day before it
export const dayName = s => (s.today?.extra ? 'Ngày ngoài lịch' : `Ngày ${s.day}`);
export const dayLine = s => (s.today?.extra ? `Ngày ngoài lịch (trước ngày ${s.day})` : `Ngày ${s.day} / ${TOTAL_DAYS}`);   // the HUD's day
// Event day on first open (su-kien.json firstOpen, Lily 19/11): the player meets the event's special day right away, once per player
// (the page keeps "once" in the profile). It always wins and takes nothing's place: it is a day outside the calendar (startExtraDay).
// Returns 'now' (this morning is that day), 'later' (the next morning in the office) or 'done' (played in this run).
// now: any morning in the office from day 2 on, whatever it holds; later: afternoon, evening, weekend, day 1, a run that ended.
// Waiting since day 1 (a new run), it lets day 2 pass first: a new player plays day 1 and day 2 as usual, the well comes before day 3 (Lily 19/11).
export function queueEventDay(s, cards, id, rng = Math.random) {
  const c = cardById(cards, id); if (!c || !eventOk(c)) return null;
  if ((s.played || []).includes(id)) return 'done';
  if (s.today.specialId === id || s.pendingSpecial === id) return s.today.specialId === id ? 'now' : 'later';
  if (s.part !== 'morning' || s.ending || s.day <= 1) { s.pendingSpecial = id; return 'later'; }
  startExtraDay(s, cards, c, rng);
  return 'now';
}
export const todaysSpecial = (s, cards) => (s.today.specialId && !s.today.specialDone ? cardById(cards, s.today.specialId) : null);
// the special day's rules apply all day once it is announced (and also before, so a reload cannot dodge them)
export const rulesToday = (s, cards) => (s.today.specialId ? cardById(cards, s.today.specialId)?.rules || {} : {});
export const kpiById = id => RH.kpi.pool.find(k => k.id === id) || null;
export const kpiToAnnounce = s => (s.week?.kpi && !s.week.kpiSeen && s.part === 'morning' && !s.today.extra ? kpiById(s.week.kpi) : null);
export function kpiSeen(s) { if (s.week) s.week.kpiSeen = true; }
// "Làm lơ" (Lily 15/11): no KPI this week (nothing scored Friday), and one random stat drops by a random 2-5 right away.
// The stat is drawn from all four, XP included: Làm lơ is the one place XP can be lost (Lily 15/11).
// Logged in kpiLog (ok: false, ignored: true) so the same note does not come back next week. Returns what actually changed.
export const KPI_IGNORE_COST = [2, 5], KPI_IGNORE_STATS = STATS;
export function kpiIgnore(s, rng = Math.random) {
  const k = s.week?.kpi && kpiById(s.week.kpi); if (!k || s.week.kpiSeen) return null;
  const stat = KPI_IGNORE_STATS[Math.floor(rng() * KPI_IGNORE_STATS.length)], [lo, hi] = KPI_IGNORE_COST, amount = lo + Math.floor(rng() * (hi - lo + 1));
  s.week.kpiSeen = true; s.week.kpi = null; s.week.kpiIgnored = {id: k.id, stat, amount};
  (s.kpiLog ||= []).push({week: s.week.n, id: k.id, ok: false, ignored: true});
  return {kpi: k, stat, amount, got: applyEffects(s, {[stat]: -amount}, null, {xpLoss: true})};
}
function kpiDone(s, g) {
  const b = s.week.base;
  switch (g.type) {
    case 'action_count': return (s.counters.actions[g.action] || 0) - (b.actions[g.action] || 0) >= g.count;
    case 'stat_min': return s.week.low[g.stat] >= g.min;                       // lowest value at 17:55 this week (and now)
    case 'stat_gain': return s.stats[g.stat] - b.stats[g.stat] >= g.gain;
    default: return false;
  }
}
// HUD line: {kpi, a, b, done}; a/b = progress (stat_min shows the week's low against the floor)
export function kpiStatus(s) {
  const k = s.week?.kpi && kpiById(s.week.kpi); if (!k) return null;
  const g = k.goal, b = s.week.base;
  const [a, of] = g.type === 'action_count' ? [Math.min(g.count, (s.counters.actions[g.action] || 0) - (b.actions[g.action] || 0)), g.count]
    : g.type === 'stat_gain' ? [Math.max(0, Math.min(g.gain, s.stats[g.stat] - b.stats[g.stat])), g.gain]
    : [Math.min(s.week.low[g.stat], s.stats[g.stat]), g.min];
  return {kpi: k, a, b: of, done: kpiDone(s, g) && (g.type !== 'stat_min' || s.stats[g.stat] >= g.min)};
}
// one HUD line, same on every map: "KPI tuần: Báo cáo anh Tuấn 2 lần · 1/2"
export function kpiLine(s) {
  const st = kpiStatus(s); if (!st) return '';
  const g = st.kpi.goal, prog = g.type === 'stat_min' ? `${STAT_NAME[g.stat]} thấp nhất tuần: ${st.a}` : `${st.a}/${st.b}`;
  return `KPI tuần: ${st.kpi.title} · ${st.done ? 'Đạt ✓' : prog}`;
}
// Friday night, before the weekend: the KPI is scored. Reward if met; nothing lost if not (Lily 15/11: keep it relaxed). An ignored KPI is not scored.
function scoreWeek(s) {
  const st = kpiStatus(s); if (!st || s.week.scored) return null;
  s.week.scored = true;
  let ok = st.done, rescued = false;
  if (!ok) { const p = perksOf(s, 'kpi_rescue').find(x => !perkUsed(s, x.id)); if (p) { perkSpend(s, p); ok = rescued = true; } }   // anh Tùng finishes it for you, once
  const got = ok ? applyEffects(s, st.kpi.reward) : {};
  (s.kpiLog ||= []).push({week: s.week.n, id: st.kpi.id, ok});
  const badge = RH.kpi.badge;
  if (badge && s.kpiLog.filter(k => k.ok).length >= badge.min) addFlag(s, badge.flag);
  return {kpi: st.kpi, ok, got, rescued, line: ok ? st.kpi.lineOk : st.kpi.lineFail};
}
export const cardById = (cards, id) => (id === DAY_ONE.id ? DAY_ONE : cards.find(c => c.id === id) || null);
export const todaysCard = (s, cards) => (s.today.cardId ? cardById(cards, s.today.cardId) : null);
export const todaysUnlock = (s, cards) => (s.today.unlockId && !s.today.unlockDone ? cardById(cards, s.today.unlockId) : null);

// A card that resolves itself when the player already has the right flags (e.g. U2).
export const autoResolves = (s, c) => !!(c.autoResolve && c.autoResolve.ifFlags.every(f => hasFlag(s, f)));

export function chooseOption(s, c, index) {
  let got, comment, label;
  if (autoResolves(s, c)) {
    got = applyEffects(s, c.autoResolve.effects, c.npc); comment = c.autoResolve.comment; label = null;
  } else {
    const ch = c.choices[index];
    const target = 'qhTarget' in ch ? ch.qhTarget : c.npc;
    got = applyEffects(s, ch.effects, target);
    (ch.addFlags || []).forEach(f => addFlag(s, f));
    if (ch.followup) {
      const key = c.id + '>' + ch.followup.card;
      if (!s.followupsMade.includes(key)) { s.followupsMade.push(key); s.followups.push({card: ch.followup.card, due: s.day + ch.followup.afterDays}); }
    }
    comment = ch.comment || null; label = ch.label;
  }
  addUnique(s.played ||= [...(s.used || [])], c.id);                       // every card ever answered: the collection (ho-so.js) lists events, special days and character events from it
  if (c.sceneAt) addUnique(s.rooms ||= [...ROOM_IDS], c.sceneAt); // (a save with no rooms list had every room open)           // the event took you there: from now on you know the way
  if (c.type === 'unlock') { s.today.unlockDone = true; addUnique(s.rooms, c.unlocks); recordRoom(s, c.unlocks); } // the morning card still follows
  else if (isSpecialDay(c)) { s.today.specialDone = true; if (c.rules?.skipMorningCard) { s.today.cardDone = true; s.part = 'afternoon'; } }
  else if (isMidday(c)) s.today.eventDone = true;          // the afternoon turn follows
  else if (isNightCard(c)) s.today.nightDone = true;     // evening at home: the day part stays 'evening'
  else { s.today.cardDone = true; if (c.type !== 'weekend') s.part = 'afternoon'; }
  if (comment) s.today.notes.push(comment);
  return {got, comment, label};
}

// result: a grade id. extras: side effects the game itself earned, e.g. [{effects: {qh: 2}, npc: 'linh'}] for a favour done.
// cost + reward of a grade, plus the extras: shared by milestone mini-games and event mini-games
function gameEffects(s, game, result, extras) {
  const got = {}, add = g => { for (const [k, v] of Object.entries(g)) if (k === 'close') for (const [n, d] of Object.entries(v)) (got.close ||= {})[n] = (got.close[n] || 0) + d; else got[k] = (got[k] || 0) + v; };
  const base = {}; for (const e of [game.cost, game.rewards?.[result]]) for (const [k, v] of Object.entries(e || {})) base[k] = (base[k] || 0) + v;
  add(applyEffects(s, base));
  for (const x of extras) add(applyEffects(s, x.effects, x.npc || null));
  return got;
}
export function playMinigame(s, result, extras = []) {
  const id = s.today.minigame, game = minigameById(id) || {}, got = gameEffects(s, game, result, extras);
  s.counters.minigames[id] = result; (s.counters.minigameDays ||= {})[s.day] = result; s.today.cardDone = true;
  if (game.lines?.[result]) s.today.notes.push(game.lines[result]);
  s.part = isLastDay(s) ? 'evening' : 'afternoon';
  return got;
}

// today's special-day rule for one afternoon action: {off: "why"} | {mult: {qh: 2, close: 2}} | {add: {ut: 2}}
const ruleFor = (s, id) => (s.today.specialRules || {})[id] || {};
export function actionAvailable(s, id, ctx = {}) {
  const a = ACTIONS[id];
  if (s.part !== 'afternoon' || s.today.action) return {ok: false, why: 'Hết lượt chiều'};
  if (s.today.eventId && !s.today.eventDone) return {ok: false, why: 'Đang có chuyện, xử lý xong đã'};
  if (ruleFor(s, id).off) return {ok: false, why: ruleFor(s, id).off};
  if (a.needQh && s.stats.qh < a.needQh) return {ok: false, why: `Cần Quan hệ từ ${a.needQh}`};
  if (!roomOpen(s, PLACE_ROOM[a.place])) return {ok: false, why: 'Phòng này chưa mở'};
  if (a.needSitting && !(ctx.sitting || []).length) return {ok: false, why: 'Chưa có ai ngồi căng tin'};
  return {ok: true};
}
// ctx: {sitting: [npc ids at the canteen], partner: the one you gossip with, senior: npc id who answers questions}
export function doAction(s, id, ctx = {}, rng = Math.random) {
  const a = ACTIONS[id], r = ruleFor(s, id);
  let effects = {...a.effects}, extraNote = null;
  for (const [k, m] of Object.entries(r.mult || {})) if (k in effects) effects[k] *= m;
  for (const [k, v] of Object.entries(r.add || {})) effects[k] = (effects[k] || 0) + v;
  for (const p of perksOf(s, 'action_add')) if (p.effect.action === id) for (const [k, v] of Object.entries(p.effect.effects)) effects[k] = (effects[k] || 0) + v;   // closeness perks
  const closeMult = r.mult?.close || 1;
  if (a.extraChance && !perksOf(s, 'no_extra').some(p => p.effect.action === id) && rng() < a.extraChance) { for (const [k, v] of Object.entries(a.extra)) effects[k] = (effects[k] || 0) + v; extraNote = 'Bạn bị giao thêm việc.'; }
  const target = a.closeness === 'senior' ? ctx.senior : null;
  const got = applyEffects(s, effects, target);
  if (a.closeness && a.closeness !== 'senior') changeCloseness(s, a.closeness, a.closenessGain * closeMult, got);
  if (id === 'tam_chuyen') { const n = ctx.partner || ctx.sitting[0]; changeCloseness(s, n, 5 * closeMult, got); addUnique(s.counters.gossipWith, n); } // only the one you sit next to
  s.counters.actions[id] = (s.counters.actions[id] || 0) + 1;
  for (const p of perksOf(s, 'wake_bonus')) if (p.effect.after === id) s.bonusWake = (s.bonusWake || 0) + p.effect.pin;   // cô Ba's lunchbox: tomorrow's wake-up
  s.today.action = id; s.part = 'evening';
  const line = a.lines[Math.floor(rng() * a.lines.length)].replace('{senior}', NPC_NAME[ctx.senior] || 'Senior');
  s.today.notes.push(line); if (extraNote) s.today.notes.push(extraNote);
  return {got, line: extraNote ? line + ' ' + extraNote : line};
}

/* ---------- Quán trà sữa dưới tòa nhà (Lily 14/11): opens with the first card that has sceneAt "trasua"; then once per working day, after the morning, before going home; no afternoon turn ---------- */
export const TEA = {
  self:      {label: 'Mua một ly cho mình',                  effects: {pin: 2}},
  colleague: {label: 'Mua một ly mang lên cho đồng nghiệp', effects: {qh: 1}},  // Quan hệ chung only, nobody's closeness
};
export const teaOpen = s => !s.ending && s.rooms?.includes('trasua') && !isLastDay(s) && (s.part === 'afternoon' || (s.part === 'evening' && !s.today.atHome));
export function buyTea(s, kind) {
  if (!teaOpen(s) || s.today.tea || !TEA[kind]) return null;
  s.today.tea = kind; (s.counters.tea ||= {})[kind] = (s.counters.tea[kind] || 0) + 1;
  return {got: applyEffects(s, TEA[kind].effects)};
}

/* ---------- Phòng trọ: ví tiền và nội thất (noi-that.json, Lily 17/11). No item changes a stat: looks, lines and the cat only ---------- */
// The page loads noi-that.json and calls useFurniture(data) once. Without it (office, tea shop, the simulator): no wallet, no pay, nothing to buy.
// Save shape (added on read, SAVE_VERSION stays 1): home = {wallet, room, owned: {id: n}, placed: {roomId: [{id, x, z, rot}]}, paid: [days]}
// A save from before the feature has no home: it starts with 0 and an empty room. A new game has home.wallet null: the first read gives mẹ's gift.
let NT = null;
export function useFurniture(data) { if (data) NT = data; }
export const furnitureData = () => NT;
export const itemById = id => NT?.items.find(i => i.id === id) || null;
export function ensureHome(s) {
  if (!NT || !s) return null;
  const h = (s.home ||= {wallet: 0});
  if (h.wallet == null) h.wallet = NT.money.start;
  h.room ||= Object.keys(NT.rooms)[0]; h.owned ||= {}; h.placed ||= {}; h.paid ||= [];
  h.placed[h.room] ||= [];
  return h;
}
export const homeRoom = s => (ensureHome(s) ? NT.rooms[s.home.room] : null);
export const placedHere = s => (ensureHome(s) ? s.home.placed[s.home.room] : []);
export const isPlaced = (s, id) => placedHere(s).some(p => p.id === id);
export const ownedCount = (s, id) => ensureHome(s)?.owned[id] || 0;
export const hasBox = s => !!NT?.box && ownedCount(s, NT.box) > 0;
// owned but not standing in this room: with a box they wait in it; without one they are waiting to be placed (the page places them)
export function unplaced(s) {
  if (!ensureHome(s)) return [];
  const here = placedHere(s), out = [];
  for (const it of NT.items) { const n = ownedCount(s, it.id) - here.filter(p => p.id === it.id).length; if (n > 0) out.push({item: it, n}); }
  return out;
}
// Friday night (paydays in noi-that.json): weekly allowance, plus a bonus when the week's KPI was met. Once per day, kept in home.paid.
function payday(s, kpi) {
  const h = ensureHome(s); if (!h || !NT.money.paydays.includes(s.day) || h.paid.includes(s.day)) return null;
  const pay = {weekly: NT.money.weekly, kpi: kpi?.ok ? NT.money.kpiBonus : 0};
  h.wallet += pay.weekly + pay.kpi; h.paid.push(s.day);
  return pay;
}
// Chợ Trọ opens with chị Mai's message (noi-that.json unlock.card): it arrives on the laptop the first evening after you helped her twice.
// It is not a morning card and takes no card slot, so the balance stays as it was (Lily 17/11). From then on the laptop shows "Chợ Trọ".
export const shopOpen = s => !!NT && hasFlag(s, NT.unlock.flag);
export const shopInvite = s => (NT && !shopOpen(s) && requiresOk(s, NT.unlock.card.requires) ? NT.unlock.card : null);
export function answerShopInvite(s, index) {
  const c = shopInvite(s), ch = c?.choices[index]; if (!ch) return null;
  (ch.addFlags || []).forEach(f => addFlag(s, f)); addFlag(s, NT.unlock.flag);
  return {got: {}, comment: ch.comment || null, label: ch.label};
}
export function canBuy(s, id) {
  const it = itemById(id), h = ensureHome(s);
  if (!it || !h) return {ok: false, why: 'Không có món này'};
  if (!shopOpen(s)) return {ok: false, why: 'Chợ Trọ chưa mở'};
  if ((h.owned[id] || 0) >= (it.max || 1)) return {ok: false, sold: true, why: 'Đã có'};
  if (it.price > h.wallet) return {ok: false, why: `Thiếu ${it.price - h.wallet} nghìn`};
  return {ok: true};
}
// buying never places: the page then places it (no box, or the box itself) or it waits in the box. Returns {item, mustPlace}.
export function buyItem(s, id) {
  if (!canBuy(s, id).ok) return null;
  const it = itemById(id), h = s.home; h.wallet -= it.price; h.owned[id] = (h.owned[id] || 0) + 1;
  return {item: it, mustPlace: mustPlace(s, id), badge: completeStyles(s)};
}
// Room styles (noi-that.json styles, Lily 18/11): own every item of a style (bought, placed or not) and its badge flag is yours, once.
export const styleOf = id => NT?.styles?.find(st => st.items.includes(id)) || null;
export const styleProgress = (s, st) => [st.items.filter(id => ownedCount(s, id) > 0).length, st.items.length];
// gives the badges you have just completed; returns the first new one ({style, flag}) for the page's toast, or null
export function completeStyles(s) {
  let got = null;
  for (const st of NT?.styles || []) {
    const [n, all] = styleProgress(s, st);
    if (n === all && !hasFlag(s, st.badge)) { addFlag(s, st.badge); got ||= {style: st, flag: st.badge}; }
  }
  return got;
}
// the box itself, and anything bought before the box, has nowhere to wait: it goes straight into the room
export const mustPlace = (s, id) => !hasBox(s) || id === NT?.box;
// x, z = floor corner after rotation (same as noi-that.js placeItem), rot = quarter turns; a slot item ignores them and goes to its slot.
// The page checks the spot is free (it knows the walls and the walk grid); the engine keeps the counts honest. Returns the index or -1.
export function putItem(s, id, x, z, rot = 0) {
  const it = itemById(id); if (!it || !unplaced(s).some(u => u.item.id === id)) return -1;
  const slot = it.slot && homeRoom(s).slots?.[it.slot];
  const here = placedHere(s); here.push(slot ? {id, x: slot.x, z: slot.z, rot: slot.rot || 0} : {id, x, z, rot: rot % 4});
  return here.length - 1;
}
export function moveItem(s, index, x, z, rot = 0) {
  const p = placedHere(s)[index], it = p && itemById(p.id); if (!it || it.slot) return false;
  Object.assign(p, {x, z, rot: rot % 4}); return true;
}
export const canStore = (s, index) => { const p = placedHere(s)[index]; return !!p && hasBox(s) && p.id !== NT.box; };
export function storeItem(s, index) { if (!canStore(s, index)) return false; placedHere(s).splice(index, 1); return true; }

// 17:55: the only moment burnout and early dismissal are checked (the afternoon can still save you).
export function endOfDay(s) {
  if (s.week) for (const k of STATS) s.week.low[k] = Math.min(s.week.low[k], s.stats[k]);   // KPI "giữ Pin từ 30" looks at 17:55
  const d = s.today.delta, net = d.xp + d.ut + d.qh;   // the day strip on the share card: g = a day that gained, r = ended with Pin under 20
  if (!s.today.extra) (s.dayLog ||= {})[s.day] = {g: net > 0 ? 1 : 0, r: s.stats.pin < 20 ? 1 : 0};
  if (s.stats.pin <= 0) s.ending = 'burnout';
  else if (s.stats.ut < 10) s.ending = 'fired';
  else if (isLastDay(s)) s.ending = 'review';   // day 40 evaluation arrives in step 3
  if (s.ending) s.part = 'over';
  return s.ending;
}
// Evening at the rented room (after 17:55 passed): sometimes a night message, never on Friday (the weekend screen follows).
export function drawNight(s, cards, rng = Math.random) {
  if (s.part !== 'evening' || s.today.nightDrawn) return null;
  s.today.nightDrawn = true;
  if (weekday(s.day) === 4) return null;
  const phase = phaseOf(s.day);
  const pool = cards.filter(c => isNightCard(c) && (c.phases || []).includes(phase) && !s.used.includes(c.id) && requiresOk(s, c.requires) && eventOk(c));
  // type 'visit': a colleague comes over to work. The first one arrives the first evening it is unlocked (Quan hệ >= 70),
  // and it is the colleague you are closest to; later visits wait in the normal pool.
  const visits = pool.filter(isVisit), firstVisit = !cards.some(c => isVisit(c) && s.used.includes(c.id));
  const c = visits.length && firstVisit ? visits.reduce((a, b) => ((s.close[b.npc] ?? 0) > (s.close[a.npc] ?? 0) ? b : a))
          : pool.length && rng() < NIGHT_CARD_CHANCE ? weighted(pool, rng) : null;
  if (c) { s.today.nightCardId = c.id; addUnique(s.used, c.id); }
  return c;
}
export const tonightsCard = (s, cards) => (s.today.nightCardId && !s.today.nightDone ? cardById(cards, s.today.nightCardId) : null);
/* ---------- Where the player is: the office by day; the rented room after 17:55 and at weekends ---------- */
export const isAtHome = s => s.part === 'weekend' || (s.part === 'evening' && !!s.today.atHome);
export function goHome(s) { if (s.part === 'evening') s.today.atHome = true; }
// Friday evening -> weekend screen: Pin +20 first, then sometimes a weekend card.
export function nextDay(s, cards, rng = Math.random) {
  if (s.today.extra) { wakeUp(s, cards, rng, endExtraDay); return {weekend: false}; }   // the day outside the calendar is over: the held day starts
  if (weekday(s.day) === 4) {
    const kpi = scoreWeek(s), pay = payday(s, kpi);
    s.part = 'weekend'; s.today = freshToday(); s.today.kpiResult = kpi;
    const got = applyEffects(s, {pin: 20});
    const phase = phaseOf(s.day + 3);
    const pool = cards.filter(c => c.type === 'weekend' && (c.phases || []).includes(phase) && !s.used.includes(c.id) && requiresOk(s, c.requires) && eventOk(c));
    const c = pool.length && rng() < WEEKEND_CARD_CHANCE ? weighted(pool, rng) : null;
    if (c) { s.today.cardId = c.id; addUnique(s.used, c.id); }
    return {weekend: true, got, card: c, kpi, pay};
  }
  s.day += 1; wakeUp(s, cards, rng);
  return {weekend: false};
}
export function endWeekend(s, cards, rng = Math.random) { s.day += 3; wakeUp(s, cards, rng); }
// waking up: Pin +5, then the morning starts; the gain is kept on today.wake (not in the day's summary) so the page can announce it once
function wakeUp(s, cards, rng, start = startMorning) { const got = applyEffects(s, {pin: giftWake(s) + (s.bonusWake || 0)}); s.bonusWake = 0; start(s, cards, rng); s.today.wake = got; }

/* ---------- Handbook missions ---------- */
export function recordTalk(s, npc) { if (NPC_IDS.includes(npc)) addUnique(s.counters.talked, npc); }
export function recordRoom(s, room) { if (room) addUnique(s.counters.rooms, room); }
const RANK = {truot: 0, dat: 1, xuat_sac: 2};
function missionDone(s, g) {
  switch (g.type) {
    case 'talk_all_npcs': return g.npcs.every(n => s.counters.talked.includes(n));
    case 'visit_all_rooms': return g.rooms.every(r => s.counters.rooms.includes(r));
    case 'action_count': return (s.counters.actions[g.action] || 0) >= g.count;
    case 'gossip_distinct_npcs': return s.counters.gossipWith.length >= g.count;
    case 'minigame_result': { // by milestone day (days: [12, 26]) or by game id (minigames: [...])
      const results = g.days ? g.days.map(d => s.counters.minigameDays?.[d]) : g.minigames.map(m => s.counters.minigames[m]);
      const ok = r => r != null && RANK[r] >= RANK[g.minResult]; return g.anyOf ? results.some(ok) : results.every(ok); }
    case 'closeness_any': return Object.values(s.close).some(v => v >= g.min);
    case 'has_flag': return hasFlag(s, g.flag);
    default: return false;
  }
}
export function missionProgress(s, g) {
  switch (g.type) {
    case 'talk_all_npcs': return [g.npcs.filter(n => s.counters.talked.includes(n)).length, g.npcs.length];
    case 'visit_all_rooms': return [g.rooms.filter(r => s.counters.rooms.includes(r)).length, g.rooms.length];
    case 'action_count': return [Math.min(g.count, s.counters.actions[g.action] || 0), g.count];
    case 'gossip_distinct_npcs': return [Math.min(g.count, s.counters.gossipWith.length), g.count];
    default: return [missionDone(s, g) ? 1 : 0, 1];
  }
}
// Call after anything changes; returns newly finished missions (rewards already applied).
export function checkMissions(s, handbook) {
  if (!s.flags.includes('co_so_tay')) return [];
  const fresh = [];
  for (const m of handbook.missions) {
    if (s.missionsDone.includes(m.id) || !missionDone(s, m.goal)) continue;
    s.missionsDone.push(m.id);
    const got = applyEffects(s, m.reward);
    fresh.push({mission: m, got});
  }
  if (fresh.length && s.missionsDone.length === handbook.missions.length) (handbook.rewardOnAll?.addFlags || []).forEach(f => addFlag(s, f));
  return fresh;
}

/* ---------- Day 40: the review (content in danh-gia.json) ---------- */
// Part 1: three badges from the dossier ("Nhân viên mới gương mẫu" first if you have it). Kept in the save so a reload shows the same.
export function dossier(s, rv, rng = Math.random) {
  if (s.dossier) return s.dossier;
  // room-style badges (group "phong_cach") stay out of the review
  const have = Object.keys(rv.badges).filter(f => hasFlag(s, f) && !rv.badges[f].group), always = have.includes(rv.dossier.always) ? [rv.dossier.always] : [];
  const rest = have.filter(f => !always.includes(f));
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
  s.dossier = [...always, ...rest].slice(0, rv.dossier.pick);
  return s.dossier;
}
function whenOk(s, w, ctx) {
  if (!w) return true;
  if (w.missionsAll && !ctx.missionsAll) return false;
  if (w.notJunior && ctx.junior) return false;
  if (w.anyOf && !w.anyOf.some(x => whenOk(s, x, ctx))) return false;
  return requiresOk(s, w);
}
// Part 3: the verdict. Applies the Quan hệ bonus once, then takes the first ending whose conditions match.
export function review(s, handbook, rv) {
  if (!s.reviewed) {
    s.reviewed = true;
    if (s.stats.qh >= rv.qhBonus.qh) s.reviewBonus = applyEffects(s, rv.qhBonus.effects);
  }
  const missing = handbook.missions.length - s.missionsDone.length;
  const ctx = {missionsAll: missing === 0, junior: false};
  const jr = rv.endings.find(e => e.id === 'junior');
  ctx.junior = !!jr && whenOk(s, jr.when, ctx);
  const e = rv.endings.find(x => whenOk(s, x.when, ctx)) || rv.endings.at(-1);
  let verdict = e.verdict;
  const need = jr?.when?.stats || {}, pointsOk = ['xp', 'ut'].every(k => s.stats[k] >= (need[k] ?? 0));
  if (pointsOk && missing > 0 && e.verdictMissions) verdict = e.verdictMissions.replace('{n}', missing);
  else if (pointsOk && s.stats.qh < (need.qh ?? 0) && e.verdictQh) verdict = e.verdictQh;
  s.endingId = e.id;
  return {ending: e, verdict, missing, bonus: s.reviewBonus || null, bonusLine: s.reviewBonus ? rv.qhBonus.line : null};
}

/* ---------- Saving: the engine only talks to a store with load/save/clear ---------- */
// Today: the browser. On a server: implement the same three async methods against an API + database.
export class BrowserSaveStore {
  constructor(key = 'ssns-floor1-save') { this.key = key; }
  async load() { try { const s = JSON.parse(localStorage.getItem(this.key)); return s && s.v === SAVE_VERSION ? s : null; } catch { return null; } }
  async save(state) { try { localStorage.setItem(this.key, JSON.stringify(state)); } catch { /* private mode: play without saving */ } }
  async clear() { try { localStorage.removeItem(this.key); } catch { /* nothing saved */ } }
}

/* ---------- Data check for noi-that.json (models: names of the builders in noi-that.js, when the page has them) ---------- */
export function validateFurniture(data, cardData = null, models = null) {
  const problems = [], cats = new Set((data.shop?.categories || []).map(c => c.id)), ids = new Set();
  for (const it of data.items || []) {
    if (!it.id || ids.has(it.id)) problems.push(`món "${it.id}" thiếu id hoặc trùng`); ids.add(it.id);
    for (const k of ['name', 'desc', 'perk', 'model']) if (!it[k]) problems.push(`${it.id}: thiếu ${k}`);
    if (!(it.price > 0)) problems.push(`${it.id}: giá phải > 0`);
    if (!Array.isArray(it.size) || it.size.length !== 2) problems.push(`${it.id}: size cần [rộng, sâu]`);
    if (!cats.has(it.category)) problems.push(`${it.id}: nhóm "${it.category}" chưa có trong shop.categories`);
    if (it.slot && !Object.values(data.rooms || {}).some(r => r.slots?.[it.slot])) problems.push(`${it.id}: chỗ cố định "${it.slot}" không có phòng nào`);
    if (models && !models.includes(it.model)) problems.push(`${it.id}: noi-that.js chưa có hàm dựng "${it.model}"`);
  }
  if (data.box && !ids.has(data.box)) problems.push(`box "${data.box}" không phải một món`);
  const inStyle = new Set();
  for (const st of data.styles || []) {
    if (!st.id || !st.name || !st.badge || !(st.items || []).length) problems.push(`bộ "${st.id}": cần id, name, badge, items`);
    for (const id of st.items || []) { if (!ids.has(id)) problems.push(`bộ ${st.id}: món "${id}" không có`); if (inStyle.has(id)) problems.push(`món ${id} nằm ở hai bộ`); inStyle.add(id); }
    if (cardData && !(cardData.flagsBadges || []).includes(st.badge)) problems.push(`bộ ${st.id}: cờ "${st.badge}" chưa có trong flagsBadges của cards.json`);
  }
  for (const k of ['start', 'weekly', 'kpiBonus']) if (!(data.money?.[k] >= 0)) problems.push(`money.${k} thiếu`);
  const inv = data.unlock?.card;
  if (!data.unlock?.flag || !inv?.intro || !(inv.choices || []).length) problems.push('unlock cần flag và card (intro, choices)');
  if (cardData) { const flags = [...(cardData.flagsBadges || []), ...(cardData.flagsHidden || [])];
    if (!flags.includes(data.unlock?.flag)) problems.push(`cờ mở Chợ Trọ "${data.unlock?.flag}" chưa khai báo trong cards.json`); }
  return problems;
}

/* ---------- Data check for nhip-choi.json ---------- */
export function validateRhythm(data, cardData) {
  const problems = [], goals = ['action_count', 'stat_min', 'stat_gain'];
  for (const k of data.kpi?.pool || []) {
    if (!k.id || !k.title) problems.push(`KPI thiếu id/title`);
    if (!goals.includes(k.goal?.type)) problems.push(`KPI ${k.id}: goal.type "${k.goal?.type}" lạ (${goals.join(', ')})`);
    if (k.goal?.type === 'action_count' && !ACTIONS[k.goal.action]) problems.push(`KPI ${k.id}: action "${k.goal.action}" lạ`);
    if (k.goal?.stat && !STATS.includes(k.goal.stat)) problems.push(`KPI ${k.id}: stat "${k.goal.stat}" lạ`);
    if (!k.reward || !k.lineOk || !k.lineFail) problems.push(`KPI ${k.id}: thiếu reward / lineOk / lineFail`);
  }
  const badge = data.kpi?.badge;
  if (badge && cardData && !(cardData.flagsBadges || []).includes(badge.flag)) problems.push(`KPI badge "${badge.flag}" chưa có trong flagsBadges của cards.json`);
  if (cardData && (data.specialDays?.weeks || []).length && !cardData.cards.some(isSpecialDay)) problems.push('Có tuần ngày đặc biệt nhưng cards.json chưa có lá special_day');
  return problems;
}

/* ---------- Data check: catches typos in cards.json before they break a run ---------- */
export function validateCards(data) {
  const cards = data.cards, ids = new Set(cards.map(c => c.id)), flags = new Set([...(data.flagsBadges || []), ...(data.flagsHidden || []), 'co_so_tay']);
  const problems = [];
  for (const c of cards) {
    if (c.type === 'unlock' && (!ROOM_IDS.includes(c.unlocks) || !c.day)) problems.push(`${c.id}: lá mở phòng thiếu unlocks/day`);
    if (c.type === 'visit' && (c.when !== 'night' || !VISITORS.includes(c.npc))) problems.push(`${c.id}: lá ghé phòng cần when "night" và npc là một trong ${VISITORS.join(', ')}`);
    if (c.sceneAt && !(c.sceneAt in PLACES)) problems.push(`${c.id}: sceneAt "${c.sceneAt}" lạ`);
    if (c.sceneAt && (c.when || !c.room)) problems.push(`${c.id}: lá có sceneAt phải là lá buổi sáng có room (người rủ đứng chờ ở đó)`);
    if (c.room && !ROOM_IDS.includes(c.room)) problems.push(`${c.id}: phòng "${c.room}" lạ`);
    if (c.when && !['night', 'midday'].includes(c.when)) problems.push(`${c.id}: when "${c.when}" lạ`);
    if (c.stage) { const st = c.stage;
      if (!STAGE_MAPS.includes(st.map) || !st.spot) problems.push(`${c.id}: stage cần map (${STAGE_MAPS.join(', ')}) và spot`);
      if (c.when === 'night' && st.map !== 'home') problems.push(`${c.id}: lá tối có stage phải ở map "home"`);
      if (c.when === 'midday' && st.map !== 'office') problems.push(`${c.id}: lá giữa buổi có stage phải ở map "office"`);
      for (const n of st.people || []) if (!NPC_IDS.includes(n) && !EXTRA_PEOPLE.includes(n) && n !== 'client') problems.push(`${c.id}: người "${n}" lạ trong stage`); }
    if (c.when === 'midday' && !c.stage) problems.push(`${c.id}: lá giữa buổi cần stage`);
    if (isSpecialDay(c)) for (const [a, r] of Object.entries(c.rules?.actions || {})) {
      if (!ACTIONS[a]) problems.push(`${c.id}: rules.actions "${a}" không phải việc buổi chiều`);
      for (const k of Object.keys(r)) if (!['off', 'mult', 'add'].includes(k)) problems.push(`${c.id}: luật "${k}" lạ ở ${a}`); }
    if (c.npc && !NPC_IDS.includes(c.npc) && c.npc !== 'client') problems.push(`${c.id}: npc "${c.npc}" lạ`);
    for (const f of [...(c.requires?.flags || []), ...(c.requires?.anyFlags || []), ...(c.requires?.notFlags || [])]) if (!flags.has(f)) problems.push(`${c.id}: cờ "${f}" chưa khai báo`);
    for (const ch of c.choices || []) {
      if (ch.followup && !ids.has(ch.followup.card)) problems.push(`${c.id}: hẹn lại lá "${ch.followup.card}" không tồn tại`);
      for (const f of ch.addFlags || []) if (!flags.has(f)) problems.push(`${c.id}: cờ "${f}" chưa khai báo`);
    }
  }
  return problems;
}
