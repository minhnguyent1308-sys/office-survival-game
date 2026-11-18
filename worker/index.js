// Máy chủ nhỏ của game (Cloudflare Worker). File tĩnh (dist/) do Cloudflare tự phục vụ; Worker chỉ chạy khi không có file nào
// khớp đường dẫn, tức là ba địa chỉ dưới đây:
//   POST /api/su-kien      bộ đếm ẩn danh (ho-so.js gửi bằng sendBeacon)
//   POST /api/gop-y        hộp góp ý của người chơi (gop-y.js)
//   GET  /api/so-lieu      số liệu tổng hợp cho trang dashboard /so-lieu (cần khóa KHOA_DASHBOARD)
//   POST /api/gop-y/an     ẩn một góp ý spam (cần khóa)
// Không lưu IP, không lưu trình duyệt: chỉ mã ngẫu nhiên, tên sự kiện và vài con số. Bảng D1 tự tạo ở lần gọi đầu.

const EVENTS = ['open', 'time', 'run_start', 'day', 'kpi', 'minigame', 'buy', 'run_end', 'second_run', 'share'];
const TAGS = ['hay', 'kho', 'loi', 'y_tuong'];
const FEEDBACK_PER_DAY = 3, TEXT_MAX = 500;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS su_kien (t INTEGER NOT NULL, ngay TEXT NOT NULL, id TEXT NOT NULL, run TEXT, e TEXT NOT NULL, day INTEGER, k TEXT, r TEXT, n INTEGER)`,
  `CREATE INDEX IF NOT EXISTS su_kien_e_ngay ON su_kien (e, ngay)`,
  `CREATE INDEX IF NOT EXISTS su_kien_ngay ON su_kien (ngay)`,
  `CREATE TABLE IF NOT EXISTS gop_y (t INTEGER NOT NULL, ngay TEXT NOT NULL, id TEXT NOT NULL, sao INTEGER, nhan TEXT, noi_dung TEXT, day INTEGER, ket_cuc TEXT, trang TEXT, an INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS gop_y_ngay ON gop_y (ngay)`,
];
let ready;   // một lần cho mỗi bản Worker đang chạy
const ensure = db => (ready ??= db.batch(SCHEMA.map(s => db.prepare(s))).catch(e => { ready = null; throw e; }));

// Ngày theo giờ Việt Nam (UTC+7): một "ngày" trên dashboard là một ngày ở Việt Nam.
const vnDay = (t = Date.now()) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10);
const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'}});
const str = (v, max, re = /^[\w\/.-]*$/) => (typeof v === 'string' && v.length <= max && re.test(v) ? v : null);
const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);

async function body(req, max = 2048) {
  const text = await req.text();
  if (text.length > max) return null;
  try { return JSON.parse(text); } catch { return null; }
}

// Che email và số điện thoại nếu người chơi lỡ ghi vào góp ý.
export function mask(text) {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[đã che email]')
    .replace(/\+?\d[\d\s.\-()]{7,}\d/g, m => (m.replace(/\D/g, '').length >= 9 ? '[đã che số]' : m));
}

async function event(req, env) {
  const b = await body(req);
  const e = b && EVENTS.includes(b.e) ? b.e : null, id = b && str(b.id, 40, /^[a-z0-9]+$/);
  if (!e || !id) return new Response(null, {status: 400});
  await ensure(env.DB);
  await env.DB.prepare('INSERT INTO su_kien (t, ngay, id, run, e, day, k, r, n) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(Date.now(), vnDay(), id, str(b.run, 40, /^[a-z0-9]+$/), e, int(b.day, 0, 99), str(b.k, 60), str(b.r, 20), int(b.n, 0, 4 * 3600)).run();
  return new Response(null, {status: 204});
}

async function feedback(req, env) {
  const b = await body(req, 4096);
  if (!b || b.web) return json({ok: true});   // ô bẫy "web" bị điền: bot, giả vờ nhận
  const id = str(b.id, 40, /^[a-z0-9]+$/), sao = int(b.sao, 1, 5), nhan = TAGS.includes(b.nhan) ? b.nhan : null;
  const text = typeof b.noi_dung === 'string' ? mask(b.noi_dung.trim().slice(0, TEXT_MAX)) : '';
  if (!id || (!sao && !text)) return json({ok: false, why: 'Bạn chấm sao hoặc viết vài dòng nhé.'}, 400);
  await ensure(env.DB);
  const ngay = vnDay(), {n} = await env.DB.prepare('SELECT COUNT(*) AS n FROM gop_y WHERE ngay = ? AND id = ?').bind(ngay, id).first();
  if (n >= FEEDBACK_PER_DAY) return json({ok: false, why: 'Hôm nay bạn đã góp ý đủ 3 lần rồi, mai gửi tiếp nhé.'}, 429);
  await env.DB.prepare('INSERT INTO gop_y (t, ngay, id, sao, nhan, noi_dung, day, ket_cuc, trang) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(Date.now(), ngay, id, sao, nhan, text || null, int(b.day, 0, 99), str(b.ket_cuc, 60), str(b.trang, 60)).run();
  return json({ok: true});
}

// Khóa dashboard: biến bí mật KHOA_DASHBOARD do chủ game tự đặt trong Cloudflare. Chưa đặt = khóa cửa.
function allowed(req, env) {
  const key = req.headers.get('x-khoa') || '';
  if (!env.KHOA_DASHBOARD) return json({ok: false, why: 'Chưa đặt khóa KHOA_DASHBOARD trong Cloudflare (xem README).'}, 403);
  if (key !== env.KHOA_DASHBOARD) return json({ok: false, why: 'Sai khóa.'}, 401);
  return null;
}

// Mọi con số của dashboard trong một lần gọi. days: số ngày gần nhất (theo giờ Việt Nam), tối đa 90.
export async function stats(db, days = 30, now = Date.now()) {
  const from = vnDay(now - (days - 1) * 86400e3), to = vnDay(now);
  const all = (sql, ...args) => db.prepare(sql).bind(...args).all().then(r => r.results);
  const one = (sql, ...args) => db.prepare(sql).bind(...args).first();
  const runs = `SELECT run FROM su_kien WHERE e = 'run_start' AND ngay BETWEEN ?1 AND ?2`;
  const [perDay, funnel, quit, endings, kpi, minigames, buys, pages, time, firstSeen, back, others, fbStars, fbTags, fbList] = await Promise.all([
    all(`SELECT ngay, COUNT(DISTINCT id) AS nguoi, SUM(e = 'open') AS mo, SUM(e = 'run_start') AS van, SUM(e = 'run_end') AS xong
         FROM su_kien WHERE ngay BETWEEN ?1 AND ?2 GROUP BY ngay ORDER BY ngay`, from, to),
    one(`SELECT COUNT(*) AS bat_dau, SUM(d >= 5) AS ngay5, SUM(d >= 15) AS ngay15, SUM(d >= 30) AS ngay30, SUM(d >= 40) AS ngay40, SUM(xong) AS xong FROM (
           SELECT run, MAX(day) AS d, MAX(e = 'run_end') AS xong FROM su_kien WHERE run IN (${runs}) AND e IN ('day', 'run_end') GROUP BY run)`, from, to),
    // ván bỏ dở: chưa có kết cục và đã im hơn 1 ngày; nhóm theo ngày cuối cùng chơi tới
    all(`SELECT d AS day, COUNT(*) AS n FROM (
           SELECT run, MAX(day) AS d, MAX(t) AS cuoi, MAX(e = 'run_end') AS xong FROM su_kien WHERE run IN (${runs}) AND e IN ('day', 'run_end') GROUP BY run)
         WHERE xong = 0 AND cuoi < ?3 GROUP BY d ORDER BY d`, from, to, now - 86400e3),
    all(`SELECT k, COUNT(*) AS n FROM su_kien WHERE e = 'run_end' AND ngay BETWEEN ?1 AND ?2 GROUP BY k ORDER BY n DESC`, from, to),
    all(`SELECT k, r, COUNT(*) AS n FROM su_kien WHERE e = 'kpi' AND ngay BETWEEN ?1 AND ?2 GROUP BY k, r`, from, to),
    all(`SELECT k, r, COUNT(*) AS n FROM su_kien WHERE e = 'minigame' AND ngay BETWEEN ?1 AND ?2 GROUP BY k, r`, from, to),
    all(`SELECT k, COUNT(*) AS n FROM su_kien WHERE e = 'buy' AND ngay BETWEEN ?1 AND ?2 GROUP BY k ORDER BY n DESC`, from, to),
    all(`SELECT k, COUNT(*) AS n, COUNT(DISTINCT id) AS nguoi FROM su_kien WHERE e = 'open' AND ngay BETWEEN ?1 AND ?2 GROUP BY k ORDER BY n DESC`, from, to),
    one(`SELECT SUM(n) AS giay, COUNT(DISTINCT id || ngay) AS luot FROM su_kien WHERE e = 'time' AND ngay BETWEEN ?1 AND ?2`, from, to),
    // người mới theo ngày (ngày đầu tiên từng thấy mã này)
    all(`SELECT ngay, COUNT(*) AS n FROM (SELECT id, MIN(ngay) AS ngay FROM su_kien GROUP BY id) WHERE ngay BETWEEN ?1 AND ?2 GROUP BY ngay ORDER BY ngay`, from, to),
    // quay lại: trong số người mới, bao nhiêu người có mặt lại sau 1 ngày và sau 7 ngày (chỉ tính người đã đủ thời gian để quay lại)
    one(`WITH dau AS (SELECT id, MIN(ngay) AS d0 FROM su_kien GROUP BY id HAVING d0 BETWEEN ?1 AND ?2),
              co AS (SELECT DISTINCT id, ngay FROM su_kien WHERE ngay >= ?1)
         SELECT SUM(d0 <= date(?2, '-1 day')) AS du1, SUM(d0 <= date(?2, '-1 day') AND EXISTS (SELECT 1 FROM co WHERE co.id = dau.id AND co.ngay = date(d0, '+1 day'))) AS lai1,
                SUM(d0 <= date(?2, '-7 day')) AS du7, SUM(d0 <= date(?2, '-7 day') AND EXISTS (SELECT 1 FROM co WHERE co.id = dau.id AND co.ngay BETWEEN date(d0, '+7 day') AND date(d0, '+13 day'))) AS lai7
         FROM dau`, from, to),
    one(`SELECT SUM(e = 'share') AS chia_se, SUM(e = 'second_run') AS van_hai FROM su_kien WHERE e IN ('share', 'second_run') AND ngay BETWEEN ?1 AND ?2`, from, to),
    all(`SELECT sao, COUNT(*) AS n FROM gop_y WHERE an = 0 AND sao IS NOT NULL AND ngay BETWEEN ?1 AND ?2 GROUP BY sao ORDER BY sao`, from, to),
    all(`SELECT nhan, COUNT(*) AS n FROM gop_y WHERE an = 0 AND ngay BETWEEN ?1 AND ?2 GROUP BY nhan ORDER BY n DESC`, from, to),
    all(`SELECT rowid AS so, t, sao, nhan, noi_dung, day, ket_cuc, trang FROM gop_y WHERE an = 0 AND ngay BETWEEN ?1 AND ?2 ORDER BY t DESC LIMIT 100`, from, to),
  ]);
  const newByDay = Object.fromEntries(firstSeen.map(r => [r.ngay, r.n]));
  return {
    from, to, days,
    perDay: perDay.map(r => ({...r, moi: newByDay[r.ngay] || 0})),
    funnel, quit, endings, kpi, minigames, buys, pages,
    time: {giay: time?.giay || 0, luot: time?.luot || 0},
    retention: back || {}, others: others || {},
    feedback: {stars: fbStars, tags: fbTags, list: fbList},
  };
}

async function dashboard(req, env) {
  const denied = allowed(req, env); if (denied) return denied;
  await ensure(env.DB);
  const days = Math.min(90, Math.max(1, parseInt(new URL(req.url).searchParams.get('days'), 10) || 30));
  return json(await stats(env.DB, days));
}

async function hide(req, env) {
  const denied = allowed(req, env); if (denied) return denied;
  const b = await body(req), so = b && int(b.so, 1, Number.MAX_SAFE_INTEGER);
  if (!so) return json({ok: false}, 400);
  await ensure(env.DB);
  await env.DB.prepare('UPDATE gop_y SET an = 1 WHERE rowid = ?').bind(so).run();
  return json({ok: true});
}

const ROUTES = {
  'POST /api/su-kien': event,
  'POST /api/gop-y': feedback,
  'GET /api/so-lieu': dashboard,
  'POST /api/gop-y/an': hide,
};

export default {
  async fetch(req, env) {
    const url = new URL(req.url), route = ROUTES[`${req.method} ${url.pathname}`];
    if (!route) return env.ASSETS ? env.ASSETS.fetch(req) : new Response('Không tìm thấy', {status: 404});
    if (!env.DB) return json({ok: false, why: 'Chưa gắn database D1 (xem README).'}, 503);
    try { return await route(req, env); }
    catch (e) { console.error(e); return json({ok: false, why: 'Máy chủ gặp lỗi, thử lại sau.'}, 500); }
  },
};
