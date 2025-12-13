
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FamilyMember } from "@/types/customer";
import { PersonalInfoSection } from "./form-sections/PersonalInfoSection";
import { ContactInfoSection } from "./form-sections/ContactInfoSection";
import { AddressInfoSection } from "./form-sections/AddressInfoSection";
import { AdditionalInfoSection } from "./form-sections/AdditionalInfoSection";

interface FamilyMemberFormProps {
  member?: FamilyMember | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<FamilyMember, 'id'>) => void;
  onReset: () => void;
}

export const FamilyMemberForm = ({ 
  member, 
  isOpen, 
  onOpenChange, 
  onSubmit,
  onReset
}: FamilyMemberFormProps) => {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    name: "",
    gender: "" as "Male" | "Female" | "Other" | "",
    dateOfBirth: "",
    ssn: "",
    maritalStatus: "" as "Single" | "Married" | "Divorced" | "Widowed" | "",
    height: "",
    weight: "",
    smoker: "" as "Yes" | "No" | "",
    email: "",
    homePhone: "",
    cellPhone: "",
    workPhone: "",
    fax: "",
    phone: "",
    address: "",
    apartment: "",
    apartmentType: "" as "Apt" | "Unit" | "Suite" | "",
    city: "",
    state: "",
    zipCode: "",
    differentMailingAddress: false,
    mailingAddress: "",
    mailingApartment: "",
    mailingApartmentType: "" as "Apt" | "Unit" | "Suite" | "",
    mailingCity: "",
    mailingState: "",
    mailingZipCode: "",
    mailingCountry: "",
    relationship: "",
    referral: "",
    policies: [] as string[],
    notes: "",
    status: "Active",
    country: ""
  });

  useEffect(() => {
    if (member) {
      // Editing existing member - load their data
      setFormData({
        firstName: member.firstName || "",
        middleName: member.middleName || "",
        lastName: member.lastName || "",
        name: member.name || "",
        gender: member.gender || "",
        dateOfBirth: member.dateOfBirth || "",
        ssn: member.ssn || "",
        maritalStatus: member.maritalStatus || "",
        height: member.height || "",
        weight: member.weight || "",
        smoker: member.smoker || "",
        email: member.email || "",
        homePhone: member.homePhone || "",
        cellPhone: member.cellPhone || "",
        workPhone: member.workPhone || "",
        fax: member.fax || "",
        phone: member.phone || "",
        address: member.address || "",
        apartment: member.apartment || "",
        apartmentType: member.apartmentType || "",
        city: member.city || "",
        state: member.state || "",
        zipCode: member.zipCode || "",
        differentMailingAddress: member.differentMailingAddress || false,
        mailingAddress: member.mailingAddress || "",
        mailingApartment: member.mailingApartment || "",
        mailingApartmentType: member.mailingApartmentType || "",
        mailingCity: member.mailingCity || "",
        mailingState: member.mailingState || "",
        mailingZipCode: member.mailingZipCode || "",
        mailingCountry: member.mailingCountry || "",
        relationship: member.relationship || "",
        referral: member.referral || "",
        policies: member.policies || [],
        notes: member.notes || "",
        status: member.status || "Active",
        country: member.country || ""
      });
    } else {
      // Adding new member - reset to empty form
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        name: "",
        gender: "",
        dateOfBirth: "",
        ssn: "",
        maritalStatus: "",
        height: "",
        weight: "",
        smoker: "", // Ensure empty string for new dependents
        email: "",
        homePhone: "",
        cellPhone: "",
        workPhone: "",
        fax: "",
        phone: "",
        address: "",
        apartment: "",
        apartmentType: "",
        city: "",
        state: "",
        zipCode: "",
        differentMailingAddress: false,
        mailingAddress: "",
        mailingApartment: "",
        mailingApartmentType: "",
        mailingCity: "",
        mailingState: "",
        mailingZipCode: "",
        mailingCountry: "",
        relationship: "", // Ensure empty string for new dependents
        referral: "",
        policies: [],
        notes: "",
        status: "Active",
        country: ""
      });
    }
  }, [member]);

  const handleUpdate = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.relationship) {
      return;
    }
    
    const fullName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim();
    
    onSubmit({
      ...formData,
      name: fullName,
      phone: formData.phone || formData.cellPhone || formData.homePhone || ""
    });
  };

  const handleClose = () => {
    onReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          // Prevent auto-focus on first input when dialog opens
          e.preventDefault();
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {member ? "Edit Dependent" : "Add Dependent"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <PersonalInfoSection formData={formData} onUpdate={handleUpdate} />
          <Separator />
          <ContactInfoSection formData={formData} onUpdate={handleUpdate} />
          <Separator />
          <AddressInfoSection formData={formData} onUpdate={handleUpdate} />
          <Separator />
          <AdditionalInfoSection formData={formData} onUpdate={handleUpdate} />

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              {member ? "Update Member" : "Add Member"}
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
