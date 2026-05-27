import React from 'react';

/**
 * Reusable modal overlay component.
 * Renders children inside a centered modal with backdrop.
 *
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Called when backdrop or close button is clicked
 * @param {string} title - Modal header title
 * @param {string} size - Modal width: 'sm', 'md', 'lg', 'xl' (default: 'md')
 * @param {React.ReactNode} children - Modal body content
 */
const Modal = ({ isOpen, onClose, title, size = 'md', children }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size] || sizeClasses.md} max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
