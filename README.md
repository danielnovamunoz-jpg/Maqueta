# Terminal Intermunicipal de Transporte de Pasajeros de Vélez — Sitio web

Sitio estático e interactivo para presentar la propuesta académica de una terminal intermunicipal en Vélez, Santander. Incluye un modelo 3D construido con Three.js a partir de la planta y la vista isométrica de la propuesta.

Tecnologías: HTML5, CSS3 y JavaScript sin frameworks. Three.js 0.160.0 y Lucide 0.460.0 se cargan desde jsDelivr y las fuentes (Inter y Manrope) desde Google Fonts. El mapa de la sección «Ubicación» es un iframe de Google Maps que no requiere clave de API. No necesita compilación ni backend.

## Ubicación del proyecto

La sección «Ubicación» (`#ubicacion`) muestra el sitio propuesto en las coordenadas **6.009761, -73.669543** (6° 00′ 35,1″ N · 73° 40′ 10,4″ O), en Vélez, Santander:

- Mapa interactivo con vista de mapa y de satélite. Se carga solo cuando el usuario se acerca a la sección.
- En celulares, el mapa no captura el desplazamiento hasta que se toca.
- Botones para copiar las coordenadas, ver la ruta en Google Maps («Cómo llegar») y abrir el punto en OpenStreetMap.

Para cambiar el punto, edita las coordenadas en `index.html` (sección `#ubicacion`, enlaces y `data-coords`) y en `js/main.js` (constantes `LAT` y `LNG` de `locationMap`).

## Estructura

```
/index.html            Página única con todas las secciones
/css/styles.css        Estilos (mobile first)
/js/main.js            Navegación, menú, animaciones, galería, panel informativo y carga del visor
/js/model3d.js         Visor 3D (Three.js): geometrías, cámara, selección por toque/clic, cubierta, interiores
/js/interiors.js       Mobiliario y equipamiento conceptual de cada espacio (sanitarios, taquillas, duchas, estanterías…)
/js/spaces.js          Datos de los espacios (fuente única para el 3D, el plano 2D y la distribución)
/assets/img/           Imágenes optimizadas en WebP (logo, boceto, cronograma y renders del modelo 3D)
/assets/favicon-64.png y /assets/apple-touch-icon.png   Íconos a partir del logo de Conexión Constructora
```

## Ejecutar localmente

El sitio usa módulos de JavaScript (`type="module"`), así que **hay que abrirlo con un servidor local**. Si haces doble clic en `index.html` (`file://`), el navegador bloquea los módulos y el visor 3D no carga.

Desde la carpeta del proyecto, usa cualquiera de estas opciones:

```bash
npx serve .
```

```bash
python -m http.server 8000
```

Luego abre la dirección que indique la consola (por ejemplo `http://localhost:3000` o `http://localhost:8000`). En VS Code también sirve la extensión *Live Server*.

Se necesita conexión a internet para cargar Three.js, los iconos y las fuentes desde los CDN.

## Publicar en Vercel

### Opción A: con la CLI de Vercel

```bash
npm i -g vercel
```

```bash
vercel
```

```bash
vercel --prod
```

Ejecuta los comandos dentro de la carpeta del proyecto. Cuando la CLI pregunte por la configuración, deja el *build command* vacío y usa `.` como directorio de salida.

### Opción B: desde GitHub

1. Sube la carpeta a un repositorio de GitHub.
2. En vercel.com, elige **Add New → Project** e importa el repositorio.
3. En **Framework Preset** selecciona **Other**. Deja vacío el *Build Command* y usa la raíz (`./`) como *Output Directory*.
4. Pulsa **Deploy**.

No hace falta un `vercel.json`. Después del despliegue, puedes cambiar `og:image` en `index.html` por la URL absoluta de `assets/img/render-hero-1600.webp` para mejorar la vista previa al compartir el enlace.

## Uso del visor 3D

- **Celular:** toca el modelo para activarlo, arrastra con un dedo para girar y usa dos dedos para acercar o desplazar. Con el botón «Volver a desplazar la página» se suelta el visor. El visor también se desactiva solo al salir de la pantalla, para no bloquear el desplazamiento.
- **Computador:** arrastra para girar y usa clic derecho para desplazar. Para que la rueda acerque, haz clic en el modelo o usa Ctrl + rueda (así la rueda no interrumpe el desplazamiento de la página).
- **Controles:** vista general, superior, frontal y lateral; ocultar o mostrar la cubierta; ver interiores (corte de muros con etiquetas); etiquetas; reiniciar cámara; zoom; lista de espacios; visor ampliado.
- **Selección:** cada recinto y zona exterior se puede seleccionar. Al tocar un bus se identifica su plataforma (B1–B6). El panel muestra la función y los elementos de cada espacio, y permite pasar al espacio anterior o siguiente o volver a la vista general.
- **Rendimiento:** la calidad gráfica se ajusta según el dispositivo y baja automáticamente si los cuadros por segundo caen. El render solo se ejecuta cuando hay cambios y se detiene cuando el visor no está en pantalla. Puedes forzar un nivel con `?q=low`, `?q=mid` o `?q=high` en la URL.
- **Alternativa 2D:** el botón «Plano 2D» muestra un plano interactivo con la misma información. El sitio cambia a este plano automáticamente si el dispositivo no admite WebGL o si falla la carga de Three.js.

## Limitaciones del modelo 3D

- Es una **representación conceptual**: sigue la distribución de la planta de referencia y no es un modelo a escala ni un diseño definitivo.
- Mobiliario, vehículos, vegetación, puertas y ventanas son ilustrativos.

## Circulación de buses en el modelo

- Los buses tienen una **vía exclusiva** al norte del terreno: entran por el oeste («Entrada buses») y salen por el este («Salida buses»), con demarcación «SOLO BUSES».
- Un separador con árboles divide la vía del **patio de maniobras**. El patio es más profundo que antes y deja espacio libre frente a las seis plataformas para que los buses salgan.
- La vía de vehículos particulares y taxis ya no se conecta con el patio de buses: termina en un retorno junto al acopio de taxis.
- El modelo muestra un bus llegando por la vía exclusiva y otro saliendo del patio.

## Presupuesto (Entregable 2)

La sección «Viabilidad y presupuesto» usa la estimación ajustada del Entregable 2:

- **Valor de referencia:** ≈ $13.030 millones COP, con un rango de $11.790 a $13.680 millones.
- **Cálculo:** 2.000 m² × $4,59 millones por m² (terminal de San Miguel, precios de 2019) = $9.180 millones. Ese valor se actualiza a diciembre de 2025 con un factor acumulado de 1,419 (ICCV 2020–2021 e ICOCED 2022–2025), lo que suma ≈ $3.850 millones.
- **Sin AIU:** no se suma porque el referente ya es un costo total.
- **Detalles desplegables:** índices de actualización, ajuste frente a la formulación inicial ($11.934 M → ≈ $13.030 M), limitaciones y riesgos.

## Observaciones sobre las fuentes

- **Sitio del predio:** el Entregable 2 dice que el sitio exacto aún no está definido, pero el sitio web muestra las coordenadas definidas por el equipo. Conviene unificarlo en el documento.
- **Número de locales:** el Entregable 2 menciona «dos locales», mientras que la maqueta y el modelo 3D tienen cuatro locales comerciales. Conviene verificarlo.

## Logo de Conexión Constructora

El logo se usa en el encabezado, en la sección de equipo, en el cierre, en el pie de página y como ícono del sitio. A partir del archivo original se generaron versiones con fondo transparente:

- `logo-mark*.webp`: solo el símbolo.
- `logo-wordmark*.webp`: «CONEXIÓN CONSTRUCTORA».
- `logo-conexion*.webp`: el logo completo.

Las versiones `-light` están recoloreadas para fondos oscuros: el azul pasa a blanco y el verde se aclara. El encabezado muestra la versión clara sobre la portada y la versión a color cuando la barra se vuelve blanca al desplazarse.

## Detalle interior del modelo

`js/interiors.js` amuebla cada espacio de forma conceptual:

- **Sanitarios y duchas:** cabinas con inodoros, orinales, lavamanos con espejos, duchas con mampara, casilleros y bancas.
- **Taquillas:** seis módulos con mostrador, ventanilla de vidrio, monitor, letrero de color por empresa y filas con postes separadores.
- **Atención y descanso:** sillas individuales y pantallas de salidas en la sala de espera, punto de información y tótems en el vestíbulo, y sofás con televisor en la sala de descanso.
- **Operación y comercio:** estanterías con equipajes y carros portaequipajes, cocina, barra y mesas en el área de alimentación, y estanterías con productos y mostrador en los locales.
- **Plataformas:** una señal en cada plataforma.

Todo se dibuja con pocas mallas instanciadas para que siga siendo fluido en celulares. Los letreros y pantallas altos se ocultan en el modo «Ver interiores».

## Personalización

- Textos, funciones y elementos de cada espacio: `js/spaces.js`.
- Colores y tipografía: variables al inicio de `css/styles.css`.
- Las imágenes `render-*.webp` se generaron a partir del propio modelo 3D.
