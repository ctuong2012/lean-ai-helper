import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatSettings } from "./ChatSettings";
import { OpenAIService } from "@/services/openai";
import { BaseAIService, AIProvider } from "@/services/baseAI";
import { LocalLLMService } from "@/services/localLLM";
import { FreeLLMCloudService } from "@/services/freeLLMCloud";
import { DocumentProcessor } from "@/services/documentProcessor";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatContainerProps {
  isWidget?: boolean;
}

export const ChatContainer = ({ isWidget = false }: ChatContainerProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [aiProvider, setAiProvider] = useState<AIProvider>(AIProvider.FREE_LLM_CLOUD);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load API key from localStorage on mount
    const storedApiKey = OpenAIService.getStoredApiKey();
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    
    // Load stored AI provider
    const storedProvider = localStorage.getItem('ai-provider') as AIProvider;
    if (storedProvider && Object.values(AIProvider).includes(storedProvider)) {
      setAiProvider(storedProvider);
    }
  }, []);

  
  const handleProviderChange = (provider: AIProvider) => {
    setAiProvider(provider);
    localStorage.setItem('ai-provider', provider);
    
    // Clear any provider-specific error states or reload API keys
    if (provider === AIProvider.OPENAI) {
      const storedApiKey = OpenAIService.getStoredApiKey();
      setApiKey(storedApiKey || '');
    } else if (provider === AIProvider.FREE_LLM_CLOUD) {
      // Clear any error states for free provider
      setApiKey('');
    } else if (provider === AIProvider.LOCAL_LLM) {
      // Clear any error states for local LLM
      setApiKey('');
    }
  };

  const getAIResponse = async (userMessage: string): Promise<string> => {
    console.log('🔧 Current AI Provider:', aiProvider);
    console.log('🔧 Has valid config:', hasValidConfig());
    // Get relevant context from uploaded documents
    const relevantChunks = DocumentProcessor.findRelevantChunks(userMessage, 3);
    
    // Debug: Log document usage
    const storedDocs = DocumentProcessor.getStoredDocuments();
    console.log('📚 Stored documents:', storedDocs.length);
    console.log('🔍 Relevant chunks found:', relevantChunks.length);
    console.log('📝 Chunks content:', relevantChunks);
    
    // If no API key/config but we have relevant documents, provide RAG-only response
    if (!hasValidConfig()) {
      if (relevantChunks.length > 0) {
        const context = relevantChunks.join('\n\n');
        return context;
      } else {
        return "We don't have the information you're looking for in our knowledge base. Please upload relevant documents or configure an AI provider for broader assistance.";
      }
    }

    // If configuration is available, use selected AI provider with optional RAG context
    try {
      console.log('🔧 Creating AI service for provider:', aiProvider);
      const aiService = createAIService();
      console.log('🔧 AI Service created:', aiService.constructor.name);
      
      const ragContext = relevantChunks.length > 0 
        ? relevantChunks.join('\n\n---\n\n')
        : undefined;
      
      const conversationHistory = messages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));
      
      const systemMessage = relevantChunks.length > 0
        ? 'You are a helpful AI assistant with access to uploaded documents. Use the provided context from the documents to give accurate, relevant answers when applicable. If the question cannot be answered from the context, provide a general helpful response.'
        : 'You are a helpful AI assistant. Provide clear, concise, and helpful responses.';
      
      const allMessages = [
        { role: 'system' as const, content: systemMessage },
        ...conversationHistory,
        { role: 'user' as const, content: userMessage }
      ];

      return await aiService.sendMessage(allMessages, ragContext);
    } catch (error) {
      console.error('AI API error:', error);
      
      // Handle specific local LLM connection errors
      if (aiProvider === AIProvider.LOCAL_LLM && error instanceof Error) {
        if (error.message.includes('Cannot connect to Ollama server')) {
          // If local LLM fails, fall back to RAG-only if available
          if (relevantChunks.length > 0) {
            const context = relevantChunks.join('\n\n');
            return `I couldn't connect to the local LLM server (Ollama). Here's what I found in the knowledge base:\n\n${context}`;
          } else {
            return "I couldn't connect to the local LLM server. Make sure Ollama is running on localhost:11434 and try again. You can also upload documents to use the knowledge base without a local LLM.";
          }
        }
      }
      
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });
      
      // Fall back to RAG-only if available
      if (relevantChunks.length > 0) {
        const context = relevantChunks.join('\n\n');
        return `I encountered an error with the AI service. Here's what I found in the knowledge base:\n\n${context}`;
      }
      
      return "Sorry, I encountered an error while processing your request. Please check your configuration and try again.";
    }
  };

  const handleSendMessage = async (messageText: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Get AI response
    try {
      const responseText = await getAIResponse(messageText);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasValidConfig = (): boolean => {
    if (aiProvider === AIProvider.OPENAI) {
      return !!apiKey;
    } else if (aiProvider === AIProvider.LOCAL_LLM) {
      return true; // Local LLM doesn't require API key
    } else if (aiProvider === AIProvider.FREE_LLM_CLOUD) {
      return true; // Free LLM Cloud works without API key
    }
    return false;
  };

  const createAIService = (): BaseAIService => {
    switch (aiProvider) {
      case AIProvider.OPENAI:
        return new OpenAIService(apiKey);
      case AIProvider.LOCAL_LLM:
        const config = LocalLLMService.getStoredConfig();
        return new LocalLLMService(config.baseUrl, config.model);
      case AIProvider.FREE_LLM_CLOUD:
        const freeConfig = FreeLLMCloudService.getStoredConfig();
        const freeApiKey = FreeLLMCloudService.getStoredApiKey();
        return new FreeLLMCloudService(freeApiKey || '', freeConfig.model);
      default:
        return new OpenAIService(apiKey);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isWidget ? '' : 'max-h-[600px]'} ${isWidget ? '' : 'shadow-soft rounded-lg border border-border bg-background'}`}>
      {/* Header - only show if not a widget */}
      {!isWidget && (
        <div className="p-4 border-b border-border bg-gradient-subtle rounded-t-lg">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <h2 className="font-semibold text-foreground">AI Assistant</h2>
            </div>
            <ChatSettings 
              onApiKeyChange={setApiKey} 
              currentApiKey={apiKey}
              aiProvider={aiProvider}
              onProviderChange={handleProviderChange}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-chat-background">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.text}
            isUser={message.isUser}
            timestamp={message.timestamp}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-assistant-bubble text-assistant-bubble-foreground px-4 py-3 rounded-2xl rounded-bl-md shadow-message">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};