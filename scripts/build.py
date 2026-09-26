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

    cats_presentes = [c for c in CATEGORIAS if any(p.get("categoria", "otros") == c for p in proyectos)]
    botones = '<button class="filtro activo" data-filtro="todas" aria-pressed="true">Todas</button>' + "".join(
        f'<button class="filtro" data-filtro="{e(c)}" aria-pressed="false">{e(CATEGORIAS[c])}</button>'
        for c in cats_presentes
    )

    nombre = perfil.get("nombre", "Portafolio")
    descripcion = perfil.get("descripcion", "")
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
        .replace("{{ANIO}}", str(date.today().year))
        .replace("{{CANTIDAD}}", str(len(proyectos)))
        .replace("{{CSS_URL}}", e(refs.get("styles.css", "styles.css")))
        .replace("{{JS_URL}}", e(refs.get("app.js", "app.js")))
        .replace("{{FAVICON}}", e(refs.get("favicon.svg", "favicon.svg")))
    )
    (SITE / "index.html").write_text(pagina, encoding="utf-8")
    (SITE / ".nojekyll").write_text("", encoding="utf-8")

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
