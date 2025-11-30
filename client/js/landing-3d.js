// 3D Scene Logic using Three.js

const init3DScene = () => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xf0f9ff); // Let CSS handle background gradient

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Particles - Abstract DNA Helix Structure
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 1200;

  const posArray = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount; i++) {
    // Create a double helix shape
    const t = i * 0.1;
    const radius = 10;
    const x = Math.cos(t) * radius + (Math.random() - 0.5) * 2;
    const y = (i * 0.05) - 30; // Spread vertically
    const z = Math.sin(t) * radius + (Math.random() - 0.5) * 2;

    // Second strand (offset by PI)
    if (i % 2 === 0) {
      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;
    } else {
      posArray[i * 3] = Math.cos(t + Math.PI) * radius + (Math.random() - 0.5) * 2;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = Math.sin(t + Math.PI) * radius + (Math.random() - 0.5) * 2;
    }
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

  const material = new THREE.PointsMaterial({
    size: 0.15,
    color: 0x0284c7, // Primary Blue
    transparent: true,
    opacity: 0.8,
  });

  const particlesMesh = new THREE.Points(particlesGeometry, material);
  scene.add(particlesMesh);

  // Floating Particles (Background noise)
  const bgParticlesGeometry = new THREE.BufferGeometry();
  const bgCount = 500;
  const bgPosArray = new Float32Array(bgCount * 3);

  for (let i = 0; i < bgCount; i++) {
    bgPosArray[i * 3] = (Math.random() - 0.5) * 100;
    bgPosArray[i * 3 + 1] = (Math.random() - 0.5) * 100;
    bgPosArray[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }

  bgParticlesGeometry.setAttribute('position', new THREE.BufferAttribute(bgPosArray, 3));
  const bgMaterial = new THREE.PointsMaterial({
    size: 0.1,
    color: 0x38bdf8, // Lighter Blue
    transparent: true,
    opacity: 0.4
  });
  const bgMesh = new THREE.Points(bgParticlesGeometry, bgMaterial);
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

document.addEventListener('DOMContentLoaded', init3DScene);
