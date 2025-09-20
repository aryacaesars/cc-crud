'use client';
import { useEffect } from 'react';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

const PopupComponent = ({
  isOpen,
  onClose,
  onConfirm,
  type = 'warning',
  title,
  message = 'Do you want to continue?',
  confirmText = 'Yes',
  cancelText = 'No',
  showCancel = true
}: PopupProps) => {
  // Close popup when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Get colors and icons based on type
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-500',
          icon: (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ),
          title: title || 'SUCCESS!',
          confirmColor: 'bg-green-500 hover:bg-green-600'
        };
      case 'error':
        return {
          bgColor: 'bg-red-500',
          icon: (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          title: title || 'ERROR!',
          confirmColor: 'bg-red-500 hover:bg-red-600'
        };
      case 'info':
        return {
          bgColor: 'bg-blue-500',
          icon: (
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: title || 'INFO!',
          confirmColor: 'bg-blue-500 hover:bg-blue-600'
        };
      case 'warning':
      default:
        return {
          bgColor: 'bg-red-400',
          icon: (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z" />
            </svg>
          ),
          title: title || 'WARNING!',
          confirmColor: 'bg-red-400 hover:bg-red-500'
        };
    }
  };

  const config = getTypeConfig();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Popup Container */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-in">
        {/* Header Section */}
        <div className={`${config.bgColor} rounded-t-2xl px-8 py-8 text-center`}>
          {/* Icon Circle */}
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <div className={`${config.bgColor} w-10 h-10 rounded-full flex items-center justify-center`}>
                {config.icon}
              </div>
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-3xl font-bold text-white mb-2 tracking-wide">
            {config.title}
          </h2>
          
          {/* Message */}
          <p className="text-white text-opacity-90 text-lg font-medium">
            {message}
          </p>
        </div>

        {/* Buttons Section */}
        <div className="px-8 py-6">
          <div className="flex gap-4">
            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              className={`flex-1 ${config.confirmColor} text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50`}
              style={{ 
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              {confirmText}
            </button>
            
            {/* Cancel Button */}
            {showCancel && (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50"
                style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
              >
                {cancelText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupComponent;
