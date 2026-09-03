import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { FileText, Calendar, AlertCircle, CheckCircle, XCircle, Trash2, Send, Eye, Gift } from 'lucide-react';

const AdminRequests = () => {
  const [activeTab, setActiveTab] = useState('leave');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [leaves, setLeaves] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [resignations, setResignations] = useState([]);
  const [compOffCancelRequests, setCompOffCancelRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [compOffForm, setCompOffForm] = useState({ employeeId: '', days: 1, reason: '', workDate: '' });
  const [compOffAction, setCompOffAction] = useState('credit');
  const [compOffLoading, setCompOffLoading] = useState(false);
  const [compOffSuccess, setCompOffSuccess] = useState('');

  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [regDayType, setRegDayType] = useState('Present');
  const [regHalfDayType, setRegHalfDayType] = useState('First Half Absent');

  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      if (activeTab === 'leave') {
        const res = await axios.get('/api/admin/leaves');
        setLeaves(res.data);
      } else if (activeTab === 'regularization') {
        const res = await axios.get('/api/admin/regularizations');
        setRegularizations(res.data);
      } else if (activeTab === 'resignation') {
        const res = await axios.get('/api/admin/resignations');
        setResignations(res.data);
      } else if (activeTab === 'compoff') {
        const res = await axios.get('/api/admin/leaves');
        setLeaves(res.data);
        const cr = await axios.get('/api/admin/comp-off/cancel-requests');
        setCompOffCancelRequests(cr.data);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} requests:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    axios.get('/api/admin/employees').then(r => setEmployees(r.data)).catch(() => {});
  }, [activeTab]);

  const updateStatus = async (type, id, status, extraData = {}) => {
    try {
      await axios.put(`/api/admin/${type}/${id}/status`, { status, ...extraData });
      fetchRequests();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleApproveRegularization = (req) => {
    setSelectedReg(req);
    setShowRegModal(true);
  };

  const confirmRegularization = async () => {
    try {
      await updateStatus('regularizations', selectedReg._id, 'Approved', {
        dayType: regDayType,
        halfDayType: regDayType === 'Half Day' ? regHalfDayType : null
      });
      setShowRegModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteRequest = async (type, id) => {
    if (window.confirm('Are you sure you want to delete this request permanently?')) {
      try {
        await axios.delete(`/api/admin/${type}/${id}`);
        fetchRequests();
      } catch (error) {
        alert('Failed to delete request');
      }
    }
  };

  const handleApproveCompOffCancel = async (id) => {
    if (!window.confirm('Approve karne par employee ka Comp Off balance deduct hoga aur leave cancel ho jaayegi. Confirm?')) return;
    try {
      const res = await axios.put(`/api/admin/comp-off/cancel-requests/${id}/approve`);
      alert(`✅ ${res.data.message}`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Approve karne mein error aaya.');
    }
  };

  const handleRejectCompOffCancel = async (id) => {
    if (!window.confirm('Reject karne par leave unchanged rahegi. Confirm?')) return;
    try {
      await axios.put(`/api/admin/comp-off/cancel-requests/${id}/reject`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Reject karne mein error aaya.');
    }
  };

  const removeDate = async (type, id, dateToRemove) => {
    if (window.confirm(`Are you sure you want to remove this date (${formatDate(dateToRemove)})?`)) {
      try {
        await axios.put(`/api/admin/${type}/${id}/remove-date`, { date: dateToRemove });
        fetchRequests();
      } catch (error) {
        alert('Failed to remove date');
      }
    }
  };

  const sendPdf = () => {
    alert('Request details sent as a PDF to the employee!');
  };

  const viewDetails = (req, type) => {
    setSelectedRequest({ ...req, requestType: type });
    setIsModalOpen(true);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

  const allRequests = [...leaves, ...regularizations, ...resignations];
  const uniqueDepartments = [...new Set(allRequests.map(r => r.employee?.department).filter(Boolean))];

  const filterRequest = (req) => {
    const matchName = filterEmployee === '' || req.employee?.fullName?.toLowerCase().includes(filterEmployee.toLowerCase());
    const matchDept = filterDepartment === '' || req.employee?.department === filterDepartment;
    
    // For date matching, check if the request has dates array or fromDate/resignationDate
    let matchDate = true;
    if (filterDate) {
      if (req.dates && req.dates.length > 0) {
        matchDate = req.dates.some(d => new Date(d).toISOString().split('T')[0] === filterDate);
      } else if (req.fromDate) {
        matchDate = new Date(req.fromDate).toISOString().split('T')[0] === filterDate;
      } else if (req.resignationDate) {
        matchDate = new Date(req.resignationDate).toISOString().split('T')[0] === filterDate;
      } else if (req.createdAt) {
        matchDate = new Date(req.createdAt).toISOString().split('T')[0] === filterDate;
      } else {
        matchDate = false;
      }
    }
    
    return matchName && matchDept && matchDate;
  };

  const normalLeaves = leaves.filter(req => req.leaveType !== 'Comp Off');
  const compOffLeaves = leaves.filter(req => req.leaveType === 'Comp Off');

  const filteredLeaves = normalLeaves.filter(filterRequest);
  const filteredCompOffLeaves = compOffLeaves.filter(filterRequest);
  const filteredRegularizations = regularizations.filter(filterRequest);
  const filteredResignations = resignations.filter(filterRequest);

  const pendingLeaves = normalLeaves.filter(req => req.status === 'Pending').length;
  const pendingCompOffs = compOffLeaves.filter(req => req.status === 'Pending').length + compOffCancelRequests.filter(r => r.compOffRequestStatus === 'Pending').length;
  const pendingRegularizations = regularizations.filter(req => req.status === 'Pending').length;
  const pendingResignations = resignations.filter(req => req.status === 'Pending').length;

  const handleCompOffSubmit = async (e) => {
    e.preventDefault();
    setCompOffLoading(true);
    setCompOffSuccess('');
    try {
      const endpoint = compOffAction === 'credit' ? '/api/admin/comp-off/credit' : '/api/admin/comp-off/deduct';
      const res = await axios.post(endpoint, compOffForm);
      setCompOffSuccess(res.data.message);
      setCompOffForm({ employeeId: '', days: 1, reason: '', workDate: '' });
      fetchRequests(); // refresh employee balances
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${compOffAction} Comp Off`);
    } finally {
      setCompOffLoading(false);
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-dark">Requests Management</h2>
        <p className="text-text-light text-sm mt-1">Review and manage all incoming employee requests.</p>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button 
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'leave' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark'}`}
          onClick={() => setActiveTab('leave')}
        >
          <Calendar size={16} /> Leave Requests
          {pendingLeaves > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {pendingLeaves}
            </span>
          )}
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'regularization' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark'}`}
          onClick={() => setActiveTab('regularization')}
        >
          <AlertCircle size={16} /> Regularization Requests
          {pendingRegularizations > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {pendingRegularizations}
            </span>
          )}
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'resignation' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark'}`}
          onClick={() => setActiveTab('resignation')}
        >
          <FileText size={16} /> Resignation Requests
          {pendingResignations > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {pendingResignations}
            </span>
          )}
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'compoff' ? 'border-purple-500 text-purple-600' : 'border-transparent text-text-light hover:text-text-dark'}`}
          onClick={() => setActiveTab('compoff')}
        >
          <Gift size={16} /> Comp Off
          {pendingCompOffs > 0 && (
            <span className="bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {pendingCompOffs}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-4 mb-6 px-2 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input 
            type="text" 
            placeholder="Filter by Employee Name..." 
            className="form-control w-full"
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
          />
        </div>
        <div className="w-48">
          <select 
            className="form-control w-full"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div className="w-48">
          <input 
            type="date" 
            className="form-control w-full"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            title="Filter by Date"
          />
        </div>
      </div>

      <div className="card shadow-md border-none overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="p-10 text-center text-text-light">Loading requests...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Employee</th>
                  
                  {(activeTab === 'leave' || activeTab === 'compoff') && (
                    <>
                      <th className="p-4 text-xs font-semibold text-text-light uppercase">Leave Type</th>
                      <th className="p-4 text-xs font-semibold text-text-light uppercase">Duration</th>
                      <th className="p-4 text-xs font-semibold text-text-light uppercase">Reason</th>
                    </>
                  )}

                  {activeTab === 'regularization' && (
                    <>
                      <th className="p-4 text-xs font-semibold text-text-light uppercase">Date Range</th>
                      <th className="p-4 text-xs font-semibold text-text-light uppercase">Reason</th>
                    </>
                  )}

                  {activeTab === 'resignation' && (
                    <>
                      <th className="p-4 text-xs font-semibold text-text-light uppercase">Resignation Date</th>
                      <th className="p-4 text-xs font-semibold text-text-light uppercase">Reason</th>
                    </>
                  )}

                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Status</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(activeTab === 'leave' || activeTab === 'compoff') && (activeTab === 'leave' ? filteredLeaves : filteredCompOffLeaves).map(req => (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="text-sm font-semibold text-text-dark">{req.employee?.fullName}</p>
                      <p className="text-xs text-text-light">{req.employee?.employeeId}</p>
                    </td>
                    <td className="p-4 text-sm text-text-dark font-medium">{req.leaveType}</td>
                    <td className="p-4 text-sm text-text-dark">
                      {req.dates && req.dates.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {req.dates.map((d, i) => (
                            <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary-dark rounded text-[10px] font-bold inline-flex items-center gap-1 border border-primary/20">
                              {formatDate(d)}
                              <button onClick={() => removeDate('leaves', req._id, d)} className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-0.5">
                                <XCircle size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span>{formatDate(req.fromDate)} - {formatDate(req.toDate)}</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-text-dark max-w-xs truncate" title={req.reason}>{req.reason}</td>
                    <td className="p-4">
                      {req.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus('leaves', req._id, 'Approved')} className="p-1 px-2 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded font-semibold border border-green-200">Accept</button>
                          <button onClick={() => updateStatus('leaves', req._id, 'Rejected')} className="p-1 px-2 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded font-semibold border border-red-200">Reject</button>
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{req.status}</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => viewDetails(req, 'Leave')} className="p-1.5 text-text-light hover:text-primary hover:bg-primary/10 rounded transition-colors" title="View"><Eye size={16} /></button>
                        <button onClick={sendPdf} className="p-1.5 text-text-light hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Send as PDF"><Send size={16} /></button>
                        <button onClick={() => deleteRequest('leaves', req._id)} className="p-1.5 text-text-light hover:text-status-absent hover:bg-status-absent/10 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'regularization' && filteredRegularizations.map(req => (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="text-sm font-semibold text-text-dark">{req.employee?.fullName}</p>
                      <p className="text-xs text-text-light">{req.employee?.employeeId}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                        {req.dates && req.dates.length > 0 ? (
                          req.dates.map((dateStr, idx) => {
                            const d = new Date(dateStr);
                            const formatted = `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
                            return (
                              <span key={idx} className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded font-bold text-xs whitespace-nowrap inline-flex items-center gap-1">
                                {formatted}
                                <button onClick={() => removeDate('regularizations', req._id, dateStr)} className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-0.5">
                                  <XCircle size={12} />
                                </button>
                              </span>
                            );
                          })
                        ) : (
                          <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded font-bold text-xs whitespace-nowrap">
                            {formatDate(req.fromDate)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-text-dark max-w-xs truncate" title={req.reason}>{req.reason}</td>
                    <td className="p-4">
                      {req.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveRegularization(req)} className="p-1 px-2 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded font-semibold border border-green-200">Accept</button>
                          <button onClick={() => updateStatus('regularizations', req._id, 'Rejected')} className="p-1 px-2 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded font-semibold border border-red-200">Reject</button>
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{req.status}</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => viewDetails(req, 'Regularization')} className="p-1.5 text-text-light hover:text-primary hover:bg-primary/10 rounded transition-colors" title="View"><Eye size={16} /></button>
                        <button onClick={sendPdf} className="p-1.5 text-text-light hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Send as PDF"><Send size={16} /></button>
                        <button onClick={() => deleteRequest('regularizations', req._id)} className="p-1.5 text-text-light hover:text-status-absent hover:bg-status-absent/10 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'resignation' && filteredResignations.map(req => (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="text-sm font-semibold text-text-dark">{req.employee?.fullName}</p>
                      <p className="text-xs text-text-light">{req.employee?.employeeId}</p>
                    </td>
                    <td className="p-4 text-sm text-text-dark">{formatDate(req.resignationDate)}</td>
                    <td className="p-4 text-sm text-text-dark max-w-xs truncate" title={req.reason}>{req.reason}</td>
                    <td className="p-4">
                      {req.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button onClick={() => updateStatus('resignations', req._id, 'Approved')} className="p-1 px-2 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded font-semibold border border-green-200">Accept</button>
                          <button onClick={() => updateStatus('resignations', req._id, 'Rejected')} className="p-1 px-2 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded font-semibold border border-red-200">Reject</button>
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{req.status}</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => viewDetails(req, 'Resignation')} className="p-1.5 text-text-light hover:text-primary hover:bg-primary/10 rounded transition-colors" title="View"><Eye size={16} /></button>
                        <button onClick={sendPdf} className="p-1.5 text-text-light hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Send as PDF"><Send size={16} /></button>
                        <button onClick={() => deleteRequest('resignations', req._id)} className="p-1.5 text-text-light hover:text-status-absent hover:bg-status-absent/10 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {((activeTab === 'leave' && filteredLeaves.length === 0) || 
                  (activeTab === 'compoff' && filteredCompOffLeaves.length === 0) || 
                  (activeTab === 'regularization' && filteredRegularizations.length === 0) || 
                  (activeTab === 'resignation' && filteredResignations.length === 0)) && (
                  <tr><td colSpan="6" className="p-8 text-center text-text-light">No {activeTab} requests match your filters.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Comp Off Credit Section */}
      {activeTab === 'compoff' && (
        <div className="card shadow-md border-none mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Gift size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-dark">Manage Comp Off Balance</h3>
              <p className="text-xs text-text-light">Credit or deduct Comp Off days for an employee.</p>
            </div>
          </div>

          <div className="flex gap-4 border-b border-gray-100 mb-6 pb-2">
            <button 
              type="button" 
              onClick={() => setCompOffAction('credit')} 
              className={`pb-2 px-2 text-sm font-semibold transition-colors border-b-2 ${compOffAction === 'credit' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Credit Comp Off
            </button>
            <button 
              type="button" 
              onClick={() => setCompOffAction('deduct')} 
              className={`pb-2 px-2 text-sm font-semibold transition-colors border-b-2 ${compOffAction === 'deduct' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Deduct Comp Off
            </button>
          </div>

          {compOffSuccess && (
            <div className={`mb-4 p-3 border rounded-lg text-sm font-medium flex items-center gap-2 ${compOffAction === 'credit' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <CheckCircle size={16} /> {compOffSuccess}
            </div>
          )}

          <form onSubmit={handleCompOffSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 font-medium text-sm text-text-dark">Select Employee</label>
              <select
                className="form-control"
                required
                value={compOffForm.employeeId}
                onChange={e => setCompOffForm({ ...compOffForm, employeeId: e.target.value })}
              >
                <option value="">-- Select Employee --</option>
                {employees.filter(e => e.role === 'employee' && e.isActive).map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName} ({emp.employeeId}) — Current Balance: {emp.compOffBalance || 0} day(s)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 font-medium text-sm text-text-dark">Days to {compOffAction === 'credit' ? 'Credit' : 'Deduct'}</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  className="form-control"
                  required
                  value={compOffForm.days}
                  onChange={e => setCompOffForm({ ...compOffForm, days: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1.5 font-medium text-sm text-text-dark">Work Date (Optional)</label>
                <input
                  type="date"
                  className="form-control"
                  value={compOffForm.workDate}
                  onChange={e => setCompOffForm({ ...compOffForm, workDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 font-medium text-sm text-text-dark">Reason / Notes</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder={compOffAction === 'credit' ? "e.g. Worked on Sunday 14 July 2026 for project deadline..." : "e.g. Deducted by mistake or unused balance expired..."}
                value={compOffForm.reason}
                onChange={e => setCompOffForm({ ...compOffForm, reason: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={compOffLoading}
              className={`btn text-white w-full flex items-center justify-center gap-2 disabled:opacity-60 ${compOffAction === 'credit' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {compOffLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                compOffAction === 'credit' ? <Gift size={16} /> : <Trash2 size={16} />
              )}
              {compOffLoading ? 'Processing...' : compOffAction === 'credit' ? 'Credit Comp Off' : 'Deduct Comp Off'}
            </button>
          </form>

          {/* ===== Employee-Initiated Comp Off Cancel Requests ===== */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-base">🔄</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-text-dark">Employee Comp Off Cancel Requests</h3>
                <p className="text-xs text-text-light">Employees ne apni leave ko Comp Off se cancel karne ki request bheji hai.</p>
              </div>
              {compOffCancelRequests.filter(r => r.compOffRequestStatus === 'Pending').length > 0 && (
                <span className="ml-auto bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {compOffCancelRequests.filter(r => r.compOffRequestStatus === 'Pending').length} Pending
                </span>
              )}
            </div>

            {compOffCancelRequests.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm text-text-light">Koi Comp Off cancel request nahi aayi.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {compOffCancelRequests.map(req => {
                  const daysNeeded = req.dates?.length || 1;
                  return (
                    <div key={req._id} className={`rounded-xl border p-4 ${req.compOffRequestStatus === 'Pending' ? 'border-purple-200 bg-purple-50/30' : 'border-gray-100 bg-white'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm text-text-dark">{req.employee?.fullName}</p>
                          <p className="text-xs text-text-light">{req.employee?.employeeId} • {req.employee?.department}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Leave: <span className="font-semibold">{req.leaveType}</span> ({daysNeeded}d) •
                            Balance: <span className="font-semibold text-purple-700">{req.employee?.compOffBalance || 0}d</span>
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {req.dates?.map((d, i) => (
                              <span key={i} className="inline-block px-1.5 py-0.5 bg-primary/10 text-primary-dark rounded text-[10px] font-bold">
                                {new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            ))}
                          </div>
                          {req.compOffRequestReason && (
                            <p className="text-xs text-text-light mt-1 italic">"{req.compOffRequestReason}"</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                            ${req.compOffRequestStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                              req.compOffRequestStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'}`}>
                            {req.compOffRequestStatus}
                          </span>
                          {req.compOffRequestStatus === 'Pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveCompOffCancel(req._id)}
                                className="px-2.5 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded font-bold transition-colors"
                              >
                                ✅ Approve
                              </button>
                              <button
                                onClick={() => handleRejectCompOffCancel(req._id)}
                                className="px-2.5 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded font-bold transition-colors"
                              >
                                ❌ Reject
                              </button>
                            </div>
                          )}
                          {req.compOffRequestStatus === 'Approved' && (
                            <p className="text-[11px] text-green-600 font-semibold">✅ {daysNeeded}d deducted. Leave cancelled.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && selectedRequest && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm relative z-[10000] border border-gray-100 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-bold text-text-dark flex items-center gap-1.5">
                <FileText size={16} className="text-primary" /> {selectedRequest.requestType} Request
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <XCircle size={18} />
              </button>
            </div>
            
            <div className="p-4 bg-white">
              <div className="mb-3">
                <p className="text-sm font-bold text-text-dark">{selectedRequest.employee?.fullName}</p>
                <p className="text-xs text-text-light">{selectedRequest.employee?.employeeId} &bull; {selectedRequest.employee?.department}</p>
              </div>
              
              {selectedRequest.requestType === 'Leave' && (
                <div className="mb-3">
                  <p className="text-xs text-text-light uppercase tracking-wider mb-0.5">Leave Type</p>
                  <p className="text-sm font-medium text-text-dark">{selectedRequest.leaveType}</p>
                </div>
              )}
              
              <div className="mb-3">
                <p className="text-xs text-text-light uppercase tracking-wider mb-1">Dates</p>
                <div className="flex flex-wrap gap-1">
                  {selectedRequest.dates && selectedRequest.dates.length > 0 ? (
                    selectedRequest.dates.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold border border-blue-100">
                        {formatDate(d)}
                      </span>
                    ))
                  ) : selectedRequest.resignationDate ? (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold border border-blue-100">
                      {formatDate(selectedRequest.resignationDate)}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold border border-blue-100">
                      {formatDate(selectedRequest.fromDate)} to {formatDate(selectedRequest.toDate)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-xs text-text-light uppercase tracking-wider mb-0.5">Reason</p>
                <p className="text-sm text-text-dark bg-gray-50 p-2 rounded border border-gray-100">
                  {selectedRequest.reason || <span className="text-gray-400 italic">No reason.</span>}
                </p>
              </div>
              
              <div className="mb-3">
                <p className="text-xs text-text-light uppercase tracking-wider mb-0.5">Applied On</p>
                <p className="text-sm font-medium text-text-dark">
                  {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true
                  }) : 'Not available'}
                </p>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                  selectedRequest.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                  selectedRequest.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {selectedRequest.status}
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showRegModal && selectedReg && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRegModal(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm relative z-[10000] p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-dark mb-4">Approve Regularization</h3>
            <p className="text-sm text-text-light mb-4">Select the attendance status for this regularization request.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-dark mb-1">Day Type</label>
              <select 
                className="form-control w-full"
                value={regDayType}
                onChange={(e) => setRegDayType(e.target.value)}
              >
                <option value="Present">Present (Full Day)</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            {regDayType === 'Half Day' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-dark mb-1">Half Day Type</label>
                <select 
                  className="form-control w-full"
                  value={regHalfDayType}
                  onChange={(e) => setRegHalfDayType(e.target.value)}
                >
                  <option value="First Half Absent">First Half Absent</option>
                  <option value="Second Half Absent">Second Half Absent</option>
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowRegModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRegularization}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminRequests;
