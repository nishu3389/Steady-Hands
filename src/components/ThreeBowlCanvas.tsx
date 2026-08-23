import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeBowlCanvasProps {
  tiltX: number; // -1 to 1
  tiltY: number; // -1 to 1
  waterLevel: number; // 0 to 100
  isSpilling?: boolean;
  onInteractiveTilt?: (x: number, y: number) => void;
  interactive?: boolean;
  className?: string;
  isDarkMode?: boolean;
}

export const ThreeBowlCanvas: React.FC<ThreeBowlCanvasProps> = ({
  tiltX,
  tiltY,
  waterLevel,
  isSpilling = false,
  onInteractiveTilt,
  interactive = false,
  className = '',
  isDarkMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetTiltX = useRef(tiltX);
  const targetTiltY = useRef(tiltY);
  const currentWaterLevel = useRef(waterLevel);
  const isSpillingRef = useRef(isSpilling);

  targetTiltX.current = tiltX;
  targetTiltY.current = tiltY;
  currentWaterLevel.current = waterLevel;
  isSpillingRef.current = isSpilling;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4.8, 7.5);
    camera.lookAt(0, 0.4, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isDarkMode ? 0.7 : 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 10, 7);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x9dcaff, 0.6);
    dirLight2.position.set(-5, 4, -4);
    scene.add(dirLight2);

    // Bowl Group
    const bowlGroup = new THREE.Group();
    scene.add(bowlGroup);

    // Bowl Material (Fine White Ceramic with gloss)
    const ceramicMat = new THREE.MeshPhysicalMaterial({
      color: isDarkMode ? 0x222a36 : 0xfcfdfd,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide,
    });

    // Bowl Outer & Inner Shell
    const bowlGeom = new THREE.CylinderGeometry(2.9, 1.8, 2.2, 48, 8, true);
    const bowlMesh = new THREE.Mesh(bowlGeom, ceramicMat);
    bowlMesh.position.y = 1.1;
    bowlMesh.castShadow = true;
    bowlMesh.receiveShadow = true;
    bowlGroup.add(bowlMesh);

    // Bowl Inner Bottom
    const bottomGeom = new THREE.CircleGeometry(1.8, 48);
    const bottomMesh = new THREE.Mesh(bottomGeom, ceramicMat);
    bottomMesh.rotation.x = -Math.PI / 2;
    bottomMesh.position.y = 0.01;
    bottomMesh.receiveShadow = true;
    bowlGroup.add(bottomMesh);

    // Coaster / Base Rim
    const basePlateGeom = new THREE.CylinderGeometry(2.1, 2.2, 0.25, 48);
    const basePlate = new THREE.Mesh(basePlateGeom, ceramicMat);
    basePlate.position.y = -0.12;
    basePlate.castShadow = true;
    bowlGroup.add(basePlate);

    // Water Mesh inside Bowl
    const waterGeom = new THREE.CircleGeometry(2.7, 64);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0088e8,
      emissive: 0x004488,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.6,
      ior: 1.333,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    const waterMesh = new THREE.Mesh(waterGeom, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 1.6;
    bowlGroup.add(waterMesh);

    // Inner Rim Accent Ring
    const rimGeom = new THREE.TorusGeometry(2.9, 0.06, 16, 48);
    const rimMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x9dcaff : 0x0078c6,
      metalness: 0.3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.4,
    });
    const rimMesh = new THREE.Mesh(rimGeom, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 2.2;
    bowlGroup.add(rimMesh);

    // Shadow on ground
    const shadowGeom = new THREE.PlaneGeometry(8, 8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: isDarkMode ? 0.35 : 0.12,
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.26;
    scene.add(shadowMesh);

    // Splashing Particles Engine
    const maxParticles = 80;
    const particleGeom = new THREE.SphereGeometry(0.06, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0x72c4ff,
      transparent: true,
      opacity: 0.8,
    });
    const particlePool: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[] = [];

    for (let i = 0; i < maxParticles; i++) {
      const p = new THREE.Mesh(particleGeom, particleMat);
      p.visible = false;
      scene.add(p);
      particlePool.push({ mesh: p, vx: 0, vy: 0, vz: 0, life: 0 });
    }

    function spawnSplash(originX: number, originZ: number) {
      for (let i = 0; i < 3; i++) {
        const p = particlePool.find((item) => !item.mesh.visible);
        if (p) {
          p.mesh.visible = true;
          p.mesh.position.set(originX + (Math.random() - 0.5) * 0.2, 2.0, originZ + (Math.random() - 0.5) * 0.2);
          const angle = Math.atan2(originZ, originX) + (Math.random() - 0.5) * 0.5;
          const speed = 0.08 + Math.random() * 0.12;
          p.vx = Math.cos(angle) * speed;
          p.vy = 0.06 + Math.random() * 0.08;
          p.vz = Math.sin(angle) * speed;
          p.life = 1.0;
        }
      }
    }

    // Animation physics variables
    let curRotX = 0;
    let curRotZ = 0;
    let waterSloshX = 0;
    let waterSloshZ = 0;
    let waterVelX = 0;
    let waterVelZ = 0;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.03;

      // Smoothly interpolate bowl tilt
      const targetX = targetTiltY.current * 0.45;
      const targetZ = -targetTiltX.current * 0.45;

      curRotX += (targetX - curRotX) * 0.12;
      curRotZ += (targetZ - curRotZ) * 0.12;

      bowlGroup.rotation.x = curRotX;
      bowlGroup.rotation.z = curRotZ;

      // Water fluid slosh inertia physics (spring-damper system)
      const spring = 0.08;
      const damping = 0.88;

      const forceX = -curRotX * 1.5 - waterSloshX * spring;
      const forceZ = -curRotZ * 1.5 - waterSloshZ * spring;

      waterVelX = (waterVelX + forceX) * damping;
      waterVelZ = (waterVelZ + forceZ) * damping;

      waterSloshX += waterVelX;
      waterSloshZ += waterVelZ;

      // Water surface tilt & height based on water level
      const fillRatio = Math.max(0, Math.min(1, currentWaterLevel.current / 100));
      const targetWaterY = 0.3 + fillRatio * 1.5;
      waterMesh.position.y += (targetWaterY - waterMesh.position.y) * 0.1;

      // Adjust scale of water disc to fit tapered bowl shape
      const radiusAtHeight = 1.8 + (waterMesh.position.y / 2.2) * 1.1;
      const currentScale = (radiusAtHeight / 2.7) * (fillRatio > 0.01 ? 1 : 0.001);
      waterMesh.scale.set(currentScale, currentScale, 1);

      // Water ripples & slosh reaction
      waterMesh.rotation.x = -Math.PI / 2 + waterSloshX * 0.5;
      waterMesh.rotation.z = waterSloshZ * 0.5;

      // Spilling effect: if spilling or water level drops rapidly, spawn droplets
      if (isSpillingRef.current && fillRatio > 0.05) {
        // Find highest edge of water relative to bowl rim
        const edgeAngle = Math.atan2(waterSloshZ, waterSloshX);
        const rimX = Math.cos(edgeAngle) * 2.7;
        const rimZ = Math.sin(edgeAngle) * 2.7;
        spawnSplash(rimX, rimZ);
      }

      // Update particle physics
      for (const p of particlePool) {
        if (p.mesh.visible) {
          p.mesh.position.x += p.vx;
          p.mesh.position.y += p.vy;
          p.mesh.position.z += p.vz;
          p.vy -= 0.008; // gravity
          p.life -= 0.035;

          if (p.life <= 0 || p.mesh.position.y < -0.2) {
            p.mesh.visible = false;
          }
        }
      }

      // Shadow opacity and scale response to tilt
      const tiltMag = Math.sqrt(curRotX * curRotX + curRotZ * curRotZ);
      shadowMesh.position.x = curRotZ * 0.8;
      shadowMesh.position.z = -curRotX * 0.8;
      shadowMesh.scale.set(1 + tiltMag * 0.2, 1 + tiltMag * 0.2, 1);

      renderer.render(scene, camera);
    };

    animate();

    // Mouse / Touch Interaction Handler for interactive mode
    const handlePointerMove = (e: PointerEvent | MouseEvent | TouchEvent) => {
      if (!interactive || !onInteractiveTilt) return;
      const rect = container.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((clientY - rect.top) / rect.height) * 2 - 1;
      onInteractiveTilt(Math.max(-1, Math.min(1, normX)), Math.max(-1, Math.min(1, normY)));
    };

    if (interactive) {
      container.addEventListener('pointermove', handlePointerMove);
      container.addEventListener('touchmove', handlePointerMove);
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        container.removeEventListener('pointermove', handlePointerMove);
        container.removeEventListener('touchmove', handlePointerMove);
      }
      renderer.dispose();
      scene.clear();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, isDarkMode]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative cursor-grab active:cursor-grabbing touch-none select-none ${className}`}
    />
  );
};
