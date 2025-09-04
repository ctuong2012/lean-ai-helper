import { useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DocumentProcessor } from "@/services/documentProcessor";

interface Document {
  id: string;
  filename: string;
  uploadedAt: Date;
}

interface DocumentUploadProps {
  onDocumentsChange?: (documents: Document[]) => void;
}

export const DocumentUpload = ({ onDocumentsChange }: DocumentUploadProps) => {
  const [documents, setDocuments] = useState<Document[]>(() => 
    DocumentProcessor.getStoredDocuments().map(doc => ({
      id: doc.id,
      filename: doc.filename,
      uploadedAt: doc.uploadedAt
    }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('text/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a text file (.txt, .md, etc.)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const processedDoc = await DocumentProcessor.processDocument(file);
      const newDocuments = [...documents, {
        id: processedDoc.id,
        filename: processedDoc.filename,
        uploadedAt: processedDoc.uploadedAt
      }];
      
      setDocuments(newDocuments);
      onDocumentsChange?.(newDocuments);
      
      toast({
        title: "Document uploaded",
        description: `${file.name} has been processed and is ready for RAG queries.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleRemoveDocument = (id: string) => {
    DocumentProcessor.removeDocument(id);
    const updated = documents.filter(doc => doc.id !== id);
    setDocuments(updated);
    onDocumentsChange?.(updated);
    
    toast({
      title: "Document removed",
      description: "Document has been removed from RAG knowledge base.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Knowledge Base</span>
      </div>

      {/* Upload Area */}
      <Card className="p-4 border-dashed border-2 border-border hover:border-primary/50 transition-colors">
        <label className="cursor-pointer flex flex-col items-center gap-2 text-center">
          <input
            type="file"
            accept=".txt,.md,.csv,.json"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="text-sm text-muted-foreground">
            {isUploading ? "Processing document..." : "Click to upload a document"}
          </div>
          <div className="text-xs text-muted-foreground">
            Supports .txt, .md, .csv, .json files
          </div>
        </label>
      </Card>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Uploaded Documents ({documents.length})
          </div>
          {documents.map((doc) => (
            <Card key={doc.id} className="p-3 flex items-center justify-between bg-muted/50">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">
                    {doc.filename}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveDocument(doc.id)}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};