import React from 'react';
import markUrl from '../assets/brand/jbconx-mark.png';
import wordmarkUrl from '../assets/brand/jbconx-wordmark.png';
import wordmarkWhiteUrl from '../assets/brand/jbconx-wordmark-white.png';
import logoUrl from '../assets/brand/jbconx-logo.png';
import logoWhiteUrl from '../assets/brand/jbconx-logo-white.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** `light` = for dark backgrounds (white wordmark); `dark` / `brand` = for light backgrounds */
  variant?: 'light' | 'dark' | 'brand';
  /** false renders the drop emblem only */
  showText?: boolean;
  /** small caption under the wordmark, e.g. "ENTERPRISE ADMIN" */
  tagline?: string;
  /** `stacked` renders the complete official lock-up (emblem, wordmark and "Click. Connect. Construct") */
  layout?: 'inline' | 'stacked';
  className?: string;
}

const MARK_HEIGHT = { sm: 'h-7', md: 'h-8', lg: 'h-10', xl: 'h-14' } as const;
const WORD_HEIGHT = { sm: 'h-3', md: 'h-3.5', lg: 'h-[18px]', xl: 'h-6' } as const;
const STACK_HEIGHT = { sm: 'h-16', md: 'h-20', lg: 'h-28', xl: 'h-36' } as const;

/** Official JBCONX logo, rendered from the brand artwork in shared/assets/brand. */
export const JBConXLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'brand',
  showText = true,
  tagline,
  layout = 'inline',
  className = '',
}) => {
  const onDark = variant === 'light';

  if (layout === 'stacked') {
    return (
      <img
        src={onDark ? logoWhiteUrl : logoUrl}
        alt="JBCONX — Click. Connect. Construct"
        className={`${STACK_HEIGHT[size]} w-auto select-none ${className}`}
        draggable={false}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <img src={markUrl} alt={showText ? '' : 'JBCONX'} className={`${MARK_HEIGHT[size]} w-auto flex-shrink-0 select-none`} draggable={false} />
      {showText && (
        <div className="flex flex-col justify-center gap-1 min-w-0">
          <img
            src={onDark ? wordmarkWhiteUrl : wordmarkUrl}
            alt="JBCONX"
            className={`${WORD_HEIGHT[size]} w-auto self-start select-none`}
            draggable={false}
          />
          {tagline && (
            <span className={`text-[9px] font-semibold uppercase tracking-[0.14em] leading-none truncate ${onDark ? 'text-brand-200' : 'text-slate-500'}`}>
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
