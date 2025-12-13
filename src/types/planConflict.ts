export interface PlanConflictRule {
  id: number;
  firstPlanTypeId: number;
  secondPlanTypeId: number;
  severity: 'Block' | 'Warning';
  description: string;
  errorMessage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictValidationResult {
  hasConflict: boolean;
  severity: 'Block' | 'Warning' | null;
  message: string | null;
  conflictingPlanTypes: string[];
}
