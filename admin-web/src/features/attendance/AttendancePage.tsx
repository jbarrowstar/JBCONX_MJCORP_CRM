import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Filter, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  MapPin 
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '@shared/types';
import { formatDate } from '@shared/utils';

const initialAttendance: AttendanceRecord[] = [
  {
    id: 'att_1',
    agentId: 'ag_1',
    agentName: 'David Miller',
    agentCode: 'AGT-101',
    date: '2026-11-06',
    checkInTime: '08:45 AM',
    checkOutTime: '05:30 PM',
    workingHours: 8.75,
    status: 'PRESENT',
    checkInLocation: { lat: 41.8781, lng: -87.6298, address: 'Downtown Chicago HQ' },
  },
  {
    id: 'att_2',
    agentId: 'ag_2',
    agentName: 'Sarah Jenkins',
    agentCode: 'AGT-102',
    date: '2026-11-06',
    checkInTime: '09:05 AM',
    workingHours: 6.2,
    status: 'PRESENT',
    checkInLocation: { lat: 30.2672, lng: -97.7431, address: 'Austin Tech Corridor' },
  },
  {
    id: 'att_3',
    agentId: 'ag_3',
    agentName: 'James Carter',
    agentCode: 'AGT-103',
    date: '2026-11-06',
    checkInTime: '08:30 AM',
    workingHours: 7.0,
    status: 'PRESENT',
    checkInLocation: { lat: 33.7490, lng: -84.3880, address: 'Peachtree Hub' },
  },
  {
    id: 'att_4',
    agentId: 'ag_4',
    agentName: 'Emily Watson',
    agentCode: 'AGT-104',
    date: '2026-11-06',
    status: 'ON_LEAVE',
  }
];

export const AttendancePage: React.FC = () => {
  const [records] = useState<AttendanceRecord[]>(initialAttendance);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = records.filter(record => {
    const matchesSearch = record.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.agentCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Visits & Attendance</h1>
          <p className="text-sm text-slate-500">Audit daily agent check-in times, geo-fenced coordinates, and total field hours.</p>
        </div>
        <button
          onClick={() => alert('Exporting attendance logs...')}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" /> Export Logs
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by agent name or ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274C77] text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
          >
            <option value="ALL">All Attendance</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="HALF_DAY">Half Day</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Field Agent</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Check-In</th>
              <th className="py-3 px-4">Check-Out</th>
              <th className="py-3 px-4">Field Hours</th>
              <th className="py-3 px-4">GPS Verification Location</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{item.agentName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{item.agentCode}</div>
                </td>
                <td className="py-3 px-4">{formatDate(item.date)}</td>
                <td className="py-3 px-4 font-semibold text-slate-800">{item.checkInTime || '-'}</td>
                <td className="py-3 px-4 font-semibold text-slate-800">{item.checkOutTime || 'Active In Field'}</td>
                <td className="py-3 px-4">{item.workingHours ? `${item.workingHours} hrs` : '-'}</td>
                <td className="py-3 px-4">
                  {item.checkInLocation ? (
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-[#274C77]" />
                      <span>{item.checkInLocation.address}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">-</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    item.status === 'ON_LEAVE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

