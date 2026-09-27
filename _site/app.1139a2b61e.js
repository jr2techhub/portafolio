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

  // ===== Internacionalización (EN / ES) =====
  const I18N = {
    es: {
      proyectos: "Proyectos",
      contacto: "Contacto",
      buscar_placeholder: "Buscar por nombre, tecnología…",
      buscar_aria: "Buscar proyectos",
      salto: "Saltar a proyectos",
      vacio: "No hay proyectos que coincidan con la búsqueda o el filtro.",
      todas: "Todas",
      technologies: "Tecnologías",
      activity: "Actividad en GitHub",
      stars: "Estrellas",
      forks: "Forks",
      openIssues: "Issues abiertas",
      lastPush: "Último push",
      viewCode: "Ver código ↗",
      demo: "Demo ↗",
      featured: "★ Destacado",
      privateTitle: "Repositorio privado",
      privateMsg: "Este repositorio es privado y no es accesible públicamente. Si necesitas verlo, solicita acceso directamente al autor.",
      requestAccess: "Solicitar acceso ↗",
      publicProjectsSuffix: " proyectos publicados",
      cardAriaPrefix: "Ver detalle de",
      slideGoTo: "Ir al proyecto",
      catNames: NOMBRES_CAT,
    },
    en: {
      proyectos: "Projects",
      contacto: "Contact",
      buscar_placeholder: "Search by name, technology…",
      buscar_aria: "Search projects",
      salto: "Skip to projects",
      vacio: "No projects match your search or filter.",
      todas: "All",
      technologies: "Technologies",
      activity: "GitHub activity",
      stars: "Stars",
      forks: "Forks",
      openIssues: "Open issues",
      lastPush: "Last push",
      viewCode: "View code ↗",
      demo: "Demo ↗",
      featured: "★ Featured",
      privateTitle: "Private repository",
      privateMsg: "This repository is private and not publicly available. If you need access, please request it directly from the author.",
      requestAccess: "Request access ↗",
      publicProjectsSuffix: " public projects",
      cardAriaPrefix: "View details of",
      slideGoTo: "Go to project",
      catNames: {
        "web": "Web", "frontend": "Frontend", "backend": "Backend",
        "datos": "Data & Scraping", "integraciones": "Integrations", "mobile": "Mobile",
        "ia": "AI / ML", "devops": "DevOps", "otros": "Other",
      },
    },
  };

  let idioma = "es";
  try { idioma = localStorage.getItem("idioma") === "en" ? "en" : "es"; } catch (_) {}
  const t = () => I18N[idioma] || I18N.es;

  function renderDetalle(p) {
    const L = t();
    const tags = (p.tecnologias || []).map(x => `<span class="tag">${esc(x)}</span>`).join("");
    const acciones = [];
    if (p.url) acciones.push(`<a class="btn btn-codigo" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(L.viewCode)}</a>`);
    if (p.demo) acciones.push(`<a class="btn btn-demo" href="${esc(p.demo)}" target="_blank" rel="noopener">${esc(L.demo)}</a>`);
    return `
      <div class="detalle-cat">
        <span class="cat-pill">${esc((L.catNames || {})[p.categoria] || "Otros")}</span>
        ${p.destacado ? `<span class="badge-destacado">${esc(L.featured)}</span>` : ""}
      </div>
      <h3 id="detalle-nombre">${esc(p.nombre)}</h3>
      <p class="detalle-meta">${esc(p.fecha || "")}${p.repo ? " · " + esc(p.repo) : ""}</p>
      <p class="detalle-desc">${esc(p.descripcion || "")}</p>
      <section class="detalle-seccion">
        <h4>${esc(L.technologies)}</h4>
        <div class="tags" role="list">${tags}</div>
      </section>
      <section class="detalle-seccion" id="detalle-stats" hidden>
        <h4>${esc(L.activity)}</h4>
        <div class="detalle-stats"></div>
      </section>
      <div class="detalle-acciones">${acciones.join("")}</div>
    `;
  }

  async function cargarStats(repo) {
    if (!repo) return;
    const seccion = contDetalle.querySelector("#detalle-stats");
    const cont = seccion.querySelector(".detalle-stats");
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (r.status === 404 || r.status === 451) {
        // Repositorio privado o no accesible: mostrar aviso en lugar del error 404 de GitHub.
        const L = t();
        const enlaceAcceso = `https://github.com/${repo}`;
        cont.innerHTML = `
          <div class="aviso-privado">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M7 10.5V8a5 5 0 0 1 10 0v2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="15.5" r="1.7" fill="currentColor"/></svg>
            <strong>${esc(L.privateTitle)}</strong>
            <p>${esc(L.privateMsg)}</p>
            <a class="btn btn-acceso" href="${esc(enlaceAcceso)}" target="_blank" rel="noopener">${esc(L.requestAccess)}</a>
          </div>`;
        seccion.hidden = false;
        return;
      }
      if (!r.ok) return;
      const d = await r.json();
      const L = t();
      const stats = [
        [L.stars, d.stargazers_count],
        [L.forks, d.forks_count],
        [L.openIssues, d.open_issues_count],
        [L.lastPush, (d.pushed_at || "").slice(0, 10)],
      ];
      cont.innerHTML = stats
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
  const actualizarEtiquetasTarjetas = () => {
    const L = t();
    tarjetas.forEach((card, i) => {
      const p = PROYECTOS[i];
      if (!p) return;
      card.setAttribute("aria-label", `${L.cardAriaPrefix} ${p.nombre}`);
    });
  };
  tarjetas.forEach((card, i) => {
    const p = PROYECTOS[i];
    if (!p) return;
    card.dataset.proyectoId = p.id;
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
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

  // ===== Selector de idioma EN/ES =====
  const I18N_DOM = [
    // [selector, atributo, clave]  — atributo null => textContent
    ['.salto', null, 'salto'],
    ['#buscador', 'placeholder', 'buscar_placeholder'],
    ['#buscador', 'aria-label', 'buscar_aria'],
    ['#vacio', null, 'vacio'],
    ['.barra nav a[href="#proyectos"]', null, 'proyectos'],
    ['.barra nav a[href^="mailto:"]', null, 'contacto'],
  ];

  function aplicarIdioma(nuevo) {
    idioma = nuevo === "en" ? "en" : "es";
    try { localStorage.setItem("idioma", idioma); } catch (_) {}
    document.documentElement.lang = idioma;
    const L = t();

    // Textos estáticos del documento
    for (const [sel, attr, clave] of I18N_DOM) {
      const el = document.querySelector(sel);
      if (!el) continue;
      if (attr) el.setAttribute(attr, L[clave]);
      else el.textContent = L[clave];
    }

    // Botones de filtro de categorías
    document.querySelectorAll(".filtro").forEach((btn) => {
      const f = btn.dataset.filtro;
      if (!f) return;
      btn.textContent = f === "todas" ? L.todas : ((L.catNames || {})[f] || btn.textContent);
    });

    // Chip «N proyectos publicados»
    document.querySelectorAll(".chip-estatico").forEach((el) => {
      const n = el.textContent.trim().split(/\s+/)[0];
      if (/^\d+$/.test(n)) el.textContent = n + L.publicProjectsSuffix;
    });

    // Etiquetas accesibles de las tarjetas
    actualizarEtiquetasTarjetas();

    // Estado del selector
    document.querySelectorAll("#selector-idioma .idioma-btn").forEach((b) => {
      const activo = b.dataset.idioma === idioma;
      b.classList.toggle("activo", activo);
      b.setAttribute("aria-pressed", activo ? "true" : "false");
    });

    // Si hay una ficha abierta, re-renderizarla en el nuevo idioma
    const detalleVisible = modal && !modal.hidden;
    if (detalleVisible) {
      const idAbierto = contDetalle?.querySelector("#detalle-nombre")
        ? (PROYECTOS.find(p => p.nombre === contDetalle.querySelector("#detalle-nombre").textContent)?.id)
        : null;
      if (idAbierto) abrirDetalle(idAbierto);
    }
  }

  document.querySelectorAll("#selector-idioma .idioma-btn").forEach((btn) => {
    btn.addEventListener("click", () => aplicarIdioma(btn.dataset.idioma));
  });

  // Aplicar el idioma guardado al cargar
  aplicarIdioma(idioma);
})();

// Slider alegórico de proyectos en el hero (sin dependencias).
(() => {
  const slider = document.getElementById("slider-proyectos");
  if (!slider) return;
  const slides = Array.from(slider.querySelectorAll(".slide"));
  if (slides.length < 2) return;

  const prev = document.getElementById("slider-prev");
  const next = document.getElementById("slider-next");
  const puntosCont = document.getElementById("slider-puntos");

  let indice = 0;
  let timer = null;
  const INTERVALO = 5000;
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const puntos = slides.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "slider-punto" + (i === 0 ? " activo" : "");
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", `Ir al proyecto ${i + 1}`);
    b.setAttribute("aria-selected", i === 0 ? "true" : "false");
    b.addEventListener("click", () => { ir(i); reiniciar(); });
    puntosCont.appendChild(b);
    return b;
  });

  function ir(nuevo) {
    indice = (nuevo + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("activo", i === indice));
    puntos.forEach((p, i) => {
      p.classList.toggle("activo", i === indice);
      p.setAttribute("aria-selected", i === indice ? "true" : "false");
    });
  }

  function reiniciar() {
    if (reducir) return;
    clearInterval(timer);
    timer = setInterval(() => ir(indice + 1), INTERVALO);
  }

  prev?.addEventListener("click", () => { ir(indice - 1); reiniciar(); });
  next?.addEventListener("click", () => { ir(indice + 1); reiniciar(); });
  slider.addEventListener("mouseenter", () => clearInterval(timer));
  slider.addEventListener("mouseleave", reiniciar);
  slider.addEventListener("focusin", () => clearInterval(timer));
  slider.addEventListener("focusout", reiniciar);
  slider.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowLeft") { ir(indice - 1); reiniciar(); }
    if (ev.key === "ArrowRight") { ir(indice + 1); reiniciar(); }
  });

  // Pausar cuando la pestaña no está visible
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearInterval(timer);
    else reiniciar();
  });

  reiniciar();
})();
