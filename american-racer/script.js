// ======= American Racer (fixed restart reset + overlay) =======
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const crashEl = document.getElementById('crash');
const speedEl = document.getElementById('speed');

const btnStart     = document.getElementById('btnStart');
const btnPause     = document.getElementById('btnPause');
const overlay      = document.getElementById('overlay');
const overlayStart = document.getElementById('overlayStart');

const lanes = [70,150,230,310];
const carW = 46, carH = 78;

const S = {
  running:false, started:false,
  score:0, crash:0, speed:1,
  player:{x:lanes[1]-carW/2, y:canvas.height-carH-20, w:carW, h:carH, color:getCss('--player')},
  enemies:[], coins:[], lastEnemy:0, lastCoin:0
};

function getCss(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

// ---------- Overlay helpers ----------
function hideOverlay(){ overlay.classList.add('hidden'); overlay.setAttribute('aria-hidden','true'); }
function showOverlay(mode){
  overlay.classList.remove('hidden'); overlay.removeAttribute('aria-hidden');
  const h2 = overlay.querySelector('h2');
  const rules = overlay.querySelectorAll('.rules');
  if(mode === 'gameover'){
    h2.textContent = 'Game Over';
    rules[0].textContent = `Your Score: ${S.score}`;
    rules[1].innerHTML   = 'Press <kbd>Space</kbd> or click <strong>Start</strong> to play again';
  } else {
    h2.textContent = 'How to Play';
    rules[0].innerHTML = 'Use <kbd>←</kbd> <kbd>→</kbd> to steer. Avoid <span style="color:var(--enemy)">red cars</span>.';
    rules[1].innerHTML = 'Collect <span style="color:var(--coin)">coins</span> for +10 points. Game ends after <strong>5 crashes</strong>.';
  }
}

// ---------- Controls ----------
const keys = new Set();
addEventListener('keydown', e=>{
  const k = e.key.toLowerCase();
  if(k==='arrowleft'||k==='arrowright') keys.add(k);
  if(e.code==='Space'){ start(); e.preventDefault(); }     // ← 空白鍵 = 開新局
});
addEventListener('keyup', e=> keys.delete(e.key.toLowerCase()));

btnStart.onclick     = start;   // ← Start = 開新局（總是重置）
overlayStart.onclick = start;
btnPause.onclick     = ()=> toggle();

// ---------- Game flow ----------
function resetState(){
  S.score = 0;
  S.crash = 0;
  S.speed = 1;
  S.enemies = [];
  S.coins   = [];
  S.lastEnemy = 0;
  S.lastCoin  = 0;
  S.player.x  = lanes[1]-carW/2;
}

function start(){
  resetState();                 // ← 每次開始都重置分數/撞擊數/敵人/金幣
  S.started = true;
  S.running = true;
  hideOverlay();                // ← 收起規則 / 失敗畫面
  // 立即同步 HUD（不用等下一幀）
  scoreEl.textContent = 0;
  crashEl.textContent = 0;
  speedEl.textContent = '1x';
}

function toggle(){ if(!S.started) return; S.running = !S.running; }

// ---------- Spawning（障礙較少） ----------
function trySpawn(t){
  if(t - S.lastEnemy > rand(900,1400)){
    S.lastEnemy = t;
    const lane = lanes[Math.floor(Math.random()*lanes.length)];
    S.enemies.push({x:lane-carW/2, y:-carH, w:carW, h:carH, color:getCss('--enemy')});
  }
  if(t - S.lastCoin > rand(2200,3200)){
    S.lastCoin = t;
    const lane = lanes[Math.floor(Math.random()*lanes.length)];
    S.coins.push({x:lane-14, y:-28, r:14});
  }
}

// ---------- Draw helpers ----------
function rand(a,b){ return Math.random()*(b-a)+a; }
function rect(x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(x,y,w,h); }
function roundedRect(x,y,w,h,r,c){
  ctx.fillStyle=c; ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.fill();
}
function drawRoad(time){
  rect(0,0,canvas.width,canvas.height,getCss('--road'));
  rect(0,0,10,canvas.height,getCss('--edge'));
  rect(canvas.width-10,0,10,canvas.height,getCss('--edge'));
  ctx.strokeStyle=getCss('--line'); ctx.lineWidth=6; ctx.setLineDash([26,30]);
  ctx.beginPath(); ctx.moveTo(canvas.width/2,(time/8)%56-56);
  ctx.lineTo(canvas.width/2,canvas.height+56); ctx.stroke(); ctx.setLineDash([]);
}
function drawCar(x,y,color){
  const r=10;
  roundedRect(x,y,carW,carH,r,color);
  const win=getCss('--win');
  roundedRect(x+8,y+10,carW-16,18,6,win);
  roundedRect(x+8,y+36,carW-16,14,5,win);
  rect(x+carW/2-2,y+12,4,carH-24,getCss('--chrome'));
  ctx.fillStyle='#111';
  roundedRect(x-6,y+14,10,22,4,'#111'); roundedRect(x+carW-4,y+14,10,22,4,'#111');
  roundedRect(x-6,y+carH-36,10,22,4,'#111'); roundedRect(x+carW-4,y+carH-36,10,22,4,'#111');
  rect(x+10,y-4,8,6,'#fff8c2'); rect(x+carW-18,y-4,8,6,'#fff8c2');
  rect(x+10,y+carH-2,10,4,'rgba(255,80,80,.9)'); rect(x+carW-20,y+carH-2,10,4,'rgba(255,80,80,.9)');
}
function drawCoin(c){
  const grd=ctx.createRadialGradient(c.x+c.r*0.3,c.y-c.r*0.3,c.r*0.2, c.x,c.y,c.r);
  grd.addColorStop(0,'#fff6b3'); grd.addColorStop(1,getCss('--coin'));
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(c.x+c.r*0.3,c.y-c.r*0.35,c.r*0.25,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(c.x-6,c.y-2,12,4);
}

// ---------- Collision ----------
function hitRect(a,b){ return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y; }
function hitCircleRect(c,r){
  const cx=Math.max(r.x,Math.min(c.x,r.x+r.w));
  const cy=Math.max(r.y,Math.min(c.y,r.y+r.h));
  const dx=c.x-cx, dy=c.y-cy;
  return dx*dx+dy*dy <= c.r*c.r;
}

// ---------- Main loop ----------
let last = performance.now();
function loop(now){
  const dt = Math.min(0.03, (now-last)/1000); last = now;
  drawRoad(now*0.1);

  if(S.running){
    trySpawn(now);

    const step = 220*dt*S.speed;
    if(keys.has('arrowleft'))  S.player.x -= step;
    if(keys.has('arrowright')) S.player.x += step;
    S.player.x = Math.max(18, Math.min(canvas.width-carW-18, S.player.x));

    for(const e of S.enemies) e.y += 220*dt*S.speed;
    for(const c of S.coins)   c.y += 220*dt*S.speed;

    for(let i=S.enemies.length-1;i>=0;i--){
      const e=S.enemies[i];
      if(hitRect(S.player,e)){
        S.enemies.splice(i,1);
        S.crash++;
        if(S.crash>=5){ S.running=false; showOverlay('gameover'); }
      }
    }
    for(let i=S.coins.length-1;i>=0;i--){
      const c=S.coins[i];
      if(hitCircleRect({x:c.x,y:c.y,r:c.r}, S.player)){
        S.coins.splice(i,1);
        S.score += 10;
      }
    }

    S.enemies = S.enemies.filter(e=>e.y<canvas.height+100);
    S.coins   = S.coins.filter(c=>c.y<canvas.height+100);
    S.score  += Math.floor(20*dt*S.speed);
  }

  for(const c of S.coins)   drawCoin(c);
  for(const e of S.enemies) drawCar(e.x,e.y,e.color);
  drawCar(S.player.x,S.player.y,S.player.color);

  scoreEl.textContent = S.score;
  crashEl.textContent = S.crash;
  speedEl.textContent = S.speed + 'x';

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// 進入頁面先顯示規則
showOverlay('rules');
