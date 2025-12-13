
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Database,
  Shield,
  FileText,
  Settings,
  TrendingUp
} from "lucide-react";

interface ApiEndpoint {
  id: string;
  name: string;
  method: string;
  endpoint: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'In Progress' | 'Testing' | 'Completed' | 'Blocked';
  estimatedHours: number;
  actualHours?: number;
  assignedDeveloper?: string;
  dependencies?: string[];
  dueDate: string;
  notes?: string;
}

interface ApiModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  estimatedWeeks: number;
  endpoints: ApiEndpoint[];
  phase: 1 | 2 | 3 | 4;
}

const apiModules: ApiModule[] = [
  {
    id: 'auth',
    name: 'Authentication & User Management',
    description: 'Core authentication system and user management',
    icon: <Shield className="h-5 w-5" />,
    priority: 'Critical',
    estimatedWeeks: 2,
    phase: 1,
    endpoints: [
      { id: 'auth-1', name: 'User Login', method: 'POST', endpoint: '/api/auth/login', priority: 'Critical', status: 'Not Started', estimatedHours: 8, dueDate: '2024-07-01' },
      { id: 'auth-2', name: 'User Registration', method: 'POST', endpoint: '/api/auth/register', priority: 'Critical', status: 'Not Started', estimatedHours: 6, dueDate: '2024-07-01' },
      { id: 'auth-3', name: 'User Logout', method: 'POST', endpoint: '/api/auth/logout', priority: 'High', status: 'Not Started', estimatedHours: 4, dueDate: '2024-07-02' },
      { id: 'auth-4', name: 'Get Current User', method: 'GET', endpoint: '/api/auth/me', priority: 'High', status: 'Not Started', estimatedHours: 4, dueDate: '2024-07-02' },
      { id: 'auth-5', name: 'Update Profile', method: 'PUT', endpoint: '/api/auth/profile', priority: 'Medium', status: 'Not Started', estimatedHours: 6, dueDate: '2024-07-03' },
      { id: 'auth-6', name: 'Change Password', method: 'POST', endpoint: '/api/auth/change-password', priority: 'Medium', status: 'Not Started', estimatedHours: 5, dueDate: '2024-07-03' },
      { id: 'auth-7', name: 'Forgot Password', method: 'POST', endpoint: '/api/auth/forgot-password', priority: 'Medium', status: 'Not Started', estimatedHours: 8, dueDate: '2024-07-04' },
      { id: 'auth-8', name: 'Reset Password', method: 'POST', endpoint: '/api/auth/reset-password', priority: 'Medium', status: 'Not Started', estimatedHours: 6, dueDate: '2024-07-04' }
    ]
  },
  {
    id: 'dashboard',
    name: 'Dashboard Analytics',
    description: 'Dashboard statistics and analytics endpoints',
    icon: <TrendingUp className="h-5 w-5" />,
    priority: 'High',
    estimatedWeeks: 1,
    phase: 1,
    endpoints: [
      { id: 'dash-1', name: 'Dashboard Stats', method: 'GET', endpoint: '/api/dashboard/stats', priority: 'Critical', status: 'Not Started', estimatedHours: 12, dueDate: '2024-07-05', dependencies: ['auth-1'] },
      { id: 'dash-2', name: 'Reminders', method: 'GET', endpoint: '/api/dashboard/reminders', priority: 'High', status: 'Not Started', estimatedHours: 8, dueDate: '2024-07-06' },
      { id: 'dash-3', name: 'Customer Notes', method: 'GET', endpoint: '/api/dashboard/customer-notes', priority: 'Medium', status: 'Not Started', estimatedHours: 6, dueDate: '2024-07-06' },
      { id: 'dash-4', name: 'Activities Overview', method: 'GET', endpoint: '/api/dashboard/activities', priority: 'Medium', status: 'Not Started', estimatedHours: 8, dueDate: '2024-07-07' }
    ]
  },
  {
    id: 'customers',
    name: 'Customer Management',
    description: 'Complete customer lifecycle management',
    icon: <Users className="h-5 w-5" />,
    priority: 'Critical',
    estimatedWeeks: 3,
    phase: 2,
    endpoints: [
      { id: 'cust-1', name: 'List Customers', method: 'GET', endpoint: '/api/customers', priority: 'Critical', status: 'Not Started', estimatedHours: 16, dueDate: '2024-07-08' },
      { id: 'cust-2', name: 'Create Customer', method: 'POST', endpoint: '/api/customers', priority: 'Critical', status: 'Not Started', estimatedHours: 12, dueDate: '2024-07-09' },
      { id: 'cust-3', name: 'Get Customer Details', method: 'GET', endpoint: '/api/customers/{id}', priority: 'Critical', status: 'Not Started', estimatedHours: 8, dueDate: '2024-07-10' },
      { id: 'cust-4', name: 'Update Customer', method: 'PUT', endpoint: '/api/customers/{id}', priority: 'High', status: 'Not Started', estimatedHours: 10, dueDate: '2024-07-11' },
      { id: 'cust-5', name: 'Delete Customer', method: 'DELETE', endpoint: '/api/customers/{id}', priority: 'Medium', status: 'Not Started', estimatedHours: 6, dueDate: '2024-07-12' },
      { id: 'cust-6', name: 'Bulk Upload', method: 'POST', endpoint: '/api/customers/upload', priority: 'High', status: 'Not Started', estimatedHours: 20, dueDate: '2024-07-15' },
      { id: 'cust-7', name: 'Customer Statistics', method: 'GET', endpoint: '/api/customers/stats', priority: 'Medium', status: 'Not Started', estimatedHours: 8, dueDate: '2024-07-16' },
      { id: 'cust-8', name: 'Customer Policies', method: 'GET', endpoint: '/api/customers/{id}/policies', priority: 'High', status: 'Not Started', estimatedHours: 10, dueDate: '2024-07-17' },
      { id: 'cust-9', name: 'Customer Activities', method: 'GET', endpoint: '/api/customers/{id}/activities', priority: 'Medium', status: 'Not Started', estimatedHours: 8, dueDate: '2024-07-18' },
      { id: 'cust-10', name: 'Customer Documents', method: 'GET', endpoint: '/api/customers/{id}/documents', priority: 'Medium', status: 'Not Started', estimatedHours: 8, dueDate: '2024-07-19' },
      { id: 'cust-11', name: 'Add Customer Note', method: 'POST', endpoint: '/api/customers/{id}/notes', priority: 'Medium', status: 'Not Started', estimatedHours: 6, dueDate: '2024-07-20' },
      { id: 'cust-12', name: 'Update Customer Note', method: 'PUT', endpoint: '/api/customers/{id}/notes/{noteId}', priority: 'Low', status: 'Not Started', estimatedHours: 4, dueDate: '2024-07-21' },
      { id: 'cust-13', name: 'Delete Customer Note', method: 'DELETE', endpoint: '/api/customers/{id}/notes/{noteId}', priority: 'Low', status: 'Not Started', estimatedHours: 4, dueDate: '2024-07-22' }
    ]
  },
  {
    id: 'leads',
    name: 'Lead Management',
    description: 'Lead tracking and conversion system',
    icon: <TrendingUp className="h-5 w-5" />,
    priority: 'High',
    estimatedWeeks: 2,
    phase: 2,
    endpoints: [
      { id: 'lead-1', name: 'List Leads', method: 'GET', endpoint: '/api/leads', priority: 'Critical', status: 'Not Started', estimatedHours: 14, dueDate: '2024-07-23' },
      { id: 'lead-2', name: 'Create Lead', method: 'POST', endpoint: '/api/leads', priority: 'Critical', status: 'Not Started', estimatedHours: 10, dueDate: '2024-07-24' },
      { id: 'lead-3', name: 'Get Lead Details', method: 'GET', endpoint: '/api/leads/{id}', priority: 'High', status: 'Not Started', estimatedHours: 6, dueDate: '2024-07-25' },
      { id: 'lead-4', name: 'Update Lead', method: 'PUT', endpoint: '/api/leads/{id}', priority: 'High', status: 'Not Started', estimatedHours: 8, dueDate: '2024-07-26' },
      { id: 'lead-5', name: 'Delete Lead', method: 'DELETE', endpoint: '/api/leads/{id}', priority: 'Medium', status: 'Not Started', estimatedHours: 4, dueDate: '2024-07-27' },
      { id: 'lead-6', name: 'Bulk Upload Leads', method: 'POST', endpoint: '/api/leads/upload', priority: 'High', status: 'Not Started', estimatedHours: 16, dueDate: '2024-07-29' },
      { id: 'lead-7', name: 'Convert Lead', method: 'POST', endpoint: '/api/leads/{id}/convert', priority: 'Critical', status: 'Not Started', estimatedHours: 12, dueDate: '2024-07-30' },
      { id: 'lead-8', name: 'Update Lead Status', method: 'PUT', endpoint: '/api/leads/{id}/status', priority: 'High', status: 'Not Started', estimatedHours: 6, dueDate: '2024-07-31' },
      { id: 'lead-9', name: 'Reassign Lead', method: 'PUT', endpoint: '/api/leads/{id}/reassign', priority: 'Medium', status: 'Not Started', estimatedHours: 8, dueDate: '2024-08-01' },
      { id: 'lead-10', name: 'Agent Workload', method: 'GET', endpoint: '/api/leads/agent-workload', priority: 'Medium', status: 'Not Started', estimatedHours: 10, dueDate: '2024-08-02' },
      { id: 'lead-11', name: 'Eligibility Check', method: 'POST', endpoint: '/api/leads/{id}/eligibility-check', priority: 'High', status: 'Not Started', estimatedHours: 14, dueDate: '2024-08-03' }
    ]
  },
  {
    id: 'policies',
    name: 'Policy Management',
    description: 'Insurance policy lifecycle management',
    icon: <FileText className="h-5 w-5" />,
    priority: 'Critical',
    estimatedWeeks: 3,
    phase: 3,
    endpoints: [
      { id: 'pol-1', name: 'List Policies', method: 'GET', endpoint: '/api/policies', priority: 'Critical', status: 'Not Started', estimatedHours: 16, dueDate: '2024-08-05' },
      { id: 'pol-2', name: 'Create Policy', method: 'POST', endpoint: '/api/policies', priority: 'Critical', status: 'Not Started', estimatedHours: 20, dueDate: '2024-08-07' },
      { id: 'pol-3', name: 'Get Policy Details', method: 'GET', endpoint: '/api/policies/{id}', priority: 'Critical', status: 'Not Started', estimatedHours: 8, dueDate: '2024-08-08' },
      { id: 'pol-4', name: 'Update Policy', method: 'PUT', endpoint: '/api/policies/{id}', priority: 'High', status: 'Not Started', estimatedHours: 12, dueDate: '2024-08-09' },
      { id: 'pol-5', name: 'Delete Policy', method: 'DELETE', endpoint: '/api/policies/{id}', priority: 'Medium', status: 'Not Started', estimatedHours: 6, dueDate: '2024-08-10' },
      { id: 'pol-6', name: 'Renew Policy', method: 'POST', endpoint: '/api/policies/{id}/renew', priority: 'High', status: 'Not Started', estimatedHours: 14, dueDate: '2024-08-12' },
      { id: 'pol-7', name: 'Policy Analytics', method: 'GET', endpoint: '/api/policies/analytics', priority: 'Medium', status: 'Not Started', estimatedHours: 12, dueDate: '2024-08-14' },
      { id: 'pol-8', name: 'Policy Distribution', method: 'GET', endpoint: '/api/policies/distribution', priority: 'Medium', status: 'Not Started', estimatedHours: 8, dueDate: '2024-08-15' },
      { id: 'pol-9', name: 'Update Agent Assignments', method: 'PUT', endpoint: '/api/policies/{id}/agents', priority: 'High', status: 'Not Started', estimatedHours: 10, dueDate: '2024-08-16' }
    ]
  },
  {
    id: 'insurance',
    name: 'Insurance Products',
    description: 'Insurance companies, products, and plans management',
    icon: <Database className="h-5 w-5" />,
    priority: 'High',
    estimatedWeeks: 2,
    phase: 3,
    endpoints: [
      { id: 'ins-1', name: 'List Companies', method: 'GET', endpoint: '/api/insurance/companies', priority: 'High', status: 'Not Started', estimatedHours: 8, dueDate: '2024-08-17' },
      { id: 'ins-2', name: 'Create Company', method: 'POST', endpoint: '/api/insurance/companies', priority: 'High', status: 'Not Started', estimatedHours: 10, dueDate: '2024-08-18' },
      { id: 'ins-3', name: 'List Products', method: 'GET', endpoint: '/api/insurance/products', priority: 'High', status: 'Not Started', estimatedHours: 12, dueDate: '2024-08-19' },
      { id: 'ins-4', name: 'Create Product', method: 'POST', endpoint: '/api/insurance/products', priority: 'High', status: 'Not Started', estimatedHours: 14, dueDate: '2024-08-20' },
      { id: 'ins-5', name: 'List Plans', method: 'GET', endpoint: '/api/insurance/plans', priority: 'High', status: 'Not Started', estimatedHours: 12, dueDate: '2024-08-21' },
      { id: 'ins-6', name: 'Create Plan', method: 'POST', endpoint: '/api/insurance/plans', priority: 'High', status: 'Not Started', estimatedHours: 16, dueDate: '2024-08-22' },
      { id: 'ins-7', name: 'List Plan Types', method: 'GET', endpoint: '/api/insurance/plan-types', priority: 'Medium', status: 'Not Started', estimatedHours: 8, dueDate: '2024-08-23' },
      { id: 'ins-8', name: 'Create Plan Type', method: 'POST', endpoint: '/api/insurance/plan-types', priority: 'Medium', status: 'Not Started', estimatedHours: 12, dueDate: '2024-08-24' }
    ]
  },
  {
    id: 'settings',
    name: 'Settings & Configuration',
    description: 'System settings and configuration management',
    icon: <Settings className="h-5 w-5" />,
    priority: 'Medium',
    estimatedWeeks: 2,
    phase: 4,
    endpoints: [
      { id: 'set-1', name: 'Organization Settings', method: 'GET', endpoint: '/api/settings/organization', priority: 'Medium', status: 'Not Started', estimatedHours: 8, dueDate: '2024-08-26' },
      { id: 'set-2', name: 'Update Organization', method: 'PUT', endpoint: '/api/settings/organization', priority: 'Medium', status: 'Not Started', estimatedHours: 10, dueDate: '2024-08-27' },
      { id: 'set-3', name: 'List Employees', method: 'GET', endpoint: '/api/settings/employees', priority: 'Medium', status: 'Not Started', estimatedHours: 12, dueDate: '2024-08-28' },
      { id: 'set-4', name: 'Create Employee', method: 'POST', endpoint: '/api/settings/employees', priority: 'Medium', status: 'Not Started', estimatedHours: 14, dueDate: '2024-08-29' },
      { id: 'set-5', name: 'List Roles', method: 'GET', endpoint: '/api/settings/roles', priority: 'High', status: 'Not Started', estimatedHours: 10, dueDate: '2024-08-30' },
      { id: 'set-6', name: 'Create Role', method: 'POST', endpoint: '/api/settings/roles', priority: 'High', status: 'Not Started', estimatedHours: 12, dueDate: '2024-08-31' }
    ]
  }
];

export const LaravelApiTracker = () => {
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Testing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPhaseEndpoints = (phase: number) => {
    return apiModules.filter(module => module.phase === phase);
  };

  const getTotalStats = () => {
    const allEndpoints = apiModules.flatMap(module => module.endpoints);
    return {
      total: allEndpoints.length,
      completed: allEndpoints.filter(ep => ep.status === 'Completed').length,
      inProgress: allEndpoints.filter(ep => ep.status === 'In Progress').length,
      notStarted: allEndpoints.filter(ep => ep.status === 'Not Started').length,
      critical: allEndpoints.filter(ep => ep.priority === 'Critical').length,
      totalHours: allEndpoints.reduce((sum, ep) => sum + ep.estimatedHours, 0)
    };
  };

  const stats = getTotalStats();
  const completionPercentage = (stats.completed / stats.total) * 100;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-sm text-gray-600">Total Endpoints</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.critical}</div>
            <p className="text-sm text-gray-600">Critical Priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.totalHours}h</div>
            <p className="text-sm text-gray-600">Estimated Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Progress</span>
              <span>{completionPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Development Timeline</TabsTrigger>
          <TabsTrigger value="priority">Priority Matrix</TabsTrigger>
          <TabsTrigger value="modules">Module Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <div className="space-y-6">
            {[1, 2, 3, 4].map(phase => (
              <Card key={phase}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Phase {phase} - {phase === 1 ? 'Foundation' : phase === 2 ? 'Core Features' : phase === 3 ? 'Advanced Features' : 'Configuration'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getPhaseEndpoints(phase).map(module => (
                      <div key={module.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {module.icon}
                            <h4 className="font-semibold">{module.name}</h4>
                            <Badge className={getPriorityColor(module.priority)}>
                              {module.priority}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">{module.estimatedWeeks} weeks</span>
                        </div>
                        <div className="grid gap-2">
                          {module.endpoints.slice(0, 3).map(endpoint => (
                            <div key={endpoint.id} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {endpoint.method}
                                </Badge>
                                {endpoint.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(endpoint.status)} variant="outline">
                                  {endpoint.status}
                                </Badge>
                                <span className="text-gray-500">{endpoint.estimatedHours}h</span>
                              </div>
                            </div>
                          ))}
                          {module.endpoints.length > 3 && (
                            <p className="text-xs text-gray-500">+{module.endpoints.length - 3} more endpoints</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {['Critical', 'High', 'Medium', 'Low'].map(priority => {
              const priorityEndpoints = apiModules.flatMap(module => 
                module.endpoints.filter(ep => ep.priority === priority)
              );
              
              return (
                <Card key={priority}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        {priority} Priority
                      </span>
                      <Badge className={getPriorityColor(priority)}>
                        {priorityEndpoints.length} APIs
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {priorityEndpoints.map(endpoint => (
                        <div key={endpoint.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium text-sm">{endpoint.name}</p>
                            <p className="text-xs text-gray-500">{endpoint.endpoint}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(endpoint.status)} variant="outline">
                              {endpoint.status}
                            </Badge>
                            <span className="text-xs text-gray-500">{endpoint.estimatedHours}h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {apiModules.map(module => {
              const moduleProgress = (module.endpoints.filter(ep => ep.status === 'Completed').length / module.endpoints.length) * 100;
              
              return (
                <Card key={module.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {module.icon}
                        <CardTitle className="text-lg">{module.name}</CardTitle>
                      </div>
                      <Badge className={getPriorityColor(module.priority)}>
                        {module.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{moduleProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={moduleProgress} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">APIs:</span>
                        <span className="font-medium">{module.endpoints.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weeks:</span>
                        <span className="font-medium">{module.estimatedWeeks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phase:</span>
                        <span className="font-medium">{module.phase}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hours:</span>
                        <span className="font-medium">
                          {module.endpoints.reduce((sum, ep) => sum + ep.estimatedHours, 0)}h
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
