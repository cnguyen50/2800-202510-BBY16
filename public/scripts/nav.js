document.addEventListener('DOMContentLoaded', () => {
  console.log("nav.js loaded"); // ← add this

  const toggle   = document.getElementById('menu-toggle');
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('overlay');

  console.log({ toggle, sidebar, overlay }); // ← inspect bindings

  const closeMenu = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  };

  toggle?.addEventListener('click', () => {
    console.log("Toggle clicked"); // ← add this
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    }
  });

  overlay?.addEventListener('click', () => {
    console.log("Overlay clicked"); // ← add this
    closeMenu();
  });
});
