import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Users, MoreVertical, Trash2, Eye, Edit, Lock, Unlock, FileUp, X, Download, FileText } from 'lucide-react';

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadingFor, setUploadingFor] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phoneNumber: '', department: '', designation: ''
  });

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/employees');
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Close dropdown on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/admin/employees/${selectedEmployee._id}`, formData);
        alert('Employee updated successfully!');
      } else {
        await axios.post('/api/admin/employees', formData);
        alert('Employee added successfully!');
      }
      setShowAddModal(false);
      setFormData({ fullName: '', email: '', password: '', phoneNumber: '', department: '', designation: '' });
      setIsEditing(false);
      setSelectedEmployee(null);
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`/api/admin/employees/${id}`);
        fetchDashboardData();
        setActiveDropdown(null);
      } catch (error) {
        alert('Failed to delete employee');
      }
    }
  };

  const handleToggleLock = async (id) => {
    try {
      await axios.put(`/api/admin/employees/${id}/lock`);
      fetchDashboardData();
      setActiveDropdown(null);
    } catch (error) {
      alert('Failed to toggle lock status');
    }
  };

  const handleUploadOfferLetter = async (id) => {
    setUploadingFor(id);
    setActiveDropdown(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingFor) return;
    
    const formData = new FormData();
    formData.append('offerLetter', file);
    
    try {
      // In a real app, this would post to your backend.
      // await axios.post(`/api/admin/employees/${uploadingFor}/offer-letter`, formData);
      alert(`Successfully uploaded ${file.name} as offer letter!`);
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setUploadingFor(null);
      e.target.value = ''; // Reset input
    }
  };

  const openViewModal = (emp) => {
    setSelectedEmployee(emp);
    setShowViewModal(true);
    setActiveDropdown(null);
  };

  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      fullName: emp.fullName,
      email: emp.email,
      password: '', // Leave empty for edit unless they want to change it
      phoneNumber: emp.phoneNumber,
      department: emp.department,
      designation: emp.designation
    });
    setIsEditing(true);
    setShowAddModal(true);
    setActiveDropdown(null);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedEmployee(null);
    setFormData({ fullName: '', email: '', password: '', phoneNumber: '', department: '', designation: '' });
    setShowAddModal(true);
  };

  return (
    <div className="animate-fade-in pb-10 relative">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-dark">Manage Employees</h2>
        <p className="text-text-light text-sm mt-1">View, add, and remove employees from the system.</p>
      </div>

      <div className="card shadow-lg border-none overflow-visible">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-lg font-bold text-text-dark flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Employee Database
          </h3>
          <button onClick={openAddModal} className="btn btn-primary text-sm shadow-sm py-2 px-4">+ Add New Employee</button>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-100">
                <th className="p-4 text-xs font-semibold text-text-light uppercase tracking-wider">Employee ID</th>
                <th className="p-4 text-xs font-semibold text-text-light uppercase tracking-wider">Name</th>
                <th className="p-4 text-xs font-semibold text-text-light uppercase tracking-wider">Department</th>
                <th className="p-4 text-xs font-semibold text-text-light uppercase tracking-wider">Designation</th>
                <th className="p-4 text-xs font-semibold text-text-light uppercase tracking-wider">Joining Date</th>
                <th className="p-4 text-xs font-semibold text-text-light uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-text-light uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-text-light">Loading employee data...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-text-light">No employees found. Click "Add New Employee" to register one.</td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <p className="text-sm font-medium text-text-dark">{emp.employeeId}</p>
                    </td>
                    <td className="p-4 cursor-pointer" onClick={() => openViewModal(emp)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-text-dark text-sm hover:text-primary transition-colors">{emp.fullName}</p>
                          <p className="text-xs text-text-light">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-text-dark">{emp.department}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-text-dark">{emp.designation}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-text-dark">{new Date(emp.joiningDate).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        emp.isLocked 
                          ? 'bg-status-absent/10 text-status-absent border-status-absent/20' 
                          : emp.isActive 
                            ? 'bg-status-present/10 text-status-present border-status-present/20' 
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {emp.isLocked ? 'Locked' : emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === emp._id ? null : emp._id);
                        }} 
                        className="p-2 text-text-light hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeDropdown === emp._id && (
                        <div ref={dropdownRef} className="absolute right-8 top-10 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 text-left animate-fade-in">
                          <button onClick={() => openEditModal(emp)} className="w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-gray-50 flex items-center gap-2">
                            <Edit size={14} className="text-primary" /> Edit Employee
                          </button>
                          <button onClick={() => handleDeleteEmployee(emp._id)} className="w-full text-left px-4 py-2 text-sm text-status-absent hover:bg-red-50 flex items-center gap-2">
                            <Trash2 size={14} /> Delete Employee
                          </button>
                          <button onClick={() => handleToggleLock(emp._id)} className="w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-gray-50 flex items-center gap-2">
                            {emp.isLocked ? <><Unlock size={14} className="text-status-present" /> Unlock Employee</> : <><Lock size={14} className="text-orange-500" /> Lock Employee</>}
                          </button>
                          <button onClick={() => handleUploadOfferLetter(emp._id)} className="w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-gray-50 flex items-center gap-2">
                            <FileUp size={14} className="text-blue-500" /> Upload Offer Letter
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button onClick={() => openViewModal(emp)} className="w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-gray-50 flex items-center gap-2">
                            <Eye size={14} className="text-text-light" /> View Details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-text-dark">{isEditing ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-status-absent transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Full Name</label>
                  <input type="text" className="form-control w-full" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Email ID</label>
                  <input type="email" className="form-control w-full" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    {isEditing ? 'New Password (Optional)' : 'Password'}
                  </label>
                  <input 
                    type="text" 
                    className="form-control w-full" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    required={!isEditing} 
                    placeholder={isEditing ? 'Leave blank to keep current' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Phone Number</label>
                  <input type="text" className="form-control w-full" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Department</label>
                  <input type="text" className="form-control w-full" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Designation</label>
                  <input type="text" className="form-control w-full" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} required />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn bg-gray-100 text-text-dark hover:bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary px-6">{isEditing ? 'Save Changes' : 'Register Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-text-dark">Employee Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-status-absent transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-primary/20">
                  {selectedEmployee.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-dark">{selectedEmployee.fullName}</h3>
                  <p className="text-text-light text-sm">{selectedEmployee.employeeId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <p className="text-xs text-text-light mb-1">Email ID</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Password</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.plainPassword || 'Hashed (Legacy)'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Phone Number</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Department</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.department}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Designation</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.designation}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Joining Date</p>
                  <p className="text-sm font-medium text-text-dark">{new Date(selectedEmployee.joiningDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Status</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.isLocked ? 'Locked' : selectedEmployee.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              
              <div className="mt-8">
                <h4 className="text-sm font-bold text-text-dark border-b border-gray-100 pb-2 mb-4">Documents</h4>
                {selectedEmployee.documents && selectedEmployee.documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedEmployee.documents.map((doc, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-primary flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-text-dark">{doc.docType}</p>
                            <p className="text-[10px] text-text-light truncate max-w-[120px]">{doc.fileName}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <a href={`${import.meta.env.VITE_API_BASE_URL || 'https://hrm-dashboard-ln9m.onrender.com'}${doc.url}`} target="_blank" rel="noreferrer" className="btn p-1.5 bg-white border border-gray-200 hover:border-primary hover:text-primary shadow-sm transition-colors" title="View">
                            <Eye size={14} />
                          </a>
                          <a href={`${import.meta.env.VITE_API_BASE_URL || 'https://hrm-dashboard-ln9m.onrender.com'}${doc.url}`} download target="_blank" rel="noreferrer" className="btn p-1.5 bg-white border border-gray-200 hover:border-primary hover:text-primary shadow-sm transition-colors" title="Download">
                            <Download size={14} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                    <p className="text-sm text-text-light">This employee has not uploaded any documents yet.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="btn btn-primary px-6">Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Hidden File Input for Offer Letter Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange} 
        accept=".pdf,.doc,.docx"
      />
    </div>
  );
};

export default AdminEmployees;
