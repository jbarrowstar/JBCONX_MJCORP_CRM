import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Globe, 
  Bell, 
  Layers, 
  Key, 
  Save 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [companyName, setCompanyName] = useState('JBConX Marketing Group');
  const [crmEmail, setCrmEmail] = useState('support@jbconx.com');
  const [enableGPSStrictCheck, setEnableGPSStrictCheck] = useState(true);
  const [leadAutoAssignment, setLeadAutoAssignment] = useState(true);
  const [minVisitDurationMinutes, setMinVisitDurationMinutes] = useState(15);
  const [notificationDigest, setNotificationDigest] = useState('INSTANT');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings successfully updated and synchronized with backend policy configuration.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500">Configure global CRM business parameters, field tracking rules, and security controls.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Brand Profile */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Globe className="w-5 h-5 text-[#274C77]" />
            <h2 className="text-base font-bold text-slate-900">Organization & Branding</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Entity Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">System Dispatch Email</label>
              <input
                type="email"
                value={crmEmail}
                onChange={(e) => setCrmEmail(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
              />
            </div>
          </div>
        </div>

        {/* Field Tracking & Security Policies */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Shield className="w-5 h-5 text-[#274C77]" />
            <h2 className="text-base font-bold text-slate-900">Field Operations & Geofencing Rules</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Strict GPS Radius Enforcement</p>
                <p className="text-[11px] text-slate-500">Require mobile agents to be within 200m of customer address to verify visits.</p>
              </div>
              <input
                type="checkbox"
                checked={enableGPSStrictCheck}
                onChange={(e) => setEnableGPSStrictCheck(e.target.checked)}
                className="w-4 h-4 text-[#274C77] rounded focus:ring-[#274C77]"
              />
            </div>

            <div className="flex items-start justify-between pt-3 border-t border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-800">Automated Lead Assignment Algorithm</p>
                <p className="text-[11px] text-slate-500">Auto-route inbound web and cold leads to the nearest regional squad agent.</p>
              </div>
              <input
                type="checkbox"
                checked={leadAutoAssignment}
                onChange={(e) => setLeadAutoAssignment(e.target.checked)}
                className="w-4 h-4 text-[#274C77] rounded focus:ring-[#274C77]"
              />
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Visit Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={minVisitDurationMinutes}
                onChange={(e) => setMinVisitDurationMinutes(Number(e.target.value))}
                className="w-32 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
              />
            </div>
          </div>
        </div>

        {/* Save button bar */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#274C77] hover:bg-[#1B3B6F] rounded-xl shadow-md transition-all"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
};

