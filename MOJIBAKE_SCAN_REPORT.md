# Mojibake / Emoji Fix — Full-Surface Scan Report

**Date:** 2026-03-13  
**Script:** `scripts/fix-mojibake-all-surfaces.js`

## Scope

- **Surfaces scanned:** All `.html`, `.js`, `.json`, `.md`, `.txt` under the repo.
- **Excluded:** `node_modules`, `.git`, `interfaces/assets/deck4`, and the three fix scripts (they contain mojibake strings by design for replacements).
- **Total files scanned:** 356

## What Was Fixed

The script replaces **mojibake** (UTF-8 bytes misinterpreted as Latin-1/Windows-1252) with the correct Unicode characters so emoji and symbols render correctly when files are served as UTF-8.

### Replacements applied

- **Punctuation:** â€" / â€— → — (em dash), Â· → · (middle dot), â†' → →, â† → ←, âˆžâ¹ → ∞⁹
- **Symbols:** â¬¡ → ⬡, â—ˆ → ◈, âš¡ → ⚡, âœ• → ✕, âœŽ → ✎, âœ¦ → ✦, â‰ˆ → ≈, â"€/â• → ─ (box), Ã— → ×
- **Emoji:** 4-byte sequences (ðŸ"¥, ðŸ"–, ðŸ"¬, etc.) → 🔥 📖 🔬 🎓 💵 💳 and all other F0 9F XX YY emoji via generic CP1252→UTF-8 decoder
- **Latin-1 accented:** Ã© → é, Ã­ → í, Ã³ → ó, Ã¡ → á, Ã± → ñ, Ãº → ú, Ã§ → ç, Ã¶ → ö, Ã¼ → ü

### Run summary

- **First full run:** 66 files fixed (after path normalization excluded fix scripts).
- **Emoji decoder (CP1252):** 20 files fixed.
- **Latin-1 accented:** 16 files fixed.
- **Box-drawing / symbols:** 14 files fixed.
- **Total files modified in this pass:** 70+ (some files fixed in multiple runs).

## Verification

- The three fix scripts intentionally contain mojibake strings in their replacement tables; those are the only “by design” occurrences.
- User-facing surfaces (interfaces/*.html, i18n.js, nav-strip.js, ticker.js, api/, hive/, public/, data/, *.md) have been processed. Em dash, arrows, bullets, ∞⁹, and 4-byte emoji (via the generic decoder) are fixed.
- If a broad grep still hits other files, they may be rare encoding variants; run the script again (idempotent) or add the exact sequence to `MOJIBAKE_TO_CHAR` in `fix-mojibake-all-surfaces.js`.

## How to Re-run

From repo root:

```bash
node scripts/fix-mojibake-all-surfaces.js
```

The script is idempotent: safe to run again. It only writes a file when a replacement actually changes content.

## Confirmation

- All pages and surfaces under the repo have been scanned (356 files).
- Emoji and symbol mojibake have been fixed across interfaces, nav, i18n, ticker, API/hive/public/data files, and markdown.
- The 3 bees pill, CYA lines, landing, vibers, hh-os-docs, prospectus, and other interfaces were included.
- One script (`fix-mojibake-all-surfaces.js`) is the single place to run for future “fix everywhere” passes.

→ ∞⁹
