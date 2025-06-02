// calculator_irr.js
document.addEventListener('DOMContentLoaded', function() {
    const irrBtn = document.getElementById('irrBtn');
    const irrModal = document.getElementById('irrModal');
    const closeIrrModalBtn = document.getElementById('closeIrrModal');
    const irrModalContent = irrModal ? irrModal.querySelector('.modal-content.irr-modal') : null;

    const initialInvestmentInput = document.getElementById('irrInitialInvestment');
    const cashFlowsTableBody = document.getElementById('irrCashFlowsTableBody');
    const addCashFlowRowBtn = document.getElementById('addIrrCashFlowRow');
    const calculateIrrBtn = document.getElementById('calculateIrrBtn');
    const resetIrrBtn = document.getElementById('resetIrrBtn');
    const irrResultContainer = document.getElementById('irrResultContainer');
    const irrResultValue = document.getElementById('irrResultValue');
    const irrErrorMessage = document.getElementById('irrErrorMessage');
    const irrWarningMessage = document.getElementById('irrWarningMessage');


    let cfRowCounter = 0;
    let isIrrFirstOpenThisSession = true;

    function showIrrError(message) {
        if (irrErrorMessage) {
            irrErrorMessage.textContent = message;
            irrErrorMessage.style.display = 'block';
        }
        if (irrResultContainer) irrResultContainer.style.display = 'none';
        if (irrWarningMessage) irrWarningMessage.style.display = 'none';
    }

    function hideIrrError() {
        if (irrErrorMessage) {
            irrErrorMessage.textContent = '';
            irrErrorMessage.style.display = 'none';
        }
    }
    
    function showIrrWarning(message) {
        if (irrWarningMessage) {
            irrWarningMessage.textContent = message;
            irrWarningMessage.style.display = 'block';
        }
    }

    function hideIrrWarning() {
        if (irrWarningMessage) {
            irrWarningMessage.textContent = '';
            irrWarningMessage.style.display = 'none';
        }
    }

    function addCashFlowRow(amount = "", quantity = 1) {
        cfRowCounter++;
        const row = cashFlowsTableBody.insertRow();
        row.id = `irrCfRow-${cfRowCounter}`;

        const cellAmount = row.insertCell();
        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.className = 'irr-cash-flow-amount';
        amountInput.value = amount;
        amountInput.placeholder = "e.g., 200 or -150";
        amountInput.enterKeyHint = "enter";
        cellAmount.appendChild(amountInput);

        const cellQuantity = row.insertCell();
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.className = 'irr-cash-flow-quantity';
        quantityInput.value = quantity;
        quantityInput.min = '1';
        quantityInput.step = '1';
        quantityInput.enterKeyHint = "enter";
        cellQuantity.appendChild(quantityInput);

        const cellAction = row.insertCell();
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'irr-remove-cf-btn';
        removeBtn.type = 'button';
        removeBtn.onclick = function() {
            row.remove();
        };
        cellAction.appendChild(removeBtn);

        if (typeof window.handleNumericInputKeydown === 'function' && typeof window.handleNumericInputDblClick === 'function') {
            [amountInput, quantityInput].forEach(input => {
                input.removeEventListener('keydown', window.handleNumericInputKeydown);
                input.addEventListener('keydown', window.handleNumericInputKeydown);
                input.removeEventListener('dblclick', window.handleNumericInputDblClick);
                input.addEventListener('dblclick', window.handleNumericInputDblClick);
                input.title = "Press Enter, F1, Space or double-click to access the calculator";
            });
        }
    }

    function resetIrrToDefaults() {
        hideIrrError();
        hideIrrWarning();
        if (irrResultContainer) irrResultContainer.style.display = 'none';

        if(initialInvestmentInput) initialInvestmentInput.value = "-1000.00";

        while (cashFlowsTableBody.firstChild) {
            cashFlowsTableBody.removeChild(cashFlowsTableBody.firstChild);
        }
        cfRowCounter = 0;
        // Example cash flows for IRR
        addCashFlowRow(200, 1);
        addCashFlowRow(300, 1);
        addCashFlowRow(400, 1);
        addCashFlowRow(500, 1);
    }

    function openIrrModal() {
        if (!irrModal) return;

        if (isIrrFirstOpenThisSession) {
            resetIrrToDefaults();
            isIrrFirstOpenThisSession = false;
        } else {
            hideIrrError();
            hideIrrWarning();
            if (irrResultContainer && irrResultValue.textContent === "") {
                 irrResultContainer.style.display = 'none';
            }
        }
        
        if (irrModalContent) {
            irrModalContent.style.position = ''; // Reset position for re-centering
            irrModalContent.style.left = '';
            irrModalContent.style.top = '';
        }
        irrModal.style.display = 'flex';
    }

    function closeIrrModal() {
        if (irrModal) irrModal.style.display = 'none';
    }

    if (irrBtn) irrBtn.addEventListener('click', openIrrModal);
    if (closeIrrModalBtn) closeIrrModalBtn.addEventListener('click', closeIrrModal);
    if (addCashFlowRowBtn) addCashFlowRowBtn.addEventListener('click', () => addCashFlowRow("", 1));
    if (resetIrrBtn) resetIrrBtn.addEventListener('click', resetIrrToDefaults);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && irrModal && irrModal.style.display === 'flex') {
            closeIrrModal();
        }
    });

    // IRR Calculation (Newton-Raphson method)
    function calculateNPV(rate, cashFlows) {
        let npv = 0;
        for (let i = 0; i < cashFlows.length; i++) {
            npv += cashFlows[i] / Math.pow(1 + rate, i);
        }
        return npv;
    }

    function calculateNPVDerivative(rate, cashFlows) {
        let derivative = 0;
        for (let i = 1; i < cashFlows.length; i++) { // Start from i=1 as CF0 derivative is 0
            if (cashFlows[i] !== 0) { // Avoid issues if CF_i is 0
                 derivative -= (i * cashFlows[i]) / Math.pow(1 + rate, i + 1);
            }
        }
        return derivative;
    }

    function findIRR(cashFlows, guess = 0.1, maxIterations = 100, tolerance = 1e-7) {
        let rate = guess;

        // Basic checks
        if (cashFlows.length === 0) return { error: "No cash flows provided." };
        if (cashFlows.length === 1) return { error: "IRR requires at least one cash flow after the initial investment."};
        
        let allPositive = cashFlows.every(cf => cf >= 0);
        let allNegative = cashFlows.every(cf => cf <= 0);
        if (allPositive || allNegative) {
             return { error: "IRR cannot be calculated if all cash flows have the same sign." };
        }
        
        // Check for sign changes for multiple IRR warning
        let signChanges = 0;
        for (let i = 1; i < cashFlows.length; i++) {
            if ((cashFlows[i-1] < 0 && cashFlows[i] > 0) || (cashFlows[i-1] > 0 && cashFlows[i] < 0)) {
                signChanges++;
            }
        }
        const multipleIrrWarning = signChanges > 1 ? "Warning: Multiple sign changes in cash flows. There might be more than one IRR, or no IRR. The value shown is one potential solution." : null;


        for (let i = 0; i < maxIterations; i++) {
            const npv = calculateNPV(rate, cashFlows);
            const derivative = calculateNPVDerivative(rate, cashFlows);

            if (Math.abs(derivative) < tolerance) { // Derivative is too small, might not converge
                return { error: "Could not find IRR (derivative too small). Try a different initial guess or check cash flows.", warning: multipleIrrWarning };
            }
            
            const newRate = rate - npv / derivative;

            if (Math.abs(newRate - rate) < tolerance) {
                if (!isFinite(newRate)) return { error: "IRR calculation resulted in a non-finite number.", warning: multipleIrrWarning };
                return { value: newRate, warning: multipleIrrWarning };
            }
            rate = newRate;
            if (!isFinite(rate) || rate < -1) { // Rate exploded or became less than -100%
                 // Try a different guess or stop. For simplicity, we stop here.
                 // A more robust solution might try several guesses (e.g., -0.5, 0, 0.5)
                 // or use a bracketing method if Newton-Raphson fails.
                 break; 
            }
        }
        return { error: "IRR did not converge within the maximum iterations. Consider adjusting cash flows or try a bracketing method if available.", warning: multipleIrrWarning };
    }


    if (calculateIrrBtn) {
        calculateIrrBtn.addEventListener('click', function() {
            hideIrrError();
            hideIrrWarning();
            try {
                const initialInvestment = parseFloat(initialInvestmentInput.value);
                if (isNaN(initialInvestment)) {
                    throw new Error("Initial Investment must be a valid number.");
                }

                const cashFlowRows = cashFlowsTableBody.querySelectorAll('tr');
                let expandedCashFlows = [];
                cashFlowRows.forEach(row => {
                    const amountInput = row.querySelector('.irr-cash-flow-amount');
                    const quantityInput = row.querySelector('.irr-cash-flow-quantity');
                    const amount = parseFloat(amountInput.value);
                    const quantity = parseInt(quantityInput.value, 10);

                    if (isNaN(amount)) throw new Error(`Invalid amount in one of the cash flow rows.`);
                    if (isNaN(quantity) || quantity < 1) throw new Error(`Invalid quantity. Must be at least 1.`);
                    
                    for (let i = 0; i < quantity; i++) {
                        expandedCashFlows.push(amount);
                    }
                });

                if (expandedCashFlows.length === 0 && initialInvestment === 0) {
                    throw new Error("Please add at least one cash flow or provide an initial investment.");
                }
                 if (expandedCashFlows.length === 0 && initialInvestment !== 0) {
                     // If only CF0 exists, IRR is -100% if CF0 < 0, or undefined/infinite if CF0 > 0.
                     // Most IRR functions would error or return specific values.
                     // For simplicity, let's treat it as an error needing more flows.
                     throw new Error("IRR calculation requires cash flows subsequent to the initial investment.");
                 }


                const allCashFlows = [initialInvestment, ...expandedCashFlows];
                
                // Initial check for trivial cases
                if (allCashFlows.every(cf => cf === 0)) {
                    throw new Error("All cash flows are zero. IRR is undefined.");
                }
                
                // Try a few different initial guesses if the first one fails
                const guesses = [0.1, 0, -0.1, 0.05, 0.2];
                let result = null;
                for (const guess of guesses) {
                    result = findIRR(allCashFlows, guess);
                    if (result && typeof result.value === 'number') break; // Found a solution
                }


                if (result && typeof result.value === 'number') {
                    irrResultValue.textContent = (result.value * 100).toFixed(6) + "%";
                    irrResultContainer.style.display = 'block';
                    if (result.warning) {
                        showIrrWarning(result.warning);
                    }
                } else {
                    let errorMessage = "Could not calculate IRR. ";
                    if (result && result.error) {
                        errorMessage += result.error;
                    } else {
                        errorMessage += "Please check your cash flow inputs. Ensure there's a mix of positive and negative flows that could lead to an NPV of zero.";
                    }
                     if (result && result.warning) { // Show warning even if error occurred
                        showIrrWarning(result.warning);
                    }
                    showIrrError(errorMessage);
                }

            } catch (error) {
                showIrrError("Calculation Error: " + error.message);
                console.error("IRR Calc Error:", error);
            }
        });
    }

    // Modal Drag Logic (copied and adapted from MIRR)
    if (irrModal && irrModalContent) {
        let isIrrDragging = false;
        let irrDragOffsetX, irrDragOffsetY;

        irrModalContent.style.cursor = 'grab';
        irrModalContent.addEventListener('mousedown', function(e) {
            const targetTagName = e.target.tagName.toLowerCase();
            const isInteractiveElement = ['button', 'input', 'select', 'textarea'].includes(targetTagName) ||
                                         e.target.classList.contains('close') ||
                                         e.target.closest('#irrCashFlowsTable') ||
                                         e.target.closest('.irr-btn-add') ||
                                         e.target.closest('.irr-button-group');

            if (isInteractiveElement) return;

            isIrrDragging = true;
            if (getComputedStyle(irrModalContent).position !== 'absolute') {
                const rect = irrModalContent.getBoundingClientRect();
                irrModalContent.style.position = 'absolute';
                irrModalContent.style.left = rect.left + 'px';
                irrModalContent.style.top = rect.top + 'px';
                irrModalContent.style.margin = '0';
            }

            irrDragOffsetX = e.clientX - irrModalContent.offsetLeft;
            irrDragOffsetY = e.clientY - irrModalContent.offsetTop;
            irrModalContent.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';

            document.addEventListener('mousemove', onIrrMouseMove);
            document.addEventListener('mouseup', onIrrMouseUp);
        });

        function onIrrMouseMove(e) {
            if (!isIrrDragging) return;
            e.preventDefault();
            let newLeft = e.clientX - irrDragOffsetX;
            let newTop = e.clientY - irrDragOffsetY;

            const vpWidth = window.innerWidth;
            const vpHeight = window.innerHeight;
            const modalWidth = irrModalContent.offsetWidth;
            const modalHeight = irrModalContent.offsetHeight;

            newLeft = Math.max(0, Math.min(newLeft, vpWidth - modalWidth));
            newTop = Math.max(0, Math.min(newTop, vpHeight - modalHeight));

            irrModalContent.style.left = newLeft + 'px';
            irrModalContent.style.top = newTop + 'px';
        }

        function onIrrMouseUp() {
            if (!isIrrDragging) return;
            isIrrDragging = false;
            irrModalContent.style.cursor = 'grab';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onIrrMouseMove);
            document.removeEventListener('mouseup', onIrrMouseUp);
        }
    }
});