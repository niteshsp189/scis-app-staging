
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";

interface EditOfficeLocationDialogProps {
  location: any;
  open: boolean;
  onClose: () => void;
  onUpdateLocation: (location: any) => void;
}

export const EditOfficeLocationDialog = ({ location, open, onClose, onUpdateLocation }: EditOfficeLocationDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    managerName: "",
    isHeadquarters: false,
    active: true
  });

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || "",
        address: location.address || "",
        city: location.city || "",
        state: location.state || "",
        zipCode: location.zipCode || "",
        phone: location.phone || "",
        managerName: location.managerName || "",
        isHeadquarters: location.isHeadquarters || false,
        active: location.active !== undefined ? location.active : true
      });
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.city) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    onUpdateLocation({
      ...location,
      ...formData
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[600px]"
        onOpenAutoFocus={(e) => {
          // Prevent auto-focus on first input when dialog opens
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Office Location</DialogTitle>
          <DialogDescription>
            Update office location information and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter location name"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter full address"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Enter city"
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="State"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                placeholder="ZIP"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="managerName">Location Manager</Label>
              <Input
                id="managerName"
                value={formData.managerName}
                onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                placeholder="Manager name"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isHeadquarters"
              checked={formData.isHeadquarters}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isHeadquarters: checked }))}
            />
            <Label htmlFor="isHeadquarters">This is the headquarters/main office</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
            <Label htmlFor="active">Active Location</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Location</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
