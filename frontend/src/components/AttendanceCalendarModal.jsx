import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, CalendarDays, Download, Image as ImageIcon } from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import html2canvas from 'html-to-image'; // Wait, let's use window.print or simple html2pdf. We will use a basic approach.
import html2pdf from 'html2pdf.js';

const AttendanceCalendarModal = ({ employee, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState({ attendances: [], leaves: [] });
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef(null);

  useEffect(() => {
    fetchMonthlyData();
  }, [currentDate]);

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5006';
      
      const res = await axios.get(`${API_URL}/api/admin/employees/${employee._id}/attendance/monthly?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
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
    const isSunday = date.getDay() === 0;
    
    // Check if it's an official holiday
    const holidayRecord = monthlyData.attendances.find(a => {
      const aDate = new Date(a.date);
      return aDate.getDate() === date.getDate() && aDate.getMonth() === date.getMonth() && a.status === 'Holiday';
    });
    
    if (holidayRecord) return 'bg-[#1E3A8A] text-white';

    const record = monthlyData.attendances.find(a => {
      const aDate = new Date(a.date);
      return aDate.getDate() === date.getDate() && aDate.getMonth() === date.getMonth() && a.status !== 'Holiday';
    });

    if (record) {
      if (record.status === 'Half Day') {
        const isLate = new Date(record.punchIn).getHours() >= 10;
        if (isLate) return 'bg-gradient-to-b from-status-absent to-status-present text-white';
        else return 'bg-gradient-to-b from-status-present to-status-absent text-white';
      }
      if (record.status === 'Absent' && record.adminStatus === 'Approved') return 'bg-yellow-400 text-white';
      if (record.status === 'Absent') return 'bg-status-absent text-white';
      return 'bg-status-present text-white';
    }

    const isOnLeave = monthlyData.leaves.some(leave => {
      const cTime = date.getTime();
      if (leave.dates && leave.dates.length > 0) {
        return leave.dates.some(d => new Date(d).setHours(0,0,0,0) === cTime);
      }
      const start = new Date(leave.fromDate).setHours(0,0,0,0);
      const end = new Date(leave.toDate).setHours(23,59,59,999);
      return cTime >= start && cTime <= end;
    });

    if (isOnLeave) return 'bg-yellow-400 text-white';
    if (isSunday) return 'bg-status-holiday text-white';

    return date > new Date() ? 'bg-white text-gray-400 border border-gray-100' : 'bg-status-absent text-white';
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
                className="btn !bg-gray-100 hover:!bg-gray-200 text-text-dark !p-2 !rounded-full shadow-sm"
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

              {daysInMonth.map((date) => (
                <div key={date.toISOString()} className="flex flex-col items-center justify-start h-12 sm:h-14">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium shadow-sm cursor-default ${getDayStatus(date)}`}>
                    {date.getDate()}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold mb-3 text-text-dark">Legend:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] sm:text-[13px] font-medium text-text-dark">
                <div className="flex items-center gap-2"><div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-status-present shadow-sm"></div> Full Day</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-status-absent shadow-sm"></div> Absent</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-400 shadow-sm"></div> Leave</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-status-holiday shadow-sm"></div> Sundays</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#1E3A8A] shadow-sm"></div> Official Holidays</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm bg-gradient-to-b from-status-absent to-status-present"></div> Half Day</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AttendanceCalendarModal;
