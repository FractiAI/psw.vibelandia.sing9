"""Convert Crown Jewel prospectus MD to HTML body fragment (bold only)."""
import html
import pathlib
import re


def inline_bold(s: str) -> str:
    parts = re.split(r"(\*\*.+?\*\*)", s)
    chunks: list[str] = []
    for p in parts:
        if p.startswith("**") and p.endswith("**") and len(p) >= 4:
            chunks.append("<strong>" + html.escape(p[2:-2]) + "</strong>")
        else:
            chunks.append(html.escape(p))
    return "".join(chunks)


md_path = pathlib.Path(__file__).resolve().parents[1] / "docs" / "MARK_TWAIN_VIBELANDIA_CROWN_JEWEL_PROSPECTUS.md"
out_path = pathlib.Path(__file__).resolve().parents[1] / "interfaces" / "_prospectus_crown_jewel_body.inc.html"

text = md_path.read_text(encoding="utf-8")
lines = text.splitlines()
out: list[str] = []
i = 0
while i < len(lines):
    line = lines[i]
    if line.startswith("# "):
        out.append("<h1>" + inline_bold(line[2:]) + "</h1>")
    elif line.startswith("## "):
        out.append("<h2>" + inline_bold(line[3:]) + "</h2>")
    elif line.strip() == "---":
        out.append('<hr class="rule" />')
    elif not line.strip():
        out.append("")
    elif line.startswith("- "):
        out.append("<ul>")
        while i < len(lines) and lines[i].startswith("- "):
            out.append("<li>" + inline_bold(lines[i][2:]) + "</li>")
            i += 1
        out.append("</ul>")
        i -= 1
    else:
        out.append("<p>" + inline_bold(line) + "</p>")
    i += 1

out_path.write_text("\n".join(out), encoding="utf-8")
print(f"Wrote {out_path} ({len(out)} chunks)")
