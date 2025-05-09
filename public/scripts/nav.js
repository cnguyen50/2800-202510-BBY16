const toggle   = document.getElementById('menu-toggle');
const sidebar  = document.getElementById('sidebar');
const overlay  = document.getElementById('overlay');

toggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
});
