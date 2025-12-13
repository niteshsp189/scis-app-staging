import { api } from '@/lib/axios';
import { User } from './authService';
import { toast } from '@/components/ui/use-toast';

interface UsersResponse {
  success: boolean;
  data: User[];
  pagination?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  message: string;
}

class UserService {
  async getUsers(params?: { role?: string; active?: boolean }): Promise<User[]> {
    try {
      const response = await api.get<UsersResponse>('/users', { params });
      
      // Make sure data is an array, or return an empty array as fallback
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.error('Unexpected API response format:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      
      // Check if it's a permission error (403 Forbidden)
      if (error.status === 403 || error.response?.status === 403) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have permission to view user data.",
        });
        
        // Return empty array instead of throwing for permission errors
        // This allows the component to continue functioning with fallback data
        return [];
      }
      
      throw error;
    }
  }

  async getAgents(): Promise<User[]> {
    try {
      // This assumes there's an API endpoint that specifically returns users with agent roles
      // If not, you can filter by role like: getUsers({ role: 'agent' })
      const response = await api.get<UsersResponse>('/users/agents');
      
      // Make sure data is an array, or return an empty array as fallback
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else {
        console.error('Unexpected API response format:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      
      // Check if it's a permission error (403 Forbidden)
      if (error.status === 403 || error.response?.status === 403) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have permission to view agent data.",
        });
        
        // Return empty array instead of throwing for permission errors
        return [];
      }
      
      throw error;
    }
  }
}

const userService = new UserService();
export default userService;
