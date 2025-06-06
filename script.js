// script.js (Phiên bản Hoàn Chỉnh Cuối Cùng - Đã Sửa Mọi Lỗi)

// --- DOM Elements ---
const menuScreen = document.getElementById('menuScreen');
const gameArea = document.getElementById('gameArea');
const gameOverScreen = document.getElementById('gameOverScreen');
const survivalBtn = document.getElementById('survivalBtn');
const waveBtn = document.getElementById('waveBtn');
const timeAttackBtn = document.getElementById('timeAttackBtn');
const bossBattleBtn = document.getElementById('bossBattleBtn');
const shopBtn = document.getElementById('shopBtn');
const garageBtn = document.getElementById('garageBtn');
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
const currencyGameDisplay = document.getElementById('currencyGame');
const moneyEarnedDisplay = document.getElementById('moneyEarned');
const gameModeDisplay = document.getElementById('gameModeDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const waveDisplay = document.getElementById('waveDisplay');
const enemiesLeftDisplay = document.getElementById('enemiesLeftDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const playerHealthDisplay = document.getElementById('playerHealthDisplay');
const waveInfoDisplay = document.getElementById('waveInfo');
const timeInfoDisplay = document.getElementById('timeInfo');
const bossInfoDisplay = document.getElementById('bossInfo');
const bossHealthUIDisplay = document.getElementById('bossHealthDisplay');
const backToMenuBtnGame = document.getElementById('backToMenuBtn');
const gameOverTitle = document.getElementById('gameOverTitle');
const finalScoreDisplay = document.getElementById('finalScore');
const waveReachedDisplay = document.getElementById('waveReached');
const finalWaveDisplay = document.getElementById('finalWave');
const restartBtn = document.getElementById('restartBtn');
const menuFromGameOverBtn = document.getElementById('menuFromGameOverBtn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Canvas & Game Constants ---
canvas.width = Math.min(window.innerWidth * 0.9, 1000);
canvas.height = Math.min(window.innerHeight * 0.8, 600);
const TANK_WIDTH = 40; const TANK_HEIGHT = 30;
const TURRET_RADIUS = 8; const BARREL_LENGTH = 25; const BARREL_WIDTH = 6;
const BULLET_RADIUS = 4; const BULLET_SPEED_BASE = 7;
const TANK_SPEED = 1.5; const TANK_ROTATION_SPEED = 0.035;
const PLAYER_BASE_SHOOT_COOLDOWN = 450;
const MAX_PLAYER_HEALTH_BASE = 100;
const PLAYER_BASE_BULLET_DAMAGE = 20;
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
const HIGH_SCORE_KEYS = { survival: 'tank_hs_survival', wave_defense: 'tank_hs_wave', time_attack: 'tank_hs_time', boss_battle: 'tank_hs_boss_wins' };


// --- Game State ---
let playerTank; let bullets = []; let enemies = []; let obstacles = []; let powerUps = [];
let moveJoystick, aimJoystick, fireButton;
let gameLoopRequest; let score = 0; let gameMode = 'survival'; let gameActive = false;
let lastFrameTime = 0; let lastEnemySpawnTime = 0; let currentWave = 0; let enemiesThisWave = 0;
let timeRemaining = TIME_ATTACK_DURATION;
let message = ""; let messageTimer = 0;
let currentSelectedMode = 'survival';
let audioCtx;
let activePowerUps = {
    rapid_fire: { active: false, endTime: 0 }, damage_boost: { active: false, endTime: 0 },
    shield: { active: false, endTime: 0 }, spread_shot: { active: false, endTime: 0 }
};
let playerMoney = 0;
const PLAYER_DATA_KEY = 'tankBattleAdvancedPlayerData';
let playerInventory = { bodies: ['body_default'], turrets: ['turret_default'], paints: ['paint_default_green'] };
let playerEquipment = { body: 'body_default', turret: 'turret_default', paint: 'paint_default_green' };

// --- Shop Item Definitions ---
const SHOP_ITEMS = {
    body_default: { name: "Thân Xe Tiêu Chuẩn", type: 'body', price: 0, description: "Thân xe cơ bản, không có hiệu ứng đặc biệt.", id: "body_default", isDefault: true },
    turret_default: { name: "Tháp Pháo Tiêu Chuẩn", type: 'turret', price: 0, description: "Tháp pháo cơ bản, sát thương và tốc độ bắn trung bình.", id: "turret_default", isDefault: true },
    paint_default_green: { name: "Sơn Xanh Lá", type: 'paint', price: 0, color: 'darkgreen', id: "paint_default_green", isDefault: true },
    body_armored: { name: "Thân Xe Bọc Giáp", type: 'body', price: 200, description: "Tăng 25 HP tối đa.", statBoost: { maxHealth: 25 }, id: "body_armored" },
    body_light: { name: "Thân Xe Hạng Nhẹ", type: 'body', price: 150, description: "Tăng 12% tốc độ di chuyển.", statBoost: { speed: 0.12 }, id: "body_light" },
    body_compact: { name: "Thân Xe Nhỏ Gọn", type: 'body', price: 350, description: "Giảm 15% kích thước xe tăng, khó bị bắn trúng hơn.", statBoost: { size: -0.15 }, id: "body_compact" },
    body_regenerating: { name: "Thân Xe Tái Tạo", type: 'body', price: 600, description: "Tự động hồi 1 HP mỗi giây.", statBoost: { healthRegen: 1 }, id: "body_regenerating" },
    body_collector: { name: "Thân Xe Sưu Tầm", type: 'body', price: 500, description: "Tăng 20% lượng tiền nhận được từ kẻ địch.", statBoost: { moneyBonus: 0.20 }, id: "body_collector" },
    body_heavy_plated: { name: "Thân Xe Siêu Giáp", type: 'body', price: 450, description: "Tăng 50 HP tối đa nhưng giảm 10% tốc độ.", statBoost: { maxHealth: 50, speed: -0.10 }, id: "body_heavy_plated" },
    body_fortress: { name: "Pháo Đài Di Động", type: 'body', price: 1200, description: "Tăng 75 HP, kháng 10% sát thương, nhưng giảm 25% tốc độ.", statBoost: { maxHealth: 75, speed: -0.25, damageResistance: 0.10 }, id: "body_fortress" },
    turret_rapid: { name: "Tháp Pháo Liên Thanh", type: 'turret', price: 250, description: "Giảm 20% thời gian nạp đạn.", statBoost: { shootCooldown: -0.20 }, id: "turret_rapid" },
    turret_sniper: { name: "Tháp Pháo Bắn Tỉa", type: 'turret', price: 300, description: "Tăng 25% sát thương đạn.", statBoost: { bulletDamage: 0.25 }, id: "turret_sniper" },
    turret_shotgun: { name: "Tháp Pháo Shotgun", type: 'turret', price: 700, description: "Bắn ra 3 viên đạn theo hình nón. Giảm nhẹ sát thương mỗi viên.", statBoost: { bulletDamage: -0.15, special: 'shotgun' }, id: "turret_shotgun" },
    turret_heavy_cannon: { name: "Đại Bác Hạng Nặng", type: 'turret', price: 650, description: "Tăng 60% sát thương nhưng tăng 50% thời gian nạp đạn.", statBoost: { bulletDamage: 0.60, shootCooldown: 0.50 }, id: "turret_heavy_cannon" },
    turret_long_barrel: { name: "Nòng Dài", type: 'turret', price: 400, description: "Tăng 30% tốc độ bay của đạn.", statBoost: { bulletSpeed: 0.30 }, id: "turret_long_barrel" },
    turret_vampiric: { name: "Tháp Pháo Hút Máu", type: 'turret', price: 900, description: "Hồi máu bằng 5% sát thương gây ra.", statBoost: { lifesteal: 0.05 }, id: "turret_vampiric" },
    turret_twin_barrel: { name: "Nòng Đôi", type: 'turret', price: 850, description: "Bắn ra 2 viên đạn song song. Giảm 10% tốc độ bắn.", statBoost: { shootCooldown: 0.10, special: 'twin' }, id: "turret_twin_barrel" },
    paint_red: { name: "Sơn Đỏ Lửa", type: 'paint', price: 50, color: '#B71C1C', id: "paint_red" },
    paint_blue: { name: "Sơn Xanh Biển", type: 'paint', price: 50, color: '#0D47A1', id: "paint_blue" },
    paint_yellow: { name: "Sơn Vàng Chanh", type: 'paint', price: 50, color: '#F9A825', id: "paint_yellow" },
    paint_purple: { name: "Sơn Tím Mộng Mơ", type: 'paint', price: 60, color: '#4A148C', id: "paint_purple" },
    paint_black: { name: "Sơn Đen Huyền Bí", type: 'paint', price: 75, color: '#212121', id: "paint_black" },
    paint_white: { name: "Sơn Trắng Tinh Khôi", type: 'paint', price: 75, color: '#E0E0E0', id: "paint_white" },
    paint_camo: { name: "Sơn Rằn Ri", type: 'paint', price: 100, colorPattern: ['#556B2F', '#8FBC8F', '#2F4F4F'], id: "paint_camo" },
    paint_digital_camo: { name: "Sơn Kỹ Thuật Số", type: 'paint', price: 120, colorPattern: ['#607D8B', '#455A64', '#90A4AE'], id: "paint_digital_camo" },
    paint_hazard: { name: "Sơn Cảnh Báo", type: 'paint', price: 150, colorPattern: ['#FFC107', '#212121'], id: "paint_hazard" },
    paint_chrome: { name: "Sơn Mạ Chrome", type: 'paint', price: 300, color: '#BDBDBD', isShiny: true, id: "paint_chrome" },
    paint_gold: { name: "Sơn Mạ Vàng", type: 'paint', price: 2000, color: '#FFD700', isShiny: true, id: "paint_gold" }
};

// --- Utility & Audio Functions ---
function getDistance(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }
function initAudio() { if (!audioCtx) { try { audioCtx = new(window.AudioContext || window.webkitAudioContext)(); } catch (e) { console.warn("Web Audio API is not supported."); } } }
function playSound(type, volume = 0.3, duration = 0.1) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(volume * 0.4, audioCtx.currentTime);
    switch (type) {
        case 'shoot': o.type = 'triangle'; o.frequency.setValueAtTime(300, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + duration); break;
        case 'enemy_shoot': o.type = 'sawtooth'; o.frequency.setValueAtTime(250, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + duration); g.gain.setValueAtTime(volume * 0.6, audioCtx.currentTime); break;
        case 'hit': o.type = 'square'; o.frequency.setValueAtTime(180, audioCtx.currentTime); duration = 0.05; g.gain.setValueAtTime(volume * 1.2, audioCtx.currentTime); break;
        case 'explosion': o.type = 'noise'; duration = 0.3; volume = 0.35; break;
        case 'player_death': o.type = 'sawtooth'; o.frequency.setValueAtTime(110, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + duration); duration = 0.5; volume = 0.45; break;
        case 'wave_clear': o.type = 'sine'; o.frequency.setValueAtTime(660, audioCtx.currentTime); o.frequency.setValueAtTime(880, audioCtx.currentTime + duration * 0.5); duration = 0.4; volume = 0.35; break;
        case 'powerup_pickup': o.type = 'sine'; o.frequency.setValueAtTime(523, audioCtx.currentTime); o.frequency.linearRampToValueAtTime(783, audioCtx.currentTime + duration * 0.8); volume = 0.35; duration = 0.2; break;
        case 'shield_block': o.type = 'sine'; o.frequency.setValueAtTime(1000, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + duration); duration = 0.08; volume = 0.25; break;
        case 'buy_item': o.type = 'square'; o.frequency.setValueAtTime(700, audioCtx.currentTime); o.frequency.linearRampToValueAtTime(1000, audioCtx.currentTime + duration * 0.5); duration = 0.15; volume = 0.3; break;
        case 'ui_click': o.type = 'sine'; o.frequency.setValueAtTime(800, audioCtx.currentTime); duration = 0.05; volume = 0.2; break;
        default: o.type = 'sine'; o.frequency.setValueAtTime(440, audioCtx.currentTime);
    }
    o.start(); o.stop(audioCtx.currentTime + duration);
}
function LightenDarkenColor(col, amt) {
    let usePound = false; if (col[0] == "#") { col = col.slice(1); usePound = true; }
    let num = parseInt(col, 16);
    let r = (num >> 16) + amt; if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt; if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt; if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + ("000000" + (g | (b << 8) | (r << 16)).toString(16)).slice(-6);
}

// --- Classes ---
class Obstacle { constructor(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; this.color = "#778899"; } draw(targetCtx) { targetCtx.fillStyle = this.color; targetCtx.fillRect(this.x, this.y, this.width, this.height); targetCtx.strokeStyle = "#556677"; targetCtx.lineWidth = 2; targetCtx.strokeRect(this.x, this.y, this.width, this.height); } getBoundingBox() { return { x: this.x, y: this.y, width: this.width, height: this.height }; } }
class PowerUp { constructor(x, y, type) { this.x = x; this.y = y; this.type = type; this.radius = POWERUP_RADIUS; this.createdAt = Date.now(); this.lifetime = 10000; switch (type) { case 'rapid_fire': this.color = 'cyan'; this.symbol = '⚡'; break; case 'damage_boost': this.color = 'orange'; this.symbol = '💥'; break; case 'shield': this.color = 'lightblue'; this.symbol = '🛡️'; break; case 'health_pack': this.color = 'lightgreen'; this.symbol = '➕'; break; case 'spread_shot': this.color = 'violet'; this.symbol = '∴'; break; default: this.color = 'gray'; this.symbol = '?'; } } draw(targetCtx) { const scale = 1 + Math.sin(Date.now() / 200) * .1; const scaledRadius = this.radius * scale; targetCtx.beginPath(); targetCtx.arc(this.x, this.y, scaledRadius, 0, 2 * Math.PI); targetCtx.fillStyle = this.color; targetCtx.fill(); targetCtx.strokeStyle = "white"; targetCtx.lineWidth = 2; targetCtx.stroke(); targetCtx.fillStyle = "black"; targetCtx.font = `bold ${scaledRadius * 1.1}px Arial`; targetCtx.textAlign = "center"; targetCtx.textBaseline = "middle"; targetCtx.fillText(this.symbol, this.x, this.y + 1); } isExpired() { return Date.now() - this.createdAt > this.lifetime; } }
class Joystick { constructor(x, y, baseRadius, stickRadius) { this.baseX = x; this.baseY = y; this.baseRadius = baseRadius; this.stickRadius = stickRadius; this.stickX = x; this.stickY = y; this.isActive = false; this.touchId = null; this.valueX = 0; this.valueY = 0; } draw(targetCtx) { targetCtx.beginPath(); targetCtx.arc(this.baseX, this.baseY, this.baseRadius, 0, 2 * Math.PI); targetCtx.fillStyle = "rgba(150, 150, 150, 0.4)"; targetCtx.fill(); targetCtx.beginPath(); targetCtx.arc(this.stickX, this.stickY, this.stickRadius, 0, 2 * Math.PI); targetCtx.fillStyle = "rgba(100, 100, 100, 0.7)"; targetCtx.fill(); } handleDown(x, y, touchId) { if (getDistance(x, y, this.baseX, this.baseY) < this.baseRadius + this.stickRadius) { this.isActive = true; this.touchId = touchId; this._updateStick(x, y); return true; } return false; } handleMove(x, y, touchId) { if (this.isActive && this.touchId === touchId) { this._updateStick(x, y); } } handleUp(touchId) { if (this.touchId === touchId) { this.isActive = false; this.touchId = null; this.stickX = this.baseX; this.stickY = this.baseY; this.valueX = 0; this.valueY = 0; } } _updateStick(x, y) { const dx = x - this.baseX; const dy = y - this.baseY; const dist = getDistance(x, y, this.baseX, this.baseY); if (dist < this.baseRadius) { this.stickX = x; this.stickY = y; } else { const angle = Math.atan2(dy, dx); this.stickX = this.baseX + this.baseRadius * Math.cos(angle); this.stickY = this.baseY + this.baseRadius * Math.sin(angle); } this.valueX = (this.stickX - this.baseX) / this.baseRadius; this.valueY = (this.stickY - this.baseY) / this.baseRadius; } getValue() { return { x: this.valueX, y: this.valueY }; } }
class FireButton { constructor(x, y, radius) { this.x = x; this.y = y; this.radius = radius; this.isPressed = false; this.touchId = null; } draw(targetCtx) { targetCtx.beginPath(); targetCtx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI); targetCtx.fillStyle = this.isPressed ? "rgba(255, 80, 80, 0.9)" : "rgba(255, 0, 0, 0.6)"; targetCtx.fill(); targetCtx.strokeStyle = "rgba(100,0,0,0.8)"; targetCtx.lineWidth = 3; targetCtx.stroke(); targetCtx.fillStyle = "white"; targetCtx.font = "bold 16px Arial"; targetCtx.textAlign = "center"; targetCtx.textBaseline = "middle"; targetCtx.fillText("Bắn", this.x, this.y); } handleDown(x, y, touchId) { if (getDistance(x, y, this.x, this.y) < this.radius) { this.isPressed = true; this.touchId = touchId; return true; } return false; } handleUp(touchId) { if (this.touchId === touchId) { this.isPressed = false; this.touchId = null; } } }
class Bullet {
    constructor(x, y, angle, firedByPlayer, damage, bulletSpeed, firedByBoss = false, isSpecial = false) {
        this.x = x; this.y = y; this.angle = angle;
        this.firedByPlayer = firedByPlayer; this.damage = damage;
        this.speed = bulletSpeed; this.firedByBoss = firedByBoss;
        this.isSpecial = isSpecial; this.source = firedByPlayer ? playerTank : null;
        this.radius = this.isSpecial ? BULLET_RADIUS * 1.3 : BULLET_RADIUS;
        this.color = this.firedByPlayer ? 'yellow' : (this.firedByBoss ? (this.isSpecial ? 'fuchsia' : 'orangered') : '#FF69B4');
    }
    draw(targetCtx) { targetCtx.beginPath(); targetCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); targetCtx.fillStyle = this.color; targetCtx.fill(); }
    update() { this.x += this.speed * Math.cos(this.angle); this.y += this.speed * Math.sin(this.angle); }
    isOffScreen() { return this.x < -this.radius || this.x > canvas.width + this.radius || this.y < -this.radius || this.y > canvas.height + this.radius; }
}
class Tank {
    constructor(x, y, isPlayer = true, isBoss = false, enemyType = 'normal') {
        this.x = x; this.y = y; this.isPlayer = isPlayer; this.isBoss = isBoss; this.enemyType = isPlayer ? null : enemyType;
        this.baseWidth = TANK_WIDTH; this.baseHeight = TANK_HEIGHT;
        this.baseMaxHealth = MAX_PLAYER_HEALTH_BASE; this.baseSpeed = TANK_SPEED;
        this.baseShootCooldown = PLAYER_BASE_SHOOT_COOLDOWN; this.baseBulletDamage = PLAYER_BASE_BULLET_DAMAGE; this.baseBulletSpeed = BULLET_SPEED_BASE;
        this.width = this.baseWidth; this.height = this.baseHeight;
        this.maxHealth = this.baseMaxHealth; this.speed = this.baseSpeed;
        this.currentShootCooldown = this.baseShootCooldown; this.currentBulletDamage = this.baseBulletDamage; this.currentBulletSpeed = this.baseBulletSpeed;
        this.healthRegen = 0; this.moneyBonus = 0; this.damageResistance = 0;
        this.lifesteal = 0; this.specialTurretType = null;
        this.colorBody = 'darkgreen'; this.colorTurret = 'green';
        this.colorPattern = null; this.isShiny = false;
        this.bulletDamageMultiplierAI = 1.0; this.scoreValue = 0;

        if (!isPlayer) this.setupEnemyStats();
        if (isPlayer) this.applyEquipment();

        this.health = this.maxHealth;
        this.bodyAngle = isPlayer ? -Math.PI / 2 : Math.random() * Math.PI * 2;
        this.turretAngle = this.bodyAngle;
        this.lastShotTime = 0;
        this.hasShield = false; this.isSpreadShotActive = false;

        if (!isPlayer) this.setupAI();
    }
    setupEnemyStats() {
        this.scoreValue = 10;
        this.aiShootCooldown = 1200 + Math.random() * 1800;
        if (this.isBoss) {
            this.width = BOSS_TANK_WIDTH; this.height = BOSS_TANK_HEIGHT; this.maxHealth = MAX_BOSS_HEALTH_BASE; this.speed = TANK_SPEED * 0.4;
            this.colorBody = '#1a1a1a'; this.colorTurret = '#4d4d4d';
            this.aiShootCooldown = BOSS_SHOOT_COOLDOWN_NORMAL; this.bulletDamageMultiplierAI = 1.25; this.scoreValue = 100;
        } else {
            switch (this.enemyType) {
                case 'scout':
                    this.width = SCOUT_TANK_WIDTH; this.height = SCOUT_TANK_HEIGHT; this.maxHealth = MAX_SCOUT_HEALTH; this.speed = TANK_SPEED * SCOUT_SPEED_MULTIPLIER;
                    this.aiShootCooldown *= SCOUT_SHOOT_COOLDOWN_MULTIPLIER; this.bulletDamageMultiplierAI = SCOUT_DAMAGE_MULTIPLIER;
                    this.colorBody = '#a0522d'; this.colorTurret = '#cd853f'; this.scoreValue = 15; break;
                case 'heavy':
                    this.width = HEAVY_TANK_WIDTH; this.height = HEAVY_TANK_HEIGHT; this.maxHealth = MAX_HEAVY_HEALTH; this.speed = TANK_SPEED * HEAVY_SPEED_MULTIPLIER;
                    this.aiShootCooldown *= HEAVY_SHOOT_COOLDOWN_MULTIPLIER; this.bulletDamageMultiplierAI = HEAVY_DAMAGE_MULTIPLIER;
                    this.colorBody = '#465962'; this.colorTurret = '#607D8B'; this.scoreValue = 25; break;
                default:
                    this.width = ENEMY_TANK_WIDTH; this.height = ENEMY_TANK_HEIGHT; this.maxHealth = MAX_ENEMY_HEALTH; this.speed = TANK_SPEED * (0.6 + Math.random() * 0.3);
                    this.colorBody = 'maroon'; this.colorTurret = 'red'; break;
            }
        }
    }
    setupAI() {
        this.aiState = 'patrolling'; this.aiMoveTimer = 0; this.aiTargetAngle = this.bodyAngle; this.aiLastShotTime = Date.now();
        this.aiSightRange = this.isBoss ? canvas.width * 1.5 : (this.enemyType === 'scout' ? 240 : (this.enemyType === 'heavy' ? 150 : 190)) + Math.random() * 70;
        this.aiWanderTarget = null; this.aiPathBlockedTimer = 0; if (this.isBoss) this.aiLastSpecialAttackTime = Date.now();
    }
    applyEquipment() {
        if (!this.isPlayer) return;
        const healthPercent = this.maxHealth > 0 ? this.health / this.maxHealth : 1;
        this.maxHealth = this.baseMaxHealth; this.speed = this.baseSpeed;
        let newShootCooldown = this.baseShootCooldown; let newBulletDamage = this.baseBulletDamage;
        this.currentBulletSpeed = this.baseBulletSpeed; this.width = this.baseWidth; this.height = this.baseHeight;
        this.healthRegen = 0; this.moneyBonus = 0; this.damageResistance = 0; this.lifesteal = 0; this.specialTurretType = null;
        const bodyItem = SHOP_ITEMS[playerEquipment.body];
        if (bodyItem?.statBoost) {
            const boost = bodyItem.statBoost;
            if (boost.maxHealth) this.maxHealth += boost.maxHealth;
            if (boost.speed) this.speed *= (1 + boost.speed);
            if (boost.size) { this.width *= (1 + boost.size); this.height *= (1 + boost.size); }
            if (boost.healthRegen) this.healthRegen = boost.healthRegen;
            if (boost.moneyBonus) this.moneyBonus = boost.moneyBonus;
            if (boost.damageResistance) this.damageResistance = boost.damageResistance;
        }
        const turretItem = SHOP_ITEMS[playerEquipment.turret];
        if (turretItem?.statBoost) {
            const boost = turretItem.statBoost;
            if (boost.shootCooldown) newShootCooldown *= (1 + boost.shootCooldown);
            if (boost.bulletDamage) newBulletDamage *= (1 + boost.bulletDamage);
            if (boost.bulletSpeed) this.currentBulletSpeed *= (1 + boost.bulletSpeed);
            if (boost.lifesteal) this.lifesteal = boost.lifesteal;
            if (boost.special) this.specialTurretType = boost.special;
        }
        const paintItem = SHOP_ITEMS[playerEquipment.paint];
        this.colorBody = paintItem?.color || 'darkgreen'; this.colorPattern = paintItem?.colorPattern || null;
        this.isShiny = paintItem?.isShiny || false; this.colorTurret = LightenDarkenColor(this.colorBody, 25);
        this.currentShootCooldown = activePowerUps.rapid_fire.active ? newShootCooldown * 0.45 : newShootCooldown;
        this.currentBulletDamage = activePowerUps.damage_boost.active ? newBulletDamage * 1.8 : newBulletDamage;
        if (!gameActive || isNaN(healthPercent)) { this.health = this.maxHealth; } else { this.health = Math.round(this.maxHealth * healthPercent); }
    }
    draw(targetCtx) {
        if (this.health <= 0 && !this.isBoss) return;
        targetCtx.save(); targetCtx.translate(this.x, this.y);
        targetCtx.rotate(this.bodyAngle);
        if (this.colorPattern) {
            const patternSize = this.colorPattern.length > 2 ? 10 : 20;
            targetCtx.fillStyle = this.colorBody; targetCtx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            for (let i = -this.width / 2; i < this.width / 2; i += patternSize) {
                for (let j = -this.height / 2; j < this.height / 2; j += patternSize) {
                    targetCtx.fillStyle = this.colorPattern[Math.floor(Math.random() * this.colorPattern.length)];
                    targetCtx.fillRect(i, j, patternSize, patternSize);
                }
            }
        } else {
            if (this.isShiny) {
                const gradient = targetCtx.createLinearGradient(-this.width / 2, -this.height / 2, this.width / 2, this.height / 2);
                gradient.addColorStop(0, LightenDarkenColor(this.colorBody, 40));
                gradient.addColorStop(0.5, this.colorBody);
                gradient.addColorStop(1, LightenDarkenColor(this.colorBody, -40));
                targetCtx.fillStyle = gradient;
            } else { targetCtx.fillStyle = this.colorBody; }
            targetCtx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        targetCtx.restore();
        targetCtx.save(); targetCtx.translate(this.x, this.y); targetCtx.rotate(this.turretAngle);
        const barrelLen = this.isBoss ? BARREL_LENGTH * 1.2 : BARREL_LENGTH;
        const barrelW = this.isBoss ? BARREL_WIDTH * 1.2 : BARREL_WIDTH;
        const turretRad = this.isBoss ? TURRET_RADIUS * 1.5 : TURRET_RADIUS;
        targetCtx.fillStyle = LightenDarkenColor(this.colorTurret, -20);
        targetCtx.fillRect(turretRad * 0.5, -barrelW / 2, barrelLen, barrelW);
        targetCtx.beginPath(); targetCtx.arc(0, 0, turretRad, 0, Math.PI * 2);
        targetCtx.fillStyle = this.colorTurret; targetCtx.fill();
        targetCtx.restore();
        if (this.isPlayer && this.hasShield) {
             targetCtx.beginPath(); targetCtx.arc(this.x, this.y, Math.max(this.width, this.height) * 0.75, 0, Math.PI * 2);
             const shieldAlpha = activePowerUps.shield.active ? Math.max(0, (activePowerUps.shield.endTime - Date.now())) / (POWERUP_DURATION * 1.5) : 0;
             targetCtx.strokeStyle = `rgba(100, 180, 255, ${Math.max(0.2, shieldAlpha * 0.9)})`;
             targetCtx.lineWidth = 3 + Math.sin(Date.now() / 100) * 1.5; targetCtx.stroke();
        }
        const healthBarW = this.isBoss ? HEALTH_BAR_WIDTH * 2.5 : HEALTH_BAR_WIDTH;
        const healthBarX = this.x - healthBarW / 2;
        const healthBarY = this.y - this.height / 2 - HEALTH_BAR_HEIGHT - 9;
        targetCtx.fillStyle = '#555'; targetCtx.fillRect(healthBarX - 1, healthBarY - 1, healthBarW + 2, HEALTH_BAR_HEIGHT + 2);
        targetCtx.fillStyle = 'darkred'; targetCtx.fillRect(healthBarX, healthBarY, healthBarW, HEALTH_BAR_HEIGHT);
        const currentHealthW = (this.health / this.maxHealth) * healthBarW;
        targetCtx.fillStyle = 'lime'; targetCtx.fillRect(healthBarX, healthBarY, Math.max(0, currentHealthW), HEALTH_BAR_HEIGHT);
    }
    update(moveInput, aimInput, playerTankRef, obstaclesRef, deltaTime) {
        if (this.health <= 0 || !deltaTime) return;
        if (this.isPlayer && this.healthRegen > 0 && this.health < this.maxHealth) {
            this.health += this.healthRegen * (deltaTime / 1000);
            if (this.health > this.maxHealth) this.health = this.maxHealth;
        }
        let prevX = this.x; let prevY = this.y;
        if (this.isPlayer) { if (Math.abs(moveInput.y) > 0.1) { const moveSpeed = -moveInput.y * this.speed; this.x += moveSpeed * Math.cos(this.bodyAngle); this.y += moveSpeed * Math.sin(this.bodyAngle); } if (Math.abs(moveInput.x) > 0.1) { this.bodyAngle += moveInput.x * TANK_ROTATION_SPEED * Math.sign(-moveInput.y || 1); } if (Math.abs(aimInput.x) > 0.1 || Math.abs(aimInput.y) > 0.1) { this.turretAngle = Math.atan2(aimInput.y, aimInput.x); } }
        else { this.aiMoveTimer -= deltaTime; const distanceToPlayer = playerTankRef && playerTankRef.health > 0 ? getDistance(this.x, this.y, playerTankRef.x, playerTankRef.y) : Infinity; if (distanceToPlayer < this.aiSightRange && playerTankRef.health > 0) { this.aiState = this.isBoss ? 'boss_attacking' : 'attacking'; this.aiWanderTarget = null; } else if (this.aiState !== 'returning_to_patrol') { this.aiState = 'patrolling'; } if (this.aiPathBlockedTimer > 0) this.aiPathBlockedTimer -= deltaTime; let targetAngleForMovement = this.bodyAngle; let tryToMove = false; if (this.aiState === 'patrolling' || this.aiState === 'returning_to_patrol') { if (!this.aiWanderTarget || this.aiMoveTimer <= 0 || getDistance(this.x, this.y, this.aiWanderTarget.x, this.aiWanderTarget.y) < this.width) { if (this.aiState === 'returning_to_patrol') this.aiState = 'patrolling'; this.aiWanderTarget = { x: Math.random() * (canvas.width - this.width*2) + this.width, y: Math.random() * (canvas.height - this.height*2) + this.height }; this.aiMoveTimer = 3000 + Math.random() * 4000; } targetAngleForMovement = Math.atan2(this.aiWanderTarget.y - this.y, this.aiWanderTarget.x - this.x); this.turretAngle = this.bodyAngle; tryToMove = true; } else if (this.aiState === 'attacking' || this.aiState === 'boss_attacking') { targetAngleForMovement = Math.atan2(playerTankRef.y - this.y, playerTankRef.x - this.x); this.turretAngle = targetAngleForMovement; tryToMove = true; if (this.enemyType === 'scout') { if (distanceToPlayer < this.aiSightRange * 0.4) targetAngleForMovement += Math.PI; else if (distanceToPlayer < this.aiSightRange * 0.8) targetAngleForMovement += (Math.random() > 0.5 ? Math.PI/2.5 : -Math.PI/2.5) ; } else if (this.enemyType === 'heavy' || this.isBoss) { if (distanceToPlayer < this.aiSightRange * 0.25) tryToMove = false; } const currentTime = Date.now(); if (currentTime - this.lastShotTime > this.aiShootCooldown) { this.shoot(); this.lastShotTime = currentTime; } if (this.isBoss && currentTime - this.aiLastSpecialAttackTime > BOSS_SHOOT_COOLDOWN_SPECIAL) { this.bossSpecialAttack(); this.aiLastSpecialAttackTime = currentTime; } } if (this.aiPathBlockedTimer <=0 && tryToMove) { let angleDiffBody = targetAngleForMovement - this.bodyAngle; while (angleDiffBody > Math.PI) angleDiffBody -= Math.PI * 2; while (angleDiffBody < -Math.PI) angleDiffBody += Math.PI * 2; if (Math.abs(angleDiffBody) > TANK_ROTATION_SPEED * 0.8) { this.bodyAngle += Math.sign(angleDiffBody) * TANK_ROTATION_SPEED * 0.8; } else { this.bodyAngle = targetAngleForMovement; } if (Math.abs(angleDiffBody) < Math.PI / 1.7 || this.aiState.includes('attacking')) { this.x += this.speed * Math.cos(this.bodyAngle); this.y += this.speed * Math.sin(this.bodyAngle); } } }
        obstaclesRef.forEach(obs => { if (checkTankObstacleCollision(this, obs)) { this.x = prevX; this.y = prevY; if (!this.isPlayer && this.aiPathBlockedTimer <=0) { this.bodyAngle += Math.PI / 1.5 * (Math.random() > 0.5 ? 1: -1) ; this.aiWanderTarget = null; this.aiMoveTimer = 250; this.aiPathBlockedTimer = 500; if (this.aiState === 'attacking') this.aiState = 'returning_to_patrol'; } if (this.isPlayer) { this.bodyAngle += 0.06 * (Math.random() > 0.5 ? 1 : -1); } } });
        this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x)); this.y = Math.max(this.height / 2, Math.min(canvas.height - this.height / 2, this.y));
    }
    shoot() {
        if (this.health <= 0) return;
        const now = Date.now();
        const cooldown = this.isPlayer ? this.currentShootCooldown : this.aiShootCooldown;
        if (now - this.lastShotTime > cooldown) {
            this.lastShotTime = now; playSound(this.isPlayer ? "shoot" : "enemy_shoot", 0.15);
            const barrelOffset = this.isBoss ? 1.2 * BARREL_LENGTH : BARREL_LENGTH;
            const bulletStartX = this.x + barrelOffset * Math.cos(this.turretAngle);
            const bulletStartY = this.y + barrelOffset * Math.sin(this.turretAngle);
            const damage = this.isPlayer ? this.currentBulletDamage : (this.baseBulletDamage * this.bulletDamageMultiplierAI);
            const speed = this.isPlayer ? this.currentBulletSpeed : BULLET_SPEED_BASE;
            if (this.isPlayer && this.specialTurretType) {
                switch (this.specialTurretType) {
                    case 'shotgun': const spreadAngles = [-0.25, 0, 0.25]; spreadAngles.forEach(angle => { bullets.push(new Bullet(bulletStartX, bulletStartY, this.turretAngle + angle, true, damage, speed)); }); break;
                    case 'twin': const pAngle = this.turretAngle + Math.PI / 2; const offset = 5;
                        bullets.push(new Bullet(bulletStartX + offset * Math.cos(pAngle), bulletStartY + offset * Math.sin(pAngle), this.turretAngle, true, damage, speed));
                        bullets.push(new Bullet(bulletStartX - offset * Math.cos(pAngle), bulletStartY - offset * Math.sin(pAngle), this.turretAngle, true, damage, speed)); break;
                }
            } else if (this.isPlayer && this.isSpreadShotActive) { const spreadAngles = [-0.25, 0, 0.25]; spreadAngles.forEach(angle => { bullets.push(new Bullet(bulletStartX, bulletStartY, this.turretAngle + angle, true, damage, speed)); });
            } else { bullets.push(new Bullet(bulletStartX, bulletStartY, this.turretAngle, this.isPlayer, damage, speed, this.isBoss)); }
        }
    }
    bossSpecialAttack() { if (!this.isBoss || this.health <= 0) return; playSound("explosion", 0.3, 0.25); const spreadAngle = Math.PI / 9; const startAngle = this.turretAngle - spreadAngle * (BOSS_SPECIAL_ATTACK_BULLET_COUNT - 1) / 2; for (let i = 0; i < BOSS_SPECIAL_ATTACK_BULLET_COUNT; i++) { const angle = startAngle + i * spreadAngle; const bulletStartX = this.x + 1.2 * BARREL_LENGTH * Math.cos(this.turretAngle); const bulletStartY = this.y + 1.2 * BARREL_LENGTH * Math.sin(this.turretAngle); bullets.push(new Bullet(bulletStartX, bulletStartY, angle, false, 15, BULLET_SPEED_BASE * 0.75, true, true)); } }
    takeDamage(bullet) {
        if (this.isPlayer && this.hasShield) { playSound("shield_block", 0.3); this.deactivatePowerUp("shield"); return; }
        const finalDamage = this.isPlayer ? bullet.damage * (1 - this.damageResistance) : bullet.damage;
        this.health -= finalDamage;
        if (bullet.source && bullet.source.isPlayer && bullet.source.lifesteal > 0) {
            const healedAmount = finalDamage * bullet.source.lifesteal;
            bullet.source.health = Math.min(bullet.source.maxHealth, bullet.source.health + healedAmount);
        }
        playSound("hit", 0.4); if (this.health <= 0) { this.health = 0; this.onDeath(); }
    }
    onDeath() {
        playSound(this.isPlayer ? "player_death" : "explosion");
        if (!this.isPlayer) {
            score += this.scoreValue;
            let moneyDrop = this.isBoss ? (75 + Math.floor(Math.random() * 50)) : (Math.floor(this.scoreValue / 3) + Math.floor(Math.random() * this.scoreValue / 3));
            if (playerTank?.moneyBonus > 0) { moneyDrop *= (1 + playerTank.moneyBonus); }
            playerMoney += Math.floor(moneyDrop);
            updateCurrencyDisplays(); const index = enemies.indexOf(this); if (index > -1) enemies.splice(index, 1);
            if (Math.random() < POWERUP_SPAWN_CHANCE && !this.isBoss) { powerUps.push(new PowerUp(this.x, this.y, POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)])); }
            if (this.isBoss && gameMode === "boss_battle") { message = "BOSS DEFEATED!"; messageTimer = 2 * MESSAGE_DURATION; savePlayerData(); setTimeout(() => showGameOverScreen(true), 1500); }
        } else {
            const moneyFromScore = Math.floor(score / 10); playerMoney += moneyFromScore;
            moneyEarnedDisplay.textContent = moneyFromScore; updateCurrencyDisplays();
            savePlayerData(); showGameOverScreen();
        }
    }
    activatePowerUp(type) {
        const now = Date.now(); playSound("powerup_pickup", 0.5); this.deactivatePowerUp(type, false);
        let baseCooldown = this.baseShootCooldown; let baseDamage = this.baseBulletDamage;
        const turretItem = SHOP_ITEMS[playerEquipment.turret];
        if (turretItem?.statBoost) {
            if (turretItem.statBoost.shootCooldown) baseCooldown *= (1 + turretItem.statBoost.shootCooldown);
            if (turretItem.statBoost.bulletDamage) baseDamage *= (1 + turretItem.statBoost.bulletDamage);
        }
        switch (type) {
            case "rapid_fire": activePowerUps.rapid_fire = { active: true, endTime: now + POWERUP_DURATION }; this.currentShootCooldown = baseCooldown * 0.45; break;
            case "damage_boost": activePowerUps.damage_boost = { active: true, endTime: now + POWERUP_DURATION }; this.currentBulletDamage = baseDamage * 1.8; break;
            case "shield": activePowerUps.shield = { active: true, endTime: now + POWERUP_DURATION * 1.5 }; this.hasShield = true; break;
            case "health_pack": this.health = Math.min(this.maxHealth, this.health + 0.5 * this.maxHealth); updateHTMLUI(); break;
            case "spread_shot": activePowerUps.spread_shot = { active: true, endTime: now + POWERUP_DURATION }; this.isSpreadShotActive = true;
        }
    }
    deactivatePowerUp(type, resetActiveFlag = true) {
        let baseCooldown = this.baseShootCooldown; let baseDamage = this.baseBulletDamage;
        const turretItem = SHOP_ITEMS[playerEquipment.turret];
        if (turretItem?.statBoost) {
            if (turretItem.statBoost.shootCooldown) baseCooldown *= (1 + turretItem.statBoost.shootCooldown);
            if (turretItem.statBoost.bulletDamage) baseDamage *= (1 + turretItem.statBoost.bulletDamage);
        }
        switch (type) {
            case "rapid_fire": this.currentShootCooldown = baseCooldown; break;
            case "damage_boost": this.currentBulletDamage = baseDamage; break;
            case "shield": this.hasShield = false; break;
            case "spread_shot": this.isSpreadShotActive = false;
        }
        if (resetActiveFlag && activePowerUps[type]) { activePowerUps[type].active = false; }
    }
}

// --- Collision Detection ---
function getBoundingBox(entity) { return { x: entity.x - entity.width / 2, y: entity.y - entity.height / 2, width: entity.width, height: entity.height }; }
function checkRectCollision(rect1, rect2) { return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }
function checkTankObstacleCollision(tank, obstacle) { return checkRectCollision(getBoundingBox(tank), obstacle.getBoundingBox()); }
function checkBulletTankCollision(bullet, tank) { if (tank.health <= 0) return false; const dist = getDistance(bullet.x, bullet.y, tank.x, tank.y); const tankEffectiveRadius = Math.max(tank.width, tank.height) / 1.9; return dist < tankEffectiveRadius + bullet.radius; }

// --- Game Management Functions ---
function getInventoryCategoryKey(itemType) { return itemType === 'body' ? 'bodies' : itemType + 's'; }
function updateCurrencyDisplays() { const moneyStr = playerMoney.toLocaleString(); currencyMenuDisplay.textContent = moneyStr; currencyShopDisplay.textContent = moneyStr; currencyGarageDisplay.textContent = moneyStr; if (gameActive) currencyGameDisplay.textContent = moneyStr; }
function loadPlayerData() {
    const data = localStorage.getItem(PLAYER_DATA_KEY);
    if (data) {
        const parsed = JSON.parse(data);
        playerMoney = parsed.money || 0;
        playerInventory = parsed.inventory || { bodies: ["body_default"], turrets: ["turret_default"], paints: ["paint_default_green"] };
        if (!playerInventory.bodies?.includes('body_default')) playerInventory.bodies.unshift('body_default');
        if (!playerInventory.turrets?.includes('turret_default')) playerInventory.turrets.unshift('turret_default');
        if (!playerInventory.paints?.includes('paint_default_green')) playerInventory.paints.unshift('paint_default_green');
        playerEquipment = parsed.equipment || { body: "body_default", turret: "turret_default", paint: "paint_default_green" };
    }
    updateCurrencyDisplays(); loadHighScores();
}
function savePlayerData() { const data = { money: playerMoney, inventory: playerInventory, equipment: playerEquipment }; localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(data)); }
function populateShop() {
    shopItemsContainer.innerHTML = '';
    for (const itemId in SHOP_ITEMS) {
        const item = SHOP_ITEMS[itemId];
        if (item.isDefault) continue;
        const categoryKey = getInventoryCategoryKey(item.type);
        const itemOwned = playerInventory[categoryKey]?.includes(itemId);
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';
        let previewStyle = '';
        if (item.type === 'paint') {
            if (item.isShiny) { previewStyle = `background: linear-gradient(135deg, ${LightenDarkenColor(item.color, 40)}, ${item.color}, ${LightenDarkenColor(item.color, -40)});`; }
            else if (item.colorPattern) { previewStyle = `background-image: conic-gradient(${item.colorPattern.join(', ')});`; }
            else { previewStyle = `background-color:${item.color};`; }
        }
        itemDiv.innerHTML = `<div class="shop-item-header"><h4>${item.name}</h4><p class="price">${item.price.toLocaleString()} G</p></div><div class="item-preview-placeholder" style="${previewStyle}">${item.type !== 'paint' ? item.name.substring(0, 3).toUpperCase() : ''}</div><p class="item-description">${item.description}</p><button class="buy-button" data-item-id="${itemId}" ${itemOwned ? 'disabled' : ''}>${itemOwned ? 'Đã Sở Hữu' : 'Mua Ngay'}</button>`;
        if (!itemOwned) { itemDiv.querySelector('.buy-button').onclick = () => buyItem(itemId); }
        shopItemsContainer.appendChild(itemDiv);
    }
}
function buyItem(itemId) {
    const item = SHOP_ITEMS[itemId]; const categoryKey = getInventoryCategoryKey(item.type);
    if (playerInventory[categoryKey]?.includes(itemId)) { alert("Bạn đã sở hữu vật phẩm này rồi!"); return; }
    if (playerMoney >= item.price) {
        playerMoney -= item.price; playerInventory[categoryKey].push(itemId);
        playSound('buy_item'); updateCurrencyDisplays(); savePlayerData();
        populateShop(); populateGarage(); alert(`${item.name} đã được mua!`);
    } else { alert("Không đủ tiền để mua vật phẩm này!"); }
}
function populateGarage() {
    bodyItemsContainer.innerHTML = ''; turretItemsContainer.innerHTML = ''; paintItemsContainer.innerHTML = '';
    ['bodies', 'turrets', 'paints'].forEach(category => {
        const container = category === 'bodies' ? bodyItemsContainer : (category === 'turrets' ? turretItemsContainer : paintItemsContainer);
        const categoryKey = getInventoryCategoryKey(category.slice(0, -1)); // 'bodies' -> 'body'
        playerInventory[category].forEach(itemId => {
            const item = SHOP_ITEMS[itemId]; if (!item) return;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'garage-item';
            if (playerEquipment[item.type] === itemId) itemDiv.classList.add('equipped');
            let previewContent = '';
             if (item.type === 'paint') {
                 let style = item.isShiny ? `background: linear-gradient(135deg, ${LightenDarkenColor(item.color, 40)}, ${item.color})` : item.colorPattern ? `background-image: conic-gradient(from 90deg, ${item.colorPattern.join(', ')})` : `background-color:${item.color || '#ccc'}`;
                 previewContent = `<div class="item-preview-color" style="${style}"></div><p>${item.name}</p>`;
            } else { previewContent = `<div class="item-preview-placeholder">${item.name.substring(0, 3).toUpperCase()}</div><p>${item.name}</p>`; }
            itemDiv.innerHTML = previewContent;
            itemDiv.onclick = () => equipItem(item.type, itemId);
            container.appendChild(itemDiv);
        });
    });
    drawGarageTankPreview();
}
function equipItem(itemType, itemId) { playerEquipment[itemType] = itemId; playSound('ui_click', 0.3); savePlayerData(); populateGarage(); }
function drawGarageTankPreview() { ctxGarage.clearRect(0, 0, garageTankCanvas.width, garageTankCanvas.height); const previewTank = new Tank(garageTankCanvas.width / 2, garageTankCanvas.height / 2, true); previewTank.draw(ctxGarage); }
function showShopScreen() { playSound('ui_click'); menuScreen.style.display = 'none'; shopScreen.style.display = 'block'; populateShop(); updateCurrencyDisplays(); }
function showGarageScreen() { playSound('ui_click'); menuScreen.style.display = 'none'; garageScreen.style.display = 'block'; populateGarage(); updateCurrencyDisplays(); }
function spawnEnemy(isBossOverride = false) {
    let spawnX, spawnY;
    const isBossModeActive = (gameMode === "boss_battle" && enemies.filter(e => e.isBoss).length === 0);
    const actuallySpawnBoss = isBossOverride || isBossModeActive;
    let enemyTypeToSpawn = null;
    if (!actuallySpawnBoss) {
        let rand = Math.random() * Object.values(ENEMY_SPAWN_WEIGHTS).reduce((sum, w) => sum + w, 0);
        for (const type in ENEMY_SPAWN_WEIGHTS) { if (rand < ENEMY_SPAWN_WEIGHTS[type]) { enemyTypeToSpawn = type; break; } rand -= ENEMY_SPAWN_WEIGHTS[type]; }
        if (!enemyTypeToSpawn) enemyTypeToSpawn = "normal";
    }
    const widthToUse = actuallySpawnBoss ? BOSS_TANK_WIDTH : enemyTypeToSpawn === 'scout' ? SCOUT_TANK_WIDTH : enemyTypeToSpawn === 'heavy' ? HEAVY_TANK_WIDTH : ENEMY_TANK_WIDTH;
    const heightToUse = actuallySpawnBoss ? BOSS_TANK_HEIGHT : enemyTypeToSpawn === 'scout' ? SCOUT_TANK_HEIGHT : enemyTypeToSpawn === 'heavy' ? HEAVY_TANK_HEIGHT : ENEMY_TANK_HEIGHT;
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
        case 0: spawnX = Math.random() * canvas.width; spawnY = -heightToUse; break;
        case 1: spawnX = Math.random() * canvas.width; spawnY = canvas.height + heightToUse; break;
        case 2: spawnX = -widthToUse; spawnY = Math.random() * canvas.height; break;
        case 3: spawnX = canvas.width + widthToUse; spawnY = Math.random() * canvas.height; break;
    }
    enemies.push(new Tank(spawnX, spawnY, false, actuallySpawnBoss, enemyTypeToSpawn));
}
function startNewWave() { currentWave++; enemiesThisWave = WAVE_BASE_ENEMY_COUNT + Math.floor(currentWave / 1.5); message = `Wave ${currentWave}`; messageTimer = MESSAGE_DURATION; playSound("wave_clear", 0.4); enemies = []; bullets = []; for (let i = 0; i < enemiesThisWave; i++) spawnEnemy(); }
function createObstacles() { obstacles = []; const numObstacles = 3 + Math.floor(Math.random() * 4); for (let i = 0; i < numObstacles; i++) { const obsWidth = 50 + Math.random() * 80; const obsHeight = 50 + Math.random() * 80; const obsX = Math.random() * (canvas.width - obsWidth - 100) + 50; const obsY = Math.random() * (canvas.height - obsHeight - 150) + 50; if (getDistance(obsX + obsWidth / 2, obsY + obsHeight / 2, canvas.width / 2, canvas.height * 0.85) > TANK_WIDTH * 4) { obstacles.push(new Obstacle(obsX, obsY, obsWidth, obsHeight)); } } }
function showMenuScreen() { gameActive = false; menuScreen.style.display = 'flex'; gameArea.style.display = 'none'; shopScreen.style.display = 'none'; garageScreen.style.display = 'none'; gameOverScreen.style.display = 'none'; loadPlayerData(); if (gameLoopRequest) cancelAnimationFrame(gameLoopRequest); gameLoopRequest = null; }
function showGameOverScreen(bossDefeated = false) {
    gameActive = false; gameOverScreen.style.display = 'block';
    if (bossDefeated) {
        gameOverTitle.textContent = "VICTORY!"; finalScoreDisplay.textContent = score; waveReachedDisplay.style.display = 'none'; playSound('wave_clear', 0.7, 1.2);
        if (gameMode === 'boss_battle') { let wins = parseInt(localStorage.getItem(HIGH_SCORE_KEYS.boss_battle) || '0'); localStorage.setItem(HIGH_SCORE_KEYS.boss_battle, wins + 1); }
    } else {
        gameOverTitle.textContent = 'GAME OVER'; finalScoreDisplay.textContent = score; playSound('player_death', 0.6);
        if (gameMode === 'wave_defense') { waveReachedDisplay.style.display = 'block'; finalWaveDisplay.textContent = currentWave; } else { waveReachedDisplay.style.display = 'none'; }
    }
    savePlayerData(); saveHighScore(); loadHighScores();
}
function startGame(mode) {
    initAudio(); currentSelectedMode = mode; gameMode = mode;
    menuScreen.style.display = 'none'; gameArea.style.display = 'flex'; gameOverScreen.style.display = 'none'; backToMenuBtnGame.style.display = 'inline-block';
    playerTank = new Tank(canvas.width / 2, canvas.height * 0.85, true);
    bullets = []; enemies = []; powerUps = [];
    Object.keys(activePowerUps).forEach(key => activePowerUps[key] = { active: false, endTime: 0 });
    score = 0; gameActive = true; lastEnemySpawnTime = 0; currentWave = 0;
    timeRemaining = TIME_ATTACK_DURATION; message = `Chế độ: ${gameMode.replace(/_/g, ' ').toUpperCase()}`; messageTimer = MESSAGE_DURATION;
    createObstacles();
    if (gameMode === 'wave_defense') startNewWave();
    else if (gameMode === 'survival') for (let i = 0; i < 2; i++) spawnEnemy();
    else if (gameMode === 'boss_battle') { enemies = []; spawnEnemy(true); message = "BOSS BATTLE!"; }
    updateCurrencyDisplays(); if (gameLoopRequest) cancelAnimationFrame(gameLoopRequest);
    lastFrameTime = performance.now();
    gameLoop(lastFrameTime);
}
function saveHighScore() { let highScoreKey, currentBest; switch (gameMode) { case 'survival': highScoreKey = HIGH_SCORE_KEYS.survival; currentBest = parseInt(localStorage.getItem(highScoreKey) || '0'); if (score > currentBest) localStorage.setItem(highScoreKey, score); break; case 'wave_defense': highScoreKey = HIGH_SCORE_KEYS.wave_defense; currentBest = parseInt(localStorage.getItem(highScoreKey) || '0'); if (currentWave > currentBest) localStorage.setItem(highScoreKey, currentWave); break; case 'time_attack': highScoreKey = HIGH_SCORE_KEYS.time_attack; currentBest = parseInt(localStorage.getItem(highScoreKey) || '0'); if (score > currentBest) localStorage.setItem(highScoreKey, score); break; } }
function loadHighScores() { survivalHighScoreDisplay.textContent = localStorage.getItem(HIGH_SCORE_KEYS.survival) || '0'; waveHighScoreDisplay.textContent = localStorage.getItem(HIGH_SCORE_KEYS.wave_defense) || '0'; timeAttackHighScoreDisplay.textContent = localStorage.getItem(HIGH_SCORE_KEYS.time_attack) || '0'; }

// --- Input Handling ---
function getTouchPos(canvasDom, touchEvent) { const rect = canvasDom.getBoundingClientRect(); return { x: touchEvent.clientX - rect.left, y: touchEvent.clientY - rect.top }; }
let isMouseDown = false;
function handleMouseDown(event) { if (!gameActive && gameOverScreen.style.display === 'none') return; isMouseDown = true; const pos = getTouchPos(canvas, event); if (moveJoystick.handleDown(pos.x, pos.y, 'mouse')) return; if (aimJoystick.handleDown(pos.x, pos.y, 'mouse')) return; if (fireButton.handleDown(pos.x, pos.y, 'mouse')) return; }
function handleMouseMove(event) { if (!isMouseDown || !gameActive) return; const pos = getTouchPos(canvas, event); moveJoystick.handleMove(pos.x, pos.y, 'mouse'); aimJoystick.handleMove(pos.x, pos.y, 'mouse'); }
function handleMouseUp() { if (!isMouseDown) return; isMouseDown = false; moveJoystick.handleUp('mouse'); aimJoystick.handleUp('mouse'); fireButton.handleUp('mouse'); }
function handleTouchStart(event) { if (!gameActive && gameOverScreen.style.display === 'none') return; initAudio(); event.preventDefault(); const touches = event.changedTouches; const rect = canvas.getBoundingClientRect(); for (let i = 0; i < touches.length; i++) { const touch = touches[i]; const x = touch.clientX - rect.left; const y = touch.clientY - rect.top; if (moveJoystick.handleDown(x, y, touch.identifier)) continue; if (aimJoystick.handleDown(x, y, touch.identifier)) continue; if (fireButton.handleDown(x, y, touch.identifier)) continue; } }
function handleTouchMove(event) { if (!gameActive) return; event.preventDefault(); const touches = event.changedTouches; const rect = canvas.getBoundingClientRect(); for (let i = 0; i < touches.length; i++) { const touch = touches[i]; const x = touch.clientX - rect.left; const y = touch.clientY - rect.top; moveJoystick.handleMove(x, y, touch.identifier); aimJoystick.handleMove(x, y, touch.identifier); } }
function handleTouchEnd(event) { event.preventDefault(); const touches = event.changedTouches; for (let i = 0; i < touches.length; i++) { const touch = touches[i]; moveJoystick.handleUp(touch.identifier); aimJoystick.handleUp(touch.identifier); fireButton.handleUp(touch.identifier); } }

// --- Game Loop ---
function update(deltaTime) {
    if (!gameActive) return;
    const moveInput = moveJoystick.getValue(); const aimInput = aimJoystick.getValue();
    if (playerTank) playerTank.update(moveInput, aimInput, null, obstacles, deltaTime);
    if (fireButton.isPressed && playerTank) playerTank.shoot();
    enemies.forEach(enemy => enemy.update(null, null, playerTank, obstacles, deltaTime));
    for (let i = powerUps.length - 1; i >= 0; i--) { if (powerUps[i].isExpired()) { powerUps.splice(i, 1); continue; } if (playerTank && getDistance(playerTank.x, playerTank.y, powerUps[i].x, powerUps[i].y) < (Math.max(playerTank.width, playerTank.height) / 1.8 + powerUps[i].radius)) { playerTank.activatePowerUp(powerUps[i].type); powerUps.splice(i, 1); } }
    checkActivePowerUps();
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; b.update(); if (b.isOffScreen()) { bullets.splice(i, 1); continue; } let bulletRemoved = false;
        for (const obs of obstacles) { if (checkRectCollision({ x: b.x - b.radius, y: b.y - b.radius, width: b.radius * 2, height: b.radius * 2 }, obs.getBoundingBox())) { bullets.splice(i, 1); bulletRemoved = true; playSound('hit', 0.1, 0.05); break; } } if (bulletRemoved) continue;
        if (b.firedByPlayer) { for (let j = enemies.length - 1; j >= 0; j--) { if (checkBulletTankCollision(b, enemies[j])) { enemies[j].takeDamage(b); bullets.splice(i, 1); break; } } }
        else { if (playerTank && checkBulletTankCollision(b, playerTank)) { playerTank.takeDamage(b); bullets.splice(i, 1); } }
    }
    if (messageTimer > 0) messageTimer -= deltaTime;
    const currentTime = Date.now();
    if (gameMode === 'survival') { if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL_SURVIVAL && enemies.length < 8) { spawnEnemy(); lastEnemySpawnTime = currentTime; } }
    else if (gameMode === 'wave_defense') { if (enemies.length === 0 && gameActive && messageTimer <= 0) { message = "Wave Cleared!"; messageTimer = 1200; setTimeout(startNewWave, 1200); } }
    else if (gameMode === 'time_attack') { timeRemaining -= deltaTime; if (timeRemaining <= 0) { timeRemaining = 0; showGameOverScreen(); } if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL_SURVIVAL * 0.5 && enemies.length < 10) { spawnEnemy(); lastEnemySpawnTime = currentTime; } }
}
function checkActivePowerUps() { if (!playerTank || !gameActive) return; const now = Date.now(); for (const type in activePowerUps) { if (activePowerUps[type].active && now > activePowerUps[type].endTime) { playerTank.deactivatePowerUp(type); } } }
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    obstacles.forEach(o => o.draw(ctx));
    powerUps.forEach(p => p.draw(ctx));
    if (playerTank) playerTank.draw(ctx);
    enemies.forEach(e => e.draw(ctx));
    bullets.forEach(b => b.draw(ctx));
    if (gameActive) { moveJoystick.draw(ctx); aimJoystick.draw(ctx); fireButton.draw(ctx); }
    if (messageTimer > 0 && message) {
        ctx.save();
        const alpha = Math.min(1, messageTimer / (MESSAGE_DURATION / 1.5));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`; ctx.font = "bold 26px Arial"; ctx.textAlign = "center";
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.7})`; ctx.lineWidth = 3;
        ctx.strokeText(message, canvas.width / 2, canvas.height / 2 - 60);
        ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 60);
        ctx.restore();
    }
}
function gameLoop(timestamp) {
    if (!gameActive) return;
    const deltaTime = timestamp - lastFrameTime;
    update(deltaTime);
    drawGame();
    updateHTMLUI();
    lastFrameTime = timestamp;
    gameLoopRequest = requestAnimationFrame(gameLoop);
}
function updateHTMLUI() {
    if (playerTank && gameActive) {
        gameModeDisplay.textContent = `Chế độ: ${currentSelectedMode.replace(/_/g, " ")}`;
        scoreDisplay.textContent = `Điểm: ${score}`;
        playerHealthDisplay.textContent = `HP: ${Math.ceil(playerTank.health)}/${Math.ceil(playerTank.maxHealth)}`;
        waveInfoDisplay.style.display = "none"; timeInfoDisplay.style.display = "none"; bossInfoDisplay.style.display = "none";
        if (currentSelectedMode === "wave_defense") { waveInfoDisplay.style.display = "inline"; waveDisplay.textContent = currentWave; enemiesLeftDisplay.textContent = enemies.length; }
        else if (currentSelectedMode === "time_attack") { timeInfoDisplay.style.display = "inline"; const seconds = Math.max(0, Math.floor(timeRemaining / 1000)); const milliseconds = Math.max(0, Math.floor(timeRemaining % 1000 / 100)); timeDisplay.textContent = `TG: ${seconds}.${milliseconds}s`; }
        else if (currentSelectedMode === "boss_battle" && enemies.length > 0 && enemies[0].isBoss) { bossInfoDisplay.style.display = "inline"; bossHealthUIDisplay.textContent = enemies[0].health; }
    }
}

// --- Initialization ---
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
    backToMenuBtnGame.onclick = () => { gameActive = false; showMenuScreen(); playSound('ui_click'); };
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
}
function init() {
    console.log("Initializing game systems...");
    const joystickBaseRadius = Math.min(canvas.width, canvas.height) * 0.09;
    const joystickStickRadius = joystickBaseRadius * 0.6;
    const joystickOffsetY = canvas.height - joystickBaseRadius - 20;
    const joystickOffsetX = joystickBaseRadius + 25;
    moveJoystick = new Joystick(joystickOffsetX, joystickOffsetY, joystickBaseRadius, joystickStickRadius);
    aimJoystick = new Joystick(canvas.width - joystickOffsetX, joystickOffsetY, joystickBaseRadius, joystickStickRadius);
    fireButton = new FireButton(aimJoystick.x, aimJoystick.y - joystickBaseRadius - 40, joystickBaseRadius * 0.7);
    initEventListeners();
    loadPlayerData();
    showMenuScreen();
    console.log("Game systems initialized. Waiting for user input.");
}

// Start the entire process
init();
