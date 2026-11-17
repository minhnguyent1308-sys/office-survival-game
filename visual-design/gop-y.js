// Hộp góp ý: chấm sao, chọn nhãn, viết vài dòng. Gửi tới feedback trong do-luong.json (Worker /api/gop-y, worker/index.js).
// Chỉ chủ game đọc được, trên trang /so-lieu. Không gửi tên: chỉ mã ngẫu nhiên của trình duyệt (để giới hạn 3 góp ý mỗi ngày)
// và đang chơi tới đâu. Chưa có địa chỉ nhận thì hộp không hiện.
const TAGS = [['hay', 'Hay'], ['kho', 'Khó quá'], ['loi', 'Gặp lỗi'], ['y_tuong', 'Có ý tưởng']];
const MAX = 500;
const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

let cssDone = false;
function css() {
  if (cssDone) return; cssDone = true;
  const st = document.createElement('style');
  st.textContent = `.gy{border:2px solid var(--ink);border-radius:12px;background:var(--paper);margin-top:12px}
.gy summary{cursor:pointer;padding:10px 14px;font:700 15px var(--font-display);list-style-position:inside}
.gy form{display:grid;gap:10px;padding:0 14px 14px}
.gy .stars{display:flex;gap:2px}
.gy .stars button{font-size:26px;line-height:1;background:none;border:0;padding:4px;cursor:pointer;color:var(--lock);min-width:40px;min-height:40px}
.gy .stars button[aria-pressed=true]{color:var(--ut)}
.gy .tags{display:flex;flex-wrap:wrap;gap:6px}
.gy .tags button{font:600 13px var(--font-body);border:2px solid var(--ink);border-radius:999px;background:var(--paper);color:var(--ink);padding:5px 12px;cursor:pointer;min-height:36px}
.gy .tags button[aria-pressed=true]{background:var(--ink);color:var(--paper)}
.gy textarea{font:14px/1.4 var(--font-body);border:2px solid var(--ink);border-radius:10px;padding:8px 10px;min-height:84px;resize:vertical;width:100%;box-sizing:border-box}
.gy small{color:var(--muted);font-size:12px;line-height:1.35}
.gy .row{display:flex;justify-content:space-between;align-items:center;gap:10px}
.gy .send{font:700 14px var(--font-body);background:var(--accent);color:#fff;border:2px solid var(--ink);border-radius:999px;padding:8px 18px;cursor:pointer;min-height:40px}
.gy .send:disabled{opacity:.6;cursor:default}
.gy .web{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.gy .done{padding:0 14px 14px;margin:0}`;
  document.head.appendChild(st);
}

// endpoint: from do-luong.json. id(): the browser's random id. context(): {day, ket_cuc, trang} at the time of sending.
export function feedbackNode({endpoint, id, context = () => ({})}) {
  if (!endpoint) return null;
  css();
  const box = mk('details', 'gy'), form = mk('form');
  box.appendChild(mk('summary', null, 'Góp ý cho game (30 giây)'));
  let sao = 0, nhan = null;
  const stars = mk('div', 'stars'); stars.setAttribute('role', 'group'); stars.setAttribute('aria-label', 'Chấm sao');
  for (let i = 1; i <= 5; i++) {
    const b = mk('button', null, '★'); b.type = 'button'; b.setAttribute('aria-label', `${i} sao`);
    b.onclick = () => { sao = i; [...stars.children].forEach((x, j) => x.setAttribute('aria-pressed', String(j < i))); };
    stars.appendChild(b);
  }
  const tags = mk('div', 'tags');
  for (const [v, label] of TAGS) {
    const b = mk('button', null, label); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
    b.onclick = () => { nhan = nhan === v ? null : v; [...tags.children].forEach(x => x.setAttribute('aria-pressed', String(x === b && nhan === v))); };
    tags.appendChild(b);
  }
  const text = mk('textarea'); text.maxLength = MAX; text.placeholder = 'Bạn thích gì, chỗ nào khó, gặp lỗi gì...'; text.setAttribute('aria-label', 'Góp ý');
  const web = mk('input', 'web'); web.name = 'web'; web.tabIndex = -1; web.autocomplete = 'off'; web.setAttribute('aria-hidden', 'true');   // ô bẫy bot
  const left = mk('small', null, `Đừng ghi tên, số điện thoại hay email. Chỉ người làm game đọc được. ${MAX} ký tự.`);
  const send = mk('button', 'send', 'Gửi góp ý'); send.type = 'submit';
  const msg = mk('small');
  const row = mk('div', 'row'); row.append(msg, send);
  form.append(stars, tags, text, web, left, row);
  box.appendChild(form);
  form.onsubmit = async e => {
    e.preventDefault();
    if (!sao && !text.value.trim()) { msg.textContent = 'Bạn chấm sao hoặc viết vài dòng nhé.'; return; }
    send.disabled = true; msg.textContent = 'Đang gửi...';
    try {
      const r = await fetch(endpoint, {method: 'POST', body: JSON.stringify({id: id(), sao: sao || null, nhan, noi_dung: text.value.trim(), web: web.value, ...context()})});
      const b = await r.json().catch(() => ({}));
      if (!r.ok || !b.ok) throw new Error(b.why || 'Chưa gửi được, thử lại sau nhé.');
      form.replaceWith(mk('p', 'done', 'Cảm ơn bạn! Góp ý đã tới tay người làm game.'));
    } catch (err) { msg.textContent = err.message || 'Chưa gửi được, thử lại sau nhé.'; send.disabled = false; }
  };
  return box;
}
