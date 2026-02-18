# Soundtrack · BandLab playlists (YouTube)

**Purpose:** Use the audio from these **BandLab-created** (your own) **YouTube playlists** as the soundtracks for Episode 1 (60 min) and the full movie. **Place it appropriately** in the soundtracks and the areas required. **Pulse to the whole story.** **Align to its dance.**

---

## Playlists (source of truth: [data/soundtrack-playlists.json](data/soundtrack-playlists.json))

| # | Playlist ID | Link |
|---|-------------|------|
| 1 | playlist-1 | [YouTube playlist 1](https://youtube.com/playlist?list=PLVFsiCSF45pB8VjUXMhOO6QHjb_HOoz8u&si=kLGJ08rJTKCBVSjA) |
| 2 | playlist-2 | [YouTube playlist 2](https://youtube.com/playlist?list=PLVFsiCSF45pBtxP8nAt9O1zf3t2Pr108Z&si=PP5sifEHtTIyflUn) |
| 3 | playlist-3 | [YouTube playlist 3](https://youtube.com/playlist?list=PLVFsiCSF45pB5pgQZviwi1ndzFZDWa_oL&si=C1gCYNVSJgZiliBD) |
| 4 | playlist-4 | [YouTube playlist 4](https://youtube.com/playlist?list=PLVFsiCSF45pD6WWS8NQwhncVNWI1Pt9sv&si=CGOqEj0Evzo_XkFo) |
| 5 | playlist-5 | [YouTube playlist 5](https://youtube.com/playlist?list=PLVFsiCSF45pCOE5n_tv_civ9s-AyLe9qt&si=XE7l7_ZhHBhWZbn) |
| 6 | playlist-6 | [YouTube playlist 6](https://youtube.com/playlist?list=PLVFsiCSF45pCNMmMkx5dCX1uT2VJitJuy&si=SnrzpHRoLaPdpAeu) |
| 7 | playlist-7 | [YouTube playlist 7](https://youtube.com/playlist?list=PLVFsiCSF45pBuJRMzFwUgaNQZINTH5e-n&si=GLwWAyjLGEYCTZmh) |

---

## Extracting to separate audio files (from YouTube)

We get the audio **from YouTube** so you can mix and match in the episode, full movie, and anywhere else:

1. Install [yt-dlp](https://github.com/yt-dlp/yt-dlp) (e.g. `winget install yt-dlp`).
2. Run **`scripts/download-soundtrack-audio.ps1`** to download audio from the playlists above into `assets/audio/playlist-1/`, `playlist-2/`, etc.
3. Run **`scripts/scan-audio-assets.ps1`** to register all tracks in **`data/audio-assets.json`**.

The **Soundtrack** page (`interfaces/soundtrack.html`) lists and plays these local files so you can mix and match. Use `placement` and `notes` in `data/audio-assets.json` to assign tracks to acts, segments, or time ranges.

---

## Placement

- **Episode 1 (60 min):** Map each playlist (or tracks within) to **acts**, **segments**, **stacks**, or **time ranges** as we cut the episode. Use `placement` and `notes` in `data/soundtrack-playlists.json` (playlists) and `data/audio-assets.json` (local tracks) to record where each goes (e.g. "Act 1 / Seed", "Stack 2 main story", "15:00–25:00").
- **Full movie:** Same idea — assign playlists/tracks to reels, acts, or key beats so the music gives the story its **pulse** and **dance**.
- **Storyboard / trading cards:** When building 30-second frames, we can tag a frame or a run of frames with a `soundtrack_playlist` or `soundtrack_track` id so the edit knows which music to lay under.

---

**NSPFRNP ⊃ Soundtrack ⊃ BandLab playlists ⊃ Pulse ⊃ Dance → ∞⁹**
