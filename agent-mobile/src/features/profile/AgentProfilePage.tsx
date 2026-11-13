import React from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Award, 
  MapPin, 
  LogOut 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logout } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';

export const AgentProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Agent Profile</h1>
        <p className="text-xs text-slate-500">Account status & performance metrics</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-[#A3CEF1] text-[#274C77] font-bold text-xl flex items-center justify-center mx-auto shadow-inner">
          {user?.name?.[0] || 'D'}
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
          <span className="text-[10px] font-mono bg-blue-50 text-[#274C77] px-2.5 py-0.5 rounded-full font-bold">
            AGENT-ID: AGT-101
          </span>
          <p className="text-xs text-slate-500 mt-1">{user?.teamName || 'Northern Squad'}</p>
        </div>

        {/* Contact Strip */}
        <div className="pt-3 border-t border-slate-100 text-left text-xs space-y-2 text-slate-600">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>+1 555-0144</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Role: Field Sales Representative</span>
          </div>
        </div>
      </div>

      {/* Target Progress */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">November Quota Target</h3>
          <span className="text-xs font-bold text-[#274C77]">38 / 45 Leads</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#274C77] rounded-full" style={{ width: '84%' }} />
        </div>
        <p className="text-[11px] text-slate-500">84% of monthly target achieved. 7 leads remaining.</p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
};

