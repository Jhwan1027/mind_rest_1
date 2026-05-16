// ===== Config =====
const firebaseConfig = {
  apiKey: "AIzaSyAkw4QMUb4yk5-HkUQICMEycx_ZROOcHc4",
  authDomain: "test1-1f599.firebaseapp.com",
  projectId: "test1-1f599",
  storageBucket: "test1-1f599.firebasestorage.app",
  messagingSenderId: "610139346182",
  appId: "1:610139346182:web:0a31c111aea76d4fc2fa87"
};

// ===== Firebase Init =====
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ===== State =====
const state = {
  currentUser:    null,
  pendingSession: null,
  pendingMoodAfter: 0,
  breathMoodBefore: 0,
  timerMoodBefore:  0,
};

// ===== UI =====
const MOOD_EMOJI = ['', '😢', '😟', '😐', '😊', '😄'];

function showAuthScreen() {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
}
function hideAuthScreen() {
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.themeBtn === theme));
}
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  document.querySelector('.nav-tab[data-page="' + pageId + '"]').classList.add('active');
}
function setupNavigation(goToFn) {
  document.querySelectorAll('.nav-tab').forEach(tab =>
    tab.addEventListener('click', () => goToFn(tab.dataset.page)));
  document.querySelectorAll('[data-goto]').forEach(el =>
    el.addEventListener('click', () => goToFn(el.dataset.goto)));
}
function showCompleteModal(type, minutes) {
  resetMoodPicker('modal-mood-after');
  document.getElementById('modal-desc').textContent =
    type + ' ' + minutes + '분을 완료했습니다.\n오늘도 수고하셨어요.';
  document.getElementById('complete-modal').classList.remove('hidden');
}
function hideCompleteModal() {
  document.getElementById('complete-modal').classList.add('hidden');
}
function setupMoodPicker(pickerId, onSelect) {
  document.getElementById(pickerId).addEventListener('click', function(e) {
    var btn = e.target.closest('.mood-btn');
    if (!btn) return;
    document.querySelectorAll('#' + pickerId + ' .mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    onSelect(Number(btn.dataset.val));
  });
}
function resetMoodPicker(pickerId) {
  document.querySelectorAll('#' + pickerId + ' .mood-btn').forEach(b => b.classList.remove('selected'));
}

// ===== Audio =====
const soundState = {
  current: 'none',
  volume: 0.8,
  volumes: { white:0.8, rain:0.8, forest:0.8, ocean:0.8, campfire:0.8, pink:0.8, bowl:0.8 },
};
const SOUND_FILES = {
  rain:     'audio/rain.ogg',
  forest:   'audio/forest.ogg',
  ocean:    'audio/ocean.ogg',
  campfire: 'audio/campfire.ogg',
  bowl:     'audio/bowl.ogg',
};
var audioCtx = null, noiseNode = null, gainNode = null;
var currentAudio = null, bowlTimer = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function updateVolumeUI(vol) {
  var pct = Math.round(vol * 100);
  document.getElementById('volume-slider').value = pct;
  document.getElementById('volume-pct').textContent = pct + '%';
  var icons = ['🔇','🔈','🔉','🔊'];
  document.getElementById('volume-icon').textContent =
    pct === 0 ? icons[0] : pct <= 33 ? icons[1] : pct <= 66 ? icons[2] : icons[3];
}
function stopSound() {
  if (bowlTimer) { clearTimeout(bowlTimer); bowlTimer = null; }
  if (noiseNode) { try { noiseNode.stop(); } catch(e){} noiseNode = null; }
  if (gainNode)  { gainNode.disconnect(); gainNode = null; }
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
}
function playBowlFile() {
  if (soundState.current !== 'bowl') return;
  var audio = new Audio(SOUND_FILES.bowl);
  currentAudio = audio;
  audio.volume = soundState.volume;
  audio.play().catch(function(){});
  audio.addEventListener('ended', function() {
    currentAudio = null;
    if (soundState.current !== 'bowl') return;
    bowlTimer = setTimeout(playBowlFile, 25000);
  });
}
function playGeneratedNoise(type) {
  var ctx = getAudioCtx();
  gainNode = ctx.createGain();
  gainNode.connect(ctx.destination);
  var bufSize = ctx.sampleRate * 3;
  var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  var data = buf.getChannelData(0);
  if (type === 'white') {
    for (var i=0; i<bufSize; i++) data[i] = Math.random()*2-1;
  } else {
    var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (var i=0; i<bufSize; i++) {
      var w = Math.random()*2-1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362)/7;
      b6 = w*0.115926;
    }
  }
  noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buf;
  noiseNode.loop = true;
  var filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = type === 'pink' ? 2000 : 3000;
  gainNode.gain.value = (type === 'pink' ? 0.28 : 0.15) * soundState.volume;
  noiseNode.connect(filter);
  filter.connect(gainNode);
  noiseNode.start();
}
function playSound(type) {
  stopSound();
  if (type === 'none') return;
  if (type === 'white' || type === 'pink') { playGeneratedNoise(type); return; }
  if (type === 'bowl') { playBowlFile(); return; }
  currentAudio = new Audio(SOUND_FILES[type]);
  currentAudio.loop = true;
  currentAudio.volume = soundState.volume;
  currentAudio.play().catch(function(){});
}
function playBell() {
  var ctx = getAudioCtx();
  [[528,0.6,3],[1056,0.2,2]].forEach(function(arr) {
    var freq=arr[0], amp=arr[1], dur=arr[2];
    var osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = 'sine';
    g.gain.setValueAtTime(amp, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime+dur);
  });
}
function setGainVolume(vol) {
  if (currentAudio && soundState.current !== 'bowl') {
    currentAudio.volume = vol;
  }
  if (gainNode) {
    gainNode.gain.value = (soundState.current === 'pink' ? 0.28 : 0.15) * vol;
  }
}

// ===== DB =====
async function getSessions(uid) {
  try {
    var snap = await db.collection('sessions').doc(uid).get();
    return snap.exists ? (snap.data().items || []) : [];
  } catch(e) { return []; }
}
async function saveSession(uid, session) {
  var ref = db.collection('sessions').doc(uid);
  var snap = await ref.get();
  if (snap.exists) {
    await ref.update({ items: firebase.firestore.FieldValue.arrayUnion(session) });
  } else {
    await ref.set({ items: [session] });
  }
}
async function clearSessions(uid) {
  await db.collection('sessions').doc(uid).set({ items: [] });
}
async function getPrefs(uid) {
  try {
    var snap = await db.collection('prefs').doc(uid).get();
    return snap.exists ? snap.data() : {};
  } catch(e) { return {}; }
}
async function savePrefs(uid, prefs) {
  await db.collection('prefs').doc(uid).set(prefs, { merge: true });
}
async function deletePrefs(uid) {
  try { await db.collection('prefs').doc(uid).delete(); } catch(e) {}
}

// ===== Auth =====
function listenAuthState(onLogin, onLogout) {
  auth.onAuthStateChanged(function(user) {
    if (user) onLogin(user); else onLogout();
  });
}
function authErrMsg(code) {
  var map = {
    'auth/email-already-in-use': '이미 사용 중인 이메일이에요.',
    'auth/invalid-email':        '이메일 형식이 올바르지 않아요.',
    'auth/weak-password':        '비밀번호는 6자 이상이어야 해요.',
    'auth/user-not-found':       '이메일 또는 비밀번호가 올바르지 않아요.',
    'auth/wrong-password':       '이메일 또는 비밀번호가 올바르지 않아요.',
    'auth/invalid-credential':   '이메일 또는 비밀번호가 올바르지 않아요.',
    'auth/too-many-requests':    '잠시 후 다시 시도해주세요.',
    'auth/requires-recent-login':'보안을 위해 다시 로그인해주세요.',
    'auth/network-request-failed':'네트워크 연결을 확인해주세요.',
  };
  return map[code] || '오류가 발생했어요. 다시 시도해주세요.';
}
async function doSignup(email, displayName, password) {
  var cred = await auth.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName: displayName });
  return cred.user;
}
async function doLogin(email, password) {
  var cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}
async function doLogout() { await auth.signOut(); }
async function changeDisplayName(newName) {
  await auth.currentUser.updateProfile({ displayName: newName });
}
async function changePassword(currentPw, newPw) {
  var user = auth.currentUser;
  var cred = firebase.auth.EmailAuthProvider.credential(user.email, currentPw);
  await user.reauthenticateWithCredential(cred);
  await user.updatePassword(newPw);
}
async function deleteAccount(password) {
  var user = auth.currentUser;
  var cred = firebase.auth.EmailAuthProvider.credential(user.email, password);
  await user.reauthenticateWithCredential(cred);
  await Promise.all([clearSessions(user.uid), deletePrefs(user.uid)]);
  await user.delete();
}

// ===== Breathing =====
var breathInterval=null, breathRunning=false, breathPhaseTimer=null;
var breathStartTs=null, breathDurationMs=0, breathTickInterval=null;
var breathPreset = { inhale:4, hold:0, exhale:4, name:'기본 4-4' };

var breathRing      = document.getElementById('breath-ring');
var breathLabel     = document.getElementById('breath-label');
var breathCount     = document.getElementById('breath-count');
var breathPhaseDesc = document.getElementById('breath-phase-desc');
var breathStartBtn  = document.getElementById('breath-start-btn');
var breathTimerDisp = document.getElementById('breath-timer-display');

function setBreathScale(scale) {
  breathRing.style.transform = 'scale(' + scale + ')';
  var glow = Math.round((scale-1)*200);
  breathRing.style.boxShadow = '0 0 '+(40+glow)+'px rgba(123,140,222,'+(0.2+(scale-1)*0.6)+')';
}
function runBreathCycle() {
  var inhale=breathPreset.inhale, hold=breathPreset.hold, exhale=breathPreset.exhale;
  var phases = [{ key:'inhale', label:'들숨', desc:'코로 천천히 들이쉬세요', duration:inhale }];
  if (hold>0) phases.push({ key:'hold', label:'참기', desc:'숨을 참아보세요', duration:hold });
  phases.push({ key:'exhale', label:'날숨', desc:'입으로 천천히 내쉬세요', duration:exhale });
  var phaseIdx=0, countdown=phases[0].duration;
  function startPhase() {
    if (!breathRunning) return;
    var phase = phases[phaseIdx];
    breathLabel.textContent = phase.label;
    breathPhaseDesc.textContent = phase.desc;
    countdown = phase.duration;
    breathCount.textContent = countdown;
    if (phase.key === 'inhale') {
      var steps=phase.duration*20, step=0;
      clearInterval(breathPhaseTimer);
      breathPhaseTimer = setInterval(function() { step++; setBreathScale(1+(step/steps)*0.4); if(step>=steps) clearInterval(breathPhaseTimer); }, 50);
    } else if (phase.key === 'exhale') {
      var steps=phase.duration*20, step=0;
      clearInterval(breathPhaseTimer);
      breathPhaseTimer = setInterval(function() { step++; setBreathScale(1.4-(step/steps)*0.4); if(step>=steps) clearInterval(breathPhaseTimer); }, 50);
    }
  }
  startPhase();
  breathInterval = setInterval(function() {
    if (!breathRunning) { clearInterval(breathInterval); return; }
    countdown--;
    breathCount.textContent = countdown;
    if (countdown<=0) { phaseIdx=(phaseIdx+1)%phases.length; startPhase(); }
  }, 1000);
}
function startBreathing() {
  breathRunning = true;
  breathStartBtn.textContent = '중지';
  breathStartTs = Date.now();
  breathDurationMs = parseInt(document.getElementById('breath-duration').value)*60000;
  runBreathCycle();
  breathTickInterval = setInterval(function() {
    var remaining = breathDurationMs-(Date.now()-breathStartTs);
    if (remaining<=0) { stopBreathing(true); return; }
    var m=Math.floor(remaining/60000), s=Math.floor((remaining%60000)/1000);
    breathTimerDisp.textContent = '남은 시간: '+m+':'+String(s).padStart(2,'0');
  }, 500);
}
function stopBreathing(completed) {
  breathRunning = false;
  clearInterval(breathInterval); clearInterval(breathTickInterval); clearInterval(breathPhaseTimer);
  breathStartBtn.textContent = '시작';
  breathLabel.textContent  = completed ? '완료' : '시작';
  breathCount.textContent  = '';
  breathTimerDisp.textContent = '';
  breathPhaseDesc.textContent = '준비가 되면 시작하세요';
  setBreathScale(1);
  if (completed) {
    var durMin = Math.round(breathDurationMs/60000);
    state.pendingSession = { type:'breathing', minutes:durMin, label:breathPreset.name, moodBefore:state.breathMoodBefore };
    showCompleteModal('호흡 명상', durMin);
  }
}
function isBreathRunning() { return breathRunning; }
function initBreathing() {
  document.querySelectorAll('.preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      breathPreset = { inhale:parseInt(btn.dataset.inhale), hold:parseInt(btn.dataset.hold), exhale:parseInt(btn.dataset.exhale), name:btn.dataset.name };
      if (!breathRunning) {
        breathLabel.textContent = '준비'; breathCount.textContent = '';
        breathPhaseDesc.textContent = '들숨 '+breathPreset.inhale+'초'+(breathPreset.hold?' · 참기 '+breathPreset.hold+'초':'')+' · 날숨 '+breathPreset.exhale+'초';
      }
    });
  });
  breathStartBtn.addEventListener('click', function() { if (breathRunning) stopBreathing(); else startBreathing(); });
}

// ===== Timer =====
var timerRunning=false, timerPaused=false, timerDurationSec=600, timerRemainingSec=600, timerInterval=null;
var timerDigits    = document.getElementById('timer-digits');
var timerTotalDisp = document.getElementById('timer-total-display');
var timerRingEl    = document.getElementById('timer-ring');
var timerStartBtn  = document.getElementById('timer-start-btn');
var RING_CIRC      = 2*Math.PI*95;

function setTimerDisplay(sec) {
  var m=Math.floor(sec/60), s=sec%60;
  timerDigits.textContent = String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  timerRingEl.style.strokeDashoffset = RING_CIRC*(sec/timerDurationSec);
}
function setSelectedDuration(sec) {
  timerDurationSec=sec; timerRemainingSec=sec;
  timerTotalDisp.textContent = '총 '+Math.floor(sec/60)+'분';
  setTimerDisplay(sec);
  timerRingEl.style.strokeDashoffset = RING_CIRC;
}
function startTimer() {
  if (timerDurationSec<=0) return;
  timerRunning=true; timerPaused=false;
  timerStartBtn.textContent='일시정지';
  playSound(soundState.current);
  timerInterval=setInterval(function() { timerRemainingSec--; setTimerDisplay(timerRemainingSec); if(timerRemainingSec<=0) completeTimer(); }, 1000);
}
function pauseTimer() { timerRunning=false; timerPaused=true; clearInterval(timerInterval); timerStartBtn.textContent='계속'; stopSound(); }
function resumeTimer() {
  timerRunning=true; timerPaused=false;
  timerStartBtn.textContent='일시정지';
  playSound(soundState.current);
  timerInterval=setInterval(function() { timerRemainingSec--; setTimerDisplay(timerRemainingSec); if(timerRemainingSec<=0) completeTimer(); }, 1000);
}
function resetTimer() {
  clearInterval(timerInterval); timerRunning=false; timerPaused=false;
  timerStartBtn.textContent='시작'; stopSound();
  timerRemainingSec=timerDurationSec; setTimerDisplay(timerDurationSec);
  timerRingEl.style.strokeDashoffset=RING_CIRC;
}
function completeTimer() {
  clearInterval(timerInterval); timerRunning=false; timerPaused=false;
  timerStartBtn.textContent='시작'; stopSound();
  timerRingEl.style.strokeDashoffset=0;
  if (document.getElementById('end-bell').checked) playBell();
  var durMin=Math.round(timerDurationSec/60);
  state.pendingSession={ type:'timer', minutes:durMin, label:'명상 타이머', moodBefore:state.timerMoodBefore };
  setTimeout(function() { showCompleteModal('명상 타이머', durMin); }, 800);
  timerRemainingSec=timerDurationSec;
  setTimeout(function() { setTimerDisplay(timerDurationSec); }, 2000);
}
function isTimerRunning() { return timerRunning; }
function initTimer() {
  document.querySelectorAll('.dur-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (timerRunning) return;
      document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      var min=parseInt(btn.dataset.min);
      var customRow=document.getElementById('custom-dur-row');
      if (min===0) customRow.classList.remove('hidden');
      else { customRow.classList.add('hidden'); setSelectedDuration(min*60); }
    });
  });
  document.getElementById('custom-min').addEventListener('change', function() {
    var v=Math.max(1,Math.min(180,parseInt(this.value)||1)); this.value=v; setSelectedDuration(v*60);
  });
  timerStartBtn.addEventListener('click', function() {
    if (!timerRunning&&!timerPaused) startTimer(); else if (timerRunning) pauseTimer(); else resumeTimer();
  });
  document.getElementById('timer-reset-btn').addEventListener('click', resetTimer);
  setSelectedDuration(600);
}

// ===== Stats =====
async function renderStats() {
  if (!state.currentUser) return;
  var sessions = await getSessions(state.currentUser.uid);
  var totalMinutes = sessions.reduce(function(a,s){return a+s.minutes;},0);
  var dates = [...new Set(sessions.map(s=>s.date.slice(0,10)))].sort();
  var streak=0;
  if (dates.length>0) {
    var today=new Date().toISOString().slice(0,10), check=today;
    for (var i=dates.length-1;i>=0;i--) {
      if (dates[i]===check) { streak++; var d=new Date(check); d.setDate(d.getDate()-1); check=d.toISOString().slice(0,10); }
      else if (dates[i]<check) break;
    }
  }
  document.getElementById('stat-total-sessions').textContent = sessions.length;
  document.getElementById('stat-total-minutes').textContent  = totalMinutes;
  document.getElementById('stat-streak').textContent         = streak;
  renderCalendar(sessions); renderMoodStats(sessions); renderHistory(sessions);
}
function renderCalendar(sessions) {
  var cal=document.getElementById('calendar'); cal.innerHTML='';
  var sessionDates=new Set(sessions.map(s=>s.date.slice(0,10)));
  var today=new Date(), year=today.getFullYear(), month=today.getMonth();
  var todayStr=today.toISOString().slice(0,10);
  ['일','월','화','수','목','금','토'].forEach(function(d) { var h=document.createElement('div'); h.className='cal-header'; h.textContent=d; cal.appendChild(h); });
  var firstDay=new Date(year,month,1).getDay(), daysInMonth=new Date(year,month+1,0).getDate();
  for (var i=0;i<firstDay;i++) { var e=document.createElement('div'); e.className='cal-day empty'; cal.appendChild(e); }
  for (var d=1;d<=daysInMonth;d++) {
    var dateStr=year+'-'+String(month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var el=document.createElement('div'); el.className='cal-day'; el.textContent=d;
    if (dateStr===todayStr) el.classList.add('today');
    if (sessionDates.has(dateStr)) el.classList.add('has-session');
    cal.appendChild(el);
  }
}
function renderMoodStats(sessions) {
  var el=document.getElementById('mood-stats-section');
  var moodSessions=sessions.filter(s=>s.moodBefore&&s.moodAfter);
  if (moodSessions.length===0) { el.style.display='none'; return; }
  el.style.display='';
  var avg=moodSessions.reduce(function(a,s){return a+(s.moodAfter-s.moodBefore);},0)/moodSessions.length;
  var msg=avg>0.2 ? '명상 후 기분이 평균 +'+avg.toFixed(1)+'점 좋아졌어요 ✨'
    : avg<-0.2 ? '명상 후 기분이 평균 '+avg.toFixed(1)+'점 변했어요'
    : '명상 전후 기분이 비슷하게 유지됐어요 😌';
  document.getElementById('mood-stats-value').textContent=msg;
  document.getElementById('mood-stats-count').textContent=moodSessions.length+'개 세션 분석';
}
function renderHistory(sessions) {
  var list=document.getElementById('history-list'); list.innerHTML='';
  if (sessions.length===0) { list.innerHTML='<div class="no-history">아직 기록이 없어요.<br/>첫 명상을 시작해보세요!</div>'; return; }
  [...sessions].reverse().slice(0,20).forEach(function(s) {
    var date=new Date(s.date);
    var dateStr=(date.getMonth()+1)+'/'+date.getDate()+' '+String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0');
    var moodStr=(s.moodBefore||s.moodAfter) ? ' · '+(s.moodBefore?MOOD_EMOJI[s.moodBefore]:'•')+' → '+(s.moodAfter?MOOD_EMOJI[s.moodAfter]:'•') : '';
    var item=document.createElement('div'); item.className='history-item';
    item.innerHTML='<div class="history-icon">'+(s.type==='breathing'?'🌬️':'⏳')+'</div><div class="history-info"><div class="history-title">'+s.label+'</div><div class="history-meta">'+dateStr+moodStr+'</div></div><div class="history-dur">'+s.minutes+'분</div>';
    list.appendChild(item);
  });
}
function setupStatsHandlers() {
  document.getElementById('clear-data-btn').addEventListener('click', async function() {
    if (!confirm('모든 명상 기록을 삭제할까요?')) return;
    if (state.currentUser) { await clearSessions(state.currentUser.uid); renderStats(); }
  });
}

// ===== Home =====
async function renderHomeStreak() {
  if (!state.currentUser) return;
  var sessions=await getSessions(state.currentUser.uid);
  var todayStr=new Date().toISOString().slice(0,10);
  document.getElementById('hero-circle').classList.toggle('done-today', sessions.some(s=>s.date.slice(0,10)===todayStr));
  document.getElementById('hero-greeting').innerHTML='안녕하세요,<br/>'+state.currentUser.displayName+'님 👋';
  var el=document.getElementById('home-streak');
  if (sessions.length===0) { el.textContent='오늘 첫 명상을 시작해보세요 🌱'; return; }
  var dates=[...new Set(sessions.map(s=>s.date.slice(0,10)))].sort();
  var streak=0, check=todayStr;
  for (var i=dates.length-1;i>=0;i--) {
    if (dates[i]===check) { streak++; var d=new Date(check); d.setDate(d.getDate()-1); check=d.toISOString().slice(0,10); } else break;
  }
  var total=sessions.reduce(function(a,s){return a+s.minutes;},0);
  el.textContent=streak>0 ? '🔥 '+streak+'일 연속 명상 중 · 총 '+total+'분' : '총 '+total+'분 명상 완료';
}

// ===== Settings =====
function renderSettingsPage() {
  if (!state.currentUser) return;
  var u=state.currentUser;
  document.getElementById('settings-avatar').textContent=(u.displayName||u.email).charAt(0).toUpperCase();
  document.getElementById('settings-displayname').textContent=u.displayName||'';
  document.getElementById('settings-username-display').textContent=u.email;
  document.getElementById('settings-name-input').value='';
  document.getElementById('settings-cur-pw').value='';
  document.getElementById('settings-new-pw').value='';
  document.getElementById('settings-new-pw2').value='';
  ['settings-name-feedback','settings-pw-feedback'].forEach(function(id) { var el=document.getElementById(id); el.textContent=''; el.className='settings-feedback'; });
  getPrefs(u.uid).then(function(prefs) { applyTheme(prefs.theme||'dark'); });
}
function setupSettingsHandlers() {
  document.getElementById('settings-name-btn').addEventListener('click', async function() {
    var val=document.getElementById('settings-name-input').value.trim();
    var fb=document.getElementById('settings-name-feedback'); fb.className='settings-feedback';
    if (!val) { fb.textContent='닉네임을 입력해주세요.'; fb.classList.add('error'); return; }
    if (val.length<1||val.length>12) { fb.textContent='닉네임은 1~12자로 입력해주세요.'; fb.classList.add('error'); return; }
    try { await changeDisplayName(val); state.currentUser={...state.currentUser,displayName:val}; document.getElementById('settings-displayname').textContent=val; fb.textContent='닉네임이 변경되었어요.'; fb.classList.add('success'); }
    catch(e) { fb.textContent=authErrMsg(e.code); fb.classList.add('error'); }
  });
  document.getElementById('settings-pw-btn').addEventListener('click', async function() {
    var cur=document.getElementById('settings-cur-pw').value, nw=document.getElementById('settings-new-pw').value, nw2=document.getElementById('settings-new-pw2').value;
    var fb=document.getElementById('settings-pw-feedback'); fb.className='settings-feedback';
    if (!cur||!nw||!nw2) { fb.textContent='모든 항목을 입력해주세요.'; fb.classList.add('error'); return; }
    if (nw.length<6) { fb.textContent='새 비밀번호는 6자 이상이어야 해요.'; fb.classList.add('error'); return; }
    if (nw!==nw2) { fb.textContent='새 비밀번호가 일치하지 않아요.'; fb.classList.add('error'); return; }
    try { await changePassword(cur,nw); document.getElementById('settings-cur-pw').value=''; document.getElementById('settings-new-pw').value=''; document.getElementById('settings-new-pw2').value=''; fb.textContent='비밀번호가 변경되었어요.'; fb.classList.add('success'); }
    catch(e) { fb.textContent=authErrMsg(e.code); fb.classList.add('error'); }
  });
  document.querySelectorAll('.theme-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { var theme=btn.dataset.themeBtn; applyTheme(theme); if(state.currentUser) savePrefs(state.currentUser.uid,{theme:theme}); });
  });
  document.getElementById('settings-logout-btn').addEventListener('click', async function() { if(confirm('로그아웃 하시겠어요?')) await doLogout(); });
  document.getElementById('settings-delete-btn').addEventListener('click', async function() {
    if (!confirm('정말 회원 탈퇴하시겠어요?\n모든 명상 기록이 함께 삭제됩니다.')) return;
    if (!confirm('마지막 확인입니다. 탈퇴하면 되돌릴 수 없어요.')) return;
    var pw=prompt('확인을 위해 현재 비밀번호를 입력해주세요.');
    if (!pw) return;
    try { await deleteAccount(pw); } catch(e) { alert(authErrMsg(e.code)); }
  });
}

// ===== Bubbles =====
var bubbleSpawnTimer=null;
function showBubbles() {
  var canvas=document.getElementById('bubble-canvas');
  canvas.style.top=document.querySelector('.nav').offsetHeight+'px';
  canvas.classList.add('active');
  if (!bubbleSpawnTimer) { spawnBubble(); bubbleSpawnTimer=setInterval(spawnBubble,1700); }
}
function hideBubbles() { document.getElementById('bubble-canvas').classList.remove('active'); clearInterval(bubbleSpawnTimer); bubbleSpawnTimer=null; }
function spawnBubble() {
  var canvas=document.getElementById('bubble-canvas');
  if (!canvas.classList.contains('active')) return;
  var size=22+Math.random()*42, x=4+Math.random()*88, duration=7+Math.random()*9;
  var sway=(Math.random()-0.5)*90, dist=-(window.innerHeight+120);
  var bubble=document.createElement('div'); bubble.className='bubble';
  bubble.style.cssText='width:'+size+'px;height:'+size+'px;left:'+x+'%;bottom:-'+(size+12)+'px;--sway:'+sway+'px;--dist:'+dist+'px;animation-duration:'+duration+'s;';
  bubble.addEventListener('click',function(){popBubble(bubble);});
  bubble.addEventListener('touchstart',function(e){e.preventDefault();popBubble(bubble);},{passive:false});
  bubble.addEventListener('animationend',function(){bubble.remove();});
  canvas.appendChild(bubble);
}
function popBubble(bubble) {
  if (bubble.classList.contains('popping')) return;
  var canvas=document.getElementById('bubble-canvas');
  var br=bubble.getBoundingClientRect(), cr=canvas.getBoundingClientRect();
  var cx=br.left-cr.left+br.width/2, cy=br.top-cr.top+br.height/2;
  var count=4+Math.floor(br.width/9);
  for (var i=0;i<count;i++) {
    var p=document.createElement('div'); p.className='bubble-particle';
    var angle=(i/count)*Math.PI*2+Math.random()*0.6, d=14+Math.random()*br.width*0.55, ps=2+Math.random()*4;
    p.style.cssText='width:'+ps+'px;height:'+ps+'px;left:'+cx+'px;top:'+cy+'px;--dx:'+Math.cos(angle)*d+'px;--dy:'+Math.sin(angle)*d+'px;';
    canvas.appendChild(p); p.addEventListener('animationend',function(){p.remove();});
  }
  bubble.classList.add('popping');
  bubble.addEventListener('animationend',function(){bubble.remove();},{once:true});
}

// ===== App Init =====
function goTo(pageId) {
  switchPage(pageId);
  if (pageId==='home') { renderHomeStreak().catch(function(){}); showBubbles(); } else hideBubbles();
  if (pageId==='stats')    renderStats().catch(function(){});
  if (pageId==='settings') renderSettingsPage();
  if (pageId==='breathing') { state.breathMoodBefore=0; resetMoodPicker('breath-mood-before'); }
  if (pageId==='timer')     { state.timerMoodBefore=0;  resetMoodPicker('timer-mood-before'); }
}
setupNavigation(goTo);

listenAuthState(
  async function(user) {
    state.currentUser=user;
    var prefs=await getPrefs(user.uid);
    applyTheme(prefs.theme||'dark');
    hideAuthScreen();
    renderHomeStreak().catch(function(){});
    showBubbles();
  },
  function() {
    state.currentUser=null;
    if (isBreathRunning()) stopBreathing();
    resetTimer(); hideBubbles(); applyTheme('dark');
    state.breathMoodBefore=0; state.timerMoodBefore=0; state.pendingSession=null; state.pendingMoodAfter=0;
    resetMoodPicker('breath-mood-before'); resetMoodPicker('timer-mood-before');
    document.getElementById('login-email').value='';
    document.getElementById('login-pw').value='';
    document.getElementById('login-error').textContent='';
    switchPage('home'); showAuthScreen();
  }
);

document.querySelectorAll('.auth-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    var target=tab.dataset.auth;
    document.getElementById('auth-login-form').classList.toggle('hidden',target!=='login');
    document.getElementById('auth-signup-form').classList.toggle('hidden',target!=='signup');
    document.getElementById('login-error').textContent='';
    document.getElementById('signup-error').textContent='';
  });
});

async function handleLogin() {
  var email=document.getElementById('login-email').value.trim(), pw=document.getElementById('login-pw').value;
  var errEl=document.getElementById('login-error'); errEl.textContent='';
  if (!email||!pw) { errEl.textContent='이메일과 비밀번호를 입력해주세요.'; return; }
  try { document.getElementById('login-btn').disabled=true; await doLogin(email,pw); }
  catch(e) { errEl.textContent=authErrMsg(e.code); }
  finally { document.getElementById('login-btn').disabled=false; }
}
async function handleSignup() {
  var email=document.getElementById('signup-email').value.trim(), name=document.getElementById('signup-name').value.trim();
  var pw=document.getElementById('signup-pw').value, pw2=document.getElementById('signup-pw2').value;
  var errEl=document.getElementById('signup-error'); errEl.textContent='';
  if (!email||!name||!pw||!pw2) { errEl.textContent='모든 항목을 입력해주세요.'; return; }
  if (name.length<1||name.length>12) { errEl.textContent='닉네임은 1~12자로 입력해주세요.'; return; }
  if (pw.length<6) { errEl.textContent='비밀번호는 6자 이상이어야 해요.'; return; }
  if (pw!==pw2) { errEl.textContent='비밀번호가 일치하지 않아요.'; return; }
  try { document.getElementById('signup-btn').disabled=true; await doSignup(email,name,pw); }
  catch(e) { errEl.textContent=authErrMsg(e.code); }
  finally { document.getElementById('signup-btn').disabled=false; }
}
document.getElementById('login-btn').addEventListener('click', handleLogin);
document.getElementById('signup-btn').addEventListener('click', handleSignup);
['login-email','login-pw'].forEach(function(id) { document.getElementById(id).addEventListener('keydown',function(e){if(e.key==='Enter')handleLogin();}); });
['signup-email','signup-name','signup-pw','signup-pw2'].forEach(function(id) { document.getElementById(id).addEventListener('keydown',function(e){if(e.key==='Enter')handleSignup();}); });

document.querySelectorAll('.sound-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.sound-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); soundState.current=btn.dataset.sound;
    var volRow=document.getElementById('volume-row');
    if (soundState.current==='none') { volRow.classList.add('hidden'); stopSound(); }
    else { volRow.classList.remove('hidden'); soundState.volume=soundState.volumes[soundState.current]; updateVolumeUI(soundState.volume); if(isTimerRunning()) playSound(soundState.current); else stopSound(); }
  });
});
document.getElementById('volume-slider').addEventListener('input', function() {
  soundState.volume=this.value/100; soundState.volumes[soundState.current]=soundState.volume; updateVolumeUI(soundState.volume); setGainVolume(soundState.volume);
});

setupMoodPicker('breath-mood-before', function(v){state.breathMoodBefore=v;});
setupMoodPicker('timer-mood-before',  function(v){state.timerMoodBefore=v;});
setupMoodPicker('modal-mood-after',   function(v){state.pendingMoodAfter=v;});

document.getElementById('modal-close-btn').addEventListener('click', async function() {
  if (state.pendingSession&&state.currentUser) {
    var session={type:state.pendingSession.type,minutes:state.pendingSession.minutes,label:state.pendingSession.label,date:new Date().toISOString()};
    if (state.pendingSession.moodBefore) session.moodBefore=state.pendingSession.moodBefore;
    if (state.pendingMoodAfter) session.moodAfter=state.pendingMoodAfter;
    await saveSession(state.currentUser.uid,session).catch(function(){});
    state.pendingSession=null; state.pendingMoodAfter=0;
  }
  hideCompleteModal();
});

initBreathing(); initTimer(); setupStatsHandlers(); setupSettingsHandlers();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() { navigator.serviceWorker.register('./sw.js').catch(function(){}); });
}
