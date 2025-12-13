
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SALES_AGENTS } from "@/constants/salesAgents";
import { getAgentName } from "@/utils/leadAssignment";

interface ReassignLeadDialogProps {
  leadId: number;
  leadName: string;
  currentAgentId: string;
  onReassign: (leadId: number, newAgentId: string) => void;
}

export function ReassignLeadDialog({ leadId, leadName, currentAgentId, onReassign }: ReassignLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(currentAgentId);

  const handleReassign = () => {
    if (selectedAgent === currentAgentId) {
      toast({
        title: "No change made",
        description: "Lead is already assigned to this agent.",
      });
      return;
    }

    onReassign(leadId, selectedAgent);
    setOpen(false);
    
    toast({
      title: "Lead reassigned",
      description: `${leadName} has been reassigned to ${getAgentName(selectedAgent)}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCheck className="h-4 w-4 mr-1" />
          Reassign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Reassign Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Reassigning: <strong>{leadName}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Currently assigned to: <strong>{getAgentName(currentAgentId)}</strong>
            </p>
          </div>
          
          <div>
            <Label htmlFor="newAgent">Assign to:</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SALES_AGENTS.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} {agent.id === currentAgentId ? "(Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReassign}>
              Reassign Lead
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
