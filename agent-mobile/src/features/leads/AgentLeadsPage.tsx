import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  X,
  Send 
} from 'lucide-react';
import { Lead } from '@shared/types';
import { LEAD_STATUS_CONFIG } from '@shared/constants';

const initialAgentLeads: Lead[] = [
  {
    id: 'ld_1',
    leadCode: 'LID-8821',
    customerName: 'Robert Vance',
    mobileNumber: '+1 555-0192',
    email: 'robert@vancecorp.com',
    city: 'Chicago',
    state: 'IL',
    leadSource: 'Field Visit',
    interestedService: 'Commercial Marketing Bundle',
    status: 'Interested',
    remarks: 'Met on-site. Very positive initial presentation.',
    createdAt: '2026-10-24T10:15:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'ld_3',
    leadCode: 'LID-8823',
    customerName: 'Marcus Aurelius',
    mobileNumber: '+1 555-9921',
    city: 'New York',
    state: 'NY',
    leadSource: 'Referral',
    interestedService: 'Digital Advertising Strategy',
    status: 'Converted',
    remarks: 'Contracts signed. Proceeding with customer onboarding.',
    createdAt: '2026-10-22T09:00:00Z',
    updatedAt: '2026-10-26T16:00:00Z',
  }
];

export const AgentLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(initialAgentLeads);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [service, setService] = useState('Commercial Marketing Bundle');
  const [notes, setNotes] = useState('');

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newLead: Lead = {
      id: `ld_${Date.now()}`,
      leadCode: `LID-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: name,
      mobileNumber: phone,
      city: city || 'Local Area',
      state: 'Territory',
      leadSource: 'Field Agent Direct',
      interestedService: service,
      status: 'New',
      remarks: notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLeads([newLead, ...leads]);
    setIsAddOpen(false);
    setName('');
    setPhone('');
    setCity('');
    setNotes('');
  };

  const filtered = leads.filter(l => 
    l.customerName.toLowerCase().includes(search.toLowerCase()) ||
    l.mobileNumber.includes(search)
  );

  return (
    <div className="p-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Leads</h1>
          <p className="text-xs text-slate-500">Your assigned accounts & prospects</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1 bg-[#274C77] text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#274C77] shadow-sm"
        />
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {filtered.map(lead => {
          const statusStyle = LEAD_STATUS_CONFIG[lead.status] || {
            color: 'text-slate-700',
            bg: 'bg-slate-100 border-slate-200'
          };

          return (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{lead.customerName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle.bg} ${statusStyle.color}`}>
                    {lead.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>{lead.mobileNumber}</span>
                  <span>•</span>
                  <span>{lead.city}</span>
                </div>
                <div className="text-[10px] text-[#274C77] font-medium">
                  {lead.interestedService}
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Lead Detail Sheet */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono bg-blue-50 text-[#274C77] px-2 py-0.5 rounded">
                  {selectedLead.leadCode}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedLead.customerName}</h3>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-1 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Phone:</span>
                <a href={`tel:${selectedLead.mobileNumber}`} className="font-semibold text-[#274C77] block mt-0.5">
                  {selectedLead.mobileNumber}
                </a>
              </div>
              <div>
                <span className="text-slate-400">Service:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedLead.interestedService}</p>
              </div>
              <div>
                <span className="text-slate-400">Notes:</span>
                <p className="mt-0.5 p-3 bg-slate-50 rounded-xl text-slate-700 border border-slate-100">
                  {selectedLead.remarks || 'No notes.'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="w-full py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Field Prospect</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Tech Ltd"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0100"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">City / Locality</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Chicago West"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Service Interest</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="Commercial Marketing Bundle">Commercial Marketing</option>
                  <option value="Enterprise CRM Setup">Enterprise CRM</option>
                  <option value="Digital Advertising Strategy">Digital Advertising</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Meeting Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key discussion points..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#274C77] text-white font-bold rounded-xl text-xs shadow-md mt-2"
              >
                Save Prospect
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

