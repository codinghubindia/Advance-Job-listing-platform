import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If authenticated, redirect to appropriate dashboard
  if (user) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'hr_approved':
        return <Navigate to="/hr" replace />;
      case 'hr_pending':
        return <Navigate to="/pending-approval" replace />;
      case 'candidate':
        return <Navigate to="/jobs" replace />;
      default:
        return <Navigate to="/jobs" replace />;
    }
  }

  return <>{children}</>;
};
