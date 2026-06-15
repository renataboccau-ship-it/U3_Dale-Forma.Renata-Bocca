/* ===================================================
   DALE FORMA — script.js
=================================================== */

/* ---- Elementos ---- */
const figures  = document.querySelectorAll('.floating');
const logo     = document.querySelector('.logo');
const letras   = document.querySelectorAll('.letra');
const reveals  = document.querySelectorAll('[data-reveal]');

/* =====================================================
   PARALLAX CON MOUSE
===================================================== */
document.addEventListener('mousemove', (e) => {

    const x = e.clientX / window.innerWidth  - 0.5;   // -0.5 → 0.5
    const y = e.clientY / window.innerHeight - 0.5;

    /* Formas flotantes — cada una tiene velocidad distinta */
    figures.forEach((item, i) => {
        const spd = (i + 1) * 14;
        item.style.transform = `
            translate3d(${x * spd}px, ${y * spd}px, ${spd * 0.5}px)
            rotateX(${y * 25}deg)
            rotateY(${x * 25}deg)
        `;
    });

    /* Logo 3‑D suave */
    if (logo) {
        logo.style.transform = `
            translate(${x * 18}px, ${y * 18}px)
            rotateX(${y * 18}deg)
            rotateY(${x * 18}deg)
            scale(1.04)
        `;
    }

    /* Letras FORMA — reacción leve al mouse */
    letras.forEach((l, i) => {
        const factor = (i - 2) * 6;   // -12, -6, 0, 6, 12
        l.style.transform = `
            translate(${x * factor}px, ${y * 10}px)
        `;
    });

});

/* Resetear cuando el mouse sale */
document.addEventListener('mouseleave', () => {
    figures.forEach(item => { item.style.transform = ''; });
    if (logo) logo.style.transform = '';
    letras.forEach(l => { l.style.transform = ''; });
});


/* =====================================================
   PARALLAX SCROLL — formas flotantes
===================================================== */

/* Guardar top inicial de cada forma */
figures.forEach(item => {
    item.dataset.baseTop = item.offsetTop;
});

let ticking = false;

window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
        const scroll = window.scrollY;

        figures.forEach((item, i) => {
            const speed = (i % 5 + 1) * 0.18;
            const base  = parseFloat(item.dataset.baseTop) || 0;
            // Solo mover si está en el viewport extendido
            if (Math.abs(item.getBoundingClientRect().top) < window.innerHeight * 2) {
                item.style.top = (base + scroll * speed) + 'px';
            }
        });

        ticking = false;
    });
    ticking = true;
});


/* =====================================================
   REVEAL ON SCROLL
===================================================== */
const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Escalonado sutil
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, i * 120);
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
);

reveals.forEach(el => revealObserver.observe(el));


/* =====================================================
   TIMER INTERACTIVO (demo visual en paso 02)
===================================================== */
const timerNum  = document.querySelector('.timer-num');
const ringProg  = document.querySelector('.ring-progress');

if (timerNum && ringProg) {
    let count      = 60;
    const total    = 163;   // circunferencia del círculo r=26

    function animateTick() {
        count--;
        if (count < 0) count = 60;

        timerNum.textContent = count;

        const offset = total * (1 - count / 60);
        ringProg.style.strokeDashoffset = offset;
    }

    // Sincronizar con la animación CSS (4 s por vuelta = ~66 ms por tick)
    setInterval(animateTick, 66);
}


/* =====================================================
   HOVER 3‑D EN TARJETAS (paso, piezas, fichas)
===================================================== */
const cards3d = document.querySelectorAll('.pieza-card, .carta-mockup');

cards3d.forEach(card => {

    card.addEventListener('mousemove', (e) => {
        const rect   = card.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = (e.clientX - cx) / (rect.width  / 2);
        const dy     = (e.clientY - cy) / (rect.height / 2);

        card.style.transform = `
            perspective(600px)
            rotateY(${dx * 12}deg)
            rotateX(${-dy * 12}deg)
            translateY(-10px)
            scale(1.04)
        `;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});


/* =====================================================
   SMOOTH SCROLL para botones ancla
===================================================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});


/* =====================================================
   ANIMACIÓN DE ENTRADA DEL HERO
===================================================== */
window.addEventListener('load', () => {

    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity    = '0';
        heroContent.style.transform  = 'translateY(30px)';
        heroContent.style.transition = 'opacity .8s ease .3s, transform .8s cubic-bezier(.34,1.56,.64,1) .3s';

        requestAnimationFrame(() => {
            heroContent.style.opacity   = '1';
            heroContent.style.transform = 'translateY(0)';
        });
    }

    /* Formas flotantes — entrada escalonada */
    figures.forEach((fig, i) => {
        fig.style.opacity    = '0';
        fig.style.transition = `opacity .5s ease ${i * 0.08 + 0.5}s, transform .2s ease-out`;
        setTimeout(() => { fig.style.opacity = '1'; }, (i * 80) + 500);
    });

});

// ── Sandbox piezas arrastrables ──────────────────────
(function () {
    const sandbox = document.getElementById('aboutSandbox');
    if (!sandbox) return;

    let dragging = null, ox = 0, oy = 0;

    sandbox.querySelectorAll('.ab-piece').forEach(el => {

        // Mouse
        el.addEventListener('mousedown', e => {
            e.preventDefault();
            startDrag(el, e.clientX, e.clientY);
        });

        // Touch
        el.addEventListener('touchstart', e => {
            e.preventDefault();
            const t = e.touches[0];
            startDrag(el, t.clientX, t.clientY);
        }, { passive: false });
    });

    function startDrag(el, cx, cy) {
        dragging = el;
        const er = el.getBoundingClientRect();
        ox = cx - er.left;
        oy = cy - er.top;
        el.classList.add('is-drag');
    }

    function moveDrag(cx, cy) {
        if (!dragging) return;
        const r = sandbox.getBoundingClientRect();
        let x = cx - r.left - ox;
        let y = cy - r.top  - oy;
        x = Math.max(0, Math.min(x, sandbox.offsetWidth  - dragging.offsetWidth));
        y = Math.max(0, Math.min(y, sandbox.offsetHeight - dragging.offsetHeight));
        dragging.style.left = x + 'px';
        dragging.style.top  = y + 'px';
    }

    function stopDrag() {
        if (!dragging) return;
        dragging.classList.remove('is-drag');
        dragging = null;
    }

    document.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
    document.addEventListener('mouseup',   stopDrag);

    document.addEventListener('touchmove', e => {
        e.preventDefault();
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    document.addEventListener('touchend', stopDrag);
})();