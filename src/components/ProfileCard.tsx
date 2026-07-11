"use client";

import { useState } from "react";

export function ProfileCard() {
  const [attempted, setAttempted] = useState(false);

  return (
    <aside className="profile-panel">
      <h2>Your profile</h2>
      <div className="profile-card">
        <div className="profile-head">
          <div className="avatar" style={{ background: "#6d6f78" }}>
            ?
          </div>
          <div>
            <div className="profile-name">you</div>
            <div className="profile-headline">No headline</div>
          </div>
        </div>
        <div className="bio empty">
          {attempted
            ? "DevCord knows nothing about you. It has no data to write a bio from — this is the problem we fix in the walkthrough."
            : "No bio yet."}
        </div>
        <button className="primary-action" type="button" onClick={() => setAttempted(true)}>
          Generate my intro bio
        </button>
      </div>
    </aside>
  );
}
