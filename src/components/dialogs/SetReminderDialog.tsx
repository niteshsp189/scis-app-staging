import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Bell, Loader2, User, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { TimePicker } from "@/components/ui/time-picker";
import {
  reminderService,
  type CreateReminderData,
} from "@/services/reminderService";

interface SetReminderDialogProps {
  customerId: number;
  customerName: string;
  trigger?: React.ReactNode;
  onReminderCreated?: () => void;
}

export const SetReminderDialog = ({
  customerId,
  customerName,
  trigger,
  onReminderCreated,
}: SetReminderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>();

  // Load agents for selection
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setLoadingAgents(true);
        const response = await fetch('/api/users/agents', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setAgents(data.data);
          }
        } else {
          console.error('Failed to load agents:', response.status, response.statusText);
        }
      } catch (error) {
        console.error("Failed to load agents:", error);
      } finally {
        setLoadingAgents(false);
      }
    };

    if (open) {
      loadAgents();
    }
  }, [open]);

  const handleNotificationMethodChange = (
    method: "email" | "sms" | "push",
    checked: boolean,
  ) => {
    // Removed - notification methods are now hidden
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(undefined);
    setTime("");
    setSelectedAgent(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date || !time) {
      toast({
        title: "Missing Information",
        description:
          "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Combine date and time
      const reminderDateTime = new Date(date);
      const time24Hour = to24Hour(time);
      const [hours, minutes] = time24Hour.split(":").map(Number);
      reminderDateTime.setHours(hours, minutes, 0, 0);

      // Prepare reminder data
      const reminderData: CreateReminderData = {
        title,
        description: description || undefined,
        reminder_datetime: reminderDateTime.toISOString(),
        reminder_type: "custom",
        priority: "medium",
        customer_id: customerId,
        agent_id: selectedAgent,
        notification_methods: ["email"],
      };

      await reminderService.createReminder(reminderData);

      toast({
        title: "Reminder Set",
        description: `Reminder set for ${customerName} on ${format(date, "MMM dd, yyyy")} at ${time}`,
      });

      // Reset form and close dialog
      resetForm();
      setOpen(false);

      // Notify parent component
      if (onReminderCreated) {
        onReminderCreated();
      }
    } catch (error: any) {
      console.error("Failed to create reminder:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create reminder";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Set Reminder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Set Reminder
          </DialogTitle>
          <DialogDescription>
            Set a reminder for {customerName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Reminder Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Follow up on policy renewal"
              required
            />
          </div>

          {/* Agent Selection */}
          <div className="grid gap-2">
            <Label htmlFor="agent">Assign to Agent (Optional)</Label>
            <Select
              value={selectedAgent || "none"}
              onValueChange={(value) =>
                setSelectedAgent(value === "none" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an agent">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {selectedAgent 
                        ? agents.find(a => a.id === selectedAgent)?.name
                        : "Select an agent"
                      }
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search agents..."
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <SelectItem value="none">No agent assigned</SelectItem>
                {loadingAgents ? (
                  <SelectItem value="loading" disabled>
                    Loading agents...
                  </SelectItem>
                ) : agents.filter(agent =>
                    agentSearch === "" ||
                    agent.name
                      .toLowerCase()
                      .includes(agentSearch.toLowerCase()) ||
                    agent.email?.toLowerCase().includes(agentSearch.toLowerCase())
                  ).length === 0 ? (
                  <SelectItem value="no-results" disabled>
                    No agents found
                  </SelectItem>
                ) : (
                  agents
                    .filter(agent =>
                      agentSearch === "" ||
                      agent.name
                        .toLowerCase()
                        .includes(agentSearch.toLowerCase()) ||
                      agent.email?.toLowerCase().includes(agentSearch.toLowerCase())
                    )
                    .map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex flex-col">
                          <span>
                            {agent.name}
                          </span>
                          {agent.email && (
                            <span className="text-xs text-muted-foreground">
                              {agent.email}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Date *</Label>
              <DateInput
                value={date ? format(date, "yyyy-MM-dd") : ""}
                onChange={(value) => {
                  const selectedDate = value ? new Date(value) : undefined;
                  setDate(selectedDate);
                }}
                placeholder="Pick a date"
                disabledDates={(date) => date < new Date()}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Time *</Label>
              <TimePicker
                value={time}
                onChange={setTime}
                placeholder="Select time"
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional notes about the reminder..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                !title ||
                !date ||
                !time
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Set Reminder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
