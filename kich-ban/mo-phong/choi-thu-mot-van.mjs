// Replays one full run with a day-by-day log. Usage: node replay.mjs <seed> [chamchi|xahoi]
import * as G from '../../visual-design/engine.js'; import fs from 'fs';
const K=new URL('../',import.meta.url).pathname;
const DATA=JSON.parse(fs.readFileSync(K+'cards.json')),CARDS=DATA.cards,HB=JSON.parse(fs.readFileSync(K+'handbook.json')),DG=JSON.parse(fs.readFileSync(K+'danh-gia.json'));
G.useMinigames(JSON.parse(fs.readFileSync(K+'minigames.json')));
const MGR=[.25,.5,.25];
function rngOf(seed){let x=seed>>>0||1;return()=>{x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;return x/2**32;};}
const seed=+process.argv[2]||1,kind=process.argv[3]||'chamchi';
const W={chamchi:{xp:3,ut:1.6,qh:.6,pin:.25},xahoi:{xp:1,ut:1,qh:3,pin:.3}}[kind];
const rng=rngOf(seed),RNG=rngOf(seed^0x9e3779b9),NOISE=.65;
function pick(s,c){if(RNG()<NOISE)return Math.floor(RNG()*c.choices.length);let b=0,bv=-1e9;c.choices.forEach((ch,i)=>{const e=ch.effects||{};const v=(e.xp||0)*W.xp+(e.ut||0)*W.ut+(e.qh||0)*W.qh+(e.pin||0)*W.pin*(s.stats.pin<35?4:1)+((ch.addFlags||[]).includes('ghi_diem_voi_sep')?4:0);if(v>bv){bv=v;b=i;}});return b;}
function afternoon(s){const A=s.counters.actions,can=G.roomOpen(s,'canteen');if(s.stats.pin<30&&can)return'an_trua_co_ba';const left=40-s.day,need=[];
 if(can&&(A.an_trua_co_ba||0)<3)need.push('an_trua_co_ba');if((A.bao_cao_sep||0)<3)need.push('bao_cao_sep');if((A.giup_chi_mai||0)<2)need.push('giup_chi_mai');if((A.lam_task||0)<5)need.push('lam_task');
 if(can&&(s.counters.gossipWith.length<3||!Object.values(s.close).some(v=>v>=40)))need.push('tam_chuyen');
 if(kind==='xahoi')return can?(need.includes('bao_cao_sep')&&s.day>20?'bao_cao_sep':'tam_chuyen'):'hoi_senior';
 if(need.length&&need.length>=Math.round(left*5/7)-4)return need.find(a=>a!=='lam_task')||need[0];
 if(can&&s.day>18&&s.stats.qh<50)return'tam_chuyen';return s.stats.ut<62&&s.day%2?'bao_cao_sep':'lam_task';}
const st=s=>`XP ${s.stats.xp} · Pin ${s.stats.pin} · UT ${s.stats.ut} · QH ${s.stats.qh}`;
const days={};const D=d=>days[d]??={day:d,ev:[]};
const s=G.newGame({rng,startRooms:DATA.rooms?.start});G.startMorning(s,CARDS,rng);
const mis=()=>{const before=s.missionsDone.length;G.checkMissions(s,HB);if(s.missionsDone.length>before)D(s.day).ev.push('📒 Xong nhiệm vụ sổ tay: '+s.missionsDone.slice(before).map(id=>HB.missions.find(m=>m.id===id)?.title||id).join(', '));};
const ch=(c,i)=>c.choices[i].label;
for(let g=0;g<300&&s.part!=='over';g++){
 const d=D(s.day);
 if(s.part==='morning'){
  for(const r of s.rooms)G.recordRoom(s,r);if(s.day<=12)for(const n of G.NPC_IDS)if(n!=='coba'||G.roomOpen(s,'canteen'))G.recordTalk(s,n);
  const u=G.todaysUnlock(s,CARDS);if(u){const i=pick(s,u);G.chooseOption(s,u,i);d.ev.push(`🔓 ${u.title}: "${ch(u,i)}"`);mis();}
  if(s.today.minigame){const r=rng(),gr=r<MGR[0]?'xuat_sac':r<MGR[0]+MGR[1]?'dat':'truot';const mg=G.minigameById(s.today.minigame.id||s.today.minigame);G.playMinigame(s,gr);d.ev.push(`🎮 Mini-game ${mg?.name||s.today.minigame}: ${{xuat_sac:'Xuất sắc',dat:'Đạt',truot:'Trượt'}[gr]}`);mis();continue;}
  const c=G.todaysCard(s,CARDS);if(!c){s.part='afternoon';continue;}
  const i=G.autoResolves(s,c)?0:pick(s,c);G.chooseOption(s,c,i);d.ev.push(`🃏 ${c.title}: "${ch(c,i)}"`);mis();continue;}
 if(s.part==='afternoon'){const sitting=s.today.canteen;let a=afternoon(s);let partner=sitting[0];
  if(a==='tam_chuyen'){const fresh=sitting.find(n=>!s.counters.gossipWith.includes(n));const best=[...sitting].sort((x,y)=>s.close[y]-s.close[x])[0];partner=s.counters.gossipWith.length<3&&fresh?fresh:best;}
  if(!G.actionAvailable(s,a,{sitting}).ok)a='lam_task';
  const r=G.doAction(s,a,{sitting,partner,senior:G.SENIORS[Math.floor(rng()*4)]},rng);d.ev.push(`🕑 Chiều: ${G.ACTIONS[a].label}. ${r.line}`);mis();continue;}
 if(s.part==='evening'){d.end=st(s);if(G.endOfDay(s))break;G.goHome(s);const n=G.drawNight(s,CARDS,rng);
  if(n){const i=pick(s,n);G.chooseOption(s,n,i);d.ev.push(`🌙 Tối: ${n.title}: "${ch(n,i)}"`);mis();}
  const r=G.nextDay(s,CARDS,rng);
  if(r.weekend){const c=G.todaysCard(s,CARDS);if(c){const i=pick(s,c);G.chooseOption(s,c,i);D(s.day).ev.push(`🏖 Cuối tuần: ${c.title}: "${ch(c,i)}"`);mis();}G.endWeekend(s,CARDS,rng);D(s.day).ev.push('Cuối tuần: Pin +20');}
  continue;}
}
const out={seed,kind,final:st(s),ending:s.ending,missions:s.missionsDone.length,flags:s.flags,days:Object.values(days)};
if(s.ending==='review'){const rv=G.review(s,HB,DG);out.review=rv;}
fs.writeFileSync(process.argv[4]||'replay.json',JSON.stringify(out,null,1));
console.log(seed,kind,s.ending,out.final,'missions',out.missions,out.review?.ending?.id||out.review?.id||'');
