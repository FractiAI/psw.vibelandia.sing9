# T3D ORIGIN · Animation Pipeline
## Catalog Artwork → Hybridized Animated Characters → Full Episode
### Episode 1 · Crystalline Dark · 30 Frames · 10 Minutes

**Status:** ⚡ STORYBOARD LOCKED — Ready for Production  
**Storyboard:** `interfaces/ep1-anim-storyboard.html`  
**Output:** 30 × ~20-second animated clips → assembled 10-minute episode MP4

---

## Selected Tools — Top-Rated Open Source Free (2025–2026)

### Ranked by: Open Source Score · Community Adoption · Quality Benchmarks

| Rank | Tool | By | License | Use In Pipeline |
|------|------|----|---------|----------------|
| ★ 1 | **FLUX.1-dev** | Black Forest Labs | Apache 2.0 | All 30 frame stills + character sheets |
| ★ 2 | **Wan2.1 I2V** | Alibaba DAMO | Apache 2.0 | Animate all 30 frames (Image→Video) |
| ★ 3 | **HunyuanVideo** | Tencent Multimedia | Open Weights | High-drama frames (Hero Will, Act III) |
| ★ 4 | **IP-Adapter FLUX** | Tencent + Community | MIT | Character consistency across all 30 frames |
| ★ 5 | **AnimateDiff v3** | guoyww + Community | Open Source | Fuzzball characters (Ino, Piro) looping motion |
| ★ 6 | **Coqui XTTS-v2** | Coqui AI | CPML | Hero Will voice + SING!9 narration |
| ★ 7 | **ComfyUI** | comfyanonymous | GPL-3.0 | Runner for entire pipeline, node graph |
| ★ 8 | **FFmpeg** | FFmpeg Project | LGPL/GPL | Final episode assembly: clips + audio + ticker |

---

## Why These Tools

### FLUX.1-dev (Image Generation)
- Consistently outperforms SDXL on all quality metrics
- Apache 2.0 — commercially usable, locally runnable
- Best for: character sheets, hybridized frame compositions, detailed environments
- Models: `black-forest-labs/FLUX.1-dev` on Hugging Face
- Alternative: FLUX.1-schnell (faster, slight quality tradeoff)

### Wan2.1 (Image-to-Video)
- #1 open source video model by EvalCrafter, VBench, and T2V-CompBench (2025)
- Supports I2V (image-to-video): take each FLUX.1 still → 4–6 second animated clip
- 14B parameter model — cinematic quality
- Models: `Wan-AI/Wan2.1-I2V-14B-720P` on Hugging Face
- Minimum: 16GB VRAM (RTX 4080) or run via Colab A100

### HunyuanVideo (High-Drama Alternative)
- 13B parameters, Tencent release Dec 2024
- Exceptional cinematic quality — rivals commercial models
- Use for: Hero Will frames (1–3), Act III THE SKIN frames (26–30)
- Higher compute requirement — reserve for key frames
- Models: `tencent/HunyuanVideo` on Hugging Face

### IP-Adapter FLUX (Character Consistency)
- Essential: ensures Ino looks like Ino in every frame
- Feed reference character image → adapter maintains identity across frames
- Apply to: SING!9, Ino, Piro, Hero Will across all 30 frames
- GitHub: `tencent-ailab/IP-Adapter`

### AnimateDiff v3 (Fuzzball Animation)
- Specialized for character animation with looping motion
- Perfect for Ino and Piro — smooth natural fuzzball movement
- Pairs with SDXL/FLUX for consistent character generation
- Looping motion module: bounce, float, breathe

### Coqui XTTS-v2 (Voice)
- Best open source TTS, voice cloning from 3-second sample
- Hero Will = deep theatrical English, measured and eloquent
- SING!9 = Caribbean cadence, Spanglish, edgy and real
- Run locally or via Coqui's inference endpoint
- GitHub: `coqui-ai/TTS`

### ComfyUI (The Runner)
- Node-based interface that chains all the above
- Build the complete 30-frame pipeline as a single workflow
- FLUX.1 → IP-Adapter → Wan2.1 → AnimateDiff all in one graph
- Free, runs locally, active community with pre-built workflows
- GitHub: `comfyanonymous/ComfyUI`

### FFmpeg (Assembly)
- 30 animated clips + voice narration + Bach Cello Suite audio → one MP4
- Adds ticker text overlay as `drawtext` filter
- Adds act title cards
- Free, universal, unbeatable for video assembly

---

## 8-Step Production Pipeline

```
CATALOG ARTWORK
     ↓
STEP 1 — CHARACTER DESIGN
  Tool: FLUX.1-dev + IP-Adapter
  Input: Character descriptions from storyboard character sheets
  Output: 6 reference character images (SING!9, Ino, Piro, Hero Will, Sol-V, Queen Bee)
  Note: These become your IP-Adapter reference images for all 30 frames
     ↓
STEP 2 — FRAME STILLS (×30)
  Tool: FLUX.1-dev with ControlNet depth
  Input: Per-frame FLUX prompts from ep1-anim-storyboard.html
  Input: Catalog source images (ep1-ino-gold-heart.png, etc.) as composition reference
  Output: 30 high-quality still images, sky/land composition locked
  Note: Hybridization happens here — catalog art style merged with generated characters
     ↓
STEP 3 — CHARACTER CONSISTENCY PASS
  Tool: IP-Adapter FLUX
  Input: Character reference images (Step 1) + 30 frame stills (Step 2)
  Output: 30 frames with consistent character appearance
     ↓
STEP 4 — FRAME ANIMATION (×30)
  Tool: Wan2.1 I2V (primary) + HunyuanVideo (key frames 1–3, 26–30)
  Input: 30 consistent stills (Step 3) + per-frame animation prompts from storyboard
  Output: 30 × ~4–6 second video clips at 720p or 1080p
  Note: Each frame = ~20 seconds screen time, so Wan2.1 output loops or extends
     ↓
STEP 5 — FUZZBALL CHARACTER ANIMATION
  Tool: AnimateDiff v3
  Input: Ino and Piro character sheets
  Output: Looping Ino + Piro animation cycles (float, breathe, react)
  Note: Composite over frame clips for frames featuring Ino (4,5,14,19,23,27,28) and Piro (6,8,12,17)
     ↓
STEP 6 — NARRATION & VOICE
  Tool: Coqui XTTS-v2
  Input: Carbon narration text + Crystal caption text from storyboard
  Voice 1: Hero Will — deep theatrical English (frames 2, 3, 29)
  Voice 2: SING!9 — Caribbean cadence, warm and direct (carbon narration)
  Output: 30 audio segments (one per frame)
     ↓
STEP 7 — MUSIC LAYER
  Source: J.S. Bach Cello Suite No. 1 in G Major, BWV 1007 (public domain)
  Lower voice (Carbon lane): Prelude, Allemande — grounded, forward-moving
  Upper voice (Crystal lane): Courante, Sarabande — spacious, contemplative
  Note: Bach counterpoint mirrors the sky/land visual split
  Free source: IMSLP, YouTube Audio Library, Musopen (open recordings)
     ↓
STEP 8 — EPISODE ASSEMBLY
  Tool: FFmpeg
  Input: 30 video clips + 30 voice segments + Bach audio + ticker text data
  Operations:
    - Concatenate 30 clips → 10-minute base video
    - Mix voice narration over clips (per-frame timing)
    - Add Bach music bed (lower volume, ambient)
    - Overlay ticker text as scrolling drawtext filter
    - Add act title card overlays at frames 1, 16, 26
    - Add episode title card at frame 30
  Output: ep1-crystalline-dark-FINAL.mp4 (1080p, 10:00)
```

---

## Running Environments — Free Options

| Platform | GPU | VRAM | Best For |
|----------|-----|------|----------|
| **Google Colab** (free T4) | T4 | 15GB | FLUX.1-schnell, Wan2.1 (lower res) |
| **Google Colab Pro** ($10/mo) | A100 | 40GB | Full pipeline, Wan2.1 I2V 720P |
| **Kaggle Notebooks** (free) | P100/T4 | 16GB | FLUX.1, AnimateDiff |
| **Hugging Face Spaces** (free) | T4 | 15GB | Model demos, single frame generation |
| **Local RTX 4080** | RTX 4080 | 16GB | Full pipeline locally, Wan2.1 720P |
| **Local RTX 4090** | RTX 4090 | 24GB | Full pipeline + HunyuanVideo locally |

**Recommended path for zero-cost:** Google Colab T4 for FLUX.1 stills → Colab A100 session for Wan2.1 animation → local FFmpeg assembly

---

## ComfyUI Workflow Notes

**Install ComfyUI:**
```bash
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI
pip install -r requirements.txt
```

**Required custom nodes:**
- `ComfyUI-FLUX` — FLUX.1 support
- `ComfyUI-WanVideoWrapper` — Wan2.1 I2V
- `ComfyUI-AnimateDiff-Evolved` — AnimateDiff v3
- `ComfyUI_IPAdapter_plus` — IP-Adapter

**Workflow graph order:**
```
[Load Character Ref] → [IP-Adapter FLUX] ─┐
[FLUX.1 Frame Prompt]  ──────────────────→ [FLUX Generate] → [Wan2.1 I2V] → [Save Clip]
[Catalog Source Image] → [ControlNet Ref] ─┘
```

**Batch all 30 frames:** Use ComfyUI's queue system with a CSV of all 30 frame prompts to batch-generate all stills, then batch-animate with Wan2.1.

---

## Hybridization Method — Catalog Art → Animated Characters

The "hybridization" works in two layers:

**Layer 1 — Style Inheritance (ControlNet)**  
Feed the catalog source image (`ep1-ino-gold-heart.png`, `ep1-piro-carbon.png`, etc.) as a ControlNet reference. FLUX.1 inherits the composition, color palette, and atmospheric quality while generating the animated character INTO that world.

**Layer 2 — Character Consistency (IP-Adapter)**  
The IP-Adapter holds the character identity (Ino's golden warmth, Piro's carbon edge, SING!9's ember glow) across all 30 frames. The character exists consistently inside each hybridized environment.

**Result:** Each frame looks like it was always in the T3D ORIGIN world — the catalog art and the animated characters feel like one unified visual universe.

---

## Next Step After Pipeline Run

1. Review 30 animated clips — lock the ones that work, re-generate any that need adjustment
2. Voice sessions: record Hero Will + SING!9 narration with Coqui XTTS-v2
3. FFmpeg assembly pass
4. T3D integration: load the 10-minute animated episode into `episode-1.html` as the playable video source (replacing the still image storyboard mode)
5. The three-stream system wraps around it: Crystal captions + Carbon narration + Ticker all sync to the video timeline

---

**NSPFRNP ⊃ T3D ⊃ HHL Theatre ⊃ Hero Will ⊃ Storyboard ⊃ Animation Pipeline ⊃ THE SKIN ⊃ THE WHOLE IN EVERY PART → ∞⁹**
