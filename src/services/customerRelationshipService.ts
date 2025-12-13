import { api } from '@/lib/axios';

// ===============================================
// API Service for Customer Relationships
// ===============================================

export interface CustomerRelationship {
  id: number;
  customer_id: number;
  related_customer_id: number;
  relationship_type: string;
  notes?: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
  related_customer_name: string;
  related_customer?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export interface CustomerSearchResult {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export interface RelationshipStats {
  customer_id: number;
  total_relationships: number;
  relationships_by_type: Record<string, number>;
}

export interface CreateRelationshipData {
  customer_id: number;
  related_customer_id: number;
  relationship_type: string;
  notes?: string;
  status?: 'Active' | 'Inactive';
}

export interface UpdateRelationshipData {
  relationship_type?: string;
  notes?: string;
  status?: 'Active' | 'Inactive';
}

export const customerRelationshipService = {
  /**
   * Get all relationships for a customer
   */
  async getRelationships(customerId: number): Promise<CustomerRelationship[]> {
    const response = await api.get(`/customer-relationships?customer_id=${customerId}`);
    return response.data;
  },

  /**
   * Get all relationships with optional filters
   */
  async getAllRelationships(params?: {
    customer_id?: number;
    relationship_type?: string;
    search?: string;
  }): Promise<CustomerRelationship[]> {
    const queryParams = new URLSearchParams();

    if (params?.customer_id) {
      queryParams.append('customer_id', params.customer_id.toString());
    }
    if (params?.relationship_type) {
      queryParams.append('relationship_type', params.relationship_type);
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }

    const response = await api.get(`/customer-relationships?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Create a new customer relationship
   */
  async createRelationship(relationshipData: CreateRelationshipData): Promise<CustomerRelationship> {
    const response = await api.post('/customer-relationships', relationshipData);
    return response.data.relationship;
  },

  /**
   * Get a specific relationship by ID
   */
  async getRelationship(id: number): Promise<CustomerRelationship> {
    const response = await api.get(`/customer-relationships/${id}`);
    return response.data;
  },

  /**
   * Update an existing relationship
   */
  async updateRelationship(id: number, relationshipData: UpdateRelationshipData): Promise<CustomerRelationship> {
    const response = await api.put(`/customer-relationships/${id}`, relationshipData);
    return response.data.relationship;
  },

  /**
   * Delete a relationship
   */
  async deleteRelationship(id: number): Promise<void> {
    await api.delete(`/customer-relationships/${id}`);
  },

  /**
   * Search for customers to create relationships with
   */
  async searchCustomers(search: string, excludeCustomerId?: number): Promise<CustomerSearchResult[]> {
    const params = new URLSearchParams({
      search: search,
    });

    if (excludeCustomerId) {
      params.append('exclude_customer_id', excludeCustomerId.toString());
    }

    const response = await api.get(`/customer-relationships/search/customers?${params.toString()}`);
    return response.data;
  },

  /**
   * Get relationship statistics for a customer
   */
  async getRelationshipStats(customerId: number): Promise<RelationshipStats> {
    const response = await api.get(`/customer-relationships/stats/${customerId}`);
    return response.data;
  },
};

// Utility functions for relationship management
export const relationshipUtils = {
  /**
   * Get available relationship types
   */
  getRelationshipTypes(): string[] {
    return [
      'Spouse',
      'Child',
      'Parent',
      'Sibling',
      'Brother',
      'Sister',
      'Friend',
      'Colleague',
      'Business Partner',
      'Neighbor',
      'Relative',
      'Other'
    ];
  },

  /**
   * Get the reciprocal relationship type
   */
  getReciprocalRelationshipType(relationshipType: string): string {
    const reciprocals: Record<string, string> = {
      'Spouse': 'Spouse',
      'Parent': 'Child',
      'Child': 'Parent',
      'Sibling': 'Sibling',
      'Brother': 'Sister',
      'Sister': 'Brother',
      'Friend': 'Friend',
      'Colleague': 'Colleague',
      'Business Partner': 'Business Partner',
      'Neighbor': 'Neighbor',
      'Relative': 'Relative',
    };

    return reciprocals[relationshipType] || 'Other';
  },

  /**
   * Format relationship display text
   */
  formatRelationshipDisplay(relationship: CustomerRelationship): string {
    const name = relationship.related_customer_name || 'Unknown Customer';
    const type = relationship.relationship_type;
    return `${name} (${type})`;
  },

  /**
   * Check if two customers can have a relationship
   */
  canCreateRelationship(customerId: number, relatedCustomerId: number): boolean {
    return customerId !== relatedCustomerId;
  },

  /**
   * Validate relationship data before submission
   */
  validateRelationshipData(data: CreateRelationshipData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.customer_id) {
      errors.push('Customer ID is required');
    }

    if (!data.related_customer_id) {
      errors.push('Related customer ID is required');
    }

    if (data.customer_id === data.related_customer_id) {
      errors.push('Customer cannot have a relationship with themselves');
    }

    if (!data.relationship_type || data.relationship_type.trim() === '') {
      errors.push('Relationship type is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Get relationship type color for UI display
   */
  getRelationshipTypeColor(relationshipType: string): string {
    const colorMap: Record<string, string> = {
      'Spouse': 'bg-pink-100 text-pink-800 border-pink-200',
      'Child': 'bg-blue-100 text-blue-800 border-blue-200',
      'Parent': 'bg-green-100 text-green-800 border-green-200',
      'Sibling': 'bg-purple-100 text-purple-800 border-purple-200',
      'Brother': 'bg-purple-100 text-purple-800 border-purple-200',
      'Sister': 'bg-purple-100 text-purple-800 border-purple-200',
      'Friend': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Colleague': 'bg-orange-100 text-orange-800 border-orange-200',
      'Business Partner': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Neighbor': 'bg-teal-100 text-teal-800 border-teal-200',
      'Relative': 'bg-gray-100 text-gray-800 border-gray-200',
      'Other': 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return colorMap[relationshipType] || 'bg-gray-100 text-gray-800 border-gray-200';
  },

  /**
   * Sort relationships by type priority
   */
  sortRelationshipsByPriority(relationships: CustomerRelationship[]): CustomerRelationship[] {
    const priorityOrder = [
      'Spouse',
      'Child',
      'Parent',
      'Sibling',
      'Brother',
      'Sister',
      'Relative',
      'Friend',
      'Colleague',
      'Business Partner',
      'Neighbor',
      'Other'
    ];

    return relationships.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.relationship_type);
      const bPriority = priorityOrder.indexOf(b.relationship_type);

      // If not found in priority list, put at end
      const aIndex = aPriority === -1 ? priorityOrder.length : aPriority;
      const bIndex = bPriority === -1 ? priorityOrder.length : bPriority;

      return aIndex - bIndex;
    });
  }
};
