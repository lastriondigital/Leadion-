import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-6',
  };

  const variantClasses = {
    default: 'bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] shadow-[0_1px_3px_rgba(0,0,0,0.03)]',
    subtle: 'bg-[#F7F8FA] dark:bg-[#191D28] border border-[#E6E8EC]/80 dark:border-[#232836]/80',
    interactive: 'bg-white dark:bg-[#141720] border border-[#E6E8EC] dark:border-[#232836] hover:border-[#635BFF]/50 dark:hover:border-[#635BFF]/50 hover:shadow-md transition-all duration-150 cursor-pointer',
  };

  return (
    <div
      className={`rounded-[15px] ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
