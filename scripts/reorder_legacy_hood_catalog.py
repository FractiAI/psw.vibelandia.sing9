"""Rewrite look-under-the-hood-legacy-catalog.html papers section: main canon + nested optional."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "interfaces" / "look-under-the-hood-legacy-catalog.html"

# Order: outer PEFF / thesis shell -> ... -> studio (backup only). Papers 21-22 merged into master; omitted here.
ORDER = [5, 9, 10, 11, 13, 1, 2, 3, 18, 14, 15, 16, 19, 20, 17, 6, 12, 4, 7, 8]

NESTS: list[tuple[str, str, list[int]]] = [
    ("1 · PEFF shell · thesis and paradigm", "Prospectus and HHF framing before lattice detail.", [5, 9]),
    ("2 · Hydrogen · sky · RF", "Hydrogen-line metaphor and passive RF discipline.", [10, 11]),
    ("3 · Architecture · mirrored layers", "OS metaphor for how surfaces stack.", [13]),
    ("4 · QIHOH · ignition and unified map", "On-site reader sect. 7 plus long QIHOH markdown.", [1, 2]),
    ("5 · ASIC bench · PEFF validation gate", "Coherence whitepaper plus quantum genomic PEFF track.", [3, 18]),
    ("6 · EGS nodal lattice (inner A to outer C)", "Selective coherence, integrated modeling, genomic architecture.", [14, 15, 16]),
    ("7 · Genomic lattice · agent · ops", "Upstream lattice, operator spec, 24x365 mode.", [19, 20, 17]),
    ("8 · Gateway · silica", "External gateway paper and on-site silica prospectus.", [6, 12]),
    ("9 · House rules · honesty", "MCA catalog and methodology split.", [4, 7]),
    ("10 · Studio persona", "Hero Jo bio.", [8]),
]

ARTICLE_RE = re.compile(
    r'<article class="paper">\s*<span class="num"(?:[^>]*)>(\d+)</span>([\s\S]*?)</article>',
    re.MULTILINE,
)

MAIN_CANON = r'''    <h2 class="papers-head" id="main-canon" data-i18n="hood.mainCanonHead">Main paper · Digital Pru / DNA transformer / PEFF</h2>
    <p class="papers-sub" data-i18n-html="hood.mainCanonSub"><strong>Read this first.</strong> One merged <strong>master canon</strong> (Part I: PEFF / Omnizoan / infill 13, Part II: helical bio-electromagnetics). Everything below is <strong>optional backup</strong>, ordered from outer thesis shell down to studio notes.</p>
    <div class="main-canon-card">
      <p class="tier" data-i18n="hood.mainCanonTier">Merged canon · May 2026</p>
      <h2><a href="whitepaper-surface.html?doc=../docs/DIGITAL_PRU_PEFF_DNA_TRANSFORMER_MASTER_CANON_2026-05-11.md&amp;title=Digital%20Pru%20Master%20Canon" data-i18n="hood.mainCanonTitle">Digital Pru · DNA Transformer · PEFF — master canon</a></h2>
      <p class="blurb" data-i18n="hood.mainCanonBlurb">Full stack narrative in one file: outer PEFF operating-system language, then inner DNA transformer physics and EGS hooks. Split editions remain for smaller downloads.</p>
      <p class="main-canon-slices" data-i18n-html="hood.mainCanonSlices">Split only: <a href="whitepaper-surface.html?doc=../docs/DIGITAL_PRU_DNA_TRANSFORMER_PEFF_OMNIZOAN_INFILL13_2026-05-11.md&amp;title=Part%20I%20PEFF">Part I (PEFF / Omnizoan)</a> · <a href="whitepaper-surface.html?doc=../docs/DIGITAL_PRU_DNA_TRANSFORMER_PEFF_VALETPRU_BIOELECTROMAGNETIC_2026-05-11.md&amp;title=Part%20II%20bio-EM">Part II (bio-EM)</a></p>
    </div>

    <h2 class="papers-head" id="papers" data-i18n="hood.papersHeadNested">Optional backup documents · nesting order</h2>
    <p class="papers-sub" data-i18n-html="hood.papersSubNested">These channels back up the master canon and the <a href="digital-pru-awareness-whitepaper.html#meet-digital-pru-asic">ASIC presentation</a>. None are required to operate the stack on GitHub.</p>
    <div class="papers-list nested-archive">
'''

FOOTER = "    </div>\n  </main>"


def main() -> None:
    text = HTML.read_text(encoding="utf-8")
    m = re.search(
        r'(<h2 class="papers-head" id="papers" data-i18n="hood\.papersHead">[\s\S]*?</div>\s*</main>)',
        text,
    )
    if not m:
        raise SystemExit("papers block not found")
    block = m.group(1)
    articles: dict[int, str] = {}
    for am in ARTICLE_RE.finditer(block):
        n = int(am.group(1))
        inner = am.group(0)
        articles[n] = inner
    missing = [n for n in ORDER if n not in articles]
    if missing:
        raise SystemExit(f"missing articles: {missing}")
    out = [MAIN_CANON]
    for head, note, nums in NESTS:
        out.append('      <div class="nest-group">')
        out.append(f'        <h3 class="nest-head">{head}</h3>')
        out.append(f'        <p class="nest-note">{note}</p>')
        for n in nums:
            out.append("        " + articles[n].replace("\n", "\n        ").strip())
        out.append("      </div>")
    out.append("    </div>")
    new_block = "\n".join(out) + "\n  </main>"
    text2 = text[: m.start()] + new_block + text[m.end() :]
    HTML.write_text(text2, encoding="utf-8")
    print("OK", HTML)


if __name__ == "__main__":
    main()
