import { ChatFeed } from "@/components/ChatFeed";
import { ProfileCard } from "@/components/ProfileCard";
import { Sidebar } from "@/components/Sidebar";
import { CHAT_FIXTURE } from "@/data/chat.fixture";
import { LINKEDIN_PROFILE_FIXTURE } from "@/data/linkedin-profile.fixture";
import { mapLinkedInProfile } from "@/lib/linkedin-profile";

export default function Home() {
  return (
    <main className="app-shell">
      <Sidebar />
      <ChatFeed messages={CHAT_FIXTURE} />
      <ProfileCard sample={mapLinkedInProfile(LINKEDIN_PROFILE_FIXTURE)} />
    </main>
  );
}
