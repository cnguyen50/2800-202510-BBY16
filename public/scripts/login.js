
document.addEventListener('DOMContentLoaded', () => {
  const extras = document.querySelectorAll('.extra');
  const errorBox = document.getElementById('error-box');

  extras.forEach(el => {
  el.hidden  = true;
  el.querySelector('input').disabled = true;   // <- no empty string sent
    });

  const params = new URLSearchParams(location.search);
  const err    = params.get('error');

  if (err === 'USER_NOT_FOUND') {
    extras.forEach(el => {
    el.hidden  = false;
    el.querySelector('input').disabled = false;
    });
    errorBox.innerHTML = "User not found – please add your e‑mail and neighbourhood to create an account. Or <a href='/login'>Try Again</a>";
    errorBox.hidden = false;
  }
  if (err === 'BAD_PASSWORD') {
    errorBox.textContent = 'Invalid password. Please try again.';
    errorBox.hidden = false;
  }
});

