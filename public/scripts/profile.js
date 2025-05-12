async function fetchJson(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    console.error(`Request failed: ${res.status}`);
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

<<<<<<< HEAD
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
  
  async function init() {
    try {
      const [user, comments, posts] = await Promise.all([
        fetchJson('/users/me'),
        fetchJson('/comments/my'),
        fetchJson('/posts/me')
      ]);
=======
async function getUserData() {
  try {
    const user = await fetchJson('/users/me');
    if (user) {
>>>>>>> Tommy
      renderUser(user);
      document.getElementById('profilePic').src = user.profilePic || '/uploads/default.jpg';
    } else {
      document.getElementById('profilePic').src = '/uploads/default.jpg';
      document.getElementById('username').textContent = 'Login required';
      document.getElementById('email').textContent = 'N/A';
      document.getElementById('neighbourhood').textContent = 'N/A';
      document.getElementById('uploadMessage').textContent = 'Please log in to update your profile.';
    }
  } catch (err) {
    console.error('Error fetching user data:', err);
    document.getElementById('username').textContent = 'Login required';
    document.getElementById('email').textContent = 'N/A';
    document.getElementById('neighbourhood').textContent = 'N/A';
    document.getElementById('profilePic').src = '/uploads/default.jpg';
    document.getElementById('uploadMessage').textContent = 'Error loading user data. Please try again.';
  }
}

function renderUser(user) {
  document.getElementById('username').textContent = user.username || 'N/A';
  document.getElementById('email').textContent = user.email || 'N/A';
  document.getElementById('neighbourhood').textContent = user.neighbourhood || 'N/A';
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
    const res = await fetch('/users/me/upload', {  // Updated route path here
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
  await getUserData();

  const form = document.getElementById('profilePicForm');
  if (form) {
    form.addEventListener('submit', uploadProfilePic);
  } else {
    console.error('Profile picture form not found in the DOM.');
  }
}

document.addEventListener('DOMContentLoaded', init);
