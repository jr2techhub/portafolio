#!/usr/bin/env python3
"""
Generador estático del portafolio.

Lee data/projects.json y produce el sitio estático en _site/ usando
la plantilla de templates/. No depende de paquetes externos, por lo
que puede ejecutarse tanto localmente como en GitHub Actions.

Uso:
    python3 scripts/build.py            # construye en ./_site
"""

import json
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITE = RAIZ / "_site"

CATEGORIAS = {
    "web": "Web",
    "datos": "Datos",
    "mobile": "Móvil",
    "ia": "IA / ML",
    "devops": "DevOps",
    "otros": "Otros",
}


def leer_datos():
    with open(RAIZ / "data" / "projects.json", encoding="utf-8") as f:
        return json.load(f)


def cargar_plantilla(nombre):
    with open(RAIZ / "templates" / nombre, encoding="utf-8") as f:
        return f.read()


def e(texto):
    """Escapa HTML básico."""
    return (
        str(texto)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def tarjeta_proyecto(p):
    tags = " ".join(f'<span class="tag">{e(t)}</span>' for t in p.get("tecnologias", []))
    destacado = '<span class="destacado-badge">★ Destacado</span>' if p.get("destacado") else ""
    enlaces = []
    if p.get("url"):
        enlaces.append(
            f'<a class="btn" href="{e(p["url"])}" target="_blank" rel="noopener">Código</a>'
        )
    if p.get("demo"):
        enlaces.append(
            f'<a class="btn btn-demo" href="{e(p["demo"])}" target="_blank" rel="noopener">Demo</a>'
        )
    categoria = CATEGORIAS.get(p.get("categoria", "otros"), "Otros")
    fecha = p.get("fecha", "")
    meta = e(categoria) + (" · " + e(fecha) if fecha else "")
    return f"""        <article class="card" data-categoria="{e(p.get('categoria', 'otros'))}">
          <div class="card-header">
            <h3>{e(p['nombre'])}</h3>
            {destacado}
          </div>
          <p class="desc">{e(p.get('descripcion', ''))}</p>
          <div class="tags">{tags}</div>
          <footer class="card-footer">
            <span class="meta">{meta}</span>
            <div class="actions">{' '.join(enlaces)}</div>
          </footer>
        </article>"""


def construir():
    datos = leer_datos()
    perfil = datos.get("perfil", {})
    proyectos = sorted(
        datos.get("proyectos", []),
        key=lambda p: (not p.get("destacado"), p.get("fecha", "")),
    )

    tarjetas = "\n".join(tarjeta_proyecto(p) for p in proyectos)

    cats_presentes = sorted({p.get("categoria", "otros") for p in proyectos})
    botones = '<button class="filtro activo" data-filtro="todas">Todas</button>' + "".join(
        f'<button class="filtro" data-filtro="{e(c)}">{e(CATEGORIAS.get(c, c))}</button>'
        for c in cats_presentes
    )

    pagina = (
        cargar_plantilla("base.html")
        .replace("{{TITULO}}", e(perfil.get("nombre", "Portafolio")))
        .replace("{{DESCRIPCION}}", e(perfil.get("descripcion", "")))
        .replace("{{NOMBRE}}", e(perfil.get("nombre", "Portafolio")))
        .replace("{{USUARIO_GITHUB}}", e(perfil.get("usuario_github", "")))
        .replace("{{EMAIL}}", e(perfil.get("email", "")))
        .replace("{{RESUMEN}}", e(perfil.get("descripcion", "")))
        .replace("{{CATEGORIAS}}", botones)
        .replace("{{TARJETAS}}", tarjetas)
        .replace("{{ANIO}}", str(date.today().year))
        .replace("{{CANTIDAD}}", str(len(proyectos)))
    )

    SITE.mkdir(parents=True, exist_ok=True)
    (SITE / "index.html").write_text(pagina, encoding="utf-8")

    # Copiar assets estáticos (css/js) a _site/
    estaticos = RAIZ / "static"
    if estaticos.exists():
        for archivo in estaticos.rglob("*"):
            if archivo.is_file():
                destino = SITE / archivo.relative_to(estaticos)
                destino.parent.mkdir(parents=True, exist_ok=True)
                destino.write_bytes(archivo.read_bytes())

    print(f"Sito generado en {SITE} ({len(proyectos)} proyectos)")


if __name__ == "__main__":
    construir()
