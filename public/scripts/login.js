
document.addEventListener('DOMContentLoaded', () => {
  const extras = document.querySelectorAll('.extra');
  const errorBox = document.getElementById('error-box');

  /* Was the user redirected here with an error code? */
  const params = new URLSearchParams(location.search);
  const err    = params.get('error');

  if (err === 'USER_NOT_FOUND') {
    extras.forEach(el => el.hidden = false);
    errorBox.textContent = 'User not found – please add your e‑mail and neighbourhood to create an account.';
    errorBox.hidden = false;
  }
  if (err === 'BAD_PASSWORD') {
    errorBox.textContent = 'Invalid password. Please try again.';
    errorBox.hidden = false;
  }
});

