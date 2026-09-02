import React from 'react';
import { getInitials, getAvatarColor } from '../../utils/format.js';
import { Sparkles } from 'lucide-react';

interface AvatarProps {
  name: string;
  isCreator?: boolean;
  isFaculty?: boolean;
  isAI?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  isCreator = false,
  isAI = false,
  size = 'md',
  className = ''
}) => {
  const isAIAvatar = isAI || name.toLowerCase().includes('ai') || name.toLowerCase().includes('ichatworld');
  const initials = isAIAvatar ? 'AI' : getInitials(name);
  const colorClass = isAIAvatar ? 'bg-gradient-to-tr from-purple-600 to-blue-500 text-white' : getAvatarColor(name);

  const sizeStyles = {
    sm: 'w-7 h-7 text-[10.5px]',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${className}`}>
      <div
        className={`${sizeStyles[size]} ${colorClass} rounded-full flex items-center justify-center shadow-xs font-bold tracking-tight text-white shrink-0 overflow-hidden`}
      >
        {isAIAvatar ? (
          <Sparkles className="w-3.5 h-3.5 text-white" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {isCreator && (
        <span
          title="Room Host"
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 border-2 border-white dark:border-black rounded-full flex items-center justify-center text-[7px] text-amber-950 font-bold shadow-xs"
        >
          ★
        </span>
      )}
    </div>
  );
};
