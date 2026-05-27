import React from 'react';

/**
 * Loading spinner component with optional text.
 */
const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        {text && <p className="text-sm text-gray-500">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
