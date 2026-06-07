import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Users, UserCheck, UserX, Clock, CalendarDays, MoreVertical, Trash2, Eye, X, FileText, Building } from 'lucide-react';

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phoneNumber: '', department: '', designation: ''
  });

  const fetchDashboardData = async () => {
    try {
      const [empRes, leavesRes, regRes, resRes] = await Promise.all([
        axios.get('/api/admin/employees'),
        axios.get('/api/admin/leaves'),
        axios.get('/api/admin/regularizations'),
        axios.get('/api/admin/resignations')
      ]);
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      
      const leavesCount = Array.isArray(leavesRes.data) ? leavesRes.data.length : 0;
      const regCount = Array.isArray(regRes.data) ? regRes.data.length : 0;
      const resCount = Array.isArray(resRes.data) ? resRes.data.length : 0;
      
      setTotalRequests(leavesCount + regCount + resCount);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/employees', formData);
      setShowAddModal(false);
      setFormData({ fullName: '', email: '', password: '', phoneNumber: '', department: '', designation: '' });
      fetchDashboardData();
      alert('Employee added successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add employee');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to remove this employee?')) {
      try {
        await axios.delete(`/api/admin/employees/${id}`);
        fetchDashboardData();
      } catch (error) {
        alert('Failed to delete employee');
      }
    }
  };

  const openViewModal = (emp) => {
    setSelectedEmployee(emp);
    setShowViewModal(true);
  };

  const totalDepartments = new Set(employees.map(e => e.department).filter(Boolean)).size;

  return (
    <div className="animate-fade-in pb-10 relative">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-dark">Admin Dashboard</h2>
        <p className="text-text-light text-sm mt-1">Overview of your workforce and operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <Link to="/admin/employees" className="card !mb-0 border-t-4 border-primary shadow-md hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <div className="text-text-light text-sm font-semibold uppercase tracking-wider">Total Employees</div>
            <div className="bg-primary/10 p-2 rounded-lg">
              <Users size={20} className="text-primary" />
            </div>
          </div>
          <div className="text-4xl font-bold text-text-dark">{loading ? '...' : employees.length}</div>
          <p className="text-xs text-text-light mt-2">Currently registered in system</p>
        </Link>
        
        <Link to="/admin/employees" className="card !mb-0 border-t-4 border-status-present shadow-md hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <div className="text-text-light text-sm font-semibold uppercase tracking-wider">Total Departments</div>
            <div className="bg-status-present/10 p-2 rounded-lg">
              <Building size={20} className="text-status-present" />
            </div>
          </div>
          <div className="text-4xl font-bold text-text-dark">{loading ? '...' : totalDepartments}</div>
          <p className="text-xs text-text-light mt-2">Active departments</p>
        </Link>
        
        <Link to="/admin/requests" className="card !mb-0 border-t-4 border-status-absent shadow-md hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <div className="text-text-light text-sm font-semibold uppercase tracking-wider">Total Requests</div>
            <div className="bg-status-absent/10 p-2 rounded-lg">
              <FileText size={20} className="text-status-absent" />
            </div>
          </div>
          <div className="text-4xl font-bold text-text-dark">{loading ? '...' : totalRequests}</div>
          <p className="text-xs text-text-light mt-2">Leaves, Regularizations, Resignations</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <div className="card lg:col-span-2 !mb-0">
          <h3 className="text-lg font-semibold mb-4">Monthly Attendance</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
            [Attendance Chart Placeholder]
          </div>
        </div>
        <div className="card !mb-0">
          <h3 className="text-lg font-semibold mb-4">Department Distribution</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
            [Distribution Chart Placeholder]
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
        <div className="text-text-light text-sm py-4 text-center">
          No recent activities found. Navigate to the Employees tab to manage your workforce.
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
