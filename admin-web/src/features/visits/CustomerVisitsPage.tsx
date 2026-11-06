import React, { useState } from 'react';
import { 
  CalendarCheck, 
  MapPin, 
  Search, 
  Calendar, 
  Image as ImageIcon, 
  Clock, 
  CheckCircle,
  X 
} from 'lucide-react';
import { VisitRecord } from '@shared/types';
import { formatDate } from '@shared/utils';

const initialVisits: VisitRecord[] = [
  {
    id: 'vst_1',
    agentId: 'ag_1',
    agentName: 'David Miller',
    customerName: 'Robert Vance - Vance Corp',
    leadId: 'ld_1',
    leadCode: 'LID-8821',
    visitDate: '2026-11-05',
    visitTime: '11:30 AM',
    location: { lat: 41.8781, lng: -87.6298, address: '500 W Madison St, Chicago, IL' },
    remarks: 'Presented the enterprise bundle. Discussed contract duration and onboarding timeline.',
    visitStatus: 'COMPLETED',
  },
  {
    id: 'vst_2',
    agentId: 'ag_2',
    agentName: 'Sarah Jenkins',
    customerName: 'Elena Rostova - NovaTech',
    leadId: 'ld_2',
    leadCode: 'LID-8822',
    visitDate: '2026-11-05',
    visitTime: '02:00 PM',
    location: { lat: 30.2672, lng: -97.7431, address: 'Congress Ave, Austin, TX' },
    remarks: 'Conducted live system walkthrough with the regional VP of Marketing.',
    visitStatus: 'COMPLETED',
  },
  {
    id: 'vst_3',
    agentId: 'ag_3',
    agentName: 'James Carter',
    customerName: 'Marcus Aurelius Group',
    leadId: 'ld_3',
    leadCode: 'LID-8823',
    visitDate: '2026-11-06',
    visitTime: '10:00 AM',
    location: { lat: 40.7128, lng: -74.0060, address: '48 Wall Street, New York, NY' },
    remarks: 'Finalized service agreements. Client signed letter of intent.',
    visitStatus: 'COMPLETED',
  }
];

export const CustomerVisitsPage: React.FC = () => {
  const [visits] = useState<VisitRecord[]>(initialVisits);
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null);
  const [search, setSearch] = useState('');

  const filtered = visits.filter(v => 
    v.customerName.toLowerCase().includes(search.toLowerCase()) ||
    v.agentName.toLowerCase().includes(search.toLowerCase()) ||
    v.leadCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Visits</h1>
          <p className="text-sm text-slate-500">Inspect on-site interactions, GPS coordinates, customer notes, and verification logs.</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, lead ID, or agent..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274C77] text-slate-800"
          />
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Client / Prospect</th>
              <th className="py-3 px-4">Field Agent</th>
              <th className="py-3 px-4">Visit Date & Time</th>
              <th className="py-3 px-4">GPS Verification Location</th>
              <th className="py-3 px-4">Remarks</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filtered.map(visit => (
              <tr key={visit.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{visit.customerName}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{visit.leadCode}</div>
                </td>
                <td className="py-3 px-4 font-medium text-slate-800">{visit.agentName}</td>
                <td className="py-3 px-4">
                  <div>{formatDate(visit.visitDate)}</div>
                  <div className="text-[11px] text-slate-400">{visit.visitTime}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-[#274C77] flex-shrink-0" />
                    <span className="truncate max-w-xs">{visit.location.address}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <p className="truncate max-w-xs text-slate-600">{visit.remarks}</p>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {visit.visitStatus}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => setSelectedVisit(visit)}
                    className="text-xs font-semibold text-[#274C77] hover:underline"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visit Details Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#274C77] bg-blue-50 px-2 py-0.5 rounded">
                  {selectedVisit.leadCode}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedVisit.customerName}</h2>
              </div>
              <button onClick={() => setSelectedVisit(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-medium">Conducted by Agent</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedVisit.agentName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Timestamp</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{formatDate(selectedVisit.visitDate)} at {selectedVisit.visitTime}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Geotagged Address</span>
                <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#274C77]" />
                  {selectedVisit.location.address}
                </p>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Coordinates: {selectedVisit.location.lat}, {selectedVisit.location.lng}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Agent Meeting Notes</span>
                <div className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                  {selectedVisit.remarks}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2 text-[#274C77]">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Geofence match verified against customer registered location.</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

