import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageMeta } from '@shared/api/types';

export const Pagination: React.FC<{ meta: PageMeta; onPage: (page: number) => void; busy?: boolean }> = ({ meta, onPage, busy }) => {
  if (meta.totalPages <= 1) {
    return <p className="text-xs text-slate-500 text-right px-1">{meta.total} total</p>;
  }
  return (
    <div className="flex items-center justify-between gap-3 px-1 text-xs text-slate-500">
      <span>
        Page <span className="font-semibold text-slate-700">{meta.page}</span> of {meta.totalPages} · {meta.total} total
      </span>
      <div className="flex gap-1.5">
        <button type="button" onClick={() => onPage(meta.page - 1)} disabled={meta.page <= 1 || busy} className="btn btn-secondary btn-sm">
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <button type="button" onClick={() => onPage(meta.page + 1)} disabled={meta.page >= meta.totalPages || busy} className="btn btn-secondary btn-sm">
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
