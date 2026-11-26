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
    <div className="card overflow-hidden">
      {exportName && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100">
          <span className="text-xs text-slate-500">{rows.length} row{rows.length === 1 ? '' : 's'}</span>
          <button type="button" onClick={doExport} disabled={rows.length === 0} className="btn btn-ghost btn-sm text-brand-700">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      )}
      <div className="table-scroll">
        <table className="data-table min-w-[720px]" data-testid={testId}>
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key} className={c.align === 'right' ? 'text-right' : ''}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)} data-testid={`${testId}-row`}>
                {columns.map((c) => <td key={c.key} className={c.align === 'right' ? 'text-right tabular-nums' : ''}>{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const StatBlock: React.FC<{ label: string; value: React.ReactNode; id: string }> = ({ label, value, id }) => (
  <div className="card p-4">
    <p className="metric-label">{label}</p>
    <p data-testid={id} className="metric-value mt-1">{value}</p>
  </div>
);

export const CountList: React.FC<{ title: string; counts: Record<string, number>; testId: string; format?: (k: string) => string }> = ({ title, counts, testId, format }) => {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="card-title">{title}</h3>
        {total > 0 && <span className="text-xs text-slate-500 tabular-nums">{total} total</span>}
      </div>
      {entries.length === 0 ? (
        <p className="text-[13px] text-slate-500">No data.</p>
      ) : (
        <ul className="space-y-3" data-testid={testId}>
          {entries.map(([k, v]) => (
            <li key={k}>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-700 capitalize">{format ? format(k) : k.replace(/_/g, ' ')}</span>
                <span className="text-slate-500 tabular-nums"><span className="font-semibold text-slate-900" data-testid={`${testId}-${k}`}>{v}</span> · {total ? Math.round((v / total) * 100) : 0}%</span>
              </div>
              <div className="progress mt-1.5">
                <span style={{ width: `${total ? Math.round((v / total) * 100) : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
