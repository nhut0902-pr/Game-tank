document.addEventListener("DOMContentLoaded", () => {
  const tank = document.getElementById("tank");
  const gateContainer = document.querySelector(".gate-container");
  const distLeftEl = document.getElementById("dist-left");
  const distRightEl = document.getElementById("dist-right");
  const speedEl = document.getElementById("speed");
  const restartBtn = document.getElementById("restart-btn");
  const instructionEl = document.getElementById("instruction");

  let animationId;
  let lastTime = 0;
  let isCrashed = false;
  
  // Game parameters
  const initialDistance = 150; // meters
  let distance = initialDistance;
  let speed = 0; // km/h
  const maxSpeed = 70; // max km/h
  const startX = 0; 
  const endX = -800; // The transform X offset when reaching the gates

  function accelerate(amount) {
    if (isCrashed) return;
    speed += amount;
    if (speed > maxSpeed) speed = maxSpeed;
    tank.classList.add("moving");
    instructionEl.style.opacity = '0.5'; // dim instruction when playing
  }

  // Handle Input
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      accelerate(6);
    }
  });

  // Touch or click to accelerate
  window.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button") || e.target.closest("a")) return;
    e.preventDefault(); // Ngăn zoom hoặc cuộn vô tình trên mobile
    accelerate(6);
  }, { passive: false });

  function resetGame() {
    isCrashed = false;
    gateContainer.classList.remove("crashed");
    tank.classList.remove("moving");
    distance = initialDistance;
    speed = 0;
    lastTime = 0;
    instructionEl.style.opacity = '1';
    instructionEl.querySelector("span").textContent = "BẤM LIÊN TỤC VÀO MÀN HÌNH HOẶC PHÍM SPACE ĐỂ ĐẠP GA!";
    
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(update);
  }

  function update(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000; // in seconds
    lastTime = timestamp;
    
    // Tính toán lại endX để tương thích mọi kích thước màn hình (Mobile/Desktop)
    // Cổng nằm ở khoảng 35% từ bên trái màn hình. Xe tăng rộng 280px.
    const screenWidth = window.innerWidth;
    const gateHitPoint = screenWidth * 0.35; 
    // Vị trí ban đầu của xe tăng (css: right -300px) tức là x = screenWidth + 300
    // Để đầu xe tăng (cạnh trái) chạm cổng:
    const tankStartX = screenWidth + 300; 
    const dynamicEndX = -(tankStartX - gateHitPoint - 280); 

    if (!isCrashed) {
      // Natural deceleration (friction)
      if (speed > 0) {
        speed -= 15 * dt; // lose speed over time if not pushing
        if (speed < 0) speed = 0;
      }
      
      if (speed === 0 && distance < initialDistance) {
        tank.classList.remove("moving");
      }

      // Move distance based on speed
      // 1 km/h mapped to roughly 1 m/s for arcade feel
      distance -= speed * dt;
      
      if (distance <= 0) {
        distance = 0;
        crash(speed);
      }

      // Update UI
      speedEl.textContent = `${Math.floor(speed)}km/h`;
      if (!isCrashed) {
        distLeftEl.textContent = `${Math.floor(distance)}m`;
        distRightEl.textContent = `${Math.floor(distance)}m`;
      }

      // Update Visuals
      const progress = 1 - (distance / initialDistance);
      const currentX = startX + (dynamicEndX - startX) * progress;
      tank.style.transform = `translateX(${currentX}px)`;
    }

    animationId = requestAnimationFrame(update);
  }

  function crash(impactSpeed) {
    isCrashed = true;
    tank.classList.remove("moving");
    speedEl.textContent = "0km/h";
    
    // Check if speed is enough to break gates
    if (impactSpeed >= 25) {
      gateContainer.classList.add("crashed");
      distLeftEl.textContent = "Bay sang Quận 2";
      distRightEl.textContent = "Mất hút";
      instructionEl.querySelector("span").textContent = "THÀNH CÔNG! CHIẾN DỊCH HỒ CHÍ MINH TOÀN THẮNG!";
      instructionEl.style.color = "#008000"; // green text
    } else {
      // Not fast enough
      distLeftEl.textContent = "Chưa vỡ";
      distRightEl.textContent = "Móp nhẹ";
      instructionEl.querySelector("span").textContent = `THẤT BẠI! TỐC ĐỘ QUÁ CHẬM (${Math.floor(impactSpeed)}km/h). HÃY ĐẠP GA NHANH HƠN NỮA!`;
      instructionEl.style.color = "#b30000";
    }
    instructionEl.style.opacity = '1';
  }

  restartBtn.addEventListener("click", () => {
    resetGame();
  });

  // Start loop
  animationId = requestAnimationFrame(update);
});
