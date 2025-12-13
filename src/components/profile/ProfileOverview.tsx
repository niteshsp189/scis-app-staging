
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building, MapPin, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProfileOverviewProps {
  user: {
    name: string;
    position: string;
    company: string;
    location: string;
    joinDate: string;
    avatar: string | null;
  };
}

export function ProfileOverview({ user }: ProfileOverviewProps) {
  const isMobile = useIsMobile();

  return (
    <Card className={isMobile ? '' : 'lg:col-span-1'}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className={isMobile ? 'h-20 w-20' : 'h-24 w-24'}>
            <AvatarImage src={user.avatar || ""} alt={user.name} />
            <AvatarFallback className={isMobile ? 'text-lg' : 'text-2xl'}>
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className={isMobile ? 'text-lg' : ''}>{user.name}</CardTitle>
        <CardDescription className={isMobile ? 'text-sm' : ''}>{user.position}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center gap-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          <Building className="h-4 w-4 text-gray-500" />
          <span>{user.company}</span>
        </div>
        <div className={`flex items-center gap-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          <MapPin className="h-4 w-4 text-gray-500" />
          <span>{user.location}</span>
        </div>
        <div className={`flex items-center gap-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
