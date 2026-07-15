"use client";

import {
  useDirectVanaConnect,
  type AccessRequest,
  type AccessRequestStatus,
  type ApprovedDataResult,
} from "@opendatalabs/vana-sdk/react";
import { generateBio } from "@/lib/bio";
import type { CombinedSnapshot } from "@/lib/combined-snapshot";
import { describeMusicPreferences } from "@/lib/spotify-music";

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
// the same chain the user approved on. Default (no params) is the Moksha testnet.
function requestPath(): string {
  const input = new URLSearchParams(window.location.search);
  const launch = new URLSearchParams();
  for (const key of ["vana_env", "network"]) {
    for (const value of input.getAll(key)) launch.append(key, value);
  }
  const query = launch.toString();
  return query ? `/api/vana/request?${query}` : "/api/vana/request";
}

export function VanaProfileCard() {
  // ONE connect flow requests LinkedIn + Spotify together, so a single grant
  // covers both scopes and the read returns both in one combined payload.
  const connect = useDirectVanaConnect<CombinedSnapshot>({
    createRequest: () => jsonFetch<AccessRequest>(requestPath(), { method: "POST" }),
    getStatus: (requestId) =>
      jsonFetch<AccessRequestStatus>(`/api/vana/status?requestId=${encodeURIComponent(requestId)}`),
    readResult: (requestId) =>
      jsonFetch<ApprovedDataResult<CombinedSnapshot>>(
        `/api/vana/read?requestId=${encodeURIComponent(requestId)}`,
      ),
  });

  const data = connect.state.type === "done" ? connect.state.result.data : null;
  const profile = data?.linkedin ?? null;
  const music = data?.spotify ?? null;

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
              Nothing here yet. Connect below and the bot will draft your intro from the LinkedIn
              and Spotify data you approve — in one step.
            </p>
          )}
          {music ? (
            <p className="interests">{describeMusicPreferences(music)}</p>
          ) : null}
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

        <ConnectControls connect={connect} />
      </div>
    </aside>
  );
}

function ConnectControls({
  connect,
}: {
  connect: ReturnType<typeof useDirectVanaConnect<CombinedSnapshot>>;
}) {
  const { state } = connect;
  const popupBlocked = state.type === "awaiting_approval" && state.popupBlocked;

  // Once the data is live the card speaks for itself — the Verified badge by
  // the name covers it; no disclaimer or disconnect.
  if (state.type === "done") return null;

  return (
    <>
      <p className="status-note">{statusCopy(state.type, popupBlocked)}</p>

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
          Connect LinkedIn + Spotify to personalize
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

function statusCopy(type: string, popupBlocked: boolean): string {
  if (popupBlocked) return "We opened a Vana approval tab but the browser blocked it. Open it to continue.";
  switch (type) {
    case "idle":
      return "Connect LinkedIn and Spotify through Vana in one approval — the bot writes your intro from exactly what you approve.";
    case "creating":
      return "Creating a data request…";
    case "awaiting_approval":
      return "Approve the request in the Vana tab. Keep it open while your data is delivered.";
    case "reading":
      return "Reading your approved profile and liked songs from your Personal Server…";
    case "error":
      return "Something went wrong before we could read your data. No data was shared.";
    default:
      return "";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
