import { api } from '@/lib/axios';
import type { 
  DeletionImpactAnalysis, 
  DeletionResult, 
  DeletionRequest 
} from '@/types/customerDeletion';

/**
 * Service for enhanced customer deletion functionality
 */
export class CustomerDeletionService {
  /**
   * Analyze the impact of deleting a customer
   */
  static async analyzeDeletionImpact(customerId: number): Promise<DeletionImpactAnalysis> {
    const response = await api.get(`/customers/${customerId}/deletion-impact`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to analyze deletion impact');
    }
    
    return response.data.data;
  }

  /**
   * Execute enhanced customer deletion
   */
  static async executeEnhancedDeletion(
    customerId: number, 
    request: DeletionRequest
  ): Promise<DeletionResult> {
    const response = await api.delete(`/customers/${customerId}/enhanced`, {
      data: request
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete customer');
    }
    
    return response.data.data;
  }

  /**
   * Format premium amount for display
   */
  static formatPremium(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get risk level color
   */
  static getRiskLevelColor(riskLevel: 'low' | 'medium' | 'high'): string {
    switch (riskLevel) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  /**
   * Get risk level icon
   */
  static getRiskLevelIcon(riskLevel: 'low' | 'medium' | 'high'): string {
    switch (riskLevel) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  }

  /**
   * Get dependent impact color
   */
  static getDependentImpactColor(impact: string): string {
    switch (impact) {
      case 'will_be_deleted':
        return 'text-red-600 bg-red-50';
      case 'will_keep_other_policies':
        return 'text-blue-600 bg-blue-50';
      case 'needs_reassignment':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  /**
   * Calculate total impact score for UI prioritization
   */
  static calculateImpactScore(analysis: DeletionImpactAnalysis): number {
    let score = 0;
    
    // Active policies
    score += analysis.policies_impact.active.length * 3;
    
    // Dependents that will be deleted
    const dependentsToDelete = analysis.dependents_impact.dependents.filter(
      d => d.impact === 'will_be_deleted'
    ).length;
    score += dependentsToDelete * 2;
    
    // Financial impact
    if (analysis.financial_impact.outstanding_premiums > 1000) {
      score += 3;
    }
    
    // Upcoming appointments
    score += analysis.related_records.appointments.upcoming;
    
    return score;
  }
}