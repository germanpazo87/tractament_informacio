function injectFooter() { const footer = document.createElement('footer'); footer.style = "margin-top: 50px; padding: 20px; border-top: 1px solid #00ff41; font-family: monospace; text-align: center;"; footer.innerHTML = <p style="color: #00ff41;">> SISTEMA: L'Oracle de la Matriu - TFM Germán Pazó</p> <p style="color: #00ff41; font-size: 0.8em;">Llicència: Creative Commons BY-NC-SA 4.0</p>; document.body.appendChild(footer); }

window.addEventListener('load', injectFooter);
