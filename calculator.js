// calculadora.js - Basic calculator implementation

document.addEventListener('DOMContentLoaded', function() {
    // -------------------------------------------------------------------
    // STATE VARIABLE DECLARATION
    // -------------------------------------------------------------------
    let currentInput = '0';
    let previousInput = '';
    let calculationOperator = '';
    let resetScreen = false;
    let expressionMode = false;
    let activeInputField = null;

    // Math constants
    const MATH_CONSTANTS = {
        pi: Math.PI,
        euler: Math.E,
        phi: (1 + Math.sqrt(5)) / 2,
    };
    const CONSTANT_VALUES_AS_STRINGS = Object.values(MATH_CONSTANTS).map(v => v.toString());
    const FUNCTION_NAMES = ['sqrt', 'log', 'ln', 'exp'];
    // -------------------------------------------------------------------

    // DOM Elements
    const calculatorBtn = document.getElementById('calculatorBtn');
    const calculatorModal = document.getElementById('calculatorModal');
    const closeCalculatorModal = document.getElementById('closeCalculatorModal');
    const calcDisplay = document.getElementById('calcDisplay');
    const calcButtons = document.querySelectorAll('.calc-btn');
    const calculatorModalContentEl = calculatorModal ? calculatorModal.querySelector('.modal-content.calculator-modal') : null;

    // Initial checks (critical errors if main elements are not found)
    if (!calculatorBtn) console.error("CRITICAL ERROR: Button #calculatorBtn NOT found!");
    if (!calculatorModal) console.error("CRITICAL ERROR: Modal #calculatorModal NOT found!");
    if (!closeCalculatorModal) console.warn("WARNING: Button #closeCalculatorModal not found.");
    if (!calcDisplay) console.warn("WARNING: Display #calcDisplay not found.");


    // --- MODAL DRAG LOGIC ---
    if (calculatorModal && calculatorModalContentEl && closeCalculatorModal) {
        let isDragging = false;
        let dragOffsetX, dragOffsetY;

        window.resetCalculatorModalPosition = function() {
            if (calculatorModalContentEl) {
                calculatorModalContentEl.style.position = '';
                calculatorModalContentEl.style.left = '';
                calculatorModalContentEl.style.top = '';
                calculatorModalContentEl.style.margin = '';
                calculatorModalContentEl.style.cursor = 'grab';
            }
        }

        if (calculatorModalContentEl) {
            calculatorModalContentEl.style.cursor = 'grab';
            calculatorModalContentEl.addEventListener('mousedown', function(e) {
                const targetTagName = e.target.tagName.toLowerCase();
                const isInteractiveElement = targetTagName === 'button' || targetTagName === 'input' || e.target === closeCalculatorModal || e.target.closest('.calc-buttons');
                if (isInteractiveElement) return;

                isDragging = true;
                if (calculatorModalContentEl.style.position !== 'absolute') {
                    const rect = calculatorModalContentEl.getBoundingClientRect();
                    calculatorModalContentEl.style.position = 'absolute';
                    calculatorModalContentEl.style.left = rect.left + 'px';
                    calculatorModalContentEl.style.top = rect.top + 'px';
                    calculatorModalContentEl.style.margin = '0';
                }
                dragOffsetX = e.clientX - calculatorModalContentEl.offsetLeft;
                dragOffsetY = e.clientY - calculatorModalContentEl.offsetTop;
                calculatorModalContentEl.style.cursor = 'grabbing';
                document.body.style.userSelect = 'none';
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }

        function onMouseMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            let newLeft = e.clientX - dragOffsetX;
            let newTop = e.clientY - dragOffsetY;
            const vpWidth = window.innerWidth, vpHeight = window.innerHeight;
            const modalWidth = calculatorModalContentEl.offsetWidth, modalHeight = calculatorModalContentEl.offsetHeight;
            newLeft = Math.max(0, Math.min(newLeft, vpWidth - modalWidth));
            newTop = Math.max(0, Math.min(newTop, vpHeight - modalHeight));
            calculatorModalContentEl.style.left = newLeft + 'px';
            calculatorModalContentEl.style.top = newTop + 'px';
        }

        function onMouseUp() {
            if (!isDragging) return;
            isDragging = false;
            if (calculatorModalContentEl) calculatorModalContentEl.style.cursor = 'grab';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    } else {
        console.warn("Modal drag logic NOT configured due to missing elements.");
    }
    // --- END DRAG ---

    // --- HELPER FUNCTIONS ---
    function endsWithConstant(str) {
        for (const c of CONSTANT_VALUES_AS_STRINGS) {
            if (str.endsWith(c)) {
                if (str.length === c.length || !/[a-zA-Z0-9.]/.test(str.charAt(str.length - c.length - 1))) {
                    return true;
                }
            }
        }
        return false;
    }

    function endsWithCompleteFunction(str) {
        for (const funcName of FUNCTION_NAMES) {
            if (str.endsWith(')')) {
                const funcCallRegex = new RegExp(funcName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\((.*)\\)$');
                const match = str.match(funcCallRegex);
                if (match) {
                    let openParen = 0;
                    for (const char of match[1]) {
                        if (char === '(') openParen++;
                        else if (char === ')') openParen--;
                        if (openParen < 0) return false;
                    }
                    return openParen === 0;
                }
            }
        }
        return false;
    }

    function shouldInsertMultiplication(inputStr) {
        if (inputStr === '0' || inputStr === 'Error') return false; // Changed 'Erro' to 'Error'
        const lastChar = inputStr.charAt(inputStr.length - 1);
        return (/\d$/.test(lastChar) || lastChar === ')' || endsWithConstant(inputStr) || endsWithCompleteFunction(inputStr));
    }

    function getOperatorChar(opAction) {
        switch (opAction) {
            case 'add': return '+';
            case 'subtract': return '-';
            case 'multiply': return '×';
            case 'divide': return '÷';
            case 'power': return '^';
            default: return '';
        }
    }

    function _resetCalculationInternalState() {
        previousInput = '';
        calculationOperator = '';
        resetScreen = true;
        expressionMode = false;
    }

    // --- MAIN CALCULATOR FUNCTIONS ---
    function openCalculator() {
        if (!calculatorModal) {
            console.error("ERROR in openCalculator: calculatorModal is NULL!");
            return;
        }
        if (typeof window.resetCalculatorModalPosition === 'function') {
            window.resetCalculatorModalPosition();
        }
		// calculatorModal.style.display = "block"; // Linha Antiga
		calculatorModal.style.display = "flex";    // Nova Linha
        if (calcDisplay) {
            calcDisplay.focus();
        } else {
            console.warn("Could not focus on calcDisplay because it is NULL.");
        }
    }

    function updateDisplay() {
        if (calcDisplay) {
            calcDisplay.value = currentInput; // Display '.' as decimal separator (already done)
        }
    }

    function inputDigit(digit) {
        if (resetScreen) {
            const lastChar = currentInput.charAt(currentInput.length - 1);
            if (!'+-×÷^('.includes(lastChar) && currentInput !== 'Error') { // Changed 'Erro' to 'Error'
                if (shouldInsertMultiplication(currentInput)) {
                    currentInput += '×' + digit;
                } else {
                    currentInput = digit;
                }
            } else {
                if (currentInput === 'Error') currentInput = digit; // Changed 'Erro' to 'Error'
                else currentInput += digit;
            }
            resetScreen = false;
        } else {
            if (currentInput.charAt(currentInput.length - 1) === ')' && /\d$/.test(digit)) {
                 currentInput += '×' + digit;
            } else {
                currentInput = (currentInput === '0') ? digit : currentInput + digit;
            }
        }
        expressionMode = true;
    }

    function inputConstant(constantName) {
        const value = MATH_CONSTANTS[constantName].toString();
        if (resetScreen && !'+-×÷^('.includes(currentInput.charAt(currentInput.length - 1)) && currentInput !== 'Error') { // Changed 'Erro' to 'Error'
            if (shouldInsertMultiplication(currentInput)) {
                currentInput += '×' + value;
            } else {
                currentInput = value;
            }
        } else {
            if (shouldInsertMultiplication(currentInput)) {
                currentInput += '×' + value;
            } else {
                 currentInput = (currentInput === '0' || currentInput === 'Error') ? value : currentInput + value; // Changed 'Erro' to 'Error'
            }
        }
        expressionMode = true;
        resetScreen = true;
    }

    function inputParenthesis(parenthesis) {
        expressionMode = true;
        if (parenthesis === '(') {
            if (shouldInsertMultiplication(currentInput)) {
                currentInput += '×' + parenthesis;
            } else {
                currentInput = (currentInput === '0' || currentInput === 'Error') ? parenthesis : currentInput + parenthesis; // Changed 'Erro' to 'Error'
            }
        } else { // ')'
            let openCount = (currentInput.match(/\(/g) || []).length;
            let closeCount = (currentInput.match(/\)/g) || []).length;
            const lastChar = currentInput.charAt(currentInput.length - 1);
            if (openCount > closeCount && !'+-×÷^('.includes(lastChar) && lastChar !== 'Error') { // Changed 'Erro' to 'Error'
                currentInput += parenthesis;
            } else {
                // Silently ignore invalid ')'
                return;
            }
        }
        resetScreen = false;
    }

    function calculateFunction(funcKey) {
        const displayFunction = funcKey;
        expressionMode = true;
        if (shouldInsertMultiplication(currentInput)) {
            currentInput += '×' + displayFunction + '(';
        } else {
            currentInput = (currentInput === '0' || currentInput === 'Error') ? (displayFunction + '(') : (currentInput + displayFunction + '('); // Changed 'Erro' to 'Error'
        }
        resetScreen = false;
    }

    function inputDecimal() {
        const match = currentInput.match(/[^+\-×÷^()]*$/);
        const lastNumberSegment = match ? match[0] : "";
        if (lastNumberSegment.includes('.')) return; // Use '.' for decimal

        if (resetScreen) {
            const lastChar = currentInput.charAt(currentInput.length - 1);
            if ('+-×÷^('.includes(lastChar) || currentInput === 'Error') { // Changed 'Erro' to 'Error'
                currentInput = (currentInput === 'Error' ? '0.' : currentInput + '0.'); // Changed 'Erro' to 'Error'
            } else {
                 if (shouldInsertMultiplication(currentInput)){
                     currentInput += '×0.';
                 } else {
                     currentInput = '0.';
                 }
            }
            resetScreen = false;
        } else {
            const lastChar = currentInput.charAt(currentInput.length - 1);
            if (currentInput === '0') {
                currentInput = '0.';
            } else if ('+-×÷^('.includes(lastChar)) {
                currentInput += '0.';
            } else {
                currentInput += '.';
            }
        }
        expressionMode = true;
    }

    function handleOperator(operatorAction) {
        const operatorChar = getOperatorChar(operatorAction);
        const lastChar = currentInput.charAt(currentInput.length - 1);

        if (currentInput === 'Error') return; // Changed 'Erro' to 'Error'

        if ('+-×÷^'.includes(lastChar) && lastChar !== '(') {
            if (operatorChar === '-' && (lastChar === '×' || lastChar === '÷' || lastChar === '^')) {
                currentInput += operatorChar;
            } else {
                currentInput = currentInput.slice(0, -1) + operatorChar;
            }
        } else if (lastChar !== '(' || operatorChar === '-') {
            currentInput += operatorChar;
        } else {
            return;
        }
        expressionMode = true;
        resetScreen = true;
    }

    function negateValue() {
        if (currentInput === 'Error') return; // Changed 'Erro' to 'Error'
        if (!expressionMode && currentInput !== '0' && !isNaN(parseFloat(currentInput))) {
            currentInput = (parseFloat(currentInput) * -1).toString();
            updateDisplay();
            return;
        }
        if (currentInput === '0') { currentInput = '-'; expressionMode = true; updateDisplay(); return; }
        if (currentInput === '-') { currentInput = '0'; expressionMode = true; updateDisplay(); return; }

        let i = currentInput.length - 1;
        let nesting = 0;

        while (i >= 0) {
            const char = currentInput[i];
            if (char === ')') nesting++;
            else if (char === '(') nesting--;
            if (nesting === 0 && ('+-×÷^'.includes(char))) { i++; break; }
            if (nesting < 0) { i++; break; }
            i--;
        }
        if (i < 0) i = 0;

        const prefix = currentInput.substring(0, i);
        let term = currentInput.substring(i);

        if (term.startsWith('-(') && term.endsWith(')')) {
            term = term.substring(2, term.length - 1);
        } else if (term.startsWith('-')) {
            term = term.substring(1);
        } else if (term.startsWith('+')) {
            term = '-' + term.substring(1);
        } else {
            if (term.includes('(') || FUNCTION_NAMES.some(fn => term.startsWith(fn)) || term.includes(' ')) {
                term = `-(${term})`;
            } else {
                term = '-' + term;
            }
        }
        currentInput = prefix + term;
        expressionMode = true;
        resetScreen = false;
    }

    function inputPercent() {
        if (currentInput === 'Error') return; // Changed 'Erro' to 'Error'
        const lastChar = currentInput.charAt(currentInput.length - 1);
        if (/\d$/.test(lastChar) || lastChar === ')') {
            currentInput += '%';
            expressionMode = true;
        }
    }

    function calculateInverse() {
        if (currentInput === 'Error' || currentInput === '0') { // Changed 'Erro' to 'Error'
            if (currentInput === '0') alert('Error: Division by zero!'); // Translated alert
            return;
        }
        let i = currentInput.length - 1;
        let nesting = 0;
        while (i >= 0) {
            const char = currentInput[i];
            if (char === ')') nesting++; else if (char === '(') nesting--;
            if (nesting === 0 && ('+-×÷^'.includes(char))) { i++; break; }
            if (nesting < 0) { i++; break;}
            i--;
        }
        if (i < 0) i = 0;
        const prefix = currentInput.substring(0, i);
        const term = currentInput.substring(i);
        if (term === '0') { alert('Error: Division by zero!'); return; } // Translated alert

        currentInput = prefix + `(1÷${term})`;
        expressionMode = true;
        resetScreen = false;
    }

    function formatResult(value) {
        if (!isFinite(value)) return "Error"; // Changed 'Erro' to 'Error'
        const stringValue = Number(value.toPrecision(12)).toString();
        return parseFloat(stringValue).toString();
    }

    function calculate() {
        if (currentInput === 'Error') return; // Changed 'Erro' to 'Error'
        let expressionToEvaluate = currentInput;

        try {
            let openCount = (expressionToEvaluate.match(/\(/g) || []).length;
            let closeCount = (expressionToEvaluate.match(/\)/g) || []).length;
            if (openCount > closeCount) {
                expressionToEvaluate += ')'.repeat(openCount - closeCount);
            }

            expressionToEvaluate = expressionToEvaluate
                .replace(/π/g, `(${MATH_CONSTANTS.pi})`)
                .replace(/e(?!xp)/g, `(${MATH_CONSTANTS.euler})`)
                .replace(/φ/g, `(${MATH_CONSTANTS.phi})`)
                .replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/log\(/g, 'Math.log10(')
                .replace(/ln\(/g, 'Math.log(')
                .replace(/exp\(/g, 'Math.exp(')
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/\^/g, '**');

            // Percentage treatment:
            // Step 1: Convert all "X%" or "(expr)%" to "(X/100)" or "((expr)/100)"
            expressionToEvaluate = expressionToEvaluate.replace(/(\d+\.?\d*|\([\s\S]*?\))%/g, (match, p1) => `(${p1}/100)`);
            // Step 2: Transform "Y + (X/100)" to "Y * (1 + X/100)" and "Y - (X/100)" to "Y * (1 - X/100)"
            expressionToEvaluate = expressionToEvaluate.replace(
                /(\d+\.?\d*|\([\s\S]*?\))\s*([+\-])\s*\((\d+\.?\d*|\([\s\S]*?\))\/100\)/g,
                (match, Y, op, X) => {
                     return `${Y} * (1 ${op} (${X}/100))`;
                }
            );

            // console.log("Expression for eval:", expressionToEvaluate); // Optional debug log
            const result = eval(expressionToEvaluate);

            if (result === undefined || result === null || !isFinite(result)) {
                currentInput = 'Error'; // Changed 'Erro' to 'Error'
                updateDisplay();
                _resetCalculationInternalState();
                return;
            }

            currentInput = formatResult(result);
            _resetCalculationInternalState();

        } catch (error) {
            console.error("Error evaluating expression:", error); // Keep this log for eval errors
            currentInput = 'Error'; // Changed 'Erro' to 'Error'
            updateDisplay();
            _resetCalculationInternalState();
        }
    }

    function backspace() {
        if (currentInput === 'Error') { // Changed 'Erro' to 'Error'
            resetCalculator();
            return;
        }
        for (const func of FUNCTION_NAMES) {
            if (currentInput.endsWith(func + '(')) {
                currentInput = currentInput.slice(0, -(func.length + 1));
                if (currentInput.endsWith('×')) {
                     currentInput = currentInput.slice(0, -1);
                }
                if (currentInput === '') currentInput = '0';
                return;
            }
        }
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '') {
            currentInput = '0';
            expressionMode = false;
        }
        if (!/[\+\-\×\÷\^\(\)%]/.test(currentInput) && !FUNCTION_NAMES.some(fn => currentInput.includes(fn))) {
             expressionMode = false;
        }
    }

    function clearEntry() {
        if (currentInput === 'Error') { // Changed 'Erro' to 'Error'
            resetCalculator();
            return;
        }
        const match = currentInput.match(/^(.*)([+\-×÷^])([^+\-×÷^(]*)$/);
        if (match && match[3] !== "") {
            currentInput = match[1] + match[2];
        } else if (match && match[3] === "") {
            currentInput = match[1];
        } else {
             for (const func of FUNCTION_NAMES) {
                if (currentInput.startsWith(func + '(') && currentInput.length > func.length + 1 && currentInput.charAt(currentInput.length - 1) !== '(') {
                     currentInput = func + '(';
                     return;
                } else if (currentInput === func + '(') {
                     currentInput = '0'; expressionMode = false;
                     return;
                }
            }
            currentInput = '0';
            expressionMode = false;
        }
        if (currentInput === "") {
            currentInput = '0';
            expressionMode = false;
        }
        resetScreen = false;
    }

    function resetCalculator() {
        currentInput = '0';
        _resetCalculationInternalState();
        resetScreen = false;
    }

    function applyValueToField() {
        if (activeInputField) {
            if (currentInput === 'Error') { // Changed 'Erro' to 'Error'
                calculatorModal.style.display = "none";
                activeInputField.focus();
                return;
            }
            if (expressionMode && /[\+\-\×\÷\^\(\)%]/.test(currentInput) && !resetScreen) {
                calculate();
                if (currentInput === 'Error') { // Changed 'Erro' to 'Error'
                     calculatorModal.style.display = "none";
                     activeInputField.focus();
                     return;
                }
            }
            activeInputField.value = currentInput; // Use '.' as decimal separator (already done)
            if (calculatorModal) calculatorModal.style.display = "none";
            const event = new Event('input', { bubbles: true });
            activeInputField.dispatchEvent(event);
            activeInputField.focus();
        }
    }

    function handleKeyboardInput(event) {
        if (event.ctrlKey || event.metaKey) return;

        if (currentInput === 'Error') { // Changed 'Erro' to 'Error'
            if (event.key === 'Escape') {
                if (calculatorModal) calculatorModal.style.display = "none";
            } else if (event.key === 'Backspace' || event.key.toLowerCase() === 'c' || event.key === 'Delete') {
                event.preventDefault();
                resetCalculator();
                updateDisplay();
            } else if (/[0-9]/.test(event.key)) {
                event.preventDefault();
                currentInput = event.key;
                resetScreen = false;
                expressionMode = false;
                updateDisplay();
            } else {
                event.preventDefault();
            }
            return;
        }

        let keyHandled = true;
        switch (event.key) {
            case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
                inputDigit(event.key); break;
            case '.': inputDecimal(); break;
            case ',': inputDecimal(); break; // Allow ',' as decimal input for convenience
            case '+': handleOperator('add'); break;
            case '-': handleOperator('subtract'); break;
            case '*': handleOperator('multiply'); break;
            case '/': handleOperator('divide'); break;
            case '%': inputPercent(); break;
            case '^': handleOperator('power'); break;
            case '(': inputParenthesis('('); break;
            case ')': inputParenthesis(')'); break;
            case 'Enter': case '=': calculate(); break;
            case 'Escape': if (calculatorModal) calculatorModal.style.display = "none"; break;
            case 'Backspace': backspace(); break;
            case 'Delete': resetCalculator(); break;
            default:
                if (event.key.toLowerCase() === 'c') { // 'c' for Clear
                    resetCalculator();
                } else if (event.key.toLowerCase() === 'p' && !event.shiftKey) {
                    inputConstant('pi');
                } else if (event.key.toLowerCase() === 'e' && !event.shiftKey && !event.altKey) {
                    inputConstant('euler');
                } else {
                    keyHandled = false; // Key not handled
                }
                break;
        }

        if(keyHandled) {
            event.preventDefault();
            updateDisplay();
        }
    }

    // --- INITIALIZATION AND GENERAL EVENTS (continued) ---
    updateDisplay();
    setupNumericInputs();

    if (calculatorBtn) {
        calculatorBtn.addEventListener('click', function() {
            openCalculator();
        });
    }

    if (closeCalculatorModal) {
        closeCalculatorModal.addEventListener('click', function() {
            if (calculatorModal) {
                calculatorModal.style.display = "none";
            }
        });
    }

    window.addEventListener('click', function(event) {
        if (calculatorModal && event.target === calculatorModal) {
            calculatorModal.style.display = "none";
        }
    });

    if (calcButtons && calcButtons.length > 0) {
        calcButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                const buttonValue = button.textContent;

                if (currentInput === 'Error' && action !== 'clear' && action !== 'backspace' && action !== 'clearEntry') { // Changed 'Erro' to 'Error'
                     return;
                }
                if (action === 'clearEntry' && currentInput === 'Error'){ // Changed 'Erro' to 'Error'
                    resetCalculator();
                    updateDisplay();
                    return;
                }

                if (!action) {
                    inputDigit(buttonValue);
                } else {
                    switch(action) {
                        case 'add': case 'subtract': case 'multiply': case 'divide': case 'power': handleOperator(action); break;
                        case 'openParenthesis': inputParenthesis('('); break;
                        case 'closeParenthesis': inputParenthesis(')'); break;
                        case 'percent': inputPercent(); break;
                        case 'sqrt': calculateFunction('sqrt'); break;
                        case 'inverse': calculateInverse(); break;
                        case 'negate': negateValue(); break;
                        case 'log': calculateFunction('log'); break;
                        case 'ln': calculateFunction('ln'); break;
                        case 'exp': calculateFunction('exp'); break;
                        case 'pi': inputConstant('pi'); break;
                        case 'euler': inputConstant('euler'); break;
                        case 'phi': inputConstant('phi'); break;
                        case 'decimal': inputDecimal(); break;
                        case 'clear': resetCalculator(); break;
                        case 'clearEntry': clearEntry(); break;
                        case 'backspace': backspace(); break;
                        case 'equals': calculate(); break;
                        case 'apply': applyValueToField(); break;
                    }
                }
                updateDisplay();
            });
        });
    } else {
        console.warn("Calculator buttons (.calc-btn) not found or array is empty.");
    }

    function setupNumericInputs() {
        const numericInputs = document.querySelectorAll('input[type="number"]');
        numericInputs.forEach(input => {
            input.addEventListener('keydown', function(event) {
                if (event.key === 'Enter' || event.key === 'F1') {
                    event.preventDefault();
                    event.stopPropagation();
                    activeInputField = this;
                    openCalculator();

                    // Use '.' as decimal separator for internal logic
                    if (this.value && this.value.trim() !== "" && parseFloat(this.value) !== 0) {
                        currentInput = this.value; // Value from input[type=number] is already using '.'
                        resetScreen = true;
                        expressionMode = false;
                    } else {
                        resetCalculator();
                    }
                    updateDisplay();
                }
            });
            if (!input.title) { // Fallback if title is not set in HTML
                input.title = "Press Enter or F1 to access the calculator";
            }
            input.addEventListener('focus', function() { this.classList.add('highlighted'); });
            input.addEventListener('blur', function() { this.classList.remove('highlighted'); });
        });
    }
});