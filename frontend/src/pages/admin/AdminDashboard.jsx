import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Users, UserCheck, UserX, Clock, CalendarDays, MoreVertical, Trash2, Eye, X, FileText, Building } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
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
      const [empRes, leavesRes, regRes, resRes, attendanceRes] = await Promise.all([
        axios.get('/api/admin/employees'),
        axios.get('/api/admin/leaves'),
        axios.get('/api/admin/regularizations'),
        axios.get('/api/admin/resignations'),
        axios.get('/api/admin/attendance')
      ]);
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      setAttendanceRecords(Array.isArray(attendanceRes.data) ? attendanceRes.data : []);
      
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const departmentData = employees.reduce((acc, employee) => {
    const dept = employee.department || 'Unassigned';
    const existing = acc.find(item => item.name === dept);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: dept, value: 1 });
    }
    return acc;
  }, []);

  // Process attendance data from records
  const processAttendanceData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const result = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      let d = new Date();
      d.setMonth(currentMonth - i);
      result.push({
        name: monthNames[d.getMonth()],
        month: d.getMonth(),
        year: d.getFullYear(),
        present: 0,
        absent: 0,
        leave: 0
      });
    }

    attendanceRecords.forEach(record => {
      if (!record.date) return;
      const date = new Date(record.date);
      const m = date.getMonth();
      const y = date.getFullYear();
      
      const monthData = result.find(item => item.month === m && item.year === y);
      if (monthData) {
        if (record.status === 'Present') monthData.present += 1;
        else if (record.status === 'Absent') monthData.absent += 1;
        else if (record.status === 'Leave Approved' || record.status === 'Half Day') monthData.leave += 1;
      }
    });

    return result;
  };

  const attendanceData = processAttendanceData();

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
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="present" name="Present" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="leave" name="Leave" stackId="a" fill="#eab308" />
                <Bar dataKey="absent" name="Absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card !mb-0">
          <h3 className="text-lg font-semibold mb-4">Department Distribution</h3>
          <div className="h-72 w-full flex items-center justify-center">
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" layout="vertical" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-text-light text-sm">No department data available</div>
            )}
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
