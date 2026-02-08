import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      {message && <p className="text-gray-600 mt-4">{message}</p>}
    </div>
  );
};
