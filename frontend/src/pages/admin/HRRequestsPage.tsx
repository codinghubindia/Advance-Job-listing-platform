import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { adminService } from '@/services/admin.service';
import { HRRequest } from '@/types';
import { Clock, CheckCircle, XCircle, Building, Calendar, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export const HRRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<HRRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data =
        filter === 'all'
          ? await adminService.getAllHRRequests()
          : await adminService.getAllHRRequests(filter);
      setRequests(data);
    } catch (error: any) {
      toast.error('Failed to load HR requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleApprove = async (requestId: string) => {
    try {
      await adminService.approveHRRequest(requestId);
      toast.success('HR request approved');
      loadRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await adminService.rejectHRRequest(requestId, { reason });
      toast.success('HR request rejected');
      loadRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject request');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Requests</h1>
          <p className="text-gray-600 mt-2">Review and manage HR registration requests</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <LoadingSpinner message="Loading requests..." />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-8 h-8 text-gray-400" />}
            title="No requests found"
            description={`There are no ${filter === 'all' ? '' : filter} HR requests at this time.`}
          />
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

const RequestCard: React.FC<{
  request: HRRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ request, onApprove, onReject }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5" />;
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{request.userEmail}</h3>
            <span
              className={`flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full border-2 ${getStatusColor(
                request.status
              )}`}
            >
              {getStatusIcon(request.status)}
              {request.status}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Building className="w-4 h-4 mr-2" />
              {request.companyName}
            </div>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              {request.userEmail}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Requested on {formatDate(request.requestedAt)}
            </div>
            {request.reviewedAt && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Reviewed on {formatDate(request.reviewedAt)}
              </div>
            )}
          </div>
        </div>
      </div>

      {request.adminNotes && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Admin Notes:</strong> {request.adminNotes}
          </p>
        </div>
      )}

      {request.rejectionReason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Rejection Reason:</strong> {request.rejectionReason}
          </p>
        </div>
      )}

      {request.status === 'pending' && (
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => onApprove(request.id)}
            className="btn btn-success flex-1 flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => onReject(request.id)}
            className="btn btn-danger flex-1 flex items-center justify-center space-x-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>
        </div>
      )}
    </div>
  );
};
