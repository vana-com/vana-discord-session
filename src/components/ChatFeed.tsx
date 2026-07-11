import type { ChatMessage } from "@/data/chat.fixture";

export function ChatFeed({ messages }: { messages: ChatMessage[] }) {
  return (
    <section className="chat">
      <header className="chat-header">
        # ai-chat
        <span className="topic">Ask the bot anything. It only knows what you let it know.</span>
      </header>
      <div className="chat-feed">
        {messages.map((message) => (
          <article key={message.id} className={`message${message.bot ? " bot" : ""}`}>
            <div className="avatar" style={{ background: message.avatarColor }}>
              {message.author.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="author">
                {message.author}
                {message.bot ? <span className="bot-tag">BOT</span> : null}
                <span className="timestamp">{message.timestamp}</span>
              </div>
              <div className="body">{message.body}</div>
            </div>
          </article>
        ))}
      </div>
      <div className="chat-input">Message #ai-chat</div>
    </section>
  );
}
