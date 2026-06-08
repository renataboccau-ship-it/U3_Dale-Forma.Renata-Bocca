const pieces = document.querySelectorAll(
    ".floating-piece, .bar1, .bar2"
);

document.addEventListener("mousemove", (e) => {

    const mouseX =
        (e.clientX / window.innerWidth - 0.5);

    const mouseY =
        (e.clientY / window.innerHeight - 0.5);

    pieces.forEach((piece, index) => {

        const speed = (index + 1) * 4;

        piece.style.transform = `
            translate(
                ${mouseX * speed}px,
                ${mouseY * speed}px
            )
        `;

    });

});