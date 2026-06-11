const figures = document.querySelectorAll('.floating');
const logo = document.querySelector('.logo');

/* Guardar posición inicial para el efecto scroll */
figures.forEach(item => {
    item.dataset.base = item.offsetTop;
});

/* Movimiento con mouse */
document.addEventListener('mousemove', (e) => {

    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;

    /* Formas flotantes */
    figures.forEach((item, index) => {

        const speed = (index + 1) * 12;

        item.style.transform = `
            translate3d(
                ${x * speed}px,
                ${y * speed}px,
                ${speed}px
            )
            rotateX(${y * 30}deg)
            rotateY(${x * 30}deg)
        `;
    });

    /* Logo */
    if (logo) {
        logo.style.transform = `
            translate(${x * 20}px, ${y * 20}px)
            rotateX(${y * 20}deg)
            rotateY(${x * 20}deg)
            scale(1.05)
        `;
    }

});

/* Efecto scroll */
window.addEventListener('scroll', () => {

    const scroll = window.scrollY;

    figures.forEach((item, index) => {

        const speed = (index + 1) * 0.15;

        item.style.top =
            parseFloat(item.dataset.base) +
            (scroll * speed) +
            'px';
    });

});