import React from 'react';
import { Palette, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setTheme } from '../../redux/slices/uiSlice';
import { CRM_THEMES, ThemeMode } from '@shared/constants/themes';

export const MobileThemeSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.ui.theme) || 'classic-blue';

  const themes: { id: ThemeMode; label: string; colors: string[] }[] = [
    { id: 'classic-blue', label: 'Sapphire', colors: ['#274C77', '#6096BA'] },
    { id: 'emerald-luxury', label: 'Emerald', colors: ['#047857', '#10B981'] },
    { id: 'midnight-indigo', label: 'Obsidian', colors: ['#312E81', '#6366F1'] },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
      <Palette className="w-3.5 h-3.5 text-slate-400 ml-1" />
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => dispatch(setTheme(t.id))}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
            currentTheme === t.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colors[0] }} />
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
};

