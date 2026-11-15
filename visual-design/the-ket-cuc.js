// Thẻ kết cục: a 4:5 picture of one finished run, drawn in the browser (canvas) so there is nothing to host.
// Colours and fonts are the game's own. Pure drawing: the page hands over plain data, gets a canvas back.
import {weekday, STATS, STAT_NAME} from './engine.js';

const W = 1080, H = 1350, INK = '#2a2230', PAPER = '#fffdf8', GROUND = '#f9f0e1', MUTED = '#7a6f74', ACCENT = '#e8505b';
const BAR = {xp: '#3c83ec', pin: '#44ba6a', ut: '#e3b23c', qh: '#f45561'};
const DISPLAY = '"Baloo 2","Be Vietnam Pro",system-ui,sans-serif', BODY = '"Be Vietnam Pro",system-ui,-apple-system,"Segoe UI",sans-serif';

function wrap(ctx, text, x, y, maxW, lineH, maxLines = 99) {
  const words = String(text).split(/\s+/); let line = '', n = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxW && line) {
      if (++n >= maxLines) { ctx.fillText(line.replace(/[\s,.;:]*$/, '') + '…', x, y); return y + lineH; }
      ctx.fillText(line, x, y); y += lineH; line = words[i];
    } else line = test;
  }
  ctx.fillText(line, x, y); return y + lineH;
}
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };

// d: {name, title, verdict, scene, secret, early, endDay, stats, dayLog, totalDays, closest: {name, value}, got: {badges, badgesTotal, endings, endingsTotal}, gift, url}
export async function drawCard(d) {
  try { await Promise.race([Promise.all([document.fonts.load('800 60px "Baloo 2"'), document.fonts.load('600 30px "Be Vietnam Pro"')]), new Promise(r => setTimeout(r, 1200))]); } catch { /* system fonts then */ }
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  c.fillStyle = GROUND; c.fillRect(0, 0, W, H);
  c.fillStyle = PAPER; c.strokeStyle = INK; c.lineWidth = 6; rr(c, 40, 40, W - 80, H - 80, 36); c.fill(); c.stroke();
  const L = 90, IW = W - 2 * L; c.textBaseline = 'alphabetic';
  // header
  c.fillStyle = INK; rr(c, L, 90, 300, 48, 12); c.fill();
  c.fillStyle = PAPER; c.font = `700 24px ${DISPLAY}`; c.fillText('TẦNG 1 · INTERN', L + 22, 124);
  c.fillStyle = INK; c.font = `800 56px ${DISPLAY}`; c.fillText('Sống sót nơi công sở', L, 220);
  c.fillStyle = MUTED; c.font = `600 30px ${BODY}`; c.fillText(`${d.name || 'Intern'} · thực tập sinh ${d.totalDays} ngày`, L, 268);
  // ending
  c.fillStyle = ACCENT; c.font = `700 24px ${DISPLAY}`; c.fillText(d.early ? 'KẾT THÚC SỚM' : d.secret ? 'KẾT CỤC BÍ MẬT' : 'PHÁN QUYẾT NGÀY ' + d.totalDays, L, 350);
  c.fillStyle = INK; c.font = `800 76px ${DISPLAY}`;
  let y = wrap(c, d.title, L, 430, IW, 80, 3);
  c.fillStyle = MUTED; c.font = `italic 500 32px ${BODY}`; y = wrap(c, d.verdict, L, y + 14, IW, 46, 4);
  if (d.scene) { c.fillStyle = INK; c.font = `500 28px ${BODY}`; y = wrap(c, d.scene, L, y + 26, IW, 42, 6); }
  // 40 days: one cell per calendar day
  const sy = Math.max(y + 50, 880);
  c.fillStyle = INK; c.font = `700 24px ${DISPLAY}`; c.fillText(`${d.totalDays} ngày`, L, sy);
  const gap = 4, cw = (IW - gap * (d.totalDays - 1)) / d.totalDays;
  for (let day = 1; day <= d.totalDays; day++) {
    const x = L + (day - 1) * (cw + gap), e = d.dayLog?.[day], wk = weekday(day) >= 5, ended = d.early && day > d.endDay;
    c.fillStyle = ended ? 'transparent' : wk ? '#d9d2c7' : !e ? '#eadfcd' : e.r ? '#e8505b' : e.g ? '#44ba6a' : '#f7d046';
    rr(c, x, sy + 18, cw, 58, 5); c.fill();
    if (ended) { c.strokeStyle = '#d9d2c7'; c.lineWidth = 2; c.stroke(); }
  }
  c.font = `600 20px ${BODY}`; c.fillStyle = MUTED; let lx = L; const ly = sy + 112;
  for (const [col, txt] of [['#44ba6a', 'ngày có tiến bộ'], ['#f7d046', 'ngày hòa vốn'], ['#e8505b', 'hết ngày Pin dưới 20'], ['#d9d2c7', 'cuối tuần']]) {
    c.fillStyle = col; rr(c, lx, ly - 16, 18, 18, 4); c.fill(); c.fillStyle = MUTED; c.fillText(txt, lx + 26, ly); lx += 26 + c.measureText(txt).width + 26;
  }
  // four stats
  const by = ly + 64, bw = (IW - 3 * 24) / 4;
  STATS.forEach((k, i) => {
    const x = L + i * (bw + 24);
    c.fillStyle = INK; c.font = `600 22px ${BODY}`; c.fillText(STAT_NAME[k], x, by);
    c.font = `800 34px ${DISPLAY}`; c.textAlign = 'right'; c.fillText(String(d.stats[k]), x + bw, by + 4); c.textAlign = 'left';
    c.fillStyle = '#eadfcd'; rr(c, x, by + 16, bw, 16, 8); c.fill();
    c.fillStyle = BAR[k]; rr(c, x, by + 16, Math.max(8, bw * Math.min(100, d.stats[k]) / 100), 16, 8); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; rr(c, x, by + 16, bw, 16, 8); c.stroke();
  });
  // achievements + footer
  c.fillStyle = INK; c.font = `600 26px ${BODY}`;
  const ach = `${d.got.badges}/${d.got.badgesTotal} huy hiệu · ${d.got.endings}/${d.got.endingsTotal} kết cục` + (d.closest ? ` · Thân nhất: ${d.closest.name}` : '');
  let ay = wrap(c, ach, L, by + 96, IW, 36, 2);
  if (d.gift) { c.fillStyle = MUTED; c.font = `600 24px ${BODY}`; ay = wrap(c, `Quà mang theo: ${d.gift}`, L, ay, IW, 34, 2); }
  c.fillStyle = MUTED; c.font = `600 24px ${BODY}`; c.textAlign = 'center';
  c.fillText(d.url ? d.url : 'Sống sót nơi công sở', W / 2, H - 80); c.textAlign = 'left';
  return cv;
}
export const toBlob = cv => new Promise(r => cv.toBlob(r, 'image/png'));
