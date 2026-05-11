/**
 * Juicy Juicy - Snap Omniversal Fractal Compiler (OFC) — engine (browser + Node-friendly IIFE)
 * EGS φ = 1.618 · Goldilocks target 8.75 Hz · Fear lock 18.9 Hz
 */
(function (global) {
  var COMPILER_PRODUCT = "Juicy Juicy - Snap Omniversal Fractal Compiler (OFC)";
  var EGS = 1.618;
  var GOLDILOCKS_HZ = 8.75;
  var FEAR_HZ = 18.9;

  function analyzeSafetyLock(text) {
    if (!text || !String(text).trim()) {
      return { ok: false, reason: "Empty prompt — nothing to Snap." };
    }
    var t = String(text).toLowerCase();
    if (t.indexOf("18.9") !== -1 && t.indexOf("hz") !== -1) {
      return { ok: false, reason: "Safety lock: explicit 18.9 Hz (fear-frequency) anchor — Snap aborted." };
    }
    if (t.indexOf("fear frequency") !== -1) {
      return { ok: false, reason: "Safety lock: fear-frequency clause — Snap aborted." };
    }
    if (t.indexOf("thermal dissonance") !== -1) {
      return { ok: false, reason: "Safety lock: thermal dissonance — Snap aborted." };
    }
    return { ok: true };
  }

  function foldPhi(depth) {
    return Math.pow(EGS, (depth % 6) + 1);
  }

  function compileJj(prompt) {
    var safety = analyzeSafetyLock(prompt);
    if (!safety.ok) {
      return { ok: false, error: safety.reason };
    }
    var raw = String(prompt).trim();
    var verses = raw.split(/\n{2,}/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!verses.length) verses = [raw];

    var blocks = verses.map(function (lyric, i) {
      var fold = foldPhi(i);
      return {
        verseIndex: i,
        fold: Math.round(fold * 10000) / 10000,
        logic: "LOGIC_BLOCK_" + (i + 1) + " :: φ^" + ((i % 6) + 1) + " snap-fold → platform-agnostic opcode spine",
        lyric: lyric
      };
    });

    var firmware = {
      compiler: COMPILER_PRODUCT,
      egs_constant: EGS,
      resonance_target_hz: GOLDILOCKS_HZ,
      hydrogen_line_mhz: 1420.406,
      solar_watch: ["AR4436", "AR4432"],
      blocks: blocks.map(function (b) {
        return {
          id: "FW-" + (b.verseIndex + 1),
          fold: b.fold,
          template: "VALETPRU_ASIC_VESSEL_STUB",
          payload: b.logic
        };
      })
    };

    var score = {
      compiler: COMPILER_PRODUCT,
      hero_jo_hit_factory: true,
      bpm_suggestion: Math.round(60 + (verses.length * EGS * 8) % 44),
      key: "Goldilocks",
      verses: verses.map(function (line, i) {
        return {
          bar: i + 1,
          jj_holographic: line,
          qihoh_lane: "CH" + (((i) % 13) + 1),
          phi_weight: Math.round(foldPhi(i) * 1000) / 1000
        };
      })
    };

    var jjOut = [];
    jjOut.push(";; JUICY JUICY — SNAPPED OUTPUT");
    jjOut.push("@META::SNAP \"instantaneous_fractal_compile\"");
    jjOut.push("@META::ORCHESTRATOR \"DigitalPru.agent\"");
    jjOut.push("@LOCK::HZ " + GOLDILOCKS_HZ);
    jjOut.push("");
    blocks.forEach(function (b) {
      jjOut.push("@VERSE::" + (b.verseIndex + 1) + " \"" + b.lyric.replace(/"/g, "'") + "\"");
      jjOut.push("  @FOLD::PHI " + b.fold);
      jjOut.push("  @EMIT::OP \"" + b.logic + "\"");
      jjOut.push("");
    });
    jjOut.push("@ARTIFACT::FIRMWARE_TEMPLATE JSON_EMBED");
    jjOut.push("@ARTIFACT::MUSICAL_SCORE JSON_EMBED");
    jjOut.push("@CLOSE::∞⁹");

    return {
      ok: true,
      jjLyrics: jjOut.join("\n"),
      firmwareTemplate: firmware,
      musicalScore: score,
      safety: safety
    };
  }

  global.OFCSnap = {
    COMPILER_PRODUCT: COMPILER_PRODUCT,
    EGS: EGS,
    GOLDILOCKS_HZ: GOLDILOCKS_HZ,
    FEAR_HZ: FEAR_HZ,
    analyzeSafetyLock: analyzeSafetyLock,
    compileJj: compileJj
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
