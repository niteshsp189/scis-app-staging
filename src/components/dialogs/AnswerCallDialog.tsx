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
import { DateInput } from "@/components/ui/date-input";
import { PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { customerActivitiesService, CustomerActivity } from "@/services/customerActivitiesService";

interface AnswerCallDialogProps {
  originalCall: CustomerActivity;
  customerId: number;
  customerName: string;
  onAnswerCall: (callData: any) => void;
  trigger?: React.ReactNode;
}

export const AnswerCallDialog = ({
  originalCall,
  customerId,
  customerName,
  onAnswerCall,
  trigger,
}: AnswerCallDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const [formData, setFormData] = useState({
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
  });

  const resetForm = () => {
    setFormData({
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
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "Please provide a description for the answer call.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const callData = {
        activity_type: originalCall.activity_type === "Incoming Call" ? "Outgoing Call" : "Incoming Call",
        title: `Answer Call - ${formData.description.substring(0, 50)}${formData.description.length > 50 ? '...' : ''}`,
        description: formData.description,
        activity_date: formData.activity_date,
        activity_time: to24Hour(formData.activity_time),
        outcome: "completed",
        priority: "Medium",
        status: "Completed",
        duration_minutes: 0,
        parent_activity_id: originalCall.id,
      };

      await onAnswerCall(callData);

      toast({
        title: "Success",
        description: "Answer call logged successfully",
      });

      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error in AnswerCallDialog:", error);
      toast({
        title: "Error",
        description: "Failed to log answer call",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <PhoneOutgoing className="h-4 w-4 mr-2" />
            Answer Call
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Answer Call</DialogTitle>
          <DialogDescription>
            Log an answer call for the {originalCall.activity_type.toLowerCase()} from {customerName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Type Display (read-only) */}
          <div>
            <Label>Activity Type</Label>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
              {originalCall.activity_type === "Incoming Call" ? (
                <PhoneOutgoing className="h-4 w-4 text-blue-600" />
              ) : (
                <PhoneIncoming className="h-4 w-4 text-green-600" />
              )}
              <span className="text-sm font-medium">
                {originalCall.activity_type === "Incoming Call" ? "Outgoing Call" : "Incoming Call"}
              </span>
            </div>
           
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe the answer call purpose and outcome..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Activity Date */}
            <div>
              <Label htmlFor="activity_date">Date</Label>
              <DateInput
                id="activity_date"
                value={formData.activity_date}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    activity_date: value,
                  }))
                }
                placeholder="Select date"
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
              {loading ? "Logging..." : "Log Answer Call"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};