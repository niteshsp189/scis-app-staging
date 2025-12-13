
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Server, Globe, Shield, Users, FileText, Calendar, DollarSign } from 'lucide-react';

export function ArchitectureDiagram() {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SCIS Architecture & Database Documentation</h1>
        <p className="text-gray-600">Complete system architecture, database schema, and implementation guide</p>
      </div>

      {/* Database ER Diagram */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <CardTitle className="text-indigo-800">Database Entity Relationship Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Core Entities & Relationships</h3>
            </div>
            <div className="overflow-x-auto">
              <div className="text-sm font-mono whitespace-pre">
{`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    TENANTS      │    │     USERS       │    │   COMPANIES     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • id (PK)       │    │ • id (PK)       │    │ • id (PK)       │
│ • name          │◄──┐│ • tenant_id (FK)│    │ • tenant_id (FK)│
│ • subdomain     │   ││ • email         │    │ • name          │
│ • plan          │   ││ • role          │    │ • industry      │
│ • is_active     │   ││ • is_active     │    │ • status        │
└─────────────────┘   │└─────────────────┘    └─────────────────┘
                      │                                │
                      │                                │
┌─────────────────┐   │ ┌─────────────────┐    ┌─────────────────┐
│   CUSTOMERS     │   │ │     LEADS       │    │     DEALS       │
├─────────────────┤   │ ├─────────────────┤    ├─────────────────┤
│ • id (PK)       │   │ │ • id (PK)       │    │ • id (PK)       │
│ • tenant_id (FK)│◄──┤ │ • tenant_id (FK)│    │ • tenant_id (FK)│
│ • customer_num  │   │ │ • first_name    │    │ • title         │
│ • first_name    │   │ │ • last_name     │    │ • value         │
│ • last_name     │   │ │ • email         │    │ • stage         │
│ • email         │   │ │ • phone         │    │ • customer_id   │
│ • phone         │   │ │ • status        │    │ • lead_id (FK)  │
│ • company_id    │   │ │ • assigned_to   │    │ • assigned_to   │
│ • assigned_to   │   │ └─────────────────┘    └─────────────────┘
└─────────────────┘   │                                │
        │             │                                │
        │             │                                │
┌─────────────────┐   │ ┌─────────────────┐    ┌─────────────────┐
│FAMILY_MEMBERS   │   │ │    POLICIES     │    │ POLICY_TEMPLATES│
├─────────────────┤   │ ├─────────────────┤    ├─────────────────┤
│ • id (PK)       │   │ │ • id (PK)       │    │ • id (PK)       │
│ • tenant_id (FK)│◄──┤ │ • tenant_id (FK)│    │ • tenant_id (FK)│
│ • primary_cust  │   │ │ • policy_number │    │ • name          │
│ • related_cust  │   │ │ • customer_id   │    │ • type          │
│ • relationship  │   │ │ • deal_id (FK)  │    │ • base_premium  │
│ • is_covered    │   │ │ • template_id   │    │ • coverage_det  │
└─────────────────┘   │ │ • type          │    │ • is_active     │
        │             │ │ • status        │    └─────────────────┘
        │             │ │ • premium_amt   │
        │             │ │ • coverage_amt  │
        │             │ │ • effective_dt  │
        │             │ │ • expiration_dt │
        │             │ │ • assigned_to   │
        │             │ └─────────────────┘
        │             │
        │             │
┌─────────────────┐   │ ┌─────────────────┐    ┌─────────────────┐
│  APPOINTMENTS   │   │ │   ACTIVITIES    │    │   REMINDERS     │
├─────────────────┤   │ ├─────────────────┤    ├─────────────────┤
│ • id (PK)       │   │ │ • id (PK)       │    │ • id (PK)       │
│ • tenant_id (FK)│◄──┤ │ • tenant_id (FK)│    │ • tenant_id (FK)│
│ • title         │   │ │ • type          │    │ • title         │
│ • customer_id   │   │ │ • subject       │    │ • reminder_type │
│ • lead_id       │   │ │ • customer_id   │    │ • priority      │
│ • deal_id       │   │ │ • lead_id       │    │ • status        │
│ • start_time    │   │ │ • deal_id       │    │ • due_date      │
│ • end_time      │   │ │ • policy_id     │    │ • customer_id   │
│ • status        │   │ │ • assigned_to   │    │ • assigned_to   │
│ • assigned_to   │   │ │ • completed_at  │    └─────────────────┘
└─────────────────┘   │ └─────────────────┘
                      │
                      │
┌─────────────────┐   │ ┌─────────────────┐    ┌─────────────────┐
│     CLAIMS      │   │ │   DOCUMENTS     │    │   AUDIT_LOGS    │
├─────────────────┤   │ ├─────────────────┤    ├─────────────────┤
│ • id (PK)       │   │ │ • id (PK)       │    │ • id (PK)       │
│ • tenant_id (FK)│◄──┤ │ • tenant_id (FK)│    │ • tenant_id (FK)│
│ • claim_number  │   │ │ • name          │    │ • table_name    │
│ • policy_id     │   │ │ • type          │    │ • record_id     │
│ • customer_id   │   │ │ • file_path     │    │ • action        │
│ • type          │   │ │ • customer_id   │    │ • old_values    │
│ • status        │   │ │ • policy_id     │    │ • new_values    │
│ • incident_date │   │ │ • claim_id      │    │ • changed_by    │
│ • claim_amount  │   │ │ • uploaded_by   │    │ • changed_at    │
│ • settled_amt   │   │ └─────────────────┘    └─────────────────┘
│ • adjuster_id   │   │
└─────────────────┘   │
                      │
┌─────────────────┐   │
│ SEARCH_INDEXES  │   │
├─────────────────┤   │
│ • id (PK)       │   │
│ • tenant_id (FK)│◄──┘
│ • entity_type   │
│ • entity_id     │
│ • search_content│
│ • search_vector │
│ • metadata      │
└─────────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
◄── = One-to-Many Relationship
`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Flow Diagram */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">System Data Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-sm font-mono whitespace-pre">
{`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LEAD ENTRY    │───▶│ QUALIFICATION   │───▶│   CONVERSION    │
│                 │    │                 │    │                 │
│ • Web Form      │    │ • Agent Review  │    │ • Lead → Deal   │
│ • Phone Call    │    │ • Scoring       │    │ • Deal → Policy │
│ • Referral      │    │ • Assignment    │    │ • Customer Rec  │
│ • Campaign      │    │ • Follow-up     │    │ • Doc Creation  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ACTIVITIES    │    │   REMINDERS     │    │   POLICIES      │
│                 │    │                 │    │                 │
│ • Calls         │    │ • Follow-ups    │    │ • Active        │
│ • Meetings      │    │ • Renewals      │    │ • Renewals      │
│ • Emails        │    │ • Payments      │    │ • Claims        │
│ • Notes         │    │ • Reviews       │    │ • Documents     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │   REPORTING     │
                    │                 │
                    │ • Sales Metrics │
                    │ • Agent Perf    │
                    │ • Revenue Track │
                    │ • Compliance    │
                    └─────────────────┘
`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints Documentation */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-800">API Endpoints Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3 text-blue-600">Authentication</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/auth/login</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/auth/logout</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/auth/register</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/auth/refresh</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/auth/profile</span></div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3 text-green-600">Customer Management</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/customers</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/customers</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/customers/&#123;id&#125;</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">PUT</span> <span className="ml-2">/api/customers/&#123;id&#125;</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">DELETE</span> <span className="ml-2">/api/customers/&#123;id&#125;</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/customers/&#123;id&#125;/family</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/customers/&#123;id&#125;/family</span></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3 text-orange-600">Lead Management</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/leads</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/leads</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/leads/&#123;id&#125;</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">PUT</span> <span className="ml-2">/api/leads/&#123;id&#125;</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/leads/&#123;id&#125;/convert</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/leads/&#123;id&#125;/assign</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/leads/agent/&#123;id&#125;</span></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3 text-purple-600">Policy Management</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/policies</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/policies</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/policies/&#123;id&#125;</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">PUT</span> <span className="ml-2">/api/policies/&#123;id&#125;</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/policies/&#123;id&#125;/renew</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/policies/templates</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/policies/templates</span></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3 text-red-600">Claims Management</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/claims</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/claims</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/claims/&#123;id&#125;</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">PUT</span> <span className="ml-2">/api/claims/&#123;id&#125;</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/claims/&#123;id&#125;/approve</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">POST</span> <span className="ml-2">/api/claims/&#123;id&#125;/settle</span></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-3 text-teal-600">Reporting & Analytics</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/reports/dashboard</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/reports/sales</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/reports/agents</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/reports/policies</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/reports/revenue</span></div>
                <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">GET</span> <span className="ml-2">/api/search</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frontend Layer */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Globe className="h-6 w-6" />
            Frontend Layer (React/TypeScript)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Web Application</h3>
              <ul className="text-sm space-y-1">
                <li>• React 18 + TypeScript</li>
                <li>• Vite Build Tool</li>
                <li>• Tailwind CSS + Shadcn/UI</li>
                <li>• React Router for Navigation</li>
                <li>• TanStack Query for State</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Mobile Apps</h3>
              <ul className="text-sm space-y-1">
                <li>• Capacitor Framework</li>
                <li>• iOS Native App</li>
                <li>• Android Native App</li>
                <li>• Responsive Design</li>
                <li>• Native Device Features</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Core Features</h3>
              <ul className="text-sm space-y-1">
                <li>• Dashboard & Analytics</li>
                <li>• Customer Management</li>
                <li>• Lead Tracking</li>
                <li>• Policy Management</li>
                <li>• Appointment Scheduling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Gateway & Authentication */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Shield className="h-6 w-6" />
            API Gateway & Security Layer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Authentication & Authorization</h3>
              <ul className="text-sm space-y-1">
                <li>• Laravel Sanctum/Passport</li>
                <li>• JWT Token Management</li>
                <li>• Role-Based Access Control</li>
                <li>• Multi-Factor Authentication</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">API Security</h3>
              <ul className="text-sm space-y-1">
                <li>• Rate Limiting</li>
                <li>• CORS Configuration</li>
                <li>• Request Validation</li>
                <li>• API Versioning</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backend Layer */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Server className="h-6 w-6" />
            Backend Layer (PHP Laravel)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold mb-2">Customer Module</h3>
              <ul className="text-sm space-y-1">
                <li>• Customer CRUD</li>
                <li>• Family Management</li>
                <li>• Customer Notes</li>
                <li>• Activity Logs</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <FileText className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold mb-2">Policy Module</h3>
              <ul className="text-sm space-y-1">
                <li>• Policy Management</li>
                <li>• Template System</li>
                <li>• Document Upload</li>
                <li>• Claims Processing</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <Calendar className="h-8 w-8 text-orange-600 mb-2" />
              <h3 className="font-semibold mb-2">Lead Module</h3>
              <ul className="text-sm space-y-1">
                <li>• Lead Tracking</li>
                <li>• Assignment Logic</li>
                <li>• Conversion Pipeline</li>
                <li>• Follow-up System</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <DollarSign className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-semibold mb-2">Business Module</h3>
              <ul className="text-sm space-y-1">
                <li>• Deal Management</li>
                <li>• Commission Tracking</li>
                <li>• Reporting & Analytics</li>
                <li>• Workflow Automation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Layer */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Database className="h-6 w-6" />
            Database Layer (PostgreSQL)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Core Tables</h3>
              <ul className="text-sm space-y-1">
                <li>• users</li>
                <li>• customers</li>
                <li>• family_members</li>
                <li>• leads</li>
                <li>• policies</li>
                <li>• deals</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Activity Tables</h3>
              <ul className="text-sm space-y-1">
                <li>• activity_logs</li>
                <li>• customer_notes</li>
                <li>• appointments</li>
                <li>• reminders</li>
                <li>• documents</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">System Tables</h3>
              <ul className="text-sm space-y-1">
                <li>• roles & permissions</li>
                <li>• settings</li>
                <li>• audit_trails</li>
                <li>• notifications</li>
                <li>• file_uploads</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Flow */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardHeader>
          <CardTitle className="text-indigo-800">Data Flow & Communication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
              <span className="font-medium">Frontend (React)</span>
              <span className="text-gray-500">HTTP/HTTPS</span>
              <span className="font-medium">Laravel API</span>
              <span className="text-gray-500">Eloquent ORM</span>
              <span className="font-medium">PostgreSQL</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">API Endpoints</h3>
                <ul className="text-sm space-y-1">
                  <li>• /api/auth/* - Authentication</li>
                  <li>• /api/customers/* - Customer Management</li>
                  <li>• /api/leads/* - Lead Operations</li>
                  <li>• /api/policies/* - Policy Management</li>
                  <li>• /api/reports/* - Analytics & Reports</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Real-time Features</h3>
                <ul className="text-sm space-y-1">
                  <li>• WebSocket connections</li>
                  <li>• Push notifications</li>
                  <li>• Live updates</li>
                  <li>• Real-time chat</li>
                  <li>• Activity feeds</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Infrastructure & Deployment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Development</h3>
              <ul className="text-sm space-y-1">
                <li>• Docker containers</li>
                <li>• Local development setup</li>
                <li>• Git version control</li>
                <li>• CI/CD pipelines</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Production</h3>
              <ul className="text-sm space-y-1">
                <li>• Cloud hosting (AWS/Azure)</li>
                <li>• Load balancers</li>
                <li>• CDN for static assets</li>
                <li>• Backup strategies</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Monitoring</h3>
              <ul className="text-sm space-y-1">
                <li>• Application logging</li>
                <li>• Performance monitoring</li>
                <li>• Error tracking</li>
                <li>• Security auditing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
