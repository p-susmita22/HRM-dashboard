import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RotateCcw, Trash2, ChevronDown, ChevronUp, User, Calendar, FileText, LogOut, AlertTriangle } from 'lucide-react';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
const formatTime = (t) => t ? new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

const statusBadge = (status) => {
  const map = {
    Present: 'bg-green-100 text-green-700',
    Absent: 'bg-red-100 text-red-700',
    'Half Day': 'bg-yellow-100 text-yellow-700',
    'Leave Approved': 'bg-blue-100 text-blue-700',
    Holiday: 'bg-purple-100 text-purple-700',
    Pending: 'bg-orange-100 text-orange-700',
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

const AdminEmployeeHistory = () => {
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [historyData, setHistoryData] = useState({});
  const [historyTab, setHistoryTab] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});

  const fetchArchived = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/employees-history');
      setArchived(res.data);
    } catch (err) {
      console.error('Error fetching history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArchived(); }, []);

  const toggleExpand = async (emp) => {
    if (expandedId === emp._id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(emp._id);
    if (!historyData[emp._id]) {
      setLoadingHistory(prev => ({ ...prev, [emp._id]: true }));
      try {
        const res = await axios.get(`/api/admin/employees/${emp._id}/history`);
        setHistoryData(prev => ({ ...prev, [emp._id]: res.data }));
        setHistoryTab(prev => ({ ...prev, [emp._id]: 'attendance' }));
      } catch (err) {
        console.error('Error fetching employee history', err);
      } finally {
        setLoadingHistory(prev => ({ ...prev, [emp._id]: false }));
      }
    }
  };

  const handleRestore = async (id) => {
    if (window.confirm('Restore this employee? They will be able to log in again.')) {
      try {
        await axios.put(`/api/admin/employees/${id}/restore`);
        fetchArchived();
        alert('Employee restored successfully!');
      } catch (err) {
        alert('Failed to restore employee');
      }
    }
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm('⚠️ PERMANENTLY delete this employee and ALL their data? This cannot be undone!')) {
      if (window.confirm('Are you absolutely sure? All attendance, leave, and history records will be deleted forever.')) {
        try {
          await axios.delete(`/api/admin/employees/${id}/permanent`);
          setArchived(prev => prev.filter(e => e._id !== id));
          alert('Employee permanently deleted.');
        } catch (err) {
          alert('Failed to permanently delete employee');
        }
      }
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <User size={24} className="text-primary" /> Employee History
          </h2>
          <p className="text-text-light text-sm mt-1">
            Archived employees — restore them or permanently remove all their data.
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
          <AlertTriangle size={16} /> {archived.length} Archived
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-light">Loading history...</div>
      ) : archived.length === 0 ? (
        <div className="card p-12 text-center">
          <User size={40} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-dark mb-1">No Archived Employees</h3>
          <p className="text-text-light text-sm">When you remove an employee, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {archived.map(emp => {
            const isExpanded = expandedId === emp._id;
            const data = historyData[emp._id];
            const tab = historyTab[emp._id] || 'attendance';

            return (
              <div key={emp._id} className="card p-0 overflow-hidden border border-gray-100 shadow-sm">
                {/* Employee Row */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold text-gray-500">
                      {emp.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-text-dark">{emp.fullName}</p>
                      <p className="text-xs text-text-light">{emp.employeeId} · {emp.designation} · {emp.department}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Archived: {formatDate(emp.archivedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => toggleExpand(emp)}
                      className="btn bg-gray-100 text-text-dark hover:bg-gray-200 text-sm flex items-center gap-1.5 py-1.5"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      {isExpanded ? 'Hide History' : 'View History'}
                    </button>
                    <button
                      onClick={() => handleRestore(emp._id)}
                      className="btn bg-green-100 text-green-700 hover:bg-green-200 text-sm flex items-center gap-1.5 py-1.5"
                    >
                      <RotateCcw size={14} /> Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(emp._id)}
                      className="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm flex items-center gap-1.5 py-1.5"
                    >
                      <Trash2 size={14} /> Delete Forever
                    </button>
                  </div>
                </div>

                {/* Expanded History */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {loadingHistory[emp._id] ? (
                      <div className="p-6 text-center text-text-light text-sm">Loading records...</div>
                    ) : data ? (
                      <div>
                        {/* Inner tabs */}
                        <div className="flex border-b border-gray-200 bg-white px-5">
                          {[
                            { key: 'attendance', label: 'Attendance', icon: <Calendar size={14} />, count: data.attendance?.length },
                            { key: 'leaves', label: 'Leaves', icon: <FileText size={14} />, count: data.leaves?.length },
                            { key: 'regularizations', label: 'Regularizations', icon: <FileText size={14} />, count: data.regularizations?.length },
                            { key: 'resignations', label: 'Resignations', icon: <LogOut size={14} />, count: data.resignations?.length },
                          ].map(t => (
                            <button
                              key={t.key}
                              onClick={() => setHistoryTab(prev => ({ ...prev, [emp._id]: t.key }))}
                              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark'}`}
                            >
                              {t.icon} {t.label} <span className="text-[10px] bg-gray-100 px-1.5 rounded-full">{t.count}</span>
                            </button>
                          ))}
                        </div>

                        <div className="overflow-x-auto p-4">
                          {/* Attendance */}
                          {tab === 'attendance' && (
                            <table className="w-full text-left text-sm border-collapse">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Date</th>
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Status</th>
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Punch In</th>
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Punch Out</th>
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Hours</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {data.attendance.length === 0 ? (
                                  <tr><td colSpan="5" className="p-6 text-center text-gray-400">No attendance records found.</td></tr>
                                ) : data.attendance.map(r => (
                                  <tr key={r._id} className="hover:bg-white">
                                    <td className="p-3 font-medium">{formatDate(r.date)}</td>
                                    <td className="p-3">{statusBadge(r.status)}</td>
                                    <td className="p-3 text-gray-600">{formatTime(r.punchIn)}</td>
                                    <td className="p-3 text-gray-600">{formatTime(r.punchOut)}</td>
                                    <td className="p-3 text-gray-600">{r.totalHours ? `${r.totalHours.toFixed(1)}h` : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          {/* Leaves */}
                          {tab === 'leaves' && (
                            <table className="w-full text-left text-sm border-collapse">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">From</th>
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">To</th>
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Reason</th>
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {data.leaves.length === 0 ? (
                                  <tr><td colSpan="4" className="p-6 text-center text-gray-400">No leave records found.</td></tr>
                                ) : data.leaves.map(r => (
                                  <tr key={r._id} className="hover:bg-white">
                                    <td className="p-3">{formatDate(r.startDate)}</td>
                                    <td className="p-3">{formatDate(r.endDate)}</td>
                                    <td className="p-3 text-gray-600 max-w-[200px] truncate">{r.reason}</td>
                                    <td className="p-3">{statusBadge(r.status)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          {/* Regularizations */}
                          {tab === 'regularizations' && (
                            <table className="w-full text-left text-sm border-collapse">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Date</th>
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Reason</th>
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {data.regularizations.length === 0 ? (
                                  <tr><td colSpan="3" className="p-6 text-center text-gray-400">No regularization records found.</td></tr>
                                ) : data.regularizations.map(r => (
                                  <tr key={r._id} className="hover:bg-white">
                                    <td className="p-3">{formatDate(r.date)}</td>
                                    <td className="p-3 text-gray-600 max-w-[240px] truncate">{r.reason}</td>
                                    <td className="p-3">{statusBadge(r.status)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          {/* Resignations */}
                          {tab === 'resignations' && (
                            <table className="w-full text-left text-sm border-collapse">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Applied On</th>
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Last Day</th>
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Reason</th>
                                  <th className="p-3 text-xs font-semibold text-text-light uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {data.resignations.length === 0 ? (
                                  <tr><td colSpan="4" className="p-6 text-center text-gray-400">No resignation records found.</td></tr>
                                ) : data.resignations.map(r => (
                                  <tr key={r._id} className="hover:bg-white">
                                    <td className="p-3">{formatDate(r.createdAt)}</td>
                                    <td className="p-3">{formatDate(r.lastWorkingDay)}</td>
                                    <td className="p-3 text-gray-600 max-w-[240px] truncate">{r.reason}</td>
                                    <td className="p-3">{statusBadge(r.status)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-red-400 text-sm">Failed to load history.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminEmployeeHistory;
