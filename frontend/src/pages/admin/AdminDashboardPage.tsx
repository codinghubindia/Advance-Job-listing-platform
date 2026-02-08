import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { StatsCard } from '@/components/StatsCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { adminService } from '@/services/admin.service';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminDashboardPage: React.FC = () => {
  const [hrStats, setHrStats] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const [hrData, userData] = await Promise.all([
        adminService.getHRRequestStats(),
        adminService.getUserStats(),
      ]);
      setHrStats(hrData);
      setUserStats(userData);
    } catch (error: any) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner message="Loading dashboard..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage HR requests and users</p>
        </div>

        {/* HR Request Stats */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">HR Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Requests"
              value={hrStats?.total || 0}
              icon={<Users className="w-6 h-6" />}
              color="blue"
            />
            <StatsCard
              title="Pending"
              value={hrStats?.pending || 0}
              icon={<Clock className="w-6 h-6" />}
              color="yellow"
            />
            <StatsCard
              title="Approved"
              value={hrStats?.approved || 0}
              icon={<UserCheck className="w-6 h-6" />}
              color="green"
            />
            <StatsCard
              title="Rejected"
              value={hrStats?.rejected || 0}
              icon={<UserX className="w-6 h-6" />}
              color="red"
            />
          </div>
        </div>

        {/* User Stats */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Users"
              value={userStats?.total || 0}
              icon={<Users className="w-6 h-6" />}
              color="blue"
            />
            <StatsCard
              title="Candidates"
              value={userStats?.candidates || 0}
              icon={<Users className="w-6 h-6" />}
              color="green"
            />
            <StatsCard
              title="HR Approved"
              value={userStats?.hrApproved || 0}
              icon={<UserCheck className="w-6 h-6" />}
              color="purple"
            />
            <StatsCard
              title="Active Users"
              value={userStats?.active || 0}
              icon={<Users className="w-6 h-6" />}
              color="green"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/admin/hr-requests" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Review HR Requests
                </h3>
                <p className="text-gray-600 text-sm">
                  {hrStats?.pending || 0} pending requests awaiting approval
                </p>
              </div>
              <div className="p-4 bg-yellow-100 text-yellow-600 rounded-full">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </Link>

          <Link to="/admin/users" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Manage Users
                </h3>
                <p className="text-gray-600 text-sm">
                  Manage roles and permissions for {userStats?.total || 0} users
                </p>
              </div>
              <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
};
