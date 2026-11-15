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
export const NPC_NAME = {tuan: 'Anh Tuấn', hang: 'Chị Hằng', linh: 'Chị Linh', minh: 'Anh Minh', tung: 'Anh Tùng', mai: 'Chị Mai', coba: 'Cô Ba', client: 'Khách hàng'};
export const SENIORS = ['hang', 'linh', 'minh', 'tung'];
export const VISITORS = [...SENIORS, 'mai', 'tuan'];   // who can come to the rented room (type 'visit' cards)
export const ROOM_IDS = ['lobby', 'intern', 'boss', 'canteen', 'meeting'];
// places outside tầng 1 with their own page; a card with sceneAt plays its choices there and opens the place for good (Lily 14/11)
export const PLACES = {trasua: 'tra-sua.html'};
const WEEKDAY = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
const WEEKEND_CARD_CHANCE = 1 / 3;
export const WAKE_PIN = 5; // sleeping restores a little Pin every morning (Lily 14/11)
const NIGHT_CARD_CHANCE = 1 / 2; // evenings at the rented room: study cards + boss/client messages (Lily 14/11: more XP events at home)

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
  intro: 'Chị Mai đưa bạn cuốn "Sổ tay nhân viên mới": "10 nhiệm vụ, làm xong trước buổi đánh giá ngày 40 là được. Thiếu một ô thôi là sếp không ký đâu."',
  choices: [{label: 'Nhận sổ tay', effects: {}, addFlags: ['co_so_tay'], comment: 'Trang đầu sổ tay ghi tay: "Chúc em may mắn." Nét chữ run run.'}],
};

export const EARLY_ENDINGS = {
  burnout: {title: 'Burnout', line: 'Bạn đã xin nghỉ để về quê nuôi gà.'},
  fired:   {title: 'Bị cho nghỉ sớm', line: 'Em mạnh dạn, nhưng mạnh dạn ở chỗ khác nhé.'},
};

/* ---------- State: one plain JSON object (what a save store keeps) ---------- */
// startRooms: cards.json rooms.start (the map opens room by room through 'unlock' cards); left out = every room open.
export function newGame({female = false, rng = Math.random, startRooms = ROOM_IDS} = {}) {
  return {
    v: SAVE_VERSION,
    runId: 'r' + Math.floor(rng() * 36 ** 8).toString(36) + Date.now().toString(36),
    day: 1, part: 'morning', female,
    rooms: [...startRooms],
    stats: {...START},
    close: Object.fromEntries(NPC_IDS.map(n => [n, CLOSE_START])),
    flags: [], used: [], followups: [], followupsMade: [], history: [],
    counters: {actions: {}, talked: [], rooms: [], gossipWith: [], minigames: {}},
    missionsDone: [],
    today: freshToday(),
    ending: null,
  };
}
function freshToday() { return {cardId: null, cardDone: false, action: null, minigame: null, delta: {xp: 0, pin: 0, ut: 0, qh: 0}, notes: []}; }

export const hasFlag = (s, f) => s.flags.includes(f);
// A room with no 'rooms' list (saves from before the map opened gradually) counts as open; room null = anywhere.
export const roomOpen = (s, room) => !room || !s.rooms || s.rooms.includes(room);
const addFlag = (s, f) => { if (!hasFlag(s, f)) s.flags.push(f); };
const addUnique = (arr, v) => { if (!arr.includes(v)) arr.push(v); };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Applies stat changes with the approved limits; qh also feeds one person's closeness.
// Returns what actually changed (after caps), so the UI shows honest numbers.
export function applyEffects(s, effects = {}, closenessOf = null) {
  const got = {};
  for (const k of STATS) {
    let d = effects[k] || 0;
    if (k === 'xp' && d < 0) d = 0;                      // XP is never lost
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
  const pool = cards.filter(c => DRAWABLE.has(c.type) && !isNightCard(c) && (c.phases || []).includes(phase) && requiresOk(s, c.requires)
    && roomOpen(s, c.room) && (!s.used.includes(c.id) || c.repeatable) && (c.weight ?? 0) > 0);
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
  s.today = freshToday(); s.part = 'morning'; s.today.canteen = rollCanteen(rng);
  // 08:29 room opening: runs before the morning card and does not replace it
  const unlock = cards.find(c => c.type === 'unlock' && c.day === s.day && !roomOpen(s, c.unlocks));
  if (unlock) s.today.unlockId = unlock.id;
  if (s.day === 1) { s.today.cardId = DAY_ONE.id; return; }
  const mg = drawMinigame(s, rng);
  if (mg) { s.today.minigame = mg.id; return; }             // milestone morning: a mini-game instead of a card
  const c = drawCard(s, cards, rng);
  if (!c) { s.today.cardDone = true; s.today.notes.push('Sáng nay yên bình đến lạ.'); return; }
  s.today.cardId = c.id; addUnique(s.used, c.id);
  s.history.push({day: s.day, card: c.id, npc: c.npc, heavy: !!c.heavy});
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
  if (c.sceneAt) addUnique(s.rooms ||= [...ROOM_IDS], c.sceneAt); // (a save with no rooms list had every room open)           // the event took you there: from now on you know the way
  if (c.type === 'unlock') { s.today.unlockDone = true; addUnique(s.rooms, c.unlocks); recordRoom(s, c.unlocks); } // the morning card still follows
  else if (isNightCard(c)) s.today.nightDone = true;     // evening at home: the day part stays 'evening'
  else { s.today.cardDone = true; if (c.type !== 'weekend') s.part = 'afternoon'; }
  if (comment) s.today.notes.push(comment);
  return {got, comment, label};
}

// result: a grade id. extras: side effects the game itself earned, e.g. [{effects: {qh: 2}, npc: 'linh'}] for a favour done.
export function playMinigame(s, result, extras = []) {
  const id = s.today.minigame, game = minigameById(id) || {};
  const got = {}, add = g => { for (const [k, v] of Object.entries(g)) if (k === 'close') for (const [n, d] of Object.entries(v)) (got.close ||= {})[n] = (got.close[n] || 0) + d; else got[k] = (got[k] || 0) + v; };
  const base = {}; for (const e of [game.cost, game.rewards?.[result]]) for (const [k, v] of Object.entries(e || {})) base[k] = (base[k] || 0) + v;
  add(applyEffects(s, base));
  for (const x of extras) add(applyEffects(s, x.effects, x.npc || null));
  s.counters.minigames[id] = result; (s.counters.minigameDays ||= {})[s.day] = result; s.today.cardDone = true;
  if (game.lines?.[result]) s.today.notes.push(game.lines[result]);
  s.part = s.day === TOTAL_DAYS ? 'evening' : 'afternoon';
  return got;
}

export function actionAvailable(s, id, ctx = {}) {
  const a = ACTIONS[id];
  if (s.part !== 'afternoon' || s.today.action) return {ok: false, why: 'Hết lượt chiều'};
  if (a.needQh && s.stats.qh < a.needQh) return {ok: false, why: `Cần Quan hệ từ ${a.needQh}`};
  if (!roomOpen(s, PLACE_ROOM[a.place])) return {ok: false, why: 'Phòng này chưa mở'};
  if (a.needSitting && !(ctx.sitting || []).length) return {ok: false, why: 'Chưa có ai ngồi căng tin'};
  return {ok: true};
}
// ctx: {sitting: [npc ids at the canteen], partner: the one you gossip with, senior: npc id who answers questions}
export function doAction(s, id, ctx = {}, rng = Math.random) {
  const a = ACTIONS[id];
  let effects = {...a.effects}, extraNote = null;
  if (a.extraChance && rng() < a.extraChance) { for (const [k, v] of Object.entries(a.extra)) effects[k] = (effects[k] || 0) + v; extraNote = 'Bạn bị giao thêm việc.'; }
  const target = a.closeness === 'senior' ? ctx.senior : null;
  const got = applyEffects(s, effects, target);
  if (a.closeness && a.closeness !== 'senior') changeCloseness(s, a.closeness, a.closenessGain, got);
  if (id === 'tam_chuyen') { const n = ctx.partner || ctx.sitting[0]; changeCloseness(s, n, 5, got); addUnique(s.counters.gossipWith, n); } // only the one you sit next to
  s.counters.actions[id] = (s.counters.actions[id] || 0) + 1;
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
export const teaOpen = s => !s.ending && s.rooms?.includes('trasua') && s.day < TOTAL_DAYS && (s.part === 'afternoon' || (s.part === 'evening' && !s.today.atHome));
export function buyTea(s, kind) {
  if (!teaOpen(s) || s.today.tea || !TEA[kind]) return null;
  s.today.tea = kind; (s.counters.tea ||= {})[kind] = (s.counters.tea[kind] || 0) + 1;
  return {got: applyEffects(s, TEA[kind].effects)};
}

// 17:55: the only moment burnout and early dismissal are checked (the afternoon can still save you).
export function endOfDay(s) {
  if (s.stats.pin <= 0) s.ending = 'burnout';
  else if (s.stats.ut < 10) s.ending = 'fired';
  else if (s.day >= TOTAL_DAYS) s.ending = 'review';   // day 40 evaluation arrives in step 3
  if (s.ending) s.part = 'over';
  return s.ending;
}
// Evening at the rented room (after 17:55 passed): sometimes a night message, never on Friday (the weekend screen follows).
export function drawNight(s, cards, rng = Math.random) {
  if (s.part !== 'evening' || s.today.nightDrawn) return null;
  s.today.nightDrawn = true;
  if (weekday(s.day) === 4) return null;
  const phase = phaseOf(s.day);
  const pool = cards.filter(c => isNightCard(c) && (c.phases || []).includes(phase) && !s.used.includes(c.id) && requiresOk(s, c.requires));
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
  if (weekday(s.day) === 4) {
    s.part = 'weekend'; s.today = freshToday();
    const got = applyEffects(s, {pin: 20});
    const phase = phaseOf(s.day + 3);
    const pool = cards.filter(c => c.type === 'weekend' && (c.phases || []).includes(phase) && !s.used.includes(c.id) && requiresOk(s, c.requires));
    const c = pool.length && rng() < WEEKEND_CARD_CHANCE ? weighted(pool, rng) : null;
    if (c) { s.today.cardId = c.id; addUnique(s.used, c.id); }
    return {weekend: true, got, card: c};
  }
  s.day += 1; wakeUp(s, cards, rng);
  return {weekend: false};
}
export function endWeekend(s, cards, rng = Math.random) { s.day += 3; wakeUp(s, cards, rng); }
// waking up: Pin +5, then the morning starts; the gain is kept on today.wake (not in the day's summary) so the page can announce it once
function wakeUp(s, cards, rng) { const got = applyEffects(s, {pin: WAKE_PIN}); startMorning(s, cards, rng); s.today.wake = got; }

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
  const have = Object.keys(rv.badges).filter(f => hasFlag(s, f)), always = have.includes(rv.dossier.always) ? [rv.dossier.always] : [];
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

/* ---------- Data check: catches typos in cards.json before they break a run ---------- */
export function validateCards(data) {
  const cards = data.cards, ids = new Set(cards.map(c => c.id)), flags = new Set([...(data.flagsBadges || []), ...(data.flagsHidden || []), 'co_so_tay']);
  const problems = [];
  for (const c of cards) {
    if (c.when && c.when !== 'night') problems.push(`${c.id}: when "${c.when}" lạ`);
    if (c.type === 'unlock' && (!ROOM_IDS.includes(c.unlocks) || !c.day)) problems.push(`${c.id}: lá mở phòng thiếu unlocks/day`);
    if (c.type === 'visit' && (c.when !== 'night' || !VISITORS.includes(c.npc))) problems.push(`${c.id}: lá ghé phòng cần when "night" và npc là một trong ${VISITORS.join(', ')}`);
    if (c.sceneAt && !(c.sceneAt in PLACES)) problems.push(`${c.id}: sceneAt "${c.sceneAt}" lạ`);
    if (c.sceneAt && (c.when || !c.room)) problems.push(`${c.id}: lá có sceneAt phải là lá buổi sáng có room (người rủ đứng chờ ở đó)`);
    if (c.room && !ROOM_IDS.includes(c.room)) problems.push(`${c.id}: phòng "${c.room}" lạ`);
    if (c.npc && !NPC_IDS.includes(c.npc) && c.npc !== 'client') problems.push(`${c.id}: npc "${c.npc}" lạ`);
    for (const f of [...(c.requires?.flags || []), ...(c.requires?.anyFlags || []), ...(c.requires?.notFlags || [])]) if (!flags.has(f)) problems.push(`${c.id}: cờ "${f}" chưa khai báo`);
    for (const ch of c.choices || []) {
      if (ch.followup && !ids.has(ch.followup.card)) problems.push(`${c.id}: hẹn lại lá "${ch.followup.card}" không tồn tại`);
      for (const f of ch.addFlags || []) if (!flags.has(f)) problems.push(`${c.id}: cờ "${f}" chưa khai báo`);
    }
  }
  return problems;
}
