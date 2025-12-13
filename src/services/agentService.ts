
import { Agent } from '@/types/agent';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface AgentResponse {
  success: boolean;
  data: Agent[];
  message?: string;
}

export interface SingleAgentResponse {
  success: boolean;
  data: Agent;
  message?: string;
}

class AgentService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAgents(): Promise<Agent[]> {
    try {
      const response = await this.makeRequest<AgentResponse>('/agents');
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch agents');
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  }

  async getAgent(id: string): Promise<Agent> {
    try {
      const response = await this.makeRequest<SingleAgentResponse>(`/agents/${id}`);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch agent');
    } catch (error) {
      console.error('Error fetching agent:', error);
      throw error;
    }
  }
}

export const agentService = new AgentService();
