import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Info, FileText, CalendarDays, UploadCloud, MapPin, RefreshCw, X } from 'lucide-react';
import axios from 'axios';
import logo from '../../assets/multimaart-logo.png';

const HomePage = () => {
  const [punchedIn, setPunchedIn] = useState(false);
  const [punchTime, setPunchTime] = useState(null);
  const [punchInLocation, setPunchInLocation] = useState(null);
  const [remoteRequestSent, setRemoteRequestSent] = useState(false);
  const [remoteOutRequestSent, setRemoteOutRequestSent] = useState(false);
  const [currentLocationText, setCurrentLocationText] = useState('Detecting location...');
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [punchOutTime, setPunchOutTime] = useState(null);
  const [isPunchingIn, setIsPunchingIn] = useState(false);
  const [isPunchingOut, setIsPunchingOut] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employeeData, setEmployeeData] = useState(null);
  const [monthlyData, setMonthlyData] = useState({ attendances: [], leaves: [] });
  const [summary, setSummary] = useState({ present: 0, absent: 0, halfDays: 0, onLeave: 0, sundays: 0, officialHolidays: 0 });
  const [locationError, setLocationError] = useState(null); // 'denied', 'unavailable', 'timeout', or null
  const [selectedPunchDetails, setSelectedPunchDetails] = useState(null);
  const isPunchingRef = React.useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentLocation();
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
            setPunchInLocation(attendanceRes.data.punchInLocation);
          }
          if (attendanceRes.data.isRemote && attendanceRes.data.remoteStatus === 'Pending') {
            setRemoteRequestSent(true);
            setPunchedIn(false);
          }
          if (attendanceRes.data.punchOut) {
            if (attendanceRes.data.isRemoteOut && attendanceRes.data.remoteOutStatus === 'Pending') {
              setRemoteOutRequestSent(true);
              // keep punchedIn true or just show disabled button
            } else {
              setPunchedIn(false);
              setPunchOutTime(new Date(attendanceRes.data.punchOut));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data', err);
      }
    };
    fetchProfileAndAttendance();
  }, []);

  const fetchCurrentLocation = () => {
    setIsRefreshingLocation(true);
    setCurrentLocationText('Updating location...');
    if (!navigator.geolocation) {
      setCurrentLocationText('Location not supported');
      setIsRefreshingLocation(false);
      return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceMeters(latitude, longitude, OFFICE_LAT, OFFICE_LNG);
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const geoData = await geoRes.json();
        if (geoData?.display_name) {
          setCurrentLocationText(geoData.display_name.split(',').slice(0, 3).join(', '));
        } else {
          setCurrentLocationText('Unknown Location');
        }
      } catch(e) {
         setCurrentLocationText('Location tracking failed');
      } finally {
         setIsRefreshingLocation(false);
      }
    }, (error) => {
       if (error.code === 1) { // PERMISSION_DENIED
         setLocationError('denied');
       } else if (error.code === 2) { // POSITION_UNAVAILABLE
         setLocationError('unavailable');
       } else if (error.code === 3) { // TIMEOUT
         setLocationError('timeout');
       }
       setCurrentLocationText('Location access denied');
       setIsRefreshingLocation(false);
    }, { 
      enableHighAccuracy: isMobile, 
      timeout: 10000, 
      maximumAge: 0 
    });
  };

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
    let sundays = 0;
    let officialHolidays = 0;

    const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
    const realToday = new Date();

    const joiningDateObj = employeeData?.joiningDate ? new Date(employeeData.joiningDate) : null;
    if (joiningDateObj) joiningDateObj.setHours(0,0,0,0);

    days.forEach(date => {
      if (joiningDateObj && date.getTime() < joiningDateObj.getTime()) return; // Skip dates before joining

      if (date.getDay() === 0) {
        sundays++;
        return;
      }
      
      const isOnLeave = monthlyData.leaves.some(leave => {
        if (leave.dates && leave.dates.length > 0) {
          return leave.dates.some(dStr => new Date(dStr).setHours(0,0,0,0) === date.getTime());
        }
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
        else if (record.status === 'Holiday') officialHolidays++;
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

    setSummary({ present, absent, halfDays, onLeave, sundays, officialHolidays });
  }, [monthlyData, currentDate, punchedIn, employeeData]);

  // ---- Office Geofencing ----
  const OFFICE_LAT = 20.28567438118417;
  const OFFICE_LNG = 85.90030307523656;
  const OFFICE_RADIUS_METERS = 500;

  const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const handlePunchIn = async () => {
    if (isPunchingRef.current) return;
    isPunchingRef.current = true;
    setIsPunchingIn(true);
    if (!navigator.geolocation) {
      setIsPunchingIn(false);
      isPunchingRef.current = false;
      return alert('Geolocation is not supported by your browser.');
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const isRemote = true; 
        let address = 'Unknown location';

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          const geoData = await geoRes.json();
          if (geoData?.display_name) address = geoData.display_name;
        } catch (e) { console.error('Geocoding failed', e); }

        const locationData = { lat: latitude, lng: longitude, address };

        const res = await axios.post('/api/employee/punch-in', { location: locationData, isRemote });

        if (isRemote) {
          setRemoteRequestSent(true);
          alert('Remote punch-in request sent! Your attendance will be marked after admin approval.');
        } else {
          setPunchedIn(true);
          setPunchTime(new Date(res.data.punchIn));
          setPunchInLocation(res.data.punchInLocation);
          alert('Successfully punched in!');
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to punch in');
      } finally {
        setIsPunchingIn(false);
        isPunchingRef.current = false;
      }
    }, (error) => {
      setIsPunchingIn(false);
      isPunchingRef.current = false;
      if (error.code === 1) {
        setLocationError('denied');
      } else if (error.code === 2) {
        setLocationError('unavailable');
      } else if (error.code === 3) {
        setLocationError('timeout');
      } else {
        alert('Location access denied or timed out. Please check permissions.');
      }
    }, { 
      enableHighAccuracy: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), 
      timeout: 10000, 
      maximumAge: 0 
    });
  };

  const handlePunchOut = async () => {
    if (isPunchingRef.current) return;
    isPunchingRef.current = true;
    setIsPunchingOut(true);
    if (!navigator.geolocation) {
      setIsPunchingOut(false);
      isPunchingRef.current = false;
      return alert('Geolocation is not supported by your browser.');
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const isRemoteOut = true;
        let address = 'Unknown location';

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          const geoData = await geoRes.json();
          if (geoData?.display_name) address = geoData.display_name;
        } catch (e) { console.error('Geocoding failed', e); }

        const locationData = { lat: latitude, lng: longitude, address };

        const res = await axios.post('/api/employee/punch-out', { location: locationData, isRemoteOut });

        if (isRemoteOut) {
          setRemoteOutRequestSent(true);
          alert('Remote punch-out request sent! Your attendance punch-out will be finalized after admin approval.');
        } else {
          setPunchedIn(false);
          setPunchOutTime(new Date(res.data.punchOut));
          alert('Successfully punched out!');
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to punch out');
      } finally {
        setIsPunchingOut(false);
        isPunchingRef.current = false;
      }
    }, (error) => {
      setIsPunchingOut(false);
      isPunchingRef.current = false;
      if (error.code === 1) {
        setLocationError('denied');
      } else if (error.code === 2) {
        setLocationError('unavailable');
      } else if (error.code === 3) {
        setLocationError('timeout');
      } else {
        alert('Location access denied or timed out. Please check permissions.');
      }
    }, { 
      enableHighAccuracy: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), 
      timeout: 10000, 
      maximumAge: 0 
    });
  };

  const handleLogout = async () => {
    try {
      const deviceType = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
      await axios.post('/api/auth/logout', { deviceType });
    } catch (e) {
      console.error('Logout API failed', e);
    }
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
    const joiningDateObj = employeeData?.joiningDate ? new Date(employeeData.joiningDate) : null;
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

    if (isToday && punchedIn) return 'bg-status-present/80 text-white shadow-sm ring-2 ring-status-present ring-offset-2';

    // If the date is in the future
    if (date > realToday && !isToday) return 'bg-gray-100 text-text-light'; 
    
    // Default empty status for past dates (unmarked)
    if (date < realToday && !isToday) return 'bg-red-50 text-status-absent/60 border border-status-absent/20'; // Indicating missing punch
    
    return 'bg-gray-50 text-text-light';
  };

  const getDayTooltip = (date) => {
    const joiningDateObj = employeeData?.joiningDate ? new Date(employeeData.joiningDate) : null;
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

    if (isToday && punchedIn) return `Working (In: ${format(punchTime, 'hh:mm a')})`;

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
          <div className="text-right hidden md:block max-w-[180px]">
            <p className="text-xs text-text-light font-medium flex items-center justify-end gap-1">
              <MapPin size={12} /> Location
              <button onClick={fetchCurrentLocation} disabled={isRefreshingLocation} className="p-0.5 text-primary hover:bg-blue-50 rounded" title="Refresh Location">
                 <RefreshCw size={10} className={isRefreshingLocation ? 'animate-spin' : ''} />
              </button>
            </p>
            <p className="text-[10px] font-medium text-text-dark truncate" title={currentLocationText}>{currentLocationText}</p>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-xs text-text-light font-medium">Office Time</p>
            <p className="text-sm font-bold text-text-dark">9:30 AM - 5:30 PM</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-center">
              <button 
                className={`btn !py-2 !px-4 text-sm shadow-md mb-1 ${(!punchedIn && !punchTime) || isPunchingIn ? 'btn-primary' : 'bg-gray-200 text-text-light cursor-not-allowed'} flex items-center justify-center gap-2 min-w-[100px]`}
                onClick={handlePunchIn}
                disabled={punchTime !== null || isPunchingIn}
              >
                {isPunchingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  'Punch In'
                )}
              </button>
              <div className="text-xs font-bold text-text-dark">
                {punchTime ? format(punchTime, 'hh:mm a') : '--:--'}
              </div>
            </div>
            
            <div className="text-center">
              <button 
                className={`btn !py-2 !px-4 text-sm shadow-md mb-1 ${(punchedIn && !remoteOutRequestSent) || isPunchingOut ? 'btn-danger' : 'bg-gray-200 text-text-light cursor-not-allowed'} flex items-center justify-center gap-2 min-w-[100px]`}
                onClick={handlePunchOut}
                disabled={!punchedIn || remoteOutRequestSent || isPunchingOut}
              >
                {isPunchingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  'Punch Out'
                )}
              </button>
              <div className="text-xs font-bold text-text-dark">
                {punchOutTime ? format(punchOutTime, 'hh:mm a') : '--:--'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Location Bar */}
      <div className="md:hidden bg-blue-50/40 border-b border-blue-100 px-4 py-2.5 flex justify-between items-center sticky top-[73px] z-20 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-hidden">
          <MapPin size={14} className="text-primary flex-shrink-0" />
          <span className="text-xs font-bold text-text-dark truncate">
            {currentLocationText}
          </span>
        </div>
        <button 
          onClick={fetchCurrentLocation} 
          disabled={isRefreshingLocation} 
          className="ml-2 p-1.5 bg-white text-primary rounded-md shadow-sm border border-blue-100 flex-shrink-0"
        >
          <RefreshCw size={14} className={isRefreshingLocation ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto mt-4">
        {punchedIn && (
          <div className="bg-white rounded-lg shadow-sm border border-green-100 mb-6 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center max-w-2xl mx-auto bg-green-50/30 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-status-present animate-pulse"></div>
              <span className="text-sm font-semibold text-text-dark">Current Working Status</span>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-status-present font-bold text-sm mb-1">{format(new Date(), 'hh:mm a')} <span className="text-xs text-text-light font-normal">(In at {format(punchTime, 'hh:mm a')})</span></div>
              {punchInLocation && punchInLocation.lat && (
                <div className="text-[10px] sm:text-xs text-gray-500 max-w-sm">
                  <span className="font-semibold">Location:</span> {punchInLocation.address || `${punchInLocation.lat.toFixed(4)}, ${punchInLocation.lng.toFixed(4)}`}
                  <a href={`https://maps.google.com/?q=${punchInLocation.lat},${punchInLocation.lng}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline ml-1">(View Map)</a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Remote punch request pending banner */}
        {remoteRequestSent && !punchedIn && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg shadow-sm mb-6 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center max-w-2xl mx-auto gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse"></div>
              <span className="text-sm font-semibold text-orange-800">Remote Punch-In Request Sent</span>
            </div>
            <p className="text-xs text-orange-600 max-w-xs">Your request is pending admin approval. Attendance will be marked once approved.</p>
          </div>
        )}

        {remoteOutRequestSent && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg shadow-sm mb-6 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center max-w-2xl mx-auto gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse"></div>
              <span className="text-sm font-semibold text-orange-800">Remote Punch-Out Request Sent</span>
            </div>
            <p className="text-xs text-orange-600 max-w-xs">Your punch-out request is pending admin approval. You can close the portal.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side: Calendar */}
          <div className="lg:col-span-2 card shadow-lg border-t-4 border-primary !mb-0 relative">
            <h3 className="mb-4 text-xl font-bold text-center text-text-dark">Attendance Calendar</h3>
            <div className="flex items-center justify-between mb-6 px-4 bg-gray-50 p-2 rounded-lg">
              <button 
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                disabled={employeeData?.joiningDate && (currentDate.getFullYear() < new Date(employeeData.joiningDate).getFullYear() || (currentDate.getFullYear() === new Date(employeeData.joiningDate).getFullYear() && currentDate.getMonth() <= new Date(employeeData.joiningDate).getMonth()))}
                className={`btn !bg-white !p-2 !rounded-full shadow-sm ${employeeData?.joiningDate && (currentDate.getFullYear() < new Date(employeeData.joiningDate).getFullYear() || (currentDate.getFullYear() === new Date(employeeData.joiningDate).getFullYear() && currentDate.getMonth() <= new Date(employeeData.joiningDate).getMonth())) ? 'opacity-50 cursor-not-allowed text-gray-400' : 'hover:!bg-gray-200 text-text-dark'}`}
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

          {/* Right Side: Monthly Summary */}
          <div className="card shadow-lg border-t-4 border-accent !mb-0 h-fit">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-text-dark">Monthly Details</h3>
              <input 
                type="month" 
                className="form-control text-sm py-1.5 px-3 bg-white border border-gray-200 rounded-md text-text-dark focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                value={format(currentDate, 'yyyy-MM')}
                min={employeeData?.joiningDate ? format(new Date(employeeData.joiningDate), 'yyyy-MM') : undefined}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m] = e.target.value.split('-');
                    setCurrentDate(new Date(y, m - 1, 1));
                  }
                }}
              />
            </div>
            <h4 className="text-text-light mb-5 font-medium text-sm">
              {format(currentDate, 'MMMM yyyy')} Summary
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-status-present/5 rounded-lg border border-status-present/20">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-present"></div> Full Day
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
                  <div className="w-3 h-3 rounded-full shadow-sm bg-gradient-to-b from-status-absent to-status-present"></div> Half Days
                </span>
                <span className="font-bold text-lg text-yellow-600">{summary.halfDays}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div> On Leave
                </span>
                <span className="font-bold text-lg text-yellow-600">{summary.onLeave}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-[#1E3A8A]/5 rounded-lg border border-[#1E3A8A]/20">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#1E3A8A]"></div> Official Holidays
                </span>
                <span className="font-bold text-lg text-[#1E3A8A]">{summary.officialHolidays}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-status-holiday/5 rounded-lg border border-status-holiday/20">
                <span className="font-medium text-text-dark flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-holiday"></div> Sundays (Off Days)
                </span>
                <span className="font-bold text-lg text-status-holiday">{summary.sundays}</span>
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

      {/* Custom Location Error Modal (Google Maps Style Replica) */}
      {locationError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-[#eff1f4] rounded-[28px] max-w-sm w-full p-6 text-left shadow-2xl font-sans">
            <h2 className="text-[19px] leading-tight font-medium text-gray-900 mb-4">
              To continue, your device will need to use Location Accuracy
            </h2>
            <p className="text-[13px] text-gray-800 font-medium mb-4">
              The following settings should be on:
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4">
                <MapPin size={22} className="text-[#3b6b2c] mt-0.5 flex-shrink-0" />
                <p className="text-[13px] text-gray-800 font-medium">Device location</p>
              </div>
              <div className="flex items-start gap-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b6b2c] mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line x1="12" y1="2" x2="12" y2="4"></line>
                  <line x1="12" y1="20" x2="12" y2="22"></line>
                  <line x1="2" y1="12" x2="4" y2="12"></line>
                  <line x1="20" y1="12" x2="22" y2="12"></line>
                </svg>
                <p className="text-[13px] text-gray-800 leading-snug">
                  <strong className="font-medium">Location Accuracy,</strong> which provides more accurate location for apps and services. To do this, Google periodically processes information about device sensors and wireless signals from your device to crowdsource wireless signal locations. These are used without identifying you to improve location accuracy and location-based services and to improve, provide and maintain Google's services based on Google's and third parties' legitimate interests to serve users' needs.
                </p>
              </div>
            </div>
            
            <p className="text-[12px] text-gray-700 leading-snug mb-8">
              You can change this at any time in location settings. <span className="text-[#3b6b2c] font-medium cursor-pointer hover:underline" onClick={() => setLocationError(null)}>Manage settings</span> or <span className="text-[#3b6b2c] font-medium cursor-pointer hover:underline" onClick={() => setLocationError(null)}>learn more</span>
            </p>

            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setLocationError(null)} 
                className="px-5 py-2.5 rounded-full border border-gray-400 text-gray-800 text-[13px] font-medium hover:bg-gray-200 transition-colors"
              >
                No, thanks
              </button>
              <button 
                onClick={() => {
                  setLocationError(null);
                  fetchCurrentLocation();
                }} 
                className="px-6 py-2.5 rounded-full bg-[#406830] text-white text-[13px] font-medium hover:bg-[#345427] transition-colors"
              >
                Turn on
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
