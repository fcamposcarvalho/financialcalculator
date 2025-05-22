# Financial Calculator

An advanced cash flow calculator to perform financial calculations such as present value (PV), future value (FV), installments (PMT), interest rates and periods.

![Financial Calculator](https://github.com/fcamposcarvalho/financialcalculator/raw/main/financialcalculator.png)

## Features

- **Complete cash flow calculation**:
- Present Value (PV)
- Future Value (FV)
- Installments (PMT)
- Interest rate (i)
- Number of periods (n)
- **Automatic sign inversion** to maintain financial coherence
- **Results cache** to improve performance
- **Calculation history** with capacity for the last 10 calculations
- **Advanced numerical methods** such as Newton-Raphson for calculating rates
- **Responsive interface** adapted to all screen sizes
- **Special case handling** in various financial scenarios

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Modern UI/UX techniques
- Mathematical methods financial

## How to Use

### Installation

1. Clone this repository:
```
git clone https://github.com/your-user/financialcalculator.git
```
2. Open the `index.html` file in any modern browser

### Online Usage

Access the calculator directly at: [https://fcamposcarvalho.github.io/financialcalculator](https://fcamposcarvalho.github.io/financialcalculator)

### Integration into Other Sites

To add this calculator to your site:

1. Copy the `index.html` file
2. Copy the `calculator.css` file
3. Copy the `calculator.js` file

## Usage Guide

1. **Select the value to calculate** in the dropdown
2. **Fill in the known fields**
3. **Click on "Calculate"** to get the result
4. Use the **+/-** buttons to invert signs when necessary
5. View the **calculation history** by clicking the "History" button

## Common Use Cases

### Calculating Loan Payments
- Enter the Present Value with the loan amount (positive)
- Set the number of periods
- Set the interest rate
- Set Future Value = 0
- Select "Payment (PMT)" from the dropdown
- Calculate

### Calculating Accumulation Time
- Enter the Present Value (initial investment)
- Enter the interest rate
- Enter the amount of the periodic contribution (PMT)
- Enter the desired future value
- Select "Periods (n)" from the dropdown
- Calculate

## Mathematical Basics

The calculator implements the following financial formulas:

- **Present Value (PV)**:

- With PMT=0: `PV = FV / (1+i)^n`
- General case: `PV = -PMT * (1-(1+i)^-n)/i - FV*(1+i)^-n`

- **Future Value (FV)**:
- With PMT=0: `FV = PV * (1+i)^n`
- General case: `FV = -PMT * ((1+i)^n-1)/i - PV*(1+i)^n`

- **Numerical Methods**:
- Binary Search for calculating periods
- Newton-Raphson for calculating rates

## Project Structure

```
financialcalculator/
│
├── index.html # Main file containing HTML, CSS and JavaScript
├── calculator.css # CSS formatting file
├── calculator.js # Javascript file for execution, validation, messages, ...
├── financialcalculator.png # Calculator screenshot
└── README.md # This file
```

## Future Improvements

- [ ] Addition of graphs for visualization
- [ ] Export of results in PDF
- [ ] Implementation of additional financial functions
- [ ] Customizable visual themes

## License

This project is licensed under the MIT license - see the [LICENSE](LICENSE) file for details.

## Credits

Originally developed for the website [Cabala e Matemática](https://cabalaematematica.com.br/) as an educational and practical tool for financial calculations.

## Contributions

Contributions are welcome! To contribute:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/new-feature`)
3. Commit the changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

© 2025 Financial Calculator | All rights reserved.
