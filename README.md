# Financial Calculator

An advanced cash flow calculator to perform financial calculations such as present value (PV), future value (FV), payment (PMT), interest rates, and periods.

![Financial Calculator](https://github.com/fcamposcarvalho/financialcalculator/raw/main/financialcalculator.png)

## Features

- **Complete cash flow calculation**:
  - Present Value (PV)
  - Future Value (FV)
  - Payment (PMT)
  - Interest rate (i)
  - Number of periods (n)
- **Automatic sign inversion** to maintain financial coherence
- **Results caching** to improve performance
- **Calculation history** with capacity for the last 10 calculations
- **Advanced numerical methods** such as Newton-Raphson for rate calculation
- **Responsive interface** adapted to all screen sizes
- **Special case handling** for various financial scenarios
- **IRR (Internal Rate of Return)** calculation with multiple cash flows
- **MIRR (Modified Internal Rate of Return)** with financing and reinvestment rates
- **NPV (Net Present Value)** with adjustable discount rates
- **RPN Mode** (Reverse Polish Notation) for HP-style calculations
- **Amortization tables** with PRICE and SAC methods

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Modern UI/UX techniques
- Financial mathematical methods

## How to Use

### Installation

1. Clone this repository:
```bash
git clone https://github.com/fcamposcarvalho/financialcalculator.git
```
2. Open the `index.html` file in any modern browser

### Online Usage

Access the calculator directly at: [https://fcamposcarvalho.github.io/financialcalculator](https://fcamposcarvalho.github.io/financialcalculator)

### Integration in Other Sites

To add this calculator to your site:

1. Copy the `index.html` file
2. Copy all `.css` files (calculator.css, calculator_irr.css, calculator_mirr.css, calculator_npv.css)
3. Copy all `.js` files (financialcalculator.js, calculator.js, calculator_irr.js, calculator_mirr.js, calculator_npv.js)

## Usage Guide

1. **Select the value to calculate** from the dropdown menu
2. **Fill in the known fields**
3. **Click "Calculate"** to get the result
4. Use the **+/-** buttons to invert signs when necessary
5. View the **calculation history** by clicking the "History" button
6. Access advanced functions via **IRR**, **MIRR**, or **NPV** buttons

## Common Use Cases

### Calculating Loan Payments
- Enter the Present Value with the loan amount (positive)
- Set the number of periods
- Set the interest rate
- Set Future Value = 0
- Select "Payment (PMT)" from the dropdown menu
- Calculate

### Calculating Accumulation Time
- Enter the Present Value (initial investment)
- Enter the interest rate
- Enter the periodic contribution amount (PMT)
- Enter the desired future value
- Select "Periods (n)" from the dropdown menu
- Calculate

### Calculating IRR (Internal Rate of Return)
- Click the "IRR" button
- Enter the initial investment (negative)
- Add cash flow rows for each period
- Click "Calculate IRR"

## Mathematical Foundations

The calculator implements the following financial formulas:

- **Present Value (PV)**:
  - With PMT=0: `PV = FV / (1+i)^n`
  - General case: `PV = -PMT * (1-(1+i)^-n)/i - FV*(1+i)^-n`

- **Future Value (FV)**:
  - With PMT=0: `FV = PV * (1+i)^n`
  - General case: `FV = -PMT * ((1+i)^n-1)/i - PV*(1+i)^n`

- **Numerical Methods**:
  - Binary Search for period calculation
  - Newton-Raphson for rate calculation

## Project Structure

```
calculadorafinanceira/
│
├── index.html              # Main HTML file
├── financialcalculator.js  # Main financial calculation logic
├── calculator.js           # Calculator with ALG and RPN modes
├── calculator_irr.js       # IRR (Internal Rate of Return) module
├── calculator_mirr.js      # MIRR (Modified IRR) module
├── calculator_npv.js       # NPV (Net Present Value) module
├── calculator.css          # Main CSS styling
├── calculator_irr.css      # IRR modal styling
├── calculator_mirr.css     # MIRR modal styling
├── calculator_npv.css      # NPV modal styling
├── financialcalculator.png # Calculator screenshot
└── README.md               # This file
```

## Future Improvements

- [ ] Addition of charts for visualization
- [ ] Export results to PDF
- [ ] Implementation of additional financial functions
- [ ] Customizable visual themes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

Originally developed for the site [Cabala e Matemática](https://cabalaematematica.com.br/) as an educational and practical tool for financial calculations.

## Contributions

Contributions are welcome! To contribute:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

© 2025 Financial Calculator | All rights reserved.