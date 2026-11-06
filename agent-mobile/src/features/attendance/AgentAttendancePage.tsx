import React, { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar 
} from 'lucide-react';

export const AgentAttendancePage: React.FC = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState('08:45 AM');
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 41.8781,
    lng: -87.6298,
  });
  const [isCapturing, setIsCapturing] = useState(false);

  const handleToggleAttendance = () => {
    setIsCapturing(true);

    // Simulate GPS reading via Geolocation API
    setTimeout(() => {
      setIsCapturing(false);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (isCheckedIn) {
        setCheckOutTime(now);
        setIsCheckedIn(false);
      } else {
        setCheckInTime(now);
        setCheckOutTime(null);
        setIsCheckedIn(true);
      }
    }, 700);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Shift Attendance</h1>
        <p className="text-xs text-slate-500">GPS geo-fenced check-in & check-out</p>
      </div>

      {/* Main Action Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner transition-colors ${
          isCheckedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
        }`}>
          <Clock className="w-10 h-10" />
        </div>

        <div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
            isCheckedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {isCheckedIn ? 'CURRENTLY ON SHIFT' : 'SHIFT COMPLETED'}
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {/* GPS Verification Badge */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-[#274C77]" />
            <span>Capacitor Geolocation Status:</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Lat: {currentCoords?.lat} • Lng: {currentCoords?.lng}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Geofence authorized within commercial zone
          </div>
        </div>

        <button
          onClick={handleToggleAttendance}
          disabled={isCapturing}
          className={`w-full py-3.5 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 text-white ${
            isCheckedIn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#274C77] hover:bg-[#1B3B6F]'
          }`}
        >
          {isCapturing ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>{isCheckedIn ? 'Punch Check-Out' : 'Punch Check-In'}</span>
          )}
        </button>
      </div>

      {/* Today summary */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Today's Timesheet</h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-medium">Check-In</span>
            <div className="text-sm font-bold text-slate-800 mt-0.5">{checkInTime || '-'}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 font-medium">Check-Out</span>
            <div className="text-sm font-bold text-slate-800 mt-0.5">{checkOutTime || 'In Progress'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

