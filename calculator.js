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
    let activeInputField = null; // Será usado para saber qual campo preencher

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
    // Função para abrir o modal da calculadora, chamada por Enter/F1/Espaço ou pelo botão
    function openCalculator(inputField = null) { // Adicionado parâmetro opcional
        if (!calculatorModal) {
            console.error("ERROR in openCalculator: calculatorModal is NULL!");
            return;
        }
        if (typeof window.resetCalculatorModalPosition === 'function') {
            window.resetCalculatorModalPosition();
        }
        calculatorModal.style.display = "flex";

        if (inputField) { // Se um campo foi passado (ex: via Enter/F1/Espaço)
            activeInputField = inputField; // Define o campo ativo
            // Preenche o display da calculadora com o valor do campo
            if (inputField.value && inputField.value.trim() !== "" && !isNaN(parseFloat(inputField.value))) {
                currentInput = inputField.value.replace(',', '.'); // Garante ponto decimal
                resetScreen = true; // Para permitir que o próximo dígito substitua ou concatene
                expressionMode = false; // Começa sem ser uma expressão complexa
            } else {
                resetCalculator(); // Se o campo estiver vazio ou inválido, reseta a calculadora
            }
        } else { // Se nenhum campo foi passado (ex: clicando no botão "Calculator")
            activeInputField = null; // Nenhum campo ativo para preencher
            resetCalculator(); // Reseta para o estado inicial
        }
        
        updateDisplay(); // Atualiza o display da calculadora
        if (calcDisplay) {
            // calcDisplay.focus(); // Descomentar se quiser focar no display
        }
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
            currentInput = (currentInput === '0' || currentInput === 'Error') ? (displayFunction + '(') : (currentInput + displayFunction + '(');
        }
        resetScreen = false;
    }

    function inputDecimal() {
        const match = currentInput.match(/[^+\-×÷^()]*$/);
        const lastNumberSegment = match ? match[0] : "";
        if (lastNumberSegment.includes('.')) return;

        if (resetScreen) {
            const lastChar = currentInput.charAt(currentInput.length - 1);
            if ('+-×÷^('.includes(lastChar) || currentInput === 'Error') {
                currentInput = (currentInput === 'Error' ? '0.' : currentInput + '0.');
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

        if (currentInput === 'Error') return;

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
        if (currentInput === 'Error') return;
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
        if (currentInput === 'Error') return;
        const lastChar = currentInput.charAt(currentInput.length - 1);
        if (/\d$/.test(lastChar) || lastChar === ')') {
            currentInput += '%';
            expressionMode = true;
        }
    }

    function calculateInverse() {
        if (currentInput === 'Error' || currentInput === '0') {
            if (currentInput === '0') alert('Error: Division by zero!');
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
        if (term === '0') { alert('Error: Division by zero!'); return; }

        currentInput = prefix + `(1÷${term})`;
        expressionMode = true;
        resetScreen = false;
    }

    function formatResult(value) {
        if (!isFinite(value)) return "Error";
        const stringValue = Number(value.toPrecision(12)).toString();
        return parseFloat(stringValue).toString();
    }

    function calculate() {
        if (currentInput === 'Error') return;
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

            expressionToEvaluate = expressionToEvaluate.replace(/(\d+\.?\d*|\([\s\S]*?\))%/g, (match, p1) => `(${p1}/100)`);
            expressionToEvaluate = expressionToEvaluate.replace(
                /(\d+\.?\d*|\([\s\S]*?\))\s*([+\-])\s*\((\d+\.?\d*|\([\s\S]*?\))\/100\)/g,
                (match, Y, op, X) => {
                     return `${Y} * (1 ${op} (${X}/100))`;
                }
            );

            const result = eval(expressionToEvaluate);

            if (result === undefined || result === null || !isFinite(result)) {
                currentInput = 'Error';
                updateDisplay();
                _resetCalculationInternalState();
                return;
            }

            currentInput = formatResult(result);
            _resetCalculationInternalState();

        } catch (error) {
            console.error("Error evaluating expression:", error);
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
        if (currentInput === 'Error') {
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
            if (currentInput === 'Error') {
                if (calculatorModal) calculatorModal.style.display = "none";
                activeInputField.focus();
                return;
            }
            if (expressionMode && /[\+\-\×\÷\^\(\)%]/.test(currentInput) && !resetScreen) {
                calculate(); // Calcula a expressão antes de aplicar
                if (currentInput === 'Error') {
                     if (calculatorModal) calculatorModal.style.display = "none";
                     activeInputField.focus();
                     return;
                }
            }
            // Tenta converter para número e formatar para 2 casas decimais se for um número
            let valueToApply = currentInput;
            const numericValue = parseFloat(currentInput.replace(',', '.')); // Garante ponto para parseFloat
            if (!isNaN(numericValue)) {
                valueToApply = numericValue.toFixed(2);
            }

            activeInputField.value = valueToApply;
            if (calculatorModal) calculatorModal.style.display = "none";
            
            // Disparar eventos para garantir que outras lógicas (ex: validação, cálculo principal) sejam acionadas
            activeInputField.dispatchEvent(new Event('input', { bubbles: true }));
            activeInputField.dispatchEvent(new Event('change', { bubbles: true }));
            
            activeInputField.focus();
            activeInputField = null; // Limpa o campo ativo
        } else {
            // Se não houver campo ativo, apenas fecha o modal (se estiver aberto)
            if (calculatorModal) calculatorModal.style.display = "none";
        }
    }

    function handleKeyboardInput(event) {
        if (calculatorModal && calculatorModal.style.display !== 'flex') return; // Só processa se o modal estiver visível
        if (event.ctrlKey || event.metaKey) return;

        if (currentInput === 'Error') {
            if (event.key === 'Escape') {
                if (calculatorModal) calculatorModal.style.display = "none";
                activeInputField = null;
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
            case ',': inputDecimal(); break;
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
                activeInputField = null;
                break;
            case 'Backspace': backspace(); break;
            case 'Delete': resetCalculator(); break;
            default:
                if (event.key.toLowerCase() === 'c') {
                    resetCalculator();
                } else if (event.key.toLowerCase() === 'p' && !event.shiftKey) {
                    inputConstant('pi');
                } else if (event.key.toLowerCase() === 'e' && !event.shiftKey && !event.altKey) {
                    inputConstant('euler');
                } else {
                    keyHandled = false;
                }
                break;
        }

        if(keyHandled) {
            event.preventDefault();
            updateDisplay();
        }
    }
    
    // --- MODIFICAÇÃO: Tornar handleNumericInputKeydown global ---
    window.handleNumericInputKeydown = function(event) {
        // Permitir teclas de navegação, delete, backspace, tab, home, end etc.
        const allowedNonFunctionKeys = [
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
            'Delete', 'Backspace', 'Tab', 'Home', 'End', 
            'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 
            'PageUp', 'PageDown', 'Insert'
        ];
        if (allowedNonFunctionKeys.includes(event.key)) {
            return;
        }

        // Se pressionar Enter, F1 ou Espaço, abre a calculadora
        if (event.key === 'Enter' || event.key === 'F1' || event.key === ' ') {
            event.preventDefault(); // Previne a ação padrão (ex: submeter form, inserir espaço)
            event.stopPropagation(); // Impede que o evento se propague para outros listeners (ex: do modal NPV)
            
            const inputField = event.target; // O campo que disparou o evento
            openCalculator(inputField); // Passa o campo para a função openCalculator
        }
        // Não impede a digitação normal de números e outros caracteres válidos para input[type=number]
    };

    // --- MODIFICAÇÃO: setupNumericInputs para aplicar o listener global ---
    function setupNumericInputs() {
        // Seleciona todos os inputs numéricos, incluindo os de modais que já existem no DOM
        const numericInputs = document.querySelectorAll(
            'input[type="number"], ' + // Todos os inputs numéricos genéricos
            '#periods, #rate, #payment, #presentValue, #futureValue, ' +
            '#mirrInitialInvestment, #mirrFinancingRate, #mirrReinvestmentRate, ' +
            '#npvInitialInvestment, #npvOverallDiscountRate, #npvFinancingRate, #npvReinvestmentRate'
        );

        numericInputs.forEach(input => {
            // Remove listener antigo para evitar duplicação se esta função for chamada múltiplas vezes
            input.removeEventListener('keydown', window.handleNumericInputKeydown); // Usa a função global
            // Adiciona o novo listener
            input.addEventListener('keydown', window.handleNumericInputKeydown); // Usa a função global
            
            input.title = "Pressione Enter, F1 ou Espaço para acessar a calculadora";
            
            input.removeEventListener('focus', highlightInput); // Evitar duplicação
            input.removeEventListener('blur', unhighlightInput); // Evitar duplicação
            input.addEventListener('focus', highlightInput);
            input.addEventListener('blur', unhighlightInput);
        });
    }
    
    function highlightInput() { this.classList.add('highlighted'); }
    function unhighlightInput() { this.classList.remove('highlighted'); }

    // --- INITIALIZATION AND GENERAL EVENTS (continued) ---
    updateDisplay();
    setupNumericInputs(); // Chama a função para configurar os inputs numéricos estáticos

    if (calculatorBtn) {
        calculatorBtn.addEventListener('click', function() {
            openCalculator(); // Abre a calculadora sem um campo ativo específico
        });
    }

    if (closeCalculatorModal) {
        closeCalculatorModal.addEventListener('click', function() {
            if (calculatorModal) {
                calculatorModal.style.display = "none";
                activeInputField = null; // Limpa o campo ativo ao fechar
            }
        });
    }

    window.addEventListener('click', function(event) {
        if (calculatorModal && event.target === calculatorModal) {
            calculatorModal.style.display = "none";
            activeInputField = null; // Limpa o campo ativo
        }
    });
    
    // Listener para o teclado DENTRO do modal da calculadora
    if (calculatorModal) {
        calculatorModal.addEventListener('keydown', handleKeyboardInput);
    }


    if (calcButtons && calcButtons.length > 0) {
        calcButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                const buttonValue = button.textContent;

                if (currentInput === 'Error' && action !== 'clear' && action !== 'backspace' && action !== 'clearEntry') {
                     return;
                }
                if (action === 'clearEntry' && currentInput === 'Error'){
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
});