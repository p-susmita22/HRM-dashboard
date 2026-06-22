import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import axios from 'axios';

const HelpPage = () => {
  const [activeTab, setActiveTab] = useState('leave');
  const [myLeaves, setMyLeaves] = useState([]);
  const [myRegularizations, setMyRegularizations] = useState([]);
  const [regDates, setRegDates] = useState([]);
  const [regCurrentDate, setRegCurrentDate] = useState(new Date());
  const [leaveDates, setLeaveDates] = useState([]);
  const [leaveCurrentDate, setLeaveCurrentDate] = useState(new Date());
  const [myResignation, setMyResignation] = useState(null);
  const [monthlyData, setMonthlyData] = useState({ attendances: [], leaves: [] });
  const [employeeData, setEmployeeData] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchMyLeaves();
    fetchMyRegularizations();
    fetchMyResignation();
  }, []);

  useEffect(() => {
    fetchMonthlyAttendance(regCurrentDate.getFullYear(), regCurrentDate.getMonth() + 1);
  }, [regCurrentDate]);

  const fetchMonthlyAttendance = async (year, month) => {
    try {
      const res = await axios.get(`/api/employee/attendance/monthly?year=${year}&month=${month}`);
      setMonthlyData(res.data);
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/employee/profile');
      setEmployeeData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyLeaves = async () => {
    try {
      const res = await axios.get('/api/employee/leaves');
      setMyLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      leaveType: formData.get('leaveType'),
      dates: leaveDates.join(','),
      reason: formData.get('reason')
    };
    
    try {
      await axios.post('/api/employee/leaves', data);
      e.target.reset();
      setLeaveDates([]);
      fetchMyLeaves();
    } catch (err) {
      alert('Failed to apply leave');
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await axios.delete(`/api/employee/leaves/${id}`);
      fetchMyLeaves();
    } catch (err) {
      alert('Failed to delete leave');
    }
  };

  const fetchMyRegularizations = async () => {
    try {
      const res = await axios.get('/api/employee/regularizations');
      setMyRegularizations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyRegularization = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      dates: regDates.join(','),
      reason: formData.get('reason')
    };
    
    try {
      await axios.post('/api/employee/regularizations', data);
      e.target.reset();
      setRegDates([]);
      fetchMyRegularizations();
    } catch (err) {
      alert('Failed to submit regularization');
    }
  };

  const handleDeleteRegularization = async (id) => {
    if (!window.confirm('Are you sure you want to delete this regularization request?')) return;
    try {
      await axios.delete(`/api/employee/regularizations/${id}`);
      fetchMyRegularizations();
    } catch (err) {
      alert('Failed to delete regularization');
    }
  };

  const fetchMyResignation = async () => {
    try {
      const res = await axios.get('/api/employee/resignation');
      setMyResignation(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyResignation = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const today = new Date();
    const lastWorkingDay = new Date(today);
    lastWorkingDay.setDate(lastWorkingDay.getDate() + 45);

    const data = {
      resignationDate: today,
      lastWorkingDay: lastWorkingDay,
      reason: formData.get('reason'),
      agreedToNoticePeriod: formData.get('notice') === 'on'
    };
    
    try {
      await axios.post('/api/employee/resignation', data);
      e.target.reset();
      fetchMyResignation();
      alert('Resignation request submitted successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit resignation request');
    }
  };

  const daysInRegMonth = eachDayOfInterval({
    start: startOfMonth(regCurrentDate),
    end: endOfMonth(regCurrentDate)
  });

  const realToday = new Date();

  const getAttendanceColor = (date) => {
    const isToday = date.getDate() === realToday.getDate() && 
                    date.getMonth() === realToday.getMonth() && 
                    date.getFullYear() === realToday.getFullYear();

    // Color Sundays as Holiday (Blue) FIRST
    if (date.getDay() === 0) return 'bg-status-holiday text-white border-2 border-status-holiday';

    const isOnLeave = monthlyData.leaves.some(leave => {
        if (leave.dates && leave.dates.length > 0) {
          return leave.dates.some(dStr => {
            const dDate = new Date(dStr).setHours(0,0,0,0);
            return date.getTime() === dDate;
          });
        }
        const start = new Date(leave.fromDate).setHours(0,0,0,0);
        const end = new Date(leave.toDate).setHours(23,59,59,999);
        const d = date.getTime();
        return d >= start && d <= end;
    });
    if (isOnLeave) return 'bg-status-absent text-white shadow-md font-bold';

    const record = monthlyData.attendances.find(a => {
        const aDate = new Date(a.date);
        return aDate.getDate() === date.getDate() && aDate.getMonth() === date.getMonth();
    });

    if (record && record.adminStatus === 'Approved') {
        if (record.status === 'Holiday') return 'bg-yellow-400 text-white shadow-md font-bold border-2 border-yellow-500';
        if (record.status === 'Leave Approved' || record.status === 'Leave') return 'bg-status-absent text-white shadow-md font-bold';
        if (record.status === 'Present') return 'bg-status-present text-white shadow-md font-bold';
        if (record.status === 'Half Day') {
            if (record.halfDayType === 'First Half Absent') {
                return 'bg-gradient-to-b from-status-absent to-status-present text-white shadow-md font-bold';
            } else if (record.halfDayType === 'Second Half Absent') {
                return 'bg-gradient-to-b from-status-present to-status-absent text-white shadow-md font-bold';
            }
            return 'bg-gradient-to-b from-status-present to-status-absent text-white shadow-md font-bold';
        }
        if (record.status === 'Absent') return 'bg-status-absent text-white shadow-md font-bold';
    }

    if (date > realToday && !isToday) return 'text-gray-300';
    if (date < realToday && !isToday) return 'bg-red-50 text-status-absent/60 border border-status-absent/20';
    
    return 'bg-gray-50 text-text-dark';
  };

  const getAttendanceStatus = (date) => {
    if (date.getDay() === 0) return 'Holiday';

    const isOnLeave = monthlyData.leaves.some(leave => {
        if (leave.dates && leave.dates.length > 0) {
          return leave.dates.some(dStr => {
            const dDate = new Date(dStr).setHours(0,0,0,0);
            return date.getTime() === dDate;
          });
        }
        const start = new Date(leave.fromDate).setHours(0,0,0,0);
        const end = new Date(leave.toDate).setHours(23,59,59,999);
        const d = date.getTime();
        return d >= start && d <= end;
    });
    if (isOnLeave) return 'Leave';

    const record = monthlyData.attendances.find(a => {
        const aDate = new Date(a.date);
        return aDate.getDate() === date.getDate() && aDate.getMonth() === date.getMonth();
    });
    if (record && record.adminStatus === 'Approved') {
        if (record.status === 'Holiday') return 'Holiday';
        if (record.status === 'Present') return 'Present';
    }
    return 'None';
  };

  const toggleRegDate = (date) => {
    const joiningDateObj = employeeData?.joiningDate ? new Date(employeeData.joiningDate) : null;
    if (joiningDateObj) joiningDateObj.setHours(0,0,0,0);
    if (joiningDateObj && date.getTime() < joiningDateObj.getTime()) return;

    const status = getAttendanceStatus(date);
    const isFuture = new Date(date).setHours(0,0,0,0) > new Date().setHours(0,0,0,0);
    
    if (status === 'Holiday' || status === 'Present' || (isFuture && status !== 'Leave')) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    if (regDates.includes(dateStr)) {
      setRegDates(regDates.filter(d => d !== dateStr));
    } else {
      setRegDates([...regDates, dateStr].sort());
    }
  };

  const daysInLeaveMonth = eachDayOfInterval({
    start: startOfMonth(leaveCurrentDate),
    end: endOfMonth(leaveCurrentDate)
  });

  const toggleLeaveDate = (date) => {
    const joiningDateObj = employeeData?.joiningDate ? new Date(employeeData.joiningDate) : null;
    if (joiningDateObj) joiningDateObj.setHours(0,0,0,0);
    if (joiningDateObj && date.getTime() < joiningDateObj.getTime()) return;

    const status = getAttendanceStatus(date);
    if (status === 'Holiday' || status === 'Present' || status === 'Leave') return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    if (leaveDates.includes(dateStr)) {
      setLeaveDates(leaveDates.filter(d => d !== dateStr));
    } else {
      setLeaveDates([...leaveDates, dateStr].sort());
    }
  };

  return (
    <div className="animate-fade-in p-5 max-w-4xl mx-auto">
      <h2 className="mt-5 mb-5 text-xl font-bold text-primary-dark">Help & Requests</h2>
      
      <div className="flex gap-2.5 mb-5 overflow-x-auto pb-2">
        <button 
          className={`btn ${activeTab === 'leave' ? 'btn-primary' : 'bg-white text-text-dark'}`}
          onClick={() => setActiveTab('leave')}
        >
          Leave
        </button>
        <button 
          className={`btn ${activeTab === 'regularize' ? 'btn-primary' : 'bg-white text-text-dark'}`}
          onClick={() => setActiveTab('regularize')}
        >
          Regularization
        </button>
        <button 
          className={`btn ${activeTab === 'resign' ? 'btn-primary' : 'bg-white text-text-dark'}`}
          onClick={() => setActiveTab('resign')}
        >
          Resignation
        </button>
      </div>

      <div className="card">
        {activeTab === 'leave' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form onSubmit={handleApplyLeave}>
              <h3 className="mb-4 text-lg font-semibold">Apply for Leave</h3>
              <div className="mb-4">
                <label className="block mb-1.5 font-medium text-sm">Leave Type</label>
                <select name="leaveType" className="form-control" required>
                  <option value="">Select Leave Type</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1.5 font-medium text-sm">Selected Dates ({leaveDates.length})</label>
                {leaveDates.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-2 p-3 bg-gray-50 border border-gray-100 rounded-lg max-h-[100px] overflow-y-auto">
                    {leaveDates.map(d => (
                      <span key={d} className="inline-flex items-center px-2 py-1 bg-white border border-primary/20 text-primary-dark text-xs font-semibold rounded-md shadow-sm">
                        {format(new Date(d), 'dd MMM yyyy')}
                        <button 
                          type="button" 
                          onClick={() => setLeaveDates(leaveDates.filter(date => date !== d))}
                          className="ml-1 text-primary hover:text-status-absent hover:bg-status-absent/10 rounded-full w-4 h-4 flex items-center justify-center transition-colors text-[10px]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary-dark mb-2">
                    Please select dates for leave from the calendar &#8594;
                  </div>
                )}
                <input 
                  type="hidden" 
                  value={leaveDates.join(',')} 
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1.5 font-medium text-sm">Reason</label>
                <textarea name="reason" className="form-control" rows="3" required></textarea>
              </div>
              <button 
                type="submit" 
                className={`btn w-full ${leaveDates.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'btn-primary'}`}
                disabled={leaveDates.length === 0}
              >
                Submit Request
              </button>
            </form>

            <div className="border border-gray-100 rounded-xl p-5 bg-bg-gray shadow-sm flex flex-col justify-center">
               <h4 className="font-semibold text-center mb-4 text-text-dark">Select Dates to Apply Leave</h4>
               <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                 <div className="flex items-center justify-between mb-4">
                   <button 
                     type="button" 
                     onClick={() => setLeaveCurrentDate(subMonths(leaveCurrentDate, 1))} 
                     disabled={employeeData?.joiningDate && (leaveCurrentDate.getFullYear() < new Date(employeeData.joiningDate).getFullYear() || (leaveCurrentDate.getFullYear() === new Date(employeeData.joiningDate).getFullYear() && leaveCurrentDate.getMonth() <= new Date(employeeData.joiningDate).getMonth()))}
                     className={`p-1.5 rounded-full transition-colors ${employeeData?.joiningDate && (leaveCurrentDate.getFullYear() < new Date(employeeData.joiningDate).getFullYear() || (leaveCurrentDate.getFullYear() === new Date(employeeData.joiningDate).getFullYear() && leaveCurrentDate.getMonth() <= new Date(employeeData.joiningDate).getMonth())) ? 'opacity-50 cursor-not-allowed text-gray-400' : 'hover:bg-gray-100'}`}
                   >&#8592;</button>
                   <span className="font-bold text-sm text-primary-dark">{format(leaveCurrentDate, 'MMMM yyyy')}</span>
                   <button type="button" onClick={() => setLeaveCurrentDate(addMonths(leaveCurrentDate, 1))} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">&#8594;</button>
                 </div>
                 
                 <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-2 font-bold text-text-light uppercase">
                   {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => <div key={i}>{d}</div>)}
                 </div>
                 
                 <div className="grid grid-cols-7 gap-1 text-sm">
                   {Array.from({ length: startOfMonth(leaveCurrentDate).getDay() }).map((_, i) => <div key={`el-${i}`} />)}
                   {daysInLeaveMonth.map(date => {
                     const dateStr = format(date, 'yyyy-MM-dd');
                     const isSelected = leaveDates.includes(dateStr);
                     
                     const status = getAttendanceStatus(date);
                     
                     const joiningDateObj = employeeData?.joiningDate ? new Date(employeeData.joiningDate) : null;
                     if (joiningDateObj) joiningDateObj.setHours(0,0,0,0);
                     const isBeforeJoining = joiningDateObj && date.getTime() < joiningDateObj.getTime();

                     const isDisabled = isBeforeJoining || status === 'Holiday' || status === 'Present' || status === 'Leave';
                     
                     const baseStyle = isBeforeJoining ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed' : getAttendanceColor(date);
                     
                     return (
                       <button
                         key={dateStr}
                         type="button"
                         disabled={isDisabled}
                         onClick={() => toggleLeaveDate(date)}
                         className={`w-9 h-9 rounded-full flex items-center justify-center transition-all mx-auto font-medium text-sm border border-transparent
                           ${isDisabled ? `cursor-not-allowed opacity-60 ${baseStyle}` : 
                             isSelected ? 'bg-primary text-white shadow-md scale-110 ring-2 ring-primary/30 ring-offset-1' : 
                             `${baseStyle} hover:ring-2 hover:ring-gray-300`}`}
                       >
                         {date.getDate()}
                       </button>
                     );
                   })}
                 </div>
                 
                 <div className="mt-4 flex gap-3 text-[10px] justify-center text-text-light font-medium uppercase">
                   <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary"></span> Selected</div>
                   <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-50 border border-gray-200"></span> Available</div>
                 </div>
               </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col max-h-[400px]">
              <h3 className="mb-4 text-lg font-semibold border-b border-gray-200 pb-2">Recent Leave Requests</h3>
              <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {myLeaves.length === 0 ? (
                  <p className="text-sm text-text-light text-center py-4">No leave requests found.</p>
                ) : myLeaves.map((leave) => (
                  <div key={leave._id} className="bg-white p-3.5 rounded-lg border border-gray-100 flex flex-col gap-2 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm text-text-dark">{leave.leaveType}</h4>
                        <div className="mt-0.5">
                          {leave.dates && leave.dates.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {leave.dates.map((d, i) => (
                                <span key={i} className="inline-block px-2 py-0.5 bg-primary/10 text-primary-dark rounded text-[10px] font-bold">
                                  {new Date(d).toLocaleDateString()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-text-light font-medium">
                              {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-wide ${
                        leave.status === 'Approved' ? 'bg-status-present/10 text-status-present' :
                        leave.status === 'Rejected' ? 'bg-status-absent/10 text-status-absent' :
                        'bg-yellow-500/10 text-yellow-600'
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                    {leave.status === 'Pending' && (
                      <div className="flex justify-end mt-2 pt-2 border-t border-gray-50">
                        <button 
                          type="button" 
                          onClick={() => handleDeleteLeave(leave._id)} 
                          className="text-[11px] text-red-500 hover:text-red-700 font-semibold px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded transition-colors flex items-center gap-1"
                        >
                          Delete Request
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'regularize' && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <form onSubmit={handleApplyRegularization} className="flex flex-col">
              <h3 className="mb-4 text-lg font-semibold">Attendance Regularization</h3>
              
              <div className="mb-4">
                <label className="block mb-1.5 font-medium text-sm text-text-dark">Selected Dates</label>
                {regDates.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {regDates.map(d => (
                      <span key={d} className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold border border-primary/20">
                        {format(new Date(d), 'dd MMM yyyy')}
                        <button 
                          type="button" 
                          onClick={() => setRegDates(regDates.filter(date => date !== d))}
                          className="ml-1 text-primary hover:text-status-absent hover:bg-status-absent/10 rounded-full w-4 h-4 flex items-center justify-center transition-colors text-[10px]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-status-absent/5 border border-status-absent/20 rounded-lg text-sm text-status-absent mb-2">
                    Please select missing/half-day dates from the calendar &#8594;
                  </div>
                )}
                <input 
                  type="hidden" 
                  value={regDates.join(',')} 
                  required 
                />
              </div>

              <div className="mb-4 flex-1">
                <label className="block mb-1.5 font-medium text-sm">Reason</label>
                <textarea name="reason" className="form-control h-32" placeholder="Explain why these dates should be regularized..." required></textarea>
              </div>
              
              <button 
                type="submit" 
                className={`btn w-full mt-auto ${regDates.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'btn-primary'}`}
                disabled={regDates.length === 0}
              >
                Submit Request
              </button>
            </form>

            <div className="border border-gray-100 rounded-xl p-5 bg-bg-gray shadow-sm flex flex-col justify-center">
               <h4 className="font-semibold text-center mb-4 text-text-dark">Select Dates to Regularize</h4>
               <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                 <div className="flex items-center justify-between mb-4">
                   <button 
                     type="button" 
                     onClick={() => setRegCurrentDate(subMonths(regCurrentDate, 1))} 
                     disabled={employeeData?.joiningDate && (regCurrentDate.getFullYear() < new Date(employeeData.joiningDate).getFullYear() || (regCurrentDate.getFullYear() === new Date(employeeData.joiningDate).getFullYear() && regCurrentDate.getMonth() <= new Date(employeeData.joiningDate).getMonth()))}
                     className={`p-1.5 rounded-full transition-colors ${employeeData?.joiningDate && (regCurrentDate.getFullYear() < new Date(employeeData.joiningDate).getFullYear() || (regCurrentDate.getFullYear() === new Date(employeeData.joiningDate).getFullYear() && regCurrentDate.getMonth() <= new Date(employeeData.joiningDate).getMonth())) ? 'opacity-50 cursor-not-allowed text-gray-400' : 'hover:bg-gray-100'}`}
                   >&#8592;</button>
                   <span className="font-bold text-sm text-primary-dark">{format(regCurrentDate, 'MMMM yyyy')}</span>
                   <button type="button" onClick={() => setRegCurrentDate(addMonths(regCurrentDate, 1))} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">&#8594;</button>
                 </div>
                 
                 <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-2 font-bold text-text-light uppercase">
                   {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => <div key={i}>{d}</div>)}
                 </div>
                 
                 <div className="grid grid-cols-7 gap-1 text-sm">
                   {Array.from({ length: startOfMonth(regCurrentDate).getDay() }).map((_, i) => <div key={`e-${i}`} />)}
                   {daysInRegMonth.map(date => {
                     const dateStr = format(date, 'yyyy-MM-dd');
                     const isSelected = regDates.includes(dateStr);
                     
                     // Prevent clicking dates in the future (unless it's a Leave date), or Holidays/Present dates
                     const isFuture = new Date(date).setHours(0,0,0,0) > new Date().setHours(0,0,0,0);
                     const status = getAttendanceStatus(date);

                     const joiningDateObj = employeeData?.joiningDate ? new Date(employeeData.joiningDate) : null;
                     if (joiningDateObj) joiningDateObj.setHours(0,0,0,0);
                     const isBeforeJoining = joiningDateObj && date.getTime() < joiningDateObj.getTime();

                     const isDisabled = isBeforeJoining || status === 'Holiday' || status === 'Present' || (isFuture && status !== 'Leave');
                     
                     const baseStyle = isBeforeJoining ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed' : getAttendanceColor(date);
                     
                     return (
                       <button
                         key={dateStr}
                         type="button"
                         disabled={isDisabled}
                         onClick={() => toggleRegDate(date)}
                         className={`w-9 h-9 rounded-full flex items-center justify-center transition-all mx-auto font-medium text-sm border border-transparent
                           ${isDisabled ? `cursor-not-allowed opacity-60 ${baseStyle}` : 
                             isSelected ? 'bg-primary text-white shadow-md scale-110 ring-2 ring-primary/30 ring-offset-1' : 
                             `${baseStyle} hover:ring-2 hover:ring-gray-300`}`}
                       >
                         {date.getDate()}
                       </button>
                     );
                   })}
                 </div>
               </div>
                 <p className="text-xs text-text-light mt-4 text-center leading-relaxed">
                   You can click multiple dates if you need to regularize attendance for several days at once.
                 </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold border-b border-gray-200 pb-2">Recent Regularization Requests</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myRegularizations.length === 0 ? (
                  <p className="text-sm text-text-light py-2 col-span-full">No regularization requests found.</p>
                ) : myRegularizations.map((reg) => (
                  <div key={reg._id} className="bg-white p-3.5 rounded-lg border border-gray-100 flex flex-col gap-2 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        {reg.dates && reg.dates.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {reg.dates.map((dateStr, idx) => {
                              const d = new Date(dateStr);
                              return (
                                <span key={idx} className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded font-bold text-xs whitespace-nowrap">
                                  {d.getDate().toString().padStart(2, '0')} {format(d, 'MMM yyyy')}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mb-2">
                            <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded font-bold text-xs whitespace-nowrap">
                              {format(new Date(reg.fromDate), 'dd MMM yyyy')}
                            </span>
                          </div>
                        )}
                        <p className="text-[11px] text-text-light font-medium mt-0.5 max-w-[150px] truncate" title={reg.reason}>
                          {reg.reason}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-wide ${
                        reg.status === 'Approved' ? 'bg-status-present/10 text-status-present' :
                        reg.status === 'Rejected' ? 'bg-status-absent/10 text-status-absent' :
                        'bg-yellow-500/10 text-yellow-600'
                      }`}>
                        {reg.status}
                      </span>
                    </div>
                    {reg.status === 'Pending' && (
                      <div className="flex justify-end mt-2 pt-2 border-t border-gray-50">
                        <button 
                          type="button" 
                          onClick={() => handleDeleteRegularization(reg._id)} 
                          className="text-[11px] text-red-500 hover:text-red-700 font-semibold px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded transition-colors flex items-center gap-1"
                        >
                          Delete Request
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resign' && (
          <div>
            {myResignation ? (
              <div className="card max-w-2xl mx-auto border-t-4 border-status-absent">
                <h3 className="mb-4 text-xl font-bold text-text-dark text-center border-b border-gray-100 pb-4">My Resignation Status</h3>
                
                <div className="space-y-5 p-2">
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                    <span className="text-sm font-semibold text-text-light">Current Status</span>
                    <span className={`px-4 py-1.5 rounded-full font-bold text-sm shadow-sm ${
                      myResignation.status === 'Approved' ? 'bg-status-present/20 text-status-present border border-status-present/30' :
                      myResignation.status === 'Rejected' ? 'bg-status-absent/20 text-status-absent border border-status-absent/30' :
                      'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                    }`}>
                      {myResignation.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                      <span className="block text-xs font-semibold text-text-light mb-1 uppercase tracking-wider">Applied On</span>
                      <span className="text-base font-bold text-text-dark">{format(new Date(myResignation.resignationDate), 'dd MMM yyyy')}</span>
                    </div>
                    <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                      <span className="block text-xs font-semibold text-text-light mb-1 uppercase tracking-wider">Last Working Day</span>
                      <span className="text-base font-bold text-status-absent">{format(new Date(myResignation.lastWorkingDay), 'dd MMM yyyy')}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                    <span className="block text-xs font-semibold text-text-light mb-2 uppercase tracking-wider">Reason</span>
                    <p className="text-sm text-text-dark leading-relaxed">{myResignation.reason}</p>
                  </div>

                  {myResignation.status === 'Approved' && (
                    <div className="bg-status-present/10 p-4 rounded-lg mt-4 border border-status-present/20 text-sm text-status-present font-medium flex items-start gap-2">
                      <span>✓</span>
                      <span>Your resignation has been formally accepted by the administration. Please ensure a smooth handover of your responsibilities before your last working day.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplyResignation} className="card max-w-2xl mx-auto">
                <h3 className="mb-4 text-xl font-bold text-status-absent border-b border-gray-100 pb-3">Resignation Request</h3>
                <div className="bg-status-absent/10 p-4 rounded-lg mb-6 text-sm text-status-absent border border-status-absent/20">
                  <strong>IMPORTANT:</strong> You must serve a mandatory 45 Days Notice Period before final resignation approval.
                </div>
                
                <div className="mb-5">
                  <label className="block mb-2 font-semibold text-sm text-text-dark">Resignation Date (Today)</label>
                  <input 
                    type="date" 
                    className="form-control bg-gray-50 text-gray-500 cursor-not-allowed font-medium" 
                    value={new Date().toISOString().split('T')[0]} 
                    readOnly 
                  />
                  <p className="text-xs text-text-light mt-1.5 ml-1">The date is automatically set to today's date.</p>
                </div>
                
                <div className="mb-5">
                  <label className="block mb-2 font-semibold text-sm text-text-dark">Reason for Resignation</label>
                  <textarea 
                    name="reason"
                    className="form-control" 
                    rows="4" 
                    placeholder="Please specify your reason for leaving..."
                    required
                  ></textarea>
                </div>
                
                <div className="mb-6 flex items-start gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <input type="checkbox" id="notice" name="notice" required className="w-5 h-5 accent-status-absent mt-0.5 cursor-pointer" />
                  <label htmlFor="notice" className="font-medium text-sm text-text-dark cursor-pointer leading-relaxed">
                    I acknowledge and agree to serve the mandatory 45 days notice period. I understand that my last working day will be calculated automatically.
                  </label>
                </div>
                
                <button type="submit" className="btn btn-danger w-full py-2.5 text-base font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                  Submit Resignation
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpPage;
