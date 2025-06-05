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
const SHOOT_COOLDOWN = 450;
const ENEMY_TANK_WIDTH = 38; const ENEMY_TANK_HEIGHT = 28;
const MAX_PLAYER_HEALTH = 100; const MAX_ENEMY_HEALTH = 40;
const HEALTH_BAR_WIDTH = 35; const HEALTH_BAR_HEIGHT = 4;
const ENEMY_SPAWN_INTERVAL_SURVIVAL = 4500;
const TIME_ATTACK_DURATION = 60 * 1000;
const WAVE_BASE_ENEMY_COUNT = 2;
const MESSAGE_DURATION = 2500;
// Boss Constants
const BOSS_TANK_WIDTH = 80; const BOSS_TANK_HEIGHT = 60;
const MAX_BOSS_HEALTH = 500;
const BOSS_SHOOT_COOLDOWN_NORMAL = 1000;
const BOSS_SHOOT_COOLDOWN_SPECIAL = 3000; // For special attacks
const BOSS_SPECIAL_ATTACK_BULLET_COUNT = 5; // Number of bullets in a spread shot


// --- Game State ---
let playerTank; let bullets = []; let enemies = []; let obstacles = [];
let moveJoystick, aimJoystick, fireButton;
let gameLoopRequest; let score = 0; let gameMode = 'survival'; let gameActive = false; // Start inactive
let lastEnemySpawnTime = 0; let currentWave = 0; let enemiesThisWave = 0;
let timeRemaining = TIME_ATTACK_DURATION; let lastTickTime = Date.now();
let message = ""; let messageTimer = 0;
let currentSelectedMode = 'survival'; // To remember mode for restart
let audioCtx; // For Web Audio API

// --- High Scores ---
const HIGH_SCORE_KEYS = {
    survival: 'tankGameSurvivalHighScore',
    wave_defense: 'tankGameWaveHighScore',
    time_attack: 'tankGameTimeAttackHighScore',
    boss_battle: 'tankGameBossWins' // Can store number of wins or fastest time
};

// --- Utility & Audio ---
function getDistance(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }
function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser.");
        }
    }
}
function playSound(type, volume = 0.3, duration = 0.1) {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);

    switch (type) {
        case 'shoot': oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); break;
        case 'enemy_shoot': oscillator.type = 'sawtooth'; oscillator.frequency.setValueAtTime(330, audioCtx.currentTime); break;
        case 'hit': oscillator.type = 'square'; oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); duration = 0.05; break;
        case 'explosion': oscillator.type = 'noise'; duration = 0.3; volume = 0.4; break; // Noise needs a filter for better sound
        case 'player_death': oscillator.type = 'sawtooth'; oscillator.frequency.setValueAtTime(110, audioCtx.currentTime); duration = 0.5; volume = 0.5; break;
        case 'wave_clear': oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); duration = 0.4; break;
        default: oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
    }
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

// --- Obstacle Class ---
class Obstacle {
    constructor(x, y, width, height) {
        this.x = x; this.y = y;
        this.width = width; this.height = height;
        this.color = '#778899'; // Slate gray
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#556677';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    getBoundingBox() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

// --- Joystick & FireButton Classes (Keep as before, or slightly adjust radii if needed) ---
class Joystick { /* ... (Code from previous complete script.js) ... */
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
class FireButton { /* ... (Code from previous complete script.js) ... */
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

// --- Tank Class (Major AI and Obstacle Handling Update) ---
class Tank {
    constructor(x, y, isPlayer = true, isBoss = false) {
        this.x = x; this.y = y; this.isPlayer = isPlayer; this.isBoss = isBoss;
        this.width = isPlayer ? TANK_WIDTH : (isBoss ? BOSS_TANK_WIDTH : ENEMY_TANK_WIDTH);
        this.height = isPlayer ? TANK_HEIGHT : (isBoss ? BOSS_TANK_HEIGHT : ENEMY_TANK_HEIGHT);
        this.bodyAngle = isPlayer ? -Math.PI / 2 : Math.random() * Math.PI * 2; // Player starts facing up
        this.turretAngle = this.bodyAngle;
        this.lastShotTime = 0;
        this.health = isPlayer ? MAX_PLAYER_HEALTH : (isBoss ? MAX_BOSS_HEALTH : MAX_ENEMY_HEALTH);
        this.maxHealth = this.health;
        this.colorBody = isPlayer ? 'darkgreen' : (isBoss ? '#222' : 'maroon'); // Boss is dark
        this.colorTurret = isPlayer ? 'green' : (isBoss ? '#555' : 'red');
        this.speed = isPlayer ? TANK_SPEED : TANK_SPEED * (isBoss ? 0.5 : (0.5 + Math.random() * 0.4));
        this.collidingWithObstacle = false;

        if (!isPlayer) {
            this.aiState = 'patrolling'; this.aiMoveTimer = 0; this.aiTargetAngle = this.bodyAngle;
            this.aiShootCooldown = isBoss ? BOSS_SHOOT_COOLDOWN_NORMAL : (1200 + Math.random() * 1800);
            this.aiLastShotTime = Date.now();
            this.aiSightRange = isBoss ? canvas.width : (180 + Math.random() * 120); // Boss sees everything
            this.aiWanderTarget = null;
            this.aiPathBlockedTimer = 0; // Timer for when path is blocked

            if (isBoss) {
                this.aiLastSpecialAttackTime = Date.now();
            }
        }
    }

    draw() { /* ... (Draw logic largely same, health bar logic same) ... */
        if (this.health <= 0 && !this.isBoss) return; // Boss might have a death animation
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.bodyAngle);
        ctx.fillStyle = this.colorBody;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        if (this.isPlayer || this.isBoss) { // Detail for player and boss
            ctx.fillStyle = this.isPlayer ? 'lime' : '#888';
            ctx.fillRect(this.width / 4, -this.height/5, this.width / 4, this.height/2.5);
        }
        ctx.restore();

        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.turretAngle);
        ctx.fillStyle = 'gray';
        ctx.fillRect(TURRET_RADIUS * 0.5, -BARREL_WIDTH / 2, this.isBoss ? BARREL_LENGTH * 1.2 : BARREL_LENGTH, BARREL_WIDTH * (this.isBoss ? 1.2 : 1));
        ctx.beginPath(); ctx.arc(0, 0, TURRET_RADIUS * (this.isBoss ? 1.5 : 1), 0, Math.PI * 2);
        ctx.fillStyle = this.colorTurret; ctx.fill();
        ctx.restore();

        const healthBarActualWidth = this.isBoss ? HEALTH_BAR_WIDTH * 2 : HEALTH_BAR_WIDTH;
        const healthBarX = this.x - healthBarActualWidth / 2;
        const healthBarY = this.y - this.height / 2 - HEALTH_BAR_HEIGHT - 7;
        ctx.fillStyle = '#555'; ctx.fillRect(healthBarX - 1, healthBarY - 1, healthBarActualWidth + 2, HEALTH_BAR_HEIGHT + 2);
        ctx.fillStyle = 'darkred'; ctx.fillRect(healthBarX, healthBarY, healthBarActualWidth, HEALTH_BAR_HEIGHT);
        const currentHealthWidth = (this.health / this.maxHealth) * healthBarActualWidth;
        ctx.fillStyle = 'lime';
        ctx.fillRect(healthBarX, healthBarY, Math.max(0, currentHealthWidth), HEALTH_BAR_HEIGHT);
    }


    update(moveInput, aimInput, playerTankRef, obstaclesRef) {
        if (this.health <= 0) return;
        let prevX = this.x; let prevY = this.y; // For collision rollback

        if (this.isPlayer) {
             // Player movement (same as before)
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
                this.aiWanderTarget = null; // Stop wandering if player is seen
            } else {
                this.aiState = 'patrolling';
            }

            if (this.aiPathBlockedTimer > 0) this.aiPathBlockedTimer -= 1000/60;

            let targetAngleForMovement = this.bodyAngle;

            if (this.aiState === 'patrolling') {
                if (!this.aiWanderTarget || this.aiMoveTimer <= 0 || getDistance(this.x, this.y, this.aiWanderTarget.x, this.aiWanderTarget.y) < this.width) {
                    this.aiWanderTarget = {
                        x: Math.random() * (canvas.width - this.width*2) + this.width,
                        y: Math.random() * (canvas.height - this.height*2) + this.height
                    };
                    this.aiMoveTimer = 3000 + Math.random() * 4000;
                }
                targetAngleForMovement = Math.atan2(this.aiWanderTarget.y - this.y, this.aiWanderTarget.x - this.x);
                this.turretAngle = this.bodyAngle; // Turret follows body
            } else if (this.aiState === 'attacking' || this.aiState === 'boss_attacking') {
                targetAngleForMovement = Math.atan2(playerTankRef.y - this.y, playerTankRef.x - this.x);
                this.turretAngle = targetAngleForMovement; // Aim at player

                // AI Shooting
                const currentTime = Date.now();
                if (currentTime - this.aiLastShotTime > this.aiShootCooldown) {
                    this.shoot();
                    this.aiLastShotTime = currentTime;
                }
                // Boss Special Attack
                if (this.isBoss && currentTime - this.aiLastSpecialAttackTime > BOSS_SHOOT_COOLDOWN_SPECIAL) {
                    this.bossSpecialAttack();
                    this.aiLastSpecialAttackTime = currentTime;
                }
            }

            // AI Movement & Rotation
            if (this.aiPathBlockedTimer <=0) { // Only move if not recently blocked
                let angleDiffBody = targetAngleForMovement - this.bodyAngle;
                while (angleDiffBody > Math.PI) angleDiffBody -= Math.PI * 2;
                while (angleDiffBody < -Math.PI) angleDiffBody += Math.PI * 2;

                if (Math.abs(angleDiffBody) > TANK_ROTATION_SPEED * 0.7) {
                    this.bodyAngle += Math.sign(angleDiffBody) * TANK_ROTATION_SPEED * 0.7;
                } else {
                    this.bodyAngle = targetAngleForMovement; // Snap if close
                }
                // Move only if roughly facing target (for patrolling) or if attacking
                if (Math.abs(angleDiffBody) < Math.PI / 2 || this.aiState.includes('attacking')) {
                    this.x += this.speed * Math.cos(this.bodyAngle);
                    this.y += this.speed * Math.sin(this.bodyAngle);
                }
            }
        }

        // Collision with Obstacles (for all tanks)
        this.collidingWithObstacle = false;
        obstaclesRef.forEach(obs => {
            if (checkTankObstacleCollision(this, obs)) {
                this.collidingWithObstacle = true;
                // Simple rollback - can be improved with sliding
                this.x = prevX;
                this.y = prevY;
                if (!this.isPlayer && this.aiPathBlockedTimer <=0) { // AI specific: if blocked, try new target
                    this.aiWanderTarget = null; // Force new wander target
                    this.aiMoveTimer = 200;    // Short timer to re-evaluate
                    this.aiPathBlockedTimer = 500; // Don't try to move for a bit
                }
            }
        });


        // Keep tank in bounds
        this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(canvas.height - this.height / 2, this.y));
    }

    shoot() { /* ... (Logic same, but add playSound) ... */
        if (this.health <= 0) return;
        const currentTime = Date.now();
        const cooldown = this.isPlayer ? SHOOT_COOLDOWN : this.aiShootCooldown;
        const lastShot = this.isPlayer ? this.lastShotTime : this.aiLastShotTime;

        if (currentTime - lastShot > cooldown) {
            if (this.isPlayer) this.lastShotTime = currentTime;
            else this.aiLastShotTime = currentTime;

            playSound(this.isPlayer ? 'shoot' : 'enemy_shoot', 0.2);
            const barrelTipX = this.x + (this.isBoss ? BARREL_LENGTH * 1.2 : BARREL_LENGTH) * Math.cos(this.turretAngle);
            const barrelTipY = this.y + (this.isBoss ? BARREL_LENGTH * 1.2 : BARREL_LENGTH) * Math.sin(this.turretAngle);
            bullets.push(new Bullet(barrelTipX, barrelTipY, this.turretAngle, this.isPlayer, this.isBoss));
        }
    }
    bossSpecialAttack() {
        if (!this.isBoss || this.health <= 0) return;
        playSound('explosion', 0.4, 0.2); // A different sound for special
        const spreadAngle = Math.PI / 8; // Angle between spread bullets
        const startAngle = this.turretAngle - (spreadAngle * (BOSS_SPECIAL_ATTACK_BULLET_COUNT -1) / 2);
        for(let i = 0; i < BOSS_SPECIAL_ATTACK_BULLET_COUNT; i++) {
            const angle = startAngle + i * spreadAngle;
            const barrelTipX = this.x + BARREL_LENGTH * 1.2 * Math.cos(this.turretAngle); // Use turret angle for origin
            const barrelTipY = this.y + BARREL_LENGTH * 1.2 * Math.sin(this.turretAngle);
            bullets.push(new Bullet(barrelTipX, barrelTipY, angle, false, true, true)); // isSpecial = true
        }
    }

    takeDamage(amount) { /* ... (Logic same, but add playSound) ... */
        this.health -= amount;
        playSound('hit', 0.4);
        if (this.health < 0) this.health = 0;
        if (this.health <= 0) this.onDeath();
    }
    onDeath() { /* ... (Logic same, but add playSound and boss specific) ... */
        playSound(this.isPlayer ? 'player_death' : 'explosion');
        if (!this.isPlayer) {
            score += this.isBoss ? 100 : 10; // More score for boss
            const index = enemies.indexOf(this);
            if (index > -1) enemies.splice(index, 1);
            if(this.isBoss && gameMode === 'boss_battle') {
                message = "BOSS DEFEATED!";
                messageTimer = MESSAGE_DURATION * 2;
                // Potentially end game or trigger next phase
                // For now, just show message and player can continue or quit
                gameActive = false; // Or set a flag like bossDefeated = true
                setTimeout(() => showGameOverScreen(true), MESSAGE_DURATION * 2); // Show "victory" screen
            }
        } else {
            gameActive = false;
            showGameOverScreen();
        }
    }
}

// --- Bullet Class (Add isBoss and isSpecial optional params) ---
class Bullet {
    constructor(x, y, angle, firedByPlayer, firedByBoss = false, isSpecial = false) {
        this.x = x; this.y = y; this.angle = angle;
        this.firedByPlayer = firedByPlayer;
        this.firedByBoss = firedByBoss;
        this.isSpecial = isSpecial; // For boss special attacks, maybe different visuals/damage
        this.damage = this.firedByPlayer ? 20 : (this.firedByBoss ? (this.isSpecial ? 15 : 25) : 10);
        this.radius = this.isSpecial ? BULLET_RADIUS * 1.2 : BULLET_RADIUS;
        this.color = this.firedByPlayer ? 'yellow' : (this.firedByBoss ? (this.isSpecial ? 'fuchsia' : 'orangered') : '#FF69B4');
        this.speed = this.isSpecial ? BULLET_SPEED * 0.8 : BULLET_SPEED; // Special bullets might be slower but more
    }
    draw() { /* ... (Same logic) ... */
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill();
    }
    update() { /* ... (Same logic) ... */
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);
    }
    isOffScreen() { /* ... (Same logic) ... */
        return this.x < -this.radius || this.x > canvas.width + this.radius ||
               this.y < -this.radius || this.y > canvas.height + this.radius;
    }
}

// --- Collision Detection (Update for Obstacles) ---
function getBoundingBox(entity) { // For tanks and obstacles
    return {
        x: entity.x - entity.width / 2, y: entity.y - entity.height / 2,
        width: entity.width, height: entity.height
    };
}
function checkRectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}
function checkTankObstacleCollision(tank, obstacle) {
    return checkRectCollision(getBoundingBox(tank), obstacle.getBoundingBox());
}
function checkBulletTankCollision(bullet, tank) { /* ... (Keep previous more precise logic or simplify) ... */
    if (tank.health <= 0) return false;
    const dist = getDistance(bullet.x, bullet.y, tank.x, tank.y);
    // Approximate tank as a circle with radius of its largest dimension / 2
    const tankEffectiveRadius = Math.max(tank.width, tank.height) / 2;
    return dist < tankEffectiveRadius + bullet.radius;
}


// --- Game Management Functions (Major Updates) ---
function spawnEnemy(isBossOverride = false) {
    // ... (Spawning logic, but pass isBossOverride to Tank constructor)
    let spawnX, spawnY;
    const isBossModeActive = (gameMode === 'boss_battle' && enemies.filter(e => e.isBoss).length === 0);
    const actuallySpawnBoss = isBossOverride || isBossModeActive;

    const widthToUse = actuallySpawnBoss ? BOSS_TANK_WIDTH : ENEMY_TANK_WIDTH;
    const heightToUse = actuallySpawnBoss ? BOSS_TANK_HEIGHT : ENEMY_TANK_HEIGHT;

    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
        case 0: spawnX = Math.random() * canvas.width; spawnY = -heightToUse; break;
        case 1: spawnX = Math.random() * canvas.width; spawnY = canvas.height + heightToUse; break;
        case 2: spawnX = -widthToUse; spawnY = Math.random() * canvas.height; break;
        case 3: spawnX = canvas.width + widthToUse; spawnY = Math.random() * canvas.height; break;
    }
    enemies.push(new Tank(spawnX, spawnY, false, actuallySpawnBoss));
}

function startNewWave() {
    currentWave++;
    enemiesThisWave = WAVE_BASE_ENEMY_COUNT + Math.floor(currentWave / 2) * 2; // Slower increase
    message = `Wave ${currentWave}`;
    messageTimer = MESSAGE_DURATION;
    playSound('wave_clear', 0.4);
    enemies = []; bullets = []; // Clear enemies and bullets
    for (let i = 0; i < enemiesThisWave; i++) spawnEnemy();
}

function createObstacles() {
    obstacles = []; // Clear old obstacles
    // Example: Add a few random obstacles
    const numObstacles = 3 + Math.floor(Math.random() * 3); // 3 to 5 obstacles
    for (let i = 0; i < numObstacles; i++) {
        const obsWidth = 50 + Math.random() * 80;
        const obsHeight = 50 + Math.random() * 80;
        const obsX = Math.random() * (canvas.width - obsWidth - 100) + 50; // Avoid edges
        const obsY = Math.random() * (canvas.height - obsHeight - 100) + 50;
        // Ensure no overlap with initial player position (very basic check)
        if (getDistance(obsX + obsWidth/2, obsY + obsHeight/2, canvas.width/2, canvas.height/2) > TANK_WIDTH * 3) {
            obstacles.push(new Obstacle(obsX, obsY, obsWidth, obsHeight));
        }
    }
}

function showMenuScreen() {
    gameActive = false;
    menuScreen.style.display = 'flex'; // Assuming menu uses flex for centering
    gameArea.style.display = 'none';
    gameOverScreen.style.display = 'none';
    loadHighScores(); // Load and display high scores when showing menu
    if(gameLoopRequest) cancelAnimationFrame(gameLoopRequest); // Stop game loop
    gameLoopRequest = null;
}
function showGameOverScreen(bossDefeated = false) {
    gameActive = false;
    menuScreen.style.display = 'none';
    gameArea.style.display = 'none'; // Hide game area too
    gameOverScreen.style.display = 'block';

    if (bossDefeated) {
        gameOverTitle.textContent = "VICTORY!";
        finalScoreDisplay.textContent = score; // Show score even for boss
        waveReachedDisplay.style.display = 'none';
        playSound('wave_clear', 0.6, 1.0); // Victory sound
        if (gameMode === 'boss_battle') {
             let wins = parseInt(localStorage.getItem(HIGH_SCORE_KEYS.boss_battle) || '0');
             localStorage.setItem(HIGH_SCORE_KEYS.boss_battle, wins + 1);
        }
    } else {
        gameOverTitle.textContent = 'GAME OVER';
        finalScoreDisplay.textContent = score;
        playSound('player_death', 0.6);
        if (gameMode === 'wave_defense') {
            waveReachedDisplay.style.display = 'block';
            finalWaveDisplay.textContent = currentWave;
        } else {
            waveReachedDisplay.style.display = 'none';
        }
    }
    saveHighScore();
    loadHighScores(); // Update display on menu (though menu is hidden now)
}

function startGame(mode) {
    initAudio(); // Ensure audio context is ready on user interaction
    currentSelectedMode = mode; // Store the selected mode for restart
    gameMode = mode;
    menuScreen.style.display = 'none';
    gameArea.style.display = 'flex'; // Show game area
    gameOverScreen.style.display = 'none';
    backToMenuBtnGame.style.display = 'inline-block';


    playerTank = new Tank(canvas.width / 2, canvas.height / 1.2, true); // Start player lower
    bullets = []; enemies = [];
    score = 0; gameActive = true;
    lastEnemySpawnTime = Date.now();
    currentWave = 0;
    timeRemaining = TIME_ATTACK_DURATION;
    lastTickTime = Date.now();
    message = `Mode: ${gameMode.replace('_', ' ')}`;
    messageTimer = MESSAGE_DURATION;

    createObstacles(); // Create obstacles for the new game

    if (gameMode === 'wave_defense') {
        startNewWave();
    } else if (gameMode === 'survival') {
        for (let i = 0; i < 2; i++) spawnEnemy(); // Start with 2 enemies
    } else if (gameMode === 'boss_battle') {
        enemies = []; // Clear any normal enemies
        spawnEnemy(true); // Spawn the boss
        message = "BOSS BATTLE!";
    }

    if (gameLoopRequest) cancelAnimationFrame(gameLoopRequest);
    gameLoop();
}

// --- High Score Functions ---
function saveHighScore() {
    let highScoreKey;
    let currentBest;

    switch (gameMode) {
        case 'survival':
            highScoreKey = HIGH_SCORE_KEYS.survival;
            currentBest = parseInt(localStorage.getItem(highScoreKey) || '0');
            if (score > currentBest) localStorage.setItem(highScoreKey, score);
            break;
        case 'wave_defense':
            highScoreKey = HIGH_SCORE_KEYS.wave_defense;
            currentBest = parseInt(localStorage.getItem(highScoreKey) || '0');
            if (currentWave > currentBest) localStorage.setItem(highScoreKey, currentWave);
            break;
        case 'time_attack':
            highScoreKey = HIGH_SCORE_KEYS.time_attack;
            currentBest = parseInt(localStorage.getItem(highScoreKey) || '0');
            if (score > currentBest) localStorage.setItem(highScoreKey, score);
            break;
        // Boss battle might track wins or fastest time, not implemented here as a "score"
    }
}
function loadHighScores() {
    survivalHighScoreDisplay.textContent = localStorage.getItem(HIGH_SCORE_KEYS.survival) || '0';
    waveHighScoreDisplay.textContent = localStorage.getItem(HIGH_SCORE_KEYS.wave_defense) || '0';
    timeAttackHighScoreDisplay.textContent = localStorage.getItem(HIGH_SCORE_KEYS.time_attack) || '0';
    // You could add display for boss wins too
}

// --- Input Handling (Largely the same, ensure event listeners are added in init) ---
// ... (Keep getTouchPos, handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd)
function getTouchPos(canvasDom, touchEvent) {
    const rect = canvasDom.getBoundingClientRect();
    return { x: touchEvent.clientX - rect.left, y: touchEvent.clientY - rect.top };
}
let isMouseDown = false;
function handleMouseDown(event) {
    if (!gameActive && gameOverScreen.style.display === 'none') return; // Prevent input if game not active and not on game over screen
    isMouseDown = true; const pos = getTouchPos(canvas, event);
    if (moveJoystick.handleDown(pos.x, pos.y, 'mouse')) return;
    if (aimJoystick.handleDown(pos.x, pos.y, 'mouse')) return;
    if (fireButton.handleDown(pos.x, pos.y, 'mouse')) return;
}
function handleMouseMove(event) {
    if (!isMouseDown || !gameActive) return; const pos = getTouchPos(canvas, event);
    moveJoystick.handleMove(pos.x, pos.y, 'mouse');
    aimJoystick.handleMove(pos.x, pos.y, 'mouse');
}
function handleMouseUp(event) {
    if (!gameActive && gameOverScreen.style.display === 'none' && menuScreen.style.display === 'none') return;
    isMouseDown = false;
    moveJoystick.handleUp('mouse'); aimJoystick.handleUp('mouse'); fireButton.handleUp('mouse');
}
function handleTouchStart(event) {
    if (!gameActive && gameOverScreen.style.display === 'none') return;
    initAudio(); // Init audio on first touch if not already
    event.preventDefault(); const touches = event.changedTouches; const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i]; const x = touch.clientX - rect.left; const y = touch.clientY - rect.top;
        if (moveJoystick.handleDown(x, y, touch.identifier)) continue;
        if (aimJoystick.handleDown(x, y, touch.identifier)) continue;
        if (fireButton.handleDown(x, y, touch.identifier)) continue;
    }
}
function handleTouchMove(event) {
    if (!gameActive) return;
    event.preventDefault(); const touches = event.changedTouches; const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i]; const x = touch.clientX - rect.left; const y = touch.clientY - rect.top;
        moveJoystick.handleMove(x, y, touch.identifier);
        aimJoystick.handleMove(x, y, touch.identifier);
    }
}
function handleTouchEnd(event) {
     if (!gameActive && gameOverScreen.style.display === 'none' && menuScreen.style.display === 'none') return;
    event.preventDefault(); const touches = event.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        moveJoystick.handleUp(touch.identifier);
        aimJoystick.handleUp(touch.identifier);
        fireButton.handleUp(touch.identifier);
    }
}

// --- Game Loop (Major Updates) ---
function update() {
    if (!gameActive) return;

    const moveInput = moveJoystick.getValue();
    const aimInput = aimJoystick.getValue();
    if (playerTank) playerTank.update(moveInput, aimInput, null, obstacles);

    if (fireButton.isPressed && playerTank) {
        playerTank.shoot();
    }

    enemies.forEach(enemy => enemy.update(null, null, playerTank, obstacles));

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.update();
        if (bullet.isOffScreen()) { bullets.splice(i, 1); continue; }

        let bulletRemoved = false;
        // Bullet-Obstacle Collision
        for (const obs of obstacles) {
            if (checkRectCollision({x: bullet.x - bullet.radius, y: bullet.y - bullet.radius, width: bullet.radius*2, height: bullet.radius*2}, obs.getBoundingBox())) {
                bullets.splice(i,1);
                bulletRemoved = true;
                playSound('hit', 0.1, 0.05);
                break;
            }
        }
        if (bulletRemoved) continue;

        // Bullet-Tank Collision
        if (bullet.firedByPlayer) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (checkBulletTankCollision(bullet, enemies[j])) {
                    enemies[j].takeDamage(bullet.damage);
                    bullets.splice(i, 1); bulletRemoved = true; break;
                }
            }
        } else { // Enemy bullet
            if (playerTank && checkBulletTankCollision(bullet, playerTank)) {
                playerTank.takeDamage(bullet.damage);
                bullets.splice(i, 1); bulletRemoved = true;
            }
        }
    }
    if (messageTimer > 0) messageTimer -= 1000 / 60; // Approx delta time

    // Game Mode Logic
    const currentTime = Date.now();
    if (gameMode === 'survival') {
        if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL_SURVIVAL) {
            if (enemies.length < 10) spawnEnemy(); // Limit max enemies on screen
            lastEnemySpawnTime = currentTime;
        }
    } else if (gameMode === 'wave_defense') {
        if (enemies.length === 0 && gameActive && messageTimer <= 0) { // Wave cleared and message shown
            playSound('wave_clear');
            setTimeout(startNewWave, 1500); // Delay before next wave
            message = "Wave Cleared! Next wave incoming..."; // Temporary message
            messageTimer = 1500;
        }
    } else if (gameMode === 'time_attack') {
        const deltaTime = currentTime - lastTickTime;
        lastTickTime = currentTime;
        timeRemaining -= deltaTime;
        if (timeRemaining <= 0) {
            timeRemaining = 0; gameActive = false;
            showGameOverScreen();
        }
        if (currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL_SURVIVAL * 0.6) { // Faster spawns
            if (enemies.length < 12) spawnEnemy();
            lastEnemySpawnTime = currentTime;
        }
    } else if (gameMode === 'boss_battle') {
        if (enemies.filter(e => e.isBoss).length === 0 && gameActive && playerTank.health > 0) {
            // This case is handled in Tank.onDeath for the boss
            // If there are other logic like "Boss defeated, proceed to next phase", put it here
            // For now, onDeath handles showing "VICTORY"
        }
    }
}

function drawUI() {
    // ... (Update UI elements using their IDs)
    gameModeDisplay.textContent = `Chế độ: ${gameMode.replace('_',' ')}`;
    scoreDisplay.textContent = `Điểm: ${score}`;
    playerHealthDisplay.textContent = `HP: ${playerTank ? playerTank.health : 'N/A'}`;

    waveDisplay.style.display = 'none';
    enemiesLeftDisplay.style.display = 'none';
    timeDisplay.style.display = 'none';

    if (gameMode === 'wave_defense') {
        waveDisplay.style.display = 'inline';
        enemiesLeftDisplay.style.display = 'inline';
        waveDisplay.textContent = `Sóng: ${currentWave}`;
        enemiesLeftDisplay.textContent = `Kẻ địch: ${enemies.length}`;
    } else if (gameMode === 'time_attack') {
        timeDisplay.style.display = 'inline';
        const seconds = Math.max(0, Math.floor(timeRemaining / 1000));
        const milliseconds = Math.max(0, Math.floor((timeRemaining % 1000) / 100));
        timeDisplay.textContent = `TG: ${seconds}.${milliseconds}s`;
    } else if (gameMode === 'boss_battle' && enemies.length > 0 && enemies[0].isBoss) {
        // Could display boss health here or a specific boss UI element
        enemiesLeftDisplay.style.display = 'inline';
        enemiesLeftDisplay.textContent = `Boss HP: ${enemies[0].health}`;
    }


    if (messageTimer > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height / 3);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    obstacles.forEach(o => o.draw());
    if (playerTank) playerTank.draw();
    enemies.forEach(e => e.draw());
    bullets.forEach(b => b.draw());
    if (moveJoystick) moveJoystick.draw();
    if (aimJoystick) aimJoystick.draw();
    if (fireButton) fireButton.draw();
    // UI is now HTML elements, but messages are drawn on canvas
    if (messageTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        const alpha = Math.min(1, messageTimer / (MESSAGE_DURATION / 2)); // Fade out
        ctx.globalAlpha = alpha;
        ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 50);
        ctx.globalAlpha = 1.0;
    }
}

function gameLoop() {
    if (gameActive) update(); // Only update if game is active
    draw(); // Always draw (to show game over screen etc.)
    updateHTMLUI(); // Update HTML UI elements
    gameLoopRequest = requestAnimationFrame(gameLoop);
}

// New function to update HTML based UI elements
function updateHTMLUI() {
    if (gameActive && playerTank) { // Only update if game is active and player exists
        gameModeDisplay.textContent = `Chế độ: ${currentSelectedMode.replace('_',' ')}`;
        scoreDisplay.textContent = `Điểm: ${score}`;
        playerHealthDisplay.textContent = `HP: ${playerTank.health}`;

        waveDisplay.style.display = 'none';
        enemiesLeftDisplay.style.display = 'none';
        timeDisplay.style.display = 'none';

        if (currentSelectedMode === 'wave_defense') {
            waveDisplay.style.display = 'inline';
            enemiesLeftDisplay.style.display = 'inline';
            waveDisplay.textContent = `Sóng: ${currentWave}`;
            enemiesLeftDisplay.textContent = `Kẻ địch: ${enemies.length}`;
        } else if (currentSelectedMode === 'time_attack') {
            timeDisplay.style.display = 'inline';
            const seconds = Math.max(0, Math.floor(timeRemaining / 1000));
            const milliseconds = Math.max(0, Math.floor((timeRemaining % 1000) / 100));
            timeDisplay.textContent = `TG: ${seconds}.${milliseconds}s`;
        } else if (currentSelectedMode === 'boss_battle' && enemies.length > 0 && enemies[0].isBoss) {
            enemiesLeftDisplay.style.display = 'inline';
            enemiesLeftDisplay.textContent = `Boss HP: ${enemies[0].health}`;
        }
    }
}


// --- Initialization ---
function initEventListeners() {
    survivalBtn.onclick = () => startGame('survival');
    waveBtn.onclick = () => startGame('wave_defense');
    timeAttackBtn.onclick = () => startGame('time_attack');
    bossBattleBtn.onclick = () => startGame('boss_battle');

    restartBtn.onclick = () => startGame(currentSelectedMode); // Restart current mode
    menuFromGameOverBtn.onclick = showMenuScreen;
    backToMenuBtnGame.onclick = showMenuScreen;


    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
}

function init() {
    console.log("Document loaded, initializing game systems...");
    const joystickBaseRadius = Math.min(canvas.width, canvas.height) * 0.1;
    const joystickStickRadius = joystickBaseRadius * 0.6;
    const joystickOffsetY = canvas.height - joystickBaseRadius - 20;
    const joystickOffsetX = joystickBaseRadius + 25;

    moveJoystick = new Joystick(joystickOffsetX, joystickOffsetY, joystickBaseRadius, joystickStickRadius);
    aimJoystick = new Joystick(canvas.width - joystickOffsetX, joystickOffsetY, joystickBaseRadius, joystickStickRadius);
    fireButton = new FireButton(canvas.width - joystickOffsetX, joystickOffsetY - joystickBaseRadius - 40, joystickBaseRadius * 0.7);

    initEventListeners();
    showMenuScreen(); // Start by showing the menu
    // Don't start gameLoop here, startGame will handle it.
    console.log("Game systems initialized. Waiting for mode selection.");
}

// Start the game setup when the DOM is ready
window.onload = init;
