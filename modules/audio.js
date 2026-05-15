export const soundState = {
  current: 'none',
  volume: 0.8,
  volumes: { white:0.8, rain:0.8, forest:0.8, ocean:0.8, campfire:0.8, pink:0.8, bowl:0.8 },
};

const BASE_GAIN = { white:0.15, rain:0.25, forest:0.3, ocean:0.4, campfire:0.35, pink:0.28, bowl:1.0 };

let audioCtx = null;
let noiseNode = null;
let gainNode  = null;
let bowlTimer = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

export function updateVolumeUI(vol) {
  const pct = Math.round(vol * 100);
  document.getElementById('volume-slider').value = pct;
  document.getElementById('volume-pct').textContent = `${pct}%`;
  const icons = ['🔇','🔈','🔉','🔊'];
  document.getElementById('volume-icon').textContent =
    pct === 0 ? icons[0] : pct <= 33 ? icons[1] : pct <= 66 ? icons[2] : icons[3];
}

export function stopSound() {
  if (bowlTimer) { clearInterval(bowlTimer); bowlTimer = null; }
  if (noiseNode) { try { noiseNode.stop(); } catch(e){} noiseNode = null; }
  if (gainNode)  { gainNode.disconnect(); gainNode = null; }
}

export function playSound(type) {
  stopSound();
  if (type === 'none') return;
  const ctx = getAudioCtx();
  gainNode = ctx.createGain();
  gainNode.gain.value = 0.15;
  gainNode.connect(ctx.destination);

  if (type === 'bowl') {
    gainNode.gain.value = soundState.volume;
    function strikeBowl() {
      if (!gainNode) return;
      const now = ctx.currentTime;
      [[432,0.4,10],[864,0.12,8],[1296,0.05,6]].forEach(([freq,amp,dur]) => {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.connect(g); g.connect(gainNode);
        osc.frequency.value = freq; osc.type = 'sine';
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(amp, now + 0.5);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.start(now); osc.stop(now + dur);
      });
    }
    strikeBowl();
    bowlTimer = setInterval(strikeBowl, 14000);
    return;
  }

  const bufSize = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === 'rain') {
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.8;
      if (Math.random() < 0.001) data[i] *= 3;
    }
  } else if (type === 'forest') {
    for (let i = 0; i < bufSize; i++)
      data[i] = Math.sin(i * 0.02 + Math.random() * 0.5) * 0.3 * (Math.random() * 0.4 + 0.6);
  } else if (type === 'ocean') {
    for (let i = 0; i < bufSize; i++) {
      const wave = Math.sin(i / ctx.sampleRate * 0.3 * Math.PI * 2);
      data[i] = wave * (Math.random() * 0.3 + 0.1);
    }
  } else if (type === 'campfire') {
    let crackle = 0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      crackle = 0.97 * crackle + w * 0.03;
      const pop = Math.random() < 0.0008 ? (Math.random() * 2 - 1) * 1.2 : 0;
      data[i] = crackle * 0.6 + pop;
    }
  } else if (type === 'pink') {
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) / 7;
      b6 = w * 0.115926;
    }
  }

  noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buf;
  noiseNode.loop = true;

  const filter = ctx.createBiquadFilter();
  if      (type === 'rain')     { filter.type='highpass'; filter.frequency.value=800;  gainNode.gain.value=0.25; }
  else if (type === 'forest')   { filter.type='bandpass'; filter.frequency.value=600;  filter.Q.value=0.5; gainNode.gain.value=0.3; }
  else if (type === 'ocean')    { filter.type='lowpass';  filter.frequency.value=400;  gainNode.gain.value=0.4; }
  else if (type === 'campfire') { filter.type='lowpass';  filter.frequency.value=700;  gainNode.gain.value=0.35; }
  else if (type === 'pink')     { filter.type='lowpass';  filter.frequency.value=2000; gainNode.gain.value=0.28; }
  else                          { filter.type='lowpass';  filter.frequency.value=3000; }

  gainNode.gain.value *= soundState.volume;
  noiseNode.connect(filter);
  filter.connect(gainNode);
  noiseNode.start();
}

export function playBell() {
  const ctx = getAudioCtx();
  [[528,0.6,3],[1056,0.2,2]].forEach(([freq,amp,dur]) => {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = 'sine';
    g.gain.setValueAtTime(amp, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
  });
}

export function setGainVolume(vol) {
  if (gainNode && soundState.current !== 'bowl')
    gainNode.gain.value = (BASE_GAIN[soundState.current] ?? 0.2) * vol;
  else if (gainNode && soundState.current === 'bowl')
    gainNode.gain.value = vol;
}
