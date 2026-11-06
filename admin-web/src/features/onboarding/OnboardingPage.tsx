import React, { useState } from 'react';
import { 
  FileCheck2, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Download 
} from 'lucide-react';
import { formatDate } from '@shared/utils';

interface OnboardingCustomer {
  id: string;
  customerId: string;
  leadCode: string;
  customerName: string;
  registrationDate: string;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  documentStatus: 'COMPLETE' | 'ACTION_REQUIRED';
  approvalStatus: 'APPROVED' | 'UNDER_REVIEW' | 'REJECTED';
  onboardingStatus: 'ONBOARDED' | 'IN_PROGRESS' | 'DOCS_PENDING';
}

const initialRegistrations: OnboardingCustomer[] = [
  {
    id: 'reg_1',
    customerId: 'CUST-901',
    leadCode: 'LID-8823',
    customerName: 'Marcus Aurelius Group',
    registrationDate: '2026-10-26',
    kycStatus: 'VERIFIED',
    documentStatus: 'COMPLETE',
    approvalStatus: 'APPROVED',
    onboardingStatus: 'ONBOARDED',
  },
  {
    id: 'reg_2',
    customerId: 'CUST-902',
    leadCode: 'LID-8821',
    customerName: 'Robert Vance - Vance Corp',
    registrationDate: '2026-11-04',
    kycStatus: 'VERIFIED',
    documentStatus: 'COMPLETE',
    approvalStatus: 'UNDER_REVIEW',
    onboardingStatus: 'IN_PROGRESS',
  },
  {
    id: 'reg_3',
    customerId: 'CUST-903',
    leadCode: 'LID-8822',
    customerName: 'Elena Rostova - NovaTech',
    registrationDate: '2026-11-05',
    kycStatus: 'PENDING',
    documentStatus: 'ACTION_REQUIRED',
    approvalStatus: 'UNDER_REVIEW',
    onboardingStatus: 'DOCS_PENDING',
  }
];

export const OnboardingPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<OnboardingCustomer[]>(initialRegistrations);
  const [search, setSearch] = useState('');

  const handleApprove = (id: string) => {
    setRegistrations(registrations.map(r => r.id === id ? {
      ...r,
      approvalStatus: 'APPROVED',
      kycStatus: 'VERIFIED',
      onboardingStatus: 'ONBOARDED'
    } : r));
  };

  const filtered = registrations.filter(r => 
    r.customerName.toLowerCase().includes(search.toLowerCase()) ||
    r.customerId.toLowerCase().includes(search.toLowerCase()) ||
    r.leadCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registration & Onboarding</h1>
          <p className="text-sm text-slate-500">Track client contract sign-offs, KYC document verifications, and onboarding workflows.</p>
        </div>
        <button
          onClick={() => alert('Exporting registration records...')}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" /> Export Records
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, customer ID, or lead code..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274C77] text-slate-800"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Customer & IDs</th>
              <th className="py-3 px-4">Registration Date</th>
              <th className="py-3 px-4">KYC Status</th>
              <th className="py-3 px-4">Documents</th>
              <th className="py-3 px-4">Compliance Approval</th>
              <th className="py-3 px-4">Onboarding Lifecycle</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{item.customerName}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span>{item.customerId}</span>
                    <span>•</span>
                    <span>{item.leadCode}</span>
                  </div>
                </td>
                <td className="py-3 px-4">{formatDate(item.registrationDate)}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.kycStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    item.kycStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {item.kycStatus}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-[11px] font-medium ${
                    item.documentStatus === 'COMPLETE' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {item.documentStatus === 'COMPLETE' ? '✓ All Uploaded' : '⚠️ Missing Tax ID'}
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{item.approvalStatus}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.onboardingStatus === 'ONBOARDED' ? 'bg-green-100 text-green-800' :
                    item.onboardingStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {item.onboardingStatus}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {item.approvalStatus !== 'APPROVED' ? (
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-[#274C77] rounded-lg hover:bg-[#1B3B6F]"
                    >
                      Approve KYC
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Verified</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

