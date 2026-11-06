export type ThemeMode = 'classic-blue' | 'emerald-luxury' | 'midnight-indigo';

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  badge: string;
  primary: string;
  secondary: string;
  accent: string;
  bgCanvas: string;
  cardBg: string;
  headerGrad: string;
  sidebarBg: string;
  activeItemBg: string;
}

export const CRM_THEMES: Record<ThemeMode, ThemeConfig> = {
  'classic-blue': {
    id: 'classic-blue',
    name: 'Executive Sapphire',
    badge: 'Navy & Ice',
    primary: '#1B3B6F',
    secondary: '#274C77',
    accent: '#6096BA',
    bgCanvas: '#F1F5F9',
    cardBg: '#FFFFFF',
    headerGrad: 'from-[#1B3B6F] via-[#274C77] to-[#4682B4]',
    sidebarBg: '#FFFFFF',
    activeItemBg: 'bg-[#274C77] text-white shadow-md shadow-[#274C77]/20',
  },
  'emerald-luxury': {
    id: 'emerald-luxury',
    name: 'Emerald Wealth',
    badge: 'Forest & Mint',
    primary: '#064E3B',
    secondary: '#047857',
    accent: '#10B981',
    bgCanvas: '#F0FDF4',
    cardBg: '#FFFFFF',
    headerGrad: 'from-[#064E3B] via-[#047857] to-[#059669]',
    sidebarBg: '#FFFFFF',
    activeItemBg: 'bg-[#047857] text-white shadow-md shadow-[#047857]/20',
  },
  'midnight-indigo': {
    id: 'midnight-indigo',
    name: 'Royal Obsidian',
    badge: 'Deep Violet & Gold',
    primary: '#1E1B4B',
    secondary: '#312E81',
    accent: '#6366F1',
    bgCanvas: '#F8FAFC',
    cardBg: '#FFFFFF',
    headerGrad: 'from-[#0F172A] via-[#1E1B4B] to-[#3730A3]',
    sidebarBg: '#FFFFFF',
    activeItemBg: 'bg-[#4338CA] text-white shadow-md shadow-[#4338CA]/20',
  },
};

