import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  familyManagementSettingsService,
  LegacyDependentSummary,
  MigrationProgressResult,
} from "@/services/familyManagementSettingsService";

export const MigrationSection = () => {
  const [legacyDependents, setLegacyDependents] = useState<
    LegacyDependentSummary[]
  >([]);
  const [migrationResult, setMigrationResult] =
    useState<MigrationProgressResult | null>(null);
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    customersWithDependents: 0,
    totalLegacyDependents: 0,
  });

  useEffect(() => {
    fetchLegacyDependents();
    fetchStats();
  }, []);

  const fetchLegacyDependents = async () => {
    setIsLoading(true);
    try {
      const data =
        await familyManagementSettingsService.getLegacyDependentsSummary();
      setLegacyDependents(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch legacy dependents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data =
        await familyManagementSettingsService.getFamilyManagementStats();
      setStats({
        totalCustomers: data.totalCustomers,
        customersWithDependents: data.customersWithDependents,
        totalLegacyDependents: data.totalLegacyDependents,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      // Create backup before migration
      await familyManagementSettingsService.backupFamilyData();

      const result =
        await familyManagementSettingsService.migrateAllLegacyDependents();
      setMigrationResult(result);

      toast({
        title: "Migration Complete",
        description: `Successfully migrated ${result.migratedDependents} dependents from ${result.processedCustomers} customers`,
      });

      // Refresh data after migration
      await fetchLegacyDependents();
      await fetchStats();
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: "Failed to migrate legacy dependents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const totalDependentsToMigrate = legacyDependents.reduce(
    (total, customer) => total + customer.dependents.length,
    0,
  );

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">Legacy Data Migration</h3>
          <p className="text-sm text-gray-600">
            Convert old dependent records to full family member profiles
          </p>
          {!isLoading && (
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>
                {stats.customersWithDependents} customers with dependents
              </span>
              <span>{stats.totalLegacyDependents} total legacy dependents</span>
            </div>
          )}
        </div>
        <Dialog open={isMigrationOpen} onOpenChange={setIsMigrationOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              disabled={isLoading || totalDependentsToMigrate === 0}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Migrate Dependents
              {totalDependentsToMigrate > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalDependentsToMigrate}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Migrate Legacy Dependents</DialogTitle>
              <DialogDescription>
                This will convert dependent records to full family member
                profiles with complete information tracking. A backup will be
                created automatically before migration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {totalDependentsToMigrate === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="font-medium">No Legacy Dependents Found</p>
                  <p className="text-sm text-gray-600">
                    All dependents have already been migrated to family members.
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Migration Summary</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Customers: {legacyDependents.length}</div>
                      <div>Total Dependents: {totalDependentsToMigrate}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">
                      Preview: Customers with Legacy Dependents
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {legacyDependents.slice(0, 10).map((customer, index) => (
                        <div
                          key={customer.customerId}
                          className="p-3 bg-gray-50 rounded"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {customer.customerName}
                            </span>
                            <Badge variant="outline">
                              {customer.dependents.length} dependents
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {customer.dependents.map((dep, depIndex) => (
                              <div
                                key={depIndex}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Badge variant="secondary" className="text-xs">
                                  {dep.relationship}
                                </Badge>
                                <span>{dep.name}</span>
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                <span className="text-green-600">
                                  Full Profile
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {legacyDependents.length > 10 && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          ... and {legacyDependents.length - 10} more customers
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleMigration}
                    className="w-full"
                    disabled={isMigrating}
                  >
                    {isMigrating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Migrating...
                      </>
                    ) : (
                      "Start Migration"
                    )}
                  </Button>
                </>
              )}

              {migrationResult && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Migration Results</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        Customers Processed:{" "}
                        {migrationResult.processedCustomers}/
                        {migrationResult.totalCustomers}
                      </div>
                      <div>
                        Dependents Migrated:{" "}
                        {migrationResult.migratedDependents}
                      </div>
                      <div>
                        Dependents Skipped: {migrationResult.skippedDependents}
                      </div>
                      <div>
                        Total Dependents: {migrationResult.totalDependents}
                      </div>
                    </div>
                  </div>

                  {migrationResult.errors.length > 0 && (
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium">
                          Errors ({migrationResult.errors.length})
                        </span>
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        {migrationResult.errors
                          .slice(0, 5)
                          .map((error, index) => (
                            <p key={index} className="text-sm text-red-700">
                              {error}
                            </p>
                          ))}
                        {migrationResult.errors.length > 5 && (
                          <p className="text-sm text-red-600 mt-1">
                            ... and {migrationResult.errors.length - 5} more
                            errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
