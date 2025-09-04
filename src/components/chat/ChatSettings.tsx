import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Eye, EyeOff } from "lucide-react";
import { DocumentUpload } from "./DocumentUpload";
import { useToast } from "@/hooks/use-toast";

interface ChatSettingsProps {
  onApiKeyChange: (apiKey: string) => void;
  currentApiKey?: string;
}

export const ChatSettings = ({ onApiKeyChange, currentApiKey }: ChatSettingsProps) => {
  const [apiKey, setApiKey] = useState(currentApiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setApiKey(currentApiKey || "");
  }, [currentApiKey]);

  const handleSave = () => {
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

    localStorage.setItem("openai-api-key", apiKey);
    onApiKeyChange(apiKey);
    setIsOpen(false);
    toast({
      title: "Success",
      description: "API key saved successfully",
    });
  };

  const handleClear = () => {
    setApiKey("");
    localStorage.removeItem("openai-api-key");
    onApiKeyChange("");
    toast({
      title: "API Key Cleared",
      description: "Your API key has been removed",
    });
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
            Configure your OpenAI API key and manage your knowledge base.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="api-key" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api-key">API Configuration</TabsTrigger>
            <TabsTrigger value="documents">Knowledge Base</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-key" className="space-y-4">
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
                Your API key is stored locally in your browser and never sent to our servers.
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
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4 max-h-[400px] overflow-y-auto">
            <DocumentUpload />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};