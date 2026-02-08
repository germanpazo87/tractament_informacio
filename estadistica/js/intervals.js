/**
 * LA MATRIU - INTERVALS.JS
 * Lògica específica de l'exercici de creació d'intervals
 */

// Variables globals de l'exercici
let rawData = [];
let stats = { min: 0, max: 0, count: 0 };
let currentIntervals = [];
let userMarks = {};

/* ========================================
   INICIALITZACIÓ
   ======================================== */

/**
 * Inicialitza l'exercici quan es carrega la pàgina
 */
function initExercise() {
    console.log('🎯 Iniciant exercici d\'intervals...');
    
    // Generar dades noves
    generateNewData();
    
    // Inicialitzar context per Gemini
    updateGeminiContext();
}

/* ========================================
   GENERACIÓ I VISUALITZACIÓ DE DADES
   ======================================== */

/**
 * Genera noves dades aleatòries
 */
function generateNewData() {
    rawData = generateRandomData({
        count: 12,
        min: 10,
        max: 70,
        allowDecimals: false
    });
    
    stats = calculateBasicStats(rawData);
    displayData();
    clearIntervals();
    
    // Guardar dades
    saveExerciseData(rawData);
    
    // Actualitzar context de Gemini
    updateGeminiContext();
    
    showNotification('Noves dades generades', 'success');
}

/**
 * Mostra les dades a la interfície
 */
function displayData() {
    const displayDiv = document.getElementById('data-display');
    const minSpan = document.getElementById('stat-min');
    const maxSpan = document.getElementById('stat-max');
    const countSpan = document.getElementById('stat-count');
    
    if (displayDiv) displayDiv.textContent = rawData.join(' , ');
    if (minSpan) minSpan.textContent = stats.min;
    if (maxSpan) maxSpan.textContent = stats.max;
    if (countSpan) countSpan.textContent = stats.count;
}

/* ========================================
   GESTIÓ D'INTERVALS
   ======================================== */

/**
 * Actualitza la taula d'intervals quan l'usuari canvia els paràmetres
 */
function updateIntervals() {
    const startInput = document.getElementById('in-start');
    const ampInput = document.getElementById('in-amp');
    
    const start = parseFloat(startInput.value);
    const amp = parseFloat(ampInput.value);
    
    // Validar inputs
    if (!isValidNumber(start) || !isValidNumber(amp) || amp <= 0) {
        clearIntervals();
        return;
    }
    
    // Generar intervals
    currentIntervals = generateIntervals(start, amp, 5);
    displayIntervals();
    
    // Actualitzar context de Gemini
    updateGeminiContext();
}

/**
 * Genera els intervals
 */
function generateIntervals(start, amplitude, count) {
    const intervals = [];
    
    for (let i = 0; i < count; i++) {
        const lowerBound = start + (i * amplitude);
        const upperBound = lowerBound + amplitude;
        const mark = (lowerBound + upperBound) / 2;
        
        intervals.push({
            index: i,
            lower: lowerBound,
            upper: upperBound,
            correctMark: mark,
            notation: `[${lowerBound}, ${upperBound})`
        });
    }
    
    return intervals;
}

/**
 * Mostra els intervals a la taula
 */
function displayIntervals() {
    const tbody = document.getElementById('interval-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (currentIntervals.length === 0) return;
    
    currentIntervals.forEach((interval, index) => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        row.innerHTML = `
            <td style="padding: 10px;">${interval.notation}</td>
            <td style="padding: 10px;">
                <input 
                    type="number" 
                    class="val-input xi-in" 
                    id="mark-${index}"
                    data-index="${index}"
                    data-correct="${interval.correctMark}"
                    oninput="validateMark(${index})"
                    step="0.5"
                    style="width: 70px; padding: 2px;">
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Neteja la taula d'intervals
 */
function clearIntervals() {
    const tbody = document.getElementById('interval-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    currentIntervals = [];
    userMarks = {};
}

/* ========================================
   VALIDACIÓ
   ======================================== */

/**
 * Valida la marca de classe introduïda per l'usuari
 */
function validateMark(index) {
    const input = document.getElementById(`mark-${index}`);
    
    if (!input) return;
    
    const userValue = parseFloat(input.value);
    const correctValue = currentIntervals[index].correctMark;
    
    if (!isValidNumber(userValue)) {
        input.classList.remove('correct', 'incorrect');
        userMarks[index] = null;
        return;
    }
    
    // Validar amb tolerància
    const isCorrect = numbersEqual(userValue, correctValue, 0.01);
    
    // Aplicar classe visual
    input.className = "val-input xi-in " + (isCorrect ? "correct" : "incorrect");
    
    userMarks[index] = {
        value: userValue,
        correct: isCorrect
    };
    
    // Verificar si tots estan correctes
    checkAllCorrect();
    
    // Actualitzar context de Gemini
    updateGeminiContext();
}

/**
 * Comprova si totes les marques són correctes
 */
function checkAllCorrect() {
    if (currentIntervals.length === 0) return false;
    
    const allCorrect = currentIntervals.every((_, index) => {
        return userMarks[index] && userMarks[index].correct;
    });
    
    if (allCorrect) {
        showNotification('Excel·lent! Tots els intervals són correctes', 'success', 4000);
    }
    
    return allCorrect;
}

/* ========================================
   INTEGRACIÓ AMB GEMINI
   ======================================== */

/**
 * Actualitza el context de l'exercici per Gemini
 */
function updateGeminiContext() {
    const context = {
        exerciseType: 'Creació d\'intervals',
        data: rawData,
        stats: stats,
        currentStep: 'intervals',
        userInputs: {
            start: document.getElementById('in-start')?.value || null,
            amplitude: document.getElementById('in-amp')?.value || null,
            marks: userMarks,
            intervalsGenerated: currentIntervals.length > 0
        }
    };
    
    initExerciseContext(context);
}

/**
 * Gestiona la tecla Enter al input del chat
 */
function handleEnterKey(event) {
    if (event.key === 'Enter') {
        sendUserQuery();
    }
}

/* ========================================
   INICIALITZACIÓ AUTOMÀTICA
   ======================================== */

// Inicialitzar quan es carrega la pàgina
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExercise);
} else {
    initExercise();
}
