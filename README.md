# UFO Tank 3D

Ban yeu cau mot game 3D bang Three.js: nguoi choi dieu khien xe tang, vua lai vua nhin xung quanh, ban ha UFO bay tren dau, phong cach low-poly dep, toi uu cho mobile va co joystick ao.

## Huong dan cho developer junior

1. Xem `index.html` truoc de nam cac thanh phan DOM: canvas game, HUD, nut pause, crosshair, joystick, nut ban va panel trang thai.
2. Xem `src/styles.css` de hieu layout full-screen, responsive HUD, joystick ao, nut ban va cac media query cho mobile/landscape.
3. Sua gameplay trong `src/main.js`. File nay gom toan bo logic: tao scene Three.js, texture procedural, xe tang, UFO, dan, collision, wave, 3 che do choi, auto-fire, camera, joystick/touch look va HUD.
4. Neu can them model/asset moi, them ham tao mesh/material trong `src/main.js` gan khu vuc `createMaterials`, `createTank`, `createUfoMesh`, `addRockField` hoac `addLowPolyOutpost`.
5. Neu can doi UI mobile, chi sua `src/styles.css` truoc. Neu thay doi ID DOM thi dong bo lai cac selector o dau `src/main.js`.

## Cach chay

```bash
npm install
npm run dev
```

## Dieu khien

- Desktop: `WASD` hoac phim mui ten de lai, keo chuot tren canvas de nhin/ngam, click hoac `Space` de ban, `P`/`Esc` de pause.
- Mobile: joystick trai de lai, keo ben phai man hinh de nhin/ngam, nut tron ben phai de ban.
- Auto-fire: chi can dua tam ngam vao UFO, xe tang se tu dong ban tren desktop va mobile.

## Che do choi

- `TAP LUYEN`: it UFO hon, HP cao hon, vung auto-fire rong hon.
- `SINH TON`: can bang cho gameplay chuan.
- `DOT KICH`: nhieu UFO hon, ban nhanh hon, sat thuong UFO cao hon va diem thuong cao hon.

## Noi dung da co

- Three.js scene full-screen voi renderer toi uu pixel ratio cho mobile.
- Xe tang low-poly co than, xich, banh, thap phao, nong sung va texture camo procedural.
- UFO low-poly co vo kim loai, dome phat sang, den vien, beam telegraph va dan ban xuong.
- Dia hinh desert low-poly, sky dome, outpost radar, da trang tri va texture mat dat procedural.
- Joystick ao, nut ban mobile, camera third-person cho phep vua di chuyen vua nhin xung quanh.
- Gameplay day du: chon 3 che do, auto-fire theo tam ngam, wave, score, health, ban, collision, explosion particles, pause va retry.
