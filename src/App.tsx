import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { MobileLayout } from "@/components/MobileLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { PreferenceProvider } from "@/contexts/PreferenceContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserProfile from "@/components/UserProfile";
import AuthTest from "./pages/AuthTest";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Subscription from "./pages/Subscription";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import ProspectCustomers from "./pages/ProspectCustomers";
import ClientCustomers from "./pages/ClientCustomers";
import FormerCustomers from "./pages/FormerCustomers";
import DeceasedCustomers from "./pages/DeceasedCustomers";
import CustomerDetails from "./pages/CustomerDetails";
import Policies from "./pages/Policies";
import PolicyDetailsPage from "./pages/PolicyDetailsPage";
import Activities from "./pages/Activities";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Appointments from "./pages/Appointments";
import AppointmentDetails from "./pages/AppointmentDetails";
import NotFound from "./pages/NotFound";
import Reminders from "./pages/Reminders";
import Lookup from "./pages/Lookup";
import Architecture from "./pages/Architecture";
import BusinessRequirementsDocument from "./pages/BusinessRequirementsDocument";
import CalendarCallback from "./pages/CalendarCallback";
import RenewalDashboard from "./pages/RenewalDashboard";
import PermissionDemo from "./pages/PermissionDemo";
import CurrencyTest from "./CurrencyTest";
import CurrencyDebug from "./CurrencyDebug";
import CurrencySystemTest from "./CurrencySystemTest";
import AuditDashboard from "./pages/AuditDashboard";
import GlobalBook from "./pages/GlobalBook";
import GlobalCalls from "./pages/GlobalCallsNew";
import ConvertDependants from "./pages/ConvertDependants";
import {
  CustomerPrintPage,
  CustomerCallsPrintPage,
  CustomerPoliciesPrintPage,
  CustomerNotesPrintPage,
  CustomerHistoryPrintPage,
  AppointmentsPrintPage,
  AppointmentCalendarPrintPage,
  AppointmentDetailPrintPage,
  RemindersPrintPage,
  ReminderDetailPrintPage,
  CallsPrintPage,
  CallDetailPrintPage,
  LookupPrintPage,
  PolicyPrintPage,
  ReportPrintPage,
} from "./pages/print";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <PreferenceProvider>
            <PermissionProvider>
              <WebSocketProvider autoConnect={false}>
              <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<SignIn />} />
                {/* <Route
                  path="/signup"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <SignUp />
                    </ProtectedRoute>
                  }
                /> */}
                <Route
                  path="/signin"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <SignIn />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <SignIn />
                    </ProtectedRoute>
                  }
                />
                <Route path="/subscription" element={<Subscription />} />

                {/* Document routes */}
                <Route path="/architecture" element={<Architecture />} />
                <Route
                  path="/business-requirements"
                  element={<BusinessRequirementsDocument />}
                />

                {/* Protected routes with mobile-responsive layout */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <Dashboard />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <UserProfile />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                {/* Old prospects route - disabled after unification with customers */}
                {/* <Route
                  path="/prospects"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_prospects']}
                    >
                      <MobileLayout>
                        <Prospects />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                /> */}
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_customers']}
                    >
                      <MobileLayout>
                        <Customers />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                {/* Primary routes matching old system URL pattern */}
                <Route
                  path="/prospects"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_customers']}
                    >
                      <MobileLayout>
                        <ProspectCustomers />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clients"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_customers']}
                    >
                      <MobileLayout>
                        <ClientCustomers />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/formers"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_customers']}
                    >
                      <MobileLayout>
                        <FormerCustomers />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/deceaseds"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_customers']}
                    >
                      <MobileLayout>
                        <DeceasedCustomers />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                {/* Customer detail view - old system pattern: /clients/view/:id */}
                <Route
                  path="/clients/view/:id"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_customers']}
                    >
                      <MobileLayout>
                        <CustomerDetails />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prospects/view/:id"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_customers']}
                    >
                      <MobileLayout>
                        <CustomerDetails />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/formers/view/:id"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_customers']}
                    >
                      <MobileLayout>
                        <CustomerDetails />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/deceaseds/view/:id"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_customers']}
                    >
                      <MobileLayout>
                        <CustomerDetails />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                {/* Legacy redirects: /customers/* → new paths */}
                <Route path="/customers/clients" element={<Navigate to="/clients" replace />} />
                <Route path="/customers/prospects" element={<Navigate to="/prospects" replace />} />
                <Route path="/customers/former" element={<Navigate to="/formers" replace />} />
                <Route path="/customers/deceased" element={<Navigate to="/deceaseds" replace />} />
                <Route
                  path="/customers/:id"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_customers']}
                    >
                      <MobileLayout>
                        <CustomerDetails />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/policies"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_policies']}
                    >
                      <MobileLayout>
                        <Policies />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/policies/:id"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_policies']}
                    >
                      <MobileLayout>
                        <PolicyDetailsPage />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/renewal-dashboard"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_policies']}
                    >
                      <MobileLayout>
                        <RenewalDashboard />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/activities"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <Activities />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports/*"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_reports']}
                    >
                      <MobileLayout>
                        <Reports />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute
                      requiredPermissions={[
                        'admin_settings',
                        // User Management permissions (these also need Settings access)
                        'manage_users',
                        'view_users',
                        'manage_roles',
                        // Organization & Structure
                        'view_company_settings',
                        'manage_company_settings',
                        'view_office_locations',
                        'manage_office_locations',
                        'view_team_management',
                        'manage_team_management',
                        'view_roles_permissions',
                        'manage_roles_permissions',
                        // Insurance Management
                        'view_insurance_plan_types',
                        'manage_insurance_plan_types',
                        'view_insurance_companies_settings',
                        'manage_insurance_companies_settings',
                        'view_insurance_plans_settings',
                        'manage_insurance_plans_settings',
                        // Time & Schedule
                        'view_holidays',
                        'manage_holidays',
                        'view_reminder_settings',
                        'manage_reminder_settings',
                        // System & Security
                        'view_currency_settings',
                        'manage_currency_settings',
                        'view_security_settings',
                        'manage_security_settings',
                      ]}
                      requireAll={false}
                    >
                      <MobileLayout>
                        <Settings />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audit"
                  element={
                    <ProtectedRoute
                      requiredPermissions={['view_audit_logs']}
                    >
                      <MobileLayout>
                        <AuditDashboard />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings-test"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <div style={{ padding: "20px" }}>
                          <h1>Settings Test Route</h1>
                          <p>
                            This is a test route to verify routing is working
                          </p>
                          <button
                            onClick={() => (window.location.href = "/settings")}
                          >
                            Go to Settings
                          </button>
                        </div>
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <Notifications />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <Appointments />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments/:id"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <AppointmentDetails />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reminders"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <Reminders />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calls"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <GlobalCalls />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lookup"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <Lookup />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/global-book"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <GlobalBook />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/auth-test" element={<AuthTest />} />
                <Route
                  path="/permission-demo"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <PermissionDemo />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/currency-test" element={<CurrencyTest />} />
                <Route path="/currency-debug" element={<CurrencyDebug />} />
                <Route path="/currency-system-test" element={<CurrencySystemTest />} />

                {/* Print routes - open in new tabs, no layout */}
                <Route
                  path="/customers/:id/print"
                  element={
                    <ProtectedRoute>
                      <CustomerPrintPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers/:id/print/calls"
                  element={
                    <ProtectedRoute>
                      <CustomerCallsPrintPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers/:id/print/policies"
                  element={
                    <ProtectedRoute>
                      <CustomerPoliciesPrintPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers/:id/print/notes"
                  element={
                    <ProtectedRoute>
                      <CustomerNotesPrintPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers/:id/print/history"
                  element={
                    <ProtectedRoute>
                      <CustomerHistoryPrintPage />
                    </ProtectedRoute>
                  }
                />

                {/* Policy Print routes - open in new tabs, no layout */}
                <Route
                  path="/policies/:id/print"
                  element={
                    <ProtectedRoute>
                      <PolicyPrintPage />
                    </ProtectedRoute>
                  }
                />

                {/* Appointment Print routes - open in new tabs, no layout */}
                <Route
                  path="/appointments/print"
                  element={
                    <ProtectedRoute>
                      <AppointmentsPrintPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments/print/calendar"
                  element={
                    <ProtectedRoute>
                      <AppointmentCalendarPrintPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments/:id/print"
                  element={
                    <ProtectedRoute>
                      <AppointmentDetailPrintPage />
                    </ProtectedRoute>
                  }
                />

                {/* Reminder Print routes - open in new tabs, no layout */}
                <Route
                  path="/reminders/print"
                  element={
                    <ProtectedRoute>
                      <RemindersPrintPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reminders/:id/print"
                  element={
                    <ProtectedRoute>
                      <ReminderDetailPrintPage />
                    </ProtectedRoute>
                  }
                />

                {/* Call Print routes - open in new tabs, no layout */}
                <Route
                  path="/calls/print"
                  element={
                    <ProtectedRoute>
                      <CallsPrintPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers/:customerId/calls/:id/print"
                  element={
                    <ProtectedRoute>
                      <CallDetailPrintPage />
                    </ProtectedRoute>
                  }
                />

                {/* Lookup Print route - open in new tab, no layout */}
                <Route
                  path="/lookup/print"
                  element={
                    <ProtectedRoute>
                      <LookupPrintPage />
                    </ProtectedRoute>
                  }
                />

                {/* Report Print route - open in new tab, no layout */}
                <Route
                  path="/reports/print"
                  element={
                    <ProtectedRoute>
                      <ReportPrintPage />
                    </ProtectedRoute>
                  }
                />

                {/* Calendar OAuth callback routes */}
                <Route
                  path="/calendar/callback/google"
                  element={<CalendarCallback />}
                />
                <Route
                  path="/calendar/callback/microsoft"
                  element={<CalendarCallback />}
                />

                {/* Admin: Convert Dependants to Customers */}
                <Route
                  path="/admin/convert-dependants"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <ConvertDependants />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
              </WebSocketProvider>
            </PermissionProvider>
          </PreferenceProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
