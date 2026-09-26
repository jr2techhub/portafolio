// Portafolio — filtros por categoría + búsqueda (sin dependencias).
(() => {
  const botones = Array.from(document.querySelectorAll(".filtro"));
  const tarjetas = Array.from(document.querySelectorAll(".card"));
  const buscador = document.getElementById("buscador");
  const vacio = document.getElementById("vacio");

  let filtroActivo = "todas";

  const coincideBusqueda = (card, q) => {
    if (!q) return true;
    const texto = (
      card.querySelector("h3")?.textContent + " " +
      card.querySelector(".desc")?.textContent + " " +
      Array.from(card.querySelectorAll(".tag")).map(t => t.textContent).join(" ")
    ).toLowerCase();
    return q.split(/\s+/).every(termo => texto.includes(termo));
  };

  const aplicar = () => {
    const q = (buscador?.value || "").trim().toLowerCase();
    let visibles = 0;
    tarjetas.forEach((c) => {
      const okCat = filtroActivo === "todas" || c.dataset.categoria === filtroActivo;
      const okQ = coincideBusqueda(c, q);
      const mostrar = okCat && okQ;
      c.classList.toggle("oculta", !mostrar);
      if (mostrar) visibles++;
    });
    if (vacio) vacio.hidden = visibles > 0;
  };

  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      botones.forEach((b) => {
        b.classList.remove("activo");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("activo");
      btn.setAttribute("aria-pressed", "true");
      filtroActivo = btn.dataset.filtro;
      aplicar();
    });
  });

  buscador?.addEventListener("input", aplicar);

  // Atajo: "/" enfoca el buscador
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "/" && document.activeElement !== buscador) {
      ev.preventDefault();
      buscador?.focus();
    }
  });

  // ===== Ficha de detalle del proyecto (modal accesible) =====
  const modal = document.getElementById("modal-detalle");
  const contDetalle = document.getElementById("detalle-contenido");
  let ultimoEnfoque = null;

  let PROYECTOS = [];
  try {
    PROYECTOS = JSON.parse(document.getElementById("datos-portafolio")?.textContent || "[]");
  } catch (_) { PROYECTOS = []; }

  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const NOMBRES_CAT = {"web":"Web","frontend":"Frontend","backend":"Backend",
    "datos":"Datos & Scraping","integraciones":"Integraciones","mobile":"Móvil",
    "ia":"IA / ML","devops":"DevOps","otros":"Otros"};

  function renderDetalle(p) {
    const tags = (p.tecnologias || []).map(t => `<span class="tag">${esc(t)}</span>`).join("");
    const acciones = [];
    if (p.url) acciones.push(`<a class="btn btn-codigo" href="${esc(p.url)}" target="_blank" rel="noopener">Ver código ↗</a>`);
    if (p.demo) acciones.push(`<a class="btn btn-demo" href="${esc(p.demo)}" target="_blank" rel="noopener">Demo ↗</a>`);
    return `
      <div class="detalle-cat">
        <span class="cat-pill">${esc(NOMBRES_CAT[p.categoria] || "Otros")}</span>
        ${p.destacado ? '<span class="badge-destacado">★ Destacado</span>' : ""}
      </div>
      <h3 id="detalle-nombre">${esc(p.nombre)}</h3>
      <p class="detalle-meta">${esc(p.fecha || "")}${p.repo ? " · " + esc(p.repo) : ""}</p>
      <p class="detalle-desc">${esc(p.descripcion || "")}</p>
      <section class="detalle-seccion">
        <h4>Tecnologías</h4>
        <div class="tags" role="list">${tags}</div>
      </section>
      <section class="detalle-seccion" id="detalle-stats" hidden>
        <h4>Actividad en GitHub</h4>
        <div class="detalle-stats"></div>
      </section>
      <div class="detalle-acciones">${acciones.join("")}</div>
    `;
  }

  async function cargarStats(repo) {
    if (!repo) return;
    const seccion = contDetalle.querySelector("#detalle-stats");
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!r.ok) return;
      const d = await r.json();
      const stats = [
        ["Estrellas", d.stargazers_count],
        ["Forks", d.forks_count],
        ["Issues abiertas", d.open_issues_count],
        ["Último push", (d.pushed_at || "").slice(0, 10)],
      ];
      seccion.querySelector(".detalle-stats").innerHTML = stats
        .map(([k, v]) => `<div class="stat"><b>${esc(v)}</b><span>${esc(k)}</span></div>`)
        .join("");
      seccion.hidden = false;
    } catch (_) { /* sin stats si la API falla o alcanza el rate limit */ }
  }

  function abrirDetalle(id) {
    const p = PROYECTOS.find((x) => x.id === id);
    if (!p || !modal) return;
    ultimoEnfoque = document.activeElement;
    contDetalle.innerHTML = renderDetalle(p);
    modal.hidden = false;
    document.documentElement.classList.add("bloqueo");
    modal.querySelector(".modal-cerrar").focus();
    cargarStats(p.repo);
    history.replaceState(null, "", "#" + encodeURIComponent(id));
  }

  function cerrarDetalle() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.documentElement.classList.remove("bloqueo");
    history.replaceState(null, "", location.pathname + location.search);
    ultimoEnfoque?.focus();
  }

  modal?.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-cerrar]")) cerrarDetalle();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") cerrarDetalle();
  });

  // Cada tarjeta es clicable/focusable para abrir su ficha
  tarjetas.forEach((card, i) => {
    const p = PROYECTOS[i];
    if (!p) return;
    card.dataset.proyectoId = p.id;
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
    card.setAttribute("aria-label", `Ver detalle de ${p.nombre}`);
    card.classList.add("card-clicable");
    card.addEventListener("click", (ev) => {
      if (ev.target.closest("a")) return; // no interceptar enlaces internos
      abrirDetalle(p.id);
    });
    card.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        abrirDetalle(p.id);
      }
    });
  });

  // Enlace directo por hash (#id-del-proyecto)
  if (location.hash) {
    const id = decodeURIComponent(location.hash.slice(1));
    if (PROYECTOS.some((p) => p.id === id)) abrirDetalle(id);
  }
})();
