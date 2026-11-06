import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  X
} from 'lucide-react';
import { Lead, LeadStatus } from '@shared/types';
import { LEAD_STATUS_CONFIG } from '@shared/constants';
import { formatDate } from '@shared/utils';

const initialLeads: Lead[] = [
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
    assignedAgentName: 'David Miller',
    assignedAgentId: 'ag_1',
    teamName: 'Northern Squad',
    status: 'Interested',
    remarks: 'Met on-site. Very positive initial presentation.',
    createdAt: '2026-10-24T10:15:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    id: 'ld_2',
    leadCode: 'LID-8822',
    customerName: 'Elena Rostova',
    mobileNumber: '+1 555-0381',
    email: 'elena@novatech.io',
    city: 'Austin',
    state: 'TX',
    leadSource: 'Inbound Web',
    interestedService: 'Enterprise CRM Setup',
    assignedAgentName: 'Sarah Jenkins',
    assignedAgentId: 'ag_2',
    teamName: 'Western Squad',
    status: 'Meeting Scheduled',
    remarks: 'Demo call scheduled for coming Tuesday at 2 PM.',
    createdAt: '2026-10-25T11:00:00Z',
    updatedAt: '2026-10-25T15:20:00Z',
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
    assignedAgentName: 'David Miller',
    assignedAgentId: 'ag_1',
    teamName: 'Northern Squad',
    status: 'Converted',
    remarks: 'Contracts signed. Proceeding with customer onboarding.',
    createdAt: '2026-10-22T09:00:00Z',
    updatedAt: '2026-10-26T16:00:00Z',
  },
  {
    id: 'ld_4',
    leadCode: 'LID-8824',
    customerName: 'Chloe Bennett',
    mobileNumber: '+1 555-4421',
    email: 'chloe@bennettretail.com',
    city: 'Atlanta',
    state: 'GA',
    leadSource: 'Cold Call',
    interestedService: 'Brand Launch Campaign',
    assignedAgentName: 'James Carter',
    assignedAgentId: 'ag_3',
    teamName: 'Southern Squad',
    status: 'New',
    remarks: 'Initial contact made; awaiting callback request.',
    createdAt: '2026-10-26T08:30:00Z',
    updatedAt: '2026-10-26T08:30:00Z',
  }
];

export const LeadManagementPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Lead Form State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newService, setNewService] = useState('Commercial Marketing Bundle');
  const [newSource, setNewSource] = useState('Field Visit');
  const [newRemarks, setNewRemarks] = useState('');

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newMobile) return;

    const newLeadRecord: Lead = {
      id: `ld_${Date.now()}`,
      leadCode: `LID-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newCustomerName,
      mobileNumber: newMobile,
      email: newEmail || undefined,
      city: newCity || 'National',
      state: newState || 'HQ',
      leadSource: newSource,
      interestedService: newService,
      assignedAgentName: 'David Miller',
      assignedAgentId: 'ag_1',
      teamName: 'Northern Squad',
      status: 'New',
      remarks: newRemarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLeads([newLeadRecord, ...leads]);
    setIsAddModalOpen(false);
    // Reset Form
    setNewCustomerName('');
    setNewMobile('');
    setNewEmail('');
    setNewCity('');
    setNewState('');
    setNewRemarks('');
  };

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, status: newStatus, updatedAt: new Date().toISOString() });
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.leadCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.mobileNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Management</h1>
          <p className="text-sm text-slate-500">Track, qualify, assign, and convert prospects across field sales channels.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => alert('Exporting leads in CSV format...')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#274C77] rounded-lg hover:bg-[#1B3B6F] shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Lead
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, code, phone..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274C77] focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Assigned">Assigned</option>
            <option value="Contacted">Contacted</option>
            <option value="Interested">Interested</option>
            <option value="Meeting Scheduled">Meeting Scheduled</option>
            <option value="Converted">Converted</option>
            <option value="Registered">Registered</option>
            <option value="Onboarded">Onboarded</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Lead ID / Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Interested Service</th>
                <th className="py-3 px-4">Assigned Agent / Squad</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLeads.map((lead) => {
                const statusStyle = LEAD_STATUS_CONFIG[lead.status] || {
                  label: lead.status,
                  color: 'text-slate-700',
                  bg: 'bg-slate-100 border-slate-200',
                };

                return (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{lead.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{lead.leadCode}</div>
                    </td>
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{lead.mobileNumber}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{lead.interestedService}</span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3" /> {lead.city}, {lead.state}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{lead.assignedAgentName || 'Unassigned'}</div>
                      <div className="text-[11px] text-slate-400">{lead.teamName || 'Squad Unassigned'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.color}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(lead.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="text-xs font-semibold text-[#274C77] hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Lead Details Drawer / View */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#274C77] bg-blue-50 px-2 py-0.5 rounded">
                  {selectedLead.leadCode}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedLead.customerName}</h2>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Update Strip */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-600">Current Lifecycle Status</span>
                  <div className="mt-1">
                    <span className="text-xs font-bold text-slate-900">{selectedLead.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Update to:</span>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleStatusChange(selectedLead.id, e.target.value as LeadStatus)}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-[#274C77] focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Meeting Scheduled">Meeting Scheduled</option>
                    <option value="Converted">Converted</option>
                    <option value="Registered">Registered</option>
                    <option value="Onboarded">Onboarded</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Customer Phone</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLead.mobileNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Customer Email</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLead.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Service Interest</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLead.interestedService}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Territory Location</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLead.city}, {selectedLead.state}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Assigned Field Agent</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLead.assignedAgentName || 'Unassigned'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Regional Squad</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLead.teamName || 'None'}</p>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <span className="text-xs text-slate-400 font-medium">Agent On-Site Notes & Remarks</span>
                <p className="mt-1 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedLead.remarks || 'No notes provided yet.'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Lead Form */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Add New Prospect Lead</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Acme Industrial Corp"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="contact@acme.com"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. Dallas"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    placeholder="TX"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                  >
                    <option value="Field Visit">Field Visit</option>
                    <option value="Inbound Web">Inbound Web</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Call">Cold Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Interested Service</label>
                  <select
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                  >
                    <option value="Commercial Marketing Bundle">Commercial Marketing</option>
                    <option value="Enterprise CRM Setup">Enterprise CRM</option>
                    <option value="Digital Advertising Strategy">Digital Advertising</option>
                    <option value="Brand Launch Campaign">Brand Launch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Requirements</label>
                <textarea
                  rows={2}
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  placeholder="Notes from initial interaction..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#274C77] hover:bg-[#1B3B6F] rounded-lg shadow-sm"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
