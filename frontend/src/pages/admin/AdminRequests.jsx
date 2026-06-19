import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Calendar, AlertCircle, CheckCircle, XCircle, Trash2, Send, Eye } from 'lucide-react';

const AdminRequests = () => {
  const [activeTab, setActiveTab] = useState('leave');
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [leaves, setLeaves] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} requests:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const updateStatus = async (type, id, status) => {
    try {
      await axios.put(`/api/admin/${type}/${id}/status`, { status });
      fetchRequests();
    } catch (error) {
      alert('Failed to update status');
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

  const filteredLeaves = leaves.filter(filterRequest);
  const filteredRegularizations = regularizations.filter(filterRequest);
  const filteredResignations = resignations.filter(filterRequest);

  const pendingLeaves = leaves.filter(req => req.status === 'Pending').length;
  const pendingRegularizations = regularizations.filter(req => req.status === 'Pending').length;
  const pendingResignations = resignations.filter(req => req.status === 'Pending').length;

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
                  
                  {activeTab === 'leave' && (
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
                {activeTab === 'leave' && filteredLeaves.map(req => (
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
                          <button onClick={() => updateStatus('regularizations', req._id, 'Approved')} className="p-1 px-2 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded font-semibold border border-green-200">Accept</button>
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
                  (activeTab === 'regularization' && filteredRegularizations.length === 0) || 
                  (activeTab === 'resignation' && filteredResignations.length === 0)) && (
                  <tr><td colSpan="6" className="p-8 text-center text-text-light">No {activeTab} requests match your filters.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && selectedRequest && (
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
        </div>
      )}

    </div>
  );
};

export default AdminRequests;
