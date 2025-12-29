import { useState, useEffect, useRef } from "react";
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
import { Loader2, Smartphone, Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { handleApiError, formatValidationErrors } from "@/utils/error";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState(() => {
    // Check if we're in 2FA mode and restore email/password if available
    const stored2FA = localStorage.getItem('signin_2fa_required');
    if (stored2FA === 'true') {
      return {
        email: localStorage.getItem('signin_email') || '',
        password: localStorage.getItem('signin_password') || '',
        two_factor_code: '',
      };
    }
    return {
      email: "",
      password: "",
      two_factor_code: "",
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTwoFactor, setShowTwoFactor] = useState(() => {
    // Check localStorage for persisted 2FA state
    const stored = localStorage.getItem('signin_2fa_required');
    return stored === 'true';
  });
  const [localLoading, setLocalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const showTwoFactorRef = useRef(false);

  // Sync ref with state and localStorage
  useEffect(() => {
    showTwoFactorRef.current = showTwoFactor;
    localStorage.setItem('signin_2fa_required', showTwoFactor.toString());
  }, [showTwoFactor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrors({});
    setLocalLoading(true);

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    if (showTwoFactor && !formData.two_factor_code) {
      newErrors.two_factor_code = "Two-factor code is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLocalLoading(false);
      return;
    }

    try {
      const success = await login(formData);
      if (success) {
        // Clear 2FA state on successful login
        localStorage.removeItem('signin_2fa_required');
        localStorage.removeItem('signin_email');
        localStorage.removeItem('signin_password');
        // Get the intended destination from location state or default to dashboard
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      }
      setLocalLoading(false);
    } catch (error: any) {
      // Check if 2FA is required
      if (error?.requires_2fa) {
        setLocalLoading(false);
        setErrors({});
        
        // Preserve email and password in localStorage for 2FA submission
        localStorage.setItem('signin_email', formData.email);
        localStorage.setItem('signin_password', formData.password);
        localStorage.setItem('signin_2fa_required', 'true');
        setShowTwoFactor(true);
        showTwoFactorRef.current = true;
        return;
      }
      
      setLocalLoading(false);
      const { errors: validationErrors } = handleApiError(error, {
        title: "Sign In Failed",
        defaultMessage:
          "Unable to sign in. Please check your credentials and try again.",
      });

      // Set field-level validation errors if any
      if (Object.keys(validationErrors).length > 0) {
        setErrors(formatValidationErrors(validationErrors));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/uploads/Maha-Shahwan-150x150.jpg" alt="SCIS Logo" className="h-8 w-8" />
            <span className="text-2xl font-bold">SCIS (t1) </span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              {showTwoFactor && <Smartphone className="h-5 w-5" />}
              {showTwoFactor ? "Two-Factor Authentication" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {showTwoFactor 
                ? "Enter the 6-digit code from your authenticator app"
                : "Sign in to your SCIS account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" key={showTwoFactor ? 'two-factor' : 'login'}>
              {!showTwoFactor ? (
                <>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                        className={errors.email ? "border-red-500" : ""}
                        placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required
                        className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                        placeholder="Enter your password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="two_factor_code">Verification Code</Label>
                  <Input
                    id="two_factor_code"
                    value={formData.two_factor_code}
                    onChange={(e) =>
                      setFormData({ 
                        ...formData, 
                        two_factor_code: e.target.value.replace(/\D/g, '').slice(0, 6)
                      })
                    }
                    placeholder="000000"
                    className={`text-center text-lg tracking-widest ${errors.two_factor_code ? "border-red-500" : ""}`}
                    maxLength={6}
                    autoFocus
                  />
                  {errors.two_factor_code && (
                    <p className="text-sm text-red-500 mt-1">{errors.two_factor_code}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {showTwoFactor && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowTwoFactor(false);
                      localStorage.setItem('signin_2fa_required', 'false');
                      localStorage.removeItem('signin_email');
                      localStorage.removeItem('signin_password');
                      setFormData({ email: "", password: "", two_factor_code: "" });
                      setErrors({});
                    }}
                  >
                    Back
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className={showTwoFactor ? "flex-1" : "w-full"} 
                  disabled={localLoading}
                >
                  {localLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {showTwoFactor ? "Verifying..." : "Signing In..."}
                    </>
                  ) : (
                    showTwoFactor ? "Verify & Sign In" : "Sign In"
                  )}
                </Button>
              </div>
            </form>

            {/* <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => navigate("/signup")}
                >
                  Sign up
                </Button>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Test credentials: admin@insurecrm.com / Admin@1234
              </p>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
