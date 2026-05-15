import { getSessions, clearSessions } from './db.js';
import { state } from './state.js';
import { MOOD_EMOJI } from './ui.js';

export async function renderStats() {
  if (!state.currentUser) return;
  const sessions = await getSessions(state.currentUser.uid);

  const totalSessions = sessions.length;
  const totalMinutes  = sessions.reduce((a,s) => a+s.minutes, 0);
  const dates = [...new Set(sessions.map(s => s.date.slice(0,10)))].sort();
  let streak = 0;
  if (dates.length > 0) {
    const today = new Date().toISOString().slice(0,10);
    let check = today;
    for (let i = dates.length-1; i >= 0; i--) {
      if (dates[i] === check) {
        streak++;
        const d = new Date(check); d.setDate(d.getDate()-1);
        check = d.toISOString().slice(0,10);
      } else if (dates[i] < check) break;
    }
  }
  document.getElementById('stat-total-sessions').textContent = totalSessions;
  document.getElementById('stat-total-minutes').textContent  = totalMinutes;
  document.getElementById('stat-streak').textContent         = streak;
  renderCalendar(sessions);
  renderMoodStats(sessions);
  renderHistory(sessions);
}

function renderCalendar(sessions) {
  const cal = document.getElementById('calendar');
  cal.innerHTML = '';
  const sessionDates = new Set(sessions.map(s => s.date.slice(0,10)));
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth();
  const todayStr = today.toISOString().slice(0,10);
  ['일','월','화','수','목','금','토'].forEach(d => {
    const h = document.createElement('div'); h.className='cal-header'; h.textContent=d; cal.appendChild(h);
  });
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  for (let i=0; i<firstDay; i++) {
    const e = document.createElement('div'); e.className='cal-day empty'; cal.appendChild(e);
  }
  for (let d=1; d<=daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const el = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = d;
    if (dateStr === todayStr) el.classList.add('today');
    if (sessionDates.has(dateStr)) el.classList.add('has-session');
    cal.appendChild(el);
  }
}

function renderMoodStats(sessions) {
  const el = document.getElementById('mood-stats-section');
  const moodSessions = sessions.filter(s => s.moodBefore && s.moodAfter);
  if (moodSessions.length === 0) { el.style.display='none'; return; }
  el.style.display='';
  const avg = moodSessions.reduce((a,s) => a+(s.moodAfter-s.moodBefore), 0) / moodSessions.length;
  const msg = avg > 0.2
    ? `명상 후 기분이 평균 +${avg.toFixed(1)}점 좋아졌어요 ✨`
    : avg < -0.2
      ? `명상 후 기분이 평균 ${avg.toFixed(1)}점 변했어요`
      : `명상 전후 기분이 비슷하게 유지됐어요 😌`;
  document.getElementById('mood-stats-value').textContent = msg;
  document.getElementById('mood-stats-count').textContent = `${moodSessions.length}개 세션 분석`;
}

function renderHistory(sessions) {
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  if (sessions.length === 0) {
    list.innerHTML = '<div class="no-history">아직 기록이 없어요.<br/>첫 명상을 시작해보세요!</div>';
    return;
  }
  [...sessions].reverse().slice(0,20).forEach(s => {
    const date = new Date(s.date);
    const dateStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
    const moodStr = (s.moodBefore || s.moodAfter)
      ? ` · ${s.moodBefore?MOOD_EMOJI[s.moodBefore]:'•'} → ${s.moodAfter?MOOD_EMOJI[s.moodAfter]:'•'}`
      : '';
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-icon">${s.type==='breathing'?'🌬️':'⏳'}</div>
      <div class="history-info">
        <div class="history-title">${s.label}</div>
        <div class="history-meta">${dateStr}${moodStr}</div>
      </div>
      <div class="history-dur">${s.minutes}분</div>`;
    list.appendChild(item);
  });
}

export function setupStatsHandlers() {
  document.getElementById('clear-data-btn').addEventListener('click', async () => {
    if (!confirm('모든 명상 기록을 삭제할까요?')) return;
    if (state.currentUser) {
      await clearSessions(state.currentUser.uid);
      renderStats();
    }
  });
}
