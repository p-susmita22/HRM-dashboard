import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Users, Calendar, FileText, Settings, Bell, LayoutDashboard, Menu, X, Receipt, History } from 'lucide-react';
import axios from 'axios';
import logo from '../assets/multimaart-logo.png';

const AdminSidebar = ({ onLogout, isOpen, setIsOpen, counts }) => {
  const location = useLocation();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [location, setIsOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`fixed md:relative w-64 bg-white shadow-sm flex flex-col z-50 h-full border-r border-gray-100 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center">
            <img src={logo} alt="Multimaart Logo" className="h-10 object-contain" />
          </div>
          <button className="md:hidden text-gray-500" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col py-4 gap-1 flex-1 overflow-y-auto">
          <NavLink to="/admin" end className={({isActive}) => `px-5 py-3 flex items-center gap-3 font-medium transition-all border-l-4 ${isActive ? 'bg-accent text-primary border-primary' : 'text-text-light border-transparent hover:bg-bg-gray hover:text-primary'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/admin/employees" className={({isActive}) => `px-5 py-3 flex items-center gap-3 font-medium transition-all border-l-4 ${isActive ? 'bg-accent text-primary border-primary' : 'text-text-light border-transparent hover:bg-bg-gray hover:text-primary'}`}>
            <Users size={20} /> Employees
          </NavLink>
          <NavLink to="/admin/employee-history" className={({isActive}) => `px-5 py-3 flex items-center gap-3 font-medium transition-all border-l-4 ${isActive ? 'bg-accent text-primary border-primary' : 'text-text-light border-transparent hover:bg-bg-gray hover:text-primary'}`}>
            <History size={20} /> Employee History
          </NavLink>
          <NavLink to="/admin/attendance" className={({isActive}) => `px-5 py-3 flex items-center justify-between font-medium transition-all border-l-4 ${isActive ? 'bg-accent text-primary border-primary' : 'text-text-light border-transparent hover:bg-bg-gray hover:text-primary'}`}>
            <div className="flex items-center gap-3">
              <Calendar size={20} /> Attendance
            </div>
            {counts.attendanceCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{counts.attendanceCount}</span>
            )}
          </NavLink>
          <NavLink to="/admin/requests" className={({isActive}) => `px-5 py-3 flex items-center justify-between font-medium transition-all border-l-4 ${isActive ? 'bg-accent text-primary border-primary' : 'text-text-light border-transparent hover:bg-bg-gray hover:text-primary'}`}>
            <div className="flex items-center gap-3">
              <FileText size={20} /> Requests
            </div>
            {counts.requestsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{counts.requestsCount}</span>
            )}
          </NavLink>
          <NavLink to="/admin/notifications" className={({isActive}) => `px-5 py-3 flex items-center justify-between font-medium transition-all border-l-4 ${isActive ? 'bg-accent text-primary border-primary' : 'text-text-light border-transparent hover:bg-bg-gray hover:text-primary'}`}>
            <div className="flex items-center gap-3">
              <Bell size={20} /> Notifications
            </div>
            {counts.notificationsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{counts.notificationsCount}</span>
            )}
          </NavLink>
          <NavLink to="/admin/billing" className={({isActive}) => `px-5 py-3 flex items-center gap-3 font-medium transition-all border-l-4 ${isActive ? 'bg-accent text-primary border-primary' : 'text-text-light border-transparent hover:bg-bg-gray hover:text-primary'}`}>
            <Receipt size={20} /> Generate Billing
          </NavLink>
          <NavLink to="/admin/money-receipt" className={({isActive}) => `px-5 py-3 flex items-center gap-3 font-medium transition-all border-l-4 ${isActive ? 'bg-accent text-primary border-primary' : 'text-text-light border-transparent hover:bg-bg-gray hover:text-primary'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> 
            Money Receipt
          </NavLink>
          <NavLink to="/admin/settings" className={({isActive}) => `px-5 py-3 flex items-center gap-3 font-medium transition-all border-l-4 ${isActive ? 'bg-accent text-primary border-primary' : 'text-text-light border-transparent hover:bg-bg-gray hover:text-primary'}`}>
            <Settings size={20} /> Settings
          </NavLink>
        </nav>
        
        <div className="p-5 border-t border-gray-100">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-status-absent font-medium hover:bg-status-absent/10 py-2.5 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Log Out
          </button>
        </div>
      </div>
    </>
  );
};

const AdminLayout = () => {
  const [adminName, setAdminName] = useState('Super Admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState({ attendanceCount: 0, requestsCount: 0, notificationsCount: 0 });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/admin/profile');
        if (res.data && res.data.fullName) {
          setAdminName(res.data.fullName);
        }
      } catch (error) {
        console.error('Failed to fetch admin name');
      }
    };
    
    const fetchCounts = async () => {
      try {
        const res = await axios.get('/api/admin/sidebar-counts');
        setCounts(res.data);
      } catch (error) {
        console.error('Failed to fetch sidebar counts');
      }
    };

    fetchProfile();
    fetchCounts();
    
    // Set up polling for counts every 30 seconds
    const countInterval = setInterval(fetchCounts, 30000);

    const handleProfileUpdate = (e) => {
      if (e.detail && e.detail.fullName) {
        setAdminName(e.detail.fullName);
      }
    };

    window.addEventListener('adminProfileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('adminProfileUpdated', handleProfileUpdate);
      clearInterval(countInterval);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    window.location.href = '/admin/login';
  };

  const initial = adminName ? adminName.charAt(0).toUpperCase() : 'A';

  return (
    <div className="flex h-screen bg-bg-gray overflow-hidden">
      <AdminSidebar onLogout={handleLogout} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} counts={counts} />
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <div className="h-[70px] bg-white shadow-sm flex justify-between items-center px-4 md:px-8 z-30 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-text-dark" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="text-lg md:text-xl font-semibold text-text-dark">Admin Portal</div>
          </div>
          <div className="flex items-center font-medium gap-2 md:gap-3">
            <span className="hidden sm:inline">{adminName}</span>
            <div className="w-8 h-8 md:w-9 md:h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">{initial}</div>
          </div>
        </div>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
