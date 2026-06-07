import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Lock, Activity, Smartphone, Monitor } from 'lucide-react';

const AdminSettings = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({ fullName: '', email: '', phoneNumber: '' });
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [loginActivity, setLoginActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/admin/profile');
      setProfile({
        fullName: res.data.fullName || '',
        email: res.data.email || '',
        phoneNumber: res.data.phoneNumber || ''
      });
      setLoginActivity(res.data.loginActivity || []);
    } catch (error) {
      console.error('Error fetching admin profile', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    try {
      await axios.put('/api/admin/profile', profile);
      window.dispatchEvent(new CustomEvent('adminProfileUpdated', { detail: { fullName: profile.fullName } }));
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return alert('New passwords do not match!');
    }
    try {
      await axios.put('/api/admin/password', {
        newPassword: passwords.newPassword
      });
      alert('Password changed successfully!');
      setPasswords({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to change password.');
    }
  };

  const handleLogoutOtherDevices = async () => {
    if (window.confirm('Are you sure you want to log out of all other devices?')) {
      try {
        const res = await axios.post('/api/admin/logout-devices');
        setLoginActivity(res.data.loginActivity);
        alert('Successfully logged out of other devices.');
      } catch (error) {
        alert('Failed to log out of other devices.');
      }
    }
  };

  const getDeviceIcon = (device) => {
    if (device.toLowerCase().includes('mobile') || device.toLowerCase().includes('android') || device.toLowerCase().includes('iphone')) {
      return <Smartphone size={18} className="text-gray-500" />;
    }
    return <Monitor size={18} className="text-gray-500" />;
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="animate-fade-in pb-10 max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-dark">Account Settings</h2>
        <p className="text-text-light text-sm mt-1">Manage your admin profile, security, and active sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile & Security */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile Details */}
          <div className="card shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <User className="text-primary" size={20} />
              <h3 className="font-semibold text-lg text-text-dark">Profile Details</h3>
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 font-medium text-sm text-text-dark">Full Name</label>
                  <input 
                    type="text" 
                    className={`form-control ${!isEditing ? 'bg-gray-50 border-gray-200 text-gray-500' : ''}`} 
                    value={profile.fullName}
                    onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                    required 
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block mb-1.5 font-medium text-sm text-text-dark">Email Address</label>
                  <input 
                    type="email" 
                    className={`form-control ${!isEditing ? 'bg-gray-50 border-gray-200 text-gray-500' : ''}`} 
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    required 
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 font-medium text-sm text-text-dark">Phone Number</label>
                <input 
                  type="text" 
                  className={`form-control ${!isEditing ? 'bg-gray-50 border-gray-200 text-gray-500' : ''}`} 
                  value={profile.phoneNumber}
                  onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})}
                  required 
                  disabled={!isEditing}
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                {isEditing && (
                  <button type="button" onClick={() => setIsEditing(false)} className="btn bg-gray-100 text-gray-600 hover:bg-gray-200 px-6">Cancel</button>
                )}
                <button type="submit" className="btn btn-primary px-6">
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="card shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <Lock className="text-primary" size={20} />
              <h3 className="font-semibold text-lg text-text-dark">Change Password</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 font-medium text-sm text-text-dark">New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                    required 
                    minLength="6"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 font-medium text-sm text-text-dark">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    required 
                    minLength="6"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button type="submit" className="btn btn-primary px-6">Update Password</button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column: Login Activity */}
        <div className="space-y-8">
          <div className="card shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <Activity className="text-primary" size={20} />
              <h3 className="font-semibold text-lg text-text-dark">Login Activity</h3>
            </div>
            
            <div className="flex-1 space-y-4">
              {loginActivity.length === 0 ? (
                <p className="text-sm text-text-light text-center py-4">No recent activity logged.</p>
              ) : (
                [...loginActivity].reverse().map((activity, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="mt-1">
                      {getDeviceIcon(activity.device || '')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-dark">{activity.device || 'Unknown Device'}</p>
                      <p className="text-xs text-text-light mt-0.5">IP: {activity.ip || 'Unknown IP'}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(activity.loginTime).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100">
              <p className="text-xs text-text-light mb-3 leading-relaxed">
                If you notice any suspicious activity, change your password immediately and log out of all other devices.
              </p>
              <button 
                onClick={handleLogoutOtherDevices} 
                className="w-full btn border border-status-absent text-status-absent hover:bg-status-absent hover:text-white transition-colors"
                disabled={loginActivity.length <= 1}
              >
                Log out of other devices
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;
