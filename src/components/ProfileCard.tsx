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

export function ProfileCard({
  sample,
  musicSample,
}: {
  sample: LinkedInSnapshot;
  musicSample: MusicSnapshot;
}) {
  const linkedin = useVanaSource<LinkedInSnapshot>("linkedin");
  const spotify = useVanaSource<MusicSnapshot>("spotify");

  const profileLive = linkedin.state.type === "done";
  const profile = linkedin.state.type === "done" ? linkedin.state.result.data : sample;
  const bio = generateBio(profile);

  const music = spotify.state.type === "done" ? spotify.state.result.data : musicSample;

  return (
    <aside className="profile-panel" aria-live="polite">
      <h2>Your profile</h2>
      <div className="profile-card">
        <div className="profile-head">
          <div className="avatar" style={{ background: profileLive ? "#5865f2" : "#6d6f78" }}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="profile-name">{profile.name}</div>
            <div className="profile-headline">{profile.headline || "No headline"}</div>
          </div>
        </div>

        <div className="bio">{bio}</div>

        {profile.skills.length > 0 ? (
          <div className="skills">
            {profile.skills.map((skill) => (
              <span key={skill} className="skill-chip">
                {skill}
              </span>
            ))}
          </div>
        ) : null}

        <ConnectControls source="linkedin" connect={linkedin} />

        <div className="music-section">
          <h3 className="section-title">Music preferences</h3>
          <div className="bio">{describeMusicPreferences(music)}</div>
          {music.topArtists.length > 0 ? (
            <div className="skills">
              {music.topArtists.map((artist) => (
                <span key={artist} className="skill-chip">
                  {artist}
                </span>
              ))}
            </div>
          ) : null}
        </div>

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
  const isLive = state.type === "done";
  const popupBlocked = state.type === "awaiting_approval" && state.popupBlocked;
  const copy = SOURCE_COPY[source];

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

      {isLive ? (
        <button className="secondary-action button-link" type="button" onClick={connect.reset}>
          Reset to sample
        </button>
      ) : null}

      <span className={`mode-label ${isLive ? "live" : "sample"}`}>
        {isLive ? "From your approved data" : "Sample data"}
      </span>
    </>
  );
}

type SourceCopy = {
  connectLabel: string;
  idle: string;
  reading: string;
  done: string;
};

const SOURCE_COPY: Record<VanaSource, SourceCopy> = {
  linkedin: {
    connectLabel: "Connect LinkedIn to personalize",
    idle: "This bio is written from sample data. Connect your real LinkedIn profile through Vana to personalize it — you approve exactly what the bot can read.",
    reading: "Reading your approved profile from your Personal Server…",
    done: "This bio was written from data you approved. Nothing else was shared.",
  },
  spotify: {
    connectLabel: "Connect Spotify to personalize",
    idle: "These music preferences are sample data. Connect your Spotify liked songs through Vana to personalize them — you approve exactly what the bot can read.",
    reading: "Reading your approved liked songs from your Personal Server…",
    done: "These music preferences come from data you approved. Nothing else was shared.",
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
    case "done":
      return copy.done;
    case "error":
      return "Something went wrong before we could read your data. No data was shared.";
    default:
      return "";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
