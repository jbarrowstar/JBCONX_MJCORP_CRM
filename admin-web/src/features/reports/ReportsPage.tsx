import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Award, 
  MapPin 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const teamPerformanceData = [
  { squad: 'Northern Squad', leads: 420, visits: 180, conversions: 104 },
  { squad: 'Western Squad', leads: 380, visits: 165, conversions: 96 },
  { squad: 'Southern Squad', leads: 290, visits: 120, conversions: 72 },
  { squad: 'Eastern Squad', leads: 210, visits: 95, conversions: 51 },
];

const conversionByService = [
  { name: 'Commercial Marketing', value: 45, color: '#274C77' },
  { name: 'Enterprise CRM', value: 30, color: '#6096BA' },
  { name: 'Digital Strategy', value: 15, color: '#A3CEF1' },
  { name: 'Brand Launch', value: 10, color: '#8B8C89' },
];

export const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('LAST_30_DAYS');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Comprehensive executive intelligence on sales pipelines, field efficiency, and conversions.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 shadow-sm focus:outline-none"
          >
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="THIS_QUARTER">This Quarter</option>
          </select>
          <button
            onClick={() => alert('Generating aggregated PDF intelligence report...')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#274C77] rounded-lg hover:bg-[#1B3B6F] shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF Summary
          </button>
        </div>
      </div>

      {/* Summary KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Gross Pipeline Volume</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">1,300 Leads</h3>
          <p className="text-xs text-emerald-600 font-semibold mt-1">+18.5% YoY Growth</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Field Visits Executed</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">560 Visits</h3>
          <p className="text-xs text-slate-500 mt-1">94% Geo-verification rate</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Closed Conversions</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">323 Customers</h3>
          <p className="text-xs text-emerald-600 font-semibold mt-1">24.8% Conversion Ratio</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Avg Response Time</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">2.4 Hours</h3>
          <p className="text-xs text-emerald-600 font-semibold mt-1">-35 mins vs benchmark</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Squad Performance Comparison */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Regional Squad Comparative Throughput</h2>
          <p className="text-xs text-slate-500 mb-4">Leads, On-site Visits, and Conversions by Squad</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="squad" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" fill="#274C77" radius={[4, 4, 0, 0]} name="Leads" />
                <Bar dataKey="visits" fill="#6096BA" radius={[4, 4, 0, 0]} name="Field Visits" />
                <Bar dataKey="conversions" fill="#10B981" radius={[4, 4, 0, 0]} name="Won Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown by Service */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Conversion by Product</h2>
          <p className="text-xs text-slate-500 mb-4">Service line distribution</p>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conversionByService}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {conversionByService.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

