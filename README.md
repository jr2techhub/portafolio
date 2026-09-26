# 🌐 JR2 TechHub — Portafolio

Sitio de portafolio **production ready** publicado en GitHub Pages:
👉 **https://jr2techhub.github.io/portafolio/**

## Características

- ⚡ **Auto-sincronización con GitHub**: un workflow diario consulta la API REST y añade automáticamente cualquier repositorio nuevo (sin forks, sin archivados, sin vacíos). Los campos editoriales (descripción, tecnologías, categoría, destacado) se respetan; solo se refrescan metadatos técnicos.
- 🎨 Diseño oscuro moderno, responsive, con filtros por categoría, búsqueda instantánea (atajo `/`), badges de destacados y acento de color por lenguaje.
- 🔒 Production ready: assets con hash de contenido (cache-busting), HTML semántico y accesible (ARIA, skip-link, `prefers-reduced-motion`), metaetiquetas Open Graph/Twitter, sitemap, favicon SVG, `.nojekyll`.
- 🧱 Generador estático en Python puro (sin dependencias externas).

## Estructura

```
data/projects.json        ← única fuente de datos del sitio
scripts/build.py          ← genera _site/ (index + assets hasheados)
scripts/sync_repos.py     ← sincroniza proyectos con la API de GitHub
templates/base.html       ← plantilla del sitio
static/                   ← styles.css, app.js, favicon.svg
.github/workflows/deploy.yml ← CI/CD: sync + build + publish (rama gh-pages)
```

## Flujo de trabajo

| Acción | Resultado |
|---|---|
| Push a `master` (datos/plantilla/assets/scripts) | Build y publicación inmediata |
| Crear un repo nuevo en GitHub | Aparece solo en el siguiente cron diario (07:00 UTC) o al ejecutar "Run workflow" manualmente |
| Ejecución manual (Actions → Publicar portafolio → Run workflow) | Sync + build + publish bajo demanda |

### Personalizar un proyecto detectado automáticamente

Las entradas creadas por el sync llevan `"sugerido": true` y valores por defecto. Edita en `data/projects.json`: `descripcion`, `tecnologias`, `categoria` (`frontend`, `backend`, `datos`, `integraciones`, `web`, …), `destacado` y `demo`, y elimina el flag `sugerido`. Haz push a `master` y listo.

## Desarrollo local

```bash
python3 scripts/build.py        # genera ./_site
python3 -m http.server -d _site 8000   # previsualiza en http://localhost:8000
```

El workflow publica en la rama `gh-pages` mediante `JamesIves/github-pages-deploy-action`. **Nunca** abras PRs desde `gh-pages` hacia `master`: es una rama de artefactos generada automáticamente.
