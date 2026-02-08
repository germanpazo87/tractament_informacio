const headerHTML = `
<header>
    <div class="header-titles">
        <div class="breadcrumb">${breadcrumbHTML}</div>
        <h1>${title}</h1>
    </div>

    <a
        href="https://germanpazo87.github.io/"
        style="
            color: var(--neon-blue);
            border: 1px solid;
            padding: 5px 10px;
            text-decoration: none;
            font-family: Orbitron;
            font-size: 0.7rem;
        "
    >
        TORNAR AL CORE
    </a>
</header>
`;

const footerHTML = `
<footer>
    <div style="margin-bottom: 10px; opacity: 0.6;">
        <img
            src="https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/cc-zero.svg"
            alt="CC0"
            style="width: 70px; filter: grayscale(1) brightness(1.5);"
        >
    </div>

    <div
        style="
            font-size: 0.75rem;
            color: #94a3b8;
            line-height: 1.6;
        "
    >
        Recurs educatiu creat per Germán Pazo sota llicència CC0 (Domini Públic).
        <br>
        <span
            style="
                color: rgba(0, 255, 249, 0.3);
                font-size: 0.65rem;
                letter-spacing: 1px;
            "
        >
            PROJECTE: LA MATRIU // 2026
        </span>
    </div>
</footer>
`;

container.insertAdjacentHTML('afterbegin', headerHTML);
container.insertAdjacentHTML('beforeend', footerHTML);
