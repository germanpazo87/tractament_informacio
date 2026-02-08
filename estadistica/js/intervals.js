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
    
    // Verificar si hi ha dades guardades
    checkForSavedData();
    
    // Generar dades noves si no n'hi ha
    if (rawData.length === 0) {
        generateNewData();
    }
    
    // Inicialitzar context per Gemini
    updateGeminiContext();
}

/**
 * Comprova si hi ha dades guardades d'una sessió anterior
 */
function checkForSavedData() {
    if (hasRecentData()) {
        const savedData = getExerciseData();
        if (savedData && savedData.length > 0) {
            const btnLoad = document.getElementById('btn-load-saved');
            if (btnLoad) {
                btnLoad.style.display = 'inline-block';
            }
        }
    }
}

/**
 * Carrega les dades guardades
 */
function loadSavedData() {
    const savedData = getExerciseData();
    if (savedData && savedData.length > 0) {
        rawData = savedData;
        stats = calculateBasicStats(rawData);
        displayData();
        updateGeminiContext();
        showNotification('Dades anteriors carregades', 'success');
        
        // Amagar botó de carregar
        const btnLoad = document.getElementById('btn-load-saved');
        if (btnLoad) btnLoad.style.display = 'none';
    }
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
    updateHints();
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
    
    if (displayDiv) displayDiv.textContent = formatDataArray(rawData);
    if (minSpan) minSpan.textContent = stats.min;
    if (maxSpan) maxSpan.textContent = stats.max;
    if (countSpan) countSpan.textContent = stats.count;
}

/**
 * Actualitza els hints (pistes) per ajudar l'estudiant
 */
function updateHints() {
    const hintMin = document.getElementById('hint-min');
    const hintAmp = document.getElementById('hint-amp');
    
    if (hintMin) hintMin.textContent = stats.min;
    
    if (hintAmp) {
        const range = stats.max - stats.min;
        const suggestedAmp = Math.ceil(range / 5);
        hintAmp.textContent = `${suggestedAmp} (per cobrir rang de ${range})`;
    }
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
    
    // Validar que l'inici sigui <= mínim
    if (start > stats.min) {
        setValidationClass(startInput, false);
    } else {
        setValidationClass(startInput, true);
    }
    
    // Generar intervals
    currentIntervals = generateIntervals(start, amp, 5);
    displayIntervals();
    
    // Verificar si tots els intervals estan coberts
    checkCoverage();
    
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
    
    currentIntervals.forEach((interval, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${interval.notation}</td>
            <td>
                <input 
                    type="number" 
                    class="val-input xi-in" 
                    id="mark-${index}"
                    data-index="${index}"
                    data-correct="${interval.correctMark}"
                    placeholder="?"
                    oninput="validateMark(${index})"
                    step="0.1"
                    style="width: 100px; padding: 5px;">
            </td>
            <td id="status-${index}" style="font-size: 0.7rem; color: rgba(255,255,255,0.5);">
                Pendent
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
    
    tbody.innerHTML = `
        <tr>
            <td colspan="3" style="text-align: center; color: rgba(255,255,255,0.4); padding: 30px;">
                Configura els paràmetres per veure els intervals
            </td>
        </tr>
    `;
    
    currentIntervals = [];
    userMarks = {};
    
    // Deshabilitar botó de continuar
    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue) btnContinue.disabled = true;
}

/* ========================================
   VALIDACIÓ
   ======================================== */

/**
 * Valida la marca de classe introduïda per l'usuari
 */
function validateMark(index) {
    const input = document.getElementById(`mark-${index}`);
    const status = document.getElementById(`status-${index}`);
    
    if (!input) return;
    
    const userValue = parseFloat(input.value);
    const correctValue = currentIntervals[index].correctMark;
    
    if (!isValidNumber(userValue)) {
        input.classList.remove('correct', 'incorrect');
        if (status) status.textContent = 'Pendent';
        userMarks[index] = null;
        return;
    }
    
    // Validar amb tolerància
    const isCorrect = numbersEqual(userValue, correctValue, 0.01);
    
    setValidationClass(input, isCorrect);
    
    if (status) {
        status.textContent = isCorrect ? '✓ Correcte' : '✗ Incorrecte';
        status.style.color = isCorrect ? 'var(--neon-green)' : 'var(--neon-pink)';
    }
    
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
    
    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue) {
        btnContinue.disabled = !allCorrect;
    }
    
    if (allCorrect) {
        showNotification('Excel·lent! Tots els intervals són correctes', 'success', 4000);
    }
    
    return allCorrect;
}

/**
 * Comprova si els intervals cobreixen totes les dades
 */
function checkCoverage() {
    if (currentIntervals.length === 0) return;
    
    const lastInterval = currentIntervals[currentIntervals.length - 1];
    
    if (lastInterval.upper < stats.max) {
        showNotification('⚠️ Els intervals no cobreixen totes les dades', 'error', 3000);
    }
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
   NAVEGACIÓ
   ======================================== */

/**
 * Guarda els resultats i continua al següent exercici
 */
function saveAndContinue() {
    if (!checkAllCorrect()) {
        showNotification('Completa tots els intervals correctament abans de continuar', 'error');
        return;
    }
    
    // Guardar resultats de l'exercici
    saveExerciseResults('intervals', {
        completed: true,
        data: rawData,
        intervals: currentIntervals,
        userMarks: userMarks
    });
    
    showNotification('Progrés guardat! Redirigint...', 'success', 2000);
    
    setTimeout(() => {
        window.location.href = 'frequencies.html';
    }, 2000);
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
