import React from 'react';
import { Palette, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setTheme } from '../../redux/slices/uiSlice';
import { CRM_THEMES, ThemeMode } from '@shared/constants/themes';

export const ThemeSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.ui.theme) || 'classic-blue';

  const themes: { id: ThemeMode; label: string; colors: string[] }[] = [
    { id: 'classic-blue', label: 'Sapphire Executive', colors: ['#274C77', '#6096BA', '#A3CEF1'] },
    { id: 'emerald-luxury', label: 'Emerald Wealth', colors: ['#047857', '#10B981', '#A7F3D0'] },
    { id: 'midnight-indigo', label: 'Royal Obsidian', colors: ['#312E81', '#6366F1', '#C7D2FE'] },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
      <Palette className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => dispatch(setTheme(t.id))}
          title={`Switch Theme: ${t.label}`}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
            currentTheme === t.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
          }`}
        >
          <div className="flex -space-x-1">
            <span className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: t.colors[0] }} />
            <span className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: t.colors[1] }} />
          </div>
          <span className="hidden sm:inline">{t.label.split(' ')[0]}</span>
          {currentTheme === t.id && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
        </button>
      ))}
    </div>
  );
};

