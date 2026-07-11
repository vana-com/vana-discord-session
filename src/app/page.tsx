import { ChatFeed } from "@/components/ChatFeed";
import { ProfileCard } from "@/components/ProfileCard";
import { Sidebar } from "@/components/Sidebar";
import { CHAT_FIXTURE } from "@/data/chat.fixture";
import { LINKEDIN_PROFILE_FIXTURE } from "@/data/linkedin-profile.fixture";
import { SPOTIFY_MUSIC_FIXTURE } from "@/data/spotify-music.fixture";
import { mapLinkedInProfile } from "@/lib/linkedin-profile";
import { mapSpotifyMusic } from "@/lib/spotify-music";

export default function Home() {
  return (
    <main className="app-shell">
      <Sidebar />
      <ChatFeed messages={CHAT_FIXTURE} />
      <ProfileCard
        sample={mapLinkedInProfile(LINKEDIN_PROFILE_FIXTURE)}
        musicSample={mapSpotifyMusic(SPOTIFY_MUSIC_FIXTURE)}
      />
    </main>
  );
}
