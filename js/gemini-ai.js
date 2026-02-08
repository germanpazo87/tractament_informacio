/**
 * LA MATRIU - GEMINI AI
 * Integració amb l'API de Google Gemini
 * Versió: 2.5-flash (Fixed Deploy Logic)
 */

/* ========================================
   CONFIGURACIÓ
   ======================================== */
const GEMINI_CONFIG = {
    apiVersion: 'v1beta',
    model: 'gemini-2.5-flash',
    maxTokens: 1000,
    temperature: 0.7,
    topP: 0.9,
    topK: 40
};

// Aquest placeholder sí que el volem substituir
const API_KEY_PLACEHOLDER = 'REPLACE_ME_WITH_API_KEY';

/* ========================================
   GESTIÓ DE CONVERSA
   ======================================== */
let conversationHistory = [];
let userLevel = 'medium'; 
let currentExerciseContext = null;

function initExerciseContext(context) {
    currentExerciseContext = context;
    conversationHistory = [];
    console.log('📝 Context actualitzat:', context);
}

function addToHistory(role, content) {
    conversationHistory.push({ role: role, content: content });
    if (conversationHistory.length > 10) conversationHistory = conversationHistory.slice(-10);
}

/* ========================================
   LOGICA DE UI (REFRESH)
   ======================================== */

/**
 * Verifica si la clau guardada és una clau real o el placeholder
 * Fem servir .startsWith('AIza') perquè el sed no trobi el text ací
 */
function isKeyValid(key) {
    return key && key.length > 20 && key.indexOf('AIza') === 0;
}

function refreshChatUI() {
    const key = getApiKey();
    const setupPanel = document.getElementById('api-setup');
    const chatPanel = document.getElementById('chat-interface');
    
    if (isKeyValid(key)) {
        if (setupPanel) setupPanel.style.display = 'none';
        if (chatPanel) chatPanel.style.display = 'flex';
        return true;
    } else {
        if (setupPanel) setupPanel.style.display = 'flex';
        if (chatPanel) chatPanel.style.display = 'none';
        return false;
    }
}

/* ========================================
   LLAMADAS API
   ======================================== */

async function callGeminiAPI(userMessage, helpType = 'contextual') {
    const apiKey = getApiKey();
    if (!isKeyValid(apiKey)) throw new Error('PROTOCOL_ERROR: Clau no vàlida.');

    const url = `https://generativelanguage.googleapis.com/${GEMINI_CONFIG.apiVersion}/models/${GEMINI_CONFIG.model}:generateContent?key=${apiKey}`;
    
    // Prompt simplificat per a test
    const systemPrompt = "Ets l'Oracle de la Matriu, tutor socràtic d'estadística. Sigues breu.";
    const contextMsg = currentExerciseContext ? `Context: ${JSON.stringify(currentExerciseContext)}` : "";

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n${contextMsg}\nUsuari: ${userMessage}` }] }]
            })
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        throw error;
    }
}

/* ========================================
   INTERFAZ DE CHAT
   ======================================== */

function addMessageToChat(message, sender = 'ia') {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg msg-${sender}`;
    msgDiv.textContent = message;
    chatWindow.appendChild(msgDiv);
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

function sendUserQuery() {
    const input = document.getElementById('user-query');
    const msg = input?.value.trim();
    if (msg) { handleUserMessage(msg); input.value = ''; }
}

function saveKeyAndShowChat() {
    const key = document.getElementById('api-key-input')?.value.trim();
    if (saveApiKey(key)) refreshChatUI();
}

/* ========================================
   INICIALITZACIÓ
   ======================================== */

function initGeminiAI() {
    console.log('🤖 LA MATRIU - Inicialitzant...');

    // 1. Mirar si hi ha clau injectada
    if (typeof INJECTED_API_KEY !== 'undefined' && isKeyValid(INJECTED_API_KEY)) {
        saveApiKey(INJECTED_API_KEY);
    }

    // 2. Aplicar UI
    const unlocked = refreshChatUI();

    if (unlocked) {
        addMessageToChat("Connexió establerta amb l'Oracle... [ONLINE]", 'system');
    }

    // Event listeners
    document.getElementById('user-query')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendUserQuery();
    });
}

// Auto-run
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGeminiAI);
} else {
    initGeminiAI();
}
