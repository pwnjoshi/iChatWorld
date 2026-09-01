import React from 'react';
import { getInitials, getAvatarColor } from '../../utils/format.js';

interface AvatarProps {
  name: string;
  isFaculty?: boolean;
  isCreator?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  isFaculty = false,
  isCreator = false,
  size = 'md',
  className = ''
}) => {
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);

  const sizeStyles = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-semibold'
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      <div
        className={`${sizeStyles[size]} ${colorClass} rounded-full flex items-center justify-center shadow-sm tracking-tight`}
      >
        {initials}
      </div>

      {isFaculty && (
        <span
          title="Faculty"
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-amber-950 font-bold"
        >
          ★
        </span>
      )}

      {!isFaculty && isCreator && (
        <span
          title="Host"
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-apple-blue border-2 border-white rounded-full"
        />
      )}
    </div>
  );
};
