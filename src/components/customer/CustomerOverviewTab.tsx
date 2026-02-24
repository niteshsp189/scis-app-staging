import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/contexts/PermissionContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Calendar, DollarSign, FileText, Users, MessageSquare, User, Heart, Home, PhoneIncoming, PhoneOutgoing, Link, Trash2, Pin, PinOff, Plus, Edit2, BookOpen, PhoneOff, ExternalLink } from "lucide-react";
import { customerActivitiesService, CustomerActivity } from "@/services/customerActivitiesService";
import { api } from "@/lib/axios";
import { useDataMasking, MaskedDisplay } from "@/utils/dataMasking";
import { RelationshipForm } from "./RelationshipForm";
import {
  customerRelationshipService,
  relationshipUtils,
  CustomerRelationship
} from "@/services/customerRelationshipService";
import { toast } from "@/components/ui/use-toast";
import { CustomerNotesDialog } from "@/components/dialogs/CustomerNotesDialog";
import { customerNotesService } from "@/services/customerNotesService";
import { useEventListener, useEventDispatcher } from "@/hooks/useEventListener";
import { dependentService } from "@/services/dependentService";
import { PolicyService } from "@/services/policyService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPermissionError, isPermissionError, getErrorData } from "@/utils/permissionErrorHandler";
import { getCustomerViewUrl } from "@/utils/customerRoutes";
import { formatDisplayDate } from "@/utils/dateFormatters";

interface CustomerRelationship {
  id: number;
  related_customer: {
    id: number;
    first_name: string;
    last_name: string;
    legacy_client_id?: number | null;
  };
  related_customer_name?: string;
  relationship_type: string;
  created_at: string;
  notes?: string;
}

interface CustomerNote {
  id: string;
  customer_id: number;
  content: string;
  color: "black" | "red" | "blue" | "purple" | "green" | "orange" | "yellow" | "pink" | "brown";
  is_important: boolean;
  is_pinned: boolean;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface FamilyMember {
  id: number;
  name: string;
  relationship: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  policies: string[];
  notes?: string;
}

interface Customer {
  // Basic info
  id?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name: string;

  // Personal information
  gender?: string;
  dateOfBirth?: string;
  ssn?: string;
  maritalStatus?: string;

  // Physical details
  height?: string;
  weight?: string;
  smoker?: string;

  // Contact information
  email: string;
  homePhone?: string;
  cellPhone?: string;
  workPhone?: string;
  fax?: string;
  phone: string;

  // Address information
  address?: string;
  apartment?: string;
  apartmentType?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  location: string;

  // Mailing address
  differentMailingAddress?: boolean;
  mailingAddress?: string;
  mailingApartment?: string;
  mailingApartmentType?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingZipCode?: string;

  // Additional details
  referral?: string;

  // Global Book
  isInClientBook?: boolean;
  isInDontCallList?: boolean;

  // System fields
  joinDate: string;
  lastContact: string;
  nextRenewal: string;
  totalPolicies: number;
  totalPremium: number;
  familyMembers: FamilyMember[];
  dependents: Array<{
    name: string;
    relationship: string;
    policies: string[];
  }>;
  groupPolicy: string | null;
  policies: string[];
  notes: CustomerNote[];
}

interface CustomerOverviewTabProps {
  customer: Customer;
  isAdmin?: boolean;
}

const defaultCustomer: Customer = {
  id: 0,
  name: '',
  email: '',
  phone: '',
  location: '',
  joinDate: '',
  lastContact: '',
  nextRenewal: '',
  totalPolicies: 0,
  totalPremium: 0,
  familyMembers: [],
  dependents: [],
  groupPolicy: null,
  policies: [],
  notes: [],
};

export const CustomerOverviewTab = ({ customer = defaultCustomer, isAdmin = false }: CustomerOverviewTabProps) => {
  const navigate = useNavigate();
  const dispatchTabChange = useEventDispatcher("changeTab");
  const {
    getMaskedSSN,
    getMaskedPhone,
    getMaskedEmail,
    getMaskedAddress,
    canViewContact,
    canViewAddress
  } = useDataMasking();

  // Use permission context for sensitive data
  const { hasPermission } = usePermissions();
  const canViewSensitive = hasPermission && hasPermission("view_sensitive_data");

  // Priority badge color mapping - remove since we don't use priority anymore
  const [recentCallLogs, setRecentCallLogs] = useState<CustomerActivity[]>([]);
  const [relationships, setRelationships] = useState<CustomerRelationship[]>([]);
  const [dependents, setDependents] = useState<any[]>([]);
  const [dependentsPolicies, setDependentsPolicies] = useState<Record<number, any[]>>({});
  const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([]);
  const [editingRelationship, setEditingRelationship] = useState<CustomerRelationship | null>(null);
  const [deletingRelationshipId, setDeletingRelationshipId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [relationshipToDelete, setRelationshipToDelete] = useState<CustomerRelationship | null>(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      if (!customer?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch recent call logs
        const activitiesResponse = await customerActivitiesService.getCustomerActivities(customer.id, {
          per_page: 10, // Get more activities and filter client-side
        });

        // Filter for only call activities (Incoming Call and Outgoing Call)
        const callActivities = (activitiesResponse.data || []).filter((activity: CustomerActivity) =>
          activity.activity_type === "Incoming Call" || activity.activity_type === "Outgoing Call"
        );

        // Take only the first 2 call activities for recent calls
        setRecentCallLogs(callActivities.slice(0, 2));

        // Fetch relationships
        setIsLoadingRelationships(true);
        const relationshipsResponse = await customerRelationshipService.getRelationships(customer.id);
        const sortedRelationships = relationshipUtils.sortRelationshipsByPriority(relationshipsResponse);
        setRelationships(sortedRelationships);
        setIsLoadingRelationships(false);

        // Fetch dependents
        try {
          const dependentsData = await dependentService.getDependents(customer.id);
          setDependents(dependentsData || []);

          // Fetch policies for each dependent
          const policiesMap: Record<number, any[]> = {};
          await Promise.all(
            (dependentsData || []).map(async (dependent: any) => {
              try {
                const policies = await dependentService.getDependentPolicies(dependent.id);
                policiesMap[dependent.id] = policies || [];
              } catch (error) {
                console.error(`Failed to fetch policies for dependent ${dependent.id}:`, error);
                policiesMap[dependent.id] = [];
              }
            })
          );
          setDependentsPolicies(policiesMap);
        } catch (error) {
          console.error("Failed to fetch dependents:", error);
          setDependents([]);
          setDependentsPolicies({});
        }

        // Fetch customer notes
        const notesResponse = await customerNotesService.getCustomerNotes(customer.id, { per_page: 5 });
        setCustomerNotes(notesResponse.data);

      } catch (err) {
        setError("Failed to load overview data. Please try again later.");
        console.error(err);
        // Set empty arrays on error to prevent undefined access
        setRecentCallLogs([]);
        setRelationships([]);
        setDependents([]);
        setDependentsPolicies({});
        setIsLoadingRelationships(false);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [customer?.id]);

  // Refresh call logs when a new call is created
  const handleCallCreated = useCallback(async () => {
    if (!customer?.id) return;

    try {
      // Fetch recent call logs
      const activitiesResponse = await customerActivitiesService.getCustomerActivities(customer.id, {
        per_page: 10, // Get more activities and filter client-side
      });

      // Filter for only call activities (Incoming Call and Outgoing Call)
      const callActivities = (activitiesResponse.data || []).filter((activity: CustomerActivity) =>
        activity.activity_type === "Incoming Call" || activity.activity_type === "Outgoing Call"
      );

      // Take only the first 2 call activities for recent calls
      setRecentCallLogs(callActivities.slice(0, 2));
    } catch (error) {
      console.error("Error refreshing call logs:", error);
    }
  }, [customer?.id]);

  // Listen for call created events
  useEventListener('callCreated', handleCallCreated);

  const handleRelationshipSuccess = async () => {
    // Refresh the relationships list
    setIsLoadingRelationships(true);
    try {
      const customerRelationships = await customerRelationshipService.getRelationships(customer.id);
      const sortedRelationships = relationshipUtils.sortRelationshipsByPriority(customerRelationships);
      setRelationships(sortedRelationships);
      setEditingRelationship(null); // Reset editing state

      toast({
        title: editingRelationship ? "Relationship Updated" : "Relationship Added",
        description: editingRelationship
          ? "The relationship has been updated successfully."
          : "The relationship has been added successfully.",
      });
    } catch (error) {
      console.error("Error refreshing relationships:", error);
      toast({
        title: "Error",
        description: "Could not refresh relationships. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRelationships(false);
    }
  };

  const handleDeleteRelationship = (relationship: CustomerRelationship) => {
    setRelationshipToDelete(relationship);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteRelationship = async () => {
    if (!relationshipToDelete) return;

    const relationshipId = relationshipToDelete.id;

    try {
      setDeletingRelationshipId(relationshipId);
      setDeleteConfirmOpen(false);

      // Show loading state
      toast({
        title: "Deleting...",
        description: "Removing relationship...",
      });

      await customerRelationshipService.deleteRelationship(relationshipId);

      // Remove from local state immediately for better UX
      setRelationships((prev) => prev.filter((rel) => rel.id !== relationshipId));

      toast({
        title: "Relationship Removed",
        description: "Relationship has been removed successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting relationship:", error);

      // Handle different error types
      if (isPermissionError(error)) {
        const errorData = getErrorData(error);
        toast({
          title: "Insufficient Permissions",
          description: formatPermissionError(errorData),
          variant: "default",
          className: "bg-blue-50 border-blue-200",
        });
      } else {
        let errorMessage = "Failed to remove relationship. Please try again.";
        let errorTitle = "Error";

        if (error.response?.status === 404) {
          errorMessage = "Relationship not found. It may have already been removed.";
          errorTitle = "Not Found";
        } else if (error.response?.status === 500) {
          errorMessage = "Server error occurred. Please contact support if the problem persists.";
          errorTitle = "Server Error";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
          errorTitle = "Error";
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      }

      // Refresh the relationships list to ensure UI is in sync
      try {
        const relationshipsResponse = await customerRelationshipService.getRelationships(customer.id);
        const sortedRelationships = relationshipUtils.sortRelationshipsByPriority(relationshipsResponse);
        setRelationships(sortedRelationships);
      } catch (refreshError) {
        console.error("Error refreshing relationships after delete failure:", refreshError);
      }
    } finally {
      setDeletingRelationshipId(null);
      setRelationshipToDelete(null);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "Not provided";
    return phone;
  };

  const formatAddress = (address?: string, apartment?: string, apartmentType?: string, city?: string, state?: string, zipCode?: string, country?: string) => {
    let fullAddress = "";
    if (address) fullAddress += address;
    if (apartment && apartmentType) fullAddress += `, ${apartmentType} ${apartment}`;
    else if (apartment) fullAddress += `, ${apartment}`;
    if (city || state || zipCode || country) {
      fullAddress += fullAddress ? ", " : "";
      fullAddress += [city, state, zipCode, country].filter(Boolean).join(", ");
    }
    return fullAddress || "Not provided";
  };

  // Parse height into feet and inches for display
  const parseHeight = (height: string) => {
    if (!height) return { feet: "", inches: "" };
    const match = height.match(/(\d+)'?\s*(\d+)?"?/);
    if (match) {
      return {
        feet: match[1] || "",
        inches: match[2] || ""
      };
    }
    return { feet: "", inches: "" };
  };

  if (!customer || !customer.id) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const { feet, inches } = parseHeight(customer.height);

  // Get latest 2 notes with proper sorting (pinned first, then by date)
  const latestNotes = customerNotesService.sortNotes(customerNotes, "date", "desc").slice(0, 2) || [];

  // Color mapping for notes with all 9 colors
  const getNoteColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      black: "bg-gray-50 border-l-gray-500 text-gray-900",
      red: "bg-red-50 border-l-red-400 text-red-900",
      blue: "bg-blue-50 border-l-blue-400 text-blue-900",
      purple: "bg-purple-50 border-l-purple-400 text-purple-900",
      green: "bg-green-50 border-l-green-400 text-green-900",
      orange: "bg-orange-50 border-l-orange-400 text-orange-900",
      yellow: "bg-yellow-50 border-l-yellow-400 text-yellow-900",
      pink: "bg-pink-50 border-l-pink-400 text-pink-900",
      brown: "bg-amber-50 border-l-amber-400 text-amber-900",
    };
    return colorMap[color] || "bg-gray-50 border-l-gray-400 text-gray-900";
  };

  const handleTogglePin = async (noteId: string, currentlyPinned: boolean) => {
    try {
      const response = await customerNotesService.togglePinNote(
        customer.id,
        noteId,
        !currentlyPinned,
      );

      const updatedNotes = customerNotes.map((note) =>
        note.id === noteId ? response.data : note,
      );
      setCustomerNotes(updatedNotes);

      toast({
        title: currentlyPinned ? "Note Unpinned" : "Note Pinned",
        description: `Note has been ${currentlyPinned ? 'unpinned' : 'pinned'} successfully.`,
      });
    } catch (error: any) {
      console.error("Failed to toggle pin:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to toggle pin",
        variant: "destructive",
      });
    }
  };

  const handleNotesUpdate = (updatedNotes: CustomerNote[]) => {
    setCustomerNotes(updatedNotes);
  };

  const handleAddNote = () => {
    setNotesDialogOpen(true);
  };

  const handleEditRelationship = (relationship: CustomerRelationship) => {
    setEditingRelationship(relationship);
    setIsAddRelationshipOpen(true);
  };

  const handleAddRelationship = () => {
    setEditingRelationship(null);
    setIsAddRelationshipOpen(true);
  };

  return (
    <div className="space-y-6">

      {/* Personal Information, Contact Information, and Physical Details - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Personal Information and Physical Details */}
        <div className="space-y-4">
          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-primary" />
              Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Full Name */}
              <div className="p-3 bg-muted rounded-lg col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground font-medium">Full Name</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {customer.firstName && customer.lastName
                    ? `${customer.firstName} ${customer.middleName ? customer.middleName + ' ' : ''}${customer.lastName}`
                    : customer.name
                  }
                </span>
              </div>

              {/* Gender */}
              {customer.gender && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Gender</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{customer.gender}</span>
                </div>
              )}

              {/* Date of Birth */}
              {customer.dateOfBirth && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Date of Birth</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatDisplayDate(customer.dateOfBirth)}
                  </span>
                </div>
              )}

              {/* Marital Status */}
              {customer.maritalStatus && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Marital Status</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{customer.maritalStatus}</span>
                </div>
              )}

              {/* SSN */}
              {customer.ssn && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">SSN</span>
                  </div>
                  <MaskedDisplay
                    value={customer.ssn}
                    type="ssn"
                    className="text-sm font-semibold text-foreground"
                    visible={canViewSensitive}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Physical Details */}
          {(customer.height || customer.weight || customer.smoker) && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4 text-primary" />
                Physical Details
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {/* Height */}
                {customer.height && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground font-medium">Height</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {feet && inches ? `${feet} ft ${inches} in` : customer.height}
                    </span>
                  </div>
                )}

                {/* Weight */}
                {customer.weight && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground font-medium">Weight</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{customer.weight}</span>
                  </div>
                )}

                {/* Smoker */}
                {customer.smoker && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground font-medium">Smoker</span>
                    </div>
                    <Badge variant={customer.smoker === "Yes" ? "destructive" : "default"}>
                      {customer.smoker}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Contact Information and Address */}
        <div className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              Contact Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Email */}
              <div className="p-3 bg-muted rounded-lg col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground font-medium">Email</span>
                </div>
                <MaskedDisplay
                  value={customer.email}
                  type="email"
                  className="text-sm text-foreground font-medium break-all"
                  fallback="No email provided"
                  visible={canViewSensitive}
                />
              </div>

              {/* Cell Phone */}
              {customer.cellPhone && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Cell Phone</span>
                  </div>
                  <MaskedDisplay
                    value={customer.cellPhone}
                    type="phone"
                    className="text-sm text-foreground font-medium"
                    visible={canViewSensitive}
                  />
                </div>
              )}

              {/* Home Phone */}
              {customer.homePhone && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Home Phone</span>
                  </div>
                  <MaskedDisplay
                    value={customer.homePhone}
                    type="phone"
                    className="text-sm text-foreground font-medium"
                    visible={canViewSensitive}
                  />
                </div>
              )}

              {/* Work Phone */}
              {customer.workPhone && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Work Phone</span>
                  </div>
                  <MaskedDisplay
                    value={customer.workPhone}
                    type="phone"
                    className="text-sm text-foreground font-medium"
                    visible={canViewSensitive}
                  />
                </div>
              )}

              {/* Fax */}
              {customer.fax && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Fax</span>
                  </div>
                  <MaskedDisplay
                    value={customer.fax}
                    type="phone"
                    className="text-sm text-foreground font-medium"
                    visible={canViewSensitive}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <Home className="h-4 w-4 text-primary" />
              Address Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Physical Address */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground font-medium">Physical Address</span>
                </div>
                <MaskedDisplay
                  value={formatAddress(customer.address, customer.apartment, customer.apartmentType, customer.city, customer.state, customer.zipCode, customer.country)}
                  type="address"
                  className="text-sm text-foreground font-medium"
                  fallback="No address provided"
                  visible={canViewSensitive}
                />
              </div>

              {/* Referral Source */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground font-medium">Referral Source</span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {customer.referral || "Not specified"}
                </span>
              </div>

              {/* Mailing Address (if different) */}
              {customer.differentMailingAddress && (
                <div className="p-3 bg-muted rounded-lg col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Mailing Address</span>
                  </div>
                  <MaskedDisplay
                    value={formatAddress(customer.mailingAddress, customer.mailingApartment, customer.mailingApartmentType, customer.mailingCity, customer.mailingState, customer.mailingZipCode, customer.mailingCountry)}
                    type="address"
                    className="text-sm text-foreground font-medium"
                    fallback="No mailing address provided"
                    visible={canViewSensitive}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Book Status */}
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4 text-primary" />
          Global Book Status
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customer.isInClientBook ? (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Included in Client Book</p>
                <p className="text-xs text-blue-700">This customer mark as included in client book</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Not Included in Client Book</p>
                <p className="text-xs text-gray-600">This customer is not part of client book</p>
              </div>
            </div>
          )}
          {customer.isInDontCallList ? (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                  <PhoneOff className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-900">Included in Don't Call List</p>
                <p className="text-xs text-red-700">This customer mark as to include in do not call list</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center">
                  <PhoneOff className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Not Included in Don't Call List</p>
                <p className="text-xs text-gray-600">This customer is not in do not call list</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Important Dates */}
      {/* <div className="space-y-4">
        <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-primary" />
          Important Dates
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg max-w-xl">
            <span className="text-sm text-muted-foreground font-medium min-w-[120px]">Customer Since:</span>
            <span className="text-sm font-semibold text-foreground">
              {new Date(customer.joinDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg max-w-xl">
            <span className="text-sm text-muted-foreground font-medium min-w-[120px]">Last Contact:</span>
            <span className="text-sm font-semibold text-foreground">
              {new Date(customer.lastContact).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg max-w-xl">
            <span className="text-sm text-muted-foreground font-medium min-w-[120px]">Next Renewal:</span>
            <span className="text-sm font-semibold text-foreground">
              {new Date(customer.nextRenewal).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div> */}

      {/* Statistics Cards */}
      {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 min-h-[80px] flex flex-col justify-center">
          <FileText className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-600 leading-tight">{customer.totalPolicies}</p>
          <p className="text-xs text-blue-700 font-medium mt-1">Total Policies</p>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 min-h-[80px] flex flex-col justify-center">
          <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-600 leading-tight break-all">${customer.totalPremium.toLocaleString()}</p>
          <p className="text-xs text-green-700 font-medium mt-1">Annual Premium</p>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 min-h-[80px] flex flex-col justify-center">
          <Users className="h-5 w-5 text-purple-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-purple-600 leading-tight">{(customer.familyMembers?.length || 0) + (customer.dependents?.length || 0)}</p>
          <p className="text-xs text-purple-700 font-medium mt-1">Dependents</p>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 min-h-[80px] flex flex-col justify-center">
          <MessageSquare className="h-5 w-5 text-orange-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-orange-600 leading-tight">{customer.notes?.length || 0}</p>
          <p className="text-xs text-orange-700 font-medium mt-1">Notes</p>
        </div>
      </div> */}

      {/* Notes and Related People Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Notes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-primary" />
              Latest Notes
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddNote}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </div>
          {latestNotes.length > 0 ? (
            <div className="space-y-3">
              {latestNotes.map((note) => (
                <div key={note.id} className="space-y-1">
                  {/* Name, timestamp, badges - OUTSIDE the color box */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">
                        {customerNotesService.getFullName(note.creator)}
                      </span>
                      <span>{customerNotesService.formatTimestamp(note.created_at)}</span>
                      {note.is_pinned && (
                        <Badge variant="secondary" className="text-xs">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      {note.is_important && (
                        <Badge variant="secondary" className="text-xs">Important</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePin(note.id, note.is_pinned)}
                      className="h-6 w-6 p-0 hover:bg-yellow-100"
                      title={note.is_pinned ? "Unpin note" : "Pin note"}
                    >
                      {note.is_pinned ? (
                        <PinOff className="h-3 w-3" />
                      ) : (
                        <Pin className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  {/* Color box - only title and content */}
                  <div
                    className={`p-3 rounded-lg border-l-4 ${getNoteColorClass(note.color)} ${note.is_pinned ? 'ring-1 ring-yellow-200' : ''}`}
                  >
                    {note.title && (
                      <h4 className="text-sm font-semibold mb-1">{note.title}</h4>
                    )}
                    <div 
                      className="text-sm font-medium text-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm">No notes added yet</p>
              <p className="text-xs">Notes will appear here when added</p>
            </div>
          )}
        </div>

        {/* Related People Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              Related People
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRelationship}
            >
              <Link className="h-4 w-4 mr-1" />
              Add People
            </Button>
          </div>

          {/* Combined Relationships and Dependents List */}
          {isLoadingRelationships ? (
            <div className="text-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading relationships...</p>
            </div>
          ) : (() => {
            // Get IDs of converted dependents (to avoid duplication)
            const convertedDependentIds = new Set(
              (dependents || [])
                .filter(d => d.relatedCustomerId)
                .map(d => d.relatedCustomerId)
            );

            // Combine relationships and dependents
            const allRelatedPeople = [
              // Manual relationships (exclude those that are converted dependents)
              ...(relationships || [])
                .filter(rel => !convertedDependentIds.has(rel.related_customer?.id))
                .map(rel => ({
                  ...rel,
                  type: 'relationship' as const,
                  displayName: rel.related_customer_name || `${rel.related_customer?.first_name} ${rel.related_customer?.last_name}`,
                  badgeText: rel.relationship_type,
                  badgeColor: relationshipUtils.getRelationshipTypeColor(rel.relationship_type),
                  addedDate: rel.created_at,
                  isEditable: true,
                  isDeletable: true,
                  navigateTo: rel.related_customer?.id ? getCustomerViewUrl(
                    rel.related_customer.id, 
                    rel.related_customer.status || rel.related_customer.customer_type,
                    rel.related_customer.legacy_client_id
                  ) : null,
                })),
              // Dependents (use legacy_client_id for converted ones)
              ...(dependents || []).map((dependent) => ({
                id: `dependent-${dependent.id}`,
                type: 'dependent' as const,
                displayName: `${dependent.firstName} ${dependent.lastName}`,
                badgeText: dependent.relationship || 'Dependent',
                badgeColor: 'bg-green-100 text-green-800 border-green-200',
                addedDate: null,
                isEditable: false,
                isDeletable: false,
                policies: (dependentsPolicies[dependent.id] || []).map((policy: any) => policy.policy_number),
                navigateTo: dependent.relatedCustomerId
                  ? getCustomerViewUrl(
                      dependent.relatedCustomerId,
                      dependent.relatedCustomerStatus || dependent.status || 'Client',
                      dependent.relatedCustomerLegacyId
                    )
                  : null as string | null,
              })),
            ];

            return allRelatedPeople.length > 0 ? (
              <div className="space-y-3">
                {allRelatedPeople.map((person) => (
                  <div
                    key={person.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${person.type === 'relationship'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-green-50 border-green-200'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${person.type === 'relationship'
                          ? 'bg-blue-100'
                          : 'bg-green-100'
                        }`}>
                        {person.type === 'relationship' ? (
                          <Link className={`h-4 w-4 ${person.type === 'relationship'
                              ? 'text-blue-600'
                              : 'text-green-600'
                            }`} />
                        ) : (
                          <Users className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {person.navigateTo ? (
                            <a
                              href={person.navigateTo!.startsWith('tab:') ? undefined : person.navigateTo!}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                              onClick={(e) => {
                                e.preventDefault();
                                if (person.navigateTo!.startsWith('tab:')) {
                                  dispatchTabChange(person.navigateTo!.replace('tab:', ''));
                                } else {
                                  navigate(person.navigateTo!);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              }}
                              title={`View ${person.displayName}`}
                            >
                              {person.displayName}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <h5 className="font-medium text-foreground">
                              {person.displayName}
                            </h5>
                          )}
                          <Badge
                            variant="outline"
                            className={person.badgeColor}
                          >
                            {person.badgeText}
                          </Badge>
                          {person.type === 'dependent' && (
                            <Badge variant="secondary" className="text-xs">
                              Dependent
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {person.type === 'relationship' ? (
                            `Added on ${formatDisplayDate(person.addedDate)}`
                          ) : person.policies && person.policies.length > 0 ? (
                            `Policies: ${person.policies.join(', ')}`
                          ) : (
                            'Family member'
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {person.isEditable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRelationship(person as CustomerRelationship)}
                          title="Edit relationship"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                      {person.isDeletable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRelationship(person as CustomerRelationship)}
                          title="Delete relationship"
                          disabled={deletingRelationshipId === person.id}
                        >
                          {deletingRelationshipId === person.id ? (
                            <div className="animate-spin h-3 w-3 border border-gray-300 border-t-transparent rounded-full"></div>
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">No related people added yet</p>
                <p className="text-xs">Click "Add Relationship" to connect this customer with others</p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Group Policy Section */}
      {customer.groupPolicy && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold text-purple-800">Group Policy Coverage</h4>
          </div>
          <p className="text-purple-700 font-medium">{customer.groupPolicy}</p>
        </div>
      )}

      {/* Active Policies */}
      {/* {customer.policies && customer.policies.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Active Policies
          </h4>
          <div className="flex flex-wrap gap-2">
            {customer.policies.map((policy, index) => (
              <Badge key={index} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">
                {policy}
              </Badge>
            ))}
          </div>
        </div>
      )} */}

      {/* Call Logs Section */}
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-primary" />
          Recent Call Logs
        </h4>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="space-y-3">
            {recentCallLogs && recentCallLogs.length > 0 ? (
              recentCallLogs.map((log) => (
                <div key={log.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {log.activity_type === "Incoming Call" ? (
                      <PhoneIncoming className="h-4 w-4 text-green-600" />
                    ) : (
                      <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                    )}
                    <Badge variant={log.activity_type === "Incoming Call" ? "default" : "secondary"} className="text-xs">
                      {log.activity_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {customerActivitiesService.formatActivityDateTime(log.activity_date, log.activity_time)} • {customerActivitiesService.formatDuration(log.duration_minutes)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{log.description || log.title}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent call logs found.</p>
            )}
          </div>
        )}
      </div>

      {/* Relationship Form Dialog */}
      <RelationshipForm
        isOpen={isAddRelationshipOpen}
        onOpenChange={(open) => {
          setIsAddRelationshipOpen(open);
          if (!open) {
            setEditingRelationship(null);
          }
        }}
        customerId={customer.id || 0}
        onSuccess={handleRelationshipSuccess}
        editingRelationship={editingRelationship}
      />

      {/* Customer Notes Dialog */}
      <CustomerNotesDialog
        customerId={customer.id || 0}
        customerName={customer.name || `${customer.firstName} ${customer.lastName}`}
        notes={customerNotes}
        onUpdateNotes={handleNotesUpdate}
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
        relatedContacts={relationships.map(rel => ({
          id: rel.related_customer?.id || rel.id,
          name: rel.related_customer_name,
          first_name: rel.related_customer?.first_name,
          last_name: rel.related_customer?.last_name,
        }))}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Relationship</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the relationship with{" "}
              <strong>
                {relationshipToDelete?.related_customer_name ||
                  `${relationshipToDelete?.related_customer?.first_name} ${relationshipToDelete?.related_customer?.last_name}`}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRelationship}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Relationship
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};