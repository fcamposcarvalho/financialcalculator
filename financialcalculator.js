// calculadora_financeira.js

// Function to correctly calculate total interest
function calcularTotalJuros(n, i, pmt, pv) {
    // The calculation of total interest must be consistent, regardless of signs.
    // The isFinanciamento variable was removed as it was not being used.
    // The logic below works for financing and investments due to the use of Math.abs()
    // and the way balance and interest are calculated.

    if (i === 0) {
        // With zero rate, there is no interest
        return 0;
    }
    
    // Principal (initial loan/investment amount)
    const principal = Math.abs(pv);
    
    // To calculate interest correctly, we'll simulate amortization
    let saldo = principal; // Outstanding balance (financing) or invested balance
    let totalJurosCalculado = 0;
    
    for (let periodo = 1; periodo <= n; periodo++) {
        // Period interest on the current balance
        const jurosPeriodo = saldo * i;
        totalJurosCalculado += jurosPeriodo;
        
        // Amortization: part of the payment that reduces the principal
        // Math.abs(pmt) is the total value of the payment/contribution
        const amortizacao = Math.abs(pmt) - jurosPeriodo;
        
        // Update balance: reduce principal by amortization
        saldo -= amortizacao;
    }
    
    return Math.abs(totalJurosCalculado);
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const periodsInput = document.getElementById('periods');
    const rateInput = document.getElementById('rate');
    const paymentInput = document.getElementById('payment');
    const presentValueInput = document.getElementById('presentValue');
    const futureValueInput = document.getElementById('futureValue');
    const calculateFieldSelect = document.getElementById('calculateField');
    const calculateBtn = document.getElementById('calculateBtn');
    const amortizationBtn = document.getElementById('amortizationBtn');
    const historyBtn = document.getElementById('historyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultContainer = document.getElementById('resultContainer');
    const resultValue = document.getElementById('resultValue');
    const interestValueElement = document.getElementById('interestValue'); 
    const totalPaymentsElement = document.getElementById('totalPayments'); 
    const errorMessage = document.getElementById('errorMessage');
    const togglePaymentBtn = document.getElementById('togglePayment');
    const togglePVBtn = document.getElementById('togglePV');
    const toggleFVBtn = document.getElementById('toggleFV');
    const multiplyPeriodsBtn = document.getElementById('multiplyPeriods');
    const divideRateBtn = document.getElementById('divideRate');
    
    createCustomDropdown();
    
    const historyModal = document.getElementById('historyModal');
    const closeModalBtn = document.getElementById('closeModal');
    const historyContent = document.getElementById('historyContent');
    
    const amortizationModal = document.getElementById('amortizationModal');
    const closeAmortizationModalBtn = document.getElementById('closeAmortizationModal');
    const amortizationContent = document.getElementById('amortizationContent');
    
    let calculationHistory = [];
    const MAX_HISTORY = 10;
    const calculationCache = {};
    let adjustingSignals = false;
    
    function createCustomDropdown() {
        const originalSelect = document.getElementById('calculateField');
        if (!originalSelect) return;
        
        const selectedValue = originalSelect.value;
        originalSelect.style.display = 'none';
        
        const customDropdown = document.createElement('div');
        customDropdown.className = 'custom-dropdown';
        
        const dropdownButton = document.createElement('div');
        dropdownButton.className = 'dropdown-button';
        dropdownButton.setAttribute('tabindex', '0'); 
        
        let selectedText = '';
        for (let i = 0; i < originalSelect.options.length; i++) {
            if (originalSelect.options[i].value === selectedValue) {
                selectedText = originalSelect.options[i].text; // Text is already in English from HTML
                break;
            }
        }
        dropdownButton.textContent = selectedText;
        
        const dropdownIcon = document.createElement('span');
        dropdownIcon.className = 'dropdown-icon';
        dropdownIcon.innerHTML = '▼'; 
        dropdownButton.appendChild(dropdownIcon);
        
        const dropdownList = document.createElement('div');
        dropdownList.className = 'dropdown-list';
        dropdownList.style.display = 'none';
        
        for (let i = 0; i < originalSelect.options.length; i++) {
            const option = originalSelect.options[i];
            const dropdownItem = document.createElement('div');
            dropdownItem.className = 'dropdown-item';
            if (option.value === selectedValue) {
                dropdownItem.classList.add('selected');
            }
            dropdownItem.setAttribute('data-value', option.value);
            dropdownItem.textContent = option.text; // Text is already in English from HTML
            
            dropdownItem.addEventListener('click', function(e) {
                e.stopPropagation();
                originalSelect.value = option.value;
                const event = new Event('change', { bubbles: true });
                originalSelect.dispatchEvent(event);
                dropdownButton.textContent = option.text;
                dropdownButton.appendChild(dropdownIcon); 
                dropdownList.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('selected'));
                dropdownItem.classList.add('selected');
                dropdownList.style.display = 'none';
                localStorage.setItem('lastCalculateField', option.value);
            });
            dropdownList.appendChild(dropdownItem);
        }
        
        dropdownButton.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownList.style.display = dropdownList.style.display === 'none' ? 'block' : 'none';
        });
        
        document.addEventListener('click', () => { dropdownList.style.display = 'none'; });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dropdownList.style.display = 'none'; });
        
        customDropdown.appendChild(dropdownButton);
        customDropdown.appendChild(dropdownList);
        originalSelect.parentNode.insertBefore(customDropdown, originalSelect.nextSibling);
        
        // CSS styles for custom dropdown are in calculadora.css
    }
    
    if (calculateFieldSelect) {
        calculateFieldSelect.addEventListener('change', function(event) {
            // console.log("Calculate field changed via original select:", calculateFieldSelect.value);
        });
        if (localStorage.getItem('lastCalculateField')) {
            calculateFieldSelect.value = localStorage.getItem('lastCalculateField');
            // Update custom dropdown display if loaded from localStorage
            const customDropdownButton = calculateFieldSelect.parentNode.querySelector('.dropdown-button');
            const customDropdownList = calculateFieldSelect.parentNode.querySelector('.dropdown-list');
            if (customDropdownButton && customDropdownList) {
                 for (let i = 0; i < calculateFieldSelect.options.length; i++) {
                    if (calculateFieldSelect.options[i].value === calculateFieldSelect.value) {
                        customDropdownButton.firstChild.textContent = calculateFieldSelect.options[i].text; // firstChild is the text node
                        customDropdownList.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('selected'));
                        const selectedItem = customDropdownList.querySelector(`.dropdown-item[data-value="${calculateFieldSelect.value}"]`);
                        if (selectedItem) selectedItem.classList.add('selected');
                        break;
                    }
                }
            }
        }
    }
    
    // Event listeners for buttons
    if (togglePaymentBtn) togglePaymentBtn.addEventListener('click', () => invertSign('payment'));
    if (togglePVBtn) togglePVBtn.addEventListener('click', () => invertSign('presentValue'));
    if (toggleFVBtn) toggleFVBtn.addEventListener('click', () => invertSign('futureValue'));
    if (multiplyPeriodsBtn) multiplyPeriodsBtn.addEventListener('click', multiplyPeriods);
    if (divideRateBtn) divideRateBtn.addEventListener('click', divideRate);
    if (calculateBtn) calculateBtn.addEventListener('click', calculate);
    if (amortizationBtn) amortizationBtn.addEventListener('click', showAmortizationTable);
    if (historyBtn) historyBtn.addEventListener('click', showHistory);
    if (clearBtn) clearBtn.addEventListener('click', clearFields);
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => { if(historyModal) historyModal.style.display = "none"; });
    if (closeAmortizationModalBtn) closeAmortizationModalBtn.addEventListener('click', () => { if(amortizationModal) amortizationModal.style.display = "none"; });
    
    window.addEventListener('click', function(event) {
        if (historyModal && event.target === historyModal) historyModal.style.display = "none";
        if (amortizationModal && event.target === amortizationModal) amortizationModal.style.display = "none";
    });
    
    if (paymentInput) paymentInput.addEventListener('input', adjustSignals);
    if (presentValueInput) presentValueInput.addEventListener('input', adjustSignals);


    function multiplyPeriods() {
        try {
            const periodValue = parseInt(periodsInput.value) || 0;
            periodsInput.value = periodValue * 12;
        } catch (error) {
            showError("Error multiplying periods: " + error.message);
        }
    }
    
    function divideRate() {
        try {
            const rateValue = parseFloat(rateInput.value) || 0;
            rateInput.value = (rateValue / 12).toFixed(8);
        } catch (error) {
            showError("Error dividing rate: " + error.message);
        }
    }
    
    function invertSign(field) {
        adjustingSignals = true;
        let inputElement;
        if (field === 'payment') inputElement = paymentInput;
        else if (field === 'presentValue') inputElement = presentValueInput;
        else if (field === 'futureValue') inputElement = futureValueInput;

        if (inputElement) {
            let val = parseFloat(inputElement.value) || 0;
            inputElement.value = (-val).toFixed(2);
        }
        setTimeout(() => { adjustingSignals = false; }, 100);
    }
    
    function adjustSignals() {
        if (adjustingSignals) return;
        adjustingSignals = true;
        // No automatic sign adjustment logic active by default now.
        adjustingSignals = false;
    }
    
    function clearFields() {
        if(periodsInput) periodsInput.value = "12";
        if(rateInput) rateInput.value = "1.0"; 
        if(paymentInput) paymentInput.value = "0.00";
        if(presentValueInput) presentValueInput.value = "1000.00";
        if(futureValueInput) futureValueInput.value = "0.00";
        if(resultContainer) resultContainer.classList.remove('visible');
        hideError();
        
        if (interestValueElement) interestValueElement.textContent = '';
        if (totalPaymentsElement) totalPaymentsElement.textContent = '';
    }
    
    function formatCurrency(value) {
        if (isNaN(value) || value === null) return "0.00"; 
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    
    function formatRate(value) {
         if (isNaN(value) || value === null) return "0.00000000";
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(value);
    }
    
    function showError(message) {
        if(errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.add('visible');
        }
    }
    
    function hideError() {
        if(errorMessage) {
            errorMessage.textContent = '';
            errorMessage.classList.remove('visible');
        }
    }
    
    function addToHistory(type, calculatedValue, originalValue, n, i, pmt, pv, fv, interestAmount, totalPayments) {
        const record = { type, calculatedValue, originalValue, n, i, pmt, pv, fv, interestAmount, totalPayments, date: new Date().toLocaleString('en-US') };
        calculationHistory.unshift(record);
        if (calculationHistory.length > MAX_HISTORY) calculationHistory.pop();
    }
    
    function showHistory() {
        if (!historyContent || !historyModal) return;
        if (calculationHistory.length === 0) {
            historyContent.innerHTML = '<div class="empty-history">No calculations in history.</div>';
        } else {
            historyContent.innerHTML = '';
            calculationHistory.forEach((calc, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <div class="history-detail">${index + 1}. Calculation of ${getLabelForField(calc.type)}:</div>
                    <div class="history-detail history-result">Result: ${calc.type === 'rate' ? formatRate(calc.calculatedValue) + "%" : formatCurrency(calc.calculatedValue)}</div>
                    <div class="history-detail">Periods: ${calc.n}, Rate: ${formatRate(calc.i)}%, PMT: ${formatCurrency(calc.pmt)}</div>
                    <div class="history-detail">PV: ${formatCurrency(calc.pv)}, FV: ${formatCurrency(calc.fv)}</div>
                    <div class="history-detail">Total Interest: ${formatCurrency(calc.interestAmount)}</div>
                    <div class="history-detail">Total Payments/Contributions: ${formatCurrency(calc.totalPayments)}</div>
                `;
                historyContent.appendChild(historyItem);
            });
        }
        historyModal.style.display = "block";
    }
    
    function showAmortizationTable() {
        if (!amortizationContent || !amortizationModal) return;
        try {
            hideError();
            const n = parseInt(periodsInput.value) || 0;
            const i = (parseFloat(rateInput.value) || 0) / 100;
            let pmtVal = parseFloat(paymentInput.value) || 0;
            const pv = parseFloat(presentValueInput.value) || 0;
            const fv = parseFloat(futureValueInput.value) || 0;

            if (n <= 0) throw new Error("The number of periods must be greater than zero.");
            if (i <= 0 && pmtVal !== 0) throw new Error("The rate must be greater than zero for amortization with payments.");
            if (i === 0 && pmtVal === 0 && pv === -fv) {
                 amortizationContent.innerHTML = '<div class="empty-amortization">With zero rate and no payments, amortization is direct. The final balance will be equal to the future value.</div>';
                 amortizationModal.style.display = "block";
                 return;
            }
             if (i === 0 && pmtVal === 0 && pv !== -fv) {
                throw new Error("With zero rate and payment, PV must be the opposite of FV for a valid amortization.");
            }

            const amortizationData = calculateAmortizationTable(n, i, pmtVal, pv, fv);
            
            if (amortizationData.length === 0) {
                amortizationContent.innerHTML = '<div class="empty-amortization">Could not generate the table with the provided values. Check if PMT is sufficient to cover interest.</div>';
            } else {
                const totalPrincipal = amortizationData.reduce((sum, row) => sum + row.principalPayment, 0);
                const totalInterest = amortizationData.reduce((sum, row) => sum + row.interestPayment, 0);
                const totalPayment = amortizationData.reduce((sum, row) => sum + row.payment, 0);
                
                let tableHTML = `
                    <div class="amortization-summary">
                        <p>Total Payments: ${formatCurrency(totalPayment)}</p>
                        <p>Total Principal Amortized: ${formatCurrency(totalPrincipal)}</p>
                        <p>Total Interest Paid/Received: ${formatCurrency(totalInterest)}</p>
                    </div>
                    <table class="amortization-table">
                        <thead><tr><th>Period</th><th>Payment</th><th>Interest</th><th>Cum. Interest</th><th>Principal</th><th>Cum. Principal</th><th>Ending Balance</th></tr></thead>
                        <tbody>`;
                amortizationData.forEach(row => {
                    tableHTML += `<tr>
                        <td>${row.period}</td><td>${formatCurrency(row.payment)}</td><td>${formatCurrency(row.interestPayment)}</td>
                        <td>${formatCurrency(row.cumulativeInterest)}</td><td>${formatCurrency(row.principalPayment)}</td>
                        <td>${formatCurrency(row.cumulativePrincipal)}</td><td>${formatCurrency(row.endingBalance)}</td>
                    </tr>`;
                });
                tableHTML += `<tr><td>Total</td><td>${formatCurrency(totalPayment)}</td><td>${formatCurrency(totalInterest)}</td><td>-</td><td>${formatCurrency(totalPrincipal)}</td><td>-</td><td>-</td></tr></tbody></table>`;
                amortizationContent.innerHTML = tableHTML;
            }
            amortizationModal.style.display = "block";
        } catch (error) {
            showError("Amortization: " + error.message);
        }
    }
    
    function calculateAmortizationTable(n, i, pmt, pv, fv) {
        let pmtCalculado = pmt;
        if (pmtCalculado === 0 && pv !== 0 && fv !== 0 && i > 0) {
            if (i !== 0) {
                 pmtCalculado = calculatePayment(n, i, pv, fv);
            } else if (pv + fv !== 0) { 
                pmtCalculado = -(pv + fv) / n; 
            }
        }

        const table = [];
        let currentBalance = pv;
        let cumulativeInterest = 0;
        let cumulativePrincipal = 0;

        for (let period = 1; period <= n; period++) {
            const interestForPeriod = currentBalance * i;
            let principalPaymentPart;
            if (i === 0) { 
                principalPaymentPart = -pmtCalculado;
            } else {
                 principalPaymentPart = -pmtCalculado - interestForPeriod;
            }

            const displayPmt = Math.abs(pmtCalculado);
            const displayInterest = Math.abs(interestForPeriod);
            const displayPrincipal = Math.abs(principalPaymentPart);

            cumulativeInterest += displayInterest;
            cumulativePrincipal += displayPrincipal;
            
            currentBalance += interestForPeriod + pmtCalculado;

            table.push({
                period: period,
                payment: displayPmt,
                interestPayment: displayInterest,
                cumulativeInterest: cumulativeInterest,
                principalPayment: displayPrincipal,
                cumulativePrincipal: cumulativePrincipal,
                endingBalance: currentBalance 
            });
        }
        return table;
    }
    
    function getLabelForField(field) {
        const labels = { periods: 'Periods (n)', rate: 'Rate (i)', payment: 'Payment (PMT)', presentValue: 'Present Value (PV)', futureValue: 'Future Value (FV)'};
        return labels[field] || field;
    }
    
    function adjustSignalsBeforeCalculation() {
        return {
            pmt: parseFloat(paymentInput.value) || 0,
            pv: parseFloat(presentValueInput.value) || 0,
            fv: parseFloat(futureValueInput.value) || 0
        };
    }
    
    function calculate() {
        hideError();
        try {
            const n_val = parseInt(periodsInput.value) || 0;
            const i_val = (parseFloat(rateInput.value) || 0) / 100;
            const pmt_val = parseFloat(paymentInput.value) || 0;
            const pv_val = parseFloat(presentValueInput.value) || 0;
            const fv_val = parseFloat(futureValueInput.value) || 0;
            const fieldToCalculate = calculateFieldSelect.value;
            
            validateInput(n_val, i_val, pmt_val, pv_val, fv_val, fieldToCalculate);
            
            let result;
            let originalValueInput;
            
            switch (fieldToCalculate) {
                case 'periods':
                    originalValueInput = n_val;
                    result = calculatePeriods(i_val, pmt_val, pv_val, fv_val);
                    if (result !== null) periodsInput.value = Math.round(result);
                    break;
                case 'rate':
                    originalValueInput = parseFloat(rateInput.value);
                    result = calculateRate(n_val, pmt_val, pv_val, fv_val); 
                    if (result !== null) rateInput.value = result.toFixed(8);
                    break;
                case 'payment':
                    originalValueInput = pmt_val;
                    result = calculatePayment(n_val, i_val, pv_val, fv_val);
                    if (result !== null) paymentInput.value = result.toFixed(2);
                    break;
                case 'presentValue':
                    originalValueInput = pv_val;
                    result = calculatePresentValue(n_val, i_val, pmt_val, fv_val);
                    if (result !== null) presentValueInput.value = result.toFixed(2);
                    break;
                case 'futureValue':
                    originalValueInput = fv_val;
                    result = calculateFutureValue(n_val, i_val, pmt_val, pv_val);
                    if (result !== null) futureValueInput.value = result.toFixed(2);
                    break;
                default:
                    throw new Error("Unknown calculation field.");
            }
            
            if (result !== null && isFinite(result)) {
                resultValue.textContent = fieldToCalculate === 'rate' ? formatRate(result) + "%" : formatCurrency(result);
                
                const finalN = parseInt(periodsInput.value) || 0;
                const finalRatePercent = parseFloat(rateInput.value) || 0;
                const finalI = finalRatePercent / 100;
                const finalPmt = parseFloat(paymentInput.value) || 0;
                const finalPv = parseFloat(presentValueInput.value) || 0;

                let interestAmount = 0;
                let totalPrincipalPayments = 0;
                
                totalPrincipalPayments = Math.abs(finalPmt * finalN);
                interestAmount = calcularTotalJuros(finalN, finalI, finalPmt, finalPv);

                if (interestValueElement) interestValueElement.textContent = formatCurrency(interestAmount);
                if (totalPaymentsElement) totalPaymentsElement.textContent = formatCurrency(totalPrincipalPayments);
                
                resultContainer.classList.add('visible');
                
                addToHistory(fieldToCalculate, result, originalValueInput, finalN, finalRatePercent, finalPmt, finalPv, parseFloat(futureValueInput.value), interestAmount, totalPrincipalPayments);
            } else if (result === null || !isFinite(result)) {
                showError("Could not calculate the value or the result is invalid.");
                if(resultValue) resultValue.textContent = "-";
                 if (interestValueElement) interestValueElement.textContent = '-';
                if (totalPaymentsElement) totalPaymentsElement.textContent = '-';
            }
            
        } catch (error) {
            showError(error.message);
            if(resultContainer) resultContainer.classList.remove('visible');
        }
    }
    
    function validateInput(n, i, pmt, pv, fv, fieldToCalculate) {
        if (fieldToCalculate !== 'periods' && (n <= 0 || !Number.isInteger(n))) {
            throw new Error("The number of periods (n) must be a positive integer.");
        }
        if (fieldToCalculate !== 'rate' && i < 0 && Math.abs(i) > 1e-9) {
             // Allow negative rate for theoretical calculations.
        }

        if (fieldToCalculate === 'periods') {
            if (i === 0) { 
                if (pmt === 0) { 
                    if (pv === 0 && fv === 0) throw new Error("All values are zero, cannot calculate periods.");
                    if (pv + fv !== 0) throw new Error("With zero rate and PMT, PV must be the opposite of FV to calculate periods.");
                } else { 
                    if (pv + fv === 0 && pmt !== 0) { /*ok, N=0*/ }
                    else if (pmt > 0 && pv + fv > 0) throw new Error("Sign conflict: with positive PMT (inflow), PV+FV (net outflow) cannot be positive.");
                    else if (pmt < 0 && pv + fv < 0) throw new Error("Sign conflict: with negative PMT (outflow), PV+FV (net inflow) cannot be negative.");
                }
            } else { 
                if (pmt === 0) { 
                    if (pv === 0 && fv === 0) throw new Error("PV and FV are zero with zero PMT, cannot calculate periods.");
                    if (pv === 0 || fv === 0) { /* ok, one is zero */ }
                    else if ((pv > 0 && fv > 0 && fv <= pv) || (pv < 0 && fv < 0 && fv >= pv)) {
                         // This condition might be too restrictive, removing the throw.
                    }
                     if ( (pv > 0 && fv <0 && Math.abs(fv) < Math.abs(pv) ) || (pv < 0 && fv > 0 && Math.abs(fv) > Math.abs(pv) )  ){
                        // Example: pv=100, fv=-50. Potentially impossible if rate is positive.
                     }
                } else { 
                    if ( (-pmt/i + pv) !==0 && (fv + pmt/i) / (-pmt/i + pv) <=0 ){
                         // This check can be too aggressive. Newton-Raphson or binary search handles more cases.
                         // throw new Error("Invalid combination of values for calculating periods (log of non-positive). Check the signs of PV, PMT, and FV.");
                    }
                }
            }
        }
        return true;
    }
    
    function calculatePresentValue(n, i, pmt, fv) {
        const cacheKey = `PV_${n}_${i}_${pmt}_${fv}`;
        if (calculationCache[cacheKey] !== undefined) return calculationCache[cacheKey];
        let pv;
        if (i === 0) {
            pv = - (fv + pmt * n);
        } else {
            const factor = Math.pow(1 + i, n);
            pv = - (fv + pmt * (factor - 1) / i) / factor;
        }
        calculationCache[cacheKey] = pv;
        return pv;
    }
    
    function calculateFutureValue(n, i, pmt, pv) {
        const cacheKey = `FV_${n}_${i}_${pmt}_${pv}`;
        if (calculationCache[cacheKey] !== undefined) return calculationCache[cacheKey];
        let fv;
        if (i === 0) {
            fv = - (pv + pmt * n);
        } else {
            const factor = Math.pow(1 + i, n);
            fv = - (pv * factor + pmt * (factor - 1) / i);
        }
        calculationCache[cacheKey] = fv;
        return fv;
    }
    
    function calculatePayment(n, i, pv, fv) {
        const cacheKey = `PMT_${n}_${i}_${pv}_${fv}`;
        if (calculationCache[cacheKey] !== undefined) return calculationCache[cacheKey];
        let pmt;
        if (i === 0) {
            if (n === 0) throw new Error("NPER cannot be zero to calculate PMT with zero rate.");
            pmt = - (pv + fv) / n;
        } else {
            const factor = Math.pow(1 + i, n);
            if (factor - 1 === 0 && i !== 0) { // (1+i)^n = 1 implies i=0 or n=0. If i!=0 then n must be 0.
                 if (n===0) throw new Error("NPER cannot be zero to calculate PMT with non-zero rate if it leads to division by zero.");
                 // This case should ideally not happen if factor-1 is zero and i is not zero.
                 // It would mean (1+i)^n = 1.
                 throw new Error("Invalid configuration for PMT calculation (division by zero in factor).");
            }
             pmt = - (fv * i + pv * i * factor) / (factor - 1);
        }
        calculationCache[cacheKey] = pmt;
        return pmt;
    }
    
    function calculatePeriods(i, pmt, pv, fv) { // NPER
        const cacheKey = `N_${i}_${pmt}_${pv}_${fv}`;
        if (calculationCache[cacheKey] !== undefined) return calculationCache[cacheKey];

        let n;
        if (i === 0) {
            if (pmt === 0) {
                if (pv + fv !== 0) throw new Error("With zero rate and PMT, PV must be the opposite of FV.");
                return 0; 
            }
            n = -(pv + fv) / pmt;
        } else {
            if (pmt === 0) {
                if (pv === 0 && fv === 0) return 0;
                if (pv === 0 || fv === 0 || (pv > 0 && fv < 0) || (pv < 0 && fv > 0)) {
                     if (fv / -pv <= 0 ) throw new Error("With zero PMT, FV and -PV must have the same sign and be > 0 for log.");
                     n = Math.log(fv / -pv) / Math.log(1 + i);
                } else { 
                    if (-fv / pv <= 0) throw new Error("With zero PMT, -FV and PV must have the same sign and be > 0 for log.");
                     n = Math.log(-fv / pv) / Math.log(1 + i);
                }
            } else {
                const term1 = pmt + fv * i;
                const term2 = pmt + pv * i;
                // Check if terms result in log of non-positive or division by zero
                if (term2 === 0 || (term1 / term2 <= 0) || term1 === 0 && term2 === 0 ) { // Added check for term1/term2 being non-positive or undefined
                    return calculatePeriodsBinarySearch(i, pmt, pv, fv); // Fallback to numerical method
                }
                 n = Math.log(term1 / term2) / Math.log(1 + i);
            }
        }
        if (n < 0 || !isFinite(n)) {
            return calculatePeriodsBinarySearch(i, pmt, pv, fv);
        }
        calculationCache[cacheKey] = n;
        return n;
    }

    function calculatePeriodsBinarySearch(rate, pmt, pv, fv, maxN = 10000, tolerance = 1e-6) {
        // This function tries to find N such that FV_calc(N, rate, pmt, pv) = fv_target
        // It assumes that FV is monotonic with N (generally true for positive rates)
        // This is a simplified search and might need refinement for edge cases or specific conventions
    
        if (rate === 0) { // Already handled by direct formula
            if (pmt === 0) return (pv + fv === 0) ? 0 : Infinity; // Or error
            return -(pv + fv) / pmt;
        }
    
        let low = 0;
        let high = maxN;
        let n = maxN / 2;
    
        for (let iter = 0; iter < 100; iter++) { // Limit iterations
            const fv_calculated = calculateFutureValue(n, rate, pmt, pv);
    
            if (Math.abs(fv_calculated - fv) < tolerance) {
                return n;
            }
    
            // Determine search direction based on how FV changes with N.
            // If pmt and pv have same sign, and rate > 0, FV should increase with N (become more positive or less negative)
            // This logic needs to be robust for different sign combinations.
            // A common scenario: pv < 0 (investment), pmt < 0 (more investment), fv > 0 (target future value)
            // Or pv > 0 (loan), pmt < 0 (payments), fv = 0 (pay off loan)
    
            // Simplified: if calculated FV is less than target FV, try larger N (assuming FV increases with N)
            // This assumption depends on the signs and rate.
            // If pmt + pv*rate > 0 (i.e., cash flow contributes positively to growth if rate >0)
            if ( (pmt + pv*rate) * Math.sign(rate) > 0 ) { // Heuristic: if initial trend is to grow
                 if (fv_calculated < fv) low = n; else high = n;
            } else { // Heuristic: if initial trend is to shrink (or grow negatively)
                 if (fv_calculated > fv) low = n; else high = n;
            }
            
            n = (low + high) / 2;
            if (high - low < tolerance) break;
        }
        // console.warn("NPER binary search did not converge or found no solution within range.");
        return null; // Or throw error
    }
    
    function calculateRate(n, pmt, pv, fv) { // Returns rate in %
        const cacheKey = `I_${n}_${pmt}_${pv}_${fv}`;
        if (calculationCache[cacheKey] !== undefined) return calculationCache[cacheKey];

        if (n <= 0) throw new Error("NPER must be positive to calculate RATE.");

        if (pmt === 0) {
            if (pv + fv === 0 && pv === 0) return 0; 
            if (pv + fv === 0) return 0; 
            if (pv === 0) throw new Error("PV cannot be zero with zero PMT to calculate RATE (unless FV is also zero).");
            if ((-fv / pv) <= 0 && n % 2 === 0) throw new Error("With zero PMT, (-FV/PV) must be positive for even N to calculate RATE.");
            if (pv === 0) throw new Error("PV cannot be zero when PMT is zero and FV is not, for rate calculation.");

            let base = -fv / pv;
            if (base < 0 && n % 2 === 0) { // Cannot take even root of negative number for real rate
                throw new Error("Cannot calculate real rate: even root of negative number required.");
            }
            // For odd N, Math.pow(negative, 1/odd) is negative. (1+i) must be positive.
            // So, if base is negative, and N is odd, 1+i would be negative, meaning i < -1 (-100%).
            // Typically, we are looking for rates i > -1.
            if (base < 0) { // Implies 1+i is negative if n is odd.
                 // This case needs careful handling or might be considered no solution for typical financial rates.
            }

            const rate = (Math.pow(base, 1 / n) - 1) * 100;
            calculationCache[cacheKey] = rate;
            return rate;
        }

        let rateGuess = 0.1; 
        const MAX_ITER = 100;
        const TOLERANCE = 1e-7; // Stricter tolerance

        for (let iter = 0; iter < MAX_ITER; iter++) {
            if (rateGuess <= -1) rateGuess = -0.999999; // Prevent (1+rateGuess) from being <=0

            const guessFactor = Math.pow(1 + rateGuess, n);
            let fValue;
            if (rateGuess === 0) { // L'Hopital's rule for ( (1+i)^n - 1 ) / i as i->0 is n
                 fValue = pv + pmt * n + fv;
            } else {
                 fValue = pv * guessFactor + pmt * (guessFactor - 1) / rateGuess + fv;
            }
            
            if (Math.abs(fValue) < TOLERANCE) { // Check if current guess is good enough
                calculationCache[cacheKey] = rateGuess * 100;
                return rateGuess * 100;
            }

            let fDerivative;
            if (rateGuess === 0) {
                // Derivative of (pv * (1+i)^n + pmt * n + fv) -> n*pv + pmt * n*(n-1)/2 (approx for pmt part)
                // More accurately, for f(i) = PV(1+i)^N + PMT(((1+i)^N-1)/i) + FV
                // d/di [PMT * sum_{k=1 to N} (1+i)^(N-k)] = PMT * sum (N-k)(1+i)^(N-k-1)
                // at i=0, d/di [PMT * N] = 0. This is for annuity due.
                // For ordinary annuity, derivative of pmt * ( (1+i)^n -1 )/i at i=0
                // (using Taylor series for (1+i)^n = 1+ni+n(n-1)/2 i^2 + ...):
                // pmt * (ni + n(n-1)/2 i^2 + ...)/i = pmt * (n + n(n-1)/2 i + ...)
                // Derivative w.r.t i is pmt * n(n-1)/2
                // So, f'(0) = n*pv + pmt * n*(n-1)/2
                 fDerivative = n * pv * Math.pow(1 + rateGuess, n-1) + // Simplified, should be n*pv
                               pmt * (n * (n - 1) / 2); // Approximate derivative for PMT term at i=0
                 if (n===1 && pv !==0) fDerivative = pv; // if n=1, pmt term derivative related to (n-1) is 0. f(i)=pv(1+i)+pmt+fv. f'(i)=pv.
                 else if (n===0) fDerivative = 0; // Should not happen with n > 0 check.
            } else {
                 fDerivative = n * pv * Math.pow(1 + rateGuess, n - 1) +
                                pmt * (n * rateGuess * Math.pow(1 + rateGuess, n - 1) - (guessFactor - 1)) / Math.pow(rateGuess, 2);
            }

            if (Math.abs(fDerivative) < 1e-10) {
                break; 
            }

            const newRateGuess = rateGuess - fValue / fDerivative;

            if (Math.abs(newRateGuess - rateGuess) < TOLERANCE) {
                calculationCache[cacheKey] = newRateGuess * 100;
                return newRateGuess * 100;
            }
            rateGuess = newRateGuess;

            if (rateGuess < -0.99) rateGuess = -0.99; // Prevent (1+i) from becoming too small/negative
            if (rateGuess > 10) rateGuess = 10; // Cap rate guess to prevent wild oscillations (1000%)
        }
        throw new Error("Could not converge to an interest rate. Check input values.");
    }
});