import React, { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Download, FileText } from 'lucide-react';
import logo from '../../assets/multimaart-logo.png';

const AdminMoneyReceipt = () => {
  const receiptRef = useRef(null);
  
  const [formData, setFormData] = useState({
    refNo: `MM-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    receivedFrom: '',
    address: '',
    addressLine2: '',
    modeOfPayment: '',
    transactionId: '',
    declaration: 'We hereby acknowledge that a sum of ₹20,000/- (Rupees Twenty Thousand Only) has been received from the above-mentioned applicant as part payment towards the Multimaart Franchise Fee of ₹50,000/- plus applicable GST of ₹9,000/-. This amount is received against the franchise registration process and shall be adjusted against the total franchise fee payable. The applicant confirms that all information provided is true and correct.'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generatePDF = () => {
    // Generate pure HTML string with inline styles for precise PDF generation
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; background: white; min-height: 1050px; position: relative;">
        
        <!-- Header Gradient -->
        <div style="background: linear-gradient(to right, #e0f2fe, #3b82f6); padding: 20px; text-align: center; position: relative;">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.1; background: radial-gradient(circle, white 10%, transparent 80%);"></div>
          <div style="position: relative; z-index: 10;">
            <div style="background: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 10px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <img src="${logo}" alt="Logo" style="width: 50px; height: 50px; object-fit: contain;" />
            </div>
            <h1 style="margin: 0; font-size: 38px; color: #0284c7; font-style: italic; text-decoration: underline; text-decoration-color: #0284c7; text-decoration-thickness: 3px; letter-spacing: 1px;">Multimaart</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold; color: #1e293b;">--------E-Commerce Platform--------</p>
          </div>
        </div>

        <div style="padding: 30px 40px; padding-bottom: 120px;">
          <!-- Title -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h2 style="font-size: 22px; color: #1e40af; text-decoration: underline; display: inline-block; font-weight: bold;">MONEY RECEIPT</h2>
          </div>

          <!-- Ref and Date -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 16px; font-weight: 500;">
            <div>Ref- <span style="border-bottom: 1px solid #000; padding: 0 10px; min-width: 150px; display: inline-block;">${formData.refNo || '&nbsp;'}</span></div>
            <div>Date- <span style="border-bottom: 1px solid #000; padding: 0 10px; min-width: 150px; display: inline-block;">${formData.date ? new Date(formData.date).toLocaleDateString('en-GB') : '&nbsp;'}</span></div>
          </div>

          <!-- User Details -->
          <div style="margin-bottom: 30px; font-size: 16px; line-height: 2;">
            <div style="display: flex; align-items: flex-end; margin-bottom: 10px;">
              <span style="white-space: nowrap; margin-right: 10px;">We Multimaart received from</span>
              <span style="border-bottom: 1px solid #000; flex-grow: 1;">${formData.receivedFrom || '&nbsp;'}</span>
            </div>
            <div style="display: flex; align-items: flex-end; margin-bottom: 10px;">
              <span style="white-space: nowrap; margin-right: 10px;">Address</span>
              <span style="border-bottom: 1px solid #000; flex-grow: 1;">${formData.address || '&nbsp;'}</span>
            </div>
            <div style="display: flex; align-items: flex-end;">
              <span style="border-bottom: 1px solid #000; flex-grow: 1; width: 100%;">${formData.addressLine2 || '&nbsp;'}</span>
            </div>
          </div>

          <!-- Amount Info -->
          <div style="margin-bottom: 30px; font-size: 16px; line-height: 1.8;">
            <p style="margin: 0;">the sum of Rupees Twenty Thousand Only <span style="color: #1e40af; font-weight: bold;">(₹ 20,000/-)</span></p>
            <p style="margin: 0;">against Franchise Fee <span style="color: #1e40af; font-weight: bold;">(₹ 50,000 + ₹ 9,000 GST)</span>.</p>
          </div>

          <!-- Amount Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 16px;">
            <tr>
              <td style="width: 40%; background-color: #1e6bc6; color: white; padding: 10px; text-align: center; border: 1px solid #1e6bc6; font-weight: bold;">Amount Received</td>
              <td style="width: 60%; padding: 10px; text-align: center; border: 1px solid #64748b; font-weight: bold;">₹ 20,000/-</td>
            </tr>
          </table>

          <!-- Payment Details -->
          <div style="margin-bottom: 40px; font-size: 16px; line-height: 2;">
            <div style="display: flex; align-items: flex-end; margin-bottom: 10px;">
              <span style="width: 140px;">Mode of Payment</span>
              <span>:</span>
              <span style="border-bottom: 1px solid #000; width: 250px; margin-left: 10px; padding-left: 5px;">${formData.modeOfPayment || '&nbsp;'}</span>
            </div>
            <div style="display: flex; align-items: flex-end;">
              <span style="width: 140px;">Transaction ID</span>
              <span>:</span>
              <span style="border-bottom: 1px solid #000; width: 250px; margin-left: 10px; padding-left: 5px;">${formData.transactionId || '&nbsp;'}</span>
            </div>
          </div>

          <!-- Signatory -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 40px; text-align: center;">
            <div style="width: 250px;">
              <p style="color: #1e40af; font-weight: bold; margin-bottom: 60px;">For Multimaart</p>
              <div style="border-top: 1px solid #000; padding-top: 5px; font-size: 14px;">Authorized Signatory</div>
            </div>
          </div>

          <!-- Declaration -->
          <div style="text-align: center; margin-bottom: 15px;">
            <div style="display: flex; align-items: center; justify-content: center;">
              <div style="height: 1px; background-color: #94a3b8; flex-grow: 1; max-width: 150px;"></div>
              <span style="color: #1e40af; font-weight: bold; margin: 0 15px;">DECLARATION</span>
              <div style="height: 1px; background-color: #94a3b8; flex-grow: 1; max-width: 150px;"></div>
            </div>
            <p style="font-size: 14px; color: #333; margin-top: 15px; line-height: 1.5;">
              ${formData.declaration}
            </p>
            <p style="font-size: 14px; color: #1e40af; font-weight: 500; font-style: italic; margin-top: 15px;">
              Thank you for partnering with Multimaart.
            </p>
          </div>
        </div>

        <!-- Footer Gradient -->
        <div style="position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(to right, #60a5fa, #1e40af); padding: 20px 0; text-align: center; color: white;">
          <p style="margin: 0; font-size: 16px;">Address: 34/35,Sai Homes,Benupur,</p>
          <p style="margin: 5px 0 0 0; font-size: 16px;">Balianta,Bhubaneswar-752101</p>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const opt = {
      margin:       0,
      filename:     `MoneyReceipt_${formData.refNo || 'New'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().from(container).set(opt).save().then(() => {
      document.body.removeChild(container);
    });
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-dark">Franchise Money Receipt</h2>
          <p className="text-text-light text-sm mt-1">Generate official franchise fee receipts.</p>
        </div>
        <button onClick={generatePDF} className="btn btn-primary flex items-center gap-2">
          <Download size={18} /> Download Receipt PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText size={18} className="text-primary" /> Receipt Details
            </h3>
            
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
                <label className="block text-sm font-medium text-text-light mb-1">Address Line 1</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="input w-full" placeholder="Street Address" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-light mb-1">Address Line 2</label>
                <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="input w-full" placeholder="City, State, ZIP" />
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

        {/* Live Preview */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden sticky top-6 shadow-xl border border-gray-200">
            <div className="bg-gray-100 p-3 border-b border-gray-200 text-center font-medium text-gray-600 flex justify-between items-center">
              <span>PDF Live Preview</span>
            </div>
            
            <div className="overflow-x-auto p-4 bg-gray-50 flex justify-center">
               <div style={{ width: '800px', transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-100px' }} className="bg-white shadow-md relative min-h-[1050px]">
                  
                  {/* PREVIEW HTML (Identical to PDF output) */}
                  <div style={{ background: 'linear-gradient(to right, #e0f2fe, #3b82f6)', padding: '20px', textAlign: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, background: 'radial-gradient(circle, white 10%, transparent 80%)' }}></div>
                    <div style={{ position: 'relative', zIndex: 10 }}>
                      <div style={{ background: 'white', width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <img src={logo} alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                      </div>
                      <h1 style={{ margin: 0, fontSize: '38px', color: '#0284c7', fontStyle: 'italic', textDecoration: 'underline', textDecorationColor: '#0284c7', textDecorationThickness: '3px', letterSpacing: '1px' }}>Multimaart</h1>
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>--------E-Commerce Platform--------</p>
                    </div>
                  </div>

                  <div style={{ padding: '30px 40px', paddingBottom: '120px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                      <h2 style={{ fontSize: '22px', color: '#1e40af', textDecoration: 'underline', display: 'inline-block', fontWeight: 'bold' }}>MONEY RECEIPT</h2>
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
                        <span style={{ whiteSpace: 'nowrap', marginRight: '10px' }}>Address</span>
                        <span style={{ borderBottom: '1px solid #000', flexGrow: 1 }}>{formData.address || '\u00A0'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <span style={{ borderBottom: '1px solid #000', flexGrow: 1, width: '100%' }}>{formData.addressLine2 || '\u00A0'}</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '30px', fontSize: '16px', lineHeight: 1.8 }}>
                      <p style={{ margin: 0 }}>the sum of Rupees Twenty Thousand Only <span style={{ color: '#1e40af', fontWeight: 'bold' }}>(₹ 20,000/-)</span></p>
                      <p style={{ margin: 0 }}>against Franchise Fee <span style={{ color: '#1e40af', fontWeight: 'bold' }}>(₹ 50,000 + ₹ 9,000 GST)</span>.</p>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '16px' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '40%', backgroundColor: '#1e6bc6', color: 'white', padding: '10px', textAlign: 'center', border: '1px solid #1e6bc6', fontWeight: 'bold' }}>Amount Received</td>
                          <td style={{ width: '60%', padding: '10px', textAlign: 'center', border: '1px solid #64748b', fontWeight: 'bold' }}>₹ 20,000/-</td>
                        </tr>
                      </tbody>
                    </table>

                    <div style={{ marginBottom: '40px', fontSize: '16px', lineHeight: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '10px' }}>
                        <span style={{ width: '140px' }}>Mode of Payment</span>
                        <span>:</span>
                        <span style={{ borderBottom: '1px solid #000', width: '250px', marginLeft: '10px', paddingLeft: '5px' }}>{formData.modeOfPayment || '\u00A0'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <span style={{ width: '140px' }}>Transaction ID</span>
                        <span>:</span>
                        <span style={{ borderBottom: '1px solid #000', width: '250px', marginLeft: '10px', paddingLeft: '5px' }}>{formData.transactionId || '\u00A0'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px', textAlign: 'center' }}>
                      <div style={{ width: '250px' }}>
                        <p style={{ color: '#1e40af', fontWeight: 'bold', marginBottom: '60px' }}>For Multimaart</p>
                        <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontSize: '14px' }}>Authorized Signatory</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ height: '1px', backgroundColor: '#94a3b8', flexGrow: 1, maxWidth: '150px' }}></div>
                        <span style={{ color: '#1e40af', fontWeight: 'bold', margin: '0 15px' }}>DECLARATION</span>
                        <div style={{ height: '1px', backgroundColor: '#94a3b8', flexGrow: 1, maxWidth: '150px' }}></div>
                      </div>
                      <p style={{ fontSize: '14px', color: '#333', marginTop: '15px', lineHeight: 1.5 }}>
                        {formData.declaration}
                      </p>
                      <p style={{ fontSize: '14px', color: '#1e40af', fontWeight: 500, fontStyle: 'italic', marginTop: '15px' }}>
                        Thank you for partnering with Multimaart.
                      </p>
                    </div>
                  </div>

                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'linear-gradient(to right, #60a5fa, #1e40af)', padding: '20px 0', textAlign: 'center', color: 'white' }}>
                    <p style={{ margin: 0, fontSize: '16px' }}>Address: 34/35,Sai Homes,Benupur,</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '16px' }}>Balianta,Bhubaneswar-752101</p>
                  </div>

               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMoneyReceipt;
