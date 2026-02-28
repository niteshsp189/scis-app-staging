import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, PhoneIncoming, PhoneOutgoing, Calendar, Clock, User, MessageSquare, Printer } from "lucide-react";
import { CustomerActivity } from "@/services/customerActivitiesService";
import { useState, useEffect } from "react";
import { customerActivitiesService } from "@/services/customerActivitiesService";

interface CallDetailsDialogProps {
  call: CustomerActivity;
  customerName: string;
  customerId: number;
  trigger?: React.ReactNode;
  /**
   * When `open` is provided the component is controlled and no trigger
   * will be rendered automatically. You must handle opening/closing
   * and focus yourself.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CallDetailsDialog = ({
  call,
  customerName,
  customerId,
  trigger,
  open,
  onOpenChange,
}: CallDetailsDialogProps) => {
  const [answerCalls, setAnswerCalls] = useState<CustomerActivity[]>([]);
  const [parentCall, setParentCall] = useState<CustomerActivity | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch answer calls when dialog opens
  const fetchAnswerCalls = async () => {
    if (!call.id) return;

    setLoading(true);
    try {
      // Get all activities for this customer
      const response = await customerActivitiesService.getCustomerActivities(customerId, {
        per_page: 1000 // Get all to find answer calls
      });

      if (response.success) {
        // Filter to find answer calls for this specific call
        const calls = response.data.filter(
          (activity: CustomerActivity) =>
            activity.parent_activity_id === call.id
        );
        setAnswerCalls(calls);
      }
    } catch (error) {
      console.error("Error fetching answer calls:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch parent call if this is an answer call
  const fetchParentCall = async () => {
    if (!call.parent_activity_id) return;

    try {
      const response = await customerActivitiesService.getActivity(customerId, call.parent_activity_id);
      if (response.success) {
        setParentCall(response.data);
      }
    } catch (error) {
      console.error("Error fetching parent call:", error);
    }
  };

  // Fetch answer calls and parent call when dialog opens
  useEffect(() => {
    fetchAnswerCalls();
    fetchParentCall();
  }, [call.id, customerId, call.parent_activity_id]);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "N/A";
    const [hours, minutes] = timeString.split(":");
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHours = h % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const getActivityIcon = (activityType: string) => {
    return activityType === "Incoming Call" ? (
      <PhoneIncoming className="h-4 w-4" />
    ) : (
      <PhoneOutgoing className="h-4 w-4" />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* only render a trigger when not controlled or when one is explicitly provided */}
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : open === undefined ? (
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActivityIcon(call.activity_type)}
            Call Details
          </DialogTitle>
          <DialogDescription>
            Complete information for the call with {customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Customer</span>
              </div>
              <p className="text-sm text-muted-foreground">{customerName}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PhoneIncoming className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Activity Type</span>
              </div>
              <p className="text-sm text-muted-foreground">{call.activity_type}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {call.activity_date ? formatDate(call.activity_date) : "N/A"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Time</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {call.activity_time ? formatTime(call.activity_time) : "N/A"}
              </p>
            </div>

            {(call.calledForUser || call.called_for_user) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Called For</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(call.calledForUser || call.called_for_user)!.first_name} {(call.calledForUser || call.called_for_user)!.last_name}
                  {(call.calledForUser || call.called_for_user)!.email && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({(call.calledForUser || call.called_for_user)!.email})
                    </span>
                  )}
                </p>
              </div>
            )}

            {((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PhoneOutgoing className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Call Forwarded To</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {(((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user)!.first_name)} {(((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user)!.last_name)}
                  {(((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user)!.email) && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user)!.email})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          {call.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Description</span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {call.description}
              </p>
            </div>
          )}

          {/* Duration */}
          {/* {call.duration_minutes && call.duration_minutes > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Duration</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {call.duration_minutes} minutes
                </p>
              </div>
            </>
          )} */}

          {/* Relationship Information - Show parent call if this is an answer call */}
          {call.parent_activity_id && parentCall && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <PhoneIncoming className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Original Call</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(parentCall.activity_type)}
                      <span className="text-sm font-medium text-blue-800">
                        {parentCall.activity_type}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <span className="text-xs font-medium text-blue-700">Date & Time:</span>
                      <p className="text-sm text-blue-800">
                        {parentCall.activity_date ? formatDate(parentCall.activity_date) : "N/A"}
                        {parentCall.activity_time ? ` at ${formatTime(parentCall.activity_time)}` : ""}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-blue-700">Title:</span>
                      <p className="text-sm text-blue-800">{parentCall.title}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-blue-700">Description:</span>
                    <p className="text-sm text-blue-800 mt-1 whitespace-pre-wrap">
                      {parentCall.description}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Relationship Information - Legacy display for answer calls */}
          {call.parent_activity_id && !parentCall && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PhoneOutgoing className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Answer Call</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This is an answer call linked to a previous call.
                </p>
              </div>
            </>
          )}

          {/* Answer Calls List */}
          {loading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PhoneOutgoing className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700">Loading answer calls...</span>
              </div>
            </div>
          ) : answerCalls.length > 0 ? (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <PhoneOutgoing className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700">
                    Answer Calls ({answerCalls.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {answerCalls.map((answerCall, index) => (
                    <div key={answerCall.id} className="bg-green-50 p-4 rounded-md border border-green-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getActivityIcon(answerCall.activity_type)}
                          <span className="text-sm font-medium text-green-800">
                            Answer Call #{index + 1}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <span className="text-xs font-medium text-green-700">Type:</span>
                          <p className="text-sm text-green-800">{answerCall.activity_type}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-green-700">Date & Time:</span>
                          <p className="text-sm text-green-800">
                            {answerCall.activity_date ? formatDate(answerCall.activity_date) : "N/A"}
                            {answerCall.activity_time ? ` at ${formatTime(answerCall.activity_time)}` : ""}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-green-700">Description:</span>
                        <p className="text-sm text-green-800 mt-1 whitespace-pre-wrap">
                          {answerCall.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {/* Metadata */}
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{" "}
              {call.created_at ? formatDate(call.created_at) : "N/A"}
            </div>
            <div>
              <span className="font-medium">Updated:</span>{" "}
              {call.updated_at ? formatDate(call.updated_at) : "N/A"}
            </div>
          </div>

          {/* Print Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams();
                params.set('customerName', customerName);
                window.open(`/customers/${customerId}/calls/${call.id}/print?${params.toString()}`, '_blank');
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};