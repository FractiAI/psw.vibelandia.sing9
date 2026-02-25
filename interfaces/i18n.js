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
      'end.sub'    : '16 BEATS · THREE ACTS · THE FULL ARC · ∞⁹',
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
      'end.sub'    : '16 BEATS · TRES ACTOS · EL ARCO COMPLETO · ∞⁹',
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
