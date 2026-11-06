import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Clock, 
  Search, 
  Phone, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  X 
} from 'lucide-react';
import { FollowupTask, TaskType, TaskStatus } from '@shared/types';
import { formatDate } from '@shared/utils';

const initialTasks: FollowupTask[] = [
  {
    id: 'tsk_1',
    leadId: 'ld_1',
    leadCode: 'LID-8821',
    customerName: 'Robert Vance',
    customerPhone: '+1 555-0192',
    assignedAgentId: 'ag_1',
    assignedAgentName: 'David Miller',
    dueDate: '2026-11-06',
    dueTime: '02:00 PM',
    taskType: 'Demo',
    status: 'PENDING',
    remarks: 'Deliver online screen share demonstration of enterprise features.',
    createdAt: '2026-11-04T10:00:00Z',
  },
  {
    id: 'tsk_2',
    leadId: 'ld_2',
    leadCode: 'LID-8822',
    customerName: 'Elena Rostova',
    customerPhone: '+1 555-0381',
    assignedAgentId: 'ag_2',
    assignedAgentName: 'Sarah Jenkins',
    dueDate: '2026-11-06',
    dueTime: '04:30 PM',
    taskType: 'Call',
    status: 'PENDING',
    remarks: 'Follow up on the quotation submitted yesterday.',
    createdAt: '2026-11-05T09:00:00Z',
  },
  {
    id: 'tsk_3',
    leadId: 'ld_4',
    leadCode: 'LID-8824',
    customerName: 'Chloe Bennett',
    customerPhone: '+1 555-4421',
    assignedAgentId: 'ag_3',
    assignedAgentName: 'James Carter',
    dueDate: '2026-11-05',
    dueTime: '11:00 AM',
    taskType: 'Customer Visit',
    status: 'OVERDUE',
    remarks: 'Deliver product catalogue sample in person.',
    createdAt: '2026-11-03T14:00:00Z',
  }
];

export const FollowupsPage: React.FC = () => {
  const [tasks, setTasks] = useState<FollowupTask[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'COMPLETED'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [agentName, setAgentName] = useState('David Miller');
  const [dueDate, setDueDate] = useState('2026-11-07');
  const [dueTime, setDueTime] = useState('14:00');
  const [taskType, setTaskType] = useState<TaskType>('Call');
  const [remarks, setRemarks] = useState('');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone) return;

    const newTask: FollowupTask = {
      id: `tsk_${Date.now()}`,
      leadId: `ld_${Date.now()}`,
      leadCode: `LID-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      customerPhone: phone,
      assignedAgentId: 'ag_1',
      assignedAgentName: agentName,
      dueDate,
      dueTime,
      taskType,
      status: 'PENDING',
      remarks,
      createdAt: new Date().toISOString(),
    };

    setTasks([newTask, ...tasks]);
    setIsAddModalOpen(false);
    setCustomerName('');
    setPhone('');
    setRemarks('');
  };

  const handleMarkComplete = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'COMPLETED' } : t));
  };

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'ALL') return true;
    return t.status === activeTab;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Follow-ups & Tasks</h1>
          <p className="text-sm text-slate-500">Coordinate client phone calls, meetings, demos, and critical sales actions.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#274C77] rounded-lg hover:bg-[#1B3B6F] shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Schedule Task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {(['ALL', 'PENDING', 'OVERDUE', 'COMPLETED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === tab
                ? 'border-[#274C77] text-[#274C77]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'ALL' ? 'All Tasks' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Task & Type</th>
              <th className="py-3 px-4">Customer Contact</th>
              <th className="py-3 px-4">Assigned Agent</th>
              <th className="py-3 px-4">Scheduled Due Date</th>
              <th className="py-3 px-4">Instructions / Notes</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filteredTasks.map(task => (
              <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900">{task.taskType}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{task.leadCode}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900">{task.customerName}</div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{task.customerPhone}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-medium text-slate-800">{task.assignedAgentName}</td>
                <td className="py-3 px-4">
                  <div>{formatDate(task.dueDate)}</div>
                  <div className="text-[11px] text-slate-400">{task.dueTime}</div>
                </td>
                <td className="py-3 px-4">
                  <p className="truncate max-w-xs text-slate-600">{task.remarks || '-'}</p>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    task.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    task.status === 'OVERDUE' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {task.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleMarkComplete(task.id)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Mark Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Schedule Task */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Schedule Follow-up Task</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Robert Vance"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555-0192"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Task Type</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as TaskType)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                  >
                    <option value="Call">Call</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Customer Visit">Customer Visit</option>
                    <option value="Demo">Demo</option>
                    <option value="Documentation">Documentation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Agent</label>
                  <select
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                  >
                    <option value="David Miller">David Miller</option>
                    <option value="Sarah Jenkins">Sarah Jenkins</option>
                    <option value="James Carter">James Carter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Details for the agent..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#274C77]"
                />
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
                  Confirm Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

