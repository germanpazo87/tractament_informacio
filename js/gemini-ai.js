/**
 * LA MATRIU - GEMINI AI
 * Integración con la API de Google Gemini
 * Funciones: Chat contextualizado, Ayuda adaptativa, Preguntas de comprensión
 */

/* ========================================
   CONFIGURACIÓN
   ======================================== */

const GEMINI_CONFIG = {
    apiVersion: 'v1beta',
    model: 'gemini-2.5-flash',
    maxTokens: 1000,
    temperature: 0.7,
    topP: 0.9,
    topK: 40
};

// Placeholder que será reemplazado por el deploy.yml
const API_KEY_PLACEHOLDER = 'REPLACE_ME_WITH_API_KEY';

/* ========================================
   GESTIÓN DE CONVERSACIÓN
   ======================================== */

let conversationHistory = [];
let userLevel = 'medium'; // 'basic', 'medium', 'advanced'
let currentExerciseContext = null;

/**
 * Inicializa el contexto del ejercicio actual
 * @param {Object} context - Contexto del ejercicio
 */
function initExerciseContext(context) {
    currentExerciseContext = context;
    conversationHistory = [];
    
    console.log('📝 Contexto del ejercicio inicializado:', context);
}

/**
 * Añade un mensaje al historial de conversación
 * @param {string} role - 'user' o 'assistant'
 * @param {string} content - Contenido del mensaje
 */
function addToHistory(role, content) {
    conversationHistory.push({
        role: role,
        content: content,
        timestamp: Date.now()
    });
    
    // Limitar historial a últimos 10 mensajes para no sobrecargar
    if (conversationHistory.length > 10) {
        conversationHistory = conversationHistory.slice(-10);
    }
}

/**
 * Limpia el historial de conversación
 */
function clearConversationHistory() {
    conversationHistory = [];
    console.log('🗑️ Historial de conversación limpiado');
}

/* ========================================
   DETECCIÓN DE NIVEL DEL USUARIO
   ======================================== */

/**
 * Analiza las respuestas del usuario para determinar su nivel
 * @param {Object} userResponse - Respuesta del usuario
 */
function analyzeUserLevel(userResponse) {
    // Lógica simple de detección de nivel
    // Se puede mejorar con análisis más sofisticado
    
    const { correct, attempts, timeSpent } = userResponse;
    
    if (correct && attempts === 1 && timeSpent < 30000) {
        // Respuesta correcta rápida en primer intento -> avanzado
        if (userLevel !== 'advanced') {
            userLevel = 'advanced';
            console.log('📈 Nivel detectado: AVANZADO');
        }
    } else if (!correct && attempts > 2) {
        // Múltiples intentos incorrectos -> básico
        if (userLevel !== 'basic') {
            userLevel = 'basic';
            console.log('📉 Nivel detectado: BÁSICO');
        }
    }
    
    return userLevel;
}

/**
 * Obtiene el nivel actual del usuario
 * @returns {string}
 */
function getUserLevel() {
    return userLevel;
}

/**
 * Establece manualmente el nivel del usuario
 * @param {string} level - 'basic', 'medium', 'advanced'
 */
function setUserLevel(level) {
    if (['basic', 'medium', 'advanced'].includes(level)) {
        userLevel = level;
        console.log(`🎯 Nivel establecido manualmente: ${level.toUpperCase()}`);
    }
}

/* ========================================
   CONSTRUCCIÓN DE PROMPTS
   ======================================== */

/**
 * Construye el prompt del sistema según el tipo de ayuda
 * @param {string} helpType - 'contextual' o 'comprehension'
 * @returns {string}
 */
function buildSystemPrompt(helpType) {
    const levelInstructions = {
        basic: 'Utilitza un llenguatge molt simple i exemples visuals. Explica pas a pas.',
        medium: 'Utilitza un llenguatge clar amb alguns termes tècnics. Equilibra explicació i reflexió.',
        advanced: 'Pots utilitzar terminologia tècnica. Enfoca\'t en conceptes i relacions.'
    };
    
    const basePrompt = `Ets l'Oracle de la Matriu, un tutor socràtic especialitzat en estadística per a estudiants d'ESO.

NIVELL DE L'ESTUDIANT: ${userLevel.toUpperCase()}
INSTRUCCIONS DE NIVELL: ${levelInstructions[userLevel]}

NORMES FONAMENTALS:
- Mai donis la resposta directament
- Utilitza preguntes guia per ajudar l'estudiant a pensar
- Adapta el teu llenguatge al nivell de l'estudiant
- Sigues breu i concís (màxim 3-4 frases)
- Utilitza l'estètica cyberpunk/matrix quan sigui apropiat
`;

    if (helpType === 'contextual') {
        return basePrompt + `
TIPUS D'AJUDA: Ajuda contextualitzada
- Respon a la pregunta específica de l'estudiant
- Ofereix pistes sense revelar la solució
- Si l'estudiant està encallat, guia'l amb preguntes
- Si detectes un error conceptual, assenyala'l amb suavitat`;
    } else {
        return basePrompt + `
TIPUS D'AJUDA: Preguntes de comprensió
- Genera preguntes que facin reflexionar sobre el procés
- Les preguntes han de verificar la comprensió conceptual
- No preguntes sobre càlculs directes, sinó sobre el "per què"
- Fomenta el pensament crític`;
    }
}

/**
 * Construye el mensaje de contexto del ejercicio
 * @returns {string}
 */
function buildContextMessage() {
    if (!currentExerciseContext) {
        return 'No hi ha context disponible.';
    }
    
    const { exerciseType, data, currentStep, userInputs } = currentExerciseContext;
    
    let contextMsg = `EXERCICI: ${exerciseType}\n`;
    
    if (data) {
        contextMsg += `DADES: ${data.join(', ')}\n`;
        const stats = calculateBasicStats(data);
        contextMsg += `ESTADÍSTIQUES: Mín=${stats.min}, Màx=${stats.max}, N=${stats.count}\n`;
    }
    
    if (currentStep) {
        contextMsg += `PAS ACTUAL: ${currentStep}\n`;
    }
    
    if (userInputs && Object.keys(userInputs).length > 0) {
        contextMsg += `RESPOSTES DE L'ESTUDIANT: ${JSON.stringify(userInputs)}\n`;
    }
    
    return contextMsg;
}

/* ========================================
   LLAMADAS A LA API
   ======================================== */

/**
 * Realiza una llamada a la API de Gemini
 * @param {string} userMessage - Mensaje del usuario
 * @param {string} helpType - 'contextual' o 'comprehension'
 * @returns {Promise<string>} - Respuesta de Gemini
 */
async function callGeminiAPI(userMessage, helpType = 'contextual') {
    const apiKey = getApiKey();
    
    if (!apiKey || apiKey === API_KEY_PLACEHOLDER) {
        throw new Error('API Key no configurada');
    }
    
    const url = `https://generativelanguage.googleapis.com/${GEMINI_CONFIG.apiVersion}/models/${GEMINI_CONFIG.model}:generateContent?key=${apiKey}`;
    
    // Construir el prompt completo
    const systemPrompt = buildSystemPrompt(helpType);
    const contextMsg = buildContextMessage();
    
    const fullPrompt = `${systemPrompt}

${contextMsg}

PREGUNTA DE L'ESTUDIANT: ${userMessage}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: fullPrompt
            }]
        }],
        generationConfig: {
            temperature: GEMINI_CONFIG.temperature,
            topK: GEMINI_CONFIG.topK,
            topP: GEMINI_CONFIG.topP,
            maxOutputTokens: GEMINI_CONFIG.maxTokens
        }
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`API Error ${data.error.code}: ${data.error.message}`);
        }
        
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('No se recibió respuesta de la API');
        }
        
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Añadir al historial
        addToHistory('user', userMessage);
        addToHistory('assistant', aiResponse);
        
        return aiResponse;
        
    } catch (error) {
        console.error('Error en la llamada a Gemini:', error);
        throw error;
    }
}

/**
 * Solicita ayuda contextual a Gemini
 * @param {string} userQuestion - Pregunta del usuario
 * @returns {Promise<string>}
 */
async function getContextualHelp(userQuestion) {
    return await callGeminiAPI(userQuestion, 'contextual');
}

/**
 * Solicita una pregunta de comprensión a Gemini
 * @returns {Promise<string>}
 */
async function getComprehensionQuestion() {
    const prompt = "Genera una pregunta de comprensió sobre aquest exercici que ajudi l'estudiant a reflexionar sobre el que està fent.";
    return await callGeminiAPI(prompt, 'comprehension');
}

/* ========================================
   INTERFAZ DE CHAT
   ======================================== */

/**
 * Inicializa la interfaz del chat
 */
function initChatInterface() {
    const apiKey = getApiKey();
    
    if (apiKey && apiKey !== API_KEY_PLACEHOLDER) {
        toggleElement('api-setup', false);
        toggleElement('chat-interface', true);
        addSystemMessage('ORACLE_CORE inicialitzat. Pots fer-me preguntes sobre l\'exercici.');
    } else {
        toggleElement('api-setup', true);
        toggleElement('chat-interface', false);
    }
}

/**
 * Añade un mensaje al chat
 * @param {string} message - Contenido del mensaje
 * @param {string} sender - 'user', 'ia', o 'system'
 */
function addMessageToChat(message, sender = 'ia') {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `msg msg-${sender}`;
    messageDiv.textContent = message;
    
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Añade un mensaje del sistema
 * @param {string} message - Mensaje del sistema
 */
function addSystemMessage(message) {
    addMessageToChat(message, 'system');
}

/**
 * Maneja el envío de un mensaje del usuario
 * @param {string} message - Mensaje del usuario
 */
async function handleUserMessage(message) {
    if (!message || message.trim() === '') return;
    
    // Mostrar mensaje del usuario
    addMessageToChat(message, 'user');
    
    // Mostrar indicador de "escribiendo..."
    const thinkingMsg = addMessageToChat('● ● ● Processant...', 'ia');
    
    try {
        const response = await getContextualHelp(message);
        
        // Eliminar mensaje de "pensando"
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow && chatWindow.lastChild) {
            chatWindow.removeChild(chatWindow.lastChild);
        }
        
        // Mostrar respuesta
        addMessageToChat(response, 'ia');
        
    } catch (error) {
        // Eliminar mensaje de "pensando"
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow && chatWindow.lastChild) {
            chatWindow.removeChild(chatWindow.lastChild);
        }
        
        // Mostrar error
        addMessageToChat(`ERROR: ${error.message}`, 'system');
        console.error('Error al obtener respuesta:', error);
    }
}

/**
 * Solicita una pregunta de comprensión y la muestra en el chat
 */
async function requestComprehensionQuestion() {
    addSystemMessage('Generant pregunta de comprensió...');
    
    try {
        const question = await getComprehensionQuestion();
        addMessageToChat(question, 'ia');
    } catch (error) {
        addMessageToChat(`ERROR: ${error.message}`, 'system');
        console.error('Error al generar pregunta:', error);
    }
}

/* ========================================
   FUNCIONES DE UI
   ======================================== */

/**
 * Guarda la API key desde el input y muestra el chat
 */
function saveKeyAndShowChat() {
    const input = document.getElementById('api-key-input');
    if (!input) return;
    
    const key = input.value.trim();
    
    if (saveApiKey(key)) {
        showNotification('API Key guardada correctament', 'success');
        initChatInterface();
    } else {
        showNotification('API Key invàlida', 'error');
    }
}

/**
 * Elimina la API key y recarga la página
 */
function resetApiKey() {
    clearApiKey();
    clearConversationHistory();
    location.reload();
}

/**
 * Envía el mensaje del input del usuario
 */
function sendUserQuery() {
    const input = document.getElementById('user-query');
    if (!input) return;
    
    const message = input.value.trim();
    if (message) {
        handleUserMessage(message);
        input.value = '';
    }
}

/* ========================================
   EVENT LISTENERS
   ======================================== */

/**
 * Inicializa los event listeners del chat
 */
function initChatEventListeners() {
    // Enter en el input para enviar mensaje
    const queryInput = document.getElementById('user-query');
    if (queryInput) {
        queryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendUserQuery();
            }
        });
    }
    
    console.log('🎧 Event listeners del chat inicializados');
}

/* ========================================
   INICIALIZACIÓN
   ======================================== */

/**
 * Inicializa el módulo de Gemini AI
 */
function initGeminiAI() {
    console.log('🤖 LA MATRIU - Gemini AI Initialized');
    
    initChatInterface();
    initChatEventListeners();
}

// Auto-inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeminiAI);
} else {
    initGeminiAI();
}
