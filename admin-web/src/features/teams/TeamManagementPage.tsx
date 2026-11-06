import React, { useState } from 'react';
import { 
  Network, 
  Plus, 
  Users, 
  Award, 
  TrendingUp, 
  Trash2, 
  Edit3, 
  X,
  ShieldCheck 
} from 'lucide-react';
import { Team } from '@shared/types';
import { formatDate } from '@shared/utils';

const initialTeams: Team[] = [
  {
    id: 'tm_1',
    teamName: 'Northern Squad',
    teamLeaderId: 'usr_tl_1',
    teamLeaderName: 'Marcus Bradley',
    agentCount: 12,
    leadCount: 420,
    conversionCount: 104,
    createdAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'tm_2',
    teamName: 'Western Squad',
    teamLeaderId: 'usr_tl_2',
    teamLeaderName: 'Diana Prince',
    agentCount: 10,
    leadCount: 380,
    conversionCount: 96,
    createdAt: '2025-02-15T00:00:00Z',
  },
  {
    id: 'tm_3',
    teamName: 'Southern Squad',
    teamLeaderId: 'usr_tl_3',
    teamLeaderName: 'Franklin Hall',
    agentCount: 8,
    leadCount: 290,
    conversionCount: 72,
    createdAt: '2025-04-01T00:00:00Z',
  },
  {
    id: 'tm_4',
    teamName: 'Eastern Squad',
    teamLeaderId: 'usr_tl_4',
    teamLeaderName: 'Cassandra Lang',
    agentCount: 6,
    leadCount: 210,
    conversionCount: 51,
    createdAt: '2025-06-20T00:00:00Z',
  }
];

export const TeamManagementPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !leaderName) return;

    const newTeam: Team = {
      id: `tm_${Date.now()}`,
      teamName,
      teamLeaderId: `usr_tl_${Date.now()}`,
      teamLeaderName: leaderName,
      agentCount: 1,
      leadCount: 0,
      conversionCount: 0,
      createdAt: new Date().toISOString(),
    };

    setTeams([...teams, newTeam]);
    setIsCreateModalOpen(false);
    setTeamName('');
    setLeaderName('');
  };

  const handleDeleteTeam = (id: string, name: string) => {
    if (confirm(`Are you sure you want to decommission "${name}"? Agents will require reassignment.`)) {
      setTeams(teams.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-sm text-slate-500">Configure regional squads, appoint Team Leaders, and audit territorial throughput.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#274C77] rounded-lg hover:bg-[#1B3B6F] shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Establish Regional Squad
        </button>
      </div>

      {/* Grid of Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#274C77] flex items-center justify-center font-bold text-base shadow-sm">
                    <Network className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{team.teamName}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#274C77]" />
                      <span>Team Leader: <strong>{team.teamLeaderName}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeleteTeam(team.id, team.teamName)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    title="Delete Squad"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Squad KPI metrics */}
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agents</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{team.agentCount}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Leads</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{team.leadCount}</p>
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Conversions</span>
                  <p className="text-lg font-bold text-emerald-800 mt-0.5">{team.conversionCount}</p>
                </div>
              </div>

              {/* Progress Bar of Conversion Efficiency */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Conversion Efficiency</span>
                  <span className="font-semibold text-slate-800">
                    {Math.round((team.conversionCount / (team.leadCount || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#274C77] rounded-full"
                    style={{ width: `${Math.min(100, Math.round((team.conversionCount / (team.leadCount || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Established on {formatDate(team.createdAt)}</span>
              <button className="text-xs font-semibold text-[#274C77] hover:underline">
                Manage Squad Roster →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Team */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Establish Regional Squad</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Squad Name *</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Central Metro Squad"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Appoint Team Leader *</label>
                <input
                  type="text"
                  required
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  placeholder="e.g. Richard Hendricks"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#274C77] hover:bg-[#1B3B6F] rounded-lg shadow-sm"
                >
                  Create Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

