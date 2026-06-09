import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarDays, Clock, CheckCircle, XCircle, Edit, Download, Calendar as CalIcon, History } from 'lucide-react';

const AdminAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today'); // 'pending', 'today', 'holidays'
  const [filterEmployee, setFilterEmployee] = useState('');

  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [historyModalEmployee, setHistoryModalEmployee] = useState(null);
  
  const [holidayData, setHolidayData] = useState({ date: '', reason: '' });

  const [showEditHolidayModal, setShowEditHolidayModal] = useState(false);
  const [editHolidayData, setEditHolidayData] = useState({ oldDate: '', newDate: '', reason: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attRes, empRes, leavesRes] = await Promise.all([
        axios.get('/api/admin/attendance'),
        axios.get('/api/admin/employees'),
        axios.get('/api/admin/leaves')
      ]);
      setAttendanceRecords(attRes.data);
      setEmployees(empRes.data);
      setLeaves(leavesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/admin/attendance/${id}/approve`);
      fetchData();
      alert('Attendance approved and calculated automatically!');
    } catch (error) {
      alert('Failed to approve attendance');
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Are you sure you want to reject this attendance request?')) {
      try {
        await axios.put(`/api/admin/attendance/${id}/reject`);
        fetchData();
        alert('Attendance request rejected!');
      } catch (error) {
        alert('Failed to reject attendance');
      }
    }
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/attendance/holiday', holidayData);
      setShowHolidayModal(false);
      fetchData();
      alert('Holiday marked for all employees!');
    } catch (error) {
      alert('Failed to mark holiday');
    }
  };

  const handleEditHolidaySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/attendance/holiday/${editHolidayData.oldDate}`, {
        newDate: editHolidayData.newDate,
        reason: editHolidayData.reason
      });
      setShowEditHolidayModal(false);
      fetchData();
      alert('Holiday updated successfully!');
    } catch (error) {
      alert('Failed to update holiday');
    }
  };

  const handleDeleteHoliday = async (date) => {
    if (window.confirm('Are you sure you want to delete this holiday for all employees?')) {
      try {
        await axios.delete(`/api/admin/attendance/holiday/${date}`);
        fetchData();
        alert('Holiday deleted successfully!');
      } catch (error) {
        alert('Failed to delete holiday');
      }
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><div className="w-2 h-2 rounded-full bg-green-500"></div> Present</span>;
      case 'Absent': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><div className="w-2 h-2 rounded-full bg-red-500"></div> Absent</span>;
      case 'Leave Approved': 
      case 'Leave': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><div className="w-2 h-2 rounded-full bg-red-500"></div> Leave</span>;
      case 'Holiday': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Holiday</span>;
      case 'Half Day': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200"><div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-red-500"></div> Half Day</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200"><div className="w-2 h-2 rounded-full bg-gray-400"></div> Pending</span>;
    }
  };

  const pendingRecords = attendanceRecords.filter(r => r.adminStatus === 'Pending');

  // Compute Today's Attendance for Employees
  const today = new Date();
  const todayRecords = employees.filter(emp => emp.role === 'employee' && emp.isActive).map(emp => {
    const record = attendanceRecords.find(r => {
        if (r.status === 'Holiday') return false; // Ignore holiday records in employee list
        if (r.employee?._id !== emp._id) return false;
        const rDate = new Date(r.date);
        return rDate.getDate() === today.getDate() && rDate.getMonth() === today.getMonth() && rDate.getFullYear() === today.getFullYear();
    });
    return {
        employee: emp,
        record: record || null
    };
  }).filter(item => filterEmployee === '' || item.employee.fullName.toLowerCase().includes(filterEmployee.toLowerCase()));

  // Unique Holidays
  const holidaysMap = new Map();
  attendanceRecords.forEach(r => {
    if (r.status === 'Holiday') {
        const dStr = new Date(r.date).toDateString();
        if (!holidaysMap.has(dStr)) {
            holidaysMap.set(dStr, r);
        }
    }
  });
  const holidayList = Array.from(holidaysMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Employee History
  let historyRecords = [];
  if (historyModalEmployee) {
    const regularRecords = attendanceRecords
        .filter(r => r.employee?._id === historyModalEmployee._id && r.status !== 'Holiday' && r.status !== 'Leave' && r.status !== 'Leave Approved')
        .map(r => ({ ...r, sortDate: new Date(r.date) }));
        
    const leaveBlocks = leaves
        .filter(l => l.employee?._id === historyModalEmployee._id && l.status === 'Approved')
        .map(l => ({
            isLeaveBlock: true,
            _id: l._id,
            fromDate: new Date(l.fromDate),
            toDate: new Date(l.toDate),
            reason: l.reason,
            status: 'Leave Approved',
            sortDate: new Date(l.fromDate)
        }));
        
    historyRecords = [...regularRecords, ...leaveBlocks].sort((a, b) => b.sortDate - a.sortDate);
  }

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-dark">Attendance Management</h2>
          <p className="text-text-light text-sm mt-1">Review, approve, and manage employee attendance records.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowHolidayModal(true)} className="btn bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-2">
            <CalIcon size={16} /> Mark Holiday
          </button>
          <button className="btn bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 flex items-center gap-2">
            <Download size={16} /> Download Report
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button 
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'today' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark'}`}
          onClick={() => setActiveTab('today')}
        >
          Today's Attendance
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals ({pendingRecords.length})
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'holidays' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark'}`}
          onClick={() => setActiveTab('holidays')}
        >
          Official Holidays
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="card shadow-md border-none overflow-hidden">
          <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">
            <Clock size={20} className="text-orange-500" /> Pending Punches
          </h3>
          <p className="text-sm text-text-light mb-4">These records will not be marked on the employee's attendance until you approve them.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Date</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Employee</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Punch In</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Punch Out</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingRecords.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-text-light">No pending requests.</td></tr>
                ) : (
                  pendingRecords.map(record => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-text-dark font-medium">{formatDate(record.date)}</td>
                      <td className="p-4">
                        <p className="text-sm font-semibold text-text-dark">{record.employee?.fullName}</p>
                        <p className="text-xs text-text-light">{record.employee?.employeeId}</p>
                      </td>
                      <td className="p-4 text-sm text-text-dark">{formatTime(record.punchIn)}</td>
                      <td className="p-4 text-sm text-text-dark">{formatTime(record.punchOut)}</td>
                      <td className="p-4 text-right">
                        {record.punchOut ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleReject(record._id)} className="btn py-1 px-3 bg-red-100 text-red-700 hover:bg-red-200 text-xs flex items-center gap-1">
                              <XCircle size={12} /> Reject
                            </button>
                            <button onClick={() => handleApprove(record._id)} className="btn py-1 px-3 btn-primary text-xs flex items-center gap-1">
                              <CheckCircle size={12} /> Accept
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-orange-500 font-medium italic">Waiting for Punch Out...</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'today' && (
        <div className="card shadow-md border-none overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-dark flex items-center gap-2">
              <CalendarDays size={20} className="text-primary" /> Today's Employees
            </h3>
            <input 
              type="text" 
              placeholder="Filter by Employee Name..." 
              className="form-control text-sm py-2"
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Employee ID</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Name</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">In Time</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Out Time</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Status (Today)</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todayRecords.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-text-light">No employees found.</td></tr>
                ) : (
                  todayRecords.map(item => (
                    <tr key={item.employee._id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm font-medium text-text-light">{item.employee.employeeId}</td>
                      <td className="p-4">
                        <p className="text-sm font-semibold text-text-dark">{item.employee.fullName}</p>
                      </td>
                      <td className="p-4 text-sm text-text-dark">{item.record ? formatTime(item.record.punchIn) : '--:--'}</td>
                      <td className="p-4 text-sm text-text-dark">{item.record ? formatTime(item.record.punchOut) : '--:--'}</td>
                      <td className="p-4">{item.record ? getStatusBadge(item.record.status) : <span className="text-xs text-text-light italic">No Record</span>}</td>
                      <td className="p-4 text-right">
                        <button 
                            className="btn py-1 px-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs flex items-center gap-1 ml-auto"
                            onClick={() => setHistoryModalEmployee(item.employee)}
                        >
                            <History size={14} /> History
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'holidays' && (
        <div className="card shadow-md border-none overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-dark flex items-center gap-2">
              <CalIcon size={20} className="text-yellow-500" /> Official Holidays
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Date</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Holiday Name</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Status</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {holidayList.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-text-light">No holidays marked yet.</td></tr>
                ) : (
                  holidayList.map(record => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-text-dark font-medium">{formatDate(record.date)}</td>
                      <td className="p-4 text-sm text-text-dark font-semibold">{record.holidayName || 'Official Holiday'}</td>
                      <td className="p-4">{getStatusBadge(record.status)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            className="text-blue-600 hover:text-blue-800 p-1"
                            onClick={() => {
                              setEditHolidayData({
                                oldDate: record.date,
                                newDate: new Date(record.date).toISOString().split('T')[0],
                                reason: record.holidayName || 'Official Holiday'
                              });
                              setShowEditHolidayModal(true);
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800 p-1"
                            onClick={() => handleDeleteHoliday(record.date)}
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-text-dark flex items-center gap-2">
                    <History size={20} className="text-primary" /> Attendance History
                </h2>
                <p className="text-sm text-text-light mt-1">Viewing records for <span className="font-semibold text-text-dark">{historyModalEmployee.fullName}</span> ({historyModalEmployee.employeeId})</p>
              </div>
              <button onClick={() => setHistoryModalEmployee(null)} className="text-gray-400 hover:text-status-absent transition-colors p-2">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
                <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-3 text-xs font-semibold text-text-light uppercase">Date</th>
                                <th className="p-3 text-xs font-semibold text-text-light uppercase">Punches</th>
                                <th className="p-3 text-xs font-semibold text-text-light uppercase">Total Hours</th>
                                <th className="p-3 text-xs font-semibold text-text-light uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {historyRecords.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-text-light">No attendance records found.</td></tr>
                            ) : (
                                historyRecords.map(record => (
                                    <tr key={record._id} className={`hover:bg-gray-50 ${record.isLeaveBlock ? 'bg-red-50/30' : ''}`}>
                                        <td className="p-3 text-sm text-text-dark font-medium">
                                            {record.isLeaveBlock 
                                                ? (record.fromDate.toDateString() === record.toDate.toDateString() 
                                                    ? formatDate(record.fromDate) 
                                                    : `${formatDate(record.fromDate)} - ${formatDate(record.toDate)}`)
                                                : formatDate(record.date)
                                            }
                                        </td>
                                        <td className="p-3">
                                            {record.isLeaveBlock ? (
                                                <span className="text-xs font-medium text-text-light/80 italic">Reason: {record.reason || 'Not specified'}</span>
                                            ) : (
                                                <>
                                                    <span className="text-xs text-text-light mr-3">In: <span className="text-text-dark font-medium">{formatTime(record.punchIn)}</span></span>
                                                    <span className="text-xs text-text-light">Out: <span className="text-text-dark font-medium">{formatTime(record.punchOut)}</span></span>
                                                </>
                                            )}
                                        </td>
                                        <td className="p-3 text-sm text-text-dark font-semibold">
                                            {record.isLeaveBlock ? (
                                                <span className="text-xs font-medium text-text-light/60 italic">-</span>
                                            ) : (
                                                record.totalHours > 0 ? `${record.totalHours} hrs` : '-'
                                            )}
                                        </td>
                                        <td className="p-3">{getStatusBadge(record.status)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end">
                <button onClick={() => setHistoryModalEmployee(null)} className="btn bg-white border border-gray-200 text-text-dark hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-text-dark">Mark Holiday</h2>
              <button onClick={() => setShowHolidayModal(false)} className="text-gray-400 hover:text-status-absent transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleHolidaySubmit} className="p-6">
              <p className="text-sm text-text-light mb-4">This will mark the selected date as a Holiday for all active employees.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Holiday Date</label>
                  <input type="date" className="form-control w-full" value={holidayData.date} onChange={e => setHolidayData({...holidayData, date: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Holiday Name / Reason</label>
                  <input type="text" className="form-control w-full" placeholder="e.g. Diwali, Christmas..." value={holidayData.reason} onChange={e => setHolidayData({...holidayData, reason: e.target.value})} required />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowHolidayModal(false)} className="btn bg-gray-100 text-text-dark hover:bg-gray-200">Cancel</button>
                <button type="submit" className="btn bg-blue-600 hover:bg-blue-700 text-white px-6">Mark Holiday</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Holiday Modal */}
      {showEditHolidayModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-text-dark">Edit Holiday</h2>
              <button onClick={() => setShowEditHolidayModal(false)} className="text-gray-400 hover:text-status-absent transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleEditHolidaySubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Holiday Date</label>
                  <input type="date" className="form-control w-full" value={editHolidayData.newDate} onChange={e => setEditHolidayData({...editHolidayData, newDate: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Holiday Name / Reason</label>
                  <input type="text" className="form-control w-full" placeholder="e.g. Diwali, Christmas..." value={editHolidayData.reason} onChange={e => setEditHolidayData({...editHolidayData, reason: e.target.value})} required />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditHolidayModal(false)} className="btn bg-gray-100 text-text-dark hover:bg-gray-200">Cancel</button>
                <button type="submit" className="btn bg-blue-600 hover:bg-blue-700 text-white px-6">Update Holiday</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;
