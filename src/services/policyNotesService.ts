import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export interface PolicyNote {
  id: string;
  content: string;
  is_pinned: boolean;
  author_name: string;
  formatted_timestamp: string;
}

export interface CreatePolicyNoteRequest {
  content: string;
  is_pinned?: boolean;
}

export interface UpdatePolicyNoteRequest {
  content?: string;
  is_pinned?: boolean;
}

export interface PolicyNotesResponse {
  success: boolean;
  data: PolicyNote[];
}

export interface PolicyNoteResponse {
  success: boolean;
  data: PolicyNote;
}

// Get all notes for a policy
export const getPolicyNotes = async (policyId: string): Promise<PolicyNote[]> => {
  try {
    const response = await axios.get<PolicyNotesResponse>(
      `${API_BASE_URL}/policies/${policyId}/notes`,
      getAuthHeaders()
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching policy notes:', error);
    throw error;
  }
};

// Create a new note
export const createPolicyNote = async (
  policyId: string,
  noteData: CreatePolicyNoteRequest
): Promise<PolicyNote> => {
  try {
    const response = await axios.post<PolicyNoteResponse>(
      `${API_BASE_URL}/policies/${policyId}/notes`,
      noteData,
      getAuthHeaders()
    );
    return response.data.data;
  } catch (error) {
    console.error('Error creating policy note:', error);
    throw error;
  }
};

// Update a note
export const updatePolicyNote = async (
  policyId: string,
  noteId: string,
  noteData: UpdatePolicyNoteRequest
): Promise<PolicyNote> => {
  try {
    const response = await axios.put<PolicyNoteResponse>(
      `${API_BASE_URL}/policies/${policyId}/notes/${noteId}`,
      noteData,
      getAuthHeaders()
    );
    return response.data.data;
  } catch (error) {
    console.error('Error updating policy note:', error);
    throw error;
  }
};

// Toggle pin status of a note
export const togglePolicyNotePin = async (
  policyId: string,
  noteId: string
): Promise<PolicyNote> => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.patch<PolicyNoteResponse>(
      `${API_BASE_URL}/policies/${policyId}/notes/${noteId}/toggle-pin`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error toggling policy note pin:', error);
    throw error;
  }
};

// Delete a note
export const deletePolicyNote = async (
  policyId: string,
  noteId: string
): Promise<void> => {
  try {
    const token = localStorage.getItem('auth_token');
    await axios.delete(
      `${API_BASE_URL}/policies/${policyId}/notes/${noteId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    console.error('Error deleting policy note:', error);
    throw error;
  }
};

// Helper function to format note content for display
export const formatNoteContent = (content: string, maxLength: number = 100): string => {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength) + '...';
};

// Helper function to check if a note is recent (within last 24 hours)
export const isRecentNote = (timestamp: string): boolean => {
  const noteDate = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - noteDate.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 24;
};
