const API_KEY = "REPLACE_ME_WITH_API_KEY";

const SYSTEM_PROMPT = "Ets l'Oracle de la Matriu. Tutor socràtic. To cyberpunk i gèlid. Mai donis solucions numèriques, només preguntes per guiar l'alumne.";

async function callOracle(userMsg, context) { const url = "" + API_KEY; const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: SYSTEM_PROMPT + "\nContext: " + context + "\nUsuari: " + userMsg }] }] }) }); const data = await response.json(); return data.candidates[0].content.parts[0].text; }
