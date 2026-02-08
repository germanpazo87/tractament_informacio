function injectInterface(titolEina, breadcrumbText) {

    const container = document.querySelector('.container');
    if (!container) return;

    const headerHTML = `
<header>
    <div class="header-titles">
        <div class="breadcrumb" style="font-size:0.75rem; color:rgba(0,255,249,0.6); letter-spacing:1px; margin-bottom:5px;">
            ${breadcrumbText}&lt;/div&gt;
&lt;h1 style=&quot;font-family:&#39;Orbitron&#39;, sans-serif; margin:0; font-size:1.5rem; color:#fff; text-shadow: 0 0 10px var(--neon-blue);&quot;&gt;${titolEina}
        </h1>
    </div>
    <a href="" class="btn-return">TORNAR_AL_CORE</a>
</header>`;

    const footerHTML = `
<footer style="margin-top:50px; border-top:1px solid rgba(0,255,249,0.1); padding:25px; text-align:center;">
    <div style="margin-bottom:15px; opacity:0.8;">
        <img src="" alt="CC BY-NC-ND 4.0" style="width:100px; filter:brightness(1.2);">
    </div>
    <div style="font-size:0.8rem; color:#94a3b8; font-family:'Share Tech Mono', monospace; line-height:1.6;">
        Recurs educatiu creat per
        <span style="color:#00fff9;">Germán Pazo</span>.
        Llicència:
        <a href="" target="_blank" style="color:#00fff9; text-decoration:none;">
            CC BY-NC-ND 4.0 International
        </a>
        <span style="color:rgba(0,255,249,0.3); font-size:0.65rem; letter-spacing:2px; text-transform:uppercase;">
            Projecte: La Matriu // 2026
        </span>
    </div>
</footer>`;

    container.insertAdjacentHTML('afterbegin', headerHTML);
    container.insertAdjacentHTML('beforeend', footerHTML);
}
