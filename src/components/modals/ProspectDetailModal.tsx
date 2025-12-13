import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, User, Phone, Mail, MapPin, Building, DollarSign, Calendar, Star } from 'lucide-react';
import { SearchResult } from '@/services/globalSearchService';
import { format } from 'date-fns';

interface ProspectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: SearchResult | null;
}

const ProspectDetailModal: React.FC<ProspectDetailModalProps> = ({
  isOpen,
  onClose,
  prospect
}) => {
  if (!prospect || prospect.type !== 'prospect') return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'qualified':
        return 'bg-green-100 text-green-800';
      case 'converted':
        return 'bg-purple-100 text-purple-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return format(date, 'PPP');
    } catch {
      return dateTimeString;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Prospect Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {prospect.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {prospect.description}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge className={getStatusColor(prospect.status)}>
                {prospect.status}
              </Badge>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Info */}
            {(prospect.details?.first_name || prospect.details?.last_name) && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Contact</span>
                </div>
                <p className="text-sm text-gray-700">
                  {prospect.details.first_name} {prospect.details.last_name}
                </p>
                {prospect.details.company && (
                  <p className="text-xs text-gray-500 mt-1">
                    {prospect.details.company}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            {prospect.details?.email && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Email</span>
                </div>
                <p className="text-sm text-gray-700">
                  {prospect.details.email}
                </p>
              </div>
            )}

            {/* Phone */}
            {prospect.details?.phone && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Phone</span>
                </div>
                <p className="text-sm text-gray-700">
                  {prospect.details.phone}
                </p>
              </div>
            )}

            {/* Address */}
            {(prospect.details?.address || prospect.details?.city || prospect.details?.state) && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Location</span>
                </div>
                <div className="text-sm text-gray-700">
                  {prospect.details.address && (
                    <p>{prospect.details.address}</p>
                  )}
                  <p>
                    {[prospect.details.city, prospect.details.state, prospect.details.zip_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Lead Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source */}
            {prospect.details?.source && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Source</span>
                </div>
                <p className="text-sm text-gray-700 capitalize">
                  {prospect.details.source}
                </p>
              </div>
            )}

            {/* Priority */}
            {prospect.details?.priority && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Priority</span>
                </div>
                <Badge className={getPriorityColor(prospect.details.priority)}>
                  {prospect.details.priority}
                </Badge>
              </div>
            )}

            {/* Lead Score */}
            {prospect.details?.lead_score !== undefined && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Lead Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{prospect.details.lead_score}/100</span>
                  <div className="flex">
                    {renderStars(Math.ceil(prospect.details.lead_score / 20))}
                  </div>
                </div>
              </div>
            )}

            {/* Estimated Value */}
            {prospect.details?.estimated_value && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Estimated Value</span>
                </div>
                <p className="text-sm text-gray-700">
                  ${prospect.details.estimated_value.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Agent Information */}
          {prospect.details?.assigned_agent && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Assigned Agent</span>
              </div>
              <p className="text-sm text-gray-700">
                {prospect.details.assigned_agent.name}
              </p>
              {prospect.details.assigned_agent.email && (
                <p className="text-xs text-gray-500">
                  {prospect.details.assigned_agent.email}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {prospect.details?.notes && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {prospect.details.notes}
              </p>
            </div>
          )}

          {/* Important Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prospect.details?.created_at && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Created</span>
                </div>
                <p className="text-sm text-gray-700">
                  {formatDateTime(prospect.details.created_at)}
                </p>
              </div>
            )}

            {prospect.details?.last_contacted_at && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Last Contacted</span>
                </div>
                <p className="text-sm text-gray-700">
                  {formatDateTime(prospect.details.last_contacted_at)}
                </p>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          {prospect.details?.custom_fields && Object.keys(prospect.details.custom_fields).length > 0 && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Additional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(prospect.details.custom_fields).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1">
                    <span className="text-sm font-medium capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-sm text-gray-700">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 pt-4 border-t">
            <div className="flex justify-between">
              <span>Relevance Score: {prospect.relevance_score}</span>
              {prospect.details?.updated_at && (
                <span>Last Updated: {formatDateTime(prospect.details.updated_at)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProspectDetailModal;