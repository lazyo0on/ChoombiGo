const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 4000;

let canvas, ctx, minimapCanvas, minimapCtx;
let camera = { x: 0, y: 0 };
let currentGameState = 'start'; // start, playing, dialogue, inventory, gameover, victory
let animationId;
let keys = {};
let spacePressed = false;

const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    inventory: document.getElementById('inventory-modal'),
    gameOver: document.getElementById('game-over-screen'),
    victory: document.getElementById('victory-screen')
};

const ui = {
    speedStatus: document.getElementById('speed-status'),
    talismanCount: document.getElementById('talisman-count'),
    hintList: document.getElementById('hint-list'),
    dialogueBox: document.getElementById('dialogue-box'),
    speakerName: document.getElementById('speaker-name'),
    dialogueText: document.getElementById('dialogue-text'),
    choicesContainer: document.getElementById('choices-container'),
    invDetails: document.getElementById('inventory-details')
};

// Player setup
const player = {
    x: 2000, y: 2000, width: 40, height: 40,
    baseSpeed: 2.5, speed: 2.5,
    color: '#3498db', talismans: 0, speedTimer: 0
};

// Buildings (Palace Layout - Walls)
const buildings = [
    {x: 0, y: 0, w: WORLD_WIDTH, h: 50, color: '#8f3e3e'},
    {x: 0, y: 0, w: 50, h: WORLD_HEIGHT, color: '#8f3e3e'},
    {x: WORLD_WIDTH - 50, y: 0, w: 50, h: WORLD_HEIGHT, color: '#8f3e3e'},
    {x: 0, y: WORLD_HEIGHT - 50, w: WORLD_WIDTH, h: 50, color: '#8f3e3e'},
    {x: 500, y: 500, w: 800, h: 600, color: '#3a4040'},
    {x: 1800, y: 400, w: 1000, h: 500, color: '#3a4040'},
    {x: 800, y: 2000, w: 600, h: 400, color: '#3a4040'},
    {x: 2200, y: 2500, w: 800, h: 800, color: '#3a4040'},
    {x: 2800, y: 1200, w: 400, h: 600, color: '#3a4040'}
];

// Data from 기획서
const ghostTemplates = [
    { emoji: "👻", name: "고려의 망령", keyword: "[과전법]", 
      dialogue: "신진 사대부들이 과전법을 실시해 권문세족에게 토지를 더 퍼주어, 나 같은 백성은 땅을 잃고 굶어 죽었소!", 
      choices: [{text:"정말 나쁜 사대부들이군."}, {text:"네 땅을 빼앗기다니 안타깝다."}],
      hintId: "h1", hintName: "과전법 시행 문서", hintDetail: "거짓말! 과전법은 권문세족의 토지를 몰수하여 신진 사대부의 경제 기반을 마련하고 백성에게 토지를 재분배한 개혁이다!" },
    { emoji: "⚔️", name: "무사의 원혼", keyword: "[사병 혁파]", 
      dialogue: "태종 전하께서 왕족과 공신들에게 사병을 대폭 늘리라고 명하셔서, 혹독하게 훈련받다 과로사로 죽었소!", 
      choices: [{text:"과도한 훈련은 위험하지."}, {text:"왕이 너무 무자비하군."}],
      hintId: "h2", hintName: "사병 혁파 명령서", hintDetail: "거짓말! 태종은 왕권 강화를 위해 모든 사병을 혁파(폐지)하고 군대를 국가로 귀속시켰다!" },
    { emoji: "📜", name: "양반의 원혼", keyword: "[호패법]", 
      dialogue: "태종 때 여자와 노비들에게만 신분증을 차고 다니라는 기괴한 법을 만들어 억울하게 처벌받았소!", 
      choices: [{text:"쓸데없는 증명서구만."}, {text:"노비에게까지 그걸 채우다니 너무하네."}],
      hintId: "h3", hintName: "호패", hintDetail: "거짓말! 호패법은 16세 이상 '모든 남자'에게 신분과 관계없이 호패를 차게 한 제도다!" },
    { emoji: "👴", name: "늙은 학사의 원혼", keyword: "[집현전과 경연]", 
      dialogue: "세종 전하께선 학사들의 말은 듣지도 않고 무조건 왕의 명령만 따르라며 폭정을 휘둘러 내가 홧병에 죽었소!", 
      choices: [{text:"왕이 독단적이면 신하가 고생이지."}, {text:"폭정에 희생되다니 불쌍하군."}],
      hintId: "h4", hintName: "경연 일기", hintDetail: "거짓말! 세종은 집현전 학사들과 '경연'을 열어 끊임없이 토론하며 왕권과 신권의 조화를 이루었다!" },
    { emoji: "🧓", name: "전직 관리의 원혼", keyword: "[직전법]", 
      dialogue: "세조 전하가 전직 관리들에게 토지를 싹쓸이로 나누어 주어, 현직이었던 나는 땅을 뺏겨 굶어 죽었소!", 
      choices: [{text:"현직 관리의 설움이 크군."}, {text:"전직들이 다 가져가다니 너무하오."}],
      hintId: "h5", hintName: "직전법 교서", hintDetail: "거짓말! 직전법은 국가의 토지 부족을 해결하기 위해 오직 '현직 관리'에게만 토지를 지급한 제도다!" },
    { emoji: "😈", name: "탐관오리의 원혼", keyword: "[경국대전]", 
      dialogue: "성종 때까지 조선에는 나라를 다스릴 법전이 하나도 없어서, 윗선 맘대로 나를 처형했소!", 
      choices: [{text:"법이 없으니 억울한 일투성이겠군."}, {text:"원칙 없는 처형이라니 너무하오."}],
      hintId: "h6", hintName: "경국대전", hintDetail: "거짓말! 성종 때 조선의 기본 법전인 『경국대전』이 완성되어 체계적인 통치 체제가 확립되었다!" },
    { emoji: "⚖️", name: "억울한 관리의 원혼", keyword: "[3사]", 
      dialogue: "조선은 권신들의 비리를 비판할 언론 기관이 전혀 없어서 억울하게 누명을 쓰고 죽었소!", 
      choices: [{text:"누구도 감시하지 않으니 썩을 수밖에."}, {text:"언로가 막혀 억울했겠군."}],
      hintId: "h7", hintName: "3사의 탄핵 상소문", hintDetail: "거짓말! 조선에는 감찰, 간쟁, 자문을 담당하는 3사(사헌부, 사간원, 홍문관)가 있어 권력 독점을 막았다!" },
    { emoji: "🖌️", name: "비서의 원혼", keyword: "[승정원과 의금부]", 
      dialogue: "나는 왕명 전달 비서 기관인 '의금부' 관원인데, 반역자 심문 억지 명령에 과로사했소!", 
      choices: [{text:"비서에게 심문을 시키다니 왕이 잘못했네."}, {text:"무리한 업무 지시로 과로사라니..."}],
      hintId: "h8", hintName: "승정원 일기", hintDetail: "거짓말! 왕의 비서 기관은 '승정원'이고, 중죄인을 다루는 사법 기관이 '의금부'다!" },
    { emoji: "🏘️", name: "향리의 원혼", keyword: "[유향소]", 
      dialogue: "조선엔 양반들이 수령을 돕거나 향리를 감찰할 기구가 아예 없어 억울하게 처벌받았소!", 
      choices: [{text:"수령이 지방을 모르면 향촌이 고생이지."}, {text:"지방 양반들의 권리가 없었군."}],
      hintId: "h9", hintName: "유향소 향약 문서", hintDetail: "거짓말! 조선에는 지방 양반 자치 기구인 '유향소'가 있어 수령을 보좌하고 향리를 감시했다." },
    { emoji: "🧑‍🌾", name: "천민의 원혼", keyword: "[군역]", 
      dialogue: "나는 천민 노비인데, 천민 남자도 전부 군역 의무가 있다며 끌려가 전사했소!", 
      choices: [{text:"천민에게까지 군역을 지우다니 가혹하오."}, {text:"원치 않는 전쟁터에서 죽다니..."}],
      hintId: "h10", hintName: "양인 군적 대장", hintDetail: "거짓말! 조선의 군역은 16~60세의 '양인 남자'에게만 부과되었고, 천민은 의무가 없었다!" },
    { emoji: "🥶", name: "개척민의 원혼", keyword: "[사민 정책]", 
      dialogue: "세종께서 남쪽 백성이 북방 가는 걸 금지해, 4군 6진 군인인 나 홀로 외롭게 얼어 죽었소!", 
      choices: [{text:"남쪽 백성의 이주를 막으니 외로웠겠군."}, {text:"춥고 쓸쓸한 방어전이었겠어."}],
      hintId: "h11", hintName: "사민 정책 장부", hintDetail: "거짓말! 세종은 남부 백성들을 북방으로 이주시키는 '사민 정책'으로 4군 6진을 백성과 함께 개척했다!" },
    { emoji: "🗺️", name: "외교관의 원혼", keyword: "[요동 정벌]", 
      dialogue: "건국 직후 명나라와 사이가 너무 좋아 조공을 바치러 갔다가 사고로 죽었소!", 
      choices: [{text:"사이가 좋은데 무리한 조공을 바쳤군."}, {text:"먼 길 가다가 사고를 당하다니..."}],
      hintId: "h12", hintName: "요동 정벌 계획서", hintDetail: "거짓말! 건국 초기에는 정도전이 명나라 요동 정벌을 추진하는 등 갈등이 심했다!" },
    { emoji: "🐎", name: "여진족의 원혼", keyword: "[교린 정책]", 
      dialogue: "조선은 우릴 무조건 토벌하고 강경 진압만 해서, 항복하려던 나까지 억울하게 죽였소!", 
      choices: [{text:"무조건 죽이기만 하다니 잔인하군."}, {text:"항복할 기회도 안 주다니 무자비하오."}],
      hintId: "h13", hintName: "여진족 관직 임명장", hintDetail: "거짓말! 조선은 강경책뿐 아니라 관직과 토지를 주어 귀순을 장려하는 '회유책'도 함께 썼다!" },
    { emoji: "💰", name: "상인의 원혼", keyword: "[3포 개방]", 
      dialogue: "쓰시마 토벌 이후 일본과 무역을 100% 끊어버려서 상인인 나는 굶어 죽었소!", 
      choices: [{text:"무역을 100% 끊어버리면 상인은 어쩌란 말이오."}, {text:"먹고 살 길이 막막했겠군."}],
      hintId: "h14", hintName: "3포 개방 조약문", hintDetail: "거짓말! 조선은 왜구 토벌 이후에도 부산포 등 '3포를 개방'해 제한적 무역을 허용했다!" },
    { emoji: "⛵", name: "역관의 원혼", keyword: "[동남아시아 교류]", 
      dialogue: "조선은 명나라하고만 교류하고 타국과 단절해, 류큐(오키나와) 상인과 거래하다 처형되었소!", 
      choices: [{text:"명나라만 바라보는 우물 안 개구리 정책이군."}, {text:"억울하게 스파이로 몰렸네."}],
      hintId: "h15", hintName: "류큐 교역 기록", hintDetail: "거짓말! 조선은 명나라 외에도 류큐, 시암, 자와 등 동남아 여러 나라와 활발히 교류했다!" }
];

let ghosts = [];
let hints = [];
let items = [];
let collectedHints = [];
let interactingGhost = null;

let itemRespawnTimer = 0;
const ITEM_RESPAWN_INTERVAL = 5000; // spawn items faster (every 5s)
const MAX_ITEMS = 15; // increased max items
let toastTimeout = null;

// Helpers
function isCollidingRects(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}
function isColliding(rect1, rect2) {
    return isCollidingRects(rect1.x, rect1.y, rect1.width, rect1.height, rect2.x, rect2.y, rect2.width, rect2.height);
}
function checkBuildingCollision(x, y, w, h) {
    for (let b of buildings) {
        if (isCollidingRects(x, y, w, h, b.x, b.y, b.w, b.h)) return true;
    }
    return false;
}
function getValidSpawnPos(w, h) {
    let x, y, collides;
    do {
        x = Math.random() * (WORLD_WIDTH - 200) + 100;
        y = Math.random() * (WORLD_HEIGHT - 200) + 100;
        collides = checkBuildingCollision(x, y, w, h);
    } while (collides);
    return {x, y};
}

let ghostImages = [];
for (let i = 1; i <= 15; i++) {
    let img = new Image();
    img.src = `images/ghost_${i}.png`;
    let processedCanvas = document.createElement('canvas');
    img.onload = () => {
        processedCanvas.width = img.naturalWidth;
        processedCanvas.height = img.naturalHeight;
        let pctx = processedCanvas.getContext('2d');
        pctx.drawImage(img, 0, 0);
        let imgData = pctx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
        for(let j = 0; j < imgData.data.length; j += 4) {
            // Remove white background (RGB > 230)
            if(imgData.data[j] > 230 && imgData.data[j+1] > 230 && imgData.data[j+2] > 230) {
                imgData.data[j+3] = 0; // Alpha = 0
            }
        }
        pctx.putImageData(imgData, 0, 0);
    };
    ghostImages.push(processedCanvas);
}

let groundPattern, roofPattern, wallPattern;

function createTextures() {
    // 1. Ground Texture (Stone paving)
    const gCanvas = document.createElement('canvas');
    gCanvas.width = 64; gCanvas.height = 64;
    const gCtx = gCanvas.getContext('2d');
    gCtx.fillStyle = '#3a3530'; // Dark mortar
    gCtx.fillRect(0, 0, 64, 64);
    for(let y=0; y<64; y+=32) {
        for(let x=0; x<64; x+=32) {
            let offset = (y/32)%2 === 0 ? 0 : 16;
            // Base stone
            gCtx.fillStyle = '#5c554e';
            gCtx.fillRect(x+offset+2, y+2, 28, 28);
            // Highlight
            gCtx.fillStyle = '#787067'; gCtx.fillRect(x+offset+2, y+2, 28, 4);
            gCtx.fillStyle = '#787067'; gCtx.fillRect(x+offset+2, y+2, 4, 28);
            // Shadow
            gCtx.fillStyle = '#403a35'; gCtx.fillRect(x+offset+2, y+26, 28, 4);
            gCtx.fillStyle = '#403a35'; gCtx.fillRect(x+offset+26, y+2, 4, 28);
        }
    }
    // Add some noise for dirt/texture
    for(let i=0; i<100; i++) {
        gCtx.fillStyle = 'rgba(0,0,0,0.2)';
        gCtx.fillRect(Math.random()*64, Math.random()*64, 2, 2);
    }
    groundPattern = ctx.createPattern(gCanvas, 'repeat');

    // 2. Roof Texture (Giwa - Traditional tile roof)
    const rCanvas = document.createElement('canvas');
    rCanvas.width = 32; rCanvas.height = 32;
    const rCtx = rCanvas.getContext('2d');
    rCtx.fillStyle = '#222'; rCtx.fillRect(0, 0, 32, 32);
    for(let x=0; x<32; x+=16) {
        // Shadow and highlight for vertical tiles
        rCtx.fillStyle = '#111'; rCtx.fillRect(x, 0, 8, 32);
        rCtx.fillStyle = '#333'; rCtx.fillRect(x+8, 0, 8, 32);
        
        // Horizontal steps for overlapping tiles
        for(let y=0; y<32; y+=8) {
            rCtx.strokeStyle = '#000'; rCtx.lineWidth = 1;
            rCtx.beginPath(); rCtx.moveTo(x, y+6); rCtx.bezierCurveTo(x+8, y+8, x+16, y+8, x+16, y+6); rCtx.stroke();
            // Tiny highlight on edge
            rCtx.fillStyle = 'rgba(255,255,255,0.15)';
            rCtx.fillRect(x+10, y+5, 4, 2);
        }
    }
    roofPattern = ctx.createPattern(rCanvas, 'repeat');

    // 3. Wall Texture (Traditional brick and mortar)
    const wCanvas = document.createElement('canvas');
    wCanvas.width = 64; wCanvas.height = 64;
    const wCtx = wCanvas.getContext('2d');
    wCtx.fillStyle = '#524840'; wCtx.fillRect(0, 0, 64, 64);
    for(let y=0; y<64; y+=16) {
        let offset = (y/16)%2 === 0 ? 0 : 16;
        for(let x=-16; x<64; x+=32) {
            wCtx.fillStyle = '#8f4b38'; // Red brick
            wCtx.fillRect(x+offset+2, y+2, 28, 12);
            wCtx.fillStyle = '#c7705a'; wCtx.fillRect(x+offset+2, y+2, 28, 2); // Highlight
            wCtx.fillStyle = '#6b3626'; wCtx.fillRect(x+offset+2, y+12, 28, 2); // Shadow
        }
    }
    wallPattern = ctx.createPattern(wCanvas, 'repeat');
}

function initData() {
    ghosts = ghostTemplates.map((t, idx) => {
        let pos = getValidSpawnPos(120, 160); // Doubled size (120x160)
        return {
            id: idx + 1, name: t.name, keyword: t.keyword, emoji: t.emoji, image: ghostImages[idx],
            x: pos.x, y: pos.y, width: 120, height: 160,
            color: `hsl(${idx * 24}, 80%, 65%)`,
            speed: 1, stunned: 0, resolved: false,
            dialogue: t.dialogue,
            choices: t.choices,
            hintRequired: t.hintId
        };
    });

    hints = ghostTemplates.map(t => {
        let pos = getValidSpawnPos(30, 30);
        return {
            id: t.hintId, name: t.hintName, detail: t.hintDetail,
            x: pos.x, y: pos.y, width: 30, height: 30,
            collected: false, color: '#ffd700'
        };
    });
    
    items = [];
    for(let i=0; i<10; i++) spawnRandomItem(); // Spawn plenty of items at start
}

function spawnRandomItem() {
    let type = Math.random() < 0.5 ? 'speed' : 'talisman';
    let pos = getValidSpawnPos(30, 30);
    items.push({
        type: type, x: pos.x, y: pos.y, width: 30, height: 30,
        collected: false, name: type === 'speed' ? "짚신" : "부적"
    });
}

function showToast(message) {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.classList.add('hidden'); }, 2500);
}

// Joystick logic
const joystick = { active: false, dx: 0, dy: 0, originX: 0, originY: 0 };
const joyBase = document.getElementById('joystick-base');
const joyStick = document.getElementById('joystick-stick');

joyBase.addEventListener('touchstart', e => {
    joystick.active = true;
    const rect = joyBase.getBoundingClientRect();
    joystick.originX = rect.left + rect.width / 2;
    joystick.originY = rect.top + rect.height / 2;
    updateJoyStick(e.touches[0]);
});
joyBase.addEventListener('touchmove', e => {
    if (!joystick.active) return;
    e.preventDefault();
    updateJoyStick(e.touches[0]);
});
joyBase.addEventListener('touchend', e => {
    joystick.active = false; joystick.dx = 0; joystick.dy = 0;
    joyStick.style.transform = `translate(0px, 0px)`;
});
function updateJoyStick(touch) {
    let dx = touch.clientX - joystick.originX; let dy = touch.clientY - joystick.originY;
    const maxDist = 40; const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
    joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
    joystick.dx = dx / maxDist; joystick.dy = dy / maxDist;
}

// Init
function init() {
    canvas = document.getElementById('game-canvas'); ctx = canvas.getContext('2d');
    minimapCanvas = document.getElementById('minimap-canvas'); minimapCtx = minimapCanvas.getContext('2d');

    createTextures();

    window.addEventListener('resize', resizeCanvas); resizeCanvas();

    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', resetGame);
    document.getElementById('restart-btn-victory').addEventListener('click', resetGame);
    
    // Inventory
    document.getElementById('hint-inventory-box').addEventListener('click', toggleInventory);
    document.getElementById('btn-inventory').addEventListener('click', toggleInventory);
    document.getElementById('btn-inventory').addEventListener('touchstart', (e)=>{e.preventDefault();toggleInventory();});
    document.getElementById('close-inventory-btn').addEventListener('click', toggleInventory);

    // Actions
    const btnInteract = document.getElementById('btn-interact');
    const btnTalisman = document.getElementById('btn-talisman');
    const wrapInteract = (e) => { e.preventDefault(); if(currentGameState === 'playing') checkInteraction(); };
    const wrapTalisman = (e) => { e.preventDefault(); if(currentGameState === 'playing') useTalisman(); };
    btnInteract.addEventListener('touchstart', wrapInteract); btnInteract.addEventListener('mousedown', wrapInteract);
    btnTalisman.addEventListener('touchstart', wrapTalisman); btnTalisman.addEventListener('mousedown', wrapTalisman);

    // Keyboard
    window.addEventListener('keydown', e => {
        keys[e.key] = true;
        if ((e.key === 'c' || e.key === 'C') && !spacePressed) { spacePressed = true; toggleInventory(); }
        if ((e.key === 'z' || e.key === 'Z' || e.key === 'Enter') && !spacePressed) { spacePressed = true; if(currentGameState === 'playing') checkInteraction(); }
        if ((e.key === 'x' || e.key === 'X') && !spacePressed) { spacePressed = true; if(currentGameState === 'playing') useTalisman(); }
    });
    window.addEventListener('keyup', e => {
        keys[e.key] = false;
        if (['z', 'Z', 'Enter', 'x', 'X', 'c', 'C'].includes(e.key)) spacePressed = false;
    });

    initData();
    updateUI();
}
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
function switchScreen(screenKey) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if(screenKey) screens[screenKey].classList.add('active');
}

function startGame() { switchScreen('game'); currentGameState = 'playing'; lastTime = performance.now(); gameLoop(lastTime); }
function resetGame() {
    player.x = 2000; player.y = 2000; player.speed = player.baseSpeed; player.talismans = 0; player.speedTimer = 0;
    collectedHints = []; ui.dialogueBox.classList.add('hidden'); interactingGhost = null;
    initData(); updateUI(); switchScreen('game'); currentGameState = 'playing';
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function toggleInventory() {
    if (currentGameState === 'playing') {
        currentGameState = 'inventory';
        screens.inventory.classList.add('active');
        populateInventory();
    } else if (currentGameState === 'inventory') {
        screens.inventory.classList.remove('active');
        currentGameState = 'playing';
        lastTime = performance.now(); // prevent huge dt jump
        requestAnimationFrame(gameLoop);
    }
}
function populateInventory() {
    ui.invDetails.innerHTML = '';
    if (collectedHints.length === 0) {
        ui.invDetails.innerHTML = '<div class="inv-hint-empty">아직 획득한 단서가 없습니다.</div>';
        return;
    }
    collectedHints.forEach(h => {
        let div = document.createElement('div'); div.className = 'inv-hint-item';
        div.innerHTML = `<div class="inv-hint-title">${h.name}</div><div class="inv-hint-desc">${h.detail}</div>`;
        ui.invDetails.appendChild(div);
    });
}

let lastTime = 0;
function gameLoop(currentTime) {
    const dt = currentTime - lastTime; lastTime = currentTime;
    if (currentGameState === 'playing') update(dt);
    if (currentGameState === 'playing' || currentGameState === 'dialogue') {
        draw(); drawMinimap();
        animationId = requestAnimationFrame(gameLoop);
    }
}

function update(dt) {
    if (player.speedTimer > 0) {
        player.speedTimer -= dt;
        if (player.speedTimer <= 0) { player.speed = player.baseSpeed; updateUI(); }
    }

    // Player Move
    let moveX = 0; let moveY = 0;
    if (keys['ArrowLeft'] || keys['a']) moveX -= 1; if (keys['ArrowRight'] || keys['d']) moveX += 1;
    if (keys['ArrowUp'] || keys['w']) moveY -= 1; if (keys['ArrowDown'] || keys['s']) moveY += 1;
    if (joystick.active) { moveX = joystick.dx; moveY = joystick.dy; }
    if (moveX !== 0 && moveY !== 0 && !joystick.active) { const len = Math.sqrt(moveX*moveX + moveY*moveY); moveX /= len; moveY /= len; }

    let nextX = player.x + moveX * player.speed; let nextY = player.y + moveY * player.speed;
    let collX = checkBuildingCollision(nextX, player.y, player.width, player.height);
    let collY = checkBuildingCollision(player.x, nextY, player.width, player.height);
    if (!collX) player.x = nextX; if (!collY) player.y = nextY;
    
    player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));
    player.y = Math.max(0, Math.min(WORLD_HEIGHT - player.height, player.y));

    // Camera
    camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width / 2));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, player.y - canvas.height / 2));

    // Items
    items.forEach(item => {
        if (!item.collected && isColliding(player, item)) {
            item.collected = true;
            if (item.type === 'speed') { player.speed = player.baseSpeed * 1.5; player.speedTimer = 5000; showToast("👟 짚신 획득! 이동속도 증가!"); }
            else if (item.type === 'talisman') { player.talismans++; showToast("📜 부적 획득! 귀신을 멈출 수 있습니다."); }
            updateUI();
        }
    });
    items = items.filter(i => !i.collected);
    
    itemRespawnTimer += dt;
    if (itemRespawnTimer >= ITEM_RESPAWN_INTERVAL) {
        itemRespawnTimer = 0; if (items.length < MAX_ITEMS) spawnRandomItem();
    }

    // Ghosts
    ghosts.forEach(g => {
        if (g.resolved) return;
        if (g.stunned > 0) { g.stunned -= dt; return; }
        
        let dx = player.x - g.x; let dy = player.y - g.y; let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 1000 && dist > 0) {
            let mX = 0, mY = 0;
            if (Math.abs(dx) > Math.abs(dy)) mX = Math.sign(dx) * g.speed; else mY = Math.sign(dy) * g.speed;
            
            let gNextX = g.x + mX; let gNextY = g.y + mY;
            if (!checkBuildingCollision(gNextX, g.y, g.width, g.height)) g.x = gNextX;
            if (!checkBuildingCollision(g.x, gNextY, g.width, g.height)) g.y = gNextY;
        }
        if (isColliding(player, g)) startDialogue(g);
    });
}

function draw() {
    if (groundPattern) {
        ctx.fillStyle = groundPattern;
    } else {
        ctx.fillStyle = '#6e5c47';
    }
    // Fill the background
    // Since groundPattern is a pattern, we need to apply the camera translation first so the pattern moves with the map
    ctx.save(); ctx.translate(-camera.x, -camera.y);
    
    // Fill entire world with ground pattern to ensure consistency
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    
    // Floor Grid (Subtle)
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
    let startX = Math.floor(camera.x / 50) * 50; let startY = Math.floor(camera.y / 50) * 50;
    for (let i = startX; i < camera.x + canvas.width; i += 50) { ctx.beginPath(); ctx.moveTo(i, camera.y); ctx.lineTo(i, camera.y + canvas.height); ctx.stroke(); }
    for (let i = startY; i < camera.y + canvas.height; i += 50) { ctx.beginPath(); ctx.moveTo(camera.x, i); ctx.lineTo(camera.x + canvas.width, i); ctx.stroke(); }

    // Buildings
    buildings.forEach(b => {
        // Draw Roof
        if (roofPattern) {
            ctx.fillStyle = roofPattern;
            ctx.save();
            ctx.translate(b.x, b.y); // Align pattern to building
            ctx.fillRect(0, 0, b.w, b.h - 24); // Leave space for wall
            ctx.restore();
        } else {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h - 24);
        }
        
        // Draw Wall
        if (wallPattern) {
            ctx.fillStyle = wallPattern;
            ctx.save();
            ctx.translate(b.x, b.y + b.h - 24);
            ctx.fillRect(0, 0, b.w, 24);
            ctx.restore();
        } else {
            ctx.fillStyle = '#5c4033';
            ctx.fillRect(b.x, b.y + b.h - 24, b.w, 24);
        }
        
        // Add shadow
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(b.x, b.y + b.h, b.w, 30);
    });

    // Items
    items.forEach(item => {
        ctx.fillStyle = item.type === 'speed' ? '#4CAF50' : '#FF9800';
        ctx.beginPath(); ctx.arc(item.x + item.width/2, item.y + item.height/2, item.width/2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.font = '16px Arial'; ctx.fillText(item.type === 'speed' ? '👟' : '📜', item.x - 8, item.y + 6);
    });

    // Hints
    hints.forEach(h => {
        if (!h.collected) {
            ctx.fillStyle = h.color;
            ctx.beginPath(); ctx.arc(h.x + h.width/2, h.y + h.height/2, h.width/2, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'black'; ctx.font = '16px Arial'; ctx.fillText('🔍', h.x - 8, h.y + 6);
        }
    });

    // Ghosts
    ghosts.forEach(g => {
        if (!g.resolved) {
            let floatY = g.stunned > 0 ? 0 : Math.sin(Date.now() / 200) * 8;
            
            // Draw aura
            ctx.fillStyle = g.stunned > 0 ? 'rgba(150, 150, 150, 0.5)' : 'rgba(200, 50, 50, 0.4)';
            ctx.beginPath();
            ctx.ellipse(g.x + g.width/2, g.y + g.height + floatY - 10, g.width/2, g.width/4, 0, 0, Math.PI*2);
            ctx.fill();

            // Draw Sprite
            if (g.image && g.image.width > 0) {
                ctx.globalAlpha = 0.9;
                ctx.drawImage(g.image, g.x, g.y + floatY, g.width, g.height);
                ctx.globalAlpha = 1.0;
            }
            
            // Name and Keyword
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffaaaa'; ctx.font = 'bold 14px "Malgun Gothic"';
            ctx.fillText(g.keyword, g.x + g.width/2, g.y - 25 + floatY);
            ctx.fillStyle = 'white'; ctx.font = 'bold 16px "Malgun Gothic"';
            ctx.fillText(g.name, g.x + g.width/2, g.y - 5 + floatY);
            ctx.textAlign = 'left';
            
            if (g.stunned > 0) { 
                ctx.fillStyle = '#ff5555'; ctx.font = 'bold 18px "Malgun Gothic"';
                ctx.fillText('⚡ 기절함', g.x + 10, g.y - 45); 
            }
        }
    });

    // Player
    ctx.fillStyle = player.color; ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.beginPath(); ctx.arc(player.x + player.width/2, player.y + player.height/2, 60, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
}

function drawMinimap() {
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    minimapCtx.fillStyle = '#2c3e50'; minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    const scaleX = minimapCanvas.width / WORLD_WIDTH; const scaleY = minimapCanvas.height / WORLD_HEIGHT;

    minimapCtx.fillStyle = '#1a2530';
    buildings.forEach(b => minimapCtx.fillRect(b.x * scaleX, b.y * scaleY, b.w * scaleX, b.h * scaleY));

    minimapCtx.fillStyle = '#ffd700'; hints.forEach(h => { if (!h.collected) minimapCtx.fillRect(h.x * scaleX, h.y * scaleY, 4, 4); });
    
    minimapCtx.fillStyle = '#4a90e2'; minimapCtx.beginPath(); minimapCtx.arc((player.x + player.width/2) * scaleX, (player.y + player.height/2) * scaleY, 3, 0, Math.PI*2); minimapCtx.fill();
    
    minimapCtx.fillStyle = '#ff3333'; ghosts.forEach(g => { if (!g.resolved) minimapCtx.fillRect(g.x * scaleX, g.y * scaleY, 3, 3); });
    
    minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(camera.x * scaleX, camera.y * scaleY, canvas.width * scaleX, canvas.height * scaleY);
}

function checkInteraction() {
    let foundHint = false;
    hints.forEach(h => {
        if (!h.collected) {
            let cx = h.x + h.width/2; let cy = h.y + h.height/2;
            let px = player.x + player.width/2; let py = player.y + player.height/2;
            if (Math.hypot(cx - px, cy - py) < 60) {
                h.collected = true; collectedHints.push(h); updateUI();
                showToast(`🔍 단서를 찾았습니다: [${h.name}]`); foundHint = true;
            }
        }
    });
    if(!foundHint) showToast("주변에 조사할 것이 없습니다.");
}

function useTalisman() {
    if (player.talismans > 0) {
        player.talismans--; updateUI();
        let nearest = null; let minDist = 400; let px = player.x + player.width/2; let py = player.y + player.height/2;
        ghosts.forEach(g => {
            if (g.resolved) return;
            let gx = g.x + g.width/2; let gy = g.y + g.height/2; let d = Math.hypot(px - gx, py - gy);
            if (d < minDist) { minDist = d; nearest = g; }
        });
        if (nearest) { nearest.stunned = 4000; showToast("⚡ 부적을 사용했습니다! 귀신이 멈춥니다."); }
        else { showToast("주변에 부적을 쓸 귀신이 없습니다."); player.talismans++; updateUI(); }
    } else showToast("❌ 가진 부적이 없습니다!");
}

// ---------------------------------------------------------
// Dialogue and Hint Selection Logic
// ---------------------------------------------------------
function startDialogue(g) {
    if (g.stunned > 0) return;
    currentGameState = 'dialogue'; interactingGhost = g;
    ui.speakerName.textContent = g.name; 
    ui.dialogueText.textContent = g.dialogue;
    renderMainChoices(g);
    ui.dialogueBox.classList.remove('hidden');
}

function renderMainChoices(g) {
    ui.choicesContainer.innerHTML = '';
    
    // 일반 공감 선택지 (오답)
    g.choices.forEach(choice => {
        const btn = document.createElement('button'); btn.className = 'choice-btn'; btn.textContent = choice.text;
        btn.onclick = () => {
            ui.choicesContainer.innerHTML = '';
            ui.dialogueText.textContent = `${g.name}: "흐흐흐... 너도 나와 함께 가자!"`;
            const dieBtn = document.createElement('button'); dieBtn.className = 'choice-btn'; dieBtn.textContent = "[...!]";
            dieBtn.onclick = () => handleChoice(false); ui.choicesContainer.appendChild(dieBtn);
        };
        ui.choicesContainer.appendChild(btn);
    });

    // 단서 제시하기 버튼
    const hintBtn = document.createElement('button');
    hintBtn.className = 'choice-btn hidden-choice';
    if (collectedHints.length > 0) {
        hintBtn.textContent = "단서 제시하기...";
        hintBtn.onclick = () => renderHintChoices(g);
    } else {
        hintBtn.textContent = "(현재 제시할 단서가 없음)";
        hintBtn.disabled = true;
        hintBtn.style.backgroundColor = '#555';
        hintBtn.style.borderColor = '#333';
        hintBtn.style.cursor = 'not-allowed';
    }
    ui.choicesContainer.appendChild(hintBtn);
}

function renderHintChoices(g) {
    ui.choicesContainer.innerHTML = '';
    
    const backBtn = document.createElement('button');
    backBtn.className = 'choice-btn';
    backBtn.textContent = "← 뒤로 가기";
    backBtn.onclick = () => renderMainChoices(g);
    ui.choicesContainer.appendChild(backBtn);
    
    // 플레이어가 모은 단서들을 리스트로 출력
    collectedHints.forEach(h => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn hidden-choice';
        btn.style.backgroundColor = 'rgba(60, 50, 40, 0.9)'; // 조금 부드러운 색
        btn.textContent = `단서 제시: [${h.name}]`;
        btn.onclick = () => handleHintPresentation(g, h);
        ui.choicesContainer.appendChild(btn);
    });
}

function handleHintPresentation(g, h) {
    ui.choicesContainer.innerHTML = '';
    if (h.id === g.hintRequired) {
        // 1단계: 플레이어가 단서로 일침을 가함
        ui.dialogueText.textContent = `플레이어: "${h.detail}"`;
        const btn = document.createElement('button'); btn.className = 'choice-btn hidden-choice'; btn.textContent = "[퇴마하기]";
        
        btn.onclick = () => {
            // 2단계: 귀신의 단말마 후 퇴마 완료
            ui.choicesContainer.innerHTML = '';
            ui.dialogueText.textContent = `${g.name}: "크아아악! 내 거짓말이 들통나다니!"`;
            
            const closeBtn = document.createElement('button'); closeBtn.className = 'choice-btn'; closeBtn.textContent = "[사라진다...]";
            closeBtn.onclick = () => handleChoice(true); 
            ui.choicesContainer.appendChild(closeBtn);
        };
        ui.choicesContainer.appendChild(btn);
    } else {
        ui.dialogueText.textContent = `(단서 제시: ${h.name})\n\n${g.name}: "그게 나랑 무슨 상관이냐! 너도 내 원한을 달래주지 못하는구나! 같이 가자!"`;
        const btn = document.createElement('button'); btn.className = 'choice-btn'; btn.textContent = "[...!]";
        btn.onclick = () => handleChoice(false); ui.choicesContainer.appendChild(btn);
    }
}

function handleChoice(isCorrect) {
    ui.dialogueBox.classList.add('hidden');
    if (isCorrect) {
        showToast("원혼이 뉘우치고 퇴마되었습니다!");
        interactingGhost.resolved = true;
        currentGameState = 'playing';
        if (ghosts.every(g => g.resolved)) setTimeout(() => { switchScreen('victory'); }, 500);
    } else {
        switchScreen('gameOver'); currentGameState = 'gameover';
    }
    interactingGhost = null;
}
// ---------------------------------------------------------

function updateUI() {
    ui.speedStatus.textContent = `속도: ${player.speedTimer > 0 ? '빠름 (버프)' : '보통'}`;
    ui.talismanCount.textContent = `부적(X): ${player.talismans}개`;
    ui.hintList.innerHTML = '';
    if (collectedHints.length === 0) ui.hintList.innerHTML = '<li style="color:#777; padding-left:0;">가진 단서가 없습니다.</li>';
    else collectedHints.forEach(h => { const li = document.createElement('li'); li.textContent = h.name; ui.hintList.appendChild(li); });
}

window.onload = init;
