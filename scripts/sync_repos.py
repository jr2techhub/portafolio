#!/usr/bin/env python3
"""
Sincronizador de proyectos del portafolio con la API REST de GitHub.

Fuente de verdad: los repositorios públicos del usuario (owner), excluyendo
forks y repositorios vacíos/archivados. Por cada repo detectado se crea o
actualiza una entrada en data/projects.json preservando los campos editoriales
(descripción larga, tecnologías, categoría, destacado, demo) que el autor
haya definido manualmente.

Uso:
    GITHUB_TOKEN=ghp_xxx python3 scripts/sync_repos.py            # sincronizar
    GITHUB_TOKEN=ghp_xxx python3 scripts/sync_repos.py --dry-run  # solo informar

Sin token, usa GITHUB_TOKEN o el header anónimo (límite 60 req/h).
"""

import argparse
import json
import os
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ARCHIVO_DATOS = RAIZ / "data" / "projects.json"

API = "https://api.github.com"


def api_get(url, token):
    req = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github+json",
        "User-Agent": "portafolio-sync",
        "X-GitHub-Api-Version": "2022-11-28",
    })
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def obtener_repos(token, usuario):
    """Devuelve los repos propios (no fork, no archived) ordenados por actividad."""
    repos, pagina = [], 1
    while True:
        lote = api_get(
            f"{API}/users/{usuario}/repos"
            f"?per_page=100&page={pagina}&sort=pushed&affiliation=owner",
            token,
        )
        if not lote:
            break
        repos.extend(lote)
        if len(lote) < 100:
            break
        pagina += 1
    return [
        r for r in repos
        if not r.get("fork") and not r.get("archived") and r.get("size", 0) > 1
    ]


def fecha_iso(iso):
    return (iso or "")[:10]


def sincronizar(dry_run=False):
    datos = json.loads(ARCHIVO_DATOS.read_text(encoding="utf-8"))
    perfil = datos.setdefault("perfil", {})
    usuario = perfil.get("usuario_github") or ""
    if not usuario:
        print("ERROR: falta perfil.usuario_github en data/projects.json", file=sys.stderr)
        return 1

    token = os.environ.get("GITHUB_TOKEN", "").strip()
    repos = obtener_repos(token, usuario)
    existentes = {p["repo"].lower(): p for p in datos.get("proyectos", [])}
    nuevos, actualizados = [], []

    for r in repos:
        clave = r["full_name"].lower()
        if clave == f"{usuario.lower()}/portafolio".lower():
            continue  # este repo es el propio sitio, no un proyecto mostrado
        info = {
            "nombre": r["name"],
            "url": r["html_url"],
            "lenguaje": r.get("language"),
            "pushed": fecha_iso(r.get("pushed_at")),
            "github_desc": (r.get("description") or "").strip(),
            "homepage": (r.get("homepage") or "").strip(),
        }
        if clave in existentes:
            p = existentes[clave]
            # Solo refrescar metadatos técnicos; lo editorial se respeta.
            cambios = []
            if p.get("nombre") != info["nombre"]:
                p["nombre"] = info["nombre"]; cambios.append("nombre")
            if p.get("url") != info["url"]:
                p["url"] = info["url"]; cambios.append("url")
            if info["pushed"] and p.get("fecha") != info["pushed"]:
                p["fecha"] = info["pushed"]; cambios.append("fecha")
            if info["homepage"] and not p.get("demo"):
                p["demo"] = info["homepage"]; cambios.append("demo")
            if cambios:
                actualizados.append((r["name"], cambios))
        else:
            techs = [t for t in [info["lenguaje"]] if t]
            desc = info["github_desc"] or f"Repositorio {r['name']} ({info['lenguaje'] or 'sin lenguaje detectado'})."
            datos["proyectos"].append({
                "id": r["name"].lower().replace("_", "-"),
                "nombre": info["nombre"],
                "descripcion": desc,
                "repo": r["full_name"],
                "url": info["url"],
                "demo": info["homepage"] or None,
                "tecnologias": techs,
                "categoria": "otros",
                "destacado": False,
                "fecha": info["pushed"] or None,
                "sugerido": True,  # marcado para revisión editorial
            })
            nuevos.append(r["name"])

    # Detectar repos eliminados (solo informar, nunca borrar automáticamente).
    # El index del API puede omitir repos recién creados; se confirma cada
    # candidato uno por uno antes de reportarlo como desaparecido.
    nombres_remotos = {r["full_name"].lower() for r in repos} | {f"{usuario.lower()}/portafolio"}
    candidatos = [k for k in existentes if k not in nombres_remotos]
    huerfanos = []
    for clave in candidatos:
        try:
            api_get(f"{API}/repos/{clave}", token)  # responde 200 si sigue existiendo
        except Exception:
            huerfanos.append(clave)

    if dry_run:
        print(f"[dry-run] nuevos: {nuevos or '-'} | actualizados: "
              f"{[n for n, _ in actualizados] or '-'} | desaparecidos: {huerfanos or '-'}")
        return 0

    if nuevos or actualizados:
        ARCHIVO_DATOS.write_text(
            json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    print(f"Sincronización completa: {len(nuevos)} nuevos, {len(actualizados)} actualizados.")
    if huerfanos:
        print(f"AVISO: entradas cuyo ya no existe en GitHub (revisar manualmente): {huerfanos}")
    # Salida legible para el paso "summary" del workflow
    resumen = os.environ.get("GITHUB_STEP_SUMMARY")
    if resumen:
        with open(resumen, "a", encoding="utf-8") as f:
            f.write("### Sincronización de repositorios\n")
            f.write(f"- Nuevos proyectos: {', '.join(nuevos) or '—'}\n")
            f.write(f"- Actualizados: {', '.join(n for n, _ in actualizados) or '—'}\n")
            f.write(f"- Repos desaparecidos: {', '.join(huerfanos) or '—'}\n")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    sys.exit(sincronizar(dry_run=args.dry_run))
