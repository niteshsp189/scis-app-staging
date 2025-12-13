
export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  position?: string;
  company?: string;
  location?: string;
  department: string;
  status: "Active" | "Inactive";
}

export interface PolicyAgent {
  id: string;
  policyId: number;
  agentId: string;
  agentName: string;
  agentType: "AOR" | "Writing Agent";
  assignedDate: string;
  aorLetterDate?: string; // Only for AOR assignments
  commissionRate: number;
  notes?: string;
  isActive: boolean;
}

export interface AgentAssignment {
  aor?: PolicyAgent;
  writingAgent?: PolicyAgent;
}
