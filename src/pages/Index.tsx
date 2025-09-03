import { FloatingChatWidget } from "@/components/chat/FloatingChatWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Assistant</h1>
          <p className="text-muted-foreground">Click the chat icon in the bottom right to get started</p>
        </div>
      </div>
      <FloatingChatWidget />
    </div>
  );
};

export default Index;
