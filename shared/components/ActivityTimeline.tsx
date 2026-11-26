import React from 'react';
import { ACTIVITY_LABELS, formatDateTime, type LeadActivityDto } from '../api/crm';

export const ActivityTimeline: React.FC<{ items: LeadActivityDto[] }> = ({ items }) => {
  if (items.length === 0) return <p className="text-xs text-slate-400 py-4 text-center">No activity yet.</p>;
  return (
    <ol className="relative border-l border-slate-200 ml-2 space-y-4" data-testid="activity-timeline">
      {items.map((a) => (
        <li key={a.id} className="ml-4">
          <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-[#274C77] border-2 border-white" />
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-bold text-slate-800">{ACTIVITY_LABELS[a.type] ?? a.type}</p>
            <time className="text-[10px] text-slate-400 whitespace-nowrap">{formatDateTime(a.createdAt)}</time>
          </div>
          {a.message && a.message !== (ACTIVITY_LABELS[a.type] ?? a.type) && <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap break-words">{a.message}</p>}
          <p className="text-[10px] text-slate-400 mt-0.5">{a.actor?.name ?? 'System'}</p>
        </li>
      ))}
    </ol>
  );
};
