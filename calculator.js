// calculator.js - Basic calculator implementation

document.addEventListener('DOMContentLoaded', function() {
    // -------------------------------------------------------------------
    // STATE VARIABLE DECLARATION
    // -------------------------------------------------------------------
    let currentInput = '0';
    let previousInput = '';
    let calculationOperator = '';
    let resetScreen = false;
    let expressionMode = false;
    let activeInputField = null; // Will be used to know which field to fill

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
        if (inputStr === '0' || inputStr === 'Error') return false;
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
    function openCalculator(inputField = null) {
        if (!calculatorModal) {
            console.error("ERROR in openCalculator: calculatorModal is NULL!");
            return;
        }
        if (typeof window.resetCalculatorModalPosition === 'function') {
            window.resetCalculatorModalPosition();
        }
        calculatorModal.style.display = "flex";

        if (inputField) {
            activeInputField = inputField;
            // Treat comma as decimal point if present in the input field value
            if (inputField.value && inputField.value.trim() !== "" && !isNaN(parseFloat(inputField.value.replace(',', '.')))) {
                currentInput = inputField.value.replace(',', '.');
                resetScreen = true;
                expressionMode = false;
            } else {
                resetCalculator();
            }
        } else {
            activeInputField = null;
            resetCalculator();
        }

        updateDisplay();
        // if (calcDisplay) {
        //     // calcDisplay.focus(); // Might steal focus, be careful
        // }
    }


    function updateDisplay() {
        if (calcDisplay) {
            calcDisplay.value = currentInput;
        }
    }

    function inputDigit(digit) {
        if (resetScreen) {
            const lastChar = currentInput.charAt(currentInput.length - 1);
            if (!'+-×÷^('.includes(lastChar) && currentInput !== 'Error') {
                if (shouldInsertMultiplication(currentInput)) {
                    currentInput += '×' + digit;
                } else {
                    currentInput = digit;
                }
            } else {
                if (currentInput === 'Error') currentInput = digit;
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
        if (resetScreen && !'+-×÷^('.includes(currentInput.charAt(currentInput.length - 1)) && currentInput !== 'Error') {
            if (shouldInsertMultiplication(currentInput)) {
                currentInput += '×' + value;
            } else {
                currentInput = value;
            }
        } else {
            if (shouldInsertMultiplication(currentInput)) {
                currentInput += '×' + value;
            } else {
                 currentInput = (currentInput === '0' || currentInput === 'Error') ? value : currentInput + value;
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
                currentInput = (currentInput === '0' || currentInput === 'Error') ? parenthesis : currentInput + parenthesis;
            }
        } else { // ')'
            let openCount = (currentInput.match(/\(/g) || []).length;
            let closeCount = (currentInput.match(/\)/g) || []).length;
            const lastChar = currentInput.charAt(currentInput.length - 1);
            if (openCount > closeCount && !'+-×÷^('.includes(lastChar) && lastChar !== 'Error') {
                currentInput += parenthesis;
            } else {
                return; // Do not add if invalid
            }
        }
        resetScreen = false;
    }

    function calculateFunction(funcKey) {
        const displayFunction = funcKey; // e.g., "sqrt"
        expressionMode = true;
        if (shouldInsertMultiplication(currentInput)) {
            currentInput += '×' + displayFunction + '(';
        } else {
            currentInput = (currentInput === '0' || currentInput === 'Error') ? (displayFunction + '(') : (currentInput + displayFunction + '(');
        }
        resetScreen = false;
    }

    function inputDecimal() {
        // Regex to find the last number segment (can be complex due to functions and parentheses)
        const match = currentInput.match(/[^+\-×÷^()]*$/);
        const lastNumberSegment = match ? match[0] : "";
        if (lastNumberSegment.includes('.')) return; // Already has a decimal

        if (resetScreen) {
            const lastChar = currentInput.charAt(currentInput.length - 1);
            if ('+-×÷^('.includes(lastChar) || currentInput === 'Error') {
                currentInput = (currentInput === 'Error' ? '0.' : currentInput + '0.');
            } else {
                 if (shouldInsertMultiplication(currentInput)){
                     currentInput += '×0.';
                 } else {
                     currentInput = '0.'; // Start new number
                 }
            }
            resetScreen = false;
        } else {
            const lastChar = currentInput.charAt(currentInput.length - 1);
            if (currentInput === '0') {
                currentInput = '0.';
            } else if ('+-×÷^('.includes(lastChar)) { // If last char is operator or open paren
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

        if (currentInput === 'Error') return;

        // If last char is an operator (not an open parenthesis unless it's a minus for negation)
        if ('+-×÷^'.includes(lastChar) && lastChar !== '(') {
            // Allow '×-' or '÷-' or '^-' (multiply/divide/power by negative)
            if (operatorChar === '-' && (lastChar === '×' || lastChar === '÷' || lastChar === '^')) {
                currentInput += operatorChar;
            } else {
                // Replace last operator
                currentInput = currentInput.slice(0, -1) + operatorChar;
            }
        } else if (lastChar !== '(' || operatorChar === '-') { // Allow minus after open paren
            currentInput += operatorChar;
        } else {
            // Do not add operator if last char is '(' and operator is not '-'
            return;
        }
        expressionMode = true;
        resetScreen = true; // Next input will be part of the new term or continue expression
    }

    function negateValue() {
        if (currentInput === 'Error') return;
        if (!expressionMode && currentInput !== '0' && !isNaN(parseFloat(currentInput))) {
            currentInput = (parseFloat(currentInput) * -1).toString();
            updateDisplay();
            return;
        }
        // Handle simple '0' or '-' toggle
        if (currentInput === '0') { currentInput = '-'; expressionMode = true; updateDisplay(); return; }
        if (currentInput === '-') { currentInput = '0'; expressionMode = true; updateDisplay(); return; }

        // More complex expression negation
        let i = currentInput.length - 1;
        let nesting = 0; // For parentheses

        // Find the start of the last term
        while (i >= 0) {
            const char = currentInput[i];
            if (char === ')') nesting++;
            else if (char === '(') nesting--;
            if (nesting === 0 && ('+-×÷^'.includes(char))) { i++; break; } // Operator found
            if (nesting < 0) { i++; break; } // Unbalanced (e.g. "func(something")
            i--;
        }
        if (i < 0) i = 0; // Start of string

        const prefix = currentInput.substring(0, i);
        let term = currentInput.substring(i);

        // Toggle negation
        if (term.startsWith('-(') && term.endsWith(')')) { // Case: -(expression) -> expression
            term = term.substring(2, term.length - 1);
        } else if (term.startsWith('-')) { // Case: -number -> number
            term = term.substring(1);
        } else if (term.startsWith('+')) { // Case: +number -> -number (though + usually isn't explicit)
            term = '-' + term.substring(1);
        } else { // Case: number -> -number or expression -> -(expression)
            // If term is complex (contains parentheses, function, or space), wrap with -(...)
            if (term.includes('(') || FUNCTION_NAMES.some(fn => term.startsWith(fn)) || term.includes(' ')) {
                term = `-(${term})`;
            } else {
                term = '-' + term;
            }
        }
        currentInput = prefix + term;
        expressionMode = true;
        resetScreen = false; // Allow further input on the negated term if needed
    }

    function inputPercent() {
        if (currentInput === 'Error') return;
        const lastChar = currentInput.charAt(currentInput.length - 1);
        if (/\d$/.test(lastChar) || lastChar === ')') { // Only add % after a digit or closing parenthesis
            currentInput += '%';
            expressionMode = true;
        }
        // Do not set resetScreen, allow further operations on percentage
    }

    function calculateInverse() {
        if (currentInput === 'Error' || currentInput === '0') {
            if (currentInput === '0') alert('Error: Division by zero!'); // ALERT IN ENGLISH
            return;
        }
        // Find the start of the last term to apply 1/x to
        let i = currentInput.length - 1;
        let nesting = 0;
        while (i >= 0) {
            const char = currentInput[i];
            if (char === ')') nesting++; else if (char === '(') nesting--;
            if (nesting === 0 && ('+-×÷^'.includes(char))) { i++; break; }
            if (nesting < 0) { i++; break;} // Error in parenthesis balance before this point or start of function
            i--;
        }
        if (i < 0) i = 0; // Start of the string
        const prefix = currentInput.substring(0, i);
        const term = currentInput.substring(i);
        if (term === '0') { alert('Error: Division by zero!'); return; } // ALERT IN ENGLISH

        currentInput = prefix + `(1÷${term})`;
        expressionMode = true;
        resetScreen = false; // Allow further operations
    }

    function formatResult(value) {
        if (!isFinite(value)) return "Error";
        // Use toPrecision for significant figures, then Number to trim trailing zeros from decimal part
        const stringValue = Number(value.toPrecision(12)).toString(); // 12 significant figures
        return parseFloat(stringValue).toString(); // Ensure it's a clean number string
    }

    function calculate() {
        if (currentInput === 'Error') return;
        let expressionToEvaluate = currentInput;

        try {
            // Auto-close parentheses if needed
            let openCount = (expressionToEvaluate.match(/\(/g) || []).length;
            let closeCount = (expressionToEvaluate.match(/\)/g) || []).length;
            if (openCount > closeCount) {
                expressionToEvaluate += ')'.repeat(openCount - closeCount);
            }

            // Replace display symbols with JS evaluable symbols
            expressionToEvaluate = expressionToEvaluate
                .replace(/π/g, `(${MATH_CONSTANTS.pi})`)
                .replace(/e(?!xp)/g, `(${MATH_CONSTANTS.euler})`) // Negative lookahead for 'exp' function
                .replace(/φ/g, `(${MATH_CONSTANTS.phi})`)
                .replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/log\(/g, 'Math.log10(') // Base 10 log
                .replace(/ln\(/g, 'Math.log(')   // Natural log
                .replace(/exp\(/g, 'Math.exp(')
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/\^/g, '**'); // Exponentiation

            // Handle percentages:
            // 1. Simple X% -> X/100
            // This regex needs to be careful not to match things like "log(5)%" incorrectly.
            // It should target numbers or parenthesized expressions followed by %
            expressionToEvaluate = expressionToEvaluate.replace(/(\d+\.?\d*|\([\s\S]*?\))%/g, (match, p1) => `(${p1}/100)`);

            // 2. Advanced Y op X% (e.g., Y + X%, Y - X%) -> Y * (1 op X/100)
            // This is more complex and might need a more robust parsing strategy if many cases arise.
            // For now, a common interpretation: 100 + 10% = 100 * (1 + 10/100) = 110
            // Regex for Y operator (X/100) structure. Needs to be careful with order of operations.
            // This specific replacement might be too greedy or not cover all cases well.
            // Example: 100+10% -> 100 * (1 + (10/100))
            // Example: 50-20% -> 50 * (1 - (20/100))
            expressionToEvaluate = expressionToEvaluate.replace(
                /(\d+\.?\d*|\([\s\S]*?\))\s*([+\-])\s*\((\d+\.?\d*|\([\s\S]*?\))\/100\)/g, // Looks for "Y op (X/100)"
                (match, Y, op, X) => {
                     // Ensure X is just the number part if it was (number/100) from previous step
                     return `${Y} * (1 ${op} (${X}/100))`;
                }
            );
            // A simpler Y + X% is often Y + (Y * X/100). The current logic is Y * (1 + X/100). Both are common.
            // For consistency, ensure the % logic is what's expected.
            // The current implementation: X % Y = (X/100)*Y (if multiplication is implied) or X% on its own is X/100.
            // Y + X% (as in add X percent of Y to Y) is Y + (Y * X/100)
            // Let's stick to X% = X/100 for now, and advanced % (like Y + X%) is complex for eval.
            // The `Y * (1 op (X/100))` part for `Y op X%` is a specific interpretation.
            // Most calculators do `100 + 10%` as `100 + (10/100 * 100) = 110`.
            // Or `100 * 10%` as `100 * (10/100) = 10`.
            // The `eval` approach will struggle with context-dependent % like "100+10%".

            const result = eval(expressionToEvaluate);

            if (result === undefined || result === null || !isFinite(result)) {
                currentInput = 'Error';
                updateDisplay();
                _resetCalculationInternalState();
                return;
            }

            currentInput = formatResult(result);
            _resetCalculationInternalState(); // Previous input, operator cleared. Screen ready for new input.

        } catch (error) {
            console.error("Error evaluating expression:", error, "Expression:", expressionToEvaluate); // Log expression
            currentInput = 'Error';
            updateDisplay();
            _resetCalculationInternalState();
        }
    }

    function backspace() {
        if (currentInput === 'Error') {
            resetCalculator();
            return;
        }
        // Remove function calls like "sqrt("
        for (const func of FUNCTION_NAMES) {
            if (currentInput.endsWith(func + '(')) {
                currentInput = currentInput.slice(0, -(func.length + 1));
                // If it was like "5×sqrt(", remove "5×" as well, or just "×"
                if (currentInput.endsWith('×')) { // Check if an implicit multiplication was added
                     currentInput = currentInput.slice(0, -1);
                }
                if (currentInput === '') currentInput = '0';
                // updateDisplay(); // updateDisplay is called at the end of button handler
                return;
            }
        }
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '') {
            currentInput = '0';
            expressionMode = false; // No longer an expression if empty
        }
        // Check if still in expression mode
        if (!/[\+\-\×\÷\^\(\)%]/.test(currentInput) && !FUNCTION_NAMES.some(fn => currentInput.includes(fn))) {
             expressionMode = false;
        }
        // resetScreen should remain as is, as backspace continues current editing
    }

    function clearEntry() {
        if (currentInput === 'Error') {
            resetCalculator();
            return;
        }
        // Try to clear the last entered number or segment
        const match = currentInput.match(/^(.*)([+\-×÷^])([^+\-×÷^(]*)$/);
        if (match && match[3] !== "") { // If there's something after the last operator
            currentInput = match[1] + match[2]; // Remove the last number
        } else if (match && match[3] === "") { // If it ends with an operator
            currentInput = match[1]; // Remove the operator
        } else {
             // If it's a function call being typed, e.g., "sqrt(34"
             for (const func of FUNCTION_NAMES) {
                if (currentInput.startsWith(func + '(') && currentInput.length > func.length + 1 && currentInput.charAt(currentInput.length - 1) !== '(') {
                     currentInput = func + '('; // Reset to just "func("
                     // updateDisplay();
                     return;
                } else if (currentInput === func + '(') { // If just "func("
                     currentInput = '0'; expressionMode = false;
                     // updateDisplay();
                     return;
                }
            }
            currentInput = '0'; // Otherwise, reset to 0
            expressionMode = false;
        }
        if (currentInput === "") { // Safety net if manipulations result in empty string
            currentInput = '0';
            expressionMode = false;
        }
        resetScreen = false; // Allow continuing the expression
        // updateDisplay(); // updateDisplay is called at the end of button handler
    }

    function resetCalculator() {
        currentInput = '0';
        _resetCalculationInternalState(); // Resets previousInput, operator, expressionMode
        resetScreen = false; // Explicitly false after full reset
        // updateDisplay(); // updateDisplay is called at the end of button handler
    }

    function applyValueToField() {
        if (activeInputField) {
            if (currentInput === 'Error') {
                if (calculatorModal) calculatorModal.style.display = "none";
                activeInputField.focus();
                activeInputField = null; // Clear active field
                return;
            }
            // If in expression mode and not yet reset (i.e. result of previous calculation), calculate first
            if (expressionMode && /[\+\-\×\÷\^\(\)%]/.test(currentInput) && !resetScreen) {
                calculate(); // Calculate the expression
                if (currentInput === 'Error') { // If calculation results in error
                     if (calculatorModal) calculatorModal.style.display = "none";
                     activeInputField.focus();
                     activeInputField = null; // Clear active field
                     return;
                }
            }
            
            let valueToApply = currentInput;
            // Attempt to parse and format to 2 decimal places if it's a number
            const numericValue = parseFloat(currentInput.replace(',', '.')); // Handle comma as decimal
            if (!isNaN(numericValue)) {
                // Check if the original input was an integer or had specific precision
                // For simplicity, always format to 2 decimal places for financial inputs
                valueToApply = numericValue.toFixed(2);
            }

            activeInputField.value = valueToApply;
            if (calculatorModal) calculatorModal.style.display = "none";
            
            // Dispatch events to ensure any listeners on the input field are triggered
            activeInputField.dispatchEvent(new Event('input', { bubbles: true }));
            activeInputField.dispatchEvent(new Event('change', { bubbles: true }));
            
            activeInputField.focus(); // Return focus to the field
            activeInputField = null; // Clear active field
        } else {
            if (calculatorModal) calculatorModal.style.display = "none"; // Just close if no active field
        }
    }

    function handleKeyboardInput(event) {
        if (calculatorModal && calculatorModal.style.display !== 'flex') return; // Only when modal is visible
        if (event.ctrlKey || event.metaKey) return; // Ignore shortcuts like Ctrl+C

        if (currentInput === 'Error') {
            if (event.key === 'Escape') {
                if (calculatorModal) calculatorModal.style.display = "none";
                activeInputField = null;
            } else if (event.key === 'Backspace' || event.key.toLowerCase() === 'c' || event.key === 'Delete') {
                event.preventDefault();
                resetCalculator();
                updateDisplay();
            } else if (/[0-9]/.test(event.key)) { // Allow starting a new number after error
                event.preventDefault();
                currentInput = event.key;
                resetScreen = false;
                expressionMode = false; // Starting fresh
                updateDisplay();
            } else {
                event.preventDefault(); // Block other keys if in error state
            }
            return;
        }

        let keyHandled = true; // Assume key will be handled
        switch (event.key) {
            case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
                inputDigit(event.key); break;
            case '.': inputDecimal(); break;
            case ',': inputDecimal(); break; // Treat comma as decimal point
            case '+': handleOperator('add'); break;
            case '-': handleOperator('subtract'); break;
            case '*': handleOperator('multiply'); break;
            case '/': handleOperator('divide'); break;
            case '%': inputPercent(); break;
            case '^': handleOperator('power'); break;
            case '(': inputParenthesis('('); break;
            case ')': inputParenthesis(')'); break;
            case 'Enter': case '=': calculate(); break;
            case 'Escape':
                if (calculatorModal) calculatorModal.style.display = "none";
                activeInputField = null; // Clear active field on Escape
                break;
            case 'Backspace': backspace(); break;
            case 'Delete': resetCalculator(); break; // Or clearEntry() depending on desired behavior
            default:
                if (event.key.toLowerCase() === 'c') { // 'c' for Clear
                    resetCalculator();
                } else if (event.key.toLowerCase() === 'p' && !event.shiftKey) { // 'p' for Pi
                    inputConstant('pi');
                } else if (event.key.toLowerCase() === 'e' && !event.shiftKey && !event.altKey) { // 'e' for Euler's number
                    inputConstant('euler');
                } else {
                    keyHandled = false; // Key was not handled by this logic
                }
                break;
        }

        if(keyHandled) {
            event.preventDefault(); // Prevent default action if key was handled
            updateDisplay();
        }
    }
    
    // --- Listener for KEYDOWN on numeric input fields (Enter, F1, Space) ---
    // This function is exposed globally for other scripts (MIRR, NPV, IRR) to use.
    window.handleNumericInputKeydown = function(event) {
        // Allow navigation, deletion, and standard editing keys without opening calculator
        const allowedNonFunctionKeys = [
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'Delete', 'Backspace', 'Tab', 'Home', 'End',
            'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'ContextMenu', 
            'PageUp', 'PageDown', 'Insert', 'F5', 'F12' 
        ];
        if (allowedNonFunctionKeys.includes(event.key) || event.key.startsWith('F') && event.key !== 'F1') {
            return; // Do not open calculator for these keys
        }

        if (event.key === 'Enter' || event.key === 'F1' || event.key === ' ') {
            event.preventDefault(); // Prevent default action (e.g., form submission on Enter)
            event.stopPropagation(); // Stop event from bubbling up
            
            const inputField = event.target; // The input field that triggered the event
            openCalculator(inputField); // Open calculator, passing the field
        }
    };

    // --- Listener for DBLCLICK on numeric input fields ---
    // This function is exposed globally.
    window.handleNumericInputDblClick = function(event) {
        event.preventDefault();
        const inputField = event.target;
        openCalculator(inputField);
    };


    function setupNumericInputs() {
        // More robust selector to find all relevant number inputs
        const numericInputs = document.querySelectorAll(
            'input[type="number"], input#periods, input#rate, input#payment, input#presentValue, input#futureValue, input#mirrInitialInvestment, input#mirrFinancingRate, input#mirrReinvestmentRate, input#irrInitialInvestment, input#npvInitialInvestment, input#npvOverallDiscountRate, input#npvFinancingRate, input#npvReinvestmentRate'
        ); // Includes specific IDs and dynamic inputs if they are already in DOM
           // Dynamic inputs in MIRR/NPV/IRR tables are handled when rows are added.

        numericInputs.forEach(input => {
            // Ensure fresh listeners if this function is called multiple times
            input.removeEventListener('keydown', window.handleNumericInputKeydown);
            input.addEventListener('keydown', window.handleNumericInputKeydown);
            
            input.removeEventListener('dblclick', window.handleNumericInputDblClick);
            input.addEventListener('dblclick', window.handleNumericInputDblClick);
            
            input.title = "Press Enter, F1, Space or double-click to access the calculator"; // UPDATED TO ENGLISH
            
            input.removeEventListener('focus', highlightInput);
            input.removeEventListener('blur', unhighlightInput);
            input.addEventListener('focus', highlightInput);
            input.addEventListener('blur', unhighlightInput);
        });
    }
    
    function highlightInput() { this.classList.add('highlighted'); }
    function unhighlightInput() { this.classList.remove('highlighted'); }

    // --- INITIALIZATION AND GENERAL EVENTS ---
    updateDisplay(); // Initial display update
    setupNumericInputs(); // Setup listeners for existing inputs

    // OBSERVER FOR DYNAMICALLY ADDED INPUTS (e.g. MIRR/NPV/IRR tables)
    const observer = new MutationObserver(mutationsList => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the node itself is an input or contains inputs
                        const inputs = [];
                        if (node.matches('input[type="number"]')) {
                            inputs.push(node);
                        } else {
                            inputs.push(...node.querySelectorAll('input[type="number"]'));
                        }
                        
                        inputs.forEach(input => {
                            // Check if it's one of the dynamically controlled inputs based on class or parent
                            if (input.classList.contains('mirr-cash-flow-amount') || 
                                input.classList.contains('mirr-cash-flow-quantity') ||
                                input.classList.contains('irr-cash-flow-amount') || 
                                input.classList.contains('irr-cash-flow-quantity') ||
                                input.classList.contains('npv-cash-flow-amount') ||
                                input.classList.contains('npv-cash-flow-quantity')) {
                                
                                input.removeEventListener('keydown', window.handleNumericInputKeydown);
                                input.addEventListener('keydown', window.handleNumericInputKeydown);
                                input.removeEventListener('dblclick', window.handleNumericInputDblClick);
                                input.addEventListener('dblclick', window.handleNumericInputDblClick);
                                input.title = "Press Enter, F1, Space or double-click to access the calculator";

                                input.removeEventListener('focus', highlightInput);
                                input.removeEventListener('blur', unhighlightInput);
                                input.addEventListener('focus', highlightInput);
                                input.addEventListener('blur', unhighlightInput);
                            }
                        });
                    }
                });
            }
        }
    });

    // Start observing the document body and its subtree for added nodes
    const mainAppContainer = document.querySelector('.container') || document.body;
    observer.observe(mainAppContainer, { childList: true, subtree: true });


    if (calculatorBtn) {
        calculatorBtn.addEventListener('click', function() {
            openCalculator(); // Open calculator without a specific field
        });
    }

    if (closeCalculatorModal) {
        closeCalculatorModal.addEventListener('click', function() {
            if (calculatorModal) {
                calculatorModal.style.display = "none";
                activeInputField = null; // Clear active field when closing manually
            }
        });
    }
    
    // Add keyboard listener to the modal itself, not the document,
    // to avoid conflicts when modal is not shown.
    if (calculatorModal) {
        calculatorModal.addEventListener('keydown', handleKeyboardInput);
    }


    if (calcButtons && calcButtons.length > 0) {
        calcButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                const buttonValue = button.textContent; // e.g. '7', '+', 'log'

                if (currentInput === 'Error' && action !== 'clear' && action !== 'backspace' && action !== 'clearEntry') {
                     // Only allow clearing functions if in error state
                     return;
                }
                // Special handling for CE on Error state
                if (action === 'clearEntry' && currentInput === 'Error'){
                    resetCalculator();
                    updateDisplay();
                    return;
                }

                if (!action) { // It's a digit button
                    inputDigit(buttonValue);
                } else {
                    switch(action) {
                        // Operators
                        case 'add': case 'subtract': case 'multiply': case 'divide': case 'power': handleOperator(action); break;
                        // Parentheses & Percent
                        case 'openParenthesis': inputParenthesis('('); break;
                        case 'closeParenthesis': inputParenthesis(')'); break;
                        case 'percent': inputPercent(); break;
                        // Functions
                        case 'sqrt': calculateFunction('sqrt'); break;
                        case 'inverse': calculateInverse(); break;
                        case 'negate': negateValue(); break;
                        case 'log': calculateFunction('log'); break; // Base 10
                        case 'ln': calculateFunction('ln'); break;   // Natural
                        case 'exp': calculateFunction('exp'); break; // e^x
                        // Constants
                        case 'pi': inputConstant('pi'); break;
                        case 'euler': inputConstant('euler'); break;
                        case 'phi': inputConstant('phi'); break;
                        // Decimal & Clear
                        case 'decimal': inputDecimal(); break;
                        case 'clear': resetCalculator(); break; // AC
                        case 'clearEntry': clearEntry(); break; // CE
                        case 'backspace': backspace(); break;
                        // Equals & Apply
                        case 'equals': calculate(); break;
                        case 'apply': applyValueToField(); break;
                    }
                }
                updateDisplay(); // Update display after every action
            });
        });
    } else {
        console.warn("Calculator buttons (.calc-btn) not found or array is empty.");
    }
});