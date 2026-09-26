// Filtro de proyectos por categoría (sin dependencias).
document.addEventListener("DOMContentLoaded", () => {
  const botones = document.querySelectorAll(".filtro");
  const tarjetas = document.querySelectorAll(".card");

  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      botones.forEach((b) => b.classList.remove("activo"));
      btn.classList.add("activo");
      const f = btn.dataset.filtro;
      tarjetas.forEach((c) => {
        c.classList.toggle("oculta", f !== "todas" && c.dataset.categoria !== f);
      });
    });
  });
});
