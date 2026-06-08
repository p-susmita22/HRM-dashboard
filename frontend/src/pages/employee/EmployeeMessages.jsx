import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send } from 'lucide-react';

const EmployeeMessages = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const employeeId = sessionStorage.getItem('employeeObjId'); // Wait, we need to ensure the ID is available.
  const messagesEndRef = useRef(null);

  // Fallback for ID if not in sessionStorage
  const getEmployeeId = async () => {
    let id = sessionStorage.getItem('employeeObjId');
    if (!id) {
      // Need a profile fetch or something if it wasn't saved on login
      // Actually, loginEmployee only saved 'token' and 'role'. We should update loginEmployee in frontend to save ID, or fetch profile here.
    }
    return id;
  };

  const fetchMessages = async () => {
    const id = await getEmployeeId();
    if (!id) return;
    try {
      const res = await axios.get(`/api/messages/employee/${id}`);
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
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

  if (loading) return <div className="p-8 text-center text-text-light">Loading messages...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-gray-50">
      <div className="p-4 bg-white shadow-sm border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">HR</div>
        <div>
          <h2 className="font-semibold text-text-dark">HR Support</h2>
          <p className="text-xs text-text-light">Admin is typically online 9AM-6PM</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
  );
};

export default EmployeeMessages;
