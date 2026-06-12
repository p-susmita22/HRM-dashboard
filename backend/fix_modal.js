import fs from 'fs';
let code = fs.readFileSync('../frontend/src/components/PayslipModal.jsx', 'utf8');

// Replace the Input component definition with renderInput function
code = code.replace(/const Input = \(\{ name, placeholder \}\) => \([\s\S]*?className="w-full bg-transparent border-b border-gray-300 focus:border-primary outline-none px-1 py-0\.5 text-sm"\s*\/>\s*\);/m, `const renderInput = (name, placeholder, pattern, title) => (
    <input 
      type="text" 
      name={name}
      value={formData[name]}
      onChange={handleChange}
      placeholder={placeholder}
      pattern={pattern}
      title={title}
      required
      className="w-full bg-transparent border-b border-gray-300 focus:border-primary outline-none px-1 py-0.5 text-sm"
    />
  );`);

// Replace all <Input name="..." placeholder="..." />
code = code.replace(/<Input name="([^"]+)" placeholder="([^"]+)" \/>/g, "{renderInput('$1', '$2')}");
// Replace all <Input name="..." />
code = code.replace(/<Input name="([^"]+)" \/>/g, "{renderInput('$1')}");

// Now let's inject validations for specific fields!
code = code.replace(/{renderInput\('panNo', 'PAN'\)}/g, "{renderInput('panNo', 'PAN', '[A-Z]{5}[0-9]{4}[A-Z]{1}', 'Format: ABCDE1234F')}");
code = code.replace(/{renderInput\('accountNumber', 'Acc No'\)}/g, "{renderInput('accountNumber', 'Acc No', '\\\\d{9,18}', 'Must be 9-18 digits')}");
code = code.replace(/{renderInput\('pfAccountNumber', 'PF No'\)}/g, "{renderInput('pfAccountNumber', 'PF No', '[a-zA-Z0-9]{10,25}', '10-25 alphanumeric characters')}");
code = code.replace(/{renderInput\('uanNumber', 'UAN'\)}/g, "{renderInput('uanNumber', 'UAN', '\\\\d{12}', 'UAN must be exactly 12 digits')}");

// For all earnings and deductions, add numeric validation
const numericFields = ['basicAnnual', 'basicMonthly', 'basicArrear', 'basicTotal', 'hraAnnual', 'hraMonthly', 'hraArrear', 'hraTotal', 'specialAnnual', 'specialMonthly', 'specialArrear', 'specialTotal', 'conveyanceAnnual', 'conveyanceMonthly', 'conveyanceArrear', 'conveyanceTotal', 'clientAnnual', 'clientMonthly', 'clientArrear', 'clientTotal', 'totalEarningsAnnual', 'totalEarningsMonthly', 'totalEarningsArrear', 'totalEarningsTotal', 'pfDeduction', 'totalDeductions', 'netPay'];
numericFields.forEach(field => {
  code = code.replace(new RegExp(`{renderInput\\('${field}'\\)}`, 'g'), `{renderInput('${field}', undefined, '^\\\\d+(\\\\.\\\\d{1,2})?$', 'Enter a valid number')}`);
});

fs.writeFileSync('../frontend/src/components/PayslipModal.jsx', code);
console.log('PayslipModal updated successfully');
