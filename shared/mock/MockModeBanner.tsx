import React, { useState } from 'react';
import { FlaskConical, RotateCcw, ChevronDown } from 'lucide-react';

/**
 * DEVELOPMENT-ONLY indicator shown while the mock API is active, so nobody mistakes sample data for real CRM data.
 * Rendered only when MOCK_API_ENABLED is true (never in production builds).
 */
export const MockModeBanner: React.FC = () => {
  const [open, setOpen] = useState(false);

  const reset = async () => {
    if (!window.confirm('Reset all mock data in this browser back to the sample data? You will be signed out.')) return;
    const { resetMockData } = await import('./mockBackend');
    resetMockData();
    try {
      window.localStorage.removeItem('jbconx.crm.token');
      window.sessionStorage.removeItem('jbconx.crm.token');
    } catch {
      /* ignore */
    }
    window.location.assign('/login');
  };

  return (
    <div className="fixed right-3 bottom-20 md:bottom-3 z-[80] max-w-[calc(100vw-1.5rem)] text-xs flex flex-col items-end">
      {open && (
        <div className="mb-2 w-72 rounded-lg border border-amber-300 bg-white p-3 shadow-raised text-slate-700 animate-slide-up">
          <p className="font-semibold text-slate-900">Mock mode (development only)</p>
          <p className="mt-1">
            The CRM backend is not used. Data is sample data stored in this browser only. Nothing is saved to MongoDB, and the
            admin and agent apps keep separate copies.
          </p>
          <button type="button" onClick={() => void reset()} className="btn btn-secondary btn-sm mt-3 w-full">
            <RotateCcw className="w-3.5 h-3.5" /> Reset mock data
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 font-semibold text-amber-900 shadow-card hover:bg-amber-100"
        aria-expanded={open}
      >
        <FlaskConical className="w-3.5 h-3.5" /> MOCK MODE · sample data
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
