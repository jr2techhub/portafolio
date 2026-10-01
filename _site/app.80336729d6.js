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

  const PROJECT_COPY_EN = {
    "erp-lite": "A modular, multi-tenant SaaS ERP for small businesses, built with .NET 10 and Clean Architecture. Features a Blazor WASM frontend, PostgreSQL with EF Core, Stripe payments, and Google Gemini AI integration (LightERP.AI).",
    "marketscrapersolution": "A .NET web-scraping and data-processing platform that collects and analyzes classified listings from multiple marketplaces. Includes a Dynamic Market Intelligence Agent with JSON-configurable, no-code scraping patterns.",
    "market-scraper-app": "The MarketScraper ecosystem web app: an interactive dashboard built with React 19 and Vite, Recharts visualizations, i18next localization, and modular SCSS design. Published on GitHub Pages with automated deployment.",
    "techhub-sso": "A centralized identity server (Single Sign-On) for the TechHub ecosystem, built with OpenIddict and .NET 10. Supports OAuth 2.0 / OpenID Connect Authorization Code with PKCE, multi-tenancy, and automated trials.",
    "tropicfeel-netsuite-integration": "E-commerce ↔ ERP integration: a Java/Spring broker microservice that synchronizes items, purchase orders, and inbound shipments across NetSuite, Everstox/Deliverr, and marketplaces through event flows and DLQ queues.",
    "hublanding": "Landing page for the technology hub.",
    "portafolio": "A Python-generated static portfolio published on GitHub Pages. It syncs automatically with the GitHub API, so new repositories appear whenever the workflow runs.",
  };
  const PROJECT_NAMES_EN = {"portafolio": "Portfolio (this site)"};

  const NOMBRES_CAT_EN = {"web":"Web","frontend":"Frontend","backend":"Backend",
    "datos":"Data & Scraping","integraciones":"Integrations","mobile":"Mobile",
    "ia":"AI / ML","devops":"DevOps","otros":"Other"};

  // ===== Internacionalización (EN / ES) =====
  const I18N = {
    es: {
      proyectos: "Proyectos",
      contacto: "Contacto",
      projectTitle: "Proyectos",
      projectSubtitle: "Proyectos",
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
      viewProjects: "Ver proyectos",
      letsTalk: "Hablemos",
      chatTitle: "Hablemos",
      requestConsultation: "Solicitar una consultoría",
      chatbotTitle: "JR2 Assistant",
      chatbotOnline: "En línea",
      chatbotGreeting: "Hola, puedo ayudarte con consultoría, IA, integración o backend.",
      optionConsultoria: "Consultoría",
      optionIA: "IA / automatización",
      optionIntegracion: "Integración",
      fieldName: "Nombre",
      fieldEmail: "Email",
      fieldProject: "Tipo de proyecto",
      fieldMessage: "Mensaje",
      sendMessage: "Enviar mensaje",
      aboutMe: "Sobre mí",
      aboutTitle: "Lidero soluciones digitales complejas para empresas que necesitan operar mejor y crecer con confianza.",
      aboutText: "Soy Ingeniero de Software Senior con más de 20 años de experiencia desarrollando sistemas empresariales, integraciones heterogéneas, plataformas de gestión, automatización y soluciones cloud para sectores como logística, turismo, comercio, e-commerce y producción. He trabajado tanto en la arquitectura como en la ejecución técnica, guiando equipos y entregando software crítico para negocio.",
      specialties: "Especialidades",
      specialtiesTitle: "Soluciones técnicas pensadas para crecer negocio y operación.",
      projectQuestion: "¿Tienes un proyecto?",
      projectTitle: "Construyamos una solución que reduzca fricción, escale y genere valor real.",
      catNames: NOMBRES_CAT,
    },
    en: {
      proyectos: "Projects",
      contacto: "Contact",
      projectTitle: "Projects",
      projectSubtitle: "Projects",
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
      viewProjects: "View projects",
      letsTalk: "Let's talk",
      chatTitle: "Let's talk",
      requestConsultation: "Request a consultation",
      chatbotTitle: "JR2 Assistant",
      chatbotOnline: "Online",
      chatbotGreeting: "Hi, I can help with consulting, AI, integration or backend solutions.",
      optionConsultoria: "Consulting",
      optionIA: "AI / automation",
      optionIntegracion: "Integration",
      fieldName: "Name",
      fieldEmail: "Email",
      fieldProject: "Project type",
      fieldMessage: "Message",
      sendMessage: "Send message",
      aboutMe: "About me",
      aboutTitle: "I lead complex digital solutions for companies that need to operate better and scale with confidence.",
      aboutText: "I am a Senior Software Engineer with more than 20 years of experience building enterprise systems, heterogeneous integrations, management platforms, automation, and cloud solutions for sectors such as logistics, tourism, commerce, e-commerce, and production. I have worked both in architecture and technical execution, leading teams and delivering critical software for business operations.",
      specialties: "Specialties",
      specialtiesTitle: "Technical solutions designed to grow business operations and performance.",
      projectQuestion: "Have a project in mind?",
      projectTitle: "Let’s build a solution that reduces friction, scales efficiently and creates real value.",
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
      // GitHub responde 404 para repos privados/inexistentes desde clientes no
      // autenticados (y 451 por DMCA): mostramos un aviso amigable de "repositorio
      // privado — solicita acceso" en lugar del error 404 de GitHub. Un 403 u otro
      // fallo (p. ej. rate limit anónimo) NO debe mostrarse como repo privado.
      if (r.status === 404 || r.status === 451) {
        const L = t();
        const enlaceAcceso = `https://github.com/${repo}`;
        cont.innerHTML = `
          <div class="aviso-privado" role="status">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M7 10.5V8a5 5 0 0 1 10 0v2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="15.5" r="1.7" fill="currentColor"/></svg>
            <strong>${esc(L.privateTitle)}</strong>
            <p>${esc(L.privateMsg)}</p>
            <a class="btn btn-acceso" href="${esc(enlaceAcceso)}" target="_blank" rel="noopener">${esc(L.requestAccess)}</a>
          </div>`;
        seccion.querySelector("h4").textContent = L.privateTitle;
        seccion.hidden = false;
        return;
      }
      if (!r.ok) return; // rate limit u otro error: ocultar la sección, sin falso aviso
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
    ['#btn-ver-proyectos', null, 'viewProjects'],
    ['#btn-hablemos', null, 'letsTalk'],
    ['#sobre-mi-etiqueta', null, 'aboutMe'],
    ['#titulo-sobre-mi', null, 'aboutTitle'],
    ['#sobre-mi-texto', null, 'aboutText'],
    ['#stack-etiqueta', null, 'specialties'],
    ['#titulo-stack', null, 'specialtiesTitle'],
    ['#cta-etiqueta', null, 'projectQuestion'],
    ['#cta-titulo', null, 'projectTitle'],
    ['#btn-consultoria', null, 'requestConsultation'],
  ];

  function actualizarChatbotIdioma() {
    const L = t();
    const refs = document.querySelectorAll("[data-chat-lang]");
    refs.forEach((el) => {
      const key = el.dataset.chatLang;
      if (key && L[key]) {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.placeholder = L[key];
        } else if (el.tagName === "BUTTON") {
          el.textContent = L[key];
        } else {
          el.textContent = L[key];
        }
      }
    });

    const form = document.getElementById("chatbot-form");
    if (form) {
      const nameInput = form.querySelector('input[name="nombre"]');
      const emailInput = form.querySelector('input[name="email"]');
      const projectInput = form.querySelector('input[name="proyecto"]');
      const msgInput = form.querySelector('textarea[name="mensaje"]');
      const toggle = document.getElementById("chatbot-toggle");
      const closeBtn = document.getElementById("chatbot-close");

      if (toggle) toggle.setAttribute("aria-label", idioma === "en" ? "Open contact assistant" : "Abrir asistente de contacto");
      if (closeBtn) closeBtn.setAttribute("aria-label", idioma === "en" ? "Close contact assistant" : "Cerrar asistente de contacto");
      if (nameInput && L.fieldName) nameInput.placeholder = idioma === "en" ? "Your name" : "Tu nombre";
      if (emailInput && L.fieldEmail) emailInput.placeholder = idioma === "en" ? "you@email.com" : "tu@email.com";
      if (projectInput && L.fieldProject) projectInput.placeholder = idioma === "en" ? "AI, backend, integration..." : "IA, backend, integración...";
      if (msgInput && L.fieldMessage) msgInput.placeholder = idioma === "en" ? "Tell me briefly what you need..." : "Cuéntame brevemente qué necesitas...";
    }
  }

  function aplicarIdioma(nuevo) {
    idioma = nuevo === "en" ? "en" : "es";
    try { localStorage.setItem("idioma", idioma); } catch (_) {}
    document.documentElement.lang = idioma;
    const L = t();

    document.querySelectorAll("[data-es][data-en]").forEach((el) => {
      const valor = el.dataset[idioma] || el.dataset.es || el.dataset.en;
      if (!valor) return;

      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = valor;
      } else if (el.matches("h1") && el.querySelector(".accent")) {
        const name = el.querySelector(".accent").textContent;
        el.innerHTML = `${esc(valor)}<span class="accent">${esc(name)}</span>`;
      } else {
        el.textContent = valor;
      }
    });

    // Textos estáticos del documento
    for (const [sel, attr, clave] of I18N_DOM) {
      const el = document.querySelector(sel);
      if (!el) continue;
      if (attr) el.setAttribute(attr, L[clave]);
      else el.textContent = L[clave];
    }

    actualizarChatbotIdioma();

    // Botones de filtro y etiquetas de categoría
    document.querySelectorAll(".filtro").forEach((btn) => {
      const f = btn.dataset.filtro;
      if (!f) return;
      btn.textContent = f === "todas" ? L.todas : ((L.catNames || {})[f] || btn.textContent);
    });
    document.querySelectorAll(".card .cat-pill").forEach((el) => {
      const category = el.closest(".card")?.dataset.categoria;
      el.textContent = ((L.catNames || {})[category]) || NOMBRES_CAT[category] || "Other";
    });

    const traducirProyectos = (selector) => {
      document.querySelectorAll(selector).forEach((item) => {
        const id = item.dataset.projectId;
        const copy = PROJECT_COPY_EN[id];
        const name = item.querySelector("h3, .slide-nombre");
        const project = PROYECTOS.find((p) => p.id === id);
        if (name) name.textContent = idioma === "en" ? (PROJECT_NAMES_EN[id] || project?.nombre || name.textContent) : (project?.nombre || name.textContent);
        const desc = item.querySelector(selector.includes("slide") ? ".slide-desc" : ".desc");
        if (desc) {
          desc.textContent = idioma === "en" ? (copy || project?.descripcion || desc.textContent) : (project?.descripcion || desc.textContent);
        }
        item.querySelectorAll(".badge-destacado").forEach((badge) => {
          badge.textContent = idioma === "en" ? "★ Featured" : "★ Destacado";
        });
        item.querySelectorAll(".btn-demo").forEach((link) => {
          link.textContent = idioma === "en" ? "Demo ↗" : "Demo ↗";
          link.setAttribute("aria-label", `${idioma === "en" ? "View demo of" : "Ver demo de"} ${item.querySelector("h3, .slide-nombre")?.textContent || ""}`);
        });
        item.querySelectorAll(".btn-codigo").forEach((link) => {
          const projectName = item.querySelector("h3, .slide-nombre")?.textContent || "";
          link.setAttribute("aria-label", `${idioma === "en" ? "View code for" : "Ver código de"} ${projectName}`);
          const text = Array.from(link.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
          if (text) text.textContent = idioma === "en" ? " Code" : " Código";
        });
      });
    };
    traducirProyectos(".card");
    traducirProyectos(".slide");

    // Chip con total de proyectos
    document.querySelectorAll(".chip-estatico").forEach((el) => {
      const n = el.textContent.trim().split(/\s+/)[0];
      if (/^\d+$/.test(n)) el.textContent = n + (idioma === "en" ? el.dataset.enSuffix : el.dataset.esSuffix);
    });

    document.querySelectorAll("[data-es-aria][data-en-aria]").forEach((el) => {
      el.setAttribute("aria-label", el.dataset[`${idioma}Aria`]);
    });

    // Etiquetas accesibles de las tarjetas
    actualizarEtiquetasTarjetas();

    // Estado del selector
    document.querySelectorAll("#selector-idioma .idioma-btn").forEach((b) => {
      const activo = b.dataset.idioma === idioma;
      b.classList.toggle("activo", activo);
      b.setAttribute("aria-pressed", activo ? "true" : "false");
    });

    document.querySelectorAll(".slide-enlace").forEach((link) => {
      link.textContent = idioma === "en" ? "View on GitHub →" : "Ver en GitHub →";
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

  const chatbotToggle = document.getElementById("chatbot-toggle");
  const chatbotPanel = document.getElementById("chatbot-panel");
  const chatbotClose = document.getElementById("chatbot-close");
  const chatbotForm = document.getElementById("chatbot-form");

  const abrirChatbot = () => {
    if (!chatbotPanel) return;
    chatbotPanel.hidden = false;
    chatbotToggle?.setAttribute("aria-expanded", "true");
  };

  const cerrarChatbot = () => {
    if (!chatbotPanel) return;
    chatbotPanel.hidden = true;
    chatbotToggle?.setAttribute("aria-expanded", "false");
  };

  document.querySelectorAll("[data-open-chat]").forEach((link) => {
    link.addEventListener("click", (ev) => {
      ev.preventDefault();
      abrirChatbot();
      chatbotPanel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      chatbotPanel?.querySelector('input[name="email"]')?.focus({ preventScroll: true });
    });
  });

  chatbotToggle?.addEventListener("click", () => {
    const abierto = !chatbotPanel?.hidden;
    if (abierto) cerrarChatbot(); else abrirChatbot();
  });
  chatbotClose?.addEventListener("click", cerrarChatbot);

  chatbotForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const formData = new FormData(chatbotForm);
    const nombre = (formData.get("nombre") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const proyecto = (formData.get("proyecto") || "").toString().trim();
    const mensaje = (formData.get("mensaje") || "").toString().trim();
    const asunto = encodeURIComponent((proyecto || "Consulta") + " - Portafolio");
    const cuerpo = encodeURIComponent(
      `Hola,\n\nNombre: ${nombre || "No indicado"}\nEmail: ${email}\nTipo de proyecto: ${proyecto || "No indicado"}\n\nMensaje:\n${mensaje}`
    );
    window.location.href = `mailto:ricocsharp@gmail.com?subject=${asunto}&body=${cuerpo}`;
  });

  document.querySelectorAll(".chatbot-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const proyecto = btn.dataset.option || "consultoria";
      const input = document.querySelector('#chatbot-form input[name="proyecto"]');
      if (input) {
        input.value = proyecto === "consultoria"
          ? (idioma === "en" ? "Consulting" : "Consultoría")
          : proyecto === "ia"
            ? (idioma === "en" ? "AI / automation" : "IA / automatización")
            : (idioma === "en" ? "Integration" : "Integración");
      }
      abrirChatbot();
    });
  });

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
