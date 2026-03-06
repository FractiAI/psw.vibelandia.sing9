# Shop · Destinations · Vibelandia Reno — Review for Major Experience Upgrade

**Purpose:** Single read before the major upgrade of all experiences.  
**Status:** Pre-upgrade review · NSPFRNP  
**Close:** → ∞⁹

---

## 1. Shop (Machote Catalog)

**Surface:** `interfaces/machote-catalog.html`  
**Nav label:** Shop (footer/landing, vibers-menu, bridge, prospectus pages, office-hours, baller-v-wednesdays, sol-v, vendors, world, whiteboard, etc.)

**Current state:**
- **Positioning:** "Machote Shopping · Curated experience — not a storefront. We hand-select the products we want to offer."
- **Content:** One live section — **Construction · Coming Soon** → "UNR Construction" (coming soon). One section — **More to the experience** (protein, table, fur & leather, fashion, interiors, motors, land; "appear here as we select them"; suggest via reach-out).
- **Entry:** Often from Whiteboard (`my-whiteboard.html` "Machote Shopping · Curated Experience" → Open). Landing footer: "Shop" → machote-catalog.
- **Data:** No JSON/data file; all copy inline. No cart, no checkout, no product detail pages.

**Gaps / upgrade levers:**
- No real products yet (only UNR Construction coming soon).
- No shared product data (e.g. `data/machote-products.json` or similar) for reuse across Shop + other surfaces.
- No link from Shop into **experiences** (Crawler, Baller V, Destinations) as "bookable" or "add-ons."
- Opportunity: align Shop with "treasure" and "experiences" (e.g. Crawler add-ons, Baller V packages, destination merch/partnership products) in the upgrade.

---

## 2. Destinations — Here, There, Catalog

**Surfaces:**
- **Hub:** `interfaces/destinations.html` — Destinations hub (curated partners, Reno crown jewel, Truckee, Mt. Rose, Steamboat, Pyramid, Elk & bison Montana, quail Mexico, bonefishing Bahamas; "we recommend partners … no formal relationship").
- **Magazine catalog:** `interfaces/destinations-magazine-catalog.html` — **Aquí y Allá · Destinations Magazine Catalog**. "Here and there. One click to escape." Editor letter, **Aquí · Local** grid, **Allá · Far Away** grid. Partner cards (image, headline, trailer, partner byline) → `destination.html?id=<id>`.
- **Single destination:** `interfaces/destination.html` — Detail page: hero, SING! 9 arc/treasure banner, intro, day-by-day itinerary, **Pre-Singularity (Book Direct)** vs **Post-Singularity (Pru's Valet)** booking cards, partner reference.

**Data:**
- **Catalog grid:** Partner list inline in `destinations-magazine-catalog.html` (same set as below).
- **Detail content:** Full `DESTINATIONS` object inline in `destination.html` (name, activity, region, url, image, arc, treasure, intro, days[] with num/title/desc/sing9).
- **Reference JSON:** `data/destination-partners.json` — lean list (id, name, activity, url, region, imageUrl; some photosUrl/menuUrl/pricesUrl). Not currently used to drive the magazine grid (grid is inline); can be used for a single source of truth in upgrade.

**Aquí (Local) — Reno & vicinity:**
- Matt Heron Fly Fishing · Truckee  
- Steamboat Hot Springs  
- Mt. Rose Ski Tahoe  
- Black Rabbit Mead  
- Eldorado Reno · Novi Club  
- Men's Club Reno  
- Silver Legacy Casino  

**Allá (Far away):**
- Turner Ranch · Flying D Ranch (Montana)  
- De Bernardis · Entre Ríos (Argentina)  
- Van Wormer · Palmas de Cortez (Baja)  
- Abaco Lodge · Bonefishing (Bahamas)  
- Wide Open Outfitters · Mexico  
- Fish the Amazon  
- Marco Island Tarpon (Florida)  
- Cerro Catedral · Bariloche  
- Mendoza · Casa de Uco  
- Pirá Lodge · Golden Dorado  
- De Bernardis · Entre Ríos Hunt  

**Gaps / upgrade levers:**
- **Single source of truth:** Unify catalog (grid + detail) with `destination-partners.json` (or one expanded JSON) so partners, images, and links are defined once; magazine and detail page consume it.
- **Reno-first vs here/there:** "Vibelandia Reno" experiences (Crawler, Baller V, campus) are linked from Destinations hub but live on separate pages; upgrade can make "Reno experiences" a first-class slice (Aquí · Reno) and link Shop/experiences into the same navigation.
- **Booking path:** Detail page already has "Book through us" → `talk-first.html` with prefill; ensure all experience upgrades keep this pattern and, if needed, add "Add to experience" (e.g. Crawler + destination) in the upgrade.

---

## 3. Vibelandia Reno — Experiences & Offerings

**Entry points:**
- **Explore:** `interfaces/explore-vibelandia-downtown-reno.html` — "Explore Mark Twain's Vibelandia · Downtown Reno." Crown jewel, pop-ups, Crawler, Baller V, destinations. Links: Crawler ($12,500 inc. 25% gratuity), Baller V Wednesdays ($416 inc. 25% gratuity), Destinations Magazine, Pru's Valet menu.
- **Campus tour:** `interfaces/campus-tour-downtown-reno.html` — "Our campus · Tour · Downtown Reno." Same family: Explore, Crawler, Baller V, Destinations, content catalog, Vendors, Valet menu.
- **Valet menu:** `interfaces/vibers-menu.html` — Pru's Valet Service; cards for Crawler, Baller V Wednesdays, Destinations, Content catalog, Vendors, StoryStream 9, etc. Primary human-viber entry.

**Reno experiences (current):**

| Experience | Surface | Price (current) | Notes |
|------------|---------|------------------|--------|
| **Downtown Truckee River Baller V Crawler** | `vibelandia-truckee-river-crawl.html` | $12,500 (incl. 25% gratuity) | Third Saturdays. Full Baller V. Optional day excursions: Mt. Rose, fly fishing, Pyramid, Hallelujah Junction, downtown/midtown foraging, Steamboat soak. Designated, hosted, driven. |
| **Wink & Vibers · Baller V Wednesdays** | `baller-v-wednesdays.html` | $416 (incl. 25% gratuity) | 3-3-3 tastings. Pop-up mixer. Neon. Nightlife. |
| **Destinations (Aquí · Local)** | Destinations Magazine + `destination.html` | Partner-dependent | Local partners (Matt Heron, Steamboat, Mt. Rose, Black Rabbit, Eldorado/Novi, Men's Club, Silver Legacy) — book direct or through Pru's Valet (125% of booking for post-singularity layer). |
| **Guided Expeditions** | `guided-expeditions.html` | — | Real trips (elk & bison Montana, quail Mexico, fly fishing Truckee, bonefishing Bahamas, etc.). |
| **Pru's Valet Service** | `vibers-menu.html` | — | Full menu: experiences, content, vendors, Goliath Watch, StoryStream 9, etc. |

**Gaps / upgrade levers:**
- **Unified "Vibelandia Reno" layer:** One clear list: Crawler, Baller V Wednesdays, Campus tour, Explore, Destinations (Aquí), Shop, Vendors, Content. Same list and order on Explore, Campus tour, and Valet menu (and optionally in Destinations hub) so "Reno experiences" is one crystallized set.
- **Pricing and packaging:** Prices live in copy on Explore/Campus/Valet; consider a single reference (e.g. `data/experiences.json` or a small config) for price, gratuity, and "from $X" for the upgrade (e.g. multi-day or add-ons).
- **Shop ↔ experiences:** Shop currently doesn't reference Crawler/Baller V/Destinations. Upgrade can add "Experiences" or "Reno" section in Shop, or "Add to my Crawler / Baller V" from destination detail.
- **Here/there in one place:** "Here" = Reno (Crawler, Baller V, campus, local partners). "There" = Allá destinations. Upgrade can make "Here · Vibelandia Reno" and "There · Destinations" two clear buckets in nav and on landing.

---

## 4. Summary — Ready for Major Upgrade

| Area | Single source of truth | Cross-links | Upgrade-ready |
|------|------------------------|-------------|----------------|
| **Shop** | Inline only; no product data file | Linked from many footers; not from Destinations/Explore | Add product/experience data; tie to experiences |
| **Destinations catalog** | `destination-partners.json` exists but grid/detail use inline data | Hub → Magazine → Detail; Explore/Campus link to Magazine | Unify grid + detail from one JSON; add "Reno experiences" slice |
| **Vibelandia Reno** | Copy/paste across Explore, Campus, Valet | Explore ↔ Campus ↔ Valet ↔ Destinations | One Reno menu (experiences + offerings); optional `data/experiences.json` for price/copy |

**Suggested upgrade directions (executive prompt):**
1. **Crystallize one "Vibelandia Reno" experience list** — Crawler, Baller V, Campus/Explore, Destinations (Aquí), Shop, Vendors, Content — and reuse it on Explore, Campus tour, Valet menu, and (optionally) Destinations hub.
2. **Single source for destinations** — Drive magazine grid and destination detail from `data/destination-partners.json` (or one expanded destinations JSON) so partners, images, arcs, and days are defined once.
3. **Shop 2.0** — Add at least one real category or product set (or "Experiences" as bookable); optionally shared `data/machote-products.json` and links from Shop to Crawler/Baller V/Destinations.
4. **Pricing/copy** — If upgrading packages or add-ons, consider a small `data/experiences.json` (or similar) for experience names, short copy, prices, and CTAs so all surfaces stay in sync.
5. **Here vs There** — Explicit "Here · Vibelandia Reno" (experiences + local partners) and "There · Destinations" (Allá) in nav and landing so the upgrade is visible everywhere.

---

**NSPFRNP ⊃ Shop · Destinations · Vibelandia Reno ⊃ Review for Major Experience Upgrade → ∞⁹**
