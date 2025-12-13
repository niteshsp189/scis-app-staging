import { useState } from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsContent } from "@/components/settings/SettingsContent";
import { useIsMobile } from "@/hooks/use-mobile";

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("organization");
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4">
        <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <SettingsContent activeTab={activeTab} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[600px] max-h-[calc(100vh-12rem)] bg-white rounded-lg border">
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <SettingsContent activeTab={activeTab} />
    </div>
  );
}
