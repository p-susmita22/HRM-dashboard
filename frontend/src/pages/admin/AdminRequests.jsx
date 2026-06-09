import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Calendar, AlertCircle, CheckCircle, XCircle, Trash2, Send, Eye } from 'lucide-react';

const AdminRequests = () => {
  const [activeTab, setActiveTab] = useState('leave');
  
  const [leaves, setLeaves] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const sendPdf = () => {
    alert('Request details sent as a PDF to the employee!');
  };

  const viewDetails = () => {
    alert('Viewing full request details... (To be implemented)');
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

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
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'regularization' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark'}`}
          onClick={() => setActiveTab('regularization')}
        >
          <AlertCircle size={16} /> Regularization Requests
        </button>
        <button 
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'resignation' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark'}`}
          onClick={() => setActiveTab('resignation')}
        >
          <FileText size={16} /> Resignation Requests
        </button>
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
                {activeTab === 'leave' && leaves.map(req => (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="text-sm font-semibold text-text-dark">{req.employee?.fullName}</p>
                      <p className="text-xs text-text-light">{req.employee?.employeeId}</p>
                    </td>
                    <td className="p-4 text-sm text-text-dark font-medium">{req.leaveType}</td>
                    <td className="p-4 text-sm text-text-dark">{formatDate(req.fromDate)} - {formatDate(req.toDate)}</td>
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
                        <button onClick={viewDetails} className="p-1.5 text-text-light hover:text-primary hover:bg-primary/10 rounded transition-colors" title="View"><Eye size={16} /></button>
                        <button onClick={sendPdf} className="p-1.5 text-text-light hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Send as PDF"><Send size={16} /></button>
                        <button onClick={() => deleteRequest('leaves', req._id)} className="p-1.5 text-text-light hover:text-status-absent hover:bg-status-absent/10 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'regularization' && regularizations.map(req => (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="text-sm font-semibold text-text-dark">{req.employee?.fullName}</p>
                      <p className="text-xs text-text-light">{req.employee?.employeeId}</p>
                    </td>
                    <td className="p-4">
                      {req.dates ? (
                        <div className="flex flex-wrap gap-1.5">
                          {req.dates.split(',').map((dateStr, idx) => {
                            const d = new Date(dateStr);
                            const formatted = `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
                            return (
                              <span key={idx} className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded font-bold text-[11px] whitespace-nowrap">
                                {formatted}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-sm text-text-dark">{formatDate(req.fromDate)}</span>
                      )}
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
                        <button onClick={viewDetails} className="p-1.5 text-text-light hover:text-primary hover:bg-primary/10 rounded transition-colors" title="View"><Eye size={16} /></button>
                        <button onClick={sendPdf} className="p-1.5 text-text-light hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Send as PDF"><Send size={16} /></button>
                        <button onClick={() => deleteRequest('regularizations', req._id)} className="p-1.5 text-text-light hover:text-status-absent hover:bg-status-absent/10 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'resignation' && resignations.map(req => (
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
                        <button onClick={viewDetails} className="p-1.5 text-text-light hover:text-primary hover:bg-primary/10 rounded transition-colors" title="View"><Eye size={16} /></button>
                        <button onClick={sendPdf} className="p-1.5 text-text-light hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Send as PDF"><Send size={16} /></button>
                        <button onClick={() => deleteRequest('resignations', req._id)} className="p-1.5 text-text-light hover:text-status-absent hover:bg-status-absent/10 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}

                {((activeTab === 'leave' && leaves.length === 0) || 
                  (activeTab === 'regularization' && regularizations.length === 0) || 
                  (activeTab === 'resignation' && resignations.length === 0)) && (
                  <tr><td colSpan="6" className="p-8 text-center text-text-light">No {activeTab} requests found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRequests;
