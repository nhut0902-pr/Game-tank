// script.js
// --- Setup Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Nên đặt kích thước canvas ở đây để đảm bảo nó được đặt trước khi game bắt đầu
// Bạn có thể làm cho nó responsive sau
canvas.width = Math.min(window.innerWidth - 20, 800); // Giới hạn chiều rộng
canvas.height = Math.min(window.innerHeight - 180, 600); // Trừ không gian cho tiêu đề và thông tin

// --- Game Constants ---
const TANK_WIDTH = 50;
const TANK_HEIGHT = 40;
const TURRET_RADIUS = 10; // Bán kính đế tháp pháo
const BARREL_LENGTH = 30;
const BARREL_WIDTH = 8;
const BULLET_RADIUS = 5;
const BULLET_SPEED = 6;
const TANK_SPEED = 1.8;
const TANK_ROTATION_SPEED = 0.04;
const TURRET_ROTATION_SPEED = 0.06;
const SHOOT_COOLDOWN = 400; //ms

// --- Game State ---
let playerTank;
let bullets = [];
let moveJoystick, aimJoystick, fireButton;
let gameLoopRequest; // Để quản lý requestAnimationFrame

// --- Utility Functions ---
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// --- Joystick Class ---
class Joystick {
    constructor(x, y, baseRadius, stickRadius) {
        this.baseX = x;
        this.baseY = y;
        this.baseRadius = baseRadius;
        this.stickRadius = stickRadius;
        this.stickX = x;
        this.stickY = y;
        this.isActive = false;
        this.touchId = null;
        this.valueX = 0; // -1 to 1
        this.valueY = 0; // -1 to 1
    }

    draw() {
        // Base
        ctx.beginPath();
        ctx.arc(this.baseX, this.baseY, this.baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
        ctx.fill();

        // Stick
        ctx.beginPath();
        ctx.arc(this.stickX, this.stickY, this.stickRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
        ctx.fill();
    }

    handleDown(eventX, eventY, touchId) {
        if (getDistance(eventX, eventY, this.baseX, this.baseY) < this.baseRadius + this.stickRadius) {
            this.isActive = true;
            this.touchId = touchId;
            this._updateStick(eventX, eventY);
            return true;
        }
        return false;
    }

    handleMove(eventX, eventY, touchId) {
        if (this.isActive && this.touchId === touchId) {
            this._updateStick(eventX, eventY);
        }
    }

    handleUp(touchId) {
        if (this.touchId === touchId) {
            this.isActive = false;
            this.touchId = null;
            this.stickX = this.baseX;
            this.stickY = this.baseY;
            this.valueX = 0;
            this.valueY = 0;
        }
    }

    _updateStick(eventX, eventY) {
        const deltaX = eventX - this.baseX;
        const deltaY = eventY - this.baseY;
        const distance = getDistance(eventX, eventY, this.baseX, this.baseY);

        if (distance < this.baseRadius) {
            this.stickX = eventX;
            this.stickY = eventY;
        } else {
            const angle = Math.atan2(deltaY, deltaX);
            this.stickX = this.baseX + this.baseRadius * Math.cos(angle);
            this.stickY = this.baseY + this.baseRadius * Math.sin(angle);
        }
        this.valueX = (this.stickX - this.baseX) / this.baseRadius;
        this.valueY = (this.stickY - this.baseY) / this.baseRadius;
    }

    getValue() {
        return { x: this.valueX, y: this.valueY };
    }
}

// --- FireButton Class ---
class FireButton {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.isPressed = false;
        this.touchId = null;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isPressed ? 'rgba(255, 80, 80, 0.9)' : 'rgba(255, 0, 0, 0.6)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(100,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Bắn', this.x, this.y);
    }

    handleDown(eventX, eventY, touchId) {
        if (getDistance(eventX, eventY, this.x, this.y) < this.radius) {
            this.isPressed = true;
            this.touchId = touchId;
            return true;
        }
        return false;
    }
    handleUp(touchId) {
        if (this.touchId === touchId) {
            this.isPressed = false;
            this.touchId = null;
        }
    }
}


// --- Tank Class ---
class Tank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.bodyAngle = 0; // radians, 0 is facing right
        this.turretAngle = 0; // radians, 0 is facing right (relative to world)
        this.lastShotTime = 0;
    }

    draw() {
        // Body
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.bodyAngle);
        ctx.fillStyle = 'darkgreen';
        ctx.fillRect(-TANK_WIDTH / 2, -TANK_HEIGHT / 2, TANK_WIDTH, TANK_HEIGHT);
        // Detail to show front of body
        ctx.fillStyle = 'lime';
        ctx.fillRect(TANK_WIDTH / 2 - 10, -5, 10, 10);
        ctx.restore();

        // Turret
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);
        // Barrel
        ctx.fillStyle = 'gray';
        ctx.fillRect(0, -BARREL_WIDTH / 2, BARREL_LENGTH, BARREL_WIDTH);
        // Turret Base
        ctx.beginPath();
        ctx.arc(0, 0, TURRET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'green';
        ctx.fill();
        ctx.restore();
    }

    update(moveInput, aimInput) {
        // Movement & Body Rotation from moveJoystick
        if (Math.abs(moveInput.x) > 0.1 || Math.abs(moveInput.y) > 0.1) {
            const targetBodyAngle = Math.atan2(moveInput.y, moveInput.x);
            let angleDiff = targetBodyAngle - this.bodyAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (Math.abs(angleDiff) > TANK_ROTATION_SPEED) {
                this.bodyAngle += Math.sign(angleDiff) * TANK_ROTATION_SPEED;
            } else {
                this.bodyAngle = targetBodyAngle;
            }

            // Move only if facing roughly the direction of joystick
            // Or, always move based on joystick magnitude if preferred
            const moveMagnitude = Math.sqrt(moveInput.x**2 + moveInput.y**2);
            const effectiveSpeed = TANK_SPEED * Math.min(1, moveMagnitude); // Cap speed

            this.x += effectiveSpeed * Math.cos(this.bodyAngle);
            this.y += effectiveSpeed * Math.sin(this.bodyAngle);
        }


        // Turret Rotation from aimJoystick
        if (Math.abs(aimInput.x) > 0.1 || Math.abs(aimInput.y) > 0.1) {
            this.turretAngle = Math.atan2(aimInput.y, aimInput.x);
        }

        // Keep tank in bounds
        this.x = Math.max(TANK_WIDTH / 2, Math.min(canvas.width - TANK_WIDTH / 2, this.x));
        this.y = Math.max(TANK_HEIGHT / 2, Math.min(canvas.height - TANK_HEIGHT / 2, this.y));
    }

    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime > SHOOT_COOLDOWN) {
            this.lastShotTime = currentTime;
            const barrelTipX = this.x + BARREL_LENGTH * Math.cos(this.turretAngle);
            const barrelTipY = this.y + BARREL_LENGTH * Math.sin(this.turretAngle);
            bullets.push(new Bullet(barrelTipX, barrelTipY, this.turretAngle));
            // console.log("Bang!"); // For debugging
        }
    }
}

// --- Bullet Class ---
class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'orange';
        ctx.fill();
    }

    update() {
        this.x += BULLET_SPEED * Math.cos(this.angle);
        this.y += BULLET_SPEED * Math.sin(this.angle);
    }

    isOffScreen() {
        return this.x < -BULLET_RADIUS || this.x > canvas.width + BULLET_RADIUS ||
               this.y < -BULLET_RADIUS || this.y > canvas.height + BULLET_RADIUS;
    }
}

// --- Input Handling ---
function getTouchPos(canvasDom, touchEvent) {
    const rect = canvasDom.getBoundingClientRect();
    // For single touch, use touchEvent.clientX/Y or touchEvent.touches[0].clientX/Y
    // For multi-touch, iterate through changedTouches
    return {
        x: touchEvent.clientX - rect.left,
        y: touchEvent.clientY - rect.top
    };
}

function handleMouseDown(event) {
    const pos = getTouchPos(canvas, event);
    if (moveJoystick.handleDown(pos.x, pos.y, 'mouse')) return;
    if (aimJoystick.handleDown(pos.x, pos.y, 'mouse')) return;
    if (fireButton.handleDown(pos.x, pos.y, 'mouse')) return;
}

function handleMouseMove(event) {
    const pos = getTouchPos(canvas, event);
    moveJoystick.handleMove(pos.x, pos.y, 'mouse');
    aimJoystick.handleMove(pos.x, pos.y, 'mouse');
    // Fire button doesn't need move
}

function handleMouseUp(event) {
    moveJoystick.handleUp('mouse');
    aimJoystick.handleUp('mouse');
    fireButton.handleUp('mouse');
}

function handleTouchStart(event) {
    event.preventDefault(); // Important
    const touches = event.changedTouches;
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        if (moveJoystick.handleDown(x, y, touch.identifier)) continue;
        if (aimJoystick.handleDown(x, y, touch.identifier)) continue;
        if (fireButton.handleDown(x, y, touch.identifier)) continue;
    }
}
function handleTouchMove(event) {
    event.preventDefault();
    const touches = event.changedTouches;
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        moveJoystick.handleMove(x, y, touch.identifier);
        aimJoystick.handleMove(x, y, touch.identifier);
    }
}
function handleTouchEnd(event) {
    event.preventDefault();
    const touches = event.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        moveJoystick.handleUp(touch.identifier);
        aimJoystick.handleUp(touch.identifier);
        fireButton.handleUp(touch.identifier);
    }
}

// --- Game Loop ---
function update() {
    const moveInput = moveJoystick.getValue();
    const aimInput = aimJoystick.getValue();
    playerTank.update(moveInput, aimInput);

    if (fireButton.isPressed) {
        playerTank.shoot();
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (bullets[i].isOffScreen()) {
            bullets.splice(i, 1);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear screen

    playerTank.draw();
    bullets.forEach(b => b.draw());

    moveJoystick.draw();
    aimJoystick.draw();
    fireButton.draw();
}

function gameLoop() {
    update();
    draw();
    gameLoopRequest = requestAnimationFrame(gameLoop);
}

// --- Initialization ---
function init() {
    console.log("Initializing game...");
    playerTank = new Tank(canvas.width / 2, canvas.height / 2);

    // Joystick positions (adjust as needed)
    const joystickBaseRadius = Math.min(canvas.width, canvas.height) * 0.12; // Responsive radius
    const joystickStickRadius = joystickBaseRadius * 0.5;
    const joystickOffsetY = canvas.height - joystickBaseRadius - 20;

    moveJoystick = new Joystick(joystickBaseRadius + 30, joystickOffsetY, joystickBaseRadius, joystickStickRadius);
    aimJoystick = new Joystick(canvas.width - joystickBaseRadius - 30, joystickOffsetY, joystickBaseRadius, joystickStickRadius);
    fireButton = new FireButton(canvas.width - joystickBaseRadius - 30, joystickOffsetY - joystickBaseRadius - 40, joystickBaseRadius * 0.8);

    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp); // Handle mouse leaving canvas

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    console.log("Game initialized. Starting loop.");
    if (gameLoopRequest) cancelAnimationFrame(gameLoopRequest); // Clear old loop if any
    gameLoop();
}

// Start the game
init();

// Optional: Handle window resize to make canvas responsive (more advanced)
// window.addEventListener('resize', () => {
//     canvas.width = Math.min(window.innerWidth - 20, 800);
//     canvas.height = Math.min(window.innerHeight - 180, 600);
//     // Re-initialize or adjust positions of UI elements if needed
//     init(); // Simple re-init, or better: update positions
// });
