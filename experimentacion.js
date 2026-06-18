// ── ELEMENTS ─────────────────────────────────────────────
const wrap        = document.getElementById('wrap');
const backCv       = document.getElementById('back');
const paintCv       = document.getElementById('paint');
const partCv       = document.getElementById('particles');
const bCtx         = backCv.getContext('2d');
const paintCtx      = paintCv.getContext('2d');
const pCtx         = partCv.getContext('2d');
const mosaicEl     = document.getElementById('mosaic');
const hint         = document.getElementById('hint');
const btnWrap      = document.getElementById('btn-wrap');
const mainBtn      = document.getElementById('mainBtn');
const saveBtn      = document.getElementById('saveBtn');
const soundBtn     = document.getElementById('soundBtn');
const comboLabel   = document.getElementById('combo-label');

let W, H;

// ── PALETTE ───────────────────────────────────────────────
const PAL = ['#F4A724', '#3FBDD4', '#E5382E', '#4BAF6E', '#F7F0E6'];
const SC  = {
  triangle:   '#E5382E',
  square:     '#3FBDD4',
  elongated:  '#4BAF6E',
  circle:     '#F4C024',
  semicircle: '#F9D040',
};
const TYPES = ['triangle', 'square', 'elongated', 'circle', 'semicircle'];

// ── HELPERS ───────────────────────────────────────────────
function rnd(a, b) { return a + Math.random() * (b - a); }
function rndI(a)   { return a[Math.floor(Math.random() * a.length)]; }

function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ── ROUNDED RECT ──────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── SHAPE DRAW ────────────────────────────────────────────
function drawShapeOn(ctx, type, color, cx, cy, s, rot) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  const r = Math.max(3, s * 0.18);
  ctx.beginPath();
  if (type === 'circle') {
    ctx.arc(0, 0, s, 0, Math.PI * 2);
  } else if (type === 'semicircle') {
    ctx.arc(0, 0, s, Math.PI, 0);
    ctx.closePath();
  } else if (type === 'triangle') {
    ctx.moveTo(0, -s * 0.9);
    ctx.lineTo(s * 0.85, s * 0.65);
    ctx.lineTo(-s * 0.85, s * 0.65);
    ctx.closePath();
  } else if (type === 'square') {
    rrect(ctx, -s, -s, s * 2, s * 2, r);
  } else if (type === 'elongated') {
    rrect(ctx, -s * 0.34, -s, s * 0.68, s * 2, s * 0.34);
  }
  ctx.fill();
  ctx.restore();
}

// ── BACK LAYER ────────────────────────────────────────────
function drawBack() {
  bCtx.fillStyle = '#F4EEE3';
  bCtx.fillRect(0, 0, W, H);
  // subtle dot grid
  bCtx.fillStyle = 'rgba(0,0,0,0.04)';
  for (let x = 0; x < W; x += 28) {
    for (let y = 0; y < H; y += 28) {
      bCtx.beginPath();
      bCtx.arc(x, y, 1.2, 0, Math.PI * 2);
      bCtx.fill();
    }
  }
}

// ── PAINT LAYER ───────────────────────────────────────────
// Unlike the animated particles, marks stamped here never fade or move —
// this is what makes a saved image actually mean something.
function paintStroke(x, y) {
  paintCtx.save();
  paintCtx.globalAlpha = 0.5;
  drawShapeOn(paintCtx, rndI(TYPES), rndI(PAL), x, y, rnd(7, 17), rnd(0, Math.PI * 2));
  paintCtx.restore();
}

// ── SOUND ─────────────────────────────────────────────────
// Lightweight synth FX via Web Audio — no external files or libraries.
let audioCtx = null;
let soundOn  = true;

function ensureAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioCtx = null;
    }
  } else if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, dur, type, peak, when = 0) {
  if (!soundOn || !audioCtx) return;
  const t0   = audioCtx.currentTime + when;
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function playWhoosh() {
  if (!soundOn || !audioCtx) return;
  const t0      = audioCtx.currentTime;
  const bufSize = audioCtx.sampleRate * 0.32;
  const buf     = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data    = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);

  const src  = audioCtx.createBufferSource();
  src.buffer = buf;

  const filt = audioCtx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.setValueAtTime(800, t0);
  filt.frequency.exponentialRampToValueAtTime(2400, t0 + 0.28);
  filt.Q.value = 0.7;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.2, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);

  src.connect(filt);
  filt.connect(gain);
  gain.connect(audioCtx.destination);
  src.start(t0);
}

function playPop() {
  playTone(rnd(520, 900), 0.12, 'triangle', 0.12);
}

function playChime() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) => playTone(f, 0.6, 'sine', 0.08, i * 0.08));
}

soundBtn.addEventListener('click', e => {
  e.stopPropagation();
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? '🔊' : '🔇';
  soundBtn.classList.toggle('muted', !soundOn);
});

// ── MOSAIC ────────────────────────────────────────────────
const COLS = 4;
const ROWS = 3;
let tileData      = [];
let removed       = 0;
let phase         = 'mosaic'; // 'mosaic' | 'revealing' | 'revealed'
let comboCount    = 0;
let lastFlingTime = 0;

function buildTileCanvas(tw, th) {
  const bg = rndI(PAL);
  const tc = document.createElement('canvas');
  tc.width  = Math.ceil(tw);
  tc.height = Math.ceil(th);
  const tx  = tc.getContext('2d');

  // background block
  tx.fillStyle = bg;
  tx.fillRect(0, 0, tc.width, tc.height);

  // big shape on top — bleeds to edges
  const type    = rndI(TYPES);
  const shColor = rndI(PAL.filter(c => c !== bg));
  const sz      = Math.min(tw, th) * rnd(0.42, 0.72);
  const ox      = rnd(sz * 0.2, tc.width  - sz * 0.2);
  const oy      = rnd(sz * 0.2, tc.height - sz * 0.2);
  drawShapeOn(tx, type, shColor, ox, oy, sz, rnd(0, Math.PI * 2));

  // subtle inner border
  tx.strokeStyle = 'rgba(247,240,230,0.28)';
  tx.lineWidth   = 3;
  tx.strokeRect(1.5, 1.5, tc.width - 3, tc.height - 3);

  return tc;
}

function createMosaic() {
  mosaicEl.innerHTML = '';
  tileData      = [];
  removed       = 0;
  phase         = 'mosaic';
  comboCount    = 0;
  lastFlingTime = 0;
  hint.style.opacity = '1';
  btnWrap.classList.remove('show');

  const tw = W / COLS;
  const th = H / ROWS;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tc  = buildTileCanvas(tw, th);
      const div = document.createElement('div');
      div.className = 'tile';
      div.style.cssText = `
        left:   ${c * tw}px;
        top:    ${r * th}px;
        width:  ${Math.ceil(tw)}px;
        height: ${Math.ceil(th)}px;
      `;
      div.appendChild(tc);
      makeDraggable(div, tileData.length, c, r, tw, th);
      mosaicEl.appendChild(div);
      tileData.push({ div, col: c, row: r, tw, th, gone: false });
    }
  }
}

function makeDraggable(div, idx, col, row, tw, th) {
  let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;

  function down(ex, ey) {
    if (phase !== 'mosaic') return;
    dragging = true;
    sx = ex; sy = ey; ox = 0; oy = 0;
    div.classList.add('lifted');
    div.style.transition = 'none';
    div.style.zIndex = '200';
  }

  function move(ex, ey) {
    if (!dragging) return;
    ox = ex - sx;
    oy = ey - sy;
    div.style.transform = `translate(${ox}px, ${oy}px) rotate(${ox * 0.05}deg)`;
  }

  function up() {
    if (!dragging) return;
    dragging = false;
    div.classList.remove('lifted');
    const dist = Math.sqrt(ox * ox + oy * oy);
    if (dist > 70) {
      flingTile(div, idx, ox, oy);
    } else {
      div.style.transition = 'transform 0.35s cubic-bezier(.34,1.56,.64,1)';
      div.style.transform  = 'translate(0,0) rotate(0deg)';
      div.style.zIndex     = '';
    }
  }

  // Mouse
  div.addEventListener('mousedown', e => { e.preventDefault(); down(e.clientX, e.clientY); });
  window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
  window.addEventListener('mouseup', up);

  // Touch
  div.addEventListener('touchstart', e => {
    e.preventDefault();
    down(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  div.addEventListener('touchmove', e => {
    e.preventDefault();
    move(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  div.addEventListener('touchend', up);
}

function showCombo(x, y, count) {
  comboLabel.textContent = `combo x${count}`;
  comboLabel.style.left  = x + 'px';
  comboLabel.style.top   = y + 'px';
  comboLabel.classList.remove('show');
  void comboLabel.offsetWidth; // restart the CSS animation
  comboLabel.classList.add('show');
}

function flingTile(div, idx, ox, oy) {
  const dist = Math.sqrt(ox * ox + oy * oy);
  const nx   = ox / dist;
  const ny   = oy / dist;
  div.style.transition = 'transform 0.55s cubic-bezier(.2,0,.6,1), opacity 0.5s';
  div.style.transform  = `translate(${nx * 1600}px, ${ny * 1600}px) rotate(${ox * 0.2}deg)`;
  div.style.opacity    = '0';
  div.style.pointerEvents = 'none';
  tileData[idx].gone = true;
  removed++;

  playWhoosh();

  // combo: flinging tiles in quick succession earns bigger bursts
  const now = performance.now();
  comboCount = (now - lastFlingTime < 750) ? comboCount + 1 : 1;
  lastFlingTime = now;

  const r = div.getBoundingClientRect();
  const wr = wrap.getBoundingClientRect();
  const cx = r.left - wr.left + r.width / 2;
  const cy = r.top  - wr.top  + r.height / 2;

  burst(cx, cy, 10 + Math.min(comboCount, 5) * 4);
  if (comboCount >= 2) showCombo(cx, cy, comboCount);

  checkReveal();
}

function checkReveal() {
  if (removed / (COLS * ROWS) >= 0.3 && phase === 'mosaic') {
    phase = 'revealing';
    hint.style.opacity = '0';
    btnWrap.classList.add('show');

    // fling remaining tiles automatically
    setTimeout(() => {
      playWhoosh();
      tileData.forEach(td => {
        if (!td.gone) {
          const a = rnd(0, Math.PI * 2);
          td.div.style.transition = 'transform 0.6s cubic-bezier(.2,0,.5,1), opacity 0.55s';
          td.div.style.transform  = `translate(${Math.cos(a) * 1600}px, ${Math.sin(a) * 1600}px) rotate(${rnd(-40, 40)}deg)`;
          td.div.style.opacity    = '0';
          td.div.style.pointerEvents = 'none';
        }
      });
      phase = 'revealed';
      setTimeout(spawnForma, 400);
    }, 500);
  }
}

// ── PARTICLES ────────────────────────────────────────────
let pieces    = [];
let animGoing = false;
let last      = 0;
let mouse     = { x: 0, y: 0, vx: 0, vy: 0, speed: 0 };
let trailT    = 0;

class Piece {
  constructor(x, y, type, vx, vy, opts = {}) {
    this.type  = type || rndI(TYPES);
    this.color = opts.color || SC[this.type];
    this.x = x; this.y = y;
    this.vx = (vx !== undefined) ? vx : rnd(-4, 4);
    this.vy = (vy !== undefined) ? vy : rnd(-5, -1);
    this.rot  = rnd(0, Math.PI * 2);
    this.rotV = rnd(-0.07, 0.07);
    this.size  = opts.size  || rnd(14, 58);
    this.alpha = 1;
    this.born  = performance.now();
    this.life  = opts.life  || rnd(1400, 3000);
    this.dead  = false;
    this.mode  = opts.mode  || 'free';
    this.permanent = opts.permanent || false;

    // assembly
    this.assembling    = false;
    this.assembled     = false;
    this.targetX       = null;
    this.targetY       = null;
    this.targetRot     = 0;
    this.assembleStart = 0;
    this.assembleDur   = opts.assembleDur   || rnd(600, 950);
    this.assembleDelay = opts.assembleDelay || 0;
    this.startX   = x;
    this.startY   = y;
    this.startRot = this.rot;
  }

  update(now) {
    if (this.assembling) {
      const el = now - this.assembleStart - this.assembleDelay;
      if (el < 0) return;
      const t  = Math.min(1, el / this.assembleDur);
      const et = easeOutBack(t);
      this.x   = this.startX + (this.targetX - this.startX) * et;
      this.y   = this.startY + (this.targetY - this.startY) * et;
      this.rot = this.startRot + (this.targetRot - this.startRot) * et;
      this.alpha = 0.15 + 0.85 * t;
      if (t >= 1) { this.assembling = false; this.assembled = true; }
      return;
    }
    if (this.assembled && this.permanent) return;
    if (this.mode === 'vortex') {
      const dx = this.x - W / 2;
      const dy = this.y - H / 2;
      const d  = Math.sqrt(dx * dx + dy * dy) || 1;
      this.vx += (-dy / d) * 0.8 - dx * 0.012;
      this.vy += ( dx / d) * 0.8 - dy * 0.012;
    } else {
      this.vy += 0.12;
    }
    this.vx *= 0.98; this.vy *= 0.98;
    this.x  += this.vx;
    this.y  += this.vy;
    this.rot += this.rotV;
    const age = (now - this.born) / this.life;
    this.alpha = age < 0.1 ? age / 0.1 : age > 0.7 ? 1 - (age - 0.7) / 0.3 : 1;
    if (age >= 1) this.dead = true;
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.fillStyle = this.color;
    const s = this.size / 2;
    const r = s * 0.2;
    ctx.beginPath();
    if (this.type === 'circle') {
      ctx.arc(0, 0, s, 0, Math.PI * 2);
    } else if (this.type === 'semicircle') {
      ctx.arc(0, 0, s, Math.PI, 0);
      ctx.closePath();
    } else if (this.type === 'triangle') {
      ctx.moveTo(0, -s * 0.9);
      ctx.lineTo( s * 0.85,  s * 0.65);
      ctx.lineTo(-s * 0.85,  s * 0.65);
      ctx.closePath();
    } else if (this.type === 'square') {
      rrect(ctx, -s, -s, s * 2, s * 2, r);
    } else if (this.type === 'elongated') {
      rrect(ctx, -s * 0.34, -s, s * 0.68, s * 2, s * 0.34);
    }
    ctx.fill();
    ctx.restore();
  }
}

function startAnim() {
  if (animGoing) return;
  animGoing = true;
  requestAnimationFrame(loop);
}

function loop(now) {
  const dt = now - last;
  last = now;
  pCtx.clearRect(0, 0, W, H);

  if (phase === 'revealed') {
    // mouse trail — density and reach scale with how fast you move
    trailT += dt;
    const speedFactor = Math.min(mouse.speed / 6, 4);
    if (trailT > 50) {
      trailT = 0;
      const chance = 0.22 + speedFactor * 0.18;
      if (Math.random() < chance) {
        const n = 1 + Math.floor(speedFactor);
        for (let i = 0; i < n; i++) {
          const jx = mouse.x + rnd(-8, 8);
          const jy = mouse.y + rnd(-8, 8);
          paintStroke(jx, jy);
          const p = new Piece(
            jx, jy,
            rndI(TYPES),
            mouse.vx * 0.15 + rnd(-0.5, 0.5),
            mouse.vy * 0.15 + rnd(-0.6, 0.6)
          );
          p.size = rnd(5, 20);
          p.life = rnd(400, 900);
          pieces.push(p);
        }
      }
    }

    // wind — moving the cursor near loose pieces nudges them along
    if (mouse.speed > 1) {
      pieces.forEach(p => {
        if (p.permanent || p.assembling) return;
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 110 && d > 0.01) {
          const f = (1 - d / 110) * 0.6;
          p.vx += mouse.vx * f * 0.06;
          p.vy += mouse.vy * f * 0.06;
        }
      });
    }
  }

  // decay mouse velocity so it doesn't linger once the cursor stops
  mouse.vx *= 0.85;
  mouse.vy *= 0.85;
  mouse.speed *= 0.85;

  pieces = pieces.filter(p => !p.dead);
  pieces.forEach(p => { p.update(now); p.draw(pCtx); });
  requestAnimationFrame(loop);
}

// ── FORMA WORD ────────────────────────────────────────────
let formaChimeTimer = null;

function getLetterPoints(letter, fontSize, count) {
  const oc  = document.createElement('canvas');
  oc.width  = fontSize * 1.2;
  oc.height = fontSize * 1.4;
  const ox  = oc.getContext('2d');
  ox.fillStyle    = '#000';
  ox.font         = `900 ${fontSize}px sans-serif`;
  ox.textBaseline = 'top';
  ox.fillText(letter, fontSize * 0.05, fontSize * 0.08);
  const id  = ox.getImageData(0, 0, oc.width, oc.height);
  const pts = [];
  for (let y = 0; y < oc.height; y += 3) {
    for (let x = 0; x < oc.width; x += 3) {
      if (id.data[(y * oc.width + x) * 4 + 3] > 128) pts.push({ x, y });
    }
  }
  const res  = [];
  const step = Math.max(1, Math.floor(pts.length / count));
  for (let i = 0; i < pts.length && res.length < count; i += step) res.push(pts[i]);
  return res;
}

function spawnForma() {
  pieces = pieces.filter(p => !p.permanent);

  const word  = 'FORMA';
  const fs    = Math.min(W / 5.5, 86);
  const totalW = word.length * fs * 0.72;
  const sx    = (W - totalW) / 2;
  const sy    = (H - fs * 1.1) / 2;

  const typeForLetter  = { F: 'square', O: 'circle', R: 'triangle', M: 'elongated', A: 'semicircle' };
  const colorForLetter = { F: '#3FBDD4', O: '#F4C024', R: '#E5382E', M: '#4BAF6E', A: '#F9D040' };

  let maxFinish = 0;

  word.split('').forEach((ch, li) => {
    const pts = getLetterPoints(ch, fs, 32);
    const lx  = sx + li * fs * 0.72;
    const ly  = sy;

    pts.forEach((pt, pi) => {
      const tx = lx + pt.x * (fs * 0.72 / (fs * 1.2));
      const ty = ly + pt.y * (fs * 1.1 / (fs * 1.4));

      const dur   = rnd(500, 900);
      const delay = li * 90 + pi * 15;

      const p = new Piece(
        rnd(0, W), rnd(0, H),
        typeForLetter[ch], 0, 0,
        {
          color:        colorForLetter[ch],
          size:         rnd(6, 16),
          life:         99999,
          permanent:    true,
          assembleDur:  dur,
          assembleDelay: delay,
        }
      );
      p.targetX   = tx;
      p.targetY   = ty;
      p.targetRot = rnd(-0.25, 0.25);
      p.assembling    = true;
      p.assembleStart = performance.now();
      pieces.push(p);

      if (delay + dur > maxFinish) maxFinish = delay + dur;
    });
  });

  clearTimeout(formaChimeTimer);
  formaChimeTimer = setTimeout(playChime, maxFinish + 60);
}

function burst(cx, cy, n = 18) {
  for (let i = 0; i < n; i++) {
    const a  = rnd(0, Math.PI * 2);
    const sp = rnd(2, 9);
    pieces.push(new Piece(cx, cy, rndI(TYPES), Math.cos(a) * sp, Math.sin(a) * sp - 3));
  }
  paintStroke(cx, cy); // leave a lasting trace where the burst happened
  playPop();
}

// ── EXPORT ───────────────────────────────────────────────
function exportComposition() {
  const out  = document.createElement('canvas');
  out.width  = W;
  out.height = H;
  const octx = out.getContext('2d');
  octx.fillStyle = '#F4EEE3';
  octx.fillRect(0, 0, W, H);
  octx.drawImage(backCv, 0, 0);
  octx.drawImage(paintCv, 0, 0);
  octx.drawImage(partCv, 0, 0);
  out.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url;
    a.download = 'forma-composicion.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

saveBtn.addEventListener('click', e => {
  e.stopPropagation();
  exportComposition();
});

const clearBtn = document.getElementById('clearBtn');
clearBtn.addEventListener('click', e => {
  e.stopPropagation();
  paintCtx.clearRect(0, 0, W, H);
});

// ── EVENTS ───────────────────────────────────────────────
wrap.addEventListener('mousemove', e => {
  const r  = wrap.getBoundingClientRect();
  const nx = e.clientX - r.left;
  const ny = e.clientY - r.top;
  mouse.vx = nx - mouse.x;
  mouse.vy = ny - mouse.y;
  mouse.speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
  mouse.x = nx;
  mouse.y = ny;
});

wrap.addEventListener('click', e => {
  if (phase !== 'revealed') return;
  const r = wrap.getBoundingClientRect();
  burst(e.clientX - r.left, e.clientY - r.top, 14);
});

mainBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (phase === 'revealed') {
    // regenerate FORMA
    spawnForma();
  } else {
    // force reveal — fling all tiles
    playWhoosh();
    tileData.forEach(td => {
      if (!td.gone) {
        const a = rnd(0, Math.PI * 2);
        td.div.style.transition = 'transform 0.5s, opacity 0.45s';
        td.div.style.transform  = `translate(${Math.cos(a) * 1400}px, ${Math.sin(a) * 1400}px) rotate(${rnd(-40, 40)}deg)`;
        td.div.style.opacity    = '0';
        td.div.style.pointerEvents = 'none';
      }
    });
    phase = 'revealed';
    hint.style.opacity = '0';
    btnWrap.classList.add('show');
    setTimeout(spawnForma, 450);
  }
});

// ── SPLASH ───────────────────────────────────────────────
const splash    = document.getElementById('splash');
const splashBtn = document.getElementById('splashBtn');

// Spawn decorative floating shapes behind splash text
(function spawnSplashShapes() {
  const splashEl = document.getElementById('splash');
  const shapeData = [
    { type: 'circle',    color: '#F4C024', size: 120, left: '8%',  top: '10%', delay: 0.3 },
    { type: 'triangle',  color: '#E5382E', size: 90,  left: '82%', top: '6%',  delay: 0.5 },
    { type: 'square',    color: '#3FBDD4', size: 80,  left: '88%', top: '72%', delay: 0.4 },
    { type: 'elongated', color: '#4BAF6E', size: 70,  left: '5%',  top: '75%', delay: 0.6 },
    { type: 'semicircle',color: '#F9D040', size: 100, left: '72%', top: '80%', delay: 0.7 },
    { type: 'triangle',  color: '#4BAF6E', size: 55,  left: '15%', top: '40%', delay: 0.9 },
    { type: 'circle',    color: '#E5382E', size: 50,  left: '78%', top: '38%', delay: 1.0 },
  ];

  shapeData.forEach(d => {
    const cv = document.createElement('canvas');
    cv.width  = d.size * 2;
    cv.height = d.size * 2;
    cv.className = 'splash-shape';
    cv.style.cssText = `
      left: ${d.left}; top: ${d.top};
      width: ${d.size * 2}px; height: ${d.size * 2}px;
      animation-delay: ${d.delay}s;
      transform: rotate(${rnd(0, 360)}deg);
    `;
    const c = cv.getContext('2d');
    drawShapeOn(c, d.type, d.color, d.size, d.size, d.size * 0.72, 0);
    splashEl.appendChild(cv);
  });
})();

// Click → fade splash, build mosaic tile by tile
splashBtn.addEventListener('click', () => {
  // unlock audio on this first real user gesture
  ensureAudio();

  // 1. fade out splash
  splash.classList.add('hidden');

  // 2. show wrap
  wrap.classList.add('visible');

  // 3. build mosaic tiles one by one with staggered entrance
  buildMosaicAnimated();
});

function buildMosaicAnimated() {
  mosaicEl.innerHTML = '';
  tileData      = [];
  removed       = 0;
  phase         = 'mosaic';
  comboCount    = 0;
  lastFlingTime = 0;
  hint.style.opacity = '0';
  btnWrap.classList.remove('show');

  const tw = W / COLS;
  const th = H / ROWS;
  const total = COLS * ROWS;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      const tc  = buildTileCanvas(tw, th);
      const div = document.createElement('div');
      div.className = 'tile';
      div.style.cssText = `
        left:   ${c * tw}px;
        top:    ${r * th}px;
        width:  ${Math.ceil(tw)}px;
        height: ${Math.ceil(th)}px;
        opacity: 0;
        transform: scale(0.85);
        transition: opacity 0.45s ease, transform 0.45s cubic-bezier(.34,1.56,.64,1);
      `;
      div.appendChild(tc);
      makeDraggable(div, tileData.length, c, r, tw, th);
      mosaicEl.appendChild(div);
      tileData.push({ div, col: c, row: r, tw, th, gone: false });

      // staggered entrance
      const delay = idx * 60;
      setTimeout(() => {
        div.style.opacity   = '1';
        div.style.transform = 'scale(1)';
      }, delay);
    }
  }

  // show hint after all tiles appeared
  setTimeout(() => {
    hint.style.transition = 'opacity 0.6s';
    hint.style.opacity    = '1';
  }, total * 60 + 300);
}

// ── INIT / RESIZE ─────────────────────────────────────────
// Resize only rescales the canvases and redraws the background —
// it never rebuilds the mosaic, so an in-progress reveal isn't lost.
function initBack() {
  W = wrap.clientWidth;
  H = wrap.clientHeight;
  backCv.width  = W; backCv.height  = H;
  paintCv.width = W; paintCv.height = H;
  partCv.width  = W; partCv.height  = H;
  pieces = [];
  drawBack();
}

window.addEventListener('resize', () => {
  W = wrap.clientWidth;
  H = wrap.clientHeight;
  backCv.width  = W; backCv.height  = H;
  paintCv.width = W; paintCv.height = H;
  partCv.width  = W; partCv.height  = H;
  drawBack();
});

initBack();
startAnim();