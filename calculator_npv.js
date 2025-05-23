// calculator_npv.js
document.addEventListener('DOMContentLoaded', function() {
    const npvBtn = document.getElementById('npvBtn');
    const npvModal = document.getElementById('npvModal');
    const closeNpvModalBtn = document.getElementById('closeNpvModal');
    const npvModalContent = npvModal ? npvModal.querySelector('.modal-content.npv-modal') : null;

    const initialInvestmentInput = document.getElementById('npvInitialInvestment');
    const overallDiscountRateInput = document.getElementById('npvOverallDiscountRate');
    const financingRateInput = document.getElementById('npvFinancingRate');
    const reinvestmentRateInput = document.getElementById('npvReinvestmentRate');

    const cashFlowsTableBody = document.getElementById('npvCashFlowsTableBody');
    const addCashFlowRowBtn = document.getElementById('addNpvCashFlowRow');
    const calculateNpvBtn = document.getElementById('calculateNpvBtn');
    
    const npvResultContainer = document.getElementById('npvResultContainer');
    const npvResultTitle = document.getElementById('npvResultTitle'); 
    const npvResultValue = document.getElementById('npvResultValue');
    const npvErrorMessage = document.getElementById('npvErrorMessage');

    let cfRowCounterNpv = 0;

    function showNpvError(message) {
        if (npvErrorMessage) {
            npvErrorMessage.textContent = message;
            npvErrorMessage.style.display = 'block';
        }
        if (npvResultContainer) npvResultContainer.style.display = 'none';
    }

    function hideNpvError() {
        if (npvErrorMessage) {
            npvErrorMessage.textContent = '';
            npvErrorMessage.style.display = 'none';
        }
    }
    
    function addNpvCashFlowRow(amount = "", quantity = 1) {
        cfRowCounterNpv++;
        const row = cashFlowsTableBody.insertRow();
        row.id = `npvCfRow-${cfRowCounterNpv}`;

        const cellAmount = row.insertCell();
        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.className = 'npv-cash-flow-amount';
        amountInput.value = amount;
        amountInput.placeholder = "e.g., 200 or -150";
        amountInput.enterKeyHint = "enter"; // MODIFICADO
        cellAmount.appendChild(amountInput);

        const cellQuantity = row.insertCell();
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.className = 'npv-cash-flow-quantity';
        quantityInput.value = quantity;
        quantityInput.min = '1';
        quantityInput.step = '1';
        quantityInput.enterKeyHint = "enter"; // MODIFICADO
        cellQuantity.appendChild(quantityInput);

        const cellAction = row.insertCell();
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'npv-remove-cf-btn';
        removeBtn.type = 'button';
        removeBtn.onclick = function() {
            row.remove();
        };
        cellAction.appendChild(removeBtn);

        // Adicionar event listener para F1/Enter/Espaço aos inputs dinâmicos
        if (typeof window.handleNumericInputKeydown === 'function') {
            [amountInput, quantityInput].forEach(input => {
                input.addEventListener('keydown', window.handleNumericInputKeydown);
                // Adicionar title para consistência
                input.title = "Pressione Enter, F1 ou Espaço para acessar a calculadora";
            });
        } else {
            console.warn('window.handleNumericInputKeydown não está definida. A calculadora pode não abrir com Enter/F1/Espaço nos campos dinâmicos de NPV.');
        }
    }

    function setupDynamicTooltips(modalElement) {
        if (!modalElement) return;
        const tooltips = modalElement.querySelectorAll('.tooltip');
        const tooltipMargin = 15; 

        tooltips.forEach(tooltip => {
            const tooltipText = tooltip.querySelector('.tooltiptext');
            if (!tooltipText) return;

            tooltip.addEventListener('mouseover', function(event) {
                tooltipText.classList.remove('tooltiptext-above', 'tooltiptext-below');
                
                let actualTooltipHeight = tooltipText.offsetHeight;
                let needsTempShow = false;
                if (actualTooltipHeight === 0) {
                    needsTempShow = true;
                    tooltipText.style.visibility = 'hidden'; 
                    tooltipText.style.position = 'absolute'; 
                    tooltipText.style.display = 'block';
                    actualTooltipHeight = tooltipText.offsetHeight;
                }

                const iconRect = tooltip.getBoundingClientRect();
                const modalContent = modalElement.querySelector('.modal-content');
                const modalContentRect = modalContent.getBoundingClientRect();
                
                const iconTopRelativeToModalContent = iconRect.top - modalContentRect.top;

                if (iconTopRelativeToModalContent - actualTooltipHeight - tooltipMargin < 0) {
                    tooltipText.classList.add('tooltiptext-below');
                } else {
                    tooltipText.classList.add('tooltiptext-above');
                }

                if (needsTempShow) { 
                    tooltipText.style.display = '';
                    tooltipText.style.position = '';
                }
            });
        });
    }


    function openNpvModal() {
        if (!npvModal) return;
        hideNpvError();
        if (npvResultContainer) npvResultContainer.style.display = 'none';
        
        if (initialInvestmentInput) initialInvestmentInput.value = "-1000.00";
        if (overallDiscountRateInput) overallDiscountRateInput.value = "10.0";
        if (financingRateInput) financingRateInput.value = "0.00";
        if (reinvestmentRateInput) reinvestmentRateInput.value = "0.00";
        
        // Limpa as linhas existentes antes de adicionar as padrão, se necessário
        while (cashFlowsTableBody.firstChild) {
            cashFlowsTableBody.removeChild(cashFlowsTableBody.firstChild);
        }
        cfRowCounterNpv = 0; // Reseta o contador de linhas
        addNpvCashFlowRow(200, 1); 
        addNpvCashFlowRow(300, 2); 
        addNpvCashFlowRow(500, 1); 
        
        if (npvModalContent) { 
            npvModalContent.style.position = ''; 
            npvModalContent.style.left = '';
            npvModalContent.style.top = '';
        }
        npvModal.style.display = 'flex'; 

        setTimeout(() => {
            if (npvModal) { 
                 setupDynamicTooltips(npvModal);
            }
        }, 50); 
    }

    function closeNpvModal() {
        if (npvModal) npvModal.style.display = 'none';
    }

    if (npvBtn) npvBtn.addEventListener('click', openNpvModal);
    if (closeNpvModalBtn) closeNpvModalBtn.addEventListener('click', closeNpvModal);
    if (addCashFlowRowBtn) addCashFlowRowBtn.addEventListener('click', () => addNpvCashFlowRow("", 1)); // Adiciona linha vazia

    window.addEventListener('click', function(event) {
        if (event.target === npvModal) {
            closeNpvModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && npvModal && npvModal.style.display === 'flex') {
            closeNpvModal();
        }
    });

    if (calculateNpvBtn) {
        calculateNpvBtn.addEventListener('click', function() {
            hideNpvError();
            try {
                const initialInvestment = parseFloat(initialInvestmentInput.value);
                const overallDiscountRate = parseFloat(overallDiscountRateInput.value) / 100;
                let financingRate = parseFloat(financingRateInput.value);
                if (isNaN(financingRate) || financingRateInput.value.trim() === "") financingRate = 0; else financingRate /= 100;

                let reinvestmentRate = parseFloat(reinvestmentRateInput.value);
                if (isNaN(reinvestmentRate) || reinvestmentRateInput.value.trim() === "") reinvestmentRate = 0; else reinvestmentRate /= 100;

                if (isNaN(initialInvestment) || isNaN(overallDiscountRateInput.value)) {
                    throw new Error("Initial Investment and Overall Discount Rate must be valid numbers.");
                }
                 if (overallDiscountRate <= -1 && overallDiscountRateInput.value.trim() !== "") { 
                    throw new Error("Overall Discount Rate must be greater than -100%.");
                }
                if (financingRate <= -1 && financingRateInput.value.trim() !== "" && financingRateInput.value !== "0.00" && financingRateInput.value !== "0") {
                     throw new Error("Financing Rate must be greater than -100%.");
                }
                if (reinvestmentRate <= -1 && reinvestmentRateInput.value.trim() !== "" && reinvestmentRateInput.value !== "0.00" && reinvestmentRateInput.value !== "0") {
                     throw new Error("Reinvestment Rate must be greater than -100%.");
                }

                const cashFlowRows = cashFlowsTableBody.querySelectorAll('tr');
                let expandedCashFlows = [];
                cashFlowRows.forEach(row => {
                    const amountInput = row.querySelector('.npv-cash-flow-amount');
                    const quantityInput = row.querySelector('.npv-cash-flow-quantity');
                    const amount = parseFloat(amountInput.value);
                    const quantity = parseInt(quantityInput.value, 10);

                    if (isNaN(amount)) throw new Error(`Invalid amount in one of the cash flow rows.`);
                    if (isNaN(quantity) || quantity < 1) throw new Error(`Invalid quantity. Must be at least 1.`);
                    for (let i = 0; i < quantity; i++) expandedCashFlows.push(amount);
                });

                let npv = 0;
                let resultTitleText = "NPV Result:"; 

                const finRateIsEffectivelyZero = (financingRate === 0 && (financingRateInput.value.trim() === "" || financingRateInput.value === "0.00" || financingRateInput.value === "0"));
                const reinRateIsEffectivelyZero = (reinvestmentRate === 0 && (reinvestmentRateInput.value.trim() === "" || reinvestmentRateInput.value === "0.00" || reinvestmentRateInput.value === "0"));
                const useTraditionalNpv = finRateIsEffectivelyZero && reinRateIsEffectivelyZero;

                if (useTraditionalNpv) {
                    npv = initialInvestment;
                    expandedCashFlows.forEach((cf, index) => {
                        if (1 + overallDiscountRate === 0 && cf !== 0) throw new Error("Division by zero due to Overall Discount Rate of -100%.");
                        npv += cf / Math.pow(1 + overallDiscountRate, index + 1);
                    });
                    resultTitleText = "NPV Result:";
                } else {
                    const effectiveFinancingRate = finRateIsEffectivelyZero ? overallDiscountRate : financingRate;
                    const effectiveReinvestmentRate = reinRateIsEffectivelyZero ? overallDiscountRate : reinvestmentRate;
                    
                    let pvIntermediateOutflows = 0;
                    expandedCashFlows.forEach((cf, index) => {
                        if (cf < 0) {
                            if (1 + effectiveFinancingRate === 0 && cf !== 0) throw new Error("Division by zero due to effective Financing Rate of -100%.");
                            pvIntermediateOutflows += cf / Math.pow(1 + effectiveFinancingRate, index + 1);
                        }
                    });

                    let fvInflowsAtEnd = 0;
                    const numPeriods = expandedCashFlows.length;
                    expandedCashFlows.forEach((cf, index) => {
                        if (cf > 0) {
                            fvInflowsAtEnd += cf * Math.pow(1 + effectiveReinvestmentRate, numPeriods - (index + 1));
                        }
                    });
                    
                    if (1 + overallDiscountRate === 0 && fvInflowsAtEnd !== 0) throw new Error("Division by zero due to Overall Discount Rate of -100% when discounting future value of inflows.");
                    const pvOfFvInflows = numPeriods > 0 ? (fvInflowsAtEnd / Math.pow(1 + overallDiscountRate, numPeriods)) : 0;
                    
                    npv = initialInvestment + pvIntermediateOutflows + pvOfFvInflows;

                    if (!finRateIsEffectivelyZero && !reinRateIsEffectivelyZero) {
                        resultTitleText = "NPV (using Fin. & Reinv. Rates):";
                    } else if (!finRateIsEffectivelyZero) {
                        resultTitleText = "NPV (using Financing Rate):";
                    } else if (!reinRateIsEffectivelyZero) {
                        resultTitleText = "NPV (using Reinvestment Rate):";
                    }
                }

                if (!isFinite(npv)) {
                    throw new Error("Could not calculate a finite NPV. Check inputs.");
                }

                npvResultTitle.textContent = resultTitleText;
                npvResultValue.textContent = npv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                npvResultContainer.style.display = 'block';

            } catch (error) {
                showNpvError("Calculation Error: " + error.message);
                console.error("NPV Calc Error:", error);
            }
        });
    }

    if (npvModal && npvModalContent) {
        let isNpvDragging = false;
        let npvDragOffsetX, npvDragOffsetY;
        
        npvModalContent.style.cursor = 'grab';
        npvModalContent.addEventListener('mousedown', function(e) {
            const targetTagName = e.target.tagName.toLowerCase();
            const isInteractiveElement = ['button', 'input', 'select', 'textarea', 'span'].includes(targetTagName) ||
                                         e.target.classList.contains('close') ||
                                         e.target.closest('#npvCashFlowsTable') || 
                                         e.target.closest('.npv-btn-add') ||
                                         e.target.closest('.npv-button-group') ||
                                         e.target.classList.contains('tooltip') || 
                                         e.target.classList.contains('tooltiptext');

            if (isInteractiveElement) return;

            isNpvDragging = true;
            if (getComputedStyle(npvModalContent).position !== 'absolute') {
                const rect = npvModalContent.getBoundingClientRect();
                npvModalContent.style.position = 'absolute';
                npvModalContent.style.left = rect.left + 'px';
                npvModalContent.style.top = rect.top + 'px';
                npvModalContent.style.margin = '0';
            }
            
            npvDragOffsetX = e.clientX - npvModalContent.offsetLeft;
            npvDragOffsetY = e.clientY - npvModalContent.offsetTop;
            npvModalContent.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';

            document.addEventListener('mousemove', onNpvMouseMove);
            document.addEventListener('mouseup', onNpvMouseUp);
        });

        function onNpvMouseMove(e) {
            if (!isNpvDragging) return;
            e.preventDefault();
            let newLeft = e.clientX - npvDragOffsetX;
            let newTop = e.clientY - npvDragOffsetY;

            const vpWidth = window.innerWidth;
            const vpHeight = window.innerHeight;
            const modalWidth = npvModalContent.offsetWidth;
            const modalHeight = npvModalContent.offsetHeight;

            newLeft = Math.max(0, Math.min(newLeft, vpWidth - modalWidth));
            newTop = Math.max(0, Math.min(newTop, vpHeight - modalHeight));

            npvModalContent.style.left = newLeft + 'px';
            npvModalContent.style.top = newTop + 'px';
        }

        function onNpvMouseUp() {
            if (!isNpvDragging) return;
            isNpvDragging = false;
            npvModalContent.style.cursor = 'grab';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onNpvMouseMove);
            document.removeEventListener('mouseup', onNpvMouseUp);
        }
    }
    
    // Não adiciona linhas padrão se já houver alguma, para permitir reabertura sem resetar inputs manuais
    // A função openNpvModal agora limpa e adiciona as linhas padrão sempre.
});