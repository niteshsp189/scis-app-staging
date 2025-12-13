export interface PlanTypeField {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "boolean";
  included: boolean;
  required: boolean;
  options?: string[];
  defaultValue?: string;
}

export interface PlanType {
  id: number;
  name: string;
  description: string;
  category: string;
  status: "Active" | "Inactive" | "Draft";
  fields: PlanTypeField[];
  conflictRules?: number[]; // IDs of other plan types that can't coexist
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: number;
  name: string;
  description: string;
  companyId: number;
  companyName: string;
  planTypeId: number;
  planTypeName: string;
  status: "Active" | "Inactive" | "Draft";
  fieldValues: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

import { AgentAssignment } from "./agent";

export interface Policy {
  id: number;
  planId: number;
  planName: string;
  clientId: number;
  clientName: string;
  fieldValues: Record<string, any>;
  status: "Active" | "Inactive" | "Pending" | "Cancelled";
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  policyNumber?: string;
  agentAssignment?: AgentAssignment;
}
