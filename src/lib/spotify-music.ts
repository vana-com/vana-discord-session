export type MusicTrack = {
  title: string;
  artist: string;
};

export type MusicSnapshot = {
  topArtists: string[];
  tracks: MusicTrack[];
  totalTracks: number;
};

type RecordValue = Record<string, unknown>;

/**
 * Map an approved spotify.savedTracks payload (liked songs) into the profile
 * card's music preferences. Tolerant of envelope nesting and key variants,
 * mirroring mapLinkedInProfile.
 */
export function mapSpotifyMusic(input: unknown): MusicSnapshot {
  const rawTracks = unwrapTracks(input);
  const tracks = rawTracks
    .map(mapTrack)
    .filter((track): track is MusicTrack => track !== null);

  return {
    topArtists: topArtists(tracks),
    tracks: tracks.slice(0, 5),
    totalTracks: tracks.length,
  };
}

export function emptyMusicSnapshot(): MusicSnapshot {
  return { topArtists: [], tracks: [], totalTracks: 0 };
}

/** Short summary line for the profile card, e.g. "Into Khruangbin, Little Simz, and Radiohead." */
export function describeMusicPreferences(snapshot: MusicSnapshot): string {
  const artists = snapshot.topArtists.slice(0, 3);
  if (artists.length === 0) return "No listening data yet.";
  const list =
    artists.length === 1
      ? artists[0]
      : `${artists.slice(0, -1).join(", ")} and ${artists[artists.length - 1]}`;
  return `Into ${list}.`;
}

function unwrapTracks(input: unknown, depth = 0): unknown[] {
  if (depth > 4) return [];
  if (Array.isArray(input)) return input;
  if (!isRecord(input)) return [];

  for (const key of ["savedTracks", "saved_tracks", "tracks", "items"]) {
    if (Array.isArray(input[key])) return input[key];
  }
  for (const key of ["spotify.savedTracks", "data", "result"]) {
    if (key in input) {
      const unwrapped = unwrapTracks(input[key], depth + 1);
      if (unwrapped.length > 0) return unwrapped;
    }
  }
  return [];
}

function mapTrack(input: unknown): MusicTrack | null {
  if (!isRecord(input)) return null;
  const source = isRecord(input.track) ? input.track : input;
  const title = firstString(source, ["name", "title"]);
  if (!title) return null;
  return { title, artist: artistName(source) };
}

function artistName(track: RecordValue): string {
  const single = firstString(track, ["artist"]);
  if (single) return single;
  const artists = track.artists;
  if (!Array.isArray(artists)) return "";
  return artists
    .map((entry) =>
      typeof entry === "string" ? entry.trim() : isRecord(entry) ? firstString(entry, ["name"]) : "",
    )
    .filter(Boolean)
    .join(", ");
}

function topArtists(tracks: MusicTrack[]): string[] {
  const counts = new Map<string, number>();
  for (const track of tracks) {
    for (const artist of track.artist.split(",").map((name) => name.trim()).filter(Boolean)) {
      counts.set(artist, (counts.get(artist) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([artist]) => artist);
}

function firstString(input: RecordValue, keys: string[]): string {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
