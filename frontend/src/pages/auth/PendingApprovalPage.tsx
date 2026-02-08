import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

export const PendingApprovalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500 rounded-full mb-6">
          <Clock className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Account Pending Approval
        </h1>
        
        <div className="card text-left">
          <p className="text-gray-700 mb-4">
            Thank you for registering as an HR Manager! Your account is currently under review by our administrators.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-yellow-800 space-y-2">
              <li>• Our team will review your registration details</li>
              <li>• You'll receive an email notification once approved</li>
              <li>• After approval, you can post jobs and review applications</li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-600">
            This process typically takes 24-48 hours. If you have any questions, please contact our support team.
          </p>
        </div>
        
        <Link to="/login" className="inline-block mt-6 text-primary-600 hover:text-primary-700 font-medium">
          Return to Login
        </Link>
      </div>
    </div>
  );
};
