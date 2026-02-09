import { useIsMobile } from "@/hooks/use-mobile";
import { LostClientsReport } from "@/components/reports/LostClientsReport";
import { CancelledCustomersReport } from "@/components/reports/CancelledCustomersReport";
import { CustomReport } from "@/components/reports/CustomReport";
import { GeneralReport } from "@/components/reports/GeneralReport";
import { TransfersReport } from "@/components/reports/TransfersReport";
import { CustomersReport } from "@/components/reports/CustomersReport";
import { UpcomingBirthdaysReport } from "@/components/reports/UpcomingBirthdaysReport";
import { TurningAgeReport } from "@/components/reports/TurningAgeReport";
import { EffectiveDateReport } from "@/components/reports/EffectiveDateReport";

interface ReportsContentProps {
  activeTab: string;
}

export function ReportsContent({ activeTab }: ReportsContentProps) {
  const isMobile = useIsMobile();

  const renderContent = () => {
    switch (activeTab) {
      case "lost-clients":
        return <LostClientsReport />;
      case "cancelled-customers":
        return <CancelledCustomersReport />;
      case "custom-report":
        return <CustomReport />;
      case "general-report":
        return <GeneralReport />;
      case "transfers-report":
        return <TransfersReport />;
      case "customers-report":
        return <CustomersReport />;
      case "upcoming-birthdays":
        return <UpcomingBirthdaysReport />;
      case "turning-age":
        return <TurningAgeReport />;
      case "effective-date":
        return <EffectiveDateReport />;
      default:
        return <LostClientsReport />;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className={`${isMobile ? "p-4" : "p-5"} max-w-[auto]`}>
        {renderContent()}
      </div>
    </div>
  );
}
