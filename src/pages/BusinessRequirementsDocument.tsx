
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Server, Globe, Shield, Users, FileText, Calendar, DollarSign, Building2, Target, CheckCircle, Clock } from 'lucide-react';

const BusinessRequirementsDocument = () => {
  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-white print:p-4 print:shadow-none">
      {/* Document Header */}
      <div className="text-center mb-8 border-b pb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Business Requirements Document</h1>
        <h2 className="text-2xl text-gray-700 mb-4">InsureCRM System</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Document Version: 1.0</p>
          <p>Date: {new Date().toLocaleDateString()}</p>
          <p>Project: Insurance Customer Relationship Management System</p>
        </div>
      </div>

      {/* Table of Contents */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Table of Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li>1. Executive Summary</li>
            <li>2. Project Overview</li>
            <li>3. Business Objectives</li>
            <li>4. Functional Requirements</li>
            <li>5. Non-Functional Requirements</li>
            <li>6. System Architecture</li>
            <li>7. Technology Stack</li>
            <li>8. Database Design</li>
            <li>9. User Roles & Permissions</li>
            <li>10. Implementation Timeline</li>
          </ol>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            1. Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            InsureCRM is a comprehensive Customer Relationship Management system specifically designed for insurance agencies and brokers. 
            The system aims to streamline customer management, lead tracking, policy administration, and business operations through 
            modern web and mobile applications.
          </p>
          <p>
            Built with React/TypeScript frontend and Laravel PHP backend, the system provides a scalable, secure, and user-friendly 
            platform for managing all aspects of an insurance business from lead generation to policy servicing.
          </p>
        </CardContent>
      </Card>

      {/* Project Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            2. Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Project Scope</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Web-based CRM application with responsive design</li>
              <li>Mobile applications for iOS and Android platforms</li>
              <li>Customer and family member management</li>
              <li>Lead tracking and conversion pipeline</li>
              <li>Policy management and documentation</li>
              <li>Appointment scheduling and reminders</li>
              <li>Reporting and analytics dashboard</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Target Users</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Insurance agents and brokers</li>
              <li>Sales managers and team leads</li>
              <li>Administrative staff</li>
              <li>Agency owners and executives</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Business Objectives */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6" />
            3. Business Objectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Primary Objectives</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Increase lead conversion rates by 25%</li>
                <li>Reduce customer data entry time by 50%</li>
                <li>Improve customer retention through better service tracking</li>
                <li>Centralize all customer interactions and communications</li>
                <li>Automate routine tasks and workflows</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Secondary Objectives</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Generate comprehensive business reports</li>
                <li>Enable mobile access for field agents</li>
                <li>Integrate with existing insurance platforms</li>
                <li>Ensure data security and compliance</li>
                <li>Provide scalable solution for business growth</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Functional Requirements */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>4. Functional Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Management
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Create, read, update, delete customer records</li>
                <li>Manage family member information and relationships</li>
                <li>Track customer interactions and communication history</li>
                <li>Store and organize customer documents</li>
                <li>Add notes and activity logs for each customer</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lead Management
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Capture leads from multiple sources</li>
                <li>Assign leads to appropriate agents</li>
                <li>Track lead progression through sales pipeline</li>
                <li>Convert qualified leads to customers</li>
                <li>Set follow-up reminders and tasks</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Policy Management
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Create and manage insurance policies</li>
                <li>Use policy templates for consistent documentation</li>
                <li>Track policy renewals and expiration dates</li>
                <li>Process claims and policy changes</li>
                <li>Generate policy documents and reports</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Deal Management
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Track deals and revenue opportunities</li>
                <li>Monitor commission calculations</li>
                <li>Generate sales performance reports</li>
                <li>Manage deal stages and probabilities</li>
                <li>Forecast revenue and sales targets</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Non-Functional Requirements */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>5. Non-Functional Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Performance</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Page load times under 3 seconds</li>
                <li>Support for 100+ concurrent users</li>
                <li>99.9% system uptime availability</li>
                <li>Responsive design for all screen sizes</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Security</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Role-based access control</li>
                <li>Data encryption in transit and at rest</li>
                <li>Multi-factor authentication support</li>
                <li>Audit logging for all user actions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Usability</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Intuitive user interface design</li>
                <li>Mobile-first responsive layout</li>
                <li>Minimal training required for basic functions</li>
                <li>Accessible design following WCAG guidelines</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Scalability</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Horizontal scaling capability</li>
                <li>Database optimization for large datasets</li>
                <li>Caching mechanisms for improved performance</li>
                <li>Cloud-based infrastructure support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Architecture */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>6. System Architecture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Frontend Layer */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-700">
              <Globe className="h-5 w-5" />
              Frontend Layer (React/TypeScript)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Web Application</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>React 18 + TypeScript</li>
                  <li>Vite Build Tool</li>
                  <li>Tailwind CSS + Shadcn/UI</li>
                  <li>React Router</li>
                  <li>TanStack Query</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Mobile Apps</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Capacitor Framework</li>
                  <li>iOS Native App</li>
                  <li>Android Native App</li>
                  <li>Responsive Design</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Core Features</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Dashboard & Analytics</li>
                  <li>Customer Management</li>
                  <li>Lead Tracking</li>
                  <li>Policy Management</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Backend Layer */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-purple-700">
              <Server className="h-5 w-5" />
              Backend Layer (PHP Laravel)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Core Modules</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Customer Management Module</li>
                  <li>Policy Management Module</li>
                  <li>Lead Tracking Module</li>
                  <li>Business Operations Module</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">API Features</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>RESTful API Design</li>
                  <li>Laravel Sanctum Authentication</li>
                  <li>Rate Limiting & Validation</li>
                  <li>API Versioning Support</li>
                </ul>
              </div>
            </div>
          </div>

      {/* Database Layer */}
          <div className="border-l-4 border-gray-500 pl-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-gray-700">
              <Database className="h-5 w-5" />
              Database Layer (PostgreSQL)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Core Tables</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>users, customers</li>
                  <li>family_members, leads</li>
                  <li>policies, deals</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Activity Tables</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>activity_logs, notes</li>
                  <li>appointments, reminders</li>
                  <li>documents, files</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">System Tables</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>roles, permissions</li>
                  <li>settings, configurations</li>
                  <li>audit_trails, notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Flow Architecture */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>8. Data Flow Architecture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* System Context Diagram */}
          <div>
            <h3 className="font-semibold mb-4">8.1 System Context Diagram</h3>
            <p className="text-sm text-gray-600 mb-4">
              High-level overview showing external entities and their interactions with the InsureCRM system.
            </p>
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex flex-col items-center space-y-4">
                {/* External Entities Row */}
                <div className="flex justify-around w-full">
                  <div className="bg-blue-100 px-4 py-2 rounded border-2 border-blue-300 text-center">
                    <div className="font-medium text-blue-800">Insurance Agents</div>
                  </div>
                  <div className="bg-blue-100 px-4 py-2 rounded border-2 border-blue-300 text-center">
                    <div className="font-medium text-blue-800">Customers</div>
                  </div>
                  <div className="bg-blue-100 px-4 py-2 rounded border-2 border-blue-300 text-center">
                    <div className="font-medium text-blue-800">Mobile Users</div>
                  </div>
                </div>
                
                {/* Arrows Down */}
                <div className="flex justify-around w-full">
                  <div className="text-gray-600">↓</div>
                  <div className="text-gray-600">↓</div>
                  <div className="text-gray-600">↓</div>
                </div>
                
                {/* Central System */}
                <div className="bg-purple-100 px-8 py-4 rounded border-2 border-purple-300 text-center">
                  <div className="font-bold text-purple-800 text-lg">InsureCRM System</div>
                  <div className="text-sm text-purple-600">Core Processing Hub</div>
                </div>
                
                {/* Arrows Down */}
                <div className="text-gray-600">↓</div>
                
                {/* Internal Components */}
                <div className="flex justify-around w-full">
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">Web App</div>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">API Layer</div>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">Database</div>
                  </div>
                </div>
                
                {/* Arrows Down */}
                <div className="text-gray-600">↓</div>
                
                {/* External Services */}
                <div className="grid grid-cols-4 gap-2 w-full">
                  <div className="bg-yellow-100 px-2 py-1 rounded border border-yellow-300 text-center">
                    <div className="text-xs font-medium text-yellow-800">Email/SMS</div>
                  </div>
                  <div className="bg-yellow-100 px-2 py-1 rounded border border-yellow-300 text-center">
                    <div className="text-xs font-medium text-yellow-800">Calendar</div>
                  </div>
                  <div className="bg-yellow-100 px-2 py-1 rounded border border-yellow-300 text-center">
                    <div className="text-xs font-medium text-yellow-800">Payments</div>
                  </div>
                  <div className="bg-yellow-100 px-2 py-1 rounded border border-yellow-300 text-center">
                    <div className="text-xs font-medium text-yellow-800">File Storage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Level 1 DFD - Main Processes */}
          <div>
            <h3 className="font-semibold mb-4">8.2 Level 1 Data Flow Diagram - Main Processes</h3>
            <p className="text-sm text-gray-600 mb-4">
              Breakdown of main system processes and their data interactions.
            </p>
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex flex-col items-center space-y-6">
                {/* External Entities */}
                <div className="flex justify-around w-full">
                  <div className="bg-blue-100 px-3 py-2 rounded border border-blue-300 text-center text-sm">
                    <div className="font-medium text-blue-800">Sales Agents</div>
                  </div>
                  <div className="bg-blue-100 px-3 py-2 rounded border border-blue-300 text-center text-sm">
                    <div className="font-medium text-blue-800">Customers</div>
                  </div>
                  <div className="bg-blue-100 px-3 py-2 rounded border border-blue-300 text-center text-sm">
                    <div className="font-medium text-blue-800">Mobile Users</div>
                  </div>
                </div>
                
                {/* Main Processes - Based on Actual Application */}
                <div className="grid grid-cols-3 gap-4 w-full">
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">1.0</div>
                    <div className="text-xs text-green-700">Dashboard</div>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">2.0</div>
                    <div className="text-xs text-green-700">Customer Mgmt</div>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">3.0</div>
                    <div className="text-xs text-green-700">Lead Mgmt</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 w-full">
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">4.0</div>
                    <div className="text-xs text-green-700">Prospect Mgmt</div>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">5.0</div>
                    <div className="text-xs text-green-700">Policy Templates</div>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">6.0</div>
                    <div className="text-xs text-green-700">Deal Mgmt</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 w-full">
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">7.0</div>
                    <div className="text-xs text-green-700">Activities</div>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">8.0</div>
                    <div className="text-xs text-green-700">Appointments</div>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">9.0</div>
                    <div className="text-xs text-green-700">Reminders</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">10.0</div>
                    <div className="text-xs text-green-700">Reports</div>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">11.0</div>
                    <div className="text-xs text-green-700">Settings</div>
                  </div>
                </div>
                
                {/* Data Stores - Based on Actual Application */}
                <div className="flex justify-around w-full">
                  <div className="bg-orange-100 px-4 py-2 rounded border-l-4 border-orange-400 text-center">
                    <div className="text-sm font-medium text-orange-800">D1: Customers</div>
                  </div>
                  <div className="bg-orange-100 px-4 py-2 rounded border-l-4 border-orange-400 text-center">
                    <div className="text-sm font-medium text-orange-800">D2: Leads</div>
                  </div>
                  <div className="bg-orange-100 px-4 py-2 rounded border-l-4 border-orange-400 text-center">
                    <div className="text-sm font-medium text-orange-800">D3: Prospects</div>
                  </div>
                  <div className="bg-orange-100 px-4 py-2 rounded border-l-4 border-orange-400 text-center">
                    <div className="text-sm font-medium text-orange-800">D4: Activities</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Level 2 DFD - Customer Management Detail */}
          <div>
            <h3 className="font-semibold mb-4">8.3 Level 2 DFD - Customer Management Process</h3>
            <p className="text-sm text-gray-600 mb-4">
              Detailed breakdown of customer management processes and data flows.
            </p>
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex flex-col items-center space-y-4">
                {/* User Input */}
                <div className="bg-blue-100 px-4 py-2 rounded border border-blue-300 text-center">
                  <div className="font-medium text-blue-800">Customer Data Input</div>
                </div>
                
                <div className="text-gray-600">↓</div>
                
                {/* Customer Management Processes - Based on Actual UI */}
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">2.1</div>
                    <div className="text-xs text-green-700">Add Customer</div>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">2.2</div>
                    <div className="text-xs text-green-700">Customer Details</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">2.3</div>
                    <div className="text-xs text-green-700">Family Members</div>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">2.4</div>
                    <div className="text-xs text-green-700">Customer Search</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">2.5</div>
                    <div className="text-xs text-green-700">Customer Notes</div>
                  </div>
                  <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center">
                    <div className="text-sm font-medium text-green-800">2.6</div>
                    <div className="text-xs text-green-700">Customer Documents</div>
                  </div>
                </div>
                
                <div className="bg-green-100 px-3 py-2 rounded border border-green-300 text-center w-40">
                  <div className="text-sm font-medium text-green-800">2.7</div>
                  <div className="text-xs text-green-700">Print Customer</div>
                </div>
                
                <div className="text-gray-600">↓</div>
                
                {/* Data Stores - Based on Actual Application */}
                <div className="grid grid-cols-3 gap-2 w-full">
                  <div className="bg-orange-100 px-2 py-1 rounded border-l-4 border-orange-400 text-center">
                    <div className="text-xs font-medium text-orange-800">D2.1: customers</div>
                  </div>
                  <div className="bg-orange-100 px-2 py-1 rounded border-l-4 border-orange-400 text-center">
                    <div className="text-xs font-medium text-orange-800">D2.2: family_members</div>
                  </div>
                  <div className="bg-orange-100 px-2 py-1 rounded border-l-4 border-orange-400 text-center">
                    <div className="text-xs font-medium text-orange-800">D2.3: customer_notes</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                  <div className="bg-orange-100 px-2 py-1 rounded border-l-4 border-orange-400 text-center">
                    <div className="text-xs font-medium text-orange-800">D2.4: documents</div>
                  </div>
                  <div className="bg-orange-100 px-2 py-1 rounded border-l-4 border-orange-400 text-center">
                    <div className="text-xs font-medium text-orange-800">D2.5: activity_logs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API Data Flow */}
          <div>
            <h3 className="font-semibold mb-4">8.4 API Data Flow Diagram</h3>
            <p className="text-sm text-gray-600 mb-4">
              Detailed API request/response patterns and backend processing flows.
            </p>
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex flex-col space-y-4">
                {/* API Request Flow */}
                <div className="bg-gray-100 p-4 rounded">
                  <h4 className="font-medium mb-3 text-center">API Request/Response Flow</h4>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="bg-blue-100 px-3 py-2 rounded border text-center flex-1">
                      <div className="text-sm font-medium text-blue-800">Frontend</div>
                      <div className="text-xs text-blue-600">React App</div>
                    </div>
                    <div className="text-gray-600">→</div>
                    <div className="bg-purple-100 px-3 py-2 rounded border text-center flex-1">
                      <div className="text-sm font-medium text-purple-800">API Gateway</div>
                      <div className="text-xs text-purple-600">Laravel Routes</div>
                    </div>
                    <div className="text-gray-600">→</div>
                    <div className="bg-green-100 px-3 py-2 rounded border text-center flex-1">
                      <div className="text-sm font-medium text-green-800">Auth Middleware</div>
                      <div className="text-xs text-green-600">JWT Validation</div>
                    </div>
                    <div className="text-gray-600">→</div>
                    <div className="bg-orange-100 px-3 py-2 rounded border text-center flex-1">
                      <div className="text-sm font-medium text-orange-800">Database</div>
                      <div className="text-xs text-orange-600">PostgreSQL</div>
                    </div>
                  </div>
                </div>
                
                {/* Authentication Flow */}
                <div className="bg-gray-100 p-4 rounded">
                  <h4 className="font-medium mb-3 text-center">Authentication Sequence</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-200 px-2 py-1 rounded text-xs">1</div>
                      <div className="text-sm">User submits login credentials</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-purple-200 px-2 py-1 rounded text-xs">2</div>
                      <div className="text-sm">API validates credentials against database</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-green-200 px-2 py-1 rounded text-xs">3</div>
                      <div className="text-sm">JWT token generated and returned</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-yellow-200 px-2 py-1 rounded text-xs">4</div>
                      <div className="text-sm">Token stored in frontend for subsequent requests</div>
                    </div>
                  </div>
                </div>
                
                {/* Error Handling */}
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <h4 className="font-medium mb-2 text-red-800">Error Handling Pattern</h4>
                  <div className="text-sm text-red-700">
                    API returns standardized error responses with HTTP status codes and error messages for frontend processing
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Database Data Flow */}
          <div>
            <h3 className="font-semibold mb-4">8.5 Database Data Flow & Relationships</h3>
            <p className="text-sm text-gray-600 mb-4">
              Database operations, relationships, and data persistence patterns.
            </p>
            <div className="bg-white p-6 rounded-lg border">
              <div className="space-y-6">
                {/* Entity Relationships */}
                <div className="bg-gray-100 p-4 rounded">
                  <h4 className="font-medium mb-3 text-center">Core Entity Relationships</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-100 px-3 py-2 rounded border text-center">
                      <div className="text-sm font-bold text-blue-800">TENANTS</div>
                      <div className="text-xs text-blue-600">Multi-tenancy</div>
                    </div>
                    <div className="bg-green-100 px-3 py-2 rounded border text-center">
                      <div className="text-sm font-bold text-green-800">USERS</div>
                      <div className="text-xs text-green-600">Agents/Staff</div>
                    </div>
                    <div className="bg-purple-100 px-3 py-2 rounded border text-center">
                      <div className="text-sm font-bold text-purple-800">CUSTOMERS</div>
                      <div className="text-xs text-purple-600">Client Data</div>
                    </div>
                    <div className="bg-orange-100 px-3 py-2 rounded border text-center">
                      <div className="text-sm font-bold text-orange-800">POLICIES</div>
                      <div className="text-xs text-orange-600">Insurance Plans</div>
                    </div>
                  </div>
                </div>
                
                {/* Relationship Connections */}
                <div className="bg-gray-100 p-4 rounded">
                  <h4 className="font-medium mb-3 text-center">Key Relationships</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between bg-white p-2 rounded border">
                        <span>USERS (1) ←→ (Many) CUSTOMERS</span>
                        <span className="text-xs text-gray-600">assigned_agent_id FK</span>
                      </div>
                      <div className="flex items-center justify-between bg-white p-2 rounded border">
                        <span>CUSTOMERS (1) ←→ (Many) FAMILY_MEMBERS</span>
                        <span className="text-xs text-gray-600">customer_id FK</span>
                      </div>
                      <div className="flex items-center justify-between bg-white p-2 rounded border">
                        <span>CUSTOMERS (1) ←→ (Many) CUSTOMER_NOTES</span>
                        <span className="text-xs text-gray-600">customer_id FK</span>
                      </div>
                      <div className="flex items-center justify-between bg-white p-2 rounded border">
                        <span>LEADS (1) ←→ (1) CUSTOMERS</span>
                        <span className="text-xs text-gray-600">conversion process</span>
                      </div>
                      <div className="flex items-center justify-between bg-white p-2 rounded border">
                        <span>PROSPECTS (1) ←→ (1) CUSTOMERS</span>
                        <span className="text-xs text-gray-600">conversion process</span>
                      </div>
                      <div className="flex items-center justify-between bg-white p-2 rounded border">
                        <span>CUSTOMERS (1) ←→ (Many) DEALS</span>
                        <span className="text-xs text-gray-600">customer_id FK</span>
                      </div>
                      <div className="flex items-center justify-between bg-white p-2 rounded border">
                        <span>CUSTOMERS (1) ←→ (Many) DOCUMENTS</span>
                        <span className="text-xs text-gray-600">customer_id FK</span>
                      </div>
                    </div>
                </div>
                
                {/* Data Operations */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <h4 className="font-medium mb-2 text-green-800">CRUD Operations</h4>
                    <ul className="text-xs space-y-1 text-green-700">
                      <li>• Create: INSERT with validation</li>
                      <li>• Read: SELECT with joins & indexes</li>
                      <li>• Update: UPDATE with audit trails</li>
                      <li>• Delete: Soft delete with timestamps</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <h4 className="font-medium mb-2 text-blue-800">Performance Features</h4>
                    <ul className="text-xs space-y-1 text-blue-700">
                      <li>• Indexed foreign keys</li>
                      <li>• Full-text search indexes</li>
                      <li>• Query optimization</li>
                      <li>• Connection pooling</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Integration & Third-Party Data Flows */}
          <div>
            <h3 className="font-semibold mb-4">8.6 Integration & Third-Party Data Flows</h3>
            <p className="text-sm text-gray-600 mb-4">
              External service integrations and their data exchange patterns.
            </p>
            <div className="bg-white p-6 rounded-lg border">
              <div className="space-y-6">
                {/* Integration Overview */}
                <div className="bg-gray-100 p-4 rounded">
                  <h4 className="font-medium mb-3 text-center">External Service Integrations</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-yellow-100 px-3 py-2 rounded border text-center">
                      <div className="text-sm font-bold text-yellow-800">Email/SMS</div>
                      <div className="text-xs text-yellow-600">SendGrid/Twilio</div>
                    </div>
                    <div className="bg-green-100 px-3 py-2 rounded border text-center">
                      <div className="text-sm font-bold text-green-800">Calendar</div>
                      <div className="text-xs text-green-600">Google/Outlook</div>
                    </div>
                    <div className="bg-blue-100 px-3 py-2 rounded border text-center">
                      <div className="text-sm font-bold text-blue-800">Payments</div>
                      <div className="text-xs text-blue-600">Stripe/PayPal</div>
                    </div>
                    <div className="bg-purple-100 px-3 py-2 rounded border text-center">
                      <div className="text-sm font-bold text-purple-800">Storage</div>
                      <div className="text-xs text-purple-600">AWS S3/Azure</div>
                    </div>
                  </div>
                </div>
                
                {/* Integration Patterns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <h4 className="font-medium mb-2 text-blue-800">Synchronous Integrations</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Payment Processing (Real-time)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Calendar Booking (Immediate)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Document Upload (Direct)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded border border-green-200">
                    <h4 className="font-medium mb-2 text-green-800">Asynchronous Integrations</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Email Notifications (Queued)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>SMS Reminders (Batch)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Report Generation (Background)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Integration */}
                <div className="bg-gray-100 p-4 rounded">
                  <h4 className="font-medium mb-3 text-center">Mobile App Integration Flow</h4>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="bg-indigo-100 px-3 py-2 rounded border text-center flex-1">
                      <div className="text-sm font-medium text-indigo-800">Mobile App</div>
                      <div className="text-xs text-indigo-600">iOS/Android</div>
                    </div>
                    <div className="text-gray-600">↔</div>
                    <div className="bg-purple-100 px-3 py-2 rounded border text-center flex-1">
                      <div className="text-sm font-medium text-purple-800">API Sync</div>
                      <div className="text-xs text-purple-600">Real-time Updates</div>
                    </div>
                    <div className="text-gray-600">↔</div>
                    <div className="bg-orange-100 px-3 py-2 rounded border text-center flex-1">
                      <div className="text-sm font-medium text-orange-800">Web Portal</div>
                      <div className="text-xs text-orange-600">Synchronized Data</div>
                    </div>
                  </div>
                </div>
                
                {/* Error Handling & Security */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <h4 className="font-medium mb-2 text-red-800">Error Handling</h4>
                    <ul className="text-xs space-y-1 text-red-700">
                      <li>• Retry mechanisms for failed requests</li>
                      <li>• Fallback options for service outages</li>
                      <li>• Error logging and monitoring</li>
                      <li>• User notification for critical failures</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <h4 className="font-medium mb-2 text-yellow-800">Security Measures</h4>
                    <ul className="text-xs space-y-1 text-yellow-700">
                      <li>• API key authentication</li>
                      <li>• OAuth 2.0 for third-party services</li>
                      <li>• Rate limiting and throttling</li>
                      <li>• Data encryption in transit</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Flow Summary */}
          <div>
            <h3 className="font-semibold mb-4">8.7 Key Data Flow Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Critical Data Paths</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><strong>Lead Conversion:</strong> Lead capture → Qualification → Assignment → Customer conversion → Deal creation</li>
                  <li><strong>Policy Lifecycle:</strong> Customer eligibility → Policy creation → Premium calculation → Document generation → Renewal tracking</li>
                  <li><strong>Claims Processing:</strong> Claim submission → Validation → Assignment → Investigation → Settlement</li>
                  <li><strong>Customer Journey:</strong> Registration → Profile completion → Family setup → Policy enrollment → Service delivery</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Data Security Checkpoints</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><strong>Authentication:</strong> JWT token validation on every API request</li>
                  <li><strong>Authorization:</strong> Role-based access control at process level</li>
                  <li><strong>Audit Logging:</strong> Complete trail of all data modifications</li>
                  <li><strong>Data Encryption:</strong> Sensitive data encrypted at rest and in transit</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Performance Optimizations</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><strong>Caching:</strong> Redis cache for frequently accessed data</li>
                  <li><strong>Indexing:</strong> Full-text search indexes for quick lookups</li>
                  <li><strong>Lazy Loading:</strong> On-demand data fetching for large datasets</li>
                  <li><strong>Background Jobs:</strong> Queue system for email/SMS processing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Integration Patterns</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><strong>Asynchronous:</strong> Email/SMS notifications via queue system</li>
                  <li><strong>Real-time:</strong> Direct API calls for payments and calendar</li>
                  <li><strong>Batch Processing:</strong> Document storage and backup operations</li>
                  <li><strong>Event-driven:</strong> Webhook handlers for external service callbacks</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology Stack */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>7. Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Frontend Technologies</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>React 18 with TypeScript</li>
                <li>Vite for build tooling</li>
                <li>Tailwind CSS for styling</li>
                <li>Shadcn/UI component library</li>
                <li>TanStack Query for state management</li>
                <li>React Router for navigation</li>
                <li>Capacitor for mobile apps</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Backend Technologies</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>PHP 8.x with Laravel Framework</li>
                <li>PostgreSQL database</li>
                <li>Laravel Sanctum for authentication</li>
                <li>Eloquent ORM for database operations</li>
                <li>Laravel Queue for background jobs</li>
                <li>Redis for caching</li>
                <li>Docker for containerization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Roles */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>9. User Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">Admin</h3>
                <p className="text-sm text-gray-600 mb-2">Full system access</p>
                <ul className="text-xs space-y-1">
                  <li>• Manage all settings</li>
                  <li>• Add/remove employees</li>
                  <li>• View all data</li>
                  <li>• Configure workflows</li>
                </ul>
              </div>
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">Sales Manager</h3>
                <p className="text-sm text-gray-600 mb-2">Team management access</p>
                <ul className="text-xs space-y-1">
                  <li>• Manage team leads</li>
                  <li>• View team reports</li>
                  <li>• Assign leads</li>
                  <li>• Edit workflows</li>
                </ul>
              </div>
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">Sales Agent</h3>
                <p className="text-sm text-gray-600 mb-2">Individual access</p>
                <ul className="text-xs space-y-1">
                  <li>• Manage assigned leads</li>
                  <li>• View own reports</li>
                  <li>• Update deal status</li>
                  <li>• Add customer notes</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Timeline */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6" />
            10. Implementation Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Phase 1 (Months 1-2)</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Core system architecture setup</li>
                  <li>User authentication and authorization</li>
                  <li>Basic customer management</li>
                  <li>Database design and implementation</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Phase 2 (Months 3-4)</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Lead management functionality</li>
                  <li>Policy management system</li>
                  <li>Basic reporting dashboard</li>
                  <li>Mobile application development</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Phase 3 (Months 5-6)</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Advanced analytics and reporting</li>
                  <li>Workflow automation features</li>
                  <li>Document management system</li>
                  <li>Integration with external systems</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Phase 4 (Month 7)</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>User acceptance testing</li>
                  <li>Performance optimization</li>
                  <li>Security audit and penetration testing</li>
                  <li>Production deployment and go-live</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Footer */}
      <div className="border-t pt-6 mt-8 text-center text-sm text-gray-600">
        <p>End of Document</p>
        <p>InsureCRM Business Requirements Document v1.0</p>
      </div>
    </div>
  );
};

export default BusinessRequirementsDocument;
