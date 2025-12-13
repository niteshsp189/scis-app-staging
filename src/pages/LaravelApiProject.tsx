
import React from 'react';
import { LaravelApiTracker } from '@/components/project/LaravelApiTracker';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Database, Clock, Users } from 'lucide-react';

export default function LaravelApiProject() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Laravel API Development Project
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete project tracker for Laravel backend API development with timeline, priorities, and progress monitoring
          </p>
        </div>

        {/* Key Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Code className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">130+</div>
              <p className="text-sm text-gray-600">API Endpoints</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Database className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">20</div>
              <p className="text-sm text-gray-600">Modules</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">12-16</div>
              <p className="text-sm text-gray-600">Weeks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">3-5</div>
              <p className="text-sm text-gray-600">Developers</p>
            </CardContent>
          </Card>
        </div>

        {/* Development Phases Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Development Phases Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-lg font-semibold text-blue-600">Phase 1</div>
                <div className="text-sm text-gray-600">Foundation</div>
                <div className="text-xs text-gray-500 mt-1">Auth & Dashboard</div>
                <div className="text-xs text-gray-500">3 weeks</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-lg font-semibold text-green-600">Phase 2</div>
                <div className="text-sm text-gray-600">Core Features</div>
                <div className="text-xs text-gray-500 mt-1">Customers & Leads</div>
                <div className="text-xs text-gray-500">5 weeks</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-lg font-semibold text-orange-600">Phase 3</div>
                <div className="text-sm text-gray-600">Advanced Features</div>
                <div className="text-xs text-gray-500 mt-1">Policies & Products</div>
                <div className="text-xs text-gray-500">5 weeks</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-lg font-semibold text-purple-600">Phase 4</div>
                <div className="text-sm text-gray-600">Configuration</div>
                <div className="text-xs text-gray-500 mt-1">Settings & Reports</div>
                <div className="text-xs text-gray-500">3 weeks</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tracker Component */}
        <LaravelApiTracker />

        {/* Development Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Development Guidelines & Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">API Standards</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• RESTful API design principles</li>
                  <li>• Consistent JSON response format</li>
                  <li>• Proper HTTP status codes</li>
                  <li>• API versioning strategy</li>
                  <li>• Comprehensive error handling</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Security Requirements</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• JWT token authentication</li>
                  <li>• Role-based access control</li>
                  <li>• Input validation & sanitization</li>
                  <li>• Rate limiting implementation</li>
                  <li>• CORS configuration</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Testing Strategy</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Unit tests for all endpoints</li>
                  <li>• Integration testing</li>
                  <li>• API documentation (Swagger)</li>
                  <li>• Performance testing</li>
                  <li>• Security testing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Database Design</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Normalized database structure</li>
                  <li>• Proper indexing strategy</li>
                  <li>• Migration scripts</li>
                  <li>• Data seeding</li>
                  <li>• Backup procedures</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
