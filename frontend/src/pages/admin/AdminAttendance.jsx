import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarDays, Clock, CheckCircle, XCircle, Edit, Download, Calendar as CalIcon } from 'lucide-react';

const AdminAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
  const [filterEmployee, setFilterEmployee] = useState('');

  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  const [correctionData, setCorrectionData] = useState({ punchIn: '', punchOut: '', status: '' });
  const [holidayData, setHolidayData] = useState({ date: '', reason: '' });

  const fetchAttendance = async () => {
    try {
      const response = await axios.get('/api/admin/attendance');
      setAttendanceRecords(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.put(`/api/admin/attendance/${id}/approve`);
      fetchAttendance();
      alert('Attendance approved and calculated automatically!');
    } catch (error) {
      alert('Failed to approve attendance');
    }
  };

  const handleCorrectSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/attendance/${selectedRecord._id}/correct`, correctionData);
      setShowCorrectModal(false);
      fetchAttendance();
      alert('Attendance corrected successfully!');
    } catch (error) {
      alert('Failed to correct attendance');
    }
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/attendance/holiday', holidayData);
      setShowHolidayModal(false);
      fetchAttendance();
      alert('Holiday marked for all employees!');
    } catch (error) {
      alert('Failed to mark holiday');
    }
  };

  const openCorrectModal = (record) => {
    setSelectedRecord(record);
    setCorrectionData({
      punchIn: record.punchIn ? new Date(record.punchIn).toISOString().slice(0, 16) : '',
      punchOut: record.punchOut ? new Date(record.punchOut).toISOString().slice(0, 16) : '',
      status: record.status !== 'Pending' ? record.status : 'Present'
    });
    setShowCorrectModal(true);
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
      case 'Present': return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">🟢 Present</span>;
      case 'Absent': return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">🔴 Absent</span>;
      case 'Leave Approved': 
      case 'Leave': return <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">🟡 Leave</span>;
      case 'Holiday': return <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">🔵 Holiday</span>;
      case 'Half Day': return <span className="px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-700">🟢🔴 Half Day</span>;
      default: return <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">Pending</span>;
    }
  };

  const pendingRecords = attendanceRecords.filter(r => r.adminStatus === 'Pending');
  const allRecords = attendanceRecords.filter(r => 
    r.adminStatus !== 'Pending' && 
    (filterEmployee === '' || r.employee?.fullName.toLowerCase().includes(filterEmployee.toLowerCase()))
  );

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
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals ({pendingRecords.length})
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark'}`}
          onClick={() => setActiveTab('all')}
        >
          Monthly Records
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
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openCorrectModal(record)} className="btn py-1 px-3 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs flex items-center gap-1">
                            <Edit size={12} /> Correct
                          </button>
                          <button onClick={() => handleApprove(record._id)} className="btn py-1 px-3 btn-primary text-xs flex items-center gap-1">
                            <CheckCircle size={12} /> Accept
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

      {activeTab === 'all' && (
        <div className="card shadow-md border-none overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-text-dark flex items-center gap-2">
              <CalendarDays size={20} className="text-primary" /> All Attendance Records
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
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Date</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Employee</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Punches</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Total Hours</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Status</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allRecords.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-text-light">No records found.</td></tr>
                ) : (
                  allRecords.map(record => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-text-dark font-medium">{formatDate(record.date)}</td>
                      <td className="p-4">
                        <p className="text-sm font-semibold text-text-dark">{record.employee?.fullName}</p>
                        <p className="text-xs text-text-light">{record.employee?.employeeId}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-text-light">In: <span className="text-text-dark font-medium">{formatTime(record.punchIn)}</span></p>
                        <p className="text-xs text-text-light">Out: <span className="text-text-dark font-medium">{formatTime(record.punchOut)}</span></p>
                      </td>
                      <td className="p-4 text-sm text-text-dark font-semibold">{record.totalHours > 0 ? `${record.totalHours} hrs` : '-'}</td>
                      <td className="p-4">{getStatusBadge(record.status)}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => openCorrectModal(record)} className="p-2 text-text-light hover:text-primary transition-colors rounded-lg hover:bg-primary/10" title="Correct Attendance">
                          <Edit size={16} />
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

      {/* Correct Attendance Modal */}
      {showCorrectModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-text-dark">Correct Attendance</h2>
              <button onClick={() => setShowCorrectModal(false)} className="text-gray-400 hover:text-status-absent transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleCorrectSubmit} className="p-6">
              <div className="mb-4 text-sm text-text-light border-b border-gray-100 pb-4">
                <p><strong>Employee:</strong> {selectedRecord.employee?.fullName}</p>
                <p><strong>Date:</strong> {formatDate(selectedRecord.date)}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Punch In Time</label>
                  <input type="datetime-local" className="form-control w-full" value={correctionData.punchIn} onChange={e => setCorrectionData({...correctionData, punchIn: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Punch Out Time</label>
                  <input type="datetime-local" className="form-control w-full" value={correctionData.punchOut} onChange={e => setCorrectionData({...correctionData, punchOut: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Status Override</label>
                  <select className="form-control w-full" value={correctionData.status} onChange={e => setCorrectionData({...correctionData, status: e.target.value})}>
                    <option value="Present">Present</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Absent">Absent</option>
                    <option value="Leave Approved">Leave</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCorrectModal(false)} className="btn bg-gray-100 text-text-dark hover:bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary px-6">Save Correction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-text-dark">Mark Holiday</h2>
              <button onClick={() => setShowHolidayModal(false)} className="text-gray-400 hover:text-status-absent transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleHolidaySubmit} className="p-6">
              <p className="text-sm text-text-light mb-4">This will mark the selected date as a Holiday (🔵) for all active employees.</p>
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
    </div>
  );
};

export default AdminAttendance;
