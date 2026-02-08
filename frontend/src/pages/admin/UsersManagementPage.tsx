import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { adminService } from '@/services/admin.service';
import { User, UserRole } from '@/types';
import { Users, Mail, Calendar, Shield, Ban, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      if (roleFilter) filters.role = roleFilter;
      if (statusFilter) filters.status = statusFilter;
      
      const data = await adminService.getAllUsers(filters);
      setUsers(data);
    } catch (error: any) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter]);

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      await adminService.updateUserRole(userId, newRole);
      toast.success('User role updated');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user role');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const reason = prompt('Please provide a reason for suspension:');
    if (!reason) return;

    try {
      await adminService.suspendUser(userId, reason);
      toast.success('User suspended');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to suspend user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const reason = prompt('Please provide a reason for deletion:');
    if (!reason) return;

    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await adminService.deleteUser(userId, reason);
      toast.success('User deleted');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage user roles and permissions</p>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Filter by Role</label>
              <select
                className="input"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="candidate">Candidate</option>
                <option value="hr_pending">HR Pending</option>
                <option value="hr_approved">HR Approved</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Filter by Status</label>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        {isLoading ? (
          <LoadingSpinner message="Loading users..." />
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-gray-400" />}
            title="No users found"
            description="No users match the selected filters."
          />
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onUpdateRole={handleUpdateRole}
                onSuspend={handleSuspendUser}
                onDelete={handleDeleteUser}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

const UserCard: React.FC<{
  user: User;
  onUpdateRole: (userId: string, role: UserRole) => void;
  onSuspend: (userId: string) => void;
  onDelete: (userId: string) => void;
}> = ({ user, onUpdateRole, onSuspend, onDelete }) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hr_approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'hr_pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {user.fullName || user.email}
            </h3>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border-2 ${getRoleColor(
                user.role
              )}`}
            >
              <Shield className="w-3 h-3 inline mr-1" />
              {user.role.replace('_', ' ')}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
              {user.status}
            </span>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              {user.email}
            </div>
            {user.phone && (
              <div className="flex items-center">
                📞 <span className="ml-2">{user.phone}</span>
              </div>
            )}
            {user.companyName && (
              <div className="flex items-center">
                🏢 <span className="ml-2">{user.companyName}</span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Joined {formatDate(user.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {user.status === 'active' && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <div className="relative flex-1">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="btn btn-secondary w-full flex items-center justify-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>Change Role</span>
            </button>
            
            {showRoleDropdown && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {(['candidate', 'hr_pending', 'hr_approved', 'admin'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      onUpdateRole(user.id, role);
                      setShowRoleDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                    disabled={user.role === role}
                  >
                    {role.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => onSuspend(user.id)}
            className="btn btn-danger flex items-center space-x-2"
          >
            <Ban className="w-4 h-4" />
            <span>Suspend</span>
          </button>
          
          <button
            onClick={() => onDelete(user.id)}
            className="btn btn-danger flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
