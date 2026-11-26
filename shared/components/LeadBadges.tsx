import React from 'react';
import {
  LEAD_STATUS_LABELS, LEAD_STATUS_STYLES, PRIORITY_LABELS, PRIORITY_STYLES,
  type LeadStatusValue, type PriorityValue,
} from '../api/crm';

export const LeadStatusBadge: React.FC<{ status: LeadStatusValue }> = ({ status }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${LEAD_STATUS_STYLES[status]}`}>
    {LEAD_STATUS_LABELS[status]}
  </span>
);

export const PriorityBadge: React.FC<{ priority: PriorityValue }> = ({ priority }) => (
  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${PRIORITY_STYLES[priority]}`}>
    {PRIORITY_LABELS[priority]}
  </span>
);
