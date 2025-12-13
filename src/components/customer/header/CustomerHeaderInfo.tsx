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
  const familyId = customerData.familyId || customerData.id?.toString() || "";

  if (isMobile) {
    return (
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600 truncate">{company}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs ${getStatusColor(status)}`}>
              {status}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {familyId}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
        {initials}
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{customerName}</h1>
        <p className="text-lg text-gray-600">{company}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={`text-xs ${getStatusColor(status)}`}>
            {status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            ID: {familyId}
          </Badge>
        </div>
      </div>
    </div>
  );
};
