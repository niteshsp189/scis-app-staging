import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Save, X, Eye, EyeOff } from "lucide-react";
import { CustomerData } from "@/types/customer";
import { CustomerCredential, Medication, customerCredentialsService } from "@/services/customerCredentialsService";
import { toast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";

interface CustomerCredentialsTabProps {
  customerData: CustomerData;
}

interface MedicationFormData {
  name: string;
  dosage: string;
  frequency: string;
}

export const CustomerCredentialsTab = ({ customerData }: CustomerCredentialsTabProps) => {
  const [credentials, setCredentials] = useState<CustomerCredential>({
    customer_id: customerData.id,
    medicare_number: "",
    bank_account_type: "",
    routing_number: "",
    account_number: "",
    medicare_gov_username: "",
    medicare_gov_password: "",
    medications: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMedication, setEditingMedication] = useState<number | null>(null);
  const [newMedication, setNewMedication] = useState<MedicationFormData>({
    name: "",
    dosage: "",
    frequency: "",
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [medicationToDelete, setMedicationToDelete] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, [customerData.id]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const data = await customerCredentialsService.getCustomerCredentials(customerData.id);
      if (data) {
        setCredentials({
          customer_id: customerData.id,
          medicare_number: data.medicare_number || "",
          bank_account_type: data.bank_account_type || "",
          routing_number: data.routing_number || "",
          account_number: data.account_number || "",
          medicare_gov_username: data.medicare_gov_username || "",
          medicare_gov_password: data.medicare_gov_password || "",
          medications: data.medications || [],
        });
      }
    } catch (error) {
      console.error("Failed to load credentials:", error);
      toast({
        title: "Error",
        description: "Failed to load customer credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    try {
      setSaving(true);
      setValidationErrors({}); // Clear previous errors
      const data = await customerCredentialsService.updateCustomerCredentials(
        customerData.id,
        credentials
      );
      setCredentials({
        customer_id: customerData.id,
        medicare_number: data.medicare_number || "",
        bank_account_type: data.bank_account_type || "",
        routing_number: data.routing_number || "",
        account_number: data.account_number || "",
        medicare_gov_username: data.medicare_gov_username || "",
        medicare_gov_password: data.medicare_gov_password || "",
        medications: data.medications || [],
      });
      toast({
        title: "Success",
        description: "Credentials updated successfully",
      });
    } catch (error: any) {
      console.error("Failed to save credentials:", error);
      
      // Handle validation errors
      if (error.errors) {
        setValidationErrors(error.errors);
        const firstError = Object.values(error.errors)[0] as string[];
        toast({
          title: "Validation Error",
          description: firstError[0],
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save credentials",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CustomerCredential, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value || undefined,
    }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddMedication = () => {
    if (!newMedication.name.trim() || !newMedication.dosage.trim() || !newMedication.frequency.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all medication fields",
        variant: "destructive",
      });
      return;
    }

    const medications = credentials?.medications || [];
    const updatedMedications = [...medications, { ...newMedication }];

    setCredentials(prev => ({
      ...prev,
      medications: updatedMedications,
    }));

    setNewMedication({ name: "", dosage: "", frequency: "" });
  };

  const handleEditMedication = (index: number) => {
    const medication = credentials?.medications?.[index];
    if (medication) {
      setEditingMedication(index);
      setNewMedication({
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
      });
    }
  };

  const handleUpdateMedication = () => {
    if (editingMedication === null) return;

    const medications = credentials?.medications || [];
    const updatedMedications = [...medications];
    updatedMedications[editingMedication] = { ...newMedication };

    setCredentials(prev => ({
      ...prev,
      medications: updatedMedications,
    }));

    setEditingMedication(null);
    setNewMedication({ name: "", dosage: "", frequency: "" });
  };

  const handleCancelEdit = () => {
    setEditingMedication(null);
    setNewMedication({ name: "", dosage: "", frequency: "" });
  };

  const handleDeleteMedication = (index: number) => {
    setMedicationToDelete(index);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteMedication = () => {
    if (medicationToDelete === null) return;

    const medications = credentials?.medications || [];
    const updatedMedications = medications.filter((_, index) => index !== medicationToDelete);

    setCredentials(prev => ({
      ...prev,
      medications: updatedMedications,
    }));

    setDeleteConfirmOpen(false);
    setMedicationToDelete(null);
  };

  const getFieldError = (fieldName: string) => {
    return validationErrors[fieldName]?.[0] || "";
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const formatMedicareNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Format as xxxx-xxx-xxxx
    if (digits.length >= 4) {
      let formatted = digits.slice(0, 4);
      if (digits.length >= 7) {
        formatted += "-" + digits.slice(4, 7);
        if (digits.length >= 11) {
          formatted += "-" + digits.slice(7, 11);
        } else if (digits.length > 7) {
          formatted += "-" + digits.slice(7);
        }
      } else if (digits.length > 4) {
        formatted += "-" + digits.slice(4);
      }
      return formatted;
    }
    return digits;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customer Credentials</h2>
        <Button onClick={handleSaveCredentials} disabled={saving}>
          {saving ? "Saving..." : "Save Credentials"}
        </Button>
      </div>

      {/* Medicare Information */}
      <Card>
        <CardHeader>
          <CardTitle>Medicare Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medicare_number">Medicare Number</Label>
              <Input
                id="medicare_number"
                value={credentials?.medicare_number || ""}
                onChange={(e) => handleInputChange("medicare_number", formatMedicareNumber(e.target.value))}
                placeholder="xxxx-xxx-xxxx"
                maxLength={14}
                className={getFieldError("medicare_number") ? "border-red-500" : ""}
              />
              {getFieldError("medicare_number") && (
                <p className="text-sm text-red-500">{getFieldError("medicare_number")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicare_username">Medicare.gov Username</Label>
              <Input
                id="medicare_username"
                type="email"
                value={credentials?.medicare_gov_username || ""}
                onChange={(e) => handleInputChange("medicare_gov_username", e.target.value)}
                placeholder="username@example.com"
                className={getFieldError("medicare_gov_username") ? "border-red-500" : ""}
              />
              {getFieldError("medicare_gov_username") && (
                <p className="text-sm text-red-500">{getFieldError("medicare_gov_username")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicare_password">Medicare.gov Password</Label>
              <div className="relative">
                <Input
                  id="medicare_password"
                  type={showPassword ? "text" : "password"}
                  value={credentials?.medicare_gov_password || ""}
                  onChange={(e) => handleInputChange("medicare_gov_password", e.target.value)}
                  placeholder="Enter password"
                  className={getFieldError("medicare_gov_password") ? "border-red-500 pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
              {getFieldError("medicare_gov_password") && (
                <p className="text-sm text-red-500">{getFieldError("medicare_gov_password")}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banking Information */}
      <Card>
        <CardHeader>
          <CardTitle>Banking Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_account_type">Account Type</Label>
              <Select
                value={credentials?.bank_account_type || ""}
                onValueChange={(value) => handleInputChange("bank_account_type", value)}
              >
                <SelectTrigger className={getFieldError("bank_account_type") ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Checking">Checking</SelectItem>
                  <SelectItem value="Saving">Saving</SelectItem>
                </SelectContent>
              </Select>
              {getFieldError("bank_account_type") && (
                <p className="text-sm text-red-500">{getFieldError("bank_account_type")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="routing_number">Routing Number</Label>
              <Input
                id="routing_number"
                value={credentials?.routing_number || ""}
                onChange={(e) => handleInputChange("routing_number", e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="9 digits"
                maxLength={9}
                className={getFieldError("routing_number") ? "border-red-500" : ""}
              />
              {getFieldError("routing_number") && (
                <p className="text-sm text-red-500">{getFieldError("routing_number")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={credentials?.account_number || ""}
                onChange={(e) => handleInputChange("account_number", e.target.value.replace(/\D/g, "").slice(0, 17))}
                placeholder="Account number"
                maxLength={17}
                className={getFieldError("account_number") ? "border-red-500" : ""}
              />
              {getFieldError("account_number") && (
                <p className="text-sm text-red-500">{getFieldError("account_number")}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <CardTitle>Medications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add/Edit Medication Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
            <div className="space-y-2">
              <Label htmlFor="med_name">Name</Label>
              <Input
                id="med_name"
                value={newMedication.name}
                onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Medication name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med_dosage">Dosage</Label>
              <Input
                id="med_dosage"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 10mg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med_frequency">Frequency</Label>
              <Input
                id="med_frequency"
                value={newMedication.frequency}
                onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                placeholder="e.g., Twice daily"
              />
            </div>
            <div className="flex items-end gap-2">
              {editingMedication !== null ? (
                <>
                  <Button onClick={handleUpdateMedication} size="sm">
                    <Save className="h-4 w-4 mr-1" />
                    Update
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={handleAddMedication} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </div>
          {getFieldError("medications") && (
            <p className="text-sm text-red-500">{getFieldError("medications")}</p>
          )}

          {/* Medications Table */}
          {credentials?.medications && credentials.medications.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.medications.map((medication, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{medication.name}</TableCell>
                      <TableCell>{medication.dosage}</TableCell>
                      <TableCell>{medication.frequency}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMedication(index)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMedication(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {(!credentials?.medications || credentials.medications.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No medications added yet. Use the form above to add medications.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveCredentials} disabled={saving}>
          {saving ? "Saving..." : "Save Credentials"}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDeleteMedication}
        title="Delete Medication"
        description="Are you sure you want to delete this medication? This action cannot be undone."
        confirmButtonText="Delete"
        variant="destructive"
      />
    </div>
  );
};