import { state } from './state.js';
import { playSound, stopSound, playBell, soundState } from './audio.js';
import { showCompleteModal } from './ui.js';

let timerRunning     = false;
let timerPaused      = false;
let timerDurationSec = 600;
let timerRemainingSec= 600;
let timerInterval    = null;

const timerDigits    = document.getElementById('timer-digits');
const timerTotalDisp = document.getElementById('timer-total-display');
const timerRingEl    = document.getElementById('timer-ring');
const timerStartBtn  = document.getElementById('timer-start-btn');
const RING_CIRC      = 2 * Math.PI * 95;

function setTimerDisplay(sec) {
  const m = Math.floor(sec/60), s = sec%60;
  timerDigits.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  timerRingEl.style.strokeDashoffset = RING_CIRC * (sec / timerDurationSec);
}

function setSelectedDuration(sec) {
  timerDurationSec  = sec;
  timerRemainingSec = sec;
  timerTotalDisp.textContent = `총 ${Math.floor(sec/60)}분`;
  setTimerDisplay(sec);
  timerRingEl.style.strokeDashoffset = RING_CIRC;
}

function startTimer() {
  if (timerDurationSec <= 0) return;
  timerRunning = true; timerPaused = false;
  timerStartBtn.textContent = '일시정지';
  playSound(soundState.current);
  timerInterval = setInterval(() => {
    timerRemainingSec--;
    setTimerDisplay(timerRemainingSec);
    if (timerRemainingSec <= 0) completeTimer();
  }, 1000);
}

function pauseTimer() {
  timerRunning = false; timerPaused = true;
  clearInterval(timerInterval);
  timerStartBtn.textContent = '계속';
  stopSound();
}

function resumeTimer() {
  timerRunning = true; timerPaused = false;
  timerStartBtn.textContent = '일시정지';
  playSound(soundState.current);
  timerInterval = setInterval(() => {
    timerRemainingSec--;
    setTimerDisplay(timerRemainingSec);
    if (timerRemainingSec <= 0) completeTimer();
  }, 1000);
}

export function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false; timerPaused = false;
  timerStartBtn.textContent = '시작';
  stopSound();
  timerRemainingSec = timerDurationSec;
  setTimerDisplay(timerDurationSec);
  timerRingEl.style.strokeDashoffset = RING_CIRC;
}

function completeTimer() {
  clearInterval(timerInterval);
  timerRunning = false; timerPaused = false;
  timerStartBtn.textContent = '시작';
  stopSound();
  timerRingEl.style.strokeDashoffset = 0;
  if (document.getElementById('end-bell').checked) playBell();
  const durMin = Math.round(timerDurationSec / 60);
  state.pendingSession = {
    type: 'timer', minutes: durMin,
    label: '명상 타이머', moodBefore: state.timerMoodBefore
  };
  setTimeout(() => showCompleteModal('명상 타이머', durMin), 800);
  timerRemainingSec = timerDurationSec;
  setTimeout(() => setTimerDisplay(timerDurationSec), 2000);
}

export function isTimerRunning() { return timerRunning; }

export function initTimer() {
  document.querySelectorAll('.dur-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (timerRunning) return;
      document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const min = parseInt(btn.dataset.min);
      const customRow = document.getElementById('custom-dur-row');
      if (min === 0) customRow.classList.remove('hidden');
      else { customRow.classList.add('hidden'); setSelectedDuration(min*60); }
    });
  });
  document.getElementById('custom-min').addEventListener('change', function() {
    const v = Math.max(1, Math.min(180, parseInt(this.value)||1));
    this.value = v;
    setSelectedDuration(v*60);
  });
  timerStartBtn.addEventListener('click', () => {
    if (!timerRunning && !timerPaused) startTimer();
    else if (timerRunning) pauseTimer();
    else resumeTimer();
  });
  document.getElementById('timer-reset-btn').addEventListener('click', resetTimer);
  setSelectedDuration(600);
}
