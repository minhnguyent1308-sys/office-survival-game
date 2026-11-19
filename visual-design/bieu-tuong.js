// Biểu tượng cho từng món trong Bộ sưu tập (56 món): kết cục, huy hiệu, chuyện ở trọ/công ty, ngày đặc biệt, chuyện riêng.
// Khóa = id trong danh-gia.json (kết cục, huy hiệu) hoặc id lá trong cards.json. Mỗi hình vẽ trong ô 64x64, nét mực dày 2.5, tô phẳng bằng màu của HUD.
// Thêm kết cục / huy hiệu / lá mới thì thêm một dòng ở đây; thiếu hình thì sổ dùng hình chung của nhóm (ho-so.js).
const I = 'var(--ink)', P = 'var(--paper)', Y = 'var(--yellow)', R = 'var(--accent)', B = 'var(--xp)', G = 'var(--pin)';
const W = '#d9a066', C = '#fff4cf', K = '#f6b8bd', O = '#f6923b', V = '#9b7fd1', S = '#d8d0c4', L = '#bfe6c8', T = '#e9b872';
const heart = (x, y, s = 1, f = R) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 5C-9 -1 -5 -8 0 -3C5 -8 9 -1 0 5Z" fill="${f}"/>`;
const txt = (x, y, size, s, f = I) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${f}" stroke="none" style="font-family:var(--font-display);font-weight:800">${s}</text>`;

export const ICON = {
  /* ---------- Kết cục ---------- */
  junior: `<rect x="12" y="12" width="32" height="44" rx="5" fill="${P}"/><rect x="22" y="6" width="12" height="8" rx="2" fill="${S}"/><circle cx="28" cy="28" r="6" fill="${Y}"/><path d="M18 46a10 8 0 0 1 20 0"/><path d="M53 54V34M46 41l7-7 7 7" stroke="${G}" stroke-width="4"/>`,
  van_nghe: `<rect x="25" y="6" width="14" height="28" rx="7" fill="${R}"/><path d="M18 28a14 14 0 0 0 28 0M32 42v10M23 54h18"/><path d="M29 14h6M29 20h6" stroke="${P}"/>`,
  khach_hang: `<path d="M23 20v-4a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4"/><rect x="8" y="20" width="48" height="32" rx="5" fill="${W}"/><path d="M8 34h48"/><rect x="27" y="31" width="10" height="8" rx="2" fill="${Y}"/>`,
  phu_bep: `<path d="M22 6l4 16h12l4-16"/><path d="M18 22h28l4 34H14z" fill="${Y}"/><rect x="24" y="38" width="16" height="10" rx="2" fill="${P}"/>`,
  ca_phong: `<rect x="12" y="6" width="40" height="52" rx="4" fill="${P}"/><path d="M20 18h24M20 26c4-4 6 4 10 0s6 3 10 0M20 36c4-4 6 4 10 0M20 44c3-3 5 3 9 0" stroke-width="2"/>${heart(42, 47, .9)}`,
  gia_han: `<rect x="8" y="12" width="48" height="44" rx="5" fill="${P}"/><path d="M8 24h48" /><path d="M8 17a5 5 0 0 1 5-5h38a5 5 0 0 1 5 5v7H8z" fill="${R}"/><path d="M20 6v10M44 6v10"/>${txt(32, 49, 19, '+30')}`,
  cam_on: `<path d="M12 24h32v12a14 14 0 0 1-14 14h-4a14 14 0 0 1-14-14z" fill="${P}"/><path d="M44 28h3a6 6 0 0 1 0 12h-4"/><path d="M8 56h40"/><path d="M22 18q-3-4 0-8M32 18q-3-4 0-8" stroke-width="2"/>${heart(28, 36, 1.1)}`,
  burnout: `<path d="M12 32q-6 6 0 14q4-6 8-8" fill="${S}"/><ellipse cx="30" cy="40" rx="18" ry="14" fill="${P}"/><circle cx="43" cy="24" r="9" fill="${P}"/><path d="M40 16q2-8 6-5q4-3 4 6z" fill="${R}"/><path d="M51 24l7 3-7 3z" fill="${Y}"/><circle cx="45" cy="22" r="1.6" fill="${I}" stroke="none"/><path d="M26 54v6M36 54v6M22 60h8M32 60h8"/><path d="M22 36q6 8 14 0" stroke-width="2"/>`,
  fired: `<path d="M32 36V20" stroke="${G}"/><path d="M32 26c-9 0-11-6-11-10 7 0 11 4 11 10zM32 23c7 0 10-4 10-9-7 0-10 4-10 9z" fill="${G}"/><rect x="10" y="34" width="44" height="22" rx="2" fill="${W}"/><path d="M10 42h44"/><rect x="25" y="46" width="14" height="6" rx="1" fill="${C}" stroke-width="2"/>`,

  /* ---------- Huy hiệu ---------- */
  nhan_vien_moi_guong_mau: `<rect x="14" y="12" width="36" height="44" rx="4" fill="${P}"/><rect x="24" y="7" width="16" height="9" rx="2" fill="${S}"/><path d="M20 27l3 3 6-6M20 37l3 3 6-6M20 47l3 3 6-6" stroke="${G}" stroke-width="3"/><path d="M34 28h10M34 38h10M34 48h10"/>`,
  chien_binh_cuoi_tuan: `<rect x="12" y="12" width="40" height="30" rx="3" fill="${P}"/><circle cx="32" cy="27" r="6" fill="${Y}"/><path d="M32 16v3M32 35v3M21 27h3M40 27h3M24 19l2 2M40 19l-2 2" stroke-width="2"/><path d="M6 46h52l-4 7H10z" fill="${S}"/>`,
  seen_tin_nhan_sep: `<path d="M10 12h44a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H30L18 54V42h-8a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z" fill="${P}"/><path d="M17 28l5 5 9-10M28 28l5 5 9-10" stroke="${B}" stroke-width="3"/>`,
  ghi_diem_voi_sep: `<path d="M32 6a17 17 0 0 1 9 31v7H23v-7A17 17 0 0 1 32 6z" fill="${Y}"/><path d="M25 50h14M27 56h10M10 14l5 4M54 14l-5 4M5 30h6M53 30h6" />`,
  thu_quy_bat_dac_di: `<path d="M20 24l2-9 9 6z" fill="${K}"/><ellipse cx="30" cy="37" rx="20" ry="15" fill="${K}"/><ellipse cx="52" cy="38" rx="6" ry="7" fill="${K}"/><rect x="18" y="48" width="6" height="9" rx="2" fill="${K}"/><rect x="36" y="48" width="6" height="9" rx="2" fill="${K}"/><path d="M10 34c-6-2-5-8 0-6M26 25h10"/><circle cx="41" cy="31" r="1.8" fill="${I}" stroke="none"/><circle cx="31" cy="11" r="6" fill="${Y}"/>`,
  ngoi_sao_karaoke: `<path d="M28 8L33.3 22.7 48.9 23.2 36.6 32.8 40.9 47.8 28 39 15.1 47.8 19.4 32.8 7.1 23.2 22.7 22.7Z" fill="${Y}"/><circle cx="50" cy="50" r="5" fill="${I}"/><path d="M55 50V30q6 2 6 8"/>`,
  duoc_khach_hang_quy_men: `<circle cx="32" cy="32" r="22" fill="${Y}"/><circle cx="24" cy="27" r="2.4" fill="${I}" stroke="none"/><circle cx="40" cy="27" r="2.4" fill="${I}" stroke="none"/><path d="M21 37q11 12 22 0"/><circle cx="19" cy="36" r="3" fill="${K}" stroke="none"/><circle cx="45" cy="36" r="3" fill="${K}" stroke="none"/>${heart(54, 10, .8)}`,
  so_tay_chi_hang: `<rect x="14" y="8" width="38" height="48" rx="4" fill="${C}"/><path d="M14 16h-4M14 26h-4M14 36h-4M14 46h-4" stroke-width="3"/>${heart(33, 28, 1.5)}<path d="M24 44h18" />`,
  tin_mat_chi_mai: `<rect x="6" y="14" width="46" height="32" rx="4" fill="${P}"/><path d="M6 18l23 16 23-16"/><rect x="38" y="38" width="18" height="16" rx="3" fill="${Y}"/><path d="M42 38v-4a5 5 0 0 1 10 0v4"/>`,
  bi_kip_anh_tung: `<rect x="10" y="8" width="34" height="46" rx="3" fill="${P}"/>${txt(27, 40, 30, '?', R)}<g transform="translate(-6 0) rotate(35 50 38)"><rect x="46" y="14" width="8" height="30" rx="1" fill="${Y}"/><path d="M46 44l4 10 4-10z" fill="${C}"/><path d="M46 20h8"/></g>`,
  than_voi_tuan: `<path d="M26 8h12l-2 10h-8z" fill="${R}"/><path d="M28 18l-4 34 8 6 8-6-4-34z" fill="${R}"/>${heart(52, 14, .9)}`,
  than_voi_hang: `<rect x="10" y="12" width="42" height="42" rx="3" fill="${Y}"/><path d="M52 40L40 54V45a3 3 0 0 1 3-3z" fill="${C}"/>${txt(30, 40, 19, 'OK')}${heart(52, 12, .9)}`,
  than_voi_linh: `<path d="M8 56L22 22l22 22z" fill="${Y}"/><path d="M14 42l12 12M18 32l14 14" stroke-width="2"/><path d="M28 22q6-10 14-6" stroke="${R}"/><circle cx="38" cy="10" r="2.6" fill="${B}" stroke="none"/><circle cx="50" cy="26" r="2.6" fill="${G}" stroke="none"/><circle cx="48" cy="12" r="2.6" fill="${R}" stroke="none"/><circle cx="56" cy="36" r="2.6" fill="${Y}" stroke="none"/>`,
  than_voi_minh: `<path d="M12 38v-6a20 20 0 0 1 40 0v6"/><rect x="7" y="36" width="12" height="18" rx="5" fill="${R}"/><rect x="45" y="36" width="12" height="18" rx="5" fill="${R}"/>${heart(32, 40, 1.2)}`,
  than_voi_tung: `<circle cx="19" cy="36" r="11" fill="${P}"/><circle cx="45" cy="36" r="11" fill="${P}"/><path d="M30 34q2-3 4 0M8 33L2 28M56 33l6-5"/><path d="M13 31l5-3" stroke-width="2"/>${heart(32, 14, 1.1)}`,
  than_voi_mai: `<path d="M10 44a22 22 0 0 1 44 0z" fill="${Y}"/><rect x="6" y="44" width="52" height="9" rx="3" fill="${S}"/><path d="M32 22v-4"/><circle cx="32" cy="15" r="3.5" fill="${I}"/>${heart(54, 12, .9)}`,
  than_voi_coba: `<path d="M12 28h40v16a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10z" fill="${S}"/><path d="M8 28h48M12 34H5M52 34h7M28 24h8"/><path d="M22 20q-3-4 0-8q3-4 0-8M34 20q-3-4 0-8q3-4 0-8" stroke-width="2"/>${heart(32, 42, 1.1)}`,
  nhan_vien_kpi: `<circle cx="30" cy="34" r="22" fill="${P}"/><circle cx="30" cy="34" r="15" fill="${R}"/><circle cx="30" cy="34" r="8" fill="${P}"/><circle cx="30" cy="34" r="3" fill="${R}"/><path d="M30 34L54 10M48 10h8v8"/>`,

  /* ---------- Phong cách phòng trọ (Lily 18/11): một bộ đồ mua đủ ở Chợ Trọ ---------- */
  bo_tro_tieu_chuan: `<path d="M8 30L32 10l24 20" fill="none"/><rect x="13" y="28" width="38" height="28" rx="2" fill="${P}"/><rect x="18" y="38" width="16" height="3" fill="${W}"/><path d="M20 41v8M32 41v8" stroke-width="2"/><path d="M43 50v-8" stroke="${G}"/><path d="M43 44c-5 0-6-4-6-6 4 0 6 2 6 6zM43 43c4 0 5-3 5-5-4 0-5 2-5 5z" fill="${G}"/>`,
  bo_am_cung: `<path d="M6 14q13 12 26 0q13 12 26 0" fill="none" stroke-width="2"/><circle cx="12" cy="18" r="3" fill="${Y}"/><circle cx="22" cy="21" r="3" fill="${Y}"/><circle cx="42" cy="21" r="3" fill="${Y}"/><circle cx="52" cy="18" r="3" fill="${Y}"/><path d="M18 34h28v14a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8z" fill="${O}"/><path d="M46 38h3a5 5 0 0 1 0 10h-3"/><path d="M26 30q-2-3 0-6M34 30q-2-3 0-6" stroke-width="2"/>`,
  bo_de_thuong: `<circle cx="18" cy="16" r="7" fill="${W}"/><circle cx="46" cy="16" r="7" fill="${W}"/><circle cx="32" cy="34" r="20" fill="${W}"/><ellipse cx="32" cy="41" rx="9" ry="7" fill="${C}"/><circle cx="25" cy="31" r="2.4" fill="${I}" stroke="none"/><circle cx="39" cy="31" r="2.4" fill="${I}" stroke="none"/><circle cx="32" cy="38" r="2" fill="${I}" stroke="none"/><path d="M24 54l8-5 8 5-8 5z" fill="${K}"/>`,
  bo_wibu: `<rect x="12" y="6" width="40" height="52" rx="3" fill="${K}"/><circle cx="32" cy="30" r="13" fill="${C}"/><path d="M19 28q13-16 26 0l-4-4-4 5-5-6-5 6-4-5z" fill="${V}"/><circle cx="27" cy="31" r="2.6" fill="${I}" stroke="none"/><circle cx="37" cy="31" r="2.6" fill="${I}" stroke="none"/><path d="M29 37q3 2 6 0" stroke-width="2"/><path d="M20 50h24" stroke="${P}" stroke-width="3"/><path d="M50 6l3-4M56 12l5-2" stroke="${Y}" stroke-width="2"/>`,

  /* ---------- Chuyện ở trọ ---------- */
  EN_DIEN: `<path d="M14 6h36v52l-6-4-6 4-6-4-6 4-6-4-6 4z" fill="${P}"/><path d="M35 12L24 32h8l-4 16 14-22h-9z" fill="${Y}"/>`,
  EN_ME: `<rect x="16" y="6" width="32" height="52" rx="6" fill="${P}"/><circle cx="32" cy="27" r="10" fill="${C}"/><path d="M22 24q10-12 20 0" fill="${I}"/><circle cx="28" cy="28" r="1.5" fill="${I}" stroke="none"/><circle cx="36" cy="28" r="1.5" fill="${I}" stroke="none"/><path d="M28 33q4 3 8 0" stroke-width="2"/><circle cx="32" cy="49" r="4" fill="${G}"/>`,
  EN_KARAOKE: `<rect x="10" y="8" width="34" height="48" rx="5" fill="${P}"/><circle cx="27" cy="38" r="10" fill="${S}"/><circle cx="27" cy="38" r="3.5" fill="${I}"/><circle cx="27" cy="18" r="4" fill="${S}"/><circle cx="50" cy="42" r="4" fill="${I}"/><path d="M54 42V22q6 2 6 8"/>`,
  EN_SHIPPER: `<path d="M34 14l6-12" stroke="${R}" stroke-width="4"/><path d="M16 20l4 36h24l4-36z" fill="${P}"/><path d="M17.5 30h29L44 56H20z" fill="${T}" stroke="none"/><path d="M16 20l4 36h24l4-36z"/><rect x="13" y="14" width="38" height="7" rx="3" fill="${S}"/><circle cx="27" cy="48" r="2.8" fill="${I}" stroke="none"/><circle cx="35" cy="50" r="2.8" fill="${I}" stroke="none"/><circle cx="31" cy="42" r="2.8" fill="${I}" stroke="none"/><circle cx="39" cy="43" r="2.8" fill="${I}" stroke="none"/>`,
  EN_MEO: `<path d="M12 28V8l13 8h14l13-8v20a20 20 0 0 1-40 0z" fill="${W}"/><circle cx="24" cy="30" r="2.6" fill="${I}" stroke="none"/><circle cx="40" cy="30" r="2.6" fill="${I}" stroke="none"/><path d="M29 36h6l-3 3z" fill="${R}"/><path d="M32 39q-3 4-7 2M32 39q3 4 7 2M8 34h12M9 42l11-3M56 34H44M55 42l-11-3" stroke-width="2"/>`,
  EN_CUP_DIEN: `<rect x="6" y="20" width="46" height="26" rx="4" fill="${P}"/><rect x="52" y="28" width="6" height="10" rx="1" fill="${I}"/><rect x="10" y="24" width="7" height="18" rx="2" fill="${R}" stroke="none"/>${txt(35, 40, 14, '12%')}<path d="M28 10l-4 6h8l-4 6" stroke="${Y}" stroke-width="3"/>`,

  /* ---------- Chuyện ở công ty ---------- */
  EO_THANG_MAY: `<rect x="12" y="6" width="40" height="52" rx="4" fill="${P}"/><path d="M26 15l3-4 3 4M34 11l3 4 3-4" stroke-width="2"/><rect x="17" y="20" width="14" height="34" fill="${S}"/><rect x="33" y="20" width="14" height="34" fill="${S}"/><path d="M30 34l4 6" stroke="${R}" stroke-width="3"/>`,
  EO_MAY_IN: `<rect x="18" y="8" width="28" height="18" fill="${P}"/><rect x="6" y="24" width="52" height="24" rx="5" fill="${S}"/><path d="M16 48v10h32V48" fill="${P}"/><path d="M16 54l4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3" stroke="${R}" stroke-width="2"/><circle cx="48" cy="33" r="2.5" fill="${R}" stroke="none"/><path d="M12 37h24" stroke-width="2"/>`,
  EO_BAO_CHAY: `<path d="M32 8a4 4 0 0 1 4 4c10 3 14 10 14 20v8l6 6H8l6-6v-8c0-10 4-17 14-20a4 4 0 0 1 4-4z" fill="${R}"/><circle cx="32" cy="53" r="4.5" fill="${Y}"/><path d="M5 20q-3 8 0 16M59 20q3 8 0 16" stroke-width="2"/>`,
  EO_SINH_NHAT: `<path d="M32 2q6 6 0 10-6-4 0-10z" fill="${Y}" stroke-width="2"/><rect x="29" y="12" width="6" height="12" fill="${B}"/><rect x="14" y="24" width="36" height="14" rx="3" fill="${C}"/><rect x="8" y="38" width="48" height="18" rx="3" fill="${K}"/><path d="M14 31h4M26 31h4M38 31h4M16 47h4M30 47h4M44 47h4" stroke="${R}" stroke-width="3"/>`,
  EO_KHACH_LAC: `<rect x="4" y="30" width="12" height="24" rx="4" fill="${B}"/><rect x="48" y="30" width="12" height="24" rx="4" fill="${B}"/><rect x="12" y="14" width="40" height="26" rx="6" fill="${B}"/><rect x="10" y="36" width="44" height="14" rx="5" fill="${B}"/><path d="M14 50v7M50 50v7"/>${txt(32, 34, 22, '?', P)}`,
  EO_MON_MOI: `<ellipse cx="32" cy="44" rx="26" ry="10" fill="${P}"/><ellipse cx="32" cy="43" rx="17" ry="5.5" stroke-width="1.8"/><path d="M16 40a16 15 0 0 1 32 0z" fill="${V}"/><circle cx="26" cy="31" r="2" fill="${Y}" stroke="none"/><circle cx="35" cy="28" r="2" fill="${G}" stroke="none"/><circle cx="40" cy="35" r="2" fill="${R}" stroke="none"/><path d="M26 18q-3-4 0-8M36 18q-3-4 0-8" stroke-width="2"/>`,

  /* ---------- Ngày đặc biệt ---------- */
  SD_LUONG: `<rect x="4" y="14" width="46" height="30" rx="4" fill="${L}"/><circle cx="27" cy="29" r="8" fill="${Y}"/><circle cx="11" cy="21" r="2" fill="${I}" stroke="none"/><circle cx="43" cy="37" r="2" fill="${I}" stroke="none"/><circle cx="48" cy="46" r="10" fill="${Y}"/><path d="M48 41v10M44 46h8" stroke-width="2"/>`,
  SD_MAT_DIEN: `<rect x="18" y="22" width="28" height="20" rx="6" fill="${S}"/><rect x="25" y="6" width="4" height="16" fill="${I}"/><rect x="35" y="6" width="4" height="16" fill="${I}"/><path d="M32 42v5q0 7-10 7H12"/><path d="M8 8l48 48" stroke="${R}" stroke-width="4"/>`,
  SD_SEP_TONG: `<path d="M8 46l2-26 12 12 10-18 10 18 12-12 2 26z" fill="${Y}"/><rect x="8" y="46" width="48" height="9" rx="2" fill="${Y}"/><circle cx="18" cy="40" r="3" fill="${R}"/><circle cx="32" cy="40" r="3" fill="${R}"/><circle cx="46" cy="40" r="3" fill="${R}"/>`,
  SD_AO_CAM: `<path d="M22 8q10 10 20 0l16 10-8 12-6-4v30H20V26l-6 4-8-12z" fill="${O}"/><path d="M22 8q10 10 20 0" fill="none"/>`,
  SD_MUA_NGAP: `<path d="M16 34a8 8 0 0 1 2-15 12 12 0 0 1 23-2 9 9 0 0 1 5 17z" fill="${S}"/><path d="M20 40l-3 8M32 40l-3 8M44 40l-3 8" stroke="${B}"/><path d="M4 57q6-7 12 0t12 0 12 0 12 0" stroke="${B}"/>`,
  SD_GIENG_THAN: `<ellipse cx="32" cy="22" rx="22" ry="7" fill="${B}"/><path d="M10 22v28q22 12 44 0V22" fill="${W}"/><path d="M10 34q22 10 44 0M10 44q22 10 44 0M21 26v30M32 29v29M43 26v30" stroke-width="2"/><ellipse cx="32" cy="22" rx="22" ry="7"/><path d="M28 4l4 8 4-8" stroke="${Y}" stroke-width="3"/>`,
  SD_KIEM_TOAN: `<rect x="14" y="6" width="36" height="52" rx="5" fill="${P}"/><rect x="19" y="11" width="26" height="13" rx="2" fill="${L}"/><circle cx="23" cy="33" r="2.6" fill="${I}"/><circle cx="32" cy="33" r="2.6" fill="${I}"/><circle cx="41" cy="33" r="2.6" fill="${R}"/><circle cx="23" cy="42" r="2.6" fill="${I}"/><circle cx="32" cy="42" r="2.6" fill="${I}"/><circle cx="41" cy="42" r="2.6" fill="${R}"/><circle cx="23" cy="51" r="2.6" fill="${I}"/><circle cx="32" cy="51" r="2.6" fill="${I}"/><circle cx="41" cy="51" r="2.6" fill="${R}"/>`,

  /* ---------- Event Giếng thần (Lily 19/11) ---------- */
  bao_cao_ngoc: `<rect x="12" y="8" width="34" height="46" rx="3" fill="${C}"/><path d="M19 18h20M19 26h20M19 34h12"/><path d="M46 30l10 10-10 14-10-14z" fill="${B}"/><path d="M36 40h20M46 30v24" stroke-width="1.6"/><path d="M8 50l4 2M10 44l4 1" stroke="${Y}" stroke-width="3"/>`,

  /* ---------- Chuyện riêng ---------- */
  E1: `<path d="M24 18v-4h16v4"/><rect x="8" y="18" width="48" height="34" rx="6" fill="${P}"/><path d="M8 28h48" /><path d="M8 24a6 6 0 0 1 6-6h36a6 6 0 0 1 6 6v4H8z" fill="${Y}"/><path d="M32 28v24"/><path d="M12 48a8 8 0 0 1 16 0z" fill="${C}"/><ellipse cx="44" cy="44" rx="8" ry="6" fill="${P}"/><circle cx="44" cy="44" r="3.2" fill="${Y}"/><path d="M22 12q-3-4 0-7M32 12q-3-4 0-7" stroke-width="2"/>`,
  E2: `<rect x="12" y="8" width="40" height="48" rx="4" fill="${W}"/><path d="M20 8v48"/>${txt(37, 40, 24, '8', C)}<rect x="28" y="46" width="18" height="6" rx="1" fill="${Y}" transform="rotate(-8 37 49)" stroke-width="2"/>`,
  E3: `<rect x="24" y="8" width="16" height="6" rx="2" fill="${Y}"/><ellipse cx="32" cy="30" rx="19" ry="16" fill="${R}"/><path d="M32 14C21 25 21 36 32 46M32 14c11 11 11 22 0 32" stroke-width="2"/><rect x="24" y="45" width="16" height="6" rx="2" fill="${Y}"/><path d="M28 51v9M32 51v9M36 51v9" stroke-width="2"/>`,
  E4: `<path d="M6 16h18l6 6h28v30a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="${Y}"/><rect x="6" y="28" width="52" height="28" rx="4" fill="${C}"/>${txt(32, 50, 22, '★', R)}`,
  E5: `<path d="M18 12h28l-4 44H22z" fill="${P}"/><path d="M19.5 26h25L42 56H22z" fill="${T}" stroke="none"/><path d="M18 12h28l-4 44H22z"/><rect x="24" y="30" width="9" height="9" rx="2" fill="${P}" transform="rotate(12 28 34)"/><rect x="33" y="40" width="8" height="8" rx="2" fill="${P}" transform="rotate(-10 37 44)"/><circle cx="48" cy="12" r="8" fill="${Y}"/><path d="M48 4v16M40 12h16" stroke-width="1.6"/>`,
  E6: `<circle cx="20" cy="20" r="13" fill="${Y}"/><circle cx="20" cy="20" r="4.5" fill="${P}"/><path d="M30 30l26 26M44 44l6-6M50 50l6-6" stroke-width="3"/>`,
  E7: `<path d="M8 30h48a24 24 0 0 1-48 0z" fill="${P}"/><path d="M8 38h48" stroke-width="1.8"/>${heart(32, 46, 1.1)}<path d="M22 22q-3-4 0-8M32 22q-3-4 0-8" stroke-width="2"/><path d="M52 6L40 28" stroke-width="3"/><circle cx="38" cy="30" r="4" fill="${S}"/>`,
};

// the <svg> for one item; an id with no picture gets the generic one of its group (kind: e | b | p)
const GENERIC = {
  e: '<path d="M6 3v18"/><path d="M6 4h11l-2 4 2 4H6"/>',
  b: '<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>',
  p: '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>',
};
export const iconSvg = (id, kind) => ICON[id]
  ? `<svg class="ico" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="${I}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ICON[id]}</g></svg>`
  : `<svg class="ico generic" viewBox="0 0 24 24" aria-hidden="true">${GENERIC[kind] || GENERIC.p}</svg>`;
