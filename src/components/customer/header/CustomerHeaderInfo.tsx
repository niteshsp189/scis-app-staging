import { Badge } from "@/components/ui/badge";
import { CustomerData } from "@/types/customer";

interface CustomerHeaderInfoProps {
  customerData: CustomerData;
  isMobile?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Renewal Due":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Expired":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const CustomerHeaderInfo = ({
  customerData,
  isMobile = false,
}: CustomerHeaderInfoProps) => {
  // Return null or loading state if customerData is not available
  if (!customerData) {
    return null;
  }

  const customerName =
    customerData.name ||
    `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim() ||
    "Unknown Customer";
  const initials =
    customerName
      .split(" ")
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase() || "UC";
  const company = customerData.company || "";
  const status = customerData.status || "Client";

  if (isMobile) {
    return (
      <div className="flex flex-col gap-1 mb-4">
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {customerName}
          <Badge className={`text-xs ${getStatusColor(status)}`}>{status}</Badge>
        </h1>
        {company && (
          <p className="text-sm text-gray-600 truncate">{company}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
        {customerName}
        <Badge className={`text-xs ${getStatusColor(status)}`}>{status}</Badge>
      </h1>
      {company && <p className="text-lg text-gray-600">{company}</p>}
    </div>
  );
};
