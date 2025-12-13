import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, User, MapPin, Link as LinkIcon, X } from "lucide-react";
import { AuditLog, AuditService } from "@/services/auditService";
import { format, parseISO } from "date-fns";

interface AuditLogDetailsDialogProps {
  auditLog: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailsDialog({
  auditLog,
  open,
  onOpenChange,
}: AuditLogDetailsDialogProps) {
  if (!auditLog) return null;

  const formatChanges = (changes: any) => {
    return AuditService.formatAuditChanges(changes);
  };

  const getActionColor = (action: string) => {
    switch (action?.toLowerCase()) {
      case "created":
        return "bg-green-100 text-green-800";
      case "updated":
        return "bg-blue-100 text-blue-800";
      case "deleted":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action?.toLowerCase()) {
      case "created":
        return "➕";
      case "updated":
        return "✏️";
      case "deleted":
        return "🗑️";
      default:
        return "📝";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">{getActionIcon(auditLog.event)}</span>
            Audit Log Details
            <Badge className={getActionColor(auditLog.event)}>
              {auditLog.event_label ||
                auditLog.event.charAt(0).toUpperCase() +
                  auditLog.event.slice(1).replace("_", " ")}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Timestamp:</span>
                <span className="text-sm font-medium">
                  {auditLog.created_at
                    ? format(
                        parseISO(auditLog.created_at),
                        "MMM dd, yyyy 'at' h:mm:ss a",
                      )
                    : "Unknown"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">User:</span>
                <span className="text-sm font-medium">
                  {auditLog.user?.name || auditLog.user?.email || "System"}
                </span>
              </div>

              {auditLog.ip_address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">IP Address:</span>
                  <span className="text-sm font-medium">
                    {auditLog.formatted_ip_address || auditLog.ip_address}
                  </span>
                </div>
              )}

              {auditLog.url && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">URL:</span>
                  <span className="text-sm font-medium break-all">
                    {auditLog.url}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Description */}
          {auditLog.description && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Description
                </h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  {auditLog.description}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Changes */}
          {auditLog.changes && Object.keys(auditLog.changes).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Changes Made
              </h3>
              <div className="space-y-2">
                {formatChanges(auditLog.changes).map((change, index) => (
                  <div
                    key={index}
                    className="text-sm bg-blue-50 border border-blue-200 p-3 rounded-md"
                  >
                    {change}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
