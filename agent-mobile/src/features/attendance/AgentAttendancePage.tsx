import React, { useState } from 'react';
import { LogIn, LogOut, MapPin, Loader2, ShieldAlert } from 'lucide-react';
import {
  ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_STYLES, formatCoords, formatDuration, formatTime, mapsUrl, type AttendanceDto,
} from '@shared/api/fieldwork';
import { errorMessage, normalizeError } from '@shared/api/errors';
import { getCurrentLocation } from '../../device/geolocation';
import type { LocationResult } from '../../device/geolocation';
import { useAppDispatch } from '../../redux/hooks';
import { useGetPublicSettingsQuery } from '../../redux/services/crmApi';
import { useCheckInMutation, useCheckOutMutation, useGetTodayAttendanceQuery, useListMyAttendanceQuery } from '../../redux/services/fieldApi';
import type { PunchInput } from '../../redux/services/fieldApi';
import { pushToast } from '../../redux/slices/toastSlice';

type Phase = 'idle' | 'locating' | 'saving';

export const AgentAttendancePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const today = useGetTodayAttendanceQuery(undefined, { refetchOnMountOrArgChange: true });
  const history = useListMyAttendanceQuery({ page: 1, limit: 14 }, { refetchOnMountOrArgChange: true });
  const { data: settings } = useGetPublicSettingsQuery();
  const [checkIn] = useCheckInMutation();
  const [checkOut] = useCheckOutMutation();
  const [phase, setPhase] = useState<Phase>('idle');
  const [problem, setProblem] = useState<{ message: string; canSkipLocation: boolean; action: 'in' | 'out' } | null>(null);

  const record = today.data;
  const requireLocation = settings?.attendance ? (settings.attendance as unknown as { requireLocation: boolean }).requireLocation : true;
  const checkedIn = !!record?.isOpen;
  const doneToday = !!record && !record.isOpen && record.status !== 'absent' && record.status !== 'on_leave' && !!record.checkOut;
  const markedByAdmin = !!record && !record.checkIn;

  const punch = async (action: 'in' | 'out', withLocation: boolean) => {
    setProblem(null);
    let body: PunchInput = {};
    if (withLocation) {
      setPhase('locating');
      const loc: LocationResult = await getCurrentLocation();
      if (!loc.ok) {
        setPhase('idle');
        setProblem({ message: loc.message, canSkipLocation: !requireLocation, action });
        return;
      }
      body = { latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy };
    }
    setPhase('saving');
    try {
      await (action === 'in' ? checkIn(body) : checkOut(body)).unwrap();
      dispatch(pushToast('success', action === 'in' ? 'You are checked in.' : 'You are checked out.'));
    } catch (err) {
      setProblem({ message: normalizeError(err).message, canSkipLocation: false, action });
    } finally {
      setPhase('idle');
    }
  };

  const busy = phase !== 'idle';
  const pointLine = (p: AttendanceDto['checkIn']) =>
    p && p.latitude != null && p.longitude != null ? (
      <a href={mapsUrl(p.latitude, p.longitude)} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs link"><MapPin className="w-3.5 h-3.5" />{formatCoords(p.latitude, p.longitude)}</a>
    ) : null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Check in when you start and check out when you finish</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
      <section className="card lg:col-span-2 overflow-hidden" data-testid="attendance-card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="card-title">Today</h2>
          <span className="text-xs text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
        <div className="p-5 space-y-5">
        {today.isLoading ? (
          <p role="status" className="text-[13px] text-slate-500 text-center py-6">Loading today…</p>
        ) : today.isError ? (
          <div role="alert" className="text-[13px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-3">{errorMessage(today.error)} <button type="button" className="underline font-semibold" onClick={() => void today.refetch()}>Retry</button></div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <span className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${checkedIn ? 'bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50' : doneToday ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                {checkedIn ? <LogIn className="w-6 h-6" /> : doneToday ? <LogOut className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
              </span>
              <p data-testid="attendance-status" className="font-display text-xl font-bold tracking-tight text-slate-900">
                {markedByAdmin ? `Marked ${ATTENDANCE_STATUS_LABELS[record!.status].toLowerCase()} by your manager`
                  : checkedIn ? 'You are checked in'
                  : doneToday ? 'Shift completed'
                  : 'Not checked in'}
              </p>
              {record?.checkIn && (
                <p className="text-[13px] text-slate-500 mt-1">In at <strong className="text-slate-800">{formatTime(record.checkIn.at)}</strong>{record.checkOut ? <> · Out at <strong className="text-slate-800">{formatTime(record.checkOut.at)}</strong> · {formatDuration(record.workingMinutes)}</> : null}</p>
              )}
              {record?.checkIn && <div className="mt-1.5">{pointLine(record.checkIn)}</div>}
              {record?.checkIn?.withinGeofence === false && <p className="text-xs text-rose-600 mt-1.5">Recorded outside the office area</p>}
              {record?.checkIn?.lowAccuracy && <p className="text-xs text-amber-700 mt-1.5">GPS accuracy was low (±{Math.round(record.checkIn.accuracy ?? 0)} m)</p>}
            </div>

            {!markedByAdmin && !doneToday && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void punch(checkedIn ? 'out' : 'in', true)}
                className={`btn btn-lg w-full h-12 text-white shadow-sm ${checkedIn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" />{phase === 'locating' ? 'Finding your location…' : 'Saving…'}</> : checkedIn ? <><LogOut className="w-5 h-5" />Check out</> : <><LogIn className="w-5 h-5" />Check in</>}
              </button>
            )}

            {problem && (
              <div role="alert" className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-[13px] text-rose-800 space-y-2" data-testid="attendance-problem">
                <p className="flex items-start gap-2"><ShieldAlert className="w-4 h-4 flex-shrink-0 mt-px" />{problem.message}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void punch(problem.action, true)} disabled={busy} className="btn btn-secondary btn-sm">Try again</button>
                  {problem.canSkipLocation && (
                    <button type="button" onClick={() => void punch(problem.action, false)} disabled={busy} className="btn btn-secondary btn-sm">Continue without location</button>
                  )}
                </div>
                {!problem.canSkipLocation && requireLocation && <p className="text-xs text-rose-700">Your organisation requires a location for attendance.</p>}
              </div>
            )}
          </>
        )}
        </div>
      </section>

      <section className="card lg:col-span-3">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="card-title">Recent days</h2>
          <p className="card-subtitle">Your latest attendance records</p>
        </div>
        {history.isLoading ? <p className="text-[13px] text-slate-500 p-5">Loading…</p> : history.data!.items.length === 0 ? (
          <p className="text-[13px] text-slate-500 p-5">No attendance recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100" data-testid="attendance-history">
            {history.data!.items.map((r) => (
              <li key={r.id} data-testid="attendance-history-row" className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center flex-shrink-0 leading-none" aria-hidden>
                    <span className="text-sm font-bold text-slate-900">{r.date.slice(8, 10)}</span>
                    <span className="text-[9px] font-semibold uppercase text-slate-500 mt-0.5">{new Date(`${r.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short' })}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900">{r.date}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {r.checkIn ? `${formatTime(r.checkIn.at)} – ${r.checkOut ? formatTime(r.checkOut.at) : 'still in'}` : r.remarks ?? 'Marked by manager'}
                      {r.checkOut ? ` · ${formatDuration(r.workingMinutes)}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`badge ${ATTENDANCE_STATUS_STYLES[r.status]}`}>{ATTENDANCE_STATUS_LABELS[r.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
};
