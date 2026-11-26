import React from 'react';
import { FlaskConical } from 'lucide-react';

/** Shown on screens that still display sample data so nobody mistakes it for live CRM data. */
export const PreviewBanner: React.FC<{ phase?: string }> = ({ phase }) => (
  <div role="note" className="mb-5 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-4 py-3 text-[13px]">
    <FlaskConical className="w-4 h-4 mt-px flex-shrink-0" />
    <p>
      <strong>Preview screen.</strong> This page still shows sample data and is not connected to the CRM backend yet
      {phase ? ` (planned: ${phase})` : ''}. Do not use it for real decisions.
    </p>
  </div>
);
