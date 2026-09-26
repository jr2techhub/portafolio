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
})();
