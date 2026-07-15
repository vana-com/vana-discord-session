export type VanaAppDefinition = {
  id: string;
  name: string;
  /**
   * Primary `source_id` sent on the data-connection request. A DCR carries a
   * single source_id; the requested `scopes` may span sources, and the single
   * grant the approval mints (one grant per user + app) covers all of them.
   */
  source: string;
  /**
   * Every scope requested together in ONE data-connection request. Requesting
   * all scopes at once makes the approval mint ONE grant that covers them all,
   * so a later approval never overwrites an earlier grant's scopes. Splitting
   * these into separate DCRs is what triggers the scope-overwrite collision
   * (BUI-732): the grant is keyed by (user, app) only, and each approval
   * REPLACES its scopes.
   */
  scopes: readonly string[];
};

export const LINKEDIN_PROFILE_SCOPE = "linkedin.profile";
export const SPOTIFY_SAVED_TRACKS_SCOPE = "spotify.savedTracks";

/**
 * DevCord requests LinkedIn profile + Spotify liked songs in a SINGLE request
 * so both land under one grant. `source` is the primary connector shown during
 * approval; the grant still covers every scope in `scopes`.
 */
export const DEVCORD_APP: VanaAppDefinition = {
  id: "devcord-profile-snapshot",
  name: "DevCord",
  source: sourceFromScope(LINKEDIN_PROFILE_SCOPE),
  scopes: [LINKEDIN_PROFILE_SCOPE, SPOTIFY_SAVED_TRACKS_SCOPE],
};

export const REQUEST_BINDING_TTL_MS = 10 * 60 * 1000;

/** Derive the connector/source id from a scope (`"linkedin.profile"` → `"linkedin"`). */
export function sourceFromScope(scope: string): string {
  const dot = scope.indexOf(".");
  return dot === -1 ? scope : scope.slice(0, dot);
}
