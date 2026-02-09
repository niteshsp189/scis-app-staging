import { Routes, Route, Navigate } from "react-router-dom";
import { LostClientsReport } from "@/components/reports/LostClientsReport";
import { CancelledCustomersReport } from "@/components/reports/CancelledCustomersReport";
import { TransfersReport } from "@/components/reports/TransfersReport";
import { CustomReport } from "@/components/reports/CustomReport";
import { GeneralReport } from "@/components/reports/GeneralReport";
import { CustomersReport } from "@/components/reports/CustomersReport";
import { UpcomingBirthdaysReport } from "@/components/reports/UpcomingBirthdaysReport";
import { TurningAgeReport } from "@/components/reports/TurningAgeReport";
import { EffectiveDateReport } from "@/components/reports/EffectiveDateReport";

const Reports = () => {
  return (
    <div className="p-4 md:p-6">
      <Routes>
        <Route path="lost-clients" element={<LostClientsReport />} />
        <Route path="cancelled-customers" element={<CancelledCustomersReport />} />
        <Route path="transfers" element={<TransfersReport />} />
        <Route path="custom" element={<CustomReport />} />
        <Route path="general" element={<GeneralReport />} />
        <Route path="customers" element={<CustomersReport />} />
        <Route path="upcoming-birthdays" element={<UpcomingBirthdaysReport />} />
        <Route path="turning-age" element={<TurningAgeReport />} />
        <Route path="effective-date" element={<EffectiveDateReport />} />
        <Route path="*" element={<Navigate to="lost-clients" replace />} />
      </Routes>
    </div>
  );
};

export default Reports;
