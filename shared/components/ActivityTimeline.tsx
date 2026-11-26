import React from 'react';
import { ACTIVITY_LABELS, formatDateTime, type LeadActivityDto } from '../api/crm';

export const ActivityTimeline: React.FC<{ items: LeadActivityDto[] }> = ({ items }) => {
  if (items.length === 0) return <p className="text-[13px] text-slate-500 py-6 text-center">No activity yet.</p>;
  return (
    <ol className="relative space-y-5 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200" data-testid="activity-timeline">
      {items.map((a) => (
        <li key={a.id} className="relative pl-6">
          <span className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full bg-white border-2 border-brand-600" aria-hidden />
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13px] font-semibold text-slate-900">{ACTIVITY_LABELS[a.type] ?? a.type}</p>
            <time className="text-2xs text-slate-500 whitespace-nowrap">{formatDateTime(a.createdAt)}</time>
          </div>
          {a.message && a.message !== (ACTIVITY_LABELS[a.type] ?? a.type) && <p className="text-[13px] text-slate-600 mt-0.5 whitespace-pre-wrap break-words">{a.message}</p>}
          <p className="text-2xs text-slate-500 mt-1">{a.actor?.name ?? 'System'}</p>
        </li>
      ))}
    </ol>
  );
};
