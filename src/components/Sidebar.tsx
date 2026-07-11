import { CHANNELS } from "@/data/chat.fixture";

export function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="server-name">DevCord — EU/US Builders</div>
      <div className="section-label">Text channels</div>
      {CHANNELS.map((channel) => (
        <div key={channel} className={`channel${channel === "ai-chat" ? " active" : ""}`}>
          # {channel}
        </div>
      ))}
    </nav>
  );
}
