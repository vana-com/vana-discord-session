import { ChatFeed } from "@/components/ChatFeed";
import { ProfileCard } from "@/components/ProfileCard";
import { Sidebar } from "@/components/Sidebar";
import { CHAT_FIXTURE } from "@/data/chat.fixture";

export default function Home() {
  return (
    <main className="app-shell">
      <Sidebar />
      <ChatFeed messages={CHAT_FIXTURE} />
      <ProfileCard />
    </main>
  );
}
