import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Users, MoreVertical, Trash2, Eye, Edit, Lock, Unlock, FileUp, X, Download, FileText, Send } from 'lucide-react';
import PayslipModal from '../../components/PayslipModal';

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterName, setFilterName] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [actionLoadingText, setActionLoadingText] = useState('');

  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '', employeeId: '', gender: 'Male', email: '', password: '', phoneNumber: '', department: '', designation: '', region: '', zone: '', joiningDate: ''
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
    setActionLoadingText(isEditing ? 'Updating Employee...' : 'Registering Employee...');
    try {
      if (isEditing) {
        await axios.put(`/api/admin/employees/${selectedEmployee._id}`, formData);
        alert('Employee updated successfully!');
      } else {
        await axios.post('/api/admin/employees', formData);
        alert('Employee added successfully!');
      }
      setShowAddModal(false);
      setFormData({ firstName: '', middleName: '', lastName: '', employeeId: '', gender: 'Male', email: '', password: '', phoneNumber: '', department: '', designation: '', region: '', zone: '', joiningDate: '' });
      setIsEditing(false);
      setSelectedEmployee(null);
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoadingText('');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      setActionLoadingText('Deleting Employee...');
      try {
        await axios.delete(`/api/admin/employees/${id}`);
        fetchDashboardData();
        setActiveDropdown(null);
      } catch (error) {
        alert('Failed to delete employee');
      } finally {
        setActionLoadingText('');
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
      await axios.post(`/api/admin/employees/${uploadingFor}/offer-letter`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Successfully uploaded ${file.name} as offer letter!`);
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setUploadingFor(null);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteEmployeeDocument = async (empId, docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    setActionLoadingText('Deleting Document...');
    try {
      await axios.delete(`/api/admin/employees/${empId}/documents/${docId}`);
      // Update selectedEmployee locally so UI updates
      setSelectedEmployee(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d._id !== docId)
      }));
      // Update employees list locally so next time modal opens it is correct
      setEmployees(prev => prev.map(emp => {
        if (emp._id === empId) {
          return { ...emp, documents: emp.documents.filter(d => d._id !== docId) };
        }
        return emp;
      }));
      alert('Document deleted successfully!');
    } catch (error) {
      alert('Failed to delete document.');
    } finally {
      setActionLoadingText('');
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
      firstName: emp.firstName || '',
      middleName: emp.middleName || '',
      lastName: emp.lastName || '',
      employeeId: emp.employeeId || '',
      gender: emp.gender || 'Male',
      email: emp.email || '',
      password: '', // Leave empty for edit unless they want to change it
      phoneNumber: emp.phoneNumber || '',
      department: emp.department || '',
      designation: emp.designation || '',
      region: emp.region || '',
      zone: emp.zone || '',
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
      isActive: emp.isActive !== undefined ? emp.isActive : true
    });
    setIsEditing(true);
    setShowAddModal(true);
    setActiveDropdown(null);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedEmployee(null);
    setFormData({ firstName: '', middleName: '', lastName: '', employeeId: '', gender: 'Male', email: '', password: '', phoneNumber: '', department: '', designation: '', region: '', zone: '', joiningDate: '', isActive: true });
    setShowAddModal(true);
  };

  const handleFileDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. It might be blocked by browser policies.');
    }
  };

  const uniqueDepartments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredEmployees = employees.filter(emp => {
    const matchName = filterName === '' || emp.fullName.toLowerCase().includes(filterName.toLowerCase());
    const matchDept = filterDepartment === '' || emp.department === filterDepartment;
    return matchName && matchDept;
  });

  return (
    <div className="animate-fade-in pb-10 relative">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-dark">Manage Employees</h2>
        <p className="text-text-light text-sm mt-1">View, add, and remove employees from the system.</p>
      </div>

      {(uploadingFor || actionLoadingText) && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-bold text-text-dark">{actionLoadingText || 'Uploading Document...'}</p>
            <p className="text-sm text-text-light">Please wait while the request is processed...</p>
          </div>
        </div>
      )}

      <div className="card shadow-lg border-none overflow-visible">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-lg font-bold text-text-dark flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Employee Database
          </h3>
          <button onClick={openAddModal} className="btn btn-primary text-sm shadow-sm py-2 px-4">+ Add New Employee</button>
        </div>
        
        <div className="flex gap-4 mb-6 px-2 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Filter by Employee Name..." 
              className="form-control w-full"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>
          <div className="w-64">
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
        </div>
        
        <div className="overflow-x-auto min-h-[400px] pb-32">
          <table className="w-full text-left border-collapse relative z-10">
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
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-text-light">No employees match your filters.</td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
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
                        <div ref={dropdownRef} className="absolute right-8 top-10 w-48 bg-white rounded-lg shadow-2xl border border-gray-100 py-1 z-[9999] text-left animate-fade-in">
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
                          <button onClick={() => { setSelectedEmployee(emp); setSelectedPayslip(null); setShowPayslipModal(true); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm text-text-dark hover:bg-gray-50 flex items-center gap-2">
                            <Send size={14} className="text-green-500" /> Send Payslip
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-text-dark">{isEditing ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-status-absent transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">First name</label>
                  <input type="text" className="form-control w-full" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Middle name</label>
                  <input type="text" className="form-control w-full" value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Last name</label>
                  <input type="text" className="form-control w-full" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Employee Code</label>
                  <input type="text" className="form-control w-full" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} placeholder="Auto-generated if empty" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Gender</label>
                  <select className="form-control w-full" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} required>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Work email</label>
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
                    pattern="^(?=.*[!@#$%^&*])(?=.*\d)[A-Z].{5,9}$"
                    title="Password must be 6-10 characters long, start with a capital letter, and include at least one number and one special character"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Mobile number</label>
                  <input 
                    type="text" 
                    className="form-control w-full" 
                    value={formData.phoneNumber} 
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                    required 
                    pattern="^[1-9][0-9]{9}$"
                    maxLength={10}
                    title="Phone number must be exactly 10 digits and cannot start with 0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Department</label>
                  <input type="text" className="form-control w-full" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Designation</label>
                  <input type="text" className="form-control w-full" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Region</label>
                  <input type="text" className="form-control w-full" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Zone</label>
                  <input type="text" className="form-control w-full" value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Joining Date</label>
                  <input type="date" className="form-control w-full" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} required />
                </div>
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Account Status</label>
                    <select 
                      className="form-control w-full font-semibold"
                      value={formData.isActive ? "true" : "false"}
                      onChange={e => setFormData({...formData, isActive: e.target.value === "true"})}
                      style={{
                        color: formData.isActive ? '#10B981' : '#EF4444',
                        backgroundColor: formData.isActive ? '#ECFDF5' : '#FEF2F2'
                      }}
                    >
                      <option value="true" className="text-green-600 bg-white">Active (Can Login)</option>
                      <option value="false" className="text-red-600 bg-white">Inactive (Login Disabled)</option>
                    </select>
                  </div>
                )}
              </div>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn bg-white border border-gray-200 text-text-dark hover:bg-gray-50">Cancel</button>
                <button type="submit" className="btn btn-primary px-6">{isEditing ? 'Save Changes' : 'Register Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-text-dark">Employee Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-status-absent transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar min-h-0">
              <div className="flex items-center gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-primary/20">
                  {selectedEmployee.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-dark">{selectedEmployee.fullName}</h3>
                  <p className="text-text-light text-sm">{selectedEmployee.employeeId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <p className="text-xs text-text-light mb-1">First name</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.firstName}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Middle name</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.middleName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Last name</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Joining Date</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Gender</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Work email</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Mobile number</p>
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
                  <p className="text-xs text-text-light mb-1">Region</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.region}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Zone</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.zone}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Joining Date</p>
                  <p className="text-sm font-medium text-text-dark">{new Date(selectedEmployee.joiningDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Password</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.plainPassword || 'Hashed (Legacy)'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-light mb-1">Status</p>
                  <p className="text-sm font-medium text-text-dark">{selectedEmployee.isLocked ? 'Locked' : selectedEmployee.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              
              <div className="mt-8">
                <h4 className="text-sm font-bold text-text-dark border-b border-gray-100 pb-2 mb-4">Documents</h4>
                {selectedEmployee.documents && selectedEmployee.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          <button 
                            onClick={() => handleFileDownload(`${import.meta.env.VITE_API_BASE_URL || 'https://hrm-dashboard-ln9m.onrender.com'}${doc.url}`, doc.fileName || 'document')}
                            className="btn p-1.5 bg-white border border-gray-200 hover:border-primary hover:text-primary shadow-sm transition-colors" 
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteEmployeeDocument(selectedEmployee._id, doc._id)}
                            className="btn p-1.5 bg-white border border-status-absent hover:bg-status-absent hover:text-white text-status-absent shadow-sm transition-colors" 
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
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

              {/* Generated Payslips */}
              <div className="mt-8">
                <h4 className="text-sm font-bold text-text-dark border-b border-gray-100 pb-2 mb-4">Generated Payslips</h4>
                {selectedEmployee.payslips && selectedEmployee.payslips.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {selectedEmployee.payslips.map((payslip, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-green-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-text-dark">Payslip - {payslip.monthYear}</span>
                        </div>
                        <button 
                          onClick={() => { setSelectedPayslip(payslip); setShowPayslipModal(true); setShowViewModal(false); }} 
                          className="btn px-3 py-1.5 text-xs bg-white border border-gray-200 text-text-dark hover:border-primary hover:text-primary shadow-sm transition-colors flex items-center gap-1"
                        >
                          <Edit size={14} /> Edit
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
                    <p className="text-sm text-text-light">No payslips have been generated for this employee.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
              <button onClick={() => setShowViewModal(false)} className="btn btn-primary px-6">Close</button>
            </div>
          </div>
        </div>
      )}
      {showPayslipModal && selectedEmployee && (
        <PayslipModal 
          employee={selectedEmployee} 
          initialData={selectedPayslip}
          onClose={() => {
            setShowPayslipModal(false);
            setSelectedPayslip(null);
            fetchEmployees(); // Refresh data after close
          }} 
        />
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
