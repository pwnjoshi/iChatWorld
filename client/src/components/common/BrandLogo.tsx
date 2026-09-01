import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-xl',
    md: 'w-9 h-9 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl'
  }[size];

  return (
    <div className={`relative flex items-center justify-center shrink-0 shadow-sm ${sizeClasses} ${className}`}>
      <svg className="w-full h-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="appleGradientLogo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#007AFF" />
            <stop offset="100%" stopColor="#5856D6" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="14" fill="url(#appleGradientLogo)" />
        <path
          d="M24 12C16.82 12 11 17.15 11 23.5C11 26.54 12.33 29.3 14.54 31.33L13.2 36L18.11 34.42C19.92 35.05 21.91 35 24 35C31.18 35 37 29.85 37 23.5C37 17.15 31.18 12 24 12Z"
          fill="white"
        />
        <circle cx="19" cy="23.5" r="2" fill="#007AFF" />
        <circle cx="24" cy="23.5" r="2" fill="#007AFF" />
        <circle cx="29" cy="23.5" r="2" fill="#007AFF" />
      </svg>
    </div>
  );
};
