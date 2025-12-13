import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Building2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { InsuranceCompanyService, InsuranceCompany } from "@/services/insuranceCompany.service";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { ValidatedInput, ValidatedSelect } from "@/components/ui/validated-input";
import { CompanyPreview } from "./CompanyPreview";
import LookupService, { State } from "@/services/lookupService";
import { usePermissions } from "@/contexts/PermissionContext";
import { ConditionalAccess } from "@/components/ProtectedRoute";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SimplifiedFormData {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  fax: string;
  work_phone: string;
  zip_code: string;
  state: string;
  city: string;
  address: string;
  description: string;
  status: string;
}

interface SimplifiedCompaniesManagementProps {
  onCompanySelect?: (company: InsuranceCompany) => void;
  onCompaniesChange?: () => void;
}

export function SimplifiedCompaniesManagement({ onCompanySelect, onCompaniesChange }: SimplifiedCompaniesManagementProps) {
  const { hasPermission } = usePermissions();
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);

  // Permission checks
  const canManageCompanies = hasPermission("manage_companies");
  const canDeleteCompanies = hasPermission("delete_companies");
  const canViewCompanyStatistics = hasPermission("view_company_statistics");
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null);
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState<'form' | 'preview'>('form');

  // Default form data
  const defaultFormData = {
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    fax: "",
    work_phone: "",
    zip_code: "",
    state: "",
    city: "",
    address: "",
    description: "",
    status: "Active"
  };

  const [formData, setFormData] = useState<SimplifiedFormData>(defaultFormData);

  // Initialize form data from localStorage on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('companyFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData({ ...defaultFormData, ...parsedData });
      }
    } catch (error) {
      console.warn('Failed to load saved company form data:', error);
    }
  }, []);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const loadCompanies = useCallback(async (page: number = 1, pageSize?: number) => {
    const currentPerPage = pageSize || perPage;
    try {
      setLoading(true);
      const response = await InsuranceCompanyService.getAll({ per_page: currentPerPage, page });
      // Sort companies by created_at descending (latest first)
      const sortedCompanies = (response.data || []).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setCompanies(sortedCompanies);
      setTotalCount(response.total || 0);
      setCurrentPage(response.current_page || 1);
      setLastPage(Math.ceil((response.total || 0) / currentPerPage));
      if (onCompaniesChange) {
        onCompaniesChange();
      }
    } catch (error) {
      console.error("Error loading companies:", error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
      setCompanies([]);
      setTotalCount(0);
      setCurrentPage(1);
      setLastPage(1);
    } finally {
      setLoading(false);
    }
  }, [toast, onCompaniesChange, perPage]);

  const loadStates = useCallback(async () => {
    try {
      const statesData = await LookupService.getStates({ activeOnly: true });
      setStates(statesData);
    } catch (error) {
      console.error("Error loading states:", error);
      toast({
        title: "Error",
        description: "Failed to load states",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadCompanies();
    loadStates();
  }, [loadCompanies, loadStates]);

  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      fax: "",
      work_phone: "",
      zip_code: "",
      state: "",
      city: "",
      address: "",
      description: "",
      status: "Active"
    });
    setFormErrors({});
    setEditingCompany(null);
    setCurrentStep('form');
  };

  const handleManualReset = () => {
    // Reset form data
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      fax: "",
      work_phone: "",
      zip_code: "",
      state: "",
      city: "",
      address: "",
      description: "",
      status: "Active"
    });

    // Clear localStorage
    try {
      localStorage.removeItem('companyFormData');
    } catch (error) {
      console.warn('Failed to clear saved company form data:', error);
    }

    // Clear form errors
    setFormErrors({});
    
    // Reset step to form
    setCurrentStep('form');

    // Show success message
    toast({
      title: "Form Reset",
      description: "All form fields have been cleared.",
    });
  };

  // Function to proceed to preview step
  const handleProceedToPreview = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setCurrentStep('preview');
  };

  // Function to go back to form from preview
  const handleBackToForm = () => {
    setCurrentStep('form');
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Name is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    // Save to localStorage for form persistence (only for add form)
    if (!editingCompany) {
      try {
        localStorage.setItem('companyFormData', JSON.stringify(newFormData));
      } catch (error) {
        console.warn('Failed to save company form data:', error);
      }
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    // Save to localStorage for form persistence (only for add form)
    if (!editingCompany) {
      try {
        localStorage.setItem('companyFormData', JSON.stringify(newFormData));
      } catch (error) {
        console.warn('Failed to save company form data:', error);
      }
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleZipCodeSearch = async () => {
    if (!formData.zip_code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a zip code first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Clear any previous alert
      // setZipCodeSearchAlert(null);
      
      // Use the real API to get location data from zip code
      const locationData = await LookupService.searchZipByCode(formData.zip_code);

      if (locationData && locationData.length > 0) {
        const zipData = locationData[0]; // Take the first match
        const stateName = zipData.state?.name || zipData.state_abbr;
        
        setFormData(prev => ({
          ...prev,
          state: stateName,
          city: zipData.city
        }));
        
        // Save to localStorage for form persistence (only for add form)
        if (!editingCompany) {
          try {
            const updatedFormData = {
              ...formData,
              state: stateName,
              city: zipData.city
            };
            localStorage.setItem('companyFormData', JSON.stringify(updatedFormData));
          } catch (error) {
            console.warn('Failed to save company form data:', error);
          }
        }
        
        toast({
          title: "Success",
          description: "Location data filled automatically",
        });
      } else {
        // Show blue info toast in bottom right
        toast({
          title: "No Location Found",
          description: "No location data found for this zip code. Please enter the state and city manually.",
          variant: "default", // This will show as a blue/info toast
        });
      }
    } catch (error) {
      console.error("Error searching zip code:", error);
      toast({
        title: "Error",
        description: "Failed to search zip code",
        variant: "destructive",
      });
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    // If we're on the form step, proceed to preview instead of submitting
    if (currentStep === 'form') {
      handleProceedToPreview();
      return;
    }

    // If we're on the preview step, proceed with actual submission
    try {
      const response = await InsuranceCompanyService.create({
        ...formData,
        industry: "Insurance", // Default value
        street_address: formData.address,
        country: "India",
        status: formData.status as "Active" | "Inactive"
      });

      // Check if there are validation errors in the response
      if (response.errors) {
        const errorMessages = Object.values(response.errors).flat();
        setFormErrors({
          email: response.errors.email?.[0] || "",
          name: response.errors.name?.[0] || "",
          phone: response.errors.phone?.[0] || "",
        });
        toast({
          title: "Validation Error",
          description: errorMessages[0] || "Please check the form for errors",
          variant: "destructive",
        });
        // Go back to form step to show errors
        setCurrentStep('form');
        return;
      }

      if (response.company) {
        setIsAddDialogOpen(false);
        resetForm();
        
        // Clear localStorage after successful submission
        try {
          localStorage.removeItem('companyFormData');
        } catch (error) {
          console.warn('Failed to clear saved company form data:', error);
        }
        
        toast({
          title: "Success",
          description: `${formData.name} has been added successfully.`,
        });
        loadCompanies(1); // Reset to first page after adding
      }
    } catch (error) {
      console.error("Error creating company:", error);
      toast({
        title: "Error",
        description: "Failed to create company. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (company: InsuranceCompany) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      contact_person: company.contact_person || "",
      email: company.email,
      phone: company.phone,
      fax: company.fax || "",
      work_phone: company.work_phone || "", // Now using actual work_phone from API
      zip_code: company.zip_code,
      state: company.state || "",
      city: company.city,
      address: company.address || "",
      description: company.description || "",
      status: company.status
    });
    setCurrentStep('form');
    setIsEditDialogOpen(true);
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If we're on the form step, proceed to preview instead of submitting
    if (currentStep === 'form') {
      handleProceedToPreview();
      return;
    }
    
    if (!editingCompany) return;

    try {
      const response = await InsuranceCompanyService.update(editingCompany.id, {
        ...formData,
        industry: "Insurance",
        street_address: formData.address,
        country: "India",
        status: formData.status as "Active" | "Inactive"
      });

      // Check if there are validation errors in the response
      if (response.errors) {
        const errorMessages = Object.values(response.errors).flat();
        setFormErrors({
          email: response.errors.email?.[0] || "",
          name: response.errors.name?.[0] || "",
          phone: response.errors.phone?.[0] || "",
        });
        toast({
          title: "Validation Error",
          description: errorMessages[0] || "Please check the form for errors",
          variant: "destructive",
        });
        // Go back to form step to show errors
        setCurrentStep('form');
        return;
      }

      if (response.company) {
        setIsEditDialogOpen(false);
        resetForm();
        toast({
          title: "Success",
          description: `${formData.name} has been updated successfully.`,
        });
        loadCompanies(currentPage); // Stay on current page after updating
      }
    } catch (error) {
      console.error("Error updating company:", error);
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: number) => {
    setCompanyToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (companyToDelete === null) return;

    try {
      await InsuranceCompanyService.delete(companyToDelete);
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
      await loadCompanies(currentPage); // Stay on current page or adjust if page becomes empty
    } catch (error: unknown) {
      console.error("Error deleting company:", error);
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setCompanyToDelete(null);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const searchLower = searchTerm.toLowerCase();
    return company.name.toLowerCase().includes(searchLower) ||
      company.email.toLowerCase().includes(searchLower) ||
      company.phone.includes(searchTerm) ||
      (company.contact_person && company.contact_person.toLowerCase().includes(searchLower));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Insurance Companies ({totalCount})</h2>
          <p className="text-muted-foreground">Manage insurance companies</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Insurance Company
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search companies..."
          className="w-full pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table className="border-l">
            <TableHeader className="border-b border-t">
              <TableRow className="divide-x divide-gray-200">
                <TableHead>Insurance Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2" />
                      <p className="text-muted-foreground">Loading companies...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="divide-x divide-gray-200">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-muted-foreground">{company.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{company.phone}</TableCell>
                    <TableCell>{company.city || '-'}</TableCell>
                    <TableCell>{company.state || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={company.status === "Active" ? "default" : "secondary"}>
                        {company.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(company)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(company.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No companies found.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setIsAddDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Company
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalCount)} of {totalCount} companies
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="page-size" className="text-sm">Show:</Label>
              <Select
                value={perPage.toString()}
                onValueChange={(value) => {
                  const newPerPage = parseInt(value);
                  setPerPage(newPerPage);
                  loadCompanies(1, newPerPage); // Reset to first page when changing page size
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadCompanies(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadCompanies(currentPage + 1)}
              disabled={currentPage === lastPage || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Company Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent 
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {currentStep === 'form' 
                ? (editingCompany ? "Edit Insurance Company" : "Add Insurance Company")
                : "Review Insurance Company Information"
              }
            </DialogTitle>
            <DialogDescription>
              {currentStep === 'form'
                ? (editingCompany
                    ? "Update company details and contact information"
                    : "Create a new insurance company with contact details")
                : "Please review the information below before submitting."
              }
            </DialogDescription>
            
            {/* Step Indicators */}
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'form' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  1
                </div>
                <span className={`ml-2 text-sm ${currentStep === 'form' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  Company Details
                </span>
              </div>
              
              <div className={`w-8 h-0.5 ${currentStep === 'preview' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  2
                </div>
                <span className={`ml-2 text-sm ${currentStep === 'preview' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  Review & Submit
                </span>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={editingCompany ? handleUpdateCompany : handleAddCompany} className="space-y-4">
            {currentStep === 'form' ? (
              <>
                {/* Form content */}
                <div className="space-y-2">
                  <ValidatedInput
                    id="name"
                    label="Name"
                    value={formData.name}
                    onChange={(value) => {
                      const newFormData = { ...formData, name: value };
                      setFormData(newFormData);
                      
                      // Save to localStorage for form persistence (only for add form)
                      if (!editingCompany) {
                        try {
                          localStorage.setItem('companyFormData', JSON.stringify(newFormData));
                        } catch (error) {
                          console.warn('Failed to save company form data:', error);
                        }
                      }
                      
                      if (formErrors.name) {
                        setFormErrors(prev => ({ ...prev, name: "" }));
                      }
                    }}
                    error={formErrors.name}
                    required
                    maxLength={100}
                    placeholder="e.g., Blue Cross Blue Shield, Aetna, State Farm"
                    validationHint="Company name (max 100 chars)"
                  />
                </div>

                {/* <div className="space-y-2">
                  <ValidatedInput
                    id="contact_person"
                    label="Contact Person"
                    value={formData.contact_person}
                    onChange={(value) => {
                      const newFormData = { ...formData, contact_person: value };
                      setFormData(newFormData);
                      
                      if (!editingCompany) {
                        try {
                          localStorage.setItem('companyFormData', JSON.stringify(newFormData));
                        } catch (error) {
                          console.warn('Failed to save company form data:', error);
                        }
                      }
                    }}
                    maxLength={70}
                    placeholder="e.g., John Smith, Account Manager"
                    validationHint="Contact person name (max 70 chars)"
                  />
                </div> */}

                <div className="grid grid-cols-3 gap-4">
                  <ValidatedInput
                    id="phone"
                    label="Cell Phone"
                    value={formData.phone}
                    onChange={(value) => {
                      const newFormData = { ...formData, phone: value };
                      setFormData(newFormData);
                      
                      if (!editingCompany) {
                        try {
                          localStorage.setItem('companyFormData', JSON.stringify(newFormData));
                        } catch (error) {
                          console.warn('Failed to save company form data:', error);
                        }
                      }
                      
                      if (formErrors.phone) {
                        setFormErrors(prev => ({ ...prev, phone: "" }));
                      }
                    }}
                    error={formErrors.phone}
                    maxLength={17}
                    placeholder="e.g., (555) 123-4567"
                    validationHint="Phone number (digits, spaces, (), +, -) max 17 chars"
                  />

                  <ValidatedInput
                    id="work_phone"
                    label="Work Phone"
                    value={formData.work_phone}
                    onChange={(value) => {
                      const newFormData = { ...formData, work_phone: value };
                      setFormData(newFormData);
                      
                      if (!editingCompany) {
                        try {
                          localStorage.setItem('companyFormData', JSON.stringify(newFormData));
                        } catch (error) {
                          console.warn('Failed to save company form data:', error);
                        }
                      }
                    }}
                    maxLength={17}
                    placeholder="e.g., (800) 555-0123"
                    validationHint="Work phone (digits, spaces, (), +, -) max 17 chars"
                  />

                  <ValidatedInput
                    id="fax"
                    label="Fax"
                    value={formData.fax}
                    onChange={(value) => {
                      const newFormData = { ...formData, fax: value };
                      setFormData(newFormData);
                      
                      if (!editingCompany) {
                        try {
                          localStorage.setItem('companyFormData', JSON.stringify(newFormData));
                        } catch (error) {
                          console.warn('Failed to save company form data:', error);
                        }
                      }
                    }}
                    maxLength={17}
                    placeholder="e.g., (555) 123-4568"
                    validationHint="Fax number (digits, spaces, (), +, -) max 17 chars"
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <ValidatedInput
                      id="email"
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(value) => {
                        const newFormData = { ...formData, email: value };
                        setFormData(newFormData);
                        
                        if (!editingCompany) {
                          try {
                            localStorage.setItem('companyFormData', JSON.stringify(newFormData));
                          } catch (error) {
                            console.warn('Failed to save company form data:', error);
                          }
                        }
                        
                        if (formErrors.email) {
                          setFormErrors(prev => ({ ...prev, email: "" }));
                        }
                      }}
                      error={formErrors.email}
                      maxLength={123}
                      placeholder="e.g., contact@company.com"
                      validationHint="Valid email address (max 123 chars)"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <ValidatedInput
                        id="zip_code"
                        label="Zip Code"
                        value={formData.zip_code}
                        onChange={(value) => {
                          const newFormData = { ...formData, zip_code: value };
                          setFormData(newFormData);
                          
                          if (!editingCompany) {
                            try {
                              localStorage.setItem('companyFormData', JSON.stringify(newFormData));
                            } catch (error) {
                              console.warn('Failed to save company form data:', error);
                            }
                          }
                          
                          // Clear alert when user starts typing
                          // if (zipCodeSearchAlert) {
                          //   setZipCodeSearchAlert(null);
                          // }
                        }}
                        maxLength={15}
                        placeholder="e.g., 12345"
                        validationHint="ZIP code (max 15 chars)"
                        showCharCount={false}
                        className="pr-8" // Add padding-right to make room for the button
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-8 h-6 w-6 p-0 hover:bg-muted"
                        onClick={handleZipCodeSearch}
                        title="Search location by zip code"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <ValidatedSelect
                      id="state"
                      label="State"
                      value={formData.state}
                      onChange={(value) => handleSelectChange("state", value)}
                      placeholder="Select state"
                      validationHint="Select the company's state"
                    >
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.name}>{state.name}</SelectItem>
                      ))}
                    </ValidatedSelect>
                  </div>

                  <div className="space-y-2">
                    <ValidatedInput
                      id="city"
                      label="City"
                      value={formData.city}
                      onChange={(value) => {
                        const newFormData = { ...formData, city: value };
                        setFormData(newFormData);
                        
                        if (!editingCompany) {
                          try {
                            localStorage.setItem('companyFormData', JSON.stringify(newFormData));
                          } catch (error) {
                            console.warn('Failed to save company form data:', error);
                          }
                        }
                      }}
                      maxLength={80}
                      placeholder="e.g., New York, Mumbai, London"
                      validationHint="City name (max 80 chars)"
                    />
                  </div>
                </div>

                <ValidatedInput
                  id="address"
                  label="Address"
                  value={formData.address}
                  onChange={(value) => {
                    const newFormData = { ...formData, address: value };
                    setFormData(newFormData);
                    
                    if (!editingCompany) {
                      try {
                        localStorage.setItem('companyFormData', JSON.stringify(newFormData));
                      } catch (error) {
                        console.warn('Failed to save company form data:', error);
                      }
                    }
                  }}
                  maxLength={255}
                  placeholder="e.g., 123 Main Street, Business Park, Suite 500"
                  validationHint="Street address (max 255 chars)"
                />

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 500) {
                        const newFormData = { ...formData, description: value };
                        setFormData(newFormData);
                        
                        if (!editingCompany) {
                          try {
                            localStorage.setItem('companyFormData', JSON.stringify(newFormData));
                          } catch (error) {
                            console.warn('Failed to save company form data:', error);
                          }
                        }
                      }
                    }}
                    placeholder="e.g., Leading provider of health and auto insurance with 24/7 customer support..."
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {formData.description.length}/500 characters
                  </div>
                </div>

                <div className="space-y-2">
                  <ValidatedSelect
                    id="status"
                    label="Status"
                    value={formData.status}
                    onChange={(value) => handleSelectChange("status", value)}
                    placeholder="Select status"
                    validationHint="Select the company's status"
                  >
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </ValidatedSelect>
                </div>

                <div className="flex justify-between pt-4">
                  {!editingCompany && (
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={handleManualReset}
                    >
                      Reset Form
                    </Button>
                  )}
                  {editingCompany && <div></div>}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setIsEditDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-black hover:bg-gray-800 text-white">
                      {editingCompany ? "Update Company" : "Review Information"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Preview content */}
                <CompanyPreview formData={formData} />
                
                <div className="flex justify-between pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBackToForm}
                  >
                    Edit Information
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setIsEditDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-black hover:bg-gray-800 text-white">
                      {editingCompany ? "Update Company" : "Create Company"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Company"
        description="Are you sure you want to delete this company? This action cannot be undone."
        confirmButtonText="Delete"
        variant="destructive"
      />
    </div>
  );
}