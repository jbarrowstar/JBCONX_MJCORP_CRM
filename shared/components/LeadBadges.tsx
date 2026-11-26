import React from 'react';
import {
  LEAD_STATUS_LABELS, LEAD_STATUS_STYLES, PRIORITIES, PRIORITY_LABELS, PRIORITY_STYLES,
  type LeadStatusValue, type PriorityValue,
} from '../api/crm';

export const LeadStatusBadge: React.FC<{ status: LeadStatusValue }> = ({ status }) => (
  <span className={`badge ${LEAD_STATUS_STYLES[status]}`}>
    <span className="dot bg-[var(--dot)]" aria-hidden="true" />
    {LEAD_STATUS_LABELS[status]}
  </span>
);

/** Priority as a compact signal-strength indicator plus its label. */
export const PriorityBadge: React.FC<{ priority: PriorityValue }> = ({ priority }) => {
  const level = PRIORITIES.indexOf(priority) + 1;
  return (
    <span className={`inline-flex items-center gap-1.5 text-2xs font-medium whitespace-nowrap ${PRIORITY_STYLES[priority]}`}>
      <span className="inline-flex items-end gap-[2px] h-2.5" aria-hidden="true">
        {[1, 2, 3, 4].map((b) => (
          <span key={b} className={`w-[3px] rounded-sm ${b <= level ? 'bg-current' : 'bg-slate-200'}`} style={{ height: `${b * 25}%` }} />
        ))}
      </span>
      {PRIORITY_LABELS[priority]}
    </span>
  );
};
