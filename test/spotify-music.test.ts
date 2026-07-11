import assert from "node:assert/strict";
import { test } from "node:test";
import { SPOTIFY_MUSIC_FIXTURE } from "../src/data/spotify-music.fixture";
import {
  describeMusicPreferences,
  emptyMusicSnapshot,
  mapSpotifyMusic,
} from "../src/lib/spotify-music";

test("maps the sample spotify.savedTracks fixture", () => {
  const snapshot = mapSpotifyMusic(SPOTIFY_MUSIC_FIXTURE);
  assert.equal(snapshot.totalTracks, 6);
  assert.equal(snapshot.topArtists[0], "Khruangbin");
  assert.deepEqual(snapshot.tracks[0], {
    title: "People Everywhere (Still Alive)",
    artist: "Khruangbin",
  });
  assert.deepEqual(snapshot.tracks[1], {
    title: "Time Moves Slow",
    artist: "BADBADNOTGOOD, Sam Herring",
  });
});

test("maps connector-shaped payloads and key variants", () => {
  const snapshot = mapSpotifyMusic({
    "spotify.savedTracks": {
      savedTracks: [
        { name: "Song A", artists: [{ name: "Artist One" }] },
        { name: "Song B", artist: "Artist One" },
        { title: "Song C", artists: ["Artist Two"] },
        { track: { name: "Song D", artists: [{ name: "Artist One" }] } },
      ],
      total: 4,
    },
  });
  assert.equal(snapshot.totalTracks, 4);
  assert.deepEqual(snapshot.topArtists.slice(0, 2), ["Artist One", "Artist Two"]);
});

test("safely ignores malformed music payloads", () => {
  const malformed = [null, undefined, 42, "bad", [], {}, { data: { result: null } }, { savedTracks: [null, 7, { artists: [] }] }];
  for (const value of malformed) {
    assert.deepEqual(mapSpotifyMusic(value), emptyMusicSnapshot());
  }
});

test("describes music preferences from top artists", () => {
  assert.equal(describeMusicPreferences(emptyMusicSnapshot()), "No listening data yet.");
  assert.equal(
    describeMusicPreferences({ topArtists: ["Khruangbin"], tracks: [], totalTracks: 1 }),
    "Into Khruangbin.",
  );
  assert.equal(
    describeMusicPreferences({
      topArtists: ["Khruangbin", "Little Simz", "Radiohead", "Sudan Archives"],
      tracks: [],
      totalTracks: 9,
    }),
    "Into Khruangbin, Little Simz and Radiohead.",
  );
});
