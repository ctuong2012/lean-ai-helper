import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalLLMService } from "@/services/localLLM";
import { useToast } from "@/hooks/use-toast";

interface LocalLLMTestProps {
  baseUrl: string;
  model: string;
}

export const LocalLLMTest = ({ baseUrl, model }: LocalLLMTestProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const service = new LocalLLMService(baseUrl, model);
      const response = await service.sendMessage([
        { role: 'user', content: 'Hello, can you hear me?' }
      ]);
      
      toast({
        title: "Connection Successful",
        description: `Local LLM responded: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to local LLM",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={testConnection} 
      disabled={isLoading}
      variant="outline" 
      size="sm"
      className="w-full"
    >
      {isLoading ? "Testing..." : "Test Connection"}
    </Button>
  );
};