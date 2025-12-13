
import { TeamMember, Task } from '../types/project';

export const teamMembers: TeamMember[] = [
  { id: 'dev1', name: 'Developer 1', role: 'Frontend Developer', capacity: 40, currentLoad: 35 },
  { id: 'dev2', name: 'Developer 2', role: 'Frontend Developer', capacity: 40, currentLoad: 38 },
  { id: 'qa1', name: 'QA Engineer', role: 'Quality Assurance', capacity: 40, currentLoad: 30 }
];

export const tasks: Task[] = [
  {
    id: 'T1.1',
    name: 'Project Setup & Configuration',
    description: 'Set up development environment, configure tools, and establish workflows',
    assignee: 'dev1',
    phase: 'Phase 1: Foundation',
    priority: 'critical',
    status: 'completed',
    startDate: '2024-06-10',
    endDate: '2024-06-13',
    estimatedHours: 24,
    actualHours: 26,
    subtasks: [
      { id: 'S1.1.1', name: 'Initialize project repository', status: 'completed', estimatedHours: 4, actualHours: 4 },
      { id: 'S1.1.2', name: 'Configure package.json and dependencies', status: 'completed', estimatedHours: 6, actualHours: 8 },
      { id: 'S1.1.3', name: 'Set up CI/CD pipeline', status: 'completed', estimatedHours: 8, actualHours: 10 },
      { id: 'S1.1.4', name: 'Create development documentation', status: 'completed', estimatedHours: 4, actualHours: 3 },
      { id: 'S1.1.5', name: 'Configure code quality tools', status: 'completed', estimatedHours: 2, actualHours: 1 }
    ]
  },
  {
    id: 'T1.2',
    name: 'Backend API Integration Setup',
    description: 'Design API interfaces, set up mock data, and implement authentication',
    assignee: 'dev2',
    phase: 'Phase 1: Foundation',
    priority: 'high',
    status: 'in-progress',
    startDate: '2024-06-10',
    endDate: '2024-06-13',
    estimatedHours: 24,
    actualHours: 18,
    subtasks: [
      { id: 'S1.2.1', name: 'Define TypeScript interfaces', status: 'completed', estimatedHours: 6, actualHours: 6 },
      { id: 'S1.2.2', name: 'Create API service layers', status: 'completed', estimatedHours: 8, actualHours: 7 },
      { id: 'S1.2.3', name: 'Set up React Query configuration', status: 'in-progress', estimatedHours: 4, actualHours: 3 },
      { id: 'S1.2.4', name: 'Implement mock API responses', status: 'in-progress', estimatedHours: 4, actualHours: 2 },
      { id: 'S1.2.5', name: 'Create authentication context', status: 'not-started', estimatedHours: 2 }
    ]
  },
  {
    id: 'T2.1',
    name: 'Customer Module Enhancement',
    description: 'Enhance customer listing, search, detail views, and family management',
    assignee: 'dev1',
    phase: 'Phase 2: Customer Management',
    priority: 'high',
    status: 'not-started',
    startDate: '2024-06-17',
    endDate: '2024-06-24',
    estimatedHours: 40,
    dependencies: ['T1.1'],
    subtasks: [
      { id: 'S2.1.1', name: 'Fix customer overview tab issues', status: 'not-started', estimatedHours: 8 },
      { id: 'S2.1.2', name: 'Implement advanced search and filtering', status: 'not-started', estimatedHours: 12 },
      { id: 'S2.1.3', name: 'Create customer profile pages', status: 'not-started', estimatedHours: 10 },
      { id: 'S2.1.4', name: 'Add bulk operations', status: 'not-started', estimatedHours: 6 },
      { id: 'S2.1.5', name: 'Implement customer import/export', status: 'not-started', estimatedHours: 4 }
    ]
  },
  {
    id: 'T2.2',
    name: 'Customer Actions & Communication',
    description: 'Implement communication features, activity logging, and document management',
    assignee: 'dev2',
    phase: 'Phase 2: Customer Management',
    priority: 'medium',
    status: 'not-started',
    startDate: '2024-06-17',
    endDate: '2024-06-24',
    estimatedHours: 40,
    dependencies: ['T1.2'],
    subtasks: [
      { id: 'S2.2.1', name: 'Build email integration', status: 'not-started', estimatedHours: 12 },
      { id: 'S2.2.2', name: 'Create activity timeline', status: 'not-started', estimatedHours: 10 },
      { id: 'S2.2.3', name: 'Implement reminder notifications', status: 'not-started', estimatedHours: 8 },
      { id: 'S2.2.4', name: 'Add file upload functionality', status: 'not-started', estimatedHours: 6 },
      { id: 'S2.2.5', name: 'Create family relationship diagrams', status: 'not-started', estimatedHours: 4 }
    ]
  },
  {
    id: 'T2.3',
    name: 'Customer Module Testing',
    description: 'Comprehensive testing of customer CRUD operations and features',
    assignee: 'qa1',
    phase: 'Phase 2: Customer Management',
    priority: 'high',
    status: 'not-started',
    startDate: '2024-06-25',
    endDate: '2024-06-27',
    estimatedHours: 24,
    dependencies: ['T2.1', 'T2.2'],
    subtasks: [
      { id: 'S2.3.1', name: 'Test customer CRUD operations', status: 'not-started', estimatedHours: 6 },
      { id: 'S2.3.2', name: 'Verify search and filtering', status: 'not-started', estimatedHours: 4 },
      { id: 'S2.3.3', name: 'Test data validation', status: 'not-started', estimatedHours: 4 },
      { id: 'S2.3.4', name: 'Verify family member management', status: 'not-started', estimatedHours: 6 },
      { id: 'S2.3.5', name: 'Test communication features', status: 'not-started', estimatedHours: 4 }
    ]
  }
];

export const phases = [
  'Phase 1: Foundation',
  'Phase 2: Customer Management',
  'Phase 3: Leads & Pipeline',
  'Phase 4: Policy & Documents',
  'Phase 5: Advanced Features',
  'Phase 6: Mobile Optimization',
  'Phase 7: Final Testing'
];
