import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import { Download, FileText, History, Edit, Trash2, PlusCircle } from 'lucide-react';
import logo from '../../assets/multimaart-logo.png';

const AdminMoneyReceipt = () => {
  const defaultDeclaration = 'We hereby acknowledge that a sum of ₹20,000/- (Rupees Twenty Thousand Only) has been received from the above-mentioned applicant as part payment towards the Multimaart Franchise Fee of ₹50,000/- plus applicable GST of ₹9,000/-. This amount is received against the franchise registration process and shall be adjusted against the total franchise fee payable. The applicant confirms that all information provided is true and correct.';

  const blankForm = () => ({
    refNo: `MM-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    receivedFrom: '',
    contactNumber: '',
    address: '',
    addressLine2: '',
    amountNumber: '20,000',
    amountWords: 'Rupees Twenty Thousand Only',
    modeOfPayment: '',
    transactionId: '',
    declaration: defaultDeclaration,
  });

  const [formData, setFormData] = useState(blankForm());
  const [activeTab, setActiveTab] = useState('form');
  const [receipts, setReceipts] = useState([]);

  const fetchReceipts = async () => {
    try {
      const res = await axios.get('/api/admin/receipts');
      setReceipts(res.data);
    } catch (err) {
      console.error('Failed to fetch receipts', err);
    }
  };

  useEffect(() => { fetchReceipts(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => { setFormData(blankForm()); setActiveTab('form'); };

  const handleEdit = (receipt) => {
    setFormData({ ...receipt, date: new Date(receipt.date).toISOString().split('T')[0] });
    setActiveTab('form');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try { await axios.delete(`/api/admin/receipts/${id}`); fetchReceipts(); }
      catch (err) { alert('Failed to delete receipt'); }
    }
  };

  const generatePDF = async () => {
    try {
      const res = await axios.post('/api/admin/receipts', formData);
      if (!formData._id) setFormData(prev => ({ ...prev, _id: res.data._id }));
      fetchReceipts();
    } catch (err) {
      console.error('Failed to save receipt', err);
    }

    const htmlContent = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;color:#333;max-width:800px;margin:0 auto;background:white;">
        <div style="background:linear-gradient(to right,#e0f2fe,#3b82f6);padding:20px 40px;display:flex;align-items:center;">
          <div style="background:white;width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 6px rgba(0,0,0,0.1);margin-right:25px;">
            <img src="${logo}" alt="Logo" style="width:55px;height:55px;object-fit:contain;" />
          </div>
          <div>
            <h1 style="margin:0;font-size:34px;color:#0284c7;font-style:italic;text-decoration:underline;">Multimaart</h1>
            <p style="margin:5px 0 0 0;font-size:14px;font-weight:bold;color:#1e293b;">--------E-Commerce Platform--------</p>
          </div>
        </div>
        <div style="padding:20px 40px 0 40px;">
          <div style="text-align:center;margin-bottom:30px;">
            <h2 style="font-size:22px;color:#1e40af;text-decoration:underline;font-weight:bold;">MONEY RECEIPT</h2>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:30px;font-size:16px;font-weight:500;">
            <div>Ref- <span style="border-bottom:1px solid #000;padding:0 10px;min-width:150px;display:inline-block;">${formData.refNo || '&nbsp;'}</span></div>
            <div>Date- <span style="border-bottom:1px solid #000;padding:0 10px;min-width:150px;display:inline-block;">${formData.date ? new Date(formData.date).toLocaleDateString('en-GB') : '&nbsp;'}</span></div>
          </div>
          <div style="margin-bottom:30px;font-size:16px;line-height:2;">
            <div style="display:flex;align-items:flex-end;margin-bottom:10px;">
              <span style="white-space:nowrap;margin-right:10px;">We Multimaart received from</span>
              <span style="border-bottom:1px solid #000;flex-grow:1;">${formData.receivedFrom || '&nbsp;'}</span>
            </div>
            <div style="display:flex;align-items:flex-end;margin-bottom:10px;">
              <span style="white-space:nowrap;margin-right:10px;">Contact No.</span>
              <span style="border-bottom:1px solid #000;flex-grow:1;">${formData.contactNumber || '&nbsp;'}</span>
            </div>
            <div style="display:flex;align-items:flex-end;margin-bottom:10px;">
              <span style="white-space:nowrap;margin-right:10px;">Address</span>
              <span style="border-bottom:1px solid #000;flex-grow:1;">${formData.address || '&nbsp;'}</span>
            </div>
            <div style="display:flex;align-items:flex-end;">
              <span style="border-bottom:1px solid #000;flex-grow:1;width:100%;">${formData.addressLine2 || '&nbsp;'}</span>
            </div>
          </div>
          <div style="margin-bottom:30px;font-size:16px;line-height:1.8;">
            <p style="margin:0;">the sum of ${formData.amountWords || '&nbsp;'} <span style="color:#1e40af;font-weight:bold;">(₹ ${formData.amountNumber || '&nbsp;'}/-)</span></p>
            <p style="margin:0;">against Franchise Fee <span style="color:#1e40af;font-weight:bold;">(₹ 50,000 + ₹ 9,000 GST)</span>.</p>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:30px;font-size:16px;">
            <tr>
              <td style="width:40%;background-color:#1e6bc6;color:white;padding:10px;text-align:center;border:1px solid #1e6bc6;font-weight:bold;">Amount Received</td>
              <td style="width:60%;padding:10px;text-align:center;border:1px solid #64748b;font-weight:bold;">₹ ${formData.amountNumber || '&nbsp;'}/-</td>
            </tr>
          </table>
          <div style="margin-bottom:40px;font-size:16px;line-height:2;">
            <div style="display:flex;align-items:flex-end;margin-bottom:10px;">
              <span style="width:140px;">Mode of Payment</span><span>:</span>
              <span style="border-bottom:1px solid #000;width:250px;margin-left:10px;">${formData.modeOfPayment || '&nbsp;'}</span>
            </div>
            <div style="display:flex;align-items:flex-end;">
              <span style="width:140px;">Transaction ID</span><span>:</span>
              <span style="border-bottom:1px solid #000;width:250px;margin-left:10px;">${formData.transactionId || '&nbsp;'}</span>
            </div>
          </div>
          <div style="text-align:center;margin-bottom:15px;">
            <div style="display:flex;align-items:center;justify-content:center;">
              <div style="height:1px;background-color:#94a3b8;flex-grow:1;max-width:150px;"></div>
              <span style="color:#1e40af;font-weight:bold;margin:0 15px;">DECLARATION</span>
              <div style="height:1px;background-color:#94a3b8;flex-grow:1;max-width:150px;"></div>
            </div>
            <p style="font-size:14px;color:#333;margin-top:15px;line-height:1.5;">${formData.declaration}</p>
            <p style="font-size:14px;color:#1e40af;font-weight:500;font-style:italic;margin-top:15px;">Thank you for partnering with Multimaart.</p>
            <div style="margin-top:30px;font-size:12px;color:#777;font-style:italic;border-top:1px solid #eee;padding-top:15px;">
              Note: This is a system generated invoice and does not require any signature.
            </div>
          </div>
        </div>
        <div style="background:linear-gradient(to right,#60a5fa,#1e40af);padding:15px 0;text-align:center;color:white;">
          <p style="margin:0;font-size:14px;">Address: 34/35,Sai Homes,Benupur,</p>
          <p style="margin:5px 0 0 0;font-size:14px;">Balianta,Bhubaneswar-752101</p>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const opt = {
      margin: 0,
      filename: `MoneyReceipt_${formData.refNo || 'New'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    html2pdf().from(container).set(opt).save().then(() => {
      document.body.removeChild(container);
    });
  };

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-dark">Franchise Money Receipt</h2>
          <p className="text-text-light text-sm mt-1">Generate official franchise fee receipts.</p>
        </div>
        <div className="flex gap-3">
          <button
            className={`btn flex items-center gap-2 ${activeTab === 'form' ? 'btn-primary' : 'bg-gray-100 text-text-dark'}`}
            onClick={() => setActiveTab('form')}
          >
            <PlusCircle size={18} /> Receipt Editor
          </button>
          <button
            className={`btn flex items-center gap-2 ${activeTab === 'history' ? 'btn-primary' : 'bg-gray-100 text-text-dark'}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} /> History
          </button>
        </div>
      </div>

      {/* History Tab */}
      {activeTab === 'history' ? (
        <div className="card shadow-md p-0 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-text-dark">Generated Receipts</h3>
            <button onClick={resetForm} className="btn btn-primary text-sm flex items-center gap-1">
              <PlusCircle size={14} /> Create New
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Date</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Ref No</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Received From</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase">Amount</th>
                  <th className="p-4 text-xs font-semibold text-text-light uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receipts.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-text-light">No receipts generated yet.</td></tr>
                ) : (
                  receipts.map(receipt => (
                    <tr key={receipt._id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-text-dark">{new Date(receipt.date).toLocaleDateString('en-GB')}</td>
                      <td className="p-4 text-sm font-medium text-text-dark">{receipt.refNo}</td>
                      <td className="p-4 text-sm text-text-dark">{receipt.receivedFrom}</td>
                      <td className="p-4 text-sm font-semibold text-primary">₹ {receipt.amountNumber}/-</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(receipt)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(receipt._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Form + Preview Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText size={18} className="text-primary" /> Receipt Details
                </h3>
                {formData._id && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">Editing</span>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">Reference No.</label>
                  <input type="text" name="refNo" value={formData.refNo} onChange={handleChange} className="input w-full" placeholder="e.g. MM-4355" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">Received From</label>
                  <input type="text" name="receivedFrom" value={formData.receivedFrom} onChange={handleChange} className="input w-full" placeholder="Applicant Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">Contact Number</label>
                  <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="input w-full" placeholder="Phone Number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">Address Line 1</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className="input w-full" placeholder="Street Address" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">Address Line 2</label>
                  <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="input w-full" placeholder="City, State, ZIP" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">Amount (Numbers)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 font-medium">₹</span>
                    <input type="text" name="amountNumber" value={formData.amountNumber} onChange={handleChange} className="input w-full pl-8" placeholder="20,000" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">Amount (Words)</label>
                  <input type="text" name="amountWords" value={formData.amountWords} onChange={handleChange} className="input w-full" placeholder="Rupees Twenty Thousand Only" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">Mode of Payment</label>
                  <input type="text" name="modeOfPayment" value={formData.modeOfPayment} onChange={handleChange} className="input w-full" placeholder="Cash, UPI, NEFT..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light mb-1">Transaction ID</label>
                  <input type="text" name="transactionId" value={formData.transactionId} onChange={handleChange} className="input w-full" placeholder="Transaction Ref No." />
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText size={18} className="text-primary" /> Declaration Settings
              </h3>
              <div>
                <label className="block text-sm font-medium text-text-light mb-1">Declaration Text</label>
                <textarea
                  name="declaration"
                  value={formData.declaration}
                  onChange={handleChange}
                  className="input w-full h-40 resize-none text-sm"
                />
                <p className="text-xs text-gray-400 mt-2">You can edit the default declaration text if needed.</p>
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:col-span-2">
            <div className="card p-0 overflow-hidden sticky top-6 shadow-xl border border-gray-200">
              <div className="bg-gray-100 p-3 border-b border-gray-200 font-medium text-gray-600 flex justify-between items-center">
                <span>PDF Live Preview</span>
                <button onClick={generatePDF} className="btn btn-primary py-1.5 px-3 text-sm flex items-center gap-2">
                  <Download size={16} /> {formData._id ? 'Update & Download' : 'Save & Download'}
                </button>
              </div>
              <div className="overflow-x-auto p-4 bg-gray-50 flex justify-center">
                <div style={{ width: '800px', transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-100px' }} className="bg-white shadow-md">
                  {/* Preview Header */}
                  <div style={{ background: 'linear-gradient(to right,#e0f2fe,#3b82f6)', padding: '20px 40px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ background: 'white', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginRight: '25px' }}>
                      <img src={logo} alt="Logo" style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <h1 style={{ margin: 0, fontSize: '34px', color: '#0284c7', fontStyle: 'italic', textDecoration: 'underline' }}>Multimaart</h1>
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>--------E-Commerce Platform--------</p>
                    </div>
                  </div>

                  <div style={{ padding: '20px 40px 0 40px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                      <h2 style={{ fontSize: '22px', color: '#1e40af', textDecoration: 'underline', fontWeight: 'bold' }}>MONEY RECEIPT</h2>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '16px', fontWeight: 500 }}>
                      <div>Ref- <span style={{ borderBottom: '1px solid #000', padding: '0 10px', minWidth: '150px', display: 'inline-block' }}>{formData.refNo || '\u00A0'}</span></div>
                      <div>Date- <span style={{ borderBottom: '1px solid #000', padding: '0 10px', minWidth: '150px', display: 'inline-block' }}>{formData.date ? new Date(formData.date).toLocaleDateString('en-GB') : '\u00A0'}</span></div>
                    </div>
                    <div style={{ marginBottom: '30px', fontSize: '16px', lineHeight: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '10px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '10px' }}>We Multimaart received from</span>
                        <span style={{ borderBottom: '1px solid #000', flexGrow: 1 }}>{formData.receivedFrom || '\u00A0'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '10px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '10px' }}>Contact No.</span>
                        <span style={{ borderBottom: '1px solid #000', flexGrow: 1 }}>{formData.contactNumber || '\u00A0'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '10px' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '10px' }}>Address</span>
                        <span style={{ borderBottom: '1px solid #000', flexGrow: 1 }}>{formData.address || '\u00A0'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <span style={{ borderBottom: '1px solid #000', flexGrow: 1 }}>{formData.addressLine2 || '\u00A0'}</span>
                      </div>
                    </div>
                    <div style={{ marginBottom: '30px', fontSize: '16px', lineHeight: 1.8 }}>
                      <p style={{ margin: 0 }}>the sum of {formData.amountWords || '\u00A0'} <span style={{ color: '#1e40af', fontWeight: 'bold' }}>(₹ {formData.amountNumber || '\u00A0'}/-)</span></p>
                      <p style={{ margin: 0 }}>against Franchise Fee <span style={{ color: '#1e40af', fontWeight: 'bold' }}>(₹ 50,000 + ₹ 9,000 GST)</span>.</p>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '16px' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '40%', backgroundColor: '#1e6bc6', color: 'white', padding: '10px', textAlign: 'center', border: '1px solid #1e6bc6', fontWeight: 'bold' }}>Amount Received</td>
                          <td style={{ width: '60%', padding: '10px', textAlign: 'center', border: '1px solid #64748b', fontWeight: 'bold' }}>₹ {formData.amountNumber || '\u00A0'}/-</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ marginBottom: '40px', fontSize: '16px', lineHeight: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '10px' }}>
                        <span style={{ width: '140px' }}>Mode of Payment</span>
                        <span>:</span>
                        <span style={{ borderBottom: '1px solid #000', width: '250px', marginLeft: '10px' }}>{formData.modeOfPayment || '\u00A0'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <span style={{ width: '140px' }}>Transaction ID</span>
                        <span>:</span>
                        <span style={{ borderBottom: '1px solid #000', width: '250px', marginLeft: '10px' }}>{formData.transactionId || '\u00A0'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ height: '1px', backgroundColor: '#94a3b8', flexGrow: 1, maxWidth: '150px' }}></div>
                        <span style={{ color: '#1e40af', fontWeight: 'bold', margin: '0 15px' }}>DECLARATION</span>
                        <div style={{ height: '1px', backgroundColor: '#94a3b8', flexGrow: 1, maxWidth: '150px' }}></div>
                      </div>
                      <p style={{ fontSize: '14px', color: '#333', marginTop: '15px', lineHeight: 1.5 }}>{formData.declaration}</p>
                      <p style={{ fontSize: '14px', color: '#1e40af', fontWeight: 500, fontStyle: 'italic', marginTop: '15px' }}>Thank you for partnering with Multimaart.</p>
                      <div style={{ marginTop: '30px', fontSize: '12px', color: '#777', fontStyle: 'italic', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        Note: This is a system generated invoice and does not require any signature.
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'linear-gradient(to right,#60a5fa,#1e40af)', padding: '15px 0', textAlign: 'center', color: 'white' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>Address: 34/35,Sai Homes,Benupur,</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Balianta,Bhubaneswar-752101</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMoneyReceipt;
