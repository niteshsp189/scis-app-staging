
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, Users } from "lucide-react";
import { POLICY_RESTRICTIONS } from "@/services/policyEligibilityService";

interface PolicyFilterProps {
  onFilterChange: (filters: PolicyFilters) => void;
}

export interface PolicyFilters {
  category?: string;
  ageGroup?: string;
  employmentRequired?: boolean;
  incomeLevel?: string;
}

export const PolicyFilter = ({ onFilterChange }: PolicyFilterProps) => {
  const [filters, setFilters] = useState<PolicyFilters>({});

  const handleFilterChange = (key: keyof PolicyFilters, value: any) => {
    const newFilters = { ...filters, [key]: value === "all" ? undefined : value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const categories = [...new Set(POLICY_RESTRICTIONS.map(r => r.category))];
  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Policy Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount} active</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Age Group</label>
            <Select onValueChange={(value) => handleFilterChange('ageGroup', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="under-25">Under 25</SelectItem>
                <SelectItem value="25-65">25-65</SelectItem>
                <SelectItem value="over-65">Over 65</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Employment</label>
            <Select onValueChange={(value) => handleFilterChange('employmentRequired', value === "true")}>
              <SelectTrigger>
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="true">Employment Required</SelectItem>
                <SelectItem value="false">No Employment Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Income Level</label>
            <Select onValueChange={(value) => handleFilterChange('incomeLevel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Any income" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Income</SelectItem>
                <SelectItem value="low">Low Income</SelectItem>
                <SelectItem value="middle">Middle Income</SelectItem>
                <SelectItem value="high">High Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            Filtering {POLICY_RESTRICTIONS.length} policy types
          </div>
          {activeFiltersCount > 0 && (
            <button 
              onClick={() => {
                setFilters({});
                onFilterChange({});
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
