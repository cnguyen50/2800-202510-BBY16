
//handles front end if user does not already have an account
document.addEventListener('DOMContentLoaded', () => {
  const extras = document.querySelectorAll('.extra');
  const errorBox = document.getElementById('error-box');

  extras.forEach(el => {
  el.hidden  = true;
  el.querySelector('input').disabled = true;   // <- no empty string sent
    });

  const params = new URLSearchParams(location.search);
  const err    = params.get('error');

  // if login attempt fails
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

  const input    = document.getElementById('login-neighbourhood');
  const suggList = document.getElementById('hood-suggestions');
  let debounce;

  //get valid neighbourhood using nominatim
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = input.value.trim();
    if (!q) {
      suggList.innerHTML = '';
      return;
    }

    debounce = setTimeout(async () => {
      const params = new URLSearchParams({
        format:'jsonv2',
        q,
        limit:'5',
        countrycodes: 'ca',
        addressdetails: '1'
      });

      try {
        const res  = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
        const list = await res.json();

        suggList.innerHTML = list
          .map(place => {
            const name = place.address.suburb
              || place.address.village
              || place.address.town
              || place.address.city
              || place.display_name.split(',')[0];
            return `<li data-val="${name}">${name}</li>`;
          })
          .join('');
      } catch (err) {
        console.error('Neighbourhood lookup failed:', err);
      }
    }, 300);
  });

  suggList.addEventListener('click', e => {
    if (e.target.tagName === 'LI') {
      input.value = e.target.dataset.val;
      suggList.innerHTML = '';
    }
  });
});

