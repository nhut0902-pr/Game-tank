import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, push, query, orderByChild, limitToLast, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// ==========================================
// 1. CẤU HÌNH FIREBASE (BẠN HÃY ĐIỀN VÀO ĐÂY)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAqbG5w9WAFc7J_tGuXUWXqVeZhcs94Kuk",
  authDomain: "vinagame-9b378.firebaseapp.com",
  databaseURL: "https://vinagame-9b378-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vinagame-9b378",
  storageBucket: "vinagame-9b378.firebasestorage.app",
  messagingSenderId: "592562619300",
  appId: "1:592562619300:web:e901927850a0522b07b731",
  measurementId: "G-SWP61QLJTL"
};

let db = null;
try {
  if (firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  } else {
    console.warn("⚠️ Chưa điền cấu hình Firebase. Bảng xếp hạng sẽ chạy ở chế độ giả lập (Offline).");
  }
} catch (e) {
  console.error("Lỗi khởi tạo Firebase:", e);
}

// ==========================================
// 2. GAME LOGIC
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const tank = document.getElementById("tank");
  const gateContainer = document.querySelector(".gate-container");
  const distLeftEl = document.getElementById("dist-left");
  const distRightEl = document.getElementById("dist-right");
  const speedEl = document.getElementById("speed");
  const restartBtn = document.getElementById("restart-btn");
  const instructionEl = document.getElementById("instruction");
  
  // UI Elements mới
  const btnModeTap = document.getElementById("btn-mode-tap");
  const btnModeDrag = document.getElementById("btn-mode-drag");
  const postGameActions = document.getElementById("post-game-actions");
  const btnScreenshot = document.getElementById("btn-screenshot");
  const btnSubmitScore = document.getElementById("btn-submit-score");
  const playerNameInput = document.getElementById("player-name");
  const leaderboardBody = document.getElementById("leaderboard-body");

  let animationId;
  let lastTime = 0;
  let isCrashed = false;
  let finalImpactSpeed = 0;
  
  // Chế độ điều khiển ('tap' hoặc 'drag')
  let controlMode = 'tap'; 
  
  // Drag state
  let isDragging = false;
  let dragStartX = 0;
  let currentDragDist = 0;
  
  // Game parameters
  const initialDistance = 150; // meters
  let distance = initialDistance;
  let speed = 0; // km/h
  const maxSpeed = 80; // max km/h
  const startX = 0; 

  // Lắng nghe Firebase (nếu có) hoặc render giả
  setupLeaderboard();

  // --- CONTROL SELECTION ---
  btnModeTap.addEventListener("click", () => setControlMode('tap'));
  btnModeDrag.addEventListener("click", () => setControlMode('drag'));

  function setControlMode(mode) {
    controlMode = mode;
    btnModeTap.classList.toggle("active", mode === 'tap');
    btnModeDrag.classList.toggle("active", mode === 'drag');
    resetGame();
  }

  function accelerate(amount) {
    if (isCrashed || controlMode !== 'tap') return;
    speed += amount;
    if (speed > maxSpeed) speed = maxSpeed;
    tank.classList.add("moving");
    instructionEl.style.opacity = '0.5';
  }

  // Handle Input - TAP
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && controlMode === 'tap') {
      if (document.activeElement === playerNameInput) return; // Đang gõ tên
      e.preventDefault();
      accelerate(6);
    }
  });

  document.getElementById("scene").addEventListener("pointerdown", (e) => {
    if (isCrashed) return;
    
    if (controlMode === 'tap') {
      e.preventDefault();
      accelerate(6);
    } else if (controlMode === 'drag') {
      // Bắt đầu kéo (Ná bắn)
      e.preventDefault();
      isDragging = true;
      dragStartX = e.clientX;
      tank.style.transition = 'none'; // Tắt mượt để kéo ngay lập tức
      instructionEl.style.opacity = '0.5';
    }
  }, { passive: false });

  function getDynamicEndX() {
    const sceneEl = document.getElementById("scene");
    const tankEl = document.getElementById("tank");
    const sceneWidth = sceneEl.clientWidth;
    const tankWidth = tankEl.clientWidth;
    
    // CSS set tank right: 5%. This means tank's right edge is at 95% of sceneWidth.
    // Tank's left edge is at (0.95 * sceneWidth) - tankWidth
    const tankStartLeftEdge = (0.95 * sceneWidth) - tankWidth;
    
    // Gate is at left: 5%, left-gate is 40% of 60% = 24%. 5% + 24% = 29%.
    // So the impact point is at 30% of the scene.
    const gateHitPoint = sceneWidth * 0.3; 
    
    // Total travel distance
    return -(tankStartLeftEdge - gateHitPoint); 
  }

  // Handle Input - DRAG
  window.addEventListener("pointermove", (e) => {
    if (!isDragging || controlMode !== 'drag' || isCrashed) return;
    e.preventDefault();
    // Kéo ngược về bên phải (clientX tăng) -> Tích tụ lực
    const deltaX = e.clientX - dragStartX;
    if (deltaX > 0) {
      currentDragDist = Math.min(deltaX, 300); // Kéo lùi tối đa 300px
      const dynamicEndX = getDynamicEndX();
      const progress = 1 - (distance / initialDistance);
      const baseCurrentX = startX + (dynamicEndX - startX) * progress;
      
      // Vẽ xe lùi lại một chút
      tank.style.transform = `translateX(${baseCurrentX + currentDragDist}px)`;
    }
  }, { passive: false });

  window.addEventListener("pointerup", (e) => {
    if (!isDragging || controlMode !== 'drag' || isCrashed) return;
    isDragging = false;
    tank.style.transition = 'transform 0.1s ease-out';
    
    // Bắn! Vận tốc tỉ lệ với độ kéo lùi (tối đa maxSpeed)
    if (currentDragDist > 20) {
      const power = (currentDragDist / 300) * maxSpeed;
      speed = power;
      tank.classList.add("moving");
    }
    currentDragDist = 0;
  });

  function resetGame() {
    isCrashed = false;
    isDragging = false;
    gateContainer.classList.remove("crashed");
    tank.classList.remove("moving");
    tank.style.transition = 'none';
    postGameActions.style.display = 'none';
    distance = initialDistance;
    speed = 0;
    lastTime = 0;
    finalImpactSpeed = 0;
    
    instructionEl.style.opacity = '1';
    instructionEl.style.color = '#b30000';
    if (controlMode === 'tap') {
      instructionEl.querySelector("span").textContent = "BẤM LIÊN TỤC VÀO MÀN HÌNH HOẶC PHÍM SPACE ĐỂ ĐẠP GA!";
    } else {
      instructionEl.querySelector("span").textContent = "CHẠM VÀO MÀN HÌNH RỒI KÉO LÙI VỀ SAU ĐỂ LẤY ĐÀ TÔNG CỔNG!";
    }
    
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(update);
  }

  function update(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    const dynamicEndX = getDynamicEndX();

    if (!isCrashed) {
      if (!isDragging) {
        // Ma sát làm giảm tốc
        if (speed > 0) {
          speed -= (controlMode === 'tap' ? 15 : 5) * dt; // Drag giữ tốc độ lâu hơn 1 chút
          if (speed < 0) speed = 0;
        }
        
        if (speed === 0 && distance < initialDistance) {
          tank.classList.remove("moving");
        }

        // Xe di chuyển
        distance -= speed * dt;
        
        if (distance <= 0) {
          distance = 0;
          crash(speed);
        }

        // Cập nhật UI
        speedEl.textContent = `${Math.floor(speed)}km/h`;
        if (!isCrashed) {
          distLeftEl.textContent = `${Math.floor(distance)}m`;
          distRightEl.textContent = `${Math.floor(distance)}m`;
        }

        // Vẽ xe tăng nếu không đang kéo lùi
        const progress = 1 - (distance / initialDistance);
        const currentX = startX + (dynamicEndX - startX) * progress;
        tank.style.transform = `translateX(${currentX}px)`;
      }
    }

    animationId = requestAnimationFrame(update);
  }

  function crash(impactSpeed) {
    isCrashed = true;
    finalImpactSpeed = Math.floor(impactSpeed);
    tank.classList.remove("moving");
    speedEl.textContent = "0km/h";
    
    if (impactSpeed >= 25) {
      gateContainer.classList.add("crashed");
      distLeftEl.textContent = "Bay sang Quận 2";
      distRightEl.textContent = "Mất hút";
      instructionEl.querySelector("span").textContent = `THÀNH CÔNG! TỐC ĐỘ: ${finalImpactSpeed}KM/H - CHIẾN DỊCH HỒ CHÍ MINH TOÀN THẮNG!`;
      instructionEl.style.color = "#008000";
    } else {
      distLeftEl.textContent = "Chưa vỡ";
      distRightEl.textContent = "Móp nhẹ";
      instructionEl.querySelector("span").textContent = `THẤT BẠI! TỐC ĐỘ QUÁ CHẬM (${finalImpactSpeed}km/h). HÃY THỬ LẠI!`;
      instructionEl.style.color = "#b30000";
    }
    instructionEl.style.opacity = '1';
    
    // Hiển thị panel cuối game (Khoe + Lưu điểm)
    postGameActions.style.display = 'flex';
  }

  restartBtn.addEventListener("click", () => {
    resetGame();
  });

  // ==========================================
  // 3. TÍNH NĂNG CHỤP ẢNH KHOE (HTML2CANVAS)
  // ==========================================
  btnScreenshot.addEventListener("click", async () => {
    const orgText = btnScreenshot.textContent;
    btnScreenshot.textContent = "Đang chụp...";
    btnScreenshot.disabled = true;
    
    try {
      // Ẩn các nút không cần thiết trước khi chụp
      postGameActions.style.display = 'none';
      document.querySelector('.control-selector').style.display = 'none';
      
      // Load html2canvas dynamically nếu chưa có trong HTML (đề phòng)
      if (typeof html2canvas === 'undefined') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        scale: 2 // Chất lượng cao
      });
      
      // Hiện lại nút
      postGameActions.style.display = 'flex';
      document.querySelector('.control-selector').style.display = 'flex';
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.download = 'huc-cong-30-4.jpg';
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error("Lỗi chụp ảnh:", err);
      alert("Lỗi khi chụp ảnh. Vui lòng thử lại!");
      postGameActions.style.display = 'flex';
      document.querySelector('.control-selector').style.display = 'flex';
    }
    
    btnScreenshot.textContent = orgText;
    btnScreenshot.disabled = false;
  });

  // ==========================================
  // 4. FIREBASE LEADERBOARD LOGIC
  // ==========================================
  
  function saveLocalAndRender(name, speed) {
    let localScores = JSON.parse(localStorage.getItem('fakeLeaderboard') || '[]');
    localScores.push({ name: name, speed: speed });
    localStorage.setItem('fakeLeaderboard', JSON.stringify(localScores));
    renderLocalLeaderboard();
  }

  btnSubmitScore.addEventListener("click", async () => {
    const name = playerNameInput.value.trim();
    if (!name) {
      alert("Vui lòng nhập tên chiến sĩ!");
      return;
    }
    if (finalImpactSpeed <= 0) {
      alert("Tốc độ không hợp lệ!");
      return;
    }

    btnSubmitScore.textContent = "Đang lưu...";
    btnSubmitScore.disabled = true;

    if (db) {
      try {
        await push(ref(db, "leaderboard"), {
          name: name,
          speed: finalImpactSpeed,
          timestamp: serverTimestamp()
        });
        alert("Lưu kỷ lục thành công!");
      } catch (err) {
        console.error("Lỗi lưu điểm (Firebase permission?):", err);
        alert("Có lỗi chặn quyền ghi từ Firebase (Bạn chưa cấp quyền ghi trong Firestore Rules). Tạm thời lưu offline máy bạn!");
        saveLocalAndRender(name, finalImpactSpeed);
      }
    } else {
      alert("Lưu kỷ lục nội bộ thành công (Chưa có kết nối Firebase)!");
      saveLocalAndRender(name, finalImpactSpeed);
    }
    
    btnSubmitScore.textContent = "Lưu Kỷ Lục";
    btnSubmitScore.disabled = false;
  });

  function setupLeaderboard() {
    if (db) {
      const q = query(ref(db, "leaderboard"), orderByChild("speed"), limitToLast(5));
      onValue(q, (snapshot) => {
        leaderboardBody.innerHTML = '';
        if (!snapshot.exists()) {
          leaderboardBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Chưa có kỷ lục nào.</td></tr>';
          return;
        }
        let scores = [];
        snapshot.forEach((child) => {
          scores.push(child.val());
        });
        scores.reverse(); // Đảo ngược để có thứ tự giảm dần
        
        let index = 1;
        scores.forEach((data) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>#${index++}</td><td>${data.name}</td><td><strong>${data.speed} km/h</strong></td>`;
          leaderboardBody.appendChild(tr);
        });
      }, (error) => {
        console.error("Lỗi đọc bảng xếp hạng:", error);
      });
    } else {
      renderLocalLeaderboard();
    }
  }

  function renderLocalLeaderboard() {
    let localScores = JSON.parse(localStorage.getItem('fakeLeaderboard') || '[]');
    localScores.sort((a, b) => b.speed - a.speed);
    localScores = localScores.slice(0, 5);
    
    if (localScores.length === 0) {
      // Dữ liệu mẫu ban đầu
      localScores = [
        {name: "Bùi Quang Thận", speed: 65},
        {name: "Vũ Đăng Toàn", speed: 60},
        {name: "Bún Bò Ú Trấu", speed: 50},
        {name: "Chiến sĩ Ẩn Danh", speed: 45}
      ];
    }
    
    leaderboardBody.innerHTML = '';
    localScores.forEach((data, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>#${i + 1}</td><td>${data.name}</td><td><strong>${data.speed} km/h</strong></td>`;
      leaderboardBody.appendChild(tr);
    });
  }

  // Start loop
  animationId = requestAnimationFrame(update);
});
