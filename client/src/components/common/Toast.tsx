import React, { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  type?: 'info' | 'error' | 'success';
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'info' }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const bgColors = {
    info: 'bg-[#1C1C1E] text-white',
    error: 'bg-apple-red text-white',
    success: 'bg-apple-green text-white'
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-auto">
      <div
        className={`${bgColors[type]} px-4 py-2.5 rounded-full shadow-ios-dropdown text-subhead font-medium flex items-center gap-2 max-w-sm border border-white/10`}
      >
        <span>{message}</span>
        <button
          onClick={onClose}
          className="opacity-70 hover:opacity-100 transition-opacity ml-1 text-sm leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
