import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Eye,
  Play,
  Undo2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  MapPin,
  Link2,
  Hash,
} from "lucide-react";
import { api } from "@/services/api";

interface PreviewData {
  total_needing_backfill: number;
  total_already_linked: number;
  relationship_breakdown?: Record<string, number>;
  address_stats?: {
    dependents_with_address: number;
    dependents_without_address: number;
    parents_with_address: number;
  };
  samples: Array<{
    dependent_id: number;
    dependent_name: string;
    parent_customer_id: number;
    parent_customer_name: string;
    relationship: string;
    reverse_relationship: string;
    parent_has_address: boolean;
    will_get_legacy_id: number;
    parent_customer_number: string;
  }>;
  sequence_info?: {
    current_max_id: number;
    current_sequence: number;
    needs_fix: boolean;
  };
}

interface ExecuteData {
  success: boolean;
  message: string;
  created: number;
  skipped: number;
  errors: string[];
  addresses_copied: number;
  relationships_created: number;
  sequence_fixed?: boolean;
}

interface RollbackPreviewData {
  success: boolean;
  dry_run: boolean;
  would_delete: number;
  would_unlink: number;
  would_delete_relationships: number;
  samples?: Array<{
    customer_id: number;
    customer_name: string;
    customer_number: string;
    dependent_id: number;
  }>;
}

interface RollbackExecuteData {
  success: boolean;
  dry_run: boolean;
  deleted: number;
  unlinked: number;
  relationships_deleted: number;
  sequence_fixed?: boolean;
  message: string;
}

export default function ConvertDependants() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [executeData, setExecuteData] = useState<ExecuteData | null>(null);
  const [rollbackPreview, setRollbackPreview] =
    useState<RollbackPreviewData | null>(null);
  const [rollbackResult, setRollbackResult] =
    useState<RollbackExecuteData | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setLoading("preview");
    setError(null);
    setExecuteData(null);
    setRollbackPreview(null);
    setRollbackResult(null);
    try {
      const response = await api.get<PreviewData>("/convert-dependant-to-customer");
      setPreviewData(response);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Preview failed"
      );
    } finally {
      setLoading(null);
    }
  };

  const handleExecute = async () => {
    setLoading("execute");
    setError(null);
    try {
      const response = await api.post<ExecuteData>("/convert-dependant-to-customer");
      setExecuteData(response);
      setPreviewData(null);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Execute failed"
      );
    } finally {
      setLoading(null);
    }
  };

  const handleRollbackPreview = async () => {
    setLoading("rollback-preview");
    setError(null);
    setRollbackResult(null);
    try {
      const response = await api.delete<RollbackPreviewData>("/convert-dependant-to-customer");
      setRollbackPreview(response);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Rollback preview failed"
      );
    } finally {
      setLoading(null);
    }
  };

  const handleRollbackExecute = async () => {
    setLoading("rollback-execute");
    setError(null);
    try {
      const response = await api.delete<RollbackExecuteData>(
        "/convert-dependant-to-customer?confirm=yes"
      );
      setRollbackResult(response);
      setRollbackPreview(null);
      setPreviewData(null);
      setExecuteData(null);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Rollback execute failed"
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Convert Dependants to Customers
        </h1>
        <p className="text-muted-foreground mt-2">
          Create customer records for dependants that don't have one yet.
          This tool copies address from parent, preserves legacy IDs, and
          creates bidirectional relationships.
        </p>
      </div>

      {/* V2 Fixes Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>V2 — Three Fixes Applied</AlertTitle>
        <AlertDescription className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            <span>
              <strong>Address:</strong> Copies all address fields from parent
              customer when dependant has none
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-purple-500" />
            <span>
              <strong>Legacy ID:</strong> Sets legacy_client_id to
              dependant's original ID (old system reference)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-green-500" />
            <span>
              <strong>Relationships:</strong> Creates bidirectional
              customer_relationships (e.g., Son ↔ Father, Spouse ↔ Spouse)
            </span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handlePreview}
          disabled={loading !== null}
          variant="outline"
          size="lg"
        >
          {loading === "preview" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          Preview
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={loading !== null || !previewData || previewData.total_needing_backfill === 0}
              size="lg"
            >
              {loading === "execute" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Execute Conversion
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Conversion</AlertDialogTitle>
              <AlertDialogDescription>
                This will create <strong>{previewData?.total_needing_backfill ?? 0}</strong>{" "}
                new customer records from dependants, copy addresses from
                parents, set legacy IDs, and create bidirectional
                relationships.
                <br /><br />
                This action can be rolled back using the Rollback button.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleExecute}>
                Yes, Execute
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="border-l mx-1" />

        <Button
          onClick={handleRollbackPreview}
          disabled={loading !== null}
          variant="outline"
          size="lg"
          className="text-orange-600 border-orange-300 hover:bg-orange-50"
        >
          {loading === "rollback-preview" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Undo2 className="mr-2 h-4 w-4" />
          )}
          Rollback Preview
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={loading !== null || !rollbackPreview || rollbackPreview.would_delete === 0}
              variant="destructive"
              size="lg"
            >
              {loading === "rollback-execute" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Undo2 className="mr-2 h-4 w-4" />
              )}
              Rollback Execute
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                Confirm Rollback
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will <strong>permanently delete</strong>{" "}
                {rollbackPreview?.would_delete ?? 0} customer records,{" "}
                {rollbackPreview?.would_delete_relationships ?? 0} relationship
                records, and unlink {rollbackPreview?.would_unlink ?? 0}{" "}
                dependants.
                <br /><br />
                <strong className="text-destructive">
                  This cannot be undone. Make sure you have a database backup.
                </strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRollbackExecute}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Rollback Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Execute Results */}
      {executeData && (
        <Alert
          variant={executeData.success ? "default" : "destructive"}
          className={executeData.success ? "border-green-300 bg-green-50" : ""}
        >
          <CheckCircle2
            className={`h-4 w-4 ${executeData.success ? "text-green-600" : ""}`}
          />
          <AlertTitle>
            {executeData.success ? "Conversion Complete" : "Conversion Failed"}
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-1">
            <p>{executeData.message}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-2xl font-bold text-green-600">
                  {executeData.created}
                </div>
                <div className="text-xs text-muted-foreground">
                  Customers Created
                </div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-2xl font-bold text-blue-600">
                  {executeData.addresses_copied}
                </div>
                <div className="text-xs text-muted-foreground">
                  Addresses Copied
                </div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-2xl font-bold text-purple-600">
                  {executeData.relationships_created}
                </div>
                <div className="text-xs text-muted-foreground">
                  Relationships Created
                </div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-2xl font-bold text-gray-400">
                  {executeData.skipped}
                </div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
            </div>
            {executeData.errors.length > 0 && (
              <div className="mt-3">
                <strong>Errors:</strong>
                <ul className="list-disc list-inside text-sm mt-1">
                  {executeData.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Rollback Preview Results */}
      {rollbackPreview && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Undo2 className="h-5 w-5" />
              Rollback Preview (Dry Run)
            </CardTitle>
            <CardDescription>
              No changes have been made. Review what will be affected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-orange-50 rounded border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {rollbackPreview.would_delete}
                </div>
                <div className="text-xs text-muted-foreground">
                  Customers to Delete
                </div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {rollbackPreview.would_delete_relationships}
                </div>
                <div className="text-xs text-muted-foreground">
                  Relationships to Delete
                </div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {rollbackPreview.would_unlink}
                </div>
                <div className="text-xs text-muted-foreground">
                  Dependants to Unlink
                </div>
              </div>
            </div>

            {rollbackPreview.samples && rollbackPreview.samples.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Sample records that will be deleted:
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Customer #</TableHead>
                      <TableHead>Dependent ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rollbackPreview.samples.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell>{s.customer_id}</TableCell>
                        <TableCell>{s.customer_name}</TableCell>
                        <TableCell>
                          <code className="text-xs">{s.customer_number}</code>
                        </TableCell>
                        <TableCell>{s.dependent_id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rollback Execute Results */}
      {rollbackResult && (
        <Alert
          variant={rollbackResult.success ? "default" : "destructive"}
          className={rollbackResult.success ? "border-green-300 bg-green-50" : ""}
        >
          <CheckCircle2
            className={`h-4 w-4 ${rollbackResult.success ? "text-green-600" : ""}`}
          />
          <AlertTitle>
            {rollbackResult.success
              ? "Rollback Complete"
              : "Rollback Failed"}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p>{rollbackResult.message}</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-2xl font-bold text-red-600">
                  {rollbackResult.deleted}
                </div>
                <div className="text-xs text-muted-foreground">
                  Customers Deleted
                </div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-2xl font-bold text-red-600">
                  {rollbackResult.relationships_deleted}
                </div>
                <div className="text-xs text-muted-foreground">
                  Relationships Deleted
                </div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-2xl font-bold text-orange-600">
                  {rollbackResult.unlinked}
                </div>
                <div className="text-xs text-muted-foreground">
                  Dependants Unlinked
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Results */}
      {previewData && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {previewData.total_needing_backfill}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Need Conversion
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {previewData.total_already_linked}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Already Linked
                </p>
              </CardContent>
            </Card>
            {previewData.address_stats && (
              <>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {previewData.address_stats.parents_with_address}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Parents With Address
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-orange-500">
                      {previewData.address_stats.dependents_without_address}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Will Get Parent's Address
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Relationship Breakdown */}
          {previewData.relationship_breakdown &&
            Object.keys(previewData.relationship_breakdown).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Relationship Breakdown
                  </CardTitle>
                  <CardDescription>
                    Types of relationships that will be created (bidirectional)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(previewData.relationship_breakdown)
                      .sort(([, a], [, b]) => b - a)
                      .map(([type, count]) => (
                        <Badge key={type} variant="secondary" className="text-sm">
                          {type}: {count}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Sequence Info */}
          {previewData.sequence_info && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sequence Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    Max ID: <strong>{previewData.sequence_info.current_max_id}</strong>
                  </span>
                  <span>
                    Sequence at: <strong>{previewData.sequence_info.current_sequence}</strong>
                  </span>
                  {previewData.sequence_info.needs_fix ? (
                    <Badge variant="destructive">Needs Fix (will auto-fix)</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100">OK</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sample Table */}
          {previewData.samples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Sample Records (first {previewData.samples.length})
                </CardTitle>
                <CardDescription>
                  Preview of dependants that will be converted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dep. ID</TableHead>
                        <TableHead>Dependant Name</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Relationship</TableHead>
                        <TableHead>Reverse</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Legacy ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.samples.map((s, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">
                            {s.dependent_id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {s.dependent_name}
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground text-xs">
                              #{s.parent_customer_id}
                            </span>{" "}
                            {s.parent_customer_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{s.relationship}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-green-300 text-green-700"
                            >
                              {s.reverse_relationship || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {s.parent_has_address ? (
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                <MapPin className="h-3 w-3 mr-1" />
                                From Parent
                              </Badge>
                            ) : (
                              <Badge variant="secondary">None</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {s.will_get_legacy_id}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
