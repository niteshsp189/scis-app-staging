import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { customerActivitiesService } from "@/services/customerActivitiesService";

interface LogActivityDialogProps {
  customerId: number;
  customerName: string;
  onLogActivity: (activityData: any) => void;
  logType?: "appointments" | "calls";
  trigger?: React.ReactNode;
}

export const LogActivityDialog = ({
  customerId,
  customerName,
  onLogActivity,
  logType,
  trigger,
}: LogActivityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: "",
    title: "",
    description: "",
    activity_date: new Date().toISOString().split("T")[0],
    activity_time: (() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    })(),
    duration_minutes: "",
    outcome: "",
    priority: "Medium" as "High" | "Medium" | "Low",
    status: "Completed" as
      | "Pending"
      | "In Progress"
      | "Completed"
      | "Cancelled",
    notes: "",
    follow_up_date: "",
    follow_up_notes: "",
  });

  // Get available activity types based on logType
  const getAvailableActivityTypes = () => {
    const allTypes = customerActivitiesService.getPredefinedActivityTypes();

    if (logType === "calls") {
      return {
        "Incoming Call": allTypes["Incoming Call"],
        "Outgoing Call": allTypes["Outgoing Call"],
      };
    } else if (logType === "appointments") {
      return {
        Meeting: allTypes["Meeting"],
        "Follow-up": allTypes["Follow-up"],
      };
    }

    return allTypes;
  };

  // Helper function to convert 12-hour time format to 24-hour format
  const to24Hour = (time: string): string => {
    if (!time) return "";
    const [timePart, modifier] = time.split(" ");
    let [hours, minutes] = timePart.split(":");
    let h = parseInt(hours, 10);

    if (modifier === "PM" && h < 12) {
      h += 12;
    }
    if (modifier === "AM" && h === 12) {
      h = 0;
    }

    return `${h.toString().padStart(2, "0")}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.activity_type || !formData.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const validation = customerActivitiesService.validateActivity(formData);
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const activityData = {
        ...formData,
        activity_time: to24Hour(formData.activity_time),
        duration_minutes: formData.duration_minutes
          ? parseInt(formData.duration_minutes)
          : 0,
        follow_up_date: formData.follow_up_date || undefined,
        follow_up_notes: formData.follow_up_notes || undefined,
      };

      await onLogActivity(activityData);

      // Reset form
      setFormData({
        activity_type: "",
        title: "",
        description: "",
        activity_date: new Date().toISOString().split("T")[0],
        activity_time: (() => {
          const now = new Date();
          const hours = now.getHours();
          const minutes = now.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        })(),
        duration_minutes: "",
        outcome: "",
        priority: "Medium",
        status: "Completed",
        notes: "",
        follow_up_date: "",
        follow_up_notes: "",
      });

      setOpen(false);
    } catch (error) {
      console.error("Error in LogActivityDialog:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDialogTitle = () => {
    if (logType === "calls") return "Log Call";
    if (logType === "appointments") return "Log Meeting";
    return "Log Activity";
  };

  const getButtonText = () => {
    if (logType === "calls") return "Log Call";
    if (logType === "appointments") return "Log Meeting";
    return "Log Activity";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {getButtonText()}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            Record a customer interaction for {customerName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Activity Type */}
            <div>
              <Label htmlFor="activity_type">
                Activity Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.activity_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, activity_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(getAvailableActivityTypes()).map(
                    ([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: value as "High" | "Medium" | "Low",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customerActivitiesService
                    .getPriorityOptions()
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Brief title for this activity"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Detailed description of the activity..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Activity Date */}
            <div>
              <Label htmlFor="activity_date">Date</Label>
              <Input
                id="activity_date"
                type="date"
                value={formData.activity_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    activity_date: e.target.value,
                  }))
                }
              />
            </div>

            {/* Activity Time */}
            <div>
              <Label htmlFor="activity_time">Time</Label>
              <TimePicker
                value={formData.activity_time}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    activity_time: value,
                  }))
                }
                placeholder="Select time"
              />
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="0"
                max="480"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duration_minutes: e.target.value,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Outcome */}
            <div>
              <Label htmlFor="outcome">Outcome</Label>
              <Select
                value={formData.outcome}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, outcome: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  {customerActivitiesService
                    .getOutcomeOptions()
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as
                      | "Pending"
                      | "In Progress"
                      | "Completed"
                      | "Cancelled",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customerActivitiesService
                    .getStatusOptions()
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Additional notes or observations..."
              rows={2}
            />
          </div>

          {/* Follow-up Section */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Follow-up (Optional)</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Follow-up Date */}
              <div>
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      follow_up_date: e.target.value,
                    }))
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {/* Follow-up Notes */}
            {formData.follow_up_date && (
              <div className="mt-4">
                <Label htmlFor="follow_up_notes">Follow-up Notes</Label>
                <Textarea
                  id="follow_up_notes"
                  value={formData.follow_up_notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      follow_up_notes: e.target.value,
                    }))
                  }
                  placeholder="What should be discussed or done in the follow-up..."
                  rows={2}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Logging..." : getButtonText()}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
