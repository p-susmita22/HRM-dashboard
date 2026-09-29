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
  const [leaves, setLeaves] = useState([]);
  const [remoteRequests, setRemoteRequests] = useState([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  const [summaryMonth, setSummaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phoneNumber: '', department: '', designation: ''
  });

  const [showPendingLeaveModal, setShowPendingLeaveModal] = useState(false);
  const pendingLeaves = leaves.filter(l => l.status === 'Pending');

  const fetchDashboardData = async () => {
    try {
      const [empRes, leavesRes, regRes, resRes, attendanceRes, remoteRes] = await Promise.all([
        axios.get('/api/admin/employees'),
        axios.get('/api/admin/leaves'),
        axios.get('/api/admin/regularizations'),
        axios.get('/api/admin/resignations'),
        axios.get('/api/admin/attendance'),
        axios.get('/api/admin/attendance/remote-requests')
      ]);
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      setAttendanceRecords(Array.isArray(attendanceRes.data) ? attendanceRes.data : []);
      setLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
      setRemoteRequests(Array.isArray(remoteRes.data) ? remoteRes.data : []);
      
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

  useEffect(() => {
    if (pendingLeaves.length > 0 && !sessionStorage.getItem('pendingLeaveModalShown')) {
      setShowPendingLeaveModal(true);
      sessionStorage.setItem('pendingLeaveModalShown', 'true');
    }
  }, [leaves]);

  const handleApproveLeave = async (id) => {
    try {
      await axios.put(`/api/admin/leaves/${id}/status`, { status: 'Approved' });
      alert('Leave approved successfully!');
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      alert('Failed to approve leave');
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await axios.put(`/api/admin/leaves/${id}/status`, { status: 'Rejected' });
      alert('Leave rejected successfully!');
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      alert('Failed to reject leave');
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await axios.delete(`/api/admin/leaves/${id}`);
      alert('Leave deleted successfully!');
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      alert('Failed to delete leave');
    }
  };

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
    let dept = (employee.department || 'Unassigned').trim();
    const lowerDept = dept.toLowerCase();
    
    if (lowerDept === 'opertion & it' || lowerDept === 'operation & it' || lowerDept === 'operations & it') {
      dept = 'Operations & IT';
    } else if (lowerDept === 'operation' || lowerDept === 'operations') {
      dept = 'Operations';
    } else if (lowerDept === 'hr') {
      dept = 'HR';
    } else if (lowerDept === 'it') {
      dept = 'IT';
    } else if (lowerDept === 'back office' || lowerDept === 'backoffice') {
      dept = 'Back Office';
    } else {
      dept = dept.charAt(0).toUpperCase() + dept.slice(1);
    }

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

  const activeEmployees = employees.filter(emp => emp.role === 'employee' && emp.isActive);

  // Monthly Summary Calculation
  const getMonthlySummary = () => {
    if (!summaryMonth) return [];
    
    const [year, month] = summaryMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Get holidays for this month
    const monthHolidays = new Set();
    attendanceRecords.forEach(r => {
      if (r.status === 'Holiday') {
        const d = new Date(r.date);
        if (d.getFullYear() === year && d.getMonth() + 1 === month) {
          monthHolidays.add(d.toDateString());
        }
      }
    });

    const officialHolidaysCount = monthHolidays.size;
    const totalWorkingDays = daysInMonth - officialHolidaysCount;

    const summaryData = activeEmployees.map(emp => {
      let present = 0;
      let absent = 0;
      let onLeave = 0;
      let halfDays = 0;
      let empWorkingDays = 0;
      
      const today = new Date();
      today.setHours(0,0,0,0);

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dateStr = date.toDateString();
        
        const joiningTime = emp.joiningDate ? new Date(emp.joiningDate).setHours(0,0,0,0) : 0;
        
        // Exclude days before joining
        if (date.getTime() < joiningTime) {
            continue;
        }

        // Exclude official holidays from working days
        if (monthHolidays.has(dateStr)) continue;
        
        empWorkingDays++;

        const isOnLeave = leaves.some(l => {
          if (l.employee?._id !== emp._id || l.status !== 'Approved') return false;
          if (l.dates && l.dates.length > 0) return l.dates.some(dStr => new Date(dStr).setHours(0,0,0,0) === date.getTime());
          const start = new Date(l.fromDate).setHours(0,0,0,0);
          const end = new Date(l.toDate).setHours(23,59,59,999);
          const dTime = date.getTime();
          return dTime >= start && dTime <= end;
        });

        if (isOnLeave) {
          onLeave++;
          continue;
        }

        const record = attendanceRecords.find(r => 
          r.employee?._id === emp._id && 
          new Date(r.date).toDateString() === dateStr &&
          r.status !== 'Holiday' && r.adminStatus !== 'Rejected'
        );

        if (record) {
          if (record.status === 'Present') present++;
          else if (record.status === 'Half Day') halfDays++;
          else if (record.status === 'Absent') absent++;
        } else {
           if (date < today) {
               absent++;
           }
        }
      }
      
      return {
        employee: emp,
        present,
        absent,
        halfDays,
        onLeave,
        totalWorkingDays: empWorkingDays
      };
    });

    return summaryData.filter(item => 
      (filterEmployee === '' || item.employee.fullName.toLowerCase().includes(filterEmployee.toLowerCase())) &&
      (filterDepartment === '' || item.employee.department === filterDepartment)
    );
  };

  const monthlySummaryData = getMonthlySummary();

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
        <div className="card lg:col-span-2 !mb-0 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text-dark flex items-center gap-2">
              <CalendarDays size={20} className="text-primary" /> Monthly Attendance Summary
            </h3>
          </div>
          <p className="text-xs text-text-light mb-4">Shows calculation for Total Working Days (Total days in month - Official Holidays). Sundays are included in Working Days.</p>
          
          <div className="flex gap-4 mb-4 flex-wrap bg-gray-50/50 p-3 rounded-lg border border-gray-100">
            <div className="flex-1 min-w-[200px]">
              <input 
                type="text" 
                placeholder="Filter by Employee Name..." 
                className="form-control w-full bg-white text-sm"
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
              />
            </div>
            <div className="w-48">
              <select 
                className="form-control w-full bg-white text-sm"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                {[...new Set(employees.map(e => e.department).filter(Boolean))].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="w-48">
              <input 
                type="month" 
                className="form-control w-full bg-white text-sm"
                value={summaryMonth}
                onChange={(e) => setSummaryMonth(e.target.value)}
                title="Filter by Month"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="border-y border-gray-100">
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Employee</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase text-center">Total Working Days</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase text-center">Present</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase text-center">Absent</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase text-center">Half Day</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase text-center">Leave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlySummaryData.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-text-light">No records found for this month.</td></tr>
                ) : (
                  monthlySummaryData.map(item => (
                    <tr key={item.employee._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-bold text-text-dark">{item.employee.fullName}</p>
                        <p className="text-xs text-text-light">{item.employee.employeeId} · {item.employee.department}</p>
                      </td>
                      <td className="p-4 text-center font-bold text-text-dark">{item.totalWorkingDays}</td>
                      <td className="p-4 text-center font-bold text-green-600">{item.present}</td>
                      <td className="p-4 text-center font-bold text-red-600">{item.absent}</td>
                      <td className="p-4 text-center font-bold text-orange-500">{item.halfDays}</td>
                      <td className="p-4 text-center font-bold text-yellow-600">{item.onLeave}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card !mb-0">
          <h3 className="text-lg font-semibold mb-4">Department Distribution</h3>
          <div className="h-96 w-full flex items-center justify-center">
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="45%"
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
                  <Legend iconType="circle" layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-text-light text-sm">No department data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock size={20} className="text-orange-500" /> Recent Activities (Remote Punch-ins)
        </h3>
        {remoteRequests.length > 0 ? (
          <div className="space-y-4">
            {remoteRequests.slice(0, 5).map(req => (
              <div key={req._id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  <div>
                    <p className="text-sm font-semibold text-text-dark">{req.employee?.fullName} <span className="text-xs font-normal text-text-light">({req.employee?.employeeId})</span></p>
                    <p className="text-xs text-text-light mt-0.5">Requested to punch in from outside the office</p>
                    {req.punchInLocation && (
                       <p className="text-[10px] text-gray-500 mt-1 max-w-md truncate">📍 {req.punchInLocation.address || 'Unknown location'}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-text-dark">{new Date(req.punchIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  <Link to="/admin/attendance" className="text-xs text-blue-600 hover:underline mt-1 inline-block">Review Request</Link>
                </div>
              </div>
            ))}
            {remoteRequests.length > 5 && (
              <div className="text-center mt-2">
                <Link to="/admin/attendance" className="text-sm text-primary hover:underline">View all {remoteRequests.length} requests</Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-text-light text-sm py-4 text-center">
            No recent remote punch-in requests found.
          </div>
        )}
      </div>

      {/* Pending Leave Requests Modal */}
      {showPendingLeaveModal && pendingLeaves.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">New Leave Requests</h2>
                  <p className="text-sm text-gray-500">You have {pendingLeaves.length} pending leave request(s).</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPendingLeaveModal(false)}
                className="p-2 hover:bg-orange-200 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              <div className="space-y-4">
                {pendingLeaves.map(leave => (
                  <div key={leave._id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800">{leave.employee?.fullName} <span className="text-xs font-normal text-gray-500">({leave.employee?.employeeId})</span></h4>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-semibold text-primary">{leave.leaveType}</span> • 
                        {leave.dates && leave.dates.length > 0 ? (
                          <span className="ml-1">{leave.dates.length} day(s)</span>
                        ) : (
                          <span className="ml-1">{new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded italic">"{leave.reason}"</p>
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button 
                        onClick={() => handleApproveLeave(leave._id)}
                        className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded text-sm font-semibold transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRejectLeave(leave._id)}
                        className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded text-sm font-semibold transition-colors"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleDeleteLeave(leave._id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-sm font-semibold transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end bg-white rounded-b-xl">
              <button 
                onClick={() => setShowPendingLeaveModal(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
