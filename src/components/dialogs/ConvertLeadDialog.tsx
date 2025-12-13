
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Lead, ConvertLeadToDealData } from "@/types/conversion";

interface ConvertLeadDialogProps {
  lead: Lead;
  onConvert: (leadId: number, dealData: ConvertLeadToDealData) => void;
}

export function ConvertLeadDialog({ lead, onConvert }: ConvertLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    value: 0,
    probability: 75,
    closeDate: "",
    policyType: lead.policyType || "Auto Insurance",
    agent: "Current User"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.value || !formData.closeDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    onConvert(lead.id, formData);
    setOpen(false);
    
    toast({
      title: "Lead Converted",
      description: `${lead.name} has been converted to a deal successfully.`,
    });
  };

  const policyTypes = [
    "Auto Insurance",
    "Home Insurance", 
    "Life Insurance",
    "Business Insurance",
    "Health Insurance"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="flex-1">
          <Target className="h-4 w-4 mr-1" />
          Convert to Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Convert Lead to Deal</DialogTitle>
        </DialogHeader>
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium">{lead.name}</p>
          <p className="text-xs text-gray-600">{lead.company} • {lead.email}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="value">Deal Value ($) *</Label>
            <Input
              id="value"
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
              required
              min="0"
              step="100"
            />
          </div>
          
          <div>
            <Label htmlFor="probability">Probability (%)</Label>
            <Input
              id="probability"
              type="number"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
              min="0"
              max="100"
            />
          </div>
          
          <div>
            <Label htmlFor="closeDate">Expected Close Date *</Label>
            <Input
              id="closeDate"
              type="date"
              value={formData.closeDate}
              onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="policyType">Policy Type</Label>
            <Select value={formData.policyType} onValueChange={(value) => setFormData({ ...formData, policyType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {policyTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="agent">Assigned Agent</Label>
            <Input
              id="agent"
              value={formData.agent}
              onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Convert to Deal</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
