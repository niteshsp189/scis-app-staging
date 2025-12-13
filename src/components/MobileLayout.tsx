
import { ReactNode, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNav } from "./MobileNav";
import { TopNav } from "./TopNav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { usePreferences } from "@/contexts/PreferenceContext";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const isMobile = useIsMobile();
  const { sidebarCollapsed, setSidebarCollapsed, isLoading, preferences } = usePreferences();
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null); // Start with null until preferences load

  // Debug logging
  useEffect(() => {
 
  }, [isLoading, sidebarCollapsed, preferences, sidebarOpen]);

  // Initialize sidebar state once preferences are loaded
  useEffect(() => {
    if (!isLoading && sidebarOpen === null) {
      const newSidebarOpen = !sidebarCollapsed;
      
      setSidebarOpen(newSidebarOpen);
    }
  }, [sidebarCollapsed, isLoading, sidebarOpen]);

  // Update sidebar state when preferences change
  useEffect(() => {
    if (!isLoading && sidebarOpen !== null) {
      const newSidebarOpen = !sidebarCollapsed;
      if (newSidebarOpen !== sidebarOpen) {
        
        setSidebarOpen(newSidebarOpen);
      }
    }
  }, [sidebarCollapsed, isLoading, sidebarOpen]);

  const handleSidebarChange = async (open: boolean) => {
    setSidebarOpen(open);
    try {
      await setSidebarCollapsed(!open);
    } catch (error) {
      console.error('Failed to save sidebar preference:', error);
      // Revert on error
      setSidebarOpen(!open);
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <MobileNav />
        <main className="flex-1 pt-16 pb-20 overflow-auto">
          <div className="w-full px-2">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Wait for preferences to load and sidebar state to be initialized
  if (isLoading || sidebarOpen === null) {
    return (
      <div className="min-h-screen flex w-full bg-gray-50">
        <div className="w-[240px] min-w-[240px] bg-sidebar"></div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-16 bg-white border-b"></div>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider 
      open={sidebarOpen}
      onOpenChange={handleSidebarChange}
    >
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
