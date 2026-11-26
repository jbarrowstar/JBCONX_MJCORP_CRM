import React, { useEffect, useState } from 'react';
import { X, Phone, Mail, MapPin, Pencil, ArrowRightLeft, UserCog, CalendarPlus, Send } from 'lucide-react';
import { ActivityTimeline } from '@shared/components/ActivityTimeline';
import { LeadStatusBadge, PriorityBadge } from '@shared/components/LeadBadges';
import { CLOSED_STATUSES, formatDateTime } from '@shared/api/crm';
import { errorMessage, normalizeError } from '@shared/api/errors';
import { ErrorState, InlineError, Spinner } from '../../components/common/States';
import { useAppDispatch } from '../../redux/hooks';
import { useAddLeadNoteMutation, useGetLeadQuery, useListFollowUpsQuery, useListLeadActivitiesQuery } from '../../redux/services/crmApi';
import { pushToast } from '../../redux/slices/toastSlice';
import { FollowUpList } from '../followups/FollowUpList';
import { FollowUpFormModal } from '../followups/FollowUpModals';
import { AssignLeadModal } from './AssignLeadModal';
import { LeadFormModal } from './LeadFormModal';
import { LeadStatusModal } from './LeadStatusModal';

type Tab = 'overview' | 'timeline' | 'followups';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</dt>
    <dd className="text-xs text-slate-800 mt-0.5 break-words">{children || '—'}</dd>
  </div>
);

export const LeadDetailDrawer: React.FC<{ leadId: string; onClose: () => void }> = ({ leadId, onClose }) => {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<Tab>('overview');
  const [modal, setModal] = useState<'edit' | 'status' | 'assign' | 'followup' | null>(null);
  const [page, setPage] = useState(1);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  const lead = useGetLeadQuery(leadId);
  const activities = useListLeadActivitiesQuery({ id: leadId, page, limit: 15 });
  const followUps = useListFollowUpsQuery({ leadId, limit: 50, order: 'asc' });
  const [addNote, noteState] = useAddLeadNoteMutation();

  useEffect(() => setPage(1), [leadId]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !modal) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, onClose]);

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteError(null);
    if (!note.trim()) return;
    try {
      await addNote({ id: leadId, message: note.trim() }).unwrap();
      setNote('');
      setPage(1);
      dispatch(pushToast('success', 'Note added.'));
    } catch (err) {
      setNoteError(normalizeError(err).message);
    }
  };

  const l = lead.data;
  const closed = l ? CLOSED_STATUSES.includes(l.status) : false;
  const pending = followUps.data?.items.filter((f) => f.status === 'pending').length ?? 0;
  const tabBtn = (t: Tab, text: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === t}
      onClick={() => setTab(t)}
      className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px ${tab === t ? 'border-[#274C77] text-[#274C77]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
    >
      {text}
    </button>
  );
  const action = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50';

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} aria-hidden />
      <aside role="dialog" aria-label="Lead details" className="relative w-full max-w-xl bg-slate-50 shadow-2xl border-l border-slate-200 flex flex-col h-full">
        <div className="bg-white border-b border-slate-200 p-5 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {l ? (
                <>
                  <p className="text-[11px] font-mono text-slate-400">{l.leadCode}</p>
                  <h2 className="text-lg font-bold text-slate-900 truncate">{l.customerName}</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <LeadStatusBadge status={l.status} />
                    <PriorityBadge priority={l.priority} />
                  </div>
                </>
              ) : (
                <h2 className="text-lg font-bold text-slate-900">Lead</h2>
              )}
            </div>
            <button type="button" onClick={onClose} aria-label="Close lead details" className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>

          {l && (
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" className={action} onClick={() => setModal('edit')}><Pencil className="w-3.5 h-3.5" /> Edit</button>
              <button type="button" className={action} onClick={() => setModal('status')}><ArrowRightLeft className="w-3.5 h-3.5" /> Change status</button>
              <button type="button" className={action} onClick={() => setModal('assign')} disabled={closed} title={closed ? 'Closed leads cannot be reassigned' : undefined}><UserCog className="w-3.5 h-3.5" /> Assign</button>
              <button type="button" className={action} onClick={() => setModal('followup')} disabled={closed} title={closed ? 'Closed leads cannot have follow-ups' : undefined}><CalendarPlus className="w-3.5 h-3.5" /> Schedule follow-up</button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {lead.isLoading ? (
            <Spinner label="Loading lead…" />
          ) : lead.isError || !l ? (
            <div className="p-5"><ErrorState message={errorMessage(lead.error)} onRetry={() => void lead.refetch()} /></div>
          ) : (
            <>
              <div role="tablist" className="flex gap-1 px-5 bg-white border-b border-slate-200">
                {tabBtn('overview', 'Overview')}
                {tabBtn('timeline', 'Timeline')}
                {tabBtn('followups', `Follow-ups${pending ? ` (${pending})` : ''}`)}
              </div>

              <div className="p-5">
                {tab === 'overview' && (
                  <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-700">
                      <a href={`tel:${l.mobileNumber}`} className="flex items-center gap-2 text-[#274C77] font-semibold hover:underline"><Phone className="w-3.5 h-3.5" />{l.mobileNumber}</a>
                      {l.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" />{l.email}</p>}
                      <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" />{[l.address, l.city, l.state].filter(Boolean).join(', ')}</p>
                    </div>
                    <dl className="grid grid-cols-2 gap-4 bg-white border border-slate-200 rounded-xl p-4">
                      <Field label="Interested in">{l.interestedService}</Field>
                      <Field label="Source">{l.leadSource}</Field>
                      <Field label="Assigned agent">{l.assignedAgent?.name}</Field>
                      <Field label="Team">{l.team?.name}</Field>
                      <Field label="Next follow-up">
                        {l.nextFollowUpAt ? <span className={l.isFollowUpOverdue ? 'text-red-600 font-semibold' : ''}>{formatDateTime(l.nextFollowUpAt)}{l.isFollowUpOverdue ? ' (overdue)' : ''}</span> : null}
                      </Field>
                      <Field label="Last contacted">{l.lastContactedAt ? formatDateTime(l.lastContactedAt) : null}</Field>
                      <Field label="Created by">{l.createdBy?.name}</Field>
                      <Field label="Created">{formatDateTime(l.createdAt)}</Field>
                      {l.convertedAt && <Field label="Converted">{formatDateTime(l.convertedAt)}</Field>}
                      {l.lostReason && <Field label="Reason lost">{l.lostReason}</Field>}
                    </dl>
                    {l.remarks && (
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</p>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap">{l.remarks}</p>
                      </div>
                    )}
                    <dl className="grid grid-cols-3 gap-3 bg-white border border-slate-200 rounded-xl p-4">
                      <Field label="Registration"><span className="capitalize">{l.onboarding.registrationStatus.replace(/_/g, ' ')}</span></Field>
                      <Field label="Documents"><span className="capitalize">{l.onboarding.documentStatus.replace(/_/g, ' ')}</span></Field>
                      <Field label="Onboarding"><span className="capitalize">{l.onboarding.onboardingStatus.replace(/_/g, ' ')}</span></Field>
                    </dl>
                  </div>
                )}

                {tab === 'timeline' && (
                  <div className="space-y-5">
                    <form onSubmit={submitNote} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                      <label htmlFor="ld-note" className="text-xs font-semibold text-slate-700">Add a note</label>
                      <textarea id="ld-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#274C77]" />
                      <InlineError message={noteError} />
                      <div className="flex justify-end">
                        <button type="submit" disabled={noteState.isLoading || !note.trim()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#274C77] rounded-lg disabled:opacity-50">
                          <Send className="w-3 h-3" /> Add note
                        </button>
                      </div>
                    </form>
                    {activities.isLoading ? <Spinner label="Loading activity…" />
                      : activities.isError ? <ErrorState message={errorMessage(activities.error)} onRetry={() => void activities.refetch()} />
                      : (
                        <>
                          <ActivityTimeline items={activities.data!.items} />
                          {activities.data!.meta.totalPages > 1 && (
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border border-slate-200 rounded-md bg-white disabled:opacity-40">Newer</button>
                              <span>Page {page} of {activities.data!.meta.totalPages}</span>
                              <button type="button" disabled={page >= activities.data!.meta.totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border border-slate-200 rounded-md bg-white disabled:opacity-40">Older</button>
                            </div>
                          )}
                        </>
                      )}
                  </div>
                )}

                {tab === 'followups' && (
                  followUps.isLoading ? <Spinner label="Loading follow-ups…" />
                  : followUps.isError ? <ErrorState message={errorMessage(followUps.error)} onRetry={() => void followUps.refetch()} />
                  : <FollowUpList items={followUps.data!.items} />
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      {l && modal === 'edit' && <LeadFormModal lead={l} onClose={() => setModal(null)} />}
      {l && modal === 'status' && <LeadStatusModal lead={l} onClose={() => setModal(null)} />}
      {l && modal === 'assign' && <AssignLeadModal leads={[l]} onClose={() => setModal(null)} />}
      {l && modal === 'followup' && <FollowUpFormModal leadId={l.id} onClose={() => setModal(null)} />}
    </div>
  );
};
