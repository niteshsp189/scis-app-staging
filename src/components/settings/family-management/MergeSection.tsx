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
  Merge,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Users,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  familyManagementSettingsService,
  DuplicateAnalysisResult,
  MergeProgressResult,
} from "@/services/familyManagementSettingsService";

export const MergeSection = () => {
  const [duplicateAnalysis, setDuplicateAnalysis] =
    useState<DuplicateAnalysisResult | null>(null);
  const [mergeResult, setMergeResult] = useState<MergeProgressResult | null>(
    null,
  );
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  useEffect(() => {
    if (isMergeOpen && !hasAnalyzed) {
      analyzeDuplicates();
    }
  }, [isMergeOpen, hasAnalyzed]);

  const analyzeDuplicates = async () => {
    setIsAnalyzing(true);
    try {
      const analysis =
        await familyManagementSettingsService.analyzeDuplicateFamilyMembers();
      setDuplicateAnalysis(analysis);
      setHasAnalyzed(true);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze duplicate family members.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMerge = async () => {
    if (!duplicateAnalysis) return;

    setIsMerging(true);
    try {
      // Create backup before merging
      await familyManagementSettingsService.backupFamilyData();

      const result =
        await familyManagementSettingsService.mergeDuplicateFamilyMembers(
          duplicateAnalysis.potentialDuplicates,
        );
      setMergeResult(result);

      toast({
        title: "Merge Complete",
        description: `Successfully merged ${result.totalMerged} duplicate records from ${result.processedGroups} groups`,
      });

      // Re-analyze after merge to update the list
      await analyzeDuplicates();
    } catch (error) {
      toast({
        title: "Merge Failed",
        description: "Failed to merge duplicate family members.",
        variant: "destructive",
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsMergeOpen(open);
    if (!open) {
      setMergeResult(null);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">Duplicate Merging</h3>
          <p className="text-sm text-gray-600">
            Find and merge duplicate family member records
          </p>
        </div>
        <Dialog open={isMergeOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Merge className="h-4 w-4" />
              Merge Duplicates
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Merge Duplicate Family Members</DialogTitle>
              <DialogDescription>
                This will find family members with similar names and merge their
                information. A backup will be created automatically before
                merging.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {isAnalyzing && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
                  <p className="font-medium">Analyzing Family Members...</p>
                  <p className="text-sm text-gray-600">
                    This may take a moment for large datasets.
                  </p>
                </div>
              )}

              {duplicateAnalysis && !isAnalyzing && (
                <>
                  {/* Analysis Summary */}
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Analysis Summary</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        Total Family Members:{" "}
                        {duplicateAnalysis.totalFamilyMembers}
                      </div>
                      <div>
                        Duplicate Groups:{" "}
                        {duplicateAnalysis.potentialDuplicates.length}
                      </div>
                      <div>
                        Records to Merge: {duplicateAnalysis.duplicatesCount}
                      </div>
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">Warning</span>
                    </div>
                    <p className="text-sm">
                      This action will permanently merge duplicate records. The
                      primary record will be kept and duplicates will be
                      deleted. A backup is created automatically.
                    </p>
                  </div>

                  {/* Duplicate Groups Preview */}
                  {duplicateAnalysis.potentialDuplicates.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-3">
                        Potential Duplicate Groups
                      </h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {duplicateAnalysis.potentialDuplicates.map(
                          (group, index) => (
                            <div
                              key={index}
                              className="border rounded-lg p-3 bg-gray-50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                  {group.groupName}
                                </span>
                                <Badge variant="outline">
                                  {group.members.length} records
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {group.members.map((member, memberIndex) => (
                                  <div
                                    key={member.id}
                                    className={`flex items-center justify-between p-2 rounded text-sm ${
                                      memberIndex === 0
                                        ? "bg-green-100 border border-green-200"
                                        : "bg-red-100 border border-red-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1">
                                        {memberIndex === 0 ? (
                                          <CheckCircle className="h-3 w-3 text-green-600" />
                                        ) : (
                                          <Trash2 className="h-3 w-3 text-red-600" />
                                        )}
                                        <span className="font-medium">
                                          {memberIndex === 0
                                            ? "Keep"
                                            : "Delete"}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="font-medium">
                                          {member.name}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          Customer: {member.customerName} •{" "}
                                          {member.relationship}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right text-xs text-gray-500">
                                      {member.email && (
                                        <div>{member.email}</div>
                                      )}
                                      {member.phone && (
                                        <div>{member.phone}</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="font-medium">No Duplicates Found</p>
                      <p className="text-sm text-gray-600">
                        All family member records appear to be unique.
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  {duplicateAnalysis.potentialDuplicates.length > 0 && (
                    <Button
                      onClick={handleMerge}
                      className="w-full"
                      disabled={isMerging}
                      variant="destructive"
                    >
                      {isMerging ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Merging Duplicates...
                        </>
                      ) : (
                        `Merge ${duplicateAnalysis.duplicatesCount} Duplicate Records`
                      )}
                    </Button>
                  )}
                </>
              )}

              {/* Merge Results */}
              {mergeResult && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Merge Results</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        Groups Processed: {mergeResult.processedGroups}/
                        {mergeResult.totalGroups}
                      </div>
                      <div>Records Merged: {mergeResult.totalMerged}</div>
                    </div>
                  </div>

                  {mergeResult.conflicts.length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">
                          Conflicts ({mergeResult.conflicts.length})
                        </span>
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        {mergeResult.conflicts
                          .slice(0, 5)
                          .map((conflict, index) => (
                            <p key={index} className="text-sm text-yellow-700">
                              {conflict}
                            </p>
                          ))}
                        {mergeResult.conflicts.length > 5 && (
                          <p className="text-sm text-yellow-600 mt-1">
                            ... and {mergeResult.conflicts.length - 5} more
                            conflicts
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {mergeResult.errors.length > 0 && (
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="font-medium">
                          Errors ({mergeResult.errors.length})
                        </span>
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        {mergeResult.errors.slice(0, 5).map((error, index) => (
                          <p key={index} className="text-sm text-red-700">
                            {error}
                          </p>
                        ))}
                        {mergeResult.errors.length > 5 && (
                          <p className="text-sm text-red-600 mt-1">
                            ... and {mergeResult.errors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Refresh Analysis Button */}
              {hasAnalyzed && !isAnalyzing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setHasAnalyzed(false);
                    setDuplicateAnalysis(null);
                    setMergeResult(null);
                  }}
                  className="w-full"
                >
                  <Merge className="h-4 w-4 mr-2" />
                  Re-analyze for Duplicates
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
