import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, LogOut, Info, AlertCircle, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  iconType?: 'leave' | 'delete' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  iconType = 'warning'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') {
        onConfirm();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (iconType) {
      case 'leave':
        return <LogOut className="w-6 h-6 text-apple-red" />;
      case 'delete':
        return <Trash2 className="w-6 h-6 text-apple-red" />;
      case 'info':
        return <Info className="w-6 h-6 text-apple-blue" />;
      default:
        return variant === 'danger' ? (
          <AlertTriangle className="w-6 h-6 text-apple-red" />
        ) : (
          <AlertCircle className="w-6 h-6 text-amber-500" />
        );
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-100 dark:bg-red-950/60 border-red-200/80 dark:border-red-900/60';
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-900/60';
      default:
        return 'bg-blue-100 dark:bg-blue-950/60 border-blue-200/80 dark:border-blue-900/60';
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-apple-red hover:bg-red-600 text-white shadow-sm hover:shadow active:scale-[0.98]';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow active:scale-[0.98]';
      default:
        return 'bg-apple-blue hover:bg-apple-blueHover text-white shadow-sm hover:shadow active:scale-[0.98]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in select-none">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white/95 dark:bg-[#1C1C1E]/95 text-apple-textPrimary dark:text-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-apple-border/70 dark:border-white/15 z-10 animate-scale-up space-y-4">
        {/* Top Icon & Close Button */}
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-2xl border ${getIconBg()}`}>
            {renderIcon()}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 text-apple-textSecondary dark:text-white/70 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="text-body font-bold text-apple-textPrimary dark:text-white leading-tight">
            {title}
          </h3>
          <p className="text-footnote text-apple-textSecondary dark:text-white/60 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-footnote text-apple-textSecondary dark:text-white/80 bg-apple-secondaryBg dark:bg-white/10 hover:bg-apple-tertiaryBg dark:hover:bg-white/20 transition-all active:scale-[0.98]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-footnote transition-all ${getConfirmButtonClasses()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
