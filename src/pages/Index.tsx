import { ChatContainer } from "@/components/chat/ChatContainer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Assistant</h1>
          <p className="text-muted-foreground">Minimal interface for intelligent conversations</p>
        </div>
        <ChatContainer />
      </div>
    </div>
  );
};

export default Index;
