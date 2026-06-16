import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import EmployeeLayout from './layouts/EmployeeLayout';
import AdminLayout from './layouts/AdminLayout';
import HomePage from './pages/employee/HomePage';
import HelpPage from './pages/employee/HelpPage';
import ProfilePage from './pages/employee/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminRequests from './pages/admin/AdminRequests';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProfile from './pages/admin/AdminProfile';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminBilling from './pages/admin/AdminBilling';
import AdminMoneyReceipt from './pages/admin/AdminMoneyReceipt';
import AdminEmployeeHistory from './pages/admin/AdminEmployeeHistory';
import EmployeeMessages from './pages/employee/EmployeeMessages';
import './index.css';
import axios from 'axios';

// Set global base URL for all API requests
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://hrm-dashboard-ln9m.onrender.com';

// Configure Axios to automatically attach JWT token
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('employeeObjId');
      
      const isLoginRoute = window.location.pathname.includes('/login');
      if (!isLoginRoute) {
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const EmployeeLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [lockedMsg, setLockedMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLockedMsg('');
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      // Save token (mocked simple state logic for now)
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('role', response.data.role);
      sessionStorage.setItem('employeeObjId', response.data._id);
      onLogin(response.data.role); // should be 'employee'
      
    } catch (err) {
      setIsLoading(false);
      if (err.response?.status === 403) {
        setLockedMsg(err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check credentials.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-gray p-4">
      {lockedMsg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-xl border-t-4 border-status-absent">
            <div className="w-16 h-16 bg-status-absent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-status-absent text-3xl">!</div>
            <h3 className="text-xl font-bold text-text-dark mb-2">Account Locked</h3>
            <p className="text-text-light mb-6">{lockedMsg}</p>
            <button className="btn btn-primary w-full" onClick={() => setLockedMsg('')}>Close</button>
          </div>
        </div>
      )}
      
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">M</div>
          <h2 className="text-2xl font-bold text-primary-dark">Employee Login</h2>
          <p className="text-sm text-text-light mt-1">Sign in to your Multimaart HRM dashboard</p>
        </div>
        
        {error && <div className="bg-status-absent/10 text-status-absent p-3 rounded-lg text-sm mb-4">{error}</div>}
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Email ID</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="employee@multimaart.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control w-full pr-10" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full mt-2">Login as Employee</button>
        </form>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-bold text-text-dark animate-pulse">Logging you in...</p>
        </div>
      )}
    </div>
  );
};

const AdminLogin = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Register the new admin
        await axios.post('/api/auth/register-admin', {
          fullName, email, password
        });
        
        // Show success alert and switch back to Login page
        setIsLoading(false);
        alert('Admin account created successfully! Please log in with your new credentials.');
        setIsSignUp(false);
        setPassword(''); // Clear password for security
        return; // Stop here, do not log in automatically
      }
      
      // Regular Login Flow
      const response = await axios.post('/api/auth/login', {
        email, password
      });
      
      if (response.data.role !== 'admin') {
        setIsLoading(false);
        setError('Access denied. You do not have admin privileges.');
        return;
      }
      
      sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('role', response.data.role);
      sessionStorage.setItem('employeeObjId', response.data._id);
      onLogin(response.data.role); // should be 'admin'   
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.message || `${isSignUp ? 'Signup' : 'Login'} failed. Please check your details.`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-gray p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">🛡️</div>
          <h2 className="text-2xl font-bold text-primary-dark">{isSignUp ? 'Admin Sign Up' : 'Admin Login'}</h2>
          <p className="text-sm text-text-light mt-1">{isSignUp ? 'Create a new admin account' : 'Sign in to manage your workforce'}</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-text-dark mb-1">Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Enter your full name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-text-dark mb-1">Admin Email ID</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="admin@multimaart.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-dark mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control w-full pr-10" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                pattern={isSignUp ? "^(?=.*[!@#$%^&*])(?=.*\\d)[A-Z].{5,9}$" : undefined}
                title={isSignUp ? "Password must be 6-10 characters long, start with a capital letter, and include at least one number and one special character" : undefined}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary w-full py-2.5 mt-2">
            {isSignUp ? 'Create Account' : 'Login as Admin'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-text-light">{isSignUp ? 'Already have an account?' : 'New admin?'}</span>{' '}
          <button 
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-primary font-semibold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [userRole, setUserRole] = useState(sessionStorage.getItem('role') || null);

  const ProtectedRoute = ({ role, children }) => {
    if (!userRole) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />;
    if (userRole !== role) return <Navigate to={userRole === 'admin' ? '/admin' : '/employee'} replace />;
    return children;
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg-gray">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={userRole ? <Navigate to="/employee" /> : <EmployeeLogin onLogin={setUserRole} />} />
          <Route path="/admin/login" element={userRole ? <Navigate to="/admin" /> : <AdminLogin onLogin={setUserRole} />} />
          
          <Route path="/employee" element={<ProtectedRoute role="employee"><EmployeeLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="home" />} />
            <Route path="home" element={<HomePage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="messages" element={<EmployeeMessages />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="requests" element={<AdminRequests />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="money-receipt" element={<AdminMoneyReceipt />} />
            <Route path="employee-history" element={<AdminEmployeeHistory />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="*" element={<div className="p-8 text-center text-xl text-text-light">Admin Page Not Found</div>} />
          </Route>
          
          <Route path="*" element={<Navigate to={userRole === 'admin' ? '/admin' : '/employee'} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
