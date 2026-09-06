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

/* ------------------------------------------------------------------
   Bowl/water rendering ported from WaterBowlProject's water-bowl-game.html:
   the hand-thrown ceramic bowl (scalloped rim, gold kintsugi veining), the
   radial-gradient water material, the spill-point-centered ripple, the
   splash-particle + ground-puddle system. Only the RENDERING is ported —
   the control inputs (tiltX/tiltY/waterLevel/isSpilling) still come from
   PlayScreen's own game loop via props, same contract as before.
   ------------------------------------------------------------------ */

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

    /* ---- Scene / camera / renderer ----
       Camera framing matches the bowl's own scale (radius ~1.5, not the old
       cylinder's ~2.9) — this is the WaterBowlProject camera, tuned for
       this exact geometry. */
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 3.1, 4.6);
    camera.lookAt(0, 0.4, 0);
    const CAM_DISTANCE = camera.position.distanceTo(new THREE.Vector3(0, 0.4, 0));
    const CAM_FOV_RAD = (42 * Math.PI) / 180;
    // Radius of a sphere comfortably containing the bowl (rim ~1.5 + scallop
    // wobble), with headroom so it reads as "framed", not edge-to-edge.
    const FIT_RADIUS = 1.65;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting — same rig as the source game, softened a touch in dark mode
    // (mirrors the old component's isDarkMode ambient tweak).
    const hemi = new THREE.HemisphereLight(0xbfe9ee, 0x0a1015, isDarkMode ? 0.55 : 0.65);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(3, 6, 4);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x6fd3e0, 0.5);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);

    // Procedural sky-gradient environment map so the water's clearcoat +
    // transmission has something believable to reflect (otherwise it reads
    // flat/plasticky, picking up only hard direct-light highlights).
    function makeSkyEnvTexture(): THREE.Texture {
      const size = 128;
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0.0, '#dff3f5');
      grad.addColorStop(0.35, '#7fd0dc');
      grad.addColorStop(0.7, '#1c4652');
      grad.addColorStop(1.0, '#060f15');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    // Scoped to the water material only (below), NOT scene.environment —
    // that would implicitly reflect onto every PBR material in the scene,
    // including the ceramic bowl, tinting its intended white/cream + gold
    // look with this teal-to-black gradient and reading as a dingy olive
    // color instead.
    const skyEnvTexture = makeSkyEnvTexture();

    /* ---- Ground + puddle "wetness map" ----
       A canvas texture stamped with soft blobs wherever a splash droplet
       lands, so spilled water visibly accumulates on the ground instead of
       just vanishing. Kept subtle/transparent here since this sits inside a
       small embedded card, not a full-bleed scene. */
    const TABLE_RADIUS = 3.2;
    const tableGeo = new THREE.CircleGeometry(TABLE_RADIUS, 48);
    const tableMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0x1c2128 : 0xe4e8ee,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: isDarkMode ? 0.5 : 0.35,
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.rotation.x = -Math.PI / 2;
    table.position.y = -1.02;
    scene.add(table);

    const PUDDLE_CANVAS_SIZE = 512;
    const puddleCanvas = document.createElement('canvas');
    puddleCanvas.width = puddleCanvas.height = PUDDLE_CANVAS_SIZE;
    const puddleCtx = puddleCanvas.getContext('2d')!;
    const puddleTexture = new THREE.CanvasTexture(puddleCanvas);
    const puddleGeo = new THREE.CircleGeometry(TABLE_RADIUS, 48);
    const puddleMat = new THREE.MeshBasicMaterial({
      map: puddleTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    const puddleMesh = new THREE.Mesh(puddleGeo, puddleMat);
    puddleMesh.rotation.x = -Math.PI / 2;
    puddleMesh.position.y = table.position.y + 0.002;
    scene.add(puddleMesh);

    function stampPuddle(worldX: number, worldZ: number, radiusWorld: number, alpha: number) {
      const u = (worldX / TABLE_RADIUS) * 0.5 + 0.5;
      const v = ((-worldZ) / TABLE_RADIUS) * 0.5 + 0.5;
      const cx = u * PUDDLE_CANVAS_SIZE;
      const cy = v * PUDDLE_CANVAS_SIZE;
      const rPx = (radiusWorld / (TABLE_RADIUS * 2)) * PUDDLE_CANVAS_SIZE;
      const grad = puddleCtx.createRadialGradient(cx, cy, 0, cx, cy, rPx);
      grad.addColorStop(0, `rgba(47,143,224,${alpha})`);
      grad.addColorStop(1, 'rgba(47,143,224,0)');
      puddleCtx.fillStyle = grad;
      puddleCtx.beginPath();
      puddleCtx.arc(cx, cy, rPx, 0, Math.PI * 2);
      puddleCtx.fill();
      puddleTexture.needsUpdate = true;
    }
    function clearPuddles() {
      puddleCtx.clearRect(0, 0, PUDDLE_CANVAS_SIZE, PUDDLE_CANVAS_SIZE);
      puddleTexture.needsUpdate = true;
    }

    /* ---- Bowl: hand-thrown ceramic, Lathe profile ----
       Scalloped/wavy rim, thin gold rim trim, hammered exterior bump map,
       gold "kintsugi" crackle veining glazed into the white interior — all
       procedural (canvas textures + geometry perturbation), no image assets. */
    function buildBowlProfile(): THREE.Vector2[] {
      return [
        new THREE.Vector2(0.0, -0.95),
        new THREE.Vector2(0.55, -0.95),
        new THREE.Vector2(1.15, -0.55),
        new THREE.Vector2(1.42, 0.05),
        new THREE.Vector2(1.48, 0.35),
        new THREE.Vector2(1.40, 0.38),
        new THREE.Vector2(1.32, 0.30),
        new THREE.Vector2(1.08, -0.35),
        new THREE.Vector2(0.52, -0.72),
        new THREE.Vector2(0.0, -0.72),
      ];
    }
    const bowlProfile = buildBowlProfile();

    function scallopRim(geo: THREE.BufferGeometry, profile: THREE.Vector2[]) {
      const RIM_PEAK_Y = 0.35, TAPER_START_Y = 0.0;
      const WOBBLE_AMPLITUDE = 0.045, LOBES = 9;
      const pos = geo.attributes.position;
      const profileLen = profile.length;
      for (let i = 0; i < pos.count; i++) {
        const y = profile[i % profileLen].y;
        const taper = THREE.MathUtils.clamp((y - TAPER_START_Y) / (RIM_PEAK_Y - TAPER_START_Y), 0, 1);
        if (taper <= 0) continue;
        const x = pos.getX(i), z = pos.getZ(i);
        const r = Math.sqrt(x * x + z * z);
        if (r < 1e-6) continue;
        const theta = Math.atan2(z, x);
        const newR = r + Math.sin(theta * LOBES) * WOBBLE_AMPLITUDE * taper;
        pos.setX(i, Math.cos(theta) * newR);
        pos.setZ(i, Math.sin(theta) * newR);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    function paintRimGold(geo: THREE.BufferGeometry, profile: THREE.Vector2[]) {
      const RIM_PEAK_Y = 0.35, FADE_START_Y = 0.15;
      const GOLD = [0.9, 0.71, 0.32], WHITE = [1, 1, 1];
      const pos = geo.attributes.position;
      const profileLen = profile.length;
      const colors = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        const y = profile[i % profileLen].y;
        const t = THREE.MathUtils.clamp((y - FADE_START_Y) / (RIM_PEAK_Y - FADE_START_Y), 0, 1);
        colors[i * 3 + 0] = THREE.MathUtils.lerp(WHITE[0], GOLD[0], t);
        colors[i * 3 + 1] = THREE.MathUtils.lerp(WHITE[1], GOLD[1], t);
        colors[i * 3 + 2] = THREE.MathUtils.lerp(WHITE[2], GOLD[2], t);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    function makeHammeredBumpTexture(): THREE.Texture {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 140; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        const r = 6 + Math.random() * 14;
        const light = Math.random() > 0.5;
        const paintBlob = (bx: number) => {
          const grad = ctx.createRadialGradient(bx, y, 0, bx, y, r);
          grad.addColorStop(0, light ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)');
          grad.addColorStop(1, 'rgba(128,128,128,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(bx, y, r, 0, Math.PI * 2);
          ctx.fill();
        };
        paintBlob(x);
        if (x < r) paintBlob(x + size);
        if (x > size - r) paintBlob(x - size);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }

    function makeGoldVeinTexture(): THREE.Texture {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#f6f2ea';
      ctx.fillRect(0, 0, size, size);

      function drawCrack(x: number, y: number, angle: number, len: number, width: number) {
        if (len < 8 || width < 0.4) return;
        const steps = Math.max(3, Math.floor(len / 14));
        ctx.strokeStyle = 'rgba(196,150,60,0.9)';
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        let cx = x, cy = y, cAngle = angle;
        for (let s = 0; s < steps; s++) {
          cAngle += (Math.random() - 0.5) * 0.9;
          const stepLen = len / steps;
          cx += Math.cos(cAngle) * stepLen;
          cy += Math.sin(cAngle) * stepLen;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        if (len > 40 && Math.random() < 0.7) {
          drawCrack(cx, cy, cAngle + (Math.random() - 0.5) * 1.4, len * 0.55, width * 0.6);
        }
        drawCrack(cx, cy, cAngle + (Math.random() - 0.5) * 0.6, len * 0.6, width * 0.75);
      }

      const origins = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < origins; i++) {
        const x = size * 0.3 + Math.random() * size * 0.4;
        const y = size * 0.3 + Math.random() * size * 0.4;
        const branches = 3 + Math.floor(Math.random() * 3);
        for (let b = 0; b < branches; b++) {
          drawCrack(x, y, Math.random() * Math.PI * 2, 90 + Math.random() * 90, 3 + Math.random() * 2);
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }

    const bowlGroup = new THREE.Group();
    scene.add(bowlGroup);

    const bowlGeo = new THREE.LatheGeometry(bowlProfile, 64);
    scallopRim(bowlGeo, bowlProfile);
    paintRimGold(bowlGeo, bowlProfile);

    const hammeredBumpTexture = makeHammeredBumpTexture();
    const bowlMat = new THREE.MeshStandardMaterial({
      color: isDarkMode ? 0xdcd8ce : 0xf5f1e8,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide,
      vertexColors: true,
      bumpMap: hammeredBumpTexture,
      bumpScale: 0.006,
    });
    const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
    bowlMesh.castShadow = true;
    bowlMesh.receiveShadow = true;
    bowlGroup.add(bowlMesh);

    const innerGeo = bowlGeo.clone();
    const goldVeinTexture = makeGoldVeinTexture();
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.28,
      metalness: 0.08,
      side: THREE.BackSide,
      vertexColors: true,
      map: goldVeinTexture,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.scale.setScalar(0.985);
    bowlGroup.add(innerMesh);

    /* ---- Water surface: radial gradient (light center -> deep blue edge),
       spill-point-centered ripple ---- */
    const WATER_MAX_LEVEL_Y = 0.22;
    const WATER_MIN_LEVEL_Y = -0.85;
    const WATER_RADIUS = 1.28;

    const waterGeo = new THREE.CircleGeometry(WATER_RADIUS, 64, 64);
    const WATER_CENTER_COLOR = [0.35, 0.75, 0.95];
    const WATER_EDGE_COLOR = [0.07, 0.35, 0.72];
    const waterColors = new Float32Array(waterGeo.attributes.position.count * 3);
    for (let i = 0; i < waterGeo.attributes.position.count; i++) {
      const x = waterGeo.attributes.position.getX(i);
      const y = waterGeo.attributes.position.getY(i);
      const t = Math.min(1, Math.sqrt(x * x + y * y) / WATER_RADIUS);
      waterColors[i * 3 + 0] = THREE.MathUtils.lerp(WATER_CENTER_COLOR[0], WATER_EDGE_COLOR[0], t);
      waterColors[i * 3 + 1] = THREE.MathUtils.lerp(WATER_CENTER_COLOR[1], WATER_EDGE_COLOR[1], t);
      waterColors[i * 3 + 2] = THREE.MathUtils.lerp(WATER_CENTER_COLOR[2], WATER_EDGE_COLOR[2], t);
    }
    waterGeo.setAttribute('color', new THREE.BufferAttribute(waterColors, 3));

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.07,
      metalness: 0.0,
      transmission: 0.55,
      thickness: 0.6,
      ior: 1.33,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMap: skyEnvTexture,
      envMapIntensity: 1.4,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    bowlGroup.add(waterMesh);

    const waterPosAttr = waterGeo.attributes.position;
    const basePositions = (waterPosAttr.array as Float32Array).slice();

    function updateWaterMeshFromLevel(fillRatio: number) {
      const y = THREE.MathUtils.lerp(WATER_MIN_LEVEL_Y, WATER_MAX_LEVEL_Y, fillRatio);
      waterMesh.position.y += (y - waterMesh.position.y) * 0.15;
      const r = THREE.MathUtils.lerp(0.5, 1.0, fillRatio);
      waterMesh.scale.set(r, r, 1);
    }

    function rippleWater(t: number, turbulence: number, dirX: number, dirZ: number, originX: number, originZ: number) {
      const arr = waterPosAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        const x = basePositions[i];
        const y = basePositions[i + 1];
        const d = Math.sqrt(x * x + y * y);
        const baseline = Math.sin(d * 6 - t * 3.2) * 0.010 + Math.sin(x * 4 + t * 1.7) * 0.006;
        const dx = x - originX, dy = y - originZ;
        const dOrigin = Math.sqrt(dx * dx + dy * dy);
        const choppy = (Math.sin(dOrigin * 14 - t * 9.0) * 0.014 + Math.sin(dOrigin * 10 + t * 6.5) * 0.010) * turbulence;
        const slosh = (x * dirX + y * dirZ) * turbulence * 0.05;
        arr[i + 2] = baseline + choppy + slosh;
      }
      waterPosAttr.needsUpdate = true;
      waterGeo.computeVertexNormals();
    }

    /* ---- Splash particles + puddle stamping on landing ---- */
    const MAX_PARTICLES = 120;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(MAX_PARTICLES * 3);
    const partVel = new Float32Array(MAX_PARTICLES * 3);
    const partLife = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) partLife[i] = -1;
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0x8fc3ee, size: 0.05, transparent: true, opacity: 0.9, depthWrite: false,
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    function spawnSplash(worldX: number, worldZ: number, dirX: number, dirZ: number, amount: number) {
      let spawned = 0;
      for (let i = 0; i < MAX_PARTICLES && spawned < amount; i++) {
        if (partLife[i] > 0) continue;
        partLife[i] = 1.7 + Math.random() * 0.4;
        partPos[i * 3 + 0] = worldX + (Math.random() - 0.5) * 0.15;
        partPos[i * 3 + 1] = 0.15 + Math.random() * 0.1;
        partPos[i * 3 + 2] = worldZ + (Math.random() - 0.5) * 0.15;
        const spread = 1.2;
        partVel[i * 3 + 0] = dirX * 1.6 + (Math.random() - 0.5) * spread;
        partVel[i * 3 + 1] = 1.4 + Math.random() * 1.0;
        partVel[i * 3 + 2] = dirZ * 1.6 + (Math.random() - 0.5) * spread;
        spawned++;
      }
    }
    function updateParticles(dt: number) {
      for (let i = 0; i < MAX_PARTICLES; i++) {
        if (partLife[i] <= 0) continue;
        partLife[i] -= dt;
        partVel[i * 3 + 1] -= 4.2 * dt;
        partPos[i * 3 + 0] += partVel[i * 3 + 0] * dt;
        partPos[i * 3 + 1] += partVel[i * 3 + 1] * dt;
        partPos[i * 3 + 2] += partVel[i * 3 + 2] * dt;
        if (partPos[i * 3 + 1] < -1.05) {
          stampPuddle(partPos[i * 3 + 0], partPos[i * 3 + 2], 0.20 + Math.random() * 0.28, 0.4 + Math.random() * 0.25);
          partLife[i] = -1;
          partPos[i * 3 + 1] = -999;
        } else if (partLife[i] <= 0) {
          partPos[i * 3 + 1] = -999;
        }
      }
      partGeo.attributes.position.needsUpdate = true;
    }

    /* ---- Animation state ---- */
    let curRotX = 0;
    let curRotZ = 0;
    let waterTiltX = 0;
    let waterTiltZ = 0;
    let prevRotX = 0;
    let prevRotZ = 0;
    let turbulence = 0;
    let time = 0;
    let lastSplashTime = 0;
    let lastFillRatio = currentWaterLevel.current / 100;
    let lastFrameMs = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastFrameMs) / 1000);
      lastFrameMs = now;
      time += dt;

      // Bowl tilt: same rotation axes as the source game (X from vertical
      // input, Z from horizontal input), smoothly following the prop target.
      const targetRotX = targetTiltY.current * 0.45;
      const targetRotZ = -targetTiltX.current * 0.45;
      curRotX += (targetRotX - curRotX) * 0.15;
      curRotZ += (targetRotZ - curRotZ) * 0.15;
      bowlGroup.rotation.x = curRotX;
      bowlGroup.rotation.z = curRotZ;

      // Water lags the bowl slightly (child mesh local counter-tilt), same
      // as the source game's waterTiltX/Z follow.
      waterTiltX += (-curRotX * 0.3 - waterTiltX) * 0.12;
      waterTiltZ += (-curRotZ * 0.3 - waterTiltZ) * 0.12;

      // Fresh round detection: water jumping back up near full means a new
      // game started — clear the ground puddles from the last round.
      const fillRatio = Math.max(0, Math.min(1, currentWaterLevel.current / 100));
      if (fillRatio > 0.97 && lastFillRatio < 0.9) {
        clearPuddles();
      }
      lastFillRatio = fillRatio;

      updateWaterMeshFromLevel(fillRatio);

      // Turbulence: ramps up while spilling or being jerked, decays otherwise.
      const tiltAngularVel = dt > 0 ? Math.hypot(curRotX - prevRotX, curRotZ - prevRotZ) / dt : 0;
      const jerkTurbulence = Math.min(1, tiltAngularVel * 4);
      turbulence = Math.max(turbulence * 0.9, jerkTurbulence, isSpillingRef.current ? 0.6 : 0);
      prevRotX = curRotX;
      prevRotZ = curRotZ;

      const tiltMag = Math.hypot(curRotX, curRotZ);
      const dirX = tiltMag > 1e-6 ? -curRotZ / tiltMag : 0;
      const dirZ = tiltMag > 1e-6 ? curRotX / tiltMag : 0;
      const rimX = dirX * WATER_RADIUS * 0.9;
      const rimZ = dirZ * WATER_RADIUS * 0.9;

      rippleWater(time, turbulence, dirX, dirZ, rimX, rimZ);

      // Spill droplets, launched from the downhill rim point, throttled so
      // it reads as a steady trickle rather than a single amorphous burst.
      if (isSpillingRef.current && fillRatio > 0.02 && now - lastSplashTime > 90) {
        lastSplashTime = now;
        const worldPos = new THREE.Vector3(rimX, waterMesh.position.y, rimZ).applyEuler(bowlGroup.rotation);
        const worldDir = new THREE.Vector3(dirX, 0, dirZ).applyEuler(bowlGroup.rotation);
        const worldDirLen = Math.hypot(worldDir.x, worldDir.z) || 1;
        spawnSplash(worldPos.x, worldPos.z, worldDir.x / worldDirLen, worldDir.z / worldDirLen, 2);
      }
      updateParticles(dt);

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

    // Fits FIT_RADIUS inside the frustum in BOTH dimensions (not just
    // whichever axis a fixed reference aspect happened to assume) — the
    // previous version only ever ran on a window 'resize' event, so on
    // first load (no resize fired) the bowl rendered at zoom=1 with no
    // fitting at all, cropping badly in this narrower embedded card versus
    // the full-bleed screen this camera was originally tuned for.
    const fitCameraToContainer = (w: number, h: number) => {
      if (w <= 0 || h <= 0) return;
      const aspect = w / h;
      camera.aspect = aspect;
      const verticalZoom = (CAM_DISTANCE * Math.tan(CAM_FOV_RAD / 2)) / FIT_RADIUS;
      camera.zoom = verticalZoom * Math.min(1, aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    fitCameraToContainer(width, height);

    const handleResize = () => {
      if (!container) return;
      fitCameraToContainer(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        container.removeEventListener('pointermove', handlePointerMove);
        container.removeEventListener('touchmove', handlePointerMove);
      }
      // renderer.dispose() only frees the renderer's own internal WebGL
      // state; it does not touch the geometries/materials/textures created
      // above, and scene.clear() only detaches them from the scene graph --
      // neither actually releases their GPU-side memory. Left undisposed,
      // every fresh round (this effect re-runs per mount, keyed on
      // [interactive, isDarkMode]) permanently leaks a full set of these,
      // which was very likely the real cause behind this screen's mount
      // stalling/flickering after a few rounds.
      tableGeo.dispose();
      tableMat.dispose();
      puddleGeo.dispose();
      puddleMat.dispose();
      puddleTexture.dispose();
      skyEnvTexture.dispose();
      hammeredBumpTexture.dispose();
      goldVeinTexture.dispose();
      bowlGeo.dispose();
      bowlMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      waterGeo.dispose();
      waterMat.dispose();
      partGeo.dispose();
      partMat.dispose();

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
