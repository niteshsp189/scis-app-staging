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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Clock, Bell, Loader2, User, X, ChevronsUpDown, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { TimePicker } from "@/components/ui/time-picker";
import { api } from "@/lib/axios";
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
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);

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
        const response = await api.get('/team-members?per_page=100');
        if (response.data?.success && response.data?.data?.data && Array.isArray(response.data.data.data)) {
          setAgents(response.data.data.data);
        } else if (response.data?.success && Array.isArray(response.data?.data)) {
          setAgents(response.data.data);
        } else if (Array.isArray(response.data)) {
          setAgents(response.data);
        }
      } catch (error) {
        console.error("Failed to load team members:", error);
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

          {/* User Selection */}
          <div className="grid gap-2">
            <Label htmlFor="agent">Assign to User (Optional)</Label>
            {selectedAgent ? (
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    {(() => {
                      const found = agents.find(a => a.id === selectedAgent);
                      return found ? (found.name || `${found.first_name || ''} ${found.last_name || ''}`.trim()) : "Selected user";
                    })()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setSelectedAgent(undefined)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    type="button"
                    aria-expanded={userPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Select a user</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search users..."
                      value={agentSearch}
                      onValueChange={setAgentSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loadingAgents ? "Loading users..." : "No users found"}
                      </CommandEmpty>
                      <CommandGroup>
                        {agents
                          .filter(agent =>
                            agentSearch === "" ||
                            (agent.name || `${agent.first_name || ''} ${agent.last_name || ''}`.trim())
                              .toLowerCase()
                              .includes(agentSearch.toLowerCase()) ||
                            agent.email?.toLowerCase().includes(agentSearch.toLowerCase())
                          )
                          .map((agent) => (
                            <CommandItem
                              key={agent.id}
                              value={agent.id}
                              onSelect={() => {
                                setSelectedAgent(agent.id);
                                setUserPopoverOpen(false);
                                setAgentSearch("");
                              }}
                            >
                              <div className="flex flex-col">
                                <span>
                                  {agent.name || `${agent.first_name || ''} ${agent.last_name || ''}`.trim()}
                                </span>
                                {agent.email && (
                                  <span className="text-xs text-muted-foreground">
                                    {agent.email}
                                  </span>
                                )}
                              </div>
                              {selectedAgent === agent.id && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
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
