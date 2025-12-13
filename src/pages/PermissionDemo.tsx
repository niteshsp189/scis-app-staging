import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionContext";
import { useBusinessPermissions, useAdminAccess } from "@/hooks/usePermissions";
import { ConditionalAccess } from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Shield, Settings, FileText, Eye, EyeOff } from "lucide-react";

const PermissionDemo: React.FC = () => {
  const { user } = useAuth();
  const {
    userPermissions,
    isLoading,
    hasRole,
    hasPermission,
    canAccess,
    refreshPermissions,
  } = usePermissions();

  const {
    canViewCustomers,
    canCreateCustomers,
    canEditCustomers,
    canDeleteCustomers,
    canManageCustomers,
    canViewPolicies,
    canManagePolicies,
    canViewReports,
    canManageSystemSettings,
  } = useBusinessPermissions();

  const { isAdmin, isSuperAdmin } = useAdminAccess();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Permission System Demo
        </h1>
        <p className="text-gray-600">
          This page demonstrates the React permission system in action.
          Different content will be visible based on your roles and permissions.
        </p>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current User Information
          </CardTitle>
          <CardDescription>
            Your current authentication status and assigned roles/permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">
              Name: {user?.first_name} {user?.last_name}
            </p>
            <p className="text-sm text-gray-600">Email: {user?.email}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Roles:</h4>
            <div className="flex flex-wrap gap-2">
              {userPermissions?.roleNames.length ? (
                userPermissions.roleNames.map((role) => (
                  <Badge key={role} variant="default">
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">No roles assigned</Badge>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Permissions:</h4>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {userPermissions?.permissionNames.length ? (
                userPermissions.permissionNames.map((permission) => (
                  <Badge
                    key={permission}
                    variant="secondary"
                    className="text-xs"
                  >
                    {permission}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">No permissions assigned</Badge>
              )}
            </div>
          </div>

          <Button onClick={refreshPermissions} variant="outline" size="sm">
            Refresh Permissions
          </Button>
        </CardContent>
      </Card>

      {/* Role-based Access Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role-based Access Control
          </CardTitle>
          <CardDescription>
            These sections are visible based on your assigned roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConditionalAccess
            requiredRoles={["admin", "super_admin"]}
            fallback={
              <div className="p-4 bg-gray-100 rounded-lg flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  Admin Panel - Requires admin or super_admin role
                </span>
              </div>
            }
          >
            <div className="p-4 bg-green-100 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">
                🔧 Admin Panel Access
              </h4>
              <p className="text-green-700">
                You have admin access! You can see this admin panel.
              </p>
              <div className="mt-2 space-x-2">
                <Badge variant="default">Admin: {isAdmin ? "Yes" : "No"}</Badge>
                <Badge variant="default">
                  Super Admin: {isSuperAdmin ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </ConditionalAccess>

          <ConditionalAccess
            requiredRoles={["super_admin"]}
            fallback={
              <div className="p-4 bg-gray-100 rounded-lg flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  Super Admin Panel - Requires super_admin role
                </span>
              </div>
            }
          >
            <div className="p-4 bg-purple-100 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">
                ⚡ Super Admin Panel
              </h4>
              <p className="text-purple-700">
                Ultimate access! You can manage everything in the system.
              </p>
            </div>
          </ConditionalAccess>

          <ConditionalAccess
            requiredRoles={["sales", "agent", "manager"]}
            fallback={
              <div className="p-4 bg-gray-100 rounded-lg flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  Sales Dashboard - Requires sales, agent, or manager role
                </span>
              </div>
            }
          >
            <div className="p-4 bg-blue-100 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                📊 Sales Dashboard
              </h4>
              <p className="text-blue-700">
                You have sales access! View your sales metrics and targets.
              </p>
            </div>
          </ConditionalAccess>
        </CardContent>
      </Card>

      {/* Permission-based Access Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Permission-based Access Control
          </CardTitle>
          <CardDescription>
            These sections are visible based on your specific permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Management */}
            <div className="space-y-2">
              <h4 className="font-medium">Customer Management</h4>
              <div className="space-y-1">
                <ConditionalAccess
                  requiredPermissions={["view_customers"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      View Customers: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ View Customers
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["create_customers"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Create Customers: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Create Customers
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["update_customers"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Edit Customers: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Edit Customers
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["delete_customers"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Delete Customers: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Delete Customers
                  </Badge>
                </ConditionalAccess>
              </div>
            </div>

            {/* Prospect Management */}
            <div className="space-y-2">
              <h4 className="font-medium">Prospect Management</h4>
              <div className="space-y-1">
                <ConditionalAccess
                  requiredPermissions={["view_prospects"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      View Prospects: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ View Prospects
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["create_prospects"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Create Prospects: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Create Prospects
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["update_prospects"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Update Prospects: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Update Prospects
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["delete_prospects"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Delete Prospects: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Delete Prospects
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["assign_prospects"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Assign Prospects: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Assign Prospects
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["convert_qualified_prospects"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Convert Prospects: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Convert Prospects
                  </Badge>
                </ConditionalAccess>
              </div>
            </div>

            {/* Policy Management */}
            <div className="space-y-2">
              <h4 className="font-medium">Policy Management</h4>
              <div className="space-y-1">
                <ConditionalAccess
                  requiredPermissions={["view_policies"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      View Policies: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ View Policies
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["create_policies"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Create Policies: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Create Policies
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["update_policies"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Edit Policies: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Edit Policies
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["delete_policies"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Delete Policies: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Delete Policies
                  </Badge>
                </ConditionalAccess>
              </div>
            </div>

            {/* Appointment Management */}
            <div className="space-y-2">
              <h4 className="font-medium">Appointment Management</h4>
              <div className="space-y-1">
                <ConditionalAccess
                  requiredPermissions={["view_appointments"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      View Appointments: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ View Appointments
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["create_appointments"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Create Appointments: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Create Appointments
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["edit_appointments"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Edit Appointments: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Edit Appointments
                  </Badge>
                </ConditionalAccess>

                <ConditionalAccess
                  requiredPermissions={["delete_appointments"]}
                  fallback={
                    <Badge variant="outline" className="text-xs">
                      Delete Appointments: No Access
                    </Badge>
                  }
                >
                  <Badge variant="default" className="text-xs">
                    ✓ Delete Appointments
                  </Badge>
                </ConditionalAccess>
              </div>
            </div>
          </div>

          {/* System Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <ConditionalAccess
              requiredPermissions={["view_reports"]}
              fallback={
                <div className="p-3 bg-gray-100 rounded text-sm">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Reports feature requires view_reports permission
                </div>
              }
            >
              <div className="p-3 bg-green-100 rounded text-sm">
                <FileText className="h-4 w-4 inline mr-2" />
                Reports feature is available
              </div>
            </ConditionalAccess>

            <ConditionalAccess
              requiredPermissions={["manage_system_settings"]}
              fallback={
                <div className="p-3 bg-gray-100 rounded text-sm">
                  <Settings className="h-4 w-4 inline mr-2" />
                  System settings requires manage_system_settings permission
                </div>
              }
            >
              <div className="p-3 bg-green-100 rounded text-sm">
                <Settings className="h-4 w-4 inline mr-2" />
                System settings are available
              </div>
            </ConditionalAccess>
          </div>
        </CardContent>
      </Card>

      {/* Business Logic Hooks */}
      <Card>
        <CardHeader>
          <CardTitle>Business Permission Hooks</CardTitle>
          <CardDescription>
            Using the useBusinessPermissions hook for convenient permission
            checking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Can View Customers:</span>
              <Badge
                variant={canViewCustomers ? "default" : "outline"}
                className="ml-2"
              >
                {canViewCustomers ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Can Manage Customers:</span>
              <Badge
                variant={canManageCustomers ? "default" : "outline"}
                className="ml-2"
              >
                {canManageCustomers ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Can View Policies:</span>
              <Badge
                variant={canViewPolicies ? "default" : "outline"}
                className="ml-2"
              >
                {canViewPolicies ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Can Manage Policies:</span>
              <Badge
                variant={canManagePolicies ? "default" : "outline"}
                className="ml-2"
              >
                {canManagePolicies ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Can View Reports:</span>
              <Badge
                variant={canViewReports ? "default" : "outline"}
                className="ml-2"
              >
                {canViewReports ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Can Manage Settings:</span>
              <Badge
                variant={canManageSystemSettings ? "default" : "outline"}
                className="ml-2"
              >
                {canManageSystemSettings ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Section */}
      <ConditionalAccess requiredRoles={["admin", "super_admin"]}>
        <Card>
          <CardHeader>
            <CardTitle>Developer Testing</CardTitle>
            <CardDescription>
              Test various permission combinations (Admin access required)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <code>hasRole('admin')</code>: {hasRole("admin") ? "✅" : "❌"}
              </p>
              <p>
                <code>hasRole('super_admin')</code>:{" "}
                {hasRole("super_admin") ? "✅" : "❌"}
              </p>
              <p>
                <code>hasPermission('view_customers')</code>:{" "}
                {hasPermission("view_customers") ? "✅" : "❌"}
              </p>
              <p>
                <code>hasPermission('manage_users')</code>:{" "}
                {hasPermission("manage_users") ? "✅" : "❌"}
              </p>
              <p>
                <code>canAccess(['admin'], ['view_customers'])</code>:{" "}
                {canAccess(["admin"], ["view_customers"]) ? "✅" : "❌"}
              </p>
            </div>
          </CardContent>
        </Card>
      </ConditionalAccess>
    </div>
  );
};

export default PermissionDemo;
