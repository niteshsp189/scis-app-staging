
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { authService } from '@/services/authService';

interface UploadCustomersDialogProps {
  onUploadCustomers: (customers: any[]) => void;
  status?: 'Client' | 'Prospect' | 'Former' | 'Deceased';
}

export function UploadCustomersDialog({ onUploadCustomers, status = 'Client' }: UploadCustomersDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/csv" || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file (.csv)",
          variant: "destructive",
        });
      }
    }
  };

  const downloadSampleTemplate = () => {
    // Create sample data with status locked to current context
    const lockedStatus = status || 'Client';
    const sampleData = [
      ["First Name", "Middle Name", "Last Name", "Gender", "Date of Birth", "SSN", "Marital Status", "Height (ft)", "Height (in)", "Weight (lbs)", "Smoker", "Email", "Home Phone", "Cell Phone", "Work Phone", "Fax", "Street Address", "Apartment/Unit", "Apartment Type", "City", "State", "ZIP Code", "Country", "Different Mailing Address", "Mailing Street Address", "Mailing Apartment/Unit", "Mailing Apartment Type", "Mailing City", "Mailing State", "Mailing ZIP Code", "Mailing Country", "Referral Source", "Status"],
      ["John", "Michael", "Doe", "Male", "1985-06-15", "123-45-6789", "Married", "5", "10", "180", "No", "john.doe@email.com", "(555) 123-4567", "(555) 987-6543", "(555) 456-7890", "(555) 321-9876", "123 Main Street", "Apt 5B", "Apt", "Los Angeles", "CA", "90210", "United States", "No", "", "", "", "", "", "", "", "Referral", lockedStatus],
      ["Jane", "Marie", "Smith", "Female", "1990-03-22", "987-65-4321", "Single", "5", "6", "140", "No", "jane.smith@email.com", "(555) 234-5678", "(555) 876-5432", "", "", "456 Oak Avenue", "", "", "San Francisco", "CA", "94102", "United States", "Yes", "PO Box 789", "", "", "San Francisco", "CA", "94102", "United States", "Internet", lockedStatus],
      ["Mike", "James", "Johnson", "Male", "1978-11-08", "", "Divorced", "6", "0", "200", "Yes", "mike.j@email.com", "(555) 345-6789", "(555) 765-4321", "(555) 567-8901", "", "789 Pine Road", "Unit 203", "Unit", "Seattle", "WA", "98101", "United States", "No", "", "", "", "", "", "", "", "Walk in", lockedStatus]
    ];

    // Convert to CSV format
    const csvContent = sampleData.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = status === 'Prospect' ? "prospects_template.csv" : "customers_template.csv";
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template downloaded",
      description: "Sample template has been downloaded to your computer",
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (status) {
        formData.append("expected_status", status);
      }

      const token = authService.getToken && authService.getToken();
      const response = await fetch("/api/customers/upload-csv", {
        method: "POST",
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Upload failed";
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || "Upload failed";
        }
        throw new Error(errorMessage);
      }
      const result = await response.json();
      onUploadCustomers(result.customers || []);

      // Create descriptive message
      const imported = result.successful_imports || result.customers?.length || 0;
      const skipped = result.skipped_imports || 0;
      const errors = result.failed_imports || 0;

      let description = `${imported} imported`;
      if (skipped > 0) {
        description += `, ${skipped} skipped (duplicate emails)`;
      }
      if (errors > 0) {
        description += `, ${errors} errors`;
      }

      toast({
        title: "Upload successful",
        description: description,
      });

      setIsOpen(false);
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Upload error:", error);

      let errorMessage = "There was an error processing your file. Please try again.";

      // Use the error message from the backend or the thrown error
      if (error.message && error.message !== "Upload failed") {
        errorMessage = error.message;
      }

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          {status === 'Prospect' ? 'Upload Prospects' : 'Upload Customers'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{status === 'Prospect' ? 'Upload Prospects from Excel' : 'Upload Customers from Excel'}</DialogTitle>
          <DialogDescription>
            Upload an Excel file with {status === 'Prospect' ? 'prospect' : 'customer'} data. Download the sample template to see the required format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Sample Template</p>
                <p className="text-sm text-blue-700">Download to see the required format</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadSampleTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Select Excel File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
            />
            {selectedFile && (
              <p className="text-sm text-gray-600">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
              {isUploading ? "Processing..." : (status === 'Prospect' ? "Upload Prospects" : "Upload Customers")}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
