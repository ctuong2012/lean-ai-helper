import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatContainer } from "./ChatContainer";
import { Button } from "@/components/ui/button";

export const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-96 h-[500px] bg-background border border-border rounded-lg shadow-lg animate-scale-in">
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-subtle rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <h2 className="font-semibold text-foreground">AI Assistant</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 hover:bg-background/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-[calc(100%-64px)]">
            <ChatContainer isWidget={true} />
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-gradient-primary hover:opacity-90 shadow-lg transition-all duration-200 hover:scale-105"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
};