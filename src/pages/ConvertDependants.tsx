import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Play, Eye, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { api } from "@/services/api";
import { useNavigate } from "react-router-dom";

interface BackfillStats {
  total_dependents: number;
  already_linked: number;
  need_backfill: number;
  total_customers: number;
}

interface SequenceInfo {
  current_sequence?: number;
  max_customer_id?: number;
  needs_fix?: boolean;
  fixed?: boolean;
  old_value?: number;
  new_value?: number;
  message?: string;
  error?: string;
}

interface PreviewResponse {
  success: boolean;
  mode: string;
  message: string;
  stats: BackfillStats;
  sequence: SequenceInfo;
  samples: Array<{
    dependent_id: number;
    name: string;
    email: string | null;
    status: string;
    parent_customer: number;
  }>;
}

interface ExecuteResponse {
  success: boolean;
  message: string;
  created?: number;
  errors?: number;
  remaining?: number;
  stats: BackfillStats;
  sequence_fix?: SequenceInfo;
  error_details?: Array<{ dependent_id: number; error: string }>;
}

export default function ConvertDependantsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [result, setResult] = useState<ExecuteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.get<PreviewResponse>("/convert-dependant-to-customer");
      setPreview(data);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch preview");
    } finally {
      setLoading(false);
    }
  };

  const executeBackfill = async () => {
    if (!confirm(`This will create ${preview?.stats.need_backfill || 0} new Customer records. Are you sure?`)) {
      return;
    }
    setExecuting(true);
    setError(null);
    try {
      const data = await api.post<ExecuteResponse>("/convert-dependant-to-customer");
      setResult(data);
      // Refresh preview to show updated stats
      const updated = await api.get<PreviewResponse>("/convert-dependant-to-customer");
      setPreview(updated);
    } catch (err: any) {
      setError(err?.message || "Failed to execute backfill");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Convert Dependants to Customers</CardTitle>
          <CardDescription>
            Creates Customer records for all dependents that don't have one yet. 
            This is idempotent — safe to run multiple times. Only processes dependents 
            where <code>related_customer_id</code> is NULL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={fetchPreview} disabled={loading || executing} variant="outline">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Preview (Dry Run)
            </Button>
            <Button
              onClick={executeBackfill}
              disabled={executing || loading || !preview || preview.stats.need_backfill === 0}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              {executing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Execute Backfill
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview Stats */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Statistics
              <Badge variant={preview.stats.need_backfill === 0 ? "default" : "destructive"}>
                {preview.stats.need_backfill === 0 ? "All Linked" : `${preview.stats.need_backfill} Need Backfill`}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Dependents" value={preview.stats.total_dependents} />
              <StatCard label="Already Linked" value={preview.stats.already_linked} color="green" />
              <StatCard label="Need Backfill" value={preview.stats.need_backfill} color={preview.stats.need_backfill > 0 ? "red" : "green"} />
              <StatCard label="Total Customers" value={preview.stats.total_customers} />
            </div>

            {/* Sequence Info */}
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm mb-1">PostgreSQL Sequence</h4>
              {preview.sequence.error ? (
                <p className="text-sm text-red-500">{preview.sequence.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sequence: <strong>{preview.sequence.current_sequence}</strong> | 
                  Max ID: <strong>{preview.sequence.max_customer_id}</strong> | 
                  Status: {preview.sequence.needs_fix 
                    ? <Badge variant="destructive" className="ml-1">Needs Fix</Badge>
                    : <Badge variant="default" className="ml-1">OK</Badge>
                  }
                </p>
              )}
            </div>

            {/* Sample Dependents */}
            {preview.samples && preview.samples.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2">Sample Dependents (first 10)</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Dep ID</th>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Parent Customer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.samples.map((s) => (
                        <tr key={s.dependent_id} className="border-t">
                          <td className="p-2">{s.dependent_id}</td>
                          <td className="p-2 font-medium">{s.name}</td>
                          <td className="p-2 text-muted-foreground">{s.email || "—"}</td>
                          <td className="p-2"><Badge variant="outline">{s.status}</Badge></td>
                          <td className="p-2">{s.parent_customer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Execution Result */}
      {result && (
        <Card className={result.success ? "border-green-500" : "border-red-500"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              Execution Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{result.message}</p>
            
            <div className="grid grid-cols-3 gap-4">
              {result.created !== undefined && (
                <StatCard label="Created" value={result.created} color="green" />
              )}
              {result.errors !== undefined && (
                <StatCard label="Errors" value={result.errors} color={result.errors > 0 ? "red" : "green"} />
              )}
              {result.remaining !== undefined && (
                <StatCard label="Still Remaining" value={result.remaining} color={result.remaining > 0 ? "red" : "green"} />
              )}
            </div>

            {/* Sequence Fix Info */}
            {result.sequence_fix && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  Sequence: {result.sequence_fix.fixed 
                    ? `Fixed from ${result.sequence_fix.old_value} → ${result.sequence_fix.new_value}` 
                    : result.sequence_fix.message || "No fix needed"
                  }
                </p>
              </div>
            )}

            {/* Error Details */}
            {result.error_details && result.error_details.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-sm mb-2 text-red-600">Error Details</h4>
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="p-2 text-left">Dependent ID</th>
                        <th className="p-2 text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.error_details.map((e, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{e.dependent_id}</td>
                          <td className="p-2 text-red-600 text-xs">{e.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const colorClass = color === "green" 
    ? "text-green-600" 
    : color === "red" 
    ? "text-red-600" 
    : "text-foreground";

  return (
    <div className="p-3 bg-muted rounded-lg text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value.toLocaleString()}</p>
    </div>
  );
}
