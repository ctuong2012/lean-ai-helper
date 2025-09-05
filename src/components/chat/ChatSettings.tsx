import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Eye, EyeOff } from "lucide-react";
import { DocumentUpload } from "./DocumentUpload";
import { OpenAIService } from "@/services/openai";
import { LocalLLMService } from "@/services/localLLM";
import { AIProvider } from "@/services/baseAI";
import { useToast } from "@/hooks/use-toast";

interface ChatSettingsProps {
  onApiKeyChange: (apiKey: string) => void;
  currentApiKey?: string;
  aiProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
}

export const ChatSettings = ({ onApiKeyChange, currentApiKey, aiProvider, onProviderChange }: ChatSettingsProps) => {
  const [apiKey, setApiKey] = useState(currentApiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(() => LocalLLMService.getStoredConfig());
  const { toast } = useToast();

  useEffect(() => {
    setApiKey(currentApiKey || "");
  }, [currentApiKey]);

  const handleSave = () => {
    if (aiProvider === AIProvider.OPENAI) {
      if (!apiKey.trim()) {
        toast({
          title: "Error",
          description: "Please enter your OpenAI API key",
          variant: "destructive",
        });
        return;
      }

      if (!apiKey.startsWith("sk-")) {
        toast({
          title: "Invalid API Key",
          description: "OpenAI API keys should start with 'sk-'",
          variant: "destructive",
        });
        return;
      }

      OpenAIService.setApiKey(apiKey);
      onApiKeyChange(apiKey);
      setIsOpen(false);
      toast({
        title: "Success",
        description: "OpenAI API key saved successfully",
      });
    } else if (aiProvider === AIProvider.LOCAL_LLM) {
      LocalLLMService.setConfig(localConfig.baseUrl, localConfig.model);
      setIsOpen(false);
      toast({
        title: "Success",
        description: "Local LLM configuration saved successfully",
      });
    }
  };

  const handleClear = () => {
    if (aiProvider === AIProvider.OPENAI) {
      setApiKey("");
      OpenAIService.clearApiKey();
      onApiKeyChange("");
      toast({
        title: "API Key Cleared",
        description: "Your OpenAI API key has been removed",
      });
    } else if (aiProvider === AIProvider.LOCAL_LLM) {
      LocalLLMService.clearApiKey();
      setLocalConfig({ baseUrl: 'http://localhost:11434', model: 'llama2' });
      toast({
        title: "Configuration Cleared",
        description: "Your local LLM configuration has been reset",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-background/50"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>AI Assistant Settings</DialogTitle>
          <DialogDescription>
            Configure your AI provider and manage your knowledge base.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="provider" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="provider">AI Provider</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="documents">Knowledge Base</TabsTrigger>
          </TabsList>
          
          <TabsContent value="provider" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select value={aiProvider} onValueChange={(value) => onProviderChange(value as AIProvider)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AIProvider.OPENAI}>OpenAI</SelectItem>
                  <SelectItem value={AIProvider.LOCAL_LLM}>Local LLM (Ollama)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose between cloud-based OpenAI or local Ollama models.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="config" className="space-y-4">
            {aiProvider === AIProvider.OPENAI ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">OpenAI API Key</Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your API key is stored locally and never sent to our servers.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="base-url">Ollama Base URL</Label>
                  <Input
                    id="base-url"
                    placeholder="http://localhost:11434"
                    value={localConfig.baseUrl}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model Name</Label>
                  <Input
                    id="model"
                    placeholder="llama2"
                    value={localConfig.model}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, model: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Make sure Ollama is running and the model is downloaded.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    Save Configuration
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4 max-h-[400px] overflow-y-auto">
            <DocumentUpload />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};