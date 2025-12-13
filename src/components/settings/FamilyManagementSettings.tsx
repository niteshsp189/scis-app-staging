import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2 } from "lucide-react";
import { generateFamilyTree } from "@/services/familyManagementService";
import { MigrationSection } from "./family-management/MigrationSection";
import { MergeSection } from "./family-management/MergeSection";
import { PolicyManagementSection } from "./family-management/PolicyManagementSection";
import { FamilyMember } from "@/types/customer";
import { familyManagementSettingsService } from "@/services/familyManagementSettingsService";
import { useState, useEffect } from "react";

export const FamilyManagementSettings = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalFamilyMembers: 0,
    customersWithDependents: 0,
    totalLegacyDependents: 0,
    potentialDuplicates: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [primaryCustomer, setPrimaryCustomer] = useState<FamilyMember | null>(
    null,
  );

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const data =
        await familyManagementSettingsService.getFamilyManagementStats();
      setStats(data);

      // Mock primary customer for family tree display
      setPrimaryCustomer({
        id: 1,
        firstName: "John",
        middleName: "",
        lastName: "Smith",
        name: "John Smith",
        relationship: "Primary",
        gender: "Male",
        dateOfBirth: "1980-05-15",
        ssn: "123-45-6789",
        maritalStatus: "Married",
        height: "5'10\"",
        weight: "180 lbs",
        smoker: "No",
        email: "john@email.com",
        homePhone: "555-0123",
        cellPhone: "555-0124",
        workPhone: "555-0125",
        fax: "555-0126",
        phone: "555-0123",
        address: "123 Main St",
        apartment: "",
        apartmentType: "",
        city: "Anytown",
        state: "CA",
        zipCode: "12345",
        country: "USA",
        differentMailingAddress: false,
        mailingAddress: "",
        mailingApartment: "",
        mailingApartmentType: "",
        mailingCity: "",
        mailingState: "",
        mailingZipCode: "",
        mailingCountry: "",
        company: "Tech Corp",
        referral: "Online Search",
        policies: ["Life Insurance", "Auto Insurance"],
        notes: "",
      });
    } catch (error) {
      console.error("Failed to fetch family management stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const familyTree = primaryCustomer
    ? generateFamilyTree([primaryCustomer])
    : {
        primary: null,
        spouse: [],
        children: [],
        parents: [],
        siblings: [],
        others: [],
      };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Management Settings
          </CardTitle>
          <CardDescription>
            Manage family member data migration, merging, and policy inheritance
            across your customer base.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
            {isLoadingStats ? (
              <div className="col-span-5 flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Loading statistics...</span>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalCustomers}
                  </div>
                  <div className="text-sm text-gray-600">Total Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalFamilyMembers}
                  </div>
                  <div className="text-sm text-gray-600">Family Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.customersWithDependents}
                  </div>
                  <div className="text-sm text-gray-600">With Dependents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.totalLegacyDependents}
                  </div>
                  <div className="text-sm text-gray-600">Legacy Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.potentialDuplicates}
                  </div>
                  <div className="text-sm text-gray-600">
                    Potential Duplicates
                  </div>
                </div>
              </>
            )}
          </div>

          <MigrationSection />

          <MergeSection />

          <PolicyManagementSection
            mockFamilyMembers={primaryCustomer ? [primaryCustomer] : []}
          />

          {/* Family Tree Preview */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-4">
              Family Tree Structure
            </h3>
            <div className="space-y-3">
              {familyTree.primary && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700">Primary</Badge>
                  <span>{familyTree.primary.name}</span>
                </div>
              )}
              {familyTree.spouse.map((member, index) => (
                <div key={index} className="flex items-center gap-2 ml-4">
                  <Badge variant="outline">Spouse</Badge>
                  <span>{member.name}</span>
                </div>
              ))}
              {familyTree.children.map((member, index) => (
                <div key={index} className="flex items-center gap-2 ml-4">
                  <Badge variant="outline">Child</Badge>
                  <span>{member.name}</span>
                </div>
              ))}
              {familyTree.others.map((member, index) => (
                <div key={index} className="flex items-center gap-2 ml-4">
                  <Badge variant="outline">{member.relationship}</Badge>
                  <span>{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
