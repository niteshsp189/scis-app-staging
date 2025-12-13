
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CustomerDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  category: "policy" | "identity" | "financial" | "medical" | "other";
  uploadedBy: string;
  url?: string;
}

interface UploadDocumentDialogProps {
  onUploadDocument: (document: CustomerDocument) => void;
}

export const UploadDocumentDialog = ({ onUploadDocument }: UploadDocumentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [description, setDescription] = useState("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, image, or document file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      // Set default document name from file name if not already set
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !documentName.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a file and enter a document name",
        variant: "destructive",
      });
      return;
    }

    // In a real app, you would upload to a file storage service
    const newDocument: CustomerDocument = {
      id: Date.now().toString(),
      name: documentName.trim(),
      type: selectedFile.type,
      size: selectedFile.size,
      uploadDate: new Date().toISOString(),
      category: "other", // Default category since it's no longer user-selectable
      uploadedBy: "Current User", // In real app, get from auth context
      url: URL.createObjectURL(selectedFile) // Temporary URL for demo
    };

    onUploadDocument(newDocument);
    
    toast({
      title: "Document uploaded",
      description: `${documentName} has been uploaded successfully`,
    });

    // Reset form
    setSelectedFile(null);
    setDocumentName("");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                className="flex-1"
              />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, Images, Word, Excel (max 10MB)
            </p>
          </div>

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="documentName">Document Name *</Label>
            <Input
              id="documentName"
              placeholder="Enter document name..."
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this document..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Upload Button */}
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || !documentName.trim()}
            className="w-full"
          >
            Upload Document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
