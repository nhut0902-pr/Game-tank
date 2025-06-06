// --- DOM Elements ---
const menuScreen = document.getElementById('menuScreen');
const gameArea = document.getElementById('gameArea');
const gameOverScreen = document.getElementById('gameOverScreen');
const survivalBtn = document.getElementById('survivalBtn');
const waveBtn = document.getElementById('waveBtn');
const timeAttackBtn = document.getElementById('timeAttackBtn');
const bossBattleBtn = document.getElementById('bossBattleBtn');
const shopBtn = document.getElementById('shopBtn'); // Nút vào shop
const garageBtn = document.getElementById('garageBtn'); // Nút vào gara
const survivalHighScoreDisplay = document.getElementById('survivalHighScore');
const waveHighScoreDisplay = document.getElementById('waveHighScore');
const timeAttackHighScoreDisplay = document.getElementById('timeAttackHighScore');

const shopScreen = document.getElementById('shopScreen');
const garageScreen = document.getElementById('garageScreen');
const shopItemsContainer = document.getElementById('shopItemsContainer');
const bodyItemsContainer = document.getElementById('bodyItemsContainer');
const turretItemsContainer = document.getElementById('turretItemsContainer');
const paintItemsContainer = document.getElementById('paintItemsContainer');
const garageTankCanvas = document.getElementById('garageTankCanvas');
const ctxGarage = garageTankCanvas.getContext('2d');
const backToMenuFromShopBtn = document.getElementById('backToMenuFromShopBtn');
const backToMenuFromGarageBtn = document.getElementById('backToMenuFromGarageBtn');

const currencyMenuDisplay = document.getElementById('currencyMenu');
const currencyShopDisplay = document.getElementById('currencyShop');
const currencyGarageDisplay = document.getElementById('currencyGarage');
const currencyGameDisplay = document.getElementById('currencyGame'); // Span trong status bar game
const moneyEarnedDisplay = document.getElementById('moneyEarned'); // Span trong game over

const gameModeDisplay = document.getElementById('gameModeDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const waveDisplay = document.getElementById('waveDisplay'); // Span chứa số wave
const enemiesLeftDisplay = document.getElementById('enemiesLeftDisplay'); // Span chứa số KĐ
const timeDisplay = document.getElementById('timeDisplay'); // Span chứa thời gian
const playerHealthDisplay = document.getElementById('playerHealthDisplay');
const waveInfoDisplay = document.getElementById('waveInfo'); // Span bao quanh wave & enemies
const timeInfoDisplay = document.getElementById('timeInfo'); // Span bao quanh time
const bossInfoDisplay = document.getElementById('bossInfo'); // Span bao quanh boss health
const bossHealthUIDisplay = document.getElementById('bossHealthDisplay'); // Span chứa HP boss

const backToMenuBtnGame = document.getElementById('backToMenuBtn');
const gameOverTitle = document.getElementById('gameOverTitle');
const finalScoreDisplay = document.getElementById('finalScore');
const waveReachedDisplay = document.getElementById('waveReached');
const finalWaveDisplay = document.getElementById('finalWave');
const restartBtn = document.getElementById('restartBtn');
const menuFromGameOverBtn = document.getElementById('menuFromGameOverBtn');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Canvas & Game Constants (Giữ nguyên hoặc đã cập nhật) ---
canvas.width = Math.min(window.innerWidth * 0.9, 800);
canvas.height = Math.min(window.innerHeight * 0.7, 600);
// ... (Tất cả hằng số từ phiên bản trước: TANK_WIDTH, POWERUP_RADIUS, ENEMY_TYPES, etc.)
const TANK_WIDTH = 40; const TANK_HEIGHT = 30;
const TURRET_RADIUS = 8; const BARREL_LENGTH = 25; const BARREL_WIDTH = 6;
const BULLET_RADIUS = 4; const BULLET_SPEED = 7;
const TANK_SPEED = 1.5; const TANK_ROTATION_SPEED = 0.035; const TURRET_ROTATION_SPEED = 0.05;
const PLAYER_BASE_SHOOT_COOLDOWN = 450; // Đổi tên để rõ ràng hơn
const MAX_PLAYER_HEALTH_BASE = 100; // Máu gốc
const PLAYER_BASE_BULLET_DAMAGE = 20; // Sát thương đạn gốc

const ENEMY_TANK_WIDTH = 38; const ENEMY_TANK_HEIGHT = 28;
const MAX_ENEMY_HEALTH = 40;
const ENEMY_TYPES = ['normal', 'scout', 'heavy'];
const ENEMY_SPAWN_WEIGHTS = { 'normal': 60, 'scout': 30, 'heavy': 10 };
const SCOUT_TANK_WIDTH = 35; const SCOUT_TANK_HEIGHT = 25; const MAX_SCOUT_HEALTH = 25; const SCOUT_SPEED_MULTIPLIER = 1.5; const SCOUT_SHOOT_COOLDOWN_MULTIPLIER = 0.7; const SCOUT_DAMAGE_MULTIPLIER = 0.6;
const HEAVY_TANK_WIDTH = 50; const HEAVY_TANK_HEIGHT = 40; const MAX_HEAVY_HEALTH = 80; const HEAVY_SPEED_MULTIPLIER = 0.6; const HEAVY_SHOOT_COOLDOWN_MULTIPLIER = 1.5; const HEAVY_DAMAGE_MULTIPLIER = 1.3;

const POWERUP_RADIUS = 15; const POWERUP_DURATION = 7000; const POWERUP_SPAWN_CHANCE = 0.15;
const POWERUP_TYPES = ['rapid_fire', 'damage_boost', 'shield', 'health_pack', 'spread_shot'];

const ENEMY_SPAWN_INTERVAL_SURVIVAL = 4500; const TIME_ATTACK_DURATION = 60 * 1000; const WAVE_BASE_ENEMY_COUNT = 2;
const MESSAGE_DURATION = 2500;
const BOSS_TANK_WIDTH = 80; const BOSS_TANK_HEIGHT = 60; const MAX_BOSS_HEALTH_BASE = 500;
const BOSS_SHOOT_COOLDOWN_NORMAL = 1000; const BOSS_SHOOT_COOLDOWN_SPECIAL = 4000; const BOSS_SPECIAL_ATTACK_BULLET_COUNT = 5;
const HEALTH_BAR_WIDTH = 35; const HEALTH_BAR_HEIGHT = 4;


// --- Game State (Cập nhật cho tiền tệ, inventory) ---
let playerTank; let bullets = []; let enemies = []; let obstacles = []; let powerUps = [];
let moveJoystick, aimJoystick, fireButton;
let gameLoopRequest; let score = 0; let gameMode = 'survival'; let gameActive = false;
let lastEnemySpawnTime = 0; let currentWave = 0; let enemiesThisWave = 0;
let timeRemaining = TIME_ATTACK_DURATION; let lastTickTime = Date.now();
let message = ""; let messageTimer = 0;
let currentSelectedMode = 'survival';
let audioCtx;
let activePowerUps = {
    rapid_fire: { active: false, endTime: 0 }, damage_boost: { active: false, endTime: 0 },
    shield: { active: false, endTime: 0 }, spread_shot: { active: false, endTime: 0 }
};

let playerMoney = 0;
const PLAYER_DATA_KEY = 'tankBattleAdvancedPlayerData'; // Key mới cho localStorage
let playerInventory = {
    bodies: ['body_default'], turrets: ['turret_default'], paints: ['paint_default_green']
};
let playerEquipment = {
    body: 'body_default', turret: 'turret_default', paint: 'paint_default_green'
};

// --- Shop Item Definitions (Cập nhật ID và thêm default) ---
const SHOP_ITEMS = {
    // Default items (không bán, chỉ để tham chiếu)
    body_default: { name: "Thân Xe Tiêu Chuẩn", type: 'body', price: 0, description: "Thân xe cơ bản.", id: "body_default", isDefault: true },
    turret_default: { name: "Tháp Pháo Tiêu Chuẩn", type: 'turret', price: 0, description: "Tháp pháo cơ bản.", id: "turret_default", isDefault: true },
    paint_default_green: { name: "Sơn Xanh Lá", type: 'paint', price: 0, color: 'darkgreen', id: "paint_default_green", isDefault: true },

    // Items bán trong shop
    body_armored: { name: "Thân Xe Bọc Giáp", type: 'body', price: 200, description: "Tăng 25 HP tối đa.", statBoost: { maxHealth: 25 }, id: "body_armored" },
    body_light: { name: "Thân Xe Hạng Nhẹ", type: 'body', price: 150, description: "Tăng tốc độ 12%.", statBoost: { speed: 0.12 }, id: "body_light" },
    turret_rapid: { name: "Tháp Pháo Liên Thanh", type: 'turret', price: 250, description: "Giảm 20% tg nạp đạn.", statBoost: { shootCooldown: -0.20 }, id: "turret_rapid" },
    turret_sniper: { name: "Tháp Pháo Bắn Tỉa", type: 'turret', price: 300, description: "Tăng 25% sát thương.", statBoost: { bulletDamage: 0.25 }, id: "turret_sniper" },
    paint_red: { name: "Sơn Đỏ Lửa", type: 'paint', price: 50, color: '#B71C1C', id: "paint_red" }, // Dark Red
    paint_blue: { name: "Sơn Xanh Biển", type: 'paint', price: 50, color: '#0D47A1', id: "paint_blue" }, // Dark Blue
    paint_yellow: { name: "Sơn Vàng Chanh", type: 'paint', price: 50, color: '#F9A825', id: "paint_yellow"}, // Yellow/Orange
    paint_camo: { name: "Sơn Rằn Ri", type: 'paint', price: 75, colorPattern: ['#556B2F', '#8FBC8F', '#2F4F4F'], id: "paint_camo"}, // Mảng màu cho rằn ri
};


// --- Utility & Audio (Giữ nguyên hoặc đã cập nhật) ---
function getDistance(x1, y1, x2, y2) { /* ... */ return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }
function initAudio() { /* ... */ if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { console.warn("Web Audio API is not supported."); } } }
function playSound(type, volume = 0.3, duration = 0.1) { /* ... (Giữ nguyên sound list, có thể thêm sound cho mua đồ) ... */
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(volume * 0.4, audioCtx.currentTime); // Giảm volume mặc định

    switch (type) {
        case 'shoot': o.type = 'triangle'; o.frequency.setValueAtTime(300, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + duration); break;
        case 'enemy_shoot': o.type = 'sawtooth'; o.frequency.setValueAtTime(250, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + duration); g.gain.setValueAtTime(volume * 0.6, audioCtx.currentTime); break;
        case 'hit': o.type = 'square'; o.frequency.setValueAtTime(180, audioCtx.currentTime); duration = 0.05; g.gain.setValueAtTime(volume*1.2, audioCtx.currentTime); break;
        case 'explosion': o.type = 'noise'; duration = 0.3; volume = 0.35; break;
        case 'player_death': o.type = 'sawtooth'; o.frequency.setValueAtTime(110, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + duration); duration = 0.5; volume = 0.45; break;
        case 'wave_clear': o.type = 'sine'; o.frequency.setValueAtTime(660, audioCtx.currentTime); o.frequency.setValueAtTime(880, audioCtx.currentTime + duration*0.5); duration = 0.4; volume = 0.35; break;
        case 'powerup_pickup': o.type = 'sine'; o.frequency.setValueAtTime(523, audioCtx.currentTime); o.frequency.linearRampToValueAtTime(783, audioCtx.currentTime + duration*0.8); volume = 0.35; duration=0.2; break;
        case 'shield_block': o.type = 'sine'; o.frequency.setValueAtTime(1000, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + duration); duration = 0.08; volume = 0.25; break;
        case 'buy_item': o.type = 'square'; o.frequency.setValueAtTime(700, audioCtx.currentTime); o.frequency.linearRampToValueAtTime(1000, audioCtx.currentTime + duration*0.5); duration = 0.15; volume = 0.3; break;
        case 'ui_click': o.type = 'sine'; o.frequency.setValueAtTime(800, audioCtx.currentTime); duration = 0.05; volume = 0.2; break;
        default: o.type = 'sine'; o.frequency.setValueAtTime(440, audioCtx.currentTime);
    }
    o.start(); o.stop(audioCtx.currentTime + duration);
}
function LightenDarkenColor(col, amt) { /* ... (Giữ nguyên) ... */
    var usePound = false; if (col[0] == "#") { col = col.slice(1); usePound = true; }
    var num = parseInt(col,16);
    var r = (num >> 16) + amt; if (r > 255) r = 255; else if  (r < 0) r = 0;
    var b = ((num >> 8) & 0x00FF) + amt; if (b > 255) b = 255; else if (b < 0) b = 0;
    var g = (num & 0x0000FF) + amt; if (g > 255) g = 255; else if (g < 0) g = 0;
    var hex = (g | (b << 8) | (r << 16)).toString(16);
    while(hex.length < 6) { hex = "0" + hex; } // Pad with leading zeros
    return (usePound?"#":"") + hex;
}


// --- Obstacle, PowerUp, Joystick, FireButton Classes (Giữ nguyên từ bản trước) ---
class Obstacle { /* ... */ constructor(x,y,w,h){this.x=x;this.y=y;this.width=w;this.height=h;this.color="#778899";} draw(){ctx.fillStyle=this.color;ctx.fillRect(this.x,this.y,this.width,this.height);ctx.strokeStyle="#556677";ctx.lineWidth=2;ctx.strokeRect(this.x,this.y,this.width,this.height);} getBoundingBox(){return{x:this.x,y:this.y,width:this.width,height:this.height};} }
class PowerUp { /* ... */ constructor(x,y,type){this.x=x;this.y=y;this.type=type;this.radius=POWERUP_RADIUS;this.createdAt=Date.now();this.lifetime=10000;switch(type){case 'rapid_fire':this.color='cyan';this.symbol='⚡';break;case 'damage_boost':this.color='orange';this.symbol='💥';break;case 'shield':this.color='lightblue';this.symbol='🛡️';break;case 'health_pack':this.color='lightgreen';this.symbol='➕';break;case 'spread_shot':this.color='violet';this.symbol='∴';break;default:this.color='gray';this.symbol='?';}} draw(){const t=1+Math.sin(Date.now()/200)*.1,e=this.radius*t;ctx.beginPath(),ctx.arc(this.x,this.y,e,0,2*Math.PI),ctx.fillStyle=this.color,ctx.fill(),ctx.strokeStyle="white",ctx.lineWidth=2,ctx.stroke(),ctx.fillStyle="black",ctx.font=`bold ${e*1.1}px Arial`,ctx.textAlign="center",ctx.textBaseline="middle",ctx.fillText(this.symbol,this.x,this.y+1)} isExpired(){return Date.now()-this.createdAt>this.lifetime} }
class Joystick { /* ... */ constructor(x,y,baseRadius,stickRadius){this.baseX=x;this.baseY=y;this.baseRadius=baseRadius;this.stickRadius=stickRadius;this.stickX=x;this.stickY=y;this.isActive=!1;this.touchId=null;this.valueX=0;this.valueY=0} draw(){ctx.beginPath();ctx.arc(this.baseX,this.baseY,this.baseRadius,0,2*Math.PI);ctx.fillStyle="rgba(150, 150, 150, 0.4)";ctx.fill();ctx.beginPath();ctx.arc(this.stickX,this.stickY,this.stickRadius,0,2*Math.PI);ctx.fillStyle="rgba(100, 100, 100, 0.7)";ctx.fill()} handleDown(x,y,baseRadius){if(getDistance(x,y,this.baseX,this.baseY)<this.baseRadius+this.stickRadius)return this.isActive=!0,this.touchId=baseRadius,this._updateStick(x,y),!0;return!1} handleMove(x,y,baseRadius){this.isActive&&this.touchId===baseRadius&&this._updateStick(x,y)} handleUp(x){this.touchId===x&&(this.isActive=!1,this.touchId=null,this.stickX=this.baseX,this.stickY=this.baseY,this.valueX=0,this.valueY=0)} _updateStick(x,y){const baseRadius=x-this.baseX,stickRadius=y-this.baseY;if(getDistance(x,y,this.baseX,this.baseY)<this.baseRadius)this.stickX=x,this.stickY=y;else{const x=Math.atan2(stickRadius,baseRadius);this.stickX=this.baseX+this.baseRadius*Math.cos(x),this.stickY=this.baseY+this.baseRadius*Math.sin(x)}this.valueX=(this.stickX-this.baseX)/this.baseRadius,this.valueY=(this.stickY-this.baseY)/this.baseRadius} getValue(){return{x:this.valueX,y:this.valueY}} }
class FireButton { /* ... */ constructor(x,y,baseRadius){this.x=x;this.y=y;this.radius=baseRadius;this.isPressed=!1;this.touchId=null} draw(){ctx.beginPath();ctx.arc(this.x,this.y,this.radius,0,2*Math.PI);ctx.fillStyle=this.isPressed?"rgba(255, 80, 80, 0.9)":"rgba(255, 0, 0, 0.6)";ctx.fill();ctx.strokeStyle="rgba(100,0,0,0.8)";ctx.lineWidth=3;ctx.stroke();ctx.fillStyle="white";ctx.font="bold 16px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Bắn",this.x,this.y)} handleDown(x,y,baseRadius){if(getDistance(x,y,this.x,this.y)<this.radius)return this.isPressed=!0,this.touchId=baseRadius,!0;return!1} handleUp(x){this.touchId===x&&(this.isPressed=!1,this.touchId=null)} }


// --- Tank Class (Cập nhật lớn cho trang bị và vẽ) ---
class Tank {
    constructor(x, y, isPlayer = true, isBoss = false, enemyType = 'normal') {
        this.x = x; this.y = y; this.isPlayer = isPlayer; this.isBoss = isBoss;
        this.enemyType = isPlayer ? null : enemyType;

        // Base stats that will be modified by equipment if player
        this.baseWidth = TANK_WIDTH;
        this.baseHeight = TANK_HEIGHT;
        this.baseMaxHealth = MAX_PLAYER_HEALTH_BASE;
        this.baseSpeed = TANK_SPEED;
        this.basePlayerShootCooldown = PLAYER_BASE_SHOOT_COOLDOWN;
        this.basePlayerBulletDamage = PLAYER_BASE_BULLET_DAMAGE;
        this.baseColorBody = 'darkgreen'; // Default for player before paint
        this.baseColorTurret = 'green';

        // Initialize effective stats (these will be used in game)
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.maxHealth = this.baseMaxHealth;
        this.speed = this.baseSpeed;
        this.currentShootCooldown = this.basePlayerShootCooldown; // For player, AI has its own
        this.currentBulletDamage = this.basePlayerBulletDamage;   // For player
        this.colorBody = this.baseColorBody;
        this.colorTurret = this.baseColorTurret;

        this.bulletDamageMultiplier = 1.0; // For AI/Boss damage scaling
        this.scoreValue = 0;

        if (!isPlayer) {
            this.scoreValue = 10;
            this.baseShootCooldown = 1200 + Math.random() * 1800; // AI specific base cooldown
            if (isBoss) {
                this.width = BOSS_TANK_WIDTH; this.height = BOSS_TANK_HEIGHT;
                this.maxHealth = MAX_BOSS_HEALTH_BASE; this.speed = TANK_SPEED * 0.4;
                this.colorBody = '#1a1a1a'; this.colorTurret = '#4d4d4d';
                this.baseShootCooldown = BOSS_SHOOT_COOLDOWN_NORMAL;
                this.bulletDamageMultiplier = 1.25; this.scoreValue = 100;
            } else { // Enemy types
                switch (this.enemyType) {
                    case 'scout':
                        this.width = SCOUT_TANK_WIDTH; this.height = SCOUT_TANK_HEIGHT;
                        this.maxHealth = MAX_SCOUT_HEALTH; this.speed = TANK_SPEED * SCOUT_SPEED_MULTIPLIER;
                        this.baseShootCooldown *= SCOUT_SHOOT_COOLDOWN_MULTIPLIER;
                        this.bulletDamageMultiplier = SCOUT_DAMAGE_MULTIPLIER;
                        this.colorBody = '#a0522d'; this.colorTurret = '#cd853f'; this.scoreValue = 15;
                        break;
                    case 'heavy':
                        this.width = HEAVY_TANK_WIDTH; this.height = HEAVY_TANK_HEIGHT;
                        this.maxHealth = MAX_HEAVY_HEALTH; this.speed = TANK_SPEED * HEAVY_SPEED_MULTIPLIER;
                        this.baseShootCooldown *= HEAVY_SHOOT_COOLDOWN_MULTIPLIER;
                        this.bulletDamageMultiplier = HEAVY_DAMAGE_MULTIPLIER;
                        this.colorBody = '#465962'; this.colorTurret = '#607D8B'; this.scoreValue = 25;
                        break;
                    default: // Normal
                        this.width = ENEMY_TANK_WIDTH; this.height = ENEMY_TANK_HEIGHT;
                        this.maxHealth = MAX_ENEMY_HEALTH; this.speed = TANK_SPEED * (0.6 + Math.random() * 0.3);
                        this.colorBody = 'maroon'; this.colorTurret = 'red';
                        break;
                }
            }
        }

        if (isPlayer) this.applyEquipment(); // Apply equipment after base stats are set

        this.health = this.maxHealth; // Set health AFTER maxHealth is determined
        this.bodyAngle = isPlayer ? -Math.PI / 2 : Math.random() * Math.PI * 2;
        this.turretAngle = this.bodyAngle;
        this.lastShotTime = 0; this.collidingWithObstacle = false;
        this.hasShield = false; this.isSpreadShotActive = false;

        if (!isPlayer) {
            this.aiState = 'patrolling'; this.aiMoveTimer = 0; this.aiTargetAngle = this.bodyAngle;
            this.aiLastShotTime = Date.now();
            this.aiShootActualCooldown = this.baseShootCooldown; // AI uses this
            this.aiSightRange = isBoss ? canvas.width * 1.5 : (this.enemyType === 'scout' ? 240 : (this.enemyType === 'heavy' ? 150 : 190)) + Math.random() * 70;
            this.aiWanderTarget = null; this.aiPathBlockedTimer = 0;
            if (isBoss) this.aiLastSpecialAttackTime = Date.now();
        }
    }

    applyEquipment() {
        if (!this.isPlayer) return;

        // Reset to base before applying equipment bonuses
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.maxHealth = this.baseMaxHealth;
        this.speed = this.baseSpeed;
        let newBaseShootCooldown = this.basePlayerShootCooldown;
        let newBaseBulletDamage = this.basePlayerBulletDamage;

        const bodyItemData = SHOP_ITEMS[playerEquipment.body];
        if (bodyItemData && bodyItemData.statBoost) {
            if (bodyItemData.statBoost.maxHealth) this.maxHealth += bodyItemData.statBoost.maxHealth;
            if (bodyItemData.statBoost.speed) this.speed += this.baseSpeed * bodyItemData.statBoost.speed; // % increase
            // Example: if body has custom dimensions
            // if (bodyItemData.dimensions) { this.width = bodyItemData.dimensions.width; this.height = bodyItemData.dimensions.height; }
        }

        const turretItemData = SHOP_ITEMS[playerEquipment.turret];
        if (turretItemData && turretItemData.statBoost) {
            if (turretItemData.statBoost.shootCooldown) newBaseShootCooldown *= (1 + turretItemData.statBoost.shootCooldown);
            if (turretItemData.statBoost.bulletDamage) newBaseBulletDamage *= (1 + turretItemData.statBoost.bulletDamage);
        }

        const paintItemData = SHOP_ITEMS[playerEquipment.paint];
        this.colorBody = paintItemData?.color || this.baseColorBody;
        if (paintItemData?.colorPattern) { // For camo
            this.colorPattern = paintItemData.colorPattern; // Store pattern
            this.colorBody = null; // Indicate to use pattern in draw
        } else {
            this.colorPattern = null;
        }
        this.colorTurret = LightenDarkenColor(paintItemData?.color || this.baseColorBody, 25) || this.baseColorTurret;


        // Update current stats used in game, considering power-ups might be active
        this.currentShootCooldown = activePowerUps.rapid_fire.active ? newBaseShootCooldown * 0.5 : newBaseShootCooldown;
        this.currentBulletDamage = activePowerUps.damage_boost.active ? newBaseBulletDamage * 1.75 : newBaseBulletDamage;

        // If health was full, keep it full after maxHealth change
        if (this.health === this.maxHealth - (bodyItemData?.statBoost?.maxHealth || 0) || this.health > this.maxHealth) {
             this.health = this.maxHealth;
        }
        updateHTMLUI(); // Update UI with new stats
    }

    draw() { /* ... (Draw logic, use this.colorBody/this.colorPattern, this.colorTurret) ... */
        if (this.health <= 0 && !this.isBoss) return;
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.bodyAngle);

        if (this.colorPattern) { // Draw camo pattern
            const patternSize = 10;
            for (let i = -this.width / 2; i < this.width / 2; i += patternSize) {
                for (let j = -this.height / 2; j < this.height / 2; j += patternSize) {
                    ctx.fillStyle = this.colorPattern[Math.floor(Math.random() * this.colorPattern.length)];
                    ctx.fillRect(i, j, patternSize, patternSize);
                }
            }
        } else {
            ctx.fillStyle = this.colorBody;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        if (this.isPlayer || this.isBoss) {
            ctx.fillStyle = this.isPlayer ? LightenDarkenColor(this.colorTurret || '#00FF00', -30) : '#888'; // Darker detail
            ctx.fillRect(this.width / 4, -this.height/5, this.width / 4, this.height/2.5);
        }
        ctx.restore();

        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.turretAngle);
        const currentBarrelLength = this.isBoss ? BARREL_LENGTH * 1.2 : BARREL_LENGTH;
        const currentBarrelWidth = this.isBoss ? BARREL_WIDTH * 1.2 : BARREL_WIDTH;
        const currentTurretRadius = this.isBoss ? TURRET_RADIUS * 1.5 : TURRET_RADIUS;
        ctx.fillStyle = LightenDarkenColor(this.colorTurret || '#808080', -20); // Darker barrel
        ctx.fillRect(currentTurretRadius * 0.5, -currentBarrelWidth / 2, currentBarrelLength, currentBarrelWidth);
        ctx.beginPath(); ctx.arc(0, 0, currentTurretRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.colorTurret; ctx.fill();
        ctx.restore();

        if (this.isPlayer && this.hasShield) {
            ctx.beginPath(); ctx.arc(this.x, this.y, Math.max(this.width, this.height) * 0.75, 0, Math.PI * 2);
            const shieldAlpha = activePowerUps.shield.active ? Math.max(0, (activePowerUps.shield.endTime - Date.now())) / POWERUP_DURATION : 0;
            ctx.strokeStyle = `rgba(100, 180, 255, ${Math.max(0.2, shieldAlpha * 0.9)})`;
            ctx.lineWidth = 3 + Math.sin(Date.now()/100)*1.5; ctx.stroke();
        }

        const healthBarActualWidth = this.isBoss ? HEALTH_BAR_WIDTH * 2.5 : HEALTH_BAR_WIDTH;
        const healthBarX = this.x - healthBarActualWidth / 2;
        const healthBarY = this.y - this.height / 2 - HEALTH_BAR_HEIGHT - 9;
        ctx.fillStyle = '#555'; ctx.fillRect(healthBarX - 1, healthBarY - 1, healthBarActualWidth + 2, HEALTH_BAR_HEIGHT + 2);
        ctx.fillStyle = 'darkred'; ctx.fillRect(healthBarX, healthBarY, healthBarActualWidth, HEALTH_BAR_HEIGHT);
        const currentHealthWidth = (this.health / this.maxHealth) * healthBarActualWidth;
        ctx.fillStyle = 'lime';
        ctx.fillRect(healthBarX, healthBarY, Math.max(0, currentHealthWidth), HEALTH_BAR_HEIGHT);
    }

    // update, shoot, bossSpecialAttack, takeDamage, onDeath, activatePowerUp, deactivatePowerUp
    // ... (Giữ nguyên logic cốt lõi từ các phiên bản trước, nhưng onDeath cần cập nhật tiền)
    update(moveInput, aimInput, playerTankRef, obstaclesRef) { /* ... (Logic AI với né vật cản và type) ... */
        if (this.health <= 0) return; let prevX = this.x; let prevY = this.y;
        if (this.isPlayer) { if (Math.abs(moveInput.y) > 0.1) { const moveSpeed = -moveInput.y * this.speed; this.x += moveSpeed * Math.cos(this.bodyAngle); this.y += moveSpeed * Math.sin(this.bodyAngle); } if (Math.abs(moveInput.x) > 0.1) { this.bodyAngle += moveInput.x * TANK_ROTATION_SPEED * Math.sign(-moveInput.y || 1); } if (Math.abs(aimInput.x) > 0.1 || Math.abs(aimInput.y) > 0.1) { this.turretAngle = Math.atan2(aimInput.y, aimInput.x); } }
        else { this.aiMoveTimer -= 1000 / 60; const distanceToPlayer = playerTankRef && playerTankRef.health > 0 ? getDistance(this.x, this.y, playerTankRef.x, playerTankRef.y) : Infinity; if (distanceToPlayer < this.aiSightRange && playerTankRef.health > 0) { this.aiState = this.isBoss ? 'boss_attacking' : 'attacking'; this.aiWanderTarget = null; } else if (this.aiState !== 'returning_to_patrol') { this.aiState = 'patrolling'; } if (this.aiPathBlockedTimer > 0) this.aiPathBlockedTimer -= 1000/60; let targetAngleForMovement = this.bodyAngle; let tryToMove = false; if (this.aiState === 'patrolling' || this.aiState === 'returning_to_patrol') { if (!this.aiWanderTarget || this.aiMoveTimer <= 0 || getDistance(this.x, this.y, this.aiWanderTarget.x, this.aiWanderTarget.y) < this.width) { if (this.aiState === 'returning_to_patrol') this.aiState = 'patrolling'; this.aiWanderTarget = { x: Math.random() * (canvas.width - this.width*2) + this.width, y: Math.random() * (canvas.height - this.height*2) + this.height }; this.aiMoveTimer = 3000 + Math.random() * 4000; } targetAngleForMovement = Math.atan2(this.aiWanderTarget.y - this.y, this.aiWanderTarget.x - this.x); this.turretAngle = this.bodyAngle; tryToMove = true; } else if (this.aiState === 'attacking' || this.aiState === 'boss_attacking') { targetAngleForMovement = Math.atan2(playerTankRef.y - this.y, playerTankRef.x - this.x); this.turretAngle = targetAngleForMovement; tryToMove = true; if (this.enemyType === 'scout') { if (distanceToPlayer < this.aiSightRange * 0.4) targetAngleForMovement += Math.PI; else if (distanceToPlayer < this.aiSightRange * 0.8) targetAngleForMovement += (Math.random() > 0.5 ? Math.PI/2.5 : -Math.PI/2.5) ; } else if (this.enemyType === 'heavy' || this.isBoss) { if (distanceToPlayer < this.aiSightRange * 0.25) tryToMove = false; } const currentTime = Date.now(); if (currentTime - this.aiLastShotTime > this.aiShootActualCooldown) { this.shoot(); this.aiLastShotTime = currentTime; } if (this.isBoss && currentTime - this.aiLastSpecialAttackTime > BOSS_SHOOT_COOLDOWN_SPECIAL) { this.bossSpecialAttack(); this.aiLastSpecialAttackTime = currentTime; } } if (this.aiPathBlockedTimer <=0 && tryToMove) { let angleDiffBody = targetAngleForMovement - this.bodyAngle; while (angleDiffBody > Math.PI) angleDiffBody -= Math.PI * 2; while (angleDiffBody < -Math.PI) angleDiffBody += Math.PI * 2; if (Math.abs(angleDiffBody) > TANK_ROTATION_SPEED * 0.8) { this.bodyAngle += Math.sign(angleDiffBody) * TANK_ROTATION_SPEED * 0.8; } else { this.bodyAngle = targetAngleForMovement; } if (Math.abs(angleDiffBody) < Math.PI / 1.7 || this.aiState.includes('attacking')) { this.x += this.speed * Math.cos(this.bodyAngle); this.y += this.speed * Math.sin(this.bodyAngle); } } }
        this.collidingWithObstacle = false; obstaclesRef.forEach(obs => { if (checkTankObstacleCollision(this, obs)) { this.collidingWithObstacle = true; this.x = prevX; this.y = prevY; if (!this.isPlayer && this.aiPathBlockedTimer <=0) { this.bodyAngle += Math.PI / 1.5 * (Math.random() > 0.5 ? 1: -1) ; this.aiWanderTarget = null; this.aiMoveTimer = 250; this.aiPathBlockedTimer = 500; if (this.aiState === 'attacking') this.aiState = 'returning_to_patrol'; } if (this.isPlayer) { this.bodyAngle += 0.06 * (Math.random() > 0.5 ? 1 : -1); } } });
        this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x)); this.y = Math.max(this.height / 2, Math.min(canvas.height - this.height / 2, this.y));
    }
    shoot() { if(this.health<=0)return;const t=Date.now(),e=this.isPlayer?this.currentShootCooldown:this.aiShootActualCooldown,i=this.isPlayer?this.lastShotTime:this.aiLastShotTime;if(t-i>e){this.isPlayer?this.lastShotTime=t:this.aiLastShotTime=t,playSound(this.isPlayer?"shoot":"enemy_shoot",.15);const o=this.isBoss?1.2*BARREL_LENGTH:BARREL_LENGTH,s=this.x+o*Math.cos(this.turretAngle),a=this.y+o*Math.sin(this.turretAngle),l=this.isPlayer?this.currentBulletDamage:this.baseBulletDamage*this.bulletDamageMultiplier;if(this.isPlayer&&this.isSpreadShotActive){const t=[-.25,0,.25];t.forEach(t=>{bullets.push(new Bullet(s,a,this.turretAngle+t,!0,!1,!1,l))})}else bullets.push(new Bullet(s,a,this.turretAngle,this.isPlayer,this.isBoss,!1,l))}}
    bossSpecialAttack() { if(!this.isBoss||this.health<=0)return;playSound("explosion",.3,.25);const t=Math.PI/9,e=this.turretAngle-t*(BOSS_SPECIAL_ATTACK_BULLET_COUNT-1)/2;for(let i=0;i<BOSS_SPECIAL_ATTACK_BULLET_COUNT;i++){const s=e+i*t,a=this.x+1.2*BARREL_LENGTH*Math.cos(this.turretAngle),l=this.y+1.2*BARREL_LENGTH*Math.sin(this.turretAngle);bullets.push(new Bullet(a,l,s,!1,!0,!0))}} // isSpecial = true
    takeDamage(t){if(this.isPlayer&&this.hasShield)return playSound("shield_block",.3),void this.deactivatePowerUp("shield");this.health-=t,playSound("hit",.4),this.health<0&&(this.health=0),this.health<=0&&this.onDeath()}
    onDeath(){playSound(this.isPlayer?"player_death":"explosion");if(!this.isPlayer){score+=this.scoreValue;let t=Math.floor(this.scoreValue/3)+Math.floor(Math.random()*this.scoreValue/3);this.isBoss&&(t=75+Math.floor(50*Math.random())),playerMoney+=t,updateCurrencyDisplays();const e=enemies.indexOf(this);e>-1&&enemies.splice(e,1),Math.random()<POWERUP_SPAWN_CHANCE&&!this.isBoss&&powerUps.push(new PowerUp(this.x,this.y,POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)])),this.isBoss&&"boss_battle"===gameMode&&(message="BOSS DEFEATED!",messageTimer=2*MESSAGE_DURATION,savePlayerData(),setTimeout(()=>showGameOverScreen(!0),1.5*MESSAGE_DURATION))}else{const t=Math.floor(score/10);playerMoney+=t,moneyEarnedDisplay.textContent=t,updateCurrencyDisplays(),savePlayerData(),showGameOverScreen()}}
    activatePowerUp(t){const e=Date.now();playSound("powerup_pickup",.5),this.deactivatePowerUp(t,!1);let i=this.basePlayerShootCooldown,s=this.basePlayerBulletDamage;const a=SHOP_ITEMS[playerEquipment.turret];a&&a.statBoost&&(a.statBoost.shootCooldown&&(i*=1+a.statBoost.shootCooldown),a.statBoost.bulletDamage&&(s*=1+a.statBoost.bulletDamage));switch(t){case"rapid_fire":activePowerUps.rapid_fire={active:!0,endTime:e+POWERUP_DURATION},this.currentShootCooldown=i*.45;break;case"damage_boost":activePowerUps.damage_boost={active:!0,endTime:e+POWERUP_DURATION},this.currentBulletDamage=s*1.8;break;case"shield":activePowerUps.shield={active:!0,endTime:e+1.5*POWERUP_DURATION},this.hasShield=!0;break;case"health_pack":this.health=Math.min(this.maxHealth,this.health+.5*this.maxHealth),updateHTMLUI();break;case"spread_shot":activePowerUps.spread_shot={active:!0,endTime:e+POWERUP_DURATION},this.isSpreadShotActive=!0}}
    deactivatePowerUp(t,e=!0){let i=this.basePlayerShootCooldown,s=this.basePlayerBulletDamage;const a=SHOP_ITEMS[playerEquipment.turret];a&&a.statBoost&&(a.statBoost.shootCooldown&&(i*=1+a.statBoost.shootCooldown),a.statBoost.bulletDamage&&(s*=1+a.statBoost.bulletDamage));switch(t){case"rapid_fire":this.currentShootCooldown=i;break;case"damage_boost":this.currentBulletDamage=s;break;case"shield":this.hasShield=!1;break;case"spread_shot":this.isSpreadShotActive=!1}e&&activePowerUps[t]&&(activePowerUps[t].active=!1)}}

// --- Bullet Class (Keep updated constructor) ---
class Bullet { /* ... (Full code from previous, with damageOverride) ... */
    constructor(x, y, angle, firedByPlayer, firedByBoss = false, isSpecial = false, damageOverride = null) {
        this.x = x; this.y = y; this.angle = angle;
        this.firedByPlayer = firedByPlayer; this.firedByBoss = firedByBoss; this.isSpecial = isSpecial;
        this.damage = damageOverride !== null ? damageOverride : (this.firedByPlayer ? PLAYER_BASE_BULLET_DAMAGE : (this.firedByBoss ? (this.isSpecial ? 15 : 25) : 10) * (firedByPlayer ? 1 : SHOP_ITEMS[playerEquipment.turret]?.statBoost?.bulletDamage ? (1 + SHOP_ITEMS[playerEquipment.turret].statBoost.bulletDamage) : 1 ) ); // Apply turret damage to player only if not overridden
        this.radius = this.isSpecial ? BULLET_RADIUS * 1.3 : BULLET_RADIUS;
        this.color = this.firedByPlayer ? 'yellow' : (this.firedByBoss ? (this.isSpecial ? 'fuchsia' : 'orangered') : '#FF69B4');
        this.speed = this.isSpecial ? BULLET_SPEED * 0.75 : BULLET_SPEED;
    }
    draw(){ ctx.beginPath(); ctx.arc(this.x,this.y,this.radius,0,Math.PI*2); ctx.fillStyle=this.color; ctx.fill(); }
    update(){ this.x+=this.speed*Math.cos(this.angle); this.y+=this.speed*Math.sin(this.angle); }
    isOffScreen(){ return this.x<-this.radius||this.x>canvas.width+this.radius||this.y<-this.radius||this.y>canvas.height+this.radius; }
}

// --- Collision Detection (Keep as before) ---
function getBoundingBox(entity) { /* ... */ return { x: entity.x - entity.width / 2, y: entity.y - entity.height / 2, width: entity.width, height: entity.height }; }
function checkRectCollision(rect1, rect2) { /* ... */ return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }
function checkTankObstacleCollision(tank, obstacle) { return checkRectCollision(getBoundingBox(tank), obstacle.getBoundingBox()); }
function checkBulletTankCollision(bullet, tank) { /* ... */ if (tank.health <= 0) return false; const dist = getDistance(bullet.x, bullet.y, tank.x, tank.y); const tankEffectiveRadius = Math.max(tank.width, tank.height) / 1.9; return dist < tankEffectiveRadius + bullet.radius; }


// --- Game Management Functions (Shop/Garage integration) ---
function updateCurrencyDisplays() { /* ... */ const t=playerMoney.toLocaleString();currencyMenuDisplay.textContent=t,currencyShopDisplay.textContent=t,currencyGarageDisplay.textContent=t,gameActive&&(currencyGameDisplay.textContent=t); }
function loadPlayerData() { /* ... */ const t=localStorage.getItem(PLAYER_DATA_KEY);t&&(parsedData=JSON.parse(t),playerMoney=parsedData.money||0,playerInventory=parsedData.inventory||{bodies:["body_default"],turrets:["turret_default"],paints:["paint_default_green"]},playerEquipment=parsedData.equipment||{body:"body_default",turret:"turret_default",paint:"paint_default_green"}),updateCurrencyDisplays(),playerTank&&playerTank.isPlayer&&playerTank.applyEquipment(),loadHighScores();var parsedData }
function savePlayerData() { /* ... */ const t={money:playerMoney,inventory:playerInventory,equipment:playerEquipment};localStorage.setItem(PLAYER_DATA_KEY,JSON.stringify(t)) }

function populateShop() {
    shopItemsContainer.innerHTML = '';
    for (const itemId in SHOP_ITEMS) {
        const item = SHOP_ITEMS[itemId];
        if (item.isDefault) continue; // Don't show default items in shop

        const itemOwned = playerInventory[item.type + 's']?.includes(itemId);

        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';
        itemDiv.innerHTML = `
            <h4>${item.name}</h4>
            <div class="item-preview-placeholder">${item.type === 'paint' ? 'Màu: ' + item.color : 'Xem trước'}</div>
            <p>${item.description}</p>
            <p class="price">Giá: ${item.price} G</p>
            <button class="buy-button" data-item-id="${itemId}" ${itemOwned ? 'disabled' : ''}>
                ${itemOwned ? 'Đã Sở Hữu' : 'Mua Ngay'}
            </button>
        `;
        if (!itemOwned) {
            itemDiv.querySelector('.buy-button').onclick = () => buyItem(itemId);
        }
        shopItemsContainer.appendChild(itemDiv);
    }
}
function buyItem(itemId) {
    const item = SHOP_ITEMS[itemId];
    if (playerMoney >= item.price && !playerInventory[item.type + 's']?.includes(itemId)) {
        playerMoney -= item.price;
        playerInventory[item.type + 's'].push(itemId);
        playSound('buy_item');
        updateCurrencyDisplays();
        savePlayerData();
        populateShop(); // Refresh shop to update button state
        populateGarage(); // Refresh garage as item is now owned
        alert(`${item.name} đã được mua!`);
    } else if (playerInventory[item.type + 's']?.includes(itemId)) {
        alert("Bạn đã sở hữu vật phẩm này rồi!");
    } else {
        alert("Không đủ tiền!");
    }
}

function populateGarage() {
    bodyItemsContainer.innerHTML = ''; turretItemsContainer.innerHTML = ''; paintItemsContainer.innerHTML = '';
    ['bodies', 'turrets', 'paints'].forEach(category => {
        const container = category === 'bodies' ? bodyItemsContainer : (category === 'turrets' ? turretItemsContainer : paintItemsContainer);
        playerInventory[category].forEach(itemId => {
            const item = SHOP_ITEMS[itemId];
            if (!item) return;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'garage-item';
            if (playerEquipment[item.type] === itemId) itemDiv.classList.add('equipped');

            let previewContent = `${item.name}`;
            if (item.type === 'paint' && item.color) {
                 previewContent = `<div style="width:30px; height:30px; background-color:${item.color}; border:1px solid #ccc; margin:auto; border-radius:4px;"></div>${item.name}`;
            } else {
                previewContent = `<div class="item-preview-placeholder">${item.name.substring(0,3)}</div>${item.name}`;
            }
            itemDiv.innerHTML = previewContent;
            itemDiv.onclick = () => equipItem(item.type, itemId);
            container.appendChild(itemDiv);
        });
    });
    drawGarageTankPreview(); // Vẽ preview xe tăng hiện tại
}

function equipItem(itemType, itemId) {
    playerEquipment[itemType] = itemId;
    playSound('ui_click', 0.3);
    if (playerTank && playerTank.isPlayer) { // Nếu đang trong game thì không áp dụng ngay, chỉ lưu
        playerTank.applyEquipment(); // Áp dụng ngay nếu ở gara
    }
    savePlayerData();
    populateGarage(); // Refresh garage to show new equipped item
    // Nếu playerTank đang tồn tại (ví dụ: quay lại gara từ game đang chạy), cập nhật nó
    if(window.playerTank && window.playerTank.isPlayer && !gameActive){ // Check if playerTank is global and game is not active
        window.playerTank.applyEquipment();
    }
}

function drawGarageTankPreview() {
    ctxGarage.clearRect(0, 0, garageTankCanvas.width, garageTankCanvas.height);
    if (!playerTank) { // Nếu chưa có playerTank, tạo một bản tạm để vẽ
        const tempPlayerTank = new Tank(garageTankCanvas.width / 2, garageTankCanvas.height / 2, true);
        // tempPlayerTank.applyEquipment(); // Đã được gọi trong constructor của Tank khi isPlayer
        tempPlayerTank.drawInstance(ctxGarage); // Cần hàm drawInstance
    } else {
        // Cần một cách để vẽ playerTank hiện tại lên canvas nhỏ này
        // Tạo một bản sao hoặc vẽ trực tiếp nếu playerTank không bị thay đổi bởi game loop
        const previewTank = new Tank(garageTankCanvas.width / 2, garageTankCanvas.height / 2, true);
        // previewTank.applyEquipment(); // Đã được gọi trong constructor
        previewTank.drawInstance(ctxGarage);
    }
}
// Thêm hàm drawInstance vào lớp Tank để có thể vẽ lên context khác
Tank.prototype.drawInstance = function(targetCtx) {
    const originalCtx = ctx; // Lưu context gốc
    ctx = targetCtx;        // Tạm thời đổi context
    this.draw();            // Gọi hàm draw bình thường
    ctx = originalCtx;      // Khôi phục context gốc
};


function showShopScreen() { playSound('ui_click'); menuScreen.style.display = 'none'; shopScreen.style.display = 'block'; populateShop(); updateCurrencyDisplays(); }
function showGarageScreen() { playSound('ui_click'); menuScreen.style.display = 'none'; garageScreen.style.display = 'block'; populateGarage(); updateCurrencyDisplays(); }

// ... (spawnEnemy, startNewWave, createObstacles, showMenuScreen, showGameOverScreen, startGame - đã cập nhật cho tiền)
// Đảm bảo loadPlayerData() được gọi trong init() hoặc khi vào menu.
function spawnEnemy(isBossOverride = false) { /* ... */ let spawnX, spawnY, enemyTypeToSpawn; const isBossModeActive = ("boss_battle"===gameMode&&0===enemies.filter(e=>e.isBoss).length),actuallySpawnBoss=isBossOverride||isBossModeActive; if(actuallySpawnBoss)enemyTypeToSpawn=null;else{let t=Math.random()*Object.values(ENEMY_SPAWN_WEIGHTS).reduce((t,e)=>t+e,0);for(const e in ENEMY_SPAWN_WEIGHTS){if(t<ENEMY_SPAWN_WEIGHTS[e]){enemyTypeToSpawn=e;break}t-=ENEMY_SPAWN_WEIGHTS[e]}enemyTypeToSpawn||(enemyTypeToSpawn="normal")}const widthToUse=actuallySpawnBoss?BOSS_TANK_WIDTH:"scout"===enemyTypeToSpawn?SCOUT_TANK_WIDTH:"heavy"===enemyTypeToSpawn?HEAVY_TANK_WIDTH:ENEMY_TANK_WIDTH,heightToUse=actuallySpawnBoss?BOSS_TANK_HEIGHT:"scout"===enemyTypeToSpawn?SCOUT_TANK_HEIGHT:"heavy"===enemyTypeToSpawn?HEAVY_TANK_HEIGHT:ENEMY_TANK_HEIGHT,edge=Math.floor(4*Math.random()); switch(edge){case 0:spawnX=Math.random()*canvas.width,spawnY=-heightToUse;break;case 1:spawnX=Math.random()*canvas.width,spawnY=canvas.height+heightToUse;break;case 2:spawnX=-widthToUse,spawnY=Math.random()*canvas.height;break;case 3:spawnX=canvas.width+widthToUse,spawnY=Math.random()*canvas.height}enemies.push(new Tank(spawnX,spawnY,!1,actuallySpawnBoss,enemyTypeToSpawn)) }
function startNewWave() { /* ... */ currentWave++,enemiesThisWave=WAVE_BASE_ENEMY_COUNT+Math.floor(currentWave/1.5),message=`Wave ${currentWave}`,messageTimer=MESSAGE_DURATION,playSound("wave_clear",.4),enemies=[],bullets=[];for(let t=0;t<enemiesThisWave;t++)spawnEnemy() }
function createObstacles() { /* ... */ obstacles = []; const numObstacles = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < numObstacles; i++) { const obsWidth = 40 + Math.random() * 70; const obsHeight = 40 + Math.random() * 70; const obsX = Math.random() * (canvas.width - obsWidth - 80) + 40; const obsY = Math.random() * (canvas.height - obsHeight - 80) + 40; if (getDistance(obsX + obsWidth/2, obsY + obsHeight/2, canvas.width/2, canvas.height/1.2) > TANK_WIDTH * 4) { obstacles.push(new Obstacle(obsX, obsY, obsWidth, obsHeight)); } } }
function showMenuScreen() { /* ... */ gameActive = false; menuScreen.style.display = 'flex'; gameArea.style.display = 'none'; shopScreen.style.display = 'none'; garageScreen.style.display = 'none'; gameOverScreen.style.display = 'none'; loadPlayerData(); /* Tải dữ liệu người chơi khi vào menu */ loadHighScores(); if(gameLoopRequest) cancelAnimationFrame(gameLoopRequest); gameLoopRequest = null; }
function showGameOverScreen(bossDefeated = false) { /* ... */ gameActive = false; menuScreen.style.display = 'none'; /* gameArea.style.display = 'none'; */ gameOverScreen.style.display = 'block'; if (bossDefeated) { gameOverTitle.textContent = "VICTORY!"; finalScoreDisplay.textContent = score; waveReachedDisplay.style.display = 'none'; playSound('wave_clear', 0.7, 1.2); if (gameMode === 'boss_battle') { let wins = parseInt(localStorage.getItem(HIGH_SCORE_KEYS.boss_battle) || '0'); localStorage.setItem(HIGH_SCORE_KEYS.boss_battle, wins + 1); } } else { gameOverTitle.textContent = 'GAME OVER'; finalScoreDisplay.textContent = score; playSound('player_death', 0.6); if (gameMode === 'wave_defense') { waveReachedDisplay.style.display = 'block'; finalWaveDisplay.textContent = currentWave; } else { waveReachedDisplay.style.display = 'none'; } } savePlayerData(); /* Lưu tiền sau khi game over */ saveHighScore(); loadHighScores(); }
function startGame(mode) { /* ... */ initAudio(); currentSelectedMode = mode; gameMode = mode; menuScreen.style.display = 'none'; shopScreen.style.display = 'none'; garageScreen.style.display = 'none'; gameArea.style.display = 'flex'; gameOverScreen.style.display = 'none'; backToMenuBtnGame.style.display = 'inline-block'; playerTank = new Tank(canvas.width / 2, canvas.height / 1.2, true); bullets = []; enemies = []; powerUps = []; Object.keys(activePowerUps).forEach(key => activePowerUps[key] = {active: false, endTime: 0}); score = 0; gameActive = true; lastEnemySpawnTime = Date.now(); currentWave = 0; timeRemaining = TIME_ATTACK_DURATION; lastTickTime = Date.now(); message = `Chế độ: ${gameMode.replace('_', ' ').toUpperCase()}`; messageTimer = MESSAGE_DURATION; createObstacles(); if (gameMode === 'wave_defense') startNewWave(); else if (gameMode === 'survival') for (let i = 0; i < 2; i++) spawnEnemy(); else if (gameMode === 'boss_battle') { enemies = []; spawnEnemy(true); message = "BOSS BATTLE!"; } updateCurrencyDisplays(); /* Cập nhật tiền khi bắt đầu game */ if (gameLoopRequest) cancelAnimationFrame(gameLoopRequest); gameLoop(); }
// --- High Score Functions (Keep as before) ---
function saveHighScore() { /* ... */ let highScoreKey, currentBest; switch (gameMode) { case 'survival': highScoreKey = HIGH_SCORE_KEYS.survival; currentBest = parseInt(localStorage.getItem(highScoreKey) || '0'); if (score > currentBest) localStorage.setItem(highScoreKey, score); break; case 'wave_defense': highScoreKey = HIGH_SCORE_KEYS.wave_defense; currentBest = parseInt(localStorage.getItem(highScoreKey) || '0'); if (currentWave > currentBest) localStorage.setItem(highScoreKey, currentWave); break; case 'time_attack': highScoreKey = HIGH_SCORE_KEYS.time_attack; currentBest = parseInt(localStorage.getItem(highScoreKey) || '0'); if (score > currentBest) localStorage.setItem(highScoreKey, score); break; } }
function loadHighScores() { /* ... */ survivalHighScoreDisplay.textContent = localStorage.getItem(HIGH_SCORE_KEYS.survival) || '0'; waveHighScoreDisplay.textContent = localStorage.getItem(HIGH_SCORE_KEYS.wave_defense) || '0'; timeAttackHighScoreDisplay.textContent = localStorage.getItem(HIGH_SCORE_KEYS.time_attack) || '0'; }
// --- Input Handling (Keep as before) ---
// ... (Full input handling code)
function getTouchPos(canvasDom, touchEvent) { const rect = canvasDom.getBoundingClientRect(); return { x: touchEvent.clientX - rect.left, y: touchEvent.clientY - rect.top }; }
let isMouseDown = false;
function handleMouseDown(event) { if (!gameActive && gameOverScreen.style.display === 'none') return; isMouseDown = true; const pos = getTouchPos(canvas, event); if (moveJoystick.handleDown(pos.x, pos.y, 'mouse')) return; if (aimJoystick.handleDown(pos.x, pos.y, 'mouse')) return; if (fireButton.handleDown(pos.x, pos.y, 'mouse')) return; }
function handleMouseMove(event) { if (!isMouseDown || !gameActive) return; const pos = getTouchPos(canvas, event); moveJoystick.handleMove(pos.x, pos.y, 'mouse'); aimJoystick.handleMove(pos.x, pos.y, 'mouse'); }
function handleMouseUp(event) { if (!gameActive && gameOverScreen.style.display === 'none' && menuScreen.style.display === 'none') return; isMouseDown = false; moveJoystick.handleUp('mouse'); aimJoystick.handleUp('mouse'); fireButton.handleUp('mouse'); }
function handleTouchStart(event) { if (!gameActive && gameOverScreen.style.display === 'none') return; initAudio(); event.preventDefault(); const touches = event.changedTouches; const rect = canvas.getBoundingClientRect(); for (let i = 0; i < touches.length; i++) { const touch = touches[i]; const x = touch.clientX - rect.left; const y = touch.clientY - rect.top; if (moveJoystick.handleDown(x, y, touch.identifier)) continue; if (aimJoystick.handleDown(x, y, touch.identifier)) continue; if (fireButton.handleDown(x, y, touch.identifier)) continue; } }
function handleTouchMove(event) { if (!gameActive) return; event.preventDefault(); const touches = event.changedTouches; const rect = canvas.getBoundingClientRect(); for (let i = 0; i < touches.length; i++) { const touch = touches[i]; const x = touch.clientX - rect.left; const y = touch.clientY - rect.top; moveJoystick.handleMove(x, y, touch.identifier); aimJoystick.handleMove(x, y, touch.identifier); } }
function handleTouchEnd(event) { if (!gameActive && gameOverScreen.style.display === 'none' && menuScreen.style.display === 'none') return; event.preventDefault(); const touches = event.changedTouches; for (let i = 0; i < touches.length; i++) { const touch = touches[i]; moveJoystick.handleUp(touch.identifier); aimJoystick.handleUp(touch.identifier); fireButton.handleUp(touch.identifier); } }

// --- Game Loop (Keep as before) ---
// ... (update, checkActivePowerUps, draw, gameLoop, updateHTMLUI)
function update() { /* ... (Logic from previous complete script.js, ensure playerTank.applyEquipment is called if equipment changes during gameplay - though current setup only changes in Gara) ... */ if (!gameActive) return; const moveInput = moveJoystick.getValue(); const aimInput = aimJoystick.getValue(); if (playerTank) playerTank.update(moveInput, aimInput, null, obstacles); if (fireButton.isPressed && playerTank) playerTank.shoot(); enemies.forEach(enemy => enemy.update(null, null, playerTank, obstacles)); for (let i = powerUps.length - 1; i >= 0; i--) { if (powerUps[i].isExpired()) { powerUps.splice(i, 1); continue; } if (playerTank && getDistance(playerTank.x, playerTank.y, powerUps[i].x, powerUps[i].y) < (Math.max(playerTank.width, playerTank.height) / 1.8 + powerUps[i].radius)) { playerTank.activatePowerUp(powerUps[i].type); powerUps.splice(i, 1); continue; } } checkActivePowerUps(); for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; b.update(); if (b.isOffScreen()) { bullets.splice(i, 1); continue; } let bulletRemoved = false; for (const obs of obstacles) { if (checkRectCollision({x: b.x - b.radius, y: b.y - b.radius, width: b.radius*2, height: b.radius*2}, obs.getBoundingBox())) { bullets.splice(i,1); bulletRemoved = true; playSound('hit', 0.1, 0.05); break; } } if (bulletRemoved) continue; if (b.firedByPlayer) { for (let j = enemies.length - 1; j >= 0; j--) { if (checkBulletTankCollision(b, enemies[j])) { enemies[j].takeDamage(b.damage); bullets.splice(i, 1); break; } } } else { if (playerTank && checkBulletTankCollision(b, playerTank)) { playerTank.takeDamage(b.damage); bullets.splice(i, 1); } } } if (messageTimer > 0) messageTimer -= 1000 / 60; const currentTime = Date.now(); if (gameMode === 'survival') { if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL_SURVIVAL) { if (enemies.length < 8) spawnEnemy(); lastEnemySpawnTime = currentTime; } } else if (gameMode === 'wave_defense') { if (enemies.length === 0 && gameActive && messageTimer <= 0) { setTimeout(startNewWave, 1200); message = "Wave Cleared!"; messageTimer = 1200; } } else if (gameMode === 'time_attack') { const deltaTime = currentTime - lastTickTime; lastTickTime = currentTime; timeRemaining -= deltaTime; if (timeRemaining <= 0) { timeRemaining = 0; showGameOverScreen(); } if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL_SURVIVAL * 0.5) { if (enemies.length < 10) spawnEnemy(); lastEnemySpawnTime = currentTime; } } else if (gameMode === 'boss_battle') { /* Boss death handled in onDeath */ } }
function checkActivePowerUps() { /* ... */ if (!playerTank || !gameActive) return; const now = Date.now(); for (const type in activePowerUps) { if (activePowerUps[type].active && now > activePowerUps[type].endTime) { playerTank.deactivatePowerUp(type); } } }
function draw() { /* ... */ ctx.clearRect(0,0,canvas.width,canvas.height); obstacles.forEach(o=>o.draw()); powerUps.forEach(p=>p.draw()); playerTank&&playerTank.draw(); enemies.forEach(e=>e.draw()); bullets.forEach(b=>b.draw()); if(gameActive){moveJoystick&&moveJoystick.draw(); aimJoystick&&aimJoystick.draw(); fireButton&&fireButton.draw()} if(messageTimer>0&&message){ctx.fillStyle=`rgba(255, 255, 255, ${Math.min(1,messageTimer/(MESSAGE_DURATION/1.5))})`;ctx.font="bold 26px Arial";ctx.textAlign="center";ctx.strokeStyle=`rgba(0,0,0, ${Math.min(.7,messageTimer/(MESSAGE_DURATION/1.5))})`;ctx.lineWidth=3;ctx.strokeText(message,canvas.width/2,canvas.height/2-60);ctx.fillText(message,canvas.width/2,canvas.height/2-60);ctx.globalAlpha=1}}
function gameLoop() { if(gameActive)update(); draw(); updateHTMLUI(); gameLoopRequest=requestAnimationFrame(gameLoop) }
function updateHTMLUI() { /* ... */ if(playerTank){gameModeDisplay.textContent=`Chế độ: ${currentSelectedMode.replace("_"," ")}`;scoreDisplay.textContent=`Điểm: ${score}`;playerHealthDisplay.textContent=`HP: ${playerTank.health}`;waveInfoDisplay.style.display="none";timeInfoDisplay.style.display="none";bossInfoDisplay.style.display="none";if("wave_defense"===currentSelectedMode){waveInfoDisplay.style.display="inline";waveDisplay.textContent=currentWave;enemiesLeftDisplay.textContent=enemies.length}else if("time_attack"===currentSelectedMode){timeInfoDisplay.style.display="inline";const t=Math.max(0,Math.floor(timeRemaining/1e3)),e=Math.max(0,Math.floor(timeRemaining%1e3/100));timeDisplay.textContent=`TG: ${t}.${e}s`}else if("boss_battle"===currentSelectedMode&&enemies.length>0&&enemies[0].isBoss){bossInfoDisplay.style.display="inline";bossHealthUIDisplay.textContent=enemies[0].health}}else gameActive||"none"!==menuScreen.style.display||updateCurrencyDisplays()}


// --- Initialization (Cập nhật event listeners cho shop/garage) ---
function initEventListeners() {
    survivalBtn.onclick = () => { playSound('ui_click'); startGame('survival'); };
    waveBtn.onclick = () => { playSound('ui_click'); startGame('wave_defense'); };
    timeAttackBtn.onclick = () => { playSound('ui_click'); startGame('time_attack'); };
    bossBattleBtn.onclick = () => { playSound('ui_click'); startGame('boss_battle'); };

    shopBtn.onclick = () => { playSound('ui_click'); showShopScreen(); };
    garageBtn.onclick = () => { playSound('ui_click'); showGarageScreen(); };
    backToMenuFromShopBtn.onclick = () => { playSound('ui_click'); showMenuScreen(); };
    backToMenuFromGarageBtn.onclick = () => { playSound('ui_click'); showMenuScreen(); };

    restartBtn.onclick = () => { playSound('ui_click'); startGame(currentSelectedMode); };
    menuFromGameOverBtn.onclick = () => { playSound('ui_click'); showMenuScreen(); };
    backToMenuBtnGame.onclick = () => { playSound('ui_click'); gameActive = false; showMenuScreen(); /* Dừng game và về menu */};

    // ... (các event listener cho canvas giữ nguyên)
    canvas.addEventListener('mousedown', handleMouseDown); canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp); canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
}

function init() {
    console.log("Document loaded, initializing game systems...");
    const joystickBaseRadius = Math.min(canvas.width, canvas.height) * 0.09;
    const joystickStickRadius = joystickBaseRadius * 0.6;
    const joystickOffsetY = canvas.height - joystickBaseRadius - 15;
    const joystickOffsetX = joystickBaseRadius + 20;

    moveJoystick = new Joystick(joystickOffsetX, joystickOffsetY, joystickBaseRadius, joystickStickRadius);
    aimJoystick = new Joystick(canvas.width - joystickOffsetX, joystickOffsetY, joystickBaseRadius, joystickStickRadius);
    fireButton = new FireButton(canvas.width - joystickOffsetX, joystickOffsetY - joystickBaseRadius - 35, joystickBaseRadius * 0.7);

    initEventListeners();
    loadPlayerData(); // Tải dữ liệu người chơi ngay khi init
    showMenuScreen(); // Bắt đầu bằng việc hiển thị menu
    console.log("Game systems initialized. Waiting for mode selection.");
}

window.onload = init;
