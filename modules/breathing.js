import { state } from './state.js';
import { showCompleteModal } from './ui.js';

let breathInterval   = null;
let breathRunning    = false;
let breathPhaseTimer = null;
let breathStartTs    = null;
let breathDurationMs = 0;
let breathTickInterval = null;

const breathRing      = document.getElementById('breath-ring');
const breathLabel     = document.getElementById('breath-label');
const breathCount     = document.getElementById('breath-count');
const breathPhaseDesc = document.getElementById('breath-phase-desc');
const breathStartBtn  = document.getElementById('breath-start-btn');
const breathTimerDisp = document.getElementById('breath-timer-display');

export let breathPreset = { inhale:4, hold:0, exhale:4, name:'기본 4-4' };

function setBreathScale(scale) {
  breathRing.style.transform = `scale(${scale})`;
  const glow = Math.round((scale - 1) * 200);
  breathRing.style.boxShadow =
    `0 0 ${40+glow}px rgba(123,140,222,${0.2+(scale-1)*0.6})`;
}

function runBreathCycle() {
  const { inhale, hold, exhale } = breathPreset;
  const phases = [
    { key:'inhale', label:'들숨', desc:'코로 천천히 들이쉬세요', duration:inhale },
    ...(hold>0 ? [{ key:'hold', label:'참기', desc:'숨을 참아보세요', duration:hold }] : []),
    { key:'exhale', label:'날숨', desc:'입으로 천천히 내쉬세요', duration:exhale },
  ];
  let phaseIdx = 0;
  let countdown = phases[0].duration;

  function startPhase() {
    if (!breathRunning) return;
    const phase = phases[phaseIdx];
    breathLabel.textContent = phase.label;
    breathPhaseDesc.textContent = phase.desc;
    countdown = phase.duration;
    breathCount.textContent = countdown;
    if (phase.key === 'inhale') {
      const steps = phase.duration * 20; let step = 0;
      clearInterval(breathPhaseTimer);
      breathPhaseTimer = setInterval(() => { step++; setBreathScale(1+(step/steps)*0.4); if(step>=steps) clearInterval(breathPhaseTimer); }, 50);
    } else if (phase.key === 'exhale') {
      const steps = phase.duration * 20; let step = 0;
      clearInterval(breathPhaseTimer);
      breathPhaseTimer = setInterval(() => { step++; setBreathScale(1.4-(step/steps)*0.4); if(step>=steps) clearInterval(breathPhaseTimer); }, 50);
    }
  }
  startPhase();
  breathInterval = setInterval(() => {
    if (!breathRunning) { clearInterval(breathInterval); return; }
    countdown--;
    breathCount.textContent = countdown;
    if (countdown <= 0) { phaseIdx = (phaseIdx+1) % phases.length; startPhase(); }
  }, 1000);
}

export function startBreathing() {
  breathRunning = true;
  breathStartBtn.textContent = '중지';
  breathStartTs = Date.now();
  breathDurationMs = parseInt(document.getElementById('breath-duration').value) * 60000;
  runBreathCycle();
  breathTickInterval = setInterval(() => {
    const remaining = breathDurationMs - (Date.now() - breathStartTs);
    if (remaining <= 0) { stopBreathing(true); return; }
    const m = Math.floor(remaining/60000);
    const s = Math.floor((remaining%60000)/1000);
    breathTimerDisp.textContent = `남은 시간: ${m}:${s.toString().padStart(2,'0')}`;
  }, 500);
}

export function stopBreathing(completed = false) {
  breathRunning = false;
  clearInterval(breathInterval);
  clearInterval(breathTickInterval);
  clearInterval(breathPhaseTimer);
  breathStartBtn.textContent = '시작';
  breathLabel.textContent  = completed ? '완료' : '시작';
  breathCount.textContent  = '';
  breathTimerDisp.textContent = '';
  breathPhaseDesc.textContent = '준비가 되면 시작하세요';
  setBreathScale(1);
  if (completed) {
    const durMin = Math.round(breathDurationMs / 60000);
    state.pendingSession = {
      type: 'breathing', minutes: durMin,
      label: breathPreset.name, moodBefore: state.breathMoodBefore
    };
    showCompleteModal('호흡 명상', durMin);
  }
}

export function isBreathRunning() { return breathRunning; }

export function initBreathing() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      breathPreset = {
        inhale: parseInt(btn.dataset.inhale),
        hold:   parseInt(btn.dataset.hold),
        exhale: parseInt(btn.dataset.exhale),
        name:   btn.dataset.name,
      };
      if (!breathRunning) {
        breathLabel.textContent = '준비';
        breathCount.textContent = '';
        breathPhaseDesc.textContent =
          `들숨 ${breathPreset.inhale}초${breathPreset.hold?' · 참기 '+breathPreset.hold+'초':''} · 날숨 ${breathPreset.exhale}초`;
      }
    });
  });
  breathStartBtn.addEventListener('click', () => {
    if (breathRunning) stopBreathing(); else startBreathing();
  });
}
