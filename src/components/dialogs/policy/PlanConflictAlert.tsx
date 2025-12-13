
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConflictCheckResult } from "@/services/planConflictService";

interface PlanConflictAlertProps {
  conflictResult: ConflictCheckResult | null;
  onDismiss?: () => void;
}

export const PlanConflictAlert = ({ conflictResult, onDismiss }: PlanConflictAlertProps) => {
  if (!conflictResult || !conflictResult.hasConflict) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <AlertTitle className="mb-2">Plan Conflict Detected</AlertTitle>
          <AlertDescription className="space-y-2">
            {conflictResult.allConflicts && conflictResult.allConflicts.length > 1 ? (
              <div>
                <p className="mb-2">Multiple conflicts found:</p>
                <div className="space-y-2">
                  {conflictResult.allConflicts.map((conflict, index) => (
                    <div key={index} className="p-2 bg-red-50 rounded border border-red-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {conflict.plan1}
                        </Badge>
                        <span className="text-xs">conflicts with</span>
                        <Badge variant="outline" className="text-xs">
                          {conflict.plan2}
                        </Badge>
                      </div>
                      <p className="text-sm text-red-700">{conflict.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : conflictResult.conflictingPlans ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    {conflictResult.conflictingPlans.plan1}
                  </Badge>
                  <span className="text-sm">conflicts with</span>
                  <Badge variant="outline">
                    {conflictResult.conflictingPlans.plan2}
                  </Badge>
                </div>
                <p>{conflictResult.conflictingPlans.message}</p>
              </div>
            ) : null}
          </AlertDescription>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </Alert>
  );
};
