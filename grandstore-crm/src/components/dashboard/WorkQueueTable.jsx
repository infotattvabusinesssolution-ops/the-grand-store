import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, UserCheck, Calendar, Filter, Plus } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function WorkQueueTable({ 
  tasks = [], 
  loading = false, 
  onCompleteTask, 
  onOpenCreateModal 
}) {
  const [filter, setFilter] = useState('all');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return t.isOverdue;
    if (filter === 'customer_enquiry') return t.category === 'customer_enquiry';
    if (filter === 'order_fulfilment') return t.category === 'order_fulfilment';
    if (filter === 'export_quote') return t.category === 'export_quote';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Today's Work Queue</h3>
          <p className="text-xs text-slate-500">Scheduled operational actions, customer leads & fulfilment follow-ups</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('customer_enquiry')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filter === 'customer_enquiry' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Enquiries
            </button>
            <button
              onClick={() => setFilter('order_fulfilment')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filter === 'order_fulfilment' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filter === 'overdue' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overdue
            </button>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* Task List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
            <tr>
              <th className="px-5 py-3.5">Task Description</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Priority</th>
              <th className="px-5 py-3.5">Assigned To</th>
              <th className="px-5 py-3.5">Due Time</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Loading work queue items...
                </td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  ✓ No tasks found in this queue. Great job!
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task._id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">{task.description}</p>
                    )}
                    {task.linkedEntity?.referenceCode && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        Ref: #{task.linkedEntity.referenceCode}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="capitalize font-medium text-slate-700">
                      {task.category?.replace(/_/g, ' ') || 'General'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={task.priority} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                        {task.assignedTo?.name?.charAt(0) || 'U'}
                      </div>
                      <span>{task.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className={`flex items-center gap-1.5 font-medium ${task.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                      <Clock size={13} />
                      <span>{new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => onCompleteTask(task)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-all shadow-sm shadow-emerald-500/20 inline-flex items-center gap-1"
                    >
                      <CheckCircle2 size={13} /> Resolve
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
