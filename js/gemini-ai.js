/**
 * LA MATRIU - GEMINI AI
 * Integració amb l'API de Google Gemini
 * Funcions: Chat contextualitzat, Ajuda adaptativa, Pregunta de comprensió
 */

/* ========================================
   CONFIGURACIÓ
   ======================================== */

const GEMINI_CONFIG = {
    apiVersion: 'v1beta',
    model: 'gemini-2.5-flash', // Mantenim la versió que et funciona
    maxTokens: 1000,
    temperature: 0.7,
    topP: 0.9,
    topK: 40
};

const API_KEY_PLACEHOLDER = 'REPLACE_ME_WITH_API_KEY';

/* ========================================
   GESTIÓ DE CONVERSA I CONTEXT
   ======================================== */

let conversationHistory = [];
let userLevel = 'medium'; 
let currentExerciseContext = null;

function initExerciseContext(context) {
    currentExerciseContext = context;
    conversationHistory = [];
    console.log('📝 Context de l\'exercici actualitzat:', context);
}

function addToHistory(role, content) {
    conversationHistory.push({ role: role, content: content, timestamp: Date.now() });
    if (conversationHistory.length > 10) conversationHistory = conversationHistory.slice(-10);
}

/* ========================================
   CONSTRUCCIÓ DE PROMPTS
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
- Sigues breu i concís (màxim 3 frases).
- Estètica: Cyberpunk/Matrix.`;

    return helpType === 'contextual' 
        ? basePrompt + "\nAjuda l'alumne amb el pas actual sense revelar la solució."
        : basePrompt + "\nGenera una pregunta conceptual sobre el 'per què' del que s'està fent.";
}

function buildContextMessage() {
    if (!currentExerciseContext) return 'No hi ha context disponible.';
    const { exerciseType, data, stats, currentStep, userInputs } = currentExerciseContext;
    return `EXERCICI: ${exerciseType}\nDADES: ${data?.join(', ')}\nSTATS: Min=${stats?.min}, Max=${stats?.max}\nPAS ACTUAL: ${currentStep}\nRESPOSTES: ${JSON.stringify(userInputs)}`;
}

/* ========================================
   LLAMADAS A LA API
   ======================================== */

async function callGeminiAPI(userMessage, helpType = 'contextual') {
    const apiKey = getApiKey();
    if (!apiKey || apiKey === API_KEY_PLACEHOLDER) throw new Error('API Key no configurada');

    const url = `https://generativelanguage.googleapis.com/${GEMINI_CONFIG.apiVersion}/models/${GEMINI_CONFIG.model}:generateContent?key=${apiKey}`;
    const fullPrompt = `${buildSystemPrompt(helpType)}\n\n${buildContextMessage()}\n\nPREGUNTA: ${userMessage}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                    temperature: GEMINI_CONFIG.temperature,
                    maxOutputTokens: GEMINI_CONFIG.maxTokens
                }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        const aiResponse = data.candidates[0].content.parts[0].text;
        addToHistory('user', userMessage);
        addToHistory('assistant', aiResponse);
        return aiResponse;
    } catch (error) {
        console.error('Error Gemini:', error);
        throw error;
    }
}

/* ========================================
   INTERFAZ DE CHAT (UI)
   ======================================== */

/**
 * Funció central per refrescar la interfície (Show/Hide)
 */
function refreshChatUI() {
    const apiKey = getApiKey();
    const setupPanel = document.getElementById('api-setup');
    const chatPanel = document.getElementById('chat-interface');
    
    if (apiKey && apiKey !== API_KEY_PLACEHOLDER && apiKey.length > 20) {
        if (setupPanel) setupPanel.style.display = 'none';
        if (chatPanel) chatPanel.style.display = 'flex';
        return true;
    } else {
        if (setupPanel) setupPanel.style.display = 'flex';
        if (chatPanel) chatPanel.style.display = 'none';
        return false;
    }
}

function addMessageToChat(message, sender = 'ia') {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `msg msg-${sender}`;
    messageDiv.textContent = message;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function handleUserMessage(message) {
    if (!message?.trim()) return;
    addMessageToChat(message, 'user');
    addMessageToChat('● ● ● Processant...', 'ia');

    try {
        const response = await callGeminiAPI(message);
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) chatWindow.removeChild(chatWindow.lastChild);
        addMessageToChat(response, 'ia');
    } catch (error) {
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) chatWindow.removeChild(chatWindow.lastChild);
        addMessageToChat(`ERROR: ${error.message}`, 'system');
    }
}

/* ========================================
   CONTROLADORS D'ESDEVENIMENTS
   ======================================== */

function saveKeyAndShowChat() {
    const input = document.getElementById('api-key-input');
    const key = input?.value.trim();
    if (saveApiKey(key)) {
        showNotification('Connexió establerta', 'success');
        refreshChatUI();
    } else {
        showNotification('Clau invàlida', 'error');
    }
}

function sendUserQuery() {
    const input = document.getElementById('user-query');
    const message = input?.value.trim();
    if (message) {
        handleUserMessage(message);
        input.value = '';
    }
}

function initChatEventListeners() {
    document.getElementById('user-query')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendUserQuery();
    });
}

/* ========================================
   INICIALITZACIÓ (EL DESPERTAR)
   ======================================== */

function initGeminiAI() {
    console.log('🤖 LA MATRIU - Iniciant protocols de l\'Oracle...');

    // 1. Mirar si hi ha clau injectada pel deploy
    if (typeof INJECTED_API_KEY !== 'undefined' && 
        INJECTED_API_KEY !== API_KEY_PLACEHOLDER && 
        INJECTED_API_KEY.length > 20) {
        saveApiKey(INJECTED_API_KEY);
    }

    // 2. Aplicar canvis visuals segons la clau
    const isUnlocked = refreshChatUI();

    if (isUnlocked) {
        addMessageToChat("Connexió xifrada amb l'Oracle... [ONLINE]", 'system');
    }

    initChatEventListeners();
}

// Arrencar automàticament
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeminiAI);
} else {
    initGeminiAI();
}
