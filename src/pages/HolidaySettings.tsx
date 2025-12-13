
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HolidayManagement } from "@/components/holidays/HolidayManagement";
import { LeaveManagement } from "@/components/leaves/LeaveManagement";
import { CalendarIntegration } from "@/components/calendar/CalendarIntegration";
import { useIsMobile } from "@/hooks/use-mobile";

const HolidaySettings = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'p-4 space-y-4' : 'p-6 space-y-6'}`}>
      <div>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
          Holiday & Leave Management
        </h1>
        <p className="text-gray-600 text-sm">
          Manage holidays, employee leaves, and calendar integrations
        </p>
      </div>

      <Tabs defaultValue="holidays" className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="leaves">Leave Management</TabsTrigger>
          <TabsTrigger value="calendar">Calendar Integration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="holidays" className="space-y-4">
          <HolidayManagement />
        </TabsContent>
        
        <TabsContent value="leaves" className="space-y-4">
          <LeaveManagement />
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-4">
          <CalendarIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HolidaySettings;
