import { listenAuthState, doSignup, doLogin, authErrMsg } from './modules/auth.js';
import { saveSession, getPrefs, savePrefs } from './modules/db.js';
import { state } from './modules/state.js';
import {
  applyTheme, showAuthScreen, hideAuthScreen,
  switchPage, setupNavigation,
  showCompleteModal, hideCompleteModal,
  setupMoodPicker, resetMoodPicker, MOOD_EMOJI
} from './modules/ui.js';
import {
  soundState, updateVolumeUI, playSound, stopSound, setGainVolume
} from './modules/audio.js';
import { initBreathing, stopBreathing, isBreathRunning } from './modules/breathing.js';
import { initTimer, resetTimer, isTimerRunning } from './modules/timer.js';
import { renderStats, setupStatsHandlers } from './modules/stats.js';
import { renderHomeStreak } from './modules/home.js';
import { renderSettingsPage, setupSettingsHandlers } from './modules/settings.js';
import { showBubbles, hideBubbles } from './modules/bubbles.js';

// ===== Navigation =====
function goTo(pageId) {
  switchPage(pageId);
  if (pageId === 'home') { renderHomeStreak().catch(()=>{}); showBubbles(); }
  else hideBubbles();
  if (pageId === 'stats')    renderStats().catch(()=>{});
  if (pageId === 'settings') renderSettingsPage();
  if (pageId === 'breathing') { state.breathMoodBefore=0; resetMoodPicker('breath-mood-before'); }
  if (pageId === 'timer')     { state.timerMoodBefore=0;  resetMoodPicker('timer-mood-before'); }
}

setupNavigation(goTo);

// ===== Auth State =====
listenAuthState(
  async (user) => {
    state.currentUser = user;
    const prefs = await getPrefs(user.uid);
    applyTheme(prefs.theme || 'dark');
    hideAuthScreen();
    renderHomeStreak().catch(()=>{});
    showBubbles();
  },
  () => {
    state.currentUser = null;
    if (isBreathRunning()) stopBreathing(false);
    resetTimer();
    hideBubbles();
    applyTheme('dark');
    state.breathMoodBefore = 0;
    state.timerMoodBefore  = 0;
    state.pendingSession   = null;
    state.pendingMoodAfter = 0;
    resetMoodPicker('breath-mood-before');
    resetMoodPicker('timer-mood-before');
    document.getElementById('login-email').value  = '';
    document.getElementById('login-pw').value     = '';
    document.getElementById('login-error').textContent = '';
    switchPage('home');
    showAuthScreen();
  }
);

// ===== Auth Forms =====
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.auth;
    document.getElementById('auth-login-form').classList.toggle('hidden', target!=='login');
    document.getElementById('auth-signup-form').classList.toggle('hidden', target!=='signup');
    document.getElementById('login-error').textContent  = '';
    document.getElementById('signup-error').textContent = '';
  });
});

async function handleLogin() {
  const email  = document.getElementById('login-email').value.trim();
  const pw     = document.getElementById('login-pw').value;
  const errEl  = document.getElementById('login-error');
  errEl.textContent = '';
  if (!email||!pw) { errEl.textContent='이메일과 비밀번호를 입력해주세요.'; return; }
  try {
    document.getElementById('login-btn').disabled = true;
    await doLogin(email, pw);
  } catch(e) {
    errEl.textContent = authErrMsg(e.code);
  } finally {
    document.getElementById('login-btn').disabled = false;
  }
}

async function handleSignup() {
  const email  = document.getElementById('signup-email').value.trim();
  const name   = document.getElementById('signup-name').value.trim();
  const pw     = document.getElementById('signup-pw').value;
  const pw2    = document.getElementById('signup-pw2').value;
  const errEl  = document.getElementById('signup-error');
  errEl.textContent = '';
  if (!email||!name||!pw||!pw2) { errEl.textContent='모든 항목을 입력해주세요.'; return; }
  if (name.length<1||name.length>12) { errEl.textContent='닉네임은 1~12자로 입력해주세요.'; return; }
  if (pw.length<6)  { errEl.textContent='비밀번호는 6자 이상이어야 해요.'; return; }
  if (pw!==pw2)     { errEl.textContent='비밀번호가 일치하지 않아요.'; return; }
  try {
    document.getElementById('signup-btn').disabled = true;
    await doSignup(email, name, pw);
  } catch(e) {
    errEl.textContent = authErrMsg(e.code);
  } finally {
    document.getElementById('signup-btn').disabled = false;
  }
}

document.getElementById('login-btn').addEventListener('click', handleLogin);
document.getElementById('signup-btn').addEventListener('click', handleSignup);
['login-email','login-pw'].forEach(id =>
  document.getElementById(id).addEventListener('keydown', e => { if(e.key==='Enter') handleLogin(); }));
['signup-email','signup-name','signup-pw','signup-pw2'].forEach(id =>
  document.getElementById(id).addEventListener('keydown', e => { if(e.key==='Enter') handleSignup(); }));

// ===== Sound Buttons =====
document.querySelectorAll('.sound-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    soundState.current = btn.dataset.sound;
    const volRow = document.getElementById('volume-row');
    if (soundState.current === 'none') {
      volRow.classList.add('hidden');
      stopSound();
    } else {
      volRow.classList.remove('hidden');
      soundState.volume = soundState.volumes[soundState.current];
      updateVolumeUI(soundState.volume);
      if (isTimerRunning()) playSound(soundState.current);
      else stopSound();
    }
  });
});

// ===== Volume Slider =====
document.getElementById('volume-slider').addEventListener('input', function() {
  soundState.volume = this.value / 100;
  soundState.volumes[soundState.current] = soundState.volume;
  updateVolumeUI(soundState.volume);
  setGainVolume(soundState.volume);
});

// ===== Completion Modal =====
setupMoodPicker('breath-mood-before', v => state.breathMoodBefore = v);
setupMoodPicker('timer-mood-before',  v => state.timerMoodBefore  = v);
setupMoodPicker('modal-mood-after',   v => state.pendingMoodAfter  = v);

document.getElementById('modal-close-btn').addEventListener('click', async () => {
  if (state.pendingSession && state.currentUser) {
    const session = {
      type:    state.pendingSession.type,
      minutes: state.pendingSession.minutes,
      label:   state.pendingSession.label,
      date:    new Date().toISOString(),
    };
    if (state.pendingSession.moodBefore) session.moodBefore = state.pendingSession.moodBefore;
    if (state.pendingMoodAfter)          session.moodAfter  = state.pendingMoodAfter;
    await saveSession(state.currentUser.uid, session).catch(()=>{});
    state.pendingSession   = null;
    state.pendingMoodAfter = 0;
  }
  hideCompleteModal();
});

// ===== Module Init =====
initBreathing();
initTimer();
setupStatsHandlers();
setupSettingsHandlers();

// ===== PWA Service Worker =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
