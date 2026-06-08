import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import axios from 'axios';

const HelpPage = () => {
  const [activeTab, setActiveTab] = useState('leave');
  const [myLeaves, setMyLeaves] = useState([]);

  useEffect(() => {
    fetchMyLeaves();
  }, []);

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
      fromDate: formData.get('fromDate'),
      toDate: formData.get('toDate'),
      reason: formData.get('reason')
    };
    
    try {
      await axios.post('/api/employee/leaves', data);
      e.target.reset();
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

  
  // Regularization state
  const [regDates, setRegDates] = useState([]);
  const [regCurrentDate, setRegCurrentDate] = useState(new Date());

  const daysInRegMonth = eachDayOfInterval({
    start: startOfMonth(regCurrentDate),
    end: endOfMonth(regCurrentDate)
  });

  const realToday = new Date();

  const getAttendanceColor = (date) => {
    // Sundays are Holidays
    if (date.getDay() === 0) return 'bg-status-holiday text-white';
    
    const isToday = date.getDate() === realToday.getDate() && 
                    date.getMonth() === realToday.getMonth() && 
                    date.getFullYear() === realToday.getFullYear();
                    
    // Future dates
    if (date > realToday && !isToday) return 'text-gray-300';
    
    // Past dates default (Will be replaced with actual DB data later)
    return 'bg-gray-50 text-text-dark';
  };

  const toggleRegDate = (date) => {
    // Prevent selecting future dates or Sundays(Holidays)
    if (date > new Date() || date.getDay() === 0) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    if (regDates.includes(dateStr)) {
      setRegDates(regDates.filter(d => d !== dateStr));
    } else {
      setRegDates([...regDates, dateStr].sort());
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
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block mb-1.5 font-medium text-sm">From Date</label>
                  <input type="date" name="fromDate" className="form-control" required />
                </div>
                <div className="flex-1">
                  <label className="block mb-1.5 font-medium text-sm">To Date</label>
                  <input type="date" name="toDate" className="form-control" required />
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-1.5 font-medium text-sm">Reason</label>
                <textarea name="reason" className="form-control" rows="3" required></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-full">Submit Request</button>
            </form>

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
                        <p className="text-[11px] text-text-light font-medium mt-0.5">
                          {format(new Date(leave.fromDate), 'dd MMM yyyy')} - {format(new Date(leave.toDate), 'dd MMM yyyy')}
                        </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={(e) => { e.preventDefault(); alert('Regularization Request Submitted for selected dates'); setRegDates([]); e.target.reset(); }} className="flex flex-col">
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

              <div className="mb-4">
                <label className="block mb-1.5 font-medium text-sm">Attendance Type</label>
                <select className="form-control" required>
                  <option value="">Select Type</option>
                  <option value="Absent to Present">Absent to Present</option>
                  <option value="Half Day to Present">Half Day to Present</option>
                </select>
              </div>
              
              <div className="mb-4 flex-1">
                <label className="block mb-1.5 font-medium text-sm">Reason</label>
                <textarea className="form-control h-32" placeholder="Explain why these dates should be regularized..." required></textarea>
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
                   <button type="button" onClick={() => setRegCurrentDate(subMonths(regCurrentDate, 1))} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">&#8592;</button>
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
                     
                     // Prevent clicking dates in the future
                     const isFuture = new Date(date).setHours(0,0,0,0) > new Date().setHours(0,0,0,0);
                     const isSunday = date.getDay() === 0;
                     const isDisabled = isFuture || isSunday;
                     
                     const baseStyle = getAttendanceColor(date);
                     
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
        )}

        {activeTab === 'resign' && (
          <form onSubmit={(e) => { e.preventDefault(); alert('Resignation Request Submitted'); e.target.reset(); }}>
            <h3 className="mb-4 text-lg font-semibold text-status-absent">Resignation Request</h3>
            <div className="bg-status-absent/10 p-4 rounded-lg mb-4 text-sm text-status-absent">
              <strong>IMPORTANT:</strong> You must serve a mandatory 45 Days Notice Period before final resignation approval.
            </div>
            <div className="mb-4">
              <label className="block mb-1.5 font-medium text-sm">Resignation Date</label>
              <input type="date" className="form-control" required />
            </div>
            <div className="mb-4">
              <label className="block mb-1.5 font-medium text-sm">Reason for Resignation</label>
              <textarea className="form-control" rows="3" required></textarea>
            </div>
            <div className="mb-4 flex items-center gap-2.5">
              <input type="checkbox" id="notice" required className="w-4 h-4 accent-status-absent" />
              <label htmlFor="notice" className="font-normal m-0 text-sm">I agree to serve the 45 days notice period.</label>
            </div>
            <button type="submit" className="btn btn-danger w-full">Submit Resignation</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default HelpPage;
