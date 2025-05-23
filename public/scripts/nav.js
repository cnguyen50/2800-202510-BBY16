document.addEventListener('DOMContentLoaded', () => {

  const toggle   = document.getElementById('menu-toggle');
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('overlay');


  const closeMenu = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  };

  toggle?.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    }
  });

  overlay?.addEventListener('click', () => {
    closeMenu();
  });
});
