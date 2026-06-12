import re

with open('../frontend/src/components/PayslipModal.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace Input component definition with renderInput function
code = re.sub(
    r'const Input = \(\{ name, placeholder \}\) => \([\s\S]*?className="w-full bg-transparent border-b border-gray-300 focus:border-primary outline-none px-1 py-0\.5 text-sm"\s*\/>\s*\);',
    """const renderInput = (name, placeholder, pattern, title) => (
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
  );""",
    code
)

# Replace all <Input name="..." placeholder="..." />
code = re.sub(r'<Input name="([^"]+)" placeholder="([^"]+)" />', r"{renderInput('\1', '\2')}", code)
# Replace all <Input name="..." />
code = re.sub(r'<Input name="([^"]+)" />', r"{renderInput('\1')}", code)

# Inject validations
code = code.replace("{renderInput('panNo', 'PAN')}", "{renderInput('panNo', 'PAN', '[A-Z]{5}[0-9]{4}[A-Z]{1}', 'Format: ABCDE1234F')}")
code = code.replace("{renderInput('accountNumber', 'Acc No')}", "{renderInput('accountNumber', 'Acc No', '\\\\d{9,18}', 'Must be 9-18 digits')}")
code = code.replace("{renderInput('pfAccountNumber', 'PF No')}", "{renderInput('pfAccountNumber', 'PF No', '[a-zA-Z0-9]{10,25}', '10-25 alphanumeric characters')}")
code = code.replace("{renderInput('uanNumber', 'UAN')}", "{renderInput('uanNumber', 'UAN', '\\\\d{12}', 'UAN must be exactly 12 digits')}")

numericFields = ['basicAnnual', 'basicMonthly', 'basicArrear', 'basicTotal', 'hraAnnual', 'hraMonthly', 'hraArrear', 'hraTotal', 'specialAnnual', 'specialMonthly', 'specialArrear', 'specialTotal', 'conveyanceAnnual', 'conveyanceMonthly', 'conveyanceArrear', 'conveyanceTotal', 'clientAnnual', 'clientMonthly', 'clientArrear', 'clientTotal', 'totalEarningsAnnual', 'totalEarningsMonthly', 'totalEarningsArrear', 'totalEarningsTotal', 'pfDeduction', 'totalDeductions', 'netPay']

for field in numericFields:
    code = code.replace(f"{{renderInput('{field}')}}", f"{{renderInput('{field}', undefined, '^\\\\d+(\\\\.\\\\d{{1,2}})?$', 'Enter a valid number')}}")

with open('../frontend/src/components/PayslipModal.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("PayslipModal updated successfully via Python")
