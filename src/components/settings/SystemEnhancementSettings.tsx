import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  Database, 
  HardDrive, 
  Download, 
  Loader2, 
  RefreshCw,
  FileText,
  Server,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/services/api";

interface SystemInfo {
  success: boolean;
  cache_types: Record<string, string>;
  cache_stats: {
    config_cached: boolean;
    routes_cached: boolean;
    views_cached: boolean;
  };
  database_tables: string[];
  export_formats: string[];
  user_permissions: {
    can_clear_cache: boolean;
    can_export_database: boolean;
  };
}

export function SystemEnhancementSettings() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [exportingDatabase, setExportingDatabase] = useState(false);
  
  // Cache clearing state
  const [selectedCacheTypes, setSelectedCacheTypes] = useState<string[]>(['all']);
  
  // Database export state
  const [exportType, setExportType] = useState<'full' | 'structure_only' | 'data_only'>('full');
  const [exportFormat, setExportFormat] = useState<'sql' | 'json' | 'csv'>('sql');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectAllTables, setSelectAllTables] = useState(false);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      setLoading(true);
      const response = await api.system.getInfo();

      if (response.success) {
        // The response data is directly in the response object, not in a nested data property
        setSystemInfo(response);
        
      } else {
        throw new Error(response.message || 'Failed to load system information');
      }
    } catch (error: any) {
      console.error("Failed to load system info:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load system information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      setClearingCache(true);
      
      const response = await api.system.clearCache(selectedCacheTypes);
      
      if (response.success) {
        toast({
          title: "Cache Cleared",
          description: `Successfully cleared: ${response.cleared_types.join(', ')}`,
        });
        
        // Reload system info to get updated cache stats
        await loadSystemInfo();
      } else {
        throw new Error(response.message || 'Failed to clear cache');
      }
    } catch (error: any) {
      console.error("Failed to clear cache:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear cache",
        variant: "destructive",
      });
    } finally {
      setClearingCache(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      setExportingDatabase(true);
      
      const response = await api.system.exportDatabase({
        export_type: exportType,
        format: exportFormat,
        tables: selectedTables.length > 0 ? selectedTables : undefined
      });
      
      if (response.success) {
        toast({
          title: "Database Export Complete",
          description: `Export file: ${response.filename} (${response.file_size})`,
        });
        
        // Automatically download the file
        if (response.filename) {
          try {
            const blob = await api.system.downloadExport(response.filename);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } catch (downloadError) {
            console.warn('Auto-download failed:', downloadError);
            toast({
              title: "Download Ready",
              description: "Export completed. Please use the download link provided.",
            });
          }
        }
      } else {
        throw new Error(response.message || 'Failed to export database');
      }
    } catch (error: any) {
      console.error("Failed to export database:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to export database",
        variant: "destructive",
      });
    } finally {
      setExportingDatabase(false);
    }
  };

  const handleCacheTypeChange = (cacheType: string, checked: boolean) => {
    if (cacheType === 'all') {
      setSelectedCacheTypes(checked ? ['all'] : []);
    } else {
      const newTypes = checked 
        ? [...selectedCacheTypes.filter(t => t !== 'all'), cacheType]
        : selectedCacheTypes.filter(t => t !== cacheType);
      setSelectedCacheTypes(newTypes);
    }
  };

  const handleTableSelectionChange = (table: string, checked: boolean) => {
    const newTables = checked 
      ? [...selectedTables, table]
      : selectedTables.filter(t => t !== table);
    setSelectedTables(newTables);
    setSelectAllTables(false);
  };

  const handleSelectAllTables = (checked: boolean) => {
    if (checked && systemInfo) {
      setSelectedTables(systemInfo.database_tables);
    } else {
      setSelectedTables([]);
    }
    setSelectAllTables(checked);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Enhancement
          </CardTitle>
          <CardDescription>
            System maintenance and database management tools
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading system information...</span>
        </CardContent>
      </Card>
    );
  }

  // Check if user has any system tool permissions
  const canClearCache = systemInfo?.user_permissions?.can_clear_cache || false;
  const canExportDatabase = systemInfo?.user_permissions?.can_export_database || false;

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading system tools...</span>
      </div>
    );
  }

  // If user has no permissions for either feature, don't render the component
  if (!canClearCache && !canExportDatabase) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Cache Management - Only show if user has clear_cache permission */}
      {canClearCache && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Cache Management
            </CardTitle>
            <CardDescription>
              Clear application cache to improve performance and resolve issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cache Status */}
            {systemInfo && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {systemInfo.cache_stats.config_cached ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-sm">Config Cache</span>
                </div>
                <div className="flex items-center gap-2">
                  {systemInfo.cache_stats.routes_cached ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-sm">Route Cache</span>
                </div>
                <div className="flex items-center gap-2">
                  {systemInfo.cache_stats.views_cached ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-sm">View Cache</span>
                </div>
              </div>
            )}

            {/* Cache Type Selection */}
            <div>
              <Label className="text-base font-medium">Cache Types to Clear</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {systemInfo && Object.entries(systemInfo.cache_types).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cache-${key}`}
                      checked={selectedCacheTypes.includes(key)}
                      onCheckedChange={(checked) => handleCacheTypeChange(key, checked as boolean)}
                    />
                    <Label htmlFor={`cache-${key}`} className="text-sm">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleClearCache} 
              disabled={clearingCache || selectedCacheTypes.length === 0}
              className="w-full md:w-auto"
            >
              {clearingCache && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear Selected Cache
            </Button>
          </CardContent>
        </Card>
      )}

{/* Database Export - Only show if user has export_database permission */}
      {canExportDatabase && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Export (PostgreSQL)
            </CardTitle>
            <CardDescription>
              Export PostgreSQL database with full structure, constraints, and data for backup, migration, or analysis purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="export-type">Export Type</Label>
                <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Database (Structure + Data)</SelectItem>
                    <SelectItem value="structure_only">Structure Only</SelectItem>
                    <SelectItem value="data_only">Data Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="export-format">Export Format</Label>
                <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(systemInfo?.export_formats || ['sql', 'json', 'csv']).map(format => (
                      <SelectItem key={format} value={format}>
                        {format.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-medium">Table Selection (Optional)</Label>
              <p className="text-sm text-gray-500 mb-3">
                Leave empty to export all tables, or select specific tables below
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-tables"
                    checked={selectAllTables}
                    onCheckedChange={handleSelectAllTables}
                  />
                  <Label htmlFor="select-all-tables" className="font-medium">
                    Select All Tables
                  </Label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {systemInfo && systemInfo.database_tables.map(table => (
                    <div key={table} className="flex items-center space-x-2">
                      <Checkbox
                        id={`table-${table}`}
                        checked={selectedTables.includes(table)}
                        onCheckedChange={(checked) => handleTableSelectionChange(table, checked as boolean)}
                      />
                      <Label htmlFor={`table-${table}`} className="text-sm">
                        {table}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              onClick={handleExportDatabase} 
              disabled={exportingDatabase}
              className="w-full md:w-auto"
            >
              {exportingDatabase && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Download className="mr-2 h-4 w-4" />
              Export Database
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
