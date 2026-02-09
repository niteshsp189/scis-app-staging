import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Clock, Bell, User, X, ChevronsUpDown, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { reminderService } from "@/services/reminderService";
import { customerService } from "@/services/customerService";
import { api } from "@/lib/axios";
import { useState, useEffect } from "react";

import { type CustomerData } from "@/types/customer";

interface ReminderFormProps {
  title: string;
  description: string;
  dueDate: Date | undefined;
  dueTime: string;
  selectedCustomer?: number;
  selectedAgent?: string;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setDueDate: (date: Date | undefined) => void;
  setDueTime: (time: string) => void;
  setSelectedCustomer: (customerId: number | undefined) => void;
  setSelectedAgent: (agentId: string | undefined) => void;
  onSubmit: () => void;
  submitting?: boolean;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

export function ReminderForm({
  title,
  description,
  dueDate,
  dueTime,
  selectedCustomer,
  selectedAgent,
  setTitle,
  setDescription,
  setDueDate,
  setDueTime,
  setSelectedCustomer,
  setSelectedAgent,
  onSubmit,
  submitting = false,
  isEditing = false,
  onCancelEdit,
}: ReminderFormProps) {
  const isMobile = useIsMobile();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [agentSearch, setAgentSearch] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);

  // Load customers and agents for selection
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const response = await customerService.getCustomers({ per_page: 1000 });
        if (response && Array.isArray(response.data)) {
          setCustomers(response.data);
        }
      } catch (error) {
        console.error("Failed to load customers:", error);
      } finally {
        setLoadingCustomers(false);
      }
    };

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

    loadCustomers();
    loadAgents();
  }, []);

  const handleNotificationMethodChange = (
    method: "email" | "sms" | "push",
    checked: boolean | 'indeterminate',
  ) => {
    // Removed - notification methods are now hidden
  };

  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer);
  const selectedAgentData = agents.find((a) => a.id === selectedAgent);

  const filteredCustomers = customers.filter(
    (customer) =>
      customerSearch === "" ||
      `${customer.firstName} ${customer.lastName}`
        .toLowerCase()
        .includes(customerSearch.toLowerCase()) ||
      customer.email?.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  const filteredAgents = agents.filter(
    (agent) =>
      agentSearch === "" ||
      (agent.name || `${agent.first_name || ''} ${agent.last_name || ''}`.trim())
        .toLowerCase()
        .includes(agentSearch.toLowerCase()) ||
      agent.email?.toLowerCase().includes(agentSearch.toLowerCase()),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle
          className={`${isMobile ? "text-lg" : "text-xl"} flex items-center gap-2`}
        >
          <Bell className="h-5 w-5" />
          {isEditing ? "Edit Reminder" : "Create New Reminder"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Update the reminder details below"
            : "Set up a reminder for important tasks and follow-ups"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
          <Input
            id="title"
            placeholder="Enter reminder title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Date and Time */}
        <div
          className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-2 gap-4"}`}
        >
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date <span className="text-red-500">*</span></Label>
            <DateInput
              id="dueDate"
              value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
              onChange={(value) => {
                if (value) {
                  // Parse the date string as local date to avoid timezone issues
                  const [year, month, day] = value.split('-').map(Number);
                  const selectedDate = new Date(year, month - 1, day); // month is 0-indexed
                  setDueDate(selectedDate);
                } else {
                  setDueDate(undefined);
                }
              }}
              placeholder="Select due date"
              disabledDates={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const compareDate = new Date(date);
                compareDate.setHours(0, 0, 0, 0);
                return compareDate < today;
              }}
              required
            />
          </div>          <div className="space-y-2">
            <Label htmlFor="dueTime">Due Time <span className="text-red-500">*</span></Label>
            <TimePicker
              value={dueTime}
              onChange={setDueTime}
              placeholder="Select time"
            />
          </div>
        </div>

        {/* Customer Selection */}
        <div className="space-y-2">
          <Label htmlFor="customer">Customer (Optional)</Label>
          {selectedCustomerData ? (
            <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  {selectedCustomerData.firstName}{" "}
                  {selectedCustomerData.lastName}
                </span>
                {selectedCustomerData.email && (
                  <span className="text-sm text-muted-foreground">
                    ({selectedCustomerData.email})
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCustomer(undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerPopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Select a customer</span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search customers..."
                    value={customerSearch}
                    onValueChange={setCustomerSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {loadingCustomers ? "Loading customers..." : "No customers found"}
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          setSelectedCustomer(undefined);
                          setCustomerPopoverOpen(false);
                          setCustomerSearch("");
                        }}
                      >
                        No customer selected
                      </CommandItem>
                      {filteredCustomers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.id.toString()}
                          onSelect={() => {
                            setSelectedCustomer(customer.id);
                            setCustomerPopoverOpen(false);
                            setCustomerSearch("");
                          }}
                        >
                          <div className="flex flex-col">
                            <span>
                              {customer.firstName} {customer.lastName}
                            </span>
                            {customer.email && (
                              <span className="text-xs text-muted-foreground">
                                {customer.email}
                              </span>
                            )}
                          </div>
                          {selectedCustomer === customer.id && (
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

        {/* User Selection */}
        <div className="space-y-2">
          <Label htmlFor="agent">Assign to User (Optional)</Label>
          {selectedAgentData ? (
            <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  {selectedAgentData.name || `${selectedAgentData.first_name || ''} ${selectedAgentData.last_name || ''}`.trim()}
                </span>
                {selectedAgentData.email && (
                  <span className="text-sm text-muted-foreground">
                    ({selectedAgentData.email})
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
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
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          setSelectedAgent(undefined);
                          setUserPopoverOpen(false);
                          setAgentSearch("");
                        }}
                      >
                        No user assigned
                      </CommandItem>
                      {filteredAgents.map((agent) => (
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

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter reminder description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className={`flex gap-2 ${isEditing ? "" : ""}`}>
          {isEditing && onCancelEdit && (
            <Button
              variant="outline"
              onClick={onCancelEdit}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={onSubmit}
            className={isEditing ? "flex-1" : "w-full"}
            disabled={submitting || !title || !dueDate || !dueTime}
          >
            {submitting
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update Reminder"
                : "Create Reminder"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
