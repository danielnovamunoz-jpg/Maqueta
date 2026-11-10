# Terminal Intermunicipal de Transporte de Pasajeros de Vélez — Sitio web

Sitio estático e interactivo para presentar la propuesta académica de una terminal intermunicipal en Vélez, Santander. Incluye un modelo 3D construido con Three.js a partir de la planta y la vista isométrica de la maqueta.

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
/js/spaces.js          Datos de los espacios (fuente única para el 3D, el plano 2D, la distribución y las medidas)
/assets/img/           Imágenes optimizadas en WebP (logo, maqueta, boceto, cronograma y renders del modelo 3D)
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
- **Selección:** cada recinto y zona exterior se puede seleccionar. Al tocar un bus se identifica su plataforma (B1–B6). El panel muestra la función, los elementos y las medidas de referencia, y permite pasar al espacio anterior o siguiente o volver a la vista general.
- **Rendimiento:** la calidad gráfica se ajusta según el dispositivo y baja automáticamente si los cuadros por segundo caen. El render solo se ejecuta cuando hay cambios y se detiene cuando el visor no está en pantalla. Puedes forzar un nivel con `?q=low`, `?q=mid` o `?q=high` en la URL.
- **Alternativa 2D:** el botón «Plano 2D» muestra un plano interactivo con la misma información. El sitio cambia a este plano automáticamente si el dispositivo no admite WebGL o si falla la carga de Three.js.

## Limitaciones del modelo 3D

- Es una **representación conceptual**. La posición y proporción de los espacios siguen la distribución **dibujada** en la planta de referencia, normalizada al tablero de 70 × 60 cm.
- Las cotas escritas en la planta no son proporcionales al dibujo ni coinciden siempre con el cuadro de medidas. Por eso el modelo no está a escala exacta. Las medidas se muestran aparte como referencias preliminares.
- Para la altura se tomó como máximo la «altura aproximada del edificio» de 4,5 cm (sala de espera); los demás bloques son algo más bajos para leer los volúmenes.
- Mobiliario, vehículos, vegetación, puertas y ventanas son ilustrativos y no corresponden a un diseño definitivo.

## Observaciones sobre las fuentes

Los datos salen de los documentos *Formulación de proyecto*, *Contexto y Beneficiarios* y *Organización y Dirección*, y de la imagen de la maqueta. Al cruzarlos se encontraron estas diferencias, que el sitio presenta sin conciliar:

- **Cotas de la planta frente al cuadro de medidas:** por ejemplo, equipajes (5,0 frente a 6,0 × 5,0), área de conductores (5,0 × 5,0 frente a 6,0 × 5,0), baños y duchas (3,0 × 4,0 frente a 3,0 × 3,0), taquillas (8,0 frente a 5,0 × 4,0) y plataformas (3,5 · 4,0 frente a 14,0 × 3,5).
- **Cuadro de medidas frente al boceto de la formulación (figura 2):** a escala 1:100, solo la sala de espera coincide (14 × 10 cm ≈ 140 m²). El resto de las áreas del boceto son mayores; por ejemplo, el parqueadero de vehículos tiene 22 × 6 cm (≈ 132 m²) en la maqueta frente a 650 m² en el boceto.
- **Área de 2.000 m²:** proviene del dimensionamiento poblacional, no de la suma de los espacios de la maqueta.
- **Sitio del predio:** en la sección de recursos físicos, la formulación dice que el predio está «pendiente de identificación técnica (aún no se define el sitio exacto)». El sitio web ya muestra las coordenadas definidas por el equipo, así que conviene actualizar el documento.
- **Población regional:** el texto de la formulación menciona «aproximadamente 169.000 habitantes» para la Provincia de Vélez, mientras que la tabla 3 usa 196.050. El sitio usa 196.050, como se indicó. Conviene revisar esa cifra en el documento.

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

- Textos, funciones, elementos y medidas de cada espacio: `js/spaces.js`.
- Colores y tipografía: variables al inicio de `css/styles.css`.
- Las imágenes `render-*.webp` se generaron a partir del propio modelo 3D.
