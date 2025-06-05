// script.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// --- Hình ảnh (tùy chọn) ---
let tankBodyImg = new Image();
let tankTurretImg = new Image();
let bulletImg = new Image();
let imagesLoaded = 0;
const totalImages = 0; // Đặt là 3 nếu bạn dùng ảnh

/* // Bỏ comment nếu dùng ảnh
tankBodyImg.src = 'tank_body.png';
tankTurretImg.src = 'tank_turret.png';
bulletImg.src = 'bullet.png';

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        initGame();
    }
}
if (totalImages > 0) {
    tankBodyImg.onload = imageLoaded;
    tankTurretImg.onload = imageLoaded;
    bulletImg.onload = imageLoaded;
} else {
    initGame();
}
*/
initGame(); // Khởi tạo ngay nếu không dùng ảnh


// --- Lớp Joystick ---
class Joystick {
    constructor(x, y, radius, stickRadius, colorBase = 'rgba(128, 128, 128, 0.5)', stickColor = 'rgba(80, 80, 80, 0.7)') {
        this.baseX = x;
        this.baseY = y;
        this.radius = radius; // Bán kính của vùng joystick
        this.stickRadius = stickRadius; // Bán kính của núm joystick
        this.stickX = x;
        this.stickY = y;
        this.colorBase = colorBase;
        this.stickColor = stickColor;
        this.isActive = false;
        this.touchId = null; // Để theo dõi touch event cụ thể (cho multi-touch)

        // Giá trị output của joystick
        this.valueX = 0; // Từ -1 đến 1
        this.valueY = 0; // Từ -1 đến 1
    }

    draw() {
        // Vẽ nền joystick
        ctx.beginPath();
        ctx.arc(this.baseX, this.baseY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.colorBase;
        ctx.fill();
        ctx.closePath();

        // Vẽ núm joystick
        ctx.beginPath();
        ctx.arc(this.stickX, this.stickY, this.stickRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.stickColor;
        ctx.fill();
        ctx.closePath();
    }

    handleTouchStart(x, y, touchId) {
        const distance = Math.sqrt((x - this.baseX) ** 2 + (y - this.baseY) ** 2);
        if (distance < this.radius + this.stickRadius) { // Cho phép chạm hơi ra ngoài 1 chút
            this.isActive = true;
            this.touchId = touchId;
            this.updateStickPosition(x, y);
            return true; // Joystick này đã được kích hoạt
        }
        return false;
    }

    handleTouchMove(x, y, touchId) {
        if (this.isActive && this.touchId === touchId) {
            this.updateStickPosition(x, y);
        }
    }

    handleTouchEnd(touchId) {
        if (this.touchId === touchId) {
            this.isActive = false;
            this.touchId = null;
            this.stickX = this.baseX;
            this.stickY = this.baseY;
            this.valueX = 0;
            this.valueY = 0;
        }
    }

    updateStickPosition(x, y) {
        const deltaX = x - this.baseX;
        const deltaY = y - this.baseY;
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

        if (distance < this.radius) {
            this.stickX = x;
            this.stickY = y;
        } else {
            // Giữ núm joystick trong phạm vi của nền
            const angle = Math.atan2(deltaY, deltaX);
            this.stickX = this.baseX + this.radius * Math.cos(angle);
            this.stickY = this.baseY + this.radius * Math.sin(angle);
        }

        // Tính toán giá trị output, chuẩn hóa về -1 đến 1
        this.valueX = (this.stickX - this.baseX) / this.radius;
        this.valueY = (this.stickY - this.baseY) / this.radius;
    }

    getValue() {
        return { x: this.valueX, y: this.valueY };
    }
}

// --- Lớp Nút Bắn ---
class FireButton {
    constructor(x, y, radius, color = 'rgba(255, 0, 0, 0.6)') {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.isPressed = false;
        this.touchId = null;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isPressed ? 'rgba(200, 0, 0, 0.8)' : this.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(100,0,0,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Chữ "Bắn"
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Bắn', this.x, this.y);
    }

    handleTouchStart(x, y, touchId) {
        const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        if (distance < this.radius) {
            this.isPressed = true;
            this.touchId = touchId;
            return true;
        }
        return false;
    }

    handleTouchEnd(touchId) {
        if (this.touchId === touchId) {
            this.isPressed = false;
            this.touchId = null;
        }
    }

    isJustPressed() { // Chỉ trả về true một lần khi vừa được nhấn
        if (this.isPressed && !this.wasPressedLastFrame) {
            this.wasPressedLastFrame = true;
            return true;
        }
        if (!this.isPressed) {
            this.wasPressedLastFrame = false;
        }
        return false;
    }
}


// --- Lớp Xe Tăng (Tương tự như trước, có một vài điều chỉnh nhỏ) ---
class Tank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 40;
        this.turretWidth = 15;
        this.turretHeight = 35;
        this.barrelLength = 25;
        this.barrelWidth = 8;

        this.bodyAngle = 0;
        this.turretAngle = 0;

        this.speed = 2;
        this.rotationSpeed = 0.05;
        this.turretRotationSpeed = 0.07;

        this.colorBody = 'darkgreen';
        this.colorTurret = 'green';
        this.colorBarrel = 'darkgray';

        this.health = 100;
        this.shootCooldown = 500;
        this.lastShotTime = 0;
    }

    draw() {
        // Vẽ thân xe
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.bodyAngle);

        if (totalImages > 0 && tankBodyImg.complete) {
            ctx.drawImage(tankBodyImg, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = this.colorBody;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(this.width / 2 - 10, -5, 10, 10);
        }
        ctx.restore();

        // Vẽ tháp pháo
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.turretAngle);

        if (totalImages > 0 && tankTurretImg.complete) {
            ctx.drawImage(tankTurretImg, -this.turretWidth/2 , -this.barrelLength, this.turretWidth, this.turretHeight);
        } else {
            ctx.fillStyle = this.colorTurret;
            ctx.fillRect(-this.turretWidth / 2, -this.turretWidth / 2, this.turretWidth, this.turretWidth);
            ctx.fillStyle = this.colorBarrel;
            ctx.fillRect(-this.barrelWidth / 2, -this.barrelLength, this.barrelWidth, this.barrelLength);
        }
        ctx.restore();
    }

    // Điều khiển bằng joystick
    control(moveStickValue, turretStickValue) {
        // Di chuyển thân xe
        const moveMagnitude = moveStickValue.y; // y của joystick điều khiển tiến/lùi
        if (Math.abs(moveMagnitude) > 0.1) { // Ngưỡng để tránh di chuyển khi joystick ở gần tâm
            this.move(-moveMagnitude); // - vì joystick y dương là xuống, game y dương là xuống
        }

        // Xoay thân xe
        const bodyRotateMagnitude = moveStickValue.x; // x của joystick điều khiển xoay thân
        if (Math.abs(bodyRotateMagnitude) > 0.1) {
            this.rotateBody(bodyRotateMagnitude);
        }

        // Xoay tháp pháo
        if (turretStickValue.x !== 0 || turretStickValue.y !== 0) {
            // Tính góc dựa trên vector của joystick
            // Điều này cho phép xoay tháp pháo tự do theo hướng joystick
            const targetTurretAngle = Math.atan2(turretStickValue.y, turretStickValue.x) + Math.PI / 2; // +PI/2 để nòng hướng lên
            
            // Xoay tháp pháo từ từ về hướng targetAngle
            let angleDiff = targetTurretAngle - this.turretAngle;
            // Chuẩn hóa angleDiff về khoảng (-PI, PI]
            while (angleDiff <= -Math.PI) angleDiff += 2 * Math.PI;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;

            if (Math.abs(angleDiff) > 0.01) { // Ngưỡng nhỏ để dừng xoay
                 this.turretAngle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.turretRotationSpeed);
            }
        }
    }


    move(directionMagnitude) { // directionMagnitude từ -1 đến 1
        const effectiveSpeed = directionMagnitude * this.speed;
        this.x += effectiveSpeed * Math.cos(this.bodyAngle);
        this.y += effectiveSpeed * Math.sin(this.bodyAngle);

        this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(canvas.height - this.height / 2, this.y));
    }

    rotateBody(directionMagnitude) { // directionMagnitude từ -1 đến 1
        this.bodyAngle += directionMagnitude * this.rotationSpeed;
    }

    // rotateTurret đã được xử lý trong control()

    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime > this.shootCooldown) {
            this.lastShotTime = currentTime;
            const barrelTipX = this.x + (this.barrelLength - 5) * Math.cos(this.turretAngle - Math.PI / 2);
            const barrelTipY = this.y + (this.barrelLength - 5) * Math.sin(this.turretAngle - Math.PI / 2);
            bullets.push(new Bullet(barrelTipX, barrelTipY, this.turretAngle));
        }
    }
}

// --- Lớp Đạn (Không thay đổi nhiều) ---
class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.speed = 7;
        this.angle = angle;
        this.color = 'orange';
    }

    draw() {
        if (totalImages > 0 && bulletImg.complete) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.drawImage(bulletImg, -this.radius, -this.radius / 2, this.radius * 2, this.radius);
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
    }

    update() {
        this.x += this.speed * Math.cos(this.angle - Math.PI / 2);
        this.y += this.speed * Math.sin(this.angle - Math.PI / 2);
    }

    isOffScreen() {
        return (
            this.x < -this.radius ||
            this.x > canvas.width + this.radius ||
            this.y < -this.radius ||
            this.y > canvas.height + this.radius
        );
    }
}


// --- Khởi Tạo Game và Vòng Lặp ---
let playerTank;
let bullets = [];
let keys = {}; // Vẫn giữ lại cho điều khiển bàn phím (nếu muốn)

// Khai báo joystick
let moveJoystick;
let turretJoystick;
let fireButton;

function initGame() {
    playerTank = new Tank(canvas.width / 2, canvas.height / 2);
    bullets = [];
    keys = {};

    // Khởi tạo joystick và nút bắn
    // Joystick di chuyển (trái dưới)
    moveJoystick = new Joystick(100, canvas.height - 100, 60, 30);
    // Joystick tháp pháo (phải dưới)
    turretJoystick = new Joystick(canvas.width - 100, canvas.height - 100, 60, 30);
    // Nút bắn (gần joystick tháp pháo)
    fireButton = new FireButton(canvas.width - 100, canvas.height - 200, 40);


    if (!gameLoopRequest) {
        gameLoop();
    }
}

// Xử lý Input (Bàn phím và Touch/Mouse)
// Bàn phím (giữ lại để debug hoặc tùy chọn)
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Touch Events
canvas.addEventListener('touchstart', handleTouchStart, false);
canvas.addEventListener('touchmove', handleTouchMove, false);
canvas.addEventListener('touchend', handleTouchEnd, false);
canvas.addEventListener('touchcancel', handleTouchEnd, false); // Xử lý như touchend

// Mouse Events (Mô phỏng touch cho desktop testing)
let isMouseDown = false;
canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Sử dụng ID = 0 cho chuột
    moveJoystick.handleTouchStart(x, y, 0);
    turretJoystick.handleTouchStart(x, y, 0);
    fireButton.handleTouchStart(x,y,0);
});

canvas.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    moveJoystick.handleTouchMove(x, y, 0);
    turretJoystick.handleTouchMove(x, y, 0);
    // Nút bắn không cần move
});

canvas.addEventListener('mouseup', (e) => {
    isMouseDown = false;
    moveJoystick.handleTouchEnd(0);
    turretJoystick.handleTouchEnd(0);
    fireButton.handleTouchEnd(0);
});
canvas.addEventListener('mouseleave', (e) => { // Nếu chuột ra khỏi canvas
    if (isMouseDown) {
        isMouseDown = false;
        moveJoystick.handleTouchEnd(0);
        turretJoystick.handleTouchEnd(0);
        fireButton.handleTouchEnd(0);
    }
});


function handleTouchStart(evt) {
    evt.preventDefault(); // Ngăn cuộn trang trên mobile
    const touches = evt.changedTouches;
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        // Thử kích hoạt từng joystick/button
        if (moveJoystick.handleTouchStart(x, y, touch.identifier)) continue;
        if (turretJoystick.handleTouchStart(x, y, touch.identifier)) continue;
        if (fireButton.handleTouchStart(x, y, touch.identifier)) continue;
    }
}

function handleTouchMove(evt) {
    evt.preventDefault();
    const touches = evt.changedTouches;
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        moveJoystick.handleTouchMove(x, y, touch.identifier);
        turretJoystick.handleTouchMove(x, y, touch.identifier);
        // Nút bắn không cần move
    }
}

function handleTouchEnd(evt) {
    evt.preventDefault();
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        moveJoystick.handleTouchEnd(touch.identifier);
        turretJoystick.handleTouchEnd(touch.identifier);
        fireButton.handleTouchEnd(touch.identifier);
    }
}


function handleInput() {
    // Điều khiển bằng joystick
    const moveVal = moveJoystick.getValue();
    const turretVal = turretJoystick.getValue();
    playerTank.control(moveVal, turretVal);

    if (fireButton.isPressed) { // Bắn liên tục khi giữ nút
        playerTank.shoot();
    }
    // Hoặc nếu muốn bắn 1 lần mỗi khi nhấn:
    // if (fireButton.isJustPressed()) {
    //     playerTank.shoot();
    // }


    // Điều khiển bàn phím (vẫn giữ lại)
    if (keys['w']) playerTank.move(1);
    if (keys['s']) playerTank.move(-1);
    if (keys['a']) playerTank.rotateBody(-0.5); // Giảm cường độ để không quá nhạy
    if (keys['d']) playerTank.rotateBody(0.5);
    if (keys['arrowleft']) playerTank.turretAngle -= playerTank.turretRotationSpeed; // Cách xoay tháp pháo cũ
    if (keys['arrowright']) playerTank.turretAngle += playerTank.turretRotationSpeed;
    if (keys[' ']) {
        playerTank.shoot();
        // keys[' '] = false; // Để tránh bắn liên tục
    }
}

function updateGame() {
    handleInput();
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (bullets[i].isOffScreen()) {
            bullets.splice(i, 1);
        }
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    playerTank.draw();
    bullets.forEach(bullet => bullet.draw());

    // Vẽ joysticks và nút bắn
    moveJoystick.draw();
    turretJoystick.draw();
    fireButton.draw();
}

let gameLoopRequest;
function gameLoop() {
    updateGame();
    drawGame();
    gameLoopRequest = requestAnimationFrame(gameLoop);
}