export interface Policy {
  id: number;
  policy_number: string;
  customer_id: number;
  plan_id: number;
  family_member_id?: number;
  status: PolicyStatus;
  start_date: string;
  end_date?: string;
  premium_amount: number;
  premium_frequency: PremiumFrequency;
  coverage_details?: any;
  beneficiary_info?: any;
  field_values?: any;
  auto_renew: boolean;
  next_renewal_date?: string;
  last_premium_paid_date?: string;
  outstanding_premium: number;
  commission_rate?: number;
  underwriting_status: UnderwritingStatus;
  cancellation_date?: string;
  cancellation_reason?: string;
  cancellation_type?: CancellationType;
  suspended_date?: string;
  lapse_date?: string;
  refund_amount?: number;
  refund_status?: RefundStatus;
  refund_processed_date?: string;
  reinstated_date?: string;
  reinstatement_count: number;
  last_reinstatement_date?: string;
  reinstatement_notes?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;

  // Relationship data (populated when included)
  customer?: CustomerData;
  plan?: PlanData;
  agents?: PolicyAgent[];
  currentTerm?: PolicyTerm;
  terms?: PolicyTerm[];
  installments?: Installment[];
  reinstatementRequests?: PolicyReinstatementRequest[];
  gracePeriods?: GracePeriod[];
  amendments?: PolicyAmendment[];
}

export type PolicyStatus =
  | "Active"
  | "Pending"
  | "Suspended"
  | "Cancelled"
  | "Expired"
  | "Lapsed";

export type PremiumFrequency =
  | "monthly"
  | "quarterly"
  | "semi-annual"
  | "annual";

export type UnderwritingStatus = "pending" | "approved" | "declined" | "review";

export type CancellationType =
  | "customer_request"
  | "non_payment"
  | "regulatory"
  | "fraud"
  | "other";

export type RefundStatus =
  | "pending"
  | "processed"
  | "not_applicable"
  | "failed";

export interface CustomerData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface PlanData {
  id: number;
  name: string;
  description?: string;
  category?: string;
  company_name?: string;
  company?: {
    id: number;
    name: string;
    code?: string;
    email?: string;
    phone?: string;
  };
  planType?: {
    id: number;
    name: string;
    slug: string;
    extra_fields?: Record<
      string,
      {
        label: string;
        included: boolean;
        required: boolean;
      }
    >;
  };
  plan_type?: {
    id: number;
    name: string;
    slug: string;
    extra_fields?: Record<
      string,
      {
        label: string;
        included: boolean;
        required: boolean;
      }
    >;
  };
}

export interface PolicyAgent {
  id: number;
  policy_id: number;
  agent_id: string;
  agent_type: "AOR" | "Writing Agent";
  assigned_date: string;
  aor_letter_date?: string;
  commission_rate?: number;
  notes?: string;
  is_active: boolean;
  agent?: {
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface PolicyTerm {
  id: number;
  policy_id: number;
  term_type: TermType;
  effective_date: string;
  expiration_date: string;
  premium_amount: number;
  coverage_details?: any;
  terms_conditions?: string;
  status: TermStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type TermType = "original" | "renewal" | "amendment";
export type TermStatus = "draft" | "active" | "expired" | "cancelled";

// Installment and Payment Types
export interface Installment {
  id: number;
  policy_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  paid_date?: string;
  status: InstallmentStatus;
  grace_period_end?: string;
  late_fee_amount: number;
  payment_method?: string;
  transaction_reference?: string;
  notes?: string;
  credit_applied?: number;
  created_at: string;
  updated_at: string;
}

export type InstallmentStatus =
  | "pending"
  | "paid"
  | "overdue"
  | "waived"
  | "partial";

// Enhanced Installment Interface with additional computed properties
export interface EnhancedInstallment extends Installment {
  remaining_amount: number;
  total_amount_due: number;
  is_overdue: boolean;
  days_overdue?: number;
  credit_applied?: number;
  policy?: Policy;
}

// Installment Dashboard Types
export interface InstallmentDashboardStats {
  overview: {
    total_installments: number;
    paid_installments: number;
    pending_installments: number;
    overdue_installments: number;
    collection_rate: number;
  };
  financial: {
    total_outstanding: number;
    total_paid: number;
    total_late_fees: number;
    average_installment_amount: number;
  };
  overdue_breakdown: {
    "1-30_days": number;
    "31-60_days": number;
    "61-90_days": number;
    over_90_days: number;
  };
  monthly_collections: Array<{
    month: string;
    amount: number;
  }>;
}

export interface InstallmentFilters {
  status?: InstallmentStatus;
  due_from?: string;
  due_to?: string;
  policy_id?: number;
  customer_search?: string;
  per_page?: number;
  sort_by?: "due_date" | "amount" | "status" | "policy_number";
  sort_order?: "asc" | "desc";
}

export interface InstallmentSummary {
  installment: Installment;
  policy: {
    policy_number: string;
    customer_name?: string;
    plan_name?: string;
  };
  days_overdue?: number;
  grace_period_end?: string;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  last4?: string;
  brand?: string;
  isDefault: boolean;
  customer_id: number;
}

export type PaymentMethodType =
  | "cash"
  | "card"
  | "check"
  | "bank_transfer"
  | "online";

export interface PaymentRequest {
  installment_id: number;
  amount: number;
  payment_method: PaymentMethodType;
  payment_reference?: string;
  notes?: string;
  auto_apply_to_installments?: boolean;
}

export interface PaymentResult {
  success: boolean;
  transaction_id: string;
  amount: number;
  method: PaymentMethodType;
  timestamp: string;
  receipt_url?: string;
  installment_id: number;
  remaining_balance: number;
}

// Grace Period Types
export interface GracePeriod {
  id: number;
  policy_id: number;
  grace_period_start: string;
  grace_period_end: string;
  reason: string;
  status: GracePeriodStatus;
  resolution_action?: string;
  resolution_date?: string;
  notes?: string;
  created_by?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  notifications_sent: number;
  last_notification_date?: string;
  next_notification_date?: string;
  notification_history: string;
  policy?: Policy;
}

export type GracePeriodType = "payment" | "reinstatement" | "renewal";
export type GracePeriodStatus = "active" | "resolved" | "expired";
export type ResolutionType =
  | "payment_received"
  | "policy_lapsed"
  | "manual_override"
  | "reinstatement";

// Policy Reinstatement Types
export interface PolicyReinstatementRequest {
  id: number;
  policy_id: number;
  status: ReinstatementStatus;
  lapse_reason?: LapseReason;
  lapse_date?: string;
  reinstatement_request_date: string;
  outstanding_premium: number;
  late_fees: number;
  total_amount_due: number;
  requires_underwriting: boolean;
  requires_payment: boolean;
  underwriting_notes?: string;
  rejection_reason?: string;
  approved_date?: string;
  completed_date?: string;
  requested_by?: string;
  approved_by?: string;
  notes?: string;
  eligibility_checks?: any;
  created_at: string;
  updated_at: string;

  // Relationship data
  policy?: Policy;
  requestedBy?: UserData;
  approvedBy?: UserData;
}

export type ReinstatementStatus =
  | "pending_payment"
  | "pending_underwriting"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export type LapseReason =
  | "non_payment"
  | "voluntary_cancellation"
  | "underwriting_decline"
  | "fraud"
  | "other";

export interface ReinstatementRequest {
  lapse_reason: LapseReason;
  lapse_date?: string;
  force_underwriting?: boolean;
  notes?: string;
}

export interface ReinstatementResponse {
  reinstatement_request: PolicyReinstatementRequest;
  status: ReinstatementStatus;
  requires_payment: boolean;
  requires_underwriting: boolean;
  total_amount_due: number;
  outstanding_premium: number;
  late_fees: number;
  underwriting_reasons: string[];
  next_steps: string[];
  message: string;
}

export interface EligibilityResult {
  is_eligible: boolean;
  reasons: string[];
  checks: Record<string, EligibilityCheck>;
  days_since_lapse?: number;
}

export interface EligibilityCheck {
  check_name: string;
  passed: boolean;
  reason?: string;
  details?: any;
}

export interface ReinstatementPaymentRequest {
  payment_amount: number;
  payment_method: PaymentMethodType;
  payment_reference?: string;
  notes?: string;
}

export interface ReinstatementPaymentResult {
  payment_processed: number;
  remaining_due: number;
  new_status: ReinstatementStatus;
  is_fully_paid: boolean;
  processed_installments: ProcessedInstallment[];
  message: string;
}

export interface ProcessedInstallment {
  installment_id: number;
  installment_number: number;
  payment_applied: number;
  new_status: InstallmentStatus;
}

export interface UnderwritingReviewDetails {
  request: PolicyReinstatementRequest;
  policy: Policy;
  eligibility_checks: any;
  current_amounts: OutstandingAmounts;
  reinstatement_history: PolicyReinstatementRequest[];
  grace_period_history: GracePeriod[];
  risk_factors: RiskFactors;
  recommendation: UnderwritingRecommendation;
  review_checklist: ChecklistItem[];
}

export interface RiskFactors {
  risk_level: "low" | "medium" | "high";
  factors: string[];
  factor_count: number;
}

export interface UnderwritingRecommendation {
  recommendation: "APPROVE" | "DECLINE" | "REVIEW";
  confidence: "low" | "medium" | "high";
  notes?: string;
}

export interface ChecklistItem {
  description: string;
  completed: boolean;
  notes?: string;
}

export interface OutstandingAmounts {
  outstanding_premium: number;
  late_fees: number;
  total_amount_due: number;
  requires_payment: boolean;
  overdue_installment_count: number;
}

// Policy Amendment Types
export interface PolicyAmendment {
  id: number;
  policy_id: number;
  change_type: AmendmentType;
  details: any;
  status: AmendmentStatus;
  effective_date?: string;
  reason?: string;
  requested_by_customer: boolean;
  requires_approval: boolean;
  affects_premium: boolean;
  original_premium?: number;
  new_premium?: number;
  premium_difference?: number;
  original_values?: any;
  requested_by?: string;
  approved_by?: string;
  approved_at?: string;
  applied_at?: string;
  rejection_reason?: string;
  approval_notes?: string;
  application_notes?: string;
  supporting_documents?: string[];
  created_at: string;
  updated_at: string;

  // Relationship data
  policy?: Policy;
  requestedBy?: UserData;
  approvedBy?: UserData;
}

export type AmendmentType =
  | "coverage_modification"
  | "beneficiary_update"
  | "address_change"
  | "contact_update"
  | "plan_change"
  | "deductible_change";

export type AmendmentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "applied"
  | "cancelled";

export interface AmendmentRequest {
  change_type: AmendmentType;
  details: any;
  effective_date?: string;
  reason?: string;
  requested_by_customer?: boolean;
  supporting_documents?: File[];
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role?: string;
}

// Policy Analytics and Dashboard Types
export interface PolicyAnalytics {
  total_policies: number;
  active_policies: number;
  renewals_due: number;
  total_premium: number;
  outstanding_premiums: number;
  policies_in_grace: number;
  lapsed_policies: number;
  reinstatement_requests: number;
}

export interface PolicyStatusCounts {
  Active: number;
  Pending: number;
  Cancelled: number;
  Expired: number;
  Lapsed: number;
}

export interface PaymentStatusSummary {
  current_payments: number;
  overdue_payments: number;
  grace_period_payments: number;
  total_outstanding: number;
}

// Search and Filter Types
export interface PolicyFilters {
  status?: PolicyStatus[];
  customer_id?: number;
  customer_name?: string;
  policy_number?: string;
  premium_min?: number;
  premium_max?: number;
  start_date_from?: string;
  start_date_to?: string;
  plan_id?: number;
  has_outstanding_premium?: boolean;
  in_grace_period?: boolean;
  renewal_due_within_days?: number;
  expiring_soon?: number; // Number of days
}

export interface PolicySortOptions {
  field:
    | "id"
    | "policy_number"
    | "customer_name"
    | "premium_amount"
    | "start_date"
    | "status"
    | "outstanding_premium"
    | "created_at"
    | "updated_at";
  direction: "asc" | "desc";
}

// API Response Types
export interface PolicyListResponse {
  data: Policy[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface ApiError {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
  error_code?: string;
}

export interface ApiSuccess<T = any> {
  status: "success";
  data: T;
  message?: string;
  statistics?: any;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

// Component Props Types
export interface PolicyCardProps {
  policy: Policy;
  onViewDetails: (policyId: number) => void;
  onReinstate?: (policyId: number) => void;
  onProcessPayment?: (policyId: number) => void;
  onAmend?: (policyId: number) => void;
  onCancel?: (policyId: number) => void;
  onRenew?: (policyId: number) => void;
  showActions?: boolean;
}

export interface PolicyListProps {
  policies: Policy[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  filters?: PolicyFilters;
  onFiltersChange?: (filters: PolicyFilters) => void;
}

export interface PolicyDetailsProps {
  policy: Policy;
  onUpdate?: (policy: Policy) => void;
  onClose?: () => void;
}

export interface PolicyFormData {
  customer_id: number;
  plan_id: number;
  family_member_id?: number;
  premium_frequency: PremiumFrequency;
  start_date: string;
  end_date?: string;
  coverage_details?: any;
  beneficiary_info?: any;
  field_values?: any;
  auto_renew?: boolean;
}

export interface PolicyFormProps {
  initialData?: Partial<PolicyFormData>;
  onSubmit: (data: PolicyFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
  customerId?: number;
}

// Real-time Events Types
export interface PolicyStatusChangeEvent {
  policy_id: number;
  old_status: PolicyStatus;
  new_status: PolicyStatus;
  changed_at: string;
  changed_by?: string;
}

export interface PaymentProcessedEvent {
  installment_id: number;
  policy_id: number;
  amount: number;
  payment_method: PaymentMethodType;
  processed_at: string;
  processed_by?: string;
}

export interface ReinstatementStatusChangeEvent {
  request_id: number;
  policy_id: number;
  old_status: ReinstatementStatus;
  new_status: ReinstatementStatus;
  changed_at: string;
  changed_by?: string;
}

export interface WebSocketPolicyEvents {
  "policy.status.changed": PolicyStatusChangeEvent;
  "payment.processed": PaymentProcessedEvent;
  "payment.failed": PaymentProcessedEvent;
  "reinstatement.status.changed": ReinstatementStatusChangeEvent;
  "grace.period.started": { policy_id: number; grace_period_id: number };
  "grace.period.ended": { policy_id: number; grace_period_id: number };
}
