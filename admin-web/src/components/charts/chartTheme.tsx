import React from 'react';

/**
 * Chart colours (validated for colour-vision deficiency with the dataviz palette checker):
 * PRIMARY = brand blue (outer drop of the JBCONX logo), SECONDARY = teal used for "converted / won".
 */
export const CHART = {
  primary: '#00529C',
  secondary: '#12A283',
  grid: '#EEF2F6',
  axis: '#94A3B8',
  muted: '#CBD5E1',
} as const;

export const axisProps = {
  tick: { fontSize: 11, fill: CHART.axis },
  axisLine: false,
  tickLine: false,
} as const;

interface TooltipPayload {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

/** Compact, consistent tooltip for every Recharts chart in the admin portal. */
export const ChartTooltip: React.FC<{ active?: boolean; payload?: TooltipPayload[]; label?: string | number; suffix?: string }> = ({ active, payload, label, suffix }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-raised text-xs">
      {label != null && <p className="mb-1 font-semibold text-slate-900">{label}</p>}
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey ?? p.name)} className="flex items-center gap-2 text-slate-600">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span>{p.name}</span>
            <span className="ml-auto pl-4 font-semibold text-slate-900 tabular-nums">
              {p.value}
              {suffix}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Legend rendered as HTML (text in text colours, colour only on the swatch). */
export const ChartLegend: React.FC<{ items: { label: string; color: string }[] }> = ({ items }) => (
  <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
    {items.map((i) => (
      <li key={i.label} className="inline-flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: i.color }} />
        {i.label}
      </li>
    ))}
  </ul>
);
