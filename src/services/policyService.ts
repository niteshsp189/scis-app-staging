import axios, { AxiosResponse } from "axios";
import {
  Policy,
  PolicyListResponse,
  PolicyFormData,
  PolicyReinstatementRequest,
  ReinstatementRequest,
  ReinstatementResponse,
  EligibilityResult,
  ReinstatementPaymentRequest,
  ReinstatementPaymentResult,
  UnderwritingReviewDetails,
  PolicyAmendment,
  AmendmentRequest,
  OutstandingAmounts,
  PaymentRequest,
  PaymentResult,
  Installment,
  EnhancedInstallment,
  InstallmentDashboardStats,
  InstallmentFilters,
  PolicyFilters,
  PolicySortOptions,
  ApiResponse,
  PolicyAnalytics,
  GracePeriod,
} from "@/types/policy";

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
    if (error.response?.status === 401) {
      // Don't automatically clear token - let AuthContext handle it
      console.warn("Authentication required - token may be expired");
    }
    return Promise.reject(error);
  },
);

export class PolicyService {
  // ========== POLICY CRUD OPERATIONS ==========

  /**
   * Get paginated list of policies with optional filters
   */
  static async getPolicies(
    page: number = 1,
    perPage: number = 15,
    filters?: PolicyFilters,
    sort?: PolicySortOptions,
  ): Promise<PolicyListResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("per_page", perPage.toString());

    // Add filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(`${key}[]`, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    // Add sorting
    if (sort) {
      params.append("sort_by", sort.field);
      params.append("sort_direction", sort.direction);
    }

    const response: AxiosResponse<ApiResponse<PolicyListResponse>> =
      await api.get(`/policies?${params.toString()}`);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get single policy by ID with related data
   */
  static async getPolicy(
    id: number,
    include?: string[],
  ): Promise<{ data: Policy }> {
    const params = new URLSearchParams();
    if (include && include.length > 0) {
      params.append("include", include.join(","));
    }

    const response = await api.get(`/policies/${id}?${params.toString()}`);

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch policy");
    }

    return { data: response.data.data };
  }

  /**
   * Create new policy
   */
  static async createPolicy(data: PolicyFormData): Promise<Policy> {
    const response: AxiosResponse<ApiResponse<Policy>> = await api.post(
      "/policies",
      data,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Update policy status
   */
  static async updatePolicyStatus(
    id: number,
    status: string,
  ): Promise<Policy> {
    const response: AxiosResponse<ApiResponse<Policy>> = await api.patch(
      `/policies/${id}/status`,
      { status },
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Associate a policy with a dependent (new method)
   */
  static async associatePolicyWithDependent(
    policyId: number,
    dependentId: number,
    options?: {
      isPrimaryBeneficiary?: boolean;
      coveragePercentage?: number;
      notes?: string;
    },
  ): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await api.post(
      `/policies/${policyId}/dependents`,
      {
        dependent_id: dependentId,
        is_primary_beneficiary: options?.isPrimaryBeneficiary || false,
        coverage_percentage: options?.coveragePercentage,
        notes: options?.notes,
      },
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  }

  /**
   * Remove policy association from a dependent (new method)
   */
  static async disassociatePolicyFromDependent(
    policyId: number,
    dependentId: number,
  ): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await api.delete(
      `/policies/${policyId}/dependents/${dependentId}`,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  }

  /**
   * Get dependents associated with a policy (new method)
   */
  static async getPolicyDependents(policyId: number): Promise<any[]> {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get(
      `/policies/${policyId}/dependents`,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Update policy associations for multiple dependents (new method)
   */
  static async updatePolicyDependents(
    policyId: number,
    dependentIds: number[],
  ): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await api.put(
      `/policies/${policyId}/dependents`,
      {
        dependent_ids: dependentIds,
      },
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  }

  /**
   * Simple update for family member assignment only (DEPRECATED - use associatePolicyWithDependent)
   */
  static async updatePolicyFamilyMember(
    id: number,
    familyMemberId: number | null,
  ): Promise<Policy> {
    console.warn(
      "updatePolicyFamilyMember is deprecated. Use associatePolicyWithDependent/disassociatePolicyFromDependent instead.",
    );

    // For backward compatibility during transition, use the new association method
    if (familyMemberId) {
      await this.associatePolicyWithDependent(id, familyMemberId, {
        isPrimaryBeneficiary: true,
        coveragePercentage: 100,
        notes: "Legacy family member assignment",
      });
    }

    // Return the updated policy
    const policyResponse = await this.getPolicy(id);
    return policyResponse.data;
  }

  /**
   * Delete policy
   */
  static async deletePolicy(id: number): Promise<void> {
    const response: AxiosResponse<ApiResponse> = await api.delete(
      `/policies/${id}`,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  }

  // ========== POLICY ANALYTICS ==========

  /**
   * Get policy analytics and statistics
   */
  static async getAnalytics(): Promise<PolicyAnalytics> {
    const response: AxiosResponse<ApiResponse<PolicyAnalytics>> = await api.get(
      "/policies/analytics",
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  // ========== POLICY REINSTATEMENT ==========

  /**
   * Check policy eligibility for reinstatement
   */
  static async checkReinstatementEligibility(
    policyId: number,
    lapseReason?: string,
    lapseDate?: string,
  ): Promise<EligibilityResult> {
    const params = new URLSearchParams();
    if (lapseReason) params.append("lapse_reason", lapseReason);
    if (lapseDate) params.append("lapse_date", lapseDate);

    const response: AxiosResponse<ApiResponse<EligibilityResult>> =
      await api.get(
        `/policies/${policyId}/reinstatement/eligibility?${params.toString()}`,
      );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Initiate policy reinstatement
   */
  static async initiateReinstatement(
    policyId: number,
    request: ReinstatementRequest,
  ): Promise<ReinstatementResponse> {
    const response: AxiosResponse<ApiResponse<ReinstatementResponse>> =
      await api.post(`/policies/${policyId}/reinstate`, request);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get reinstatement requests for a policy
   */
  static async getReinstatementRequests(
    policyId: number,
  ): Promise<PolicyReinstatementRequest[]> {
    const response: AxiosResponse<ApiResponse<PolicyReinstatementRequest[]>> =
      await api.get(`/policies/${policyId}/reinstatement-requests`);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Process payment for reinstatement request
   */
  static async processReinstatementPayment(
    requestId: number,
    payment: ReinstatementPaymentRequest,
  ): Promise<ReinstatementPaymentResult> {
    const response: AxiosResponse<ApiResponse<ReinstatementPaymentResult>> =
      await api.post(
        `/policies/reinstatement-requests/${requestId}/payment`,
        payment,
      );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Approve reinstatement request (underwriting)
   */
  static async approveReinstatement(
    requestId: number,
    notes?: string,
  ): Promise<PolicyReinstatementRequest> {
    const response: AxiosResponse<ApiResponse<PolicyReinstatementRequest>> =
      await api.post(`/policies/reinstatement-requests/${requestId}/approve`, {
        notes,
      });

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Reject reinstatement request (underwriting)
   */
  static async rejectReinstatement(
    requestId: number,
    reason: string,
    notes?: string,
  ): Promise<PolicyReinstatementRequest> {
    const response: AxiosResponse<ApiResponse<PolicyReinstatementRequest>> =
      await api.post(`/policies/reinstatement-requests/${requestId}/reject`, {
        reason,
        notes,
      });

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Complete reinstatement request
   */
  static async completeReinstatement(requestId: number): Promise<{
    policy: Policy;
    request: PolicyReinstatementRequest;
    status: string;
    message: string;
  }> {
    const response: AxiosResponse<ApiResponse> = await api.post(
      `/policies/reinstatement-requests/${requestId}/complete`,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get pending underwriting requests
   */
  static async getPendingUnderwritingRequests(
    page: number = 1,
    perPage: number = 15,
  ): Promise<PolicyListResponse> {
    const response: AxiosResponse<ApiResponse<PolicyListResponse>> =
      await api.get(
        `/policies/reinstatement-requests/pending-underwriting?page=${page}&per_page=${perPage}`,
      );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get underwriting queue statistics
   */
  static async getUnderwritingQueueStats(): Promise<{
    pending_count: number;
    approved_today: number;
    rejected_today: number;
    average_processing_time_hours: number;
    oldest_pending_days: number;
  }> {
    const response: AxiosResponse<ApiResponse> = await api.get(
      "/policies/reinstatement-requests/underwriting-stats",
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Add underwriting notes to reinstatement request
   */
  static async addUnderwritingNotes(
    requestId: number,
    notes: string,
  ): Promise<PolicyReinstatementRequest> {
    const response: AxiosResponse<ApiResponse<PolicyReinstatementRequest>> =
      await api.post(
        `/policies/reinstatement-requests/${requestId}/underwriting-notes`,
        { notes },
      );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get underwriting review details
   */
  static async getUnderwritingReviewDetails(
    requestId: number,
  ): Promise<UnderwritingReviewDetails> {
    const response: AxiosResponse<ApiResponse<UnderwritingReviewDetails>> =
      await api.get(
        `/policies/reinstatement-requests/${requestId}/review-details`,
      );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  // ========== PAYMENT PROCESSING ==========

  /**
   * Get policy installments
   */
  static async getInstallments(policyId: number): Promise<Installment[]> {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/policies/${policyId}/installments`,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    // Log the response data to inspect it

    // Extract installments from the nested structure
    const installments = response.data.data.installments || [];

    // Process installments to calculate credit_applied if it's not present
    // We can infer it from transaction_reference that includes "CREDIT"
    return installments.map((installment: any) => {
      const isCredit =
        installment.transaction_reference &&
        installment.transaction_reference.includes("CREDIT");

      // If this is a credit transaction but credit_applied is not set
      if (isCredit && !installment.credit_applied) {
        // Set credit_applied based on the paid_amount if it has "CREDIT" in the reference
        return {
          ...installment,
          credit_applied: installment.paid_amount,
          // Set paid_amount to 0 if it was actually a credit, not a payment
          paid_amount: 0,
        };
      }

      return installment;
    });
  }

  /**
   * Get policy installments (alias for compatibility)
   */
  static async getPolicyInstallments(
    policyId: number,
  ): Promise<{ data: Installment[] }> {
    const installments = await this.getInstallments(policyId);
    return { data: installments };
  }

  /**
   * Process payment for installment
   */
  static async processPayment(
    policyId: number,
    installmentId: number,
    payment: {
      amount: number;
      transaction_reference: string;
      payment_method: string;
      notes?: string;
    },
  ): Promise<PaymentResult> {
    const response: AxiosResponse<ApiResponse<PaymentResult>> = await api.post(
      `/policies/${policyId}/installments/${installmentId}/payment`,
      payment,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Process advance payment for policy
   */
  static async processAdvancePayment(
    policyId: number,
    payment: {
      amount: number;
      transaction_reference: string;
      payment_method: string;
      notes?: string;
      auto_apply_to_installments?: boolean;
    },
  ): Promise<PaymentResult> {
    const response: AxiosResponse<ApiResponse<PaymentResult>> = await api.post(
      `/policies/${policyId}/advance-payment`,
      payment,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get policy credit balance
   */
  static async getCreditBalance(policyId: number): Promise<{
    total_credit_balance: number;
    credit_history: any[];
  }> {
    const response: AxiosResponse<
      ApiResponse<{
        total_credit_balance: number;
        credit_history: any[];
      }>
    > = await api.get(`/policies/${policyId}/credit-balance`);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get outstanding amounts for policy
   */
  static async getOutstandingAmounts(
    policyId: number,
  ): Promise<OutstandingAmounts> {
    const response: AxiosResponse<ApiResponse<OutstandingAmounts>> =
      await api.get(`/policies/${policyId}/outstanding-amounts`);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get installment statistics for a policy
   */
  static async getInstallmentStatistics(policyId: number): Promise<any> {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/policies/${policyId}/installments`,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    // Extract statistics from the nested structure
    return response.data.data.statistics || {};
  }

  /**
   * Waive installment
   */
  static async waiveInstallment(
    installmentId: number,
    reason: string,
  ): Promise<Installment> {
    const response: AxiosResponse<ApiResponse<Installment>> = await api.post(
      `/policies/installments/${installmentId}/waive`,
      { reason },
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Apply late fee to installment
   */
  static async applyLateFee(
    installmentId: number,
    amount?: number,
  ): Promise<Installment> {
    const response: AxiosResponse<ApiResponse<Installment>> = await api.post(
      `/policies/installments/${installmentId}/late-fee`,
      { amount },
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  // ========== INSTALLMENT DASHBOARD METHODS ==========

  /**
   * Get installment dashboard statistics
   */
  static async getInstallmentDashboardStats(): Promise<InstallmentDashboardStats> {
    const response: AxiosResponse<ApiResponse<InstallmentDashboardStats>> =
      await api.get("/installments/dashboard-stats");

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get all installments with filtering
   */
  static async getAllInstallments(filters: InstallmentFilters = {}): Promise<{
    data: EnhancedInstallment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  }> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/installments?${params.toString()}`,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get overdue installments
   */
  static async getOverdueInstallments(
    agentId?: number,
    daysOverdue?: number,
  ): Promise<{
    data: EnhancedInstallment[];
    summary: {
      total_overdue_installments: number;
      total_overdue_amount: number;
      average_days_overdue: number;
    };
  }> {
    const params = new URLSearchParams();

    if (agentId) {
      params.append("agent_id", agentId.toString());
    }

    if (daysOverdue) {
      params.append("days_overdue", daysOverdue.toString());
    }

    const response: AxiosResponse<ApiResponse<any>> = await api.get(
      `/installments/overdue?${params.toString()}`,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data;
  }

  // ========== POLICY AMENDMENTS ==========

  /**
   * Create amendment request
   */
  static async createAmendment(
    policyId: number,
    amendment: AmendmentRequest,
  ): Promise<PolicyAmendment> {
    const response: AxiosResponse<ApiResponse<PolicyAmendment>> =
      await api.post(`/policies/${policyId}/amendments`, amendment);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get policy amendments
   */
  static async getAmendments(policyId: number): Promise<PolicyAmendment[]> {
    const response: AxiosResponse<ApiResponse<PolicyAmendment[]>> =
      await api.get(`/policies/${policyId}/amendments`);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Approve amendment
   */
  static async approveAmendment(
    amendmentId: number,
    notes?: string,
  ): Promise<PolicyAmendment> {
    const response: AxiosResponse<ApiResponse<PolicyAmendment>> =
      await api.post(`/policies/amendments/${amendmentId}/approve`, { notes });

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Reject amendment
   */
  static async rejectAmendment(
    amendmentId: number,
    reason: string,
  ): Promise<PolicyAmendment> {
    const response: AxiosResponse<ApiResponse<PolicyAmendment>> =
      await api.post(`/policies/amendments/${amendmentId}/reject`, { reason });

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Apply approved amendment
   */
  static async applyAmendment(amendmentId: number): Promise<PolicyAmendment> {
    const response: AxiosResponse<ApiResponse<PolicyAmendment>> =
      await api.post(`/policies/amendments/${amendmentId}/apply`);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  // ========== GRACE PERIODS ==========

  /**
   * Get policy grace periods
   */
  static async getGracePeriods(policyId: number): Promise<GracePeriod[]> {
    const response: AxiosResponse<ApiResponse<GracePeriod[]>> = await api.get(
      `/policies/${policyId}/grace-periods`,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get all active grace periods
   */
  static async getActiveGracePeriods(): Promise<GracePeriod[]> {
    const response: AxiosResponse<ApiResponse<{ data: GracePeriod[] }>> =
      await api.get("/grace-periods/active");

    if (response.data.status !== "success") {
      throw new Error(
        response.data.message || "Failed to fetch active grace periods",
      );
    }

    // Handle paginated response - extract the actual grace periods array
    return response.data.data.data;
  }

  /**
   * Send grace period reminder
   * @param gracePeriodId The ID of the grace period to send reminder for
   * @throws {Error} If the reminder cannot be sent, with a descriptive message
   */
  static async sendGracePeriodReminder(gracePeriodId: number): Promise<void> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.post(
        `/grace-periods/${gracePeriodId}/send-reminder`,
      );

      // Check for both success field and status field for API compatibility
      if (
        response.data.status === "error" ||
        (response.data.success !== undefined && !response.data.success)
      ) {
        throw new Error(response.data.message || "Failed to send reminder");
      }

      return response.data;
    } catch (error: unknown) {
      console.error("Error in sendGracePeriodReminder:", error);

      // Handle Axios errors specifically
      if (axios.isAxiosError(error)) {
        interface ErrorResponse {
          message?: string;
          status?: string;
        }
        const responseData = error.response?.data as ErrorResponse | undefined;
        const status = error.response?.status;

        // Provide more specific error messages based on status code
        if (status === 400) {
          throw new Error(
            responseData?.message ||
              "Invalid request. The grace period may not be active.",
          );
        } else if (status === 401) {
          throw new Error("Authentication required. Please log in again.");
        } else if (status === 403) {
          throw new Error("You do not have permission to send this reminder.");
        } else if (status === 404) {
          throw new Error("Grace period not found.");
        } else if (status && status >= 500) {
          throw new Error("Server error. Please try again later.");
        }
      }

      // For non-Axios errors or unhandled cases
      if (error instanceof Error) {
        throw error; // Re-throw with original error message
      }

      throw new Error("An unknown error occurred while sending the reminder.");
    }
  }

  // ========== POLICY ACTIONS ==========

  /**
   * Cancel policy
   */
  static async cancelPolicy(
    policyId: number,
    data: {
      cancellation_type: string;
      cancellation_reason: string;
      effective_date: string;
      immediate?: boolean;
    },
  ): Promise<{
    policy_id: number;
    cancellation_type: string;
    effective_date: string;
    scheduled: boolean;
    refund_amount: number;
    message: string;
  }> {
    const response: AxiosResponse<ApiResponse> = await api.post(
      `/policies/${policyId}/cancel`,
      data,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Cancel policy using simplified form (for manual record-keeping system)
   */
  static async cancelPolicySimplified(
    policyId: number,
    data: {
      cancellation_reason: string;
      cancellation_date?: string;
      cancellation_time?: string;
    },
  ): Promise<{
    policy_id: number;
    status: string;
    cancellation_date: string;
    cancellation_reason: string;
  }> {
    const response: AxiosResponse<ApiResponse> = await api.post(
      `/policies/${policyId}/cancel-simplified`,
      data,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Renew policy
   */
  static async renewPolicy(
    policyId: number,
    data?: {
      new_premium?: number;
      new_terms?: Record<string, unknown>;
      effective_date?: string;
    },
  ): Promise<Policy> {
    const response: AxiosResponse<ApiResponse<Policy>> = await api.post(
      `/policies/${policyId}/renew`,
      data || {},
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Suspend policy
   */
  static async suspendPolicy(
    policyId: number,
    reason: string,
  ): Promise<Policy> {
    const response: AxiosResponse<ApiResponse<Policy>> = await api.post(
      `/policies/${policyId}/suspend`,
      { reason },
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  // ========== BULK OPERATIONS ==========

  /**
   * Process bulk payment for multiple installments
   */
  static async processBulkPayments(
    payments: Array<{
      installment_id: number;
      amount: number;
      payment_method: string;
      notes?: string;
    }>,
  ): Promise<PaymentResult[]> {
    const response: AxiosResponse<ApiResponse<PaymentResult[]>> =
      await api.post("/policies/bulk-payments", { payments });

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Bulk update policy statuses
   */
  static async bulkUpdateStatus(
    policyIds: number[],
    status: string,
    reason?: string,
  ): Promise<{ updated_count: number; failed_count: number }> {
    const response: AxiosResponse<ApiResponse> = await api.post(
      "/policies/bulk-update-status",
      { policy_ids: policyIds, status, reason },
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  // ========== UTILITY METHODS ==========

  /**
   * Search policies
   */
  static async searchPolicies(query: string): Promise<Policy[]> {
    const response: AxiosResponse<ApiResponse<Policy[]>> = await api.get(
      `/policies/search?q=${encodeURIComponent(query)}`,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Get policy audit logs
   */
  static async getAuditLogs(
    policyId: number,
  ): Promise<Array<Record<string, unknown>>> {
    const response: AxiosResponse<ApiResponse<Array<Record<string, unknown>>>> =
      await api.get(`/policies/${policyId}/audits`);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Export policies to CSV
   */
  static async exportPolicies(filters?: PolicyFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/policies/export?${params.toString()}`, {
      responseType: "blob",
    });

    return response.data;
  }

  /**
   * Get policy statistics for dashboard
   */
  static async getDashboardStats(): Promise<{
    total_policies: number;
    active_policies: number;
    cancelled_policies: number;
    overdue_payments: number;
    grace_period_policies: number;
    pending_reinstatements: number;
    pending_amendments: number;
    total_outstanding: number;
    collection_rate: number;
  }> {
    const response: AxiosResponse<ApiResponse> = await api.get(
      "/policies/dashboard-stats",
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }

  /**
   * Apply available credits to pending installments for a policy
   * @param policyId The policy ID
   * @param options Options for applying credits
   * @param options.prioritizePartiallyPaid If true, prioritize installments that are already partially paid
   * @param options.startFromEarliest If true, start from the earliest installments first
   */
  static async applyCreditsToInstallments(
    policyId: number,
    options: {
      prioritizePartiallyPaid?: boolean;
      startFromEarliest?: boolean;
    } = {},
  ): Promise<{
    success: boolean;
    applied_amount: number;
    updated_installments: number;
    remaining_credit: number;
  }> {
    const response: AxiosResponse<ApiResponse> = await api.post(
      `/policies/${policyId}/credits/apply`,
      options,
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data.data;
  }
}

export default PolicyService;
