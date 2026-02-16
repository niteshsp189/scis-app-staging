import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PhoneIncoming,
  PhoneOutgoing,
  Search,
  Edit,
  Eye,
  Trash2,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogCallDialog } from "@/components/dialogs/LogCallDialog";
import { EditActivityDialog } from "@/components/dialogs/EditActivityDialog";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { AnswerCallDialog } from "@/components/dialogs/AnswerCallDialog";
import { CallDetailsDialog } from "@/components/dialogs/CallDetailsDialog";
import { DateInput } from "@/components/ui/date-input";
import {
  customerActivitiesService,
  CustomerActivity,
} from "@/services/customerActivitiesService";
import { toast } from "@/components/ui/use-toast";
import { useEventListener } from "@/hooks/useEventListener";

interface CustomerCallsTabProps {
  customerId: number;
  customerName: string;
}

export const CustomerCallsTab = ({
  customerId,
  customerName,
}: CustomerCallsTabProps) => {
  const [searchParams] = useSearchParams();
  const [calls, setCalls] = useState<CustomerActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [silentRefresh, setSilentRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [editingCall, setEditingCall] = useState<CustomerActivity | null>(null);
  const [deletingCall, setDeletingCall] = useState<CustomerActivity | null>(null);
  
  // Get the callsTab parameter from URL, default to 'incoming'
  const callsTabFromUrl = searchParams.get('callsTab') || 'incoming';
  const [activeCallsTab, setActiveCallsTab] = useState<string>(callsTabFromUrl);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Update active tab when URL parameter changes
  useEffect(() => {
    const urlCallsTab = searchParams.get('callsTab');
    if (urlCallsTab && (urlCallsTab === 'incoming' || urlCallsTab === 'outgoing')) {
      setActiveCallsTab(urlCallsTab);
    }
  }, [searchParams]);

  const loadCalls = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setSilentRefresh(true);
      }
      setError(null);

      const filters: any = {
        page: currentPage,
        per_page: 20,
        // Remove activity_type filter since we're filtering client-side
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (startDate) {
        filters.start_date = startDate;
      }

      if (endDate) {
        filters.end_date = endDate;
      }

      const response = await customerActivitiesService.getCustomerActivities(
        customerId,
        filters,
      );

      if (response.success) {
        // Filter to only include call activities
        const callActivities = response.data.filter(
          (activity: CustomerActivity) =>
            activity.activity_type === "Incoming Call" ||
            activity.activity_type === "Outgoing Call"
        );
        setCalls(callActivities);
        setTotalPages(response.pagination.last_page);
      } else {
        setError("Failed to load call logs");
      }
    } catch (err) {
      setError("An error occurred while loading call logs");
      console.error("Error loading calls:", err);
    } finally {
      setLoading(false);
      setSilentRefresh(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, [customerId, currentPage, startDate, endDate]);

  // Silent refresh for search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCalls(true); // Silent refresh for any search change
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // Remove the condition check

  // Manual refresh function
  const handleManualRefresh = () => {
    loadCalls(false); // Full refresh
  };

  // Handle call created events from other components
  const handleCallCreated = useCallback((data: any) => {
    // Only refresh if the call was created for this customer
    if (data?.customerId === customerId) {
      loadCalls();
    }
  }, [customerId, loadCalls]);

  // Listen for call created events
  useEventListener('callCreated', handleCallCreated);

  const handleLogCall = async (callData: any) => {
    try {
      const response = await customerActivitiesService.createActivity(
        customerId,
        callData,
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Call logged successfully",
        });
        // Immediately reload calls to show the new entry
        await loadCalls();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to log call",
        variant: "destructive",
      });
      console.error("Error creating call:", err);
    }
  };

  // Helper function to check if a call has an answer call
  const hasAnswerCall = (call: CustomerActivity): boolean => {
    return calls.some((c) => c.parent_activity_id === call.id);
  };

  // Helper function to get all answer calls for a given call
  const getAnswerCalls = (call: CustomerActivity): CustomerActivity[] => {
    return calls.filter((c) => c.parent_activity_id === call.id);
  };

  const handleUpdateCall = async (callId: number, callData: any) => {
    try {
      const response = await customerActivitiesService.updateActivity(
        customerId,
        callId,
        callData,
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Call updated successfully",
        });
        setEditingCall(null);
        loadCalls();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update call",
        variant: "destructive",
      });
      console.error("Error updating call:", err);
    }
  };

  const handleDeleteCall = async (call: CustomerActivity) => {
    try {
      await customerActivitiesService.deleteActivity(customerId, call.id);
      toast({
        title: "Success",
        description: "Call deleted successfully",
      });
      setDeletingCall(null);
      loadCalls();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete call",
        variant: "destructive",
      });
      console.error("Error deleting call:", err);
    }
  };

  const incomingCalls = calls.filter(
    (call) => call.activity_type === "Incoming Call"
  );
  const outgoingCalls = calls.filter(
    (call) => call.activity_type === "Outgoing Call"
  );

  const renderCallCard = (call: CustomerActivity) => {
    // Don't show answer badge for answer calls themselves
    const isAnswerCall = call.parent_activity_id !== null && call.parent_activity_id !== undefined;
    const hasAnswer = !isAnswerCall && hasAnswerCall(call);
    const answerCalls = !isAnswerCall ? getAnswerCalls(call) : [];

    return (
      <Card key={call.id} className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {call.activity_type === "Incoming Call" ? (
                <PhoneIncoming className="h-4 w-4 text-green-600" />
              ) : (
                <PhoneOutgoing className="h-4 w-4 text-blue-600" />
              )}
              <Badge
                variant={
                  call.activity_type === "Incoming Call" ? "default" : "secondary"
                }
                className="text-xs"
              >
                {call.activity_type}
              </Badge>
              <span className="text-sm text-gray-600">
                {customerActivitiesService.formatActivityDateTime(
                  call.activity_date,
                  call.activity_time,
                )}
              </span>
              {/* Answer Status Badge - only show for non-answer calls */}
              {!isAnswerCall && (
                <Badge
                  variant={hasAnswer ? "default" : "outline"}
                  className={`text-xs ${hasAnswer ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                >
                  Answer: {hasAnswer ? `${answerCalls.length}` : "No"}
                </Badge>
              )}
              {/* Show if this is an answer call */}
              {isAnswerCall && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Answer Call
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* View Details Button */}
              <CallDetailsDialog
                call={call}
                customerName={customerName}
                customerId={customerId}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                }
              />

              {/* Answer Call Button - only show for non-answer calls */}
              {!isAnswerCall && (
                <AnswerCallDialog
                  originalCall={call}
                  customerId={customerId}
                  customerName={customerName}
                  onAnswerCall={handleLogCall}
                  trigger={
                    <Button variant="outline" size="sm">
                      <PhoneOutgoing className="h-4 w-4 mr-1" />
                      Answer
                    </Button>
                  }
                />
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingCall(call)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {/* Answer Call option in dropdown - only show for non-answer calls */}
                  {!isAnswerCall && (
                    <AnswerCallDialog
                      originalCall={call}
                      customerId={customerId}
                      customerName={customerName}
                      onAnswerCall={handleLogCall}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <PhoneOutgoing className="h-4 w-4 mr-2" />
                          Answer Call
                        </DropdownMenuItem>
                      }
                    />
                  )}
                  <DropdownMenuItem
                    onClick={() => setDeletingCall(call)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-700">{call.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <div>
                Performed by:{" "}
                {customerActivitiesService.getFullName(call.performer) || "Unknown"}
              </div>
              {(call.calledForUser || call.called_for_user) && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Called For:</span>
                  <span>
                    {(call.calledForUser || call.called_for_user)!.first_name} {(call.calledForUser || call.called_for_user)!.last_name}
                    {(call.calledForUser || call.called_for_user)!.email && (
                      <span className="text-gray-400 ml-1">
                        ({(call.calledForUser || call.called_for_user)!.email})
                      </span>
                    )}
                  </span>
                </div>
              )}
              {((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user) && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Forwarded To:</span>
                  <span>
                    {(((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user)!.first_name)} {(((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user)!.last_name)}
                    {(((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user)!.email) && (
                      <span className="text-gray-400 ml-1">
                        ({((call as any).forwarded_to_user || call.forwardedToUser || call.call_forwarded_to_user)!.email})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
            {/* Answer calls info is now only shown in the popup to avoid clutter in list view */}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCallsList = (callsList: CustomerActivity[], emptyMessage: string) => (
    <div className="space-y-4">
      {callsList.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        callsList.map(renderCallCard)
      )}
    </div>
  );

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Call Logs</h3>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" onClick={loadCalls} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Call Logs</h3>
        <LogCallDialog
          customerId={customerId}
          customerName={customerName}
          onLogCall={handleLogCall}
        />
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Search */}
            <div className="relative md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search call logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                {silentRefresh && (
                  <div className="absolute right-2 top-2.5">
                    <div className="animate-spin h-4 w-4 border-b-2 border-gray-400 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
            
            {/* From Date */}
            <div>
              <DateInput
                value={startDate}
                onChange={(value) => setStartDate(value || "")}
                placeholder="From date"
                className="w-full"
              />
            </div>
            
            {/* To Date */}
            <div>
              <DateInput
                value={endDate}
                onChange={(value) => setEndDate(value || "")}
                placeholder="To date"
                className="w-full"
                minDate={startDate ? new Date(startDate) : undefined}
              />
            </div>
          </div>
          
          {/* Action Buttons - Right Aligned */}
          <div className="flex justify-end items-center gap-2 mt-3">
            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={loading || silentRefresh}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${(loading || silentRefresh) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            {/* Clear Filters */}
            {(searchTerm || startDate || endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStartDate("");
                  setEndDate("");
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading call logs...</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeCallsTab} onValueChange={setActiveCallsTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="incoming"
                className="flex items-center gap-2"
              >
                <PhoneIncoming className="h-4 w-4" />
                Incoming Calls ({incomingCalls.length})
              </TabsTrigger>
              <TabsTrigger
                value="outgoing"
                className="flex items-center gap-2"
              >
                <PhoneOutgoing className="h-4 w-4" />
                Outgoing Calls ({outgoingCalls.length})
              </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="mt-4">
            {renderCallsList(incomingCalls, "No incoming calls yet")}
          </TabsContent>

          <TabsContent value="outgoing" className="mt-4">
            {renderCallsList(outgoingCalls, "No outgoing calls yet")}
          </TabsContent>
        </Tabs>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Call Dialog */}
      {editingCall && (
        <EditActivityDialog
          activity={editingCall}
          customerId={customerId}
          customerName={customerName}
          open={!!editingCall}
          onOpenChange={(open) => !open && setEditingCall(null)}
          onUpdateActivity={handleUpdateCall}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingCall && (
        <ConfirmationDialog
          open={!!deletingCall}
          onOpenChange={(open) => !open && setDeletingCall(null)}
          onConfirm={() => handleDeleteCall(deletingCall)}
          title="Delete Call Log"
          description={`Are you sure you want to delete this ${deletingCall.activity_type.toLowerCase()}? This action cannot be undone.`}
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
          variant="destructive"
        />
      )}
    </div>
  );
};
