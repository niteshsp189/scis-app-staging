import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  customerActivitiesService,
  CustomerActivity,
} from "@/services/customerActivitiesService";
import userService from "@/services/userService";
import { cn } from "@/lib/utils";

interface EditActivityDialogProps {
  activity: CustomerActivity;
  customerId: number;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateActivity: (activityId: number, activityData: any) => void;
}

export const EditActivityDialog = ({
  activity,
  customerId,
  customerName,
  open,
  onOpenChange,
  onUpdateActivity,
}: EditActivityDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [forwardSearchOpen, setForwardSearchOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

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

  // Helper function to convert 24-hour time format to 12-hour format
  const to12Hour = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHours = h % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };
  const [formData, setFormData] = useState({
    activity_type: "",
    description: "",
    called_for_user_id: "",
    call_forwarded_to_user_id: "",
    activity_date: "",
    activity_time: "",
  });

  // Load users for "Called For" dropdown
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const usersData = await userService.getUsers();
        if (usersData) {
          const userList = usersData.map((user: any) => {
            const firstName = user.first_name || '';
            const lastName = user.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            return {
              id: user.id,
              name: fullName || user.email || `User ${user.id}`,
              email: user.email || '',
            };
          });
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

  // Initialize form data when activity changes
  useEffect(() => {
    if (activity) {
      setFormData({
        activity_type: activity.activity_type || "",
        description: activity.description || "",
        called_for_user_id: activity.called_for_user_id || "",
        call_forwarded_to_user_id: activity.call_forwarded_to_user_id || "",
        activity_date: activity.activity_date || "",
        activity_time: to12Hour(activity.activity_time || ""),
      });
    }
  }, [activity]);

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
      const activityData = {
        activity_type: formData.activity_type,
        title: `${formData.activity_type} - ${formData.description.substring(0, 50)}${formData.description.length > 50 ? '...' : ''}`,
        description: formData.description,
        activity_date: formData.activity_date,
        activity_time: to24Hour(formData.activity_time),
        called_for_user_id: formData.called_for_user_id || undefined,
        call_forwarded_to_user_id: formData.call_forwarded_to_user_id || undefined,
        outcome: "completed",
        priority: "Medium",
        status: "Completed",
        duration_minutes: 0,
      };

      await onUpdateActivity(activity.id, activityData);
    } catch (error) {
      console.error("Error in EditActivityDialog:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
          <DialogDescription>
            Update the activity details for {customerName}.
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
                <SelectValue placeholder="Select activity type" />
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
                          value={user.name}
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
          </div>

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
                          value={user.name}
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
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Activity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
