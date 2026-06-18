// ── ELEMENTS ─────────────────────────────────────────────
const splash      = document.getElementById('splash');
const splashCv    = document.getElementById('splash-canvas');
const splashCtx   = splashCv.getContext('2d');
const splashBtn   = document.getElementById('splashBtn');
const wrap        = document.getElementById('wrap');
const backCv      = document.getElementById('back');
const partCv      = document.getElementById('particles');
const bCtx        = backCv.getContext('2d');
const pCtx        = partCv.getContext('2d');
const mosaicEl    = document.getElementById('mosaic');
const hint        = document.getElementById('hint');
const btnWrap     = document.getElementById('btn-wrap');
const mainBtn     = document.getElementById('mainBtn');

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
    ctx.lineTo(s * 0.85,  s * 0.65);
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

// ── SPLASH FLOATING SHAPES ────────────────────────────────
const splashShapes = [];

const SPLASH_DEFS = [
  { rx: 0.06, ry: 0.10, s: 55,  type: 'circle',    color: '#F4C024' },
  { rx: 0.92, ry: 0.08, s: 48,  type: 'triangle',  color: '#E5382E' },
  { rx: 0.88, ry: 0.80, s: 60,  type: 'square',    color: '#3FBDD4' },
  { rx: 0.07, ry: 0.78, s: 50,  type: 'elongated', color: '#4BAF6E' },
  { rx: 0.50, ry: 0.04, s: 34,  type: 'semicircle',color: '#F9D040' },
  { rx: 0.50, ry: 0.93, s: 38,  type: 'triangle',  color: '#E5382E' },
  { rx: 0.14, ry: 0.50, s: 30,  type: 'square',    color: '#3FBDD4' },
  { rx: 0.86, ry: 0.48, s: 34,  type: 'circle',    color: '#4BAF6E' },
  { rx: 0.22, ry: 0.18, s: 24,  type: 'elongated', color: '#F4A724' },
  { rx: 0.78, ry: 0.20, s: 26,  type: 'semicircle',color: '#E5382E' },
  { rx: 0.73, ry: 0.76, s: 22,  type: 'triangle',  color: '#4BAF6E' },
  { rx: 0.27, ry: 0.74, s: 28,  type: 'circle',    color: '#3FBDD4' },
];

function initSplashShapes() {
  splashShapes.length = 0;
  const sw = splashCv.width;
  const sh = splashCv.height;
  SPLASH_DEFS.forEach(d => {
    splashShapes.push({
      bx: d.rx * sw, by: d.ry * sh,
      x: d.rx * sw,  y: d.ry * sh,
      s: d.s, type: d.type, color: d.color,
      rot:      rnd(0, Math.PI * 2),
      rotV:     rnd(-0.018, 0.018),
      floatAmp: rnd(10, 24),
      floatSpd: rnd(0.6, 1.3),
      floatOff: rnd(0, Math.PI * 2),
      alpha: 0,
      born:  performance.now(),
      fadeIn: rnd(500, 1000),
    });
  });
}

function drawSplashShapes(now) {
  splashCtx.clearRect(0, 0, splashCv.width, splashCv.height);
  splashShapes.forEach(s => {
    const age = now - s.born;
    s.alpha = Math.min(0.5, (age / s.fadeIn) * 0.5);
    s.x = s.bx + Math.sin(now * 0.001 * s.floatSpd + s.floatOff) * s.floatAmp;
    s.y = s.by + Math.cos(now * 0.0008 * s.floatSpd + s.floatOff) * s.floatAmp * 0.7;
    s.rot += s.rotV;
    splashCtx.globalAlpha = s.alpha;
    drawShapeOn(splashCtx, s.type, s.color, s.x, s.y, s.s, s.rot);
  });
  splashCtx.globalAlpha = 1;
}

// ── BACK LAYER ────────────────────────────────────────────
function drawBack() {
  bCtx.fillStyle = '#F4EEE3';
  bCtx.fillRect(0, 0, W, H);
  bCtx.fillStyle = 'rgba(0,0,0,0.04)';
  for (let x = 0; x < W; x += 28) {
    for (let y = 0; y < H; y += 28) {
      bCtx.beginPath();
      bCtx.arc(x, y, 1.2, 0, Math.PI * 2);
      bCtx.fill();
    }
  }
}

// ── MOSAIC ────────────────────────────────────────────────
const COLS = 4;
const ROWS = 3;
let tileData = [];
let removed  = 0;
let phase    = 'splash';

function buildTileCanvas(tw, th) {
  const bg = rndI(PAL);
  const tc = document.createElement('canvas');
  tc.width  = Math.ceil(tw);
  tc.height = Math.ceil(th);
  const tx  = tc.getContext('2d');
  tx.fillStyle = bg;
  tx.fillRect(0, 0, tc.width, tc.height);
  const type    = rndI(TYPES);
  const shColor = rndI(PAL.filter(c => c !== bg));
  const sz      = Math.min(tw, th) * rnd(0.42, 0.72);
  const ox      = rnd(sz * 0.2, tc.width  - sz * 0.2);
  const oy      = rnd(sz * 0.2, tc.height - sz * 0.2);
  drawShapeOn(tx, type, shColor, ox, oy, sz, rnd(0, Math.PI * 2));
  tx.strokeStyle = 'rgba(247,240,230,0.28)';
  tx.lineWidth   = 3;
  tx.strokeRect(1.5, 1.5, tc.width - 3, tc.height - 3);
  return tc;
}

function buildMosaicAnimated() {
  mosaicEl.innerHTML = '';
  tileData = [];
  removed  = 0;
  phase    = 'mosaic';
  hint.style.opacity = '0';
  btnWrap.classList.remove('show');

  const tw    = W / COLS;
  const th    = H / ROWS;
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
        transform: scale(0.88);
        transition: opacity 0.45s ease, transform 0.45s cubic-bezier(.34,1.56,.64,1);
      `;
      div.appendChild(tc);
      makeDraggable(div, tileData.length);
      mosaicEl.appendChild(div);
      tileData.push({ div, col: c, row: r, tw, th, gone: false });

      setTimeout(() => {
        div.style.opacity   = '1';
        div.style.transform = 'scale(1)';
      }, idx * 65);
    }
  }

  setTimeout(() => {
    hint.style.transition = 'opacity 0.6s';
    hint.style.opacity    = '1';
  }, total * 65 + 320);
}

function makeDraggable(div, idx) {
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
    ox = ex - sx; oy = ey - sy;
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

  div.addEventListener('mousedown',  e => { e.preventDefault(); down(e.clientX, e.clientY); });
  window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
  window.addEventListener('mouseup',   up);
  div.addEventListener('touchstart', e => { e.preventDefault(); down(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  div.addEventListener('touchmove',  e => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  div.addEventListener('touchend',   up);
}

function flingTile(div, idx, ox, oy) {
  const dist = Math.sqrt(ox * ox + oy * oy);
  const nx = ox / dist, ny = oy / dist;
  div.style.transition    = 'transform 0.55s cubic-bezier(.2,0,.6,1), opacity 0.5s';
  div.style.transform     = `translate(${nx * 1600}px, ${ny * 1600}px) rotate(${ox * 0.2}deg)`;
  div.style.opacity       = '0';
  div.style.pointerEvents = 'none';
  tileData[idx].gone = true;
  removed++;
  checkReveal();
}

function checkReveal() {
  if (removed / (COLS * ROWS) >= 0.3 && phase === 'mosaic') {
    phase = 'revealing';
    hint.style.opacity = '0';
    btnWrap.classList.add('show');

    setTimeout(() => {
      tileData.forEach(td => {
        if (!td.gone) {
          const a = rnd(0, Math.PI * 2);
          td.div.style.transition    = 'transform 0.6s cubic-bezier(.2,0,.5,1), opacity 0.55s';
          td.div.style.transform     = `translate(${Math.cos(a) * 1600}px, ${Math.sin(a) * 1600}px) rotate(${rnd(-40, 40)}deg)`;
          td.div.style.opacity       = '0';
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
let mouse     = { x: 0, y: 0 };
let trailT    = 0;
let splashMode = true;

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
    this.permanent   = opts.permanent   || false;
    this.assembling  = false;
    this.assembled   = false;
    this.targetX     = null;
    this.targetY     = null;
    this.targetRot   = 0;
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
      const dx = this.x - W / 2, dy = this.y - H / 2;
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
    const s = this.size / 2, r = s * 0.2;
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
  const dt = now - last; last = now;

  // splash shapes
  if (splashMode) drawSplashShapes(now);

  // particle canvas
  pCtx.clearRect(0, 0, W, H);
  trailT += dt;
  if (trailT > 80 && phase === 'revealed') {
    trailT = 0;
    if (Math.random() < 0.38) {
      const p = new Piece(mouse.x, mouse.y, rndI(TYPES), rnd(-0.5, 0.5), rnd(-0.6, 0.6));
      p.size = rnd(5, 20);
      p.life = rnd(400, 900);
      pieces.push(p);
    }
  }
  pieces = pieces.filter(p => !p.dead);
  pieces.forEach(p => { p.update(now); p.draw(pCtx); });
  requestAnimationFrame(loop);
}

// ── FORMA WORD ────────────────────────────────────────────
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
  const word   = 'FORMA';
  const fs     = Math.min(W / 5.5, 86);
  const totalW = word.length * fs * 0.72;
  const sx     = (W - totalW) / 2;
  const sy     = (H - fs * 1.1) / 2;
  const typeForLetter  = { F: 'square', O: 'circle', R: 'triangle', M: 'elongated', A: 'semicircle' };
  const colorForLetter = { F: '#3FBDD4', O: '#F4C024', R: '#E5382E', M: '#4BAF6E', A: '#F9D040' };

  word.split('').forEach((ch, li) => {
    const pts = getLetterPoints(ch, fs, 32);
    const lx  = sx + li * fs * 0.72;
    const ly  = sy;
    pts.forEach((pt, pi) => {
      const tx = lx + pt.x * (fs * 0.72 / (fs * 1.2));
      const ty = ly + pt.y * (fs * 1.1 / (fs * 1.4));
      const p  = new Piece(rnd(0, W), rnd(0, H), typeForLetter[ch], 0, 0, {
        color:        colorForLetter[ch],
        size:         rnd(6, 16),
        life:         99999,
        permanent:    true,
        assembleDur:  rnd(500, 900),
        assembleDelay: li * 90 + pi * 15,
      });
      p.targetX    = tx;
      p.targetY    = ty;
      p.targetRot  = rnd(-0.25, 0.25);
      p.assembling = true;
      p.assembleStart = performance.now();
      pieces.push(p);
    });
  });
}

function burst(cx, cy, n = 18) {
  for (let i = 0; i < n; i++) {
    const a  = rnd(0, Math.PI * 2);
    const sp = rnd(2, 9);
    pieces.push(new Piece(cx, cy, rndI(TYPES), Math.cos(a) * sp, Math.sin(a) * sp - 3));
  }
}

// ── EVENTS ───────────────────────────────────────────────
splashBtn.addEventListener('click', () => {
  splash.classList.add('hidden');
  wrap.classList.add('visible');
  splashMode = false;
  initExperience();
});

wrap.addEventListener('mousemove', e => {
  const r = wrap.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

wrap.addEventListener('click', e => {
  if (phase !== 'revealed') return;
  const r = wrap.getBoundingClientRect();
  burst(e.clientX - r.left, e.clientY - r.top, 14);
});

mainBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (phase === 'revealed') {
    spawnForma();
  } else {
    tileData.forEach(td => {
      if (!td.gone) {
        const a = rnd(0, Math.PI * 2);
        td.div.style.transition    = 'transform 0.5s, opacity 0.45s';
        td.div.style.transform     = `translate(${Math.cos(a) * 1400}px, ${Math.sin(a) * 1400}px) rotate(${rnd(-40, 40)}deg)`;
        td.div.style.opacity       = '0';
        td.div.style.pointerEvents = 'none';
      }
    });
    phase = 'revealed';
    hint.style.opacity = '0';
    btnWrap.classList.add('show');
    setTimeout(spawnForma, 450);
  }
});

// ── INIT ─────────────────────────────────────────────────
function initExperience() {
  drawBack();
  buildMosaicAnimated();
}

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  splashCv.width  = W; splashCv.height  = H;
  backCv.width    = W; backCv.height    = H;
  partCv.width    = W; partCv.height    = H;
  initSplashShapes();
  if (!splashMode) drawBack();
}

resize();
window.addEventListener('resize', resize);
startAnim();