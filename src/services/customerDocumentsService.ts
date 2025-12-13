import { api } from "@/lib/axios";

export interface CustomerDocument {
  id: string;
  customer_id: number;
  name: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  category: "policy" | "identity" | "financial" | "medical" | "other";
  description?: string;
  document_year?: number | string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  uploader?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface DocumentListResponse {
  success: boolean;
  data: CustomerDocument[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  categories: Record<string, string>;
}

export interface DocumentResponse {
  success: boolean;
  data: CustomerDocument;
}

export interface UploadDocumentRequest {
  file: File;
  name: string;
  category?: string;
  description?: string;
  document_year?: number | string;
}

export interface UpdateDocumentRequest {
  name?: string;
  category?: string;
  description?: string;
  document_year?: number | string;
}

export interface DocumentListFilters {
  search?: string;
  category?: string;
  per_page?: number;
  page?: number;
}

export const customerDocumentsService = {
  /**
   * Get all documents for a customer with optional filtering and pagination
   */
  async getCustomerDocuments(
    customerId: number,
    filters?: DocumentListFilters,
  ): Promise<DocumentListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get<DocumentListResponse>(
      `/customers/${customerId}/documents?${params.toString()}`,
    );
    return response.data;
  },

  /**
   * Get a specific document's metadata
   */
  async getDocument(
    customerId: number,
    documentId: string,
  ): Promise<DocumentResponse> {
    const response = await api.get<DocumentResponse>(
      `/customers/${customerId}/documents/${documentId}`,
    );
    return response.data;
  },

  /**
   * Upload a new document for a customer
   */
  async uploadDocument(
    customerId: number,
    uploadData: UploadDocumentRequest,
  ): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append("file", uploadData.file);
    formData.append("name", uploadData.name);

    if (uploadData.category) {
      formData.append("category", uploadData.category);
    }

    if (uploadData.description) {
      formData.append("description", uploadData.description);
    }

    if (uploadData.document_year) {
      formData.append("document_year", uploadData.document_year.toString());
    }

    const response = await api.post<DocumentResponse>(
      `/customers/${customerId}/documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  /**
   * Update document metadata
   */
  async updateDocument(
    customerId: number,
    documentId: string,
    updateData: UpdateDocumentRequest,
  ): Promise<DocumentResponse> {
    const response = await api.put<DocumentResponse>(
      `/customers/${customerId}/documents/${documentId}`,
      updateData,
    );
    return response.data;
  },

  /**
   * Delete a document
   */
  async deleteDocument(customerId: number, documentId: string): Promise<void> {
    await api.delete(`/customers/${customerId}/documents/${documentId}`);
  },

  /**
   * Get download URL for a document
   */
  getDownloadUrl(customerId: number, documentId: string): string {
    const baseUrl = api.defaults.baseURL;
    const authToken = localStorage.getItem("auth_token");

    // Create URL with auth token as query parameter for download
    const url = new URL(
      `${baseUrl}/customers/${customerId}/documents/${documentId}/download`,
    );
    if (authToken) {
      url.searchParams.append("token", authToken);
    }

    return url.toString();
  },

  /**
   * Get direct public URL for a document (for public storage)
   */
  getDirectUrl(document: CustomerDocument): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/storage/${document.file_path}`;
  },

  /**
   * Download a document (triggers browser download)
   */
  async downloadDocument(
    customerId: number,
    documentId: string,
  ): Promise<void> {
    try {
      const response = await api.get(
        `/customers/${customerId}/documents/${documentId}/download`,
        {
          responseType: "blob",
        },
      );

      // Extract filename from Content-Disposition header with multiple fallback patterns
      let filename = "download";
      const contentDisposition =
        response.headers["content-disposition"] ||
        response.headers["Content-Disposition"];

      if (contentDisposition) {
        // Try multiple patterns for filename extraction
        const patterns = [
          /filename\*?=['"]?([^'";]+)['"]?/i,
          /filename=['"]([^'"]+)['"]/i,
          /filename=([^;]+)/i,
        ];

        for (const pattern of patterns) {
          const match = contentDisposition.match(pattern);
          if (match && match[1]) {
            filename = match[1].trim();
            // Remove quotes if present
            filename = filename.replace(/^["']|["']$/g, "");
            break;
          }
        }
      }

      // If still no filename, try to get document metadata
      if (filename === "download") {
        try {
          const docResponse = await this.getDocument(customerId, documentId);
          if (docResponse.success && docResponse.data.original_filename) {
            filename = docResponse.data.original_filename;
          }
        } catch (error) {
          console.warn("Could not fetch document metadata for filename");
        }
      }

      // Create blob with proper content type
      const contentType =
        response.headers["content-type"] ||
        response.headers["Content-Type"] ||
        "application/octet-stream";

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      // Create and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = filename; // Use download property instead of setAttribute
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  },

  /**
   * Get human-readable file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Get file icon based on mime type
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith("image/")) {
      return "image";
    } else if (mimeType === "application/pdf") {
      return "pdf";
    } else if (mimeType.includes("word") || mimeType.includes("document")) {
      return "word";
    } else if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
      return "excel";
    } else {
      return "file";
    }
  },

  /**
   * Get available document categories
   */
  getDocumentCategories(): Record<string, string> {
    return {
      policy: "Policy Documents",
      identity: "Identity Documents",
      financial: "Financial Records",
      medical: "Medical Records",
      other: "Other Documents",
    };
  },

  /**
   * Validate file before upload
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/avif",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size must be less than 10MB",
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error:
          "File type not supported. Allowed types: PDF, JPEG, PNG, GIF, AVIF, WebP, DOC, DOCX, XLS, XLSX",
      };
    }

    return { isValid: true };
  },
};

export default customerDocumentsService;
