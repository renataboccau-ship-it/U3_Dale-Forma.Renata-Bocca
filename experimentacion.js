// ════════════════════════════════════════════════════════════════
// 1. ELEMENTOS DEL DOM
// ════════════════════════════════════════════════════════════════
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
const secondaryBtn = document.getElementById('secondaryBtn');
const progressDots = document.getElementById('progress-dots');
const roundBadge   = document.getElementById('round-badge');
const freeplayHint  = document.getElementById('freeplay-hint');
const farewell    = document.getElementById('farewell');
const farewellBtn  = document.getElementById('farewellBtn');
const retryBtn     = document.getElementById('retryBtn');

let W, H;

// ════════════════════════════════════════════════════════════════
// 2. PALETA DE COLORES
// ════════════════════════════════════════════════════════════════
const PALETTE_SETS = [
  ['#F5A02D', '#87CEE9', '#D12839', '#73BC76', '#F4EEE3'],
  ['#F5A02D', '#87CEE9', '#D12839', '#73BC76', '#F4EEE3'],
  ['#F5A02D', '#87CEE9', '#D12839', '#73BC76', '#F4EEE3'],
];
let paletteIdx = 0;
let PAL = PALETTE_SETS[0];


const SC_SETS = [
  { triangle: '#D12839', square: '#87CEE9', elongated: '#73BC76', circle: '#F5A02D', semicircle: '#F5A02D' },
  { triangle: '#D12839', square: '#87CEE9', elongated: '#73BC76', circle: '#F5A02D', semicircle: '#F5A02D' },
  { triangle: '#D12839', square: '#87CEE9', elongated: '#73BC76', circle: '#F5A02D', semicircle: '#F5A02D' },
];
let SC = SC_SETS[0];

const TYPES = ['triangle', 'square', 'elongated', 'circle', 'semicircle'];

function rotatePalette() {
  paletteIdx = (paletteIdx + 1) % PALETTE_SETS.length;
  PAL = PALETTE_SETS[paletteIdx];
  SC  = SC_SETS[paletteIdx];
}

// ════════════════════════════════════════════════════════════════
// 3. HELPERS / UTILIDADES MATEMÁTICAS
// ════════════════════════════════════════════════════════════════
function rnd(a, b) { return a + Math.random() * (b - a); }
function rndI(a)   { return a[Math.floor(Math.random() * a.length)]; }
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ════════════════════════════════════════════════════════════════
// 4. DIBUJO DE FORMAS (rect redondeado / polígono redondeado / shape genérica)
// ════════════════════════════════════════════════════════════════

// ── 4.1 RECTÁNGULO REDONDEADO ──────────────────────────────
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

// ── 4.2 POLÍGONO REDONDEADO (esquinas redondeadas en ángulos arbitrarios) ──
// A diferencia de rrect (pensada solo para ángulos de 90°), esta función
// redondea los vértices de un polígono cualquiera: en cada vértice, recorta
// hacia los dos lados adyacentes una distancia `r` (usando el vector
// normalizado hacia cada lado, no un offset fijo en x/y) y conecta con un
// arcTo. Se usa para el triángulo, cuyos ángulos no son rectos.
function rpoly(ctx, points, r) {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const cur  = points[i];
    const next = points[(i + 1) % n];

    const toPrev = { x: prev.x - cur.x, y: prev.y - cur.y };
    const toNext = { x: next.x - cur.x, y: next.y - cur.y };
    const lenPrev = Math.hypot(toPrev.x, toPrev.y);
    const lenNext = Math.hypot(toNext.x, toNext.y);
    // el radio no puede ser mayor que la mitad del lado más corto adyacente,
    // o el recorte se pasaría del punto medio y deformaría la figura.
    const rr = Math.min(r, lenPrev / 2, lenNext / 2);

    const p1 = { x: cur.x + (toPrev.x / lenPrev) * rr, y: cur.y + (toPrev.y / lenPrev) * rr };
    const p2 = { x: cur.x + (toNext.x / lenNext) * rr, y: cur.y + (toNext.y / lenNext) * rr };

    if (i === 0) ctx.moveTo(p1.x, p1.y);
    else ctx.lineTo(p1.x, p1.y);
    ctx.arcTo(cur.x, cur.y, p2.x, p2.y, rr);
  }
  ctx.closePath();
}

// ── 4.3 DIBUJO DE FIGURA GENÉRICA SOBRE UN CONTEXTO ────────
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
    // mismos vértices que antes, pero con esquinas redondeadas (rpoly)
    // en vez de vértices rectos.
    rpoly(ctx, [
      { x: 0,        y: -s * 0.9  },
      { x: s * 0.85, y:  s * 0.65 },
      { x: -s * 0.85, y: s * 0.65 },
    ], r);
  } else if (type === 'square') {
    rrect(ctx, -s, -s, s * 2, s * 2, r);
  } else if (type === 'elongated') {
    rrect(ctx, -s * 0.34, -s, s * 0.68, s * 2, s * 0.34);
  }
  ctx.fill();
  ctx.restore();
}

// ════════════════════════════════════════════════════════════════
// 5. FONDO (BACK LAYER)
// ════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
// 6. SPLASH — FORMAS FLOTANTES DE BIENVENIDA
// ════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
// 7. SISTEMA DE PARTÍCULAS (clase Piece + loop de animación)
// ════════════════════════════════════════════════════════════════
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
    this.dispersing  = false;
    this.disperseStart = 0;
    this.disperseDur   = opts.disperseDur || rnd(550, 900);
    this.disperseDelay = opts.disperseDelay || 0;
    this.disperseFromX = 0;
    this.disperseFromY = 0;
    this.disperseToX   = 0;
    this.disperseToY   = 0;
    this.disperseToRot = 0;
    this.anchorX = null;
    this.anchorY = null;
    this.repelVX = 0;
    this.repelVY = 0;
  }

  startDisperse(toX, toY, toRot, delay) {
    this.dispersing     = true;
    this.assembling      = false;
    this.assembled        = false;
    this.disperseFromX  = this.x;
    this.disperseFromY  = this.y;
    this.disperseToX    = toX;
    this.disperseToY    = toY;
    this.disperseToRot  = toRot;
    this.disperseDelay  = delay;
    this.disperseStart  = performance.now();
  }

  update(now) {
    if (this.dispersing) {
      const el = now - this.disperseStart - this.disperseDelay;
      if (el < 0) return;
      const t  = Math.min(1, el / this.disperseDur);
      const et = easeInOutCubic(t);
      this.x   = this.disperseFromX + (this.disperseToX - this.disperseFromX) * et;
      this.y   = this.disperseFromY + (this.disperseToY - this.disperseFromY) * et;
      this.rot = this.startRot + (this.disperseToRot - this.startRot) * et;
      this.alpha = 1 - t;
      if (t >= 1) { this.dispersing = false; this.dead = true; }
      return;
    }
    if (this.assembling) {
      const el = now - this.assembleStart - this.assembleDelay;
      if (el < 0) return;
      const t  = Math.min(1, el / this.assembleDur);
      const et = easeOutBack(t);
      this.x   = this.startX + (this.targetX - this.startX) * et;
      this.y   = this.startY + (this.targetY - this.startY) * et;
      this.rot = this.startRot + (this.targetRot - this.startRot) * et;
      this.alpha = 0.15 + 0.85 * t;
      if (t >= 1) {
        this.assembling = false;
        this.assembled = true;
        this.anchorX = this.targetX;
        this.anchorY = this.targetY;
      }
      return;
    }
    if (this.assembled && this.permanent) {
      const t = (now * 0.0015) + this.startRot;
      let bx = this.anchorX + Math.sin(t) * 1.4;
      let by = this.anchorY + Math.cos(t * 0.8) * 1.4;

      if (freeplayActive) {
        const dx = bx - mouse.x, dy = by - mouse.y;
        const d  = Math.sqrt(dx * dx + dy * dy) || 1;
        const radius = 130;
        if (d < radius) {
          const force = (1 - d / radius) * 14;
          this.repelVX += (dx / d) * force * 0.18;
          this.repelVY += (dy / d) * force * 0.18;
        }
      }
      const rdx = bx - this.anchorX, rdy = by - this.anchorY;
      this.repelVX += -rdx * 0.012 - this.repelVX * 0.06;
      this.repelVY += -rdy * 0.012 - this.repelVY * 0.06;
      this.repelVX *= 0.9;
      this.repelVY *= 0.9;

      this.x = bx + this.repelVX;
      this.y = by + this.repelVY;
      return;
    }
    if (this.mode === 'vortex') {
      const dx = this.x - W / 2, dy = this.y - H / 2;
      const d  = Math.sqrt(dx * dx + dy * dy) || 1;
      this.vx += (-dy / d) * 0.8 - dx * 0.012;
      this.vy += ( dx / d) * 0.8 - dy * 0.012;
    } else if (this.mode === 'float') {
      // sin gravedad: deriva suave tipo "flota en el aire", no cae.
      const t = now * 0.0012 + this.born * 0.0001;
      this.vx += Math.cos(t) * 0.006;
      this.vy += Math.sin(t * 0.8) * 0.006;
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
      // mismos vértices que antes, con esquinas redondeadas (rpoly).
      rpoly(ctx, [
        { x: 0,        y: -s * 0.9  },
        { x: s * 0.85, y:  s * 0.65 },
        { x: -s * 0.85, y: s * 0.65 },
      ], r);
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

  if (splashMode) drawSplashShapes(now);

  pCtx.clearRect(0, 0, W, H);
  trailT += dt;
  if (trailT > 80 && (phase === 'revealed' || phase === 'freeplay' || phase === 'garden')) {
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

// ════════════════════════════════════════════════════════════════
// 8. FASE 1 — MOSAICO
// ════════════════════════════════════════════════════════════════
const COLS = 5;
const ROWS = 3;
const REVEAL_THRESHOLD = 0.55;
let tileData = [];
let removed  = 0;
let phase    = 'splash';
// se activa al entrar al jardín de calma (solo ocurre una vez por vuelta
// completa, tras pasar por tangram + mandala). Permite distinguir la
// primera aparición de FORMA (tras el mosaico) de la segunda — la grande,
// que cierra el ciclo — para saber cuándo mostrar la despedida final.
let cycleCompleted = false;

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

function buildProgressDots(total) {
  progressDots.innerHTML = '';
  const segments = 10;
  for (let i = 0; i < segments; i++) {
    const d = document.createElement('div');
    d.className = 'dot';
    progressDots.appendChild(d);
  }
}

function updateProgressDots() {
  const segments = progressDots.children.length;
  const pct = removed / (COLS * ROWS);
  const filledCount = Math.round(pct * segments);
  Array.from(progressDots.children).forEach((d, i) => {
    d.classList.toggle('filled', i < filledCount);
  });
}

function buildMosaicAnimated() {
  mosaicEl.innerHTML = '';
  mosaicEl.style.opacity = '1';
  tileData = [];
  removed  = 0;
  phase    = 'mosaic';
  cycleCompleted = false;
  hint.style.opacity = '0';
  hint.classList.remove('bottom');
  btnWrap.classList.remove('show');
  secondaryBtn.classList.remove('show');
  roundBadge.classList.remove('show');
  mainBtn.textContent = 'generar composición';

  const tw    = W / COLS;
  const th    = H / ROWS;
  const total = COLS * ROWS;

  buildProgressDots(total);

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
        // señal sutil de "esto se mueve": bamboleo leve con delay random
        // por pieza. Se anima el CANVAS interno (tc), no el div.tile —
        // el div recibe transform inline desde JS durante el drag (scale,
        // translate, etc.), y un transform inline siempre pisa al de una
        // animación CSS por @keyframes. Animando el hijo evitamos ese
        // conflicto sin tocar la lógica de arrastre.
        tc.style.setProperty('--tile-delay', `${rnd(0, 2.4).toFixed(2)}s`);
        tc.classList.add('invite');
      }, idx * 40);
    }
  }

  setTimeout(() => {
    if (phase !== 'mosaic') return;
    progressDots.classList.add('show');
    hint.querySelector('p').textContent = 'arrastra y quita las piezas para revelar';
    hint.style.transition = 'opacity 0.6s';
    hint.style.opacity    = '1';
  }, total * 40 + 120);
}

function makeDraggable(div, idx) {
  let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
  const tileCanvas = div.querySelector('canvas'); // para la animación 'invite', separada del div que recibe transform inline

  function down(ex, ey) {
    if (phase !== 'mosaic') return;
    dragging = true;
    sx = ex; sy = ey; ox = 0; oy = 0;
    div.classList.add('lifted');
    tileCanvas.classList.remove('invite'); // se agarró: ya no necesita invitar a moverse
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
    } else if (dist > 14) {
      div.style.transition = 'transform 0.35s cubic-bezier(.34,1.56,.64,1)';
      div.style.transform  = 'translate(0,0) rotate(0deg)';
      div.style.zIndex     = '';
      div.classList.add('nudge');
      setTimeout(() => {
        div.classList.remove('nudge');
        tileCanvas.classList.add('invite'); // vuelve a invitar a moverse, ya en reposo
      }, 520);
    } else {
      div.style.transition = 'transform 0.35s cubic-bezier(.34,1.56,.64,1)';
      div.style.transform  = 'translate(0,0) rotate(0deg)';
      div.style.zIndex     = '';
      tileCanvas.classList.add('invite');
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
  updateProgressDots();

  if (removed / (COLS * ROWS) > 0.25 && removed / (COLS * ROWS) < 0.5) {
    hint.querySelector('p').textContent = 'sigue así...';
  }

  checkReveal();
}

function checkReveal() {
  if (removed / (COLS * ROWS) >= REVEAL_THRESHOLD && phase === 'mosaic') {
    phase = 'revealing';
    hint.style.opacity = '0';
    progressDots.classList.remove('show');
    // Antes mostrábamos btnWrap acá, pero esta transición ya es 100%
    // automática (no hay botón que clickear en este punto) — mostrarlo
    // por un instante y luego ocultarlo de nuevo se sentía como un salto
    // extra sin sentido. Se quita.

    // Preludio: las piezas restantes se atenúan suavemente ANTES de volar,
    // como anticipo de que algo va a pasar, en vez de pasar de "quietas"
    // a "volando" sin transición intermedia.
    const remaining = tileData.filter(td => !td.gone);
    remaining.forEach(td => {
      td.div.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      td.div.style.opacity = '0.55';
      td.div.style.transform = 'scale(0.97)';
    });

    setTimeout(() => {
      remaining.forEach((td, i) => {
        const a = rnd(0, Math.PI * 2);
        // escalonado en vez de simultáneo: cada pieza vuela con un pequeño
        // delay, así el final del mosaico se ve como una ola, no un corte.
        setTimeout(() => {
          td.div.style.transition    = 'transform 0.6s cubic-bezier(.2,0,.5,1), opacity 0.55s';
          td.div.style.transform     = `translate(${Math.cos(a) * 1600}px, ${Math.sin(a) * 1600}px) rotate(${rnd(-40, 40)}deg)`;
          td.div.style.opacity       = '0';
          td.div.style.pointerEvents = 'none';
        }, i * 35);
      });
      phase = 'revealed';
      // más respiro antes de que arranque FORMA: el último vuelo escalonado
      // dura remaining.length*35 + 600ms; sumamos una pausa contemplativa
      // adicional para que no se sienta como un corte directo al armado.
      const lastFlightEnd = remaining.length * 35 + 600;
      setTimeout(spawnForma, lastFlightEnd + 500);
    }, 750);
  }
}

// ════════════════════════════════════════════════════════════════
// 9. FASE 2 — PALABRA "FORMA"
// ════════════════════════════════════════════════════════════════
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
  let minX = Infinity, maxX = -Infinity;
  for (let y = 0; y < oc.height; y += 3) {
    for (let x = 0; x < oc.width; x += 3) {
      if (id.data[(y * oc.width + x) * 4 + 3] > 128) {
        pts.push({ x, y });
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  const res  = [];
  const step = Math.max(1, Math.floor(pts.length / count));
  for (let i = 0; i < pts.length && res.length < count; i += step) res.push(pts[i]);
  // ancho real del glyph dentro de su canvas de muestreo (en las mismas
  // unidades de pt.x); si la letra no dibujó ningún píxel (no debería
  // pasar con FORMA), caemos a un ancho por defecto razonable.
  const glyphWidth = (maxX > minX) ? (maxX - minX) : fontSize * 0.6;
  const glyphMinX  = (maxX > minX) ? minX : 0;
  return { points: res, glyphWidth, glyphMinX };
}

let freeplayActive = false;
let freeplayTimer  = null;

const WORD = 'FORMA';
const typeForLetter  = { F: 'square', O: 'circle', R: 'triangle', M: 'elongated', A: 'semicircle' };

function spawnForma() {
  const word  = WORD;
  pieces = pieces.filter(p => !p.permanent);
  // tamaño grande: el límite principal es el ALTO disponible (dejando margen
  // arriba/abajo), no un tope fijo chico — así la palabra se ve grande pero
  // nunca se corta verticalmente. También se acota por ancho para que las
  // 5 letras entren sin desbordar horizontalmente.
  const vMargin = H * 0.16;
  const fsByHeight = (H - vMargin * 2) / 1.1;
  const fsByWidth  = W / (word.length * 0.72 + 0.4);
  const fs = Math.min(fsByHeight, fsByWidth);

  // FIX: antes cada letra siempre se rellenaba con 32 piezas, sin importar
  // el tamaño de fuente. Al agrandar la palabra esas 32 piezas quedaban muy
  // separadas entre sí y el trazo dejaba de leerse como letra. Ahora la
  // cantidad de piezas escala con el ÁREA de la letra (fs², con un techo
  // para no generar miles de piezas) y el tamaño de cada pieza escala con
  // sqrt(fs) — así se solapan lo suficiente para cubrir el trazo sin huecos,
  // sin volverse gigantes ni perder la textura de "mosaico".
  const REF_FS    = 86; // tamaño de referencia con el que se calibró "32 piezas"
  const scaleArea = (fs / REF_FS) * (fs / REF_FS);
  const pointCount = Math.round(Math.min(400, Math.max(32, 32 * scaleArea)));
  const sizeScale = Math.sqrt(fs / REF_FS);
  const pieceMin = 6  * sizeScale;
  const pieceMax = 16 * sizeScale;

  // ── Paso 1: generar los puntos de cada letra (igual que antes) y medir
  // su ancho REAL de glyph (glyphWidth) en vez de asumir 0.72*fs fijo para
  // todas. Esto es lo único nuevo: antes F y M avanzaban el mismo espacio
  // pese a tener anchos muy distintos, y eso corría la palabra hacia un
  // lado. Generamos los puntos UNA sola vez por letra (no dos como antes),
  // y los reutilizamos tanto para medir el ancho como para posicionar.
  //
  // IMPORTANTE: glyphWidth viene en las unidades del canvas de muestreo
  // (tamaño fontSize*1.2), pero las coordenadas de pantalla usan el factor
  // de escala (fs*0.72)/(fs*1.2) = 0.6, igual que pt.x más abajo. Hay que
  // aplicar ESE MISMO factor acá al calcular totalW/avance, o el ancho
  // total con el que centramos (sx) queda en una escala distinta a la que
  // realmente se dibuja — eso fue lo que corrió y amontonó la palabra.
  const SCALE_X = (fs * 0.72) / (fs * 1.2); // = 0.6, factor fijo independiente de fs
  const letterPts = word.split('').map(ch => getLetterPoints(ch, fs, pointCount));

  const LETTER_GAP = fs * 0.10;
  const totalW = letterPts.reduce((sum, l) => sum + l.glyphWidth * SCALE_X, 0) + LETTER_GAP * (word.length - 1);
  const sx = (W - totalW) / 2;
  const sy = (H - fs * 1.1) / 2;

  // Revelación gradual: cada letra arranca su armado claramente después
  // de la anterior (de izquierda a derecha), y dentro de cada letra las
  // piezas también se escalonan un poco — así se lee como una ola lenta,
  // no como un golpe simultáneo.
  const LETTER_STAGGER = 220; // ms entre que arranca una letra y la siguiente
  const PIECE_STAGGER  = 6;   // ms entre piezas dentro de la misma letra

  let lx = sx;
  word.split('').forEach((ch, li) => {
    const type  = typeForLetter[ch];
    const color = SC[type];
    const { points: pts, glyphMinX } = letterPts[li];
    const ly  = sy;
    const curLx = lx;
    pts.forEach((pt, pi) => {
      // mismo mapeo que la versión original (coordenadas del canvas de
      // muestreo -> coordenadas en pantalla), pero el origen horizontal
      // de la letra (curLx) ahora viene de un avance real por glyph, y
      // restamos glyphMinX para que el primer píxel negro de la letra
      // caiga exactamente en curLx (sin hueco extra a la izquierda).
      const tx = curLx + (pt.x - glyphMinX) * SCALE_X;
      const ty = ly + pt.y * (fs * 1.1 / (fs * 1.4));
      const p  = new Piece(rnd(0, W), rnd(0, H), type, 0, 0, {
        color:        color,
        size:         rnd(pieceMin, pieceMax),
        life:         99999,
        permanent:    true,
        assembleDur:  rnd(500, 850),
        assembleDelay: li * LETTER_STAGGER + pi * PIECE_STAGGER,
      });
      p.targetX    = tx;
      p.targetY    = ty;
      p.targetRot  = rnd(-0.25, 0.25);
      p.assembling = true;
      p.assembleStart = performance.now();
      pieces.push(p);
    });
    lx += letterPts[li].glyphWidth * SCALE_X + LETTER_GAP;
  });

  formaComplete = false;
  const maxDelay = Math.max(...pieces.filter(p => p.permanent).map(p => p.assembleDelay + p.assembleDur));
  setTimeout(() => {
    formaComplete = true;
    startFreeplay();
  }, maxDelay + 150);
}

function startFreeplay() {
  if (phase !== 'revealed') return;
  phase = 'freeplay';
  freeplayActive = true;
  hint.style.opacity = '0';
  freeplayHint.classList.add('show');
  btnWrap.classList.remove('show');
  secondaryBtn.classList.remove('show');

  clearTimeout(freeplayTimer);
  // La transición a tangram es automática tras este tiempo en freeplay.
  // Antes eran 2.2s — muy poco para disfrutar la interacción con FORMA.
  freeplayTimer = setTimeout(() => {
    if (phase === 'freeplay') startTangramPhase();
  }, 6000);
}

function endFreeplay() {
  freeplayActive = false;
  freeplayHint.classList.remove('show');
  secondaryBtn.classList.remove('show');
  clearTimeout(freeplayTimer);
}

// ════════════════════════════════════════════════════════════════
// 10. FASE 3 — TANGRAM (relleno libre de figuras)
// ════════════════════════════════════════════════════════════════
const tangramEl = document.createElement('div');
tangramEl.id = 'tangram';
tangramEl.style.cssText = 'position:absolute; inset:0; z-index:11; pointer-events:none;';
wrap.appendChild(tangramEl);

let outlines      = [];
let dragPieces     = [];
let dragPiecesLeft = 0;
let tangramRound   = 1;
const TANGRAM_ROUNDS = 1;

function startTangramPhase() {
  if (phase !== 'revealed' && phase !== 'freeplay') return;
  if (resetting) return;
  resetting = true;
  endFreeplay();

  // FIX: antes las piezas permanentes de "FORMA" se borraban del array de
  // golpe (pieces = pieces.filter(...)) en el mismo instante en que
  // arrancaba el tangram — de un frame al otro FORMA desaparecía y las
  // figuras del tangram ya estaban apareciendo, lo cual se sentía como un
  // corte brusco. Ahora dispersamos FORMA con la misma animación de salida
  // que usan las demás transiciones (startDisperse) y recién cuando esa
  // dispersión termina arrancamos a construir el tangram.
  hint.style.opacity = '0';
  freeplayHint.classList.remove('show');
  btnWrap.classList.remove('show');

  const permanentPieces = pieces.filter(p => p.permanent);
  permanentPieces.forEach((p, i) => {
    const a    = rnd(0, Math.PI * 2);
    const dist = rnd(Math.max(W, H) * 0.5, Math.max(W, H) * 0.9);
    p.disperseDur = rnd(500, 850);
    p.startDisperse(
      p.x + Math.cos(a) * dist,
      p.y + Math.sin(a) * dist,
      rnd(-3, 3),
      Math.floor(i / 6) * 10
    );
  });
  playWhoosh(0.13);

  const maxWait = permanentPieces.length
    ? 850 + Math.floor(permanentPieces.length / 6) * 10 + 200
    : 0;

  setTimeout(() => {
    pieces = pieces.filter(p => !p.permanent);
    resetting = false;
    phase = 'tangram';
    tangramRound = 1;
    hint.classList.add('bottom');
    btnWrap.classList.add('show');
    secondaryBtn.classList.remove('show');
    mainBtn.textContent = 'saltar';
    if (TANGRAM_ROUNDS > 1) updateRoundBadge();
    buildTangramRound();
  }, maxWait);
}

function updateRoundBadge() {
  roundBadge.innerHTML = '';
  roundBadge.classList.add('show');
  const label = document.createElement('span');
  label.textContent = `ronda ${tangramRound} de ${TANGRAM_ROUNDS}`;
  roundBadge.appendChild(label);
  for (let i = 0; i < TANGRAM_ROUNDS; i++) {
    const pip = document.createElement('span');
    pip.className = 'pip';
    if (i < tangramRound) pip.style.background = '#D12839';
    roundBadge.appendChild(pip);
  }
}

function buildTangramRound() {
  tangramEl.innerHTML = '';
  outlines = [];
  dragPieces = [];

  // ── ZONA SUPERIOR: outlines en GRILLA REGULAR (filas y columnas alineadas) ──
  const cols = tangramRound === 1 ? 4 : 5;
  const rows = tangramRound === 1 ? 2 : 2;
  const OUTLINE_COUNT = cols * rows;
  const EXTRA_PIECES  = Math.floor(rnd(2, 4)); // distractores, además de los requeridos

  const margin   = Math.min(W, H) * 0.06;
  const zoneTop    = margin + 20;
  const zoneBottom = H * 0.58;
  const zoneLeft   = margin;
  const zoneRight  = W - margin;
  const cellW = (zoneRight - zoneLeft) / cols;
  const cellH = (zoneBottom - zoneTop) / rows;
  const size  = Math.min(cellW, cellH) * 0.46; // figura más grande dentro de su celda (antes 0.34)

  const requiredTypes = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const type = rndI(TYPES);
      requiredTypes.push(type);
      const ox = zoneLeft + cellW * (c + 0.5);
      const oy = zoneTop  + cellH * (r + 0.5);

      const div = document.createElement('div');
      div.className = 'outline-slot';
      const dim = size * 2.3;
      div.style.cssText = `
        position:absolute; left:${ox - dim/2}px; top:${oy - dim/2}px;
        width:${dim}px; height:${dim}px; opacity:0; transform:scale(0.7);
        transition: opacity 0.5s ease, transform 0.5s cubic-bezier(.34,1.56,.64,1);
      `;
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${dim} ${dim}`);
      svg.style.cssText = 'width:100%; height:100%; display:block;';
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', shapeOutlinePath(type, dim/2, dim/2, size));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(0,0,0,0.22)');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('stroke-dasharray', '7 6');
      svg.appendChild(path);
      div.appendChild(svg);
      tangramEl.appendChild(div);

      outlines.push({ x: ox, y: oy, size, type, div, path, filled: false });
      setTimeout(() => {
        div.style.opacity = '1';
        div.style.transform = 'scale(1)';
        setTimeout(() => div.classList.add('breathing'), 500);
      }, idx * 60);
      idx++;
    }
  }

  // ── ZONA INFERIOR: piezas sueltas en FILA ORDENADA, agrupadas por tipo ──
  const piecePool = [...requiredTypes];
  for (let i = 0; i < EXTRA_PIECES; i++) piecePool.push(rndI(TYPES));
  // agrupar por tipo (mismo orden que TYPES) en vez de mezclar al azar,
  // así la fila de piezas se ve prolija y predecible, no caótica.
  piecePool.sort((a, b) => TYPES.indexOf(a) - TYPES.indexOf(b));
  const DRAGPIECE_COUNT = piecePool.length;

  // tamaño de pieza adaptado al ancho disponible, así la fila nunca se desborda
  // ni se ve apretada, sin importar cuántas piezas haya en esta ronda.
  const availRowW   = W - margin * 2;
  const maxPieceSize = 52; // antes 38, se veían muy chicas
  const pieceSize = Math.min(maxPieceSize, availRowW / (DRAGPIECE_COUNT * 2.6 * 0.82));
  const pieceDim  = pieceSize * 2.6;
  const rowY      = H * 0.78;
  const totalRowW = DRAGPIECE_COUNT * pieceDim * 0.82;
  const rowStartX = (W - totalRowW) / 2 + pieceDim * 0.41;

  for (let i = 0; i < DRAGPIECE_COUNT; i++) {
    const type  = piecePool[i];
    // mismo color que ese tipo tiene en el mosaico y en FORMA — coherencia de paleta.
    const color = SC[type];
    const px = rowStartX + i * pieceDim * 0.82;
    const py = rowY;

    const div = document.createElement('div');
    div.className = 'drag-piece';
    div.style.cssText = `
      position:absolute; left:${px - pieceDim/2}px; top:${py - pieceDim/2}px;
      width:${pieceDim}px; height:${pieceDim}px; opacity:0; transform:scale(0.6);
      transition: opacity 0.45s ease, transform 0.45s cubic-bezier(.34,1.56,.64,1);
      cursor:grab; touch-action:none; pointer-events:auto;
    `;
    const cv = document.createElement('canvas');
    cv.width = pieceDim; cv.height = pieceDim;
    cv.style.cssText = 'width:100%; height:100%; display:block;';
    drawShapeOn(cv.getContext('2d'), type, color, pieceDim/2, pieceDim/2, pieceSize, 0);
    div.appendChild(cv);
    tangramEl.appendChild(div);

    const piece = { div, type, color, size: pieceSize, homeX: px, homeY: py, used: false };
    dragPieces.push(piece);
    makeDragPieceDraggable(piece);

    setTimeout(() => { div.style.opacity = '1'; div.style.transform = 'scale(1)'; }, 250 + i * 55);

  }
  dragPiecesLeft = DRAGPIECE_COUNT;

  setTimeout(() => {
    if (phase !== 'tangram') return;
    hint.querySelector('p').textContent = 'arrastra el color a una figura';
    hint.style.opacity = '1';
  }, 250 + DRAGPIECE_COUNT * 55 + 200);
}

function shapeOutlinePath(type, cx, cy, s) {
  if (type === 'circle') {
    return `M ${cx - s} ${cy} a ${s} ${s} 0 1 0 ${s*2} 0 a ${s} ${s} 0 1 0 ${-s*2} 0`;
  }
  if (type === 'semicircle') {
    return `M ${cx - s} ${cy} a ${s} ${s} 0 0 1 ${s*2} 0 Z`;
  }
  if (type === 'triangle') {
    // mismos vértices que antes, con esquinas redondeadas: en cada vértice
    // se recorta una distancia `r` hacia los dos lados adyacentes (usando
    // el vector normalizado de cada lado, igual que rpoly en canvas) y se
    // conecta con una curva cuadrática Q, igual estilo que square/elongated.
    const r = s * 0.16;
    const pts = [
      { x: cx,          y: cy - s * 0.9  },
      { x: cx + s * 0.85, y: cy + s * 0.65 },
      { x: cx - s * 0.85, y: cy + s * 0.65 },
    ];
    const n = pts.length;
    const seg = pts.map((cur, i) => {
      const prev = pts[(i - 1 + n) % n];
      const next = pts[(i + 1) % n];
      const toPrev = { x: prev.x - cur.x, y: prev.y - cur.y };
      const toNext = { x: next.x - cur.x, y: next.y - cur.y };
      const lenPrev = Math.hypot(toPrev.x, toPrev.y);
      const lenNext = Math.hypot(toNext.x, toNext.y);
      const rr = Math.min(r, lenPrev / 2, lenNext / 2);
      return {
        p1: { x: cur.x + (toPrev.x / lenPrev) * rr, y: cur.y + (toPrev.y / lenPrev) * rr },
        p2: { x: cur.x + (toNext.x / lenNext) * rr, y: cur.y + (toNext.y / lenNext) * rr },
        c:  cur,
      };
    });
    let d = `M ${seg[0].p1.x} ${seg[0].p1.y} `;
    for (let i = 0; i < n; i++) {
      d += `Q ${seg[i].c.x} ${seg[i].c.y} ${seg[i].p2.x} ${seg[i].p2.y} `;
      const nextSeg = seg[(i + 1) % n];
      d += `L ${nextSeg.p1.x} ${nextSeg.p1.y} `;
    }
    return d + 'Z';
  }
  if (type === 'square') {
    const r = s * 0.18;
    return `M ${cx-s+r} ${cy-s} L ${cx+s-r} ${cy-s} Q ${cx+s} ${cy-s} ${cx+s} ${cy-s+r} L ${cx+s} ${cy+s-r} Q ${cx+s} ${cy+s} ${cx+s-r} ${cy+s} L ${cx-s+r} ${cy+s} Q ${cx-s} ${cy+s} ${cx-s} ${cy+s-r} L ${cx-s} ${cy-s+r} Q ${cx-s} ${cy-s} ${cx-s+r} ${cy-s} Z`;
  }
  const w = s * 0.34, r2 = w;
  return `M ${cx-w+r2} ${cy-s} L ${cx+w-r2} ${cy-s} Q ${cx+w} ${cy-s} ${cx+w} ${cy-s+r2} L ${cx+w} ${cy+s-r2} Q ${cx+w} ${cy+s} ${cx+w-r2} ${cy+s} L ${cx-w+r2} ${cy+s} Q ${cx-w} ${cy+s} ${cx-w} ${cy+s-r2} L ${cx-w} ${cy-s+r2} Q ${cx-w} ${cy-s} ${cx-w+r2} ${cy-s} Z`;
}

function makeDragPieceDraggable(piece) {
  const div = piece.div;
  let sx = 0, sy = 0, baseLeft = 0, baseTop = 0, dragging = false;

  function down(ex, ey) {
    if (phase !== 'tangram' || piece.used) return;
    dragging = true;
    sx = ex; sy = ey;
    baseLeft = parseFloat(div.style.left);
    baseTop  = parseFloat(div.style.top);
    div.style.transition = 'none';
    div.style.zIndex = '300';
    div.style.cursor = 'grabbing';
    playPop(600, 0.04, 0.05);
  }
  function move(ex, ey) {
    if (!dragging) return;
    div.style.left = `${baseLeft + (ex - sx)}px`;
    div.style.top  = `${baseTop  + (ey - sy)}px`;
  }
  function up(ex, ey) {
    if (!dragging) return;
    dragging = false;
    div.style.cursor = 'grab';
    const rect = div.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width/2 - wrapRect.left;
    const cy = rect.top  + rect.height/2 - wrapRect.top;

    // FIX: antes solo se chequeaba que el outline estuviera vacío y cerca,
    // sin comparar el TIPO de figura — por eso cualquier pieza encajaba en
    // cualquier hueco cercano. Ahora exige que el tipo coincida también.
    const target = outlines.find(o => !o.filled && o.type === piece.type && Math.hypot(o.x - cx, o.y - cy) < o.size * 1.5);
    if (target) {
      snapPieceToOutline(piece, target);
    } else {
      // si soltó cerca de un outline pero del tipo incorrecto, dar feedback
      // de rechazo (pequeño shake) en vez de volver en silencio.
      const nearWrong = outlines.find(o => !o.filled && o.type !== piece.type && Math.hypot(o.x - cx, o.y - cy) < o.size * 1.5);
      div.style.transition = 'left 0.35s cubic-bezier(.34,1.56,.64,1), top 0.35s cubic-bezier(.34,1.56,.64,1)';
      div.style.left = `${piece.homeX - parseFloat(div.style.width)/2}px`;
      div.style.top  = `${piece.homeY - parseFloat(div.style.height)/2}px`;
      div.style.zIndex = '';
      if (nearWrong) {
        playReject();
        div.classList.add('reject-shake');
        setTimeout(() => div.classList.remove('reject-shake'), 420);
      }
    }
  }

  div.addEventListener('mousedown', e => { e.preventDefault(); down(e.clientX, e.clientY); });
  window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
  window.addEventListener('mouseup', e => up(e.clientX, e.clientY));
  div.addEventListener('touchstart', e => { e.preventDefault(); down(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  div.addEventListener('touchmove', e => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  div.addEventListener('touchend', e => up(e.changedTouches[0].clientX, e.changedTouches[0].clientY));
}

function snapPieceToOutline(piece, outline) {
  outline.filled = true;
  piece.used = true;
  playColorNote(piece.color);

  const div = piece.div;
  const dim = outline.size * 2.3;
  div.style.transition = 'left 0.3s cubic-bezier(.34,1.56,.64,1), top 0.3s cubic-bezier(.34,1.56,.64,1), width 0.3s, height 0.3s';
  div.style.left   = `${outline.x - dim/2}px`;
  div.style.top    = `${outline.y - dim/2}px`;
  div.style.width  = `${dim}px`;
  div.style.height = `${dim}px`;
  div.style.zIndex = '';

  const cv = div.querySelector('canvas');
  cv.width = dim; cv.height = dim;
  drawShapeOn(cv.getContext('2d'), piece.type, piece.color, dim/2, dim/2, outline.size, rnd(-0.15, 0.15));

  outline.path.setAttribute('stroke-opacity', '0');
  outline.div.classList.remove('breathing');

  dragPiecesLeft--;
  checkTangramDone();
}

function checkTangramDone() {
  const allOutlinesFull = outlines.every(o => o.filled);
  const noMoreUsable = dragPieces.filter(p => !p.used).length === 0;
  if (!allOutlinesFull && !noMoreUsable) return;

  hint.style.opacity = '0';
  btnWrap.classList.remove('show');

  if (allOutlinesFull) {
    celebrateCompletion();
  } else {
    setTimeout(() => {
      dragPieces.forEach(p => {
        if (!p.used) {
          p.div.style.transition = 'opacity 0.4s';
          p.div.style.opacity = '0';
        }
      });
      setTimeout(advanceTangram, 450);
    }, 500);
  }
}

function celebrateCompletion() {
  const placed = dragPieces.filter(p => p.used).slice();
  placed.sort((a, b) => a.div.getBoundingClientRect().left - b.div.getBoundingClientRect().left);

  playSuccessChord();

  placed.forEach((p, i) => {
    setTimeout(() => {
      const div = p.div;
      div.style.transition = 'transform 0.32s cubic-bezier(.34,1.56,.64,1)';
      div.style.transform = 'scale(1.18)';
      setTimeout(() => {
        div.style.transform = 'scale(1)';
      }, 230);
    }, i * 70);
  });

  const waveTotal = placed.length * 70 + 550;
  setTimeout(advanceTangram, waveTotal);
}

function advanceTangram() {
  if (tangramRound < TANGRAM_ROUNDS) {
    tangramRound++;
    updateRoundBadge();
    hint.querySelector('p').textContent = 'siguiente ronda...';
    setTimeout(() => {
      buildTangramRound();
      btnWrap.classList.add('show');
    }, 500);
  } else {
    finishTangramPhase();
  }
}

function finishTangramPhase() {
  tangramEl.innerHTML = '';
  outlines = [];
  dragPieces = [];
  roundBadge.classList.remove('show');
  hint.querySelector('p').textContent = 'arrastra las piezas';
  // al completar el tangram entero se pasa a una fase completamente nueva
  // (el mandala), no se vuelve a armar la palabra FORMA.
  disperseFormaAndRestart('mandala');
}

// ════════════════════════════════════════════════════════════════
// 11. FASE 4 — MANDALA
// ════════════════════════════════════════════════════════════════
// Patrón simétrico de anillos concéntricos que se autoensambla una sola vez
// desde el centro hacia afuera (como en la versión original). El scroll /
// rueda del mouse / swipe rota el mandala completo: más scroll = más giro.
const mandalaEl = document.createElement('div');
mandalaEl.id = 'mandala';
mandalaEl.style.cssText = 'position:absolute; inset:0; z-index:12; pointer-events:none;';
wrap.appendChild(mandalaEl);

let mandalaPieces = [];
let mandalaRotation = 0;       // rotación acumulada actual (radianes)
let mandalaTargetRotation = 0; // objetivo hacia el que se interpola con inercia
let mandalaAnimId = null;
let mandalaTouchStartX = null;
// umbral de giro acumulado (en radianes, valor absoluto, sin importar
// dirección) a partir del cual el mandala explota solo — automático al
// cruzar el umbral, sin que el usuario tenga que soltar nada.
const MANDALA_SPIN_THRESHOLD = Math.PI * 2; // ~1 vuelta completa (antes ~2.5, duraba mucho)
let mandalaExploding = false;

function startMandalaPhase() {
  phase = 'mandala';
  mandalaEl.innerHTML = '';
  mandalaPieces = [];
  mandalaRotation = 0;
  mandalaTargetRotation = 0;
  mandalaExploding = false;
  hint.style.opacity = '0';
  hint.classList.remove('bottom');
  btnWrap.classList.remove('show');
  secondaryBtn.classList.remove('show');
  roundBadge.classList.remove('show');

  const cx = W / 2, cy = H / 2;
  const rings = [
    { count: 8,  radius: Math.min(W, H) * 0.13, size: 24 },
    { count: 12, radius: Math.min(W, H) * 0.25, size: 29 },
    { count: 16, radius: Math.min(W, H) * 0.37, size: 34 },
  ];

  let globalIdx = 0;
  const totalPieces = rings.reduce((s, r) => s + r.count, 0);

  rings.forEach((ring, ringIdx) => {
    const typesCycle = TYPES;
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2;
      const type  = typesCycle[(i + ringIdx) % typesCycle.length];
      const color = SC[type];
      const tx = cx + Math.cos(angle) * ring.radius;
      const ty = cy + Math.sin(angle) * ring.radius;

      const div = document.createElement('div');
      const dim = ring.size * 2.4;
      div.style.cssText = `
        position:absolute; left:${cx - dim/2}px; top:${cy - dim/2}px;
        width:${dim}px; height:${dim}px; opacity:0;
        transform: translate(0,0) scale(0.3);
        transition: left 0.7s cubic-bezier(.2,.8,.2,1), top 0.7s cubic-bezier(.2,.8,.2,1),
                    opacity 0.5s ease, transform 0.7s cubic-bezier(.34,1.56,.64,1);
      `;
      const cv = document.createElement('canvas');
      cv.width = dim; cv.height = dim;
      cv.style.cssText = 'width:100%; height:100%; display:block;';
      drawShapeOn(cv.getContext('2d'), type, color, dim/2, dim/2, ring.size, angle);
      div.appendChild(cv);
      mandalaEl.appendChild(div);

      const delay = globalIdx * 35;
      setTimeout(() => {
        div.style.left = `${tx - dim/2}px`;
        div.style.top  = `${ty - dim/2}px`;
        div.style.opacity = '1';
        div.style.transform = 'translate(0,0) scale(1)';
      }, delay);

      mandalaPieces.push({ div, baseX: tx - cx, baseY: ty - cy, cx, cy, baseAngle: angle, ringIdx, dim });
      globalIdx++;
    }
  });

  playReveal();

  // cuando termina de ensamblarse, habilita el botón para reiniciar el ciclo
  setTimeout(() => {
    if (phase !== 'mandala') return;
    hint.querySelector('p').textContent = 'haz scroll para girar la composición';
    hint.style.opacity = '1';
    mainBtn.textContent = 'volver a empezar';
    btnWrap.classList.add('show');
    startMandalaLoop();
  }, totalPieces * 35 + 750);
}

function startMandalaLoop() {
  function tick() {
    if (phase !== 'mandala') { mandalaAnimId = null; return; }
    // inercia: la rotación actual persigue suavemente el objetivo del scroll
    mandalaRotation += (mandalaTargetRotation - mandalaRotation) * 0.08;
    const now = performance.now() * 0.0006;
    mandalaPieces.forEach(p => {
      // respiración sutil + la rotación global acumulada del scroll
      const wobble = Math.sin(now + p.ringIdx * 1.3) * 3;
      const dist   = Math.sqrt(p.baseX * p.baseX + p.baseY * p.baseY);
      const angle  = p.baseAngle + mandalaRotation;
      const x = Math.cos(angle) * dist + Math.cos(p.baseAngle) * wobble;
      const y = Math.sin(angle) * dist + Math.sin(p.baseAngle) * wobble;
      const rot = angle + Math.sin(now * 0.5) * 0.08;
      p.div.style.transform = `translate(${x - p.baseX}px, ${y - p.baseY}px) scale(1) rotate(${rot}rad)`;
    });

    if (!mandalaExploding && Math.abs(mandalaTargetRotation) >= MANDALA_SPIN_THRESHOLD) {
      mandalaExploding = true;
      explodeMandala();
      return; // deja de animar el giro normal; la explosión toma el control
    }

    mandalaAnimId = requestAnimationFrame(tick);
  }
  if (!mandalaAnimId) mandalaAnimId = requestAnimationFrame(tick);
}

function explodeMandala() {
  hint.style.opacity = '0';
  btnWrap.classList.remove('show');
  secondaryBtn.classList.remove('show');

  mandalaPieces.forEach((p, i) => {
    // se lee la transform actual (ya incluye la rotación visible en este
    // instante) para que la explosión parta desde la posición real en
    // pantalla, sin saltos.
    const cs = getComputedStyle(p.div);
    const matrix = new DOMMatrixReadOnly(cs.transform);
    const curDX = matrix.m41, curDY = matrix.m42;

    const a    = Math.atan2(p.baseY, p.baseX) + rnd(-0.3, 0.3);
    const dist = rnd(Math.max(W, H) * 0.7, Math.max(W, H) * 1.15);
    const toX  = curDX + Math.cos(a) * dist;
    const toY  = curDY + Math.sin(a) * dist;

    p.div.style.transition = `transform ${rnd(0.5,0.8)}s cubic-bezier(.15,.6,.3,1), opacity 0.6s ease`;
    p.div.style.transform  = `translate(${toX}px, ${toY}px) scale(1.6) rotate(${rnd(-2,2)}rad)`;
    p.div.style.opacity    = '0';
  });

  playSuccessChord();
  playWhoosh(0.18);

  setTimeout(() => {
    endMandalaPhase();
    mandalaExploding = false;
    rotatePalette();
    startGardenPhase();
  }, 780);
}

// ── Entrada de scroll / wheel / touch: gira el mandala completo ───────────
function mandalaSpin(delta) {
  if (phase !== 'mandala') return;
  mandalaTargetRotation += delta;
}

window.addEventListener('wheel', e => {
  if (phase !== 'mandala') return;
  e.preventDefault();
  mandalaSpin(e.deltaY * 0.0028); // intermedio: 0.0022 original duraba mucho, 0.0042 quedó demasiado rápido
}, { passive: false });

window.addEventListener('touchstart', e => {
  if (phase !== 'mandala') return;
  mandalaTouchStartX = e.touches[0].clientX;
}, { passive: true });

window.addEventListener('touchmove', e => {
  if (phase !== 'mandala' || mandalaTouchStartX === null) return;
  e.preventDefault();
  const x = e.touches[0].clientX;
  const dx = x - mandalaTouchStartX;
  mandalaTouchStartX = x;
  mandalaSpin(dx * 0.006);
}, { passive: false });

window.addEventListener('touchend', () => { mandalaTouchStartX = null; }, { passive: true });

window.addEventListener('keydown', e => {
  if (phase !== 'mandala') return;
  if (e.key === 'ArrowRight') { e.preventDefault(); mandalaSpin(0.15); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); mandalaSpin(-0.15); }
});

function endMandalaPhase() {
  mandalaEl.innerHTML = '';
  mandalaPieces = [];
  mandalaAnimId = null;
}

// ════════════════════════════════════════════════════════════════
// 12. FASE 5 — CONSTELACIÓN (JARDÍN)
// ════════════════════════════════════════════════════════════════
// Etapa CON objetivo entre el mandala y la mezcla de colores: aparecen
// puntos guía punteados dispersos como una constelación; tocar/click cerca
// de un punto "planta" una pieza que se ancla ahí (deja de poder moverse,
// no se desvanece) y el punto queda completado. Tocar lejos de cualquier
// punto da un feedback chico (mini explosión de partículas) pero no cuenta
// para el objetivo. Al completar todos los puntos, se dibujan las líneas
// conectándolos como una constelación real, sonido de cierre, y avanza
// automático a la siguiente fase — sin botón, igual que el resto de las
// transiciones del ciclo.
const constelEl = document.createElement('div');
constelEl.id = 'constelacion';
constelEl.style.cssText = 'position:absolute; inset:0; z-index:12; pointer-events:none;';
wrap.appendChild(constelEl);

let constelGuides = [];      // { x, y, filled, div (outline punteado) }
let constelPieces = [];      // piezas ancladas, para dibujar las líneas finales
let constelCompleted = false;
const CONSTEL_GUIDE_COUNT = 6;
// El tamaño de pieza y el radio de detección escalan con el tamaño de
// pantalla (recalculados en buildConstelGuides, que conoce W/H actuales).
// Valores fijos se veían bien en desktop pero en pantallas angostas
// (celular) las piezas grandes se superponían entre puntos vecinos.
let CONSTEL_HIT_RADIUS = 85;
let CONSTEL_PIECE_SIZE = 78;

function startGardenPhase() {
  phase = 'garden';
  cycleCompleted = true;
  constelCompleted = false;
  constelGuides = [];
  constelPieces = [];
  constelEl.innerHTML = '';
  hint.classList.remove('bottom');
  btnWrap.classList.remove('show');
  secondaryBtn.classList.remove('show');
  roundBadge.classList.remove('show');

  hint.querySelector('p').textContent = 'clickea en los puntos';
  hint.style.opacity = '1';

  buildConstelGuides();
}

function buildConstelGuides() {
  // Antes rx/ry usaban Math.min(W,H) para ambos ejes — en pantallas anchas
  // (la mayoría en desktop) eso dejaba mucho ancho sin aprovechar a los
  // costados, porque el límite siempre era la altura. Ahora cada eje usa
  // su propia dimensión real (W para horizontal, H para vertical), con
  // margen de seguridad, así la constelación ocupa mucho más del espacio
  // disponible en cualquier proporción de pantalla.
  const cx = W / 2, cy = H * 0.46;
  const rx = W * 0.40;
  const ry = H * 0.34;

  // FIX: antes el tamaño de pieza se calculaba con una ESTIMACIÓN previa
  // de la distancia esperada entre puntos vecinos (basada en un factor
  // fijo), pero la disposición real tiene aleatoriedad en ángulo y
  // distancia — esa estimación resultaba demasiado conservadora incluso
  // en resoluciones de escritorio normales (1366x768, 1280x720), achicando
  // las piezas mucho más de lo necesario. Ahora generamos primero las
  // posiciones REALES de los 6 puntos, medimos la distancia mínima real
  // entre vecinos en ESE conjunto específico, y solo entonces calculamos
  // el tamaño máximo de pieza que cabe sin superponerse.
  const positions = [];
  for (let i = 0; i < CONSTEL_GUIDE_COUNT; i++) {
    const a = (i / CONSTEL_GUIDE_COUNT) * Math.PI * 2 + rnd(-0.22, 0.22);
    const dist = rnd(0.62, 1.05);
    positions.push({
      x: cx + Math.cos(a) * rx * dist,
      y: cy + Math.sin(a) * ry * dist,
    });
  }

  let minNeighborDist = Infinity;
  for (let i = 0; i < positions.length; i++) {
    const a = positions[i], b = positions[(i + 1) % positions.length];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < minNeighborDist) minNeighborDist = d;
  }

  const desiredDiameter = 78 * 2.2;
  const maxDiameterForSpacing = minNeighborDist * 0.92; // deja un margen chico, no exactamente al límite
  const scale = Math.min(1, maxDiameterForSpacing / desiredDiameter);
  CONSTEL_PIECE_SIZE = Math.max(30, 78 * scale);
  CONSTEL_HIT_RADIUS = Math.max(38, 85 * scale);

  positions.forEach((pos, i) => {
    const gx = pos.x, gy = pos.y;

    const div = document.createElement('div');
    const dim = 30;
    div.style.cssText = `
      position:absolute; left:${gx - dim/2}px; top:${gy - dim/2}px;
      width:${dim}px; height:${dim}px; opacity:0;
      transition: opacity 0.5s ease;
    `;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${dim} ${dim}`);
    svg.style.cssText = 'width:100%; height:100%; display:block;';
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', dim / 2);
    circle.setAttribute('cy', dim / 2);
    circle.setAttribute('r', 9);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'rgba(0,0,0,0.3)');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('stroke-dasharray', '3 4');
    circle.setAttribute('class', 'constel-pulse');
    svg.appendChild(circle);
    div.appendChild(svg);
    constelEl.appendChild(div);

    setTimeout(() => { div.style.opacity = '1'; }, i * 90);

    constelGuides.push({ x: gx, y: gy, filled: false, div });
  });
}

function constelTouch(x, y) {
  if (phase !== 'garden' || constelCompleted) return;

  const target = constelGuides.find(g => !g.filled && Math.hypot(g.x - x, g.y - y) < CONSTEL_HIT_RADIUS);
  if (target) {
    plantConstelPiece(target);
  } else {
    // feedback chico para no dejar el toque sin respuesta, pero no cuenta
    // como objetivo — solo cerca de un punto guía se ancla algo.
    burst(x, y, 7);
    playPop(rnd(380, 520), 0.1, 0.08);
  }
}

function plantConstelPiece(guide) {
  guide.filled = true;
  guide.div.style.transition = 'opacity 0.3s';
  guide.div.style.opacity = '0';

  const type = rndI(TYPES);
  const color = SC[type];

  const div = document.createElement('div');
  // misma clase que usan las piezas de la mezcla de colores (cursor,
  // hover, estado 'lifted'), aunque el arrastre recién se activa más
  // adelante — al completar la constelación, estas piezas se reutilizan
  // literalmente en la fase de mezcla en vez de generar piezas nuevas.
  div.className = 'final-piece';
  const dim = CONSTEL_PIECE_SIZE * 2.2;
  div.style.cssText = `
    position:absolute; left:${guide.x - dim/2}px; top:${guide.y - dim/2}px;
    width:${dim}px; height:${dim}px; opacity:0; transform:scale(0.3);
    transition: opacity 0.4s ease, transform 0.45s cubic-bezier(.34,1.56,.64,1);
    pointer-events:none;
  `;
  const cv = document.createElement('canvas');
  cv.width = dim; cv.height = dim;
  cv.style.cssText = 'width:100%; height:100%; display:block;';
  drawShapeOn(cv.getContext('2d'), type, color, dim / 2, dim / 2, CONSTEL_PIECE_SIZE, rnd(-0.2, 0.2));
  div.appendChild(cv);
  constelEl.appendChild(div);

  requestAnimationFrame(() => {
    div.style.opacity = '1';
    div.style.transform = 'scale(1)';
  });

  constelPieces.push({ x: guide.x, y: guide.y, div, cv, type, color, baseSize: CONSTEL_PIECE_SIZE });
  playColorNote(color);
  burst(guide.x, guide.y, 10);

  checkConstelComplete();
}

function checkConstelComplete() {
  if (constelGuides.every(g => g.filled) && !constelCompleted) {
    constelCompleted = true;
    hint.querySelector('p').textContent = 'recorrido completo';
    drawConstelLines();
  }
}

let constelLinesSvg = null;

function drawConstelLines() {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; transition: opacity 0.5s ease;';
  constelEl.appendChild(svg);
  constelLinesSvg = svg;

  const n = constelPieces.length;
  for (let i = 0; i < n; i++) {
    const a = constelPieces[i];
    const b = constelPieces[(i + 1) % n];
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', a.x); line.setAttribute('y2', a.y);
    line.setAttribute('stroke', 'rgba(0,0,0,0.26)');
    line.setAttribute('stroke-width', '1.6');
    line.setAttribute('stroke-dasharray', '5 5');
    svg.appendChild(line);

    setTimeout(() => {
      line.style.transition = 'all 0.5s ease';
      line.setAttribute('x2', b.x);
      line.setAttribute('y2', b.y);
    }, i * 160 + 50);
  }

  playSuccessChord();
  const totalDur = n * 160 + 600 + 900; // tiempo de dibujar todas las líneas + pausa contemplativa
  setTimeout(() => {
    if (phase === 'garden') transitionConstelToMix();
  }, totalDur);
}

// A pedido: las MISMAS piezas plantadas en la constelación pasan a ser las
// piezas de la mezcla de colores, en vez de generar piezas nuevas — la
// transición se siente continua (las piezas no desaparecen y reaparecen).
function transitionConstelToMix() {
  hint.style.opacity = '0';

  // las líneas se desvanecen antes de habilitar el arrastre, como señal
  // de que ahora la interacción cambia de naturaleza.
  if (constelLinesSvg) {
    constelLinesSvg.style.opacity = '0';
  }
  constelGuides.forEach(g => { g.div.style.opacity = '0'; });

  setTimeout(() => {
    phase = 'final-canvas';
    finalCanvasEl.innerHTML = '';
    finalPieces = [];
    finalMergesDone = 0;
    btnWrap.classList.remove('show');
    secondaryBtn.classList.remove('show');
    roundBadge.classList.remove('show');
    colorFloodEl.style.opacity = '0';
    colorFloodEl.style.background = 'transparent';

    // mover cada div ya existente de constelEl a finalCanvasEl, conservando
    // su posición real en pantalla (left/top en coordenadas de wrap, que
    // ambos contenedores comparten con position:absolute; inset:0).
    constelPieces.forEach(cp => {
      cp.div.style.pointerEvents = ''; // quita el bloqueo inline; hereda 'auto' de .final-piece
      finalCanvasEl.appendChild(cp.div);
      const piece = { div: cp.div, cv: cp.cv, type: cp.type, baseSize: cp.baseSize, color: cp.color, merged: false };
      finalPieces.push(piece);
      makeFinalPieceDraggable(piece);
    });

    constelEl.innerHTML = '';
    constelGuides = [];
    constelPieces = [];
    constelLinesSvg = null;

    hint.classList.remove('bottom');
    hint.querySelector('p').textContent = 'mezcla los colores arrastrándolos juntos';
    hint.style.opacity = '1';
  }, 600);
}

function endGardenPhase() {
  constelEl.innerHTML = '';
  constelGuides = [];
  constelPieces = [];
  constelLinesSvg = null;
}

function goToFormaFromGarden() {
  if (phase !== 'garden') return;
  hint.style.opacity = '0';
  btnWrap.classList.remove('show');
  secondaryBtn.classList.remove('show');

  // FIX: antes esta función siempre volvía a armar la palabra FORMA y
  // entraba a startFreeplay(), lo cual cambiaba phase a 'freeplay' antes
  // de que el usuario pudiera hacer click — por eso el botón principal
  // nunca llegaba a la rama que muestra la despedida (#farewell), sin
  // importar que cycleCompleted ya fuera true. Ahora, si el ciclo ya se
  // completó (pasamos por tangram + mandala + jardín), el jardín no
  // vuelve a FORMA: avanza a una fase de cierre nueva (mezcla de color)
  // que es la única puerta hacia la despedida, y es 100% automática
  // (sin botón): cierra sola cuando todos los colores quedan unificados.
  if (cycleCompleted) {
    endGardenPhase();
    startFinalCanvasPhase();
  } else {
    endGardenPhase();
    phase = 'revealed';
    setTimeout(spawnForma, 200);
  }
}

// ════════════════════════════════════════════════════════════════
// 13. FASE 6 — LIENZO FINAL (MEZCLA DE COLOR)
// ════════════════════════════════════════════════════════════════
// Última fase antes de la despedida. Aparecen piezas de colores variados;
// arrastrar una pieza sobre otra las fusiona en una sola pieza con el
// color mezclado (promedio RGB). Repitiendo la mezcla, la cantidad de
// piezas y de colores distintos en pantalla va bajando. Cuando TODAS las
// piezas quedan del mismo color (con una tolerancia chica), ese color
// inunda toda la pantalla y, sin ningún botón, la experiencia pasa sola
// a la despedida tras una pausa contemplativa.
const finalCanvasEl = document.createElement('div');
finalCanvasEl.id = 'final-canvas';
finalCanvasEl.style.cssText = 'position:absolute; inset:0; z-index:13; pointer-events:none;';
wrap.appendChild(finalCanvasEl);

// overlay de inundación de color, por encima de todo, arranca transparente
const colorFloodEl = document.createElement('div');
colorFloodEl.id = 'color-flood';
colorFloodEl.style.cssText = `
  position:absolute; inset:0; z-index:90; pointer-events:none;
  background: transparent; opacity:0;
  transition: background-color 0.6s ease, opacity 0.9s ease;
`;
wrap.appendChild(colorFloodEl);

let finalPieces = [];
let finalMergesDone = 0;
const FINAL_PIECE_COUNT_MIN = 4;
const FINAL_PIECE_COUNT_MAX = 6;
const FINAL_MERGE_RADIUS_FACTOR = 1.15; // qué tan cerca hay que soltar para fusionar
const FINAL_UNIFY_TOLERANCE = 18;       // distancia RGB máxima para considerar "mismo color"

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
function rgbToHex(r, g, b) {
  const toHex = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function mixColors(hexA, hexB) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return rgbToHex((a.r + b.r) / 2, (a.g + b.g) / 2, (a.b + b.b) / 2);
}
function colorDistance(hexA, hexB) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function startFinalCanvasPhase() {
  phase = 'final-canvas';
  endGardenPhase();
  finalCanvasEl.innerHTML = '';
  finalPieces = [];
  finalMergesDone = 0;
  btnWrap.classList.remove('show');
  secondaryBtn.classList.remove('show');
  roundBadge.classList.remove('show');
  colorFloodEl.style.opacity = '0';
  colorFloodEl.style.background = 'transparent';

  // Variedad garantizada de colores para que la mezcla tenga sentido:
  // tomamos los colores base de la paleta actual y los repartimos entre
  // varias piezas, en vez de reciclar literalmente lo plantado en el jardín
  // (que podría no tener suficiente variedad de color para jugar con esto).
  const baseColors = Object.values(SC);
  const count = Math.floor(rnd(FINAL_PIECE_COUNT_MIN, FINAL_PIECE_COUNT_MAX + 1));

  for (let i = 0; i < count; i++) {
    const type  = rndI(TYPES);
    const color = baseColors[i % baseColors.length];
    const x = rnd(W * 0.24, W * 0.76);
    const y = rnd(H * 0.30, H * 0.68);
    const baseSize = rnd(88, 116); // agrandadas de nuevo a pedido, antes 64-86
    spawnFinalPiece(x, y, type, color, baseSize, i * 70);
  }

  hint.classList.remove('bottom');
  hint.querySelector('p').textContent = 'mezcla los colores arrastrándolos juntos';
  hint.style.opacity = '1';
}

function spawnFinalPiece(x, y, type, color, baseSize, delay) {
  const div = document.createElement('div');
  div.className = 'final-piece';
  const dim = baseSize * 2.2;
  div.style.cssText = `
    left:${x - dim/2}px; top:${y - dim/2}px;
    width:${dim}px; height:${dim}px;
    opacity:0; transform:scale(0.5);
    transition: opacity 0.5s ease, transform 0.5s cubic-bezier(.34,1.56,.64,1);
  `;
  const cv = document.createElement('canvas');
  cv.width = dim; cv.height = dim;
  cv.style.cssText = 'width:100%; height:100%; display:block;';
  drawShapeOn(cv.getContext('2d'), type, color, dim/2, dim/2, baseSize, rnd(0, Math.PI * 2));
  div.appendChild(cv);
  finalCanvasEl.appendChild(div);

  setTimeout(() => {
    div.style.opacity = '1';
    div.style.transform = 'scale(1)';
  }, delay);

  const piece = { div, cv, type, baseSize, color, merged: false };
  finalPieces.push(piece);
  makeFinalPieceDraggable(piece);
  return piece;
}

function redrawFinalPiece(piece) {
  const dim = piece.baseSize * 2.2;
  piece.cv.width = dim; piece.cv.height = dim;
  drawShapeOn(piece.cv.getContext('2d'), piece.type, piece.color, dim / 2, dim / 2, piece.baseSize, 0);
}

function makeFinalPieceDraggable(piece) {
  const div = piece.div;
  let sx = 0, sy = 0, baseLeft = 0, baseTop = 0, dragging = false;

  function down(ex, ey) {
    if (phase !== 'final-canvas' || piece.merged) return;
    dragging = true;
    sx = ex; sy = ey;
    baseLeft = parseFloat(div.style.left);
    baseTop  = parseFloat(div.style.top);
    div.classList.add('lifted');
    div.style.transition = 'none';
    div.style.zIndex = '300';
    playPop(550, 0.04, 0.05);
  }

  function move(ex, ey) {
    if (!dragging) return;
    div.style.left = `${baseLeft + (ex - sx)}px`;
    div.style.top  = `${baseTop  + (ey - sy)}px`;
  }

  function up() {
    if (!dragging) return;
    dragging = false;
    div.classList.remove('lifted');
    div.style.transition = 'left 0.25s ease, top 0.25s ease';
    div.style.zIndex = '';

    // busca otra pieza viva, no fusionada, lo bastante cerca como para fusionar
    const rect = div.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const cx = rect.left - wrapRect.left + rect.width / 2;
    const cy = rect.top  - wrapRect.top  + rect.height / 2;

    let target = null;
    let bestDist = Infinity;
    finalPieces.forEach(other => {
      if (other === piece || other.merged) return;
      const r2 = other.div.getBoundingClientRect();
      const ox = r2.left - wrapRect.left + r2.width / 2;
      const oy = r2.top  - wrapRect.top  + r2.height / 2;
      const d = Math.hypot(ox - cx, oy - cy);
      const threshold = (rect.width / 2 + r2.width / 2) * FINAL_MERGE_RADIUS_FACTOR;
      if (d < threshold && d < bestDist) {
        bestDist = d;
        target = other;
      }
    });

    if (target) {
      mergeFinalPieces(piece, target);
    }
  }

  div.addEventListener('mousedown', e => { e.preventDefault(); down(e.clientX, e.clientY); });
  window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
  window.addEventListener('mouseup', up);
  div.addEventListener('touchstart', e => { e.preventDefault(); down(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  div.addEventListener('touchmove', e => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  div.addEventListener('touchend', up);
}

function mergeFinalPieces(moved, target) {
  // el color resultante se promedia; la pieza "target" (la que estaba quieta)
  // se queda y absorbe a "moved", que desaparece.
  const mixed = mixColors(moved.color, target.color);
  target.color = mixed;
  target.baseSize = Math.min(150, target.baseSize + moved.baseSize * 0.22); // crece un poco al fusionar, refuerza la idea de "absorber"
  redrawFinalPiece(target);

  moved.merged = true;
  moved.div.style.transition = 'transform 0.3s cubic-bezier(.4,0,.6,1), opacity 0.3s ease';
  const tr = target.div.getBoundingClientRect();
  const mr = moved.div.getBoundingClientRect();
  moved.div.style.transform = `translate(${tr.left - mr.left}px, ${tr.top - mr.top}px) scale(0.3)`;
  moved.div.style.opacity = '0';
  moved.div.style.pointerEvents = 'none';

  // pequeño pulso en la pieza resultante para marcar la fusión
  target.div.style.transition = 'transform 0.3s cubic-bezier(.34,1.56,.64,1)';
  target.div.style.transform = 'scale(1.12)';
  setTimeout(() => { target.div.style.transform = 'scale(1)'; }, 220);

  playColorNote(mixed);
  finalMergesDone++;

  setTimeout(() => {
    moved.div.remove();
    finalPieces = finalPieces.filter(p => p !== moved);
    checkFinalUnify();
  }, 320);
}

function checkFinalUnify() {
  if (phase !== 'final-canvas') return;
  const alive = finalPieces.filter(p => !p.merged);
  if (alive.length <= 1) {
    // si por fusiones sucesivas queda una sola pieza, ya está unificado
    finishFinalCanvasPhase(alive[0] ? alive[0].color : '#D12839');
    return;
  }
  const ref = alive[0].color;
  const allSame = alive.every(p => colorDistance(p.color, ref) <= FINAL_UNIFY_TOLERANCE);
  if (allSame) {
    finishFinalCanvasPhase(ref);
  }
}

function finishFinalCanvasPhase(finalColor) {
  if (phase !== 'final-canvas') return;
  phase = 'final-flood';
  hint.style.opacity = '0';
  btnWrap.classList.remove('show');
  secondaryBtn.classList.remove('show');

  playWhoosh(0.16);
  playSuccessChord();

  // el color logrado inunda toda la pantalla — sin botón, todo automático
  colorFloodEl.style.background = finalColor;
  requestAnimationFrame(() => {
    colorFloodEl.style.opacity = '1';
  });

  // pausa contemplativa con el color en pantalla completa, después
  // transición automática a la despedida. A pedido: la despedida se queda
  // con ESE color de fondo (no vuelve al beige) — aplicamos el mismo color
  // directamente al fondo de #farewell antes de mostrarla, y dejamos que
  // el overlay de flood se desvanezca por encima sin un cambio de color
  // brusco debajo.
  setTimeout(() => {
    finalCanvasEl.innerHTML = '';
    finalPieces = [];
    wrap.classList.remove('visible');
    if (farewell) {
      farewell.style.background = finalColor;
      // contraste dinámico: si el color final resulta oscuro, el texto y
      // el botón pasan a modo claro; si es claro, se quedan como siempre
      // (oscuro sobre claro). Luminancia relativa simple, suficiente para
      // decidir entre dos modos, no para precisión WCAG estricta.
      const rgb = hexToRgb(finalColor);
      const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
      farewell.classList.toggle('on-dark', luminance < 0.55);
      farewell.classList.add('show');
    }
    setTimeout(() => {
      colorFloodEl.style.opacity = '0';
    }, 700);
  }, 1500);
}

// ════════════════════════════════════════════════════════════════
// 14. TRANSICIONES Y CIERRE DE CICLO (disperse / restart / farewell)
// ════════════════════════════════════════════════════════════════
let formaComplete = false;
let resetting = false;

function disperseFormaAndRestart(nextStep = 'mosaic') {
  if (resetting) return;
  resetting = true;
  btnWrap.classList.remove('show');
  secondaryBtn.classList.remove('show');
  hint.style.opacity = '0';
  freeplayHint.classList.remove('show');

  const permanentPieces = pieces.filter(p => p.permanent);
  permanentPieces.forEach((p, i) => {
    const a  = rnd(0, Math.PI * 2);
    const dist = rnd(Math.max(W, H) * 0.5, Math.max(W, H) * 0.9);
    p.disperseDur = rnd(550, 950);
    p.startDisperse(
      p.x + Math.cos(a) * dist,
      p.y + Math.sin(a) * dist,
      rnd(-3, 3),
      Math.floor(i / 6) * 12
    );
  });

  playWhoosh(0.14);

  const maxWait = 950 + Math.floor(permanentPieces.length / 6) * 12 + 250;
  setTimeout(() => {
    pieces = pieces.filter(p => !p.permanent);
    resetting = false;
    if (nextStep === 'mandala') {
      rotatePalette();
      startMandalaPhase();
    } else {
      phase  = 'mosaic';
      rotatePalette();
      buildMosaicAnimated();
    }
  }, maxWait);
}

// Cierra el ciclo completo: dispersa la FORMA grande (igual que el resto de
// las transiciones) y, en vez de volver a generar el mosaico, muestra la
// pantalla de despedida que invita a regresar al landing inicial.
function disperseFormaToFarewell() {
  if (resetting) return;
  resetting = true;
  btnWrap.classList.remove('show');
  secondaryBtn.classList.remove('show');
  hint.style.opacity = '0';
  freeplayHint.classList.remove('show');

  const permanentPieces = pieces.filter(p => p.permanent);
  permanentPieces.forEach((p, i) => {
    const a  = rnd(0, Math.PI * 2);
    const dist = rnd(Math.max(W, H) * 0.5, Math.max(W, H) * 0.9);
    p.disperseDur = rnd(550, 950);
    p.startDisperse(
      p.x + Math.cos(a) * dist,
      p.y + Math.sin(a) * dist,
      rnd(-3, 3),
      Math.floor(i / 6) * 12
    );
  });

  playWhoosh(0.14);

  const maxWait = 950 + Math.floor(permanentPieces.length / 6) * 12 + 250;
  setTimeout(() => {
    pieces = pieces.filter(p => !p.permanent);
    resetting = false;
    wrap.classList.remove('visible');
    if (farewell) farewell.classList.add('show');
  }, maxWait);
}

function burst(cx, cy, n = 18) {
  for (let i = 0; i < n; i++) {
    const a  = rnd(0, Math.PI * 2);
    const sp = rnd(2, 9);
    pieces.push(new Piece(cx, cy, rndI(TYPES), Math.cos(a) * sp, Math.sin(a) * sp - 3));
  }
}

// ════════════════════════════════════════════════════════════════
// 15. EVENTOS GLOBALES
// ════════════════════════════════════════════════════════════════
splashBtn.addEventListener('click', () => {
  splash.classList.add('hidden');
  wrap.classList.add('visible');
  splashMode = false;
  initExperience();
});

if (farewellBtn) {
  farewellBtn.addEventListener('click', () => {
    // Ahora el landing es una página real separada (index.html), no el
    // splash interno de esta experiencia. En vez de reabrir el splash,
    // navegamos de vuelta a esa página.
    location.href = 'index.html';
  });
}

if (retryBtn) {
  retryBtn.addEventListener('click', () => {
    // Reinicia el ciclo completo DIRECTO desde el mosaico, sin navegar a
    // ningún lado (a diferencia de farewellBtn, que va al landing).
    farewell.classList.remove('show');
    farewell.classList.remove('on-dark');
    farewell.style.background = '';
    colorFloodEl.style.opacity = '0';
    colorFloodEl.style.background = 'transparent';
    pieces = [];
    wrap.classList.add('visible');
    rotatePalette();
    buildMosaicAnimated();
  });
}

wrap.addEventListener('mousemove', e => {
  const r = wrap.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

wrap.addEventListener('click', e => {
  if (phase === 'garden') {
    const r = wrap.getBoundingClientRect();
    constelTouch(e.clientX - r.left, e.clientY - r.top);
    return;
  }
  if (phase !== 'revealed' && phase !== 'freeplay') return;
  const r = wrap.getBoundingClientRect();
  burst(e.clientX - r.left, e.clientY - r.top, 14);
});

secondaryBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (phase === 'freeplay') startTangramPhase();
  else if (phase === 'garden') goToFormaFromGarden();
});

mainBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (phase === 'mandala') {
    hint.style.opacity = '0';
    btnWrap.classList.remove('show');
    phase = 'mandala-closing';
    mandalaPieces.forEach((p, i) => {
      const cs = getComputedStyle(p.div);
      const matrix = new DOMMatrixReadOnly(cs.transform);
      const curDX = matrix.m41, curDY = matrix.m42;
      const a = rnd(0, Math.PI * 2);
      const toX = curDX + Math.cos(a) * 900;
      const toY = curDY + Math.sin(a) * 900;
      p.div.style.transition = 'transform 0.5s cubic-bezier(.2,0,.6,1), opacity 0.45s';
      p.div.style.transform  = `translate(${toX}px, ${toY}px) scale(1) rotate(0rad)`;
      p.div.style.opacity = '0';
    });
    playWhoosh(0.12);
    mainBtn.textContent = 'generar composición';
    setTimeout(() => {
      endMandalaPhase();
      rotatePalette();
      buildMosaicAnimated();
    }, 600);
  } else if (phase === 'garden') {
    goToFormaFromGarden();
  } else if (phase === 'tangram') {
    tangramEl.innerHTML = '';
    outlines = [];
    dragPieces = [];
    roundBadge.classList.remove('show');
    phase = 'revealed';
    hint.style.opacity = '0';
    hint.querySelector('p').textContent = 'arrastra las piezas';
    disperseFormaAndRestart(false);
  } else if (phase === 'freeplay') {
    startTangramPhase();
  } else if (phase === 'revealed' && formaComplete) {
    // Nota: el cierre hacia #farewell ahora ocurre exclusivamente al
    // terminar el "lienzo final" (ver finishFinalCanvasPhase). Si por
    // algún motivo se llega aquí con cycleCompleted=true, seguimos
    // dispersando y reiniciando el mosaico en vez de quedar sin acción.
    disperseFormaAndRestart(false);
  } else if (phase === 'revealed') {
    spawnForma();
  } else {
    // FIX: esta rama es el salto MANUAL desde el botón "generar composición"
    // (click directo en fase mosaic, sin pasar por el umbral automático de
    // checkReveal). Tenía su propio camino viejo hacia FORMA, sin ninguna
    // de las mejoras de timing — todas las piezas volaban de golpe en el
    // mismo instante y FORMA arrancaba casi enseguida. Ahora aplica el
    // mismo patrón de tres etapas (atenuar -> ola escalonada -> pausa)
    // que ya usa la transición automática, para que se sienta igual sin
    // importar por cuál de los dos caminos se llegue.
    hint.style.opacity = '0';
    progressDots.classList.remove('show');
    phase = 'revealing';

    const remaining = tileData.filter(td => !td.gone);
    remaining.forEach(td => {
      td.div.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      td.div.style.opacity = '0.55';
      td.div.style.transform = 'scale(0.97)';
    });

    setTimeout(() => {
      remaining.forEach((td, i) => {
        const a = rnd(0, Math.PI * 2);
        setTimeout(() => {
          td.div.style.transition    = 'transform 0.6s cubic-bezier(.2,0,.5,1), opacity 0.55s';
          td.div.style.transform     = `translate(${Math.cos(a) * 1600}px, ${Math.sin(a) * 1600}px) rotate(${rnd(-40, 40)}deg)`;
          td.div.style.opacity       = '0';
          td.div.style.pointerEvents = 'none';
        }, i * 35);
      });
      phase = 'revealed';
      const lastFlightEnd = remaining.length * 35 + 600;
      setTimeout(spawnForma, lastFlightEnd + 500);
    }, 750);
  }
});

// ════════════════════════════════════════════════════════════════
// 16. INICIALIZACIÓN (init / resize)
// ════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════
// 17. AUDIO — SÍNTESIS DE SONIDOS
// ════════════════════════════════════════════════════════════════
let audioCtx = null;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playPop(freq = 440, duration = 0.08, vol = 0.18) {
  const ac = getAudio();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, ac.currentTime + duration);
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

function playWhoosh(vol = 0.12) {
  const ac = getAudio();
  const buf = ac.createBuffer(1, ac.sampleRate * 0.25, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, ac.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.25);
  filter.Q.value = 0.8;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start();
}

function playReveal() {
  [220, 330, 440, 550].forEach((freq, i) => {
    setTimeout(() => playPop(freq, 0.35, 0.10), i * 60);
  });
}

function playFormaNote(i) {
  const notes = [523, 587, 659, 784, 880];
  const freq = notes[i % notes.length];
  playPop(freq, 0.25, 0.08);
}

function playColorNote(color) {
  const notesByColor = {
    '#F4A724': 587, '#3FBDD4': 659, '#E5382E': 494, '#4BAF6E': 740, '#F4C024': 880,
    '#D9622B': 587, '#2E9AAE': 659, '#C7372C': 494, '#3F8F5A': 740, '#E8B428': 880,
    '#5B6FE0': 659,
  };
  const freq = notesByColor[color] || 600;
  playPop(freq, 0.18, 0.09);
}

function playPollinateChime() {
  // arpegio ascendente corto: claramente distinto del "pop" de plantar
  // normal, para que la polinización se sienta como un descubrimiento.
  [660, 880, 1108, 1318].forEach((freq, i) => {
    setTimeout(() => playPop(freq, 0.22, 0.08), i * 55);
  });
}

function playReject() {
  // sonido corto y descendente: feedback claro de "no encaja aquí"
  const ac = getAudio();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(260, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ac.currentTime + 0.14);
  gain.gain.setValueAtTime(0.09, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.14);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.14);
}

function playSuccessChord() {
  [523, 659, 784, 1046].forEach((freq, i) => {
    setTimeout(() => playPop(freq, 0.3, 0.13), i * 70);
  });
}

function playRoundChord() {
  [392, 494, 587].forEach((freq, i) => {
    setTimeout(() => playPop(freq, 0.22, 0.1), i * 60);
  });
}

function playBurst() {
  playPop(rnd(300, 600), 0.12, 0.14);
}

function playSplashEnter() {
  [261, 329, 392].forEach((f, i) => {
    setTimeout(() => playPop(f, 0.2, 0.09), i * 80);
  });
}

// ════════════════════════════════════════════════════════════════
// 18. AUDIO — CONEXIÓN DE SONIDOS A INTERACCIONES (patch)
// ════════════════════════════════════════════════════════════════
splashBtn.addEventListener('click', () => playSplashEnter(), true);

const _origFling = flingTile;
window.flingTile = function(div, idx, ox, oy) {
  playWhoosh(0.1);
  _origFling(div, idx, ox, oy);
};

const _origCheckReveal = checkReveal;
window.checkReveal = function() {
  const before = phase;
  _origCheckReveal();
  if (phase !== before && phase === 'revealing') playReveal();
};

const _origSpawnForma = spawnForma;
window.spawnForma = function() {
  _origSpawnForma();
  WORD.split('').forEach((_, i) => {
    setTimeout(() => playFormaNote(i), i * 90 + 400);
  });
};

const _origAdvanceTangram = advanceTangram;
window.advanceTangram = function() {
  if (tangramRound < TANGRAM_ROUNDS) playRoundChord();
  _origAdvanceTangram();
};

const _origBurst = burst;
window.burst = function(cx, cy, n) {
  playBurst();
  _origBurst(cx, cy, n);
};

document.addEventListener('mousedown', e => {
  if (e.target.closest('.tile') && phase === 'mosaic') {
    playPop(600, 0.04, 0.06);
  }
});