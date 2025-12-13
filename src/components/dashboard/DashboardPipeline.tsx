
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

const pipelineData = [
  { stage: "Prospect", count: 45, value: "$225,000" },
  { stage: "Qualified", count: 32, value: "$160,000" },
  { stage: "Proposal", count: 18, value: "$90,000" },
  { stage: "Negotiation", count: 12, value: "$60,000" },
  { stage: "Closed Won", count: 8, value: "$40,000" },
];

const stageColors = [
  "bg-blue-50 border-blue-200",
  "bg-cyan-50 border-cyan-200",
  "bg-purple-50 border-purple-200",
  "bg-pink-50 border-pink-200",
  "bg-emerald-50 border-emerald-200"
];

export const DashboardPipeline = () => {
  return (
    <Card className="professional-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-slate-900">
          <Target className="h-5 w-5 text-blue-600" />
          Sales Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pipelineData.map((stage, index) => (
            <div
              key={stage.stage}
              className={`flex items-center justify-between p-4 rounded-lg border ${stageColors[index]} hover:shadow-sm transition-all duration-200`}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-300" />
                <span className="font-medium text-slate-900">{stage.stage}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900">{stage.count} deals</div>
                <div className="text-sm text-slate-600">{stage.value}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
