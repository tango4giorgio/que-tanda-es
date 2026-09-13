# Tango Track Guessing Game — Frontend

A client-side progressive web game for identifying tango orchestras from short audio previews.
The MVP starts with Carlos Di Sarli, Juan D'Arienzo, Anibal Troilo, Osvaldo Pugliese, and
Astor Piazzolla.

This is the frontend workspace. Run all commands below from this `frontend/` directory
(see the repository root [README.md](../README.md) for the overall repo layout).

## Local development

```bash
npm install
npm run dev
```

The application is a static React + Vite build with no backend. The game always fetches
`/catalogue/starter-catalogue.json` at runtime, but which catalogue that resolves to depends
on how you're running it:

- **`npm run dev`** (the Vite dev server) automatically serves the local synthetic
  **test catalogue** (see below) instead — no setup needed.
- **`npm run build`** / **`npm run preview`** (and any deployed build) always serve the real
  **archive.org catalogue** committed at `public/catalogue/starter-catalogue.json`.

### Real catalogue (archive.org)

`public/catalogue/starter-catalogue.json` on disk is the production catalogue, generated
from a curated list of publicly hosted, individually addressable MP3 recordings on
[archive.org](https://archive.org) (three tracks per orchestra, 15 total), each confirmed to
be a single streamable file — not a multi-track ZIP — in the `opensource_audio`/`community`
collections. The source list, with the archive.org item identifier and filename for every
track, lives in `tools/build-catalogue/archive-org-tracks.ts`.

To add/replace tracks, edit that file and regenerate the catalogue:

```bash
npm run build:catalogue
```

This writes a fresh `public/catalogue/starter-catalogue.json` with `previewUrl`s pointing at
`https://archive.org/download/<identifier>/<filename>` (archive.org's stable, CORS-enabled
direct-download URL pattern) and a `version` of `archive-org-catalogue-<date>`.

### Local test catalogue (synthetic clips)

`public/catalogue/test-catalogue.json` is preserved for local styling and interaction
review only: it uses generated local speech clips in `public/audio/`, each announcing its
intended orchestra and track number, padded/looped to 30 seconds. Three clips are provided
per orchestra so the "Next track"/"Skip" controls can be exercised quickly without depending
on network access to archive.org. It is not music.

`vite.config.ts` includes a small dev-only middleware plugin that transparently serves this
file's contents for the `/catalogue/starter-catalogue.json` request whenever `npm run dev`
is running; this does not affect `npm run build`/`npm run preview`, and is never used by
automated tests (those load catalogue fixtures directly).

## Validation

```bash
npm run build
npm run test:coverage
npm run test:e2e
```

Coverage must remain at least 80% for lines, functions, statements, and branches. The pure
game engine should remain at least 95% covered. archive.org recordings are used for their
open licensing; verify continued availability/licensing terms before any commercial
deployment.
