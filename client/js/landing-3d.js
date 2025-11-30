// 3D Scene Logic using Three.js

const init3DScene = () => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xf0f9ff); // Let CSS handle background gradient

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(bgMesh);

  // Mouse Interaction
  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;
  });

  // Animation Loop
  const animate = () => {
    requestAnimationFrame(animate);

    // Rotate Helix
    particlesMesh.rotation.y += 0.002;
    particlesMesh.rotation.x += 0.001;

    // Rotate Background
    bgMesh.rotation.y -= 0.0005;

    // Mouse Parallax
    particlesMesh.rotation.y += mouseX * 0.01;
    particlesMesh.rotation.x += mouseY * 0.01;

    renderer.render(scene, camera);
  };

  animate();

  // Resize Handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  init3DScene();
  initStatsCounter();
});

// Stats Counter Animation
const initStatsCounter = () => {
  const stats = document.querySelectorAll('.stat-item h3');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const value = target.innerText;

        // Extract number and suffix
        const numberMatch = value.match(/[\d\.]+/);
        const suffixMatch = value.match(/[^\d\.]+/);

        if (numberMatch) {
          const endValue = parseFloat(numberMatch[0]);
          const suffix = suffixMatch ? suffixMatch[0] : '';
          let startValue = 0;
          const duration = 2000;
          const startTime = performance.now();

          const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const current = startValue + (endValue - startValue) * ease;

            // Format: if integer, show integer. If float, show 1 decimal
            target.innerText = (Number.isInteger(endValue) ? Math.round(current) : current.toFixed(1)) + suffix;

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              target.innerText = value; // Ensure exact final value
            }
          };

          requestAnimationFrame(updateCounter);
          observer.unobserve(target);
        }
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => observer.observe(stat));
};
