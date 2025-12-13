
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ValidatedInput, ValidatedSelect } from "@/components/ui/validated-input";
import { validateField, validateForm, DependentFormData } from "@/schemas/dependentValidationSchema";
import { formatSSNDisplay, cleanSSNForStorage, formatSSNInput } from "@/utils/ssnFormatter";
import { User, Heart } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface PersonalInfoSectionProps {
  formData: {
    firstName: string;
    middleName: string;
    lastName: string;
    gender: "Male" | "Female" | "Other" | "";
    dateOfBirth: string;
    ssn: string;
    maritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | "";
    height: string;
    weight: string;
    smoker: "Yes" | "No" | "";
    relationship: string;
  };
  onUpdate: (updates: Partial<PersonalInfoSectionProps['formData']>) => void;
}

export const PersonalInfoSection = ({ formData, onUpdate }: PersonalInfoSectionProps) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Track SSN display value separately to handle formatting during input
  const [ssnDisplayValue, setSsnDisplayValue] = useState(formatSSNDisplay(formData.ssn));

  // Sync SSN display value when formData.ssn changes from parent
  useEffect(() => {
    setSsnDisplayValue(formatSSNDisplay(formData.ssn));
  }, [formData.ssn]);

  const relationshipOptions = [
    "Spouse", "Child", "Parent", "Sibling", "Grandparent",
    "Grandchild", "Uncle", "Aunt", "Cousin", "Other"
  ];

  // Handle input changes with validation
  const handleInputChange = (field: string, value: string) => {
    onUpdate({ [field]: value });

    // Validate the field and update errors
    const error = validateField(field as keyof DependentFormData, value);
    if (error) {
      setValidationErrors({ ...validationErrors, [field]: error });
    } else {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
  };

  // Parse existing height into feet and inches
  const parseHeight = (height: string) => {
    const match = height.match(/(\d+)'?\s*(\d+)?"?/);
    if (match) {
      return {
        feet: match[1] || "",
        inches: match[2] || ""
      };
    }
    return { feet: "", inches: "" };
  };

  const { feet, inches } = parseHeight(formData.height);

  const handleHeightChange = (newFeet: string, newInches: string) => {
    // Validate feet and inches ranges
    const feetNum = parseInt(newFeet) || 0;
    const inchesNum = parseInt(newInches) || 0;
    
    // Clear previous height errors
    const newErrors = { ...validationErrors };
    delete newErrors.height;
    
    // Validate ranges
    if (newFeet && (feetNum < 1 || feetNum > 8)) {
      newErrors.height = "Height must be between 1-8 feet";
    } else if (newInches && (inchesNum < 0 || inchesNum > 11)) {
      newErrors.height = "Inches must be between 0-11";
    } else if (feetNum === 1 && inchesNum === 0 && newFeet && newInches) {
      newErrors.height = "Height too short - minimum 1'1\"";
    }
    
    setValidationErrors(newErrors);
    
    // Create the height string in the expected format - only include values that are actually provided
    let heightString = "";
    if (newFeet || newInches) {
      const feetPart = newFeet || "";
      const inchesPart = newInches || "";
      heightString = feetPart + "'" + inchesPart + '"';
    }
    
    onUpdate({ height: heightString });
  };

  return (
    <div>
      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ValidatedInput
              id="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={(value) => handleInputChange('firstName', value)}
              error={validationErrors.firstName}
              required
              maxLength={35}
              placeholder="e.g., Sophia"
              validationHint="First name (max 35 chars)"
            />
            <ValidatedInput
              id="middleName"
              label="Middle Name"
              value={formData.middleName}
              onChange={(value) => handleInputChange('middleName', value)}
              error={validationErrors.middleName}
              maxLength={35}
              placeholder="e.g., Marie (optional)"
              validationHint="Middle name, optional (max 35 chars)"
            />
            <ValidatedInput
              id="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={(value) => handleInputChange('lastName', value)}
              error={validationErrors.lastName}
              required
              maxLength={35}
              placeholder="e.g., Williams"
              validationHint="Last name (max 35 chars)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <ValidatedSelect
              id="gender"
              label="Gender"
              value={formData.gender}
              onChange={(value) => handleInputChange('gender', value)}
              error={validationErrors.gender}
              placeholder="Select gender"
              validationHint="Select the dependent's gender"
            >
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </ValidatedSelect>
            <div className="grid gap-1">
              <label htmlFor="dateOfBirth" className="text-sm font-medium">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <DateInput
                id="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(value) => handleInputChange('dateOfBirth', value)}
                placeholder="Select date of birth"
                maxDate={new Date()}
              />
              {validationErrors.dateOfBirth && (
                <span className="text-red-500 text-sm">{validationErrors.dateOfBirth}</span>
              )}
            </div>
            <ValidatedInput
              id="ssn"
              label="SSN"
              value={ssnDisplayValue}
              onChange={(value) => {
                // Use the new formatting logic that handles backspacing better
                const formattedValue = formatSSNInput(value, ssnDisplayValue);
                setSsnDisplayValue(formattedValue);
                
                // Clean the input and store without hyphens
                const cleanValue = cleanSSNForStorage(value);
                handleInputChange('ssn', cleanValue);
              }}
              error={validationErrors.ssn}
              maxLength={11}
              placeholder="XXX-XX-XXXX"
              validationHint="Format: XXX-XX-XXXX"
            />
            <ValidatedSelect
              id="maritalStatus"
              label="Marital Status"
              value={formData.maritalStatus}
              onChange={(value) => handleInputChange('maritalStatus', value)}
              error={validationErrors.maritalStatus}
              placeholder="Select status"
              validationHint="Select the dependent's marital status"
            >
              <SelectItem value="Single">Single</SelectItem>
              <SelectItem value="Married">Married</SelectItem>
              <SelectItem value="Divorced">Divorced</SelectItem>
              <SelectItem value="Widowed">Widowed</SelectItem>
            </ValidatedSelect>
          </div>

        </CardContent>
      </Card>

      {/* Physical Details Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Physical Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ValidatedInput
            id="heightFeet"
            label="Height (ft)"
            type="number"
            value={feet}
            onChange={(value) => handleHeightChange(value, inches)}
            error={validationErrors.height}
            placeholder="e.g., 5"
            min="1"
            max="8"
            showCharCount={false}
            validationHint="Enter height in feet (1-8 feet)"
          />
          <ValidatedInput
            id="heightInches"
            label="Height (in)"
            type="number"
            value={inches}
            onChange={(value) => handleHeightChange(feet, value)}
            error={validationErrors.height}
            placeholder="e.g., 10"
            min="0"
            max="11"
            showCharCount={false}
            validationHint="Enter height in inches (0-11 inches)"
          />
          <ValidatedInput
            id="weight"
            label="Weight (lbs)"
            type="number"
            value={formData.weight}
            onChange={(value) => handleInputChange('weight', value)}
            error={validationErrors.weight}
            placeholder="e.g., 150"
            min="1"
            max="300"
            showCharCount={false}
            validationHint="Weight in pounds (max 300)"
          />
          <div>
            <Label htmlFor="smoker">Smoker</Label>
            <Select value={formData.smoker} onValueChange={(value) => handleInputChange('smoker', value)}>
              <SelectTrigger className={validationErrors.smoker ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select smoking status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.smoker && (
              <span className="text-red-500 text-sm">{validationErrors.smoker}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Relationship Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <ValidatedSelect
          id="relationship"
          label="Relationship"
          value={formData.relationship}
          onChange={(value) => handleInputChange('relationship', value)}
          error={validationErrors.relationship}
          required
          placeholder="Choose relationship from customer"
          validationHint="Select the relationship to the customer"
        >
          {relationshipOptions.map(option => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
        </ValidatedSelect>
      </div>
    </div>
  );
};
