import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, Search, Upload, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import customerDocumentsService, {
  CustomerDocument,
  UploadDocumentRequest,
  DocumentListFilters,
} from "@/services/customerDocumentsService";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";

interface CustomerDocumentsTabProps {
  customerId: number;
}

export const CustomerDocumentsTab = ({
  customerId,
}: CustomerDocumentsTabProps) => {
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<CustomerDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDocumentYear, setUploadDocumentYear] = useState("");

  // Validation state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const { toast } = useToast();
  const categories = customerDocumentsService.getDocumentCategories();
  const allowedFileTypes = ["PDF"];
  const maxFileSize = "10 MB";

  // Load documents
  const loadDocuments = async (page = 1) => {
    try {
      setLoading(true);
      const filters: DocumentListFilters = {
        page,
        per_page: 10,
      };

      if (searchTerm) filters.search = searchTerm;
      if (selectedCategory && selectedCategory !== "all")
        filters.category = selectedCategory;

      const response = await customerDocumentsService.getCustomerDocuments(
        customerId,
        filters,
      );

      if (response.success) {
        setDocuments(response.data);
        setCurrentPage(response.pagination.current_page);
        setTotalPages(response.pagination.last_page);
      }
    } catch (error: any) {
      console.error("Failed to load documents:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Upload document
  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) {
      toast({
        title: "Error",
        description: "Please select a file and enter a name",
        variant: "destructive",
      });
      return;
    }

    // Validate file
    const validation = customerDocumentsService.validateFile(uploadFile);
    if (!validation.isValid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const uploadData: UploadDocumentRequest = {
        file: uploadFile,
        name: uploadName.trim(),
        category: "other", // Default category since we removed the field
      };

      // Add document_year if provided
      if (uploadDocumentYear.trim()) {
        uploadData.document_year = uploadDocumentYear.trim();
      }

      const response = await customerDocumentsService.uploadDocument(
        customerId,
        uploadData,
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Document uploaded successfully",
        });

        // Reset form
        setUploadFile(null);
        setUploadName("");
        setUploadDocumentYear("");
        setValidationErrors({});
        setShowUploadDialog(false);

        // Reload documents
        loadDocuments(currentPage);
      }
    } catch (error: any) {
      console.error("Upload failed:", error);

      // Handle validation errors
      if (error.response?.status === 422 && error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      } else {
        setValidationErrors({});
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload document",
          variant: "destructive",
        });
      }
    } finally {
      setUploading(false);
    }
  };

  // Download document
  const handleDownload = async (document: CustomerDocument) => {
    try {
      await customerDocumentsService.downloadDocument(customerId, document.id);
      toast({
        title: "Download Started",
        description: `Downloading ${document.name}`,
      });
    } catch (error: any) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    }
  };

  // Delete document
  const handleDelete = (document: CustomerDocument) => {
    setDocumentToDelete(document);
    setDeleteConfirmOpen(true);
  };

  // Confirm delete document
  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      setIsDeleting(true);
      await customerDocumentsService.deleteDocument(customerId, documentToDelete.id);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      loadDocuments(currentPage);
    } catch (error: any) {
      console.error("Delete failed:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDocumentToDelete(null);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // Clear previous validation errors
      setValidationErrors({});
      // Auto-fill name from filename if empty
      if (!uploadName) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "").slice(0, 100);
        setUploadName(nameWithoutExtension);
      }
    }
  };

  // Search and filter effects
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadDocuments(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory]);

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, [customerId]);

  return (
    <div className="space-y-4">
      {/* Header with Upload Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documents</h3>
        <Dialog
          open={showUploadDialog}
          onOpenChange={(open) => {
            setShowUploadDialog(open);
            if (!open) {
              // Clear form and validation errors when dialog closes
              setUploadFile(null);
              setUploadName("");
              setUploadDocumentYear("");
              setValidationErrors({});
            }
          }}
        >
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
              <div>
                <Label htmlFor="file">Choose File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf"
                  className={validationErrors.file ? "border-red-500" : ""}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Allowed types: {allowedFileTypes.join(", ")} • Max size:{" "}
                  {maxFileSize}
                </p>
                {uploadFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {uploadFile.name} (
                    {customerDocumentsService.formatFileSize(uploadFile.size)})
                  </p>
                )}
                {validationErrors.file && (
                  <p className="text-sm text-red-600 mt-1">
                    {validationErrors.file[0]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="name">Document Name *</Label>
                <Input
                  id="name"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Enter document name"
                  className={validationErrors.name ? "border-red-500" : ""}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {validationErrors.name[0]}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="document_year">Document Year (Optional)</Label>
                <Input
                  id="document_year"
                  type="number"
                  value={uploadDocumentYear}
                  onChange={(e) => setUploadDocumentYear(e.target.value)}
                  placeholder="e.g., 2024"
                  min="1900"
                  max="2100"
                  className={validationErrors.document_year ? "border-red-500" : ""}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Year related to this document (e.g., policy year, tax year)
                </p>
                {validationErrors.document_year && (
                  <p className="text-sm text-red-600 mt-1">
                    {validationErrors.document_year[0]}
                  </p>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading || !uploadFile || !uploadName.trim()}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(categories).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Loading documents...</p>
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No documents found</p>
            <Button onClick={() => setShowUploadDialog(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Header */}
          <Card>
            <CardContent className="p-3 bg-gray-50">
              <div className="flex items-center">
                <div className="w-8 mr-4"></div> {/* Space for icon */}
                <div className="grid gap-3 flex-1" style={{ gridTemplateColumns: '2fr 1.5fr 0.8fr 0.7fr 0.7fr 1fr' }}>
                  <div className="font-semibold text-sm text-gray-700">Name</div>
                  <div className="font-semibold text-sm text-gray-700">Uploaded by</div>
                  <div className="font-semibold text-sm text-gray-700">Size</div>
                  <div className="font-semibold text-sm text-gray-700">Type</div>
                  <div className="font-semibold text-sm text-gray-700">Year</div>
                  <div className="font-semibold text-sm text-gray-700">Date</div>
                </div>
                <div className="w-20 ml-4"></div> {/* Space for actions */}
              </div>
            </CardContent>
          </Card>
          
          {documents.map((document) => (
            <Card key={document.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                    <div className="grid gap-3 flex-1 items-center" style={{ gridTemplateColumns: '2fr 1.5fr 0.8fr 0.7fr 0.7fr 1fr' }}>
                      {/* Name */}
                      <div className="overflow-hidden">
                        <h4 className="font-semibold text-sm truncate" title={document.name}>
                          {document.name}
                        </h4>
                      </div>
                      {/* Uploaded by */}
                      <div className="overflow-hidden">
                        <p className="text-sm text-gray-600 truncate" title={document.uploader ? `${document.uploader.first_name} ${document.uploader.last_name}` : "Unknown"}>
                          {document.uploader 
                            ? `${document.uploader.first_name} ${document.uploader.last_name}`
                            : "Unknown"
                          }
                        </p>
                      </div>
                      {/* Size */}
                      <div className="overflow-hidden">
                        <p className="text-sm text-gray-600 truncate">
                          {customerDocumentsService.formatFileSize(document.file_size)}
                        </p>
                      </div>
                      {/* Type */}
                      <div className="overflow-hidden">
                        <Badge variant="outline" className="text-xs truncate">
                          {document.original_filename.split('.').pop()?.toUpperCase() || 'PDF'}
                        </Badge>
                      </div>
                      {/* Year */}
                      <div className="overflow-hidden">
                        <p className="text-sm text-gray-600 truncate">
                          {document.document_year || '—'}
                        </p>
                      </div>
                      {/* Date */}
                      <div className="overflow-hidden">
                        <p className="text-sm text-gray-600 truncate">
                          {new Date(document.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(document)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDocuments(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDocuments(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Delete Document"
        description={`Are you sure you want to delete "${documentToDelete?.name}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
};
