import React, { useState } from 'react';
import { 
  CalendarCheck, 
  Camera, 
  MapPin, 
  Plus, 
  CheckCircle, 
  X,
  UploadCloud 
} from 'lucide-react';
import { VisitRecord } from '@shared/types';
import { formatDate } from '@shared/utils';

export const AgentVisitsPage: React.FC = () => {
  const [visits, setVisits] = useState<VisitRecord[]>([
    {
      id: 'vst_1',
      agentId: 'ag_1',
      agentName: 'David Miller',
      customerName: 'Robert Vance - Vance Corp',
      leadId: 'ld_1',
      leadCode: 'LID-8821',
      visitDate: '2026-11-06',
      visitTime: '10:30 AM',
      location: { lat: 41.8781, lng: -87.6298, address: '500 W Madison, Chicago' },
      remarks: 'Product presentation completed. Contract submitted.',
      visitStatus: 'COMPLETED',
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [photoCaptured, setPhotoCaptured] = useState(false);

  const handleSimulateCamera = () => {
    // Simulates Capacitor Camera takePhoto()
    setPhotoCaptured(true);
  };

  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return;

    const newVisit: VisitRecord = {
      id: `vst_${Date.now()}`,
      agentId: 'ag_1',
      agentName: 'David Miller',
      customerName,
      leadId: `ld_${Date.now()}`,
      leadCode: `LID-${Math.floor(1000 + Math.random() * 9000)}`,
      visitDate: new Date().toISOString().split('T')[0],
      visitTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: { lat: 41.8781, lng: -87.6298, address: 'Current GPS Geolocation' },
      remarks,
      visitStatus: 'COMPLETED',
    };

    setVisits([newVisit, ...visits]);
    setIsModalOpen(false);
    setCustomerName('');
    setRemarks('');
    setPhotoCaptured(false);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Visits</h1>
          <p className="text-xs text-slate-500">Record on-site visits with GPS and photos</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 bg-[#274C77] text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Visit
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {visits.map(visit => (
          <div key={visit.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#274C77] bg-blue-50 px-2 py-0.5 rounded">
                  {visit.leadCode}
                </span>
                <h3 className="text-xs font-bold text-slate-900 mt-1">{visit.customerName}</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {visit.visitStatus}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{visit.location.address}</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
              {visit.remarks}
            </div>

            <div className="text-[10px] text-slate-400">
              {formatDate(visit.visitDate)} at {visit.visitTime}
            </div>
          </div>
        ))}
      </div>

      {/* Record Visit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Customer Interaction</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Customer / Lead Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Visit Notes</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Meeting outcome..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              {/* Native Camera Simulation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">On-Site Photo Verification</label>
                <button
                  type="button"
                  onClick={handleSimulateCamera}
                  className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <Camera className="w-5 h-5 text-[#274C77]" />
                  <span className="text-xs font-semibold">
                    {photoCaptured ? '✓ Photo Captured (Stored in App Cache)' : 'Tap to Launch Native Camera'}
                  </span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#274C77] flex-shrink-0" />
                <span>Current GPS coordinates will be automatically tagged upon submission.</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#274C77] text-white font-bold rounded-xl text-xs shadow-md mt-2"
              >
                Submit Visit Log
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

