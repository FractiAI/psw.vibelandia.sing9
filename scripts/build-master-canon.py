"""Merge Part I (PEFF Omnizoan) + Part II (bio-EM) into one master markdown file."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"


def strip_first_h1(text: str) -> str:
    lines = text.splitlines()
    if lines and lines[0].startswith("# "):
        return "\n".join(lines[1:]).lstrip("\n")
    return text


def main() -> None:
    om = (DOCS / "DIGITAL_PRU_DNA_TRANSFORMER_PEFF_OMNIZOAN_INFILL13_2026-05-11.md").read_text(encoding="utf-8")
    bio = (DOCS / "DIGITAL_PRU_DNA_TRANSFORMER_PEFF_VALETPRU_BIOELECTROMAGNETIC_2026-05-11.md").read_text(encoding="utf-8")
    om_body = strip_first_h1(om)
    bio_body = strip_first_h1(bio)

    header = """# Digital Pru / DNA Transformer / PEFF -- Master Canon (SING 9)

**Merged on-repo reader (May 2026).** Nesting order in this file: **Part I** = outer **PEFF / Paradise OS / Omnizoan / infill 13** and VALETPRU-ASIC mapping. **Part II** = inner **helical polynucleotide bio-electromagnetics**, EGS hooks, and bench-adjacent tables.

**Honesty:** simulation-first; instrument claims stay tied to RTL/tests in `asic/` and `DIGITAL_PRU_ASIC_COHERENCE_WHITEPAPER.md`.

**Split editions (same corpus, smaller files):** [`DIGITAL_PRU_DNA_TRANSFORMER_PEFF_OMNIZOAN_INFILL13_2026-05-11.md`](./DIGITAL_PRU_DNA_TRANSFORMER_PEFF_OMNIZOAN_INFILL13_2026-05-11.md) / [`DIGITAL_PRU_DNA_TRANSFORMER_PEFF_VALETPRU_BIOELECTROMAGNETIC_2026-05-11.md`](./DIGITAL_PRU_DNA_TRANSFORMER_PEFF_VALETPRU_BIOELECTROMAGNETIC_2026-05-11.md)

**Navigate**

- [Part I -- PEFF / Omnizoan / infill 13](#part-i-peff-omnizoan-infill-13)
- [Part II -- Bio-electromagnetic helical polynucleotides](#part-ii-bio-electromagnetic-helical-polynucleotides)

**Verbatim scope:** This file is the **full concatenation** of the two maintained Part files (no summarization between the Part headers and their ends). That is the repo's **authoritative long-form** for SING 9; the Hood **legacy catalog** nests optional backup docs **around** this spine.

---

<a id="part-i-peff-omnizoan-infill-13"></a>

# Part I -- PEFF / Omnizoan / infill 13

"""
    mid = """

---

<a id="part-ii-bio-electromagnetic-helical-polynucleotides"></a>

# Part II -- Bio-electromagnetic helical polynucleotides

"""
    out = header + om_body + mid + bio_body
    path = DOCS / "DIGITAL_PRU_PEFF_DNA_TRANSFORMER_MASTER_CANON_2026-05-11.md"
    path.write_text(out, encoding="utf-8")
    print(path, len(out))


if __name__ == "__main__":
    main()
