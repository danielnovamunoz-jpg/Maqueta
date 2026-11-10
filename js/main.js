/* ==========================================================================
   Terminal Intermunicipal de Vélez – Interacción general del sitio
   ========================================================================== */
import {
  SPACES, SPACE_BY_ID, ZONES, DISTRIBUTION, DIMENSION_ROWS, TOUR_ORDER,
  NOTA_CONCEPTUAL, PLATFORM_ANGLE, PLATFORM_SIZE
} from './spaces.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const isDesktop = () => window.matchMedia('(min-width: 960px)').matches;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Iconos (Lucide vía CDN, carga asíncrona) ---------- */
function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  }
}
const lucideScript = document.getElementById('lucide-js');
if (window.lucide) refreshIcons();
else if (lucideScript) lucideScript.addEventListener('load', refreshIcons, { once: true });

/* ==========================================================================
   Encabezado, progreso de lectura, menú móvil y navegación activa
   ========================================================================== */
const header = $('#site-header');
const progressBar = $('#progress-bar');
const toTop = $('#to-top');
let viewerInView = false;
let ticking = false;

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  header.classList.toggle('is-scrolled', y > 24);
  progressBar.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
  const showTop = y > 900 && !viewerInView;
  toTop.hidden = false;
  toTop.classList.toggle('is-visible', showTop);
  ticking = false;
}
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
window.addEventListener('resize', () => requestAnimationFrame(onScroll), { passive: true });
onScroll();
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

// Menú móvil
const menuToggle = $('#menu-toggle');
const mobileMenu = $('#mobile-menu');
function setMenu(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  mobileMenu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  document.body.classList.toggle('is-locked', open);
  if (open) $('.mobile-menu__link', mobileMenu)?.focus({ preventScroll: true });
}
menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
mobileMenu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!mobileMenu.hidden) { setMenu(false); menuToggle.focus(); }
});
window.matchMedia('(min-width: 1200px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

// Enlace activo según la sección visible
const navLinks = $$('.nav__link, .mobile-menu__link');
const sectionIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const id = en.target.id;
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => sectionIO.observe(s));

/* ==========================================================================
   Animaciones de aparición
   ========================================================================== */
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-visible'); revealIO.unobserve(en.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
function observeReveals(root = document) {
  $$('.reveal:not(.is-visible)', root).forEach(el => {
    const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
    const i = siblings.indexOf(el);
    if (siblings.length > 1 && i > 0) el.style.setProperty('--d', `${Math.min(i, 6) * 70}ms`);
    revealIO.observe(el);
  });
}

/* ==========================================================================
   B · Diagrama de dispersión
   ========================================================================== */
(function dispersionDiagram() {
  const fig = $('#dispersion-diagram');
  if (!fig) return;
  const svg = $('.diagram__svg', fig);
  const chips = $$('.chip', fig);
  let userTouched = false;
  const set = state => {
    svg.classList.toggle('is-central', state === 'propuesta');
    chips.forEach(c => { const on = c.dataset.state === state; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', String(on)); });
  };
  chips.forEach(c => c.addEventListener('click', () => { userTouched = true; set(c.dataset.state); }));
  const io = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    setTimeout(() => { if (!userTouched) set('propuesta'); }, reduceMotion ? 0 : 1800);
  }, { threshold: 0.5 });
  io.observe(fig);
})();

/* ==========================================================================
   Utilidades de planta 2D (zonificación y plano alternativo)
   ========================================================================== */
const nums = s => (String(s).match(/\d+(?:,\d+)?/g) || []).map(x => parseFloat(x.replace(',', '.')));
function hasDiscrepancy(m) {
  if (!m || m.cuadro === '—') return false;
  const c = nums(m.cuadro), p = nums(m.planta), b = nums(m.boceto);
  let diff = false;
  if (m.planta !== '—' && p.length) {
    if (p.length >= 2) diff = [...c].sort().join() !== [...p].sort().join();
    else diff = !c.includes(p[0]);
  }
  if (b.length && c.length >= 2 && Math.abs(c[0] * c[1] - b[0]) > 0.5) diff = true;
  return diff;
}

const EXT_FILL = { plaza: '#E8DCC5', parqueadero: '#AEB5BE', motos: '#AEB5BE', acopio: '#E3D9BF', bahia: '#E3D9BF', vias: '#C3C8CF', verdes: '#A9C98A' };
const ORDER_2D = ['verdes', 'vias', 'plataformas', 'parqueadero', 'motos', 'plaza', 'acopio', 'bahia'];

function rectSVG([x0, z0, x1, z1], fill, extra = '') {
  return `<rect x="${x0}" y="${z0}" width="${(x1 - x0).toFixed(2)}" height="${(z1 - z0).toFixed(2)}" fill="${fill}" ${extra}/>`;
}

function buildPlanSVG(mode) {
  const zoning = mode === 'zoning';
  const cls = zoning ? 'zn-space' : 'p2d-space';
  const parts = [];
  parts.push(`<svg viewBox="-0.5 -0.5 71 61" xmlns="http://www.w3.org/2000/svg" role="${zoning ? 'img' : 'group'}" aria-label="${zoning ? 'Zonificación de la terminal' : 'Plano 2D interactivo de la terminal'}">`);
  parts.push(`<rect x="-0.5" y="-0.5" width="71" height="61" rx="1.2" fill="#2B3038"/>`);
  parts.push(`<rect x="0" y="0" width="70" height="60" fill="${zoning ? '#EEF1F4' : '#BFD6A6'}"/>`);
  parts.push(`<rect x="9.0" y="11.6" width="58.6" height="26.8" fill="${zoning ? '#E3E7EC' : '#DCD8CF'}"/>`);

  const fillFor = s => {
    if (zoning) return ZONES[s.zona].color;
    if (s.tipo === 'room') return s.piso;
    if (s.tipo === 'platform') return '#9AA2AC';
    return EXT_FILL[s.id] || '#ccc';
  };
  const opacityFor = s => (zoning ? (s.tipo === 'room' ? 0.9 : s.id === 'verdes' || s.id === 'vias' ? 0.35 : 0.6) : 1);

  const ordered = [...ORDER_2D.map(id => SPACE_BY_ID[id]), ...SPACES.filter(s => s.tipo === 'room')];
  ordered.forEach(s => {
    const fill = fillFor(s);
    const op = opacityFor(s);
    const attrs = zoning
      ? `class="${cls}" data-id="${s.id}" data-zone="${s.zona}"`
      : `class="${cls}" data-id="${s.id}" tabindex="0" role="button" aria-label="${esc(s.nombre)}"`;
    let inner = s.rects.map(r => rectSVG(r, fill, `fill-opacity="${op}" class="p2d-fill"`)).join('');
    if (s.tipo === 'platform') {
      inner += s.partes.map(p => {
        const w = PLATFORM_SIZE.w, d = PLATFORM_SIZE.d;
        return `<rect data-part="${p.id}" x="${-w / 2}" y="${-d / 2}" width="${w}" height="${d}" rx=".5" transform="translate(${p.cx} ${p.cz}) rotate(${-PLATFORM_ANGLE})" fill="${zoning ? fill : '#F4F5F7'}" fill-opacity="${zoning ? 0.95 : 1}" stroke="#fff" stroke-width=".25"/>`;
      }).join('');
      if (!zoning) inner += s.partes.map(p => `<text x="${p.cx - 2.4}" y="${p.cz + 3.4}" class="p2d-text" text-anchor="middle">${p.id}</text>`).join('');
    }
    if (s.tipo === 'room') {
      const [x0, z0, x1, z1] = s.rects[0];
      const w = x1 - x0;
      const label = s.grupo === 'locales' ? s.corto.replace('Local ', 'L') : s.corto;
      if (w >= 5 || s.grupo === 'locales') {
        inner += `<text x="${(x0 + x1) / 2}" y="${(z0 + z1) / 2 + 0.45}" text-anchor="middle" class="p2d-text${w < 9 ? ' p2d-text--small' : ''}" ${zoning ? 'fill="#fff"' : ''}>${esc(label)}</text>`;
      }
    } else if (!zoning && s.id !== 'verdes' && s.id !== 'vias' && s.tipo !== 'platform') {
      const [x0, z0, x1, z1] = s.rects[0];
      const vertical = (z1 - z0) > (x1 - x0) * 1.6;
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      inner += `<text x="${cx}" y="${cz + 0.4}" text-anchor="middle" class="p2d-text p2d-text--small" ${vertical ? `transform="rotate(-90 ${cx} ${cz})"` : ''}>${esc(s.corto)}</text>`;
    }
    parts.push(`<g ${attrs}>${inner}</g>`);
  });
  if (!zoning) {
    parts.push(`<text x="7.3" y="59.3" text-anchor="middle" class="p2d-text p2d-text--small" fill="#0F2742">Entrada ↑</text>`);
    parts.push(`<text x="66" y="59.3" text-anchor="middle" class="p2d-text p2d-text--small" fill="#0F2742">Salida ↓</text>`);
  }
  parts.push('</svg>');
  return parts.join('');
}

/* ==========================================================================
   E · Distribución (zonificación + lista por zonas)
   ========================================================================== */
(function distribution() {
  const svgHost = $('#zoning-svg');
  const list = $('#zones-list');
  if (!svgHost || !list) return;
  svgHost.innerHTML = buildPlanSVG('zoning');
  const fig = svgHost.closest('.zoning');

  list.innerHTML = DISTRIBUTION.map(group => {
    const z = ZONES[group.zona];
    return `<article class="zone reveal" data-zone="${z.id}" style="--zc:${z.color}">
      <div class="zone__head">
        <span class="zone__swatch" aria-hidden="true"></span>
        <div>
          <h3><button type="button" class="zone__btn" data-zone="${z.id}" aria-pressed="false">${esc(z.nombre)}</button></h3>
          <p>${esc(z.descripcion)}</p>
        </div>
        <span class="zone__count">${group.items.length} espacios</span>
      </div>
      <ul class="zone__items">
        ${group.items.map(it => `<li><button type="button" class="space-chip" data-goto="${it.id}" aria-label="Ver ${esc(it.label)} en el modelo 3D"><i data-lucide="box" class="ico"></i>${esc(it.label)}</button></li>`).join('')}
      </ul>
    </article>`;
  }).join('');

  let focusZone = null;
  const setFocus = zone => {
    focusZone = zone === focusZone ? null : zone;
    fig.classList.toggle('has-focus', !!focusZone);
    $$('.zn-space', svgHost).forEach(g => g.classList.toggle('is-focus', g.dataset.zone === focusZone));
    $$('.zone', list).forEach(a => a.classList.toggle('is-focus', a.dataset.zone === focusZone));
    $$('.zone__btn', list).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.zone === focusZone)));
  };
  list.addEventListener('click', e => {
    const zb = e.target.closest('.zone__btn');
    if (zb) setFocus(zb.dataset.zone);
  });
  svgHost.addEventListener('click', e => {
    const g = e.target.closest('.zn-space');
    if (g) setFocus(g.dataset.zone);
  });
})();

/* ==========================================================================
   F · Cuadro de dimensiones
   ========================================================================== */
(function dimensionsTable() {
  const tbody = $('#dims-table tbody');
  if (!tbody) return;
  tbody.innerHTML = DIMENSION_ROWS.map(row => {
    const s = SPACE_BY_ID[row.id];
    const m = s.medidas;
    const warn = hasDiscrepancy(m);
    return `<tr>
      <td data-label="Espacio"><button type="button" class="row-btn" data-goto="${row.id}" aria-label="Ver ${esc(row.label)} en el modelo 3D">${esc(row.label)}</button>${warn ? ' <span class="badge badge--warn">Verificar</span>' : ''}</td>
      <td data-label="Cuadro de medidas (cm)" class="num">${esc(m.cuadro)}</td>
      <td data-label="Cota en planta (cm)" class="num">${esc(m.planta)}</td>
      <td data-label="Boceto preliminar" class="num">${esc(m.boceto)}</td>
    </tr>`;
  }).join('');
})();

/* ==========================================================================
   H · Presupuesto (contador)
   ========================================================================== */
(function budgetCounter() {
  const el = $('.budget__value[data-count]');
  if (!el) return;
  const target = Number(el.dataset.count);
  const fmt = n => Math.round(n).toLocaleString('es-CO');
  if (reduceMotion) return;
  const io = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    const t0 = performance.now(), dur = 1400;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = fmt(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(target);
    };
    requestAnimationFrame(step);
  }, { threshold: 0.6 });
  io.observe(el);
})();

/* ==========================================================================
   Galería + visor de imágenes
   ========================================================================== */
(function gallery() {
  const items = $$('.gallery__btn');
  const lb = $('#lightbox');
  const img = $('#lightbox-img');
  const cap = $('#lightbox-cap');
  const scroller = $('.gallery-scroller');
  let idx = 0, lastFocus = null;

  const show = i => {
    idx = (i + items.length) % items.length;
    const b = items[idx];
    img.src = b.dataset.full;
    img.alt = b.querySelector('img').alt;
    cap.textContent = b.dataset.caption || '';
  };
  const open = i => {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.classList.add('is-locked');
    $('[data-lb="close"]', lb).focus();
  };
  const close = () => {
    lb.hidden = true;
    img.removeAttribute('src');
    document.body.classList.remove('is-locked');
    lastFocus && lastFocus.focus({ preventScroll: true });
  };
  items.forEach((b, i) => b.addEventListener('click', () => open(i)));
  lb.addEventListener('click', e => {
    const a = e.target.closest('[data-lb]');
    if (a) { const act = a.dataset.lb; if (act === 'close') close(); else show(idx + (act === 'next' ? 1 : -1)); return; }
    if (e.target === lb || e.target.classList.contains('lightbox__figure')) close();
  });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'Tab') {
      const f = $$('button', lb);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let sx = null;
  lb.addEventListener('pointerdown', e => { sx = e.clientX; });
  lb.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  });
  $$('[data-gallery]').forEach(b => b.addEventListener('click', () => {
    const w = items[0].closest('.gallery__item').getBoundingClientRect().width + 14;
    scroller.scrollBy({ left: b.dataset.gallery === 'next' ? w : -w, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));
})();

/* ==========================================================================
   Ubicación: mapa embebido (carga diferida), modo táctil y copia de coordenadas
   ========================================================================== */
(function locationMap() {
  const frame = $('#map-frame');
  if (!frame) return;
  const iframe = $('#map-iframe');
  const guard = $('#map-guard');
  const LAT = 6.009761, LNG = -73.669543;
  const mapUrl = type => `https://maps.google.com/maps?q=${LAT},${LNG}&z=${type === 'k' ? 17 : 16}&t=${type}&hl=es&output=embed`;
  let type = 'm';
  let loaded = false;

  const load = () => {
    frame.classList.remove('is-loaded');
    iframe.src = mapUrl(type);
    loaded = true;
  };
  iframe.addEventListener('load', () => { if (iframe.getAttribute('src')) frame.classList.add('is-loaded'); });

  // El mapa solo se solicita cuando la sección se acerca a la pantalla.
  const nearIO = new IntersectionObserver(entries => {
    if (entries.some(en => en.isIntersecting)) { nearIO.disconnect(); if (!loaded) load(); }
  }, { rootMargin: '600px 0px' });
  nearIO.observe(frame);

  $$('[data-maptype]').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.maptype === type && loaded) return;
    type = btn.dataset.maptype;
    $$('[data-maptype]').forEach(b => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
    load();
  }));

  // En pantallas táctiles el mapa no captura el desplazamiento de la página hasta que se toca.
  if (coarse) {
    guard.hidden = false;
    guard.addEventListener('click', () => { guard.hidden = true; });
    new IntersectionObserver(entries => {
      if (entries.every(en => !en.isIntersecting)) guard.hidden = false;
    }).observe(frame);
  }

  const copyBtn = $('#copy-coords');
  const copyLabel = $('#copy-label');
  let copyTimer = 0;
  const legacyCopy = text => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(ta);
    return ok;
  };
  copyBtn.addEventListener('click', async () => {
    const text = copyBtn.dataset.coords;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = legacyCopy(text); }
    copyLabel.textContent = ok ? 'Copiado' : 'No se pudo copiar';
    copyBtn.classList.toggle('is-copied', ok);
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copyLabel.textContent = 'Copiar'; copyBtn.classList.remove('is-copied'); }, 2200);
  });
})();

/* ==========================================================================
   D · Visor 3D, plano 2D alternativo y panel informativo
   ========================================================================== */
const viewerEl = $('#viewer');
const stage = $('#viewer-stage');
const poster = $('#viewer-poster');
const statusEl = $('#viewer-status');
const loadBtn = $('#viewer-load');
const hintEl = $('#viewer-hint');
const releaseBtn = $('#viewer-release');
const tooltip = $('#viewer-tooltip');
const planWrap = $('#viewer-plan');
const planHost = $('#plan2d');
const sheet = $('#info-sheet');
const sheetBody = $('#sheet-body');
const sheetHandle = $('#sheet-handle');

const V = {
  viewer: null,
  loading: null,
  mode: '3d',
  webgl: true,
  current: null,      // { id, part }
  sheetMode: null,    // 'space' | 'list' | null
  pending: null
};

/* ---------- Sugerencias ---------- */
let hintTimer = 0;
function hint(text, ms = 0) {
  clearTimeout(hintTimer);
  hintEl.textContent = text || '';
  hintEl.classList.toggle('is-hidden', !text);
  if (text && ms) hintTimer = setTimeout(() => hintEl.classList.add('is-hidden'), ms);
}

/* ---------- Panel (hoja inferior / tarjeta lateral) ---------- */
sheet.hidden = false;
sheet.inert = true;
sheet.setAttribute('aria-hidden', 'true');

function sheetInset() {
  if (!sheet.classList.contains('is-open')) return { right: 0, bottom: 0 };
  if (isDesktop()) return { right: sheet.offsetWidth + 12, bottom: 0 };
  const visible = sheet.classList.contains('is-peek') ? 118 : sheet.offsetHeight + 8;
  return { right: 0, bottom: Math.min(visible, stage.clientHeight * 0.72) };
}
function syncInsets() { if (V.viewer) V.viewer.setInsets(sheetInset()); }
new ResizeObserver(() => syncInsets()).observe(sheet);
window.matchMedia('(min-width: 960px)').addEventListener('change', () => syncInsets());

function openSheet(mode) {
  V.sheetMode = mode;
  sheet.classList.add('is-open');
  sheet.classList.remove('is-peek', 'is-full');
  sheet.inert = false;
  sheet.setAttribute('aria-hidden', 'false');
  viewerEl.classList.add('sheet-open');
  refreshIcons();
  const sc = $('.sheet__content', sheet);
  if (sc) sc.scrollTop = 0;
  syncInsets();
  requestAnimationFrame(syncInsets);
}
function closeSheet({ clear = true } = {}) {
  sheet.classList.remove('is-open', 'is-peek', 'is-full');
  sheet.inert = true;
  sheet.setAttribute('aria-hidden', 'true');
  viewerEl.classList.remove('sheet-open');
  V.sheetMode = null;
  syncInsets();
  if (clear) {
    V.current = null;
    markPlanSelection();
    if (V.viewer && V.viewer.getState().selected) V.viewer.clearSelection();
  }
}

function measuresHTML(s) {
  const m = s.medidas;
  if (!m || (m.cuadro === '—' && m.planta === '—' && m.boceto === '—')) return '';
  const warn = hasDiscrepancy(m);
  return `<section>
    <h4>Medidas de referencia ${warn ? '<span class="badge badge--warn">Verificar</span>' : ''}</h4>
    <dl class="measures">
      <div><dt>Cuadro de medidas (cm)</dt><dd>${esc(m.cuadro)}</dd></div>
      <div><dt>Cota en planta (cm)</dt><dd>${esc(m.planta)}</dd></div>
      <div><dt>Boceto preliminar</dt><dd>${esc(m.boceto)}</dd></div>
    </dl>
    <p class="sheet__muted">Medidas de maqueta a escala 1:100. Son referencias preliminares que deben verificarse en el plano definitivo.</p>
  </section>`;
}

function renderSpace(s, part) {
  const z = ZONES[s.zona];
  sheetBody.innerHTML = `
    <div class="sheet__head">
      <div>
        <p class="zone-tag" style="--zc:${z.color}"><span></span>${esc(z.nombre)}</p>
        <h3 id="sheet-title">${esc(s.nombre)}${part ? `<small>Plataforma ${esc(part)}</small>` : ''}</h3>
      </div>
      <button type="button" class="sheet__close" data-sheet="close" aria-label="Cerrar y volver a la vista general"><i data-lucide="x" class="ico"></i></button>
    </div>
    <div class="sheet__content">
      <section><h4>Función</h4><p>${esc(s.funcion)}</p></section>
      <section>
        <h4>Elementos</h4>
        <ul class="elements">${s.elementos.map(e => `<li><i data-lucide="check" class="ico"></i><span>${esc(e)}</span></li>`).join('')}</ul>
        <p class="sheet__muted">${esc(NOTA_CONCEPTUAL)}</p>
      </section>
      ${measuresHTML(s)}
    </div>
    <div class="sheet__actions">
      <button type="button" class="btn btn--primary btn--sm" data-sheet="back"><i data-lucide="rotate-ccw" class="ico"></i>Vista general</button>
      <div class="sheet__nav">
        <button type="button" class="round-btn" data-sheet="prev" aria-label="Espacio anterior"><i data-lucide="chevron-left" class="ico"></i></button>
        <button type="button" class="round-btn" data-sheet="next" aria-label="Espacio siguiente"><i data-lucide="chevron-right" class="ico"></i></button>
      </div>
    </div>`;
  openSheet('space');
}

function renderList() {
  const cur = V.current && V.current.id;
  sheetBody.innerHTML = `
    <div class="sheet__head">
      <div><p class="zone-tag"><span></span>${SPACES.length} espacios</p><h3 id="sheet-title">Espacios de la terminal</h3></div>
      <button type="button" class="sheet__close" data-sheet="close-list" aria-label="Cerrar lista"><i data-lucide="x" class="ico"></i></button>
    </div>
    <div class="sheet__content">
      <div class="space-groups">
        ${DISTRIBUTION.map(g => {
          const z = ZONES[g.zona];
          const ids = SPACES.filter(s => s.zona === g.zona).map(s => s.id);
          return `<section>
            <p class="zone-tag" style="--zc:${z.color}"><span></span>${esc(z.nombre)}</p>
            <ul class="space-list">${ids.map(id => `<li><button type="button" data-select="${id}" class="${id === cur ? 'is-current' : ''}">${esc(SPACE_BY_ID[id].nombre)}<i data-lucide="chevron-right" class="ico"></i></button></li>`).join('')}</ul>
          </section>`;
        }).join('')}
      </div>
    </div>`;
  openSheet('list');
}

sheet.addEventListener('click', e => {
  const b = e.target.closest('[data-sheet], [data-select]');
  if (!b) return;
  if (b.dataset.select) { selectSpace(b.dataset.select); return; }
  const act = b.dataset.sheet;
  if (act === 'close' || act === 'back') { closeSheet(); }
  else if (act === 'close-list') { if (V.current) renderSpace(SPACE_BY_ID[V.current.id], V.current.part); else closeSheet(); }
  else if (act === 'prev' || act === 'next') {
    const i = TOUR_ORDER.indexOf(V.current ? V.current.id : TOUR_ORDER[0]);
    const n = TOUR_ORDER[(i + (act === 'next' ? 1 : -1) + TOUR_ORDER.length) % TOUR_ORDER.length];
    selectSpace(n);
  }
});

// Arrastre del asa (móvil): contraer / expandir / cerrar
(function sheetDrag() {
  let y0 = null, moved = 0;
  sheetHandle.addEventListener('pointerdown', e => { y0 = e.clientY; moved = 0; sheetHandle.setPointerCapture(e.pointerId); });
  sheetHandle.addEventListener('pointermove', e => { if (y0 !== null) moved = e.clientY - y0; });
  sheetHandle.addEventListener('pointerup', () => {
    if (y0 === null) return;
    y0 = null;
    const peek = sheet.classList.contains('is-peek');
    const full = sheet.classList.contains('is-full');
    if (Math.abs(moved) < 6) {                       // toque: alterna contraído / normal
      if (peek) sheet.classList.remove('is-peek');
      else { sheet.classList.remove('is-full'); sheet.classList.add('is-peek'); }
    } else if (moved > 50) {                         // deslizar hacia abajo
      if (full) sheet.classList.remove('is-full');
      else if (peek) closeSheet();
      else sheet.classList.add('is-peek');
    } else if (moved < -40) {                        // deslizar hacia arriba
      if (peek) sheet.classList.remove('is-peek');
      else sheet.classList.add('is-full');
    }
    requestAnimationFrame(syncInsets);
  });
})();

/* ---------- Selección central ---------- */
function selectSpace(id, part = null, { focus = true } = {}) {
  const s = SPACE_BY_ID[id];
  if (!s) return;
  V.current = { id, part };
  markPlanSelection();
  if (V.mode === '3d' && V.viewer) {
    V.viewer.select(id, part, { focus });   // el evento 'select' abre el panel
  } else {
    renderSpace(s, part);
    if (V.viewer) V.viewer.select(id, part, { focus: false });
  }
}

/* ---------- Plano 2D ---------- */
function buildPlan() {
  if (planHost.childElementCount) return;
  planHost.innerHTML = buildPlanSVG('plan');
  planHost.addEventListener('click', e => {
    const g = e.target.closest('.p2d-space');
    if (!g) return;
    const part = e.target.dataset.part || null;
    selectSpace(g.dataset.id, part);
  });
  planHost.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const g = e.target.closest('.p2d-space');
    if (!g) return;
    e.preventDefault();
    selectSpace(g.dataset.id);
  });
  markPlanSelection();
}
function markPlanSelection() {
  $$('.p2d-space', planHost).forEach(g => g.classList.toggle('is-selected', !!V.current && g.dataset.id === V.current.id));
}

const toolButtons = $$('.tool', viewerEl);
const segButtons = $$('.seg__btn', viewerEl);
function setMode(mode) {
  if (mode === '3d' && !V.webgl) return;
  V.mode = mode;
  segButtons.forEach(b => { const on = b.dataset.mode === mode; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
  const is2d = mode === '2d';
  viewerEl.classList.toggle('mode-2d', is2d);
  if (is2d) buildPlan();
  planWrap.hidden = !is2d;
  toolButtons.forEach(b => { b.disabled = is2d; });
  $$('.viewer__zoom .v-btn', viewerEl).forEach(b => { b.disabled = is2d; });
  if (is2d) { hint(''); releaseBtn.hidden = true; }
  else {
    if (!V.viewer) initViewer();
    else if (V.current) V.viewer.select(V.current.id, V.current.part);
    updateHints();
  }
}
segButtons.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

/* ---------- Carga del visor 3D (diferida) ---------- */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

function fallback2D(message) {
  V.webgl = false;
  poster.classList.add('is-hidden');
  const b3d = segButtons.find(b => b.dataset.mode === '3d');
  b3d.disabled = true;
  b3d.title = 'Modelo 3D no disponible en este dispositivo';
  setMode('2d');
  hint(message, 6000);
}

function updateHints() {
  if (!V.viewer || V.mode !== '3d') return;
  const st = V.viewer.getState();
  if (coarse) {
    releaseBtn.hidden = !st.active || st.expanded;
    hint(st.active ? 'Arrastra para girar · Usa dos dedos para acercar' : 'Toca el modelo para activarlo', st.active ? 3200 : 0);
  }
}

function syncToolbar(st) {
  toolButtons.forEach(b => {
    const a = b.dataset.action;
    if (a === 'roof') {
      b.setAttribute('aria-pressed', String(st.roof));
      const span = $('span', b);
      span.textContent = st.roof ? span.dataset.labelOn : span.dataset.labelOff;
    } else if (a === 'interior') b.setAttribute('aria-pressed', String(st.interior));
    else if (a === 'labels') b.setAttribute('aria-pressed', String(st.labels));
    else if (a.startsWith('view-')) b.classList.toggle('is-current', a === `view-${st.view}`);
  });
}

async function initViewer() {
  if (V.viewer || V.loading) return V.loading;
  if (!hasWebGL()) { fallback2D('Tu dispositivo no admite gráficos 3D; se muestra el plano interactivo.'); return null; }
  statusEl.textContent = 'Cargando modelo 3D…';
  loadBtn.hidden = true;
  V.loading = (async () => {
    try {
      const mod = await import('./model3d.js');
      const viewer = await mod.createViewer(stage);
      V.viewer = viewer;
      window.terminalViewer = viewer;
      wireViewer(viewer);
      poster.classList.add('is-hidden');
      syncToolbar(viewer.getState());
      if (!coarse) hint('Arrastra para girar · Selecciona un espacio para ver su información', 5000);
      updateHints();
      if (V.pending) { const p = V.pending; V.pending = null; selectSpace(p.id, p.part); }
      return viewer;
    } catch (err) {
      console.warn('No fue posible cargar el visor 3D:', err);
      V.loading = null;
      fallback2D('No fue posible cargar el modelo 3D; se muestra el plano interactivo.');
      if (V.pending) { const p = V.pending; V.pending = null; selectSpace(p.id, p.part); }
      return null;
    }
  })();
  return V.loading;
}

function wireViewer(viewer) {
  viewer.on('select', ({ space, part }) => {
    V.current = { id: space.id, part };
    markPlanSelection();
    renderSpace(space, part);
    tooltip.hidden = true;
  });
  viewer.on('clear', () => {
    if (V.sheetMode === 'space') closeSheet({ clear: false });
    V.current = null;
    markPlanSelection();
  });
  viewer.on('state', syncToolbar);
  viewer.on('activate', updateHints);
  viewer.on('deactivate', updateHints);
  viewer.on('interact', () => { if (!coarse) hint(''); });
  viewer.on('wheelblocked', () => hint('Haz clic en el modelo (o usa Ctrl + rueda) para acercar con la rueda', 2600));
  viewer.on('hover', h => {
    if (!h) { tooltip.hidden = true; return; }
    const r = stage.getBoundingClientRect();
    tooltip.textContent = h.part ? `${h.space.corto} · ${h.part}` : h.space.nombre;
    tooltip.style.left = `${h.x - r.left}px`;
    tooltip.style.top = `${h.y - r.top}px`;
    tooltip.hidden = false;
  });
  viewer.on('perf', () => hint('Calidad gráfica ajustada para mantener la fluidez', 3000));
}

releaseBtn.addEventListener('click', () => { if (V.viewer) V.viewer.setActive(false); });

// Carga diferida al acercarse a la sección
const viewerIO = new IntersectionObserver(entries => {
  entries.forEach(en => {
    viewerInView = en.isIntersecting && en.intersectionRatio > 0.15;
    onScroll();
  });
}, { threshold: [0, 0.15, 0.5] });
viewerIO.observe(viewerEl);
const preloadIO = new IntersectionObserver(entries => {
  if (entries.some(en => en.isIntersecting)) { preloadIO.disconnect(); initViewer(); }
}, { rootMargin: '900px 0px' });
preloadIO.observe(viewerEl);
loadBtn.addEventListener('click', () => initViewer());

/* ---------- Barra de herramientas ---------- */
viewerEl.addEventListener('click', e => {
  const b = e.target.closest('[data-action]');
  if (!b || b.disabled) return;
  const a = b.dataset.action;
  if (a === 'spaces') { if (V.sheetMode === 'list') { if (V.current) renderSpace(SPACE_BY_ID[V.current.id], V.current.part); else closeSheet(); } else renderList(); return; }
  if (a === 'expand') { setExpanded(!viewerEl.classList.contains('is-expanded')); return; }
  const v = V.viewer;
  if (!v) { initViewer(); return; }
  switch (a) {
    case 'view-general':
      if (V.current) closeSheet(); else v.setView('general');
      break;
    case 'view-superior': v.setView('superior'); break;
    case 'view-frontal': v.setView('frontal'); break;
    case 'view-lateral': v.setView('lateral'); break;
    case 'roof': v.toggleRoof(); break;
    case 'interior': v.toggleInterior(); break;
    case 'labels': v.toggleLabels(); break;
    case 'reset': v.resetCamera(); break;
    case 'zoom-in': v.zoomIn(); break;
    case 'zoom-out': v.zoomOut(); break;
  }
});

function setExpanded(on) {
  viewerEl.classList.toggle('is-expanded', on);
  document.body.classList.toggle('is-locked', on);
  const b = $('[data-action="expand"]', viewerEl);
  b.setAttribute('aria-pressed', String(on));
  b.setAttribute('aria-label', on ? 'Salir del visor ampliado' : 'Ampliar visor');
  if (V.viewer) { V.viewer.setExpanded(on); if (!on && coarse) V.viewer.setActive(false); }
  releaseBtn.hidden = true;
  updateHints();
  setTimeout(() => { if (V.viewer) V.viewer.refit(); }, 60);
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && viewerEl.classList.contains('is-expanded') && $('#lightbox').hidden) setExpanded(false);
});

// Ajuste de encuadre al girar el dispositivo
let refitTimer = 0;
window.addEventListener('orientationchange', () => { clearTimeout(refitTimer); refitTimer = setTimeout(() => V.viewer && V.viewer.refit(), 350); });

/* ---------- Enlaces "Ver en 3D" desde otras secciones ---------- */
async function goToSpace(id) {
  viewerEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: isDesktop() ? 'center' : 'start' });
  if (V.mode === '3d' && !V.viewer) {
    V.pending = { id, part: null };
    await initViewer();
    return;
  }
  setTimeout(() => selectSpace(id), reduceMotion ? 0 : 450);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-goto]');
  if (b) goToSpace(b.dataset.goto);
});

/* ==========================================================================
   Inicio
   ========================================================================== */
observeReveals();
refreshIcons();
