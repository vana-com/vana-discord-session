"use client";

import {
  useDirectVanaConnect,
  type AccessRequest,
  type AccessRequestStatus,
  type ApprovedDataResult,
} from "@opendatalabs/vana-sdk/react";
import { generateBio } from "@/lib/bio";
import type { LinkedInSnapshot } from "@/lib/linkedin-profile";
import { describeMusicPreferences, type MusicSnapshot } from "@/lib/spotify-music";
import type { VanaSource } from "@/lib/vana/constants";

type ErrorBody = { error?: unknown };

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const candidate = isRecord(body) ? (body as ErrorBody).error : undefined;
    const message = typeof candidate === "string" ? candidate : "The Vana request failed.";
    throw new Error(message);
  }
  return body as T;
}

// Forward the launch runtime params (network / vana_env) so the backend talks to
// the same chain the user approved on. Default (no params) is mainnet.
function requestPath(source: VanaSource): string {
  const input = new URLSearchParams(window.location.search);
  const launch = new URLSearchParams({ source });
  for (const key of ["vana_env", "network"]) {
    for (const value of input.getAll(key)) launch.append(key, value);
  }
  return `/api/vana/request?${launch.toString()}`;
}

function useVanaSource<T>(source: VanaSource) {
  return useDirectVanaConnect<T>({
    createRequest: () => jsonFetch<AccessRequest>(requestPath(source), { method: "POST" }),
    getStatus: (requestId) =>
      jsonFetch<AccessRequestStatus>(`/api/vana/status?requestId=${encodeURIComponent(requestId)}`),
    readResult: (requestId) =>
      jsonFetch<ApprovedDataResult<T>>(
        `/api/vana/read?requestId=${encodeURIComponent(requestId)}`,
      ),
  });
}

export function VanaProfileCard() {
  const linkedin = useVanaSource<LinkedInSnapshot>("linkedin");
  const spotify = useVanaSource<MusicSnapshot>("spotify");

  const profile = linkedin.state.type === "done" ? linkedin.state.result.data : null;
  const music = spotify.state.type === "done" ? spotify.state.result.data : null;

  return (
    <aside className="profile-panel" aria-live="polite">
      <h2>Your profile</h2>
      <div className="profile-card">
        <div className="profile-head">
          <div className="avatar" style={{ background: profile ? "#5865f2" : "#6d6f78" }}>
            {profile ? profile.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <div className="profile-name-row">
              <div className="profile-name">{profile ? profile.name : "Not connected yet"}</div>
              {profile ? (
                <span className="verified-badge">
                  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                    <circle cx="12" cy="12" r="11" fill="currentColor" />
                    <path
                      d="M7 12.5l3 3 6.5-7"
                      stroke="var(--bg-darkest)"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Verified
                </span>
              ) : null}
            </div>
            <div className="profile-headline">
              {profile ? profile.headline || "No headline" : "Your intro will appear here"}
            </div>
          </div>
        </div>

        <div className="bio">
          {profile ? (
            <p>{generateBio(profile)}</p>
          ) : (
            <p className="placeholder">
              Nothing here yet. Connect your LinkedIn below and the bot will draft your intro
              from data you approve.
            </p>
          )}
          {music ? (
            <p className="interests">{describeMusicPreferences(music)}</p>
          ) : (
            <p className="placeholder">Connect Spotify to show what you&apos;re into.</p>
          )}
        </div>

        {(profile?.skills.length ?? 0) > 0 || (music?.topArtists.length ?? 0) > 0 ? (
          <div className="skills">
            {(profile?.skills ?? []).map((skill) => (
              <span key={skill} className="skill-chip">
                {skill}
              </span>
            ))}
            {(music?.topArtists ?? []).map((artist) => (
              <span key={artist} className="skill-chip artist-chip">
                ♪ {artist}
              </span>
            ))}
          </div>
        ) : null}

        <ConnectControls source="linkedin" connect={linkedin} />
        <ConnectControls source="spotify" connect={spotify} />
      </div>
    </aside>
  );
}

function ConnectControls<T>({
  source,
  connect,
}: {
  source: VanaSource;
  connect: ReturnType<typeof useVanaSource<T>>;
}) {
  const { state } = connect;
  const popupBlocked = state.type === "awaiting_approval" && state.popupBlocked;
  const copy = SOURCE_COPY[source];

  // Once the data is live the card speaks for itself — the Verified badge by
  // the name covers it; no per-source disclaimer, label, or disconnect.
  if (state.type === "done") return null;

  return (
    <>
      <p className="status-note">{statusCopy(copy, state.type, popupBlocked)}</p>

      {popupBlocked && state.type === "awaiting_approval" ? (
        <a
          className="secondary-action"
          href={state.request.approvalUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open approval
        </a>
      ) : null}

      {state.type === "idle" ? (
        <button className="primary-action" type="button" onClick={() => void connect.start()}>
          {copy.connectLabel}
        </button>
      ) : null}

      {state.type === "creating" ||
      state.type === "awaiting_approval" ||
      state.type === "reading" ? (
        <button className="primary-action" type="button" disabled>
          {state.type === "reading" ? "Reading your data…" : "Waiting for approval…"}
        </button>
      ) : null}

      {state.type === "error" ? (
        <button
          className="primary-action"
          type="button"
          onClick={() => {
            connect.reset();
            void connect.start();
          }}
        >
          Try again
        </button>
      ) : null}

      <span className="mode-label sample">Not connected</span>
    </>
  );
}

type SourceCopy = {
  connectLabel: string;
  idle: string;
  reading: string;
};

const SOURCE_COPY: Record<VanaSource, SourceCopy> = {
  linkedin: {
    connectLabel: "Connect LinkedIn to personalize",
    idle: "Connect your real LinkedIn profile through Vana and the bot writes your intro — you approve exactly what it can read.",
    reading: "Reading your approved profile from your Personal Server…",
  },
  spotify: {
    connectLabel: "Connect Spotify to personalize",
    idle: "Connect your Spotify liked songs through Vana to fill this in — you approve exactly what the bot can read.",
    reading: "Reading your approved liked songs from your Personal Server…",
  },
};

function statusCopy(copy: SourceCopy, type: string, popupBlocked: boolean): string {
  if (popupBlocked) return "We opened a Vana approval tab but the browser blocked it. Open it to continue.";
  switch (type) {
    case "idle":
      return copy.idle;
    case "creating":
      return "Creating a data request…";
    case "awaiting_approval":
      return "Approve the request in the Vana tab. Keep it open while your data is delivered.";
    case "reading":
      return copy.reading;
    case "error":
      return "Something went wrong before we could read your data. No data was shared.";
    default:
      return "";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
