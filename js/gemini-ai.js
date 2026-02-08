/**
 * LA MATRIU - GEMINI AI
 * Integració completa amb Google Gemini
 * Funcions: Chat socràtic, Nivells d'aprenentatge, Multiidioma, Historial
 */

/* ========================================
   CONFIGURACIÓ I PLACEHOLDERS
   ======================================== */
const GEMINI_CONFIG = {
    apiVersion: 'v1beta',
    model: 'gemini-2.5-flash',
    maxTokens: 1000,
    temperature: 0.7,
    topP: 0.9,
    topK: 40
};

// Aquest és l'únic lloc on ha d'aparèixer el text REPLACE_ME...
const API_KEY_PLACEHOLDER = 'REPLACE_ME_WITH_API_KEY';

/* ========================================
   ESTAT DE LA CONVERSA
   ======================================== */
let conversationHistory = [];
let userLevel = 'medium'; 
let currentExerciseContext = null;
let selectedLanguage = 'ca'; // Idioma per defecte: català

/* ========================================
   GESTIÓ DE CONTEXT I NIVELLS
   ======================================== */

function initExerciseContext(context) {
    currentExerciseContext = context;
    conversationHistory = [];
    console.log('📝 Context inicialitzat:', context);
}

function addToHistory(role, content) {
    conversationHistory.push({ role: role, content: content, timestamp: Date.now() });
    if (conversationHistory.length > 10) conversationHistory = conversationHistory.slice(-10);
}

function analyzeUserLevel(userResponse) {
    const { correct, attempts, timeSpent } = userResponse;
    if (correct && attempts === 1 && timeSpent < 30000) {
        userLevel = 'advanced';
    } else if (!correct && attempts > 2) {
        userLevel = 'basic';
    }
    return userLevel;
}

/* ========================================
   GESTIÓ D'IDIOMES
   ======================================== */

/**
 * Canvia l'idioma de l'Oracle
 */
function changeLanguage() {
    const select = document.getElementById('language-select');
    if (select) {
        selectedLanguage = select.value;
        localStorage.setItem('matriu_language', selectedLanguage);
        console.log(`🌐 Idioma canviat a: ${selectedLanguage.toUpperCase()}`);
        addMessageToChat(getLanguageConfirmation(), 'system');
    }
}

/**
 * Carrega l'idioma guardat
 */
function loadSavedLanguage() {
    const saved = localStorage.getItem('matriu_language');
    if (saved) {
        selectedLanguage = saved;
        const select = document.getElementById('language-select');
        if (select) select.value = saved;
    }
}

/**
 * Obté el missatge de confirmació segons l'idioma
 */
function getLanguageConfirmation() {
    const messages = {
        ca: 'Idioma canviat a català',
        es: 'Idioma cambiado a español',
        en: 'Language changed to English'
    };
    return messages[selectedLanguage] || messages.ca;
}

/**
 * Obté les instruccions d'idioma per al prompt
 */
function getLanguageInstruction() {
    const instructions = {
        ca: 'Respon SEMPRE en català.',
        es: 'Responde SIEMPRE en español.',
        en: 'Always respond in English.'
    };
    return instructions[selectedLanguage] || instructions.ca;
}

/* ========================================
   CONSTRUCCIÓ DE PROMPTS COMPLEXOS
   ======================================== */

function buildSystemPrompt(helpType) {
    const levelInstructions = {
        basic: 'Utilitza un llenguatge molt simple i exemples visuals. Explica pas a pas.',
        medium: 'Utilitza un llenguatge clar amb alguns termes tècnics. Equilibra explicació i reflexió.',
        advanced: 'Pots utilitzar terminologia tècnica. Enfoca\'t en conceptes i relacions.'
    };
    
    const basePrompt = `Ets l'Oracle de la Matriu, un tutor socràtic especialitzat en estadística per a estudiants d'ESO.

${getLanguageInstruction()}

NIVELL DE L'ESTUDIANT: ${userLevel.toUpperCase()}
INSTRUCCIONS DE NIVELL: ${levelInstructions[userLevel]}

NORMES:
- Mai donis la resposta directament.
- Utilitza preguntes guia per ajudar l'estudiant a pensar.
- Sigues breu i concís (màxim 3-4 frases).
- Estètica cyberpunk/matrix quan sigui apropiat.`;

    return helpType === 'contextual' 
        ? basePrompt + "\nTIPUS: Ajuda contextual. Ofereix pistes sobre l'error o el següent pas."
        : basePrompt + "\nTIPUS: Comprensió. Fes una pregunta sobre el 'per què' conceptual.";
}

function buildContextMessage() {
    if (!currentExerciseContext) return 'No hi ha context disponible.';
    const { exerciseType, data, currentStep, userInputs } = currentExerciseContext;
    let msg = `EXERCICI: ${exerciseType}\n`;
    if (data) msg += `DADES: ${data.join(', ')}\n`;
    if (currentStep) msg += `PAS ACTUAL: ${currentStep}\n`;
    if (userInputs) msg += `RESPOSTES: ${JSON.stringify(userInputs)}`;
    return msg;
}

/* ========================================
   LOGICA DE SEGURETAT DE LA CLAU (FIX DEPLOY)
   ======================================== */

/**
 * Comprova si la clau és operativa sense mencionar el placeholder
 * per evitar que el sed de GitHub trenqui la lògica.
 */
function isKeyOperational(key) {
    // Una clau real de Gemini comença per AIza i té més de 20 caràcters
    return key && key.length > 20 && key.indexOf('AIza') === 0;
}

function refreshChatUI() {
    const key = getApiKey();
    const setupPanel = document.getElementById('api-setup');
    const chatPanel = document.getElementById('chat-interface');
    
    if (isKeyOperational(key)) {
        if (setupPanel) setupPanel.style.display = 'none';
        if (chatPanel) chatPanel.style.display = 'flex';
        return true;
    }
    return false;
}

/* ========================================
   API CALLS
   ======================================== */

async function callGeminiAPI(userMessage, helpType = 'contextual') {
    const apiKey = getApiKey();
    if (!isKeyOperational(apiKey)) throw new Error('PROTOCOL_ERROR: Clau no vàlida.');

    const url = `https://generativelanguage.googleapis.com/${GEMINI_CONFIG.apiVersion}/models/${GEMINI_CONFIG.model}:generateContent?key=${apiKey}`;
    
    const requestBody = {
        contents: [{ parts: [{ text: `${buildSystemPrompt(helpType)}\n\n${buildContextMessage()}\n\nUsuari: ${userMessage}` }] }],
        generationConfig: {
            temperature: GEMINI_CONFIG.temperature,
            maxOutputTokens: GEMINI_CONFIG.maxTokens
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    const aiText = data.candidates[0].content.parts[0].text;
    addToHistory('user', userMessage);
    addToHistory('assistant', aiText);
    return aiText;
}

async function getContextualHelp(q) { return await callGeminiAPI(q, 'contextual'); }
async function getComprehensionQuestion() { return await callGeminiAPI("Genera una pregunta.", 'comprehension'); }

/* ========================================
   INTERFAZ DE CHAT
   ======================================== */

function addMessageToChat(message, sender = 'ia') {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    const div = document.createElement('div');
    div.className = `msg msg-${sender}`;
    div.textContent = message;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addSystemMessage(message) {
    addMessageToChat(message, 'system');
}

async function handleUserMessage(message) {
    if (!message?.trim()) return;
    
    // IMPORTANT: Mostrar pregunta de l'usuari
    addMessageToChat(message, 'user');
    
    // Mostrar indicador de "processant"
    addMessageToChat('● ● ● Processant...', 'ia');

    try {
        const response = await getContextualHelp(message);
        const chatWindow = document.getElementById('chat-window');
        // Eliminar missatge de "processant"
        if (chatWindow && chatWindow.lastChild) chatWindow.removeChild(chatWindow.lastChild);
        // Mostrar resposta de l'IA
        addMessageToChat(response, 'ia');
    } catch (error) {
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow && chatWindow.lastChild) chatWindow.removeChild(chatWindow.lastChild);
        addMessageToChat(`ERROR: ${error.message}`, 'system');
    }
}

function sendUserQuery() {
    const input = document.getElementById('user-query');
    const msg = input?.value.trim();
    if (msg) { 
        handleUserMessage(msg); 
        input.value = ''; 
    }
}

async function requestComprehensionQuestion() {
    addSystemMessage('Generant pregunta de comprensió...');
    try {
        const q = await getComprehensionQuestion();
        addMessageToChat(q, 'ia');
    } catch (e) { 
        addSystemMessage('Error al generar pregunta'); 
    }
}

function saveKeyAndShowChat() {
    const key = document.getElementById('api-key-input')?.value.trim();
    if (saveApiKey(key)) {
        refreshChatUI();
        addSystemMessage("Connexió establerta amb l'Oracle... [ONLINE]");
    }
}

function resetApiKey() {
    clearApiKey();
    location.reload();
}

/* ========================================
   INICIALITZACIÓ
   ======================================== */

function initGeminiAI() {
    console.log('🤖 LA MATRIU - Inicialitzant sistema...');

    // 1. Carregar idioma guardat
    loadSavedLanguage();

    // 2. Detectar injecció (Variable global definida a l'HTML)
    if (typeof INJECTED_API_KEY !== 'undefined' && isKeyOperational(INJECTED_API_KEY)) {
        saveApiKey(INJECTED_API_KEY);
        console.log('✅ Clau injectada automàticament.');
    }

    // 3. Intentar obrir la UI
    const isUnlocked = refreshChatUI();
    if (isUnlocked) {
        addSystemMessage("Connexió establerta amb l'Oracle... [ONLINE]");
    }

    // 4. Event Listeners
    const queryInput = document.getElementById('user-query');
    if (queryInput) {
        queryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendUserQuery();
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeminiAI);
} else {
    initGeminiAI();
}
