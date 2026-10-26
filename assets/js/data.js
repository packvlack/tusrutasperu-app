/* ============================================================
   TUSRUTASPERU — DATA v2.5
   Registro oficial de la competencia. Provincia de Huaral, Lima.
   12 checkpoints · 8 complejos + 3 cataratas + 1 laguna.
   Fotos: archivo original de TusRutasPerú.
   Coordenadas marcadas como aproximadas donde la fuente no
   publicó un punto exacto. No inventar: null = verificación manual.
   ============================================================ */

const TRP = {};

TRP.START = {
  nombre: "Plaza de Armas de Huaral",
  lat: -11.4919, lng: -77.7256, // aprox. ciudad de Huaral
  radioArranqueM: 2500          // debe estar dentro de la ciudad
};

TRP.PLACES = [
  {
    slug: "las-shicras",
    partida: { nombre: "Palpa", lat: -11.4888589, lng: -77.1205154, radioM: 500 }, // aprox.
    nombre: "Las Shicras",
    tipo: "complejo",
    tipoLabel: "Complejo arqueológico",
    distrito: "Palpa · Aucallama",
    distancia: "25 km · 45 min – 1 h desde Huaral",
    dificultad: "Fácil",
    difNivel: 1,
    altitud: "≈ 250 msnm",
    lat: -11.474067, lng: -77.110155, // aprox. // sin coordenada publicada: checkpoint manual
    img: "assets/img/las-shicras.webp",
    alt: "Excavaciones del templo de Las Shicras en el desierto de Palpa",
    gancho: "5.000 años antes que tú: el templo que inventó la ingeniería antisísmica.",
    descripcion: "Templo ceremonial del Arcaico Tardío, contemporáneo de Caral. Se levantó con la técnica de las shicras —bolsas de fibra vegetal rellenas de piedra— que absorben los sismos: las abuelas de los aisladores sísmicos modernos. Es el primer centro ceremonial monumental del valle de Chancay y el calentamiento perfecto del circuito.",
    datos: ["Antigüedad estimada: 5.000 años", "Técnica constructiva: shicras antisísmicas", "Contemporáneo de la Ciudad Sagrada de Caral", "Valle de Chancay, centro poblado de Palpa"],
    temporada: "Todo el año"
  },
  {
    slug: "moyocuanto",
    partida: { nombre: "Lampián", lat: -11.2375, lng: -76.8397222, radioM: 500 }, // aprox.
    nombre: "Catarata Moyocuanto",
    tipo: "catarata",
    tipoLabel: "Catarata",
    distrito: "Lampián",
    distancia: "Sierra de Huaral · distrito de Lampián",
    dificultad: "Fácil",
    difNivel: 1,
    altitud: "≈ 2.800 msnm",
    lat: null, lng: null,
    img: "assets/img/moyocuanto.webp",
    alt: "Catarata Moyocuanto cayendo a su poza en un cañón verde de Lampián",
    gancho: "Escondida entre gigantes de roca: la catarata que hay que ganarse.",
    descripcion: "El premio mayor del distrito de Lampián. Un tesoro escondido entre formaciones rocosas gigantes, mística y salvaje: la más recóndita del circuito de las tres cataratas. Llegar hasta su poza es firmar tu primer pacto serio con la sierra huaralina.",
    datos: ["Distrito de Lampián, sierra de Huaral", "Entorno de roca monumental", "Acceso solo a pie por sendero de montaña", "Lleva calzado con agarre: la roca se pone brava"],
    temporada: "Abr – Nov (seca)"
  },
  {
    slug: "huachac",
    partida: { nombre: "San Miguel de Acos", lat: -11.2739, lng: -76.8215, radioM: 500 }, // aprox.
    nombre: "Catarata Huachac",
    tipo: "catarata",
    tipoLabel: "Catarata",
    distrito: "San Miguel de Acos",
    distancia: "1,5 – 2 h en vehículo + trek 2 – 2,5 h",
    dificultad: "Media",
    difNivel: 2,
    altitud: "≈ 2.900 msnm",
    lat: -11.2723, lng: -76.7717, // aprox.
    img: "assets/img/huachac.webp",
    alt: "Catarata de Huachac, caída alta sobre un acantilado verde en San Miguel de Acos",
    gancho: "600 metros de agua cayendo del cielo: el Gocta limeño te espera.",
    descripcion: "600 metros de caída en dos saltos —Huachac Hombre, el mayor, y Huachac Hembra— alimentados por el río Magua. Una de las cataratas más grandes del Perú. El trek de 2 a 2,5 horas desde el puente Caractama es la prueba de resistencia que separa a los turistas de los competidores.",
    datos: ["Caída total: 600 m en dos saltos", "Río Magua, comunidad de Huascoy", "Trek: 2 – 2,5 h desde el puente Caractama", "Apodada 'el Gocta limeño'"],
    temporada: "Abr – Nov (seca)"
  },
  {
    slug: "curinpacchi",
    partida: { nombre: "San Pedro de Huaroquín", lat: -11.2734756, lng: -76.7018891, radioM: 500 }, // aprox.
    nombre: "Catarata Curinpacchi",
    tipo: "catarata",
    tipoLabel: "Catarata",
    distrito: "San Pedro de Huaroquín",
    distancia: "Comunidad campesina San Pedro de Huaroquín",
    dificultad: "Media",
    difNivel: 2,
    altitud: "≈ 3.000 msnm",
    lat: -11.256118, lng: -76.710002, // aprox.
    img: "assets/img/curinpacchi.webp",
    alt: "Viajero contemplando la catarata Curinpacchi en un cañón profundo de Huaroquín",
    gancho: "Acércate lo suficiente y la montaña te bautiza.",
    descripcion: "El salto más imponente del circuito de las tres cataratas, en la comunidad campesina de San Pedro de Huaroquín: a mayor altitud, mayor exigencia. La brisa fría te empapa apenas te acercas a su cortina de agua. Pura adrenalina en la sierra huaralina, solo apta para piernas que ya calentaron en Huachac.",
    datos: ["La más imponente del circuito de 3 cataratas", "Comunidad campesina San Pedro de Huaroquín", "La bruma alcanza decenas de metros", "Impermeable obligatorio"],
    temporada: "Abr – Nov (seca)"
  },
  {
    slug: "cotomarca",
    partida: { nombre: "San Juan de Coto", lat: -11.206683, lng: -76.773436, radioM: 500 }, // aprox.
    nombre: "Cotomarca",
    tipo: "complejo",
    tipoLabel: "Complejo arqueológico",
    distrito: "San Juan de Coto · Veintisiete de Noviembre",
    distancia: "Trek 1,5 h desde el final de la carretera",
    dificultad: "Media",
    difNivel: 2,
    altitud: "3.900 msnm",
    lat: null, lng: null,
    img: "assets/img/cotomarca.webp",
    alt: "Muralla de piedra de la ciudadela de Cotomarca, San Juan de Coto",
    gancho: "Kullpis de varios pisos con techos de piedra: ingeniería atavilla sin una sola viga.",
    descripcion: "La ciudadela de Cotomarca —o complejo arqueológico de Coto— es un legado de la cultura Atavillos (900–1400 d.C.) escondido en las montañas del distrito Veintisiete de Noviembre. Como en la mítica Rúpac, aquí caminas entre kullpis: edificaciones de piedra de varios pisos con techos abovedados construidos enteramente con lajas de roca, sin usar una sola viga de madera. Un prodigio de ingeniería antigua que ha resistido siglos, a 3.900 metros y bajo las estrellas.",
    datos: ["Cultura Atavillos (900–1400 d.C.)", "Kullpis de varios pisos con techos abovedados de laja", "Altitud: 3.900 msnm · aclimatación necesaria", "Trek: 1,5 h desde el final de la carretera · ingreso libre · zona de campamento"],
    temporada: "Abr – Nov (seca)"
  },
  {
    slug: "araro",
    partida: { nombre: "Carac · Santa Cruz de Andamarca", lat: -11.19469, lng: -76.63461, radioM: 500 }, // aprox.
    nombre: "Araro",
    tipo: "complejo",
    tipoLabel: "Complejo arqueológico",
    distrito: "Santa Cruz de Andamarca",
    distancia: "Sierra alta · 3 – 4 h desde Huaral (estimado)",
    dificultad: "Fácil",
    difNivel: 1,
    altitud: "Sierra alta",
    lat: null, lng: null,
    img: "assets/img/araro.webp",
    img2: "assets/img/araro-2.webp",
    alt: "Torre de piedra del complejo arqueológico de Araro, Santa Cruz de Andamarca",
    alt2: "Muros de piedra de Araro en la comunidad de Carac",
    gancho: "El pueblo atavillo que unía dos mundos: de la cuenca del Chancay a Chinchaycocha.",
    descripcion: "Pueblo de la cultura Atavillos en Santa Cruz de Andamarca, donde las excavaciones del arqueólogo Pieter van Dalen identificaron ocupaciones atavillas e incas. Araro mediaba las relaciones culturales entre la cuenca alta del río Chancay y regiones vecinas como Chinchaycocha. Piedra sobre piedra, pinturas rupestres en las laderas del cerro y una vista al oeste que abarca Chauca, Ravira, Viscas, Vichaycocha y Pacaraos.",
    datos: ["Ocupaciones Atavillos e Inca (excavaciones de Pieter van Dalen)", "Pinturas rupestres en las laderas del cerro", "Vista al oeste: Chauca, Ravira, Viscas, Vichaycocha y Pacaraos", "Dos sectores: Santa Cruz de Andamarca y la comunidad de Carac"],
    temporada: "Abr – Nov (seca)"
  },
  {
    slug: "chiprac",
    partida: { nombre: "San Juan de Uchucuanico", lat: -11.2846628, lng: -76.7753465, radioM: 500 }, // aprox.
    nombre: "Chiprac",
    tipo: "complejo",
    tipoLabel: "Complejo arqueológico",
    distrito: "San Juan de Uchucuanico · San Miguel de Acos",
    distancia: "80 km · 2,5 – 3 h en vehículo + caminata",
    dificultad: "Difícil",
    difNivel: 3,
    altitud: "3.750 msnm",
    lat: -11.3033, lng: -76.7856, // aprox.
    img: "assets/img/chiprac.webp",
    alt: "Vista aérea de las ruinas de Chiprac extendidas por la ladera andina",
    gancho: "La capital perdida de un reino que desafió a los incas. ¿Te atreves a subir?",
    descripcion: "Posible capital del reino de los Atavillos (900–1400 d.C.): dos kilómetros de ciudad amurallada con barrios y una densidad constructiva que impresiona, al pie del nevado Mango Cápac. Vecina de Rúpac y mucho menos visitada. Aquí el circuito deja de ser paseo y se vuelve expedición.",
    datos: ["Cultura Atavillos, Intermedio Tardío", "≈ 2 km de extensión amurallada", "3.750 msnm, al pie del nevado Mango Cápac", "Comunidad San Juan de Uchucuanico · casi sin multitudes"],
    temporada: "Abr – Nov (seca)"
  },
  {
    slug: "anay",
    partida: { nombre: "San Pedro de Pallac", lat: -11.3486892, lng: -76.8071468, radioM: 500 }, // aprox.
    nombre: "Añay",
    tipo: "complejo",
    tipoLabel: "Complejo arqueológico",
    distrito: "San Pedro de Pallac · Atavillos Bajo",
    distancia: "2,5 h en vehículo + trek 14 km ida y vuelta",
    dificultad: "Difícil",
    difNivel: 3,
    altitud: "≈ 3.400 msnm",
    lat: -11.3469, lng: -76.8042, // aprox.
    img: "assets/img/anay.webp",
    alt: "Muro de piedra de la fortaleza de Añay, San Pedro de Pallac",
    gancho: "La fortaleza del abismo que los mapas casi no conocen.",
    descripcion: "Fortaleza y adoratorio atavillo en una cresta angosta de la sierra limeña, en la comunidad San Pedro de Pallac: la tradición cuenta que aquí se realizaban sacrificios humanos, y caminar sus muros de piedra es pisar uno de los santuarios más intensos de los Andes. El trek clásico de 14 kilómetros ida y vuelta desde Pallac es un examen de piernas y de cabeza.",
    datos: ["Fortaleza-adoratorio de la cultura Atavillos", "Trek clásico: 14 km ida y vuelta desde Pallac", "Muros de piedra con vista al abismo", "Lleva linterna: los recintos son laberínticos"],
    temporada: "Abr – Nov (seca)"
  },
  {
    slug: "rancocha",
    partida: { nombre: "Pirca", lat: -11.234243, lng: -76.655971, radioM: 500 }, // aprox.
    nombre: "Rancocha",
    tipo: "complejo",
    tipoLabel: "Complejo arqueológico",
    distrito: "Pirca · Atavillos Alto",
    distancia: "2,5 – 3 h en vehículo + trek",
    dificultad: "Media",
    difNivel: 2,
    altitud: "+3.000 msnm",
    lat: -11.2331, lng: -76.6459, // aprox.
    img: "assets/img/rancocha.webp",
    alt: "Vista aérea de la ciudadela de Rancocha sobre Pirca",
    gancho: "Una fortaleza al borde del abismo. El vacío también compite.",
    descripcion: "Fortaleza de piedra de la cultura Atavillos construida literalmente al borde del abismo, a más de 3.000 metros sobre Pirca. Sus kullpis miran de frente al valle y al colchón de nubes. Documentada por TusRutasPerú en TikTok: es el checkpoint donde el vértigo vota.",
    datos: ["Fortaleza Atavillos al borde del abismo", "+3.000 msnm sobre Pirca (Atavillos Alto)", "Kullpis con vista al colchón de nubes", "Estudiada por Hans Grados (2015): sectorización y tipología"],
    temporada: "Abr – Nov (seca)"
  },
  {
    slug: "maranhuasi",
    partida: { nombre: "Ravira", lat: -11.2032185, lng: -76.6570433, radioM: 500 }, // aprox.
    nombre: "Maranhuasi",
    tipo: "complejo",
    tipoLabel: "Complejo arqueológico",
    distrito: "Ravira · Pacaraos",
    distancia: "Cruce de Lacsa · +6 km · 3,5 – 4 h de subida",
    dificultad: "Difícil",
    difNivel: 3,
    altitud: "2.000 – 3.000 msnm",
    lat: null, lng: null,
    img: "assets/img/maranhuasi.webp",
    alt: "Vista aérea de Maranhuasi, la ciudad de piedra en Ravira",
    gancho: "Ni los mapas la conocen bien. Esta es para leyendas.",
    descripcion: "La 'ciudad de piedra' abandonada de Huaral: una fortaleza de la cultura Atavillos (1200–1400 d.C.) en Ravira, con kullpis, chullpas funerarias y pasadizos tipo laberinto diseñados para la defensa y el clima extremo. La subida es implacable —más de 1.000 metros de desnivel—, pero la trocha carrozable desde el cruce de Lacsa te ahorra dos horas. Documentada por TusRutasPerú: si creías que Rúpac era el trekking más exigente, esta ruta te hará cambiar de opinión.",
    datos: ["Fortaleza Atavillos: kullpis, chullpas y pasadizos laberínticos", "Desnivel: +1.000 m (de 2.000 a 3.000 msnm) · +6 km solo ida", "Trek: 3,5 – 4 h de subida exigente (1,5 – 2 h a buen ritmo sin peso)", "Dato: la trocha desde el cruce de Lacsa ahorra 2 h de caminata"],
    temporada: "Abr – Nov (seca)"
  },
  {
    slug: "azulcocha",
    partida: { nombre: "Vichaycocha", lat: -11.14, lng: -76.6236, radioM: 500 }, // aprox.
    nombre: "Laguna Azulcocha",
    tipo: "laguna",
    tipoLabel: "Laguna",
    distrito: "Vichaycocha · Pacaraos",
    distancia: "4 – 5 h en vehículo desde Huaral",
    dificultad: "Media",
    difNivel: 2,
    altitud: "+4.700 msnm",
    lat: -11.09134, lng: -76.54029, // aprox.
    img: "assets/img/azulcocha.webp",
    alt: "Laguna Azulcocha: espejo turquesa en la comunidad de Vichaycocha",
    gancho: "A 4.700 metros, el azul no es un color: es una recompensa.",
    descripcion: "Espejo de agua de un azul imposible a más de 4.700 metros, en la comunidad de Vichaycocha junto a las Torres de Vichaycocha, el Valle Rojo y los baños termales de Collpa. Silencio, montañas y altura extrema: el techo del circuito y el checkpoint que más respeto impone.",
    datos: ["Altitud: +4.700 msnm", "Circuito de Vichaycocha: Torres, Valle Rojo, termas de Collpa", "Aclimatación obligatoria antes de subir", "El azul más extremo de Huaral"],
    temporada: "Abr – Nov (seca)"
  },
  {
    slug: "rupac",
    partida: { nombre: "San Salvador de Pampas", lat: -11.313657, lng: -76.7769729, radioM: 500 }, // aprox.
    nombre: "Rúpac",
    tipo: "complejo",
    tipoLabel: "Complejo arqueológico · META",
    distrito: "San Salvador de Pampas · Atavillos Bajo",
    distancia: "Trek final · 3.580 msnm",
    dificultad: "La Meta",
    difNivel: 3,
    altitud: "3.580 msnm",
    lat: -11.3257512, lng: -76.8063065,
    img: "assets/img/rupac.webp",
    alt: "Kullpis de la ciudadela de Rúpac al atardecer, San Salvador de Pampas",
    gancho: "Coronaste el Machu Picchu limeño. El colchón de nubes es tu alfombra roja.",
    descripcion: "La meta. El complejo más emblemático de Huaral —el 'Machu Picchu limeño'— declarado Patrimonio Cultural de la Nación en 1999. Sus kullpis de hasta 10 metros se alzan al borde del abismo, con zona de campamento y el famoso colchón de nubes al amanecer. Cruzar esta meta es entrar al palmarés de los conquistadores de Huaral.",
    datos: ["Patrimonio Cultural de la Nación (1999)", "Kullpis de hasta 10 m al borde del abismo", "3.580 msnm · colchón de nubes al amanecer", "Comunidad campesina San Salvador de Pampas · zona de campamento"],
    temporada: "Abr – Nov (seca)",
    esMeta: true
  }
];

/* Orden oficial del circuito: de la costa a la puna, de fácil a legendario */
TRP.CIRCUIT = [
  "las-shicras", "moyocuanto", "huachac", "curinpacchi", "cotomarca",
  "araro", "chiprac", "anay", "rancocha", "maranhuasi",
  "azulcocha", "rupac"
];

TRP.place = (slug) => TRP.PLACES.find(p => p.slug === slug);
TRP.checkpoints = () => TRP.CIRCUIT.map(s => TRP.place(s));

/* ---- Rankings semilla (datos de demostración) ----
   Parciales ACUMULADOS desde la partida (crecientes).
   1h = 3.600.000 ms. El parcial final de cada corredor = su totalMs. */
TRP.SEED_RESULTS = [
  { runner: "PACO·TRP",     totalMs: 426600000,  date: "2026-09-28", demo: true,
    cps: { "las-shicras": 3240000, "moyocuanto": 21600000, "huachac": 41400000, "curinpacchi": 100800000, "cotomarca": 111600000, "araro": 118800000, "chiprac": 136800000, "anay": 180000000, "rancocha": 219600000, "maranhuasi": 270000000, "azulcocha": 324000000, "rupac": 426600000 } },
  { runner: "ANDINA·X",     totalMs: 465300000,  date: "2026-10-02", demo: true,
    cps: { "las-shicras": 3900000, "moyocuanto": 24600000, "huachac": 45600000, "curinpacchi": 108000000, "cotomarca": 122400000, "araro": 129600000, "chiprac": 147600000, "anay": 194400000, "rancocha": 237600000, "maranhuasi": 291600000, "azulcocha": 349200000, "rupac": 465300000 } },
  { runner: "CHASQUI·47",   totalMs: 531600000,  date: "2026-08-15", demo: true,
    cps: { "las-shicras": 4320000, "moyocuanto": 27000000, "huachac": 50400000, "curinpacchi": 118800000, "cotomarca": 136800000, "araro": 144000000, "chiprac": 165600000, "anay": 216000000, "rancocha": 266400000, "maranhuasi": 324000000, "azulcocha": 388800000, "rupac": 531600000 } }
];

TRP.formatMs = (ms) => {
  if (ms == null || isNaN(ms)) return "—";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
        m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n) => String(n).padStart(2, "0");
  return (d > 0 ? d + "d " : "") + p(h) + ":" + p(m) + ":" + p(sec);
};

TRP.formatMsShort = (ms) => {
  if (ms == null || isNaN(ms)) return "—";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
        m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
};
