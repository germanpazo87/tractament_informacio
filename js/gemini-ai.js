/**
 * LA MATRIU - GEMINI AI
 * Integració completa amb Google Gemini
 * Funcions: Chat socràtic, Nivells d'aprenentatge, Historial i Injecció de Key
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
   CONSTRUCCIÓ DE PROMPTS COMPLEXOS
   ======================================== */

function buildSystemPrompt(helpType) {
    const levelInstructions = {
        basic: 'Utilitza un llenguatge molt simple i exemples visuals. Explica pas a pas.',
        medium: 'Utilitza un llenguatge clar amb alguns termes tècnics. Equilibra explicació i reflexió.',
        advanced: 'Pots utilitzar terminologia tècnica. Enfoca\'t en conceptes i relacions.'
    };
    
    const basePrompt = `Ets l'Oracle de la Matriu, un tutor socràtic especialitzat en estadística per a estudiants d'ESO.
NIVELL DE L'ESTUDIANT: ${userLevel.toUpperCase()}
INSTRUCCIONS DE NIVELL: ${levelInstructions[userLevel]}

NORMES:
- Mai donis la resposta directament.
- Utilitza preguntes guia per ajudar l'estudiant a pensar.
- Sigues breu i concís (màxim 3-4 frases).
- Estètica cyberpunk/matrix.`;

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

async function handleUserMessage(message) {
    if (!message?.trim()) return;
    addMessageToChat(message, 'user');
    addMessageToChat('● ● ● Processant...', 'ia');

    try {
        const response = await getContextualHelp(message);
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) chatWindow.removeChild(chatWindow.lastChild);
        addMessageToChat(response, 'ia');
    } catch (error) {
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) chatWindow.removeChild(chatWindow.lastChild);
        addMessageToChat(`ERROR: ${error.message}`, 'system');
    }
}

function sendUserQuery() {
    const input = document.getElementById('user-query');
    const msg = input?.value.trim();
    if (msg) { handleUserMessage(msg); input.value = ''; }
}

async function requestComprehensionQuestion() {
    addMessageToChat('Generant pregunta de comprensió...', 'system');
    try {
        const q = await getComprehensionQuestion();
        addMessageToChat(q, 'ia');
    } catch (e) { addMessageToChat('Error al generar pregunta', 'system'); }
}

function saveKeyAndShowChat() {
    const key = document.getElementById('api-key-input')?.value.trim();
    if (saveApiKey(key)) refreshChatUI();
}

/* ========================================
   INICIALITZACIÓ
   ======================================== */

function initGeminiAI() {
    console.log('🤖 LA MATRIU - Inicialitzant sistema...');

    // 1. Detectar injecció (Variable global definida a l'HTML)
    if (typeof INJECTED_API_KEY !== 'undefined' && isKeyOperational(INJECTED_API_KEY)) {
        saveApiKey(INJECTED_API_KEY);
        console.log('✅ Clau injectada automàticament.');
    }

    // 2. Intentar obrir la UI
    const isUnlocked = refreshChatUI();
    if (isUnlocked) {
        addMessageToChat("Connexió establerta amb l'Oracle... [ONLINE]", 'system');
    }

    // Event Listeners
    document.getElementById('user-query')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendUserQuery();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeminiAI);
} else {
    initGeminiAI();
}
