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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Plus, 
  Trash2, 
  Globe, 
  Check, 
  X, 
  Loader2,
  AlertTriangle 
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/services/api";

interface WhitelistedIP {
  ip: string;
  description: string;
  added_by: string;
  added_at: string;
}

interface WhitelistData {
  whitelisted_ips: WhitelistedIP[];
  current_ip: string;
}

interface IPWhitelistSettingsProps {
  isEnabled?: boolean;
}

export function IPWhitelistSettings({ isEnabled = true }: IPWhitelistSettingsProps) {
  const [whitelist, setWhitelist] = useState<WhitelistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [testIp, setTestIp] = useState("");
  const [testResult, setTestResult] = useState<{allowed: boolean; message: string} | null>(null);

  useEffect(() => {
    loadWhitelist();
  }, []);

  const loadWhitelist = async () => {
    try {
      setLoading(true);
      const response = await api.get("/security/whitelist");
      
      // Handle both direct data and nested response structures
      const data = response.data || response;
      setWhitelist(data);
    } catch (error) {
      console.error("Failed to load whitelist:", error);
      
      // Set some default data for testing if API fails
      setWhitelist({
        whitelisted_ips: [],
        current_ip: "127.0.0.1" // Fallback IP for development
      });
      
      toast({
        title: "Error",
        description: "Failed to load IP whitelist. Using default values.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async () => {
    if (!newIp.trim()) {
      toast({
        title: "IP Required",
        description: "Please enter an IP address",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddLoading(true);
      const response = await api.post("/security/whitelist", {
        ip_address: newIp.trim(),
        description: newDescription.trim() || undefined
      });
      
      setShowAddDialog(false);
      setNewIp("");
      setNewDescription("");
      await loadWhitelist();
      
      toast({
        title: "IP Added",
        description: "IP address has been added to the whitelist",
      });
    } catch (error: any) {
      console.error("Add IP error:", error);
      let errorMessage = "Failed to add IP address";
      
      // Handle different error response formats
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveIP = async (ipAddress: string) => {
    try {
      setRemoveLoading(ipAddress);
      await api.delete("/security/whitelist", {
        data: { ip_address: ipAddress }
      });
      
      await loadWhitelist();
      toast({
        title: "IP Removed",
        description: "IP address has been removed from the whitelist",
      });
    } catch (error: any) {
      console.error("Remove IP error:", error);
      let errorMessage = "Failed to remove IP address";
      
      // Handle different error response formats
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRemoveLoading(null);
    }
  };

  const handleTestIP = async () => {
    if (!testIp.trim()) {
      toast({
        title: "IP Required",
        description: "Please enter an IP address to test",
        variant: "destructive",
      });
      return;
    }

    try {
      setTestLoading(true);
      const response = await api.post("/security/whitelist/test", {
        ip_address: testIp.trim()
      });
      
      // Handle both direct data and nested response structures
      const data = response.data || response;
      setTestResult(data);
      
      // Show toast message for the test result
      toast({
        title: data.allowed ? "Access Allowed" : "Access Denied",
        description: data.message || (data.allowed ? "IP address is whitelisted" : "IP address is not whitelisted"),
        variant: data.allowed ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error("Test IP error:", error);
      toast({
        title: "Error",
        description: error.message || error.response?.data?.message || "Failed to test IP address",
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const isCurrentIP = (ip: string) => {
    return whitelist?.current_ip === ip;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { timeZone: 'UTC' });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            IP Whitelist Management
          </CardTitle>
          <CardDescription>
            Manage allowed IP addresses for system access
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Show disabled state if IP whitelisting is turned off
  if (!isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-400" />
            IP Whitelist Management
          </CardTitle>
          <CardDescription>
            IP whitelisting is currently disabled
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">IP Whitelisting Disabled</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                IP whitelisting is currently disabled. To manage IP addresses, first enable IP whitelisting in the General tab.
              </p>
            </div>
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                All IP addresses can currently access the system
              </div>
            </div>
          </div>
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
            IP Whitelist Management
          </CardTitle>
          <CardDescription>
            Manage allowed IP addresses for system access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Current IP Address</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {whitelist?.current_ip}
                </Badge>
                <Globe className="h-4 w-4 text-gray-500" />
              </div>
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTestDialog(true)}
              >
                Test IP
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add IP
              </Button>
            </div>
          </div>

          <div>
            <Label>Whitelisted IP Addresses</Label>
            {!whitelist?.whitelisted_ips || whitelist.whitelisted_ips.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No IP addresses whitelisted</p>
                <p className="text-sm">Add IP addresses to restrict system access</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whitelist?.whitelisted_ips.map((ip, index) => {
                      // Handle both string and object formats
                      const ipAddress = typeof ip === 'string' ? ip : ip.ip;
                      const description = typeof ip === 'object' ? (ip.description || '-') : '-';
                      const addedAt = typeof ip === 'object' && ip.added_at ? formatDate(ip.added_at) : '-';
                      
                      return (
                        <TableRow key={`${ipAddress}-${index}`}>
                          <TableCell>
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {ipAddress}
                            </code>
                          </TableCell>
                          <TableCell>
                            {description}
                          </TableCell>
                          <TableCell>
                            {addedAt}
                          </TableCell>
                          <TableCell>
                            {isCurrentIP(ipAddress) ? (
                              <Badge variant="default" className="text-xs">
                                <Check className="mr-1 h-3 w-3" />
                                Current
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveIP(ipAddress)}
                              disabled={removeLoading === ipAddress}
                            >
                              {removeLoading === ipAddress ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Warning</p>
                <p className="text-yellow-700">
                  Make sure to include your current IP address ({whitelist?.current_ip}) in the whitelist 
                  before enabling IP restrictions, or you may be locked out of the system.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add IP Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add IP Address to Whitelist</DialogTitle>
            <DialogDescription>
              Add an IP address or CIDR range to allow access to the system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="newIp">IP Address or CIDR Range</Label>
              <Input
                id="newIp"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="e.g., 192.168.1.1 or 192.168.1.0/24"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter a single IP address or CIDR range
              </p>
            </div>
            
            <div>
              <Label htmlFor="newDescription">Description (Optional)</Label>
              <Input
                id="newDescription"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g., Office network, VPN connection"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddIP}
              disabled={addLoading}
            >
              {addLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add IP Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test IP Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test IP Address</DialogTitle>
            <DialogDescription>
              Check if an IP address would be allowed by the current whitelist
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="testIp">IP Address</Label>
              <Input
                id="testIp"
                value={testIp}
                onChange={(e) => setTestIp(e.target.value)}
                placeholder="e.g., 192.168.1.100"
              />
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.allowed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.allowed ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    testResult.allowed ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.allowed ? 'Access Allowed' : 'Access Denied'}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${
                  testResult.allowed ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResult.message}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTestDialog(false);
                setTestResult(null);
                setTestIp("");
              }}
            >
              Close
            </Button>
            <Button
              onClick={handleTestIP}
              disabled={testLoading}
            >
              {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test IP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
