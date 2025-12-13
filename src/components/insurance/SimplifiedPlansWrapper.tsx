import { useState, useEffect } from "react";
import { SimplifiedPlansManagement } from "./SimplifiedPlansManagement";
import { InsuranceCompanyService, InsuranceCompany } from "@/services/insuranceCompany.service";

export function SimplifiedPlansWrapper() {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await InsuranceCompanyService.getAll();
      setCompanies(response.data || []);
    } catch (error) {
      console.error("Error loading companies:", error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <SimplifiedPlansManagement 
      companies={companies} 
    />
  );
}