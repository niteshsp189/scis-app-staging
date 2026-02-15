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
  UserCheck,
  MapPin,
  Plus,
  Search,
  Filter,
  Users,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { AddEmployeeDialog } from "@/components/dialogs/AddEmployeeDialog";
import { EditEmployeeDialog } from "@/components/dialogs/EditEmployeeDialog";
import {
  teamMembersApi,
  TeamMember,
  Role,
  TeamMemberFilters,
} from "@/services/teamMembersApi";
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
import { usePermissions } from "@/contexts/PermissionContext";
import { ConditionalAccess } from "@/components/ProtectedRoute";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function EmployeeManagement() {
  const { hasPermission } = usePermissions();
  const [employees, setEmployees] = useState<TeamMember[]>([]);

  // Permission checks
  const canViewUsers = hasPermission("view_users");
  const canCreateUsers = hasPermission("create_users");
  const canUpdateUsers = hasPermission("update_users");
  const canDeleteUsers = hasPermission("delete_users");
  const canManageUsers = hasPermission("manage_users");
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<TeamMember | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);

  const fetchEmployees = async (filters?: TeamMemberFilters) => {
    try {
      setLoading(true);
      const response = await teamMembersApi.getAll({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        role: selectedRole === "all" ? "" : selectedRole,
        status: selectedStatus === "all" ? "" : selectedStatus,
        sort_by: "created_at",
        sort_order: "desc",
        ...filters,
      });

      if (response.success) {
        setEmployees(response.data.data);
        setTotalPages(response.data.last_page);
        setTotalEmployees(response.data.total);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch team members",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await teamMembersApi.getAvailableRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, [currentPage, perPage]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchEmployees();
    }
  }, [searchTerm, selectedRole, selectedStatus]);

  const handleAddEmployee = async (
    newEmployee: any,
    setValidationErrors: (errors: { [key: string]: string[] }) => void,
  ): Promise<boolean> => {
    try {
      const response = await teamMembersApi.create(newEmployee);
      if (response.success) {
        await fetchEmployees();
        toast({
          title: "Success",
          description: "New team member has been added successfully.",
        });
        return true;
      } else {
        if (response.errors) {
          setValidationErrors(response.errors);
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to add team member",
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
          description:
            error.response?.data?.message || "Failed to add team member",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleEditEmployee = (employee: TeamMember) => {
    setEditingEmployee(employee);
  };

  const handleUpdateEmployee = async (updatedEmployee: any) => {
    try {
      // Check if password is being updated
      const hasPasswordUpdate =
        updatedEmployee.password && updatedEmployee.password_confirmation;

      // Prepare profile data (exclude password fields)
      const { password, password_confirmation, ...profileData } =
        updatedEmployee;

      // First, update the profile information
      const response = await teamMembersApi.update(
        editingEmployee!.id,
        profileData,
      );

      if (!response.success) {
        toast({
          title: "Error",
          description: response.message || "Failed to update employee profile",
          variant: "destructive",
        });
        return;
      }

      // If password needs to be updated, make a separate call
      if (hasPasswordUpdate) {
        try {
          const passwordResponse = await teamMembersApi.updatePassword(
            editingEmployee!.id,
            password,
            password_confirmation,
          );

          if (!passwordResponse.success) {
            toast({
              title: "Profile Updated, Password Failed",
              description:
                passwordResponse.message ||
                "Profile updated but password change failed",
              variant: "destructive",
            });
            setEditingEmployee(null);
            fetchEmployees();
            return;
          }

          toast({
            title: "Employee Updated",
            description:
              "Employee information and password have been updated successfully.",
          });
        } catch (passwordError: any) {
          toast({
            title: "Profile Updated, Password Failed",
            description:
              passwordError.response?.data?.message ||
              "Profile updated but password change failed",
            variant: "destructive",
          });
          setEditingEmployee(null);
          fetchEmployees();
          return;
        }
      } else {
        toast({
          title: "Employee Updated",
          description: "Employee information has been updated successfully.",
        });
      }

      setEditingEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update employee",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      setIsDeletingEmployee(true);
      const response = await teamMembersApi.delete(id);
      if (response.success) {
        toast({
          title: "Employee Deleted",
          description: "Employee has been removed from the system.",
        });
        fetchEmployees();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete employee",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete employee",
        variant: "destructive",
      });
    } finally {
      setIsDeletingEmployee(false);
      setEmployeeToDelete(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await teamMembersApi.toggleStatus(id);
      if (response.success) {
        toast({
          title: "Status Updated",
          description: "Employee status has been updated successfully.",
        });
        fetchEmployees();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (value: string) => {
    setSelectedRole(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              Manage your team members, their roles, and access levels (
              {totalEmployees} total)
            </CardDescription>
          </div>
          <ConditionalAccess
            requiredPermissions={["create_users"]}
            fallback={
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You can view team members but don't have permission to create
                  new users.
                </AlertDescription>
              </Alert>
            }
          >
            <AddEmployeeDialog
              onAddEmployee={handleAddEmployee}
              roles={roles}
            />
          </ConditionalAccess>
        </div>
      </CardHeader>
      <CardContent>
        {/* Permission check for viewing users */}
        {!canViewUsers ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to view team members. Please contact
              your administrator.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search team members..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedRole} onValueChange={handleRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Team Members List */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-500">
                    Loading team members...
                  </span>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || selectedRole || selectedStatus
                    ? "No team members found matching your filters."
                    : "No team members found. Add your first team member to get started."}
                </div>
              ) : (
                employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {employee.first_name?.[0]}
                          {employee.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {employee.first_name} {employee.last_name}
                          </h3>
                          {employee.roles?.some((role) =>
                            role.name.toLowerCase().includes("agent"),
                          ) && <UserCheck className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-sm text-gray-600">
                          {employee.email}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {employee.position && (
                            <p className="text-xs text-gray-500">
                              {employee.position}
                            </p>
                          )}
                          {employee.office_locations && employee.office_locations.length > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              <MapPin className="h-3 w-3 text-blue-500" />
                              {employee.office_locations.map((loc) => (
                                <Badge key={loc.id} variant="outline" className="text-xs py-0 px-1.5">
                                  {loc.name}
                                </Badge>
                              ))}
                            </div>
                          ) : employee.location ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-blue-500" />
                              <span className="text-xs text-blue-600">
                                {employee.location}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex gap-2 mb-1 flex-wrap">
                          {employee.roles?.map((role) => (
                            <Badge
                              key={role.id}
                              variant={
                                employee.is_active ? "default" : "secondary"
                              }
                            >
                              {role.name}
                            </Badge>
                          ))}
                          <Badge
                            variant={
                              employee.is_active ? "default" : "secondary"
                            }
                          >
                            {employee.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {employee.phone && (
                          <p className="text-xs text-gray-500">
                            {employee.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <ConditionalAccess
                          requiredPermissions={["update_users"]}
                          fallback={null}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ConditionalAccess>
                        <ConditionalAccess
                          requiredPermissions={["delete_users"]}
                          fallback={null}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEmployeeToDelete(employee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </ConditionalAccess>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * perPage + 1} to{" "}
                    {Math.min(currentPage * perPage, totalEmployees)} of{" "}
                    {totalEmployees} team members
                  </div>
                  <Select value={perPage.toString()} onValueChange={(value) => {
                    setPerPage(Number(value));
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="25">25 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                      <SelectItem value="100">100 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
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
          </>
        )}
      </CardContent>

      {editingEmployee && (
        <EditEmployeeDialog
          employee={editingEmployee}
          roles={roles}
          open={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onUpdateEmployee={handleUpdateEmployee}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!employeeToDelete}
        onOpenChange={() => setEmployeeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              employee and remove all their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingEmployee}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                employeeToDelete && handleDeleteEmployee(employeeToDelete)
              }
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingEmployee}
            >
              {isDeletingEmployee ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Employee"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
