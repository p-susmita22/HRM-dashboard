import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, Send } from 'lucide-react';
import logo from '../assets/multimaart-logo.png';

const PayslipModal = ({ employee, onClose }) => {
  const [formData, setFormData] = useState({
    monthYear: '',
    panNo: '',
    accountNumber: '',
    pfAccountNumber: '',
    uanNumber: '',
    leavingDate: '',
    // Earnings
    basicAnnual: '', basicMonthly: '', basicArrear: '', basicTotal: '',
    hraAnnual: '', hraMonthly: '', hraArrear: '', hraTotal: '',
    specialAnnual: '', specialMonthly: '', specialArrear: '', specialTotal: '',
    conveyanceAnnual: '', conveyanceMonthly: '', conveyanceArrear: '', conveyanceTotal: '',
    clientAnnual: '', clientMonthly: '', clientArrear: '', clientTotal: '',
    totalEarningsAnnual: '', totalEarningsMonthly: '', totalEarningsArrear: '', totalEarningsTotal: '',
    // Deductions
    pfDeduction: '',
    totalDeductions: '',
    // Net
    netPay: '',
    netPayWords: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5006';
      await axios.post(`${API_URL}/api/admin/employees/${employee._id}/payslip`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Payslip saved and sent successfully to ' + employee.email);
      onClose();
    } catch (error) {
      console.error('Error sending payslip:', error);
      alert('Failed to send payslip');
    }
  };

  if (!employee) return null;

  const Input = ({ name, placeholder }) => (
    <input 
      type="text" 
      name={name}
      value={formData[name]}
      onChange={handleChange}
      placeholder={placeholder}
      required
      className="w-full bg-transparent border-b border-gray-300 focus:border-primary outline-none px-1 py-0.5 text-sm"
    />
  );

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 rounded-t-xl shrink-0">
          <h2 className="text-xl font-bold text-text-dark flex items-center gap-2">
            <Send size={20} className="text-primary" /> Send Payslip
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-status-absent transition-colors p-1">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSend} className="overflow-y-auto flex-1 flex flex-col custom-scrollbar">
          <div className="p-8 bg-white flex-1">
          {/* Payslip Document */}
          <div className="border border-gray-200 p-8 shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <img src={logo} alt="Multimaart Logo" className="h-12 mb-4 object-contain" />
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-gray-800">MULTIMAART</h1>
                <p className="text-sm text-gray-600">Bhubaneswar</p>
                <p className="text-sm text-gray-600">Odisha, India</p>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-lg font-bold border-b border-gray-300 inline-block pb-1 px-4">
                PAYSLIP FOR <input type="text" required name="monthYear" value={formData.monthYear} onChange={handleChange} placeholder="Month, Year" className="border-none outline-none font-bold text-center w-32 bg-gray-50" />
              </h2>
            </div>

            {/* Employee Information */}
            <table className="w-full border-collapse border border-gray-300 mb-8 text-sm">
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold bg-gray-50 w-1/4">Employee Name</td>
                  <td className="border border-gray-300 p-2 w-1/4">{employee.firstName} {employee.lastName}</td>
                  <td className="border border-gray-300 p-2 font-semibold bg-gray-50 w-1/4">PAN No</td>
                  <td className="border border-gray-300 p-2 w-1/4"><Input name="panNo" placeholder="PAN" /></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Employee Code</td>
                  <td className="border border-gray-300 p-2">{employee.employeeId}</td>
                  <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Gender</td>
                  <td className="border border-gray-300 p-2">{employee.gender || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Designation</td>
                  <td className="border border-gray-300 p-2">{employee.designation}</td>
                  <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Account Number</td>
                  <td className="border border-gray-300 p-2"><Input name="accountNumber" placeholder="Acc No" /></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Location</td>
                  <td className="border border-gray-300 p-2">{employee.region || 'Bhubaneswar'}</td>
                  <td className="border border-gray-300 p-2 font-semibold bg-gray-50">PF Account Number</td>
                  <td className="border border-gray-300 p-2"><Input name="pfAccountNumber" placeholder="PF No" /></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Joining Date</td>
                  <td className="border border-gray-300 p-2">{new Date(employee.joiningDate).toLocaleDateString()}</td>
                  <td className="border border-gray-300 p-2 font-semibold bg-gray-50">UAN Number</td>
                  <td className="border border-gray-300 p-2"><Input name="uanNumber" placeholder="UAN" /></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Leaving Date</td>
                  <td className="border border-gray-300 p-2"><Input name="leavingDate" placeholder="DD/MM/YYYY or N/A" /></td>
                  <td className="border border-gray-300 p-2 bg-gray-50"></td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>
              </tbody>
            </table>

            {/* Earnings */}
            <h3 className="font-bold text-gray-800 mb-2">EARNINGS</h3>
            <table className="w-full border-collapse border border-gray-300 mb-8 text-sm text-center">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Components</th>
                  <th className="border border-gray-300 p-2">Annual Rate</th>
                  <th className="border border-gray-300 p-2">Monthly</th>
                  <th className="border border-gray-300 p-2">Arrear</th>
                  <th className="border border-gray-300 p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 text-left">Basic</td>
                  <td className="border border-gray-300 p-1"><Input name="basicAnnual" /></td>
                  <td className="border border-gray-300 p-1"><Input name="basicMonthly" /></td>
                  <td className="border border-gray-300 p-1"><Input name="basicArrear" /></td>
                  <td className="border border-gray-300 p-1"><Input name="basicTotal" /></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-left">HRA</td>
                  <td className="border border-gray-300 p-1"><Input name="hraAnnual" /></td>
                  <td className="border border-gray-300 p-1"><Input name="hraMonthly" /></td>
                  <td className="border border-gray-300 p-1"><Input name="hraArrear" /></td>
                  <td className="border border-gray-300 p-1"><Input name="hraTotal" /></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-left">Special Allowance</td>
                  <td className="border border-gray-300 p-1"><Input name="specialAnnual" /></td>
                  <td className="border border-gray-300 p-1"><Input name="specialMonthly" /></td>
                  <td className="border border-gray-300 p-1"><Input name="specialArrear" /></td>
                  <td className="border border-gray-300 p-1"><Input name="specialTotal" /></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-left">Conveyance</td>
                  <td className="border border-gray-300 p-1"><Input name="conveyanceAnnual" /></td>
                  <td className="border border-gray-300 p-1"><Input name="conveyanceMonthly" /></td>
                  <td className="border border-gray-300 p-1"><Input name="conveyanceArrear" /></td>
                  <td className="border border-gray-300 p-1"><Input name="conveyanceTotal" /></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-left">Client Handling Incentive</td>
                  <td className="border border-gray-300 p-1"><Input name="clientAnnual" /></td>
                  <td className="border border-gray-300 p-1"><Input name="clientMonthly" /></td>
                  <td className="border border-gray-300 p-1"><Input name="clientArrear" /></td>
                  <td className="border border-gray-300 p-1"><Input name="clientTotal" /></td>
                </tr>
                <tr className="bg-gray-50 font-bold">
                  <td className="border border-gray-300 p-2 text-left">Total Earnings</td>
                  <td className="border border-gray-300 p-1"><Input name="totalEarningsAnnual" /></td>
                  <td className="border border-gray-300 p-1"><Input name="totalEarningsMonthly" /></td>
                  <td className="border border-gray-300 p-1"><Input name="totalEarningsArrear" /></td>
                  <td className="border border-gray-300 p-1"><Input name="totalEarningsTotal" /></td>
                </tr>
              </tbody>
            </table>

            {/* Deductions */}
            <h3 className="font-bold text-gray-800 mb-2">DEDUCTIONS</h3>
            <table className="w-full border-collapse border border-gray-300 mb-8 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left w-1/2">Components</th>
                  <th className="border border-gray-300 p-2 text-left w-1/2">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">PF</td>
                  <td className="border border-gray-300 p-1"><Input name="pfDeduction" /></td>
                </tr>
                <tr className="bg-gray-50 font-bold">
                  <td className="border border-gray-300 p-2">Total Deductions</td>
                  <td className="border border-gray-300 p-1"><Input name="totalDeductions" /></td>
                </tr>
              </tbody>
            </table>

            {/* Net Salary */}
            <h3 className="font-bold text-gray-800 mb-2">NET SALARY</h3>
            <table className="w-full border-collapse border border-gray-300 mb-8 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left w-1/2">Particulars</th>
                  <th className="border border-gray-300 p-2 text-left w-1/2">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-bold">Net Pay</td>
                  <td className="border border-gray-300 p-1"><Input name="netPay" /></td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-bold">Net Pay in Words</td>
                  <td className="border border-gray-300 p-1"><Input name="netPayWords" /></td>
                </tr>
              </tbody>
            </table>

            <div className="mt-12 mb-4 text-xs text-gray-500 italic border-t border-gray-200 pt-4">
              Note: This is a system generated payslip and does not require any signature.
            </div>
          </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-xl">
            <button type="button" onClick={onClose} className="btn bg-gray-200 text-gray-700 px-6">Cancel</button>
            <button type="submit" className="btn btn-primary px-8 flex items-center gap-2">
              <Send size={16} /> Send Payslip
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default PayslipModal;
