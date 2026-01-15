// calculator_mirr.js
document.addEventListener('DOMContentLoaded', function () {
    // A função parseFinancialInput já está disponível globalmente.

    const mirrBtn = document.getElementById('mirrBtn');
    const mirrModal = document.getElementById('mirrModal');
    const closeMirrModalBtn = document.getElementById('closeMirrModal');
    const mirrModalContent = mirrModal ? mirrModal.querySelector('.modal-content.mirr-modal') : null;

    const initialInvestmentInput = document.getElementById('mirrInitialInvestment');
    const financingRateInput = document.getElementById('mirrFinancingRate');
    const reinvestmentRateInput = document.getElementById('mirrReinvestmentRate');
    const cashFlowsTableBody = document.getElementById('mirrCashFlowsTableBody');
    const addCashFlowRowBtn = document.getElementById('addMirrCashFlowRow');
    const calculateMirrBtn = document.getElementById('calculateMirrBtn');
    const resetMirrBtn = document.getElementById('resetMirrBtn');
    const mirrResultContainer = document.getElementById('mirrResultContainer');
    const mirrResultValue = document.getElementById('mirrResultValue');
    const mirrErrorMessage = document.getElementById('mirrErrorMessage');

    let cfRowCounter = 0;
    let isMirrFirstOpenThisSession = true;

    function showMirrError(message) {
        if (mirrErrorMessage) {
            mirrErrorMessage.textContent = message;
            mirrErrorMessage.style.display = 'block';
        }
        if (mirrResultContainer) mirrResultContainer.style.display = 'none';
    }

    function hideMirrError() {
        if (mirrErrorMessage) {
            mirrErrorMessage.textContent = '';
            mirrErrorMessage.style.display = 'none';
        }
    }

    function addCashFlowRow(amount = "", quantity = 1) {
        cfRowCounter++;
        const row = cashFlowsTableBody.insertRow();
        row.id = `cfRow-${cfRowCounter}`;

        const cellAmount = row.insertCell();
        const amountInput = document.createElement('input');
        amountInput.type = 'text';
        amountInput.inputMode = 'decimal';
        amountInput.className = 'mirr-cash-flow-amount';
        amountInput.value = amount;
        amountInput.placeholder = "e.g.: 200 or -150";
        amountInput.enterKeyHint = "enter";
        cellAmount.appendChild(amountInput);

        const cellQuantity = row.insertCell();
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.className = 'mirr-cash-flow-quantity';
        quantityInput.value = quantity;
        quantityInput.min = '1';
        quantityInput.step = '1';
        quantityInput.enterKeyHint = "enter";
        cellQuantity.appendChild(quantityInput);

        const cellAction = row.insertCell();
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'mirr-remove-cf-btn';
        removeBtn.type = 'button';
        removeBtn.onclick = function () {
            row.remove();
        };
        cellAction.appendChild(removeBtn);

        if (typeof window.handleNumericInputKeydown === 'function' && typeof window.handleNumericInputDblClick === 'function') {
            [amountInput, quantityInput].forEach(input => {
                input.removeEventListener('keydown', window.handleNumericInputKeydown);
                input.addEventListener('keydown', window.handleNumericInputKeydown);
                input.removeEventListener('dblclick', window.handleNumericInputDblClick);
                input.addEventListener('dblclick', window.handleNumericInputDblClick);
                input.title = "Press F1 or double click to access the calculator";
            });
        }
    }

    function resetMirrToDefaults() {
        hideMirrError();
        if (mirrResultContainer) mirrResultContainer.style.display = 'none';

        if (initialInvestmentInput) initialInvestmentInput.value = "-1000.00";
        if (financingRateInput) financingRateInput.value = "5.0";
        if (reinvestmentRateInput) reinvestmentRateInput.value = "7.0";

        while (cashFlowsTableBody.firstChild) {
            cashFlowsTableBody.removeChild(cashFlowsTableBody.firstChild);
        }
        cfRowCounter = 0;
        addCashFlowRow("250.00", 3);
        addCashFlowRow("-50.00", 2);
    }

    function openMirrModal() {
        if (!mirrModal) return;

        if (isMirrFirstOpenThisSession) {
            resetMirrToDefaults();
            isMirrFirstOpenThisSession = false;
        } else {
            hideMirrError();
            if (mirrResultContainer && mirrResultValue.textContent === "") {
                mirrResultContainer.style.display = 'none';
            }
        }

        if (mirrModalContent) {
            mirrModalContent.style.position = '';
            mirrModalContent.style.left = '';
            mirrModalContent.style.top = '';
        }

        mirrModal.style.display = 'flex';
    }

    function closeMirrModal() {
        if (mirrModal) mirrModal.style.display = 'none';
    }

    if (mirrBtn) mirrBtn.addEventListener('click', openMirrModal);
    if (closeMirrModalBtn) closeMirrModalBtn.addEventListener('click', closeMirrModal);
    if (addCashFlowRowBtn) addCashFlowRowBtn.addEventListener('click', () => addCashFlowRow("", 1));
    if (resetMirrBtn) resetMirrBtn.addEventListener('click', resetMirrToDefaults);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mirrModal && mirrModal.style.display === 'flex') {
            closeMirrModal();
        }
    });


    if (calculateMirrBtn) {
        calculateMirrBtn.addEventListener('click', function () {
            hideMirrError();
            try {
                const initialInvestment = parseFinancialInput(initialInvestmentInput.value);
                const financingRate = parseFinancialInput(financingRateInput.value) / 100;
                const reinvestmentRate = parseFinancialInput(reinvestmentRateInput.value) / 100;

                if (isNaN(initialInvestment) || isNaN(financingRate) || isNaN(reinvestmentRate)) {
                    throw new Error("Initial Investment, Financing Rate and Reinvestment Rate must be valid numbers.");
                }
                if (financingRate < -1 || reinvestmentRate < -1) {
                    throw new Error("Rates cannot be less than -100%.");
                }

                const cashFlowRows = cashFlowsTableBody.querySelectorAll('tr');
                if (cashFlowRows.length === 0 && initialInvestment === 0) {
                    throw new Error("Please add at least one cash flow or provide an initial investment.");
                }

                let expandedCashFlows = [];
                cashFlowRows.forEach(row => {
                    const amountInput = row.querySelector('.mirr-cash-flow-amount');
                    const quantityInput = row.querySelector('.mirr-cash-flow-quantity');

                    const amount = parseFinancialInput(amountInput.value);
                    const quantity = parseInt(quantityInput.value, 10);

                    if (isNaN(amount)) {
                        throw new Error(`Invalid value in one of the cash flow rows.`);
                    }
                    if (isNaN(quantity) || quantity < 1) {
                        throw new Error(`Invalid quantity in one of the cash flow rows. Quantity must be at least 1.`);
                    }

                    for (let i = 0; i < quantity; i++) {
                        expandedCashFlows.push(amount);
                    }
                });

                if (expandedCashFlows.length === 0 && initialInvestment === 0) {
                    throw new Error("No effective cash flow to calculate MIRR after expanding quantities.");
                }

                const N = expandedCashFlows.length;

                let pvOutflows = 0;
                if (initialInvestment < 0) {
                    pvOutflows += Math.abs(initialInvestment);
                }

                expandedCashFlows.forEach((cf, index) => {
                    const t = index + 1;
                    if (cf < 0) {
                        if (1 + financingRate === 0 && cf !== 0) throw new Error("Division by zero: Financing Rate is -100% with negative cash flow.");
                        pvOutflows += Math.abs(cf) / Math.pow(1 + financingRate, t);
                    }
                });

                let fvInflows = 0;
                if (initialInvestment > 0) {
                    fvInflows += initialInvestment * Math.pow(1 + reinvestmentRate, N);
                }

                expandedCashFlows.forEach((cf, index) => {
                    const t = index + 1;
                    if (cf > 0) {
                        fvInflows += cf * Math.pow(1 + reinvestmentRate, N - t);
                    }
                });

                if (N === 0 && initialInvestment === 0) {
                    throw new Error("Cannot calculate MIRR: No cash flow (N=0 and CF0=0).");
                }
                if (N === 0 && initialInvestment !== 0) {
                    if (initialInvestment < 0) {
                        mirrResultValue.textContent = "-100,000000%";
                        mirrResultContainer.style.display = 'block';
                        return;
                    } else {
                        throw new Error("Cannot calculate MIRR: Only a positive initial investment and no subsequent cash flows (N=0).");
                    }
                }

                if (pvOutflows === 0) {
                    if (fvInflows > 0) {
                        throw new Error("Cannot calculate MIRR: No cash outflow (PV of outflows is zero), but there are inflows. The return is infinite.");
                    } else {
                        mirrResultValue.textContent = "N/A (no cash flow)";
                        mirrResultContainer.style.display = 'block';
                        return;
                    }
                }
                if (fvInflows < 0 && pvOutflows > 0) {
                    throw new Error("Cannot calculate MIRR: FV of inflows is negative. Check cash flow signs and reinvestment rate.");
                }
                if (fvInflows === 0 && pvOutflows > 0 && N > 0) {
                    mirrResultValue.textContent = "-100,000000%";
                    mirrResultContainer.style.display = 'block';
                    return;
                }

                const mirr = Math.pow(fvInflows / pvOutflows, 1 / N) - 1;

                if (!isFinite(mirr)) {
                    throw new Error("Could not calculate a finite MIRR. Check the inputs.");
                }

                mirrResultValue.textContent = (mirr * 100).toFixed(6) + "%";
                mirrResultContainer.style.display = 'block';

            } catch (error) {
                showMirrError("Calculation Error: " + error.message);
                console.error("Error in MIRR Calculation:", error);
            }
        });
    }

    if (mirrModal && mirrModalContent) {
        let isMirrDragging = false;
        let mirrDragOffsetX, mirrDragOffsetY;

        mirrModalContent.style.cursor = 'grab';
        mirrModalContent.addEventListener('mousedown', function (e) {
            const targetTagName = e.target.tagName.toLowerCase();
            const isInteractiveElement = ['button', 'input', 'select', 'textarea'].includes(targetTagName) ||
                e.target.classList.contains('close') ||
                e.target.closest('#mirrCashFlowsTable') ||
                e.target.closest('.mirr-btn-add') ||
                e.target.closest('.mirr-button-group');

            if (isInteractiveElement) return;

            isMirrDragging = true;
            if (getComputedStyle(mirrModalContent).position !== 'absolute') {
                const rect = mirrModalContent.getBoundingClientRect();
                mirrModalContent.style.position = 'absolute';
                mirrModalContent.style.left = rect.left + 'px';
                mirrModalContent.style.top = rect.top + 'px';
                mirrModalContent.style.margin = '0';
            }

            mirrDragOffsetX = e.clientX - mirrModalContent.offsetLeft;
            mirrDragOffsetY = e.clientY - mirrModalContent.offsetTop;
            mirrModalContent.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';

            document.addEventListener('mousemove', onMirrMouseMove);
            document.addEventListener('mouseup', onMirrMouseUp);
        });

        function onMirrMouseMove(e) {
            if (!isMirrDragging) return;
            e.preventDefault();
            let newLeft = e.clientX - mirrDragOffsetX;
            let newTop = e.clientY - mirrDragOffsetY;

            const vpWidth = window.innerWidth;
            const vpHeight = window.innerHeight;
            const modalWidth = mirrModalContent.offsetWidth;
            const modalHeight = mirrModalContent.offsetHeight;

            newLeft = Math.max(0, Math.min(newLeft, vpWidth - modalWidth));
            newTop = Math.max(0, Math.min(newTop, vpHeight - modalHeight));

            mirrModalContent.style.left = newLeft + 'px';
            mirrModalContent.style.top = newTop + 'px';
        }

        function onMirrMouseUp() {
            if (!isMirrDragging) return;
            isMirrDragging = false;
            mirrModalContent.style.cursor = 'grab';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMirrMouseMove);
            document.removeEventListener('mouseup', onMirrMouseUp);
        }
    }
});