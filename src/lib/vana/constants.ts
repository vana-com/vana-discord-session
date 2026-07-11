export type VanaAppDefinition = {
  id: string;
  name: string;
  source: VanaSource;
  scope: string;
};

export const VANA_APPS = {
  linkedin: {
    id: "linkedin-profile-snapshot",
    name: "LinkedIn Profile Snapshot",
    source: "linkedin",
    scope: "linkedin.profile",
  },
  spotify: {
    id: "spotify-music-preferences",
    name: "Spotify Music Preferences",
    source: "spotify",
    scope: "spotify.savedTracks",
  },
} as const satisfies Record<string, { id: string; name: string; source: string; scope: string }>;

export type VanaSource = keyof typeof VANA_APPS;

export const DEFAULT_VANA_SOURCE: VanaSource = "linkedin";

export function isVanaSource(value: unknown): value is VanaSource {
  return typeof value === "string" && value in VANA_APPS;
}

export function resolveVanaApp(source: VanaSource): VanaAppDefinition {
  return VANA_APPS[source];
}

export const REQUEST_BINDING_TTL_MS = 10 * 60 * 1000;
