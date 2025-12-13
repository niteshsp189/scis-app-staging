
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Building, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProfileFormProps {
  user: any;
  setUser: (user: any) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ProfileForm({ 
  user, 
  setUser, 
  isEditing, 
  setIsEditing, 
  onSave, 
  onCancel 
}: ProfileFormProps) {
  const isMobile = useIsMobile();

  return (
    <Card className={isMobile ? '' : 'lg:col-span-2'}>
      <CardHeader>
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
          <div>
            <CardTitle className={isMobile ? 'text-lg' : ''}>Personal Information</CardTitle>
            <CardDescription className={isMobile ? 'text-sm' : ''}>Update your personal details and contact information</CardDescription>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className={isMobile ? 'w-full' : ''}>
              Edit Profile
            </Button>
          ) : (
            <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
              <Button variant="outline" onClick={onCancel} className={isMobile ? 'flex-1' : ''}>
                Cancel
              </Button>
              <Button onClick={onSave} className={isMobile ? 'flex-1' : ''}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <div className="space-y-2">
            <Label htmlFor="name" className={isMobile ? 'text-sm' : ''}>Full Name</Label>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <Input
                id="name"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                disabled={!isEditing}
                className={isMobile ? 'text-sm' : ''}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position" className={isMobile ? 'text-sm' : ''}>Position</Label>
            <Input
              id="position"
              value={user.position}
              onChange={(e) => setUser({ ...user, position: e.target.value })}
              disabled={!isEditing}
              className={isMobile ? 'text-sm' : ''}
            />
          </div>
        </div>

        <Separator />

        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <div className="space-y-2">
            <Label htmlFor="email" className={isMobile ? 'text-sm' : ''}>Email Address</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <Input
                id="email"
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                disabled={!isEditing}
                className={isMobile ? 'text-sm' : ''}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className={isMobile ? 'text-sm' : ''}>Phone Number</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <Input
                id="phone"
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                disabled={!isEditing}
                className={isMobile ? 'text-sm' : ''}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <div className="space-y-2">
            <Label htmlFor="company" className={isMobile ? 'text-sm' : ''}>Company</Label>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <Input
                id="company"
                value={user.company}
                onChange={(e) => setUser({ ...user, company: e.target.value })}
                disabled={!isEditing}
                className={isMobile ? 'text-sm' : ''}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location" className={isMobile ? 'text-sm' : ''}>Location</Label>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Input
                id="location"
                value={user.location}
                onChange={(e) => setUser({ ...user, location: e.target.value })}
                disabled={!isEditing}
                className={isMobile ? 'text-sm' : ''}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
