import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';

const HelpPage = () => {
  const [activeTab, setActiveTab] = useState('leave');
  
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
          <form onSubmit={(e) => { e.preventDefault(); alert('Leave Request Submitted'); e.target.reset(); }}>
            <h3 className="mb-4 text-lg font-semibold">Apply for Leave</h3>
            <div className="mb-4">
              <label className="block mb-1.5 font-medium text-sm">Leave Type</label>
              <select className="form-control" required>
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
                <input type="date" className="form-control" required />
              </div>
              <div className="flex-1">
                <label className="block mb-1.5 font-medium text-sm">To Date</label>
                <input type="date" className="form-control" required />
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1.5 font-medium text-sm">Reason</label>
              <textarea className="form-control" rows="3" required></textarea>
            </div>
            <button type="submit" className="btn btn-primary w-full">Submit Request</button>
          </form>
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
