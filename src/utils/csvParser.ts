import { CreateLeadRequest } from "@/types/conversion";

export interface ParsedCSVResult {
  success: boolean;
  data: CreateLeadRequest[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export interface CSVParseOptions {
  skipFirstRow?: boolean;
  delimiter?: string;
  requiredFields?: string[];
}

export class CSVParser {
  /**
   * Parse CSV text content into lead data
   */
  static parseCSV(
    csvContent: string,
    options: CSVParseOptions = {},
  ): ParsedCSVResult {
    const {
      skipFirstRow = true,
      delimiter = ",",
      requiredFields = ["name"],
    } = options;

    const errors: string[] = [];
    const data: CreateLeadRequest[] = [];

    try {
      // Split into lines and filter empty lines
      const lines = csvContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) {
        errors.push("CSV file is empty");
        return {
          success: false,
          data: [],
          errors,
          totalRows: 0,
          validRows: 0,
        };
      }

      // Get headers (first row)
      const headers = this.parseCSVLine(lines[0], delimiter);
      const normalizedHeaders = headers.map((h) =>
        h.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_"),
      );

      // Validate required headers
      const missingFields = requiredFields.filter(
        (field) => !normalizedHeaders.includes(field.toLowerCase()),
      );

      if (missingFields.length > 0) {
        errors.push(
          `Missing required columns: ${missingFields.join(", ")}`,
        );
      }

      // Create header mapping
      const headerMap = this.createHeaderMapping(normalizedHeaders);

      // Process data rows
      const dataStartIndex = skipFirstRow ? 1 : 0;
      const dataLines = lines.slice(dataStartIndex);

      dataLines.forEach((line, index) => {
        const rowNumber = dataStartIndex + index + 1;

        try {
          const values = this.parseCSVLine(line, delimiter);

          if (values.length !== headers.length) {
            errors.push(
              `Row ${rowNumber}: Column count mismatch (expected ${headers.length}, got ${values.length})`,
            );
            return;
          }

          const leadData = this.mapRowToLead(values, headerMap, rowNumber);

          // Validate required fields
          const validationErrors = this.validateLead(leadData, requiredFields);
          if (validationErrors.length > 0) {
            errors.push(
              `Row ${rowNumber}: ${validationErrors.join(", ")}`,
            );
            return;
          }

          data.push(leadData);
        } catch (error) {
          errors.push(
            `Row ${rowNumber}: ${error instanceof Error ? error.message : "Parse error"}`,
          );
        }
      });

      return {
        success: errors.length === 0,
        data,
        errors,
        totalRows: dataLines.length,
        validRows: data.length,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [
          `Parse error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
        totalRows: 0,
        validRows: 0,
      };
    }
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = "";
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());

    return result;
  }

  /**
   * Create mapping from normalized headers to lead fields
   */
  private static createHeaderMapping(headers: string[]): Record<string, number> {
    const mapping: Record<string, number> = {};

    headers.forEach((header, index) => {
      // Direct mappings
      mapping[header] = index;

      // Common variations
      const variations: Record<string, string[]> = {
        name: ["name", "full_name", "contact_name", "lead_name"],
        email: ["email", "email_address", "contact_email"],
        phone: ["phone", "phone_number", "contact_phone", "mobile", "tel"],
        company: ["company", "company_name", "organization", "business"],
        source: ["source", "lead_source", "origin"],
        status: ["status", "lead_status", "stage"],
        value: ["value", "deal_value", "potential_value", "amount"],
        score: ["score", "lead_score", "rating", "priority"],
        policy_type: [
          "policy_type",
          "insurance_type",
          "product_type",
          "coverage_type",
        ],
        location: ["location", "address", "city", "region"],
        notes: ["notes", "comments", "description", "remarks"],
      };

      Object.entries(variations).forEach(([field, vars]) => {
        if (vars.includes(header)) {
          mapping[field] = index;
        }
      });
    });

    return mapping;
  }

  /**
   * Map CSV row values to lead object
   */
  private static mapRowToLead(
    values: string[],
    headerMap: Record<string, number>,
    rowNumber: number,
  ): CreateLeadRequest {
    const getValue = (field: string): string | undefined => {
      const index = headerMap[field];
      if (index !== undefined && values[index]) {
        return values[index].trim();
      }
      return undefined;
    };

    const getNumericValue = (field: string): number | undefined => {
      const value = getValue(field);
      if (value) {
        const num = parseFloat(value.replace(/[,$]/g, ""));
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    };

    const lead: CreateLeadRequest = {
      name: getValue("name") || `Lead ${rowNumber}`,
    };

    // Optional fields
    const email = getValue("email");
    if (email) lead.email = email;

    const phone = getValue("phone");
    if (phone) lead.phone = phone;

    const company = getValue("company");
    if (company) lead.company = company;

    const source = getValue("source");
    if (source) lead.source = source;

    const status = getValue("status");
    if (status) lead.status = status;

    const value = getNumericValue("value");
    if (value !== undefined) lead.value = value;

    const score = getNumericValue("score");
    if (score !== undefined) lead.score = Math.min(100, Math.max(0, score));

    const policyType = getValue("policy_type");
    if (policyType) lead.policy_type = policyType;

    const location = getValue("location");
    if (location) lead.location = location;

    const notes = getValue("notes");
    if (notes) lead.notes = notes;

    return lead;
  }

  /**
   * Validate lead data
   */
  private static validateLead(
    lead: CreateLeadRequest,
    requiredFields: string[],
  ): string[] {
    const errors: string[] = [];

    // Check required fields
    requiredFields.forEach((field) => {
      if (!lead[field as keyof CreateLeadRequest]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate email format
    if (lead.email && !this.isValidEmail(lead.email)) {
      errors.push("Invalid email format");
    }

    // Validate score range
    if (lead.score !== undefined && (lead.score < 0 || lead.score > 100)) {
      errors.push("Score must be between 0 and 100");
    }

    // Validate value
    if (lead.value !== undefined && lead.value < 0) {
      errors.push("Value must be positive");
    }

    return errors;
  }

  /**
   * Basic email validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate sample CSV content for download
   */
  static generateSampleCSV(): string {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Company",
      "Source",
      "Status",
      "Value",
      "Score",
      "Policy Type",
      "Location",
      "Notes",
    ];

    const sampleData = [
      [
        "John Doe",
        "john.doe@email.com",
        "(555) 123-4567",
        "Tech Corp",
        "Website",
        "New",
        "50000",
        "75",
        "Business Insurance",
        "New York, NY",
        "Interested in comprehensive coverage",
      ],
      [
        "Jane Smith",
        "jane.smith@email.com",
        "(555) 234-5678",
        "Design Studio",
        "Referral",
        "Qualified",
        "25000",
        "85",
        "Professional Liability",
        "Los Angeles, CA",
        "Referred by existing client",
      ],
      [
        "Mike Johnson",
        "mike.j@email.com",
        "(555) 345-6789",
        "Consulting LLC",
        "Cold Call",
        "Contacted",
        "75000",
        "60",
        "Life Insurance",
        "Chicago, IL",
        "Needs family protection plan",
      ],
    ];

    const csvLines = [headers, ...sampleData];
    return csvLines.map((row) => row.join(",")).join("\n");
  }

  /**
   * Download CSV template file
   */
  static downloadTemplate(filename: string = "leads_template.csv"): void {
    const csvContent = this.generateSampleCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Read file as text
   */
  static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("File reading error"));
      reader.readAsText(file);
    });
  }
}
