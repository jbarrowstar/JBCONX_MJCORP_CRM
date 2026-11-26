import React from 'react';
import { FlaskConical } from 'lucide-react';

/** Shown on screens that still display sample data so nobody mistakes it for live CRM data. */
export const PreviewBanner: React.FC<{ phase?: string }> = ({ phase }) => (
  <div role="note" className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-2.5 text-[11px]">
    <FlaskConical className="w-4 h-4 mt-px flex-shrink-0" />
    <p>
      <strong>Preview screen.</strong> Sample data only; not connected to the CRM yet{phase ? ` (planned: ${phase})` : ''}.
    </p>
  </div>
);
