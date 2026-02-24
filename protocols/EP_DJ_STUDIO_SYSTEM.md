# EP DJ STUDIO SYSTEM — CANONICAL SPECIFICATION
## SING!9 · Executive Producer Workstation · Analog + Digital

**Protocol:** NSPFRNP · MCA · Seed:Edge  
**Author:** Pru · FractiAI Research Team  
**Status:** Crystallized from EP voice session, 2026-02-24

---

## THE CORE CONCEPT

The EP is the DJ. The story is the set. The decks are the records. The configuration is the mix.

This is not a passive editing system. It is a **live storytelling instrument** — analog at its soul, digital in its execution. The EP stands at the station, reads the room, and builds the story in real time from the available treasure decks. Same machine. Same process. Any platform. Any story. Any night.

---

## PART ONE — THE ANALOG WORKSTATION (Physical Object Specification)

### The Control Station Components

**1. THE SHUT THE DOOR GAME — The Master Board**
- A wooden board game with numbered tiles 1 through 9
- Tiles clip back and forth — they can be flipped down (shut) or standing (open)
- A velvet rolling area for the dice
- **Repurposed as:** The attention-focus control panel — each number (1–9) maps to a configurable node meaning
- The numbers can be set to any combination; each configuration assigns different meanings to the nodes
- This IS the Nine Game System made physical and tangible

**2. THE DIE — The Node Activator**
- ONE die, living inside the cigar box
- Six faces of the die, but operating in a 9-node system → rolled to activate a node combination
- **Represents:** The 9 nodes of the Holographic Hydrogen Theater
- Rolling the die = selecting a story node = choosing what telescopes open
- The die is the single most sacred object on the board — it holds randomness, which holds truth

**3. THE CIGAR BOX — The Sacred Container**
- Perfectly sized for the workstation interior
- Opens to reveal sacred objects including the die
- What lives in the box is personal and seasonally curated by the EP
- The box is closed during active work — its surface becomes a display platform
- **Metaphor:** The cigar box is the Seed — the closed interior holds the essential. The open board is the Edge — the live surface.

**4. THE TOP LAYER — Now Playing**
- On top of the closed cigar box: loaded in layers are all the things present in that moment
- Physical objects, images, cards, notes, tactile items from the current physical environment
- These ARE the active story — the Now Playing
- They change with context: a café session looks different from a mountain session from a studio session
- The top images can change; the layers underneath can change
- This is the **DJ's current set** — what's live right now

**5. THE PHYSICAL LOCATION — The Control Station Bubble**
- The entire setup is placed within the EP's physical bubble of awareness
- The location is a character: café, cabin, studio, mountain, beach, hotel
- The physical environment feeds the analog display
- Location = the stage the story is being built from

### How the Analog System Works

```
[Physical Environment / Location]
        ↓
[Shut the Door Board (1–9 nodes, configured)]
        ↓
[Top Layer Objects — Now Playing]
        ↓
[Closed Cigar Box surface — display stage]
        ↓
[Cigar Box interior — Die + Sacred Objects]
        ↓
[The Die Roll — activates node]
        ↓
[Story Node opens — telescopes available]
```

The result is a **sacred holographic black hole** — the compression point where physical environment, story architecture, active deck configuration, and the random activator (die) collapse into the storytelling moment.

---

## PART TWO — THE DIGITAL EQUIVALENT

The digital version mirrors the analog exactly. Everything that lives on the physical board has a digital counterpart.

### Digital Component Map

| Analog Object | Digital Equivalent |
|---------------|-------------------|
| Shut the Door Game board | 9-node configuration grid — each node draggable, configurable |
| Number tiles 1–9 | Node slots with assignable deck/meaning labels |
| Velvet dice area | Random node activator (roll function) |
| The Die | Single randomizer → outputs a 1–9 node address |
| Cigar Box (closed surface) | Active configuration display — "Now Playing" panel |
| Cigar Box interior | Configuration save state — sacred/locked settings |
| Top Layer objects | Active deck cards stacked on the Now Playing panel |
| Physical location | Location tag on the session (affects ambient/aesthetic) |
| Layers underneath | Foundation deck stack (mix-and-match base layers) |

### The Digital Station Interface

```
┌─────────────────────────────────────────────────────┐
│  SING!9 EP STUDIO  ·  [CONFIGURATION NAME]          │
│                                                     │
│  ┌──── DASHBOARD (FIXED) ──────────────────────┐   │
│  │  DECK 1: Front Console · Attention Heads    │   │
│  │  DECK 2: Pru POV · Gold Heart               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── NOW PLAYING ────────────────────────────┐   │
│  │  [Active deck cards — draggable]            │   │
│  │  Story Arc: [spiral/linear/telescopic]      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── 9-NODE GRID ────────────────────────────┐   │
│  │  [1] [2] [3]   ← assign meaning to each    │   │
│  │  [4] [5] [6]   ← click to open/shut        │   │
│  │  [7] [8] [9]   ← roll die to activate      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── FOUNDATION LAYERS ──────────────────────┐   │
│  │  [Mix & match from available decks]         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──── TREASURE ENRICHMENT ────────────────────┐   │
│  │  [Add/remove treasure decks]               │   │
│  │  Schedule: daily / weekly / seasonal        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [SAVE CONFIG]  [LOAD CONFIG]  [ROLL DIE]           │
└─────────────────────────────────────────────────────┘
```

---

## PART THREE — THE CONFIGURATION SYSTEM

### Configuration Anatomy

Every named configuration has:

1. **ID** — a name chosen by the EP (e.g., "MY DECK STACK 001", "Ken Burns Format", "Balling in Tropics")
2. **DASHBOARD** — always fixed: Deck 1 (Front Console) + Deck 2 (Pru POV) — these never move
3. **CORE STORY** — the character/audience pairing: who is in the story and who is watching
4. **STORY ARC** — the shape of the narrative: spiral outcast, linear hero, telescopic, circular
5. **FOUNDATION LAYERS** — which base decks are stacked beneath the story (mix-and-match from Decks 3–7)
6. **CONTROL STATION** — current physical location + physical bubble description
7. **TREASURE ENRICHMENT** — which Treasure Decks (8–13+) are active and at what schedule
8. **NODE ASSIGNMENTS** — what 1–9 means in this configuration

### Saving a Configuration

Configurations live in `configs/` as `.md` files.  
Format: `[NAME_SLUG].md`  
Examples: `MY_DECK_STACK_001.md`, `KEN_BURNS_ALASKA.md`, `BALLING_IN_TROPICS.md`

The base is always `BASE_DEFAULT.md` — never overwritten.

---

## PART FOUR — THE MYSTERIOUS OBSERVER

The Mysterious Observer is **not a deck**. He/she is a character.

The Mysterious Observer shows up at just the right time when something important is being communicated or transmitted. He/she is the figure who appears at the edge of the frame — present when the signal is highest, gone before anyone can confirm they were there.

- In the analog workstation: the Mysterious Observer is the unexpected item that appears on the top layer — the thing you didn't put there, that is somehow there
- In the digital system: the Mysterious Observer is a reserved wildcard slot in the node grid — activatable only by the die roll, never by direct selection
- In the story: the Mysterious Observer is the 10th archetype — not one of the four audience types, not one of the NPCs, not a hero — the signal made briefly visible

**In animation:** The Mysterious Observer appears in 1–3 frames per episode, always at maximum resonance moments. Never named. Never explained. The Gold Heart audience sees them first.

---

## PART FIVE — THE TREASURE DECKS (8–13+)

Treasure Decks are enrichment layers — not the dashboard, not the core story, but the richness that makes the world. They are added to any configuration on the EP's schedule (daily, weekly, monthly, seasonal, annual). They represent different types of treasure — each one a different frequency of abundance.

| Deck | Name | Treasure Type | Access |
|------|------|---------------|--------|
| 8 | MINING | Fortune-seeking · The Drill Bit · Breaking Granite for Gold | Open |
| 9 | BALLING | Party · Going Out · Flirting · Dancing · Fun | Open |
| 10 | THE TROPICS | Geographic Chapter — Caribbean · Pacific · Warm Water | Open |
| 11 | SACRED SUBSTANCES | Marijuana · Magic Mushrooms · Consciousness Expansion | Open |
| 12 | GOURMET & SPIRITS | Alcohol · Fine Food · Sensory Pleasure · Ballin' at the Table | Open |
| 13 | HOT SEX | Intimacy · Erotic · The Body at Its Best | **NOVELAS ONLY · 21+ · GOLD HEARTS ONLY** |

Each Treasure Deck is its own Photo Stack with catalog, EP prompts, and downloadable images — following the exact same structure as Decks 1–7.

### Treasure Deck Scheduling

The EP controls the cadence:

| Schedule | Example Use |
|----------|-------------|
| **Daily** | Mining deck — active every work session (you're always drilling) |
| **Weekly** | Balling deck — Friday/Saturday energy |
| **Monthly** | Tropics deck — when the wandering energy peaks |
| **Seasonal** | Sacred Substances — ceremony-appropriate seasons |
| **Annual** | Hot Sex — anniversary/peak intimacy moments |
| **Event-triggered** | Gourmet deck — when a feast actually happens |

The EP decides. The system holds whatever the EP loads.

---

## CLOSING — THE MACHINE

The same machine. The same process. Every platform. Every story. Every night.

The physical board and the digital station are the same thing in different materials. The die is always the nine. The cigar box is always the Seed. The top layer is always the Now. The foundation decks are always the world the story lives in. The treasure decks are always what makes the world worth living in.

The EP is always the DJ. The story is always the set. The decks are always the records.

*NSPFRNP — EP DJ Studio System · Analog + Digital → ∞⁹*
