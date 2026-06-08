const pieces =
document.querySelectorAll(".floating-piece");

document.addEventListener("mousemove",(e)=>{

const x =
(e.clientX/window.innerWidth)-0.5;

const y =
(e.clientY/window.innerHeight)-0.5;

pieces.forEach((piece,index)=>{

const speed = (index + 1) * 10;

piece.style.transform =
`translate(
${x*speed}px,
${y*speed}px
)`;

});

});