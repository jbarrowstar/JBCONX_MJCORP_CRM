import React, { useState } from 'react';
import { 
  UserCheck, 
  Search, 
  Plus, 
  Filter, 
  Phone, 
  Mail, 
  Award, 
  Users, 
  CheckCircle2, 
  X,
  Target
} from 'lucide-react';
import { Agent } from '@shared/types';
import { formatDate } from '@shared/utils';

const initialAgents: Agent[] = [
  {
    id: 'ag_1',
    agentCode: 'AGT-101',
    name: 'David Miller',
    email: 'david.miller@jbconx.com',
    phone: '+1 555-0144',
    teamId: 'tm_1',
    teamName: 'Northern Squad',
    joiningDate: '2025-03-15',
    status: 'ACTIVE',
    targetLeadsMonthly: 45,
    completedVisitsCount: 112,
    conversionCount: 38,
  },
  {
    id: 'ag_2',
    agentCode: 'AGT-102',
    name: 'Sarah Jenkins',
    email: 'sarah.j@jbconx.com',
    phone: '+1 555-0182',
    teamId: 'tm_2',
    teamName: 'Western Squad',
    joiningDate: '2025-06-01',
    status: 'ACTIVE',
    targetLeadsMonthly: 50,
    completedVisitsCount: 135,
    conversionCount: 44,
  },
  {
    id: 'ag_3',
    agentCode: 'AGT-103',
    name: 'James Carter',
    email: 'james.carter@jbconx.com',
    phone: '+1 555-0199',
    teamId: 'tm_3',
    teamName: 'Southern Squad',
    joiningDate: '2026-01-10',
    status: 'ACTIVE',
    targetLeadsMonthly: 40,
    completedVisitsCount: 78,
    conversionCount: 21,
  },
  {
    id: 'ag_4',
    agentCode: 'AGT-104',
    name: 'Emily Watson',
    email: 'emily.w@jbconx.com',
    phone: '+1 555-0211',
    teamId: 'tm_1',
    teamName: 'Northern Squad',
    joiningDate: '2026-02-20',
    status: 'ON_LEAVE',
    targetLeadsMonthly: 35,
    completedVisitsCount: 54,
    conversionCount: 16,
  }
];

export const AgentManagementPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [teamName, setTeamName] = useState('Northern Squad');
  const [target, setTarget] = useState(40);

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) return;

    const newAgent: Agent = {
      id: `ag_${Date.now()}`,
      agentCode: `AGT-${Math.floor(100 + Math.random() * 900)}`,
      name,
      email,
      phone,
      teamName,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      targetLeadsMonthly: Number(target),
      completedVisitsCount: 0,
      conversionCount: 0,
    };

    setAgents([newAgent, ...agents]);
    setIsAddModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agent.agentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agent.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = teamFilter === 'ALL' || agent.teamName === teamFilter;
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agent Management</h1>
          <p className="text-sm text-slate-500">Monitor field staff rosters, squad alignments, monthly targets, and quotas.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#274C77] rounded-lg hover:bg-[#1B3B6F] shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Onboard Field Agent
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search agents by name, ID, or email..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274C77] focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
          >
            <option value="ALL">All Squads</option>
            <option value="Northern Squad">Northern Squad</option>
            <option value="Western Squad">Western Squad</option>
            <option value="Southern Squad">Southern Squad</option>
          </select>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAgents.map((agent) => (
          <div key={agent.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#A3CEF1] text-[#274C77] font-bold flex items-center justify-center text-sm shadow-inner">
                    {agent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{agent.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{agent.agentCode}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  agent.status === 'ACTIVE' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {agent.status}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{agent.teamName || 'Unassigned Squad'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{agent.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{agent.phone}</span>
                </div>
              </div>

              {/* Metrics Strip */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Target</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{agent.targetLeadsMonthly}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Visits</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{agent.completedVisitsCount}</div>
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <div className="text-[10px] text-emerald-700 uppercase font-semibold">Won</div>
                  <div className="text-sm font-bold text-emerald-800 mt-0.5">{agent.conversionCount}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Joined {formatDate(agent.joiningDate)}</span>
              <button
                onClick={() => setSelectedAgent(agent)}
                className="text-xs font-semibold text-[#274C77] hover:underline"
              >
                Inspect Performance
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Inspect Agent Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#274C77] bg-blue-50 px-2 py-0.5 rounded">
                  {selectedAgent.agentCode}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedAgent.name}</h2>
                <p className="text-xs text-slate-500">{selectedAgent.teamName}</p>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Monthly Target</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{selectedAgent.targetLeadsMonthly} Leads</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Completed Visits</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{selectedAgent.completedVisitsCount} Visits</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Direct Conversions</span>
                  <p className="text-base font-bold text-emerald-700 mt-0.5">{selectedAgent.conversionCount} Converted</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Success Rate</span>
                  <p className="text-base font-bold text-[#274C77] mt-0.5">
                    {Math.round(((selectedAgent.conversionCount || 0) / (selectedAgent.completedVisitsCount || 1)) * 100)}%
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600">
                <p>Status: <strong className="text-slate-800">{selectedAgent.status}</strong></p>
                <p className="mt-1">Email: <strong className="text-slate-800">{selectedAgent.email}</strong></p>
                <p className="mt-1">Phone: <strong className="text-slate-800">{selectedAgent.phone}</strong></p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Agent Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Onboard Field Sales Agent</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAgent} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Johnathan Lee"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@jbconx.com"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0988"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Squad</label>
                  <select
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                  >
                    <option value="Northern Squad">Northern Squad</option>
                    <option value="Western Squad">Western Squad</option>
                    <option value="Southern Squad">Southern Squad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Target</label>
                  <input
                    type="number"
                    min="1"
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#274C77] hover:bg-[#1B3B6F] rounded-lg shadow-sm"
                >
                  Confirm & Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

