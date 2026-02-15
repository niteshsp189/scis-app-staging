
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserCheck, User, Plus, Edit, Calendar } from "lucide-react";
import { Agent, PolicyAgent, AgentAssignment } from "@/types/agent";
import { toast } from "@/components/ui/use-toast";
import { DateInput } from "@/components/ui/date-input";
import { agentService } from "@/services/agentService";

interface PolicyAgentManagerProps {
  policyId: number;
  policyNumber: string;
  agentAssignment: AgentAssignment;
  onUpdateAgents: (assignment: AgentAssignment) => void;
}

export const PolicyAgentManager = ({ policyId, policyNumber, agentAssignment, onUpdateAgents }: PolicyAgentManagerProps) => {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<"AOR" | "Writing Agent">("AOR");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [aorLetterDate, setAorLetterDate] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [notes, setNotes] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  // Fetch agents on component mount
  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoadingAgents(true);
      try {
        const agentData = await agentService.getAgents();
        setAgents(agentData);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        toast({
          title: "Error",
          description: "Failed to load agents. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAgents(false);
      }
    };

    fetchAgents();
  }, []);

  const handleAssignAgent = () => {
    if (!selectedAgentId) {
      toast({
        title: "Error",
        description: "Please select an agent.",
        variant: "destructive",
      });
      return;
    }

    if (assignmentType === "AOR" && !aorLetterDate) {
      toast({
        title: "Error",
        description: "AOR Letter Date is required for Agent of Record assignment.",
        variant: "destructive",
      });
      return;
    }

    const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
    if (!selectedAgent) {
      return;
    }

    const newAssignment: PolicyAgent = {
      id: `${policyId}-${assignmentType}-${Date.now()}`,
      policyId,
      agentId: selectedAgentId,
      agentName: selectedAgent.name,
      agentType: assignmentType,
      assignedDate: new Date().toISOString().split('T')[0],
      aorLetterDate: assignmentType === "AOR" ? aorLetterDate : undefined,
      commissionRate: parseFloat(commissionRate) || 0,
      notes,
      isActive: true
    };

    const updatedAssignment = { ...agentAssignment };
    
    if (assignmentType === "AOR") {
      // Only one AOR allowed per policy
      updatedAssignment.aor = newAssignment;
    } else {
      updatedAssignment.writingAgent = newAssignment;
    }

    onUpdateAgents(updatedAssignment);
    
    // Reset form
    setSelectedAgentId("");
    setAorLetterDate("");
    setCommissionRate("");
    setNotes("");
    setIsAssignDialogOpen(false);

    toast({
      title: "Success",
      description: `${assignmentType} assigned successfully.`,
    });
  };

  const handleRemoveAgent = (type: "AOR" | "Writing Agent") => {
    const updatedAssignment = { ...agentAssignment };
    
    if (type === "AOR") {
      updatedAssignment.aor = undefined;
    } else {
      updatedAssignment.writingAgent = undefined;
    }

    onUpdateAgents(updatedAssignment);
    
    toast({
      title: "Agent Removed",
      description: `${type} has been removed from this policy.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Policy Agents</h3>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm"
              onClick={() => setIsAssignDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Agent to Policy</DialogTitle>
              <DialogDescription>
                Assign an Agent of Record or Writing Agent to policy {policyNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="agentType">Agent Type</Label>
                <Select value={assignmentType} onValueChange={(value: "AOR" | "Writing Agent") => setAssignmentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AOR">Agent of Record (AOR)</SelectItem>
                    <SelectItem value="Writing Agent">Writing Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="agent">Select Agent</Label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId} disabled={isLoadingAgents}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingAgents ? "Loading agents..." : "Choose an agent"} />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} - {agent.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {assignmentType === "AOR" && (
                <div>
                  <Label htmlFor="aorLetterDate">AOR Letter Date *</Label>
                  <DateInput
                    id="aorLetterDate"
                    value={aorLetterDate}
                    onChange={(value) => setAorLetterDate(value)}
                    placeholder="Select AOR letter date"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.01"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAssignAgent();
                  }}
                >
                  Assign Agent
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agent of Record Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Agent of Record (AOR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agentAssignment.aor ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{agentAssignment.aor.agentName}</h4>
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Assigned: {new Date(agentAssignment.aor.assignedDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
                  </div>
                  
                  {agentAssignment.aor.aorLetterDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>AOR Letter: {new Date(agentAssignment.aor.aorLetterDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
                    </div>
                  )}
                  
                  {agentAssignment.aor.commissionRate > 0 && (
                    <div>
                      <span className="text-gray-500">Commission: </span>
                      <span className="font-medium">{agentAssignment.aor.commissionRate}%</span>
                    </div>
                  )}
                  
                  {agentAssignment.aor.notes && (
                    <div>
                      <span className="text-gray-500">Notes: </span>
                      <span>{agentAssignment.aor.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleRemoveAgent("AOR")}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <UserCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No Agent of Record assigned</p>
                <p className="text-xs mt-1">Click "Assign Agent" to add an AOR</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Writing Agent Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-green-600" />
              Writing Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agentAssignment.writingAgent ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{agentAssignment.writingAgent.agentName}</h4>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Assigned: {new Date(agentAssignment.writingAgent.assignedDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</span>
                  </div>
                  
                  {agentAssignment.writingAgent.commissionRate > 0 && (
                    <div>
                      <span className="text-gray-500">Commission: </span>
                      <span className="font-medium">{agentAssignment.writingAgent.commissionRate}%</span>
                    </div>
                  )}
                  
                  {agentAssignment.writingAgent.notes && (
                    <div>
                      <span className="text-gray-500">Notes: </span>
                      <span>{agentAssignment.writingAgent.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleRemoveAgent("Writing Agent")}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No Writing Agent assigned</p>
                <p className="text-xs mt-1">Click "Assign Agent" to add a Writing Agent</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
