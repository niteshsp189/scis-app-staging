
import { ChatButton } from "@/components/ChatButton";
import { NotificationButton } from "@/components/NotificationButton";
import { UserProfileButton } from "@/components/UserProfileButton";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopNav() {
  return (
    <div className="professional-nav px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-3">
          <img 
            src="/uploads/Maha-Shahwan-150x150.jpg" 
            alt="SCIS Logo" 
            className="h-8 w-8 rounded-lg shadow-sm"
          />
          <span className="text-xl font-semibold text-slate-900">SCIS</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ChatButton />
        <NotificationButton />
        <UserProfileButton />
      </div>
    </div>
  );
}
