let rawData = [];
let stats = { min: 0, max: 0 };
let API_KEY = localStorage.getItem('la_matriu_key');

window.onload = () => { 
    if(typeof INJECTED_API_KEY !== 'undefined' && INJECTED_API_KEY !== 'REPLACE_ME_WITH_API_KEY') {
        API_KEY = INJECTED_API_KEY; showChat();
    } else if(API_KEY) { showChat(); }
    initProtocol(); 
};

function initProtocol() {
    rawData = Array.from({length: 12}, () => Math.floor(Math.random() * 60) + 10);
    stats.min = Math.min(...rawData); stats.max = Math.max(...rawData);
    document.getElementById('data-display').innerText = rawData.join(' , ');
    document.getElementById('real-min').innerText = stats.min;
    document.getElementById('real-max').innerText = stats.max;
    updateUI();
}

function updateUI() {
    const start = parseFloat(document.getElementById('in-start').value);
    const amp = parseFloat(document.getElementById('in-amp').value);
    const body = document.getElementById('interval-body');
    body.innerHTML = '';
    if(isNaN(start) || isNaN(amp) || amp <= 0) return;
    for(let i=0; i<5; i++) {
        let li = start + (i*amp); let ls = li + amp;
        body.innerHTML += `<tr><td>[${li}, ${ls})</td><td><input type="number" class="val-input xi-in" data-li="${li}" data-ls="${ls}" oninput="valXi(this)" style="width:70px; padding:2px;"></td></tr>`;
    }
}

function valXi(el) {
    const target = (parseFloat(el.dataset.li) + parseFloat(el.dataset.ls)) / 2;
    el.className = "val-input xi-in " + (parseFloat(el.value) === target ? "correct" : "incorrect");
}

function saveKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if(key.length > 10) { localStorage.setItem('la_matriu_key', key); API_KEY = key; showChat(); }
}

function clearKey() { localStorage.removeItem('la_matriu_key'); location.reload(); }
function showChat() { document.getElementById('api-setup').style.display='none'; document.getElementById('chat-interface').style.display='flex'; }

async function askGemini() {
    const qInput = document.getElementById('user-query');
    const q = qInput.value; if(!q) return;
    addMsg(q, 'user'); qInput.value = '';
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: "Ets el Core de la Matriu. Tutor socràtic. Dades: " + rawData.join(',') + ". Pregunta: " + q }] }] })
        });
        const data = await res.json();
        addMsg(data.candidates[0].content.parts[0].text, 'ia');
    } catch(e) { addMsg("FALLADA_DE_PROTOCOL. Revisa la consola F12.", 'ia'); }
}

function addMsg(t, s) {
    const w = document.getElementById('chat-window');
    const d = document.createElement('div'); d.className = `msg msg-${s}`; d.innerText = t;
    w.appendChild(d); w.scrollTop = w.scrollHeight;
}
