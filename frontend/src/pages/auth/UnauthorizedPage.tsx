import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-6">
          <XCircle className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>
        
        <div className="card">
          <p className="text-gray-700 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <Link to="/" className="btn btn-primary w-full">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
