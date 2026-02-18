interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  meta?: string;
}

export default function ChatMessage({ role, content, meta }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-[75%] ${isUser ? "ml-12" : "mr-12"}`}>
        <div
          className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser ? "chat-bubble-user" : "chat-bubble-assistant"
          }`}
        >
          {content}
        </div>
        {meta && (
          <p
            className={`text-[10px] mt-1 font-mono text-[var(--text-tertiary)] ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {meta}
          </p>
        )}
      </div>
    </div>
  );
}
