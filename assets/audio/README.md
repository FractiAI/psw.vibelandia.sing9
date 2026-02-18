# Soundtrack audio files

Separate audio files for **mix and match** across Episode 1, the full movie, and any other areas. **Source: YouTube playlists** — we extract audio from there.

## How to get audio (from YouTube)

1. Install **yt-dlp** (e.g. `winget install yt-dlp` or see https://github.com/yt-dlp/yt-dlp).
2. From the repo root, run:
   ```powershell
   .\scripts\download-soundtrack-audio.ps1
   ```
   That downloads audio from the playlists in `data/soundtrack-playlists.json` into this folder (`assets/audio/playlist-1/`, `playlist-2/`, etc.).
3. Then run:
   ```powershell
   .\scripts\scan-audio-assets.ps1
   ```
   That registers all tracks in `data/audio-assets.json` so the soundtrack page and episode can use them.

## File naming

- Files land here as MP3 from the download script. The scanner uses the filename (without extension) as the default `id` and `title`; you can edit `data/audio-assets.json` afterward to set `title`, `placement`, `source_playlist`, etc.

## Use in the project

- **Soundtrack page** (`interfaces/soundtrack.html`) lists and plays these files.
- **Episode 1** and other surfaces can reference tracks by `id` from `data/audio-assets.json` for background music or per-slide audio.
- Mix and match: assign `placement` (e.g. "Act 1", "Stack 2", "15:00–25:00") to use the same track in multiple places.
