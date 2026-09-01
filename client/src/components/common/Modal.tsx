import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} bg-white dark:bg-[#1C1C1E] text-apple-textPrimary dark:text-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 max-h-[92dvh] sm:max-h-[88vh] overflow-y-auto z-10 border-t sm:border border-apple-border/60 dark:border-white/15 animate-slide-up sm:animate-scale-up pb-safe no-scrollbar`}
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 bg-apple-border/80 dark:bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />

        {title && (
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-apple-border/40 dark:border-white/10 mb-3 sm:mb-4">
            <h3 className="text-body sm:text-headline text-apple-textPrimary dark:text-white font-bold">{title}</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 text-apple-textSecondary dark:text-white/80 transition-colors text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
