import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, MapPin, User, Phone, Mail, Edit } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/services/api";

interface Appointment {
  id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  status: string;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  created_by: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

const AppointmentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAppointment();
    }
  }, [id]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${id}`);
      if (response.success) {
        setAppointment(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load appointment details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to load appointment:', error);
      toast({
        title: "Error",
        description: "Failed to load appointment details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { 
        timeZone: 'UTC',
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        timeZone: 'UTC',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading appointment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Appointment Not Found</h2>
          <p className="text-gray-600 mb-4">The appointment you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/appointments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  const startDateTime = formatDateTime(appointment.start_datetime);
  const endDateTime = formatDateTime(appointment.end_datetime);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{appointment.title}</h1>
            <p className="text-gray-600">Appointment Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status}
          </Badge>
          {/* <Button onClick={() => navigate(`/appointments/${id}/edit`)}> */}
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              <p className="text-gray-900">{appointment.title}</p>
            </div>
            
            {appointment.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900">{appointment.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Start Date & Time
                </label>
                <p className="text-gray-900">{startDateTime.date}</p>
                <p className="text-gray-700">{startDateTime.time}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  End Date & Time
                </label>
                <p className="text-gray-900">{endDateTime.date}</p>
                <p className="text-gray-700">{endDateTime.time}</p>
              </div>
            </div>

            {appointment.location && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <p className="text-gray-900">{appointment.location}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Customer Name</label>
              <p className="text-gray-900">{appointment.customer.name}</p>
            </div>

            {appointment.customer.email && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-gray-900">
                  <a href={`mailto:${appointment.customer.email}`} className="text-blue-600 hover:underline">
                    {appointment.customer.email}
                  </a>
                </p>
              </div>
            )}

            {appointment.customer.phone && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <p className="text-gray-900">
                  <a href={`tel:${appointment.customer.phone}`} className="text-blue-600 hover:underline">
                    {appointment.customer.phone}
                  </a>
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/clients/view/${appointment.customer.id}`)}
                className="w-full"
              >
                View Customer Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-500">Created By</label>
              <p className="text-gray-900">{appointment.created_by.name}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Created Date</label>
              <p className="text-gray-900">{new Date(appointment.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900">{new Date(appointment.updated_at).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Appointment ID</label>
              <p className="text-gray-900 font-mono">{appointment.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('/appointments')}>
          View All Appointments
        </Button>
        {/* <Button onClick={() => navigate(`/appointments/${id}/reschedule`)}> */}
        <Button>
          Reschedule Appointment
        </Button>
      </div>
    </div>
  );
};

export default AppointmentDetails;