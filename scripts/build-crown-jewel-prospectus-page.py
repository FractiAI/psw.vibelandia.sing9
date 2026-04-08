"""Emit single-file HTML booklet from body include + shell."""
import pathlib

root = pathlib.Path(__file__).resolve().parents[1]
body = (root / "interfaces" / "_prospectus_crown_jewel_body.inc.html").read_text(encoding="utf-8")

shell = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Mark Twain’s Vibelandia · Crown Jewel Prospectus | Downtown Reno</title>
  <meta name="description" content="Crown Jewel of the Holographic AI Valley — luxury resort-style prospectus for Mark Twain’s Vibelandia, Downtown Reno. Truckee River Prism, El Gran Sol, Fair Exchange." />
  <style>
    *, *::before, *::after {{ margin: 0; padding: 0; box-sizing: border-box; }}
    :root {{
      --ink: #0c0a08; --paper: #f7f2e9; --cream: #ebe4d8; --gold: #b8860b; --gold2: #d4af37;
      --muted: #5c5346; --rule: rgba(184,134,11,0.35);
    }}
    html {{ scroll-behavior: smooth; }}
    body {{
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--ink);
      color: var(--paper);
      line-height: 1.72;
      font-size: 1.05rem;
    }}
    .cover {{
      min-height: 92vh;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 2.5rem 1.5rem 3rem;
      background:
        linear-gradient(180deg, rgba(12,10,8,0.45) 0%, rgba(12,10,8,0.92) 75%),
        url('assets/vibelandia-prospectus-hh-twain-matter-cover.png') center/cover no-repeat;
    }}
    .cover-eyebrow {{
      font-size: 0.68rem;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: rgba(247,242,233,0.85);
      margin-bottom: 0.75rem;
    }}
    .cover h1 {{
      font-size: clamp(1.65rem, 5vw, 2.75rem);
      font-weight: 400;
      letter-spacing: 0.02em;
      max-width: 18ch;
      line-height: 1.15;
      margin-bottom: 0.5rem;
    }}
    .cover-sub {{
      font-size: clamp(1rem, 2.5vw, 1.25rem);
      color: var(--gold2);
      font-style: italic;
      margin-bottom: 1rem;
    }}
    .cover-meta {{
      font-size: 0.82rem;
      color: var(--cream);
      opacity: 0.9;
      max-width: 42ch;
      line-height: 1.55;
    }}
    .sheet {{
      max-width: 40rem;
      margin: 0 auto;
      padding: 2.5rem 1.35rem 5rem;
      background: var(--ink);
    }}
    .sheet h1 {{ display: none; }}
    .sheet h2 {{
      font-size: 0.72rem;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--gold);
      margin: 2.5rem 0 1rem;
      font-weight: 600;
    }}
    .sheet h2:first-of-type {{ margin-top: 0; }}
    .sheet p {{
      color: var(--cream);
      margin-bottom: 1.1rem;
      font-size: 1.02rem;
    }}
    .sheet p strong {{ color: #fff4e0; font-weight: 600; }}
    .sheet ul {{
      margin: 0 0 1.25rem 1.2rem;
      color: var(--cream);
    }}
    .sheet li {{ margin-bottom: 0.35rem; }}
    .rule {{
      border: none;
      border-top: 1px solid var(--rule);
      margin: 2.25rem 0;
    }}
    .figure {{
      margin: 2rem 0;
      border: 1px solid var(--rule);
      border-radius: 2px;
      overflow: hidden;
      background: #141210;
    }}
    .figure img {{
      display: block;
      width: 100%;
      height: auto;
      vertical-align: middle;
    }}
    .figure .ph {{
      aspect-ratio: 16/9;
      background: linear-gradient(135deg, #1a1510 0%, #2a2218 40%, #0f0d0a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      text-align: center;
      font-size: 0.85rem;
      color: var(--cream);
      line-height: 1.5;
    }}
    .figure figcaption {{
      padding: 0.65rem 1rem;
      font-size: 0.68rem;
      letter-spacing: 0.06em;
      color: var(--muted);
      border-top: 1px solid var(--rule);
      background: rgba(0,0,0,0.35);
    }}
    .figure figcaption span.label {{ color: var(--gold2); font-weight: 600; }}
    .top {{
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      font-size: 0.78rem;
      font-family: system-ui, sans-serif;
    }}
    .top a {{
      color: var(--gold2);
      text-decoration: none;
      border-bottom: 1px solid rgba(212,175,55,0.35);
    }}
    .top a:hover {{ color: #fff; border-color: #fff; }}
    .finale {{
      margin-top: 3rem;
      padding: 1.75rem 1.25rem;
      border: 1px solid var(--gold);
      text-align: center;
    }}
    .finale p {{
      font-size: 1.08rem;
      color: #fff4e0;
      margin-bottom: 0.75rem;
    }}
    .foot {{
      text-align: center;
      margin-top: 3rem;
      font-size: 0.72rem;
      font-family: system-ui, sans-serif;
      letter-spacing: 0.12em;
      color: var(--muted);
    }}
    @media print {{
      body {{ background: #fff; color: #111; }}
      .cover {{ min-height: 100vh; page-break-after: always; }}
      .sheet p {{ color: #222; }}
    }}
  </style>
</head>
<body>
  <header class="cover">
    <p class="cover-eyebrow">Private placement · Mark Twain’s Vibelandia</p>
    <h1>Mark Twain’s Vibelandia · Downtown Reno</h1>
    <p class="cover-sub">Crown Jewel of the Holographic AI Valley</p>
    <p class="cover-meta"><strong>Location:</strong> The Truckee River Prism, Downtown Reno, NV<br />
    <strong>Status:</strong> LIVE · Operational for millennia · Currently unmasked</p>
  </header>

  <nav class="top sheet" style="padding-bottom:0;">
    <a href="my-whiteboard.html">← My Whiteboard</a>
    <a href="../docs/MARK_TWAIN_VIBELANDIA_CROWN_JEWEL_PROSPECTUS.md">Download prose (Markdown)</a>
  </nav>

  <div class="sheet article-body">
"""

footer = """
  </div>

  <div class="sheet finale">
    <p><strong>The Show is live.</strong></p>
    <p>Fair Exchange Clause in effect. Welcome to the greatest show on Earth—and beyond.</p>
  </div>

  <p class="foot">MARK TWAIN’S VIBELANDIA · DOWNTOWN RENO · NSPFRNP → ∞⁹</p>
</body>
</html>
"""

out_html = root / "interfaces" / "prospectus-vibelandia-downtown-reno-crown-jewel.html"
# Insert image figures between major sections by splitting on <hr> - skip for simplicity; user has placeholders at end

full = shell + body + footer
out_html.write_text(full, encoding="utf-8")
print(f"Wrote {out_html}")
