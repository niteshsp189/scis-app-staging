// Enhanced Customer Deletion Types
export interface DeletionImpactAnalysis {
  customer_id: string;
  customer_name: string;
  customer_role: 'main_policy_holder' | 'dependent_only' | 'both' | 'no_policies';
  risk_level: 'low' | 'medium' | 'high';
  policies_impact: PoliciesImpact;
  dependents_impact: DependentsImpact;
  relationships_impact: RelationshipsImpact;
  related_records: RelatedRecordsImpact;
  financial_impact: FinancialImpact;
  deletion_summary: DeletionSummary;
}

export interface PoliciesImpact {
  total_policies: number;
  active: PolicySummary[];
  cancelled: PolicySummary[];
  suspended: PolicySummary[];
  will_be_affected: PolicySummary[];
}

export interface PolicySummary {
  id: number;
  policy_number: string;
  plan_name: string;
  status: string;
  premium_amount: number;
  start_date: string;
  end_date?: string;
  has_dependents: boolean;
  dependent_count: number;
  outstanding_amount: number;
}

export interface DependentsImpact {
  total_dependents: number;
  dependents: DependentImpact[];
}

export interface DependentImpact {
  id: number;
  name: string;
  relationship: string;
  policies_with_customer: number;
  other_policies_count: number;
  other_policies: Array<{
    policy_number: string;
    plan_name: string;
    main_holder: string;
  }>;
  impact: 'will_be_deleted' | 'will_keep_other_policies' | 'needs_reassignment';
  message: string;
}

export interface RelationshipsImpact {
  total_relationships: number;
  relationships: Array<{
    id: number;
    relationship_type: string;
    related_customer_name: string;
    related_customer_id: number;
    direction: 'outgoing' | 'incoming';
    will_be_removed: boolean;
  }>;
}

export interface RelatedRecordsImpact {
  appointments: {
    total: number;
    upcoming: number;
    completed: number;
  };
  reminders: {
    total: number;
    pending: number;
    overdue: number;
  };
  documents: number;
  notes: number;
}

export interface FinancialImpact {
  total_annual_premium: number;
  outstanding_premiums: number;
  credit_balance: number;
  net_amount: number;
}

export interface DeletionSummary {
  warnings: string[];
  actions: string[];
  can_be_restored: boolean;
  restoration_window_days: number;
}

export interface DeletionResult {
  success: boolean;
  deleted_records: Array<{
    type: string;
    id: number;
    identifier: string;
  }>;
  total_records_deleted: number;
  deletion_date: string;
  can_be_restored: boolean;
  restoration_deadline: string;
}

export interface DeletionRequest {
  deletion_reason?: string;
  user_acknowledged: boolean;
  impact_reviewed: boolean;
}