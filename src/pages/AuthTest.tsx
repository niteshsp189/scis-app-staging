import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { authService } from "@/services/authService";

const AuthTest = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [testEmail, setTestEmail] = useState("admin@insurecrm.com");
  const [testPassword, setTestPassword] = useState("password123");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  const handleTestLogin = async () => {
    setIsTestLoading(true);
    setTestResult(null);

    try {
      const response = await authService.login({
        email: testEmail,
        password: testPassword,
      });

      if (response.success) {
        setTestResult("✅ Login successful: " + response.message);
      } else {
        setTestResult("❌ Login failed: " + response.message);
      }
    } catch (error) {
      setTestResult(
        "❌ Error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsTestLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Authentication Test
        </h1>

        <div className="space-y-6">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isAuthenticated ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Authentication Status
              </CardTitle>
              <CardDescription>Current authentication state</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? "Authenticated" : "Not Authenticated"}
              </Badge>
            </CardContent>
          </Card>

          {/* User Information */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>
                  Details of the authenticated user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-lg">{user.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-lg">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Position
                      </p>
                      <p className="text-lg">
                        {user.position || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Company
                      </p>
                      <p className="text-lg">
                        {user.company || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-lg">{user.phone || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Location
                      </p>
                      <p className="text-lg">
                        {user.location || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {user.roles && user.roles.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Roles</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.roles.map((role, index) => (
                          <Badge key={index} variant="outline">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {user.permissions && user.permissions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Permissions
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.permissions.map((permission, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Test authentication actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isAuthenticated ? (
                  <>
                    <Button
                      onClick={() => (window.location.href = "/dashboard")}
                      className="w-full"
                    >
                      Go to Dashboard
                    </Button>
                    <Button
                      onClick={() => (window.location.href = "/profile")}
                      variant="outline"
                      className="w-full"
                    >
                      View Profile
                    </Button>
                    <Button
                      onClick={logout}
                      variant="destructive"
                      className="w-full"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => (window.location.href = "/signin")}
                      className="w-full"
                    >
                      Go to Sign In
                    </Button>
                    <Button
                      onClick={() => (window.location.href = "/signup")}
                      variant="outline"
                      className="w-full"
                    >
                      Go to Sign Up
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Login Test */}
          <Card>
            <CardHeader>
              <CardTitle>Login Test</CardTitle>
              <CardDescription>
                Test login functionality and error handling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="test-email">Email</Label>
                    <Input
                      id="test-email"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="test-password">Password</Label>
                    <Input
                      id="test-password"
                      type="password"
                      value={testPassword}
                      onChange={(e) => setTestPassword(e.target.value)}
                      placeholder="Password"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleTestLogin}
                  disabled={isTestLoading}
                  className="w-full"
                >
                  {isTestLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Login"
                  )}
                </Button>

                {testResult && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-mono">{testResult}</p>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <p>
                    Try with correct credentials: admin@insurecrm.com /
                    password123
                  </p>
                  <p>Try with wrong credentials to test error handling</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Test */}
          <Card>
            <CardHeader>
              <CardTitle>API Test</CardTitle>
              <CardDescription>Test API connectivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>API URL:</strong>{" "}
                  {import.meta.env.VITE_API_URL}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Environment:</strong>{" "}
                  {import.meta.env.VITE_ENV || "development"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;
