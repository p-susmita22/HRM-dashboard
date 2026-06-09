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
  const [monthlyData, setMonthlyData] = useState({ attendances: [], leaves: [] });
  const [summary, setSummary] = useState({ present: 0, absent: 0, halfDays: 0, onLeave: 0, holidays: 0 });
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

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const res = await axios.get(`/api/employee/attendance/monthly?year=${year}&month=${month}`);
        setMonthlyData(res.data);
      } catch (err) {
        console.error('Error fetching monthly data', err);
      }
    };
    fetchMonthlyData();
  }, [currentDate]);

  useEffect(() => {
    // Calculate summary
    let present = 0;
    let absent = 0;
    let halfDays = 0;
    let onLeave = 0;
    let holidays = 0;

    const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
    const realToday = new Date();

    days.forEach(date => {
      if (date.getDay() === 0) {
        holidays++;
        return;
      }
      
      const isOnLeave = monthlyData.leaves.some(leave => {
        const start = new Date(leave.fromDate).setHours(0,0,0,0);
        const end = new Date(leave.toDate).setHours(23,59,59,999);
        const d = date.getTime();
        return d >= start && d <= end;
      });

      if (isOnLeave) {
        onLeave++;
        return;
      }

      const record = monthlyData.attendances.find(a => {
        const aDate = new Date(a.date);
        return aDate.getDate() === date.getDate() && aDate.getMonth() === date.getMonth();
      });

      if (record && record.adminStatus === 'Approved') {
        if (record.status === 'Present') present++;
        else if (record.status === 'Half Day') halfDays++;
        else if (record.status === 'Absent') absent++;
        else if (record.status === 'Holiday') holidays++;
        else if (record.status === 'Leave Approved') onLeave++;
      } else {
        const isToday = date.getDate() === realToday.getDate() && date.getMonth() === realToday.getMonth() && date.getFullYear() === realToday.getFullYear();
        if (isToday && punchedIn) {
          present++;
        } else if (date < realToday && !isToday) {
          // Unmarked past date
          absent++;
        }
      }
    });

    setSummary({ present, absent, halfDays, onLeave, holidays });
  }, [monthlyData, currentDate, punchedIn]);

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
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
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
    if (date.getDay() === 0) return 'bg-status-holiday text-white border-2 border-status-holiday';

    const isOnLeave = monthlyData.leaves.some(leave => {
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
            return 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-white shadow-md font-bold'; // Fallback Half Day color
        }
        if (record.status === 'Absent') return 'bg-status-absent text-white shadow-md font-bold';
    }

    if (isToday && punchedIn) return 'bg-status-present/80 text-white shadow-sm ring-2 ring-status-present ring-offset-2';

    // If the date is in the future
    if (date > realToday && !isToday) return 'bg-gray-100 text-text-light'; 
    
    // Default empty status for past dates (unmarked)
    if (date < realToday && !isToday) return 'bg-red-50 text-status-absent/60 border border-status-absent/20'; // Indicating missing punch
    
    return 'bg-gray-50 text-text-light';
  };

  const getDayTooltip = (date) => {
    if (date > realToday) return 'Future Date';

    const isToday = date.getDate() === realToday.getDate() && 
                    date.getMonth() === realToday.getMonth() && 
                    date.getFullYear() === realToday.getFullYear();

    const record = monthlyData.attendances.find(a => {
        const aDate = new Date(a.date);
        return aDate.getDate() === date.getDate() && aDate.getMonth() === date.getMonth();
    });

    const formatT = (t) => t ? format(new Date(t), 'hh:mm a') : '--:--';

    if (record && record.adminStatus === 'Approved') {
      const punchDetails = `(In: ${formatT(record.punchIn)} | Out: ${formatT(record.punchOut)})`;
      if (record.status === 'Holiday') return 'Official Holiday';
      if (record.status === 'Leave' || record.status === 'Leave Approved') return 'On Leave';
      if (record.status === 'Present') return `Present ${punchDetails}`;
      if (record.status === 'Half Day') return `Half Day ${punchDetails}`;
      if (record.status === 'Absent') return `Absent ${punchDetails}`;
    }

    if (isToday && punchedIn) return `Working (In: ${format(punchTime, 'hh:mm a')})`;

    const isOnLeave = monthlyData.leaves.some(leave => {
        const start = new Date(leave.fromDate).setHours(0,0,0,0);
        const end = new Date(leave.toDate).setHours(23,59,59,999);
        const d = date.getTime();
        return d >= start && d <= end;
    });
    if (isOnLeave) return 'On Leave';

    if (date.getDay() === 0) return 'Sunday (Holiday)';

    if (date < realToday && !isToday) return 'Absent (No punches)';

    return 'Pending';
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
          <div className="bg-white rounded-lg shadow-sm border border-green-100 mb-6 p-3 flex justify-between items-center max-w-lg mx-auto bg-green-50/30">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-status-present animate-pulse"></div>
              <span className="text-sm font-semibold text-text-dark">Current Working Status</span>
            </div>
            <div className="text-right">
              <span className="text-status-present font-bold text-sm mr-2">{format(new Date(), 'hh:mm a')}</span>
              <span className="text-xs text-text-light">(In at {format(punchTime, 'hh:mm a')})</span>
            </div>
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
                  <div title={getDayTooltip(date)} className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium shadow-sm transition-transform hover:scale-110 cursor-help ${getDayStatus(date)}`}>
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
                  <div className="w-4 h-4 rounded-full bg-status-absent shadow-sm"></div> Absent / Leave
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-status-holiday shadow-sm"></div> Sundays
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-sm"></div> Official Holidays
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
                <span className="font-bold text-lg text-status-present">{summary.present}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-status-absent/5 rounded-lg border border-status-absent/20">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-absent"></div> Absent
                </span>
                <span className="font-bold text-lg text-status-absent">{summary.absent}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-sm bg-gradient-to-b from-yellow-400 to-yellow-500"></div> Half Days
                </span>
                <span className="font-bold text-lg text-yellow-600">{summary.halfDays}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div> On Leave
                </span>
                <span className="font-bold text-lg text-red-500">{summary.onLeave}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-status-holiday/5 rounded-lg border border-status-holiday/20">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-holiday"></div> Holidays (Off Days)
                </span>
                <span className="font-bold text-lg text-status-holiday">{summary.holidays}</span>
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
