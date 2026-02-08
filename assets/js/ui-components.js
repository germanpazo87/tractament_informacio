function injectInterface(titolEina, breadcrumbText) {

    const container = document.querySelector('.container');
    if (!container) return;

    // 1. HEADER (Sense errors d'etiquetes visibles)
    const headerHTML = `
<header>
    <div class="header-titles">
        <div class="breadcrumb">${breadcrumbText}</div>
        <h1 style="margin-top:5px; display:block;">${titolEina}</h1>
    </div>

    <a
        href="https://germanpazo87.github.io/"
        class="btn-return"
        style="text-decoration:none;"
    >
        TORNAR AL CORE
    </a>
</header>
`;

    // 2. FOOTER (Actualitzat a CC BY-NC-ND 4.0)
    const footerHTML = `
<footer
    style="
        margin-top:50px;
        border-top:1px solid rgba(0,255,249,0.1);
        padding:20px;
        text-align:center;
    "
>
    <div style="margin-bottom:10px; opacity:0.8;">
        <img
            src="https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by-nc-nd.svg"
            alt="CC BY-NC-ND 4.0"
            style="width:100px; filter: brightness(1.2);"
        >
    </div>

    <div
        style="
            font-size:0.75rem;
            color:#94a3b8;
            font-family:'Share Tech Mono';
            line-height:1.6;
        "
    >
        Recurs educatiu creat per
        <span style="color:#00fff9;">Germán Pazo</span>.
        <br>
        Llicència:
        <a
            href="https://creativecommons.org/licenses/by-nc-nd/4.0/deed.ca"
            target="_blank"
            style="color:#00fff9; text-decoration:none;"
        >
            CC BY-NC-ND 4.0 International
        </a>
        <br>
        <span
            style="
                color:rgba(0,255,249,0.3);
                font-size:0.65rem;
                letter-spacing:1px;
                text-transform:uppercase;
            "
        >
            Projecte: La Matriu // Infodynamics // 2026
        </span>
    </div>
</footer>
`;

    // Fem la injecció neta
    container.innerHTML = headerHTML + container.innerHTML + footerHTML;
}
