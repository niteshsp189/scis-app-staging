
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { User, Shield, Activity } from "lucide-react";

const Profile = () => {
  const isMobile = useIsMobile();
  
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@insurancecrm.com",
    phone: "+1 (555) 123-4567",
    company: "InsureCRM Inc.",
    position: "Senior Insurance Agent",
    location: "New York, NY",
    joinDate: "2023-01-15",
    avatar: null
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className={`${isMobile ? 'p-4 space-y-4' : 'p-6 space-y-6'} max-w-6xl mx-auto`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>User Profile</h1>
          <p className="text-gray-600 text-sm">Manage your account settings and preferences</p>
        </div>
        <Button variant="outline" className={isMobile ? 'text-sm' : ''}>
          Logout
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {!isMobile && "Profile"}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {!isMobile && "Security"}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {!isMobile && "Activity"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-3 gap-6'}`}>
            <ProfileOverview user={user} />
            <ProfileForm 
              user={user}
              setUser={setUser}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TwoFactorSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Account Activity
              </CardTitle>
              <CardDescription>
                View your recent account activity and login history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Account activity tracking coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
