import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
}

export const ChatMessage = ({ message, isUser, timestamp }: ChatMessageProps) => {
  return (
    <div className={cn(
      "flex w-full",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-message transition-all duration-200",
        isUser 
          ? "bg-user-bubble text-user-bubble-foreground rounded-br-md" 
          : "bg-assistant-bubble text-assistant-bubble-foreground rounded-bl-md"
      )}>
        <p className="text-sm leading-relaxed">{message}</p>
        {timestamp && (
          <span className="text-xs opacity-70 mt-1 block">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};