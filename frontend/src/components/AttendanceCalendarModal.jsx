import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, CalendarDays, Download } from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import html2pdf from 'html2pdf.js';

const AttendanceCalendarModal = ({ employee, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState({ attendances: [], leaves: [] });
  const [loading, setLoading] = useState(true);
  const [selectedPunchDetails, setSelectedPunchDetails] = useState(null);
  const calendarRef = useRef(null);
  
  const realToday = new Date();

  useEffect(() => {
    fetchMonthlyData();
  }, [currentDate]);

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await axios.get(`/api/admin/employees/${employee._id}/attendance/monthly?year=${year}&month=${month}`);
      setMonthlyData(res.data);
    } catch (error) {
      console.error('Error fetching monthly data', error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getDayStatus = (date) => {
    const joiningDateObj = employee?.joiningDate ? new Date(employee.joiningDate) : null;
    if (joiningDateObj) joiningDateObj.setHours(0,0,0,0);
    if (joiningDateObj && date.getTime() < joiningDateObj.getTime()) return 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed';

    const isToday = date.getDate() === realToday.getDate() && 
                    date.getMonth() === realToday.getMonth() && 
                    date.getFullYear() === realToday.getFullYear();
                    
    // Color Sundays as Holiday (Blue) FIRST
    if (date.getDay() === 0) return 'bg-status-holiday text-white border-2 border-status-holiday';

    const isOnLeave = monthlyData.leaves.some(leave => {
        if (leave.dates && leave.dates.length > 0) {
          return leave.dates.some(dStr => new Date(dStr).setHours(0,0,0,0) === date.getTime());
        }
        const start = new Date(leave.fromDate).setHours(0,0,0,0);
        const end = new Date(leave.toDate).setHours(23,59,59,999);
        const d = date.getTime();
        return d >= start && d <= end;
    });
    if (isOnLeave) return 'bg-yellow-400 text-white shadow-md font-bold';

    const record = monthlyData.attendances.find(a => {
        const aDate = new Date(a.date);
        return aDate.getDate() === date.getDate() && aDate.getMonth() === date.getMonth();
    });

    if (record && record.adminStatus === 'Approved') {
        if (record.status === 'Holiday') return 'bg-[#1E3A8A] text-white shadow-md font-bold border-2 border-[#1E3A8A]';
        if (record.status === 'Leave Approved' || record.status === 'Leave') return 'bg-yellow-400 text-white shadow-md font-bold';
        if (record.status === 'Present') return 'bg-status-present text-white shadow-md font-bold';
        if (record.status === 'Half Day') {
            if (record.halfDayType === 'First Half Absent') {
                return 'bg-gradient-to-b from-status-absent to-status-present text-white shadow-md font-bold';
            } else if (record.halfDayType === 'Second Half Absent') {
                return 'bg-gradient-to-b from-status-present to-status-absent text-white shadow-md font-bold';
            }
            return 'bg-gradient-to-b from-status-present to-status-absent text-white shadow-md font-bold'; // Fallback Half Day color
        }
        if (record.status === 'Absent') return 'bg-status-absent text-white shadow-md font-bold';
    }


    // If the date is in the future
    if (date > realToday && !isToday) return 'bg-gray-100 text-text-light'; 
    
    // Default empty status for past dates (unmarked)
    if (date < realToday && !isToday) return 'bg-red-50 text-status-absent/60 border border-status-absent/20'; // Indicating missing punch
    
    return 'bg-gray-50 text-text-light';
  };

  const getDayTooltip = (date) => {
    const joiningDateObj = employee?.joiningDate ? new Date(employee.joiningDate) : null;
    if (joiningDateObj) joiningDateObj.setHours(0,0,0,0);
    if (joiningDateObj && date.getTime() < joiningDateObj.getTime()) return 'Not Joined Yet';

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
      if (record.status === 'Present') return `Full Day ${punchDetails}`;
      if (record.status === 'Half Day') return `Half Day ${punchDetails}`;
      if (record.status === 'Absent') return `Absent ${punchDetails}`;
    }

    if (isToday && record && record.punchIn) return `Working (In: ${formatT(record.punchIn)})`;

    const isOnLeave = monthlyData.leaves.some(leave => {
        if (leave.dates && leave.dates.length > 0) {
          return leave.dates.some(dStr => new Date(dStr).setHours(0,0,0,0) === date.getTime());
        }
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

  const handleDateClick = (date, record) => {
    if (!record || !record.punchIn) return; // Only show if there's actual attendance data
    
    const formatT = (t) => t ? format(new Date(t), 'hh:mm a') : '--:--';
    let totalHours = '--';
    
    if (record.punchIn && record.punchOut) {
      const diffMs = new Date(record.punchOut) - new Date(record.punchIn);
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      totalHours = `${hours}h ${minutes}m`;
    }

    setSelectedPunchDetails({
      date: format(date, 'MMM dd, yyyy'),
      punchIn: formatT(record.punchIn),
      punchOut: formatT(record.punchOut),
      totalHours,
      status: record.status || 'Present'
    });
  };

  const downloadPDF = () => {
    if (!calendarRef.current) return;
    const opt = {
      margin: 10,
      filename: `${employee.fullName}_Attendance_${format(currentDate, 'MMM_yyyy')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(calendarRef.current).save();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-100 bg-gray-50 rounded-t-xl shrink-0">
          <h2 className="text-xl font-bold text-text-dark flex items-center gap-2">
            <CalendarDays size={20} className="text-primary" /> 
            {employee.fullName}'s Attendance
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-status-absent transition-colors p-1">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                disabled={employee?.joiningDate && (currentDate.getFullYear() < new Date(employee.joiningDate).getFullYear() || (currentDate.getFullYear() === new Date(employee.joiningDate).getFullYear() && currentDate.getMonth() <= new Date(employee.joiningDate).getMonth()))}
                className={`btn !bg-gray-100 !p-2 !rounded-full shadow-sm ${employee?.joiningDate && (currentDate.getFullYear() < new Date(employee.joiningDate).getFullYear() || (currentDate.getFullYear() === new Date(employee.joiningDate).getFullYear() && currentDate.getMonth() <= new Date(employee.joiningDate).getMonth())) ? 'opacity-50 cursor-not-allowed text-gray-400' : 'hover:!bg-gray-200 text-text-dark'}`}
              >
                &#8592;
              </button>
              <h4 className="text-center text-text-dark font-bold text-lg w-40">
                {format(currentDate, 'MMMM yyyy')}
              </h4>
              <button 
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                disabled={currentDate >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
                className={`btn !bg-gray-100 text-text-dark !p-2 !rounded-full shadow-sm ${currentDate >= new Date(new Date().getFullYear(), new Date().getMonth(), 1) ? 'opacity-50 cursor-not-allowed' : 'hover:!bg-gray-200'}`}
              >
                &#8594;
              </button>
            </div>
            
            <div className="flex gap-2">
              <button onClick={downloadPDF} className="btn py-2 px-4 text-sm bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 transition-colors shadow-sm">
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>

          <div ref={calendarRef} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            <div className="text-center mb-6">
               <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">MULTIMAART</h2>
               <p className="text-sm font-semibold text-gray-600">Attendance Report: {format(currentDate, 'MMMM yyyy')}</p>
               <p className="text-xs text-gray-500 mt-1">Employee: {employee.fullName} ({employee.employeeId})</p>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className={`text-center font-bold text-xs uppercase tracking-wider ${d === 'Sun' ? 'text-status-holiday' : 'text-text-light'}`}>
                  {d}
                </div>
              ))}
              
              {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {daysInMonth.map((date) => {
                const record = monthlyData.attendances.find(a => {
                    const aDate = new Date(a.date);
                    return aDate.getDate() === date.getDate() && aDate.getMonth() === date.getMonth();
                });
                const isHalfDay = record && record.adminStatus === 'Approved' && record.status === 'Half Day';
                
                return (
                <div key={date.toISOString()} className="flex flex-col items-center justify-start h-14 cursor-pointer" onClick={() => handleDateClick(date, record)}>
                  <div title={getDayTooltip(date)} className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-sm font-medium shadow-sm transition-transform hover:scale-110 ${getDayStatus(date)}`}>
                    {date.getDate()}
                  </div>
                  {isHalfDay && (
                    <span className="text-[9px] font-bold text-gray-500 mt-0.5 leading-tight text-center">Half Day</span>
                  )}
                </div>
              )})}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold mb-3 text-text-dark">Legend:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13px] font-medium text-text-dark">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-status-present shadow-sm"></div> Full Day
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-status-absent shadow-sm"></div> Absent
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-sm"></div> Leave
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-status-holiday shadow-sm"></div> Sundays
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#1E3A8A] shadow-sm"></div> Official Holidays
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full shadow-sm bg-gradient-to-b from-status-absent to-status-present"></div> Half Day
                </div>
              </div>
            </div>

            {selectedPunchDetails && (
              <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center rounded-xl p-4 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full relative">
                  <button onClick={() => setSelectedPunchDetails(null)} className="absolute top-3 right-3 text-gray-400 hover:text-status-absent transition-colors">
                    <X size={20} />
                  </button>
                  <h3 className="text-lg font-bold text-text-dark mb-4 border-b pb-2">Attendance Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-text-light">Date:</span> <span className="font-semibold text-text-dark">{selectedPunchDetails.date}</span></div>
                    <div className="flex justify-between"><span className="text-text-light">Status:</span> <span className="font-semibold text-text-dark">{selectedPunchDetails.status}</span></div>
                    <div className="flex justify-between"><span className="text-text-light">Punch In:</span> <span className="font-semibold text-status-present">{selectedPunchDetails.punchIn}</span></div>
                    <div className="flex justify-between"><span className="text-text-light">Punch Out:</span> <span className="font-semibold text-status-absent">{selectedPunchDetails.punchOut}</span></div>
                    <div className="flex justify-between border-t pt-3 mt-2"><span className="text-text-dark font-bold">Total Working Hours:</span> <span className="font-bold text-primary">{selectedPunchDetails.totalHours}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AttendanceCalendarModal;
