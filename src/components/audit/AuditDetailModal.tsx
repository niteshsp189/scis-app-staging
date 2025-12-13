import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Calendar,
  Globe,
  Monitor,
  FileText,
  Database,
  Info,
  Activity,
} from "lucide-react";
import { AuditLog } from "@/types/audit";
import { format } from "date-fns";
import { AuditService } from "@/services/auditService";

interface AuditDetailModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDetailModal({
  log,
  isOpen,
  onClose,
}: AuditDetailModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const getUserDisplayName = () => {
    if (!log?.user) return "System";
    return (
      log.user.full_name ||
      log.user.name ||
      `${log.user.first_name || ""} ${log.user.last_name || ""}`.trim() ||
      "System"
    );
  };

  const getAuditableDisplayName = () => {
    if (!log?.auditable) {
      // For system actions, show a meaningful description instead of null
      if (
        log?.event === "permission_check_success" ||
        log?.event === "permission_check_failed"
      ) {
        return "Permission Check";
      }
      if (
        log?.event === "role_check_success" ||
        log?.event === "role_check_failed"
      ) {
        return "Role Check";
      }
      return null;
    }
    const aud = log.auditable as Record<string, unknown>;
    const fullName = String(aud.full_name || "");
    const name = String(aud.name || "");
    const email = String(aud.email || "");
    const firstName = String(aud.first_name || "");
    const lastName = String(aud.last_name || "");
    const combinedName = `${firstName} ${lastName}`.trim();

    return fullName || name || email || combinedName || null;
  };

  const getCleanDescription = () => {
    if (!log?.description) return "No description";
    let desc = String(log.description);

    // Remove explicit ID fragment like " (ID: 0198aa3a-...)"
    desc = desc.replace(/\s*\(ID:\s*[^)]+\)/gi, "");

    // Remove any stray UUID-like parenthesized tokens if present (but avoid removing emails)
    desc = desc.replace(
      /\s*\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)/g,
      "",
    );

    // Convert underscores to spaces and capitalize words for better readability
    desc = desc.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    // Handle specific cases for permission/role checks
    if (
      log?.event === "permission_check_success" ||
      log?.event === "permission_check_failed"
    ) {
      desc = desc.replace(
        /Passed Permission Check For:/i,
        "Checked permission:",
      );
      desc = desc.replace(
        /Failed Permission Check For:/i,
        "Failed permission check:",
      );
    }
    if (
      log?.event === "role_check_success" ||
      log?.event === "role_check_failed"
    ) {
      desc = desc.replace(/Passed Role Check For:/i, "Checked role:");
      desc = desc.replace(/Failed Role Check For:/i, "Failed role check:");
    }

    // If no email is present in the description but auditable has an email, append it
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    if (
      !emailRegex.test(desc) &&
      log.auditable &&
      (log.auditable as Record<string, unknown>).email
    ) {
      desc = `${desc.trim()} (${String((log.auditable as Record<string, unknown>).email)})`;
    }

    return desc.trim();
  };

  const getModelDisplayName = () => {
    if (!log?.auditable_type) {
      // Handle system actions that don't have an auditable_type
      if (
        log?.event === "permission_check_success" ||
        log?.event === "permission_check_failed"
      ) {
        return "Permission";
      }
      if (
        log?.event === "role_check_success" ||
        log?.event === "role_check_failed"
      ) {
        return "Role";
      }
      return "System";
    }

    const className = log.auditable_type.split("\\").pop();

    // Map technical model names to user-friendly names
    switch (className?.toLowerCase()) {
      case "user":
        return "User";
      case "lead":
        return "Lead";
      case "policy":
        return "Policy";
      case "customer":
        return "Customer";
      case "deal":
        return "Deal";
      case "plan":
        return "Plan";
      case "familymember":
        return "Family Member";
      case "dependent":
        return "Dependent";
      case "reminder":
        return "Reminder";
      default:
        return className || "Unknown";
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (!action) return "bg-gray-100 text-gray-900";
    switch (action.toLowerCase()) {
      case "login":
        return "bg-green-100 text-green-900";
      case "logout":
        return "bg-gray-100 text-gray-900";
      case "created":
      case "create":
        return "bg-blue-100 text-blue-900";
      case "updated":
      case "update":
        return "bg-yellow-100 text-yellow-900";
      case "deleted":
      case "delete":
        return "bg-red-100 text-red-900";
      case "viewed":
      case "view":
        return "bg-purple-100 text-purple-900";
      case "permission check":
        return "bg-orange-100 text-orange-900";
      case "role check":
        return "bg-teal-100 text-teal-900";
      case "failed_login":
        return "bg-red-100 text-red-900";
      default:
        return "bg-gray-100 text-gray-900";
    }
  };

  if (!log) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Audit Log Details</span>
            <Badge
              className={getActionBadgeColor(log.event_label || log.event)}
            >
              {log.event_label ||
                (log.event
                  ? log.event.charAt(0).toUpperCase() + log.event.slice(1)
                  : "System Action")}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="changes">Changes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>User Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Name
                    </label>
                    <p className="text-sm">{getUserDisplayName()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="text-sm">{log.user?.email || "N/A"}</p>
                  </div>
                  {/* User ID intentionally hidden to show only human-readable name */}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Timing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Date & Time
                    </label>
                    <p className="text-sm">
                      {format(new Date(log.created_at), "PPP p")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Time Since
                    </label>
                    <p className="text-sm">{log.time_since}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>Target Model</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Model
                    </label>
                    <p className="text-sm">{getModelDisplayName()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Record
                    </label>
                    <p className="text-sm">
                      {getAuditableDisplayName() ||
                        (log.auditable_id ? String(log.auditable_id) : "N/A")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Description
                    </label>
                    <p className="text-sm break-words">
                      {getCleanDescription()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>Network & Browser</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      IP Address
                    </label>
                    <p className="text-sm font-mono">
                      {log.formatted_ip_address === "127.0.0.1" &&
                      log.browser === "System"
                        ? "System"
                        : log.formatted_ip_address}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Browser
                    </label>
                    <p className="text-sm">{log.browser}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Platform
                    </label>
                    <p className="text-sm">{log.platform}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="changes" className="space-y-4">
            {log.changes && Object.keys(log.changes).length > 0 ? (
              // Show computed changes with detailed field-by-field comparison
              <div className="space-y-4">
                {(() => {
                  const formattedChanges = AuditService.formatAuditChanges(
                    log.changes,
                  );
                  return (
                    <>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">
                          {formattedChanges.length} field
                          {formattedChanges.length !== 1 ? "s" : ""} changed
                        </span>
                      </div>

                      <div className="space-y-3">
                        {formattedChanges.map((change, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4 bg-blue-100">
                              <div className="text-sm">{change}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              // Try to create changes from old_values vs new_values comparison
              (() => {
                const computedChanges: Record<
                  string,
                  { old: unknown; new: unknown }
                > = {};

                // Merge keys from both old_values and new_values
                const allKeys = new Set([
                  ...Object.keys(log.old_values || {}),
                  ...Object.keys(log.new_values || {}),
                ]);

                allKeys.forEach((key) => {
                  const oldValue = log.old_values?.[key];
                  const newValue = log.new_values?.[key];

                  // Only include if values are actually different
                  if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                    computedChanges[key] = { old: oldValue, new: newValue };
                  }
                });

                if (Object.keys(computedChanges).length > 0) {
                  const formattedChanges =
                    AuditService.formatAuditChanges(computedChanges);

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">
                          {formattedChanges.length} field
                          {formattedChanges.length !== 1 ? "s" : ""} changed
                        </span>
                      </div>

                      <div className="space-y-3">
                        {formattedChanges.map((change, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4 bg-blue-50">
                              <div className="text-sm">{change}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <Info className="h-8 w-8 mx-auto mb-2" />
                        <p>No changes recorded for this action</p>
                      </div>
                    </div>
                  );
                }
              })()
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
