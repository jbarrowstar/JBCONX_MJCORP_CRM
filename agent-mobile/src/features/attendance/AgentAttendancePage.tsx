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
      <a href={mapsUrl(p.latitude, p.longitude)} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[11px] text-[#274C77]"><MapPin className="w-3 h-3" />{formatCoords(p.latitude, p.longitude)}</a>
    ) : null;

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
        <p className="text-xs text-slate-500">Check in when you start and check out when you finish</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4" data-testid="attendance-card">
        {today.isLoading ? (
          <p role="status" className="text-xs text-slate-500 text-center py-4">Loading today…</p>
        ) : today.isError ? (
          <div role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-3">{errorMessage(today.error)} <button type="button" className="underline font-bold" onClick={() => void today.refetch()}>Retry</button></div>
        ) : (
          <>
            <div className="text-center">
              <p data-testid="attendance-status" className="text-lg font-black text-slate-900">
                {markedByAdmin ? `Marked ${ATTENDANCE_STATUS_LABELS[record!.status].toLowerCase()} by your manager`
                  : checkedIn ? 'You are checked in'
                  : doneToday ? 'Shift completed'
                  : 'Not checked in'}
              </p>
              {record?.checkIn && (
                <p className="text-xs text-slate-500 mt-1">In at <strong>{formatTime(record.checkIn.at)}</strong>{record.checkOut ? <> · Out at <strong>{formatTime(record.checkOut.at)}</strong> · {formatDuration(record.workingMinutes)}</> : null}</p>
              )}
              {record?.checkIn && <div className="mt-1">{pointLine(record.checkIn)}</div>}
              {record?.checkIn?.withinGeofence === false && <p className="text-[11px] text-red-600 mt-1">Recorded outside the office area</p>}
              {record?.checkIn?.lowAccuracy && <p className="text-[11px] text-amber-700 mt-1">GPS accuracy was low (±{Math.round(record.checkIn.accuracy ?? 0)} m)</p>}
            </div>

            {!markedByAdmin && !doneToday && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void punch(checkedIn ? 'out' : 'in', true)}
                className={`w-full py-4 rounded-2xl text-sm font-black text-white shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 ${checkedIn ? 'bg-rose-600' : 'bg-emerald-600'}`}
              >
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" />{phase === 'locating' ? 'Finding your location…' : 'Saving…'}</> : checkedIn ? <><LogOut className="w-5 h-5" />Check out</> : <><LogIn className="w-5 h-5" />Check in</>}
              </button>
            )}

            {problem && (
              <div role="alert" className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 space-y-2" data-testid="attendance-problem">
                <p className="flex items-start gap-2"><ShieldAlert className="w-4 h-4 flex-shrink-0 mt-px" />{problem.message}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void punch(problem.action, true)} disabled={busy} className="px-3 py-1.5 font-bold bg-white border border-rose-200 rounded-lg">Try again</button>
                  {problem.canSkipLocation && (
                    <button type="button" onClick={() => void punch(problem.action, false)} disabled={busy} className="px-3 py-1.5 font-bold bg-white border border-rose-200 rounded-lg">Continue without location</button>
                  )}
                </div>
                {!problem.canSkipLocation && requireLocation && <p className="text-[11px] text-rose-700">Your organisation requires a location for attendance.</p>}
              </div>
            )}
          </>
        )}
      </div>

      <section>
        <h2 className="text-xs font-bold text-slate-800 mb-2">Recent days</h2>
        {history.isLoading ? <p className="text-xs text-slate-400">Loading…</p> : history.data!.items.length === 0 ? (
          <p className="text-xs text-slate-400">No attendance recorded yet.</p>
        ) : (
          <ul className="space-y-2" data-testid="attendance-history">
            {history.data!.items.map((r) => (
              <li key={r.id} data-testid="attendance-history-row" className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.date}</p>
                  <p className="text-[11px] text-slate-500">
                    {r.checkIn ? `${formatTime(r.checkIn.at)} – ${r.checkOut ? formatTime(r.checkOut.at) : 'still in'}` : r.remarks ?? 'Marked by manager'}
                    {r.checkOut ? ` · ${formatDuration(r.workingMinutes)}` : ''}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ATTENDANCE_STATUS_STYLES[r.status]}`}>{ATTENDANCE_STATUS_LABELS[r.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
