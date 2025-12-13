import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Smartphone, Key, Copy, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface TwoFactorStatus {
  enabled: boolean;
  confirmed: boolean;
  recovery_codes_count: number;
  session_verified: boolean;
}

interface TwoFactorSetup {
  secret: string;
  qr_code_url: string;
  recovery_codes: string[];
}

export function TwoFactorSettings() {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

  useEffect(() => {
    loadStatus();
  }, [user?.two_factor_enabled]); // Add dependency on user 2FA status

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/2fa/status");
      setStatus(response.data);
    } catch (error) {
      console.error("Failed to load 2FA status:", error);
      toast({
        title: "Error",
        description: "Failed to load 2FA status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    try {
      setSetupLoading(true);
      const response = await api.post("/auth/2fa/enable", { password });
      setSetupData(response.data);
      setShowSetupDialog(true);
      setPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to setup 2FA",
        variant: "destructive",
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    try {
      setVerifyLoading(true);
      await api.post("/auth/2fa/confirm", { code: verificationCode });
      setShowSetupDialog(false);
      setShowVerifyDialog(false);
      setVerificationCode("");
      await loadStatus();
      await refreshUser(); // Refresh user data in auth context
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    try {
      setDisableLoading(true);
      await api.post("/auth/2fa/disable", { 
        password,
        code: verificationCode || undefined 
      });
      setShowDisableDialog(false);
      setPassword("");
      setVerificationCode("");
      await loadStatus();
      await refreshUser(); // Refresh user data in auth context
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to disable 2FA",
        variant: "destructive",
      });
    } finally {
      setDisableLoading(false);
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    try {
      setRecoveryLoading(true);
      const response = await api.post("/auth/2fa/recovery-codes", { password });
      setRecoveryCodes(response.data.recovery_codes);
      setShowRecoveryDialog(true);
      setPassword("");
      await loadStatus();
      toast({
        title: "Recovery Codes Generated",
        description: "New recovery codes have been generated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate recovery codes",
        variant: "destructive",
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label>Status</Label>
                <Badge variant={(status?.enabled || user?.two_factor_enabled) ? "default" : "secondary"}>
                  {(status?.enabled || user?.two_factor_enabled) ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {(status?.enabled || user?.two_factor_enabled)
                  ? "2FA is protecting your account"
                  : "2FA is not enabled"}
              </p>
            </div>
            {(status?.enabled || user?.two_factor_enabled) ? (
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecoveryDialog(true)}
                  disabled={recoveryLoading}
                >
                  {recoveryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recovery Codes
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDisableDialog(true)}
                >
                  Disable 2FA
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowSetupDialog(true)}>
                <Shield className="mr-2 h-4 w-4" />
                Enable 2FA
              </Button>
            )}
          </div>

          {(status?.enabled || user?.two_factor_enabled) && (
            <div className="space-y-2">
              <Label>Recovery Codes</Label>
              <p className="text-sm text-gray-500">
                You have {status.recovery_codes_count} recovery codes remaining
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Enable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              {setupData ? "Scan the QR code and enter verification code" : "Enter your password to begin setup"}
            </DialogDescription>
          </DialogHeader>
          
          {!setupData ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Current Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleEnable2FA} disabled={setupLoading}>
                  {setupLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <img 
                  src={setupData.qr_code_url} 
                  alt="2FA QR Code" 
                  className="mx-auto border rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Scan with your authenticator app
                </p>
              </div>
              
              <div>
                <Label>Manual Entry Key</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={setupData.secret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(setupData.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowSetupDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirm2FA} disabled={verifyLoading}>
                  {verifyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Enable
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              This will remove 2FA protection from your account. Enter your password and verification code to confirm.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="disablePassword">Current Password</Label>
              <Input
                id="disablePassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>
            
            <div>
              <Label htmlFor="disableCode">Verification Code</Label>
              <Input
                id="disableCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code from your authenticator"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisableDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={disableLoading}
            >
              {disableLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recovery Codes Dialog */}
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Recovery Codes
            </DialogTitle>
            <DialogDescription>
              Save these recovery codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </DialogDescription>
          </DialogHeader>
          
          {recoveryCodes.length === 0 ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="recoveryPassword">Current Password</Label>
                <Input
                  id="recoveryPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleRegenerateRecoveryCodes} disabled={recoveryLoading}>
                  {recoveryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate New Codes
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded font-mono text-sm"
                  >
                    <span>{code}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(recoveryCodes.join('\n'))}
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All
                </Button>
                <Button
                  onClick={() => setShowRecoveryDialog(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
