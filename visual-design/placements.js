// Partner slots (affiliate) for "Sống sót nơi công sở" — the foundation only (Lily 15/11): slots are declared, nothing is shown yet.
// Content lives in placements.json: `slots` (where, by spot name on a map) and `items` (what, empty today). No item = nothing drawn.
// Rules kept here so every page follows them (from the farm-game notes on affiliate terms):
//   1. a link opens in a new tab, and the game is saved first;  2. every item carries the "Liên kết đối tác" label;
//   3. a click NEVER gives anything in the game (no XP, Pin, badge): partner terms forbid rewards for clicks.
export const LABEL = 'Liên kết đối tác';
let DATA = {slots: [], items: []};
export function usePlacements(data) { if (data) DATA = {slots: data.slots || [], items: data.items || []}; }
export const slotsFor = map => DATA.slots.filter(s => s.map === map);
// the item shown in a slot right now: the first whose `slot` matches and whose dates include today (YYYY-MM-DD, both optional)
export function itemFor(slotId, today = new Date().toISOString().slice(0, 10)) {
  return DATA.items.find(i => i.slot === slotId && (!i.from || i.from <= today) && (!i.until || today <= i.until)) || null;
}
export async function openPartnerLink(item, save) {
  try { await save?.(); } catch { /* still open the link */ }
  window.open(item.url, '_blank', 'noopener,noreferrer');
}
// Pages call this once. For each slot on this map with an item: a small labelled chip at the spot's anchor, kept in place by `project`.
// Returns an update function for the render loop (does nothing while there is no item).
export function mountSlots({map, anchorOf, layer, save, project}) {
  const live = [];
  for (const slot of slotsFor(map)) {
    const item = itemFor(slot.id), at = anchorOf(slot.spot); if (!item || !at) continue;
    const b = document.createElement('button'); b.className = 'chip partner';
    b.textContent = item.title; const tag = document.createElement('small'); tag.textContent = ' · ' + LABEL; b.appendChild(tag);
    b.onclick = () => openPartnerLink(item, save);
    layer.appendChild(b); live.push([b, at]);
  }
  return () => { for (const [b, at] of live) b.hidden = !project(b, at); };
}
export function validatePlacements(data, map, spots) {
  const problems = [], ids = new Set((data.slots || []).map(s => s.id));
  for (const s of data.slots || []) if (s.map === map && !spots.includes(s.spot)) problems.push(`slot ${s.id}: spot "${s.spot}" không có trên bản đồ ${map}`);
  for (const i of data.items || []) {
    if (!ids.has(i.slot)) problems.push(`item ${i.title || '?'}: slot "${i.slot}" lạ`);
    if (!/^https:\/\//.test(i.url || '')) problems.push(`item ${i.title || '?'}: url phải bắt đầu bằng https://`);
    if (i.reward || i.effects) problems.push(`item ${i.title || '?'}: không được thưởng trong game cho việc bấm link`);
  }
  return problems;
}
