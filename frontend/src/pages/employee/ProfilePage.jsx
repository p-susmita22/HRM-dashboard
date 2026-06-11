import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Upload, FileText, Download, Eye, CheckCircle } from 'lucide-react';
import axios from 'axios';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [showQualifications, setShowQualifications] = useState(false);
  const [qualifications, setQualifications] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [uploadingDocType, setUploadingDocType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 3000);
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/employee/profile');
      setEmployeeData(res.data);
    } catch (err) {
      console.error('Error fetching profile', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUploadClick = (docType) => {
    setUploadingDocType(docType);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingDocType) return;
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('docType', uploadingDocType);
    
    try {
      setIsUploading(true);
      await axios.post('/api/employee/upload-doc', formData);
      showToast('Document uploaded successfully!', 'success');
      fetchProfile();
    } catch (err) {
      showToast('Failed to upload document', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
      setUploadingDocType('');
    }
  };

  const getDoc = (docType) => {
    return employeeData?.documents?.find(d => d.docType === docType);
  };

  const addQualificationSlot = () => {
    if (qualifications.length < 6) {
      setQualifications([...qualifications, `Qualification ${qualifications.length + 1}`]);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage.text && createPortal(
        <div 
          style={{ 
            position: 'fixed', 
            bottom: '80px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 999999 
          }}
          className={`px-6 py-3 rounded-full shadow-2xl font-medium text-sm flex items-center gap-2 transition-all duration-300 ${toastMessage.type === 'error' ? 'bg-red-500 text-white' : 'bg-status-present text-white'}`}
        >
          {toastMessage.type === 'success' ? <CheckCircle size={18} /> : null}
          {toastMessage.text}
        </div>,
        document.body
      )}

      {/* Uploading Overlay */}
      {isUploading && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-dark font-medium">Uploading Document...</p>
          </div>
        </div>,
        document.body
      )}

      <div className="animate-fade-in p-5 max-w-5xl mx-auto relative">
        <div className="text-center my-5">
          <div className="w-24 h-24 rounded-full bg-accent mx-auto mb-2.5 flex items-center justify-center text-3xl color-primary font-bold text-primary">
            {employeeData?.fullName?.charAt(0) || 'E'}
          </div>
        <h2 className="text-2xl font-bold">{employeeData?.fullName || 'Employee Name'}</h2>
        <p className="text-text-light font-medium mt-0.5 tracking-wider">{employeeData?.employeeId || 'EMP ID-XXXX'}</p>
      </div>

      <div className="flex gap-2.5 mb-5 overflow-x-auto pb-2">
        <button 
          className={`btn ${activeTab === 'personal' ? 'btn-primary' : 'bg-white text-text-dark'}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Info
        </button>
        <button 
          className={`btn ${activeTab === 'documents' ? 'btn-primary' : 'bg-white text-text-dark'}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
      </div>

      {activeTab === 'personal' && (
        <div className="card">
          <h3 className="mb-5 border-b border-gray-100 pb-2.5 text-lg font-semibold">Personal Details</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-text-light mb-0.5">First name</p>
              <p className="font-medium text-sm text-text-dark">{employeeData?.firstName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-light mb-0.5">Middle name</p>
              <p className="font-medium text-sm text-text-dark">{employeeData?.middleName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-light mb-0.5">Last name</p>
              <p className="font-medium text-sm text-text-dark">{employeeData?.lastName || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-light mb-0.5">Employee Code</p>
              <p className="font-medium text-sm text-text-dark">{employeeData?.employeeId || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-light mb-0.5">Gender</p>
              <p className="font-medium text-sm text-text-dark">{employeeData?.gender || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-light mb-0.5">Work email</p>
              <p className="font-medium text-sm text-text-dark">{employeeData?.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-light mb-0.5">Mobile number</p>
              <p className="font-medium text-sm text-text-dark">{employeeData?.phoneNumber || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-light mb-0.5">Department</p>
              <p className="font-medium text-sm text-text-dark">{employeeData?.department || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-light mb-0.5">Designation</p>
              <p className="font-medium text-sm text-text-dark">{employeeData?.designation || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-light mb-0.5">Region</p>
              <p className="font-medium text-sm text-text-dark">{employeeData?.region || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-light mb-0.5">Zone</p>
              <p className="font-medium text-sm text-text-dark">{employeeData?.zone || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-text-light mb-0.5">Joining Date</p>
              <p className="font-medium text-sm text-text-dark">{employeeData?.joiningDate ? new Date(employeeData.joiningDate).toLocaleDateString() : '-'}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side: Standard Documents */}
          <div className="flex flex-col gap-6">
            <div className="card !mb-0 h-full border-t-4 border-primary">
              <h3 className="mb-4 text-lg font-semibold border-b border-gray-100 pb-2">My Documents</h3>
              <p className="text-sm text-text-light mb-4">Upload and manage your personal documents.</p>
              
              <div className="flex flex-col gap-2.5">
                {[
                  'Aadhaar Card', 
                  'PAN Card', 
                  'Bank Passbook', 
                  'ID Card Photo'
                ].map(doc => {
                  const existingDoc = getDoc(doc);
                  return (
                    <div key={doc} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <FileText size={20} className={existingDoc ? "text-status-present flex-shrink-0" : "text-primary flex-shrink-0"} />
                        <span className="text-sm font-medium leading-tight">{doc}</span>
                        {existingDoc && <CheckCircle size={14} className="text-status-present" />}
                      </div>
                      <div className="flex gap-2">
                        {existingDoc && (
                          <a href={`${import.meta.env.VITE_API_BASE_URL || 'https://hrm-dashboard-ln9m.onrender.com'}${existingDoc.url}`} target="_blank" rel="noreferrer" className="btn px-2 py-1.5 text-xs bg-gray-100 text-text-dark hover:bg-gray-200 transition-colors">
                            <Eye size={14} />
                          </a>
                        )}
                        <button 
                          onClick={() => handleUploadClick(doc)}
                          className="btn px-3 py-1.5 text-xs bg-accent text-primary-dark whitespace-nowrap hover:bg-primary hover:text-white transition-colors"
                        >
                          <Upload size={14} className="inline mr-1" /> {existingDoc ? 'Replace' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Interactive Qualifications Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden transition-all shadow-sm">
                  <div 
                    className="flex justify-between items-center p-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setShowQualifications(!showQualifications)}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText size={20} className="text-primary flex-shrink-0" />
                      <span className="text-sm font-medium leading-tight text-text-dark">Qualification Certificates</span>
                    </div>
                    <span className="text-primary font-bold text-[10px] bg-primary/10 px-2 py-1 rounded-full">
                      {showQualifications ? '▲ COLLAPSE' : '▼ EXPAND'}
                    </span>
                  </div>
                  
                  {showQualifications && (
                    <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-col gap-3">
                      {qualifications.map((qual, index) => (
                        <div key={index} className="flex justify-between items-center p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <input 
                            type="text" 
                            placeholder="e.g. 10th, +2, BCA..." 
                            className="text-sm font-medium border-b border-gray-300 focus:border-primary focus:outline-none focus:ring-0 w-1/2 p-1 text-text-dark bg-transparent"
                          />
                          <button 
                            onClick={() => document.getElementById('hidden-file-input').click()}
                            className="btn px-3 py-1.5 text-xs bg-accent text-primary-dark whitespace-nowrap hover:bg-primary hover:text-white transition-colors"
                          >
                            <Upload size={14} className="inline mr-1" /> Upload
                          </button>
                        </div>
                      ))}
                      
                      {qualifications.length < 6 && (
                        <button 
                          onClick={addQualificationSlot}
                          className="w-full p-3 border-2 border-dashed border-primary/40 text-primary font-semibold text-sm rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <span>+ Add your qualification</span>
                        </button>
                      )}
                      
                      {qualifications.length === 6 && (
                        <p className="text-xs font-bold text-status-absent text-center mt-1 p-2 bg-status-absent/10 rounded">
                          Maximum 6 qualifications reached.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Experience & Company Docs */}
          <div className="flex flex-col gap-6">
            <div className="card !mb-0 border-t-4 border-accent">
              <h3 className="mb-4 text-lg font-semibold border-b border-gray-100 pb-2">Experience Documents</h3>
              <p className="text-xs text-status-absent mb-4 font-medium bg-status-absent/10 p-2 rounded border border-status-absent/20">
                NOTE: Only if the employee is experienced.
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  'Experience Certificate', 
                  'Clearance Certificate', 
                  'Payslip', 
                  'Bank Statement'
                ].map(doc => {
                  const existingDoc = getDoc(doc);
                  return (
                    <div key={doc} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <FileText size={20} className={existingDoc ? "text-status-present flex-shrink-0" : "text-primary flex-shrink-0"} />
                        <span className="text-sm font-medium leading-tight">{doc}</span>
                        {existingDoc && <CheckCircle size={14} className="text-status-present" />}
                      </div>
                      <div className="flex gap-2">
                        {existingDoc && (
                          <a href={`${import.meta.env.VITE_API_BASE_URL || 'https://hrm-dashboard-ln9m.onrender.com'}${existingDoc.url}`} target="_blank" rel="noreferrer" className="btn px-2 py-1.5 text-xs bg-gray-100 text-text-dark hover:bg-gray-200 transition-colors">
                            <Eye size={14} />
                          </a>
                        )}
                        <button 
                          onClick={() => handleUploadClick(doc)}
                          className="btn px-3 py-1.5 text-xs bg-accent text-primary-dark whitespace-nowrap hover:bg-primary hover:text-white transition-colors"
                        >
                          <Upload size={14} className="inline mr-1" /> {existingDoc ? 'Replace' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card !mb-0 border-t-4 border-gray-300">
              <h3 className="mb-4 text-lg font-semibold border-b border-gray-100 pb-2">Company Documents</h3>
              <div className="flex flex-col gap-2.5">
                {['Offer Letter', 'HR Policies'].map(doc => (
                  <div key={doc} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2.5">
                      <FileText size={20} className="text-text-light flex-shrink-0" />
                      <span className="text-sm font-medium text-text-dark">{doc}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="btn p-1.5 bg-white border border-gray-200 hover:border-primary hover:text-primary shadow-sm transition-colors" title="Preview">
                        <Eye size={16} />
                      </button>
                      <button className="btn p-1.5 bg-white border border-gray-200 hover:border-primary hover:text-primary shadow-sm transition-colors" title="Download">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange} 
      />
      </div>
    </>
  );
};

export default ProfilePage;
