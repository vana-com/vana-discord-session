import { BareProfileCard } from "@/components/BareProfileCard";
import { ChatFeed } from "@/components/ChatFeed";
import { Sidebar } from "@/components/Sidebar";
import { VanaProfileCard } from "@/components/VanaProfileCard";
import { CHAT_FIXTURE } from "@/data/chat.fixture";

type SearchParams = Record<string, string | string[] | undefined>;

// Both demo states live on this branch: the default is the pre-Vana starting
// point; ?vana=1 shows the finished integration. The unobtrusive link in the
// bottom-right corner jumps between them, preserving the launch runtime
// params (network / vana_env) the Vana request path forwards.
export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const vana = params.vana === "1";

  const toggle = new URLSearchParams();
  for (const key of ["vana_env", "network"]) {
    const value = params[key];
    for (const v of Array.isArray(value) ? value : value ? [value] : []) toggle.append(key, v);
  }
  if (!vana) toggle.set("vana", "1");
  const toggleHref = toggle.size > 0 ? `/?${toggle.toString()}` : "/";

  return (
    <main className="app-shell">
      <Sidebar />
      <ChatFeed messages={CHAT_FIXTURE} />
      {vana ? <VanaProfileCard /> : <BareProfileCard />}
      <a className="demo-state-toggle" href={toggleHref}>
        {vana ? "start" : "final"}
      </a>
    </main>
  );
}
