import * as THREE from "three";

const canvas = document.querySelector("#game");
const healthFill = document.querySelector("#healthFill");
const healthText = document.querySelector("#healthText");
const scoreText = document.querySelector("#scoreText");
const waveText = document.querySelector("#waveText");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");
const chooseModeButton = document.querySelector("#chooseModeButton");
const statusPanel = document.querySelector("#statusPanel");
const statusTitle = document.querySelector("#statusTitle");
const statusLine = document.querySelector("#statusLine");
const joystickBase = document.querySelector("#joystick");
const joystickStick = document.querySelector("#joystickStick");
const fireButton = document.querySelector("#fireButton");
const modePanel = document.querySelector("#modePanel");
const modeButtons = Array.from(document.querySelectorAll(".mode-card"));
const modeNameText = document.querySelector("#modeNameText");
const modeHelpText = document.querySelector("#modeHelpText");

const isCoarsePointer = matchMedia("(pointer: coarse)").matches;
const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 260);
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isCoarsePointer,
  powerPreference: "high-performance",
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarsePointer ? 1.35 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.fog = new THREE.Fog(0xdde8ef, 84, 202);

const ARENA_RADIUS = 82;
const PLAYER_RADIUS = 1.9;
const GAME_MODES = {
  liberation: {
    label: "HÚC CỔNG DINH ĐỘC LẬP",
    help: "THẦN TỐC 30/4",
    health: 130,
    playerSpeed: 23,
    waveBase: 8,
    waveScale: 2.1,
    mobileCap: 16,
    desktopCap: 24,
    ufoHpBase: 1,
    ufoHpEvery: 4,
    ufoSpeed: 1.1,
    enemyDelay: 0.85,
    enemyDamage: 10,
    projectileSpeed: 68,
    fireCooldown: 0.11,
    autoAimAngle: 0.052,
    mobileAutoAimAngle: 0.075,
    scoreMultiplier: 1.5,
  },
  training: {
    label: "TẬP LUYỆN",
    help: "AUTO-FIRE RỘNG",
    health: 125,
    playerSpeed: 18.8,
    waveBase: 3,
    waveScale: 1.05,
    mobileCap: 8,
    desktopCap: 11,
    ufoHpBase: 1,
    ufoHpEvery: 5,
    ufoSpeed: 0.72,
    enemyDelay: 1.38,
    enemyDamage: 8,
    projectileSpeed: 60,
    fireCooldown: 0.18,
    autoAimAngle: 0.048,
    mobileAutoAimAngle: 0.07,
    scoreMultiplier: 0.8,
  },
  survival: {
    label: "SINH TỒN",
    help: "AUTO-FIRE",
    health: 100,
    playerSpeed: 18,
    waveBase: 5,
    waveScale: 1.55,
    mobileCap: 13,
    desktopCap: 18,
    ufoHpBase: 2,
    ufoHpEvery: 3,
    ufoSpeed: 1,
    enemyDelay: 1,
    enemyDamage: 12,
    projectileSpeed: 58,
    fireCooldown: 0.16,
    autoAimAngle: 0.04,
    mobileAutoAimAngle: 0.062,
    scoreMultiplier: 1,
  },
  assault: {
    label: "ĐỘT KÍCH",
    help: "AUTO-FIRE HẸP",
    health: 90,
    playerSpeed: 19.5,
    waveBase: 7,
    waveScale: 1.95,
    mobileCap: 15,
    desktopCap: 22,
    ufoHpBase: 2,
    ufoHpEvery: 2,
    ufoSpeed: 1.28,
    enemyDelay: 0.78,
    enemyDamage: 16,
    projectileSpeed: 62,
    fireCooldown: 0.135,
    autoAimAngle: 0.034,
    mobileAutoAimAngle: 0.054,
    scoreMultiplier: 1.35,
  },
  nightmare: {
    label: "ÁC MỘNG",
    help: "KHÔNG THA THỨ",
    health: 70,
    playerSpeed: 20,
    waveBase: 10,
    waveScale: 2.6,
    mobileCap: 18,
    desktopCap: 28,
    ufoHpBase: 3,
    ufoHpEvery: 2,
    ufoSpeed: 1.55,
    enemyDelay: 0.58,
    enemyDamage: 22,
    projectileSpeed: 65,
    fireCooldown: 0.12,
    autoAimAngle: 0.028,
    mobileAutoAimAngle: 0.046,
    scoreMultiplier: 2.0,
  },
};
const tmpVec3 = new THREE.Vector3();
const tmpVec3B = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const upAxis = new THREE.Vector3(0, 1, 0);

const keys = new Map();
const joystick = {
  pointerId: null,
  centerX: 0,
  centerY: 0,
  radius: 58,
  vector: new THREE.Vector2(),
};

const input = {
  viewYaw: 0,
  viewPitch: 0.24,
  lookPointerId: null,
  lastX: 0,
  lastY: 0,
  pointerStartX: 0,
  pointerStartY: 0,
  pointerMoved: false,
  fireHeld: false,
};

const state = {
  score: 0,
  wave: 1,
  health: GAME_MODES.survival.health,
  paused: true,
  gameOver: false,
  awaitingMode: true,
  modeId: "survival",
  autoTarget: null,
  waveDelay: 0,
  cooldown: 0,
  elapsed: 0,
};

const player = {
  group: null,
  turret: null,
  barrelPivot: null,
  muzzle: null,
  velocity: new THREE.Vector3(),
  speed: 18,
};

const playerProjectiles = [];
const enemyProjectiles = [];
const ufos = [];
const particles = [];
const decorativeSpinners = [];

const materials = createMaterials();

/* --- Auto-select mode from URL param (menu page redirect) --- */
(function applyUrlMode() {
  const params = new URLSearchParams(window.location.search);
  const urlMode = params.get("mode");
  if (urlMode && GAME_MODES[urlMode]) {
    state.modeId = urlMode;
  }
})();

buildWorld();
player.group = createTank();
scene.add(player.group);
syncModeUi();
syncHud();
bindInput();
resize();
requestAnimationFrame(tick);

function buildWorld() {
  scene.add(makeSkyDome());

  const hemi = new THREE.HemisphereLight(0xeff6ff, 0xc99b63, 1.8);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff7d1, 3.4);
  sun.position.set(-32, 58, 26);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isCoarsePointer ? 1024 : 1536, isCoarsePointer ? 1024 : 1536);
  sun.shadow.camera.left = -82;
  sun.shadow.camera.right = 82;
  sun.shadow.camera.top = 82;
  sun.shadow.camera.bottom = -82;
  sun.shadow.camera.near = 8;
  sun.shadow.camera.far = 140;
  sun.shadow.bias = -0.00018;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x93c5fd, 0.95);
  fill.position.set(38, 28, -46);
  scene.add(fill);

  const terrain = createTerrain();
  scene.add(terrain);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(ARENA_RADIUS - 2, ARENA_RADIUS - 1.25, 96),
    new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.065;
  scene.add(ring);

  addLowPolyOutpost();
  addRockField();
}

function createMaterials() {
  const groundTexture = makeGroundTexture();
  groundTexture.repeat.set(18, 18);

  const hullTexture = makeHullTexture();
  hullTexture.repeat.set(1.4, 1.4);

  const metalTexture = makeMetalTexture();
  metalTexture.repeat.set(1.8, 1.8);

  const treadTexture = makeTreadTexture();
  treadTexture.repeat.set(2.6, 1.2);

  return {
    ground: new THREE.MeshStandardMaterial({
      color: 0xe1b46c,
      map: groundTexture,
      roughness: 0.96,
      metalness: 0.02,
      flatShading: true,
    }),
    hull: new THREE.MeshStandardMaterial({
      color: 0x57764a,
      map: hullTexture,
      roughness: 0.72,
      metalness: 0.18,
      flatShading: true,
    }),
    darkHull: new THREE.MeshStandardMaterial({
      color: 0x2f3d35,
      roughness: 0.86,
      metalness: 0.12,
      flatShading: true,
    }),
    treads: new THREE.MeshStandardMaterial({
      color: 0x1f2933,
      map: treadTexture,
      roughness: 0.88,
      metalness: 0.28,
      flatShading: true,
    }),
    wheel: new THREE.MeshStandardMaterial({
      color: 0x32433a,
      roughness: 0.62,
      metalness: 0.32,
      flatShading: true,
    }),
    barrel: new THREE.MeshStandardMaterial({
      color: 0x263238,
      roughness: 0.48,
      metalness: 0.55,
      flatShading: true,
    }),
    ufo: new THREE.MeshStandardMaterial({
      color: 0xaeb7bd,
      map: metalTexture,
      roughness: 0.36,
      metalness: 0.84,
      flatShading: true,
    }),
    ufoDark: new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.42,
      metalness: 0.75,
      flatShading: true,
    }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x8be9ff,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.42,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.76,
      flatShading: true,
    }),
    cyanGlow: new THREE.MeshBasicMaterial({ color: 0x67e8f9 }),
    redGlow: new THREE.MeshBasicMaterial({ color: 0xff5c7a }),
    yellowGlow: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
    rock: new THREE.MeshStandardMaterial({
      color: 0x9a7655,
      roughness: 0.94,
      metalness: 0.02,
      flatShading: true,
    }),
    concrete: new THREE.MeshStandardMaterial({
      color: 0x8d99a6,
      roughness: 0.88,
      metalness: 0.02,
      flatShading: true,
    }),
    antenna: new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.52,
      metalness: 0.64,
      flatShading: true,
    }),
  };
}

function makeCanvasTexture(size, draw) {
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = size;
  canvasTexture.height = size;
  const ctx = canvasTexture.getContext("2d");
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), isCoarsePointer ? 4 : 8);
  return texture;
}

function makeGroundTexture() {
  return makeCanvasTexture(512, (ctx, size) => {
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "#d6a965");
    gradient.addColorStop(0.45, "#e8c47f");
    gradient.addColorStop(1, "#b9844c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 2200; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 1.8 + 0.35;
      ctx.globalAlpha = Math.random() * 0.22 + 0.08;
      ctx.fillStyle = Math.random() > 0.5 ? "#7c5c36" : "#f7dba1";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#7f5933";
    ctx.lineWidth = 2;
    for (let i = 0; i < 28; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let p = 0; p < 5; p += 1) {
        ctx.lineTo(x + Math.random() * 72 - 36, y + p * 15 + Math.random() * 20);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

function makeHullTexture() {
  return makeCanvasTexture(384, (ctx, size) => {
    ctx.fillStyle = "#526d43";
    ctx.fillRect(0, 0, size, size);
    const patches = ["#354b34", "#718952", "#465f3a", "#8b935f"];
    for (let i = 0; i < 34; i += 1) {
      ctx.fillStyle = patches[i % patches.length];
      ctx.globalAlpha = 0.62;
      ctx.beginPath();
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const sides = 4 + Math.floor(Math.random() * 4);
      const radius = 22 + Math.random() * 58;
      for (let s = 0; s <= sides; s += 1) {
        const angle = (s / sides) * Math.PI * 2 + Math.random() * 0.24;
        const px = cx + Math.cos(angle) * radius * (0.45 + Math.random() * 0.65);
        const py = cy + Math.sin(angle) * radius * (0.45 + Math.random() * 0.65);
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.random() * 26 - 13, y + Math.random() * 10 - 5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

function makeMetalTexture() {
  return makeCanvasTexture(384, (ctx, size) => {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 1.15);
    gradient.addColorStop(0, "#f8fafc");
    gradient.addColorStop(0.34, "#aab4bd");
    gradient.addColorStop(0.68, "#6b7783");
    gradient.addColorStop(1, "#dce4eb");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.globalAlpha = 0.24;
    for (let i = 0; i < 46; i += 1) {
      ctx.strokeStyle = i % 2 ? "#f8fafc" : "#334155";
      ctx.lineWidth = 1 + Math.random() * 1.2;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 12 + i * 4.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#1e293b";
    for (let i = 0; i < 95; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  });
}

function makeTreadTexture() {
  return makeCanvasTexture(256, (ctx, size) => {
    ctx.fillStyle = "#172026";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#2f3a40";
    for (let x = -20; x < size + 20; x += 28) {
      ctx.save();
      ctx.translate(x, size / 2);
      ctx.rotate(-0.36);
      ctx.fillRect(-6, -size, 12, size * 2);
      ctx.restore();
    }
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#94a3b8";
    for (let i = 0; i < 180; i += 1) {
      ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
  });
}

function makeSkyTexture() {
  return makeCanvasTexture(1024, (ctx, size) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, "#375c9d");
    gradient.addColorStop(0.36, "#77b6e8");
    gradient.addColorStop(0.72, "#f5d39b");
    gradient.addColorStop(1, "#e9b56f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 120; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size * 0.45;
      const r = Math.random() * 1.4 + 0.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function makeSkyDome() {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(210, isCoarsePointer ? 24 : 32, 16),
    new THREE.MeshBasicMaterial({
      map: makeSkyTexture(),
      side: THREE.BackSide,
      fog: false,
    }),
  );
  sky.rotation.y = Math.PI * 0.15;
  return sky;
}

function terrainHeightAt(x, z) {
  const slow = Math.sin(x * 0.055 + z * 0.018) * 0.46 + Math.cos(z * 0.05 - x * 0.022) * 0.38;
  const detail = Math.sin((x + z) * 0.17) * 0.12 + Math.cos((x - z) * 0.11) * 0.1;
  const flatCenter = THREE.MathUtils.clamp(Math.hypot(x, z) / 24, 0, 1);
  return (slow + detail) * (0.38 + flatCenter * 0.62) - 0.12;
}

function createTerrain() {
  const geometry = new THREE.PlaneGeometry(220, 220, isCoarsePointer ? 52 : 72, isCoarsePointer ? 52 : 72);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    position.setY(i, terrainHeightAt(x, z));
  }
  geometry.computeVertexNormals();

  const ground = new THREE.Mesh(geometry, materials.ground);
  ground.receiveShadow = true;
  return ground;
}

function addLowPolyOutpost() {
  const padGeometry = new THREE.CylinderGeometry(5.2, 5.2, 0.22, 12);
  const dishGeometry = new THREE.SphereGeometry(1.65, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const mastGeometry = new THREE.CylinderGeometry(0.14, 0.18, 7.2, 6);
  const legGeometry = new THREE.CylinderGeometry(0.08, 0.11, 5.2, 5);

  const pads = [
    new THREE.Vector3(-22, 0, -18),
    new THREE.Vector3(24, 0, -14),
    new THREE.Vector3(18, 0, 24),
  ];

  for (const base of pads) {
    base.y = terrainHeightAt(base.x, base.z) + 0.09;
    const pad = new THREE.Mesh(padGeometry, materials.concrete);
    pad.position.copy(base);
    pad.receiveShadow = true;
    pad.castShadow = true;
    scene.add(pad);

    const mast = new THREE.Mesh(mastGeometry, materials.antenna);
    mast.position.set(base.x, base.y + 3.7, base.z);
    mast.castShadow = true;
    scene.add(mast);

    const dish = new THREE.Mesh(dishGeometry, materials.antenna);
    dish.position.set(base.x, base.y + 7.25, base.z);
    dish.rotation.set(Math.PI * 0.68, 0, Math.random() * Math.PI * 2);
    dish.scale.set(1.25, 0.6, 1.25);
    dish.castShadow = true;
    scene.add(dish);
    decorativeSpinners.push({ object: dish, speed: 0.16 + Math.random() * 0.1 });

    for (let i = 0; i < 3; i += 1) {
      const leg = new THREE.Mesh(legGeometry, materials.antenna);
      const angle = (i / 3) * Math.PI * 2;
      leg.position.set(base.x + Math.cos(angle) * 1.05, base.y + 2.45, base.z + Math.sin(angle) * 1.05);
      leg.rotation.z = Math.cos(angle) * 0.18;
      leg.rotation.x = -Math.sin(angle) * 0.18;
      leg.castShadow = true;
      scene.add(leg);
    }
  }
}

function addRockField() {
  const geometry = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < (isCoarsePointer ? 48 : 76); i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 28 + Math.random() * 68;
    const x = Math.cos(angle) * radius + Math.random() * 5 - 2.5;
    const z = Math.sin(angle) * radius + Math.random() * 5 - 2.5;
    if (Math.hypot(x, z) > 105) continue;

    const rock = new THREE.Mesh(geometry, materials.rock);
    rock.position.set(x, terrainHeightAt(x, z) + 0.45, z);
    const scale = 0.55 + Math.random() * 1.9;
    rock.scale.set(scale * (0.8 + Math.random() * 0.6), scale * (0.45 + Math.random() * 0.7), scale);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }
}

function createTank() {
  const tank = new THREE.Group();
  tank.position.set(0, terrainHeightAt(0, 0), 0);

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.45, 0.92, 4.35, 2, 1, 2), materials.hull);
  chassis.position.y = 0.92;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  tank.add(chassis);

  const glacis = new THREE.Mesh(new THREE.BoxGeometry(3.08, 0.46, 2.28, 1, 1, 1), materials.hull);
  glacis.position.set(0, 1.42, 0.42);
  glacis.rotation.x = -0.12;
  glacis.castShadow = true;
  tank.add(glacis);

  const rear = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.42, 1.2, 1, 1, 1), materials.darkHull);
  rear.position.set(0, 1.28, -1.48);
  rear.castShadow = true;
  tank.add(rear);

  const leftTrack = createTrack(-2.02);
  const rightTrack = createTrack(2.02);
  tank.add(leftTrack, rightTrack);

  const turret = new THREE.Group();
  turret.position.y = 1.92;
  tank.add(turret);
  player.turret = turret;

  const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.45, 0.72, 8), materials.hull);
  turretBase.castShadow = true;
  turretBase.receiveShadow = true;
  turret.add(turretBase);

  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.18, 8), materials.darkHull);
  hatch.position.set(-0.18, 0.48, -0.18);
  hatch.castShadow = true;
  turret.add(hatch);

  const barrelPivot = new THREE.Group();
  barrelPivot.position.set(0, 0.12, 1.04);
  turret.add(barrelPivot);
  player.barrelPivot = barrelPivot;

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 2.95, 8), materials.barrel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 1.38;
  barrel.castShadow = true;
  barrelPivot.add(barrel);

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0, 2.98);
  barrelPivot.add(muzzle);
  player.muzzle = muzzle;

  const muzzleCap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.32, 8), materials.barrel);
  muzzleCap.rotation.x = Math.PI / 2;
  muzzleCap.position.z = 2.95;
  muzzleCap.castShadow = true;
  barrelPivot.add(muzzleCap);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 1.8, 5), materials.antenna);
  antenna.position.set(0.72, 0.95, -0.55);
  antenna.rotation.x = 0.2;
  antenna.castShadow = true;
  turret.add(antenna);

  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), materials.cyanGlow);
  glow.position.set(0.82, 1.86, -0.2);
  tank.add(glow);

  return tank;
}

function createTrack(x) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.72, 4.76, 1, 1, 2), materials.treads);
  body.position.set(x, 0.48, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const wheelGeometry = new THREE.CylinderGeometry(0.34, 0.34, 0.18, 10);
  for (let i = 0; i < 5; i += 1) {
    const wheel = new THREE.Mesh(wheelGeometry, materials.wheel);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.5, -1.78 + i * 0.89);
    wheel.castShadow = true;
    group.add(wheel);
  }

  return group;
}

function currentMode() {
  return GAME_MODES[state.modeId] || GAME_MODES.survival;
}

function syncModeUi() {
  const mode = currentMode();
  modeNameText.textContent = mode.label;
  modeHelpText.textContent = mode.help;
  for (const button of modeButtons) {
    button.classList.toggle("active", button.dataset.mode === state.modeId);
  }
}

function spawnWave() {
  const mode = currentMode();
  const cap = isCoarsePointer ? mode.mobileCap : mode.desktopCap;
  const amount = Math.min(Math.round(mode.waveBase + state.wave * mode.waveScale), cap);
  for (let i = 0; i < amount; i += 1) {
    spawnUfo(i, amount);
  }
  state.waveDelay = 0;
}

function spawnUfo(index, amount) {
  const mode = currentMode();
  const group = createUfoMesh();
  const angle = (index / amount) * Math.PI * 2 + Math.random() * 0.35;
  const orbitRadius = 19 + Math.random() * 26;
  const centerRadius = Math.random() * 28;
  const centerAngle = Math.random() * Math.PI * 2;
  const altitude = 16 + Math.random() * 14 + state.wave * 0.5;
  const center = new THREE.Vector3(Math.cos(centerAngle) * centerRadius, 0, Math.sin(centerAngle) * centerRadius);

  group.position.set(center.x + Math.cos(angle) * orbitRadius, altitude, center.z + Math.sin(angle) * orbitRadius);
  scene.add(group);

  ufos.push({
    group,
    center,
    angle,
    orbitRadius,
    altitude,
    radius: 2.25,
    hp: mode.ufoHpBase + Math.floor(state.wave / mode.ufoHpEvery),
    speed: (Math.random() > 0.5 ? 1 : -1) * (0.24 + Math.random() * 0.2 + state.wave * 0.012) * mode.ufoSpeed,
    wobble: Math.random() * Math.PI * 2,
    shootTimer: (1.1 + Math.random() * 2.4) * mode.enemyDelay,
    beam: group.userData.beam,
    hitFlash: 0,
  });
}

function createUfoMesh() {
  const group = new THREE.Group();

  const lower = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 2.6, 0.54, 16), materials.ufo);
  lower.castShadow = true;
  lower.receiveShadow = true;
  group.add(lower);

  const upper = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 1.25, 0.56, 16), materials.ufo);
  upper.position.y = 0.34;
  upper.castShadow = true;
  group.add(upper);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.32, 0.17, 6, 16), materials.ufoDark);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.02;
  rim.castShadow = true;
  group.add(rim);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.98, 12, 8), materials.glass);
  dome.scale.set(1, 0.42, 1);
  dome.position.y = 0.78;
  dome.castShadow = true;
  group.add(dome);

  for (let i = 0; i < 8; i += 1) {
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), i % 2 ? materials.cyanGlow : materials.yellowGlow);
    const angle = (i / 8) * Math.PI * 2;
    light.position.set(Math.cos(angle) * 2.34, -0.13, Math.sin(angle) * 2.34);
    group.add(light);
  }

  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 5.6, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  beam.position.y = -2.96;
  beam.rotation.x = Math.PI;
  beam.visible = false;
  group.add(beam);
  group.userData.beam = beam;

  return group;
}

function bindInput() {
  window.addEventListener("keydown", (event) => {
    keys.set(event.code, true);
    if (state.awaitingMode && event.code === "Enter") {
      selectMode(state.modeId);
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      input.fireHeld = true;
      tryFire();
    }
    if (event.code === "KeyP" || event.code === "Escape") {
      togglePause();
    }
    if (event.code === "KeyR" && state.gameOver) {
      restartGame();
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.set(event.code, false);
    if (event.code === "Space") input.fireHeld = false;
  });

  joystickBase.addEventListener("pointerdown", onJoystickDown);
  joystickBase.addEventListener("pointermove", onJoystickMove);
  joystickBase.addEventListener("pointerup", onJoystickUp);
  joystickBase.addEventListener("pointercancel", onJoystickUp);

  fireButton.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    input.fireHeld = true;
    tryFire();
    fireButton.setPointerCapture(event.pointerId);
  });
  fireButton.addEventListener("pointerup", () => {
    input.fireHeld = false;
  });
  fireButton.addEventListener("pointercancel", () => {
    input.fireHeld = false;
  });

  canvas.addEventListener("pointerdown", onLookDown);
  canvas.addEventListener("pointermove", onLookMove);
  canvas.addEventListener("pointerup", onLookUp);
  canvas.addEventListener("pointercancel", onLookUp);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    input.viewPitch = THREE.MathUtils.clamp(input.viewPitch - event.deltaY * 0.0009, -0.18, 0.92);
  }, { passive: false });

  pauseButton.addEventListener("click", togglePause);
  restartButton.addEventListener("click", restartGame);
  chooseModeButton.addEventListener("click", showModePanel);
  for (const button of modeButtons) {
    button.addEventListener("click", () => {
      selectMode(button.dataset.mode);
    });
  }
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !state.gameOver && !state.awaitingMode) setPaused(true);
  });
}

function onJoystickDown(event) {
  event.preventDefault();
  event.stopPropagation();
  joystick.pointerId = event.pointerId;
  joystickBase.setPointerCapture(event.pointerId);
  const rect = joystickBase.getBoundingClientRect();
  joystick.centerX = rect.left + rect.width / 2;
  joystick.centerY = rect.top + rect.height / 2;
  joystick.radius = rect.width * 0.43;
  updateJoystick(event.clientX, event.clientY);
}

function onJoystickMove(event) {
  if (event.pointerId !== joystick.pointerId) return;
  event.preventDefault();
  updateJoystick(event.clientX, event.clientY);
}

function onJoystickUp(event) {
  if (event.pointerId !== joystick.pointerId) return;
  joystick.pointerId = null;
  joystick.vector.set(0, 0);
  joystickStick.style.transform = "translate(-50%, -50%)";
}

function updateJoystick(clientX, clientY) {
  const dx = clientX - joystick.centerX;
  const dy = clientY - joystick.centerY;
  const length = Math.hypot(dx, dy);
  const limited = Math.min(length, joystick.radius);
  const angle = Math.atan2(dy, dx);
  const px = Math.cos(angle) * limited;
  const py = Math.sin(angle) * limited;
  joystick.vector.set(px / joystick.radius, -py / joystick.radius);
  joystickStick.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
}

function onLookDown(event) {
  if (event.target !== canvas) return;
  if (input.lookPointerId !== null) return;
  event.preventDefault();
  input.lookPointerId = event.pointerId;
  input.lastX = event.clientX;
  input.lastY = event.clientY;
  input.pointerStartX = event.clientX;
  input.pointerStartY = event.clientY;
  input.pointerMoved = false;
  canvas.setPointerCapture(event.pointerId);
}

function onLookMove(event) {
  if (event.pointerId !== input.lookPointerId) return;
  event.preventDefault();
  const dx = event.clientX - input.lastX;
  const dy = event.clientY - input.lastY;
  input.lastX = event.clientX;
  input.lastY = event.clientY;
  if (Math.hypot(event.clientX - input.pointerStartX, event.clientY - input.pointerStartY) > 5) {
    input.pointerMoved = true;
  }
  const sensitivity = isCoarsePointer ? 0.006 : 0.0042;
  input.viewYaw += dx * sensitivity;
  input.viewPitch = THREE.MathUtils.clamp(input.viewPitch - dy * sensitivity, -0.2, 0.96);
}

function onLookUp(event) {
  if (event.pointerId !== input.lookPointerId) return;
  if (!input.pointerMoved && !isCoarsePointer) {
    tryFire();
  }
  input.lookPointerId = null;
}

function tick() {
  requestAnimationFrame(tick);
  const rawDelta = clock.getDelta();
  const dt = Math.min(rawDelta, 0.033);

  if (!state.paused && !state.gameOver && !state.awaitingMode) {
    updateGame(dt);
  }

  updateCamera();
  renderer.render(scene, camera);
}

function updateGame(dt) {
  state.elapsed += dt;
  state.cooldown = Math.max(0, state.cooldown - dt);

  updateTank(dt);
  updateUfos(dt);
  updateAutoFire();
  if (input.fireHeld) tryFire();
  updateProjectiles(dt);
  updateParticles(dt);
  updateDecor(dt);

  if (ufos.length === 0) {
    state.waveDelay += dt;
    if (state.waveDelay > 1.45) {
      state.wave += 1;
      spawnWave();
      syncHud();
    }
  }
}

function updateTank(dt) {
  const move = getMoveInput();
  const forward = getHorizontalForward(input.viewYaw);
  const right = new THREE.Vector3(forward.z, 0, -forward.x);
  const desired = tmpVec3.set(0, 0, 0)
    .addScaledVector(forward, move.y)
    .addScaledVector(right, move.x);

  if (desired.lengthSq() > 1) desired.normalize();

  const targetSpeed = desired.lengthSq() > 0.001 ? player.speed : 0;
  if (targetSpeed > 0) {
    desired.normalize().multiplyScalar(targetSpeed);
    player.velocity.lerp(desired, 1 - Math.exp(-dt * 9.5));
    const targetYaw = Math.atan2(player.velocity.x, player.velocity.z);
    player.group.rotation.y = dampAngle(player.group.rotation.y, targetYaw, 12, dt);
  } else {
    player.velocity.multiplyScalar(Math.exp(-dt * 7.4));
  }

  player.group.position.addScaledVector(player.velocity, dt);
  const radius = Math.hypot(player.group.position.x, player.group.position.z);
  if (radius > ARENA_RADIUS - 4) {
    player.group.position.x *= (ARENA_RADIUS - 4) / radius;
    player.group.position.z *= (ARENA_RADIUS - 4) / radius;
    player.velocity.multiplyScalar(0.18);
  }
  player.group.position.y = terrainHeightAt(player.group.position.x, player.group.position.z);

  if (player.turret) {
    player.turret.rotation.y = dampAngle(player.turret.rotation.y, normalizeAngle(input.viewYaw - player.group.rotation.y), 18, dt);
  }
  if (player.barrelPivot) {
    player.barrelPivot.rotation.x = THREE.MathUtils.lerp(
      player.barrelPivot.rotation.x,
      -THREE.MathUtils.clamp(input.viewPitch, -0.14, 0.72),
      1 - Math.exp(-dt * 14),
    );
  }
}

function getMoveInput() {
  const move = new THREE.Vector2();
  if (keys.get("KeyW") || keys.get("ArrowUp")) move.y += 1;
  if (keys.get("KeyS") || keys.get("ArrowDown")) move.y -= 1;
  if (keys.get("KeyA") || keys.get("ArrowLeft")) move.x -= 1;
  if (keys.get("KeyD") || keys.get("ArrowRight")) move.x += 1;
  move.add(joystick.vector);
  if (move.lengthSq() > 1) move.normalize();
  return move;
}

function updateAutoFire() {
  state.autoTarget = findAutoFireTarget();
  document.body.classList.toggle("target-lock", Boolean(state.autoTarget));
  if (state.autoTarget) {
    tryFire({ target: state.autoTarget, auto: true });
  }
}

function findAutoFireTarget() {
  if (ufos.length === 0) return null;
  const mode = currentMode();
  const origin = player.muzzle.getWorldPosition(new THREE.Vector3());
  const aimDirection = getAimDirection();
  const baseAngle = isCoarsePointer ? mode.mobileAutoAimAngle : mode.autoAimAngle;
  let best = null;
  let bestScore = Infinity;

  for (const ufo of ufos) {
    const toTarget = ufo.group.position.clone().sub(origin);
    const distance = toTarget.length();
    if (distance < 5 || distance > 96) continue;
    const forwardDistance = toTarget.dot(aimDirection);
    if (forwardDistance <= 0) continue;

    const targetDirection = toTarget.multiplyScalar(1 / distance);
    const angle = aimDirection.angleTo(targetDirection);
    const angularRadius = Math.atan((ufo.radius * 1.08) / distance);
    if (angle <= baseAngle + angularRadius) {
      const score = angle * 100 + distance * 0.01;
      if (score < bestScore) {
        best = ufo;
        bestScore = score;
      }
    }
  }

  return best;
}

function updateUfos(dt) {
  const mode = currentMode();
  for (let i = ufos.length - 1; i >= 0; i -= 1) {
    const ufo = ufos[i];
    ufo.angle += ufo.speed * dt;
    ufo.wobble += dt * 2.4;

    const evasive = Math.sin(state.elapsed * 0.47 + i) * 7;
    ufo.group.position.x = ufo.center.x + Math.cos(ufo.angle) * (ufo.orbitRadius + evasive);
    ufo.group.position.z = ufo.center.z + Math.sin(ufo.angle * 0.92) * ufo.orbitRadius;
    ufo.group.position.y = ufo.altitude + Math.sin(ufo.wobble) * 1.6;
    keepUfoAwayFromCameraPath(ufo);
    ufo.group.rotation.y += dt * 1.9;
    ufo.group.rotation.z = Math.sin(ufo.wobble * 0.8) * 0.08;

    if (ufo.hitFlash > 0) {
      ufo.hitFlash -= dt;
      ufo.group.scale.setScalar(1 + Math.sin(ufo.hitFlash * 80) * 0.035);
    } else {
      ufo.group.scale.setScalar(1);
    }

    ufo.shootTimer -= dt;
    if (ufo.beam) {
      ufo.beam.visible = ufo.shootTimer < 0.38;
      ufo.beam.material.opacity = ufo.beam.visible ? THREE.MathUtils.clamp((0.38 - ufo.shootTimer) / 0.38, 0, 1) * 0.24 : 0;
    }

    if (ufo.shootTimer <= 0) {
      spawnEnemyBolt(ufo.group.position);
      ufo.shootTimer = (Math.max(0.75, 2.8 - state.wave * 0.1) + Math.random() * 1.9) * mode.enemyDelay;
    }
  }
}

function keepUfoAwayFromCameraPath(ufo) {
  const minDistance = isCoarsePointer ? 18 : 15;
  const dx = ufo.group.position.x - player.group.position.x;
  const dz = ufo.group.position.z - player.group.position.z;
  const distance = Math.hypot(dx, dz);
  if (distance >= minDistance || distance < 0.001) return;
  const scale = minDistance / distance;
  ufo.group.position.x = player.group.position.x + dx * scale;
  ufo.group.position.z = player.group.position.z + dz * scale;
}

function updateProjectiles(dt) {
  for (let i = playerProjectiles.length - 1; i >= 0; i -= 1) {
    const shot = playerProjectiles[i];
    shot.position.addScaledVector(shot.userData.velocity, dt);
    shot.userData.trail.position.copy(shot.position).addScaledVector(shot.userData.velocity, -0.012);
    shot.userData.trail.quaternion.copy(tmpQuat.setFromUnitVectors(upAxis, shot.userData.velocity.clone().normalize()));
    shot.userData.ttl -= dt;

    let consumed = shot.userData.ttl <= 0;
    for (let j = ufos.length - 1; j >= 0 && !consumed; j -= 1) {
      const ufo = ufos[j];
      if (shot.position.distanceToSquared(ufo.group.position) < (ufo.radius + 0.34) ** 2) {
        damageUfo(ufo, j, shot.position);
        consumed = true;
      }
    }

    if (consumed) {
      scene.remove(shot.userData.trail);
      scene.remove(shot);
      playerProjectiles.splice(i, 1);
    }
  }

  for (let i = enemyProjectiles.length - 1; i >= 0; i -= 1) {
    const bolt = enemyProjectiles[i];
    bolt.position.addScaledVector(bolt.userData.velocity, dt);
    bolt.userData.ttl -= dt;

    const tankCenter = tmpVec3.set(player.group.position.x, player.group.position.y + 1.15, player.group.position.z);
    let consumed = bolt.userData.ttl <= 0 || bolt.position.y <= terrainHeightAt(bolt.position.x, bolt.position.z) + 0.1;
    if (!consumed && bolt.position.distanceToSquared(tankCenter) < (PLAYER_RADIUS + 0.45) ** 2) {
      applyDamage(currentMode().enemyDamage);
      spawnExplosion(bolt.position, [0xff5c7a, 0xf97316, 0xfacc15], 12, 0.75);
      consumed = true;
    }

    if (consumed) {
      if (bolt.position.y <= 1.4) spawnExplosion(bolt.position, [0xff5c7a, 0xf97316], 8, 0.46);
      scene.remove(bolt);
      enemyProjectiles.splice(i, 1);
    }
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.ttl -= dt;
    p.velocity.y -= 10.5 * dt;
    p.mesh.position.addScaledVector(p.velocity, dt);
    p.mesh.rotation.x += p.spin.x * dt;
    p.mesh.rotation.y += p.spin.y * dt;
    p.mesh.rotation.z += p.spin.z * dt;
    p.mesh.scale.setScalar(Math.max(0.01, p.ttl / p.maxTtl) * p.baseScale);
    if (p.ttl <= 0) {
      scene.remove(p.mesh);
      particles.splice(i, 1);
    }
  }
}

function updateDecor(dt) {
  for (const spinner of decorativeSpinners) {
    spinner.object.rotation.z += spinner.speed * dt;
  }
}

function tryFire(options = {}) {
  if (state.paused || state.gameOver || state.cooldown > 0) return;
  const mode = currentMode();
  state.cooldown = mode.fireCooldown;

  const origin = player.muzzle.getWorldPosition(tmpVec3).clone();
  const direction = options.target
    ? options.target.group.position.clone().sub(origin).normalize()
    : getAimDirection();
  origin.addScaledVector(direction, 0.16);

  const shot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), materials.cyanGlow);
  shot.position.copy(origin);
  shot.userData.velocity = direction.clone().multiplyScalar(mode.projectileSpeed);
  shot.userData.ttl = 1.85;

  const trail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.18, 1.55, 8, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    }),
  );
  trail.position.copy(origin);
  trail.quaternion.setFromUnitVectors(upAxis, direction);
  shot.userData.trail = trail;

  scene.add(trail, shot);
  playerProjectiles.push(shot);
  spawnMuzzleFlash(origin, direction);
}

function spawnEnemyBolt(start) {
  const mode = currentMode();
  const target = tmpVec3.set(player.group.position.x, player.group.position.y + 0.95, player.group.position.z);
  const direction = target.sub(start).normalize();
  direction.x += (Math.random() - 0.5) * 0.05;
  direction.z += (Math.random() - 0.5) * 0.05;
  direction.normalize();

  const bolt = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), materials.redGlow);
  bolt.position.copy(start).addScaledVector(direction, 1.8);
  bolt.userData.velocity = direction.clone().multiplyScalar((24 + Math.min(state.wave, 10) * 0.7) / Math.sqrt(mode.enemyDelay));
  bolt.userData.ttl = 3.8;
  scene.add(bolt);
  enemyProjectiles.push(bolt);
}

function damageUfo(ufo, index, impactPoint) {
  ufo.hp -= 1;
  ufo.hitFlash = 0.18;
  spawnExplosion(impactPoint, [0x67e8f9, 0xa7f3d0, 0xfacc15], 8, 0.5);

  if (ufo.hp <= 0) {
    spawnExplosion(ufo.group.position, [0x67e8f9, 0xfacc15, 0xff5c7a, 0xe5e7eb], 28, 1.25);
    scene.remove(ufo.group);
    ufos.splice(index, 1);
    state.score += Math.round((100 + state.wave * 25) * currentMode().scoreMultiplier);
    syncHud();
  }
}

function applyDamage(amount) {
  state.health = Math.max(0, state.health - amount);
  syncHud();
  if (state.health <= 0) {
    state.gameOver = true;
    showStatus("SYSTEM DOWN", `SCORE ${state.score}`);
    spawnExplosion(player.group.position.clone().add(new THREE.Vector3(0, 1.4, 0)), [0xff5c7a, 0xf97316, 0xfacc15], 34, 1.3);
  }
}

function spawnMuzzleFlash(origin, direction) {
  const flash = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.75, 8), materials.yellowGlow);
  flash.position.copy(origin).addScaledVector(direction, 0.25);
  flash.quaternion.setFromUnitVectors(upAxis, direction);
  flash.userData.life = 0.045;
  scene.add(flash);
  particles.push({
    mesh: flash,
    velocity: direction.clone().multiplyScalar(7),
    spin: new THREE.Vector3(0, 0, 0),
    ttl: 0.045,
    maxTtl: 0.045,
    baseScale: 1,
  });
}

function spawnExplosion(position, palette, count, force) {
  const geometry = new THREE.TetrahedronGeometry(0.16, 0);
  while (particles.length > 190) {
    const old = particles.shift();
    scene.remove(old.mesh);
  }

  for (let i = 0; i < count; i += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: palette[Math.floor(Math.random() * palette.length)],
      transparent: true,
      opacity: 0.92,
    });
    const chip = new THREE.Mesh(geometry, material);
    chip.position.copy(position);
    const dir = randomUnitVector();
    const speed = (4 + Math.random() * 13) * force;
    const scale = 0.8 + Math.random() * 1.7;
    chip.scale.setScalar(scale);
    scene.add(chip);
    particles.push({
      mesh: chip,
      velocity: dir.multiplyScalar(speed),
      spin: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
      ttl: 0.55 + Math.random() * 0.65 * force,
      maxTtl: 0.55 + Math.random() * 0.65 * force,
      baseScale: scale,
    });
  }
}

function randomUnitVector() {
  const theta = Math.random() * Math.PI * 2;
  const y = Math.random() * 1.7 - 0.35;
  const radius = Math.sqrt(Math.max(0.001, 1 - y * y * 0.35));
  return new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius).normalize();
}

function getAimDirection() {
  const cosPitch = Math.cos(input.viewPitch);
  return new THREE.Vector3(
    Math.sin(input.viewYaw) * cosPitch,
    Math.sin(input.viewPitch),
    Math.cos(input.viewYaw) * cosPitch,
  ).normalize();
}

function getHorizontalForward(yaw) {
  return new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
}

function updateCamera() {
  const tankPos = player.group.position;
  const forward = getHorizontalForward(input.viewYaw);
  const aimDir = getAimDirection();
  const cameraDistance = isCoarsePointer ? 10.5 : 12.5;
  const cameraHeight = isCoarsePointer ? 4.7 : 5.3;

  const desiredPosition = tmpVec3.copy(tankPos)
    .addScaledVector(forward, -cameraDistance)
    .add(new THREE.Vector3(0, cameraHeight, 0));
  const target = tmpVec3B.copy(tankPos)
    .add(new THREE.Vector3(0, 2.2, 0))
    .addScaledVector(aimDir, 12);

  camera.position.lerp(desiredPosition, 0.18);
  camera.lookAt(target);
}

function dampAngle(current, target, lambda, dt) {
  const delta = normalizeAngle(target - current);
  return current + delta * (1 - Math.exp(-lambda * dt));
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function syncHud() {
  const hp = Math.round(state.health);
  healthText.textContent = String(hp);
  healthFill.style.transform = `scaleX(${THREE.MathUtils.clamp(state.health / 100, 0, 1)})`;
  healthFill.style.filter = state.health < 30 ? "saturate(1.35) brightness(1.08)" : "none";
  scoreText.textContent = String(state.score);
  waveText.textContent = String(state.wave);
  statusLine.textContent = `SCORE ${state.score}`;
}

function showModePanel() {
  state.awaitingMode = true;
  state.paused = true;
  pauseButton.textContent = "▶";
  hideStatus();
  syncModeUi();
  modePanel.classList.remove("hidden");
}

function selectMode(modeId) {
  if (!GAME_MODES[modeId]) return;
  state.modeId = modeId;
  state.awaitingMode = false;
  modePanel.classList.add("hidden");
  syncModeUi();
  restartGame();
}

function togglePause() {
  if (state.gameOver || state.awaitingMode) return;
  setPaused(!state.paused);
}

function setPaused(paused) {
  state.paused = paused;
  pauseButton.textContent = paused ? "▶" : "II";
  if (paused) showStatus("PAUSED", `SCORE ${state.score}`);
  else hideStatus();
}

function showStatus(title, line) {
  statusTitle.textContent = title;
  statusLine.textContent = line;
  statusPanel.classList.remove("hidden");
}

function hideStatus() {
  statusPanel.classList.add("hidden");
}

function restartGame() {
  for (const ufo of ufos) scene.remove(ufo.group);
  for (const shot of playerProjectiles) {
    scene.remove(shot.userData.trail);
    scene.remove(shot);
  }
  for (const bolt of enemyProjectiles) scene.remove(bolt);
  for (const particle of particles) scene.remove(particle.mesh);
  ufos.length = 0;
  playerProjectiles.length = 0;
  enemyProjectiles.length = 0;
  particles.length = 0;

  const mode = currentMode();
  state.score = 0;
  state.wave = 1;
  state.health = mode.health;
  state.paused = false;
  state.gameOver = false;
  state.awaitingMode = false;
  state.autoTarget = null;
  state.waveDelay = 0;
  state.cooldown = 0;
  input.viewYaw = 0;
  input.viewPitch = 0.24;
  player.speed = mode.playerSpeed;
  player.velocity.set(0, 0, 0);
  player.group.position.set(0, terrainHeightAt(0, 0), 0);
  player.group.rotation.set(0, 0, 0);
  if (player.turret) player.turret.rotation.set(0, 0, 0);
  if (player.barrelPivot) player.barrelPivot.rotation.set(0, 0, 0);
  pauseButton.textContent = "II";
  document.body.classList.remove("target-lock");
  modePanel.classList.add("hidden");
  hideStatus();
  syncModeUi();
  spawnWave();
  syncHud();
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarsePointer ? 1.35 : 1.75));
}
