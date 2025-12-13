import { api } from "@/lib/axios";
import { CustomerData, FamilyMember } from "@/types/customer";
import {
  migrateDependentsToFamilyMembers,
  mergeDuplicateFamilyMembers,
  FamilyMigrationResult,
  FamilyMergeResult,
} from "./familyManagementService";

// ===============================================
// API Service for Family Management Settings
// ===============================================

export interface LegacyDependentSummary {
  customerId: number;
  customerName: string;
  dependents: Array<{
    name: string;
    relationship: string;
    policies: string[];
  }>;
}

export interface MigrationProgressResult {
  totalCustomers: number;
  processedCustomers: number;
  totalDependents: number;
  migratedDependents: number;
  skippedDependents: number;
  errors: string[];
  isComplete: boolean;
}

export interface DuplicateAnalysisResult {
  totalFamilyMembers: number;
  potentialDuplicates: Array<{
    groupName: string;
    members: Array<{
      id: number;
      name: string;
      customerId: number;
      customerName: string;
      relationship: string;
      email?: string;
      phone?: string;
    }>;
  }>;
  duplicatesCount: number;
}

export interface MergeProgressResult {
  totalGroups: number;
  processedGroups: number;
  totalMerged: number;
  conflicts: string[];
  errors: string[];
  isComplete: boolean;
}

export const familyManagementSettingsService = {
  /**
   * Get summary of all legacy dependents across all customers
   */
  async getLegacyDependentsSummary(): Promise<LegacyDependentSummary[]> {
    try {
      // For now, since there's no actual legacy dependent data in the backend,
      // we'll return an empty array. This feature would be implemented when
      // there's actual legacy data to migrate.
      
      return [];
    } catch (error) {
      console.error("Error fetching legacy dependents:", error);
      throw new Error("Failed to fetch legacy dependents summary");
    }
  },

  /**
   * Migrate all legacy dependents to family members
   */
  async migrateAllLegacyDependents(): Promise<MigrationProgressResult> {
    try {
      const legacySummary = await this.getLegacyDependentsSummary();

      let processedCustomers = 0;
      let totalDependents = 0;
      let migratedDependents = 0;
      let skippedDependents = 0;
      const errors: string[] = [];

      for (const customerSummary of legacySummary) {
        try {
          // Get current family members for this customer
          const familyMembers = await api.get(
            `/dependents?customer_id=${customerSummary.customerId}`,
          );
          const existingFamilyMembers = familyMembers.data;

          // Migrate dependents for this customer
          const migrationResult = migrateDependentsToFamilyMembers(
            customerSummary.dependents,
            existingFamilyMembers,
          );

          // Save migrated family members to backend
          for (const newMember of migrationResult.migratedCount > 0
            ? existingFamilyMembers.slice(-migrationResult.migratedCount)
            : []) {
            try {
              await api.post("/dependents", {
                customer_id: customerSummary.customerId,
                first_name: newMember.firstName,
                last_name: newMember.lastName,
                relationship: newMember.relationship,
                notes: newMember.notes,
                // Add other required fields as needed
              });
            } catch (memberError) {
              errors.push(
                `Failed to save family member ${newMember.name} for customer ${customerSummary.customerName}`,
              );
            }
          }

          totalDependents += customerSummary.dependents.length;
          migratedDependents += migrationResult.migratedCount;
          skippedDependents += migrationResult.skippedCount;
          errors.push(...migrationResult.errors);

          processedCustomers++;
        } catch (customerError) {
          errors.push(
            `Failed to process customer ${customerSummary.customerName}: ${customerError}`,
          );
        }
      }

      return {
        totalCustomers: legacySummary.length,
        processedCustomers,
        totalDependents,
        migratedDependents,
        skippedDependents,
        errors,
        isComplete: true,
      };
    } catch (error) {
      console.error("Error during migration:", error);
      throw new Error("Failed to migrate legacy dependents");
    }
  },

  /**
   * Analyze potential duplicate family members across all customers
   */
  async analyzeDuplicateFamilyMembers(): Promise<DuplicateAnalysisResult> {
    try {
      // Get all family members across all customers
      const response = await api.get("/dependents?per_page=10000");

      let allFamilyMembers: any[] = [];

      // Handle different response structures
      if (response.data && Array.isArray(response.data)) {
        allFamilyMembers = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        allFamilyMembers = response.data.data;
      }

      // Group by normalized name to find potential duplicates
      const nameGroups: { [key: string]: any[] } = {};

      allFamilyMembers.forEach((member: any) => {
        const firstName = member.first_name || "";
        const lastName = member.last_name || "";
        const normalizedName = `${firstName} ${lastName}`.toLowerCase().trim();

        if (normalizedName && normalizedName !== " ") {
          if (!nameGroups[normalizedName]) {
            nameGroups[normalizedName] = [];
          }
          nameGroups[normalizedName].push(member);
        }
      });

      // Find groups with multiple members (potential duplicates)
      const duplicateGroups = Object.entries(nameGroups)
        .filter(([_, members]) => members.length > 1)
        .map(([groupName, members]) => ({
          groupName: groupName
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          members: members.map((member) => ({
            id: member.id,
            name:
              `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
              "Unknown Name",
            customerId: member.customer_id,
            customerName: `Customer ${member.customer_id}`, // Would need to join with customers table
            relationship: member.relationship || "Unknown",
            email: member.email,
            phone: member.cell_phone || member.home_phone,
          })),
        }));

      const duplicatesCount = duplicateGroups.reduce(
        (total, group) => total + (group.members.length - 1),
        0,
      );

      return {
        totalFamilyMembers: allFamilyMembers.length,
        potentialDuplicates: duplicateGroups,
        duplicatesCount,
      };
    } catch (error) {
      console.error("Error analyzing duplicates:", error);
      throw new Error("Failed to analyze duplicate family members");
    }
  },

  /**
   * Merge duplicate family members based on analysis
   */
  async mergeDuplicateFamilyMembers(
    duplicateGroups?: DuplicateAnalysisResult["potentialDuplicates"],
  ): Promise<MergeProgressResult> {
    try {
      let groups: DuplicateAnalysisResult["potentialDuplicates"];

      if (!duplicateGroups) {
        const analysis = await this.analyzeDuplicateFamilyMembers();
        groups = analysis.potentialDuplicates;
      } else {
        groups = duplicateGroups;
      }

      let processedGroups = 0;
      let totalMerged = 0;
      const conflicts: string[] = [];
      const errors: string[] = [];

      for (const group of groups) {
        try {
          if (group.members.length < 2) continue;

          // Keep the first member as primary, merge others into it
          const primaryMember = group.members[0];
          const duplicateMembers = group.members.slice(1);

          for (const duplicate of duplicateMembers) {
            try {
              // Merge logic: update primary member with any missing info from duplicate
              const primaryData = await api.get(
                `/dependents/${primaryMember.id}`,
              );
              const duplicateData = await api.get(
                `/dependents/${duplicate.id}`,
              );

              const mergedData = {
                ...primaryData.data,
                // Merge email if primary doesn't have one
                email: primaryData.data.email || duplicateData.data.email,
                // Merge phone if primary doesn't have one
                cell_phone:
                  primaryData.data.cell_phone || duplicateData.data.cell_phone,
                home_phone:
                  primaryData.data.home_phone || duplicateData.data.home_phone,
                // Combine notes
                notes: primaryData.data.notes
                  ? `${primaryData.data.notes}; Merged from duplicate: ${duplicateData.data.notes || "No additional notes"}`
                  : duplicateData.data.notes,
              };

              // Update primary member with merged data
              await api.put(`/dependents/${primaryMember.id}`, mergedData);

              // Delete the duplicate
              await api.delete(`/dependents/${duplicate.id}`);

              totalMerged++;
            } catch (memberError) {
              errors.push(
                `Failed to merge ${duplicate.name} into ${primaryMember.name}: ${memberError}`,
              );
            }
          }

          processedGroups++;
        } catch (groupError) {
          errors.push(
            `Failed to process group ${group.groupName}: ${groupError}`,
          );
        }
      }

      return {
        totalGroups: groups.length,
        processedGroups,
        totalMerged,
        conflicts,
        errors,
        isComplete: true,
      };
    } catch (error) {
      console.error("Error during merge:", error);
      throw new Error("Failed to merge duplicate family members");
    }
  },

  /**
   * Get family management statistics
   */
  async getFamilyManagementStats(): Promise<{
    totalCustomers: number;
    totalFamilyMembers: number;
    customersWithDependents: number;
    totalLegacyDependents: number;
    potentialDuplicates: number;
  }> {
    try {

      // Get customers data with minimal pagination info
      const customersResponse = await api.get("/customers?per_page=1");

      // Get legacy summary
      const legacySummary = await this.getLegacyDependentsSummary();

      // Handle Laravel pagination structure
      let totalCustomers = 0;
      let totalFamilyMembers = 0;
      let potentialDuplicates = 0;

      if (customersResponse.data && customersResponse.data.total) {
        totalCustomers = customersResponse.data.total;
      }

      // Try to get family members data, handle auth issues gracefully
      try {
        const familyMembersResponse = await api.get(
          "/dependents?per_page=1",
        );

        if (familyMembersResponse.data && familyMembersResponse.data.total) {
          totalFamilyMembers = familyMembersResponse.data.total;
        }

        // Try duplicate analysis only if family members are accessible
        try {
          const duplicateAnalysis = await this.analyzeDuplicateFamilyMembers();
          potentialDuplicates = duplicateAnalysis.duplicatesCount;
        } catch (error) {
          console.warn("Could not analyze duplicates:", error);
        }
      } catch (error) {
        console.warn(
          "Could not fetch family members (likely auth issue):",
          error,
        );
        // Use 0 as fallback for family member stats
        totalFamilyMembers = 0;
        potentialDuplicates = 0;
      }

      const result = {
        totalCustomers,
        totalFamilyMembers,
        customersWithDependents: legacySummary.length,
        totalLegacyDependents: legacySummary.reduce(
          (total, customer) => total + customer.dependents.length,
          0,
        ),
        potentialDuplicates,
      };

      return result;
    } catch (error) {
      console.error("Error fetching family management stats:", error);
      // Return fallback stats instead of throwing
      return {
        totalCustomers: 0,
        totalFamilyMembers: 0,
        customersWithDependents: 0,
        totalLegacyDependents: 0,
        potentialDuplicates: 0,
      };
    }
  },

  /**
   * Backup family data before performing operations
   */
  async backupFamilyData(): Promise<{ backupId: string; timestamp: string }> {
    try {
      const response = await api.post("/dependents/backup");
      return {
        backupId: response.data.backup_id,
        timestamp: response.data.created_at,
      };
    } catch (error) {
      console.error("Error creating backup:", error);
      throw new Error("Failed to create family data backup");
    }
  },

  /**
   * Restore family data from backup
   */
  async restoreFamilyData(
    backupId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/dependents/restore/${backupId}`);
      return {
        success: true,
        message: "Family data restored successfully",
      };
    } catch (error) {
      console.error("Error restoring backup:", error);
      throw new Error("Failed to restore family data from backup");
    }
  },
};

export default familyManagementSettingsService;
