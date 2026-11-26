import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageMeta } from '@shared/api/types';

export const Pagination: React.FC<{ meta: PageMeta; onPage: (page: number) => void; busy?: boolean }> = ({ meta, onPage, busy }) => {
  if (meta.totalPages <= 1) {
    return <p className="text-[11px] text-slate-400 text-right">{meta.total} total</p>;
  }
  return (
    <div className="flex items-center justify-between text-xs text-slate-500">
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPage(meta.page - 1)}
          disabled={meta.page <= 1 || busy}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40 hover:bg-slate-50"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <button
          type="button"
          onClick={() => onPage(meta.page + 1)}
          disabled={meta.page >= meta.totalPages || busy}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40 hover:bg-slate-50"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
