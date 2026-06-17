import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Send, Check, FileText, Trash2, History } from 'lucide-react';

const AdminNotifications = () => {
  const [messages, setMessages] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'report'
  const [replyContent, setReplyContent] = useState('');
  const messagesEndRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [msgRes, empRes, attRes] = await Promise.all([
        axios.get('/api/messages/admin'),
        axios.get('/api/admin/employees'),
        axios.get('/api/admin/attendance')
      ]);
      setMessages(msgRes.data);
      setEmployees(empRes.data);

      const todayString = new Date().toDateString();
      const todaysAttendances = attRes.data.filter(a => new Date(a.date).toDateString() === todayString);
      setTodayAttendance(todaysAttendances);
      setAllAttendance(attRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedEmployee, messages, activeTab]);

  const handleSelectEmployee = async (empId, empName) => {
    setSelectedEmployee({ id: empId, name: empName });
    setActiveTab('chat');
    try {
      await axios.put(`/api/messages/admin/read/${empId}`);
      fetchData();
    } catch(err) {}
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedEmployee) return;
    try {
      await axios.post(`/api/messages/admin/${selectedEmployee.id}`, {
        content: replyContent
      });
      setReplyContent('');
      fetchData();
    } catch (error) {
      alert('Failed to send reply');
    }
  };

  const handleDeleteReport = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await axios.delete(`/api/admin/attendance/${recordId}/report`);
      fetchData();
    } catch(err) {
      alert('Failed to delete report');
    }
  };

  const groupedData = employees.reduce((acc, emp) => {
    const record = todayAttendance.find(a => (a.employee?._id || a.employee) === emp._id);
    acc[emp._id] = {
      employee: emp,
      messages: [],
      unreadCount: 0,
      lastMessage: null,
      hasReport: record?.dailyReport ? true : false
    };
    return acc;
  }, {});

  messages.forEach(msg => {
    if (!msg.employee) return;
    const empId = msg.employee._id || msg.employee;
    if (groupedData[empId]) {
      groupedData[empId].messages.push(msg);
      groupedData[empId].lastMessage = msg;
      if (msg.sender === 'employee' && !msg.isRead) {
        groupedData[empId].unreadCount += 1;
      }
    }
  });

  const threads = Object.values(groupedData).sort((a, b) => {
    // Sort logic: prioritize unread messages, then hasReport, then recent messages
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    
    if (a.hasReport && !b.hasReport) return -1;
    if (!a.hasReport && b.hasReport) return 1;

    if (a.lastMessage && b.lastMessage) {
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    }
    if (a.lastMessage && !b.lastMessage) return -1;
    if (!a.lastMessage && b.lastMessage) return 1;
    return a.employee.fullName.localeCompare(b.employee.fullName);
  });

  return (
    <div className="animate-fade-in pb-10 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-dark">Notifications & Messages</h2>
        <p className="text-text-light text-sm mt-1">Respond to employee queries and check their daily reports.</p>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden h-[calc(100vh-200px)]">
        
        {/* Thread List */}
        <div className="w-1/3 max-w-[320px] bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-semibold flex items-center gap-2 text-text-dark bg-gray-50/50">
            <MessageSquare size={18} className="text-primary" /> Employee List
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-text-light text-sm">Loading...</div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-text-light text-sm">No employees found.</div>
            ) : (
              threads.map(thread => (
                <div 
                  key={thread.employee._id}
                  onClick={() => handleSelectEmployee(thread.employee._id, thread.employee.fullName)}
                  className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${selectedEmployee?.id === thread.employee._id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-sm text-text-dark">{thread.employee.fullName}</h4>
                    <div className="flex gap-1">
                      {thread.hasReport && (
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1" title="Report Submitted">
                          <FileText size={10} /> Report
                        </span>
                      )}
                      {thread.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{thread.unreadCount} New</span>
                      )}
                    </div>
                  </div>
                  {thread.lastMessage ? (
                    <>
                      <p className="text-xs text-text-light truncate pr-4">{thread.lastMessage.content}</p>
                      <p className="text-[10px] text-gray-400 mt-2">{new Date(thread.lastMessage.createdAt).toLocaleString()}</p>
                    </>
                  ) : (
                    <p className="text-xs text-text-light italic">No messages yet</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Area: Tabs */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          {selectedEmployee ? (
            <>
              {/* Header with Tabs */}
              <div className="border-b border-gray-100">
                <div className="p-4 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-text-dark">{selectedEmployee.name}</h3>
                    <p className="text-xs text-text-light">Employee Support & Reports</p>
                  </div>
                </div>
                <div className="flex px-4 gap-4 bg-white">
                  <button 
                    className={`py-3 px-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-text-light hover:text-text-dark'}`}
                    onClick={() => setActiveTab('chat')}
                  >
                    <MessageSquare size={16} /> Chat
                  </button>
                  <button 
                    className={`py-3 px-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'report' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-text-light hover:text-text-dark'}`}
                    onClick={() => setActiveTab('report')}
                  >
                    <FileText size={16} /> Today's Report
                  </button>
                  <button 
                    className={`py-3 px-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'all_reports' ? 'border-purple-500 text-purple-600' : 'border-transparent text-text-light hover:text-text-dark'}`}
                    onClick={() => setActiveTab('all_reports')}
                  >
                    <History size={16} /> All Reports
                  </button>
                </div>
              </div>
              
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bg-gray/30">
                    {groupedData[selectedEmployee.id]?.messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 text-sm rounded-2xl ${msg.sender === 'admin' ? 'bg-primary text-white rounded-br-sm' : 'bg-white border border-gray-200 text-text-dark rounded-bl-sm shadow-sm'}`}>
                          {msg.content}
                          <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${msg.sender === 'admin' ? 'text-primary-light/80' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            {msg.sender === 'admin' && (
                              <Check size={12} className={msg.isRead ? 'text-white' : 'opacity-50'} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-white">
                    <form onSubmit={handleReply} className="flex gap-2">
                      <input 
                        type="text" 
                        className="form-control flex-1 rounded-full px-5 py-2.5 text-sm"
                        placeholder={`Reply to ${selectedEmployee.name}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                      />
                      <button type="submit" disabled={!replyContent.trim()} className="w-11 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50">
                        <Send size={16} className="-ml-0.5" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'report' && (
                <div className="flex-1 overflow-y-auto p-6 bg-indigo-50/20">
                  {(() => {
                    const record = todayAttendance.find(a => (a.employee?._id || a.employee) === selectedEmployee.id);
                    if (!record) {
                      return <div className="text-center text-gray-400 text-sm mt-10">No attendance record found for today.</div>;
                    }
                    if (!record.dailyReport) {
                      return <div className="text-center text-orange-500 text-sm mt-10 p-6 border border-orange-200 bg-orange-50 rounded-xl max-w-md mx-auto"><strong>Report Pending</strong><br/>Employee has not submitted their daily report yet. They must submit it before punching out.</div>;
                    }
                    return (
                      <div className="max-w-3xl mx-auto">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h4 className="font-bold text-indigo-900 text-lg">Daily Summary</h4>
                            <div className="text-xs text-indigo-600 mt-1">
                              {new Date(record.updatedAt || record.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
                              <Check size={14} /> Submitted
                            </span>
                            <button onClick={() => handleDeleteReport(record._id)} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-full transition-colors flex items-center justify-center" title="Delete Report">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed shadow-sm">
                          {record.dailyReport}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'all_reports' && (
                <div className="flex-1 overflow-y-auto p-6 bg-purple-50/20">
                  {(() => {
                    const employeeReports = allAttendance.filter(a => 
                      (a.employee?._id || a.employee) === selectedEmployee.id && a.dailyReport
                    ).sort((a, b) => new Date(b.date) - new Date(a.date));

                    if (employeeReports.length === 0) {
                      return <div className="text-center text-gray-400 text-sm mt-10">No historical reports found for this employee.</div>;
                    }

                    return (
                      <div className="max-w-3xl mx-auto space-y-6">
                        {employeeReports.map(record => (
                          <div key={record._id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <h4 className="font-bold text-purple-900 text-lg">Report: {new Date(record.date).toLocaleDateString()}</h4>
                                <div className="text-xs text-purple-600 mt-1">
                                  Submitted: {new Date(record.updatedAt || record.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {record.dailyReport}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-text-light">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>Select a conversation to view messages & reports</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminNotifications;
