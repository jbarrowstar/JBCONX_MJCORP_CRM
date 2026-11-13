import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Network, 
  MapPin, 
  Clock, 
  CalendarCheck, 
  CheckSquare, 
  FileCheck2, 
  BarChart3, 
  Settings,
  ShieldCheck
} from 'lucide-react';
import { useAppSelector } from '../../redux/hooks';
import { CRM_THEMES } from '@shared/constants/themes';
import { JBConXLogo } from '@shared/components/JBConXLogo';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const navigationItems: SidebarItem[] = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Lead Management', path: '/admin/leads', icon: Users },
  { name: 'Agent Management', path: '/admin/agents', icon: UserCheck },
  { name: 'Team Management', path: '/admin/teams', icon: Network },
  { name: 'Field Tracking', path: '/admin/tracking', icon: MapPin },
  { name: 'Visits & Attendance', path: '/admin/attendance', icon: Clock },
  { name: 'Follow-ups & Tasks', path: '/admin/followups', icon: CheckSquare },
  { name: 'Customer Visits', path: '/admin/visits', icon: CalendarCheck },
  { name: 'Registration & Onboarding', path: '/admin/onboarding', icon: FileCheck2 },
  { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export const AdminSidebar: React.FC = () => {
  const { sidebarOpen, theme } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);
  const themeConfig = CRM_THEMES[theme] || CRM_THEMES['classic-blue'];

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-all duration-300">
      {/* Brand Header with Logo */}
      <div className={`h-16 flex items-center justify-between px-4 border-b border-white/10 bg-gradient-to-r ${themeConfig.headerGrad} shadow-sm`}>
        <div className="h-12 px-3 py-1 bg-white rounded-xl shadow-md flex items-center justify-center border border-white/30">
          <img src="/jbconx-logo.png" alt="JBConX" className="h-10 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>CRM</span>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-bold text-slate-700">{user?.role || 'ADMIN'}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 font-mono">{themeConfig.badge}</span>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? themeConfig.activeItemBg
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Summary */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-xl text-white font-black flex items-center justify-center text-xs shadow-md"
            style={{ backgroundColor: themeConfig.secondary }}
          >
            {user?.name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-400 truncate font-medium">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
