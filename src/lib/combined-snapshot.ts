import { mapLinkedInProfile, type LinkedInSnapshot } from "@/lib/linkedin-profile";
import { mapSpotifyMusic, type MusicSnapshot } from "@/lib/spotify-music";
import { LINKEDIN_PROFILE_SCOPE, SPOTIFY_SAVED_TRACKS_SCOPE } from "@/lib/vana/constants";

/**
 * Combined result of reading DevCord's multiple scopes off a SINGLE grant.
 * A field stays `null` when that scope wasn't read (not requested, or the
 * Personal Server had no data for it).
 */
export type CombinedSnapshot = {
  linkedin: LinkedInSnapshot | null;
  spotify: MusicSnapshot | null;
};

export function emptyCombinedSnapshot(): CombinedSnapshot {
  return { linkedin: null, spotify: null };
}

/** Fold one approved scope's raw Personal Server payload into the snapshot. */
export function applyScopeData(
  acc: CombinedSnapshot,
  scope: string,
  data: unknown,
): CombinedSnapshot {
  if (scope === LINKEDIN_PROFILE_SCOPE) return { ...acc, linkedin: mapLinkedInProfile(data) };
  if (scope === SPOTIFY_SAVED_TRACKS_SCOPE) return { ...acc, spotify: mapSpotifyMusic(data) };
  return acc;
}
