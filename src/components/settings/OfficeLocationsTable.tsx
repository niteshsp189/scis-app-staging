import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit2, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { OfficeLocation } from "@/types/organization";
import { officeLocationApi } from "@/services/api/officeLocation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OfficeLocationValidatedInput } from "./OfficeLocationValidatedInput";
import { OfficeLocationPreview } from "./OfficeLocationPreview";
import userService from "@/services/userService";
import { timezoneApi } from "@/services/api/timezone";
import { Timezone } from "@/types/organization";

export function OfficeLocationsTable() {
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<OfficeLocation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<"form" | "preview">("form");
  const [users, setUsers] = useState<any[]>([]);
  const [timezones, setTimezones] = useState<Timezone[]>([]);

  // Define default values inside component
  const defaultValues = {
    name: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    phone: "",
    email: "",
    timezone: "",
    is_primary: false,
    is_active: true,
    latitude: undefined,
    longitude: undefined,
    business_hours: undefined,
    manager_id: "",
  };

  // Define form schema inside component to access timezones state
  const formSchema = z.object({
    name: z
      .string()
      .min(1, "Location name is required")
      .max(100, "Location name must be less than 100 characters"),
    address: z
      .string()
      .min(1, "Address is required")
      .max(255, "Address must be less than 255 characters")
      .regex(
        /^[a-zA-Z0-9\s\-'\.,\/&:]+$/,
        "Address contains invalid characters",
      ),
    city: z
      .string()
      .min(1, "City is required")
      .max(80, "City must be less than 80 characters"),
    state: z
      .string()
      .min(1, "State/Province is required")
      .max(80, "State must be less than 80 characters"),
    postal_code: z
      .string()
      .min(1, "Postal code is required")
      .max(15, "Postal code must be less than 15 characters"),
    country: z
      .string()
      .min(1, "Country is required")
      .max(100, "Country must be less than 100 characters"),
    phone: z
      .string()
      .regex(
        /^[\+]?[\d\s\(\)\-]+$/,
        "Please enter a valid phone number (numbers, spaces, parentheses, and hyphens only)",
      )
      .max(17, "Phone number must be less than 17 characters")
      .optional()
      .or(z.literal("")),
    email: z
      .string()
      .max(123, "Email must be less than 123 characters")
      .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: "Please enter a valid email address",
      })
      .optional()
      .or(z.literal("")),
    timezone: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val) return true;
          // Check against dynamically loaded timezones
          return timezones.some((tz) => tz.name === val);
        },
        {
          message: "Please select a valid timezone from the list",
        },
      ),
    is_primary: z.boolean(),
    is_active: z.boolean(),
    latitude: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? undefined : num;
      })
      .refine((val) => val === undefined || (val >= -90 && val <= 90), {
        message: "Latitude must be between -90 and 90",
      }),
    longitude: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? undefined : num;
      })
      .refine((val) => val === undefined || (val >= -180 && val <= 180), {
        message: "Longitude must be between -180 and 180",
      }),
    business_hours: z.any().optional(),
    manager_id: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const loadLocations = async () => {
    try {
      setIsLoading(true);
      const data = await officeLocationApi.getLocations();
      setLocations(data);
    } catch (error) {
      console.error("Failed to load office locations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load office locations",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
      // Don't show toast for permission errors as handled in service
    }
  };

  const loadTimezones = async () => {
    try {
      const data = await timezoneApi.getTimezones({ active_only: true });
      setTimezones(data);
    } catch (error) {
      console.error("Failed to load timezones:", error);
      // Don't show toast for timezone errors as it's not critical
    }
  };

  useEffect(() => {
    loadLocations();
    loadUsers();
    loadTimezones();
  }, []);

  useEffect(() => {
    if (isDialogOpen && !selectedLocation) {
      try {
        const savedData = localStorage.getItem("officeLocationFormData");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          form.reset(parsedData);
        } else {
          form.reset(defaultValues);
        }
      } catch (error) {
        console.warn("Failed to load saved office location form data:", error);
        form.reset(defaultValues);
      }
    } else if (isDialogOpen && selectedLocation) {
      // For editing, don't load from localStorage
      form.reset({
        name: selectedLocation.name,
        address: selectedLocation.address,
        city: selectedLocation.city || "",
        state: selectedLocation.state || "",
        postal_code: selectedLocation.postal_code || "",
        country: selectedLocation.country || "",
        phone: selectedLocation.phone || "",
        email: selectedLocation.email || "",
        timezone: selectedLocation.timezone || "",
        is_primary: selectedLocation.is_primary,
        is_active: selectedLocation.is_active,
        latitude: selectedLocation.latitude || undefined,
        longitude: selectedLocation.longitude || undefined,
        business_hours: selectedLocation.business_hours || undefined,
        manager_id: selectedLocation.manager_id
          ? selectedLocation.manager_id.toString()
          : "",
      });
    }
  }, [isDialogOpen, selectedLocation, form]);

  useEffect(() => {
    if (!selectedLocation && isDialogOpen) {
      const subscription = form.watch((data) => {
        try {
          localStorage.setItem("officeLocationFormData", JSON.stringify(data));
        } catch (error) {
          console.warn("Failed to save office location form data:", error);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [selectedLocation, form, isDialogOpen]);

  const handleEdit = (location: OfficeLocation) => {
    setSelectedLocation(location);
    setCurrentStep("form");
    setIsDialogOpen(true);
  };

  const handleDelete = async (location: OfficeLocation) => {
    try {
      await officeLocationApi.deleteLocation(location.id);
      toast({
        title: "Success",
        description: "Office location deleted successfully",
      });
      loadLocations();
    } catch (error: any) {
      console.error("Failed to delete office location:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to delete office location";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  const handleDialogClose = () => {
    setSelectedLocation(null);
    setIsDialogOpen(false);
    setCurrentStep("form");

    // Only reset form for new entries
    if (!selectedLocation) {
      form.reset(defaultValues);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (currentStep === "form") {
      setCurrentStep("preview");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedLocation) {
        await officeLocationApi.updateLocation(selectedLocation.id, values);
        toast({
          title: "Success",
          description: "Office location updated successfully",
        });
      } else {
        await officeLocationApi.createLocation(values);
        toast({
          title: "Success",
          description: "Office location created successfully",
        });
        try {
          localStorage.removeItem("officeLocationFormData");
        } catch (error) {
          console.warn(
            "Failed to clear saved office location form data:",
            error,
          );
        }
      }
      handleDialogClose();
      await loadLocations();
    } catch (error: any) {
      console.error("Failed to save office location:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save office location",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualReset = () => {
    form.reset(defaultValues);
    try {
      localStorage.removeItem("officeLocationFormData");
    } catch (error) {
      console.warn("Failed to clear saved office location form data:", error);
    }
    toast({
      title: "Form Reset",
      description: "All form fields have been cleared.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Office Locations</h2>
        <Button
          onClick={() => {
            setSelectedLocation(null);
            form.reset(defaultValues);
            setCurrentStep("form");
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Location
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="border">Name</TableHead>
              <TableHead className="border">Address</TableHead>
              <TableHead className="border">Phone</TableHead>
              <TableHead className="border">Status</TableHead>
              <TableHead className="w-[70px] border">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 border">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium">
                        No office locations found
                      </p>
                      <p className="text-sm">
                        Get started by adding your first office location.
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedLocation(null);
                        form.reset(defaultValues);
                        setCurrentStep("form");
                        setIsDialogOpen(true);
                      }}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add First Location
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium border">
                    {location.name}
                    {location.is_primary && (
                      <Badge variant="secondary" className="ml-2">
                        Primary
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="border">
                    {[
                      location.address,
                      location.city,
                      location.state,
                      location.postal_code,
                      location.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </TableCell>
                  <TableCell className="border">{location.phone}</TableCell>
                  <TableCell className="border">
                    <Badge
                      variant={location.is_active ? "default" : "secondary"}
                    >
                      {location.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="border">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(location)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Office Location
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this office
                                location? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDelete(location)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto p-5"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {currentStep === "form"
                ? selectedLocation
                  ? "Edit Office Location"
                  : "Add Office Location"
                : "Review Office Location"}
            </DialogTitle>
            <DialogDescription>
              {currentStep === "form"
                ? "Fill in the details of the office location."
                : "Please review the information before submitting."}
            </DialogDescription>
            {/* Step Indicators */}
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "form"
                      ? "bg-blue-600 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  1
                </div>
                <span
                  className={`ml-2 text-sm ${currentStep === "form" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                >
                  Location Details
                </span>
              </div>

              <div
                className={`w-8 h-0.5 ${currentStep === "preview" ? "bg-green-600" : "bg-gray-300"}`}
              ></div>

              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "preview"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-500"
                  }`}
                >
                  2
                </div>
                <span
                  className={`ml-2 text-sm ${currentStep === "preview" ? "text-blue-600 font-medium" : "text-gray-500"}`}
                >
                  Review & Submit
                </span>
              </div>
            </div>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {currentStep === "form" ? (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <OfficeLocationValidatedInput
                            {...field}
                            label="Location Name"
                            placeholder="e.g., Main Office"
                            maxLength={100}
                            validationHint="Location name (max 100 chars)"
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <OfficeLocationValidatedInput
                            {...field}
                            label="Address"
                            placeholder="e.g., 123 Main Street, Suite 100"
                            maxLength={255}
                            validationHint="Address (max 255 chars): alphanumeric, spaces, hyphens, apostrophes, periods, commas, slashes, ampersands, colons allowed"
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <OfficeLocationValidatedInput
                              {...field}
                              label="City"
                              placeholder="e.g., New York"
                              maxLength={80}
                              validationHint="City name (max 80 chars)"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <OfficeLocationValidatedInput
                              {...field}
                              label="State/Province"
                              placeholder="e.g., New York or NY"
                              maxLength={80}
                              validationHint="State or province (max 80 chars)"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <OfficeLocationValidatedInput
                              {...field}
                              label="Postal Code"
                              placeholder="e.g., 10001 or 10001-1234"
                              maxLength={15}
                              validationHint="ZIP or postal code (max 15 chars)"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <OfficeLocationValidatedInput
                              {...field}
                              label="Country"
                              placeholder="United States"
                              maxLength={100}
                              validationHint="Country name (max 100 chars)"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <OfficeLocationValidatedInput
                              {...field}
                              label="Phone"
                              type="tel"
                              placeholder="e.g., +1 (555) 123-4567"
                              maxLength={17}
                              validationHint="Valid phone number (numbers, spaces, parentheses, hyphens only, max 17 chars)"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <OfficeLocationValidatedInput
                              {...field}
                              label="Email"
                              type="text"
                              placeholder="contact@location.com"
                              maxLength={123}
                              validationHint="Valid email address (max 123 chars)"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? "" : value)
                          }
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a timezone" />
                            </SelectTrigger>
                          </FormControl>
                           <SelectContent className="max-h-48 overflow-y-auto">
                            <SelectItem value="none">No Timezone</SelectItem>
                            {timezones.map((timezone) => (
                              <SelectItem
                                key={timezone.id}
                                value={timezone.name}
                              >
                                {timezone.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormControl>
                            <OfficeLocationValidatedInput
                              {...field}
                              label="Latitude"
                              type="number"
                              step="any"
                              placeholder="e.g., 40.7128"
                              value={value === undefined ? "" : String(value)}
                              onChange={(newValue) =>
                                onChange(newValue === "" ? undefined : newValue)
                              }
                              validationHint="Latitude (-90 to 90)"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormControl>
                            <OfficeLocationValidatedInput
                              {...field}
                              label="Longitude"
                              type="number"
                              step="any"
                              placeholder="e.g., -74.0060"
                              value={value === undefined ? "" : String(value)}
                              onChange={(newValue) =>
                                onChange(newValue === "" ? undefined : newValue)
                              }
                              validationHint="Longitude (-180 to 180)"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="manager_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manager (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? "" : value)
                          }
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a manager" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Manager</SelectItem>
                            {users.map((user) => (
                              <SelectItem
                                key={user.id}
                                value={user.id.toString()}
                              >
                                {user.first_name} {user.last_name} ({user.email}
                                )
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="is_primary"
                      render={({ field, fieldState }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel
                              className={fieldState.error ? "text-red-600" : ""}
                            >
                              Primary Location
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field, fieldState }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel
                              className={fieldState.error ? "text-red-600" : ""}
                            >
                              Active
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4 flex justify-between">
                    {!selectedLocation && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleManualReset}
                      >
                        Reset Form
                      </Button>
                    )}
                    {selectedLocation && <div></div>}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDialogClose}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        Review Information
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <OfficeLocationPreview
                    formData={form.getValues()}
                    users={users}
                  />
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep("form")}
                    >
                      Edit Information
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDialogClose}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {selectedLocation ? "Updating..." : "Creating..."}
                          </>
                        ) : selectedLocation ? (
                          "Update"
                        ) : (
                          "Create"
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
