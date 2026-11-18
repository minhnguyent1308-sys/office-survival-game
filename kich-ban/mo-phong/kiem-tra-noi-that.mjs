// Kiểm tra luật nội thất và ví tiền (Lily 17/11). Chạy: node kiem-tra-noi-that.mjs (Node 18+)
import * as G from '../../visual-design/engine.js';
import fs from 'fs';
const rd = f => JSON.parse(fs.readFileSync(new URL('../' + f, import.meta.url)));
const NT = rd('noi-that.json'), CD = rd('cards.json');
const MODELS = fs.readFileSync(new URL('../../visual-design/noi-that.js', import.meta.url),'utf8').match(/^  (\w+)\(g, mat/mg).map(x => x.trim().split('(')[0]);
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } else console.log('ok  ', m); };
G.useFurniture(NT);
ok(G.validateFurniture(NT, CD, MODELS).length === 0, 'noi-that.json hợp lệ ' + JSON.stringify(G.validateFurniture(NT, CD, MODELS)));
ok(G.validateCards(CD).length === 0, 'cards.json hợp lệ ' + JSON.stringify(G.validateCards(CD)));
// new game: gift
let s = G.newGame({rng: () => .5}); G.ensureHome(s);
ok(s.home.wallet === 200 && s.home.room === 'tro_nho', 'ván mới có 200');
G.ensureHome(s); ok(s.home.wallet === 200, 'đọc lại không cộng quà lần hai');
// old save: no home
const old = G.newGame(); delete old.home; G.ensureHome(old); ok(old.home.wallet === 0, 'save cũ bắt đầu 0');
// shop closed
ok(!G.canBuy(s, 'chau_cay_nho').ok && G.canBuy(s, 'chau_cay_nho').why === 'Chợ Trọ chưa mở', 'chưa mở Chợ Trọ thì không mua được');
// chị Mai's message: after helping her twice, on the laptop in the evening; no card slot, no stat
ok(!G.shopInvite(s), 'chưa giúp chị Mai thì chưa có tin nhắn');
s.counters.actions.giup_chi_mai = 2;
ok(G.shopInvite(s)?.choices.length === 2 && !CD.cards.some(c => c.id === G.shopInvite(s).id), 'giúp 2 lần thì có tin nhắn, không nằm trong bộ lá buổi sáng');
const before = JSON.stringify(s.stats); G.answerShopInvite(s, 0);
ok(G.shopOpen(s) && !G.shopInvite(s) && before === JSON.stringify(s.stats), 'trả lời xong mở Chợ Trọ, chỉ số không đổi, tin nhắn không lặp lại');
// buy without box: must place
let r = G.buyItem(s, 'chau_cay_nho'); ok(r && r.mustPlace && s.home.wallet === 150, 'mua chậu cây khi chưa có thùng: phải đặt ngay');
ok(G.unplaced(s).length === 1, 'một món chờ đặt');
ok(G.putItem(s, 'chau_cay_nho', 1, 1, 0) === 0 && G.unplaced(s).length === 0, 'đặt xong');
ok(!G.storeItem(s, 0), 'chưa có thùng thì không cất được');
ok(!G.canBuy(s, 'tu_quan_ao').ok && G.canBuy(s, 'tu_quan_ao').why === 'Thiếu 170 nghìn', 'thiếu tiền báo đúng số');
r = G.buyItem(s, 'thung_do'); ok(r.mustPlace, 'thùng đồ phải đặt ngay'); G.putItem(s, 'thung_do', 2, 3, 0);
ok(G.hasBox(s) && G.storeItem(s, 0) && G.unplaced(s)[0].item.id === 'chau_cay_nho', 'có thùng thì cất được, món nằm trong thùng');
ok(!G.canStore(s, 0), 'không cất thùng vào chính nó');
ok(!G.buyItem(s, 'thung_do'), 'thùng đồ chỉ mua 1 lần');
// max 5
s.home.wallet = 9999; for (let i = 0; i < 4; i++) G.buyItem(s, 'chau_cay_nho');
ok(!G.canBuy(s, 'chau_cay_nho').ok && G.canBuy(s, 'chau_cay_nho').sold, 'chậu cây tối đa 5');
r = G.buyItem(s, 'ban_hoc'); ok(!r.mustPlace, 'có thùng thì món mới vào thùng');
const i = G.putItem(s, 'ban_hoc', 7, 7, 1); const p = G.placedHere(s)[i];
ok(p.x === 3 && p.z === 0 && p.rot === 0 && !G.moveItem(s, i, 5, 5), 'bàn học vào chỗ cố định, không dời được');
ok(G.isPlaced(s, 'ban_hoc') && G.storeItem(s, i) && !G.isPlaced(s, 'ban_hoc'), 'bàn học cất được (laptop về sàn)');
// pay: Friday day 5, kpi ok
s = G.newGame({rng: () => .5}); G.ensureHome(s); s.day = 5; s.part = 'evening';
let w = G.nextDay(s, CD.cards, () => .99); ok(w.pay?.weekly === 350 && s.home.wallet === 550 + w.pay.kpi, 'tối thứ Sáu ngày 5 nhận 350 ' + JSON.stringify(w.pay));
s.week = {n: 1, kpi: null}; s.part = 'evening'; G.nextDay(s, CD.cards, () => .99); ok(s.home.paid.length === 1, 'không nhận hai lần cùng ngày');
// kpi bonus
s = G.newGame({rng: () => .5}); G.ensureHome(s); s.day = 12; s.part = 'evening';
G.useRhythm(rd('nhip-choi.json')); s.week = {n: 2, kpi: rd('nhip-choi.json').kpi.pool[0].id, base: {actions: {}, stats: {...s.stats}}, low: {...s.stats}};
s.counters.actions = {lam_task: 50, bao_cao_sep: 50, an_trua_co_ba: 50, hoi_senior: 50, tam_chuyen: 50, giup_chi_mai: 50}; s.stats.pin = 100; s.stats.xp = 150; s.stats.ut = 100; s.stats.qh = 100; s.week.low = {...s.stats};
s.week.base.stats = {xp: 0, pin: 0, ut: 0, qh: 0};
w = G.nextDay(s, CD.cards, () => .99); ok(w.kpi?.ok && w.pay.kpi === 50 && s.home.wallet === 600, 'đạt KPI thêm 50 ' + JSON.stringify(w.pay));
// room styles (Lily 18/11): own every item of a style = its badge, once; not part of the day-40 review
s = G.newGame({rng: () => .5}); G.ensureHome(s); G.answerShopInvite(Object.assign(s, {counters: {...s.counters, actions: {giup_chi_mai: 2}}}), 0); s.home.wallet = 9999;
const wibu = NT.styles.find(x => x.id === 'wibu'), RV = rd('danh-gia.json');
let got = null; for (const id of wibu.items) { got = G.buyItem(s, id).badge || got; if (id !== wibu.items.at(-1)) ok(!got && !G.hasFlag(s, wibu.badge), `chưa đủ bộ (${id}) chưa có huy hiệu`); }
ok(got?.flag === 'bo_wibu' && G.hasFlag(s, 'bo_wibu'), 'mua món cuối của bộ Wibu thì có huy hiệu');
ok(JSON.stringify(G.styleProgress(s, wibu)) === '[5,5]' && G.styleOf('led_rgb')?.id === 'wibu' && !G.styleOf('thung_do'), 'tiến độ bộ và bộ của từng món');
ok(!G.completeStyles(s) && s.flags.filter(f => f === 'bo_wibu').length === 1, 'huy hiệu bộ chỉ nhận một lần');
ok(NT.styles.every(st => RV.badges[st.badge]?.group === 'phong_cach' && RV.collection.hints[st.badge]), 'mỗi bộ có huy hiệu nhóm phong_cach và gợi ý');
s.flags.push(...Object.keys(RV.badges).filter(f => !RV.badges[f].group)); ok(!G.dossier(s, RV).some(f => RV.badges[f].group), 'anh Tuấn không đọc huy hiệu phòng trọ ở buổi đánh giá');
// no furniture data = no pay (other pages)
console.log(fail ? `${fail} lỗi` : 'Tất cả đều qua');
process.exit(fail ? 1 : 0);
