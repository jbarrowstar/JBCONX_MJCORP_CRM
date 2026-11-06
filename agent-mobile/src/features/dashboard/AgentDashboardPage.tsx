import React from 'react';
import { 
  Users, 
  MapPin, 
  Calendar, 
  Award, 
  PlusCircle, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  PhoneCall
} from 'lucide-react';
import { useAppSelector } from '../../redux/hooks';
import { Link } from 'react-router-dom';
import { CRM_THEMES } from '@shared/constants/themes';

export const AgentDashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const currentTheme = useAppSelector((state) => state.ui.theme) || 'classic-blue';
  const themeConfig = CRM_THEMES[currentTheme] || CRM_THEMES['classic-blue'];

  return (
    <div className="space-y-6">
      {/* Dynamic Theme Banner Card */}
      <div 
        className={`text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden bg-gradient-to-br ${themeConfig.headerGrad}`}
      >
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-white/90" />
              <span className="text-xs uppercase tracking-wider text-white/90 font-black">Field Agent Representative</span>
              <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20 font-bold">
                {user?.teamName || 'Northern Squad'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-white">Welcome, {user?.name || 'Agent'}</h1>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-lg font-medium">
              Daily quota target tracking, fast customer capture, and scheduled meetings.
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col gap-2 min-w-[210px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80 font-medium">Today's Shift:</span>
              <span className="font-bold text-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Punch
              </span>
            </div>
            <div className="text-xs text-white/90">
              Checked In: <strong className="text-white">08:45 AM</strong>
            </div>
            <Link
              to="/attendance"
              className="mt-1 w-full text-center bg-white text-slate-900 hover:bg-slate-100 font-black text-xs py-2 px-3 rounded-xl transition-all shadow-md"
            >
              Punch Shift Attendance
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Leads</span>
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: themeConfig.secondary }}
            >
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">28</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +4 this week
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Visits</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">5</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">3 completed / 2 scheduled</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversions</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">9</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">84% of monthly target</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Tasks</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">3</div>
            <div className="text-[11px] text-rose-600 font-bold mt-1">1 high priority follow-up</div>
          </div>
        </div>
      </div>

      {/* Quick Fast Actions */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Fast Field Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/leads"
            className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-xs transition-colors shadow-sm text-slate-800"
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
              style={{ backgroundColor: themeConfig.secondary }}
            >
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Add New Prospect</div>
              <div className="text-[11px] font-normal text-slate-500">Capture walk-in client</div>
            </div>
          </Link>

          <Link
            to="/visits"
            className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 font-bold text-xs transition-colors shadow-sm text-emerald-950"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Log Customer Visit</div>
              <div className="text-[11px] font-normal text-emerald-700">Record GPS & notes</div>
            </div>
          </Link>

          <Link
            to="/attendance"
            className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-xs transition-colors shadow-sm text-slate-800"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Shift Attendance</div>
              <div className="text-[11px] font-normal text-slate-500">Geofenced punch</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Appointment Schedule */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Today's Appointment Schedule</h2>
            <p className="text-xs text-slate-500">Assigned customer visits & calls</p>
          </div>
          <Link 
            to="/visits" 
            className="text-xs font-bold flex items-center gap-1 hover:underline"
            style={{ color: themeConfig.secondary }}
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between">
            <div className="space-y-1">
              <span 
                className="text-[10px] font-bold text-white px-2 py-0.5 rounded-md"
                style={{ backgroundColor: themeConfig.secondary }}
              >
                14:00 PM • Commercial Demo
              </span>
              <div className="text-sm font-bold text-slate-900 mt-1">Apex Solutions Ltd</div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> 150 N Michigan Ave, Chicago
              </div>
            </div>
            <Link
              to="/visits"
              className="px-3 py-1.5 text-white font-bold text-xs rounded-xl shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: themeConfig.secondary }}
            >
              Start Visit
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                16:30 PM • Contract Closing
              </span>
              <div className="text-sm font-bold text-slate-900 mt-1">Green Horizon Foods</div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400" /> Phone Call & Final Handoff
              </div>
            </div>
            <a
              href="tel:+15550192"
              className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-700"
            >
              Call Client
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
