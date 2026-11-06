import React from 'react';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Award,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar 
} from 'recharts';
import { StoreDownloadsCard } from '../../components/charts/StoreDownloadsCard';

const mockLeadTrend = [
  { month: 'May', leads: 42, converted: 18 },
  { month: 'Jun', leads: 58, converted: 26 },
  { month: 'Jul', leads: 74, converted: 35 },
  { month: 'Aug', leads: 91, converted: 48 },
  { month: 'Sep', leads: 115, converted: 62 },
  { month: 'Oct', leads: 148, converted: 84 },
];

const mockSourceDistribution = [
  { name: 'Field Visits', value: 45 },
  { name: 'Inbound Web', value: 25 },
  { name: 'Referrals', value: 18 },
  { name: 'Cold Calls', value: 12 },
];

export const AdminDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500">Live operational overview of JBConX Marketing, Field Sales & App Distribution.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking Active
          </span>
        </div>
      </div>

      {/* NEW: Live Play Store & App Store Downloads Real-Time Telemetry Card */}
      <StoreDownloadsCard />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Leads</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">1,428</h3>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-2">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% vs last month
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#274C77] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Field Agents</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">36</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-2">
              Across 4 regional squads
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Today's Visits</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">84</h3>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-2">
              <Clock className="w-3.5 h-3.5" /> 68 Completed / 16 In Progress
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Conversions</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">342</h3>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-2">
              <TrendingUp className="w-3.5 h-3.5" /> 23.9% conversion rate
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Lead Acquisition & Conversions</h2>
              <p className="text-xs text-slate-500">6-month trend comparison</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockLeadTrend}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#274C77" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#274C77" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6096BA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6096BA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tickLine={false} stroke="#64748B" fontSize={12} />
                <YAxis tickLine={false} stroke="#64748B" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="leads" stroke="#274C77" strokeWidth={2} fillOpacity={1} fill="url(#leadGrad)" name="Total Leads" />
                <Area type="monotone" dataKey="converted" stroke="#6096BA" strokeWidth={2} fillOpacity={1} fill="url(#convGrad)" name="Converted" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">Lead Sources</h2>
          <p className="text-xs text-slate-500 mb-4">Channel volume breakdown</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockSourceDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke="#64748B" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="#274C77" radius={[0, 4, 4, 0]} name="Volume (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
