import { getSessions } from './db.js';
import { state } from './state.js';

export async function renderHomeStreak() {
  if (!state.currentUser) return;
  const sessions  = await getSessions(state.currentUser.uid);
  const todayStr  = new Date().toISOString().slice(0,10);
  const todayDone = sessions.some(s => s.date.slice(0,10) === todayStr);

  document.getElementById('hero-circle')
    .classList.toggle('done-today', todayDone);
  document.getElementById('hero-greeting').innerHTML =
    `안녕하세요,<br/>${state.currentUser.displayName}님 👋`;

  const el = document.getElementById('home-streak');
  if (sessions.length === 0) { el.textContent='오늘 첫 명상을 시작해보세요 🌱'; return; }

  const dates = [...new Set(sessions.map(s => s.date.slice(0,10)))].sort();
  let streak=0, check=todayStr;
  for (let i=dates.length-1; i>=0; i--) {
    if (dates[i]===check) {
      streak++;
      const d=new Date(check); d.setDate(d.getDate()-1);
      check=d.toISOString().slice(0,10);
    } else break;
  }
  const total = sessions.reduce((a,s)=>a+s.minutes,0);
  el.textContent = streak>0
    ? `🔥 ${streak}일 연속 명상 중 · 총 ${total}분`
    : `총 ${total}분 명상 완료`;
}
