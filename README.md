# Portafolio

Portafolio de proyectos publicado automáticamente en **GitHub Pages** mediante un workflow de **GitHub Actions**.

## Estructura

```
data/projects.json      ← Aquí agregas tus proyectos (única fuente de datos)
templates/base.html     ← Plantilla HTML del sitio
static/styles.css       ← Estilos
static/app.js           ← Filtro por categorías
scripts/build.py        ← Generador estático (sin dependencias externas)
.github/workflows/deploy.yml ← CI/CD: construye y publica en GitHub Pages
_site/                  ← Salida generada (ignorada por git)
```

## Cómo agregar un nuevo proyecto

1. Edita `data/projects.json` y añade una entrada al array `proyectos`:

```json
{
  "id": "mi-proyecto",
  "nombre": "Mi Proyecto",
  "descripcion": "Qué hace y por qué es interesante.",
  "url": "https://github.com/tu-usuario/mi-proyecto",
  "demo": "https://tu-usuario.github.io/mi-proyecto/",
  "tecnologias": ["Python", "Flask"],
  "categoria": "web",
  "destacado": false,
  "fecha": "2026-09-26"
}
```

Categorías disponibles: `web`, `datos`, `mobile`, `ia`, `devops`, `otros`.

2. Haz push a la rama `main`. El workflow se dispara solo, valida el JSON,
   genera `_site/` y lo publica en GitHub Pages.

## Construir localmente

```bash
python3 scripts/build.py
# abre _site/index.html en el navegador
```

## Configuración inicial en GitHub (una sola vez)

1. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
2. Reemplaza los valores de ejemplo (`tu-usuario`, `Tu Nombre`, etc.) en
   `data/projects.json` dentro del objeto `perfil`.
3. La URL publicada será: `https://<tu-usuario>.github.io/portafolio/`

El workflow también puede ejecutarse manualmente desde
**Actions → Publicar portafolio en GitHub Pages → Run workflow**.
