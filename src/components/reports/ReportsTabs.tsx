import { useState } from "react";
import { ReportsSidebar } from "@/components/reports/ReportsSidebar";
import { ReportsContent } from "@/components/reports/ReportsContent";
import { useIsMobile } from "@/hooks/use-mobile";

export function ReportsTabs() {
  const [activeTab, setActiveTab] = useState("lost-clients");
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4">
        <ReportsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <ReportsContent activeTab={activeTab} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[600px] max-h-[calc(100vh-12rem)] bg-white rounded-lg border">
      <ReportsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <ReportsContent activeTab={activeTab} />
    </div>
  );
}
