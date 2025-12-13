import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { useIsMobile } from "@/hooks/use-mobile";

const Settings = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? "pt-20 px-4 pb-4 space-y-4" : "p-6 space-y-6"}`}>
      <div>
        <h1
          className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold text-gray-900`}
        >
          Settings
        </h1>
        <p className="text-gray-600 text-sm">
          Manage your organization, team, and automation settings
        </p>
      </div>

      <SettingsTabs />
    </div>
  );
};

export default Settings;
