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

// Function to render comments
function renderComments(list) {
  const container = document.getElementById('comments-list');
  container.innerHTML = '';

  if (!list.length) {
    container.textContent = 'No comments yet.';
    return;
  }

  list.forEach(({ content, created_at, post_id }) => {
    const div = document.createElement('div');
    div.className = 'post';

    // Extracting post details to make a readable title
    const type = post_id?.type?.toLowerCase();
    const title = post_id?.headline || post_id?.event_name || post_id?.text || 'Unnamed Post';

    div.innerHTML = `
      <p><strong>Comment:</strong> ${content}</p>
      <p><strong>On Post:</strong> <span data-post-id="${post_id?._id}" data-post-type="${type}">${title}</span></p>
      <time>${new Date(created_at).toLocaleString()}</time>
    `;

    container.appendChild(div);
  });
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
      document.getElementById('neighbourhood').textContent = 'N/A';
      document.getElementById('uploadMessage').textContent = 'Please log in to update your profile.';
    }

    renderPosts(posts); // You could also add rendering for comments here if needed
    renderComments(comments);

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
    document.getElementById('neighbourhood').textContent = 'N/A';
    document.getElementById('profilePic').src = '/uploads/default.jpg';
    document.getElementById('uploadMessage').textContent = 'Error loading user data. Please try again.';
  }
}

document.addEventListener('DOMContentLoaded', init);

