import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Users,
  Shield,
  Settings,
  UserCheck,
  Crown,
  Star,
  Loader2,
  Search,
  Plus,
  Copy,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { AddRoleDialog } from "@/components/dialogs/AddRoleDialog";
import { rolesApi, Role, Permission, RoleFilters } from "@/services/rolesApi";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPermissionError, isPermissionError, getErrorData } from "@/utils/permissionErrorHandler";
import { usePermissions } from "@/contexts/PermissionContext";

const getRoleColor = (name: string) => {
  switch (name.toLowerCase()) {
    case "admin":
      return "bg-gradient-to-br from-purple-500 to-purple-600";
    case "sales manager":
      return "bg-gradient-to-br from-blue-500 to-blue-600";
    case "sales agent":
      return "bg-gradient-to-br from-green-500 to-green-600";
    case "support agent":
      return "bg-gradient-to-br from-orange-500 to-orange-600";
    default:
      return "bg-gradient-to-br from-gray-500 to-gray-600";
  }
};

const getRoleIcon = (name: string) => {
  switch (name.toLowerCase()) {
    case "admin":
      return Crown;
    case "sales manager":
      return UserCheck;
    case "sales agent":
      return Users;
    case "support agent":
      return Settings;
    default:
      return Shield;
  }
};

const getRolePriority = (level: number) => {
  if (level >= 8) return "high";
  if (level >= 5) return "medium";
  return "standard";
};

export function RolesPermissions() {
  const { hasPermission } = usePermissions();
  const canManageRoles = hasPermission("manage_roles");
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRoles, setTotalRoles] = useState(0);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const fetchRoles = async (filters?: RoleFilters) => {
    try {
      setLoading(true);
      const response = await rolesApi.getAll({
        page: currentPage,
        per_page: 10,
        search: searchTerm,
        status: selectedStatus === "all" ? "" : selectedStatus,
        sort_by: "created_at",
        sort_order: "desc",
        with_permissions: true,
        ...filters,
      });

      if (response.success) {
        setRoles(response.data.data);
        setTotalPages(response.data.last_page);
        setTotalRoles(response.data.total);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch roles",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // Check if it's a permission error (403)
      if (isPermissionError(error)) {
        const errorData = getErrorData(error);
        toast({
          title: "Insufficient Permissions",
          description: formatPermissionError(errorData),
          variant: "default",
          className: "bg-blue-50 border-blue-200",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch roles",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await rolesApi.getPermissions();
      if (response.success) {
        setPermissions(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      // Check if it's a permission error (403)
      if (isPermissionError(error)) {
        const errorData = getErrorData(error);
        toast({
          title: "Insufficient Permissions",
          description: formatPermissionError(errorData),
          variant: "default",
          className: "bg-blue-50 border-blue-200",
        });
      } else {
        console.error("Failed to fetch permissions:", error);
      }
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [currentPage, searchTerm, selectedStatus]);

  const handleAddRole = async (
    newRole: any,
    setValidationErrors: (errors: { [key: string]: string[] }) => void,
  ): Promise<boolean> => {
    try {
      const response = await rolesApi.create(newRole);
      if (response.success) {
        toast({
          title: "Role Created",
          description: "New role has been created successfully.",
        });
        fetchRoles();
        return true;
      } else {
        if (response.errors) {
          setValidationErrors(response.errors);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to create role",
            variant: "destructive",
          });
        }
        return false;
      }
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to create role",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleEditRole = async (
    updatedRole: any,
    setValidationErrors: (errors: { [key: string]: string[] }) => void,
  ): Promise<boolean> => {

    if (!editingRole) {
      console.error("No editingRole found");
      toast({
        title: "Error",
        description: "No role selected for editing",
        variant: "destructive",
      });
      return false;
    }

    try {
      
      const response = await rolesApi.update(editingRole.id, updatedRole);
      
      if (response.success) {
        
        toast({
          title: "Role Updated",
          description: "Role has been updated successfully.",
        });
        setEditingRole(null);
        fetchRoles();
        return true;
      } else {
        console.error("Update failed with response:", response);
        if (response.errors) {
          setValidationErrors(response.errors);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to update role",
            variant: "destructive",
          });
        }
        return false;
      }
    } catch (error: any) {
      console.error("Update error caught:", error);
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to update role",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    try {
      const role = roles.find((r) => r.id === roleId);
      if (role && role.users_count && role.users_count > 0) {
        toast({
          title: "Cannot Delete Role",
          description: `Cannot delete role "${role.name}" as it has ${role.users_count} users assigned.`,
          variant: "destructive",
        });
        return;
      }

      setIsDeletingRole(true);
      const response = await rolesApi.delete(roleId);
      if (response.success) {
        toast({
          title: "Role Deleted",
          description: "Role has been deleted successfully.",
        });
        fetchRoles();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete role",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete role",
        variant: "destructive",
      });
    } finally {
      setIsDeletingRole(false);
      setRoleToDelete(null);
    }
  };

  const handleDuplicateRole = async (roleId: number) => {
    try {
      const response = await rolesApi.duplicate(roleId);
      if (response.success) {
        toast({
          title: "Role Duplicated",
          description: "Role has been duplicated successfully.",
        });
        fetchRoles();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to duplicate role",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to duplicate role",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Section - Adjusted padding */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-5 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Roles & Permissions
                </h2>
                <p className="text-slate-600 text-base">
                  Define what each role can access and modify ({totalRoles}{" "}
                  total)
                </p>
              </div>
            </div>
          </div>
          {canManageRoles && (
            <AddRoleDialog onAddRole={handleAddRole} permissions={permissions} />
          )}
        </div>

        {/* Stats Overview - Adjusted grid gap */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          {/* Stats cards with adjusted padding */}
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Roles</p>
                <p className="text-xl font-bold text-slate-900">{totalRoles}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Users</p>
                <p className="text-xl font-bold text-slate-900">
                  {roles.reduce(
                    (sum, role) => sum + (role.users_count || 0),
                    0,
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Roles</p>
                <p className="text-xl font-bold text-slate-900">
                  {roles.filter((role) => role.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Adjusted gap */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedStatus} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Roles Grid - Updated grid breakpoints and spacing */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500">Loading roles...</span>
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || selectedStatus
            ? "No roles found matching your filters."
            : "No roles found. Create your first role to get started."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-5">
          {roles.map((role) => {
            const IconComponent = getRoleIcon(role.name);
            const roleColor = getRoleColor(role.name);
            const priority = getRolePriority(role.level);

            return (
              <Card
                key={role.id}
                className="group hover:shadow-lg transition-all duration-300 border border-slate-200 max-w-[500px] mx-auto w-full"
              >
                {/* Role Header - Adjusted padding */}
                <div
                  className={`${roleColor} p-4 text-white relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-6 translate-x-6"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {role.name}
                          </h3>
                          <p className="text-white/80 text-xs">
                            {role.description}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`${getPriorityColor(priority)} text-xs font-medium border`}
                      >
                        {priority}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-white/90">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">
                        {role.users_count || 0}{" "}
                        {role.users_count === 1 ? "user" : "users"} assigned
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4 space-y-4">
                  {/* Permissions Section - Adjusted spacing */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-slate-600" />
                      Permissions
                    </h4>
                    <div className="space-y-1.5">
                      {role.permissions?.slice(0, 3).map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center gap-1.5 text-xs text-slate-700"
                        >
                          <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                          <span>
                            {permission.name
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                      )) || (
                        <div className="text-xs text-slate-500">
                          No permissions assigned
                        </div>
                      )}
                      {role.permissions && role.permissions.length > 3 && (
                        <div className="text-xs text-slate-500 font-medium pl-2.5">
                          +{role.permissions.length - 3} more permissions
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Adjusted spacing - Only show if user has manage_roles permission */}
                  {canManageRoles && (
                    <div className="flex gap-1.5 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRole(role)}
                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateRole(role.id)}
                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRoleToDelete(role.id)}
                        disabled={(role.users_count || 0) > 0}
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination - Adjusted margin */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * 10 + 1} to{" "}
            {Math.min(currentPage * 10, totalRoles)} of {totalRoles} roles
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialog components remain unchanged */}
      {editingRole && (
        <AddRoleDialog
          editRole={editingRole}
          onEditRole={handleEditRole}
          onAddRole={handleAddRole}
          permissions={permissions}
          open={!!editingRole}
          onClose={() => setEditingRole(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!roleToDelete}
        onOpenChange={() => setRoleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              role and remove all associated permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingRole}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roleToDelete && handleDeleteRole(roleToDelete)}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingRole}
            >
              {isDeletingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Role"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
