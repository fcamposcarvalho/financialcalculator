// financialcalculator.js

/**
 * Converts a value string into a number using the US format: the comma groups thousands (1,234,567.89) and the
 * dot is the decimal point. Accepts "$", "%" and spaces. An empty field is 0; text that is not a number returns NaN,
 * so the screen can point to the invalid field instead of silently using 0.
 * A comma that does not group thousands ("12,5") is rejected rather than guessed.
 * @param {string} valueString The string to convert.
 * @returns {number} The number, or NaN if the text is not a number.
 */
function parseFinancialInput(valueString) {
    if (typeof valueString !== 'string' || valueString.trim() === '') {
        return 0;
    }
    const cleanString = valueString.replace(/\$/g, '').replace(/%$/, '').replace(/[\s ]/g, '');
    if (cleanString.includes(',') && !/^[+-]?\d{1,3}(,\d{3})+(\.\d*)?$/.test(cleanString)) return NaN;
    const sanitizedString = cleanString.replace(/,/g, '');

    // Only one decimal point and digits: "1.000.5" or "abc" are not numbers
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(sanitizedString)) return NaN;
    return parseFloat(sanitizedString);
}

/**
 * Rounds to cents, half a cent away from zero, without the floating-point error: 110,935 × 1.1% = 1,220.285
 * is stored as 1,220.28499… and became 1,220.28 with Math.round(x * 100) / 100. The cents come from the
 * fractional part (abs − integer part is exact in binary) and only what lies within ~1 ulp of half a cent counts as half
 * (window of at most 0.001 cent: above ~$45 billion the double itself no longer holds the exact cent).
 * @param {number} value The value to round.
 * @returns {number} The value in cents.
 */
function roundCents(value) {
    if (!isFinite(value)) return value;
    const abs = Math.abs(value);
    const whole = Math.floor(abs);
    const fracCents = (abs - whole) * 100;
    const base = Math.floor(fracCents);
    const nearHalf = Math.abs(fracCents - base - 0.5) <= Math.min(abs * 100 * Number.EPSILON, 1e-3);
    const cents = nearHalf ? base + 1 : Math.round(fracCents);
    return Math.sign(value) * (whole + cents / 100);
}

/**
 * Formats a number as US currency (USD).
 * @param {number} value The number to format.
 * @returns {string} The string formatted as currency.
 */

function formatCurrency(value) {
    if (isNaN(value) || value === null) return "$0.00";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(roundCents(value) || 0);
}
// --- END OF HELPER FUNCTIONS ---


// Total interest of a PRICE schedule, cent by cent (same rounding as the amortization table)
function totalLoanInterest(n, i, pmt, pv) {
    if (i === 0) {
        return 0;
    }
    const principal = Math.abs(pv);
    const paymentAmount = roundCents(Math.abs(pmt));
    let balance = principal;
    let totalInterest = 0;
    const wholePeriods = Math.ceil(n);

    for (let period = 1; period <= wholePeriods; period++) {
        const periodInterest = roundCents(balance * i);
        totalInterest = roundCents(totalInterest + periodInterest);
        let amortization;
        if (period === wholePeriods) {
            amortization = balance;
        } else {
            amortization = roundCents(paymentAmount - periodInterest);
        }
        balance = roundCents(balance - amortization);
    }
    return Math.abs(totalInterest);
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const periodsInput = document.getElementById('periods');
    const rateInput = document.getElementById('rate');
    const paymentInput = document.getElementById('payment');
    const presentValueInput = document.getElementById('presentValue');
    const futureValueInput = document.getElementById('futureValue');
    const calculateFieldSelect = document.getElementById('calculateField');
    const calculateBtn = document.getElementById('calculateBtn');
    const amortizationPriceBtn = document.getElementById('amortizationPriceBtn');
    const amortizationSacBtn = document.getElementById('amortizationSacBtn');
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
    const nominalRateBtn = document.getElementById('nominalRateBtn');
    const effectiveRateBtn = document.getElementById('effectiveRateBtn');

    createCustomDropdown();

    const historyModal = document.getElementById('historyModal');
    const closeModalBtn = document.getElementById('closeModal');
    const historyContent = document.getElementById('historyContent');

    const amortizationModal = document.getElementById('amortizationModal');
    const closeAmortizationModalBtn = document.getElementById('closeAmortizationModal');
    const amortizationContent = document.getElementById('amortizationContent');
    const amortizationModalTitle = document.getElementById('amortizationModalTitle');
    const amortizationModalContentEl = amortizationModal ? amortizationModal.querySelector('.modal-content') : null;


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
                selectedText = originalSelect.options[i].text;
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

        for (let i = 0; i < originalSelect.options.length; i++) {
            const option = originalSelect.options[i];
            const dropdownItem = document.createElement('div');
            dropdownItem.className = 'dropdown-item';
            if (option.value === selectedValue) {
                dropdownItem.classList.add('selected');
            }
            dropdownItem.setAttribute('data-value', option.value);
            dropdownItem.textContent = option.text;

            dropdownItem.addEventListener('click', function(e) {
                e.stopPropagation();
                originalSelect.value = option.value;
                const event = new Event('change', { bubbles: true });
                originalSelect.dispatchEvent(event);
                dropdownButton.textContent = option.text;
                dropdownButton.appendChild(dropdownIcon);
                dropdownList.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('selected'));
                dropdownItem.classList.add('selected');
                dropdownList.classList.remove('visible');
                localStorage.setItem('lastCalculateField', option.value);
            });
            dropdownList.appendChild(dropdownItem);
        }

        dropdownButton.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownList.classList.toggle('visible');
        });

        document.addEventListener('click', () => { dropdownList.classList.remove('visible'); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dropdownList.classList.remove('visible'); });

        customDropdown.appendChild(dropdownButton);
        customDropdown.appendChild(dropdownList);
        originalSelect.parentNode.insertBefore(customDropdown, originalSelect.nextSibling);
    }

    if (calculateFieldSelect) {
        if (localStorage.getItem('lastCalculateField')) {
            calculateFieldSelect.value = localStorage.getItem('lastCalculateField');
            const customDropdownButton = calculateFieldSelect.parentNode.querySelector('.dropdown-button');
            const customDropdownList = calculateFieldSelect.parentNode.querySelector('.dropdown-list');
            if (customDropdownButton && customDropdownList) {
                 for (let i = 0; i < calculateFieldSelect.options.length; i++) {
                    if (calculateFieldSelect.options[i].value === calculateFieldSelect.value) {
                        customDropdownButton.firstChild.textContent = calculateFieldSelect.options[i].text;
                        customDropdownList.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('selected'));
                        const selectedItem = customDropdownList.querySelector(`.dropdown-item[data-value="${calculateFieldSelect.value}"]`);
                        if (selectedItem) selectedItem.classList.add('selected');
                        break;
                    }
                }
            }
        }
    }

    if (togglePaymentBtn) togglePaymentBtn.addEventListener('click', () => invertSign('payment'));
    if (togglePVBtn) togglePVBtn.addEventListener('click', () => invertSign('presentValue'));
    if (toggleFVBtn) toggleFVBtn.addEventListener('click', () => invertSign('futureValue'));
    if (multiplyPeriodsBtn) multiplyPeriodsBtn.addEventListener('click', multiplyPeriods);
    if (nominalRateBtn) nominalRateBtn.addEventListener('click', calculateNominalRate);
    if (effectiveRateBtn) effectiveRateBtn.addEventListener('click', calculateEffectiveRate);
    if (calculateBtn) calculateBtn.addEventListener('click', calculate);
    if (amortizationPriceBtn) amortizationPriceBtn.addEventListener('click', showPriceAmortizationTable);
    if (amortizationSacBtn) amortizationSacBtn.addEventListener('click', showSacAmortizationTable);
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

    // Reads a numeric field; text that is not a number raises an error naming the field (instead of silently using 0)
    function readField(input, field) {
        const value = parseFinancialInput(input.value);
        if (isNaN(value)) {
            throw new Error(`Invalid value in ${getLabelForField(field)}: "${input.value.trim()}". Use numbers such as 1,000.50 or -250.`);
        }
        return value;
    }

    function multiplyPeriods() {
        try {
            hideError();
            const periodValue = readField(periodsInput, 'periods');
            const newVal = periodValue * 12;
            periodsInput.value = (Math.round(newVal * 10000) / 10000).toString();
        } catch (error) {
            showError("Error multiplying the periods: " + error.message);
        }
    }

    function calculateNominalRate() {
        try {
            hideError();
            const rateValue = readField(rateInput, 'rate');
            rateInput.value = (rateValue / 12).toFixed(8);
        } catch (error) {
            showError("Error dividing the rate: " + error.message);
        }
    }

    function calculateEffectiveRate() {
        try {
            hideError();
            const annualRatePercent = readField(rateInput, 'rate');
            if (annualRatePercent <= -100) {
                showError("The annual rate must be greater than -100% to compute the effective rate.");
                return;
            }
            const annualRateDecimal = annualRatePercent / 100;
            const monthlyEffectiveRate = Math.pow(1 + annualRateDecimal, 1/12) - 1;
            rateInput.value = (monthlyEffectiveRate * 100).toFixed(8);
        } catch (error) {
            showError("Error computing the effective rate: " + error.message);
        }
    }

    function invertSign(field) {
        adjustingSignals = true;
        let inputElement;
        if (field === 'payment') inputElement = paymentInput;
        else if (field === 'presentValue') inputElement = presentValueInput;
        else if (field === 'futureValue') inputElement = futureValueInput;

        if (inputElement) {
            try {
                hideError();
                const val = readField(inputElement, field);
                inputElement.value = formatMoneyField(-val);
            } catch (error) {
                showError(error.message);
            }
        }
        setTimeout(() => { adjustingSignals = false; }, 100);
    }

    function adjustSignals() {
        if (adjustingSignals) return;
        adjustingSignals = true;
        adjustingSignals = false;
    }

    function clearFields() {
        if(periodsInput) periodsInput.value = "12";
        if(rateInput) rateInput.value = "1.00";
        if(paymentInput) paymentInput.value = "0.00";
        if(presentValueInput) presentValueInput.value = "1000.00";
        if(futureValueInput) futureValueInput.value = "0.00";
        if(resultContainer) resultContainer.classList.remove('visible');
        hideError();

        if (interestValueElement) interestValueElement.textContent = '';
        if (totalPaymentsElement) totalPaymentsElement.textContent = '';
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

        const historyModalContentEl = historyModal.querySelector('.modal-content');
        if (historyModalContentEl) {
            historyModalContentEl.style.position = '';
            historyModalContentEl.style.left = '';
            historyModalContentEl.style.top = '';
        }

        if (calculationHistory.length === 0) {
            historyContent.innerHTML = '<div class="empty-history">No calculations in the history.</div>';
        } else {
            historyContent.innerHTML = '';
            calculationHistory.forEach((calc, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <div class="history-detail">${index + 1}. Calculation of ${getLabelForField(calc.type)}:</div>
                    <div class="history-detail history-result">Result: ${calc.type === 'rate' ? formatRate(calc.calculatedValue) + "%" : (calc.type === 'periods' ? (Math.round(calc.calculatedValue * 10000) / 10000).toString() : formatCurrency(calc.calculatedValue))}</div>
                    <div class="history-detail">Periods: ${calc.n}, Rate: ${formatRate(calc.i)}%, PMT: ${formatCurrency(calc.pmt)}</div>
                    <div class="history-detail">PV: ${formatCurrency(calc.pv)}, FV: ${formatCurrency(calc.fv)}</div>
                    <div class="history-detail">Total Interest: ${formatCurrency(calc.interestAmount)}</div>
                    <div class="history-detail">Total Payments/Contributions: ${formatCurrency(calc.totalPayments)}</div>
                `;
                historyContent.appendChild(historyItem);
            });
        }
        historyModal.style.display = "flex";
    }

	function showPriceAmortizationTable() {
		if (!amortizationContent || !amortizationModal || !amortizationModalContentEl) return;

		if (amortizationModalTitle) amortizationModalTitle.textContent = "Amortization Schedule (PRICE)";

		try {
			hideError();
			const pmtFromInput = readField(paymentInput, 'payment');
			const nInput = readField(periodsInput, 'periods');
			const n = Math.ceil(nInput) || 0;
			const i = readField(rateInput, 'rate') / 100;
			const pv = readField(presentValueInput, 'presentValue');
			const fv = readField(futureValueInput, 'futureValue');

			if (n <= 0) throw new Error("The number of periods must be greater than zero.");
			if (i < 0) throw new Error("The interest rate cannot be negative.");
			if (pv === 0) throw new Error("Enter the financed amount (PV).");
			if (Math.abs(fv) > Math.abs(pv)) throw new Error("For an amortization schedule, the residual value (FV) must be less than or equal to the financed amount (PV) in absolute value.");

			// The FV of the schedule is the residual balance, whatever sign is typed (as in SAC). The payment is computed with the
			// residual on the side opposite to the PV; with the same sign, the formula would treat the FV as an amount to receive.
			const residualForPayment = -Math.sign(pv) * Math.abs(fv);
			const correctPayment = roundCents(calculatePayment(n, i, pv, residualForPayment));
			const notices = [];
			if (n !== nInput) notices.push(nRoundedNotice(nInput, n));

			// The schedule uses the typed PMT when it pays off the loan (within 1 cent); otherwise, the one that does, with a notice
			let scheduledPayment;
			if (pmtFromInput === 0) {
				scheduledPayment = correctPayment;
				notices.push(`PMT not entered: the schedule uses the payment that pays off the loan, ${formatCurrency(Math.abs(correctPayment))}.`);
			} else if (Math.abs(Math.abs(correctPayment) - Math.abs(pmtFromInput)) > 0.01) {
				scheduledPayment = correctPayment;
				if (n === nInput) {
					notices.push(`The PMT entered (${formatCurrency(Math.abs(pmtFromInput))}) does not pay off ${formatCurrency(Math.abs(pv))} in ${installments(n)} at ${formatRate(i * 100)}%: the schedule uses ${formatCurrency(Math.abs(correctPayment))}.`);
				}
			} else {
				scheduledPayment = pmtFromInput;
			}

			const amortizationData = calculatePriceAmortizationTable(n, i, scheduledPayment, pv, fv);

			if (amortizationData.length === 0) {
				amortizationContent.innerHTML = '<div class="empty-amortization">The schedule could not be generated with these values. Please check the inputs.</div>';
			} else {
				displayAmortizationData(amortizationData, notices);
			}

			if (amortizationModalContentEl) {
				amortizationModalContentEl.style.position = '';
				amortizationModalContentEl.style.left = '';
				amortizationModalContentEl.style.top = '';
			}
			amortizationModal.style.display = "flex";
		} catch (error) {
			showError("Amortization (PRICE): " + error.message);
		}
	}

	function showSacAmortizationTable() {
		if (!amortizationContent || !amortizationModal || !amortizationModalContentEl) return;

		try {
			hideError();
			// SAC does not use the PMT: each payment is the constant amortization plus the interest of the period
			const fv = readField(futureValueInput, 'futureValue');
			if (amortizationModalTitle) {
				amortizationModalTitle.textContent = fv !== 0 ? "Amortization Schedule (SAC with Residual Value)" : "Amortization Schedule (SAC)";
			}
			const nInput = readField(periodsInput, 'periods');
			const n = Math.ceil(nInput) || 0;
			const i = readField(rateInput, 'rate') / 100;
			const pv = readField(presentValueInput, 'presentValue');

			if (n <= 0) throw new Error("The number of periods must be greater than zero.");
			if (i < 0) throw new Error("The interest rate cannot be negative.");
			if (pv === 0) throw new Error("Enter the financed amount (PV).");
			if (Math.abs(fv) > Math.abs(pv)) throw new Error("For a SAC schedule, the residual value (FV) must be less than or equal to the financed amount (PV) in absolute value.");

			const amortizationData = calculateSacAmortizationTable(n, i, pv, fv);

			if (amortizationData.length === 0) {
				amortizationContent.innerHTML = '<div class="empty-amortization">The SAC schedule could not be generated with these values.</div>';
			} else {
				displayAmortizationData(amortizationData, n !== nInput ? [nRoundedNotice(nInput, n)] : []);
			}

			if (amortizationModalContentEl) {
				amortizationModalContentEl.style.position = '';
				amortizationModalContentEl.style.left = '';
				amortizationModalContentEl.style.top = '';
			}
			amortizationModal.style.display = "flex";
		} catch (error) {
			showError("Amortization (SAC): " + error.message);
		}
	}

	// Notice when the schedule does not use exactly what was typed
	function nRoundedNotice(nInput, n) {
		const shown = (Math.round(nInput * 10000) / 10000).toString();
		return `The number of periods (${shown}) is not a whole number: the schedule uses ${installments(n)} and recomputes the values.`;
	}

	function installments(n) {
		return `${n} ${n === 1 ? 'payment' : 'payments'}`;
	}

	function displayAmortizationData(amortizationData, notices = []) {
		// Each partial sum is rounded to cents so that hundreds of rows do not accumulate IEEE 754 floating-point error.
		const totalPrincipal = amortizationData.reduce((sum, row) => roundCents(sum + row.principalPayment), 0);
		const totalInterest = amortizationData.reduce((sum, row) => roundCents(sum + row.interestPayment), 0);
		const totalPayment = amortizationData.reduce((sum, row) => roundCents(sum + row.payment), 0);

		const noticesHTML = notices.map(text => `<div class="amortization-notice">${text}</div>`).join('');
		let tableHTML = `${noticesHTML}
			<div class="amortization-summary">
				<p>Total Payments: ${formatCurrency(totalPayment)}</p>
				<p>Total Principal Repaid: ${formatCurrency(totalPrincipal)}</p>
				<p>Total Interest Paid: ${formatCurrency(totalInterest)}</p>
			</div>
			<!-- Scrolling container -->
			<div class="amortization-table-container">
				<table class="amortization-table">
					<thead><tr><th>Period</th><th>Payment (PMT)</th><th>Interest</th><th>Cum. Interest</th><th>Principal</th><th>Cum. Principal</th><th>Balance</th></tr></thead>
					<tbody>`;
		amortizationData.forEach(row => {
			tableHTML += `<tr>
				<td>${row.period}</td><td>${formatCurrency(row.payment)}</td><td>${formatCurrency(row.interestPayment)}</td>
				<td>${formatCurrency(row.cumulativeInterest)}</td><td>${formatCurrency(row.principalPayment)}</td>
				<td>${formatCurrency(row.cumulativePrincipal)}</td><td>${formatCurrency(row.endingBalance)}</td>
			</tr>`;
		});
		tableHTML += `<tr><td><strong>Total</strong></td><td><strong>${formatCurrency(totalPayment)}</strong></td><td><strong>${formatCurrency(totalInterest)}</strong></td><td>-</td><td><strong>${formatCurrency(totalPrincipal)}</strong></td><td>-</td><td>-</td></tr></tbody>
				</table>
			</div> <!-- End of the scrolling container -->`;
		amortizationContent.innerHTML = tableHTML;
	}

	function calculatePriceAmortizationTable(n, i, pmt, pv, fv) {
		const table = [];
		let currentBalance = Math.abs(pv);
		const paymentAmount = roundCents(Math.abs(pmt)); // PMT rounded to cents (user input)
		const futureValueAmount = Math.abs(fv);

		let cumulativeInterest = 0;
		let cumulativePrincipal = 0;

		for (let period = 1; period <= n; period++) {
			const interestForPeriod = roundCents(currentBalance * i);
			let principalPaymentPart;
			let currentPayment = paymentAmount;

			if (period === n) {
				principalPaymentPart = roundCents(currentBalance - futureValueAmount);
				currentPayment = roundCents(principalPaymentPart + interestForPeriod);
			} else {
				principalPaymentPart = roundCents(paymentAmount - interestForPeriod);
			}

			currentBalance = roundCents(currentBalance - principalPaymentPart);
			cumulativeInterest = roundCents(cumulativeInterest + interestForPeriod);
			cumulativePrincipal = roundCents(cumulativePrincipal + principalPaymentPart);

			if (period === n) {
				currentBalance = futureValueAmount;
			}

			table.push({
				period: period,
				payment: currentPayment,
				interestPayment: interestForPeriod,
				cumulativeInterest: cumulativeInterest,
				principalPayment: principalPaymentPart,
				cumulativePrincipal: cumulativePrincipal,
				endingBalance: currentBalance
			});
		}
		return table;
	}

	function calculateSacAmortizationTable(n, i, pv, fv) {
		const table = [];
		const principalAmount = Math.abs(pv);
		const futureValueAmount = Math.abs(fv);

		if (n <= 0) return table;

		// In cents before dividing: subtracting large values leaves an error the size of those values, and (2,788,855.40 −
		// 2,376,323.83) ÷ 2 = 206,265.785 came out as 206,265.78 instead of 206,265.79
		let amountToAmortize = roundCents(principalAmount - futureValueAmount);
		const constantAmortization = roundCents(amountToAmortize / n);

		let currentBalance = principalAmount;
		let cumulativeInterest = 0;
		let cumulativePrincipal = 0;

		for (let period = 1; period <= n; period++) {
			const interestForPeriod = roundCents(currentBalance * i);
			let principalPaymentForPeriod = constantAmortization;

			if (period === n) {
				principalPaymentForPeriod = roundCents(currentBalance - futureValueAmount);
			}

			const paymentForPeriod = roundCents(principalPaymentForPeriod + interestForPeriod);

			currentBalance = roundCents(currentBalance - principalPaymentForPeriod);
			cumulativeInterest = roundCents(cumulativeInterest + interestForPeriod);
			cumulativePrincipal = roundCents(cumulativePrincipal + principalPaymentForPeriod);

			if(period === n) {
				currentBalance = futureValueAmount;
			}

			table.push({
				period: period,
				payment: paymentForPeriod,
				interestPayment: interestForPeriod,
				cumulativeInterest: cumulativeInterest,
				principalPayment: principalPaymentForPeriod,
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

    function calculate() {
        hideError();
        try {
            const n_val = readField(periodsInput, 'periods');
            const i_val = readField(rateInput, 'rate') / 100;
            const pmt_val = readField(paymentInput, 'payment');
            const pv_val = readField(presentValueInput, 'presentValue');
            const fv_val = readField(futureValueInput, 'futureValue');
            const fieldToCalculate = calculateFieldSelect.value;

            // HP 12c convention: money received is positive and money paid out is negative, also with a zero PMT.
            // The signs are checked only for n and rate (validateInput), never with the value in the field being calculated.
            validateInput(n_val, i_val, pmt_val, pv_val, fv_val, fieldToCalculate);

            let result;
            let originalValueInput;

            switch (fieldToCalculate) {
                case 'periods':
                    originalValueInput = n_val;
                    result = calculatePeriods(i_val, pmt_val, pv_val, fv_val);
                    if (result !== null) {
                        periodsInput.value = (Math.round(result * 10000) / 10000).toString();
                    }
                    break;
                case 'rate':
                    originalValueInput = parseFinancialInput(rateInput.value);
                    result = calculateRate(n_val, pmt_val, pv_val, fv_val);
                    if (result !== null) {
                        rateInput.value = result.toFixed(8);
                    }
                    break;
                case 'payment':
                    originalValueInput = pmt_val;
                    result = calculatePayment(n_val, i_val, pv_val, fv_val);
                    if (result !== null) {
                        paymentInput.value = formatMoneyField(result);
                    }
                    break;
                case 'presentValue':
                    originalValueInput = pv_val;
                    result = calculatePresentValue(n_val, i_val, pmt_val, fv_val);
                    if (result !== null) {
                        presentValueInput.value = formatMoneyField(result);
                    }
                    break;
                case 'futureValue':
                    originalValueInput = fv_val;
                    result = calculateFutureValue(n_val, i_val, pmt_val, pv_val);
                    if (result !== null) {
                        futureValueInput.value = formatMoneyField(result);
                    }
                    break;
                default:
                    throw new Error("Unknown field to calculate.");
            }

            if (result !== null && isFinite(result)) {
                // Reformat the inputs on screen: n with 4 decimals, rate with 8, amounts in cents
                const roundedN = parseFinancialInput(periodsInput.value) || 0;
                periodsInput.value = (Math.round(roundedN * 10000) / 10000).toString();
                rateInput.value = parseFinancialInput(rateInput.value).toFixed(8);
                paymentInput.value = formatMoneyField(parseFinancialInput(paymentInput.value));
                presentValueInput.value = formatMoneyField(parseFinancialInput(presentValueInput.value));
                futureValueInput.value = formatMoneyField(parseFinancialInput(futureValueInput.value));

                // Main result on the display
                if (fieldToCalculate === 'rate') {
                    resultValue.textContent = formatRate(result) + "%";
                } else if (fieldToCalculate === 'periods') {
                    resultValue.textContent = (Math.round(result * 10000) / 10000).toString();
                } else {
                    resultValue.textContent = formatCurrency(Math.abs(result) < 0.005 ? 0 : result);
                }

                const finalN = parseFinancialInput(periodsInput.value) || 0;
                const finalRatePercent = parseFinancialInput(rateInput.value);
                const finalI = finalRatePercent / 100;
                const finalPmt = parseFinancialInput(paymentInput.value);
                const finalPv = parseFinancialInput(presentValueInput.value);
                const finalFv = parseFinancialInput(futureValueInput.value);

                const { interestAmount, totalPrincipalPayments } = summarizeFlows(finalN, finalI, finalPmt, finalPv, finalFv);
                if (interestValueElement) interestValueElement.textContent = formatCurrency(interestAmount);
                if (totalPaymentsElement) totalPaymentsElement.textContent = formatCurrency(totalPrincipalPayments);

                resultContainer.classList.add('visible');

                addToHistory(fieldToCalculate, result, originalValueInput, finalN, finalRatePercent, finalPmt, finalPv, finalFv, interestAmount, totalPrincipalPayments);
            } else if (result === null || !isFinite(result)) {
                showError(explainNoSolution(fieldToCalculate, n_val, i_val, pmt_val, pv_val, fv_val));
                if(resultValue) resultValue.textContent = "-";
                 if (interestValueElement) interestValueElement.textContent = '-';
                if (totalPaymentsElement) totalPaymentsElement.textContent = '-';
            }

        } catch (error) {
            showError(error.message);
            if(resultContainer) resultContainer.classList.remove('visible');
        }
    }

    // Money value in a field: cents, no "-0.00" and no scientific notation (above 10²¹ toFixed writes "1.06e+21",
    // which the reader rejects: the field would show 0.00)
    function formatMoneyField(value) {
        const cents = roundCents(value) || 0;
        if (Math.abs(cents) >= 1e21) return BigInt(Math.round(cents)).toString() + '.00';
        return cents.toFixed(2);
    }

    // Interest and total paid. For a loan (PV and PMT with opposite signs; FV, if any, is the residual balance on the PMT
    // side) they follow the PRICE schedule cent by cent; otherwise (savings, PV and FV only) the interest is the net cash flow.
    function summarizeFlows(n, i, pmt, pv, fv) {
        const isLoan = pmt !== 0 && pv !== 0 && Math.sign(pv) !== Math.sign(pmt) &&
                       (fv === 0 || Math.sign(fv) === Math.sign(pmt)) && Math.abs(fv) <= Math.abs(pv);
        if (isLoan) {
            const interestAmount = totalLoanInterest(n, i, pmt, pv);
            return { interestAmount, totalPrincipalPayments: roundCents(Math.abs(pv) - Math.abs(fv) + interestAmount) };
        }
        return { interestAmount: Math.abs(roundCents(pv + pmt * n + fv)), totalPrincipalPayments: Math.abs(pmt * n) };
    }

    // When there is no solution, say why instead of a generic "could not calculate"
    function explainNoSolution(field, n, i, pmt, pv, fv) {
        if (field === 'periods' && i > 0 && pmt !== 0 && pv !== 0 && Math.sign(pmt) !== Math.sign(pv) && Math.abs(pmt) <= Math.abs(pv) * i) {
            return `The payment (PMT) of ${formatCurrency(Math.abs(pmt))} does not cover the interest of the first period (${formatCurrency(Math.abs(pv) * i)}): the balance is never paid off.`;
        }
        if (field === 'periods') return "No number of periods balances this cash flow with these values. Please check the values and their signs.";
        if (field === 'rate') return "No rate between -99% and 10,000% per period balances this cash flow. Please check the values and their signs.";
        return "The value could not be calculated or the result is invalid.";
    }

    function validateInput(n, i, pmt, pv, fv, fieldToCalculate) {
        if (fieldToCalculate !== 'periods' && (n <= 0 || isNaN(n))) {
            throw new Error("The number of periods (n) must be a positive number.");
        }
        // n and rate only have a solution if the cash flow changes sign (as on the HP 12c). PV, PMT and FV work with any sign.
        if (fieldToCalculate === 'periods' || fieldToCalculate === 'rate') {
            const known = [pv, pmt, fv].filter(v => v !== 0);
            if (!known.some(v => v > 0) || !known.some(v => v < 0)) {
                throw new Error("To calculate n or the rate, PV, PMT and FV need at least one positive value (money received) and one negative value (money paid out), as on the HP 12c.");
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
            if (n === 0) throw new Error("The number of periods cannot be zero to calculate PMT with a zero rate.");
            pmt = - (pv + fv) / n;
        } else {
            const factor = Math.pow(1 + i, n);
            if (factor - 1 === 0 && i !== 0) {
                 if (n===0) throw new Error("The number of periods cannot be zero to calculate PMT with a non-zero rate when that leads to a division by zero.");
                 throw new Error("Invalid setup for the PMT calculation (division by zero in the factor).");
            }
             pmt = - (fv * i + pv * i * factor) / (factor - 1);
        }
        calculationCache[cacheKey] = pmt;
        return pmt;
    }

    function calculatePeriods(i, pmt, pv, fv) {
        const cacheKey = `N_${i}_${pmt}_${pv}_${fv}`;
        if (calculationCache[cacheKey] !== undefined) return calculationCache[cacheKey];

        let n;
        if (i === 0) {
            if (pmt === 0) throw new Error("With a zero rate and a zero PMT, the number of periods is undetermined.");
            n = -(pv + fv) / pmt;
        } else {
            if (1 + i <= 0) {
                throw new Error("The rate cannot be -100% or lower for this calculation.");
            }
            // PV·f + PMT·(f − 1)/i + FV = 0  →  f = (1+i)^n = (PMT − FV·i) / (PMT + PV·i); with a zero PMT, f = −FV/PV
            const numerator = pmt - fv * i;
            const denominator = pmt + pv * i;
            if (denominator === 0 || numerator / denominator <= 0) {
                return calculatePeriodsBinarySearch(i, pmt, pv, fv);
            }
            n = Math.log(numerator / denominator) / Math.log(1 + i);
        }
        if (n < 0 || !isFinite(n)) {
            return calculatePeriodsBinarySearch(i, pmt, pv, fv);
        }
        calculationCache[cacheKey] = n;
        return n;
    }

    function calculatePeriodsBinarySearch(rate, pmt, pv, fv, maxN = 1200, tolerance = 1e-6) {
        if (rate === 0) {
            if (pmt === 0) return (pv + fv === 0) ? 0 : null;
            if (pmt !== 0) return -(pv + fv) / pmt;
            return null;
        }

        const trend_term = pmt + pv * rate;
        const isIncreasing = (rate > 0) ? (trend_term < 0) : (trend_term > 0);

        const fv_at_n0 = calculateFutureValue(0, rate, pmt, pv);
        const fv_at_nMax = calculateFutureValue(maxN, rate, pmt, pv);

        if (isIncreasing) {
            if (fv < fv_at_n0 || fv > fv_at_nMax) return null;
        } else {
            if (fv > fv_at_n0 || fv < fv_at_nMax) return null;
        }

        let low = 0;
        let high = maxN;

        for (let iter = 0; iter < 100; iter++) {
            let n = (low + high) / 2;
            const fv_calculated = calculateFutureValue(n, rate, pmt, pv);

            if (isIncreasing) {
                if (fv_calculated < fv) { low = n; } else { high = n; }
            } else {
                if (fv_calculated > fv) { low = n; } else { high = n; }
            }

            if (high - low < tolerance) break;
        }

        const final_n = (low + high) / 2;
        const final_fv = calculateFutureValue(final_n, rate, pmt, pv);

        if (Math.abs(final_fv - fv) < 0.01) {
            return final_n;
        }

        return null;
    }

    function calculateRate(n, pmt, pv, fv) {
        const cacheKey = `I_${n}_${pmt}_${pv}_${fv}`;
        if (calculationCache[cacheKey] !== undefined) return calculationCache[cacheKey];

        if (n <= 0) throw new Error("The number of periods must be positive to calculate the RATE.");

        if (pmt === 0) {
            if (pv === 0) {
                throw new Error("With a zero PMT, the Present Value (PV) cannot be zero to calculate the Rate.");
            }
            const base = -fv / pv; // HP 12c: PV and FV with opposite signs
            if (!(base > 0)) {
                throw new Error("With a zero PMT, PV and FV must have opposite signs (money paid out is negative, as on the HP 12c).");
            }

            const rate = (Math.pow(base, 1 / n) - 1) * 100;
            calculationCache[cacheKey] = rate;
            return rate;
        }

        let rateGuess = 0.1;
        const MAX_ITER = 100;
        const TOLERANCE = 1e-7;

        for (let iter = 0; iter < MAX_ITER; iter++) {
            if (rateGuess <= -1 + 1e-9) rateGuess = -1 + 1e-9;

            const guessFactor = Math.pow(1 + rateGuess, n);
            let fValue;
            if (Math.abs(rateGuess) < 1e-9) {
                 fValue = pv + pmt * n + fv;
            } else {
                 fValue = pv * guessFactor + pmt * (guessFactor - 1) / rateGuess + fv;
            }

            if (Math.abs(fValue) < TOLERANCE) {
                calculationCache[cacheKey] = rateGuess * 100;
                return rateGuess * 100;
            }

            let fDerivative;
            if (Math.abs(rateGuess) < 1e-9) {
                 fDerivative = n * pv + pmt * n * (n - 1) / 2;
                 if (n===1) fDerivative = pv;
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

            if (rateGuess < -0.999) rateGuess = -0.999;
            if (rateGuess > 10) rateGuess = 10;
        }
        const fallback = calculateRateByBisection(n, pmt, pv, fv);
        if (fallback !== null) calculationCache[cacheKey] = fallback;
        return fallback;
    }

    // Fallback when Newton does not converge (high rates: 30% per period over 12 payments used to fail). Looks for an
    // interval where the cash flow changes sign, from -99% to 10,000% per period, and closes it by bisection. The cash flow
    // is divided by (1+r)^n so it does not overflow with a large n. With more than one solution, the positive one closest to zero wins.
    function calculateRateByBisection(n, pmt, pv, fv) {
        const g = r => {
            if (Math.abs(r) < 1e-12) return pv + pmt * n + fv;
            const v = Math.pow(1 + r, -n);
            return pv + pmt * (1 - v) / r + fv * v;
        };
        const grid = [-0.99, -0.9, -0.5, -0.2, -0.1, -0.05, -0.01, -0.001, 0, 0.001, 0.01, 0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1, 1.5, 2, 3, 5, 10, 20, 50, 100];
        const brackets = [];
        for (let k = 1; k < grid.length; k++) {
            const a = grid[k - 1], b = grid[k], ga = g(a), gb = g(b);
            if (!isFinite(ga) || !isFinite(gb)) continue;
            if (ga === 0) return a * 100;
            if (ga * gb < 0) brackets.push([a, b]);
        }
        if (brackets.length === 0) return null;
        let [lo, hi] = brackets.find(([a]) => a >= 0) || brackets[brackets.length - 1];
        let glo = g(lo);
        for (let k = 0; k < 200; k++) {
            const mid = (lo + hi) / 2, gm = g(mid);
            if ((gm > 0) === (glo > 0)) { lo = mid; glo = gm; } else { hi = mid; }
        }
        return (lo + hi) / 2 * 100;
    }

    if (amortizationModal && amortizationModalContentEl) {
        let isAmortizationDragging = false;
        let amortizationDragOffsetX, amortizationDragOffsetY;

        amortizationModalContentEl.style.cursor = 'grab';

        amortizationModalContentEl.addEventListener('mousedown', function(e) {
            const targetTagName = e.target.tagName.toLowerCase();
            const isInteractiveElement = ['button', 'input', 'select', 'textarea', 'table', 'td', 'th', 'tr', 'tbody', 'thead'].includes(targetTagName) ||
                                         e.target.classList.contains('close') ||
                                         e.target.closest('.amortization-table') ||
                                         e.target.closest('.amortization-summary');

            if (isInteractiveElement) return;

            isAmortizationDragging = true;

            if (getComputedStyle(amortizationModalContentEl).position !== 'absolute') {
                const rect = amortizationModalContentEl.getBoundingClientRect();
                amortizationModalContentEl.style.position = 'absolute';
                amortizationModalContentEl.style.left = rect.left + 'px';
                amortizationModalContentEl.style.top = rect.top + 'px';
                amortizationModalContentEl.style.margin = '0';
            }

            amortizationDragOffsetX = e.clientX - amortizationModalContentEl.offsetLeft;
            amortizationDragOffsetY = e.clientY - amortizationModalContentEl.offsetTop;
            amortizationModalContentEl.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';

            document.addEventListener('mousemove', onAmortizationMouseMove);
            document.addEventListener('mouseup', onAmortizationMouseUp);
        });

        function onAmortizationMouseMove(e) {
            if (!isAmortizationDragging) return;
            e.preventDefault();
            let newLeft = e.clientX - amortizationDragOffsetX;
            let newTop = e.clientY - amortizationDragOffsetY;

            const vpWidth = window.innerWidth;
            const vpHeight = window.innerHeight;
            const modalWidth = amortizationModalContentEl.offsetWidth;
            const modalHeight = amortizationModalContentEl.offsetHeight;

            newLeft = Math.max(0, Math.min(newLeft, vpWidth - modalWidth));
            newTop = Math.max(0, Math.min(newTop, vpHeight - modalHeight));

            amortizationModalContentEl.style.left = newLeft + 'px';
            amortizationModalContentEl.style.top = newTop + 'px';
        }

        function onAmortizationMouseUp() {
            if (!isAmortizationDragging) return;
            isAmortizationDragging = false;
            amortizationModalContentEl.style.cursor = 'grab';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onAmortizationMouseMove);
            document.removeEventListener('mouseup', onAmortizationMouseUp);
        }
    }
});

// --- CLICK-BASED CUSTOM TOOLTIPS ---
document.addEventListener('DOMContentLoaded', function() {
    let activeTooltip = null;

    function showTooltip(triggerElement) {
        const message = triggerElement.getAttribute('data-tooltip-message');
        if (!message) return;

        const tooltipElement = document.createElement('div');
        tooltipElement.className = 'custom-tooltip-popup';
        tooltipElement.textContent = message;
        document.body.appendChild(tooltipElement);

        const rect = triggerElement.getBoundingClientRect();
        const screenPadding = 10; // Safety margin from the screen edges

        // --- SMART POSITIONING ---

        // 1. Vertical position (first, so the height is known)
        let topPos = rect.top - tooltipElement.offsetHeight - 10; // Try 10px above
        if (topPos < screenPadding) {
            topPos = rect.bottom + 10; // If it does not fit, 10px below
        }
        tooltipElement.style.top = `${topPos}px`;

        // 2. Horizontal position (keeping it inside the screen)
        let leftPos = rect.left + (rect.width / 2) - (tooltipElement.offsetWidth / 2); // Try to center it

        // Overflowing on the left?
        if (leftPos < screenPadding) {
            leftPos = screenPadding;
        }

        // Overflowing on the right?
        const rightEdge = leftPos + tooltipElement.offsetWidth;
        if (rightEdge > window.innerWidth - screenPadding) {
            leftPos = window.innerWidth - tooltipElement.offsetWidth - screenPadding;
        }

        tooltipElement.style.left = `${leftPos}px`;

        // --------------------------------------------------

        setTimeout(() => tooltipElement.classList.add('visible'), 10);

        activeTooltip = tooltipElement;
    }

    // Hides the active tooltip
    function hideTooltip() {
        if (activeTooltip) {
            activeTooltip.classList.remove('visible');
            setTimeout(() => {
                if (activeTooltip) activeTooltip.remove();
                activeTooltip = null;
            }, 300);
        }
    }

    // Click handling
    document.querySelectorAll('.tooltip-trigger-icon').forEach(icon => {
        icon.addEventListener('click', function(e) {
            e.stopPropagation();
            if (activeTooltip) {
                hideTooltip();
            } else {
                showTooltip(icon);
            }
        });
    });

    document.addEventListener('click', function() {
        if (activeTooltip) {
            hideTooltip();
        }
    });
});
