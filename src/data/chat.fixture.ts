export type ChatMessage = {
  id: string;
  author: string;
  avatarColor: string;
  bot?: boolean;
  timestamp: string;
  body: string;
};

export const CHANNELS = ["general", "ai-chat", "introductions"] as const;

export const CHAT_FIXTURE: ChatMessage[] = [
  {
    id: "m1",
    author: "kasia",
    avatarColor: "#e0665c",
    timestamp: "Today at 10:02",
    body: "morning everyone 👋 shipping day?",
  },
  {
    id: "m2",
    author: "tomek",
    avatarColor: "#3e9f6e",
    timestamp: "Today at 10:04",
    body: "always. also the #introductions channel is looking empty, nobody writes a bio anymore",
  },
  {
    id: "m3",
    author: "DevCord Bot",
    avatarColor: "#5865f2",
    bot: true,
    timestamp: "Today at 10:05",
    body: "I could write intros for people… if I knew literally anything about them. I have zero context on my users. 🤖",
  },
  {
    id: "m4",
    author: "kasia",
    avatarColor: "#e0665c",
    timestamp: "Today at 10:06",
    body: "what if people could just connect their real data and let the bot draft it?",
  },
];
