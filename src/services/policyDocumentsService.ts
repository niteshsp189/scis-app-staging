import axios, { AxiosResponse } from "axios";

// Configure axios instance with base URL and default headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface PolicyDocument {
  id: string;
  name: string;
  original_filename: string;
  file_size: number;
  formatted_size: string;
  file_type: string;
  mime_type: string;
  category: string;
  description?: string;
  url: string;
  icon: string;
  is_image: boolean;
  is_pdf: boolean;
  uploaded_by: string;
  uploaded_at: string;
  upload_date: string;
}

export interface PolicyDocumentUpload {
  file: File;
  name?: string;
  category?: string;
  description?: string;
}

export interface PolicyDocumentUpdate {
  name?: string;
  category?: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

class PolicyDocumentsService {
  // Get all documents for a policy
  async getDocuments(policyId: string, category?: string): Promise<PolicyDocument[]> {
    try {
      const params = category ? { category } : {};
      const response: AxiosResponse<ApiResponse<PolicyDocument[]>> = await api.get(
        `/policies/${policyId}/documents`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching policy documents:", error);
      throw error;
    }
  }

  // Get a specific document
  async getDocument(policyId: string, documentId: string): Promise<PolicyDocument> {
    try {
      const response: AxiosResponse<ApiResponse<PolicyDocument>> = await api.get(
        `/policies/${policyId}/documents/${documentId}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching policy document:", error);
      throw error;
    }
  }

  // Upload a new document
  async uploadDocument(policyId: string, upload: PolicyDocumentUpload): Promise<PolicyDocument> {
    try {
      const formData = new FormData();
      formData.append("file", upload.file);
      
      if (upload.name) {
        formData.append("name", upload.name);
      }
      if (upload.category) {
        formData.append("category", upload.category);
      }
      if (upload.description) {
        formData.append("description", upload.description);
      }

      const response: AxiosResponse<ApiResponse<PolicyDocument>> = await api.post(
        `/policies/${policyId}/documents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error uploading policy document:", error);
      throw error;
    }
  }

  // Update document metadata
  async updateDocument(
    policyId: string,
    documentId: string,
    update: PolicyDocumentUpdate
  ): Promise<PolicyDocument> {
    try {
      const response: AxiosResponse<ApiResponse<PolicyDocument>> = await api.put(
        `/policies/${policyId}/documents/${documentId}`,
        update
      );
      return response.data.data;
    } catch (error) {
      console.error("Error updating policy document:", error);
      throw error;
    }
  }

  // Download a document
  async downloadDocument(policyId: string, documentId: string): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await api.get(
        `/policies/${policyId}/documents/${documentId}/download`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error downloading policy document:", error);
      throw error;
    }
  }

  // Delete a document
  async deleteDocument(policyId: string, documentId: string): Promise<void> {
    try {
      await api.delete(`/policies/${policyId}/documents/${documentId}`);
    } catch (error) {
      console.error("Error deleting policy document:", error);
      throw error;
    }
  }

  // Helper method to trigger file download in browser
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Helper method to get file icon based on file type
  getFileIcon(fileType: string): string {
    const type = fileType.toLowerCase();
    
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(type)) {
      return "📷";
    } else if (type === "pdf") {
      return "📄";
    } else if (["doc", "docx"].includes(type)) {
      return "📝";
    } else if (["xls", "xlsx"].includes(type)) {
      return "📊";
    } else if (["ppt", "pptx"].includes(type)) {
      return "📋";
    } else if (["zip", "rar", "7z"].includes(type)) {
      return "🗜️";
    } else {
      return "📎";
    }
  }

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

export default new PolicyDocumentsService();
