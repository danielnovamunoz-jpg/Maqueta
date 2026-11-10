/* ==========================================================================
   Datos de los espacios de la terminal (fuente única para el visor 3D,
   el plano 2D alternativo y la sección de distribución).

   Coordenadas en planta (unidades del modelo): X 0 → 70 (izquierda → derecha),
   Z −12 → 60 (norte/vía de buses → sur/acceso). Las posiciones siguen la
   distribución dibujada en la planta de referencia; el modelo es conceptual
   y no está a escala.
   ========================================================================== */

export const BOARD = { x0: 0, x1: 70, z0: -12, z1: 60, alturaEdificio: 4.5 };

export const ZONES = {
  operativa: {
    id: 'operativa',
    nombre: 'Zona operativa',
    color: '#3D6FA3',
    descripcion: 'Espacios que soportan el despacho de los buses y las labores de conductores y empresas transportadoras.'
  },
  atencion: {
    id: 'atencion',
    nombre: 'Zona de atención al usuario',
    color: '#C98A3A',
    descripcion: 'Espacios donde los pasajeros llegan, compran su tiquete, esperan y acceden a los servicios básicos.'
  },
  comercial: {
    id: 'comercial',
    nombre: 'Zona comercial',
    color: '#8E6AB0',
    descripcion: 'Espacios para actividades comerciales complementarias que atienden a usuarios, conductores y trabajadores.'
  },
  exterior: {
    id: 'exterior',
    nombre: 'Zona exterior',
    color: '#4F9467',
    descripcion: 'Circulaciones, estacionamientos, conexión con el transporte urbano y zonas verdes que rodean la edificación.'
  }
};

/* Nota que acompaña a todos los listados de elementos. */
export const NOTA_CONCEPTUAL =
  'Los elementos se representan de forma conceptual y no corresponden a un diseño definitivo.';

/*
  tipo:  'room'     → recinto de la edificación (con muros y cubierta)
         'ground'   → zona exterior a nivel del terreno
         'platform' → plataformas de buses (partes rotadas B1–B6)
  rects: [x0, z0, x1, z1] en unidades de planta.
  bloque: agrupación de cubierta (A, B, C, D, E, F).
*/
export const SPACES = [
  /* ---------------- EDIFICACIÓN ---------------- */
  {
    id: 'sala',
    nombre: 'Sala de espera general',
    corto: 'Sala de espera',
    zona: 'atencion',
    tipo: 'room',
    bloque: 'B',
    rects: [[21.0, 12.6, 48.4, 29.0]],
    altura: 4.5,
    piso: '#EFE7D8',
    funcion: 'Espacio destinado a la permanencia de los pasajeros mientras esperan la salida de sus vehículos.',
    elementos: ['Sillas de espera', 'Circulación peatonal', 'Acceso a las demás áreas', 'Conexión con las plataformas de buses', 'Pantallas de información de salidas']
  },
  {
    id: 'equipajes',
    nombre: 'Equipajes y encomiendas',
    corto: 'Equipajes',
    zona: 'operativa',
    tipo: 'room',
    bloque: 'A',
    rects: [[9.6, 12.6, 21.0, 19.8]],
    altura: 3.6,
    piso: '#F2D6D1',
    funcion: 'Espacio destinado a la recepción y organización de equipajes y encomiendas.',
    elementos: ['Mostrador de recepción y entrega con báscula', 'Estanterías para organizar equipajes y encomiendas', 'Carros portaequipajes', 'Conexión con la sala de espera y las plataformas']
  },
  {
    id: 'sanitarios',
    nombre: 'Servicios sanitarios',
    corto: 'Sanitarios',
    zona: 'atencion',
    tipo: 'room',
    bloque: 'A',
    rects: [[9.6, 19.8, 21.0, 29.0]],
    altura: 3.6,
    piso: '#D3E2F3',
    funcion: 'Ofrecer servicios sanitarios a los usuarios de la terminal.',
    elementos: ['Baterías sanitarias diferenciadas para hombres y mujeres', 'Cabinas con inodoros y orinales', 'Lavamanos con espejos', 'Acceso desde la sala de espera general']
  },
  {
    id: 'conductores',
    nombre: 'Área de conductores',
    corto: 'Conductores',
    zona: 'operativa',
    tipo: 'room',
    bloque: 'C',
    rects: [[48.4, 12.6, 66.0, 18.8]],
    altura: 3.6,
    piso: '#DAEBCB',
    funcion: 'Espacio de uso operativo destinado a los conductores de las empresas transportadoras.',
    elementos: ['Área de permanencia', 'Servicios de apoyo', 'Conexión con las áreas operativas', 'Mesas, casilleros y estación de café']
  },
  {
    id: 'descanso',
    nombre: 'Sala de descanso',
    corto: 'Descanso',
    zona: 'operativa',
    tipo: 'room',
    bloque: 'C',
    rects: [[48.4, 18.8, 57.4, 24.9]],
    altura: 3.6,
    piso: '#F5EBC4',
    funcion: 'Espacio de descanso para los conductores, vinculado al área de conductores.',
    elementos: ['Sofás y sillones de descanso', 'Mesa de centro y televisor', 'Conexión con el área de conductores', 'Cercanía a baños y duchas']
  },
  {
    id: 'banos',
    nombre: 'Baños y duchas',
    corto: 'Baños y duchas',
    zona: 'operativa',
    tipo: 'room',
    bloque: 'C',
    rects: [[57.4, 18.8, 66.0, 24.9]],
    altura: 3.6,
    piso: '#E0D8F1',
    funcion: 'Espacio de aseo ubicado en la zona operativa, junto al área de conductores y la sala de descanso.',
    elementos: ['Duchas con mampara', 'Inodoros en cabinas', 'Lavamanos con espejo', 'Banca y casilleros', 'Conexión con la sala de descanso']
  },
  {
    id: 'alimentacion',
    nombre: 'Área de alimentación',
    corto: 'Alimentación',
    zona: 'comercial',
    tipo: 'room',
    bloque: 'C',
    rects: [[48.4, 24.9, 66.0, 29.0]],
    altura: 3.6,
    piso: '#F6DEC3',
    funcion: 'Espacio destinado a ofrecer alimentos y bebidas a los usuarios.',
    elementos: ['Mostrador de venta con vitrina', 'Cocina de apoyo', 'Barra y mesas para el consumo', 'Acceso desde la sala de espera']
  },
  {
    id: 'taquillas',
    nombre: 'Taquillas de empresas',
    corto: 'Taquillas',
    zona: 'atencion',
    tipo: 'room',
    bloque: 'D',
    rects: [[11.0, 30.6, 25.8, 37.6]],
    altura: 3.2,
    piso: '#F4D5D7',
    funcion: 'Espacio destinado a la atención de usuarios y gestión de los servicios de transporte.',
    elementos: ['Módulos de atención', 'Mostradores', 'Espacios de circulación', 'Ventanillas con la señalización de cada empresa', 'Filas de atención frente a cada módulo']
  },
  {
    id: 'vestibulo',
    nombre: 'Vestíbulo principal',
    corto: 'Vestíbulo',
    zona: 'atencion',
    tipo: 'room',
    bloque: 'E',
    rects: [[25.8, 29.0, 44.2, 37.6]],
    altura: 4.0,
    piso: '#ECE3D3',
    funcion: 'Espacio de acceso que recibe a los usuarios desde la plaza peatonal y los distribuye hacia las taquillas, los locales y la sala de espera.',
    elementos: ['Acceso principal desde la plaza', 'Punto de orientación e información', 'Tablero de salidas y tótems de orientación', 'Distribución hacia taquillas, locales y sala de espera']
  },
  {
    id: 'local1', nombre: 'Local comercial 1', corto: 'Local 1', grupo: 'locales',
    zona: 'comercial', tipo: 'room', bloque: 'F',
    rects: [[44.2, 30.6, 49.65, 37.6]], altura: 3.2, piso: '#F1E7D6',
    funcion: 'Espacio destinado a actividades comerciales complementarias.',
    elementos: ['Local independiente', 'Estanterías y mostrador de atención', 'Frente hacia la circulación peatonal de acceso', 'Atención a usuarios, conductores y trabajadores']
  },
  {
    id: 'local2', nombre: 'Local comercial 2', corto: 'Local 2', grupo: 'locales',
    zona: 'comercial', tipo: 'room', bloque: 'F',
    rects: [[49.65, 30.6, 55.1, 37.6]], altura: 3.2, piso: '#F1E7D6',
    funcion: 'Espacio destinado a actividades comerciales complementarias.',
    elementos: ['Local independiente', 'Estanterías y mostrador de atención', 'Frente hacia la circulación peatonal de acceso', 'Atención a usuarios, conductores y trabajadores']
  },
  {
    id: 'local3', nombre: 'Local comercial 3', corto: 'Local 3', grupo: 'locales',
    zona: 'comercial', tipo: 'room', bloque: 'F',
    rects: [[55.1, 30.6, 60.55, 37.6]], altura: 3.2, piso: '#F1E7D6',
    funcion: 'Espacio destinado a actividades comerciales complementarias.',
    elementos: ['Local independiente', 'Estanterías y mostrador de atención', 'Frente hacia la circulación peatonal de acceso', 'Atención a usuarios, conductores y trabajadores']
  },
  {
    id: 'local4', nombre: 'Local comercial 4', corto: 'Local 4', grupo: 'locales',
    zona: 'comercial', tipo: 'room', bloque: 'F',
    rects: [[60.55, 30.6, 66.0, 37.6]], altura: 3.2, piso: '#F1E7D6',
    funcion: 'Espacio destinado a actividades comerciales complementarias.',
    elementos: ['Local independiente', 'Estanterías y mostrador de atención', 'Frente hacia la circulación peatonal de acceso', 'Atención a usuarios, conductores y trabajadores']
  },

  /* ---------------- EXTERIORES ---------------- */
  {
    id: 'plataformas',
    nombre: 'Plataformas de buses',
    corto: 'Plataformas B1–B6',
    zona: 'operativa',
    tipo: 'platform',
    rects: [[5.6, -3.6, 67.6, 11.6]],
    partes: [
      { id: 'B1', cx: 16.2, cz: 6.6 },
      { id: 'B2', cx: 24.5, cz: 6.6 },
      { id: 'B3', cx: 32.8, cz: 6.6 },
      { id: 'B4', cx: 41.1, cz: 6.6 },
      { id: 'B5', cx: 49.4, cz: 6.6 },
      { id: 'B6', cx: 57.7, cz: 6.6 }
    ],
    funcion: 'Zona de ascenso y descenso de pasajeros y de despacho de los buses intermunicipales.',
    elementos: ['Seis plataformas de abordaje (B1 a B6)', 'Andén de abordaje junto a la sala de espera', 'Señalización de cada plataforma', 'Circulación de buses']
  },
  {
    id: 'plaza',
    nombre: 'Plaza peatonal de acceso',
    corto: 'Plaza de acceso',
    zona: 'exterior',
    tipo: 'ground',
    rects: [[22.9, 37.6, 45.1, 42.8]],
    funcion: 'Espacio peatonal exterior que antecede al vestíbulo principal y organiza la llegada de los usuarios.',
    elementos: ['Circulación peatonal', 'Conexión con los estacionamientos', 'Vegetación y jardineras']
  },
  {
    id: 'parqueadero',
    nombre: 'Estacionamiento de vehículos particulares',
    corto: 'Parqueadero vehículos',
    zona: 'exterior',
    tipo: 'ground',
    rects: [[13.4, 42.6, 42.6, 55.6]],
    funcion: 'Organizar el parqueo de vehículos particulares.',
    elementos: ['Celdas de estacionamiento', 'Circulación vehicular interna', 'Conexión peatonal con la plaza de acceso']
  },
  {
    id: 'motos',
    nombre: 'Estacionamiento de motocicletas',
    corto: 'Parqueadero motos',
    zona: 'exterior',
    tipo: 'ground',
    rects: [[45.4, 42.6, 61.2, 55.6]],
    funcion: 'Organizar el parqueo de motocicletas.',
    elementos: ['Celdas para motocicletas', 'Circulación interna', 'Conexión con la vía de salida']
  },
  {
    id: 'acopio',
    nombre: 'Acopio de taxis',
    corto: 'Acopio de taxis',
    zona: 'exterior',
    tipo: 'ground',
    rects: [[0.6, 24.0, 5.6, 40.4]],
    funcion: 'Facilitar el servicio de transporte urbano y la conexión de los pasajeros con otros medios de movilidad.',
    elementos: ['Área delimitada para el acopio de taxis', 'Conexión con la vía de acceso', 'Cercanía a taquillas y vestíbulo']
  },
  {
    id: 'bahia',
    nombre: 'Bahía de taxis',
    corto: 'Bahía de taxis',
    zona: 'exterior',
    tipo: 'ground',
    rects: [[0.6, 42.2, 5.6, 57.8]],
    funcion: 'Facilitar el servicio de transporte urbano y la conexión de los pasajeros con otros medios de movilidad.',
    elementos: ['Bahía para ascenso y descenso en taxi', 'Conexión con la entrada vehicular', 'Separada de la vía de buses']
  },
  {
    id: 'vias',
    nombre: 'Vías de circulación vehicular',
    corto: 'Vías y accesos',
    zona: 'exterior',
    tipo: 'ground',
    rects: [
      [0, -10.2, 70, -5.4],
      [5.6, -5.4, 12.0, -3.6],
      [60.0, -5.4, 67.6, -3.6],
      [5.6, 21.0, 9.0, 60.0],
      [9.0, 38.4, 22.9, 42.6],
      [45.1, 38.4, 64.0, 42.6],
      [64.0, 38.4, 68.0, 60.0],
      [9.0, 47.4, 13.4, 51.0],
      [42.6, 47.4, 45.4, 51.0],
      [61.2, 47.4, 64.0, 51.0]
    ],
    funcion: 'Organizar los flujos vehiculares de la terminal: los buses tienen una vía propia de entrada y salida, separada de los vehículos particulares, los taxis y las circulaciones peatonales.',
    elementos: ['Entrada de vehículos', 'Salida de vehículos', 'Circulación hacia plataformas, estacionamientos y zona de taxis']
  },
  {
    id: 'verdes',
    nombre: 'Zonas verdes',
    corto: 'Zonas verdes',
    zona: 'exterior',
    tipo: 'ground',
    rects: [
      [0, -12, 70, -10.2],
      [12.0, -5.4, 60.0, -3.6],
      [0, -5.4, 5.6, 24.0],
      [5.6, 11.6, 9.0, 21.0],
      [67.6, -5.4, 70, 38.4],
      [68.0, 38.4, 70, 58.4],
      [9.0, 55.6, 64.0, 58.4],
      [9.0, 29.2, 11.0, 38.4],
      [9.0, 42.6, 13.4, 47.4],
      [9.0, 51.0, 13.4, 55.6],
      [42.6, 42.6, 45.4, 47.4],
      [42.6, 51.0, 45.4, 55.6],
      [61.2, 42.6, 64.0, 47.4],
      [61.2, 51.0, 64.0, 55.6]
    ],
    funcion: 'Zonas verdes y arborización que acompañan las circulaciones y el entorno de la terminal.',
    elementos: ['Arborización perimetral', 'Jardineras', 'Separación entre circulaciones']
  }
];

export const SPACE_BY_ID = Object.fromEntries(SPACES.map(s => [s.id, s]));

/* Orden de recorrido para los botones "anterior / siguiente" del panel. */
export const TOUR_ORDER = [
  'vestibulo', 'taquillas', 'sala', 'sanitarios', 'equipajes', 'plataformas',
  'conductores', 'descanso', 'banos', 'alimentacion', 'local1', 'local2', 'local3', 'local4',
  'plaza', 'parqueadero', 'motos', 'acopio', 'bahia', 'vias', 'verdes'
];

/* Agrupación para la sección "Distribución arquitectónica". */
export const DISTRIBUTION = [
  { zona: 'operativa', items: [
    { id: 'plataformas', label: 'Plataformas de buses B1–B6' },
    { id: 'conductores', label: 'Área de conductores' },
    { id: 'equipajes', label: 'Equipajes y encomiendas' },
    { id: 'descanso', label: 'Sala de descanso' },
    { id: 'banos', label: 'Baños y duchas' }
  ]},
  { zona: 'atencion', items: [
    { id: 'sala', label: 'Sala de espera' },
    { id: 'taquillas', label: 'Taquillas' },
    { id: 'vestibulo', label: 'Vestíbulo principal' },
    { id: 'sanitarios', label: 'Servicios sanitarios' }
  ]},
  { zona: 'comercial', items: [
    { id: 'alimentacion', label: 'Área de alimentación' },
    { id: 'local1', label: 'Local 1' },
    { id: 'local2', label: 'Local 2' },
    { id: 'local3', label: 'Local 3' },
    { id: 'local4', label: 'Local 4' }
  ]},
  { zona: 'exterior', items: [
    { id: 'parqueadero', label: 'Estacionamiento de vehículos' },
    { id: 'motos', label: 'Estacionamiento de motocicletas' },
    { id: 'acopio', label: 'Acopio de taxis' },
    { id: 'bahia', label: 'Bahía de taxis' },
    { id: 'vias', label: 'Vía de buses y circulación vehicular' },
    { id: 'verdes', label: 'Zonas verdes' },
    { id: 'plaza', label: 'Plaza peatonal de acceso' }
  ]}
];

/* Ángulo de las plataformas (grados respecto al eje Z; el extremo trasero se inclina a la izquierda). */
export const PLATFORM_ANGLE = 30;
export const PLATFORM_SIZE = { w: 3.6, d: 10.4 };
