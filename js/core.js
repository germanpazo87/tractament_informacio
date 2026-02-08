/**
 * LA MATRIU - CORE.JS
 * Funciones compartidas por toda la aplicación
 * Gestión de: API Key, Datos, Navegación, LocalStorage
 */

/* ========================================
   GESTIÓN DE API KEY
   ======================================== */

/**
 * Guarda la API key en localStorage
 * NOTA: En producció (GitHub Pages), la clau s'injecta automàticament via deploy.yml
 * Aquest mètode serveix per:
 * 1. Desenvolupament local: L'usuari pot posar la seva clau
 * 2. Sobreescriure la clau injectada si l'usuari vol usar la seva pròpia
 * @param {string} key - API key de Gemini
 * @returns {boolean} - true si es va guardar correctament
 */
function saveApiKey(key) {
    if (!key || key.trim().length < 10) {
        console.error('API Key inválida');
        return false;
    }
    
    try {
        localStorage.setItem('la_matriu_key', key.trim());
        return true;
    } catch (e) {
        console.error('Error guardando API Key:', e);
        return false;
    }
}

/**
 * Obtiene la API key de localStorage
 * @returns {string|null} - API key o null si no existe
 */
function getApiKey() {
    return localStorage.getItem('la_matriu_key');
}

/**
 * Elimina la API key de localStorage
 */
function clearApiKey() {
    localStorage.removeItem('la_matriu_key');
}

/**
 * Verifica si existe una API key válida
 * @returns {boolean}
 */
function hasApiKey() {
    const key = getApiKey();
    return key !== null && key.length > 10;
}

/**
 * Verifica si la API key prové del deploy automàtic
 * (compara amb el placeholder que seria reemplaçat)
 * @returns {boolean}
 */
function isInjectedApiKey() {
    const key = getApiKey();
    return key !== null && key !== 'AIzaSyAZ0nRzXOf2CcjdGZbyr_kGenaZ8yE9kjE' && key.length > 20;
}

/* ========================================
   GESTIÓN DE DATOS (SessionStorage)
   ======================================== */

/**
 * Guarda datos en sessionStorage para compartir entre ejercicios
 * @param {Array} data - Array de números
 */
function saveExerciseData(data) {
    try {
        sessionStorage.setItem('matriu_exercise_data', JSON.stringify(data));
        sessionStorage.setItem('matriu_data_timestamp', Date.now().toString());
    } catch (e) {
        console.error('Error guardando datos:', e);
    }
}

/**
 * Obtiene los datos guardados en sessionStorage
 * @returns {Array|null} - Array de datos o null si no existen
 */
function getExerciseData() {
    try {
        const data = sessionStorage.getItem('matriu_exercise_data');
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error obteniendo datos:', e);
        return null;
    }
}

/**
 * Limpia los datos guardados
 */
function clearExerciseData() {
    sessionStorage.removeItem('matriu_exercise_data');
    sessionStorage.removeItem('matriu_data_timestamp');
    sessionStorage.removeItem('matriu_exercise_results');
}

/**
 * Verifica si hay datos guardados y son recientes (menos de 1 hora)
 * @returns {boolean}
 */
function hasRecentData() {
    const timestamp = sessionStorage.getItem('matriu_data_timestamp');
    if (!timestamp) return false;
    
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();
    return (now - parseInt(timestamp)) < oneHour;
}

/**
 * Guarda resultados de un ejercicio
 * @param {string} exerciseId - ID del ejercicio
 * @param {Object} results - Resultados del ejercicio
 */
function saveExerciseResults(exerciseId, results) {
    try {
        const allResults = JSON.parse(sessionStorage.getItem('matriu_exercise_results') || '{}');
        allResults[exerciseId] = {
            ...results,
            timestamp: Date.now()
        };
        sessionStorage.setItem('matriu_exercise_results', JSON.stringify(allResults));
    } catch (e) {
        console.error('Error guardando resultados:', e);
    }
}

/**
 * Obtiene los resultados de un ejercicio específico
 * @param {string} exerciseId - ID del ejercicio
 * @returns {Object|null}
 */
function getExerciseResults(exerciseId) {
    try {
        const allResults = JSON.parse(sessionStorage.getItem('matriu_exercise_results') || '{}');
        return allResults[exerciseId] || null;
    } catch (e) {
        console.error('Error obteniendo resultados:', e);
        return null;
    }
}

/* ========================================
   GENERACIÓN DE DATOS ALEATORIOS
   ======================================== */

/**
 * Genera datos aleatorios para ejercicios
 * @param {Object} config - Configuración de generación
 * @param {number} config.count - Cantidad de datos (por defecto 12)
 * @param {number} config.min - Valor mínimo (por defecto 10)
 * @param {number} config.max - Valor máximo (por defecto 70)
 * @param {boolean} config.allowDecimals - Permitir decimales (por defecto false)
 * @param {number} config.decimals - Cantidad de decimales si allowDecimals=true (por defecto 1)
 * @returns {Array} - Array de números generados
 */
function generateRandomData(config = {}) {
    const {
        count = 12,
        min = 10,
        max = 70,
        allowDecimals = false,
        decimals = 1
    } = config;
    
    const data = [];
    const range = max - min;
    
    for (let i = 0; i < count; i++) {
        let value = Math.random() * range + min;
        
        if (allowDecimals) {
            value = parseFloat(value.toFixed(decimals));
        } else {
            value = Math.floor(value);
        }
        
        data.push(value);
    }
    
    return data;
}

/**
 * Calcula estadísticas básicas de un conjunto de datos
 * @param {Array} data - Array de números
 * @returns {Object} - Objeto con min, max, count
 */
function calculateBasicStats(data) {
    if (!data || data.length === 0) {
        return { min: 0, max: 0, count: 0 };
    }
    
    return {
        min: Math.min(...data),
        max: Math.max(...data),
        count: data.length
    };
}

/* ========================================
   UTILIDADES DE UI
   ======================================== */

/**
 * Muestra/oculta elementos del DOM
 * @param {string} elementId - ID del elemento
 * @param {boolean} show - true para mostrar, false para ocultar
 */
function toggleElement(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Añade clase de validación a un input
 * @param {HTMLElement} input - Elemento input
 * @param {boolean} isCorrect - true si es correcto, false si es incorrecto
 */
function setValidationClass(input, isCorrect) {
    input.classList.remove('correct', 'incorrect');
    input.classList.add(isCorrect ? 'correct' : 'incorrect');
}

/**
 * Limpia todas las clases de validación de inputs en un contenedor
 * @param {string} containerId - ID del contenedor
 */
function clearValidations(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const inputs = container.querySelectorAll('.val-input');
        inputs.forEach(input => {
            input.classList.remove('correct', 'incorrect');
        });
    }
}

/**
 * Muestra un mensaje temporal en pantalla
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'info'
 * @param {number} duration - Duración en ms (por defecto 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Estilos inline
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        background: type === 'success' ? 'rgba(57, 255, 20, 0.1)' : 
                    type === 'error' ? 'rgba(255, 0, 204, 0.1)' : 
                    'rgba(0, 255, 249, 0.1)',
        border: `1px solid ${type === 'success' ? '#39ff14' : 
                              type === 'error' ? '#ff00cc' : 
                              '#00fff9'}`,
        color: '#fff',
        borderRadius: '5px',
        zIndex: '1000',
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '0.85rem',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        animation: 'slideIn 0.3s ease-out'
    });
    
    document.body.appendChild(notification);
    
    // Eliminar después de la duración
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/* ========================================
   NAVEGACIÓN
   ======================================== */

/**
 * Navega a un ejercicio específico
 * @param {string} exercisePath - Ruta relativa del ejercicio
 */
function navigateToExercise(exercisePath) {
    window.location.href = exercisePath;
}

/**
 * Vuelve al menú principal
 */
function returnToMenu() {
    window.location.href = '../index.html';
}

/**
 * Obtiene el ID del ejercicio actual desde la URL
 * @returns {string} - ID del ejercicio actual
 */
function getCurrentExerciseId() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    return filename.replace('.html', '');
}

/* ========================================
   VALIDACIÓN DE DATOS
   ======================================== */

/**
 * Valida que un valor sea un número válido
 * @param {any} value - Valor a validar
 * @returns {boolean}
 */
function isValidNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Compara dos números con tolerancia para decimales
 * @param {number} a - Primer número
 * @param {number} b - Segundo número
 * @param {number} tolerance - Tolerancia (por defecto 0.01)
 * @returns {boolean}
 */
function numbersEqual(a, b, tolerance = 0.01) {
    return Math.abs(a - b) < tolerance;
}

/* ========================================
   FORMATEO
   ======================================== */

/**
 * Formatea un número para mostrar
 * @param {number} num - Número a formatear
 * @param {number} decimals - Decimales a mostrar (por defecto 2)
 * @returns {string}
 */
function formatNumber(num, decimals = 2) {
    if (!isValidNumber(num)) return '--';
    return parseFloat(num).toFixed(decimals);
}

/**
 * Formatea un array de datos para mostrar
 * @param {Array} data - Array de números
 * @param {string} separator - Separador (por defecto ', ')
 * @returns {string}
 */
function formatDataArray(data, separator = ' , ') {
    if (!data || data.length === 0) return '--';
    return data.map(n => formatNumber(n, 1)).join(separator);
}

/* ========================================
   INICIALIZACIÓN
   ======================================== */

/**
 * Inicializa los componentes comunes de la página
 */
function initCoreFunctions() {
    console.log('🔵 LA MATRIU - Core Functions Initialized');
    
    // Verificar API key al cargar
    if (hasApiKey()) {
        console.log('✅ API Key encontrada');
    } else {
        console.log('⚠️ No se encontró API Key');
    }
    
    // Verificar datos guardados
    if (hasRecentData()) {
        console.log('✅ Datos recientes encontrados');
    }
}

// Auto-inicialización cuando se carga el script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoreFunctions);
} else {
    initCoreFunctions();
}

/* ========================================
   ANIMACIONES CSS (para notificaciones)
   ======================================== */

// Añadir estilos de animación si no existen
if (!document.getElementById('core-animations')) {
    const style = document.createElement('style');
    style.id = 'core-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
