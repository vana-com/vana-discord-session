# Spotify "Music preferences" connect — design

**Date:** 2026-07-11
**Repo:** vana-discord-session (DevCord demo, `final` branch)

## Goal

Below the existing "Connect LinkedIn to personalize" button, add a second Vana
Direct Data connect option: "Connect Spotify" — it fills a **Music preferences**
section of the profile card from user-approved Spotify data, with the same
sample-data fallback the LinkedIn flow has.

## Context

- The demo currently hardcodes one Vana app (`linkedin-profile-snapshot`,
  source `linkedin`, scope `linkedin.profile`) across constants, binding,
  controller, capability assert, and the three API routes.
- Spotify is a real Vana source: connector `spotify-playwright` in
  `data-connectors`, source id `spotify`, scopes `spotify.profile`,
  `spotify.savedTracks`, `spotify.playlists`. Consumer default scope is
  `spotify.savedTracks` (liked songs) — the best single scope to back a
  "music preferences" section.

## Approach (chosen: parameterize by source)

Alternatives considered: (B) UI-only mock button — undercuts the demo's
point that data is user-approved and real; (C) duplicate spotify-specific
API routes — ~200 lines of copied binding/error plumbing. Chosen approach
keeps one set of routes and threads the source through.

### Backend

- `src/lib/vana/constants.ts`: replace `VANA_APP` with a `VANA_APPS`
  registry keyed by source:
  - `linkedin`: unchanged values (`linkedin-profile-snapshot`, scope `linkedin.profile`)
  - `spotify`: id `spotify-music-preferences`, name "Spotify Music Preferences",
    scope `spotify.savedTracks`
  - Export `VanaSource` union + `resolveVanaApp(source)` validator.
- `src/lib/vana/server.ts`: `getVanaController(runtime, app, config)`,
  cache key `${app.source}:${env}:${network}`.
- `src/lib/vana/binding.ts`: binding payload keeps `appId`/`source`/`scope`
  fields but validates them against the registry (any registered app, fields
  must be mutually consistent) instead of pinning to the LinkedIn constants.
  `createRequestBinding` takes the app definition. Cookie format version stays 1
  (shape is unchanged; old LinkedIn cookies remain valid).
- `src/lib/vana/capability.ts`: `assertScopeReadReady(status, app)` —
  same status check, scope compared against the bound app's scope.
- `POST /api/vana/request`: accepts optional `?source=` (default `linkedin`,
  400 on unknown values), builds the controller for that app, stores the app
  in the binding.
- `GET /api/vana/status`, `GET /api/vana/read`, `/connect/return`: derive the
  app from the binding (`resolveVanaApp(binding.source)`); read maps the
  payload with the per-source mapper.

### Data mapping

- `src/lib/spotify-music.ts`: `MusicSnapshot { artists: string[]; tracks: {title, artist}[] }`
  plus `mapSpotifyMusic(unknown)` — tolerant unwrapping like
  `mapLinkedInProfile` (handles `spotify.savedTracks` / `data` / `result`
  nesting, string-or-object artists, key variants). Top artists derived from
  track frequency. `describeMusicPreferences(snapshot)` renders the short
  section line ("Into Khruangbin, Little Simz, and Radiohead.").
- `src/data/spotify-music.fixture.ts`: sample liked-songs payload in the
  same envelope shape as the LinkedIn fixture.

### Frontend (`ProfileCard.tsx`)

- Extract the connect-state wiring into a local `useVanaSource(source)` helper
  (wraps `useDirectVanaConnect`, appends `source=` to the request path) and a
  `ConnectControls` subcomponent for the shared button/status/mode-label JSX,
  so LinkedIn and Spotify don't duplicate ~60 lines each.
- Below the existing LinkedIn content (status, buttons, mode label), add a
  **Music preferences** section: section title, summary line, track chips
  (reuse `.skill-chip`), its own status note, "Connect Spotify to personalize"
  button, and its own sample/live mode label.
- Per-source status copy (the LinkedIn strings mention LinkedIn explicitly).
- Small CSS addition: `.section-title` + a divider for the music block.

### Read payload typing

The generic read endpoint now returns either snapshot type; the client hooks
stay typed per-source (`useDirectVanaConnect<LinkedInSnapshot>` /
`<MusicSnapshot>`) since each hook only talks to requests it created.

## Error handling

Unchanged model: sanitized client errors via `mapClientError`; per-source
"not ready" message comes from the generic capability assert. Unknown
`source` param → 400 `invalid_request`.

## Testing

- Extend `test/contract.test.ts`: binding round-trip for the spotify app,
  cross-app tampering (spotify binding must not validate as linkedin scope),
  capability assert with mismatched scope, request-path source validation.
- New spotify mapper tests (fixture + sparse/malformed variants).
- Existing LinkedIn tests updated only where signatures changed.
- Verify: `pnpm test` (or package test script), `tsc --noEmit`, dev-server
  smoke test of the main page (sample mode renders both sections).

## Out of scope

- No changes to the bot/bio generation from Spotify data (music prefs is a
  separate profile section, not folded into the bio).
- No multi-scope Spotify requests (playlists/profile) — savedTracks only.
