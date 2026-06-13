import React, { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { Plus, Trash2, Download } from 'lucide-react';

const generateInvoiceNo = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${random}`;
};

const AdminBilling = () => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNo: generateInvoiceNo(),
    invoiceDate: new Date().toISOString().split('T')[0],
    paymentMode: '',
    placeOfSupply: 'Odisha (21)',
    customerName: '',
    mobileNumber: '',
    emailId: '',
    billingAddress: '',
    shippingAddress: '',
    gstin: ''
  });

  const [products, setProducts] = useState([
    { id: 1, name: '', rate: 0, gstPercent: 18 }
  ]);

  const invoiceRef = useRef();

  const handleInvoiceChange = (e) => {
    let { name, value } = e.target;

    if (name === 'mobileNumber') {
      value = value.replace(/\D/g, ''); // Allow only numbers
      if (value.startsWith('0')) {
        value = value.substring(1); // Do not allow starting with 0
      }
      if (value.length > 10) {
        value = value.substring(0, 10); // Max 10 digits
      }
    } else if (name === 'emailId') {
      value = value.toLowerCase(); // Ensure lowercase
    }

    setInvoiceData({ ...invoiceData, [name]: value });
  };

  const handleProductChange = (id, field, value) => {
    setProducts(products.map(p => {
      if (p.id === id) {
        if ((field === 'rate' || field === 'gstPercent') && parseFloat(value) < 0) {
          value = 0;
        }
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const preventNegative = (e) => {
    if (e.key === '-' || e.key === 'e' || e.key === '+') {
      e.preventDefault();
    }
  };

  const addProduct = () => {
    setProducts([...products, { id: Date.now(), name: '', rate: 0, gstPercent: 18 }]);
  };

  const removeProduct = (id) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // Calculations
  const calculations = products.map(p => {
    const rate = parseFloat(p.rate) || 0;
    const gstPercent = parseFloat(p.gstPercent) || 0;
    const gstAmount = (rate * gstPercent) / 100;
    const amount = rate + gstAmount;
    return { ...p, gstAmount, amount, rate };
  });

  const taxableAmount = calculations.reduce((sum, p) => sum + p.rate, 0);
  const totalGst = calculations.reduce((sum, p) => sum + p.gstAmount, 0);
  
  // Since Place of supply is Odisha, let's just do CGST and SGST half and half for simple representation, 
  // or just Total GST. We'll split it equally for CGST and SGST if it's within state, else IGST.
  const isOdisha = invoiceData.placeOfSupply.toLowerCase().includes('odisha');
  const cgst = isOdisha ? totalGst / 2 : 0;
  const sgst = isOdisha ? totalGst / 2 : 0;
  const igst = isOdisha ? 0 : totalGst;

  const subTotal = taxableAmount;
  
  const grandTotalExact = subTotal + totalGst;
  const grandTotal = Math.round(grandTotalExact);
  const roundOff = (grandTotal - grandTotalExact).toFixed(2);

  const generatePDF = () => {
    // Generate pure HTML string with inline styles just like PayslipModal
    // This avoids all Tailwind oklch parsing bugs and overflow clipping issues
    const htmlContent = `
      <div style="padding: 40px; font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; background: white;">
        <div style="text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; color: #222;">MONEY RECEIPT</h1>
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 5px; color: #222;">MULTIMAART E-COMMERCE PVT. LTD.</h2>
          <p style="font-size: 14px; color: #555; margin: 0;">Bhubaneswar, Odisha, India</p>
          <p style="font-size: 14px; color: #555; margin: 0;">Phone: +91 8658192230 | Email: info@multimaart.com</p>
          <p style="font-size: 14px; color: #555; margin: 0;">Website: www.multimaart.com</p>
          <p style="font-size: 14px; color: #555; margin-top: 5px;"><strong>GSTIN:</strong> 21ACHFM1903F1ZT | <strong>State:</strong> Odisha (02)</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div style="width: 48%;">
            <h3 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #222;">Bill Details</h3>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; font-weight: bold; width: 40%;">Invoice No.</td><td>${invoiceData.invoiceNo || '-'}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Invoice Date</td><td>${invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString() : '-'}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Payment Mode</td><td>${invoiceData.paymentMode || '-'}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Place of Supply</td><td>Odisha (02)</td></tr>
            </table>
          </div>
          <div style="width: 48%;">
            <h3 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #222;">Customer Details</h3>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; font-weight: bold; width: 40%;">Customer Name</td><td>${invoiceData.customerName || '-'}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Mobile Number</td><td>${invoiceData.mobileNumber || '-'}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Email ID</td><td>${invoiceData.emailId || '-'}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">Billing Address</td><td>${invoiceData.billingAddress || '-'}</td></tr>
              <tr><td style="padding: 4px 0; font-weight: bold;">GSTIN (If Any)</td><td>${invoiceData.gstin || '-'}</td></tr>
            </table>
          </div>
        </div>

        <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #222;">Product Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; text-align: center;">
          <thead>
            <tr style="background-color: #f1f1f1;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product Name</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Rate (₹)</th>
              <th style="border: 1px solid #ddd; padding: 8px;">GST %</th>
              <th style="border: 1px solid #ddd; padding: 8px;">GST Amount (₹)</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => {
              const rate = parseFloat(p.rate || 0);
              const gstPercent = parseFloat(p.gstPercent || 0);
              const gstAmount = rate * gstPercent / 100;
              const total = rate + gstAmount;
              return `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${p.name || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${rate.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${gstPercent}%</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${gstAmount.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${total.toFixed(2)}</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
          <table style="width: 300px; font-size: 14px; border-collapse: collapse;">
            <tr><td style="padding: 6px; border-bottom: 1px solid #eee;">Total Taxable Value:</td><td style="padding: 6px; text-align: right; border-bottom: 1px solid #eee;">₹${taxableAmount.toFixed(2)}</td></tr>
            <tr><td style="padding: 6px; border-bottom: 1px solid #eee;">Total GST Amount:</td><td style="padding: 6px; text-align: right; border-bottom: 1px solid #eee;">₹${totalGst.toFixed(2)}</td></tr>
            <tr><td style="padding: 6px; border-bottom: 1px solid #eee;">Round Off:</td><td style="padding: 6px; text-align: right; border-bottom: 1px solid #eee;">₹${roundOff}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; font-size: 16px; border-top: 2px solid #ccc; border-bottom: 2px solid #ccc; color: #222;">Grand Total:</td><td style="padding: 8px; font-weight: bold; font-size: 16px; text-align: right; border-top: 2px solid #ccc; border-bottom: 2px solid #ccc; color: #222;">₹${grandTotal.toFixed(2)}</td></tr>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 50px; margin-bottom: 20px;">
          <div style="text-align: center; width: 200px;">
            <p style="font-size: 14px; font-weight: bold; margin: 0; color: #333;">Customer Signature</p>
          </div>
        </div>

        <div style="margin-top: 20px; font-size: 12px; color: #777; font-style: italic; border-top: 1px solid #eee; padding-top: 15px; text-align: center;">
          Note: This is a system generated invoice.
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const opt = {
      margin:       0,
      filename:     `Invoice_${invoiceData.invoiceNo || 'New'}.pdf`,
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
          <h2 className="text-2xl font-bold text-text-dark">Generate Billing</h2>
          <p className="text-text-light text-sm mt-1">Create and download tax invoices.</p>
        </div>
        <button onClick={generatePDF} className="btn btn-primary flex items-center gap-2">
          <Download size={18} /> Download PDF
        </button>
      </div>

      <div className="card w-full max-w-4xl mx-auto overflow-x-auto">
        <div ref={invoiceRef} id="invoice-capture" className="p-4 md:p-8 bg-white text-gray-800 w-full min-w-[800px]" style={{ fontFamily: 'Arial, sans-serif' }}>
          
          {/* Header */}
          <div className="text-center border-b pb-6 mb-6">
            <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">TAX BILLING INVOICE</h1>
            <h2 className="text-xl font-bold mb-1">MULTIMAART E-COMMERCE PVT. LTD.</h2>
            <p className="text-sm text-gray-600">Bhubaneswar, Odisha, India</p>
            <p className="text-sm text-gray-600">Phone: +91 8658192230 | Email: info@multimaart.com</p>
            <p className="text-sm text-gray-600">Website: www.multimaart.com</p>
            <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">GSTIN:</span>21ACHFM1903F1ZT | <span className="font-semibold">State:</span> Odisha (02)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Bill Details */}
            <div>
              <h3 className="font-bold text-lg mb-3 border-b pb-1">Bill Details</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 font-semibold w-1/3">Invoice No.</td>
                    <td className="py-1"><input type="text" name="invoiceNo" value={invoiceData.invoiceNo} onChange={handleInvoiceChange} className="border-b border-gray-300 focus:outline-none w-full" /></td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Invoice Date</td>
                    <td className="py-1"><input type="date" name="invoiceDate" value={invoiceData.invoiceDate} onChange={handleInvoiceChange} className="border-b border-gray-300 focus:outline-none w-full" /></td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Payment Mode</td>
                    <td className="py-1"><input type="text" name="paymentMode" value={invoiceData.paymentMode} onChange={handleInvoiceChange} className="border-b border-gray-300 focus:outline-none w-full" /></td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Place of Supply</td>
                    <td className="py-1"><input type="text" name="placeOfSupply" value={invoiceData.placeOfSupply} onChange={handleInvoiceChange} className="border-b border-gray-300 focus:outline-none w-full" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Customer Details */}
            <div>
              <h3 className="font-bold text-lg mb-3 border-b pb-1">Customer Details</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 font-semibold w-1/3">Customer Name</td>
                    <td className="py-1"><input type="text" name="customerName" value={invoiceData.customerName} onChange={handleInvoiceChange} className="border-b border-gray-300 focus:outline-none w-full" /></td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Mobile Number</td>
                    <td className="py-1"><input type="text" name="mobileNumber" value={invoiceData.mobileNumber} onChange={handleInvoiceChange} className="border-b border-gray-300 focus:outline-none w-full" placeholder="10-digit number" /></td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Email ID</td>
                    <td className="py-1"><input type="email" name="emailId" value={invoiceData.emailId} onChange={handleInvoiceChange} className="border-b border-gray-300 focus:outline-none w-full" placeholder="customer@example.com" /></td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold align-top">Billing Address</td>
                    <td className="py-1"><textarea name="billingAddress" value={invoiceData.billingAddress} onChange={handleInvoiceChange} className="border-b border-gray-300 focus:outline-none w-full resize-none h-8" /></td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold align-top">Shipping Address</td>
                    <td className="py-1"><textarea name="shippingAddress" value={invoiceData.shippingAddress} onChange={handleInvoiceChange} className="border-b border-gray-300 focus:outline-none w-full resize-none h-8" /></td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">GSTIN (If Any)</td>
                    <td className="py-1"><input type="text" name="gstin" value={invoiceData.gstin} onChange={handleInvoiceChange} className="border-b border-gray-300 focus:outline-none w-full" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Details */}
          <h3 className="font-bold text-lg mb-3">Product Details</h3>
          <table className="w-full text-sm border-collapse border border-gray-300 mb-4 text-center">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-2 text-left">Product Name</th>
                <th className="border border-gray-300 p-2 w-24">Rate (₹)</th>
                <th className="border border-gray-300 p-2 w-20">GST %</th>
                <th className="border border-gray-300 p-2 w-28">GST Amt (₹)</th>
                <th className="border border-gray-300 p-2 w-28">Amount (₹)</th>
                <th className="border border-gray-300 p-2 w-10 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {calculations.map((p, index) => (
                <tr key={p.id}>
                  <td className="border border-gray-300 p-1 text-left">
                    <input type="text" value={p.name} onChange={(e) => handleProductChange(p.id, 'name', e.target.value)} className="w-full p-1 focus:outline-none" placeholder="Item Name" />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input type="number" min="0" onKeyDown={preventNegative} value={p.rate === 0 ? '' : p.rate} onChange={(e) => handleProductChange(p.id, 'rate', e.target.value)} className="w-full p-1 focus:outline-none text-center" placeholder="0" />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input type="number" min="0" onKeyDown={preventNegative} value={p.gstPercent} onChange={(e) => handleProductChange(p.id, 'gstPercent', e.target.value)} className="w-full p-1 focus:outline-none text-center" />
                  </td>
                  <td className="border border-gray-300 p-2 bg-gray-50">{p.gstAmount.toFixed(2)}</td>
                  <td className="border border-gray-300 p-2 bg-gray-50 font-medium">{p.amount.toFixed(2)}</td>
                  <td className="border border-gray-300 p-1 print:hidden">
                    <button onClick={() => removeProduct(p.id)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mb-8 print:hidden">
            <button onClick={addProduct} className="text-primary font-medium flex items-center gap-1 hover:underline text-sm">
              <Plus size={16} /> Add Product
            </button>
          </div>

          {/* Tax Summary */}
          <h3 className="font-bold text-lg mb-3">Tax Summary</h3>
          <table className="w-full text-sm border-collapse border border-gray-300 mb-8 text-center">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-2">Taxable Amount (₹)</th>
                <th className="border border-gray-300 p-2">CGST (₹)</th>
                <th className="border border-gray-300 p-2">SGST (₹)</th>
                <th className="border border-gray-300 p-2">IGST (₹)</th>
                <th className="border border-gray-300 p-2">Total Tax (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">{taxableAmount.toFixed(2)}</td>
                <td className="border border-gray-300 p-2">{cgst.toFixed(2)}</td>
                <td className="border border-gray-300 p-2">{sgst.toFixed(2)}</td>
                <td className="border border-gray-300 p-2">{igst.toFixed(2)}</td>
                <td className="border border-gray-300 p-2 font-medium">{totalGst.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Amount Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-full md:w-1/2">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 font-semibold text-right pr-4">Sub Total :</td>
                    <td className="py-1 w-32 font-medium">₹ {subTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold text-right pr-4">GST :</td>
                    <td className="py-1 w-32">₹ {totalGst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold text-right pr-4">Round Off :</td>
                    <td className="py-1 w-32">₹ {roundOff}</td>
                  </tr>
                  <tr className="border-t-2 border-black text-lg">
                    <td className="py-2 font-bold text-right pr-4">Grand Total :</td>
                    <td className="py-2 font-bold">₹ {grandTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 mt-6 flex justify-end">
            <div className="w-1/3 text-center pt-8">
              <p className="text-sm font-semibold">Customer Signature</p>
            </div>
          </div>
          
          <div className="mt-16 text-center border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 italic font-semibold">Note: This is a system generated invoice.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminBilling;
