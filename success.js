// Simple fireworks + flowers
const canvas = document.getElementById('fwCanvas');
const ctx = canvas.getContext('2d');
let cw, ch;
function resize(){cw=canvas.width=window.innerWidth;ch=canvas.height=window.innerHeight}
window.addEventListener('resize',resize);resize();

// particle arrays
let fireworks = [];
let particles = [];

function rand(min,max){return Math.random()*(max-min)+min}

class Firework{
  constructor(x,y,tx,ty){this.x=x;this.y=y;this.tx=tx;this.ty=ty;this.speed=rand(6,10);this.angle=Math.atan2(ty-y,tx-x);this.vx=Math.cos(this.angle)*this.speed;this.vy=Math.sin(this.angle)*this.speed;this.trail=[]}
  update(){this.trail.push({x:this.x,y:this.y});if(this.trail.length>8)this.trail.shift();this.x+=this.vx;this.y+=this.vy;const dist=Math.hypot(this.tx-this.x,this.ty-this.y);if(dist<10){this.explode();return true}return false}
  draw(){ctx.beginPath();for(let i=0;i<this.trail.length-1;i++){const a=this.trail[i],b=this.trail[i+1];ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)}ctx.strokeStyle='rgba(255,220,230,0.9)';ctx.lineWidth=2;ctx.stroke()}
  explode(){const hue=rand(0,360);for(let i=0;i<180;i++){particles.push(new Particle(this.x,this.y,rand(2,9),rand(0,Math.PI*2),hue))}spawnFlowers(this.x,this.y,6)}
}
class Particle{
  constructor(x,y,speed,angle,hue){this.x=x;this.y=y;this.vx=Math.cos(angle)*speed;this.vy=Math.sin(angle)*speed;this.life=rand(60,140);this.age=0;this.hue=hue;this.size=rand(1.5,4)}
  update(){this.vy+=0.06;this.vx*=0.995;this.x+=this.vx;this.y+=this.vy;this.age++}
  draw(){const t=1-this.age/this.life;ctx.beginPath();ctx.fillStyle=`hsla(${this.hue},95%,60%,${t})`;ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill()}
}

function spawnFirework(){const sx=rand(cw*0.05,cw*0.95);const sy=ch;const tx=rand(cw*0.12,cw*0.88);const ty=rand(ch*0.06,ch*0.6);fireworks.push(new Firework(sx,sy,tx,ty))}
function spawnFlowers(x,y,count=6){const flowers = ['🌸','🌺','🌼','💐','🌷','🌻','💮'];for(let i=0;i<count;i++){const el=document.createElement('div');el.className='flower';el.textContent=flowers[Math.floor(Math.random()*flowers.length)];el.style.left=(x+rand(-90,90))+'px';el.style.top=(y+rand(-90,90))+'px';el.style.animationDelay=(Math.random()*0.7)+'s';document.getElementById('flowers').appendChild(el);setTimeout(()=>el.remove(),7000)}}

// auto spawn loop
let spawnTimer=0;function loop(){ctx.clearRect(0,0,cw,ch);
  // ambient spawn rate higher to fill the page (dense)
  if(Math.random()<0.12) spawnFirework();
  for(let i=fireworks.length-1;i>=0;i--){const f=fireworks[i];f.draw();if(f.update())fireworks.splice(i,1)}
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.update();p.draw();if(p.age>p.life)particles.splice(i,1)}
  // cap arrays to avoid runaway memory
  const MAX_PARTICLES = 3500;
  if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
  const MAX_FIREWORKS = 120;
  if (fireworks.length > MAX_FIREWORKS) fireworks.splice(0, fireworks.length - MAX_FIREWORKS);
  requestAnimationFrame(loop)
}
loop();

// click to create a burst of fireworks
window.addEventListener('click',e=>{for(let i=0;i<8;i++){fireworks.push(new Firework(rand(Math.max(0,e.clientX-220),Math.min(cw,e.clientX+220)),ch,e.clientX+rand(-160,160),e.clientY+rand(-160,160)));}})

// periodic bursts to keep the screen lively
const burstInterval = setInterval(()=>{ for(let i=0;i<6;i++) spawnFirework(); }, 600);
setTimeout(()=>clearInterval(burstInterval),180000);

// Back button
const backBtn = document.getElementById('backBtn');
if(backBtn) backBtn.addEventListener('click', ()=>{window.location.href='index.html'});
