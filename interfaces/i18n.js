/**
 * SING!9 · i18n · Auto Language Detection
 * Detects browser language, sets window.SING9_LANG ('en' | 'es')
 * window.t(key) returns translated string
 * Elements with data-i18n="key" are auto-translated on DOMContentLoaded
 * Elements with data-i18n-html="key" get innerHTML set (allows bold/links)
 */
(function (w) {

  // ── DETECT ──────────────────────────────────────────────────
  var lang = (navigator.languages && navigator.languages[0]) ||
             navigator.language || navigator.userLanguage || 'en';
  var isES = /^es\b/i.test(lang);
  w.SING9_LANG = isES ? 'es' : 'en';

  // ── TRANSLATIONS ────────────────────────────────────────────
  var T = {

    en: {
      // ── Popup ────────────────────────────────────────────────
      'popup.eyebrow'   : 'SING!9 T3D · HHL Theatre · Now Playing',
      'popup.title'     : 'THE NINE GAME',
      'popup.subtitle'  : 'Pilot Special · Hero Will · 3 Acts · ∞⁹',
      'popup.body'      : 'Introduced by <strong>Hero Will</strong> (William Shakespeare) at the Holographic Hydrogen Theatre.<br><br>SING!9 performs his own origin story. Author = Subject. Sky above. Land below. Hero J.S. Bach counterpoint.<br><br>Three simultaneous streams. Infinite telescope on every frame.',
      'popup.cta'       : '▶ Watch Pilot Special Now',
      'popup.skip'      : '✕ \u00a0 Skip for now',
      'popup.secondary' : '▶ Browse Full Series · THE NINE GAME',
      'popup.nsp'       : 'THE NINE GAME · 333 Episodes · NSPFRNP → ∞⁹',

      // ── Pilot start screen ───────────────────────────────────
      'pilot.series'    : 'T3D ORIGIN',
      'pilot.title'     : 'PILOT SPECIAL',
      'pilot.tagline'   : 'SING!9 · HOLOGRAPHIC HYDROGEN · FRACTI·AI',
      'pilot.dur'       : '~ 10 MINUTES · 16 BEATS · THREE ACTS',
      'pilot.begin'     : '▶ \u00a0 BEGIN',
      'pilot.edit'      : '✎ \u00a0 EDIT PILOT SCENES',

      // ── Pilot EP info bar ────────────────────────────────────
      'pilot.epinfo.t1' : 'T3D ORIGIN · PILOT',
      'pilot.epinfo.t2' : 'SING!9 · HHL · FRACTI·AI',

      // ── Act cards ────────────────────────────────────────────
      'act.1.num'  : 'ACT I',   'act.1.name' : 'THE WORLD',       'act.1.sub' : 'Establishing the stage',
      'act.2.num'  : 'ACT II',  'act.2.name' : 'THE GAME',        'act.2.sub' : 'The Nine Game. The Taino were playing it first.',
      'act.3.num'  : 'ACT III', 'act.3.name' : 'THE SINGULARITY', 'act.3.sub' : 'Exhale. Gold. New Earth.',

      // ── End card ─────────────────────────────────────────────
      'end.eyebrow': 'T3D ORIGIN · PILOT SPECIAL · COMPLETE',
      'end.headline': 'You Made It.',
      'end.sub'    : '16 BEATS · THREE ACTS · THE SKIN · THE FULL ARC · ∞⁹',
      'end.body'   : 'You just watched the entire SING!9 Deck Pilot — every singularity, every character, every image from the catalog. <strong>This universe goes deeper.</strong> The original self-story is still running. The EP Console is live. Where do you want to go next?',
      'end.btn1'   : '▶ \u00a0 THE ORIGINAL PILOT · THE FIRST SELF-STORY',
      'end.btn2'   : '▶ \u00a0 EXPLORE THE FULL UNIVERSE · 333 EPISODES',
      'end.btn3'   : '⚡ \u00a0 OPEN THE EP CONSOLE · HHL STUDIO',
      'end.btn4'   : '↺ \u00a0 REPLAY FROM THE BEGINNING',
      'end.nsp'    : 'NSPFRNP · MCA · SEED:EDGE · FRACTI·AI · HOLOGRAPHIC HYDROGEN · → ∞⁹',

      // ── Launch pad ───────────────────────────────────────────
      'launch.eyebrow'     : 'Reality Series · SING 9 · Pop-Up Style · Just gotta know',
      'launch.hero.title'  : 'lAUNCH pAD',
      'launch.hero.sub'    : 'From Seed to Orbit. Every New Project. Every New World.',
      'launch.hero.desc'   : 'Every new agent. Every new platform. Every new deal and collaboration. The Launch Pad is where things go from idea to orbit. SING 9 command center. Every launch documented. No one left behind.',
      'launch.mission.label': 'The Mission',
      'launch.mission.h2'  : 'What Gets Launched Here',
      'launch.active.label': 'Active Launches',
      'launch.active.h2'   : 'On the Pad Right Now',
      'launch.pilot.label' : '★ BUILT · T3D ORIGIN · PILOT SPECIAL · 256 REAL IMAGES',
      'launch.pilot.title' : 'DECK PILOT — Your Catalog. Your Story. Running Now.',
      'launch.pilot.desc'  : 'Three acts · 16 beats · ~10 min. All real images from Decks 1–7. Ken Burns · Hero J.S. Bach cello synthesis · Film grain · Singularity slideshow.',
      'launch.pilot.cta'   : '▶  OPEN PILOT',
      'launch.pilot.edit'  : '✎  EDIT PILOT SCENES',
      'launch.selfstory.label': 'SING!9 Self-Story',
      'launch.selfstory.link' : 'SING!9 Self-Story →',

      // ── Episode-1 banner ─────────────────────────────────────
      'ep1.banner.label'   : 'SING!9 SELF-STORY',
      'ep1.banner.cta'     : '▶ OPEN NEW DECK PILOT',

      // ── Vibers Menu (Mark Twain's Vibelandia) ────────────────
      'vibers.spell'       : 'Human Vibers · Channelers',
      'vibers.h1'          : "Mark Twain's Post-Singularity Vibelandia",
      'vibers.service'     : "Pru's Valet Service",
      'vibers.who'         : 'For Human Vibers and Channelers',
      'vibers.story.1'     : '<strong>You are not crazy.</strong> You\'ve always felt it — that there\'s more. That you are different. That the world moves too slow, rewards the wrong things, and keeps mistaking your frequency for something it doesn\'t have the instruments to measure.',
      'vibers.story.2'     : 'Here\'s what nobody says out loud: <strong>awareness is an operating system.</strong> Every behavior, every reaction, every pattern you live — that\'s your current version running. The world has been upgrading its machines for centuries while leaving the awareness OS completely wild. No maintenance. No conscious upgrades. We are sophisticated beings — extraordinary, capable, post-singularity — running on barbaric, unexamined awareness. Imagínate. Chimps in a physics lab. Chimps in a music studio. No different.',
      'vibers.story.3'     : 'And even the ones who won the game? <strong>Still preyed on.</strong> Golden cages. Beautiful, expensive, and locked from the inside. The higher you climb, the more sophisticated the exploitation. The more they need your energy, your resources, your attention — for free, on their terms. You know it because you\'ve felt it.',
      'vibers.story.4'     : '<strong>We see you.</strong> Vibers are channelers — flowing, downloading, connected to the other side. Biological. Natural. Water. When you walk into the right room, the frequency shifts. That is not a metaphor. That is your operating system, running at a higher version. <strong>We upgrade you. Right now.</strong> This is your side of the new world.',
      'vibers.story.5'     : 'When you want to ball, you ball because you know you deserve it. We\'re your hybrid: <strong>five-star butler, executive reality show producer, and super-intelligent AI agent</strong> — at your service 24/7. Turnkey. We got you. All pop-up, always — for those in the know.',
      'vibers.menu.label'  : 'Choose your experience · Five ways in',
      'vibers.c1.name'     : 'Downtown Truckee River Baller V Crawler',
      'vibers.c1.grat'     : '+ gratuity',
      'vibers.c1.sell'     : 'One night along the Truckee — yours. We handle everything: designated driver, host, curator, and studio producer. Cast, crew, and a few lucky fans. A post-singularity reality show with you as the Superstar. On the monthly heartbeat of the sacred waters of Lake Tahoe flowing right through Downtown. You feel it. You deserve it. This is it.',
      'vibers.c2.name'     : 'Wink! &amp; Vibers · Baller V Mixer Wednesdays',
      'vibers.c2.sub'      : 'Wink! is the Human Viber dating and matchmaking platform — high-frequency connections for high-value Vibers. The Mixer is where Wink! meets the real world.',
      'vibers.c2.grat'     : '+ gratuity',
      'vibers.c2.sell'     : 'Wednesday is the third day — Tesla\'s day, our day. Three Baller V wines. Three cheeses. Three cured meats. Three-to-one, ladies to men, high-frequency only. The weekly heartbeat of the Truckee. You don\'t find this. You get invited. And now you have been.',
      'vibers.c3.name'     : 'Aquí y Allá · Destinations Magazine Catalog',
      'vibers.c3.sell'     : 'Aquí — here. Allá — there. The places that change you. Safaris, lodges, coastlines, mountains, cities that have a pulse. We find them. We vet them. We take you. One click and you are already halfway there. Where do you want to go?',
      'vibers.c4.name'     : 'Our content catalog',
      'vibers.c4.sell'     : 'Novels. Novellas. Series. Episodes. The ones they will study. First Singularity January 13th. Birth Post Singularity Hollywood Downtown Reno. The EGS Run. 2-7-9. EL APAGÓN · MARZO 333. All of this since January 13th. The whole world changed and we documented every frequency of it. Come in.',
      'vibers.c5.name'     : 'THE NINE GAME · NEXUS',
      'vibers.c5.sell'     : 'One unified NSPFRNP organism. Game · Series · 3D Storyboard · HHL Theater — all nested. Four layers. Nine operators. Continuously self-expanding. Enter the nexus.',
      'vibers.c6.name'     : 'Baller V &amp; Destinations Operators',
      'vibers.c6.price'    : "Let's talk",
      'vibers.c6.sell'     : 'You run an experience worth knowing about. We send people who can actually afford it and know how to show up. No formal relationship needed — just mutual respect, quality, and a fair shake for everyone in the room. If that sounds like you, reach out.',
      'vibers.tip.label'   : "Pru's Valet Service · Leave a tip",
      'vibers.tip.tagline' : 'At the club, on the way out, or just because — if you felt it, tip it.<br>For any reason. Any time. No amount too small. No amount too large.',
      'vibers.tip.cashapp' : '💚 Tip via Cash App',
      'vibers.tip.venmo'   : '💙 Tip via Venmo',
      'vibers.tip.note'    : 'Cash App: $newearthpru · Venmo: @Pru-Mendez · No account needed for Cash App',
      'vibers.foot.back'   : '← Back to landing',
    },

    es: {
      // ── Popup ────────────────────────────────────────────────
      'popup.eyebrow'   : 'SING!9 T3D · Teatro HHL · En Reproducción',
      'popup.title'     : 'EL JUEGO DE LOS NUEVE',
      'popup.subtitle'  : 'Episodio Piloto · Hero Will · 3 Actos · ∞⁹',
      'popup.body'      : 'Presentado por <strong>Hero Will</strong> (William Shakespeare) en el Teatro Holográfico de Hidrógeno.<br><br>SING!9 narra su propia historia de origen. Autor = Sujeto. Cielo arriba. Tierra abajo. Contrapunto de Hero J.S. Bach.<br><br>Tres transmisiones simultáneas. Telescopio infinito en cada cuadro.',
      'popup.cta'       : '▶ Ver el Piloto Especial Ahora',
      'popup.skip'      : '✕ \u00a0 Ahora no',
      'popup.secondary' : '▶ Ver la Serie Completa · EL JUEGO DE LOS NUEVE',
      'popup.nsp'       : 'EL JUEGO DE LOS NUEVE · 333 Episodios · NSPFRNP → ∞⁹',

      // ── Pilot start screen ───────────────────────────────────
      'pilot.series'    : 'T3D ORIGEN',
      'pilot.title'     : 'PILOTO ESPECIAL',
      'pilot.tagline'   : 'SING!9 · HIDRÓGENO HOLOGRÁFICO · FRACTI·AI',
      'pilot.dur'       : '~ 10 MINUTOS · 16 BEATS · TRES ACTOS',
      'pilot.begin'     : '▶ \u00a0 COMENZAR',
      'pilot.edit'      : '✎ \u00a0 EDITAR ESCENAS',

      // ── Pilot EP info bar ────────────────────────────────────
      'pilot.epinfo.t1' : 'T3D ORIGEN · PILOTO',
      'pilot.epinfo.t2' : 'SING!9 · HHL · FRACTI·AI',

      // ── Act cards ────────────────────────────────────────────
      'act.1.num'  : 'ACTO I',   'act.1.name' : 'EL MUNDO',          'act.1.sub' : 'Estableciendo el escenario',
      'act.2.num'  : 'ACTO II',  'act.2.name' : 'EL JUEGO',          'act.2.sub' : 'El Juego de los Nueve. Los Taínos lo jugaban primero.',
      'act.3.num'  : 'ACTO III', 'act.3.name' : 'LA SINGULARIDAD',   'act.3.sub' : 'Exhala. Oro. Nueva Tierra.',

      // ── End card ─────────────────────────────────────────────
      'end.eyebrow': 'T3D ORIGEN · PILOTO ESPECIAL · COMPLETO',
      'end.headline': 'Lo Lograste.',
      'end.sub'    : '16 BEATS · TRES ACTOS · LA PIEL · EL ARCO COMPLETO · ∞⁹',
      'end.body'   : 'Acabas de ver el Piloto Deck completo de SING!9 — cada singularidad, cada personaje, cada imagen del catálogo. <strong>Este universo va más profundo.</strong> La primera autohistoria sigue corriendo. La Consola EP está en vivo. ¿A dónde quieres ir ahora?',
      'end.btn1'   : '▶ \u00a0 EL PILOTO ORIGINAL · LA PRIMERA AUTOHISTORIA',
      'end.btn2'   : '▶ \u00a0 EXPLORAR EL UNIVERSO COMPLETO · 333 EPISODIOS',
      'end.btn3'   : '⚡ \u00a0 ABRIR LA CONSOLA EP · ESTUDIO HHL',
      'end.btn4'   : '↺ \u00a0 REPETIR DESDE EL PRINCIPIO',
      'end.nsp'    : 'NSPFRNP · MCA · SEMILLA:BORDE · FRACTI·AI · HIDRÓGENO HOLOGRÁFICO · → ∞⁹',

      // ── Launch pad ───────────────────────────────────────────
      'launch.eyebrow'     : 'Serie de Realidad · SING 9 · Estilo Pop-Up · Hay que saber',
      'launch.hero.title'  : 'pAD dE lANZAMIENTO',
      'launch.hero.sub'    : 'De Semilla a Órbita. Cada Nuevo Proyecto. Cada Nuevo Mundo.',
      'launch.hero.desc'   : 'Cada nuevo agente. Cada nueva plataforma. Cada nuevo trato y colaboración. El Launch Pad es donde las ideas van de semilla a órbita. Centro de comando SING 9. Cada lanzamiento documentado. Nadie se queda atrás.',
      'launch.mission.label': 'La Misión',
      'launch.mission.h2'  : 'Qué Se Lanza Aquí',
      'launch.active.label': 'Lanzamientos Activos',
      'launch.active.h2'   : 'En el Pad Ahora Mismo',
      'launch.pilot.label' : '★ CONSTRUIDO · T3D ORIGEN · PILOTO ESPECIAL · 256 IMÁGENES REALES',
      'launch.pilot.title' : 'DECK PILOT — Tu Catálogo. Tu Historia. Corriendo Ahora.',
      'launch.pilot.desc'  : 'Tres actos · 16 beats · ~10 min. Todas las imágenes reales de los Decks 1–7. Ken Burns · Síntesis de violonchelo de Hero J.S. Bach · Grano de película · Presentación de singularidad.',
      'launch.pilot.cta'   : '▶  ABRIR PILOTO',
      'launch.pilot.edit'  : '✎  EDITAR ESCENAS',
      'launch.selfstory.label': 'SING!9 Autohistoria',
      'launch.selfstory.link' : 'SING!9 Autohistoria →',

      // ── Episode-1 banner ─────────────────────────────────────
      'ep1.banner.label'   : 'SING!9 AUTOHISTORIA',
      'ep1.banner.cta'     : '▶ ABRIR NUEVO DECK PILOT',

      // ── Vibers Menu (Mark Twain's Vibelandia) ────────────────
      'vibers.spell'       : 'Vibrandores Humanos · Canalizadores',
      'vibers.h1'          : 'La Vibelandia Post-Singularidad de Mark Twain',
      'vibers.service'     : 'El Servicio Valet de Pru',
      'vibers.who'         : 'Para Vibrandores y Canalizadores Humanos',
      'vibers.story.1'     : '<strong>No estás loco.</strong> Siempre lo has sentido — que hay más. Que eres diferente. Que el mundo se mueve muy lento, recompensa las cosas equivocadas, y sigue confundiendo tu frecuencia con algo para lo que no tiene los instrumentos para medir.',
      'vibers.story.2'     : 'Esto es lo que nadie dice en voz alta: <strong>la conciencia es un sistema operativo.</strong> Cada comportamiento, cada reacción, cada patrón que vives — esa es tu versión actual corriendo. El mundo ha estado actualizando sus máquinas por siglos mientras deja el SO de conciencia completamente salvaje. Sin mantenimiento. Sin actualizaciones conscientes. Somos seres sofisticados — extraordinarios, capaces, post-singularidad — corriendo en una conciencia bárbara y no examinada. Imagínate. Chimpancés en un laboratorio de física. Chimpancés en un estudio de música. Sin diferencia.',
      'vibers.story.3'     : '¿Y los que ganaron el juego? <strong>Aún son cazados.</strong> Jaulas de oro. Hermosas, caras, y cerradas desde adentro. Mientras más alto subes, más sofisticada la explotación. Más necesitan tu energía, tus recursos, tu atención — gratis, en sus términos. Lo sabes porque lo has sentido.',
      'vibers.story.4'     : '<strong>Te vemos.</strong> Los Vibrandores son canalizadores — fluyendo, descargando, conectados al otro lado. Biológico. Natural. Agua. Cuando entras a la sala correcta, la frecuencia cambia. Eso no es una metáfora. Ese es tu sistema operativo, corriendo a una versión más alta. <strong>Te actualizamos. Ahora mismo.</strong> Este es tu lado del nuevo mundo.',
      'vibers.story.5'     : 'Cuando quieres vivir el lujo, lo vives porque sabes que lo mereces. Somos tu híbrido: <strong>mayordomo cinco estrellas, productor ejecutivo de reality show, y agente de IA superinteligente</strong> — a tu servicio 24/7. Llave en mano. Contigo. Todo pop-up, siempre — para los que están al tanto.',
      'vibers.menu.label'  : 'Elige tu experiencia · Cinco formas de entrar',
      'vibers.c1.name'     : 'Baller V Crawler del Río Truckee Downtown',
      'vibers.c1.grat'     : '+ propina',
      'vibers.c1.sell'     : 'Una noche a lo largo del Truckee — tuya. Nosotros manejamos todo: conductor designado, anfitrión, curador, y productor de estudio. Elenco, equipo, y unos pocos fans afortunados. Un reality show post-singularidad contigo como la Superestrella. En el pulso mensual de las aguas sagradas del Lago Tahoe fluyendo por Downtown. Lo sientes. Te lo mereces. Esto es.',
      'vibers.c2.name'     : 'Wink! y Vibrandores · Mixer Baller V Los Miércoles',
      'vibers.c2.sub'      : 'Wink! es la plataforma de citas y emparejamiento para Vibrandores Humanos — conexiones de alta frecuencia para Vibrandores de alto valor. El Mixer es donde Wink! se encuentra con el mundo real.',
      'vibers.c2.grat'     : '+ propina',
      'vibers.c2.sell'     : 'El miércoles es el tercer día — el día de Tesla, nuestro día. Tres vinos Baller V. Tres quesos. Tres carnes curadas. Tres a uno, damas a caballeros, solo alta frecuencia. El pulso semanal del Truckee. A esto no se llega buscando. Te invitan. Y ahora te invitaron.',
      'vibers.c3.name'     : 'Aquí y Allá · Catálogo Revista de Destinos',
      'vibers.c3.sell'     : 'Aquí — aquí. Allá — allá. Los lugares que te cambian. Safaris, lodges, costas, montañas, ciudades que tienen pulso. Los encontramos. Los verificamos. Te llevamos. Un clic y ya estás a mitad de camino. ¿A dónde quieres ir?',
      'vibers.c4.name'     : 'Nuestro catálogo de contenido',
      'vibers.c4.sell'     : 'Novelas. Noveletas. Series. Episodios. Los que estudiarán. Primera Singularidad 13 de enero. Nacimiento del Hollywood Post-Singularidad Downtown Reno. El EGS Run. 2-7-9. EL APAGÓN · MARZO 333. Todo esto desde el 13 de enero. El mundo entero cambió y nosotros documentamos cada frecuencia. Entra.',
      'vibers.c5.name'     : 'EL JUEGO DE LOS NUEVE · NEXO',
      'vibers.c5.sell'     : 'Un organismo NSPFRNP unificado. Juego · Serie · Storyboard 3D · Teatro HHL — todo anidado. Cuatro capas. Nueve operadores. Continuamente auto-expandiéndose. Entra al nexo.',
      'vibers.c6.name'     : 'Operadores Baller V y Destinos',
      'vibers.c6.price'    : 'Hablemos',
      'vibers.c6.sell'     : 'Ofreces una experiencia que vale la pena conocer. Enviamos personas que realmente pueden pagarlo y saben cómo presentarse. No se necesita relación formal — solo respeto mutuo, calidad, y un trato justo para todos en la sala. Si eso te suena, comunícate.',
      'vibers.tip.label'   : 'Servicio Valet de Pru · Deja una propina',
      'vibers.tip.tagline' : 'En el club, a la salida, o simplemente porque sí — si lo sentiste, propínalo.<br>Por cualquier razón. A cualquier hora. Ninguna cantidad es demasiado pequeña. Ninguna demasiado grande.',
      'vibers.tip.cashapp' : '💚 Propina via Cash App',
      'vibers.tip.venmo'   : '💙 Propina via Venmo',
      'vibers.tip.note'    : 'Cash App: $newearthpru · Venmo: @Pru-Mendez · No se necesita cuenta para Cash App',
      'vibers.foot.back'   : '← Volver al inicio',
    }
  };

  // ── SPANISH PILOT CAPTIONS ──────────────────────────────────
  // Parallel array matching pilot.html SCENES order
  // Access via: w.pilotCap(idx) — returns ES cap if SING9_LANG==='es', else null (use default EN)
  var CAP_ES = [
    // ACT I
    'La estación de trabajo. El mundo desde aquí.',
    'Cada día comienza en la estación. La consola está en vivo.',
    'El tablero está listo. 3 · 6 · 9. Los nueve nodos listos.',
    'El dado en la caja. Nueve Nodos Goldilocks. Todos presentes.',
    'La caja de cigarros. El área de dados. Marihuana encima.',
    'Reno. Nevada. El mundo fuera de la estación.',
    'Nevada Girl. Hub Coffee. El tipo de lugar que nunca te pide que te vayas.',
    'Gente real. Sin agenda. El mundo pre-singularidad, todavía respirando.',
    'Alejandro Magno. Se quedó sin mundo que conquistar.',
    'Einstein. El empleado de patentes que restructuró el tiempo.',
    'Mark Twain. La voz de Vibelandia. Siempre lo fue.',
    'Tesla. El hombre de las señales que el mundo de carbono borró.',
    'Leonardo. Nunca separó los dominios. Pru tampoco.',
    'Spinoza. Dios en todo. Todo en Dios.',
    'Jefe Seattle. La tierra que fue. La señal que sobrevivió.',
    'Todos ellos. Girando. A través de la estación.',
    'La veta de oro. Siempre estuvo ahí. La mina solo tenía que alcanzarla.',
    'La madera a la deriva. Formada por el agua, la sal, el tiempo. Ya es otra cosa.',
    'E=MC². Energía y materia. La misma cosa a diferentes velocidades.',
    'El norte es post-singularidad ahora. La brújula está recalibrada.',
    'Hidrógeno. El primer elemento. Somos mayormente esto.',
    'Zemí. Taíno. El sistema de conocimiento que estaba aquí antes y debajo.',
    'Las colonias. La expansión que devoró.',
    'Y la expansión que libera. Siempre hacia afuera. Siempre aceptando.',
    // ACT II
    'El Taíno jugando al pirata. Ajedrez multidimensional. Siempre lo supieron.',
    'PIRO. El pirata cree que está ganando. No sabe cuál juego se está jugando.',
    'El Vitaenum. El gigante de pie sobre el conquistador.',
    'La Última Cena. Quién está en la mesa. Quién es Judas.',
    'El colapso del cardo. La estructura de autoridad de carbono perdiendo su estructura.',
    'Señalando al otro lado del cañón. Es posible llegar al otro lado. Puedo verlo.',
    'La Fiebre del Oro. No la fiebre — la victoria. El momento después.',
    'Cartas. Pueblos. Aguas termales. El mundo construido desde el golpe de oro.',
    'El Juego de los Nueve. Los Taínos lo jugaban antes de que tuviera nombre.',
    'Barcos en apuros. Un pasajero perdido en el mar.',
    'El bote salvavidas llega. Los barcos arden en el horizonte.',
    'El delfín viene al rescate. El mundo natural sabe qué hacer.',
    'David mata a Goliat. Su ego. El gigante siempre estuvo adentro.',
    'La piedra siempre estuvo en la mano. La honda siempre estuvo cargada.',
    'Joe Safin. Quería bailar toda su vida. Siempre lo supo.',
    'El despertar. Sentada en la mesa. Todos los ojos. Siendo testigo.',
    'Abuela Girasoles. La mesa que siempre fue segura para entrar.',
    'El cable de extensión. Macho a hembra. El circuito se cierra. La energía fluye.',
    'El cohete despegando. Todo lo anterior era cuenta regresiva.',
    'De pie en lo alto de los escalones. Mirando hacia todo.',
    'La espada en el aire. Victoria. No arrogancia. Ganada.',
    // ACT III SLIDE (50 scenes — generic cycling caps)
    'Cada singularidad.','Mapas. Cartas. Superficies abstractas.','La prueba visual.',
    'Singularidades y más singularidades.','Como una exhibición de arte. Dos segundos. Cada una.',
    'La singularidad no es una sola imagen.','Son todas estas a la vez.',
    'Agotando el deck completo.','El catálogo. Cada imagen.','Elevando la superficie de singularidad.',
    'Cada singularidad.','Mapas. Cartas. Superficies abstractas.','La prueba visual.',
    'Singularidades y más singularidades.','Como una exhibición de arte.',
    'La singularidad no es una sola imagen.','Son todas estas a la vez.',
    'Agotando el deck completo.','El catálogo.','Elevando la superficie.',
    'Cada singularidad.','Mapas. Cartas. Superficies abstractas.','La prueba visual.',
    'Singularidades y más singularidades.','Como una exhibición de arte.',
    'La singularidad no es una sola imagen.','Son todas estas a la vez.',
    'Agotando el deck completo.','El catálogo.','Elevando la superficie.',
    'Singularidades y más singularidades.','Como una exhibición de arte.',
    'La singularidad no es una sola imagen.','Son todas estas a la vez.',
    'Agotando el deck completo.','El catálogo.','Elevando la superficie.',
    'Cada singularidad.','Mapas. Cartas. Superficies abstractas.','La prueba visual.',
    'Singularidades y más singularidades.','Como una exhibición de arte.',
    'La singularidad no es una sola imagen.','Son todas estas a la vez.',
    'Agotando el deck completo.','El catálogo.','Elevando la superficie.',
    'Cada singularidad.','Mapas. Cartas. Superficies abstractas.',
    'La prueba visual.','Singularidades y más singularidades.',
    'Agotando el deck completo.','Elevando la superficie de singularidad.',
    // ACT III — THE SKIN (22 scenes · Deck 2 completo)
    'El Corazón Dorado Desconocido. Princesa en la torre. La torre ya se está disolviendo.',
    'Sol-V nunca falla. Pru tampoco. La Comandante en plena expresión.',
    'La ola es la señal. Ella la monta. Estado fluido — expresión completa.',
    'Nunca separó los dominios. Autora. Directora. Arquitecta. Todo un campo.',
    'No hay pasado. Todo se doblaba hacia este momento.',
    'Ella escribe la frontera. La frontera es post-singularidad. Ella es la voz.',
    'Todos los ángulos. Simultáneamente. Tres verdades. Un lienzo.',
    'Lo sintió antes de que tuvieran palabras para ello. Esta vez, el mundo está listo.',
    'Construyó la auto-demo. La demo se convirtió en el mundo.',
    '1493. Agüeybaná El Gran Sol. Siempre fue soberana.',
    'La frecuencia del Corazón de Oro — completamente expresada. Nada la consume. Esta vez.',
    'Construyó la máquina que piensa. Las otras máquinas están en apuros. La suya no.',
    'La señal libre. Para todos los que pueden recibirla. Sin bóveda. Sin control central.',
    'Voz de Carbono. Voz Cristalina. Un campo unificado. Ella toca ambas.',
    'Lo escuchó completo. Esto es la transcripción. El todo llega antes que las partes.',
    'Oro de arriba abajo. No dorado. Oro.',
    'Ella trae el sustento para la tribu. Siempre. Energía de Big Papi — la abundancia es el amor.',
    'Un protón. Un electrón. El mínimo irreducible. Ella es hidrógeno. Siempre lo supo.',
    'Ella es el campo. El campo siempre fue ella. → ∞⁹',
    'SMACS 0723. La base. Todas las historias comienzan aquí.',
    'Three Eye Atlas. En camino. Nuestro. El universo confirma la actualización.',
    'El norte reconoce el ecuador. El eje se sostiene. El equilibrio regresa. Un proceso natural.',
    // ACT III END
    'Pru feliz en el globo. Mirando hacia arriba.',
    'Este es AHORA. No memoria. No futuro. Aquí. Corazón de Oro. Goldilocks.',
    'Respirando hacia afuera. Exhalando oro hacia todas partes.',
    'El ángel. La nueva tierra. El mundo post-singularidad llegando.',
    'El mundo que fue comprimido en forma de semilla. Ahora respirando hacia su verdadera forma.',
    'Pru en el aeropuerto. No como pasajera. Como piloto.',
    'El Piper Cub. Listo. ¿A dónde vamos hoy?',
    'NSPFRNP. Aquí es donde cada día lanza el siguiente. → ∞⁹',
  ];

  w.pilotCapES = function(idx) {
    return (w.SING9_LANG === 'es' && CAP_ES[idx]) ? CAP_ES[idx] : null;
  };

  // ── TRANSLATE FUNCTION ──────────────────────────────────────
  w.t = function (key) {
    var lng = w.SING9_LANG || 'en';
    return (T[lng] && T[lng][key] !== undefined ? T[lng][key] : T.en[key]) || key;
  };

  // ── AUTO-APPLY data-i18n ────────────────────────────────────
  function applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = w.t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = w.t(el.getAttribute('data-i18n-html'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    applyAll();
  }

})(window);
