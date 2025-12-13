
export interface SubTask {
  id: string;
  name: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  estimatedHours: number;
  actualHours?: number;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  assignee: string;
  phase: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  startDate: string;
  endDate: string;
  estimatedHours: number;
  actualHours?: number;
  dependencies?: string[];
  subtasks: SubTask[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  capacity: number; // hours per week
  currentLoad: number; // current hours assigned
}
