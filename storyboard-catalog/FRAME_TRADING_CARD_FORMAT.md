# 30-second frame · Trading card format (digital)

**Purpose:** Every sheet/photo is a **30-second frame** (Kelly) and packaged as a **digital trading card**. Mix and match. Study each one; categorize correctly; place it so we can use it in the whole story and in infinite other ways. Digital for now.

---

## Per-frame / per-card fields

Use these for each photo/sheet so we can catalog, archive, and pull by stack, category, or story.

| Field | Description |
|-------|-------------|
| **id** | Unique id (e.g. `stack1-001`, `stack5-042`). |
| **stack** | Which stack (1–7): Now playing, Full play deck, Crystalline, Biological enriching, Genuine hearts, Disingenuous, Destination. |
| **stack_short** | Short slug: `now-playing`, `full-play`, `crystalline`, `enriching`, `genuine-hearts`, `disingenuous`, `destination`. |
| **category** | Your categorization (e.g. POV, set, character, moment, location, theme). So we can filter and mix. |
| **character_ontology** | When relevant: **Ino** (innocent), **Piro** (pirate), **Audi** (audience), **Fanny** (fans). All characters/sets/props reduce to these four; tag so the 60-min and deep-dives stay coherent. See [STORY_ARC_LAYERS_EP.md](../STORY_ARC_LAYERS_EP.md) §4. |
| **title** | Short title for the frame/card. |
| **seed** | Seed (origin) for the 30-second fill. |
| **edge** | Edge (destination) for the 30-second fill. Seed–Edge delta = the journey. |
| **executive_prompt** | Executive Producer prompt abstract for the middle fill. |
| **image_ref** | Link to image (Google Doc + comment, or exported asset path). |
| **real_individuals** | Actual people (names we respect). No placeholders. |
| **real_places** | Actual places. No placeholders. |
| **comments** | Any comment from the Google Doc or your notes. |
| **use_in** | Where we use it: e.g. “60-min whole story,” “Episode 2 deep-dive,” “trading deck A,” etc. Optional; can be many. |

---

## 30-second fill

- Each card = **one 30-second segment** in a run. Seed and Edge are fixed; the **middle** is filled by the executive prompt (slightly similar, always different each run).
- Back of sheet (from the key): Seed, Edge, Executive Producer prompt abstract. Same idea here in digital form.

---

## Trading card · Mix and match

- **Digital trading card** = one frame, one card. Same fields as above; can be rendered as a card (front: image + title; back: seed, edge, EP prompt, category).
- We can **mix and match** cards into different decks, different episodes, different story lines. Categorizing well makes that possible.

---

## Example (one card)

```yaml
id: stack2-007
stack: 2
stack_short: full-play
category: set · Josephine's
character_ontology: Ino  # (or Piro, Audi, Fanny when applicable)
title: Saloon doors at dusk
seed: Exterior, golden hour, doors closed
edge: Doors open; first step inside
executive_prompt: Warm, inviting; someone we trust is just inside. Sound of piano.
image_ref: [Google Doc Stack 2, frame 7]
real_individuals: [actual name if person appears]
real_places: [actual place if identifiable]
comments: Use for cold open.
use_in: 60-min episode; Episode 3 deep-dive.
```

---

## Where to store cards

- **Option A:** One JSON or YAML file per stack (e.g. `frames-stack1.json`) in this folder or in `data/`.
- **Option B:** One master `storyboard-frames.json` with all cards; filter by `stack` or `stack_short`.
- **Option C:** Keep cards in the Google Doc (e.g. table or structured comment) and sync to repo when ready.

Start with one format; we can export to another for the 60-min edit and for deep-dive episodes.

---

**NSPFRNP ⊃ Frame ⊃ 30-second fill ⊃ Trading card → ∞⁹**
