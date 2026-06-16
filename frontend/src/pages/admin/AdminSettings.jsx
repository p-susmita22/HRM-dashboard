import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity } from 'lucide-react';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [hrPolicyFile, setHrPolicyFile] = useState(null);
  const [currentHrPolicy, setCurrentHrPolicy] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchHrPolicies = async () => {
    try {
      const res = await axios.get('/api/admin/hr-policies');
      setCurrentHrPolicy(res.data);
    } catch (error) {
      console.error('Error fetching HR Policies', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHrPolicies();
  }, []);

  const handleHrPolicyUpload = async (e) => {
    e.preventDefault();
    if (!hrPolicyFile) return alert('Please select a file to upload');
    
    const formData = new FormData();
    formData.append('document', hrPolicyFile);
    
    setIsUploading(true);
    try {
      await axios.post('/api/admin/hr-policies', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('HR Policies uploaded successfully!');
      setHrPolicyFile(null);
      fetchHrPolicies();
    } catch (error) {
      alert('Failed to upload HR Policies.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteHrPolicy = async () => {
    if (!window.confirm('Are you sure you want to delete the HR Policies document?')) return;
    try {
      await axios.delete('/api/admin/hr-policies');
      setCurrentHrPolicy(null);
      alert('HR Policies deleted successfully!');
    } catch (error) {
      alert('Failed to delete HR Policies.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="animate-fade-in pb-10 max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-dark">System Settings</h2>
        <p className="text-text-light text-sm mt-1">Manage global system settings and company documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Documents Upload */}
        <div className="card shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <Activity className="text-primary" size={20} />
            <h3 className="font-semibold text-lg text-text-dark">Company Documents</h3>
          </div>
          <form onSubmit={handleHrPolicyUpload} className="space-y-4">
            <div>
              <label className="block mb-1.5 font-medium text-sm text-text-dark">Upload New HR Policies</label>
              <input 
                type="file" 
                className="form-control" 
                onChange={(e) => setHrPolicyFile(e.target.files[0])}
                required 
              />
              <p className="text-xs text-text-light mt-1">This will be visible to all employees in their profile.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button type="submit" className="btn btn-primary px-6" disabled={isUploading}>
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </span>
                ) : (
                  'Upload HR Policies'
                )}
              </button>
            </div>
          </form>

          {currentHrPolicy && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-text-dark mb-3">Current Document</h4>
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-text-dark">{currentHrPolicy.docType}</p>
                    <p className="text-[10px] text-text-light">{currentHrPolicy.fileName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`${import.meta.env.VITE_API_BASE_URL || 'https://hrm-dashboard-ln9m.onrender.com'}${currentHrPolicy.url}`} target="_blank" rel="noreferrer" className="btn p-1.5 bg-white border border-gray-200 hover:border-primary hover:text-primary shadow-sm transition-colors text-xs">
                    View
                  </a>
                  <button onClick={handleDeleteHrPolicy} className="btn p-1.5 bg-white border border-status-absent text-status-absent hover:bg-status-absent hover:text-white shadow-sm transition-colors text-xs">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
