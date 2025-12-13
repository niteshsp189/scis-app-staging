import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, UserCheck, Shield, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Permission {
  id: number;
  name: string;
  description?: string;
  category: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
  level?: number;
}

interface ValidationErrors {
  [key: string]: string[];
}

interface AddRoleDialogProps {
  onAddRole?: (role: any, setValidationErrors: (errors: ValidationErrors) => void) => Promise<boolean>;
  editRole?: Role;
  onEditRole?: (role: any, setValidationErrors: (errors: ValidationErrors) => void) => Promise<boolean>;
  permissions: Permission[];
  open?: boolean;
  onClose?: () => void;
}

export function AddRoleDialog({
  onAddRole,
  editRole,
  onEditRole,
  permissions,
  open: controlledOpen,
  onClose,
}: AddRoleDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [level, setLevel] = useState(1);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOpen !== undefined
    ? (open: boolean) => {
        if (!open && onClose) {
          onClose();
          setValidationErrors({});
        }
      }
    : (open: boolean) => {
        setInternalOpen(open);
        if (!open) setValidationErrors({});
      };

  useEffect(() => {
    if (editRole) {
      setRoleName(editRole.name || "");
      setDescription(editRole.description || "");
      setSelectedPermissions(editRole.permissions?.map((p) => p.id) || []);
      setLevel(editRole.level || 1);
    } else {
      setRoleName("");
      setDescription("");
      setSelectedPermissions([]);
      setLevel(1);
    }
    setValidationErrors({});
  }, [editRole]);

  const getFieldError = (field: string) => {
    return validationErrors[field]?.[0];
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    } else {
      setSelectedPermissions(
        selectedPermissions.filter((id) => id !== permissionId),
      );
    }
  };

  // Group permissions by category
  const permissionsByCategory = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setIsSubmitting(true);

    if (!roleName.trim()) {
      setValidationErrors({
        name: ["Role name is required"]
      });
      setIsSubmitting(false);
      return;
    }

    if (selectedPermissions.length === 0) {
      setValidationErrors({
        permissions: ["At least one permission must be selected"]
      });
      setIsSubmitting(false);
      return;
    }

    const roleData = {
      name: roleName,
      description: description,
      permissions: selectedPermissions,
      level: level,
      is_active: true,
    };

    try {
      let success = false;
      if (editRole && onEditRole) {
        success = await onEditRole(roleData, setValidationErrors);
      } else if (onAddRole) {
        success = await onAddRole(roleData, setValidationErrors);
      }

      if (success) {
        setOpen(false);
        setRoleName("");
        setDescription("");
        setSelectedPermissions([]);
        setLevel(1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
            {editRole ? (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Edit Role
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </>
            )}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {editRole ? "Edit Role" : "Create New Role"}
              </DialogTitle>
              <DialogDescription className="text-base">
                {editRole
                  ? "Update the role details and permissions."
                  : "Create a new role with specific permissions and responsibilities."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-slate-50 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="roleName"
                  className="text-sm font-medium text-slate-700"
                >
                  Role Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="roleName"
                  placeholder="e.g., Sales Representative"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className={`mt-1 ${getFieldError('name') ? 'border-red-500' : ''}`}
                  required
                />
                {getFieldError('name') && (
                  <p className="text-sm text-red-500 mt-1">{getFieldError('name')}</p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-slate-700"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this role..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`mt-1 ${getFieldError('description') ? 'border-red-500' : ''}`}
                  rows={3}
                />
                {getFieldError('description') && (
                  <p className="text-sm text-red-500 mt-1">{getFieldError('description')}</p>
                )}
              </div>
            </div>
            <div>
              <Label
                htmlFor="level"
                className="text-sm font-medium text-slate-700"
              >
                Level (1-10)
              </Label>
              <Input
                id="level"
                type="number"
                min="1"
                max="10"
                placeholder="1"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
                className={`mt-1 ${getFieldError('level') ? 'border-red-500' : ''}`}
              />
              {getFieldError('level') && (
                <p className="text-sm text-red-500 mt-1">{getFieldError('level')}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Higher levels indicate more authority
              </p>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Permissions ({selectedPermissions.length} selected)
            </h3>

            {getFieldError('permissions') && (
              <p className="text-sm text-red-500">{getFieldError('permissions')}</p>
            )}

            <div className="space-y-6">
              {Object.entries(permissionsByCategory).map(
                ([category, permissions]) => (
                  <div
                    key={category}
                    className="bg-white border border-slate-200 rounded-xl p-5"
                  >
                    <h4 className="font-semibold text-slate-900 mb-4 text-base">
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={selectedPermissions.includes(
                              permission.id,
                            )}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                permission.id,
                                checked as boolean,
                              )
                            }
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <div className="flex flex-col">
                            <Label
                              htmlFor={`permission-${permission.id}`}
                              className="text-sm font-normal cursor-pointer text-slate-700 leading-relaxed"
                            >
                              {permission.name
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Label>
                            {permission.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {permission.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editRole ? "Updating..." : "Creating..."}
                </>
              ) : (
                editRole ? "Update Role" : "Create Role"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
