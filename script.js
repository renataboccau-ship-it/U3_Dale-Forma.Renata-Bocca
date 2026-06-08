/* PARALLAX MOUSE */

const shapes = document.querySelectorAll(".shape");

document.addEventListener("mousemove",(e)=>{

const x = e.clientX / window.innerWidth;
const y = e.clientY / window.innerHeight;

shapes.forEach((shape,index)=>{

const speed = (index + 1) * 15;

shape.style.transform =
`translate(
${x * speed}px,
${y * speed}px
)`;

});

});


/* SCROLL REVEAL */

const reveals = document.querySelectorAll("section");

window.addEventListener("scroll",()=>{

reveals.forEach(section=>{

const top = section.getBoundingClientRect().top;

if(top < window.innerHeight - 150){

section.classList.add("active");

}

});

});


/* DECONSTRUCCIÓN */

window.addEventListener("scroll",()=>{

const figure = document.querySelector(".figure");

const value = window.scrollY;

figure.style.transform =
`rotate(${value * .05}deg)
scale(${1 + value * .0002})`;

});


/* PIEZAS FLOTANDO */

shapes.forEach((shape,index)=>{

setInterval(()=>{

shape.animate([
{
transform:`translateY(0px)`
},
{
transform:`translateY(-15px)`
},
{
transform:`translateY(0px)`
}
],{

duration:3000 + index * 500,
iterations:Infinity

});

},100);

});