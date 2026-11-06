import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'brand';
  showText?: boolean;
  tagline?: string;
  className?: string;
}

export const JBConXLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'brand',
  showText = true,
  tagline,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
  const subtextColor = variant === 'light' ? 'text-[#A3CEF1]' : 'text-slate-500';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Precision Brand Emblem */}
      <div
        className={`${iconDimensions[size]} relative rounded-xl flex items-center justify-center font-black tracking-tighter shadow-md flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#1B3B6F] via-[#274C77] to-[#6096BA] text-white border border-white/20`}
      >
        {/* Modern Geometrical Mesh Overlay */}
        <div className="absolute inset-0 bg-white/10 [clip-path:polygon(0%_0%,100%_0%,65%_100%,0%_100%)] opacity-30 pointer-events-none" />
        
        {/* Connected nodes representation (CRM Connector) */}
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full p-1 drop-shadow"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="11" cy="13" r="4.5" fill="#FFFFFF" />
          <circle cx="29" cy="13" r="4.5" fill="#A3CEF1" />
          <circle cx="20" cy="28" r="5.5" fill="#FFFFFF" />
          
          {/* Connection vectors */}
          <line x1="11" y1="13" x2="20" y2="28" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="29" y1="13" x2="20" y2="28" stroke="#A3CEF1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="11" y1="13" x2="29" y2="13" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeDasharray="2 2" />
          
          {/* Center connector core */}
          <circle cx="20" cy="20" r="2.5" fill="#FBBF24" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className={`font-black tracking-tight ${textSizes[size]} ${textColor} flex items-center`}>
            <span>JBCon</span>
            <span className="text-[#6096BA] font-extrabold ml-0.5">X</span>
          </div>
          {tagline ? (
            <span className={`text-[10px] font-bold tracking-wider uppercase mt-1 ${subtextColor}`}>
              {tagline}
            </span>
          ) : (
            <span className={`text-[9px] font-bold tracking-widest uppercase mt-0.5 ${subtextColor}`}>
              MARKETING CRM
            </span>
          )}
        </div>
      )}
    </div>
  );
};

