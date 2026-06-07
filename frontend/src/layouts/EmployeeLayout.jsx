import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, HelpCircle, User, MessageCircle } from 'lucide-react';

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white flex justify-around py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50 pb-[calc(12px+env(safe-area-inset-bottom))]">
      <NavLink to="/employee/home" className={({isActive}) => `flex flex-col items-center gap-1 text-xs transition-colors ${isActive ? 'text-primary font-semibold' : 'text-text-light'}`}>
        <Home size={24} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/employee/help" className={({isActive}) => `flex flex-col items-center gap-1 text-xs transition-colors ${isActive ? 'text-primary font-semibold' : 'text-text-light'}`}>
        <HelpCircle size={24} />
        <span>Help</span>
      </NavLink>
      <NavLink to="/employee/messages" className={({isActive}) => `flex flex-col items-center gap-1 text-xs transition-colors ${isActive ? 'text-primary font-semibold' : 'text-text-light'}`}>
        <MessageCircle size={24} />
        <span>Messages</span>
      </NavLink>
      <NavLink to="/employee/profile" className={({isActive}) => `flex flex-col items-center gap-1 text-xs transition-colors ${isActive ? 'text-primary font-semibold' : 'text-text-light'}`}>
        <User size={24} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}

const EmployeeLayout = () => {
  return (
    <div className="pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
};

export default EmployeeLayout;
