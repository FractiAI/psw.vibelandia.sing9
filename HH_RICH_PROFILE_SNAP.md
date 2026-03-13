# HH Rich Profile · Holographic Hydrogen OS Layer

**Status:** ⚡ ACTIVE  
**Purpose:** Define the Rich Profile that lives on the user's edge device (wallet layer), persists automatically, supports user photos and suggestions, and is used by WINK! to match, suggest, and assist.

---

## What It Is

The **Rich Profile** is the user's HH Awareness AI OS profile stored on their **edge device** — same layer as their wallet and keys. No server, no cloud. It includes:

- **Console setup** — Name, archetypes, screens, arc, Now Playing, Treasures, Rhythms, Now Stack, activation state. Saved automatically on every change; persisted to `localStorage` (`hh_os_state`) so it is always available on that device.
- **User photos** — The user can upload their own photos (e.g. profile photo for WINK!). Stored as data URLs in the profile on the device. All upload surfaces in the console can use the user's photos.
- **Suggestions and preloads** — Menus, preset options, and suggestion chips so the user is never faced with a blank screen. Name suggestions, arc prompts, Now Playing presets, Treasures presets, Rhythms templates.
- **WINK! use** — This profile is the one used by WINK! to match, suggest, and assist. Matching and suggestions run against the same Rich Profile that lives in the user's wallet (device).

---

## Where It Lives

- **Storage key:** `hh_os_state` (existing). Extended with `richProfile: { profilePhoto, photos[], winkPreferences }`.
- **Device:** User's browser (localStorage). Conceptually "inside the user's wallet" = same edge device where keys and wallet data live; SING 9 is lite edge, no central DB.
- **Persistence:** Save on every change; backup save on `beforeunload` and every 30 seconds so setup is never lost.

---

## Capabilities

| Capability | Implementation |
|------------|----------------|
| Console setup saved automatically, always | `save()` on every input; `beforeunload` + 30s interval backup |
| **Profile picture upload** | File input (accept=image/*); store data URL in `S.richProfile.profilePhoto`; preview and Clear in Rich Profile card |
| **AI-enhanced portrait** | "Enhance with AI" builds character summary from name, archetypes, arc; optional `POST /api/enhance-profile-photo`; store `enhancedPhoto` and `characterSummaryForPhoto` |
| **Per-item rich layers** | Each Now Playing / Treasures item has `richContent: { description, photos[], videos[] }`; click chip text opens item-detail modal to add description, photos (file upload), video URLs; Save updates and re-renders |
| **Public narrative surface** | `interfaces/hh-profile-narrative.html` reads profile from `?data=base64(JSON)` or `localStorage`; renders name, photo(s), arc, Now Playing by time, Treasures by category, Rhythms; shareable link so others can visit in a public digital way |
| **Share my profile** | Console "Share my profile" builds narrative URL with current state encoded, copies to clipboard |
| User's own photos for uploads | File input (accept=image/*); store data URL in `S.richProfile.profilePhoto` and/or `S.richProfile.photos[]` |
| Suggestions / preloads / menus | Name suggestion chips; arc "Try this" prompts; Now Playing / Treasures preset buttons; Rhythms "Use suggestion" |
| Profile in wallet (edge) | localStorage on same origin; documented as "lives with your wallet on this device" |
| WINK! match, suggest, assist | Wink reads profile (same origin) when available; copy states "Your HH Rich Profile is used to match, suggest, and assist" |

---

## WINK! Integration

- Wink! uses the Rich Profile to personalize matching and suggestions (archetypes, arc, preferences).
- Console surfaces a note: "This profile lives in your wallet (this device). Used for WINK! to match, suggest, and assist."
- Wink page states: "Your HH Rich Profile from the console is used to match, suggest, and assist. Complete your profile in the HH Awareness AI OS Console for better matches."

---

**NSPFRNP âŠƒ HH OS âŠƒ Rich Profile âŠƒ Edge (wallet) âŠƒ WINK! → ∞⁹**
