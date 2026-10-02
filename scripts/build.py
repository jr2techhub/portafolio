#!/usr/bin/env python3
"""
Generador estático del portafolio (production ready).

Lee data/projects.json y produce el sitio en _site/:
  - index.html generado desde templates/base.html
  - assets CSS/JS con hash de contenido (cache-busting)
  - og:image, favicon SVG, manifest y .nojekyll

No depende de paquetes externos: ejecutable localmente y en GitHub Actions.

Uso:
    python3 scripts/build.py            # construye en ./_site
"""

import hashlib
import json
import re
import shutil
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITE = RAIZ / "_site"

CATEGORIAS = {
    "web": "Web",
    "frontend": "Frontend",
    "backend": "Backend",
    "datos": "Datos & Scraping",
    "integraciones": "Integraciones",
    "mobile": "Móvil",
    "ia": "IA / ML",
    "devops": "DevOps",
    "otros": "Otros",
}

# Color por lenguaje para el acento visual de cada tarjeta
COLORES_LANG = {
    "C#": "#178600", "Java": "#b07219", "JavaScript": "#f1e05a",
    "TypeScript": "#3178c6", "Python": "#3572A5", "HTML": "#e34c26",
    "CSS": "#563d7c", "Go": "#00ADD8", "PHP": "#4F5D95",
}


def e(texto):
    return (
        str(texto)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def slug(texto):
    s = re.sub(r"[^a-z0-9]+", "-", str(texto).lower()).strip("-")
    return s or "proyecto"


def leer_datos():
    return json.loads((RAIZ / "data" / "projects.json").read_text(encoding="utf-8"))


def cargar_plantilla(nombre):
    return (RAIZ / "templates" / nombre).read_text(encoding="utf-8")


def color_proyecto(p):
    for t in p.get("tecnologias", []):
        if t in COLORES_LANG:
            return COLORES_LANG[t]
    return "#6366f1"


# Paleta por categoría para las imágenes alegóricas del slider
PALETAS_CATEGORIA = {
    "web": ("#0c4a6e", "#38bdf8"),
    "frontend": ("#4c1d95", "#a78bfa"),
    "backend": ("#14532d", "#4ade80"),
    "datos": ("#78350f", "#fbbf24"),
    "integraciones": ("#831843", "#f472b6"),
    "mobile": ("#1e3a8a", "#60a5fa"),
    "ia": ("#581c87", "#e879f9"),
    "devops": ("#134e4a", "#2dd4bf"),
    "otros": ("#1e293b", "#94a3b8"),
}

# Glifos alegóricos por lenguaje/tecnología (viewBox 24x24, trazos simples)
GLIFOS_TECH = {
    "database": '<ellipse cx="12" cy="5.5" rx="7" ry="2.6" fill="none" stroke="{c}" stroke-width="1.4"/><path d="M5 5.5v13c0 1.5 3.1 2.6 7 2.6s7-1.1 7-2.6v-13M5 12c0 1.5 3.1 2.6 7 2.6s7-1.1 7-2.6" fill="none" stroke="{c}" stroke-width="1.4"/>',
    "code": '<path d="M8.5 7.5 4 12l4.5 4.5M15.5 7.5 20 12l-4.5 4.5M13.6 5.4l-3.2 13.2" fill="none" stroke="{c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    "server": '<rect x="3.5" y="4.5" width="17" height="6.5" rx="1.6" fill="none" stroke="{c}" stroke-width="1.4"/><rect x="3.5" y="13" width="17" height="6.5" rx="1.6" fill="none" stroke="{c}" stroke-width="1.4"/><circle cx="7" cy="7.8" r=".9" fill="{c}"/><circle cx="7" cy="16.3" r=".9" fill="{c}"/><path d="M11 7.8h6M11 16.3h6" stroke="{c}" stroke-width="1.1" stroke-linecap="round"/>',
    "cloud": '<path d="M7 18a4.2 4.2 0 1 1 .6-8.4A5.6 5.6 0 0 1 18 10.4 3.8 3.8 0 0 1 17.4 18Z" fill="none" stroke="{c}" stroke-width="1.4" stroke-linejoin="round"/>',
    "graph": '<path d="M4 19V5M4 19h16" stroke="{c}" stroke-width="1.4" stroke-linecap="round"/><path d="M7 15.5 11 10l3 3 4.5-6.5" fill="none" stroke="{c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    "link": '<path d="M10 14a4.6 4.6 0 0 0 6.6 0l2.8-2.8a4.7 4.7 0 0 0-6.6-6.6L11.4 6M14 10a4.6 4.6 0 0 0-6.6 0L4.6 12.8a4.7 4.7 0 0 0 6.6 6.6L13 17.6" fill="none" stroke="{c}" stroke-width="1.5" stroke-linecap="round"/>',
    "cpu": '<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="none" stroke="{c}" stroke-width="1.4"/><rect x="10" y="10" width="4" height="4" rx="1" fill="{c}"/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3" stroke="{c}" stroke-width="1.3" stroke-linecap="round"/>',
    "lock": '<rect x="5.5" y="10.5" width="13" height="9" rx="2" fill="none" stroke="{c}" stroke-width="1.4"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="{c}" stroke-width="1.4"/><circle cx="12" cy="15" r="1.5" fill="{c}"/>',
    "globe": '<circle cx="12" cy="12" r="8" fill="none" stroke="{c}" stroke-width="1.4"/><path d="M4 12h16M12 4c2.4 2.2 3.6 4.9 3.6 8s-1.2 5.8-3.6 8c-2.4-2.2-3.6-4.9-3.6-8S9.6 6.2 12 4z" fill="none" stroke="{c}" stroke-width="1.2"/>',
    "gear": '<circle cx="12" cy="12" r="3.1" fill="none" stroke="{c}" stroke-width="1.5"/><path d="M12 3v2.8M12 18.2V21M3 12h2.8M18.2 12H21M5.6 5.6l2 2M16.4 16.4l2 2M18.4 5.6l-2 2M7.6 16.4l-2 2" stroke="{c}" stroke-width="1.5" stroke-linecap="round"/>',
    "spider": '<circle cx="12" cy="12" r="2.2" fill="{c}"/><path d="M12 3.5v6.3M12 14.2v6.3M3.5 12h6.3M14.2 12h6.3M6 6l4.4 4.4M13.6 13.6 18 18M18 6l-4.4 4.4M10.4 13.6 6 18" stroke="{c}" stroke-width="1.3" stroke-linecap="round"/>',
    "page": '<path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 7 20Z" fill="none" stroke="{c}" stroke-width="1.4"/><path d="M14 3.5V8h4.3M9.5 12.5h6M9.5 16h6" fill="none" stroke="{c}" stroke-width="1.2" stroke-linecap="round"/>',
    "atom": '<circle cx="12" cy="12" r="1.8" fill="{c}"/><ellipse cx="12" cy="12" rx="9" ry="3.8" fill="none" stroke="{c}" stroke-width="1.2"/><ellipse cx="12" cy="12" rx="9" ry="3.8" fill="none" stroke="{c}" stroke-width="1.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.8" fill="none" stroke="{c}" stroke-width="1.2" transform="rotate(120 12 12)"/>',
    "star": '<path d="m12 3.6 2.5 5.3 5.8.7-4.3 4 1.2 5.8L12 16.6l-5.2 2.8L8 13.6l-4.3-4 5.8-.7Z" fill="none" stroke="{c}" stroke-width="1.4" stroke-linejoin="round"/>',
    "layers": '<path d="m12 3.5 8.5 4.3L12 12.1 3.5 7.8Z" fill="none" stroke="{c}" stroke-width="1.4" stroke-linejoin="round"/><path d="m3.5 12.4 8.5 4.3 8.5-4.3M3.5 16.6l8.5 4.3 8.5-4.3" fill="none" stroke="{c}" stroke-width="1.4" stroke-linejoin="round"/>',
    "rocket": '<path d="M12 2.8c3.2 2.4 4.8 5.6 4.8 9.2 0 1.6-.4 3.2-1.2 4.6H8.4c-.8-1.4-1.2-3-1.2-4.6 0-3.6 1.6-6.8 4.8-9.2Z" fill="none" stroke="{c}" stroke-width="1.4"/><circle cx="12" cy="9.5" r="1.8" fill="none" stroke="{c}" stroke-width="1.3"/><path d="M8.4 16.6 6 21l3.6-1.6M15.6 16.6 18 21l-3.6-1.6" fill="none" stroke="{c}" stroke-width="1.3" stroke-linejoin="round"/>',
}

_CLAVE_GIFO = [
    (("postgres", "pgsql", "sql", "database", "db", "ef core"), "database"),
    (("scraping", "scraper", "spider", "crawl"), "spider"),
    (("react", "blazor", "vue", "angular", "wasm", "frontend", "scss", "html", "css"), "code"),
    (("oauth", "openid", "sso", "pkce", "openiddict", "auth", "seguridad", "stripe", "pago"), "lock"),
    (("spring", "java", ".net", "backend", "microservicio", "api rest", "node"), "server"),
    (("docker", "kubernetes", "k8s", "aws", "azure", "gcp", "cloud"), "cloud"),
    (("action", "workflow", "jenkins", "devops", "ci/cd", "deploy", "pages"), "gear"),
    (("gemini", "ia ", " ia", "inteligencia", "ml", "gpt", "openai"), "atom"),
    (("netsuite", "everstox", "deliverr", "erp", "integracion", "dlq", "cola"), "link"),
    (("recharts", "datos", "analitica", "analítica", "pattern engine", "json"), "graph"),
    (("python",), "rocket"),
    (("landing", "marketing"), "globe"),
    (("typescript", "javascript"), "layers"),
]


def glifo_proyecto(p):
    """Elige el glifo alegórico según tecnologías/categoría del proyecto."""
    texto = " ".join(
        [t.lower() for t in p.get("tecnologias", [])]
        + [p.get("categoria", "").lower(), p.get("nombre", "").lower()]
    )
    for claves, glifo in _CLAVE_GIFO:
        if any(k in texto for k in claves):
            return glifo
    return "star"


def imagen_slide(p):
    """Estilo premium y editorial para la imagen del slider."""
    cat = p.get("categoria", "otros")
    oscuro, vivo = PALETAS_CATEGORIA.get(cat, PALETAS_CATEGORIA["otros"])
    nombre = re.sub(r"\s*\(.*?\)\s*", "", str(p.get("nombre", ""))).strip()
    titulo = nombre[:22]
    if len(nombre) > 22:
        titulo = nombre[:21] + "…"
    glifo = glifo_proyecto(p)
    icon = GLIFOS_TECH.get(glifo, GLIFOS_TECH["star"]).format(c=vivo)
    svg = f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 560' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='{oscuro}'/>
      <stop offset='0.5' stop-color='#09111d'/>
      <stop offset='1' stop-color='#05070d'/>
    </linearGradient>
    <linearGradient id='pulse' x1='0' y1='0' x2='1' y2='0'>
      <stop offset='0' stop-color='{vivo}' stop-opacity='0.8'/>
      <stop offset='1' stop-color='{vivo}' stop-opacity='0.12'/>
    </linearGradient>
    <filter id='soft-glow'><feGaussianBlur stdDeviation='14' result='blur'/><feMerge><feMergeNode in='blur'/><feMergeNode in='SourceGraphic'/></feMerge></filter>
  </defs>
  <rect width='900' height='560' fill='url(#bg)'/>
  <circle cx='710' cy='110' r='210' fill='{vivo}' opacity='0.08'/>
  <circle cx='250' cy='460' r='180' fill='{vivo}' opacity='0.06'/>
  <path d='M0 440 C 180 360, 300 450, 440 410 S 720 300, 900 380 L900 560 L0 560 Z' fill='rgba(255,255,255,0.03)'/>
  <g opacity='0.2'>
    <path d='M40 100 H860' stroke='rgba(255,255,255,0.08)'/>
    <path d='M40 180 H860' stroke='rgba(255,255,255,0.08)'/>
    <path d='M40 260 H860' stroke='rgba(255,255,255,0.08)'/>
    <path d='M40 340 H860' stroke='rgba(255,255,255,0.08)'/>
    <path d='M40 420 H860' stroke='rgba(255,255,255,0.08)'/>
  </g>
  <g transform='translate(455 90)'>
    <rect x='0' y='0' width='340' height='220' rx='22' fill='rgba(12,18,29,0.8)' stroke='rgba(255,255,255,0.09)'/>
    <rect x='20' y='22' width='92' height='12' rx='6' fill='rgba(255,255,255,0.13)'/>
    <rect x='20' y='46' width='140' height='10' rx='5' fill='rgba(255,255,255,0.08)'/>
    <rect x='20' y='72' width='300' height='118' rx='16' fill='rgba(255,255,255,0.03)' stroke='rgba(255,255,255,0.07)'/>
    <rect x='38' y='96' width='102' height='58' rx='12' fill='rgba(255,255,255,0.07)'/>
    <rect x='158' y='96' width='62' height='58' rx='12' fill='rgba(255,255,255,0.07)'/>
    <rect x='238' y='96' width='54' height='58' rx='12' fill='rgba(255,255,255,0.07)'/>
    <path d='M38 160 L75 142 L108 151 L150 121 L186 135 L236 103 L296 140' fill='none' stroke='{vivo}' stroke-width='4' stroke-linecap='round' stroke-linejoin='round' />
    <circle cx='75' cy='142' r='5' fill='{vivo}'/>
    <circle cx='186' cy='135' r='5' fill='{vivo}'/>
    <circle cx='296' cy='140' r='5' fill='{vivo}'/>
    <rect x='22' y='198' width='96' height='8' rx='4' fill='rgba(255,255,255,0.12)'/>
    <rect x='128' y='198' width='58' height='8' rx='4' fill='rgba(255,255,255,0.08)'/>
  </g>
  <g transform='translate(100 165)'>
    <rect x='0' y='0' width='260' height='200' rx='20' fill='rgba(8,15,23,0.42)' stroke='rgba(255,255,255,0.08)'/>
    <rect x='20' y='20' width='150' height='14' rx='7' fill='rgba(255,255,255,0.12)'/>
    <text x='20' y='72' font-family='Arial, Helvetica, sans-serif' font-size='26' font-weight='700' fill='white'>{titulo}</text>
    <g transform='translate(20 96)'>
      <g><rect x='150' y='40' width='62' height='16' rx='8' fill='rgba(255,255,255,0.08)' /><text x='162' y='52' font-family='Arial, Helvetica, sans-serif' font-size='8' fill='rgba(255,255,255,0.8)'>{str((p.get("tecnologias") or [""])[0])[:10]}</text></g>
    </g>
    <rect x='20' y='136' width='168' height='10' rx='5' fill='rgba(255,255,255,0.09)'/>
    <rect x='20' y='154' width='140' height='10' rx='5' fill='rgba(255,255,255,0.06)'/>
    <g transform='translate(190 40)' filter='url(#soft-glow)'>
      <rect x='0' y='0' width='42' height='42' rx='12' fill='rgba(255,255,255,0.04)' stroke='rgba(255,255,255,0.12)'/>
      <g transform='translate(11 11) scale(1.2)'>{icon}</g>
    </g>
  </g>
  <g transform='translate(520 350)'>
    <rect x='0' y='0' width='220' height='124' rx='18' fill='rgba(7,11,18,0.8)' stroke='rgba(255,255,255,0.08)'/>
    <rect x='18' y='20' width='118' height='10' rx='5' fill='rgba(255,255,255,0.12)'/>
    <rect x='18' y='42' width='78' height='8' rx='4' fill='rgba(255,255,255,0.08)'/>
    <rect x='18' y='72' width='184' height='26' rx='13' fill='url(#pulse)' opacity='0.9'/>
    <circle cx='164' cy='86' r='16' fill='{vivo}' opacity='0.18'/>
    <circle cx='164' cy='86' r='9' fill='{vivo}'/>
  </g>
</svg>"""
    replacements = {"&": chr(37) + "26", "<": chr(37) + "3C", ">": chr(37) + "3E", '"': chr(37) + "22", "'": chr(37) + "27", "#": chr(37) + "23"}
    for ch, repl in replacements.items():
        svg = svg.replace(ch, repl)
    return "data:image/svg+xml," + svg
def formatear_fecha(iso):
    try:
        y, m, d = iso.split("-")
        meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
        return f"{int(d)} {meses[int(m)-1]} {y}"
    except Exception:
        return ""


def tarjeta_proyecto(p):
    tags = "".join(f'<span class="tag">{e(t)}</span>' for t in p.get("tecnologias", []))
    destacado = '<span class="badge-destacado">★ Destacado</span>' if p.get("destacado") else ""
    enlaces = []
    if p.get("demo"):
        enlaces.append(
            f'<a class="btn btn-demo" href="{e(p["demo"])}" target="_blank" rel="noopener" '
            f'aria-label="Ver demo de {e(p["nombre"])}">Demo ↗</a>'
        )
    if p.get("url"):
        enlaces.append(
            f'<a class="btn btn-codigo" href="{e(p["url"])}" target="_blank" rel="noopener" '
            f'aria-label="Ver código de {e(p["nombre"])}">'
            f'<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.62-.01 1.05.58 1.2.82.72 1.2 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>'
            f" Código</a>"
        )
    categoria = CATEGORIAS.get(p.get("categoria", "otros"), "Otros")
    fecha = formatear_fecha(p.get("fecha") or "")
    lang = (p.get("tecnologias") or [None])[0]
    anio = (p.get("fecha") or "")[:4]
    meta_partes = [x for x in [categoria, anio] if x]
    return f"""        <article class="card{' card-destacada' if p.get('destacado') else ''}"
                 data-project-id="{e(p.get('id', ''))}"
                 data-categoria="{e(p.get('categoria', 'otros'))}"
                 style="--acento:{color_proyecto(p)}">
          <div class="card-top">
            <span class="cat-pill">{e(categoria)}</span>
            {destacado}
          </div>
          <h3>{e(p['nombre'])}</h3>
          <p class="desc">{e(p.get('descripcion', ''))}</p>
          <div class="tags" role="list" aria-label="Tecnologías">{tags}</div>
          <footer class="card-footer">
            <time class="meta" datetime="{e(p.get('fecha') or '')}">{e(fecha)}</time>
            <div class="actions">{''.join(enlaces)}</div>
          </footer>
        </article>"""


ICONOS_CATEGORIA = {
    "web": '<path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM2 8h12M8 2c2 1.8 3 3.8 3 6s-1 4.2-3 6c-2-1.8-3-3.8-3-6s1-4.2 3-6z" fill="none" stroke="currentColor" stroke-width="1.2"/>',
    "frontend": '<path d="M5.5 5 2 8l3.5 3M10.5 5 14 8l-3.5 3M9 4 7 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
    "backend": '<rect x="3" y="3" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 6.5h4M6 9.5h2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
    "datos": '<ellipse cx="8" cy="4.5" rx="4.5" ry="1.8" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 4.5v7c0 1 2 1.8 4.5 1.8s4.5-.8 4.5-1.8v-7M3.5 8c0 1 2 1.8 4.5 1.8s4.5-.8 4.5-1.8" fill="none" stroke="currentColor" stroke-width="1.2"/>',
    "integraciones": '<path d="M6 10 4.2 11.8a2.5 2.5 0 0 1-3.5-3.5L4 5 2.8 3.8 5.8 3l2 2-1.5 1.5M10 6l1.8-1.8a2.5 2.5 0 0 1 3.5 3.5L12 11l1.2 1.2-3 .8-2-2 1.5-1.5" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>',
    "mobile": '<rect x="5" y="2" width="6" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="11.8" r=".7" fill="currentColor"/>',
    "ia": '<circle cx="4" cy="4" r="1.4" fill="currentColor"/><circle cx="12" cy="4" r="1.4" fill="currentColor"/><circle cx="8" cy="11" r="1.6" fill="currentColor"/><path d="M5 5l2.4 4.5M11 5 8.6 9.5M5.4 4h5.2" stroke="currentColor" stroke-width="1.1"/>',
    "devops": '<circle cx="8" cy="8" r="2.4" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 2.5v1.6M8 11.9v1.6M2.5 8h1.6M11.9 8h1.6M4.1 4.1l1.1 1.1M10.8 10.8l1.1 1.1M11.9 4.1l-1.1 1.1M5.2 10.8l-1.1 1.1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>',
    "otros": '<rect x="2.5" y="2.5" width="11" height="11" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 8h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
}


def slide_proyecto(p, i):
    categoria = p.get("categoria", "otros")
    icono = ICONOS_CATEGORIA.get(categoria, ICONOS_CATEGORIA["otros"])
    tags = "".join(f'<span class="slide-tag">{e(t)}</span>' for t in (p.get("tecnologias") or [])[:3])
    desc = e((p.get("descripcion") or "").strip())
    if len(desc) > 150:
        desc = desc[:150].rsplit(" ", 1)[0] + "…"
    fondo = imagen_slide(p)
    return f"""          <div class="slide{' activo' if i == 0 else ''}" data-project-id="{e(p.get('id', ''))}" role="group" aria-roledescription="diapositiva" aria-label="{i + 1} de {{TOTAL}}: {e(p['nombre'])}" style="--acento:{color_proyecto(p)}; --fondo-slide:url('{fondo}')">
            <div class="slide-fondo" aria-hidden="true"></div>
            <div class="slide-capa">
              <div class="slide-icono"><svg viewBox="0 0 16 16" width="26" height="26" aria-hidden="true">{icono}</svg></div>
              <h3 class="slide-nombre">{e(p['nombre'])}</h3>
              <p class="slide-desc">{desc}</p>
              <div class="slide-tags">{tags}</div>
              <a class="slide-enlace" href="{e(p.get('url') or '#proyectos')}" target="_blank" rel="noopener">Ver en GitHub →</a>
            </div>
          </div>"""


def construir():
    datos = leer_datos()
    perfil = datos.get("perfil", {})
    proyectos = sorted(
        datos.get("proyectos", []),
        key=lambda p: (not p.get("destacado"), p.get("fecha", ""), ),
        reverse=False,
    )
    # destacados primero, luego más recientes
    proyectos = sorted(proyectos, key=lambda p: (not p.get("destacado"),
                                                 not p.get("fecha")), )

    tarjetas = "\n".join(tarjeta_proyecto(p) for p in proyectos)

    # Slider alegórico: destacados primero, luego más recientes (máx. 6)
    orden_slider = sorted(proyectos, key=lambda p: (not p.get("destacado"),), reverse=False)
    slides_proyectos = orden_slider[:6]
    slides = "\n".join(slide_proyecto(p, i).replace("{TOTAL}", str(len(slides_proyectos)))
                       for i, p in enumerate(slides_proyectos)) if slides_proyectos else ""

    cats_presentes = [c for c in CATEGORIAS if any(p.get("categoria", "otros") == c for p in proyectos)]
    botones = '<button class="filtro activo" data-filtro="todas" aria-pressed="true">Todas</button>' + "".join(
        f'<button class="filtro" data-filtro="{e(c)}" aria-pressed="false">{e(CATEGORIAS[c])}</button>'
        for c in cats_presentes
    )

    # Datos embebidos para la ficha de detalle (escapados para <script>)
    datos_json = json.dumps(proyectos, ensure_ascii=False).replace("</", "<\\/")

    nombre = perfil.get("nombre", "Portafolio")
    descripcion = perfil.get("descripcion", "")
    custom_domain = str(perfil.get("custom_domain", "") or "").strip()
    if custom_domain:
        url_base = f"https://{custom_domain}/"
    else:
        url_base = f"https://{perfil.get('usuario_github', '')}.github.io/portafolio/"

    # --- Assets con hash de contenido ---
    SITE.mkdir(parents=True, exist_ok=True)
    refs = {}
    estaticos = RAIZ / "static"
    for archivo in sorted(estaticos.rglob("*")):
        if not archivo.is_file():
            continue
        contenido = archivo.read_bytes()
        h = hashlib.sha256(contenido).hexdigest()[:10]
        destino = SITE / f"{archivo.stem}.{h}{archivo.suffix}"
        destino.write_bytes(contenido)
        refs[archivo.name] = destino.name

    favicon = (RAIZ / "static" / "favicon.svg")
    if favicon.exists():
        shutil.copy2(favicon, SITE / "favicon.svg")
        refs.setdefault("favicon.svg", "favicon.svg")

    pagina = (
        cargar_plantilla("base.html")
        .replace("{{TITULO}}", e(nombre))
        .replace("{{DESCRIPCION}}", e(descripcion))
        .replace("{{NOMBRE}}", e(nombre))
        .replace("{{TITULO_PROFESIONAL}}", e(perfil.get("titulo", "")))
        .replace("{{USUARIO_GITHUB}}", e(perfil.get("usuario_github", "")))
        .replace("{{EMAIL}}", e(perfil.get("email", "")))
        .replace("{{RESUMEN}}", e(descripcion))
        .replace("{{URL_BASE}}", e(url_base))
        .replace("{{AVATAR}}", e(f"https://github.com/{perfil.get('usuario_github','')}.png?size=200"))
        .replace("{{CATEGORIAS}}", botones)
        .replace("{{TARJETAS}}", tarjetas)
        .replace("{{SLIDES}}", slides)
        .replace("{{ANIO}}", str(date.today().year))
        .replace("{{CANTIDAD}}", str(len(proyectos)))
        .replace("{{CSS_URL}}", e(refs.get("styles.css", "styles.css")))
        .replace("{{JS_URL}}", e(refs.get("app.js", "app.js")))
        .replace("{{FAVICON}}", e(refs.get("favicon.svg", "favicon.svg")))
    )
    pagina = pagina.replace("{{DATOS_JSON}}", datos_json)
    (SITE / "index.html").write_text(pagina, encoding="utf-8")
    (SITE / ".nojekyll").write_text("", encoding="utf-8")

    custom_domain_file = RAIZ / "CNAME"
    if custom_domain_file.exists():
        shutil.copy2(custom_domain_file, SITE / "CNAME")

    # sitemap sencillo
    sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"  <url><loc>{url_base}</loc></url>\n</urlset>\n"
    )
    (SITE / "sitemap.xml").write_text(sitemap, encoding="utf-8")

    print(f"Sitio generado en {SITE} ({len(proyectos)} proyectos)")


if __name__ == "__main__":
    construir()
