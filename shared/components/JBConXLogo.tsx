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
  tagline,
  className = '',
}) => {
  const imgHeights = {
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-16',
    xl: 'h-24',
  };

  const cardPadding = {
    sm: 'px-2.5 py-1 rounded-lg',
    md: 'px-3.5 py-1.5 rounded-xl',
    lg: 'px-5 py-2.5 rounded-2xl',
    xl: 'px-6 py-3 rounded-2xl',
  };

  // On dark background variant, place inside a crisp white card so the logo pops
  const isDarkBg = variant === 'light';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${cardPadding[size]} ${
          isDarkBg
            ? 'bg-white shadow-sm border border-white/25'
            : 'bg-transparent'
        } flex items-center justify-center`}
      >
        <img
          src="/jbconx-logo.png"
          alt="JBConX Logo"
          className={`${imgHeights[size]} w-auto object-contain select-none`}
        />
      </div>

      {tagline && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/15">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{tagline}</span>
        </span>
      )}
    </div>
  );
};
