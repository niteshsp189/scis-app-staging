import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { AvatarUpload } from "@/components/AvatarUpload";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Briefcase,
  Calendar,
  Edit3,
  Shield,
  Key,
  Save,
  X,
  Camera,
  LogOut,
} from "lucide-react";
import { authService } from "@/services/authService";
import { useSecuritySettings } from "@/hooks/useSecuritySettings";
import TwoFactorAuth from "@/components/TwoFactorAuth";

const UserProfile: React.FC = () => {
  const { user, updateProfile, logout, refreshUser } = useAuth();
  const { twoFactorAuthEnabled, loading: securitySettingsLoading } = useSecuritySettings();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Debug logging for 2FA visibility
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    company: "",
    location: "",
    avatar_url: "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  // Password validation helpers
  const passwordsMatch = passwordData.new_password && passwordData.new_password_confirmation 
    ? passwordData.new_password === passwordData.new_password_confirmation 
    : null;
  
  const isPasswordStrong = (password: string) => {
    if (!password) return false;
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&#]/.test(password);
    return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  };
  
  const canSubmitPassword = passwordData.current_password && 
    passwordData.new_password && 
    passwordData.new_password_confirmation && 
    passwordsMatch && 
    isPasswordStrong(passwordData.new_password);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        position: user.position || "",
        company: user.company || "",
        location: user.location || "",
        avatar_url: user.avatar_url || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const success = await updateProfile(formData);
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Profile update failed:", error);
    } finally {
      setIsSaving(false);
    }
  };
const handleChangePassword = async () => {
    // Client-side validation
    if (!canSubmitPassword) {
      toast({
        title: "Validation Error",
        description: "Please ensure all fields are filled correctly and passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      await authService.changePassword(passwordData);
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      setIsChangePasswordOpen(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (error: any) {
      let title = "Password change failed";
      let description = 'An unexpected error occurred';
      
      // Display specific error message from backend about password requirements
      if (error?.errors?.new_password && Array.isArray(error.errors.new_password) && error.errors.new_password.length > 0) {
        description = error.errors.new_password[0];
        
        // Add clarification about allowed special characters if the error is about special characters
        if (description.includes('special character')) {
          description += " (only @$!%*?&# are allowed)";
        }
      } else if (error?.message) {
        description = error.message;
      }

      console.log('Password change error:', error); // Debug log to see the actual error structure

      // Handle different types of responses
      if (error && typeof error === 'object') {
        // Check if it's a successful response that was misinterpreted as an error
        if (error.success === true || (error.message && error.message.includes('successful'))) {
          toast({
            title: "Password changed",
            description: "Your password has been updated successfully.",
          });
          setIsChangePasswordOpen(false);
          setPasswordData({
            current_password: '',
            new_password: '',
            new_password_confirmation: '',
          });
          return;
        }

        // Handle authService formatted errors
        if ('success' in error && error.success === false) {
          // This is our formatted error from authService
          if (error.errors && typeof error.errors === 'object') {
            const errorMessages = [];
            for (const [field, messages] of Object.entries(error.errors)) {
              if (Array.isArray(messages) && messages.length > 0) {
                // Clean up field names for display
                const fieldName = field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                let message = messages[0];
                
                // Add clarification about allowed special characters if needed
                if (message.includes('special character')) {
                  message += " (only @$!%*?&# are allowed)";
                }
                
                errorMessages.push(`${fieldName}: ${message}`);
              }
            }
            if (errorMessages.length > 0) {
              description = errorMessages.join('. ');
            } else if (error.message && error.message !== 'Please check your input and try again.') {
              description = error.message;
            }
          } else if (error.message && error.message !== 'Please check your input and try again.') {
            description = error.message;
          }
        }
      }
      // Handle axios-style errors (backup)
      else if (error?.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.errors && typeof errorData.errors === 'object') {
          const errorMessages = [];
          for (const [field, messages] of Object.entries(errorData.errors)) {
            if (Array.isArray(messages) && messages.length > 0) {
              const fieldName = field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              let message = messages[0];
              
              // Add clarification about allowed special characters if needed
              if (message.includes('special character')) {
                message += " (only @$!%*?&# are allowed)";
              }
              
              errorMessages.push(`${fieldName}: ${message}`);
            }
          }
          if (errorMessages.length > 0) {
            description = errorMessages.join('. ');
          }
        } else if (errorData.message) {
          description = errorData.message;
        }
      }
      // Handle direct error messages
      else if (error?.message) {
        description = error.message;
      }
      
      toast({
        title: title,
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
};
  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <AvatarUpload
                  key={user.avatar_url || 'no-avatar'} // Force re-render when avatar URL changes
                  currentAvatarUrl={user.avatar_url}
                  userName={user.full_name}
                  userInitials={getInitials(user.first_name, user.last_name)}
                  size="lg"
                  showEditButton={true}
                />
                <div>
                  <h3 className="text-xl font-semibold">{user.full_name}</h3>
                  <p className="text-gray-600">
                    {user.position || "No position set"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {user.roles && user.roles.length > 0 && (
                      <Badge variant="outline">{user.roles.join(", ")}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Profile Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Member Since</p>
                        <p className="font-semibold">
                          {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Last Login</p>
                        <p className="font-semibold">
                          {user.last_login_at
                            ? formatDate(user.last_login_at)
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Permissions</p>
                        <p className="font-semibold">
                          {user.permissions ? user.permissions.length : 0}{" "}
                          permissions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-gray-600">
                      Change your account password
                    </p>
                  </div>
                </div>
                <Dialog
                  open={isChangePasswordOpen}
                  onOpenChange={setIsChangePasswordOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one. New
                        password must have:
                        <ul className="list-disc pl-4 mt-2 text-sm">
                          <li>At least 8 characters</li>
                          <li>One uppercase letter</li>
                          <li>One lowercase letter</li>
                          <li>One number</li>
                          <li>One special character (only @$!%*?&# allowed)</li>
                        </ul>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current_password">
                          Current Password *
                        </Label>
                        <Input
                          id="current_password"
                          type="password"
                          value={passwordData.current_password}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              current_password: e.target.value,
                            })
                          }
                          disabled={isSaving}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new_password">New Password *</Label>
                        <div className="space-y-2">
                          <Input
                            id="new_password"
                            type="password"
                            value={passwordData.new_password}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                new_password: e.target.value,
                              })
                            }
                            disabled={isSaving}
                            className={`${
                              passwordData.new_password && !isPasswordStrong(passwordData.new_password) 
                                ? "border-orange-300" 
                                : passwordData.new_password && isPasswordStrong(passwordData.new_password)
                                ? "border-green-300"
                                : ""
                            } ${isSaving ? "bg-gray-100" : ""}`}
                            required
                          />
                          {passwordData.new_password && (
                            <div className={`text-xs p-2 rounded ${
                              isPasswordStrong(passwordData.new_password) 
                                ? "text-green-700 bg-green-50" 
                                : "text-orange-700 bg-orange-50"
                            }`}>
                              {isPasswordStrong(passwordData.new_password) 
                                ? "✓ Password meets all requirements" 
                                : "Password must meet all requirements above (special chars limited to @$!%*?&#)"}
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Password must be different from your current password
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new_password_confirmation">
                          Confirm New Password *
                        </Label>
                        <Input
                          id="new_password_confirmation"
                          type="password"
                          value={passwordData.new_password_confirmation}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              new_password_confirmation: e.target.value,
                            })
                          }
                          disabled={isSaving}
                          className={`${
                            passwordsMatch === false
                              ? "border-red-300" 
                              : passwordsMatch === true
                              ? "border-green-300"
                              : ""
                          } ${isSaving ? "bg-gray-100" : ""}`}
                          required
                        />
                        {passwordData.new_password_confirmation && passwordsMatch !== null && (
                          <div className={`text-xs p-2 rounded ${
                            passwordsMatch 
                              ? "text-green-700 bg-green-50" 
                              : "text-red-700 bg-red-50"
                          }`}>
                            {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsChangePasswordOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleChangePassword}
                          disabled={isSaving || !canSubmitPassword}
                        >
                          {isSaving ? "Changing..." : "Change Password"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Show 2FA section only when enabled in organization settings */}
              {!securitySettingsLoading && twoFactorAuthEnabled && (
                <>
                  <Separator />
                  <TwoFactorAuth 
                    userHas2FA={user?.two_factor_enabled || false}
                    onStatusChange={() => {
                      // Refresh user data when 2FA status changes
                      refreshUser();
                    }}
                  />
                </>
              )}

              {/* Debug info - remove after testing */}
              {/* <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono">
                <div>Debug Info:</div>
                <div>securitySettingsLoading: {String(securitySettingsLoading)}</div>
                <div>twoFactorAuthEnabled: {String(twoFactorAuthEnabled)}</div>
                <div>shouldShow2FA: {String(!securitySettingsLoading && twoFactorAuthEnabled)}</div>
              </div> */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
              <CardDescription>
                View your recent account activity and sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Last Login</p>
                      <p className="text-sm text-gray-600">
                        {user.last_login_at
                          ? formatDate(user.last_login_at)
                          : "Never logged in"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Account Status</p>
                      <p className="text-sm text-gray-600">
                        {user.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
