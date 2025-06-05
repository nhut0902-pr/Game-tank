// script.js
// --- DOM Elements ---
const menuScreen = document.getElementById('menuScreen');
const gameArea = document.getElementById('gameArea');
const gameOverScreen = document.getElementById('gameOverScreen');
const survivalBtn = document.getElementById('survivalBtn');
const waveBtn = document.getElementById('waveBtn');
const timeAttackBtn = document.getElementById('timeAttackBtn');
const bossBattleBtn = document.getElementById('bossBattleBtn');
const survivalHighScoreDisplay = document.getElementById('survivalHighScore');
const waveHighScoreDisplay = document.getElementById('waveHighScore');
const timeAttackHighScoreDisplay = document.getElementById('timeAttackHighScore');
const gameModeDisplay = document.getElementById('gameModeDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const waveDisplay = document.getElementById('waveDisplay');
const enemiesLeftDisplay = document.getElementById('enemiesLeftDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const playerHealthDisplay = document.getElementById('playerHealthDisplay');
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
canvas.width = Math.min(window.innerWidth * 0.9, 800);
canvas.height = Math.min(window.innerHeight * 0.7, 600);

const TANK_WIDTH = 40; const TANK_HEIGHT = 30;
const TURRET_RADIUS = 8; const BARREL_LENGTH = 25; const BARREL_WIDTH = 6;
const BULLET_RADIUS = 4; const BULLET_SPEED = 7;
const TANK_SPEED = 1.5; const TANK_ROTATION_SPEED = 0.035; const TURRET_ROTATION_SPEED = 0.05;
const SHOOT_COOLDOWN = 450; // Player base cooldown

const MAX_PLAYER_HEALTH = 100;
const HEALTH_BAR_WIDTH = 35; const HEALTH_BAR_HEIGHT = 4;

// Enemy Base Stats
const ENEMY_TANK_WIDTH = 38; const ENEMY_TANK_HEIGHT = 28;
const MAX_ENEMY_HEALTH = 40; // For 'normal' type

// Enemy Types & Spawn Weights
const ENEMY_TYPES = ['normal', 'scout', 'heavy'];
const ENEMY_SPAWN_WEIGHTS = { 'normal': 60, 'scout': 30, 'heavy': 10 };

// Scout Tank Stats
const SCOUT_TANK_WIDTH = 35; const SCOUT_TANK_HEIGHT = 25;
const MAX_SCOUT_HEALTH = 25; const SCOUT_SPEED_MULTIPLIER = 1.5;
const SCOUT_SHOOT_COOLDOWN_MULTIPLIER = 0.7; const SCOUT_DAMAGE_MULTIPLIER = 0.6;

// Heavy Tank Stats
const HEAVY_TANK_WIDTH = 50; const HEAVY_TANK_HEIGHT = 40;
const MAX_HEAVY_HEALTH = 80; const HEAVY_SPEED_MULTIPLIER = 0.6;
const HEAVY_SHOOT_COOLDOWN_MULTIPLIER = 1.5; const HEAVY_DAMAGE_MULTIPLIER = 1.3;

// Power-up Constants
const POWERUP_RADIUS = 15; const POWERUP_DURATION = 7000;
const POWERUP_SPAWN_CHANCE = 0.15;
const POWERUP_TYPES = ['rapid_fire', 'damage_boost', 'shield', 'health_pack', 'spread_shot'];

// Game Mode Constants
const ENEMY_SPAWN_INTERVAL_SURVIVAL = 4500;
const TIME_ATTACK_DURATION = 60 * 1000;
const WAVE_BASE_ENEMY_COUNT = 2;
const MESSAGE_DURATION = 2500;

// Boss Constants
const BOSS_TANK_WIDTH = 80; const BOSS_TANK_HEIGHT = 60;
const MAX_BOSS_HEALTH = 500;
const BOSS_SHOOT_COOLDOWN_NORMAL = 1000;
const BOSS_SHOOT_COOLDOWN_SPECIAL = 4000;
const BOSS_SPECIAL_ATTACK_BULLET_COUNT = 5;

// --- Game State ---
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

// --- High Scores ---
const HIGH_SCORE_KEYS = {
    survival: 'tankGameSurvivalHighScore', wave_defense: 'tankGameWaveHighScore',
    time_attack: 'tankGameTimeAttackHighScore', boss_battle: 'tankGameBossWins'
};

// --- Utility & Audio ---
function getDistance(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }
function initAudio() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { console.warn("Web Audio API is not supported."); }
    }
}
function playSound(type, volume = 0.3, duration = 0.1) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(volume * 0.5, audioCtx.currentTime); // Reduce global volume slightly

    switch (type) {
        case 'shoot': o.type = 'triangle'; o.frequency.setValueAtTime(300, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + duration); break;
        case 'enemy_shoot': o.type = 'sawtooth'; o.frequency.setValueAtTime(250, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + duration); g.gain.setValueAtTime(volume * 0.7, audioCtx.currentTime); break;
        case 'hit': o.type = 'square'; o.frequency.setValueAtTime(180, audioCtx.currentTime); duration = 0.05; break;
        case 'explosion': o.type = 'noise'; duration = 0.3; volume = 0.4; break;
        case 'player_death': o.type = 'sawtooth'; o.frequency.setValueAtTime(110, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + duration); duration = 0.5; volume = 0.5; break;
        case 'wave_clear': o.type = 'sine'; o.frequency.setValueAtTime(660, audioCtx.currentTime); o.frequency.setValueAtTime(880, audioCtx.currentTime + duration*0.5); duration = 0.4; break;
        case 'powerup_pickup': o.type = 'sine'; o.frequency.setValueAtTime(523, audioCtx.currentTime); o.frequency.linearRampToValueAtTime(783, audioCtx.currentTime + duration*0.8); volume = 0.4; duration=0.2; break;
        case 'shield_block': o.type = 'sine'; o.frequency.setValueAtTime(1000, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + duration); duration = 0.08; volume = 0.3; break;
        default: o.type = 'sine'; o.frequency.setValueAtTime(440, audioCtx.currentTime);
    }
    o.start(); o.stop(audioCtx.currentTime + duration);
}

// --- Obstacle Class ---
class Obstacle { /* ... (Code from previous merged script.js) ... */
    constructor(x, y, width, height) {
        this.x = x; this.y = y;
        this.width = width; this.height = height;
        this.color = '#778899'; // Slate gray
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#556677';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    getBoundingBox() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

// --- PowerUp Class ---
class PowerUp { /* ... (Code from previous merged script.js) ... */
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type;
        this.radius = POWERUP_RADIUS; this.createdAt = Date.now();
        this.lifetime = 10000;

        switch (type) {
            case 'rapid_fire': this.color = 'cyan'; this.symbol = '⚡'; break;
            case 'damage_boost': this.color = 'orange'; this.symbol = '💥'; break;
            case 'shield': this.color = 'lightblue'; this.symbol = '🛡️'; break;
            case 'health_pack': this.color = 'lightgreen'; this.symbol = '➕'; break;
            case 'spread_shot': this.color = 'violet'; this.symbol = '∴'; break;
            default: this.color = 'gray'; this.symbol = '?';
        }
    }
    draw() {
        const scale = 1 + Math.sin(Date.now() / 200) * 0.1;
        const currentRadius = this.radius * scale;
        ctx.beginPath(); ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'black'; ctx.font = `bold ${currentRadius * 1.1}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, this.x, this.y + 1); // Slight Y offset for better centering
    }
    isExpired() { return Date.now() - this.createdAt > this.lifetime; }
}

// --- Joystick & FireButton Classes (Keep as before) ---
class Joystick { /* ... (Full code from previous complete script.js) ... */
    constructor(x, y, baseRadius, stickRadius) {
        this.baseX = x; this.baseY = y;
        this.baseRadius = baseRadius; this.stickRadius = stickRadius;
        this.stickX = x; this.stickY = y;
        this.isActive = false; this.touchId = null;
        this.valueX = 0; this.valueY = 0;
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.baseX, this.baseY, this.baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150, 150, 150, 0.4)'; ctx.fill();
        ctx.beginPath(); ctx.arc(this.stickX, this.stickY, this.stickRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.7)'; ctx.fill();
    }
    handleDown(eventX, eventY, touchId) {
        if (getDistance(eventX, eventY, this.baseX, this.baseY) < this.baseRadius + this.stickRadius) {
            this.isActive = true; this.touchId = touchId;
            this._updateStick(eventX, eventY); return true;
        } return false;
    }
    handleMove(eventX, eventY, touchId) {
        if (this.isActive && this.touchId === touchId) this._updateStick(eventX, eventY);
    }
    handleUp(touchId) {
        if (this.touchId === touchId) {
            this.isActive = false; this.touchId = null;
            this.stickX = this.baseX; this.stickY = this.baseY;
            this.valueX = 0; this.valueY = 0;
        }
    }
    _updateStick(eventX, eventY) {
        const deltaX = eventX - this.baseX; const deltaY = eventY - this.baseY;
        const distance = getDistance(eventX, eventY, this.baseX, this.baseY);
        if (distance < this.baseRadius) {
            this.stickX = eventX; this.stickY = eventY;
        } else {
            const angle = Math.atan2(deltaY, deltaX);
            this.stickX = this.baseX + this.baseRadius * Math.cos(angle);
            this.stickY = this.baseY + this.baseRadius * Math.sin(angle);
        }
        this.valueX = (this.stickX - this.baseX) / this.baseRadius;
        this.valueY = (this.stickY - this.baseY) / this.baseRadius;
    }
    getValue() { return { x: this.valueX, y: this.valueY }; }
}
class FireButton { /* ... (Full code from previous complete script.js) ... */
    constructor(x, y, radius) {
        this.x = x; this.y = y; this.radius = radius;
        this.isPressed = false; this.touchId = null;
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isPressed ? 'rgba(255, 80, 80, 0.9)' : 'rgba(255, 0, 0, 0.6)';
        ctx.fill(); ctx.strokeStyle = 'rgba(100,0,0,0.8)'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'white'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; ctx.fillText('Bắn', this.x, this.y);
    }
    handleDown(eventX, eventY, touchId) {
        if (getDistance(eventX, eventY, this.x, this.y) < this.radius) {
            this.isPressed = true; this.touchId = touchId; return true;
        } return false;
    }
    handleUp(touchId) {
        if (this.touchId === touchId) { this.isPressed = false; this.touchId = null; }
    }
}


// --- Tank Class (Integrates Enemy Types, Power-ups, AI improvements) ---
class Tank {
    constructor(x, y, isPlayer = true, isBoss = false, enemyType = 'normal') {
        this.x = x; this.y = y; this.isPlayer = isPlayer; this.isBoss = isBoss;
        this.enemyType = isPlayer ? null : enemyType;

        this.width = TANK_WIDTH; this.height = TANK_HEIGHT;
        this.maxHealth = MAX_PLAYER_HEALTH;
        this.speed = TANK_SPEED;
        this.colorBody = 'darkgreen'; this.colorTurret = 'green';
        this.bulletDamageMultiplier = 1.0;
        this.scoreValue = 0; // Player doesn't give score
        this.baseShootCooldown = SHOOT_COOLDOWN;

        if (!isPlayer) {
            this.scoreValue = 10; // Default enemy score
            this.baseShootCooldown = 1200 + Math.random() * 1800; // Default AI cooldown
            if (isBoss) {
                this.width = BOSS_TANK_WIDTH; this.height = BOSS_TANK_HEIGHT;
                this.maxHealth = MAX_BOSS_HEALTH; this.speed = TANK_SPEED * 0.4;
                this.colorBody = '#1a1a1a'; this.colorTurret = '#4d4d4d';
                this.baseShootCooldown = BOSS_SHOOT_COOLDOWN_NORMAL;
                this.bulletDamageMultiplier = 1.2; // Boss bullets slightly stronger
                this.scoreValue = 100;
            } else {
                switch (this.enemyType) {
                    case 'scout':
                        this.width = SCOUT_TANK_WIDTH; this.height = SCOUT_TANK_HEIGHT;
                        this.maxHealth = MAX_SCOUT_HEALTH; this.speed = TANK_SPEED * SCOUT_SPEED_MULTIPLIER;
                        this.baseShootCooldown *= SCOUT_SHOOT_COOLDOWN_MULTIPLIER;
                        this.bulletDamageMultiplier = SCOUT_DAMAGE_MULTIPLIER;
                        this.colorBody = '#a0522d'; this.colorTurret = '#cd853f'; // Brownish
                        this.scoreValue = 15;
                        break;
                    case 'heavy':
                        this.width = HEAVY_TANK_WIDTH; this.height = HEAVY_TANK_HEIGHT;
                        this.maxHealth = MAX_HEAVY_HEALTH; this.speed = TANK_SPEED * HEAVY_SPEED_MULTIPLIER;
                        this.baseShootCooldown *= HEAVY_SHOOT_COOLDOWN_MULTIPLIER;
                        this.bulletDamageMultiplier = HEAVY_DAMAGE_MULTIPLIER;
                        this.colorBody = '#465962'; this.colorTurret = '#607D8B'; // Bluish Gray
                        this.scoreValue = 25;
                        break;
                    case 'normal':
                    default:
                        this.width = ENEMY_TANK_WIDTH; this.height = ENEMY_TANK_HEIGHT;
                        this.maxHealth = MAX_ENEMY_HEALTH; this.speed = TANK_SPEED * (0.6 + Math.random() * 0.3);
                        this.colorBody = 'maroon'; this.colorTurret = 'red';
                        break;
                }
            }
        }

        this.health = this.maxHealth;
        this.bodyAngle = isPlayer ? -Math.PI / 2 : Math.random() * Math.PI * 2;
        this.turretAngle = this.bodyAngle;
        this.lastShotTime = 0;
        this.collidingWithObstacle = false;

        // Player specific for power-ups
        this.currentShootCooldown = this.baseShootCooldown;
        this.baseBulletDamage = isPlayer ? 20 : (isBoss ? 25 : 10);
        this.currentBulletDamage = this.baseBulletDamage * this.bulletDamageMultiplier;
        this.hasShield = false;
        this.isSpreadShotActive = false;

        // AI specific
        if (!isPlayer) {
            this.aiState = 'patrolling'; this.aiMoveTimer = 0; this.aiTargetAngle = this.bodyAngle;
            this.aiLastShotTime = Date.now(); // Use this for AI shooting logic
            this.aiShootActualCooldown = this.baseShootCooldown; // Store the modified cooldown
            this.aiSightRange = isBoss ? canvas.width * 1.5 : (this.enemyType === 'scout' ? 240 : (this.enemyType === 'heavy' ? 150 : 190)) + Math.random() * 70;
            this.aiWanderTarget = null; this.aiPathBlockedTimer = 0;
            if (isBoss) this.aiLastSpecialAttackTime = Date.now();
        }
    }

    draw() { /* ... (Same drawing logic, including shield) ... */
        if (this.health <= 0 && !this.isBoss) return;
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.bodyAngle);
        ctx.fillStyle = this.colorBody;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        if (this.isPlayer || this.isBoss) {
            ctx.fillStyle = this.isPlayer ? 'lime' : '#888';
            ctx.fillRect(this.width / 4, -this.height/5, this.width / 4, this.height/2.5);
        }
        ctx.restore();

        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.turretAngle);
        const currentBarrelLength = this.isBoss ? BARREL_LENGTH * 1.2 : BARREL_LENGTH;
        const currentBarrelWidth = this.isBoss ? BARREL_WIDTH * 1.2 : BARREL_WIDTH;
        const currentTurretRadius = this.isBoss ? TURRET_RADIUS * 1.5 : TURRET_RADIUS;
        ctx.fillStyle = 'gray';
        ctx.fillRect(currentTurretRadius * 0.5, -currentBarrelWidth / 2, currentBarrelLength, currentBarrelWidth);
        ctx.beginPath(); ctx.arc(0, 0, currentTurretRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.colorTurret; ctx.fill();
        ctx.restore();

        if (this.isPlayer && this.hasShield) {
            ctx.beginPath(); ctx.arc(this.x, this.y, Math.max(this.width, this.height) * 0.75, 0, Math.PI * 2);
            const shieldAlpha = activePowerUps.shield.active ? (activePowerUps.shield.endTime - Date.now()) / POWERUP_DURATION : 0;
            ctx.strokeStyle = `rgba(100, 150, 255, ${Math.max(0.2, shieldAlpha * 0.8)})`; // Fade shield
            ctx.lineWidth = 3 + Math.sin(Date.now()/100)*1; ctx.stroke();
        }

        const healthBarActualWidth = this.isBoss ? HEALTH_BAR_WIDTH * 2.5 : HEALTH_BAR_WIDTH;
        const healthBarX = this.x - healthBarActualWidth / 2;
        const healthBarY = this.y - this.height / 2 - HEALTH_BAR_HEIGHT - 9; // Move up a bit
        ctx.fillStyle = '#555'; ctx.fillRect(healthBarX - 1, healthBarY - 1, healthBarActualWidth + 2, HEALTH_BAR_HEIGHT + 2);
        ctx.fillStyle = 'darkred'; ctx.fillRect(healthBarX, healthBarY, healthBarActualWidth, HEALTH_BAR_HEIGHT);
        const currentHealthWidth = (this.health / this.maxHealth) * healthBarActualWidth;
        ctx.fillStyle = 'lime';
        ctx.fillRect(healthBarX, healthBarY, Math.max(0, currentHealthWidth), HEALTH_BAR_HEIGHT);
    }

    update(moveInput, aimInput, playerTankRef, obstaclesRef) { /* ... (AI logic with obstacle avoidance and type differentiation) ... */
        if (this.health <= 0) return;
        let prevX = this.x; let prevY = this.y;

        if (this.isPlayer) {
            if (Math.abs(moveInput.y) > 0.1) {
                const moveSpeed = -moveInput.y * this.speed;
                this.x += moveSpeed * Math.cos(this.bodyAngle);
                this.y += moveSpeed * Math.sin(this.bodyAngle);
            }
            if (Math.abs(moveInput.x) > 0.1) {
                this.bodyAngle += moveInput.x * TANK_ROTATION_SPEED * Math.sign(-moveInput.y || 1);
            }
            if (Math.abs(aimInput.x) > 0.1 || Math.abs(aimInput.y) > 0.1) {
                this.turretAngle = Math.atan2(aimInput.y, aimInput.x);
            }
        } else { // AI Logic
            this.aiMoveTimer -= 1000 / 60;
            const distanceToPlayer = playerTankRef && playerTankRef.health > 0 ? getDistance(this.x, this.y, playerTankRef.x, playerTankRef.y) : Infinity;

            if (distanceToPlayer < this.aiSightRange && playerTankRef.health > 0) {
                this.aiState = this.isBoss ? 'boss_attacking' : 'attacking';
                this.aiWanderTarget = null;
            } else if (this.aiState !== 'returning_to_patrol') { // Don't switch if returning
                this.aiState = 'patrolling';
            }

            if (this.aiPathBlockedTimer > 0) this.aiPathBlockedTimer -= 1000/60;

            let targetAngleForMovement = this.bodyAngle;
            let tryToMove = false;

            if (this.aiState === 'patrolling' || this.aiState === 'returning_to_patrol') {
                if (!this.aiWanderTarget || this.aiMoveTimer <= 0 || getDistance(this.x, this.y, this.aiWanderTarget.x, this.aiWanderTarget.y) < this.width) {
                    if (this.aiState === 'returning_to_patrol') this.aiState = 'patrolling'; // Arrived
                    this.aiWanderTarget = {
                        x: Math.random() * (canvas.width - this.width*2) + this.width,
                        y: Math.random() * (canvas.height - this.height*2) + this.height
                    };
                    this.aiMoveTimer = 3000 + Math.random() * 4000;
                }
                targetAngleForMovement = Math.atan2(this.aiWanderTarget.y - this.y, this.aiWanderTarget.x - this.x);
                this.turretAngle = this.bodyAngle;
                tryToMove = true;
            } else if (this.aiState === 'attacking' || this.aiState === 'boss_attacking') {
                targetAngleForMovement = Math.atan2(playerTankRef.y - this.y, playerTankRef.x - this.x);
                this.turretAngle = targetAngleForMovement;
                tryToMove = true; // AI will try to move based on type

                // Specific AI movement for attacking state
                if (this.enemyType === 'scout') {
                    if (distanceToPlayer < this.aiSightRange * 0.4) targetAngleForMovement += Math.PI; // Flee if too close
                    else if (distanceToPlayer > this.aiSightRange * 0.8) {/* Maintain distance or slightly approach */}
                    else targetAngleForMovement += (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2) ; // Strafe
                } else if (this.enemyType === 'heavy' || this.isBoss) {
                    if (distanceToPlayer > this.aiSightRange * 0.3) { /* Approach slowly */ }
                    else { tryToMove = false; /* Hold position if close enough */ }
                }


                const currentTime = Date.now();
                if (currentTime - this.aiLastShotTime > this.aiShootActualCooldown) { // Use actual cooldown
                    this.shoot();
                    this.aiLastShotTime = currentTime;
                }
                if (this.isBoss && currentTime - this.aiLastSpecialAttackTime > BOSS_SHOOT_COOLDOWN_SPECIAL) {
                    this.bossSpecialAttack();
                    this.aiLastSpecialAttackTime = currentTime;
                }
            }

            if (this.aiPathBlockedTimer <=0 && tryToMove) {
                let angleDiffBody = targetAngleForMovement - this.bodyAngle;
                while (angleDiffBody > Math.PI) angleDiffBody -= Math.PI * 2;
                while (angleDiffBody < -Math.PI) angleDiffBody += Math.PI * 2;

                if (Math.abs(angleDiffBody) > TANK_ROTATION_SPEED * 0.8) {
                    this.bodyAngle += Math.sign(angleDiffBody) * TANK_ROTATION_SPEED * 0.8;
                } else {
                    this.bodyAngle = targetAngleForMovement;
                }
                if (Math.abs(angleDiffBody) < Math.PI / 1.8 || this.aiState.includes('attacking')) { // Looser angle for movement
                    this.x += this.speed * Math.cos(this.bodyAngle);
                    this.y += this.speed * Math.sin(this.bodyAngle);
                }
            }
        }

        this.collidingWithObstacle = false;
        obstaclesRef.forEach(obs => {
            if (checkTankObstacleCollision(this, obs)) {
                this.collidingWithObstacle = true;
                this.x = prevX; this.y = prevY; // Rollback
                // More sophisticated bounce/slide can be added here
                if (!this.isPlayer && this.aiPathBlockedTimer <=0) {
                    this.bodyAngle += Math.PI / 2 * (Math.random() > 0.5 ? 1: -1) ; // Turn sharply
                    this.aiWanderTarget = null;
                    this.aiMoveTimer = 300;
                    this.aiPathBlockedTimer = 600; // Wait a bit before trying again
                    if (this.aiState === 'attacking') this.aiState = 'returning_to_patrol'; // Try to reposition
                }
                 // If player hits obstacle, maybe a small recoil?
                if (this.isPlayer) {
                    this.bodyAngle += 0.05 * (Math.random() > 0.5 ? 1 : -1); // Slight angle change
                }
            }
        });

        this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(canvas.height - this.height / 2, this.y));
    }

    shoot() { /* ... (Same, but use currentBulletDamage for player) ... */
        if (this.health <= 0) return;
        const currentTime = Date.now();
        const cooldown = this.isPlayer ? this.currentShootCooldown : this.aiShootActualCooldown;
        const lastShot = this.isPlayer ? this.lastShotTime : this.aiLastShotTime;

        if (currentTime - lastShot > cooldown) {
            if (this.isPlayer) this.lastShotTime = currentTime;
            else this.aiLastShotTime = currentTime;

            playSound(this.isPlayer ? 'shoot' : 'enemy_shoot', 0.2);
            const currentBarrelLength = this.isBoss ? BARREL_LENGTH * 1.2 : BARREL_LENGTH;
            const barrelTipX = this.x + currentBarrelLength * Math.cos(this.turretAngle);
            const barrelTipY = this.y + currentBarrelLength * Math.sin(this.turretAngle);

            const damageToDeal = this.isPlayer ? this.currentBulletDamage : this.baseBulletDamage * this.bulletDamageMultiplier;

            if (this.isPlayer && this.isSpreadShotActive) {
                const spreadAngles = [-0.25, 0, 0.25];
                spreadAngles.forEach(angleOffset => {
                    bullets.push(new Bullet(barrelTipX, barrelTipY, this.turretAngle + angleOffset, true, false, false, damageToDeal));
                });
            } else {
                bullets.push(new Bullet(barrelTipX, barrelTipY, this.turretAngle, this.isPlayer, this.isBoss, false, damageToDeal));
            }
        }
    }
    bossSpecialAttack() { /* ... (Same) ... */
        if (!this.isBoss || this.health <= 0) return;
        playSound('explosion', 0.3, 0.25);
        const spreadAngle = Math.PI / 9;
        const startAngle = this.turretAngle - (spreadAngle * (BOSS_SPECIAL_ATTACK_BULLET_COUNT -1) / 2);
        for(let i = 0; i < BOSS_SPECIAL_ATTACK_BULLET_COUNT; i++) {
            const angle = startAngle + i * spreadAngle;
            const barrelTipX = this.x + BARREL_LENGTH * 1.2 * Math.cos(this.turretAngle);
            const barrelTipY = this.y + BARREL_LENGTH * 1.2 * Math.sin(this.turretAngle);
            bullets.push(new Bullet(barrelTipX, barrelTipY, angle, false, true, true)); // isSpecial = true
        }
    }
    takeDamage(amount) { /* ... (Same, but use shield_block sound) ... */
        if (this.isPlayer && this.hasShield) {
            playSound('shield_block', 0.3);
            this.deactivatePowerUp('shield'); // Shield breaks on first hit
            return;
        }
        this.health -= amount;
        playSound('hit', 0.4);
        if (this.health < 0) this.health = 0;
        if (this.health <= 0) this.onDeath();
    }
    onDeath() { /* ... (Same, but use this.scoreValue) ... */
        playSound(this.isPlayer ? 'player_death' : 'explosion');
        if (!this.isPlayer) {
            score += this.scoreValue;
            const index = enemies.indexOf(this);
            if (index > -1) enemies.splice(index, 1);
            if (Math.random() < POWERUP_SPAWN_CHANCE && !this.isBoss) {
                const randomType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
                powerUps.push(new PowerUp(this.x, this.y, randomType));
            }
            if(this.isBoss && gameMode === 'boss_battle') {
                message = "BOSS DEFEATED!"; messageTimer = MESSAGE_DURATION * 2;
                setTimeout(() => showGameOverScreen(true), MESSAGE_DURATION * 1.5);
            }
        } else {
            showGameOverScreen();
        }
    }
    activatePowerUp(type) { /* ... (Same logic) ... */
        const now = Date.now();
        playSound('powerup_pickup', 0.5);
        this.deactivatePowerUp(type); // Deactivate if already active to reset timer

        switch (type) {
            case 'rapid_fire':
                activePowerUps.rapid_fire = { active: true, endTime: now + POWERUP_DURATION };
                this.currentShootCooldown = this.baseShootCooldown * 0.5; // Faster
                break;
            case 'damage_boost':
                activePowerUps.damage_boost = { active: true, endTime: now + POWERUP_DURATION };
                this.currentBulletDamage = this.baseBulletDamage * 1.75; // More damage
                break;
            case 'shield':
                activePowerUps.shield = { active: true, endTime: now + POWERUP_DURATION * 1.5 }; // Shield lasts longer
                this.hasShield = true;
                break;
            case 'health_pack':
                this.health = Math.min(this.maxHealth, this.health + MAX_PLAYER_HEALTH * 0.4); // Heal more
                updateHTMLUI(); // Update health display immediately
                break;
            case 'spread_shot':
                activePowerUps.spread_shot = { active: true, endTime: now + POWERUP_DURATION };
                this.isSpreadShotActive = true;
                break;
        }
    }
    deactivatePowerUp(type) { /* ... (Same logic) ... */
        switch (type) {
            case 'rapid_fire': this.currentShootCooldown = this.baseShootCooldown; break;
            case 'damage_boost': this.currentBulletDamage = this.baseBulletDamage * this.bulletDamageMultiplier; break; // Revert to base * multiplier
            case 'shield': this.hasShield = false; break;
            case 'spread_shot': this.isSpreadShotActive = false; break;
        }
        if (activePowerUps[type]) activePowerUps[type].active = false;
    }
}

// --- Bullet Class (constructor updated for damage) ---
class Bullet { /* ... (Full code from previous merged script.js, ensure damageOverride is used) ... */
    constructor(x, y, angle, firedByPlayer, firedByBoss = false, isSpecial = false, damageOverride = null) {
        this.x = x; this.y = y; this.angle = angle;
        this.firedByPlayer = firedByPlayer;
        this.firedByBoss = firedByBoss;
        this.isSpecial = isSpecial;
        this.damage = damageOverride !== null ? damageOverride :
                      (this.firedByPlayer ? 20 : (this.firedByBoss ? (this.isSpecial ? 15 : 25) : 10));
        this.radius = this.isSpecial ? BULLET_RADIUS * 1.3 : BULLET_RADIUS;
        this.color = this.firedByPlayer ? 'yellow' : (this.firedByBoss ? (this.isSpecial ? 'fuchsia' : 'orangered') : '#FF69B4');
        this.speed = this.isSpecial ? BULLET_SPEED * 0.75 : BULLET_SPEED;
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill();
    }
    update() {
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);
    }
    isOffScreen() {
        return this.x < -this.radius || this.x > canvas.width + this.radius ||
               this.y < -this.radius || this.y > canvas.height + this.radius;
    }
}

// --- Collision Detection (Keep getBoundingBox, checkRectCollision, checkTankObstacleCollision, checkBulletTankCollision) ---
function getBoundingBox(entity) { /* ... */ return { x: entity.x - entity.width / 2, y: entity.y - entity.height / 2, width: entity.width, height: entity.height }; }
function checkRectCollision(rect1, rect2) { /* ... */ return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }
function checkTankObstacleCollision(tank, obstacle) { return checkRectCollision(getBoundingBox(tank), obstacle.getBoundingBox()); }
function checkBulletTankCollision(bullet, tank) { /* ... */ if (tank.health <= 0) return false; const dist = getDistance(bullet.x, bullet.y, tank.x, tank.y); const tankEffectiveRadius = Math.max(tank.width, tank.height) / 1.8; return dist < tankEffectiveRadius + bullet.radius; }


// --- Game Management Functions (spawnEnemy updated for types) ---
function spawnEnemy(isBossOverride = false) {
    let spawnX, spawnY, enemyTypeToSpawn;
    const isBossModeActive = (gameMode === 'boss_battle' && enemies.filter(e => e.isBoss).length === 0);
    const actuallySpawnBoss = isBossOverride || isBossModeActive;

    if (actuallySpawnBoss) {
        enemyTypeToSpawn = null; // Boss is not a 'type'
    } else {
        // Weighted random selection for enemy types
        let rand = Math.random() * Object.values(ENEMY_SPAWN_WEIGHTS).reduce((a,b)=>a+b,0); // Sum of all weights
        for (const type in ENEMY_SPAWN_WEIGHTS) {
            if (rand < ENEMY_SPAWN_WEIGHTS[type]) { enemyTypeToSpawn = type; break; }
            rand -= ENEMY_SPAWN_WEIGHTS[type];
        }
        if (!enemyTypeToSpawn) enemyTypeToSpawn = 'normal'; // Fallback
    }

    const widthToUse = actuallySpawnBoss ? BOSS_TANK_WIDTH : (enemyTypeToSpawn === 'scout' ? SCOUT_TANK_WIDTH : (enemyTypeToSpawn === 'heavy' ? HEAVY_TANK_WIDTH : ENEMY_TANK_WIDTH));
    const heightToUse = actuallySpawnBoss ? BOSS_TANK_HEIGHT : (enemyTypeToSpawn === 'scout' ? SCOUT_TANK_HEIGHT : (enemyTypeToSpawn === 'heavy' ? HEAVY_TANK_HEIGHT : ENEMY_TANK_HEIGHT));

    const edge = Math.floor(Math.random() * 4);
    // ... (switch(edge) for spawnX, spawnY using widthToUse, heightToUse - code from previous)
    switch (edge) {
        case 0: spawnX = Math.random() * canvas.width; spawnY = -heightToUse; break;
        case 1: spawnX = Math.random() * canvas.width; spawnY = canvas.height + heightToUse; break;
        case 2: spawnX = -widthToUse; spawnY = Math.random() * canvas.height; break;
        case 3: spawnX = canvas.width + widthToUse; spawnY = Math.random() * canvas.height; break;
    }
    enemies.push(new Tank(spawnX, spawnY, false, actuallySpawnBoss, enemyTypeToSpawn));
}
function startNewWave() { /* ... (Same logic, maybe adjust enemy count based on difficulty) ... */
    currentWave++;
    enemiesThisWave = WAVE_BASE_ENEMY_COUNT + Math.floor(currentWave / 1.5); // Slower increase
    message = `Wave ${currentWave}`; messageTimer = MESSAGE_DURATION;
    playSound('wave_clear', 0.4);
    enemies = []; bullets = [];
    for (let i = 0; i < enemiesThisWave; i++) spawnEnemy();
}
function createObstacles() { /* ... (Same logic) ... */
    obstacles = [];
    const numObstacles = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numObstacles; i++) {
        const obsWidth = 40 + Math.random() * 70; const obsHeight = 40 + Math.random() * 70;
        const obsX = Math.random() * (canvas.width - obsWidth - 80) + 40;
        const obsY = Math.random() * (canvas.height - obsHeight - 80) + 40;
        if (getDistance(obsX + obsWidth/2, obsY + obsHeight/2, canvas.width/2, canvas.height/1.2) > TANK_WIDTH * 4) { // Check against player start
            obstacles.push(new Obstacle(obsX, obsY, obsWidth, obsHeight));
        }
    }
}
function showMenuScreen() { /* ... (Same logic) ... */
    gameActive = false; menuScreen.style.display = 'flex'; gameArea.style.display = 'none';
    gameOverScreen.style.display = 'none'; loadHighScores();
    if(gameLoopRequest) cancelAnimationFrame(gameLoopRequest); gameLoopRequest = null;
}
function showGameOverScreen(bossDefeated = false) { /* ... (Same logic) ... */
    gameActive = false; menuScreen.style.display = 'none'; // gameArea.style.display = 'none'; // Keep gameArea visible to see last state
    gameOverScreen.style.display = 'block';
    if (bossDefeated) {
        gameOverTitle.textContent = "VICTORY!"; finalScoreDisplay.textContent = score;
        waveReachedDisplay.style.display = 'none'; playSound('wave_clear', 0.7, 1.2);
        if (gameMode === 'boss_battle') {
             let wins = parseInt(localStorage.getItem(HIGH_SCORE_KEYS.boss_battle) || '0');
             localStorage.setItem(HIGH_SCORE_KEYS.boss_battle, wins + 1);
        }
    } else {
        gameOverTitle.textContent = 'GAME OVER'; finalScoreDisplay.textContent = score;
        playSound('player_death', 0.6);
        if (gameMode === 'wave_defense') {
            waveReachedDisplay.style.display = 'block'; finalWaveDisplay.textContent = currentWave;
        } else { waveReachedDisplay.style.display = 'none'; }
    }
    saveHighScore(); loadHighScores();
}
function startGame(mode) { /* ... (Same logic, ensure createObstacles is called) ... */
    initAudio(); currentSelectedMode = mode; gameMode = mode;
    menuScreen.style.display = 'none'; gameArea.style.display = 'flex';
    gameOverScreen.style.display = 'none'; backToMenuBtnGame.style.display = 'inline-block';

    playerTank = new Tank(canvas.width / 2, canvas.height / 1.2, true);
    bullets = []; enemies = []; powerUps = []; // Clear powerups too
    Object.keys(activePowerUps).forEach(key => activePowerUps[key] = {active: false, endTime: 0}); // Reset active powerups

    score = 0; gameActive = true; lastEnemySpawnTime = Date.now();
    currentWave = 0; timeRemaining = TIME_ATTACK_DURATION; lastTickTime = Date.now();
    message = `Mode: ${gameMode.replace('_', ' ').toUpperCase()}`; messageTimer = MESSAGE_DURATION;

    createObstacles();

    if (gameMode === 'wave_defense') startNewWave();
    else if (gameMode === 'survival') for (let i = 0; i < 2; i++) spawnEnemy();
    else if (gameMode === 'boss_battle') { enemies = []; spawnEnemy(true); message = "BOSS BATTLE!"; }

    if (gameLoopRequest) cancelAnimationFrame(gameLoopRequest);
    gameLoop();
}
// --- High Score Functions (Keep as before) ---
function saveHighScore() { /* ... */ let highScoreKey, currentBest; switch (gameMode) { case 'survival': highScoreKey = HIGH_SCORE_KEYS.survival; currentBest = parseInt(localStorage.getItem(highScoreKey) || '0'); if (score > currentBest) localStorage.setItem(highScoreKey, score); break; case 'wave_defense': highScoreKey = HIGH_SCORE_KEYS.wave_defense; currentBest = parseInt(localStorage.getItem(highScoreKey) || '0'); if (currentWave > currentBest) localStorage.setItem(highScoreKey, currentWave); break; case 'time_attack': highScoreKey = HIGH_SCORE_KEYS.time_attack; currentBest = parseInt(localStorage.getItem(highScoreKey) || '0'); if (score > currentBest) localStorage.setItem(highScoreKey, score); break; } }
function loadHighScores() { /* ... */ survivalHighScoreDisplay.textContent = localStorage.getItem(HIGH_SCORE_KEYS.survival) || '0'; waveHighScoreDisplay.textContent = localStorage.getItem(HIGH_SCORE_KEYS.wave_defense) || '0'; timeAttackHighScoreDisplay.textContent = localStorage.getItem(HIGH_SCORE_KEYS.time_attack) || '0'; }

// --- Input Handling (Keep as before) ---
// ... (Full input handling code from previous complete script.js)
function getTouchPos(canvasDom, touchEvent) { const rect = canvasDom.getBoundingClientRect(); return { x: touchEvent.clientX - rect.left, y: touchEvent.clientY - rect.top }; }
let isMouseDown = false;
function handleMouseDown(event) { if (!gameActive && gameOverScreen.style.display === 'none') return; isMouseDown = true; const pos = getTouchPos(canvas, event); if (moveJoystick.handleDown(pos.x, pos.y, 'mouse')) return; if (aimJoystick.handleDown(pos.x, pos.y, 'mouse')) return; if (fireButton.handleDown(pos.x, pos.y, 'mouse')) return; }
function handleMouseMove(event) { if (!isMouseDown || !gameActive) return; const pos = getTouchPos(canvas, event); moveJoystick.handleMove(pos.x, pos.y, 'mouse'); aimJoystick.handleMove(pos.x, pos.y, 'mouse'); }
function handleMouseUp(event) { if (!gameActive && gameOverScreen.style.display === 'none' && menuScreen.style.display === 'none') return; isMouseDown = false; moveJoystick.handleUp('mouse'); aimJoystick.handleUp('mouse'); fireButton.handleUp('mouse'); }
function handleTouchStart(event) { if (!gameActive && gameOverScreen.style.display === 'none') return; initAudio(); event.preventDefault(); const touches = event.changedTouches; const rect = canvas.getBoundingClientRect(); for (let i = 0; i < touches.length; i++) { const touch = touches[i]; const x = touch.clientX - rect.left; const y = touch.clientY - rect.top; if (moveJoystick.handleDown(x, y, touch.identifier)) continue; if (aimJoystick.handleDown(x, y, touch.identifier)) continue; if (fireButton.handleDown(x, y, touch.identifier)) continue; } }
function handleTouchMove(event) { if (!gameActive) return; event.preventDefault(); const touches = event.changedTouches; const rect = canvas.getBoundingClientRect(); for (let i = 0; i < touches.length; i++) { const touch = touches[i]; const x = touch.clientX - rect.left; const y = touch.clientY - rect.top; moveJoystick.handleMove(x, y, touch.identifier); aimJoystick.handleMove(x, y, touch.identifier); } }
function handleTouchEnd(event) { if (!gameActive && gameOverScreen.style.display === 'none' && menuScreen.style.display === 'none') return; event.preventDefault(); const touches = event.changedTouches; for (let i = 0; i < touches.length; i++) { const touch = touches[i]; moveJoystick.handleUp(touch.identifier); aimJoystick.handleUp(touch.identifier); fireButton.handleUp(touch.identifier); } }


// --- Game Loop (Integrate Power-up updates) ---
function update() {
    if (!gameActive) return;
    const moveInput = moveJoystick.getValue(); const aimInput = aimJoystick.getValue();
    if (playerTank) playerTank.update(moveInput, aimInput, null, obstacles);
    if (fireButton.isPressed && playerTank) playerTank.shoot();

    enemies.forEach(enemy => enemy.update(null, null, playerTank, obstacles));

    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (powerUps[i].isExpired()) { powerUps.splice(i, 1); continue; }
        if (playerTank && getDistance(playerTank.x, playerTank.y, powerUps[i].x, powerUps[i].y) < (Math.max(playerTank.width, playerTank.height) / 1.8 + powerUps[i].radius)) { // Tighter collision
            playerTank.activatePowerUp(powerUps[i].type);
            powerUps.splice(i, 1); continue;
        }
    }
    checkActivePowerUps(); // Check and deactivate expired player power-ups

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; b.update();
        if (b.isOffScreen()) { bullets.splice(i, 1); continue; }
        let bulletRemoved = false;
        for (const obs of obstacles) {
            if (checkRectCollision({x: b.x - b.radius, y: b.y - b.radius, width: b.radius*2, height: b.radius*2}, obs.getBoundingBox())) {
                bullets.splice(i,1); bulletRemoved = true; playSound('hit', 0.1, 0.05); break;
            }
        }
        if (bulletRemoved) continue;
        if (b.firedByPlayer) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (checkBulletTankCollision(b, enemies[j])) {
                    enemies[j].takeDamage(b.damage); bullets.splice(i, 1); break;
                }
            }
        } else { if (playerTank && checkBulletTankCollision(b, playerTank)) { playerTank.takeDamage(b.damage); bullets.splice(i, 1); } }
    }
    if (messageTimer > 0) messageTimer -= 1000 / 60;

    const currentTime = Date.now();
    // ... (Game Mode Logic from previous merged script.js, ensure it's robust)
    if (gameMode === 'survival') { if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL_SURVIVAL) { if (enemies.length < 8) spawnEnemy(); lastEnemySpawnTime = currentTime; } }
    else if (gameMode === 'wave_defense') { if (enemies.length === 0 && gameActive && messageTimer <= 0) { setTimeout(startNewWave, 1200); message = "Wave Cleared!"; messageTimer = 1200; } }
    else if (gameMode === 'time_attack') {
        const deltaTime = currentTime - lastTickTime; lastTickTime = currentTime; timeRemaining -= deltaTime;
        if (timeRemaining <= 0) { timeRemaining = 0; showGameOverScreen(); }
        if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL_SURVIVAL * 0.5) { if (enemies.length < 10) spawnEnemy(); lastEnemySpawnTime = currentTime; }
    } else if (gameMode === 'boss_battle') { /* Boss death handled in onDeath */ }
}
function checkActivePowerUps() { // Moved this function to be defined before use in update
    if (!playerTank || !gameActive) return;
    const now = Date.now();
    for (const type in activePowerUps) {
        if (activePowerUps[type].active && now > activePowerUps[type].endTime) {
            playerTank.deactivatePowerUp(type);
        }
    }
}

function draw() { /* ... (Draw obstacles, powerups, messages) ... */
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    obstacles.forEach(o => o.draw());
    powerUps.forEach(p => p.draw());
    if (playerTank) playerTank.draw();
    enemies.forEach(e => e.draw());
    bullets.forEach(b => b.draw());
    if (gameActive) { // Only draw joysticks if game is active
        if (moveJoystick) moveJoystick.draw();
        if (aimJoystick) aimJoystick.draw();
        if (fireButton) fireButton.draw();
    }
    if (messageTimer > 0 && message) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, messageTimer / (MESSAGE_DURATION / 1.5))})`; // Fade effect
        ctx.font = 'bold 26px Arial'; ctx.textAlign = 'center';
        ctx.strokeStyle = `rgba(0,0,0, ${Math.min(0.7, messageTimer / (MESSAGE_DURATION / 1.5))})`;
        ctx.lineWidth = 3;
        ctx.strokeText(message, canvas.width / 2, canvas.height / 2 - 60);
        ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 60);
    }
}
function gameLoop() { if (gameActive) update(); draw(); updateHTMLUI(); gameLoopRequest = requestAnimationFrame(gameLoop); }
function updateHTMLUI() { /* ... (Same as previous) ... */
    if (playerTank) { // Ensure playerTank exists before accessing properties
        gameModeDisplay.textContent = `Chế độ: ${currentSelectedMode.replace('_',' ')}`;
        scoreDisplay.textContent = `Điểm: ${score}`;
        playerHealthDisplay.textContent = `HP: ${playerTank.health}`;

        waveDisplay.style.display = 'none'; enemiesLeftDisplay.style.display = 'none'; timeDisplay.style.display = 'none';

        if (currentSelectedMode === 'wave_defense') {
            waveDisplay.style.display = 'inline'; enemiesLeftDisplay.style.display = 'inline';
            waveDisplay.textContent = `Sóng: ${currentWave}`; enemiesLeftDisplay.textContent = `Kẻ địch: ${enemies.length}`;
        } else if (currentSelectedMode === 'time_attack') {
            timeDisplay.style.display = 'inline';
            const seconds = Math.max(0, Math.floor(timeRemaining / 1000));
            const milliseconds = Math.max(0, Math.floor((timeRemaining % 1000) / 100));
            timeDisplay.textContent = `TG: ${seconds}.${milliseconds}s`;
        } else if (currentSelectedMode === 'boss_battle' && enemies.length > 0 && enemies[0].isBoss) {
            enemiesLeftDisplay.style.display = 'inline';
            enemiesLeftDisplay.textContent = `Boss HP: ${enemies[0].health}`;
        }
    } else if (!gameActive && menuScreen.style.display === 'none') { // Game over screen
        // UI for game over screen is handled by showGameOverScreen
    }
}

// --- Initialization ---
function initEventListeners() { /* ... (Same as previous, ensure all buttons are linked) ... */
    survivalBtn.onclick = () => startGame('survival');
    waveBtn.onclick = () => startGame('wave_defense');
    timeAttackBtn.onclick = () => startGame('time_attack');
    bossBattleBtn.onclick = () => startGame('boss_battle');
    restartBtn.onclick = () => startGame(currentSelectedMode);
    menuFromGameOverBtn.onclick = showMenuScreen;
    backToMenuBtnGame.onclick = showMenuScreen;

    canvas.addEventListener('mousedown', handleMouseDown); canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp); canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
}

function init() {
    console.log("Document loaded, initializing game systems...");
    const joystickBaseRadius = Math.min(canvas.width, canvas.height) * 0.09; // Smaller joysticks
    const joystickStickRadius = joystickBaseRadius * 0.6;
    const joystickOffsetY = canvas.height - joystickBaseRadius - 15; // Move up slightly
    const joystickOffsetX = joystickBaseRadius + 20; // Closer to edge

    moveJoystick = new Joystick(joystickOffsetX, joystickOffsetY, joystickBaseRadius, joystickStickRadius);
    aimJoystick = new Joystick(canvas.width - joystickOffsetX, joystickOffsetY, joystickBaseRadius, joystickStickRadius);
    fireButton = new FireButton(canvas.width - joystickOffsetX, joystickOffsetY - joystickBaseRadius - 35, joystickBaseRadius * 0.7);

    initEventListeners();
    showMenuScreen();
    console.log("Game systems initialized. Waiting for mode selection.");
}

window.onload = init;
