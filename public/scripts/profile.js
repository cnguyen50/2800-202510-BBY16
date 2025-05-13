let geocoder;

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    console.error(`Request failed: ${res.status}`);
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

function renderPosts(list) {
  const container = document.getElementById('posts-list');
  container.innerHTML = ''; // clear “Loading…”

  if (!list.length) {
    container.textContent = 'No posts yet.';
    return;
  }

  list.forEach(({ type, createdAt }) => {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `
      <p>${type}</p>
      <time>${new Date(createdAt).toLocaleString()}</time>
    `;
    container.appendChild(div);
  });
}

function renderUser(user) {
  document.getElementById('username').textContent = user.username || 'N/A';
  document.getElementById('email').textContent = user.email || 'N/A';
  // document.getElementById('neighbourhood').textContent = user.neighbourhood || 'N/A';
  const nbInput = document.getElementById('neighbourhoodInput');
  if (nbInput) {
    nbInput.value = user.neighbourhood || '';
  }
}

//Initializes the hidden map and geocoder once.
function initGeocoder() {
  const container = document.getElementById('geocode-map');
  if (!container || container._leaflet_id) return;

  const geoMap = L.map('geocode-map', {
    zoomControl: false,
    attributionControl: false
  });

  geocoder = L.Control.geocoder({
    defaultMarkGeocode: false,
    placeholder: 'Search neighbourhood…'
  })
    .on('markgeocode', e => {
      const { name, center } = e.geocode;
      window.selectedNeighborhood = { name, lat: center.lat, lng: center.lng };
      document.getElementById('neighbourhoodInput').value = name;
    })
    .addTo(geoMap);
}

// Saves neighbourhood input to server
async function saveNeighborhood() {
  console.log('saveNeighborhood called, geocoder=', geocoder);
  if (!geocoder) {
    return alert('Search not ready, Please wait.');
  }
  const query = document.getElementById('neighbourhoodInput').value.trim();
  if (!query) {
    alert('Please type a neighbourhood before saving.');
    return;
  }

  //Geocode with the Leaflet control geocoder
  geocoder.options.geocoder.geocode(query, async (results) => {
      console.log('geocode results:', results);
    if (!results.length) {
      return alert('No matches found for that neighbourhood.');
    }
    const { name, center } = results[0];
    document.getElementById('neighbourhoodInput').value = name;

    //Send to server
    try {
      const updated = await fetchJson('/users/me/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          neighbourhood: name,
          neighbourhoodLat: center.lat,
          neighbourhoodLng: center.lng
        })
      });
      renderUser(updated);
      alert('Neighbourhood saved!');
    } catch (err) {
      console.log('Failed to save neighbourhood:', err);
      alert('Could not save neighbourhood. Try again.');
    }
  });
}

async function uploadProfilePic(event) {
  event.preventDefault();

  const formData = new FormData();
  const fileInput = document.getElementById('profilePicInput');
  if (!fileInput.files[0]) {
    console.error('No file selected');
    document.getElementById('uploadMessage').textContent = 'No file selected!';
    return;
  }
  formData.append('profilePic', fileInput.files[0]);

  try {
    const res = await fetch('/users/me/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) throw new Error('Failed to upload profile picture');

    const data = await res.json();
    const imageUrl = data.profilePic;

    // Force image reload by appending timestamp
    document.getElementById('profilePic').src = imageUrl + '?t=' + new Date().getTime();
    document.getElementById('uploadMessage').textContent = 'Profile picture updated successfully!';

    if (data.user) renderUser(data.user);
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    document.getElementById('uploadMessage').textContent = 'Error uploading picture. Please try again.';
  }
}

async function init() {
  //Init hidden map and geocoder
  initGeocoder();

  // Save button
  document.getElementById('saveNeighborhood').addEventListener('click', saveNeighborhood);

  try {
    const [user, comments, posts] = await Promise.all([
      fetchJson('/users/me'),
      fetchJson('/comments/my'),
      fetchJson('/posts/me')
    ]);

    if (user) {
      renderUser(user);
      document.getElementById('profilePic').src = user.profilePic || '/uploads/default.jpg';
    } else {
      document.getElementById('profilePic').src = '/uploads/default.jpg';
      document.getElementById('username').textContent = 'Login required';
      document.getElementById('email').textContent = 'N/A';
      // document.getElementById('neighbourhood').textContent = 'N/A';
      document.getElementById('uploadMessage').textContent = 'Please log in to update your profile.';
    }

    renderPosts(posts); // You could also add rendering for comments here if needed

    const form = document.getElementById('profilePicForm');
    if (form) {
      form.addEventListener('submit', uploadProfilePic);
    } else {
      console.error('Profile picture form not found in the DOM.');
    }
  } catch (err) {
    console.error('Error initializing:', err);
    document.getElementById('username').textContent = 'Login required';
    document.getElementById('email').textContent = 'N/A';
    // document.getElementById('neighbourhood').textContent = 'N/A';
    document.getElementById('profilePic').src = '/uploads/default.jpg';
    document.getElementById('uploadMessage').textContent = 'Error loading user data. Please try again.';
  }
}

document.addEventListener('DOMContentLoaded', init);

