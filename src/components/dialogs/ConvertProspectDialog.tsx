import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, UserCheck, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Customer } from "@/types/customer";
import { customerService } from "@/services/customerService";
import { formatSSNDisplay } from "@/utils/ssnFormatter";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";

interface ConvertProspectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: Customer | null;
  onConversionSuccess?: () => void;
}

export function ConvertProspectDialog({
  isOpen,
  onClose,
  prospect,
  onConversionSuccess,
}: ConvertProspectDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!prospect) return null;

  // Validation checks
  const hasSSN = Boolean(prospect.ssn);
  const hasDOB = Boolean(prospect.dateOfBirth);
  const hasGender = Boolean(prospect.gender);
  const hasPhone = Boolean(prospect.cellPhone || prospect.homePhone);
  // Email is optional, so we don't check for it
  
  const canConvert = hasSSN && hasDOB && hasGender && hasPhone;

  const missingFields: string[] = [];
  if (!hasSSN) missingFields.push("SSN");
  if (!hasDOB) missingFields.push("Date of Birth");
  if (!hasGender) missingFields.push("Gender");
  if (!hasPhone) missingFields.push("At least one Phone Number (Home or Cell)");

  const handleConvert = async () => {
    if (!prospect?.id) return;

    try {
      setLoading(true);

      await customerService.convertProspectToClient(prospect.id);

      toast({
        title: "Prospect Converted",
        description: `${prospect.firstName} ${prospect.lastName} has been successfully converted to a client.`,
        variant: "default",
      });

      onConversionSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error converting prospect:", error);
      
      toast({
        title: "Conversion Failed",
        description: error.response?.data?.message || "Failed to convert prospect to client. Please ensure all required information is provided.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Convert Prospect to Client
          </DialogTitle>
          <DialogDescription>
            Review the prospect information and convert them to a client status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prospect Information */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-base">
                {prospect.firstName} {prospect.middleName} {prospect.lastName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">SSN</p>
                <div className="flex items-center gap-2">
                  {hasSSN ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-sm">{formatSSNDisplay(prospect.ssn!)}</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-600">Missing</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Date of Birth</p>
                <div className="flex items-center gap-2">
                  {hasDOB ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-sm">{prospect.dateOfBirth}</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-600">Missing</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Gender</p>
                <div className="flex items-center gap-2">
                  {hasGender ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-sm">{prospect.gender}</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-600">Missing</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Phone</p>
                <div className="flex items-center gap-2">
                  {hasPhone ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-sm">
                        {formatPhoneDisplay(prospect.cellPhone || prospect.homePhone!)}
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-600">Missing</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          {canConvert ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All required information is present. This prospect can be converted to a client.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Missing Required Information:</strong> {missingFields.join(", ")}
                <p className="mt-2 text-sm">
                  Please edit the prospect to add the missing information before converting.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConvert}
            disabled={!canConvert || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Converting..." : "Convert to Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
