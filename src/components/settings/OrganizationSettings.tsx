
import { Card } from "@/components/ui/card";
import { OrganizationForm } from './OrganizationForm';

export function OrganizationSettings() {
  return (
    <Card className="border border-gray-200 shadow-sm bg-white">
      <div className="p-6 space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Company Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your organization's basic information and preferences
          </p>
        </div>
        <OrganizationForm />
      </div>
    </Card>
  );
}
