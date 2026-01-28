<template>
  <div class="tool-card">
    <h2 class="tool-title">Solar System</h2>

    <div class="hint-row">
      <div class="hint">
        <div class="hint-title">说明</div>
        <div class="hint-text">
          点击“开始”后将请求摄像头权限，通过手部关键点控制视角移动并实时渲染太阳系背景。
          所有识别与渲染均在本地完成，不上传数据。
        </div>
      </div>
    </div>

    <div class="controls">
      <button class="btn" :disabled="running || loading" @click="start">
        {{ loading ? '初始化中...' : (running ? '运行中' : '开始') }}
      </button>
      <button class="btn secondary" :disabled="!running" @click="stop">
        停止
      </button>
      <label class="toggle">
        <input type="checkbox" v-model="showCameraPreview" :disabled="!running" />
        <span>显示摄像头预览</span>
      </label>
      <div class="status" v-if="statusText">{{ statusText }}</div>
    </div>

    <div v-if="error" class="error-box">
      {{ error }}
    </div>

    <div class="stage">
      <div class="render-wrap" ref="renderWrapRef">
        <canvas ref="canvasRef" class="render-canvas"></canvas>
        <div v-if="!running" class="stage-placeholder">
          点击“开始”启用摄像头并渲染
        </div>
      </div>

      <!-- 注意：video 必须始终挂载（Electron/浏览器在启动时需要拿到元素引用） -->
      <div class="preview" v-show="showCameraPreview">
        <video ref="videoRef" class="video" autoplay playsinline muted></video>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, nextTick } from 'vue';
import * as THREE from 'three';

type HandLandmarkerLike = {
  detectForVideo: (video: HTMLVideoElement, nowMs: number) => any;
  close?: () => void;
};

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const renderWrapRef = ref<HTMLDivElement | null>(null);

const running = ref(false);
const loading = ref(false);
const error = ref<string>('');
const statusText = ref<string>('');
const showCameraPreview = ref(false);

let mediaStream: MediaStream | null = null;
let rafId: number | null = null;
let resizeObserver: ResizeObserver | null = null;

// three.js runtime
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let solarGroup: THREE.Group | null = null;
let disposeBag: Array<() => void> = [];

// mediapipe runtime
let handLandmarker: HandLandmarkerLike | null = null;

// camera control (hand-driven)
let targetYaw = 0;
let targetPitch = 0;
let yaw = 0;
let pitch = 0;
let radius = 18;

const isElectronEnv = typeof window !== 'undefined' && (window as any).electron !== undefined;

function isLocalhostHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function setError(msg: string) {
  error.value = msg;
  statusText.value = '';
}

function clearError() {
  error.value = '';
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

async function initHandLandmarker() {
  // 动态 import，避免非 Electron 环境引入过重依赖
  const vision = await import('@mediapipe/tasks-vision');
  const { FilesetResolver, HandLandmarker } = vision;

  // 注意：这里使用 CDN wasm 与 model，后续如需离线可改为打包到本地文件
  const fileset = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
  );

  const landmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 1,
  });

  handLandmarker = landmarker as unknown as HandLandmarkerLike;
}

function buildSolarSystem() {
  if (!scene) return;

  solarGroup = new THREE.Group();
  scene.add(solarGroup);

  // lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  const sunLight = new THREE.PointLight(0xffffff, 2.2, 200);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // starfield background
  const starGeo = new THREE.BufferGeometry();
  const starCount = 1500;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 120 * Math.random() + 30;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({ color: 0x9bdcff, size: 0.4, sizeAttenuation: true });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  disposeBag.push(() => {
    starGeo.dispose();
    starMat.dispose();
  });

  // sun
  const sunGeo = new THREE.SphereGeometry(2.5, 32, 32);
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0xffd54a,
    emissive: 0xffa000,
    emissiveIntensity: 1.2,
    metalness: 0.0,
    roughness: 0.4,
  });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  solarGroup.add(sun);
  disposeBag.push(() => {
    sunGeo.dispose();
    sunMat.dispose();
  });

  // planets (simple)
  const planets: Array<{
    mesh: THREE.Mesh;
    orbitRadius: number;
    speed: number;
    tilt: number;
    phase: number;
  }> = [];

  const planetDefs = [
    { r: 0.6, orbit: 5.0, color: 0xb0bec5, speed: 1.4 },
    { r: 0.8, orbit: 7.2, color: 0xffcc80, speed: 1.1 },
    { r: 0.9, orbit: 9.6, color: 0x64b5f6, speed: 0.95 },
    { r: 0.7, orbit: 12.4, color: 0xff8a65, speed: 0.8 },
    { r: 1.5, orbit: 16.8, color: 0xfff59d, speed: 0.55 },
    { r: 1.3, orbit: 21.5, color: 0xb39ddb, speed: 0.45 },
  ];

  planetDefs.forEach((p, idx) => {
    const geo = new THREE.SphereGeometry(p.r, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: p.color,
      metalness: 0.0,
      roughness: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    solarGroup!.add(mesh);
    planets.push({
      mesh,
      orbitRadius: p.orbit,
      speed: p.speed,
      tilt: (idx % 2 === 0 ? 1 : -1) * (0.08 + idx * 0.01),
      phase: Math.random() * Math.PI * 2,
    });
    disposeBag.push(() => {
      geo.dispose();
      mat.dispose();
    });

    // orbit ring
    const ringGeo = new THREE.RingGeometry(p.orbit - 0.01, p.orbit + 0.01, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22304a,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    solarGroup!.add(ring);
    disposeBag.push(() => {
      ringGeo.dispose();
      ringMat.dispose();
    });
  });

  const updatePlanets = (t: number) => {
    for (const p of planets) {
      const a = t * 0.25 * p.speed + p.phase;
      p.mesh.position.set(
        Math.cos(a) * p.orbitRadius,
        Math.sin(a * 0.7) * p.tilt,
        Math.sin(a) * p.orbitRadius
      );
      p.mesh.rotation.y = a * 2.0;
    }
    sun.rotation.y = t * 0.2;
  };

  return updatePlanets;
}

function initThree() {
  const canvas = canvasRef.value;
  const wrap = renderWrapRef.value;
  if (!canvas || !wrap) return;

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070b18, 0.012);

  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
  camera.position.set(0, 8, radius);

  const updatePlanets = buildSolarSystem();

  const resize = () => {
    if (!renderer || !camera || !wrap) return;
    const w = Math.max(1, wrap.clientWidth);
    const h = Math.max(1, wrap.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  resize();
  resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(wrap);

  // animate
  let lastDetect = 0;
  const detectIntervalMs = 1000 / 24;

  const tick = (now: number) => {
    if (!running.value || !renderer || !scene || !camera) return;

    // hand detection throttled
    if (handLandmarker && videoRef.value && videoRef.value.readyState >= 2) {
      if (now - lastDetect >= detectIntervalMs) {
        lastDetect = now;
        try {
          const res = handLandmarker.detectForVideo(videoRef.value, now);
          const landmarks = res?.landmarks?.[0];
          if (landmarks && landmarks[8]) {
            const x = landmarks[8].x; // 0..1
            const y = landmarks[8].y; // 0..1
            targetYaw = clamp((x - 0.5) * Math.PI * 1.2, -1.2, 1.2);
            targetPitch = clamp((0.5 - y) * Math.PI * 0.7, -0.9, 0.9);
            statusText.value = '已识别到手势，控制视角中';
          } else {
            statusText.value = '未检测到手部（把手放到摄像头前）';
          }
        } catch (e: any) {
          // 识别失败不打断渲染
          statusText.value = '识别中...';
        }
      }
    }

    // smooth camera orbit
    yaw += (targetYaw - yaw) * 0.12;
    pitch += (targetPitch - pitch) * 0.12;
    const px = Math.sin(yaw) * Math.cos(pitch) * radius;
    const py = Math.sin(pitch) * radius * 0.65 + 6;
    const pz = Math.cos(yaw) * Math.cos(pitch) * radius;
    camera.position.set(px, py, pz);
    camera.lookAt(0, 0, 0);

    if (updatePlanets) updatePlanets(now / 1000);

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  disposeBag.push(() => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  });
  disposeBag.push(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  });
  disposeBag.push(() => {
    renderer?.dispose();
    renderer = null;
  });
  disposeBag.push(() => {
    scene?.clear();
    scene = null;
  });
  disposeBag.push(() => {
    // camera is GC-managed
    camera = null;
  });
  disposeBag.push(() => {
    solarGroup = null;
  });
}

async function start() {
  if (running.value || loading.value) return;
  clearError();
  loading.value = true;
  statusText.value = '请求摄像头权限...';

  try {
    // 浏览器环境基础能力检查
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('当前环境不支持摄像头（缺少 navigator.mediaDevices.getUserMedia）');
    }
    // 浏览器要求安全上下文（HTTPS 或 localhost）；Electron(file://) 不受此限制
    if (!isElectronEnv && !window.isSecureContext && !isLocalhostHost(window.location.hostname)) {
      throw new Error('浏览器需要 HTTPS（或 localhost）才能访问摄像头，请使用 https 访问该页面');
    }

    // Electron/macOS：先主动触发系统摄像头授权，避免 getUserMedia 卡住无反馈
    if (isElectronEnv && (window as any).electron?.media?.getCameraStatus) {
      const status = await (window as any).electron.media.getCameraStatus();
      if (status !== 'granted') {
        statusText.value = '请求系统摄像头权限...';
        const ok = await (window as any).electron.media.askForCameraAccess();
        if (!ok) {
          throw new Error('未获得摄像头权限。请到“系统设置 → 隐私与安全性 → 摄像头”中允许 DevTools Suite。');
        }
      }
    }

    let video = videoRef.value;
    if (!video) {
      // 等待模板渲染完成（确保 videoRef 可用）
      await nextTick();
      video = videoRef.value;
    }
    if (!video) throw new Error('视频元素未就绪');

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
      audio: false,
    });
    video.srcObject = mediaStream;
    await video.play();

    statusText.value = '加载手势模型...';
    await initHandLandmarker();

    statusText.value = '初始化渲染...';
    initThree();

    running.value = true;
    statusText.value = '运行中';
  } catch (e: any) {
    setError(`启动失败：${e?.message || e}`);
    await stop();
  } finally {
    loading.value = false;
  }
}

async function stop() {
  running.value = false;
  loading.value = false;
  statusText.value = '';

  try {
    if (rafId) cancelAnimationFrame(rafId);
  } catch {}
  rafId = null;

  // stop camera
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
  if (videoRef.value) {
    try {
      videoRef.value.pause();
    } catch {}
    videoRef.value.srcObject = null;
  }

  // close mediapipe
  try {
    handLandmarker?.close?.();
  } catch {}
  handLandmarker = null;

  // dispose three resources
  const bag = disposeBag;
  disposeBag = [];
  for (const d of bag.reverse()) {
    try {
      d();
    } catch {}
  }
}

onBeforeUnmount(() => {
  stop();
});
</script>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 12px 0 16px;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.status {
  color: var(--text-tertiary);
  font-size: 13px;
}

.error-box {
  margin: 12px 0;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(244, 67, 54, 0.35);
  background: rgba(244, 67, 54, 0.08);
  color: #f44336;
  font-size: 13px;
}

.stage {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.render-wrap {
  position: relative;
  width: 100%;
  height: calc(100vh - 260px);
  min-height: 420px;
  border-radius: 12px;
  background: radial-gradient(1200px 600px at 40% 20%, rgba(80, 120, 255, 0.14), transparent 60%),
    linear-gradient(180deg, rgba(9, 12, 24, 0.95), rgba(7, 10, 18, 0.95));
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.render-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.stage-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 14px;
  pointer-events: none;
}

.preview {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px;
}

.video {
  width: 100%;
  max-height: 240px;
  border-radius: 8px;
  background: #000;
}

.hint-row {
  margin-top: 8px;
}

.hint {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px 14px;
}

.hint-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  font-size: 14px;
}

.hint-text {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}
</style>
