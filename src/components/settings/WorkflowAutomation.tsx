
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit, Workflow } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function WorkflowAutomation() {
  const [workflows, setWorkflows] = useState([
    { 
      id: 1, 
      name: "Auto-assign New Leads", 
      description: "Automatically assign leads to available sales agents based on territory",
      active: true,
      criteria: "Territory-based"
    },
    { 
      id: 2, 
      name: "Follow-up Reminders", 
      description: "Send reminders for follow-ups after 3 days of no contact",
      active: true,
      criteria: "Time-based"
    }
  ]);

  const handleToggleWorkflow = (id: number) => {
    setWorkflows(workflows.map(w => 
      w.id === id ? { ...w, active: !w.active } : w
    ));
    toast({
      title: "Workflow updated",
      description: "Workflow status has been changed.",
    });
  };

  const handleCreateWorkflow = () => {
    toast({
      title: "Create Workflow",
      description: "Workflow creation form would open here.",
    });
  };

  const handleEditWorkflow = (id: number) => {
    toast({
      title: "Edit Workflow",
      description: "Workflow editing form would open here.",
    });
  };

  const handleDeleteWorkflow = (id: number) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    toast({
      title: "Workflow Deleted",
      description: "Workflow has been removed.",
    });
  };

  const handleSaveWorkflowSettings = () => {
    toast({
      title: "Workflow Settings Saved",
      description: "Lead auto-assignment settings have been updated.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Workflow Automation</CardTitle>
            <CardDescription>
              Automate lead assignment and follow-up processes
            </CardDescription>
          </div>
          <Button onClick={handleCreateWorkflow}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold">{workflow.name}</h3>
                  <Badge variant={workflow.active ? "default" : "secondary"}>
                    {workflow.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1">{workflow.description}</p>
                <p className="text-xs text-gray-500">Criteria: {workflow.criteria}</p>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={workflow.active}
                  onCheckedChange={() => handleToggleWorkflow(workflow.id)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditWorkflow(workflow.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteWorkflow(workflow.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Workflow className="h-5 w-5 text-blue-600" />
              Lead Auto-Assignment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="assignmentMethod">Assignment Method</Label>
              <Select defaultValue="round-robin">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round-robin">Round Robin</SelectItem>
                  <SelectItem value="territory">Territory-based</SelectItem>
                  <SelectItem value="workload">Workload-based</SelectItem>
                  <SelectItem value="custom">Custom Rules</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxLeads">Max Leads per Agent</Label>
              <Input id="maxLeads" type="number" defaultValue="50" />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoAssign">Enable Auto-Assignment</Label>
              <Switch id="autoAssign" defaultChecked />
            </div>

            <Button className="w-full" onClick={handleSaveWorkflowSettings}>
              Save Workflow Settings
            </Button>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
