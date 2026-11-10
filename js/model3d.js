/* ==========================================================================
   Visor 3D interactivo – Terminal Intermunicipal de Vélez
   Three.js (ES modules vía CDN + import map). Unidades: 1 unidad = 1 cm de maqueta.
   El modelo es una representación conceptual construida con geometrías a partir
   de la distribución de la planta de referencia (no es un modelo a escala exacta).
   ========================================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SPACES, SPACE_BY_ID, BOARD, PLATFORM_ANGLE, PLATFORM_SIZE } from './spaces.js';
import { buildInteriors } from './interiors.js';

const BW = BOARD.largo;   // 70
const BD = BOARD.ancho;   // 60
const wx = x => x - BW / 2;
const wz = z => z - BD / 2;
const DEG = Math.PI / 180;
const HIGHLIGHT = 0x1f9d63;
const WALL_T = 0.14;
const CUT_HEIGHT = 1.15;

const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------------------
   Calidad gráfica según el dispositivo (se puede forzar con ?q=low|mid|high)
--------------------------------------------------------------------------- */
export function detectQuality() {
  const forced = new URLSearchParams(location.search).get('q');
  if (forced === 'low' || forced === 'mid' || forced === 'high') return forced;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const mem = navigator.deviceMemory;
  if (mem && mem <= 2) return 'low';
  if (coarse) return mem && mem <= 4 ? 'low' : 'mid';
  return 'high';
}

const QUALITY = {
  low: { dpr: 1.25, shadows: false, shadowSize: 0, tex: 1536, tiles: false, treeStep: 1.6 },
  mid: { dpr: 1.75, shadows: true, shadowSize: 1024, tex: 2048, tiles: true, treeStep: 1.15 },
  high: { dpr: 2, shadows: true, shadowSize: 2048, tex: 2048, tiles: true, treeStep: 1 }
};

/* Puertas (vanos) en planta: ['h', z, xCentro, ancho] o ['v', x, zCentro, ancho] */
const DOORS = [
  ['h', 12.6, 26.0, 2.2], ['h', 12.6, 43.4, 2.2],   // sala → andén de plataformas
  ['h', 12.6, 15.3, 1.6],                           // equipajes → andén
  ['h', 12.6, 53.0, 1.4],                           // conductores → andén
  ['v', 21.0, 16.2, 1.4], ['v', 21.0, 24.4, 1.4],   // sala ↔ equipajes / sanitarios
  ['v', 48.4, 15.7, 1.4], ['v', 48.4, 27.0, 1.4],   // sala ↔ conductores / alimentación
  ['h', 29.0, 35.0, 7.0],                           // sala ↔ vestíbulo
  ['h', 18.8, 52.9, 1.2], ['h', 18.8, 61.7, 1.0],   // conductores ↔ descanso / baños
  ['v', 57.4, 21.8, 1.0],                           // descanso ↔ baños
  ['v', 25.8, 34.0, 1.6],                           // vestíbulo ↔ taquillas
  ['h', 37.6, 35.0, 3.2],                           // vestíbulo ↔ plaza
  ['h', 37.6, 18.4, 1.4],                           // taquillas → exterior
  ['h', 37.6, 47.9, 1.2], ['h', 37.6, 53.4, 1.2], ['h', 37.6, 58.8, 1.2], ['h', 37.6, 64.3, 1.2] // locales
];
const GLASS_SIDES = { sala: ['n'], vestibulo: ['s'], local1: ['s'], local2: ['s'], local3: ['s'], local4: ['s'] };

/* ---------------------------------------------------------------------------
   Textura del terreno (vías, andenes, parqueaderos, plaza, demarcaciones)
--------------------------------------------------------------------------- */
function paintGround(texW) {
  const k = texW / BW;
  const texH = Math.round(BD * k);
  const c = document.createElement('canvas');
  c.width = texW; c.height = texH;
  const g = c.getContext('2d');
  const P = v => v * k;
  const rnd = mulberry32(11);

  const rrect = (x0, z0, x1, z1, r = 0) => {
    const [tl, tr, br, bl] = Array.isArray(r) ? r : [r, r, r, r];
    g.moveTo(P(x0 + tl), P(z0));
    g.lineTo(P(x1 - tr), P(z0));
    g.arcTo(P(x1), P(z0), P(x1), P(z0 + tr), P(tr));
    g.lineTo(P(x1), P(z1 - br));
    g.arcTo(P(x1), P(z1), P(x1 - br), P(z1), P(br));
    g.lineTo(P(x0 + bl), P(z1));
    g.arcTo(P(x0), P(z1), P(x0), P(z1 - bl), P(bl));
    g.lineTo(P(x0), P(z0 + tl));
    g.arcTo(P(x0), P(z0), P(x0 + tl), P(z0), P(tl));
    g.closePath();
  };
  const fillShape = (fn, color) => { g.beginPath(); fn(); g.fillStyle = color; g.fill(); };
  const speckle = (count, colors, sizeMax) => {
    for (let i = 0; i < count; i++) {
      g.fillStyle = colors[(rnd() * colors.length) | 0];
      const s = 1 + rnd() * sizeMax;
      g.fillRect(rnd() * texW, rnd() * texH, s, s);
    }
  };

  // 1 · Césped base
  g.fillStyle = '#86A85E';
  g.fillRect(0, 0, texW, texH);
  speckle(texW * 5, ['rgba(52,96,38,0.20)', 'rgba(190,214,130,0.18)', 'rgba(70,118,48,0.16)'], k * 0.09);

  // 2 · Andenes y plataforma de la edificación (concreto)
  fillShape(() => rrect(9.0, 11.6, 67.6, 38.4, [0, 0, 0, 0]), '#D7D3CA');
  // Plaza peatonal (adoquín)
  fillShape(() => rrect(22.9, 37.6, 45.1, 42.8), '#E3D6BD');

  // 3 · Asfalto con bordillos
  const roads = [
    () => rrect(5.6, 3.2, 67.6, 11.6, [4.5, 3.0, 0, 0]),   // patio de buses
    () => rrect(5.6, 7.0, 9.0, 60.0),                       // vía izquierda (entrada)
    () => rrect(9.0, 38.4, 22.9, 42.6),                     // vía frontal izquierda
    () => rrect(9.0, 42.6, 64.0, 55.6, [0, 0, 2.2, 2.2]),  // parqueaderos
    () => rrect(45.1, 38.4, 68.0, 42.6, [0, 2.0, 0, 0]),   // vía frontal derecha
    () => rrect(64.0, 38.4, 68.0, 60.0)                     // vía derecha (salida)
  ];
  g.lineJoin = 'round';
  g.strokeStyle = '#C9C4B9';
  g.lineWidth = P(0.7);
  roads.forEach(fn => { g.beginPath(); fn(); g.stroke(); });
  g.fillStyle = '#4A4F57';
  roads.forEach(fn => { g.beginPath(); fn(); g.fill(); });
  g.save();
  g.beginPath(); roads.forEach(fn => fn()); g.clip();
  speckle(texW * 3, ['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.08)'], k * 0.06);
  g.restore();

  // Plaza redibujada por encima del borde del parqueadero + retícula
  fillShape(() => rrect(22.9, 37.6, 45.1, 42.8), '#E3D6BD');
  g.strokeStyle = 'rgba(150,130,95,0.35)';
  g.lineWidth = Math.max(1, P(0.04));
  g.beginPath();
  for (let x = 23.9; x < 45.1; x += 1.0) { g.moveTo(P(x), P(37.6)); g.lineTo(P(x), P(42.8)); }
  for (let z = 38.6; z < 42.8; z += 1.0) { g.moveTo(P(22.9), P(z)); g.lineTo(P(45.1), P(z)); }
  g.stroke();

  // 4 · Jardineras sobre el asfalto y franjas verdes
  const planters = [
    [9.3, 42.9, 13.2, 47.2], [9.3, 51.2, 13.2, 55.3],
    [42.75, 42.9, 45.25, 47.2], [42.75, 51.2, 45.25, 55.3],
    [61.4, 42.9, 63.8, 47.2], [61.4, 51.2, 63.8, 55.3],
    [9.3, 29.2, 10.9, 38.1], [9.8, 29.25, 25.6, 30.35], [44.4, 29.25, 65.8, 30.35]
  ];
  planters.forEach(([a, b, c2, d]) => {
    g.beginPath(); rrect(a, b, c2, d, 0.5);
    g.fillStyle = '#7FA257'; g.fill();
    g.strokeStyle = '#CFCABF'; g.lineWidth = P(0.25); g.stroke();
  });

  // 5 · Zona de taxis (acopio y bahía)
  [[0.6, 24.0, 5.6, 40.4], [0.6, 42.2, 5.6, 57.8]].forEach(([a, b, c2, d]) => {
    g.beginPath(); rrect(a, b, c2, d, [2.0, 0, 0, 2.0]);
    g.fillStyle = '#D4CDBC'; g.fill();
    g.strokeStyle = '#C3BDB0'; g.lineWidth = P(0.35); g.stroke();
    g.strokeStyle = '#E2B43A'; g.lineWidth = P(0.13);
    g.beginPath();
    for (let z = b + 1.6; z < d - 0.6; z += 2.6) { g.moveTo(P(a + 0.5), P(z)); g.lineTo(P(c2 - 0.35), P(z)); }
    g.moveTo(P(c2 - 0.35), P(b + 1.6)); g.lineTo(P(c2 - 0.35), P(d - 1.0));
    g.stroke();
    g.fillStyle = '#C99A1E';
    g.font = `800 ${P(0.85)}px Inter, Arial, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('TAXI', P((a + c2) / 2 + 0.3), P(b + 0.85));
  });

  // 6 · Demarcación vial
  const white = 'rgba(245,245,240,0.92)';
  const dash = (x0, z0, x1, z1, on = 1.0, off = 0.8, w = 0.12, color = white) => {
    g.strokeStyle = color; g.lineWidth = P(w); g.setLineDash([P(on), P(off)]);
    g.beginPath(); g.moveTo(P(x0), P(z0)); g.lineTo(P(x1), P(z1)); g.stroke(); g.setLineDash([]);
  };
  const line = (x0, z0, x1, z1, w = 0.12, color = white) => {
    g.strokeStyle = color; g.lineWidth = P(w);
    g.beginPath(); g.moveTo(P(x0), P(z0)); g.lineTo(P(x1), P(z1)); g.stroke();
  };
  dash(7.3, 13.0, 7.3, 57.6);
  dash(9.6, 40.5, 22.5, 40.5);
  dash(45.6, 40.5, 63.4, 40.5);
  dash(66.0, 43.2, 66.0, 57.6);
  dash(10.5, 7.4, 66.5, 7.4, 1.0, 0.8, 0.1, 'rgba(245,245,240,0.35)');

  // Pasos peatonales
  const zebraH = (x0, x1, z0, z1) => { for (let z = z0; z < z1; z += 0.7) { g.fillStyle = white; g.fillRect(P(x0), P(z), P(x1 - x0), P(0.35)); } };
  const zebraV = (z0, z1, x0, x1) => { for (let x = x0; x < x1; x += 0.7) { g.fillStyle = white; g.fillRect(P(x), P(z0), P(0.35), P(z1 - z0)); } };
  zebraH(19.6, 21.6, 38.7, 42.4);
  zebraH(46.0, 48.0, 38.7, 42.4);
  zebraV(58.5, 59.9, 5.8, 9.0);
  zebraV(58.5, 59.9, 64.2, 68.0);

  // Celdas de parqueo
  g.strokeStyle = white; g.lineWidth = P(0.11);
  g.beginPath();
  for (let n = 0; n <= 11; n++) {
    const x = 13.4 + n * 2.65;
    g.moveTo(P(x), P(42.7)); g.lineTo(P(x), P(47.2));
    g.moveTo(P(x), P(51.2)); g.lineTo(P(x), P(55.5));
  }
  g.moveTo(P(13.4), P(47.2)); g.lineTo(P(42.55), P(47.2));
  g.moveTo(P(13.4), P(51.2)); g.lineTo(P(42.55), P(51.2));
  for (let n = 0; n <= 12; n++) {
    const x = 45.4 + n * 1.3;
    g.moveTo(P(x), P(42.7)); g.lineTo(P(x), P(45.8));
    g.moveTo(P(x), P(52.4)); g.lineTo(P(x), P(55.5));
  }
  g.stroke();

  // Flechas de circulación
  const arrow = (x, z, angDeg, len = 2.2) => {
    g.save(); g.translate(P(x), P(z)); g.rotate(angDeg * DEG); g.fillStyle = white;
    const L = P(len), Wd = P(0.32), H = P(0.75);
    g.beginPath();
    g.moveTo(-L / 2, -Wd / 2); g.lineTo(L / 2 - H, -Wd / 2); g.lineTo(L / 2 - H, -H * 0.7);
    g.lineTo(L / 2, 0); g.lineTo(L / 2 - H, H * 0.7); g.lineTo(L / 2 - H, Wd / 2); g.lineTo(-L / 2, Wd / 2);
    g.closePath(); g.fill(); g.restore();
  };
  arrow(8.15, 52, -90); arrow(8.15, 30, -90); arrow(6.45, 20, 90);
  arrow(15.5, 41.5, 0); arrow(55, 41.5, 0); arrow(66.9, 50, 90); arrow(65.1, 54, 90);
  arrow(36.6, 4.9, 0, 2.6); arrow(28, 49.2, 0); arrow(53, 49.2, 0);

  // Plataformas: líneas inclinadas, borde amarillo del andén y rótulos B1–B6
  const a = PLATFORM_ANGLE * DEG;
  const dir = [Math.sin(a), Math.cos(a)];          // del fondo hacia el andén
  const perp = [Math.cos(a), -Math.sin(a)];
  const plat = SPACE_BY_ID.plataformas;
  g.strokeStyle = white; g.lineWidth = P(0.13);
  plat.partes.forEach(p => {
    [-1, 1].forEach(sgn => {
      const ox = p.cx + perp[0] * 2.05 * sgn, oz = p.cz + perp[1] * 2.05 * sgn;
      g.beginPath();
      g.moveTo(P(ox - dir[0] * 4.4), P(oz - dir[1] * 4.4));
      g.lineTo(P(ox + dir[0] * 4.15), P(oz + dir[1] * 4.15));
      g.stroke();
    });
  });
  line(9.4, 11.45, 66.4, 11.45, 0.16, '#E7B73A');
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.font = `800 ${P(1.25)}px Manrope, Inter, Arial, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  plat.partes.forEach(p => g.fillText(p.id, P(p.cx - 1.75), P(9.35)));

  return c;
}

/* Textura de baldosa para pisos interiores */
function tileTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(120,110,95,0.28)'; g.lineWidth = 2;
  g.strokeRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* Utilidad: caja con base en y0 */
function boxAt(x0, z0, x1, z1, y0, h) {
  const geo = new THREE.BoxGeometry(Math.abs(x1 - x0), h, Math.abs(z1 - z0));
  geo.translate(wx((x0 + x1) / 2), y0 + h / 2, wz((z0 + z1) / 2));
  return geo;
}

/* Pinta todas las caras de una geometría con un color (atributo color) */
function paintGeometry(geo, color, faceColors) {
  const count = geo.attributes.position.count;
  const arr = new Float32Array(count * 3);
  const base = new THREE.Color(color);
  for (let i = 0; i < count; i++) {
    let col = base;
    if (faceColors) {
      const face = Math.floor(i / 4); // BoxGeometry: 4 vértices por cara, orden px,nx,py,ny,pz,nz
      if (faceColors[face]) col = faceColors[face];
    }
    arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}

/* ===========================================================================
   createViewer
=========================================================================== */
export async function createViewer(stage, options = {}) {
  const qualityName = options.quality || detectQuality();
  const Q = { ...QUALITY[qualityName] };
  const listeners = {};
  const emit = (ev, data) => (listeners[ev] || []).forEach(fn => fn(data));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  /* ---------- Renderer, escena, cámara ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.dpr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = Q.shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.className = 'viewer__canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Modelo 3D interactivo de la terminal. Usa los botones del visor o la lista de espacios para navegar.');
  stage.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 900);
  camera.position.set(60, 70, 80);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.085;
  controls.rotateSpeed = coarsePointer ? 0.75 : 0.6;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.9;
  controls.screenSpacePanning = false;
  controls.minDistance = 10;
  controls.maxDistance = 330;
  controls.maxPolarAngle = 84 * DEG;
  controls.target.set(0, 0, 2);
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

  /* ---------- Luces ---------- */
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9ae96, 1.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6e8, 1.65);
  sun.position.set(-34, 70, 42);
  sun.target.position.set(0, 0, 0);
  scene.add(sun, sun.target);
  if (Q.shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(Q.shadowSize, Q.shadowSize);
    const sc = sun.shadow.camera;
    sc.left = -46; sc.right = 46; sc.top = 44; sc.bottom = -44; sc.near = 20; sc.far = 170;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
  }

  /* ---------- Base y terreno ---------- */
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x272b31 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.8, 1.6, BD + 0.8), baseMat);
  base.position.y = -0.85;
  scene.add(base);

  const groundCanvas = paintGround(Q.tex);
  const groundTex = new THREE.CanvasTexture(groundCanvas);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  groundTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(BW, BD), new THREE.MeshLambertMaterial({ map: groundTex }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = Q.shadows;
  scene.add(ground);

  /* ---------- Grupos ---------- */
  const building = new THREE.Group(); building.name = 'edificacion';
  const roofGroup = new THREE.Group(); roofGroup.name = 'cubierta';
  const exterior = new THREE.Group(); exterior.name = 'exterior';
  const hitGroup = new THREE.Group(); hitGroup.name = 'zonas-seleccionables';
  const overlayGroup = new THREE.Group(); overlayGroup.name = 'resaltado';
  scene.add(building, roofGroup, exterior, hitGroup, overlayGroup);

  const rooms = SPACES.filter(s => s.tipo === 'room');
  const MAX_H = Math.max(...rooms.map(r => r.altura));

  /* ---------- Pisos (un material por recinto para poder resaltarlo) ---------- */
  const tileTex = Q.tiles ? tileTexture() : null;
  const floorMeshes = {};
  rooms.forEach(room => {
    const [x0, z0, x1, z1] = room.rects[0];
    let map = null;
    if (tileTex) {
      map = tileTex.clone();
      map.needsUpdate = true;
      map.repeat.set((x1 - x0) / 1.0, (z1 - z0) / 1.0);
    }
    const mat = new THREE.MeshLambertMaterial({ color: room.piso, map, emissive: 0x000000 });
    const mesh = new THREE.Mesh(boxAt(x0, z0, x1, z1, 0, 0.12), mat);
    mesh.receiveShadow = Q.shadows;
    building.add(mesh);
    floorMeshes[room.id] = mesh;
  });

  /* ---------- Muros (fusionados en una sola malla con colores por vértice) ---------- */
  const cInner = new THREE.Color('#F3EFE8');
  const cTop = new THREE.Color('#E6E0D5');
  const cFacade = new THREE.Color('#C49A6E');
  const wallGeos = [];
  const glassGeos = [];
  const windowPanes = [];

  const sharesEdge = (self, horiz, line, mid, sideSign) => rooms.some(o => {
    if (o === self) return false;
    const [ox0, oz0, ox1, oz1] = o.rects[0];
    if (horiz) {
      const edge = sideSign < 0 ? oz1 : oz0; // vecino al norte usa su borde sur
      return Math.abs(edge - line) < 0.05 && mid > ox0 + 0.01 && mid < ox1 - 0.01;
    }
    const edge = sideSign < 0 ? ox1 : ox0;
    return Math.abs(edge - line) < 0.05 && mid > oz0 + 0.01 && mid < oz1 - 0.01;
  });

  rooms.forEach(room => {
    const [x0, z0, x1, z1] = room.rects[0];
    const H = room.altura;
    const glassSides = GLASS_SIDES[room.id] || [];
    const sides = [
      { s: 'n', horiz: true, line: z0, a: x0, b: x1, inward: 1, outerFace: 5, sign: -1 },
      { s: 's', horiz: true, line: z1, a: x0, b: x1, inward: -1, outerFace: 4, sign: 1 },
      { s: 'w', horiz: false, line: x0, a: z0 + WALL_T, b: z1 - WALL_T, inward: 1, outerFace: 1, sign: -1 },
      { s: 'e', horiz: false, line: x1, a: z0 + WALL_T, b: z1 - WALL_T, inward: -1, outerFace: 0, sign: 1 }
    ];
    sides.forEach(side => {
      const gaps = DOORS
        .filter(d => (side.horiz ? d[0] === 'h' : d[0] === 'v') && Math.abs(d[1] - side.line) < 0.05 && d[2] > side.a && d[2] < side.b)
        .map(d => [d[2] - d[3] / 2, d[2] + d[3] / 2])
        .sort((p, q) => p[0] - q[0]);
      const segs = [];
      let cur = side.a;
      gaps.forEach(([ga, gb]) => { if (ga > cur) segs.push([cur, Math.min(ga, side.b)]); cur = Math.max(cur, gb); });
      if (cur < side.b) segs.push([cur, side.b]);

      segs.forEach(([sa, sb]) => {
        const len = sb - sa;
        if (len < 0.05) return;
        const mid = (sa + sb) / 2;
        const isGlass = glassSides.includes(side.s);
        const ext = !sharesEdge(room, side.horiz, side.line, mid, side.sign);
        const off = side.inward * WALL_T / 2;
        let geo;
        if (side.horiz) {
          geo = new THREE.BoxGeometry(len, H, WALL_T);
          geo.translate(wx(mid), H / 2, wz(side.line + off));
        } else {
          geo = new THREE.BoxGeometry(WALL_T, H, len);
          geo.translate(wx(side.line + off), H / 2, wz(mid));
        }
        if (isGlass) {
          // zócalo opaco + vidrio
          const plinth = side.horiz ? boxAt(sa, side.line + off - WALL_T / 2, sb, side.line + off + WALL_T / 2, 0, 0.35)
            : boxAt(side.line + off - WALL_T / 2, sa, side.line + off + WALL_T / 2, sb, 0, 0.35);
          wallGeos.push(paintGeometry(plinth, cTop));
          const top = side.horiz ? boxAt(sa, side.line + off - WALL_T / 2, sb, side.line + off + WALL_T / 2, H - 0.3, 0.3)
            : boxAt(side.line + off - WALL_T / 2, sa, side.line + off + WALL_T / 2, sb, H - 0.3, 0.3);
          wallGeos.push(paintGeometry(top, cFacade));
          const glass = side.horiz ? boxAt(sa, side.line + off - 0.03, sb, side.line + off + 0.03, 0.35, H - 0.65)
            : boxAt(side.line + off - 0.03, sa, side.line + off + 0.03, sb, 0.35, H - 0.65);
          glassGeos.push(glass);
          // montantes
          const n = Math.max(1, Math.round(len / 1.6));
          for (let i = 0; i <= n; i++) {
            const p = sa + (len * i) / n;
            const m = side.horiz ? boxAt(p - 0.05, side.line + off - 0.06, p + 0.05, side.line + off + 0.06, 0.35, H - 0.65)
              : boxAt(side.line + off - 0.06, p - 0.05, side.line + off + 0.06, p + 0.05, 0.35, H - 0.65);
            wallGeos.push(paintGeometry(m, new THREE.Color('#5B6673')));
          }
          return;
        }
        const faces = [cInner, cInner, cTop, cInner, cInner, cInner];
        if (ext) faces[side.outerFace] = cFacade;
        wallGeos.push(paintGeometry(geo, null, faces));

        // ventanas en fachadas exteriores
        if (ext && len >= 2.4) {
          const yb = 1.25, yt = Math.min(H - 0.7, 2.6);
          const usable = len - 1.0;
          const n = Math.max(1, Math.round(usable / 2.2));
          const pw = usable / n - 0.45;
          for (let i = 0; i < n; i++) {
            const c0 = sa + 0.5 + (usable / n) * (i + 0.5);
            const outward = -side.inward;
            const faceLine = side.line + outward * 0.02;
            windowPanes.push({ horiz: side.horiz, c: c0, line: faceLine, w: pw, yb, yt });
          }
        }
      });
    });
  });

  const wallsGeo = mergeGeometries(wallGeos, false);
  const wallMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const walls = new THREE.Mesh(wallsGeo, wallMat);
  walls.castShadow = Q.shadows;
  walls.receiveShadow = Q.shadows;
  building.add(walls);
  const wallPosAttr = wallsGeo.attributes.position;
  const wallOrigY = Float32Array.from({ length: wallPosAttr.count }, (_, i) => wallPosAttr.getY(i));

  const glassMat = new THREE.MeshPhongMaterial({ color: 0x9fc3dc, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.32, depthWrite: false });
  const glassGeo = mergeGeometries(glassGeos, false);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.renderOrder = 2;
  building.add(glassMesh);
  const glassPosAttr = glassGeo.attributes.position;
  const glassOrigY = Float32Array.from({ length: glassPosAttr.count }, (_, i) => glassPosAttr.getY(i));

  // Ventanas (instanciadas)
  const paneMat = new THREE.MeshPhongMaterial({ color: 0x34485e, specular: 0x9fb4c8, shininess: 70 });
  const panes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), paneMat, windowPanes.length);
  const dummy = new THREE.Object3D();
  windowPanes.forEach((p, i) => {
    const h = p.yt - p.yb;
    if (p.horiz) { dummy.position.set(wx(p.c), p.yb + h / 2, wz(p.line)); dummy.scale.set(p.w, h, 0.06); }
    else { dummy.position.set(wx(p.line), p.yb + h / 2, wz(p.c)); dummy.scale.set(0.06, h, p.w); }
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    panes.setMatrixAt(i, dummy.matrix);
  });
  building.add(panes);

  /* ---------- Mobiliario y equipamiento conceptual de cada espacio (ver interiors.js) ---------- */
  const furniture = buildInteriors(THREE, { wx, wz, SPACE_BY_ID, shadows: Q.shadows });
  building.add(furniture.group);

  /* ---------- Cubiertas por bloque ---------- */
  const blocks = {};
  rooms.forEach(r => {
    const [x0, z0, x1, z1] = r.rects[0];
    const b = blocks[r.bloque] || (blocks[r.bloque] = { x0: Infinity, z0: Infinity, x1: -Infinity, z1: -Infinity, h: 0 });
    b.x0 = Math.min(b.x0, x0); b.z0 = Math.min(b.z0, z0); b.x1 = Math.max(b.x1, x1); b.z1 = Math.max(b.z1, z1); b.h = Math.max(b.h, r.altura);
  });
  const roofGeos = [];
  const skyGeos = [];
  const cRoof = new THREE.Color('#D9DDE2'), cRoofEdge = new THREE.Color('#9AA3AD'), cRoofDark = new THREE.Color('#CBD1D8');
  Object.entries(blocks).forEach(([key, b]) => {
    const o = 0.35;
    const geo = boxAt(b.x0 - o, b.z0 - o, b.x1 + o, b.z1 + o, b.h, 0.28);
    const top = key === 'B' ? cRoofDark : cRoof;
    roofGeos.push(paintGeometry(geo, null, [cRoofEdge, cRoofEdge, top, cRoofEdge, cRoofEdge, cRoofEdge]));
    // nervaduras de la cubierta metálica
    const ribs = Math.floor((b.x1 - b.x0) / 1.4);
    for (let i = 1; i < ribs; i++) {
      const x = b.x0 + ((b.x1 - b.x0) * i) / ribs;
      roofGeos.push(paintGeometry(boxAt(x - 0.04, b.z0 - o, x + 0.04, b.z1 + o, b.h + 0.28, 0.06), '#C3C9D0'));
    }
  });
  // lucernarios
  skyGeos.push(boxAt(25.0, 19.0, 44.4, 22.6, 4.78, 0.5));
  skyGeos.push(boxAt(31.0, 31.6, 39.0, 35.0, 4.28, 0.4));
  roofGeos.push(paintGeometry(boxAt(24.8, 18.8, 44.6, 22.8, 4.78, 0.08), '#AEB6BF'));
  const roofMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const roofMesh = new THREE.Mesh(mergeGeometries(roofGeos, false), roofMat);
  roofMesh.castShadow = Q.shadows;
  roofMesh.receiveShadow = Q.shadows;
  const skyMat = new THREE.MeshPhongMaterial({ color: 0x8fb3cf, specular: 0xffffff, shininess: 100, transparent: true, opacity: 0.75 });
  const skyMesh = new THREE.Mesh(mergeGeometries(skyGeos, false), skyMat);
  roofGroup.add(roofMesh, skyMesh);
  const roofMats = [roofMat, skyMat];

  // Marquesina sobre el andén de abordaje
  const canopyGeos = [paintGeometry(boxAt(21.2, 10.9, 48.2, 12.55, 3.05, 0.14), '#E4E7EB')];
  for (let x = 22.4; x <= 47.2; x += 4.13) canopyGeos.push(paintGeometry(boxAt(x - 0.1, 11.05, x + 0.1, 11.25, 0, 3.05), '#6F7A86'));
  const canopy = new THREE.Mesh(mergeGeometries(canopyGeos, false), new THREE.MeshLambertMaterial({ vertexColors: true }));
  canopy.castShadow = Q.shadows;
  exterior.add(canopy);

  /* ---------- Vegetación (instanciada) ---------- */
  const rndT = mulberry32(42);
  const trees = [];
  const shrubs = [];
  const step = 3.0 * Q.treeStep;
  for (let x = 1.6; x < 69; x += step) trees.push([x + (rndT() - 0.5) * 0.6, 1.5 + (rndT() - 0.5) * 0.6, 1.0 + rndT() * 0.45]);
  for (let z = 4.8; z < 23.5; z += step) trees.push([1.2 + (rndT() - 0.5) * 0.3, z, 0.95 + rndT() * 0.35]);
  for (let z = 6.0; z < 23; z += step * 1.3) trees.push([3.9, z + 1.2, 0.8 + rndT() * 0.3]);
  for (let z = 4.8; z < 57.5; z += step) trees.push([68.85 + (rndT() - 0.5) * 0.25, z, 0.85 + rndT() * 0.35]);
  for (let x = 11.0; x < 63.5; x += step) trees.push([x + (rndT() - 0.5) * 0.5, 57.0 + (rndT() - 0.5) * 0.4, 0.95 + rndT() * 0.4]);
  [[11.2, 44.0], [11.2, 46.3], [11.2, 52.3], [11.2, 54.4], [44.0, 45.0], [44.0, 53.2], [62.6, 45.0], [62.6, 53.2], [10.1, 31.0], [10.1, 34.6], [10.1, 37.2], [3.1, 41.3]]
    .forEach(([x, z]) => trees.push([x, z, 0.75 + rndT() * 0.25]));
  for (let x = 10.6; x < 25.3; x += 1.25) shrubs.push([x, 29.8, 0.42 + rndT() * 0.12, 0.02]);
  for (let x = 45.2; x < 65.5; x += 1.25) shrubs.push([x, 29.8, 0.42 + rndT() * 0.12, 0.02]);
  furniture.plants.forEach(p => shrubs.push(p));   // plantas de jardineras y materas interiores

  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  const crownMat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
  const crowns = new THREE.InstancedMesh(crownGeo, crownMat, trees.length + shrubs.length);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.16, 1, 6), new THREE.MeshLambertMaterial({ color: 0x6b5236 }), trees.length);
  const greens = ['#4C8B43', '#5B9A4C', '#3F7C3B', '#6AA653', '#538F48'].map(c => new THREE.Color(c));
  trees.forEach(([x, z, s], i) => {
    const h = 1.1 + s * 0.8;
    dummy.position.set(wx(x), h / 2, wz(z)); dummy.scale.set(1, h, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    dummy.position.set(wx(x), h + s * 0.75, wz(z)); dummy.scale.set(s * 1.25, s * 1.15, s * 1.25); dummy.rotation.set(0, rndT() * 3, 0); dummy.updateMatrix();
    crowns.setMatrixAt(i, dummy.matrix);
    crowns.setColorAt(i, greens[(rndT() * greens.length) | 0]);
  });
  shrubs.forEach(([x, z, s, yBase], j) => {
    const i = trees.length + j;
    dummy.position.set(wx(x), yBase + s * 0.7, wz(z)); dummy.scale.set(s, s * 0.85, s); dummy.rotation.set(0, rndT() * 3, 0); dummy.updateMatrix();
    crowns.setMatrixAt(i, dummy.matrix);
    crowns.setColorAt(i, greens[(rndT() * greens.length) | 0]);
  });
  crowns.castShadow = Q.shadows;
  trunks.castShadow = Q.shadows;
  exterior.add(crowns, trunks);

  /* ---------- Vehículos (instanciados) ---------- */
  const a = PLATFORM_ANGLE * DEG;
  const buses = SPACE_BY_ID.plataformas.partes;
  const busParts = [
    { size: [2.2, 0.5, 7.6], y: 0.25, color: 0x23262b },
    { size: [2.4, 2.1, 8.2], y: 1.5, color: 0xf5f6f8 },
    { size: [2.46, 0.75, 7.9], y: 2.05, color: 0x2b394a },
    { size: [2.44, 0.22, 8.22], y: 0.95, color: 0x1f8f5f },
    { size: [2.1, 0.12, 6.6], y: 2.62, color: 0xdfe3e8 }
  ];
  busParts.forEach(part => {
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(...part.size), new THREE.MeshLambertMaterial({ color: part.color }), buses.length);
    buses.forEach((b, i) => {
      dummy.position.set(wx(b.cx), part.y, wz(b.cz)); dummy.rotation.set(0, a, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    });
    im.castShadow = Q.shadows;
    exterior.add(im);
  });

  const cars = [];
  const carColors = ['#F4F5F7', '#2F3640', '#B8BEC6', '#C0392B', '#F4F5F7', '#1F4E8C', '#D9DCE0', '#5A6470', '#8C5A3C'];
  const taxi = '#F2C230';
  const topRow = [0, 1, 2, 3, 4, 5, 6, 8, 9];
  const botRow = [1, 2, 3, 5, 6, 8, 10];
  topRow.forEach((n, i) => cars.push({ x: 13.4 + 1.325 + n * 2.65, z: 44.9, rot: 0, color: carColors[i % carColors.length] }));
  botRow.forEach((n, i) => cars.push({ x: 13.4 + 1.325 + n * 2.65, z: 53.3, rot: Math.PI, color: carColors[(i + 4) % carColors.length] }));
  [26.9, 29.5, 34.7, 37.3].forEach(z => cars.push({ x: 3.15, z, rot: Math.PI / 2, color: taxi }));
  [45.1, 47.7, 52.9].forEach(z => cars.push({ x: 3.15, z, rot: -Math.PI / 2, color: taxi }));
  cars.push({ x: 8.15, z: 47.0, rot: Math.PI, color: '#F4F5F7' });
  cars.push({ x: 16.0, z: 41.55, rot: Math.PI / 2, color: '#1F4E8C' });
  cars.push({ x: 65.0, z: 46.0, rot: 0, color: taxi });
  const carBody = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 0.7, 4.1), new THREE.MeshLambertMaterial({ color: 0xffffff }), cars.length);
  const carCabin = new THREE.InstancedMesh(new THREE.BoxGeometry(1.58, 0.58, 2.1), new THREE.MeshLambertMaterial({ color: 0x2a3340 }), cars.length);
  cars.forEach((c, i) => {
    dummy.rotation.set(0, c.rot, 0); dummy.scale.set(1, 1, 1);
    dummy.position.set(wx(c.x), 0.6, wz(c.z)); dummy.updateMatrix();
    carBody.setMatrixAt(i, dummy.matrix);
    carBody.setColorAt(i, new THREE.Color(c.color));
    const back = new THREE.Vector3(0, 0, 0.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), c.rot);
    dummy.position.set(wx(c.x) + back.x, 1.22, wz(c.z) + back.z); dummy.updateMatrix();
    carCabin.setMatrixAt(i, dummy.matrix);
  });
  carBody.castShadow = carCabin.castShadow = Q.shadows;
  exterior.add(carBody, carCabin);

  const motoColors = ['#1F4E8C', '#F4F5F7', '#E0A82E', '#C0392B', '#2F3640', '#C0392B', '#5A6470', '#1F4E8C'];
  const motos = [];
  [0, 1, 2, 3, 4, 5, 6, 7, 9].forEach((n, i) => motos.push({ x: 45.4 + 0.65 + n * 1.3, z: 44.2, color: motoColors[i % motoColors.length] }));
  [1, 2, 4, 7, 8].forEach((n, i) => motos.push({ x: 45.4 + 0.65 + n * 1.3, z: 54.0, color: motoColors[(i + 3) % motoColors.length] }));
  const motoMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.85, 1.75), new THREE.MeshLambertMaterial({ color: 0xffffff }), motos.length);
  motos.forEach((m, i) => {
    dummy.position.set(wx(m.x), 0.45, wz(m.z)); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
    motoMesh.setMatrixAt(i, dummy.matrix);
    motoMesh.setColorAt(i, new THREE.Color(m.color));
  });
  motoMesh.castShadow = Q.shadows;
  exterior.add(motoMesh);

  /* ---------- Volúmenes de selección (invisibles) ---------- */
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMeshes = [];
  const addHit = (spaceId, geo, part = null, extra = {}) => {
    const m = new THREE.Mesh(geo, hitMat);
    m.userData = { spaceId, part, ...extra };
    hitGroup.add(m);
    hitMeshes.push(m);
    return m;
  };
  SPACES.forEach(s => {
    if (s.tipo === 'room') {
      const [x0, z0, x1, z1] = s.rects[0];
      addHit(s.id, boxAt(x0, z0, x1, z1, 0, s.altura + 0.35));
    } else {
      s.rects.forEach(([x0, z0, x1, z1]) => addHit(s.id, boxAt(x0, z0, x1, z1, 0, 0.16)));
    }
    if (s.tipo === 'platform') {
      s.partes.forEach(p => {
        const geo = new THREE.BoxGeometry(PLATFORM_SIZE.w, 3.0, PLATFORM_SIZE.d);
        geo.translate(0, 1.5, 0);
        geo.rotateY(a);
        geo.translate(wx(p.cx), 0, wz(p.cz));
        addHit(s.id, geo, p.id, { rotated: true, cx: p.cx, cz: p.cz });
      });
    }
  });
  hitGroup.updateMatrixWorld(true);

  /* ---------- Etiquetas HTML ---------- */
  const labelLayer = document.createElement('div');
  labelLayer.className = 'viewer__labels';
  labelLayer.setAttribute('aria-hidden', 'true');
  stage.appendChild(labelLayer);
  const labels = [];
  const addLabel = (id, text, x, z, y, kind) => {
    const el = document.createElement('span');
    el.className = `v-label v-label--${kind}`;
    el.textContent = text;
    labelLayer.appendChild(el);
    labels.push({ id, el, kind, pos: new THREE.Vector3(wx(x), y, wz(z)) });
  };
  SPACES.forEach(s => {
    const [x0, z0, x1, z1] = s.rects[0];
    if (s.tipo === 'room') addLabel(s.id, s.corto, (x0 + x1) / 2, (z0 + z1) / 2, s.altura + 0.4, 'room');
    else if (s.id === 'vias') { addLabel(s.id, 'Entrada', 7.3, 58.6, 0.4, 'ext'); addLabel(s.id, 'Salida', 66.0, 58.6, 0.4, 'ext'); }
    else if (s.id === 'plataformas') addLabel(s.id, 'Plataformas B1–B6', 36.6, 4.6, 3.4, 'ext');
    else if (s.id !== 'verdes') addLabel(s.id, s.corto, (x0 + x1) / 2, (z0 + z1) / 2, 0.6, 'ext');
  });

  /* ---------- Estado ---------- */
  const state = {
    roof: true, interior: false, labels: false, active: !coarsePointer, wheel: false,
    selected: null, part: null, autoRoof: false, roofBeforeInterior: true,
    cut: MAX_H, insetTarget: { right: 0, bottom: 0 }, inset: { right: 0, bottom: 0 }, expanded: false
  };
  const size = { w: 1, h: 1 };
  let needsRender = true;
  let running = false;
  let raf = 0;
  let visible = true;
  const tweens = new Set();
  const requestRender = () => { needsRender = true; };

  const tween = (duration, onUpdate, onDone, ease = easeInOutCubic) => {
    const tw = { t0: performance.now(), duration: reduceMotion ? 1 : duration, onUpdate, onDone, ease };
    tweens.add(tw);
    requestRender();
    return tw;
  };
  const stepTweens = now => {
    tweens.forEach(tw => {
      const k = Math.min(1, (now - tw.t0) / tw.duration);
      tw.onUpdate(tw.ease(k));
      if (k >= 1) { tweens.delete(tw); tw.onDone && tw.onDone(); }
    });
  };

  /* ---------- Cámara: encuadres ---------- */
  const fitRadius = (polar, az, kind) => {
    const vfov = camera.fov * DEG;
    const visH = Math.max(1, size.h - state.insetTarget.bottom);
    const visW = Math.max(1, size.w - state.insetTarget.right);
    const aspect = visW / visH;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const tv = Math.tan(vfov / 2) * (visH / size.h);
    const th = Math.tan(hfov / 2) * (visH / size.h);
    if (kind === 'top') return Math.max((BD / 2 + 1.5) / tv, (BW / 2 + 1.5) / th) + 2;
    const ca = Math.abs(Math.cos(az)), sa = Math.abs(Math.sin(az));
    const halfW = 0.5 * (BW * ca + BD * sa);
    const halfD = 0.5 * (BW * sa + BD * ca);
    const halfH = halfD * Math.cos(polar) + 2.5 * Math.sin(polar);
    const crop = aspect < 0.9 ? 0.9 : 0.96;
    return Math.max((halfW * crop) / th, (halfH * 1.08) / tv) + halfD * Math.sin(polar) * 0.35;
  };
  const sph = new THREE.Spherical();
  const VIEWS = {
    general: () => { const p = 54 * DEG, az = (size.w / size.h < 0.9 ? 24 : 36) * DEG; return { target: new THREE.Vector3(0, 0, 2), polar: p, az, radius: fitRadius(p, az) }; },
    superior: () => ({ target: new THREE.Vector3(0, 0, 0), polar: 0.0001, az: 0, radius: fitRadius(0, 0, 'top') }),
    frontal: () => { const p = 66 * DEG; return { target: new THREE.Vector3(0, 1.5, 0), polar: p, az: 0, radius: fitRadius(p, 0) * 0.92 }; },
    lateral: () => { const p = 66 * DEG, az = 90 * DEG; return { target: new THREE.Vector3(0, 1.5, 0), polar: p, az, radius: fitRadius(p, az) * 0.92 }; },
    interior: () => { const p = 40 * DEG; const az = sph.setFromVector3(camera.position.clone().sub(controls.target)).theta; return { target: new THREE.Vector3(wx(37.8), 0, wz(25.0)), polar: p, az, radius: Math.max(46, fitRadius(p, az) * 0.62) }; }
  };
  let camTween = null;
  let currentView = 'general';
  const flyTo = ({ target, polar, az, radius }, duration = 1000) => {
    if (camTween) tweens.delete(camTween);
    const t0 = controls.target.clone();
    const s0 = new THREE.Spherical().setFromVector3(camera.position.clone().sub(t0));
    let dTheta = az - s0.theta;
    dTheta = Math.atan2(Math.sin(dTheta), Math.cos(dTheta));
    const r1 = THREE.MathUtils.clamp(radius, controls.minDistance, controls.maxDistance);
    const tmp = new THREE.Spherical();
    camTween = tween(duration, k => {
      controls.target.lerpVectors(t0, target, k);
      tmp.set(THREE.MathUtils.lerp(s0.radius, r1, k), THREE.MathUtils.lerp(s0.phi, polar, k), s0.theta + dTheta * k);
      camera.position.setFromSpherical(tmp).add(controls.target);
      camera.lookAt(controls.target);
    }, () => { camTween = null; });
  };
  const setView = (name, duration) => {
    currentView = name;
    flyTo(VIEWS[name](), duration);
    emit('state', getState());
  };

  /* ---------- Cubierta, interiores, etiquetas ---------- */
  let roofTween = null;
  const setRoof = (show, { auto = false } = {}) => {
    if (show === state.roof) return;
    state.roof = show;
    if (!auto) state.autoRoof = false;
    if (roofTween) tweens.delete(roofTween);
    const from = roofGroup.userData.k ?? (show ? 0 : 1);
    const to = show ? 1 : 0;
    roofGroup.visible = true;
    roofMats.forEach(m => { m.transparent = true; m.needsUpdate = true; });
    roofTween = tween(700, k => {
      const v = from + (to - from) * k;
      roofGroup.userData.k = v;
      roofGroup.position.y = (1 - v) * 7;
      roofMat.opacity = v;
      skyMat.opacity = 0.75 * v;
    }, () => {
      roofTween = null;
      if (!show) roofGroup.visible = false;
      else { roofMat.transparent = false; roofMat.needsUpdate = true; }
    });
    emit('state', getState());
  };
  roofGroup.userData.k = 1;

  let cutTween = null;
  const applyCut = h => {
    for (let i = 0; i < wallOrigY.length; i++) wallPosAttr.setY(i, Math.min(wallOrigY[i], h));
    wallPosAttr.needsUpdate = true;
    for (let i = 0; i < glassOrigY.length; i++) glassPosAttr.setY(i, Math.min(glassOrigY[i], h));
    glassPosAttr.needsUpdate = true;
    wallsGeo.computeBoundingSphere();
    state.cut = h;
  };
  const setInterior = on => {
    if (on === state.interior) return;
    state.interior = on;
    if (cutTween) tweens.delete(cutTween);
    const from = state.cut, to = on ? CUT_HEIGHT : MAX_H;
    if (on) { state.roofBeforeInterior = state.roof || state.autoRoof; setRoof(false); panes.visible = false; canopy.visible = false; furniture.high.visible = false; }
    cutTween = tween(800, k => applyCut(from + (to - from) * k), () => {
      cutTween = null;
      if (!on) { panes.visible = true; canopy.visible = true; furniture.high.visible = true; }
    });
    if (!on && state.roofBeforeInterior) {
      if (state.selected && SPACE_BY_ID[state.selected].tipo === 'room') state.autoRoof = true;
      else setRoof(true);
    }
    if (on) setView('interior', 1100);
    refreshLabels();
    refreshOverlay();
    emit('state', getState());
  };
  const setLabels = on => { state.labels = on; refreshLabels(); requestRender(); emit('state', getState()); };
  const refreshLabels = () => {
    labels.forEach(l => {
      const show = state.labels || (state.interior && l.kind === 'room');
      l.el.classList.toggle('is-shown', show);
      l.el.classList.toggle('is-selected', l.id === state.selected);
    });
    requestRender();
  };

  /* ---------- Resaltado ---------- */
  const ovMat = new THREE.MeshBasicMaterial({ color: HIGHLIGHT, transparent: true, opacity: 0.22, depthWrite: false });
  const ovEdge = new THREE.LineBasicMaterial({ color: HIGHLIGHT, transparent: true, opacity: 0.95 });
  const hoverMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false });
  const hoverEdge = new THREE.LineBasicMaterial({ color: 0x0f2742, transparent: true, opacity: 0.55 });
  const hoverGroup = new THREE.Group();
  scene.add(hoverGroup);

  const clearGroup = grp => {
    while (grp.children.length) {
      const c = grp.children.pop();
      c.geometry && c.geometry.dispose();
    }
  };
  const overlayGeos = (spaceId, part) => {
    const s = SPACE_BY_ID[spaceId];
    const geos = [];
    if (s.tipo === 'room') {
      const [x0, z0, x1, z1] = s.rects[0];
      const h = state.interior ? CUT_HEIGHT + 0.1 : (state.roof ? s.altura + 0.45 : s.altura + 0.08);
      geos.push(boxAt(x0 + 0.02, z0 + 0.02, x1 - 0.02, z1 - 0.02, 0.02, h));
    } else if (s.tipo === 'platform' && part) {
      const p = s.partes.find(q => q.id === part);
      const geo = new THREE.BoxGeometry(PLATFORM_SIZE.w, 3.1, PLATFORM_SIZE.d);
      geo.translate(0, 1.55, 0); geo.rotateY(a); geo.translate(wx(p.cx), 0, wz(p.cz));
      geos.push(geo);
    } else if (s.tipo === 'platform') {
      s.partes.forEach(p => {
        const geo = new THREE.BoxGeometry(PLATFORM_SIZE.w, 3.1, PLATFORM_SIZE.d);
        geo.translate(0, 1.55, 0); geo.rotateY(a); geo.translate(wx(p.cx), 0, wz(p.cz));
        geos.push(geo);
      });
    } else {
      s.rects.forEach(([x0, z0, x1, z1]) => geos.push(boxAt(x0, z0, x1, z1, 0.02, 0.3)));
    }
    return geos;
  };
  const buildOverlay = (grp, spaceId, part, mat, edgeMat) => {
    clearGroup(grp);
    if (!spaceId) return;
    overlayGeos(spaceId, part).forEach(geo => {
      const m = new THREE.Mesh(geo, mat);
      m.renderOrder = 5;
      grp.add(m);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      e.renderOrder = 6;
      grp.add(e);
    });
  };
  const refreshOverlay = () => { buildOverlay(overlayGroup, state.selected, state.part, ovMat, ovEdge); requestRender(); };

  let pulseTween = null;
  const pulse = () => {
    if (pulseTween) tweens.delete(pulseTween);
    pulseTween = tween(1600, k => { ovMat.opacity = 0.14 + 0.18 * (0.5 - 0.5 * Math.cos(k * Math.PI * 4)); }, () => { ovMat.opacity = 0.22; pulseTween = null; }, t => t);
  };

  const spaceBounds = (spaceId, part) => {
    const s = SPACE_BY_ID[spaceId];
    if (s.tipo === 'platform' && part) {
      const p = s.partes.find(q => q.id === part);
      return { cx: p.cx, cz: p.cz, sx: 6, sz: 9 };
    }
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    s.rects.forEach(r => { x0 = Math.min(x0, r[0]); z0 = Math.min(z0, r[1]); x1 = Math.max(x1, r[2]); z1 = Math.max(z1, r[3]); });
    return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, sx: x1 - x0, sz: z1 - z0 };
  };

  const select = (spaceId, part = null, { focus = true, source = 'api' } = {}) => {
    const s = SPACE_BY_ID[spaceId];
    if (!s) return;
    Object.entries(floorMeshes).forEach(([id, m]) => m.material.emissive.setHex(id === spaceId ? 0x0e4f30 : 0x000000));
    state.selected = spaceId;
    state.part = part;
    if (s.tipo === 'room' && state.roof && !state.interior) { setRoof(false, { auto: true }); state.autoRoof = true; }
    refreshOverlay();
    pulse();
    refreshLabels();
    // primero se notifica (la interfaz abre el panel y fija los márgenes de vista)
    emit('select', { space: s, part, source });
    if (focus) {
      const b = spaceBounds(spaceId, part);
      const big = Math.max(b.sx, b.sz);
      const isRoom = s.tipo === 'room';
      const polar = (isRoom ? (state.interior ? 38 : 44) : big > 40 ? 52 : 50) * DEG;
      const az = sph.setFromVector3(camera.position.clone().sub(controls.target)).theta;
      const T = Math.tan((camera.fov * DEG) / 2);
      const visH = Math.max(1, size.h - state.insetTarget.bottom);
      const visW = Math.max(1, size.w - state.insetTarget.right);
      const tv = (T * visH) / size.h, th = (T * visW) / size.h;
      const halfW = big / 2 + 1.5;
      const halfV = (big / 2) * Math.cos(polar) + (isRoom ? 2.5 : 1.5);
      const radius = THREE.MathUtils.clamp(Math.max(halfW / th, halfV / tv) * 1.22, isRoom ? 30 : 26, 170);
      flyTo({ target: new THREE.Vector3(wx(b.cx), isRoom ? 0.6 : 0.2, wz(b.cz)), polar, az, radius }, 950);
    }
  };

  const clearSelection = ({ restoreView = true } = {}) => {
    Object.values(floorMeshes).forEach(m => m.material.emissive.setHex(0x000000));
    const had = state.selected;
    state.selected = null; state.part = null;
    clearGroup(overlayGroup);
    if (state.autoRoof && !state.interior) { state.autoRoof = false; setRoof(true); }
    refreshLabels();
    if (restoreView) setView(state.interior ? 'interior' : 'general', 1000);
    if (had) emit('clear', {});
    requestRender();
  };

  /* ---------- Raycasting ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(hitMeshes, false);
    if (!hits.length) return null;
    // Prioriza plataformas puntuales y recintos frente a zonas planas
    const first = hits[0];
    return first.object.userData;
  };

  let down = null;
  canvas.addEventListener('pointerdown', e => {
    down = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType };
    if (e.pointerType === 'mouse') { state.wheel = true; }
  });
  canvas.addEventListener('pointerup', e => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    const dt = performance.now() - down.t;
    const isTap = Math.hypot(dx, dy) < 8 && dt < 600;
    down = null;
    if (!isTap) return;
    if (!state.active) setActive(true);
    const hit = pick(e.clientX, e.clientY);
    if (hit) select(hit.spaceId, hit.part, { source: 'tap' });
  });
  canvas.addEventListener('pointercancel', () => { down = null; });

  // Hover (solo punteros finos)
  let hoverId = null, hoverPart = null, hoverPending = null;
  canvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    hoverPending = { x: e.clientX, y: e.clientY };
    requestRender();
  });
  canvas.addEventListener('pointerleave', () => {
    hoverPending = null;
    state.wheel = state.expanded;
    if (hoverId) { hoverId = null; hoverPart = null; clearGroup(hoverGroup); canvas.style.cursor = ''; emit('hover', null); requestRender(); }
  });
  const processHover = () => {
    if (!hoverPending) return;
    const { x, y } = hoverPending;
    hoverPending = null;
    const hit = pick(x, y);
    const id = hit ? hit.spaceId : null;
    const part = hit ? hit.part : null;
    canvas.style.cursor = id ? 'pointer' : '';
    if (id !== hoverId || part !== hoverPart) {
      hoverId = id; hoverPart = part;
      if (id && id !== state.selected) buildOverlay(hoverGroup, id, part, hoverMat, hoverEdge);
      else clearGroup(hoverGroup);
    }
    emit('hover', id ? { space: SPACE_BY_ID[id], part, x, y } : null);
  };

  // Rueda del mouse: sólo con el visor activo (clic) o con Ctrl, para no bloquear el desplazamiento de la página
  stage.addEventListener('wheel', e => {
    if (e.target !== canvas) return;
    if (!state.wheel && !e.ctrlKey && !state.expanded) {
      e.stopPropagation();
      emit('wheelblocked', {});
    }
  }, { capture: true, passive: true });

  controls.addEventListener('start', () => {
    if (camTween) { tweens.delete(camTween); camTween = null; }
    emit('interact', {});
  });
  controls.addEventListener('change', () => {
    const t = controls.target;
    t.x = THREE.MathUtils.clamp(t.x, -42, 42);
    t.z = THREE.MathUtils.clamp(t.z, -36, 36);
    t.y = THREE.MathUtils.clamp(t.y, 0, 8);
    requestRender();
  });

  /* ---------- Activación (evita atrapar el scroll en pantallas táctiles) ---------- */
  const setActive = on => {
    state.active = on;
    controls.enabled = on;
    canvas.style.touchAction = on ? 'none' : 'pan-y';
    emit(on ? 'activate' : 'deactivate', {});
  };
  setActive(state.active);

  const zoomBy = factor => {
    const off = camera.position.clone().sub(controls.target);
    const len = THREE.MathUtils.clamp(off.length() * factor, controls.minDistance, controls.maxDistance);
    const s0 = new THREE.Spherical().setFromVector3(off);
    flyTo({ target: controls.target.clone(), polar: s0.phi, az: s0.theta, radius: len }, 380);
  };

  /* ---------- Tamaño y desplazamiento de vista (paneles superpuestos) ---------- */
  const applyViewOffset = () => {
    const { right, bottom } = state.inset;
    if (Math.abs(right) < 0.5 && Math.abs(bottom) < 0.5) camera.clearViewOffset();
    else camera.setViewOffset(size.w, size.h, right / 2, bottom / 2, size.w, size.h);
    camera.updateProjectionMatrix();
  };
  const resize = () => {
    const r = stage.getBoundingClientRect();
    size.w = Math.max(1, Math.round(r.width));
    size.h = Math.max(1, Math.round(r.height));
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.w / size.h;
    applyViewOffset();
    requestRender();
  };
  const ro = new ResizeObserver(() => resize());
  ro.observe(stage);
  resize();

  const setInsets = ({ right = 0, bottom = 0 } = {}) => {
    state.insetTarget = { right, bottom };
    requestRender();
  };
  const stepInsets = () => {
    const it = state.insetTarget, i = state.inset;
    const dr = it.right - i.right, db = it.bottom - i.bottom;
    if (Math.abs(dr) < 0.5 && Math.abs(db) < 0.5) {
      if (dr !== 0 || db !== 0) { i.right = it.right; i.bottom = it.bottom; applyViewOffset(); return true; }
      return false;
    }
    i.right += dr * 0.18; i.bottom += db * 0.18;
    applyViewOffset();
    return true;
  };

  /* ---------- Bucle de render bajo demanda ---------- */
  const v3 = new THREE.Vector3();
  const updateLabels = () => {
    const anyShown = state.labels || state.interior;
    if (!anyShown) return;
    const w = size.w, h = size.h;
    labels.forEach(l => {
      if (!l.el.classList.contains('is-shown')) return;
      v3.copy(l.pos).project(camera);
      const behind = v3.z > 1;
      const x = (v3.x * 0.5 + 0.5) * w;
      const y = (-v3.y * 0.5 + 0.5) * h;
      const off = behind || x < -40 || x > w + 40 || y < -20 || y > h + 20;
      l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
      l.el.style.visibility = off ? 'hidden' : 'visible';
    });
  };

  const frameTimes = [];
  let perfChecked = qualityName === 'low';
  let lastFrame = 0;
  const degrade = () => {
    perfChecked = true;
    renderer.setPixelRatio(1);
    if (renderer.shadowMap.enabled) {
      renderer.shadowMap.enabled = false;
      scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); });
    }
    resize();
    emit('perf', { degraded: true });
  };

  const loop = now => {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    const animating = tweens.size > 0;
    stepTweens(now);
    const insetMoving = stepInsets();
    const moved = controls.update();
    processHover();
    if (moved || needsRender || animating || insetMoving) {
      renderer.render(scene, camera);
      updateLabels();
      needsRender = false;
      if (!perfChecked && animating) {
        if (lastFrame) frameTimes.push(now - lastFrame);
        lastFrame = now;
        if (frameTimes.length >= 45) {
          const sorted = [...frameTimes].sort((p, q) => p - q);
          const median = sorted[Math.floor(sorted.length / 2)];
          if (median > 40) degrade(); else perfChecked = true;
        }
      }
    } else {
      lastFrame = 0;
    }
  };
  const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      visible = en.isIntersecting;
      if (visible) { requestRender(); start(); }
      else { stop(); if (coarsePointer && state.active && !state.expanded) setActive(false); }
    });
  }, { threshold: 0.01 });
  io.observe(stage);

  /* ---------- Vista inicial con animación de entrada ---------- */
  const g = VIEWS.general();
  const startS = new THREE.Spherical(g.radius * 1.35, 18 * DEG, g.az - 40 * DEG);
  camera.position.setFromSpherical(startS).add(g.target);
  controls.target.copy(g.target);
  camera.lookAt(g.target);
  controls.update();
  start();
  setTimeout(() => setView('general', reduceMotion ? 1 : 1700), 60);

  /* ---------- Captura (render a imagen) ---------- */
  const capture = ({ width = 1600, height = 1000, view = 'general', roof = true, interior = false, polar, az, radius, target } = {}) => {
    const prev = { w: size.w, h: size.h, pr: renderer.getPixelRatio(), pos: camera.position.clone(), tgt: controls.target.clone(), roof: state.roof, inter: state.interior };
    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    size.w = width; size.h = height;
    const v = VIEWS[view] ? VIEWS[view]() : VIEWS.general();
    const t = target ? new THREE.Vector3(...target) : v.target;
    const s = new THREE.Spherical(radius ?? v.radius, polar !== undefined ? polar * DEG : v.polar, az !== undefined ? az * DEG : v.az);
    camera.position.setFromSpherical(s).add(t);
    camera.lookAt(t);
    roofGroup.visible = roof; roofGroup.position.y = 0; roofMat.opacity = 1; skyMat.opacity = 0.75;
    applyCut(interior ? CUT_HEIGHT : MAX_H);
    panes.visible = !interior;
    canopy.visible = !interior;
    furniture.high.visible = !interior;
    renderer.render(scene, camera);
    const url = canvas.toDataURL('image/png');
    // restaurar
    roofGroup.visible = prev.roof;
    applyCut(prev.inter ? CUT_HEIGHT : MAX_H);
    panes.visible = !prev.inter;
    canopy.visible = !prev.inter;
    furniture.high.visible = !prev.inter;
    renderer.setPixelRatio(prev.pr);
    camera.position.copy(prev.pos); controls.target.copy(prev.tgt);
    resize();
    return url;
  };

  const getState = () => ({
    roof: state.roof, interior: state.interior, labels: state.labels, active: state.active,
    selected: state.selected, part: state.part, view: currentView, quality: qualityName, expanded: state.expanded
  });

  const api = {
    quality: qualityName,
    on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); return api; },
    select, clearSelection,
    setView: name => { if (VIEWS[name]) setView(name); },
    resetCamera: () => setView(state.interior ? 'interior' : 'general'),
    toggleRoof: () => setRoof(!state.roof),
    setRoof,
    toggleInterior: () => setInterior(!state.interior),
    setInterior,
    toggleLabels: () => setLabels(!state.labels),
    setLabels,
    setActive,
    setExpanded: on => { state.expanded = on; state.wheel = on; if (on) setActive(true); },
    zoomIn: () => zoomBy(0.75),
    zoomOut: () => zoomBy(1.33),
    setInsets,
    resize,
    refit: () => { if (!state.selected) setView(currentView === 'interior' ? 'interior' : currentView, 600); },
    getState,
    capture,
    /* Posición en pantalla (px relativos al visor) de un punto de la planta; útil para pruebas. */
    screenPosition(planX, planZ, y = 0.5) {
      const p = new THREE.Vector3(wx(planX), y, wz(planZ)).project(camera);
      return { x: (p.x * 0.5 + 0.5) * size.w, y: (-p.y * 0.5 + 0.5) * size.h };
    },
    dispose() {
      stop(); ro.disconnect(); io.disconnect(); controls.dispose(); renderer.dispose();
      canvas.remove(); labelLayer.remove();
    }
  };
  requestRender();
  return api;
}
