import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'lg',
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

  const widthClasses = {
    md: 'md:max-w-md',
    lg: 'md:max-w-xl',
    xl: 'md:max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen ${widthClasses[width]} bg-white dark:bg-[#141720] border-l border-[#E6E8EC] dark:border-[#232836] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200`}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#E6E8EC]/80 dark:border-[#232836]/80 flex items-start justify-between shrink-0 bg-zinc-50/50 dark:bg-[#111319]/50">
            <div className="min-w-0 pr-4">
              <div className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {title}
              </div>
              {subtitle && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
              aria-label="Fechar gaveta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-[#111319] border-t border-[#E6E8EC]/80 dark:border-[#232836]/80 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
