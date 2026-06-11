const figures = document.querySelectorAll('.floating');

document.addEventListener('mousemove', (e)=>{

const x = e.clientX / window.innerWidth - 0.5;
const y = e.clientY / window.innerHeight - 0.5;

figures.forEach((item,index)=>{

const speed = (index + 1) * 12;

item.style.transform =
`
translate3d(
${x * speed}px,
${y * speed}px,
${speed}px
)
rotateX(${y*30}deg)
rotateY(${x*30}deg)
`;

});

});


window.addEventListener('scroll',()=>{

const scroll = window.scrollY;

document.querySelectorAll('.floating').forEach((item,index)=>{

const speed = (index + 1) * 0.15;

item.style.top =
parseFloat(item.dataset.base || item.offsetTop)
+
(scroll * speed)
+
'px';

});

});