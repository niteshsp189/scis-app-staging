import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerDetailsHeader } from "@/components/customer/CustomerDetailsHeader";
import { CustomerQuickStats } from "@/components/customer/CustomerQuickStats";
import { CustomerOverviewTab } from "@/components/customer/CustomerOverviewTab";
import { CustomerPoliciesTab } from "@/components/customer/CustomerPoliciesTab";
import { CustomerFamilyTab } from "@/components/customer/CustomerFamilyTab";
import { CustomerDocumentsTab } from "@/components/customer/CustomerDocumentsTab";
import { CustomerNotesTab } from "@/components/customer/CustomerNotesTab";
import { CustomerAppointmentsTab } from "@/components/customer/CustomerAppointmentsTab";
import { CustomerCallsTab } from "@/components/customer/CustomerCallsTab";
import appointmentService from "@/services/appointmentService";
import { CustomerHistoryTab } from "@/components/customer/CustomerHistoryTab";
import { CustomerCredentialsTab } from "@/components/customer/CustomerCredentialsTab";
import { useEventListener } from "@/hooks/useEventListener";
import { EditCustomerDialog } from "@/components/dialogs/EditCustomerDialog";
import { DeleteCustomerDialog } from "@/components/dialogs/DeleteCustomerDialog";
import { CustomerData, CustomerNote } from "@/types/customer";
import { fieldChangeTracker } from "@/utils/fieldChangeTracker";
import { useIsMobile } from "@/hooks/use-mobile";
import useAuth from "@/hooks/usePermissions";
import { useCustomer } from "@/hooks/useCustomers";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";

const CustomerDetails = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole("Admin") || hasRole("Super Admin");
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const customerId = parseInt(id || "0");

  const { customer, loading, error, refresh } = useCustomer(customerId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";

  // tabs that belong to the second row on mobile
  const mobileInnerTabs = [
    "calls",
    "dependencies",
    "credentials",
    "notes",
    "appointments",
  ];

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [mobileActiveTab, setMobileActiveTab] = useState<string>("more");

  // if initial tab corresponds to an inner mobile tab, activate it specially
  useEffect(() => {
    if (isMobile && mobileInnerTabs.includes(initialTab)) {
      setMobileActiveTab(initialTab);
      // outer tab should default to overview rather than blank
      setActiveTab(initialTab === "history" ? "history" : "overview");
    }
  }, [isMobile, initialTab]);
  const [notesCount, setNotesCount] = useState<number>(0);
  const [appointmentsCount, setAppointmentsCount] = useState<number>(0);

  // Set dynamic page title and meta tags for link preview sharing
  useEffect(() => {
    if (customer) {
      const customerType = customer.status || "Client";
      const fullName = [customer.firstName, customer.middleName, customer.lastName]
        .filter(Boolean)
        .join(" ") || customer.name || "Unknown";

      const pageTitle = `SCIS — Viewing ${customerType} ${fullName}`;
      document.title = pageTitle;

      // Update Open Graph meta tags for link preview in chat/social sharing
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const metaDescription = document.querySelector('meta[name="description"]');

      if (ogTitle) ogTitle.setAttribute("content", pageTitle);
      if (ogDescription) ogDescription.setAttribute("content", `Viewing ${customerType.toLowerCase()} profile for ${fullName}`);
      if (metaDescription) metaDescription.setAttribute("content", `Viewing ${customerType.toLowerCase()} profile for ${fullName}`);
    }

    return () => {
      // Reset title when leaving the page
      document.title = "SCIS - Insurance Management System";
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const metaDescription = document.querySelector('meta[name="description"]');
      if (ogTitle) ogTitle.setAttribute("content", "SCIS - Insurance Management System");
      if (ogDescription) ogDescription.setAttribute("content", "Comprehensive CRM for Insurance Agents - Manage leads, deals, policies, and customer relationships");
      if (metaDescription) metaDescription.setAttribute("content", "Comprehensive CRM for Insurance Agents - Manage leads, deals, policies, and customer relationships");
    };
  }, [customer]);

  // Handler for tab change events
  const handleTabChange = useCallback(
    (tabName: string) => {
      if (!tabName) return;

      if (
        isMobile &&
        mobileInnerTabs.includes(tabName) &&
        tabName !== "history"
      ) {
        // switch inner mobile panel, leave outer tab unchanged
        setMobileActiveTab(tabName);
      } else {
        // outer tab selection
        setActiveTab(tabName);
      }
    },
    [isMobile],
  );

  // Listen for tab change events
  useEventListener("changeTab", handleTabChange);

  // Initialize field change tracker with initial data
  useEffect(() => {
    if (customer) {
      fieldChangeTracker.setInitialData(customer);
      // Initialize notes count from customer data
      setNotesCount(customer.notes?.length || 0);
      // Eagerly fetch appointments count
      appointmentService.getAppointments({ customer_id: customer.id, per_page: 1000 })
        .then((response) => {
          if (response.success) {
            const data = Array.isArray(response.data)
              ? response.data
              : 'data' in response.data
                ? response.data.data
                : [];
            setAppointmentsCount(data.length);
          }
        })
        .catch(() => {});
    }
  }, [customer]);

  const handleUpdateNotes = (notes: CustomerNote[]) => {
    if (customer) {
      fieldChangeTracker.trackChange("notes", notes, "Current User");
      // Update the notes count state
      setNotesCount(notes.length);
    }
  };

  const handleConversionSuccess = () => {
    // Refresh customer data after conversion
    refresh();
  };

  const handleUpdateDocuments = (documents: any[]) => {
    if (customer) {
      fieldChangeTracker.trackChange("documents", documents, "Current User");
    }
  };

  const handleUpdatePolicies = (policies: string[]) => {
    if (customer) {
      fieldChangeTracker.trackChange("policies", policies, "Current User");
      fieldChangeTracker.trackChange(
        "totalPolicies",
        policies.length,
        "Current User",
      );
    }
  };

  const handleUpdateFamilyMembers = (familyMembers: any[]) => {
    if (customer) {
      fieldChangeTracker.trackChange(
        "familyMembers",
        familyMembers,
        "Current User",
      );
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen ${isMobile ? "bg-gray-50" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"}`}
      >
        <div
          className={`${isMobile ? "p-2" : "p-4 sm:p-8"} max-w-7xl mx-auto space-y-${isMobile ? "4" : "6"}`}
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isNotFound = error.toLowerCase().includes('not found') || error.toLowerCase().includes('doesn\'t exist');
    const isPermission = error.toLowerCase().includes('permission');
    
    return (
      <div
        className={`min-h-screen ${isMobile ? "bg-gray-50" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"}`}
      >
        <div
          className={`${isMobile ? "p-2" : "p-4 sm:p-8"} max-w-7xl mx-auto space-y-${isMobile ? "4" : "6"}`}
        >
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/clients")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Customers
            </Button>
          </div>
          
          <Alert variant={isPermission ? "default" : "destructive"} className={isPermission ? "bg-blue-50 border-blue-200" : ""}>
            <AlertDescription className="flex flex-col gap-4">
              <div>
                <h3 className="font-semibold mb-2">
                  {isNotFound ? "Customer Not Found" : isPermission ? "Access Denied" : "Error Loading Customer"}
                </h3>
                <p>{error}</p>
              </div>
              {isNotFound && (
                <div className="text-sm text-muted-foreground">
                  <p>Possible reasons:</p>
                  <ul className="list-disc list-inside ml-2 mt-1">
                    <li>The customer ID is incorrect</li>
                    <li>The customer has been deleted</li>
                    <li>The customer belongs to a different organization</li>
                  </ul>
                </div>
              )}
              <div>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/clients")}
                  className="mr-2"
                >
                  View All Customers
                </Button>
                <Button
                  variant="secondary"
                  onClick={refresh}
                >
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div
        className={`min-h-screen ${isMobile ? "bg-gray-50" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"}`}
      >
        <div
          className={`${isMobile ? "p-2" : "p-4 sm:p-8"} max-w-7xl mx-auto space-y-${isMobile ? "4" : "6"}`}
        >
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/clients")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Customers
            </Button>
          </div>
          
          <Alert>
            <AlertDescription className="flex flex-col gap-4">
              <p>Customer not found.</p>
              <Button
                variant="outline"
                onClick={() => navigate("/clients")}
              >
                View All Customers
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isMobile ? "bg-gray-50" : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"}`}
    >
      <div
        className={`${isMobile ? "p-2" : "p-4 sm:p-8"} max-w-auto mx-auto space-y-${isMobile ? "4" : "6"}`}
      >
        <CustomerDetailsHeader
          customerData={customer}
          onEditCustomer={() => setIsEditDialogOpen(true)}
          onConvertProspect={customer?.status === "Prospect" ? () => setIsConvertDialogOpen(true) : undefined}
        />

        {/* hide summary stats on mobile per requirements */}
        {!isMobile && <CustomerQuickStats customerData={customer} />}

        {/* Detailed Information */}
        <div
          className={`bg-white rounded-${isMobile ? "xl" : "2xl"} shadow-sm border border-gray-100 ${isMobile ? "p-3" : "p-6"}`}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList
              className={`grid w-full ${isMobile ? "grid-cols-4 h-auto gap-1 p-1" : "grid-cols-9"}`}
            >
              <TabsTrigger
                value="overview"
                className={isMobile ? "text-xs py-2.5 px-2" : ""}
              >
                Info
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className={isMobile ? "text-xs py-2.5 px-2" : ""}
              >
                Attachment
              </TabsTrigger>
              {customer?.status !== "Prospect" && (
                <TabsTrigger
                  value="policies"
                  className={isMobile ? "text-xs py-2.5 px-2" : ""}
                >
                  Policies
                </TabsTrigger>
              )}
              {isMobile && (
                <TabsTrigger
                  value="history"
                  className="text-xs py-2.5 px-2"
                >
                  History
                </TabsTrigger>
              )}
              {!isMobile && (
                <>
                  <TabsTrigger value="calls">Calls</TabsTrigger>
                  <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                  <TabsTrigger
                    value="credentials"
                    className=""
                  >
                    Credentials
                  </TabsTrigger>
                  <TabsTrigger value="documents">Attachments</TabsTrigger>
                  <TabsTrigger value="notes">
                    Notes ({notesCount})
                  </TabsTrigger>
                  <TabsTrigger value="appointments">Appointments ({appointmentsCount})</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </>
              )}
            </TabsList>

            {isMobile && (
              <div className="mt-4 mb-4">
                <Tabs
                  value={mobileActiveTab}
                  onValueChange={setMobileActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-5 h-auto gap-1 p-1">
                    <TabsTrigger value="calls" className="text-xs py-2.5 px-1.5">
                      Calls
                    </TabsTrigger>
                    <TabsTrigger
                      value="dependencies"
                      className="text-xs py-2.5 px-1.5"
                    >
                      Deps
                    </TabsTrigger>
                    <TabsTrigger value="credentials" className="text-xs py-2.5 px-1.5">
                      Creds
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs py-2.5 px-1.5">
                      Notes
                    </TabsTrigger>
                    <TabsTrigger
                      value="appointments"
                      className="text-xs py-2.5 px-1.5"
                    >
                      Meet
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="calls" className="mt-4">
                    <CustomerCallsTab
                      customerId={customer.id}
                      customerName={customer.name}
                    />
                  </TabsContent>

                  <TabsContent value="dependencies" className="mt-4">
                    <CustomerFamilyTab
                      customerData={customer}
                      onUpdateFamilyMembers={handleUpdateFamilyMembers}
                    />
                  </TabsContent>

                  <TabsContent value="credentials" className="mt-4">
                    <CustomerCredentialsTab customerData={customer} />
                  </TabsContent>

                  <TabsContent value="notes" className="mt-4">
                    <CustomerNotesTab
                      customerData={customer}
                      onUpdateNotes={handleUpdateNotes}
                    />
                  </TabsContent>

                  <TabsContent value="appointments" className="mt-4">
                    <CustomerAppointmentsTab
                      customerId={customer.id}
                      customerName={`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.name || 'Customer'}
                      onCountChange={setAppointmentsCount}
                    />
                  </TabsContent>

                </Tabs>
              </div>
            )}

            {isMobile && (
              <TabsContent value="documents" className="mt-4">
                <CustomerDocumentsTab customerId={customer.id} />
              </TabsContent>
            )}
            {isMobile && (
              <TabsContent value="history" className="mt-4">
                <CustomerHistoryTab
                  customerId={customer.id}
                  customerName={`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.name || 'Customer'}
                />
              </TabsContent>
            )}

            <TabsContent
              value="overview"
              className={`${isMobile ? "mt-4" : "mt-6"}`}
            >
              <CustomerOverviewTab customer={customer} isAdmin={isAdmin} />
            </TabsContent>

            {!isMobile && (
              <TabsContent value="calls" className="mt-6">
                <CustomerCallsTab
                  customerId={customer.id}
                  customerName={customer.name}
                />
              </TabsContent>
            )}

            {customer?.status !== "Prospect" && (
              <TabsContent
                value="policies"
                className={`${isMobile ? "mt-4" : "mt-6"}`}
              >
                <CustomerPoliciesTab
                  customerData={customer}
                  onUpdatePolicies={handleUpdatePolicies}
                />
              </TabsContent>
            )}

            {!isMobile && (
              <>
                <TabsContent value="dependencies" className="mt-6">
                  <CustomerFamilyTab
                    customerData={customer}
                    onUpdateFamilyMembers={handleUpdateFamilyMembers}
                  />
                </TabsContent>

                <TabsContent value="credentials" className="mt-6">
                  <CustomerCredentialsTab customerData={customer} />
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                  <CustomerDocumentsTab customerId={customer.id} />
                </TabsContent>

                <TabsContent value="notes" className="mt-6">
                  <CustomerNotesTab
                    customerData={customer}
                    onUpdateNotes={handleUpdateNotes}
                  />
                </TabsContent>

                <TabsContent value="appointments" className="mt-6">
                  <CustomerAppointmentsTab
                    customerId={customer.id}
                    customerName={
                      customer.first_name + " " + customer.last_name
                    }
                    onCountChange={setAppointmentsCount}
                  />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <CustomerHistoryTab
                    customerId={customer.id}
                    customerName={`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.name || 'Customer'}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        {/* Edit and Delete Dialogs */}
        <EditCustomerDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          customer={customer}
          onCustomerUpdated={refresh}
        />

        <DeleteCustomerDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          customer={customer}
          onCustomerDeleted={() => navigate("/clients")}
        />

        {customer && (
          <EditCustomerDialog
            isOpen={isConvertDialogOpen}
            onClose={() => setIsConvertDialogOpen(false)}
            customer={customer}
            forceClientValidation={true}
            onCustomerUpdated={handleConversionSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;
