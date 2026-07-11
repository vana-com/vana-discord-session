"use client";

import {
  useDirectVanaConnect,
  type AccessRequest,
  type AccessRequestStatus,
  type ApprovedDataResult,
} from "@opendatalabs/vana-sdk/react";
import { generateBio } from "@/lib/bio";
import type { LinkedInSnapshot } from "@/lib/linkedin-profile";

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
function requestPath(): string {
  const input = new URLSearchParams(window.location.search);
  const launch = new URLSearchParams();
  for (const key of ["vana_env", "network"]) {
    for (const value of input.getAll(key)) launch.append(key, value);
  }
  const query = launch.toString();
  return query ? `/api/vana/request?${query}` : "/api/vana/request";
}

export function ProfileCard({ sample }: { sample: LinkedInSnapshot }) {
  const connect = useDirectVanaConnect<LinkedInSnapshot>({
    createRequest: () => jsonFetch<AccessRequest>(requestPath(), { method: "POST" }),
    getStatus: (requestId) =>
      jsonFetch<AccessRequestStatus>(`/api/vana/status?requestId=${encodeURIComponent(requestId)}`),
    readResult: (requestId) =>
      jsonFetch<ApprovedDataResult<LinkedInSnapshot>>(
        `/api/vana/read?requestId=${encodeURIComponent(requestId)}`,
      ),
  });

  const { state } = connect;
  const isLive = state.type === "done";
  const profile = isLive ? state.result.data : sample;
  const bio = generateBio(profile);
  const popupBlocked = state.type === "awaiting_approval" && state.popupBlocked;

  return (
    <aside className="profile-panel" aria-live="polite">
      <h2>Your profile</h2>
      <div className="profile-card">
        <div className="profile-head">
          <div className="avatar" style={{ background: isLive ? "#5865f2" : "#6d6f78" }}>
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

        <p className="status-note">{statusCopy(state.type, popupBlocked)}</p>

        {popupBlocked ? (
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
            Connect LinkedIn to personalize
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
      </div>
    </aside>
  );
}

function statusCopy(type: string, popupBlocked: boolean): string {
  if (popupBlocked) return "We opened a Vana approval tab but the browser blocked it. Open it to continue.";
  switch (type) {
    case "idle":
      return "This bio is written from sample data. Connect your real LinkedIn profile through Vana to personalize it — you approve exactly what the bot can read.";
    case "creating":
      return "Creating a data request…";
    case "awaiting_approval":
      return "Approve the request in the Vana tab. Keep it open while your data is delivered.";
    case "reading":
      return "Reading your approved profile from your Personal Server…";
    case "done":
      return "This bio was written from data you approved. Nothing else was shared.";
    case "error":
      return "Something went wrong before we could read your data. No data was shared.";
    default:
      return "";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
