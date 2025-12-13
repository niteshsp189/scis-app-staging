import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Shield, Smartphone, Key, AlertTriangle, CheckCircle, Copy, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';

interface TwoFactorAuthProps {
  userHas2FA?: boolean;
  onStatusChange?: () => void;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ 
  userHas2FA = false,
  onStatusChange 
}) => {
  const [isEnabled, setIsEnabled] = useState(userHas2FA);
  const [isEnableDialogOpen, setIsEnableDialogOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [setupKey, setSetupKey] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [enablePassword, setEnablePassword] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableVerificationCode, setDisableVerificationCode] = useState('');
  const [disableRecoveryCode, setDisableRecoveryCode] = useState('');
  const [useRecoveryCodeForDisable, setUseRecoveryCodeForDisable] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [step, setStep] = useState<'password' | 'verify'>('password');
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [hasRefreshedAfter2FA, setHasRefreshedAfter2FA] = useState(false);

  useEffect(() => {
    setIsEnabled(userHas2FA);
  }, [userHas2FA]);

  const handleEnable2FA = async () => {
    if (!enablePassword) {
      toast({
        title: "Password Required",
        description: "Please enter your current password to enable 2FA",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.security.twoFactor.enable(enablePassword);

      if (response.qr_code_image && response.secret) {
        setQrCodeUrl(response.qr_code_image);
        setSetupKey(response.secret);
        setStep('verify');
      } else {
        console.error('🔧 [TwoFactorAuth] Missing QR code data:', response);
        toast({
          title: "Setup Error",
          description: "Failed to generate QR code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('🔧 [TwoFactorAuth] Enable 2FA error:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to enable 2FA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.security.twoFactor.confirm(verificationCode);

      // 2FA was successfully enabled
      setIsEnabled(true);
      setIsEnableDialogOpen(false);
      
      if (response.recovery_codes) {
        // Show recovery codes first - don't refresh page yet
        setRecoveryCodes(response.recovery_codes);
        setIsRecoveryDialogOpen(true);
        setHasRefreshedAfter2FA(false); // Reset refresh flag
      } else {
        // If no recovery codes in response, show success and refresh
        toast({
          title: "2FA Enabled",
          description: response.message || "Two-factor authentication has been successfully enabled",
        });
        
        // Call onStatusChange to refresh parent data only if no recovery codes to show
        if (onStatusChange) {
          setTimeout(() => {
            onStatusChange();
          }, 100);
        }
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error?.response?.data?.message || "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast({
        title: "Password Required",
        description: "Please enter your password to disable 2FA",
        variant: "destructive",
      });
      return;
    }

    if (useRecoveryCodeForDisable) {
      if (!disableRecoveryCode || disableRecoveryCode.length !== 10) {
        toast({
          title: "Recovery Code Required",
          description: "Please enter a valid 10-character recovery code",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!disableVerificationCode || disableVerificationCode.length !== 6) {
        toast({
          title: "Verification Code Required",
          description: "Please enter a valid 6-digit verification code from your authenticator app",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setLoading(true);
      const requestData: any = { password: disablePassword };
      
      if (useRecoveryCodeForDisable) {
        requestData.recovery_code = disableRecoveryCode;
      } else {
        requestData.code = disableVerificationCode;
      }
      
      await api.security.twoFactor.disable(requestData);
      
      setIsEnabled(false);
      setIsDisableDialogOpen(false);
      setDisablePassword('');
      setDisableVerificationCode('');
      setDisableRecoveryCode('');
      setUseRecoveryCodeForDisable(false);
      
      // Call onStatusChange to refresh parent data with delay
      if (onStatusChange) {
        setTimeout(() => {
          onStatusChange();
        }, 100);
      }
      
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to disable 2FA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    if (!regeneratePassword) {
      toast({
        title: "Password Required",
        description: "Please enter your password to regenerate recovery codes",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await api.security.twoFactor.regenerateRecoveryCodes(regeneratePassword);
      
      if (response.recovery_codes) {
        setRecoveryCodes(response.recovery_codes);
        setIsRecoveryDialogOpen(true);
        setIsRegenerateDialogOpen(false);
        setRegeneratePassword('');
        
        toast({
          title: "Recovery Codes Generated",
          description: "New recovery codes have been generated",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to generate recovery codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Copied to clipboard",
      });
    });
  };

  const downloadRecoveryCodes = () => {
    const content = recoveryCodes.map((code, index) => `${index + 1}. ${code}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetEnableDialog = () => {
    setStep('password');
    setVerificationCode('');
    setEnablePassword('');
    setQrCodeUrl('');
    setSetupKey('');
    setHasRefreshedAfter2FA(false);
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-gray-600" />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">Two-Factor Authentication</p>
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            {isEnabled 
              ? "Your account is protected with 2FA" 
              : "Add an extra layer of security to your account"
            }
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {!isEnabled ? (
          <Dialog 
            open={isEnableDialogOpen} 
            onOpenChange={(open) => {
              setIsEnableDialogOpen(open);
              if (!open) resetEnableDialog();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">Enable 2FA</Button>
            </DialogTrigger>
            {/* DialogContent with consistent padding */}
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto px-6 py-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Enable Two-Factor Authentication
                </DialogTitle>
                <DialogDescription>
                  {step === 'password' ? (
                    "Enter your current password to begin 2FA setup"
                  ) : (
                    "Scan the QR code with your authenticator app and enter the verification code"
                  )}
                </DialogDescription>
              </DialogHeader>
              
              {/* This inner div correctly has overflow-x-auto removed */}
              <div className="flex-1 overflow-y-auto">
                {step === 'password' && (
                  <div className="space-y-4 px-4"> {/* ADDED px-4 HERE */}
                    <div className="space-y-2">
                      <Label htmlFor="enable_password">Current Password</Label>
                      <Input
                        id="enable_password"
                        type="password"
                        value={enablePassword}
                        onChange={(e) => setEnablePassword(e.target.value)}
                        placeholder="Enter your current password"
                        // REVERTED mx-2, relying on parent padding
                        // className="mx-2" 
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleEnable2FA}
                        disabled={loading || !enablePassword}
                      >
                        {loading ? "Setting up..." : "Continue"}
                      </Button>
                    </div>
                  </div>
                )}

                {step === 'verify' && (
                  <div className="space-y-4 px-4"> {/* ADDED px-4 HERE */}
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-2">Step 1: Install an authenticator app</p>
                      <p>If you haven't already, download and install an authenticator app like:</p>
                      <ul className="list-disc pl-4 mt-1 mb-4">
                        <li>Google Authenticator</li>
                        <li>Microsoft Authenticator</li>
                        <li>Authy</li>
                      </ul>
                      <p className="font-medium mb-2">Step 2: Scan QR code or enter setup key</p>
                    </div>
                    
                    {qrCodeUrl && (
                      <div className="flex justify-center py-4">
                        <img src={qrCodeUrl} alt="QR Code" className="border rounded max-w-full h-auto" />
                      </div>
                    )}
                    
                    {setupKey && (
                      <div className="space-y-2">
                        <Label>Or enter this setup key manually:</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={setupKey} 
                            readOnly 
                            className="text-sm font-mono"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(setupKey)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="verification_code">Step 3: Enter 6-digit verification code</Label>
                      <Input
                        id="verification_code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="text-center text-lg tracking-widest" // REVERTED mx-2
                        maxLength={6}
                      />
                    </div>
                    
                    <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep('password')}
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={handleConfirm2FA} 
                        disabled={loading || verificationCode.length !== 6}
                      >
                        {loading ? "Verifying..." : "Verify & Enable"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <>
            <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recovery Codes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto px-6 py-4">
                <DialogHeader>
                  <DialogTitle>Regenerate Recovery Codes</DialogTitle>
                  <DialogDescription>
                    Enter your password to generate new recovery codes. This will invalidate your existing codes.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 px-4"> {/* ADDED px-4 HERE */}
                  <div className="space-y-2">
                    <Label htmlFor="regenerate_password">Current Password</Label>
                    <Input
                      id="regenerate_password"
                      type="password"
                      value={regeneratePassword}
                      onChange={(e) => setRegeneratePassword(e.target.value)}
                      // REVERTED mx-2
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsRegenerateDialogOpen(false);
                        setRegeneratePassword('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRegenerateRecoveryCodes}
                      disabled={loading || !regeneratePassword}
                    >
                      {loading ? "Generating..." : "Generate New Codes"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive">Disable 2FA</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto px-6 py-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Disable Two-Factor Authentication
                  </DialogTitle>
                  <DialogDescription>
                    This will remove the extra security layer from your account. 
                    Enter your password and verify with either your authenticator app or a recovery code.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 px-4"> {/* ADDED px-4 HERE */}
                  <div className="space-y-2">
                    <Label htmlFor="disable_password">Current Password</Label>
                    <Input
                      id="disable_password"
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      // REVERTED mx-2
                    />
                  </div>
                  
                  {!useRecoveryCodeForDisable ? (
                    <div className="space-y-2">
                      <Label htmlFor="disable_verification_code">Verification Code</Label>
                      <Input
                        id="disable_verification_code"
                        value={disableVerificationCode}
                        onChange={(e) => setDisableVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="text-center text-lg tracking-widest" // REVERTED mx-2
                        maxLength={6}
                      />
                      <p className="text-xs text-gray-500">
                        Enter the 6-digit code from your authenticator app
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setUseRecoveryCodeForDisable(true);
                          setDisableVerificationCode('');
                        }}
                        className="text-xs p-0 h-auto"
                      >
                        Use recovery code instead
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="disable_recovery_code">Recovery Code</Label>
                      <Input
                        id="disable_recovery_code"
                        value={disableRecoveryCode}
                        onChange={(e) => setDisableRecoveryCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10))}
                        placeholder="Enter recovery code"
                        className="text-center font-mono" // REVERTED mx-2
                        maxLength={10}
                      />
                      <p className="text-xs text-gray-500">
                        Enter one of your 10-character recovery codes
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setUseRecoveryCodeForDisable(false);
                          setDisableRecoveryCode('');
                        }}
                        className="text-xs p-0 h-auto"
                      >
                        Use authenticator code instead
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDisableDialogOpen(false);
                        setDisablePassword('');
                        setDisableVerificationCode('');
                        setDisableRecoveryCode('');
                        setUseRecoveryCodeForDisable(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDisable2FA}
                      disabled={
                        loading || 
                        !disablePassword || 
                        (useRecoveryCodeForDisable 
                          ? disableRecoveryCode.length !== 10 
                          : disableVerificationCode.length !== 6
                        )
                      }
                    >
                      {loading ? "Disabling..." : "Disable 2FA"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {/* Recovery Codes Dialog */}
      <Dialog open={isRecoveryDialogOpen} onOpenChange={(open) => {
        if (!open && !hasRefreshedAfter2FA) {
          setIsRecoveryDialogOpen(false);
          setHasRefreshedAfter2FA(true);
          // If dialog is closed without clicking "I've Saved These", still refresh
          if (onStatusChange) {
            setTimeout(() => {
              onStatusChange();
            }, 100);
          }
          toast({
            title: "2FA Enabled",
            description: "Two-factor authentication has been successfully enabled",
          });
        } else if (!open) {
          setIsRecoveryDialogOpen(false);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Recovery Codes
            </DialogTitle>
            <DialogDescription>
              Save these recovery codes in a safe place. You can use them to access 
              your account if you lose your authenticator device.
            </DialogDescription>
          </DialogHeader>
          {/* This div also gets px-4 for consistency in the recovery codes layout */}
          <div className="space-y-4 flex-1 overflow-y-auto px-4"> 
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span>{index + 1}. {code}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Each recovery code can only be used once</span>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(recoveryCodes.join('\n'))}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadRecoveryCodes}>
                  Download
                </Button>
                <Button onClick={() => {
                  setIsRecoveryDialogOpen(false);
                  setHasRefreshedAfter2FA(true);
                  // Now refresh the page after user has saved recovery codes
                  if (onStatusChange) {
                    setTimeout(() => {
                      onStatusChange();
                    }, 100);
                  }
                  toast({
                    title: "2FA Enabled",
                    description: "Two-factor authentication has been successfully enabled",
                  });
                }}>
                  I've Saved These
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TwoFactorAuth;