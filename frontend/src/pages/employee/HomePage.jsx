import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/multimaart-logo.png';

const HomePage = () => {
  const [punchedIn, setPunchedIn] = useState(false);
  const [punchTime, setPunchTime] = useState(null);
  const [punchOutTime, setPunchOutTime] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employeeData, setEmployeeData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileAndAttendance = async () => {
      try {
        const [profileRes, attendanceRes] = await Promise.all([
          axios.get('/api/employee/profile'),
          axios.get('/api/employee/attendance/today')
        ]);
        
        setEmployeeData(profileRes.data);
        
        if (attendanceRes.data) {
          if (attendanceRes.data.punchIn) {
            setPunchedIn(true);
            setPunchTime(new Date(attendanceRes.data.punchIn));
          }
          if (attendanceRes.data.punchOut) {
            setPunchedIn(false);
            setPunchOutTime(new Date(attendanceRes.data.punchOut));
          }
        }
      } catch (err) {
        console.error('Error fetching data', err);
      }
    };
    fetchProfileAndAttendance();
  }, []);

  const handlePunchIn = async () => {
    try {
      const res = await axios.post('/api/employee/punch-in');
      setPunchedIn(true);
      setPunchTime(new Date(res.data.punchIn));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to punch in');
    }
  };

  const handlePunchOut = async () => {
    try {
      const res = await axios.post('/api/employee/punch-out');
      setPunchedIn(false);
      setPunchOutTime(new Date(res.data.punchOut));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to punch out');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  const realToday = new Date();
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getDayStatus = (date) => {
    const isToday = date.getDate() === realToday.getDate() && 
                    date.getMonth() === realToday.getMonth() && 
                    date.getFullYear() === realToday.getFullYear();
                    
    // Color Sundays as Holiday (Blue) FIRST
    if (date.getDay() === 0) return 'bg-status-holiday text-white';
    
    if (isToday && punchedIn) return 'bg-status-present text-white';

    // If the date is in the future
    if (date > realToday && !isToday) return 'bg-gray-100 text-text-light'; 
    
    // Default empty status until data is loaded
    return 'bg-gray-50 text-text-light';
  };

  return (
    <div className="animate-fade-in pb-10">
      {/* Header with Punch In/Out Top Right */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Multimaart HR" className="w-auto h-10 object-contain" />
          <div>
            <h2 className="text-lg font-bold text-primary-dark leading-tight">Multimaart HR</h2>
            <div className="relative">
              <p 
                className="text-sm text-text-light cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                onClick={() => setShowLogout(!showLogout)}
              >
                {employeeData ? `${employeeData.fullName} (${employeeData.employeeId})` : 'Loading...'}
                <span className="text-[10px]">▼</span>
              </p>
              {showLogout && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-100 shadow-lg rounded-lg p-1.5 z-50 min-w-[120px]">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left text-status-absent text-sm font-semibold px-3 py-2 hover:bg-status-absent/10 rounded transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-text-light font-medium">Office Time</p>
            <p className="text-sm font-bold text-text-dark">9:30 AM - 5:30 PM</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-center">
              <button 
                className={`btn !py-2 !px-4 text-sm shadow-md mb-1 ${!punchedIn && !punchTime ? 'btn-primary' : 'bg-gray-200 text-text-light cursor-not-allowed'}`}
                onClick={handlePunchIn}
                disabled={punchTime !== null}
              >
                Punch In
              </button>
              <div className="text-xs font-bold text-text-dark">
                {punchTime ? format(punchTime, 'hh:mm a') : '--:--'}
              </div>
            </div>
            
            <div className="text-center">
              <button 
                className={`btn !py-2 !px-4 text-sm shadow-md mb-1 ${punchedIn ? 'btn-danger' : 'bg-gray-200 text-text-light cursor-not-allowed'}`}
                onClick={handlePunchOut}
                disabled={!punchedIn}
              >
                Punch Out
              </button>
              <div className="text-xs font-bold text-text-dark">
                {punchOutTime ? format(punchOutTime, 'hh:mm a') : '--:--'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 max-w-6xl mx-auto mt-4">
        {punchedIn && (
          <div className="card mb-6 text-center border-l-4 border-status-present">
            <h3 className="text-text-light mb-1 text-sm">Current Working Status</h3>
            <p className="text-primary text-2xl font-bold mb-1">{format(new Date(), 'hh:mm a')}</p>
            <p className="text-xs text-text-light">Punched in at {format(punchTime, 'hh:mm a')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side: Calendar */}
          <div className="lg:col-span-2 card shadow-lg border-t-4 border-primary !mb-0">
            <h3 className="mb-4 text-xl font-bold text-center text-text-dark">Attendance Calendar</h3>
            <div className="flex items-center justify-between mb-6 px-4 bg-gray-50 p-2 rounded-lg">
              <button 
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="btn !bg-white hover:!bg-gray-200 text-text-dark !p-2 !rounded-full shadow-sm"
                title="Previous Month"
              >
                &#8592;
              </button>
              <h4 className="text-center text-text-dark font-bold text-base">
                {format(currentDate, 'MMMM yyyy')}
              </h4>
              <button 
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="btn !bg-white hover:!bg-gray-200 text-text-dark !p-2 !rounded-full shadow-sm"
                title="Next Month"
              >
                &#8594;
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-3 mt-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className={`text-center font-bold text-xs uppercase tracking-wider ${d === 'Sun' ? 'text-status-holiday' : 'text-text-light'}`}>
                  {d}
                </div>
              ))}
              
              {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {daysInMonth.map((date) => (
                <div key={date.toISOString()} className="flex justify-center">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium shadow-sm transition-transform hover:scale-110 ${getDayStatus(date)}`}>
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold mb-3 text-text-dark">Legend:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13px] font-medium text-text-dark">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-status-present shadow-sm"></div> Present
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-status-absent shadow-sm"></div> Absent
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-status-holiday shadow-sm"></div> Holidays (Sunday)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-status-leave shadow-sm"></div> Leave
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full shadow-sm bg-gradient-to-b from-status-absent to-status-present"></div> Half Day (1st Half Absent)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full shadow-sm bg-gradient-to-b from-status-present to-status-absent"></div> Half Day (2nd Half Absent)
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-bg-gray rounded-lg text-xs text-text-light leading-relaxed">
                <strong>Rules:</strong> If an employee punches in after 10:00 AM or punches out before 5:15 PM, today's attendance will be marked as a Half Day.
              </div>
            </div>
          </div>

          {/* Right Side: Monthly Summary */}
          <div className="card shadow-lg border-t-4 border-accent !mb-0 h-fit">
            <h3 className="mb-4 text-lg font-bold text-text-dark border-b border-gray-100 pb-3">Monthly Details</h3>
            <h4 className="text-text-light mb-5 font-medium text-sm">
              {format(currentDate, 'MMMM yyyy')} Summary
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-status-present/5 rounded-lg border border-status-present/20">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-present"></div> Present
                </span>
                <span className="font-bold text-status-present text-lg">0</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-status-absent/5 rounded-lg border border-status-absent/20">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-absent"></div> Absent
                </span>
                <span className="font-bold text-status-absent text-lg">0</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-status-absent/10 to-status-present/10 rounded-lg border border-gray-200">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-b from-status-present to-status-absent"></div> Half Days
                </span>
                <span className="font-bold text-text-dark text-lg">0</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-status-leave/5 rounded-lg border border-status-leave/20">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-leave"></div> On Leave
                </span>
                <span className="font-bold text-status-leave text-lg">0</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-status-holiday/5 rounded-lg border border-status-holiday/20">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-holiday"></div> Holidays (Off Days)
                </span>
                <span className="font-bold text-status-holiday text-lg">0</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-text-light">
                Summary updates automatically as you punch in and out daily.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default HomePage;
