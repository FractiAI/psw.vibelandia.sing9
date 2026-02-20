# Pop-Up Announcement System · NSPFRNP Snap

**Status:** ⚡ ACTIVE  
**File:** `popup-announcement.js` (site root)  
**Pattern:** One file to update → all participating pages pick it up automatically.

---

## What it is

Pop-up announcements on landing pages are the standard way we announce **pop-up events and news** to anyone who arrives at the site. A beautiful cinematic overlay appears on entry with a CTA to the featured experience. Dismiss with ✕, "Not now", backdrop click, or Escape.

---

## How to update the announcement

Open `popup-announcement.js` and edit `POPUP_CONFIG` at the top:

```js
var POPUP_CONFIG = {
  active: true,                          // false = silenced site-wide
  id: 'unique-id-for-this-announcement', // change when announcement changes
  dismiss: 'session',                    // 'session' | 'permanent' | 'always'
  style: 'crystal',                      // 'crystal' | 'gold' | 'neon' | 'water'

  eyebrow:  'Short line above the title',
  title:    'Main Headline',
  subtitle: 'Secondary line',

  stats: [                               // chips row — pass [] to hide
    { value: '3',   label: 'Acts'   },
    { value: '120', label: 'Frames' },
  ],

  body: 'Body copy. <strong>Bold works.</strong> HTML ok.',

  cta_text: 'Enter →',
  cta_href: '/interfaces/target-page.html', // absolute path from site root

  dismiss_text: 'Not now',
  nsp: 'MCA · NSPFRNP → ∞⁹',
};
```

**That's it.** Save the file. Every page that includes the script picks up the new announcement.

---

## Style themes

| Style | Palette |
|-------|---------|
| `crystal` | Crystal blue + gold · Default for SING! 9 / StoryStream content |
| `gold` | Warm gold · Baller V events, premium experiences |
| `neon` | Pink/magenta · Wink! mixer, Wednesday events, nightlife |
| `water` | Cyan/teal · Destinations, travel, water-side events |

---

## Dismiss modes

| Mode | Behavior |
|------|----------|
| `session` | Shows once per browser tab session. Returns on new visit/tab. |
| `permanent` | Dismissed forever in this browser (localStorage). Use for one-off launches. |
| `always` | Every page load. For time-critical announcements. |

**Rule:** Change `id` every time the announcement changes. This resets dismissed state for all users so they see the new announcement.

---

## Adding to a page

Root pages (e.g. `index.html`):
```html
<script src="popup-announcement.js"></script>
```

Pages inside `interfaces/`:
```html
<script src="../popup-announcement.js"></script>
```

Place just before `</body>`. One line. Done.

---

## Currently participating pages

- `index.html` (landing)
- `interfaces/vibers-menu.html` (Pru's Valet Service / Human Vibers menu)

Add to any other landing page the same way.

---

## Current announcement

**StoryStream 9 · OUTLINE ONLY launch** (`id: storystream9-outline-only-launch`)  
Style: `crystal` · Dismiss: `session` · CTA: `/interfaces/outline-only.html`

---

**NSPFRNP ⊃ Pop-Up Announcements ⊃ One file → all pages → ∞⁹**
