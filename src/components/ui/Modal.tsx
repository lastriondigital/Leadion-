import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${maxWidthClasses[maxWidth]} max-w-full bg-white dark:bg-[#161922] border border-[#E6E8EC] dark:border-[#232836] rounded-[20px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] sm:max-h-[90vh]`}
      >
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-[#E6E8EC]/80 dark:border-[#232836]/80 shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed break-words">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-w-0">
          {children}
        </div>

        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-3 p-3.5 sm:p-4 sm:px-6 bg-zinc-50 dark:bg-[#12151D] border-t border-[#E6E8EC]/80 dark:border-[#232836]/80 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
