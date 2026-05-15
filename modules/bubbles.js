let bubbleSpawnTimer = null;

export function showBubbles() {
  const canvas = document.getElementById('bubble-canvas');
  canvas.style.top = document.querySelector('.nav').offsetHeight + 'px';
  canvas.classList.add('active');
  if (!bubbleSpawnTimer) {
    spawnBubble();
    bubbleSpawnTimer = setInterval(spawnBubble, 1700);
  }
}

export function hideBubbles() {
  document.getElementById('bubble-canvas').classList.remove('active');
  clearInterval(bubbleSpawnTimer);
  bubbleSpawnTimer = null;
}

function spawnBubble() {
  const canvas = document.getElementById('bubble-canvas');
  if (!canvas.classList.contains('active')) return;
  const size     = 22 + Math.random() * 42;
  const x        = 4  + Math.random() * 88;
  const duration = 7  + Math.random() * 9;
  const sway     = (Math.random() - 0.5) * 90;
  const dist     = -(window.innerHeight + 120);
  const bubble   = document.createElement('div');
  bubble.className = 'bubble';
  bubble.style.cssText =
    `width:${size}px;height:${size}px;left:${x}%;bottom:-${size+12}px;` +
    `--sway:${sway}px;--dist:${dist}px;animation-duration:${duration}s;`;
  bubble.addEventListener('click', () => popBubble(bubble));
  bubble.addEventListener('touchstart', e => { e.preventDefault(); popBubble(bubble); }, { passive:false });
  bubble.addEventListener('animationend', () => bubble.remove());
  canvas.appendChild(bubble);
}

function popBubble(bubble) {
  if (bubble.classList.contains('popping')) return;
  const canvas = document.getElementById('bubble-canvas');
  const br = bubble.getBoundingClientRect();
  const cr = canvas.getBoundingClientRect();
  const cx = br.left - cr.left + br.width  / 2;
  const cy = br.top  - cr.top  + br.height / 2;
  const count = 4 + Math.floor(br.width / 9);
  for (let i=0; i<count; i++) {
    const p     = document.createElement('div');
    p.className = 'bubble-particle';
    const angle = (i/count)*Math.PI*2 + Math.random()*0.6;
    const d     = 14 + Math.random()*br.width*0.55;
    const ps    = 2  + Math.random()*4;
    p.style.cssText =
      `width:${ps}px;height:${ps}px;left:${cx}px;top:${cy}px;` +
      `--dx:${Math.cos(angle)*d}px;--dy:${Math.sin(angle)*d}px;`;
    canvas.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
  bubble.classList.add('popping');
  bubble.addEventListener('animationend', () => bubble.remove(), { once:true });
}
