import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, FileText, CheckCircle } from 'lucide-react';

const EmployeeMessages = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const employeeId = sessionStorage.getItem('employeeObjId');
  const messagesEndRef = useRef(null);

  const [reportContent, setReportContent] = useState('');
  const [reportStatus, setReportStatus] = useState('pending');
  const [wordCount, setWordCount] = useState(0);

  const getEmployeeId = async () => {
    let id = sessionStorage.getItem('employeeObjId');
    return id;
  };

  const fetchMessagesAndReport = async () => {
    const id = await getEmployeeId();
    if (!id) return;
    try {
      const [msgRes, attRes] = await Promise.all([
        axios.get(`/api/messages/employee/${id}`),
        axios.get('/api/employee/attendance/today')
      ]);
      setMessages(msgRes.data);
      
      if (attRes.data?.dailyReport) {
        setReportContent(attRes.data.dailyReport);
        setReportStatus('submitted');
        setWordCount(attRes.data.dailyReport.trim().split(/\s+/).filter(w => w.length > 0).length);
      }
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessagesAndReport();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const id = await getEmployeeId();
    try {
      const res = await axios.post(`/api/messages/employee/${id}`, {
        content: newMessage
      });
      setMessages([...messages, res.data]);
      setNewMessage('');
    } catch (error) {
      alert('Failed to send message');
    }
  };

  const handleReportChange = (e) => {
    if (reportStatus === 'submitted') return;
    const val = e.target.value;
    setReportContent(val);
    const words = val.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (wordCount < 50) return alert('Report must be at least 50 words.');
    try {
      await axios.post('/api/employee/daily-report', { reportContent });
      setReportStatus('submitted');
      alert('Daily report submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit report. Make sure you are punched in.');
    }
  };

  if (loading) return <div className="p-8 text-center text-text-light">Loading...</div>;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-60px)] bg-gray-50 overflow-hidden">
      {/* Left Section: Messages */}
      <div className="flex-1 flex flex-col border-r border-gray-200 h-full">
        <div className="p-4 bg-white shadow-sm border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">HR</div>
          <div>
            <h2 className="font-semibold text-text-dark">HR Support</h2>
            <p className="text-xs text-text-light">Admin is typically online 9AM-6PM</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-text-light text-sm mt-10">Send a message to HR Support.</div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'employee' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.sender === 'employee' ? 'bg-primary text-white rounded-br-sm' : 'bg-white border border-gray-100 text-text-dark rounded-bl-sm shadow-sm'}`}>
                  {msg.content}
                  <div className={`text-[10px] mt-1 text-right ${msg.sender === 'employee' ? 'text-primary-light/80' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-2 relative">
            <input 
              type="text" 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" disabled={!newMessage.trim()} className="absolute right-1 top-1 bottom-1 w-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={16} className="-ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Section: Daily Report */}
      <div className="w-full md:w-1/3 flex flex-col bg-white h-full border-l border-gray-200">
        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-indigo-900">Daily Report</h2>
            <p className="text-xs text-indigo-700">Submit before punching out</p>
          </div>
        </div>
        
        <div className="flex-1 p-5 overflow-y-auto">
          <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <strong>Instructions:</strong> Please write a comprehensive summary of your tasks for today. You can mention both first-half and second-half activities. The report must be <strong>at least 50 words</strong>. You cannot punch out without submitting this.
          </div>

          <form onSubmit={handleReportSubmit} className="flex flex-col h-[calc(100%-120px)]">
            <textarea
              className={`flex-1 w-full p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 transition-all ${
                reportStatus === 'submitted' 
                  ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed' 
                  : 'bg-white border-gray-300 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
              placeholder="Describe your whole day's work here... e.g. First half: Completed X. Second half: Worked on Y..."
              value={reportContent}
              onChange={handleReportChange}
              readOnly={reportStatus === 'submitted'}
            />
            
            <div className="flex justify-between items-center mt-3 mb-4">
              <span className={`text-xs font-semibold ${wordCount < 50 ? 'text-red-500' : 'text-green-600'}`}>
                {wordCount} / 50 words {wordCount < 50 ? '(minimum)' : '(met)'}
              </span>
              {reportStatus === 'submitted' && (
                <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                  <CheckCircle size={16} /> Submitted
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={reportStatus === 'submitted' || wordCount < 50}
              className={`w-full py-3 rounded-lg font-bold shadow-md transition-all flex justify-center items-center gap-2 ${
                reportStatus === 'submitted'
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : wordCount < 50
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
              }`}
            >
              {reportStatus === 'submitted' ? (
                <>Report Locked & Submitted</>
              ) : (
                <>Submit Daily Report</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeMessages;
