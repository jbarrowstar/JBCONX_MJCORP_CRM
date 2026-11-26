import React from 'react';
import { Download } from 'lucide-react';
import { exportToCSV } from '../../utils/exportUtils';

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  /** plain value for CSV export (defaults to the rendered value when it is a string/number) */
  csv?: (row: T) => string | number;
  align?: 'right';
}

export function DataTable<T>({ rows, columns, rowKey, testId, exportName }: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  testId: string;
  exportName?: string;
}) {
  const doExport = () =>
    exportToCSV(
      rows.map((r) => Object.fromEntries(columns.map((c) => [c.key, c.csv ? c.csv(r) : (c.render(r) as string | number)]))),
      exportName ?? 'report.csv',
      columns.map((c) => ({ key: c.key, label: c.label }))
    );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {exportName && (
        <div className="flex justify-end px-4 py-2 border-b border-slate-100">
          <button type="button" onClick={doExport} disabled={rows.length === 0} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#274C77] hover:underline disabled:opacity-40">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]" data-testid={testId}>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {columns.map((c) => <th key={c.key} className={`py-3 px-4 ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {rows.map((r) => (
              <tr key={rowKey(r)} data-testid={`${testId}-row`} className="hover:bg-slate-50">
                {columns.map((c) => <td key={c.key} className={`py-3 px-4 ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}>{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const StatBlock: React.FC<{ label: string; value: React.ReactNode; id: string }> = ({ label, value, id }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p data-testid={id} className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

export const CountList: React.FC<{ title: string; counts: Record<string, number>; testId: string; format?: (k: string) => string }> = ({ title, counts, testId, format }) => {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 mb-3">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-xs text-slate-400">No data.</p>
      ) : (
        <ul className="space-y-2.5" data-testid={testId}>
          {entries.map(([k, v]) => (
            <li key={k}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 capitalize">{format ? format(k) : k.replace(/_/g, ' ')}</span>
                <span className="font-bold text-slate-900" data-testid={`${testId}-${k}`}>{v}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-[#274C77] rounded-full" style={{ width: `${total ? Math.round((v / total) * 100) : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
