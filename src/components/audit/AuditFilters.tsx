import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLogFilters, FilterOptions } from "@/types/audit";
import { Search, Filter, X } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";

interface AuditFiltersProps {
  filters: AuditLogFilters;
  filterOptions: FilterOptions;
  onFilterChange: (filters: Partial<AuditLogFilters>) => void;
  loading: boolean;
}

export function AuditFilters({ 
  filters, 
  filterOptions, 
  onFilterChange, 
  loading 
}: AuditFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AuditLogFilters>(filters);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync selectedActions with incoming filters
  useEffect(() => {
    if (filters.event) {
      const actions = filters.event.split(',').map(a => a.trim());
      setSelectedActions(actions);
    } else {
      setSelectedActions([]);
    }
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof AuditLogFilters, value: string | undefined) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleActionChange = (action: string, checked: boolean) => {
    let newSelectedActions: string[];
    if (checked) {
      newSelectedActions = [...selectedActions, action];
    } else {
      newSelectedActions = selectedActions.filter(a => a !== action);
    }
    
    // Check if the resulting action string would be too long (preventive measure)
    const actionString = newSelectedActions.join(',');
    if (actionString.length > 450) { // Leave some buffer before the 500 character limit
      // Don't allow this selection if it would exceed the limit
      return;
    }
    
    setSelectedActions(newSelectedActions);
    
    // Update the filters with comma-separated actions
    const newFilters = { 
      ...localFilters, 
      event: newSelectedActions.length > 0 ? actionString : undefined 
    };
    setLocalFilters(newFilters);
    
    // Immediately apply the filter change for checkboxes
    onFilterChange(newFilters);
  };

  const isActionDisabled = (action: string): boolean => {
    if (selectedActions.includes(action)) {
      return false; // Always allow deselection
    }
    
    // Check if adding this action would exceed the limit
    const wouldExceedLimit = [...selectedActions, action].join(',').length > 450;
    return wouldExceedLimit;
  };

  // Ensure default actions are properly initialized when filter options are loaded
  // This ensures the checkboxes reflect the initial filter state
  useEffect(() => {
    const actions = filterOptions?.actions || [];
    
    // If we have filter options but selectedActions haven't been set from initial filters yet
    if (actions.length > 0 && selectedActions.length === 0 && filters.event) {
      const defaultActions = filters.event.split(',').map(a => a.trim());
      setSelectedActions(defaultActions);
    }
    // Only run when filter options change or when filters.event changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOptions?.actions, filters.event]);

  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters: AuditLogFilters = {
      per_page: 15,
      page: 1,
      sort_by: 'created_at',
      sort_direction: 'desc',
      search: undefined,
      user_id: undefined,
      event: undefined,
      auditable_type: undefined,
      start_date: undefined,
      end_date: undefined,
      ip_address: undefined,
    };
    setLocalFilters(clearedFilters);
    setSelectedActions([]);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = Object.entries(localFilters).some(([key, value]) => 
    !['per_page', 'page', 'sort_by', 'sort_direction'].includes(key) && 
    value !== undefined && 
    value !== null && 
    value !== ''
  ) || selectedActions.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="border border-primary self-start sm:self-auto"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search descriptions, actions, or model types..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            onClick={applyFilters}
            disabled={loading}
            size="sm"
          >
            Search
          </Button>
        </div>

        {isExpanded && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* User Filter */}
            <div className="space-y-2">
              <Label htmlFor="user">Staff Member</Label>
              <Select
                value={localFilters.user_id || "all"}
                onValueChange={(value) => handleFilterChange('user_id', value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All staff</SelectItem>
                  {filterOptions?.users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {/* Priority actions at the top */}
                {filterOptions?.actions?.filter(action => ['created', 'updated', 'deleted'].includes(action)).map((action) => (
                  <div key={action} className="flex items-center space-x-2">
                    <Checkbox
                      id={`action-${action}`}
                      checked={selectedActions.includes(action)}
                      disabled={isActionDisabled(action)}
                      onCheckedChange={(checked) => handleActionChange(action, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`action-${action}`} 
                      className={`text-sm font-normal cursor-pointer ${isActionDisabled(action) ? 'opacity-50' : ''}`}
                    >
                      {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
                
                {/* Separator if there are other actions */}
                {filterOptions?.actions?.some(action => !['created', 'updated', 'deleted'].includes(action)) && (
                  <div className="border-t my-2"></div>
                )}
                
                {/* Other actions */}
                {filterOptions?.actions?.filter(action => !['created', 'updated', 'deleted'].includes(action)).map((action) => (
                  <div key={action} className="flex items-center space-x-2">
                    <Checkbox
                      id={`action-${action}`}
                      checked={selectedActions.includes(action)}
                      disabled={isActionDisabled(action)}
                      onCheckedChange={(checked) => handleActionChange(action, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`action-${action}`} 
                      className={`text-sm font-normal cursor-pointer ${isActionDisabled(action) ? 'opacity-50' : ''}`}
                    >
                      {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedActions.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{selectedActions.length} action{selectedActions.length !== 1 ? 's' : ''} selected</p>
                  {selectedActions.join(',').length > 350 && (
                    <p className="text-amber-600">
                      ⚠️ Many actions selected. Consider fewer selections for better performance.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Model Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="model-type">Model Type</Label>
              <Select
                value={localFilters.auditable_type || "all"}
                onValueChange={(value) => handleFilterChange('auditable_type', value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All models</SelectItem>
                  {filterOptions?.model_types?.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <DateInput
                id="start-date"
                value={localFilters.start_date || ''}
                onChange={(value) => handleFilterChange('start_date', value || undefined)}
                placeholder="Select start date"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <DateInput
                id="end-date"
                value={localFilters.end_date || ''}
                onChange={(value) => handleFilterChange('end_date', value || undefined)}
                placeholder="Select end date"
              />
            </div>

            {/* IP Address */}
            <div className="space-y-2">
              <Label htmlFor="ip-address">IP Address</Label>
              <Input
                id="ip-address"
                placeholder="192.168.1.1"
                value={localFilters.ip_address || ''}
                onChange={(e) => handleFilterChange('ip_address', e.target.value || undefined)}
              />
            </div>

            {/* Per Page */}
            <div className="space-y-2">
              <Label htmlFor="per-page">Results per page</Label>
              <Select
                value={localFilters.per_page?.toString() || "15"}
                onValueChange={(value) => handleFilterChange('per_page', parseInt(value) as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Button
              onClick={applyFilters}
              disabled={loading}
              size="sm"
            >
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={loading}
                size="sm"
                className="flex items-center space-x-1"
              >
                <X className="h-4 w-4" />
                <span>Clear</span>
              </Button>
            )}
          </div>
          
          {hasActiveFilters && (
            <span className="text-sm text-muted-foreground text-center sm:text-right">
              {Object.entries(localFilters).filter(([key, value]) => 
                !['per_page', 'page', 'sort_by', 'sort_direction'].includes(key) && 
                value !== undefined && 
                value !== null && 
                value !== ''
              ).length + (selectedActions.length > 0 ? 1 : 0)} active filter(s)
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
