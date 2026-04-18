// script.js (3D Optimized Mobile Version)

let scene, camera, renderer, clock;
let playerTank;
let enemies = [], bullets = [];
let moveJoystick, fireButton;
let score = 0, gameActive = false, gameMode = 'survival';
let cameraYaw = 0, cameraPitch = 0.3, cameraDistance = 50;
let lookTouchId = null, lastTouchX = 0, lastTouchY = 0;
const keys = {};

const WORLD_SIZE = 600;
const TANK_SPEED = 60;
const TANK_ROTATION_SPEED = 2.5;
const BULLET_SPEED = 250;

const uiCanvas = document.getElementById('gameCanvas');
const uiCtx = uiCanvas.getContext('2d');
const menuScreen = document.getElementById('menuScreen');
const gameArea = document.getElementById('gameArea');
const gameOverScreen = document.getElementById('gameOverScreen');
const playerHealthDisplay = document.getElementById('playerHealthDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');

function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 200, 600);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;

    const old = gameArea.querySelector('canvas:not(#gameCanvas)');
    if (old) gameArea.removeChild(old);
    gameArea.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(100, 200, 100);
    sun.castShadow = true;
    scene.add(sun);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
        new THREE.MeshStandardMaterial({ color: 0x95a5a6 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(WORLD_SIZE, 60, 0x000000, 0x000000);
    grid.material.opacity = 0.1;
    grid.material.transparent = true;
    scene.add(grid);

    clock = new THREE.Clock();
}

class Tank {
    constructor(x, z, isPlayer = true, color = 0x2e7d32) {
        this.isPlayer = isPlayer;
        this.group = new THREE.Group();
        this.group.position.set(x, 0, z);

        const bodyMat = new THREE.MeshStandardMaterial({ color: color });
        const detailMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

        // Slightly bigger for better visibility
        const body = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 8), bodyMat);
        body.position.y = 1.5;
        body.castShadow = true;
        this.group.add(body);

        const trackL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 8.5), detailMat);
        trackL.position.set(-3.2, 0.75, 0);
        this.group.add(trackL);
        const trackR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 8.5), detailMat);
        trackR.position.set(3.2, 0.75, 0);
        this.group.add(trackR);

        this.turretGroup = new THREE.Group();
        this.turretGroup.position.y = 3.2;
        const head = new THREE.Mesh(new THREE.BoxGeometry(4, 1.8, 4.5), bodyMat);
        head.castShadow = true;
        this.turretGroup.add(head);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 6.5), detailMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 4.5;
        this.turretGroup.add(barrel);

        this.group.add(this.turretGroup);
        scene.add(this.group);

        this.health = 100;
        this.lastShotTime = 0;
    }

    update(dt, moveInput) {
        if (this.isPlayer) {
            if (Math.abs(moveInput.y) > 0.05) this.group.translateZ(-moveInput.y * TANK_SPEED * dt);
            if (Math.abs(moveInput.x) > 0.05) this.group.rotation.y -= moveInput.x * TANK_ROTATION_SPEED * dt;
            const camDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            const target = Math.atan2(camDir.x, camDir.z) - this.group.rotation.y;
            this.turretGroup.rotation.y = THREE.MathUtils.lerp(this.turretGroup.rotation.y, target, 0.15);
        } else {
            const dist = this.group.position.distanceTo(playerTank.group.position);
            this.group.lookAt(playerTank.group.position.x, 0, playerTank.group.position.z);
            if (dist > 45) this.group.translateZ(TANK_SPEED * 0.4 * dt);
            if (Date.now() - this.lastShotTime > 2500 && dist < 200) {
                this.shoot();
                this.lastShotTime = Date.now();
            }
        }
        const h = WORLD_SIZE / 2 - 10;
        this.group.position.x = Math.max(-h, Math.min(h, this.group.position.x));
        this.group.position.z = Math.max(-h, Math.min(h, this.group.position.z));
    }

    shoot() {
        const tip = new THREE.Vector3(0, 0, 8.5).applyMatrix4(this.turretGroup.matrixWorld);
        const quat = new THREE.Quaternion();
        this.turretGroup.getWorldQuaternion(quat);
        const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
        bullets.push(new Bullet(tip, dir, this.isPlayer));
    }

    takeDamage(dmg) {
        this.health -= dmg;
        if (this.health <= 0) {
            this.health = 0;
            scene.remove(this.group);
            if (this.isPlayer) gameActive = false;
            else { score += 10; enemies = enemies.filter(e => e !== this); }
        }
    }
}

class Bullet {
    constructor(pos, dir, isPlayer) {
        this.isPlayer = isPlayer;
        this.dir = dir.normalize();
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.7), new THREE.MeshBasicMaterial({ color: isPlayer?0xffff00:0xff3300 }));
        this.mesh.position.copy(pos);
        scene.add(this.mesh);
        this.time = Date.now();
    }
    update(dt) {
        this.mesh.position.add(this.dir.clone().multiplyScalar(BULLET_SPEED * dt));
        if (this.isPlayer) {
            enemies.forEach(e => { if (this.mesh.position.distanceTo(e.group.position) < 7) { e.takeDamage(34); this.destroy(); }});
        } else if (playerTank && this.mesh.position.distanceTo(playerTank.group.position) < 6) {
            playerTank.takeDamage(15); this.destroy();
        }
        if (Date.now() - this.time > 2500) this.destroy();
    }
    destroy() { scene.remove(this.mesh); bullets = bullets.filter(b => b !== this); }
}

class Joystick {
    constructor() {
        this.baseX = 0; this.baseY = 0; this.stickX = 0; this.stickY = 0;
        this.active = false; this.id = null;
        this.vx = 0; this.vy = 0;
    }
    draw(ctx) {
        if (!this.active) return;
        ctx.beginPath(); ctx.arc(this.baseX, this.baseY, 100, 0, Math.PI*2);
        ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.fill();
        ctx.beginPath(); ctx.arc(this.stickX, this.stickY, 50, 0, Math.PI*2);
        ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fill();
    }
    down(x, y, id) { if (x < window.innerWidth/2) { this.baseX=x; this.baseY=y; this.stickX=x; this.stickY=y; this.active=true; this.id=id; return true; } return false; }
    move(x, y, id) {
        if (this.active && this.id === id) {
            const dx = x-this.baseX, dy = y-this.baseY, d = Math.min(Math.sqrt(dx*dx+dy*dy), 100), a = Math.atan2(dy,dx);
            this.stickX = this.baseX + d*Math.cos(a); this.stickY = this.baseY + d*Math.sin(a);
            this.vx = (this.stickX-this.baseX)/100; this.vy = (this.stickY-this.baseY)/100;
        }
    }
    up(id) { if (this.id === id) { this.active=false; this.id=null; this.vx=0; this.vy=0; }}
}

class FireBtn {
    constructor() { this.r = 70; this.active = false; this.update(); }
    update() { this.x = window.innerWidth - 130; this.y = window.innerHeight - 130; }
    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.fillStyle = this.active ? "rgba(231,76,60,0.85)" : "rgba(231,76,60,0.45)"; ctx.fill();
        ctx.fillStyle = "white"; ctx.font = "bold 24px Arial"; ctx.textAlign = "center"; ctx.fillText("BẮN", this.x, this.y+8);
    }
    down(x, y) { if (Math.sqrt((x-this.x)**2+(y-this.y)**2) < this.r) { this.active=true; return true; } return false; }
}

function loop() {
    if (!gameActive) {
        if (playerTank && playerTank.health <= 0) {
            renderer.render(scene, camera);
            uiCtx.clearRect(0,0,uiCanvas.width,uiCanvas.height);
            gameOverScreen.style.display = 'block';
            document.getElementById('finalScore').textContent = score;
        }
        return requestAnimationFrame(loop);
    }
    const dt = clock.getDelta();
    if (keys['KeyW']) moveJoystick.vy = -1; else if (keys['KeyS']) moveJoystick.vy = 1; else if (!moveJoystick.active) moveJoystick.vy = 0;
    if (keys['KeyA']) moveJoystick.vx = -1; else if (keys['KeyD']) moveJoystick.vx = 1; else if (!moveJoystick.active) moveJoystick.vx = 0;
    if (keys['Space']) fireButton.active = true;

    playerTank.update(dt, moveJoystick);
    if (fireButton.active && Date.now() - playerTank.lastShotTime > 450) { playerTank.shoot(); playerTank.lastShotTime = Date.now(); }
    enemies.forEach(e => e.update(dt));
    bullets.forEach(b => b.update(dt));

    const off = new THREE.Vector3(0, 0, cameraDistance).applyEuler(new THREE.Euler(-cameraPitch, cameraYaw, 0));
    camera.position.copy(playerTank.group.position).add(off);
    camera.position.y += 15;
    camera.lookAt(playerTank.group.position.x, 5, playerTank.group.position.z);

    renderer.render(scene, camera);
    uiCtx.clearRect(0,0,uiCanvas.width,uiCanvas.height);
    moveJoystick.draw(uiCtx);
    fireButton.draw(uiCtx);
    playerHealthDisplay.textContent = "HP: " + Math.max(0, Math.ceil(playerTank.health)) + "/100";
    scoreDisplay.textContent = "Điểm: " + score;

    if (playerTank.health <= 0) gameActive = false;
    requestAnimationFrame(loop);
}

function start() {
    menuScreen.style.display = 'none'; gameArea.style.display = 'flex'; gameOverScreen.style.display = 'none';
    initThreeJS();
    moveJoystick = new Joystick(); fireButton = new FireBtn();
    uiCanvas.width = window.innerWidth; uiCanvas.height = window.innerHeight;
    playerTank = new Tank(0, 0, true, 0x2e7d32);
    enemies = []; bullets = [];
    for(let i=0; i<6; i++) {
        const x = (Math.random()-0.5)*400, z = (Math.random()-0.5)*400;
        if (Math.abs(x)>60 || Math.abs(z)>60) enemies.push(new Tank(x, z, false, 0x990000));
    }
    gameActive = true; score = 0;
    setupEvents();
    loop();
}

function setupEvents() {
    uiCanvas.addEventListener('touchstart', e => {
        e.preventDefault();
        for (let t of e.changedTouches) {
            if (fireButton.down(t.clientX, t.clientY)) continue;
            if (moveJoystick.down(t.clientX, t.clientY, t.identifier)) continue;
            if (lookTouchId === null) { lookTouchId = t.identifier; lastTouchX = t.clientX; lastTouchY = t.clientY; }
        }
    }, {passive:false});
    uiCanvas.addEventListener('touchmove', e => {
        e.preventDefault();
        for (let t of e.changedTouches) {
            moveJoystick.move(t.clientX, t.clientY, t.identifier);
            if (t.identifier === lookTouchId) {
                cameraYaw -= (t.clientX - lastTouchX) * 0.007;
                cameraPitch = Math.max(-0.2, Math.min(1.0, cameraPitch + (t.clientY - lastTouchY)*0.007));
                lastTouchX = t.clientX; lastTouchY = t.clientY;
            }
        }
    }, {passive:false});
    uiCanvas.addEventListener('touchend', e => {
        for (let t of e.changedTouches) {
            moveJoystick.up(t.identifier);
            if (t.identifier === lookTouchId) lookTouchId = null;
            fireButton.active = false;
        }
    });
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);
    uiCanvas.addEventListener('mousedown', e => {
        if (!fireButton.down(e.clientX, e.clientY)) { lookTouchId = 'm'; lastTouchX = e.clientX; lastTouchY = e.clientY; }
    });
    window.addEventListener('mousemove', e => {
        if (lookTouchId === 'm') {
            cameraYaw -= (e.clientX - lastTouchX) * 0.005;
            cameraPitch = Math.max(-0.2, Math.min(1.0, cameraPitch + (e.clientY - lastTouchY)*0.005));
            lastTouchX = e.clientX; lastTouchY = e.clientY;
        }
    });
    window.addEventListener('mouseup', () => { fireButton.active = false; lookTouchId = null; });
}

document.getElementById('survivalBtn').onclick = start;
document.getElementById('waveBtn').onclick = start;
document.getElementById('timeAttackBtn').onclick = start;
document.getElementById('bossBattleBtn').onclick = start;
document.getElementById('restartBtn').onclick = start;
document.getElementById('menuFromGameOverBtn').onclick = () => location.reload();
document.getElementById('backToMenuBtn').onclick = () => location.reload();
