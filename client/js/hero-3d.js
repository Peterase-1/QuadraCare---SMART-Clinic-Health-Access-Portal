// 3D DNA Helix Animation using Three.js
// Element ID: hero-3d-container

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('hero-3d-container');
  if (!container) return;

  // Scene Setup
  const scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xf0f6f9); // Match bg if needed, or transparent

  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 25;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Create DNA Double Helix Particles
  const geometry = new THREE.BufferGeometry();
  const particleCount = 600;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const color1 = new THREE.Color(0x599fac); // Primary Teal
  const color2 = new THREE.Color(0x3d7a85); // Darker Teal

  for (let i = 0; i < particleCount; i++) {
    // Helix math
    const t = i * 0.1;
    const radius = 5;

    // Strand 1
    if (i % 2 === 0) {
      positions[i * 3] = Math.cos(t) * radius;
      positions[i * 3 + 1] = (i * 0.05) - 15; // Vertical spread
      positions[i * 3 + 2] = Math.sin(t) * radius;

      colors[i * 3] = color1.r;
      colors[i * 3 + 1] = color1.g;
      colors[i * 3 + 2] = color1.b;
    }
    // Strand 2 (Offset)
    else {
      positions[i * 3] = Math.cos(t + Math.PI) * radius;
      positions[i * 3 + 1] = (i * 0.05) - 15;
      positions[i * 3 + 2] = Math.sin(t + Math.PI) * radius;

      colors[i * 3] = color2.r;
      colors[i * 3 + 1] = color2.g;
      colors[i * 3 + 2] = color2.b;
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Add random floating particles around
  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 200;
  const starsPos = new Float32Array(starsCount * 3);

  for (let i = 0; i < starsCount; i++) {
    starsPos[i * 3] = (Math.random() - 0.5) * 50;
    starsPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
    starsPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: 0x599fac, size: 0.2 });
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    particles.rotation.y += 0.005; // Spin helix
    particles.rotation.z += 0.002; // Mild tilt spin

    starField.rotation.y -= 0.002; // Background counter spin

    renderer.render(scene, camera);
  }

  animate();

  // Resize Handler
  window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
});
