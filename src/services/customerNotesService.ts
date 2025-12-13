import { api } from "@/lib/axios";

export interface CustomerNote {
  id: string;
  customer_id: number;
  content: string;
  color: "black" | "red" | "blue" | "purple" | "green" | "orange" | "yellow" | "pink" | "brown";
  is_important: boolean;
  is_pinned: boolean;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface NotesListResponse {
  success: boolean;
  data: CustomerNote[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    has_more_pages: boolean;
  };
}

export interface NoteResponse {
  success: boolean;
  data: CustomerNote;
  message?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: string[];
}

export interface StatisticsResponse {
  success: boolean;
  data: {
    total_notes: number;
    important_notes: number;
    categories: Record<string, number>;
    priorities: Record<string, number>;
  };
}

export interface CreateNoteRequest {
  content: string;
  color?: "black" | "red" | "blue" | "purple" | "green" | "orange" | "yellow" | "pink" | "brown";
  is_important?: boolean;
  is_pinned?: boolean;
  copy_to_related_contacts?: boolean;
}

export interface UpdateNoteRequest {
  content: string;
  color?: "black" | "red" | "blue" | "purple" | "green" | "orange" | "yellow" | "pink" | "brown";
  is_important?: boolean;
  is_pinned?: boolean;
}

export interface NotesListFilters {
  search?: string;
  is_pinned?: boolean;
  per_page?: number;
  page?: number;
}

export const customerNotesService = {
  /**
   * Get all notes for a customer with optional filtering and pagination
   */
  async getCustomerNotes(
    customerId: number,
    filters?: NotesListFilters,
  ): Promise<NotesListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get<NotesListResponse>(
      `/customers/${customerId}/notes?${params.toString()}`,
    );
    return response.data;
  },

  /**
   * Get a specific note's details
   */
  async getNote(
    customerId: number,
    noteId: string,
  ): Promise<NoteResponse> {
    const response = await api.get<NoteResponse>(
      `/customers/${customerId}/notes/${noteId}`,
    );
    return response.data;
  },

  /**
   * Create a new note for a customer
   */
  async createNote(
    customerId: number,
    noteData: CreateNoteRequest,
  ): Promise<NoteResponse> {
    const response = await api.post<NoteResponse>(
      `/customers/${customerId}/notes`,
      noteData,
    );
    return response.data;
  },

  /**
   * Update an existing note
   */
  async updateNote(
    customerId: number,
    noteId: string,
    noteData: UpdateNoteRequest,
  ): Promise<NoteResponse> {
    const response = await api.put<NoteResponse>(
      `/customers/${customerId}/notes/${noteId}`,
      noteData,
    );
    return response.data;
  },

  /**
   * Delete a note (soft delete)
   */
  async deleteNote(customerId: number, noteId: string): Promise<void> {
    await api.delete(`/customers/${customerId}/notes/${noteId}`);
  },

  /**
   * Pin or unpin a note
   */
  async togglePinNote(
    customerId: number,
    noteId: string,
    isPinned: boolean,
  ): Promise<NoteResponse> {
    const response = await api.patch<NoteResponse>(
      `/customers/${customerId}/notes/${noteId}/pin`,
      { is_pinned: isPinned },
    );
    return response.data;
  },

  /**
   * Get available note categories for a customer
   */
  async getCategories(customerId: number): Promise<CategoriesResponse> {
    const response = await api.get<CategoriesResponse>(
      `/customers/${customerId}/notes/categories/list`,
    );
    return response.data;
  },

  /**
   * Get note statistics for a customer
   */
  async getStatistics(customerId: number): Promise<StatisticsResponse> {
    const response = await api.get<StatisticsResponse>(
      `/customers/${customerId}/notes/statistics/summary`,
    );
    return response.data;
  },

  /**
   * Get predefined note categories
   */
  getPredefinedCategories(): Record<string, string> {
    return {
      "Contact Attempt": "Contact Attempt",
      "Policy Change": "Policy Change",
      "Complaint": "Complaint",
      "Follow-up": "Follow-up",
      "Renewal Discussion": "Renewal Discussion",
      "Claim Discussion": "Claim Discussion",
      "Payment": "Payment",
      "General": "General",
    };
  },

  /**
   * Get color options with their meanings
   */
  getColorOptions(): Array<{
    value: "black" | "red" | "blue" | "purple" | "green" | "orange" | "yellow" | "pink" | "brown";
    label: string;
    class: string;
  }> {
    return [
      {
        value: "black",
        label: "Critical",
        class: "bg-gray-100 text-gray-900 border-gray-300",
      },
      {
        value: "red",
        label: "High Priority",
        class: "bg-red-100 text-red-800 border-red-200",
      },
      {
        value: "blue",
        label: "Information",
        class: "bg-blue-100 text-blue-800 border-blue-200",
      },
      {
        value: "purple",
        label: "Important",
        class: "bg-purple-100 text-purple-800 border-purple-200",
      },
      {
        value: "green",
        label: "Positive",
        class: "bg-green-100 text-green-800 border-green-200",
      },
      {
        value: "orange",
        label: "Warning",
        class: "bg-orange-100 text-orange-800 border-orange-200",
      },
      {
        value: "yellow",
        label: "Follow-up",
        class: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      {
        value: "pink",
        label: "Customer Request",
        class: "bg-pink-100 text-pink-800 border-pink-200",
      },
      {
        value: "brown",
        label: "Policy Related",
        class: "bg-amber-100 text-amber-800 border-amber-200",
      },
    ];
  },

  /**
   * Get CSS class for note color
   */
  getNoteColorClass(color: string): string {
    const colorMap = {
      black: "bg-gray-50 border-l-gray-500 text-gray-900",
      red: "bg-red-50 border-l-red-400 text-red-900",
      blue: "bg-blue-50 border-l-blue-400 text-blue-900",
      purple: "bg-purple-50 border-l-purple-400 text-purple-900",
      green: "bg-green-50 border-l-green-400 text-green-900",
      orange: "bg-orange-50 border-l-orange-400 text-orange-900",
      yellow: "bg-yellow-50 border-l-yellow-400 text-yellow-900",
      pink: "bg-pink-50 border-l-pink-400 text-pink-900",
      brown: "bg-[#f7f3ef] border-l-[#a0522d] text-[#8d5524]",
    };
    return colorMap[color as keyof typeof colorMap] || "bg-gray-50 border-l-gray-400 text-gray-900";
  },

  /**
   * Get badge color class for select options
   */
  getBadgeColorClass(color: string): string {
    const colorOptions = this.getColorOptions();
    const option = colorOptions.find(opt => opt.value === color);
    return option?.class || "bg-gray-100 text-gray-800 border-gray-200";
  },

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  },

  /**
   * Get full name from creator/updater object
   */
  getFullName(user?: { first_name: string; last_name: string }): string {
    if (!user) return "Unknown User";
    return `${user.first_name} ${user.last_name}`.trim();
  },

  /**
   * Validate note content
   */
  validateNote(noteData: CreateNoteRequest | UpdateNoteRequest): {
    isValid: boolean;
    errors: string[]
  } {
    const errors: string[] = [];

    if (!noteData.content || noteData.content.trim().length === 0) {
      errors.push("Note content is required");
    }

    if (noteData.content && noteData.content.length > 65535) {
      errors.push("Note content cannot exceed 65,535 characters");
    }

    if (noteData.color && !["black", "red", "blue", "purple", "green", "orange", "yellow", "pink", "brown"].includes(noteData.color)) {
      errors.push("Invalid color selection");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Sort notes by different criteria with pinned notes at the top
   */
  sortNotes(
    notes: CustomerNote[],
    sortBy: "date" | "content" | "color" = "date",
    sortOrder: "asc" | "desc" = "desc"
  ): CustomerNote[] {
    const sorted = [...notes].sort((a, b) => {
      // Always put pinned notes at the top
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "content":
          comparison = a.content.localeCompare(b.content);
          break;
        case "color":
          const colorOrder = { 
            black: 0, red: 1, orange: 2, yellow: 3, pink: 4, 
            purple: 5, blue: 6, green: 7, brown: 8 
          };
          comparison = (colorOrder[a.color as keyof typeof colorOrder] || 9) -
                      (colorOrder[b.color as keyof typeof colorOrder] || 9);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }
};

export default customerNotesService;
