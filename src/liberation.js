document.addEventListener("DOMContentLoaded", () => {
  const tank = document.getElementById("tank");
  const gateContainer = document.querySelector(".gate-container");
  const distLeftEl = document.getElementById("dist-left");
  const distRightEl = document.getElementById("dist-right");
  const speedEl = document.getElementById("speed");
  const restartBtn = document.getElementById("restart-btn");

  let animationId;
  let startTime;
  let isCrashed = false;
  
  // Game parameters
  const totalDistance = 150; // virtual meters
  const startX = 0; // css transform translateX
  const endX = -800; // end position in px
  const durationMs = 6000; // 6 seconds to crash
  const crashPointRatio = 0.75; // crashes at 75% of the distance

  function startAnimation() {
    isCrashed = false;
    gateContainer.classList.remove("crashed");
    tank.classList.add("moving");
    startTime = null;
    
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(animate);
  }

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    
    // Progress 0 to 1
    let progress = Math.min(elapsed / durationMs, 1);
    
    // Smooth acceleration and deceleration (optional, using linear for raw power)
    let easeProgress = progress * progress * (3 - 2 * progress);
    
    // Update Tank Position
    const currentX = startX + (endX - startX) * easeProgress;
    tank.style.transform = `translateX(${currentX}px)`;
    
    // Update Speed (simulated km/h)
    // Speed increases to max around middle, then maybe drops slightly at crash
    let speed = 0;
    if (progress < 0.2) {
      speed = (progress / 0.2) * 45;
    } else if (progress < crashPointRatio) {
      speed = 45 + Math.random() * 5; // max speed ~50km/h
    } else {
      speed = Math.max(0, 50 - ((progress - crashPointRatio) / (1 - crashPointRatio)) * 50);
    }
    speedEl.textContent = `${Math.floor(speed)}km/h`;
    
    // Update Distances
    const currentDist = Math.max(0, totalDistance - (progress / crashPointRatio) * totalDistance);
    
    // Cổng trái and Cổng phải text
    if (progress >= crashPointRatio && !isCrashed) {
      isCrashed = true;
      gateContainer.classList.add("crashed");
      distLeftEl.textContent = "Mất Hút";
      distRightEl.textContent = "Nhật Bản";
    } else if (!isCrashed) {
      distLeftEl.textContent = `${Math.floor(currentDist)}m`;
      distRightEl.textContent = `${Math.floor(currentDist)}m`;
    }

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else {
      tank.classList.remove("moving");
      speedEl.textContent = "0km/h";
    }
  }

  restartBtn.addEventListener("click", () => {
    startAnimation();
  });

  // Delay start slightly for effect
  setTimeout(() => {
    startAnimation();
  }, 500);
});
