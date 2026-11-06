import React, { useState } from 'react';
import { 
  MapPin, 
  Search, 
  Filter, 
  Navigation, 
  Clock, 
  User, 
  Phone, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface MockAgentLocation {
  id: string;
  name: string;
  agentCode: string;
  status: 'ONLINE' | 'OFFLINE' | 'IN_MEETING';
  lastSeen: string;
  lat: number;
  lng: number;
  currentAddress: string;
  activeClient?: string;
  batteryLevel: string;
}

const mockLocations: MockAgentLocation[] = [
  {
    id: 'ag_1',
    name: 'David Miller',
    agentCode: 'AGT-101',
    status: 'ONLINE',
    lastSeen: '2 mins ago',
    lat: 41.8781,
    lng: -87.6298,
    currentAddress: '150 N Michigan Ave, Chicago, IL',
    activeClient: 'Apex Solutions Ltd',
    batteryLevel: '89%',
  },
  {
    id: 'ag_2',
    name: 'Sarah Jenkins',
    agentCode: 'AGT-102',
    status: 'IN_MEETING',
    lastSeen: 'Just now',
    lat: 30.2672,
    lng: -97.7431,
    currentAddress: '300 Colorado St, Austin, TX',
    activeClient: 'NovaTech Industries',
    batteryLevel: '74%',
  },
  {
    id: 'ag_3',
    name: 'James Carter',
    agentCode: 'AGT-103',
    status: 'ONLINE',
    lastSeen: '12 mins ago',
    lat: 33.7490,
    lng: -84.3880,
    currentAddress: '240 Peachtree St NW, Atlanta, GA',
    batteryLevel: '52%',
  },
  {
    id: 'ag_4',
    name: 'Emily Watson',
    agentCode: 'AGT-104',
    status: 'OFFLINE',
    lastSeen: '1 hr ago',
    lat: 40.7128,
    lng: -74.0060,
    currentAddress: 'Wall St Financial District, NY',
    batteryLevel: '18%',
  }
];

export const FieldTrackingPage: React.FC = () => {
  const [agents] = useState<MockAgentLocation[]>(mockLocations);
  const [selectedAgent, setSelectedAgent] = useState<MockAgentLocation>(mockLocations[0]);
  const [search, setSearch] = useState('');

  const filtered = agents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.agentCode.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Field Agent Tracking</h1>
          <p className="text-sm text-slate-500">Live GPS tracking and telemetry of on-field sales personnel.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Mock GPS Simulation (Live Ready)
          </span>
        </div>
      </div>

      {/* Main Map View & Agent Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Agent Roster List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search active agents..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#274C77]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filtered.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start justify-between ${
                  selectedAgent.id === agent.id ? 'bg-blue-50/70 border-l-4 border-[#274C77]' : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{agent.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({agent.agentCode})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate max-w-[200px]">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>{agent.currentAddress}</span>
                  </div>
                  {agent.activeClient && (
                    <div className="mt-1 text-[10px] text-emerald-700 font-medium">
                      In visit: {agent.activeClient}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    agent.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-800' :
                    agent.status === 'IN_MEETING' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {agent.status}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">{agent.lastSeen}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Map Visualizer */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative flex flex-col justify-between shadow-inner">
          {/* Simulated Map Canvas */}
          <div className="absolute inset-0 bg-[radial-gradient(#274C77_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          {/* Map Top Status Bar */}
          <div className="relative z-10 p-4 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#A3CEF1]" />
              <span>Target Coordinates: <strong>{selectedAgent.lat.toFixed(4)}, {selectedAgent.lng.toFixed(4)}</strong></span>
            </div>
            <div className="text-[11px] text-slate-400">
              Battery: {selectedAgent.batteryLevel} • Google Maps API Ready
            </div>
          </div>

          {/* Center Map Marker View */}
          <div className="relative z-10 flex-1 flex items-center justify-center">
            <div className="text-center p-6 bg-slate-800/90 border border-slate-700 rounded-2xl shadow-2xl max-w-sm">
              <div className="w-12 h-12 rounded-full bg-[#274C77] text-white flex items-center justify-center mx-auto mb-3 shadow-lg animate-bounce">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">{selectedAgent.name}</h3>
              <p className="text-xs text-[#A3CEF1] font-mono mt-0.5">{selectedAgent.agentCode}</p>
              <p className="text-xs text-slate-300 mt-2">{selectedAgent.currentAddress}</p>

              {selectedAgent.activeClient && (
                <div className="mt-3 p-2 bg-[#1B3B6F] rounded-lg text-xs text-slate-200 border border-white/10">
                  Currently Meeting: <strong>{selectedAgent.activeClient}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Map Footer Control */}
          <div className="relative z-10 p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Visual telemetry provider: JBConX Native Dispatch</span>
            <button 
              onClick={() => alert(`Refreshing GPS ping for ${selectedAgent.name}...`)}
              className="px-3 py-1 bg-[#274C77] text-white rounded-lg text-xs font-semibold hover:bg-[#1B3B6F]"
            >
              Ping GPS Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

