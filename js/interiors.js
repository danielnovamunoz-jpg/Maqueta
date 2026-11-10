/* ==========================================================================
   Mobiliario y equipamiento CONCEPTUAL de los espacios interiores.
   Todo se construye con cajas y cilindros instanciados (pocas llamadas de dibujo).
   Coordenadas en cm de maqueta (1 cm = 1 m real): x 0→70, z 0→60.
   Los elementos son ilustrativos y no corresponden a un diseño definitivo.
   ========================================================================== */

const F0 = 0.12; // nivel superior del piso interior

const C = {
  porcelain: '#FFFFFF', white: '#F2EEE6', top: '#3E4A59', wood: '#C7AE88', woodDark: '#9C7B55',
  metal: '#9AA3AD', dark: '#1B222B', screen: '#2B5680', partition: '#93A7BC', door: '#B7C7D7',
  seat: '#2F5A86', seatBack: '#264B70', fabric: '#5E7A99', fabricDark: '#4A6380', locker: '#5E7A99',
  mirror: '#BCD3E3', belt: '#B03A2E', green: '#2E9E6B', planter: '#B9A27E', line: '#9FD3F5'
};
const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildInteriors(THREE, { wx, wz, SPACE_BY_ID, shadows }) {
  const low = [], high = [], cyls = [], glass = [], plants = [];
  const rnd = mulberry32(2026);

  /* ---------- Primitivas ---------- */
  const box = (x0, z0, x1, z1, y0, h, color, isHigh = false) =>
    (isHigh ? high : low).push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), y0, h, color]);
  const cyl = (x, z, r, y0, h, color) => cyls.push([x, z, r, y0, h, color]);
  const gl = (x0, z0, x1, z1, y0, h) => glass.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), y0, h]);

  /* ---------- Piezas compuestas ---------- */
  // Silla: `face` es hacia dónde mira la persona sentada.
  const chair = (x, z, face, color = C.fabricDark) => {
    const [dx, dz] = DIRS[face];
    box(x - 0.09, z - 0.09, x + 0.09, z + 0.09, F0, 0.4, C.dark);
    box(x - 0.23, z - 0.23, x + 0.23, z + 0.23, F0 + 0.4, 0.07, color);
    const bx = x - dx * 0.2, bz = z - dz * 0.2;
    if (dx === 0) box(x - 0.23, bz - 0.03, x + 0.23, bz + 0.03, F0 + 0.47, 0.45, color);
    else box(bx - 0.03, z - 0.23, bx + 0.03, z + 0.23, F0 + 0.47, 0.45, color);
  };
  const stool = (x, z, color = C.seat) => { cyl(x, z, 0.035, F0, 0.66, C.metal); cyl(x, z, 0.18, F0 + 0.66, 0.06, color); };
  const table = (x0, z0, x1, z1, h = 0.74, color = C.wood) => {
    box(x0, z0, x1, z1, F0 + h - 0.05, 0.05, color);
    const m = 0.1;
    [[x0 + m, z0 + m], [x1 - m, z0 + m], [x0 + m, z1 - m], [x1 - m, z1 - m]]
      .forEach(([x, z]) => box(x - 0.03, z - 0.03, x + 0.03, z + 0.03, F0, h - 0.05, C.metal));
  };
  const roundTable = (x, z, r = 0.42, color = C.porcelain) => {
    cyl(x, z, 0.25, F0, 0.03, C.metal); cyl(x, z, 0.05, F0, 0.7, C.metal); cyl(x, z, r, F0 + 0.7, 0.04, color);
  };
  const counter = (x0, z0, x1, z1, h = 1.0, body = C.white, topC = C.top) => {
    box(x0 + 0.03, z0 + 0.03, x1 - 0.03, z1 - 0.03, F0, h, body);
    box(x0, z0, x1, z1, F0 + h, 0.05, topC);
  };
  // Pantalla: marco oscuro + panel de color + líneas (tablero de información).
  const screen = (x0, z0, x1, z1, y0, h, { isHigh = true, color = C.screen, lines = 0 } = {}) => {
    box(x0, z0, x1, z1, y0, h, C.dark, isHigh);
    const alongX = (x1 - x0) >= (z1 - z0);
    const m = Math.min(0.07, h * 0.12);
    if (alongX) box(x0 + m, z0 - 0.01, x1 - m, z1 + 0.01, y0 + m, h - 2 * m, color, isHigh);
    else box(x0 - 0.01, z0 + m, x1 + 0.01, z1 - m, y0 + m, h - 2 * m, color, isHigh);
    for (let i = 0; i < lines; i++) {
      const y = y0 + h - m - 0.12 - i * ((h - 2 * m - 0.12) / lines);
      const len = 0.55 + rnd() * 0.35;
      if (alongX) {
        const xa = x0 + m + 0.12, xb = xa + (x1 - x0 - 2 * m - 0.24) * len;
        box(xa, z0 - 0.02, xb, z1 + 0.02, y, 0.05, C.line, isHigh);
      } else {
        const za = z0 + m + 0.12, zb = za + (z1 - z0 - 2 * m - 0.24) * len;
        box(x0 - 0.02, za, x1 + 0.02, zb, y, 0.05, C.line, isHigh);
      }
    }
  };
  // Inodoro contra la pared que queda detrás de `face`.
  const toilet = (x, z, face) => {
    const [dx, dz] = DIRS[face];
    const tx = x - dx * 0.29, tz = z - dz * 0.29;
    if (dx === 0) box(tx - 0.2, tz - 0.09, tx + 0.2, tz + 0.09, F0, 0.78, C.porcelain);
    else box(tx - 0.09, tz - 0.2, tx + 0.09, tz + 0.2, F0, 0.78, C.porcelain);
    cyl(x, z, 0.19, F0, 0.4, C.porcelain);
    cyl(x + dx * 0.02, z + dz * 0.02, 0.2, F0 + 0.4, 0.035, '#C9D3DD');
  };
  const sinkCounter = (x0, z0, x1, z1, n) => {
    counter(x0, z0, x1, z1, 0.84, C.porcelain, '#D7DCE2');
    const alongX = (x1 - x0) >= (z1 - z0);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = alongX ? x0 + (x1 - x0) * t : (x0 + x1) / 2;
      const z = alongX ? (z0 + z1) / 2 : z0 + (z1 - z0) * t;
      cyl(x, z, 0.17, F0 + 0.89, 0.03, '#8FA9BE');
    }
  };
  const lockers = (x0, z0, x1, z1, face, h = 1.85) => {
    box(x0, z0, x1, z1, F0, h, C.locker);
    const [dx, dz] = DIRS[face];
    if (dx === 0) {
      const zf = dz > 0 ? z1 : z0;
      for (let x = x0 + 0.42; x < x1 - 0.1; x += 0.42) box(x - 0.015, zf - 0.012, x + 0.015, zf + 0.012, F0 + 0.05, h - 0.1, C.dark);
      box(x0, zf - 0.012, x1, zf + 0.012, F0 + h * 0.5, 0.025, C.dark);
    } else {
      const xf = dx > 0 ? x1 : x0;
      for (let z = z0 + 0.42; z < z1 - 0.1; z += 0.42) box(xf - 0.012, z - 0.015, xf + 0.012, z + 0.015, F0 + 0.05, h - 0.1, C.dark);
      box(xf - 0.012, z0, xf + 0.012, z1, F0 + h * 0.5, 0.025, C.dark);
    }
  };
  const sofa = (x0, z0, x1, z1, face, color = C.fabric) => {
    box(x0, z0, x1, z1, F0, 0.42, color);
    const [dx, dz] = DIRS[face];
    const back = C.fabricDark;
    if (dz === 1) box(x0, z0, x1, z0 + 0.22, F0 + 0.42, 0.45, back);
    if (dz === -1) box(x0, z1 - 0.22, x1, z1, F0 + 0.42, 0.45, back);
    if (dx === 1) box(x0, z0, x0 + 0.22, z1, F0 + 0.42, 0.45, back);
    if (dx === -1) box(x1 - 0.22, z0, x1, z1, F0 + 0.42, 0.45, back);
    if (dx === 0) { box(x0, z0, x0 + 0.16, z1, F0 + 0.42, 0.2, back); box(x1 - 0.16, z0, x1, z1, F0 + 0.42, 0.2, back); }
    else { box(x0, z0, x1, z0 + 0.16, F0 + 0.42, 0.2, back); box(x0, z1 - 0.16, x1, z1, F0 + 0.42, 0.2, back); }
  };
  // Estantería: `face` es el lado abierto. Coloca productos en cada repisa.
  const shelving = (x0, z0, x1, z1, face, h, levels, palette, { frame = C.wood, backPanel = true } = {}) => {
    const [dx, dz] = DIRS[face];
    const alongX = dx === 0;
    if (backPanel) {
      if (alongX) { const zb = dz > 0 ? z0 : z1 - 0.05; box(x0, zb, x1, zb + 0.05, F0, h, frame); }
      else { const xb = dx > 0 ? x0 : x1 - 0.05; box(xb, z0, xb + 0.05, z1, F0, h, frame); }
    }
    if (alongX) { box(x0, z0, x0 + 0.05, z1, F0, h, frame); box(x1 - 0.05, z0, x1, z1, F0, h, frame); }
    else { box(x0, z0, x1, z0 + 0.05, F0, h, frame); box(x0, z1 - 0.05, x1, z1, F0, h, frame); }
    const depth = alongX ? z1 - z0 : x1 - x0;
    const len = alongX ? x1 - x0 : z1 - z0;
    const gap = (h - 0.12) / levels;
    for (let l = 0; l < levels; l++) {
      const y = F0 + 0.06 + l * gap;
      box(x0, z0, x1, z1, y, 0.035, frame);
      let p = 0.1;
      while (p < len - 0.2) {
        const w = 0.13 + rnd() * 0.2;
        if (p + w > len - 0.08) break;
        const hh = Math.min(gap - 0.1, 0.12 + rnd() * (gap - 0.18));
        const d = depth * (0.55 + rnd() * 0.35);
        const col = palette[(rnd() * palette.length) | 0];
        if (alongX) {
          const za = dz > 0 ? z0 + 0.06 : z1 - 0.06 - d;
          box(x0 + p, za, x0 + p + w, za + d, y + 0.035, hh, col);
        } else {
          const xa = dx > 0 ? x0 + 0.06 : x1 - 0.06 - d;
          box(xa, z0 + p, xa + d, z0 + p + w, y + 0.035, hh, col);
        }
        p += w + 0.03 + rnd() * 0.05;
      }
    }
  };
  const post = (x, z) => { cyl(x, z, 0.14, F0, 0.025, C.metal); cyl(x, z, 0.035, F0, 0.95, C.metal); };
  const planter = (x0, z0, x1, z1, y0 = F0, h = 0.5) => {
    box(x0, z0, x1, z1, y0, h, C.planter);
    plants.push([(x0 + x1) / 2, (z0 + z1) / 2, 0.55, y0 + h]);
  };
  const potPlant = (x, z) => { cyl(x, z, 0.24, F0, 0.45, C.planter); plants.push([x, z, 0.48, F0 + 0.45]); };
  const bin = (x, z, color = '#5B6673') => cyl(x, z, 0.19, F0, 0.68, color);

  /* =====================================================================
     SALA DE ESPERA GENERAL  [21.0, 12.6, 48.4, 29.0]
     ===================================================================== */
  const doubleRow = (xa, xb, zc) => {
    box(xa, zc - 0.05, xb, zc + 0.05, F0 + 0.24, 0.09, C.metal);
    [xa + 0.2, (xa + xb) / 2, xb - 0.2].forEach(x => box(x - 0.05, zc - 0.3, x + 0.05, zc + 0.3, F0, 0.24, C.metal));
    let k = 0;
    for (let x = xa + 0.3; x <= xb - 0.27; x += 0.56, k++) {
      box(x - 0.25, zc - 0.5, x + 0.25, zc - 0.05, F0 + 0.36, 0.07, C.seat);      // asiento hacia el norte
      box(x - 0.25, zc - 0.06, x + 0.25, zc - 0.01, F0 + 0.43, 0.46, C.seatBack); // respaldo
      box(x - 0.25, zc + 0.05, x + 0.25, zc + 0.5, F0 + 0.36, 0.07, C.seat);      // asiento hacia el sur
      box(x - 0.25, zc + 0.01, x + 0.25, zc + 0.06, F0 + 0.43, 0.46, C.seatBack);
      if (k % 2 === 0) box(x - 0.3, zc - 0.46, x - 0.27, zc + 0.46, F0 + 0.43, 0.18, C.metal); // apoyabrazos
    }
  };
  [[27.0, 33.5], [36.0, 42.5]].forEach(([a, b]) => [19.4, 22.2, 25.0].forEach(z => doubleRow(a, b, z)));
  // Pantallas de salidas junto al acceso a plataformas
  screen(29.4, 12.95, 33.8, 13.07, 2.3, 0.95, { lines: 4 });
  screen(35.6, 12.95, 40.0, 13.07, 2.3, 0.95, { lines: 4 });
  planter(23.0, 14.0, 24.2, 15.2);
  planter(44.6, 14.0, 45.8, 15.2);
  planter(23.0, 26.7, 24.2, 27.9);
  planter(44.6, 23.4, 45.8, 24.6);
  bin(25.3, 19.6); bin(44.0, 19.6); bin(31.0, 28.3); bin(38.6, 28.3);

  /* =====================================================================
     TAQUILLAS DE EMPRESAS  [11.0, 30.6, 25.8, 37.6]
     Seis módulos de atención con mostrador, ventanilla de vidrio y letrero.
     ===================================================================== */
  const signColors = ['#183B5B', '#2E9E6B', '#C0392B', '#E0A82E', '#3E7CB1', '#8E6AB0'];
  const mw = 2.35, mx0 = 11.3;
  for (let i = 0; i < 6; i++) {
    const xa = mx0 + i * mw, xb = xa + mw, xc = (xa + xb) / 2;
    counter(xa + 0.12, 30.76, xb - 0.12, 31.3, 0.9, C.wood, C.top);           // mueble posterior
    box(xa + 0.3, 30.85, xa + 0.75, 31.2, F0 + 0.95, 0.3, '#D5DBE1');          // archivador
    chair(xc, 32.05, 's');                                                     // silla del asesor
    counter(xa + 0.04, 32.55, xb - 0.04, 33.2, 1.0, C.white, C.top);           // mostrador
    box(xc - 0.06, 32.64, xc + 0.06, 32.76, F0 + 1.05, 0.06, C.dark);          // base del monitor
    box(xc - 0.28, 32.66, xc + 0.28, 32.71, F0 + 1.1, 0.36, C.dark);           // monitor
    box(xc - 0.22, 32.82, xc + 0.22, 32.97, F0 + 1.05, 0.02, '#3A3F47');       // teclado
    box(xb - 0.6, 32.65, xb - 0.32, 32.92, F0 + 1.05, 0.13, '#D5DBE1');        // impresora de tiquetes
    gl(xa + 0.06, 33.16, xb - 0.06, 33.2, F0 + 1.05, 1.05);                    // ventanilla
    box(xa + 0.04, 33.15, xb - 0.04, 33.21, F0 + 2.1, 0.05, C.metal);
    box(xa + 0.12, 33.21, xb - 0.12, 33.31, F0 + 2.18, 0.42, signColors[i], true);   // letrero de la empresa
    box(xa + 0.45, 33.3, xb - 0.45, 33.33, F0 + 2.32, 0.1, '#FFFFFF', true);
  }
  for (let i = 0; i <= 6; i++) { const x = mx0 + i * mw; box(x - 0.04, 30.76, x + 0.04, 33.22, F0, 2.15, C.partition); }
  // Filas organizadas frente a cada módulo
  for (let i = 1; i <= 5; i++) {
    const x = mx0 + i * mw;
    post(x, 33.75); post(x, 35.55);
    box(x - 0.015, 33.75, x + 0.015, 35.55, F0 + 0.84, 0.05, C.belt);
  }
  post(mx0 + 0.15, 33.75); post(mx0 + 0.15, 35.55); box(mx0 + 0.135, 33.75, mx0 + 0.165, 35.55, F0 + 0.84, 0.05, C.belt);
  // Bancas de espera junto a la fachada
  [[12.0, 16.6], [20.2, 24.8]].forEach(([a, b]) => {
    box(a, 36.95, b, 37.42, F0, 0.44, C.seat);
    box(a, 37.3, b, 37.44, F0 + 0.44, 0.42, C.seatBack);
  });

  /* =====================================================================
     EQUIPAJES Y ENCOMIENDAS  [9.6, 12.6, 21.0, 19.8]
     ===================================================================== */
  const luggage = ['#B88B5A', '#A47548', '#C9A26E', '#2F5A86', '#B03A2E', '#2E7D5B', '#3A3F47', '#D9B26F'];
  counter(17.5, 14.4, 18.1, 18.7, 1.0);                                        // mostrador de recepción
  box(17.62, 16.0, 17.67, 16.56, F0 + 1.1, 0.34, C.dark);                      // monitor
  chair(16.9, 16.3, 'e');
  box(18.5, 17.4, 19.4, 18.3, F0, 0.07, '#8A949E');                            // báscula
  box(19.3, 18.2, 19.38, 18.28, F0, 1.0, '#5B6673');
  box(19.22, 18.16, 19.46, 18.3, F0 + 1.0, 0.14, C.dark);
  [[10.0, 10.75], [11.7, 12.45], [13.4, 14.15]].forEach(([a, b]) =>
    shelving(a, 13.3, b, 19.0, 'e', 2.1, 4, luggage, { frame: '#7D8996', backPanel: false }));
  const cart = (x, z) => {
    box(x - 0.4, z - 0.6, x + 0.4, z + 0.6, F0 + 0.12, 0.05, C.metal);
    box(x - 0.4, z - 0.62, x + 0.4, z - 0.57, F0 + 0.12, 1.0, C.metal);
    box(x - 0.32, z - 0.45, x + 0.05, z + 0.12, F0 + 0.17, 0.55, '#2F5A86');
    box(x + 0.08, z - 0.4, x + 0.34, z + 0.42, F0 + 0.17, 0.38, '#B03A2E');
  };
  cart(15.5, 14.6); cart(15.5, 16.9);
  box(15.0, 18.25, 16.5, 19.45, F0, 0.14, C.woodDark);                          // estiba con encomiendas
  box(15.1, 18.35, 15.75, 18.95, F0 + 0.14, 0.45, '#C9A26E');
  box(15.85, 18.35, 16.4, 18.9, F0 + 0.14, 0.35, '#B88B5A');
  box(15.1, 19.0, 15.95, 19.38, F0 + 0.14, 0.3, '#A47548');
  box(15.2, 18.45, 15.7, 18.9, F0 + 0.59, 0.28, '#D9B26F');

  /* =====================================================================
     SERVICIOS SANITARIOS  [9.6, 19.8, 21.0, 29.0]
     Dos baterías (hombres al norte, mujeres al sur) separadas por un muro.
     ===================================================================== */
  box(9.74, 24.36, 17.4, 24.44, F0, 1.9, '#C9D3DD');                            // muro divisorio
  // Fila de cabinas apoyada en un muro horizontal (z = zWall); `dir` = +1 si se abren hacia el sur.
  const cubicleRowH = (x0, n, w, zWall, depth, dir) => {
    const zf = zWall + dir * depth;                                              // línea frontal
    for (let i = 0; i <= n; i++) {
      const x = x0 + i * w;
      box(x - 0.04, Math.min(zWall, zf), x + 0.04, Math.max(zWall, zf), F0 + 0.1, 1.45, C.partition);
    }
    for (let i = 0; i < n; i++) {
      const xb = x0 + i * w;
      box(xb + 0.02, zf - 0.04, xb + 0.22, zf + 0.04, F0 + 0.1, 1.45, C.partition);          // pilastras
      box(xb + w - 0.22, zf - 0.04, xb + w - 0.02, zf + 0.04, F0 + 0.1, 1.45, C.partition);
      box(xb + 0.2, zf, xb + 0.24, zf + dir * 0.6, F0 + 0.15, 1.35, C.door);                // puerta abierta
      toilet(xb + w / 2, zWall + dir * 0.44, dir > 0 ? 's' : 'n');
    }
  };
  // Hombres: cabinas contra el muro norte, orinales en el muro oeste
  cubicleRowH(9.74, 4, 1.45, 19.94, 1.55, 1);
  [22.3, 23.1, 23.9].forEach((z, i) => {
    box(9.74, z - 0.18, 10.04, z + 0.18, F0 + 0.42, 0.6, C.porcelain);
    if (i < 2) box(9.74, z + 0.38, 10.3, z + 0.42, F0 + 0.45, 0.75, C.partition);
  });
  sinkCounter(13.6, 23.76, 17.2, 24.32, 3);
  box(13.6, 24.31, 17.2, 24.36, F0 + 1.08, 0.7, C.mirror, true);
  // Mujeres: cabinas contra el muro divisorio y contra el muro oeste
  cubicleRowH(9.74, 3, 1.2, 24.44, 1.55, 1);
  for (let i = 0; i < 2; i++) {
    const zb = 26.6 + i * 1.13;
    box(9.74, zb - 0.04, 11.3, zb + 0.04, F0 + 0.1, 1.45, C.partition);
    box(11.26, zb + 0.02, 11.34, zb + 0.2, F0 + 0.1, 1.45, C.partition);
    box(11.26, zb + 0.93, 11.34, zb + 1.11, F0 + 0.1, 1.45, C.partition);
    toilet(10.18, zb + 0.565, 'e');
  }
  box(9.74, 28.82, 11.3, 28.86, F0 + 0.1, 1.45, C.partition);
  sinkCounter(13.6, 24.48, 17.2, 25.04, 3);
  box(13.6, 24.44, 17.2, 24.49, F0 + 1.08, 0.7, C.mirror, true);
  // Señalización de acceso y papeleras
  box(17.36, 23.85, 17.44, 24.36, F0 + 1.55, 0.45, '#3E7CB1', true);
  box(17.36, 24.44, 17.44, 24.95, F0 + 1.55, 0.45, '#C2577A', true);
  box(20.7, 21.6, 20.86, 22.0, F0 + 1.0, 0.35, '#D5DBE1');                      // secador de manos
  box(20.7, 26.8, 20.86, 27.2, F0 + 1.0, 0.35, '#D5DBE1');
  bin(19.9, 20.6); bin(19.9, 28.2);

  /* =====================================================================
     ÁREA DE CONDUCTORES  [48.4, 12.6, 66.0, 18.8]
     ===================================================================== */
  [[50.6, 53.6], [56.4, 59.4]].forEach(([a, b]) => {
    table(a, 14.9, b, 16.1);
    [a + 0.5, (a + b) / 2, b - 0.5].forEach(x => { chair(x, 14.45, 's'); chair(x, 16.55, 'n'); });
  });
  lockers(65.3, 13.0, 65.86, 18.4, 'w');
  counter(57.4, 12.76, 60.6, 13.36, 0.9, '#D9DDE2');                           // estación de café
  box(57.6, 12.82, 58.1, 13.22, F0 + 0.95, 0.48, C.dark);
  box(58.5, 12.8, 59.1, 13.22, F0 + 0.95, 0.32, '#5B6673');
  box(61.0, 12.8, 61.4, 13.2, F0, 1.05, '#E9EDF1');                            // dispensador de agua
  cyl(61.2, 13.0, 0.14, F0 + 1.05, 0.42, '#8EC3E6');
  screen(49.4, 12.76, 51.6, 12.83, F0 + 1.35, 0.95, { color: '#24435F' });
  box(62.3, 12.76, 64.6, 12.81, F0 + 1.2, 0.85, C.wood, true);                 // cartelera
  box(54.2, 18.2, 60.6, 18.64, F0, 0.44, C.fabric);
  box(54.2, 18.5, 60.6, 18.66, F0 + 0.44, 0.42, C.fabricDark);
  potPlant(49.1, 18.1);

  /* =====================================================================
     SALA DE DESCANSO  [48.4, 18.8, 57.4, 24.9]
     ===================================================================== */
  box(50.0, 20.2, 55.2, 23.6, F0, 0.015, '#9FB3C8');                            // tapete
  sofa(48.6, 19.9, 49.5, 23.6, 'e');
  sofa(50.4, 23.86, 54.8, 24.74, 'n');
  sofa(55.6, 19.4, 56.5, 20.4, 'w', C.fabricDark);
  sofa(55.6, 22.7, 56.5, 23.7, 'w', C.fabricDark);
  box(51.4, 21.2, 53.6, 22.1, F0, 0.34, C.woodDark);
  box(51.2, 21.0, 53.8, 22.3, F0 + 0.34, 0.05, C.wood);
  screen(49.4, 18.96, 51.8, 19.03, F0 + 1.3, 0.95, { color: '#24435F' });
  potPlant(56.9, 24.35);
  cyl(48.95, 24.35, 0.15, F0, 0.03, C.dark); cyl(48.95, 24.35, 0.03, F0, 1.55, C.dark); cyl(48.95, 24.35, 0.2, F0 + 1.55, 0.25, '#F3E5C0');

  /* =====================================================================
     BAÑOS Y DUCHAS  [57.4, 18.8, 66.0, 24.9]
     ===================================================================== */
  for (let i = 0; i < 2; i++) {
    const xb = 57.54 + i * 1.4;
    if (i > 0) box(xb - 0.04, 18.94, xb + 0.04, 20.44, F0 + 0.1, 1.45, C.partition);
    box(xb + 0.02, 20.4, xb + 0.24, 20.48, F0 + 0.1, 1.45, C.partition);
    box(xb + 1.16, 20.4, xb + 1.38, 20.48, F0 + 0.1, 1.45, C.partition);
    toilet(xb + 0.7, 19.37, 's');
  }
  box(60.3, 18.94, 60.38, 20.44, F0 + 0.1, 1.45, C.partition);
  for (let i = 0; i <= 3; i++) { const z = 19.1 + i * 1.5; box(64.4, z - 0.04, 65.86, z + 0.04, F0, 2.0, C.partition); }
  for (let i = 0; i < 3; i++) {
    const z0 = 19.1 + i * 1.5;
    box(64.46, z0 + 0.06, 65.84, z0 + 1.44, F0, 0.05, '#E3EAF0');              // plato de ducha
    gl(64.38, z0 + 0.08, 64.42, z0 + 1.42, F0 + 0.05, 1.9);                    // mampara
    box(65.78, z0 + 0.72, 65.84, z0 + 0.78, F0 + 0.9, 1.12, C.metal);          // tubería
    box(65.5, z0 + 0.6, 65.84, z0 + 0.9, F0 + 2.0, 0.07, C.metal, true);       // regadera
  }
  sinkCounter(58.0, 24.2, 62.6, 24.76, 3);
  box(58.0, 24.72, 62.6, 24.76, F0 + 1.08, 0.7, C.mirror, true);
  box(60.8, 21.5, 63.4, 21.95, F0, 0.44, C.wood);                             // banca de vestier
  lockers(57.54, 22.6, 58.0, 24.0, 'e');

  /* =====================================================================
     ÁREA DE ALIMENTACIÓN  [48.4, 24.9, 66.0, 29.0]
     ===================================================================== */
  counter(65.25, 25.1, 65.86, 28.0, 0.9, '#D9DDE2');                           // cocina
  box(65.3, 26.0, 65.84, 26.8, F0 + 0.95, 0.03, C.dark);
  box(65.3, 25.9, 65.86, 26.9, F0 + 1.85, 0.45, C.metal, true);                // campana
  box(65.2, 28.05, 65.86, 28.84, F0, 1.95, '#E9EDF1');                         // nevera
  counter(61.0, 25.3, 61.6, 28.3, 1.05);                                       // mostrador de venta
  gl(61.05, 25.5, 61.55, 27.0, F0 + 1.1, 0.4);                                 // vitrina
  box(61.12, 25.6, 61.48, 25.95, F0 + 1.1, 0.1, '#E0A82E');
  box(61.12, 26.05, 61.48, 26.4, F0 + 1.1, 0.1, '#C0392B');
  box(61.12, 26.5, 61.48, 26.85, F0 + 1.1, 0.1, '#8C5A3C');
  box(61.1, 27.5, 61.5, 27.9, F0 + 1.1, 0.22, C.dark);                         // caja registradora
  screen(61.9, 25.06, 64.9, 25.13, F0 + 1.7, 0.8, { color: '#283544', lines: 3 }); // menú
  box(49.0, 25.06, 59.8, 25.22, F0, 1.0, C.woodDark);                          // barra
  box(49.0, 25.06, 59.8, 25.5, F0 + 1.0, 0.05, C.wood);
  for (let x = 49.5; x <= 59.4; x += 0.9) stool(x, 25.85);
  [50.4, 52.9, 55.4, 57.9].forEach(x => {
    roundTable(x, 27.85);
    chair(x - 0.7, 27.85, 'e'); chair(x + 0.7, 27.85, 'w'); chair(x, 27.2, 's'); chair(x, 28.5, 'n');
  });
  box(60.15, 28.3, 60.6, 28.75, F0, 0.7, C.green);                             // punto de reciclaje
  box(59.65, 28.3, 60.1, 28.75, F0, 0.7, '#5B6673');

  /* =====================================================================
     LOCALES COMERCIALES 1–4  [44.2–66.0, 30.6–37.6]
     ===================================================================== */
  const localPalettes = [
    ['#E07A3A', ['#E07A3A', '#F2C230', '#C0392B', '#FFFFFF', '#8C5A3C']],
    ['#2E9E6B', ['#2E9E6B', '#A9D18E', '#FFFFFF', '#3E7CB1', '#E9EDF1']],
    ['#3E7CB1', ['#3E7CB1', '#183B5B', '#9FC3DC', '#F4F5F7', '#E0A82E']],
    ['#8E6AB0', ['#8E6AB0', '#C2577A', '#F4D5D7', '#FFFFFF', '#5E7A99']]
  ];
  ['local1', 'local2', 'local3', 'local4'].forEach((id, k) => {
    const [a, , b] = SPACE_BY_ID[id].rects[0];
    const [accent, palette] = localPalettes[k];
    const cx = a + (b - a) * 0.56;
    shelving(a + 0.25, 30.76, b - 0.25, 31.3, 's', 2.0, 4, palette);           // estantería posterior
    shelving(a + 0.16, 31.7, a + 0.62, 34.6, 'e', 1.6, 3, palette);            // estantería lateral
    shelving(cx - 0.4, 32.4, cx - 0.02, 34.4, 'w', 1.3, 3, palette, { frame: '#E2DCD0' }); // góndola
    shelving(cx + 0.02, 32.4, cx + 0.4, 34.4, 'e', 1.3, 3, palette, { frame: '#E2DCD0' });
    counter(a + 0.4, 35.4, a + 2.4, 36.0, 1.0);                                // mostrador
    box(a + 0.6, 35.55, a + 1.0, 35.85, F0 + 1.05, 0.2, C.dark);               // caja
    box(a + 0.5, 37.62, b - 0.5, 37.72, 2.2, 0.5, accent, true);               // aviso exterior
    box(a + 1.2, 37.71, b - 1.2, 37.74, 2.38, 0.12, '#FFFFFF', true);
  });

  /* =====================================================================
     VESTÍBULO PRINCIPAL  [25.8, 29.0, 44.2, 37.6]
     ===================================================================== */
  box(33.4, 32.75, 36.6, 33.25, F0, 1.05, C.white);                            // punto de información
  box(33.4, 31.9, 33.9, 32.75, F0, 1.05, C.white);
  box(36.1, 31.9, 36.6, 32.75, F0, 1.05, C.white);
  box(33.35, 32.7, 36.65, 33.3, F0 + 1.05, 0.05, C.top);
  box(33.35, 31.85, 33.95, 32.7, F0 + 1.05, 0.05, C.top);
  box(36.05, 31.85, 36.65, 32.7, F0 + 1.05, 0.05, C.top);
  chair(35.0, 32.2, 's');
  box(34.7, 32.78, 35.3, 32.83, F0 + 1.15, 0.34, C.dark);
  box(34.2, 32.95, 35.8, 33.05, F0 + 2.35, 0.5, C.green, true);                // letrero "i"
  box(34.95, 33.04, 35.05, 33.08, F0 + 2.45, 0.3, '#FFFFFF', true);
  [31.8, 38.2].forEach(x => {                                                  // tótems de orientación
    box(x - 0.3, 35.92, x + 0.3, 36.08, F0, 1.8, C.dark);
    box(x - 0.24, 36.07, x + 0.24, 36.1, F0 + 0.55, 1.1, C.screen);
  });
  screen(31.8, 29.3, 38.2, 29.42, F0 + 2.55, 1.0, { lines: 5 });              // tablero de salidas
  [[27.2, 29.8], [40.2, 42.8]].forEach(([a, b]) => {                           // bancas
    box(a, 32.3, b, 32.75, F0, 0.42, C.wood);
    box(a + 0.05, 32.35, b - 0.05, 32.7, F0 + 0.42, 0.05, C.seat);
  });
  box(33.5, 36.5, 36.5, 37.44, F0, 0.012, '#3A3F47');                          // tapete de acceso
  planter(26.4, 29.8, 27.8, 31.2, F0, 0.55);
  planter(42.4, 29.8, 43.8, 31.2, F0, 0.55);
  planter(26.4, 35.6, 27.8, 37.0, F0, 0.55);
  planter(42.4, 35.6, 43.8, 37.0, F0, 0.55);

  /* ---------- Exteriores cercanos: plaza y andén ---------- */
  planter(23.4, 40.6, 25.2, 42.4, 0, 0.45);
  planter(42.4, 40.6, 44.2, 42.4, 0, 0.45);
  box(30.0, 41.3, 33.0, 41.9, 0, 0.42, '#8F8A80');
  box(37.0, 41.3, 40.0, 41.9, 0, 0.42, '#8F8A80');
  SPACE_BY_ID.plataformas.partes.forEach(p => {                                 // señal de cada plataforma
    cyl(p.cx + 2.9, 11.95, 0.05, 0, 2.5, C.metal);
    box(p.cx + 2.55, 11.9, p.cx + 3.25, 12.0, 2.45, 0.55, '#183B5B', true);
    box(p.cx + 2.75, 11.89, p.cx + 3.05, 12.01, 2.57, 0.3, '#FFFFFF', true);
  });

  /* ---------- Mallas instanciadas ---------- */
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const makeBoxes = (list, material) => {
    const mesh = new THREE.InstancedMesh(boxGeo, material, Math.max(1, list.length));
    list.forEach(([x0, z0, x1, z1, y0, h, col], i) => {
      dummy.position.set(wx((x0 + x1) / 2), y0 + h / 2, wz((z0 + z1) / 2));
      dummy.scale.set(Math.max(0.01, x1 - x0), Math.max(0.005, h), Math.max(0.01, z1 - z0));
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (col) mesh.setColorAt(i, color.set(col));
    });
    mesh.count = list.length;
    return mesh;
  };
  const lowMesh = makeBoxes(low, new THREE.MeshLambertMaterial({ color: 0xffffff }));
  const highMesh = makeBoxes(high, new THREE.MeshLambertMaterial({ color: 0xffffff }));

  const cylMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 16), new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, cyls.length));
  cyls.forEach(([x, z, r, y0, h, col], i) => {
    dummy.position.set(wx(x), y0 + h / 2, wz(z));
    dummy.scale.set(r, h, r);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    cylMesh.setMatrixAt(i, dummy.matrix);
    cylMesh.setColorAt(i, color.set(col));
  });
  cylMesh.count = cyls.length;

  const glassMat = new THREE.MeshPhongMaterial({ color: 0xbfdcee, specular: 0xffffff, shininess: 90, transparent: true, opacity: 0.38, depthWrite: false });
  const glassMesh = makeBoxes(glass.map(g => [...g, null]), glassMat);
  glassMesh.renderOrder = 2;

  [lowMesh, highMesh, cylMesh].forEach(m => { m.castShadow = shadows; m.receiveShadow = shadows; });

  const group = new THREE.Group();
  group.name = 'mobiliario';
  group.add(lowMesh, cylMesh, glassMesh, highMesh);
  return { group, high: highMesh, plants, counts: { boxes: low.length + high.length, cylinders: cyls.length, glass: glass.length } };
}
