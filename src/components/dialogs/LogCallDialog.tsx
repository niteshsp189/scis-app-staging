import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { customerActivitiesService } from "@/services/customerActivitiesService";
import { useEventDispatcher } from "@/hooks/useEventListener";
import userService from "@/services/userService";
import { cn } from "@/lib/utils";

interface LogCallDialogProps {
  customerId: number;
  customerName: string;
  onLogCall: (callData: any) => void;
  trigger?: React.ReactNode;
}

export const LogCallDialog = ({
  customerId,
  customerName,
  onLogCall,
  trigger,
}: LogCallDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [forwardSearchOpen, setForwardSearchOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const dispatchCallCreated = useEventDispatcher('callCreated');

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
    activity_type: "",
    description: "",
    called_for_user_id: "",
    call_forwarded_to_user_id: "",
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

  // Load users for "Called For" dropdown
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const usersData = await userService.getUsers({ active: true });
        if (usersData) {
          const userList = usersData
            .filter((user: any) => user.is_active === true && user.is_agent !== true) // Filter only active non-agent users
            .map((user: any) => {
              const firstName = user.first_name || '';
              const lastName = user.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim();
              return {
                id: user.id,
                name: fullName || user.email || `User ${user.id}`,
                email: user.email || '',
              };
            })
            .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name
          setUsers(userList);
        }
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (open) {
      loadUsers();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.activity_type || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const callData = {
        activity_type: formData.activity_type,
        title: `${formData.activity_type} - ${formData.description.substring(0, 50)}${formData.description.length > 50 ? '...' : ''}`,
        description: formData.description,
        activity_date: formData.activity_date,
        activity_time: to24Hour(formData.activity_time),
        called_for_user_id: formData.called_for_user_id || undefined,
        call_forwarded_to_user_id: formData.call_forwarded_to_user_id || undefined,
        outcome: "completed", // Use lowercase as per API validation
        priority: "Medium",
        status: "Completed",
        duration_minutes: 0,
      };

      await onLogCall(callData);

      // Dispatch event to notify other components
      dispatchCallCreated({ customerId, callData });

      // Trigger notification refresh if call was forwarded
      if (callData.call_forwarded_to_user_id) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshNotifications'));
        }, 500);
      }

      // Reset form
      setFormData({
        activity_type: "",
        description: "",
        called_for_user_id: "",
        call_forwarded_to_user_id: "",
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

      setOpen(false);
    } catch (error) {
      console.error("Error in LogCallDialog:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log Call
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Call</DialogTitle>
          <DialogDescription>
            Record a call interaction for {customerName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                <SelectValue placeholder="Select call type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Incoming Call">Incoming Call</SelectItem>
                <SelectItem value="Outgoing Call">Outgoing Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Called For */}
          <div>
            <Label htmlFor="called_for">Called For</Label>
            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userSearchOpen}
                  className="w-full justify-between"
                >
                  {formData.called_for_user_id
                    ? users.find(
                        (user) => user.id === formData.called_for_user_id
                      )?.name
                    : "Select user/employee..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandList>
                    <CommandEmpty>
                      {loadingUsers ? "Loading users..." : "No user found."}
                    </CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.id}-${user.name}`}
                          keywords={[user.name, user.email]}
                          onSelect={() => {
                            setFormData((prev) => ({
                              ...prev,
                              called_for_user_id: user.id,
                            }));
                            setUserSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.called_for_user_id === user.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {user.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>          <div>
            {/* Call Forwarded */}
            <div>
              <Label htmlFor="call_forwarded">Call Forwarded</Label>
              <Popover open={forwardSearchOpen} onOpenChange={setForwardSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={forwardSearchOpen}
                    className="w-full justify-between"
                  >
                    {formData.call_forwarded_to_user_id
                      ? users.find(
                          (user) => user.id === formData.call_forwarded_to_user_id
                        )?.name
                      : "Select user/employee..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                      <CommandEmpty>
                        {loadingUsers ? "Loading users..." : "No user found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.id}-${user.name}`}
                            keywords={[user.name, user.email]}
                            onSelect={() => {
                              setFormData((prev) => ({
                                ...prev,
                                call_forwarded_to_user_id: user.id,
                              }));
                              setForwardSearchOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.call_forwarded_to_user_id === user.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {user.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
              placeholder="Describe the call purpose and outcome..."
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
              {loading ? "Logging..." : "Log Call"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
