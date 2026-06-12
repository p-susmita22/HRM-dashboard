import html2pdf from 'html2pdf.js';
import logo from '../assets/multimaart-logo.png';

export const downloadPayslipPDF = (payslip, employee) => {
  const htmlContent = `
    <div style="padding: 40px; font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; background: white;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
        <div>
          <img src="${logo}" alt="Multimaart Logo" style="height: 50px; margin-bottom: 15px;" />
        </div>
        <div style="text-align: right;">
          <h1 style="margin: 0; font-size: 24px; color: #222;">MULTIMAART</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">Bhubaneswar</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">Odisha, India</p>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="font-size: 18px; border-bottom: 1px solid #ccc; display: inline-block; padding-bottom: 5px;">
          PAYSLIP FOR ${payslip.monthYear}
        </h2>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background: #f9f9f9; width: 25%;">Employee Name</td>
            <td style="border: 1px solid #ddd; padding: 8px; width: 25%;">${employee.firstName} ${employee.lastName}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background: #f9f9f9; width: 25%;">PAN No</td>
            <td style="border: 1px solid #ddd; padding: 8px; width: 25%;">${payslip.panNo || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background: #f9f9f9;">Employee Code</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${employee.employeeId}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background: #f9f9f9;">Gender</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${employee.gender || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background: #f9f9f9;">Designation</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${employee.designation}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background: #f9f9f9;">Account Number</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.accountNumber || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background: #f9f9f9;">Location</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${employee.region || 'Bhubaneswar'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background: #f9f9f9;">PF Account Number</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.pfAccountNumber || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background: #f9f9f9;">Joining Date</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${new Date(employee.joiningDate).toLocaleDateString()}</td>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background: #f9f9f9;">UAN Number</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.uanNumber || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; background: #f9f9f9;">Leaving Date</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.leavingDate || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px; background: #f9f9f9;"></td>
            <td style="border: 1px solid #ddd; padding: 8px;"></td>
          </tr>
        </tbody>
      </table>

      <h3 style="font-size: 16px; margin-bottom: 10px; color: #222;">EARNINGS</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; text-align: center;">
        <thead>
          <tr style="background: #f1f1f1;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Components</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Annual Rate</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Monthly</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Arrear</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">Basic</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.basicAnnual || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.basicMonthly || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.basicArrear || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.basicTotal || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">HRA</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.hraAnnual || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.hraMonthly || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.hraArrear || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.hraTotal || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">Special Allowance</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.specialAnnual || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.specialMonthly || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.specialArrear || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.specialTotal || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">Conveyance</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.conveyanceAnnual || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.conveyanceMonthly || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.conveyanceArrear || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.conveyanceTotal || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">Client Handling Incentive</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.clientAnnual || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.clientMonthly || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.clientArrear || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.clientTotal || '-'}</td>
          </tr>
          <tr style="background: #f9f9f9; font-weight: bold;">
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">Total Earnings</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.totalEarningsAnnual || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.totalEarningsMonthly || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.totalEarningsArrear || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.totalEarningsTotal || '-'}</td>
          </tr>
        </tbody>
      </table>

      <h3 style="font-size: 16px; margin-bottom: 10px; color: #222;">DEDUCTIONS</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
        <thead>
          <tr style="background: #f1f1f1;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 50%;">Components</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 50%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">PF</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.pfDeduction || '-'}</td>
          </tr>
          <tr style="background: #f9f9f9; font-weight: bold;">
            <td style="border: 1px solid #ddd; padding: 8px;">Total Deductions</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.totalDeductions || '-'}</td>
          </tr>
        </tbody>
      </table>

      <h3 style="font-size: 16px; margin-bottom: 10px; color: #222;">NET SALARY</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
        <thead>
          <tr style="background: #f1f1f1;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 50%;">Particulars</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 50%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Net Pay</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.netPay || '-'}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Net Pay in Words</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${payslip.netPayWords || '-'}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 40px; font-size: 12px; color: #777; font-style: italic; border-top: 1px solid #eee; padding-top: 15px;">
        Note: This is a system generated payslip and does not require any signature.
      </div>
    </div>
  `;

  // Create a hidden container to hold the HTML
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  // Configure html2pdf
  const opt = {
    margin:       0.5,
    filename:     `Payslip_${employee.firstName}_${payslip.monthYear}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  // Generate PDF and then remove container
  html2pdf().from(container).set(opt).save().then(() => {
    document.body.removeChild(container);
  });
};
