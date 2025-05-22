async function fetchJson(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    console.error(`Request failed: ${res.status}`);
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

function renderPosts(list, filterType = 'all') {
  const container = document.getElementById('posts-list');
  container.innerHTML = '';

  const filtered = list.filter(post => {
    if (filterType === 'all') return true;
    return post.type?.toLowerCase() === filterType;
  });

  if (!filtered.length) {
    container.textContent = 'No posts to display.';
    return;
  }

  filtered.forEach(post => {
    const div = document.createElement('div');
    div.className = 'post';
    div.style.cursor = 'pointer';

    const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });

    let postTitle = '';
    let postBody = '';

    const type = post.type?.toLowerCase();

    if (type === 'event') {
      const eventDate = post.event_date ? new Date(post.event_date).toLocaleDateString('en-US') : 'No date';
      postTitle = post.event_name || 'Untitled Event';
      postBody = `
        <h4>${postTitle} — ${eventDate}</h4>
        <p><strong>Location:</strong> ${post.location || 'No location provided'}</p>
        <p>${post.description || 'No additional description.'}</p>
      `;
    } else if (type === 'poll') {
      postTitle = post.text || 'Untitled Poll';
      postBody = `<p>${post.text || 'No description.'}</p>`;
      if (post.options?.length) {
        postBody += `
          <ul>
            ${post.options.map(opt => `<li>${opt.label} (${opt.votes} votes)</li>`).join('')}
          </ul>`;
      }
    } else if (type === 'news') {
      postTitle = post.headline || 'Untitled News';
      postBody = `<p>${post.body || 'No content.'}</p>`;
    } else {
      postTitle = post.title || 'Untitled';
      postBody = `<p>${post.content || 'No content available.'}</p>`;
    }

    div.innerHTML = `
      <div class="post-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <p><strong>${post.type}</strong> • ${formattedDate}</p>
          <h4 style="margin: 0;">${postTitle}</h4>
        </div>
        <span class="dropdown-arrow" style="font-size: 24px; user-select: none;">&#9660;</span>
      </div>
      <div class="post-preview" style="display: none; margin-top: 10px;">
        ${postBody}
        ${post.image_url ? `<img src="${post.image_url}" alt="Post image" style="max-width: 100%; height: auto;" />` : ''}
      </div>
    `;

    const dropdown = div.querySelector('.dropdown-arrow');
    const preview = div.querySelector('.post-preview');
    dropdown.addEventListener('click', e => {
      e.stopPropagation();
      const show = preview.style.display === 'none';
      preview.style.display = show ? 'block' : 'none';
      dropdown.innerHTML = show ? '&#9650;' : '&#9660;';
    });

    div.addEventListener('click', () => {
      window.location.href = `/posts/${post._id}/view`;
    });

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
    div.className = 'comment';

    // Defensive fallback for post title
    let postTitle = 'Unnamed Post';
    if (post_id) {
      postTitle = post_id.headline || post_id.event_name || post_id.text || 'Unnamed Post';
    }

    div.innerHTML = `
      <p><strong>Comment:</strong> ${content}</p>
      <p><strong>On Post:</strong> ${postTitle}</p>
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

    document.getElementById('profilePic').src = imageUrl + '?t=' + new Date().getTime();
    document.getElementById('uploadMessage').textContent = 'Profile picture updated successfully!';

    if (data.user) renderUser(data.user);
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    document.getElementById('uploadMessage').textContent = 'Error uploading picture. Please try again.';
  }
}

let allPosts = [];
let allComments = [];

async function init() {
  try {
    const userId = window.profileUserId;
    const isSelf = window.isSelfProfile;


    const [user, comments, posts] = await Promise.all([
      fetchJson(isSelf ? '/users/me' : `/users/${userId}/json`),
      fetchJson(isSelf ? '/comments/my' : `/comments/users/${userId}`),
      fetchJson(isSelf ? '/posts/me' : `/posts/users/${userId}`)
    ]);
    console.log(isSelf);


    console.log('User:', user);
    console.log('Comments:', comments);
    console.log('Posts:', posts);
    if (user) {
      console.log('User:', user);
      renderUser(user);
      document.getElementById('profilePic').src = user.profilePic || '/uploads/default.jpg';
    } else {
      document.getElementById('profilePic').src = '/uploads/default.jpg';
      document.getElementById('username').textContent = 'Login required';
      document.getElementById('email').textContent = 'N/A';
      document.getElementById('neighbourhood').textContent = 'N/A';
      document.getElementById('uploadMessage').textContent = 'Please log in to update your profile.';
    }

    allPosts = posts || [];
    allComments = comments || [];

    renderPosts(allPosts);
    renderComments(allComments);

    if (isSelf) {
      const form = document.getElementById('profilePicForm');
      if (form) {
        form.addEventListener('submit', uploadProfilePic);
      }

      const fileInput = document.getElementById('profilePicInput');
      if (fileInput) {
        fileInput.addEventListener('change', () => {
          if (fileInput.files.length > 0) {
            form.dispatchEvent(new Event('submit', { cancelable: true }));
          }
        });
      }
    }
    console.log('File input found and event listener added');

    // Tab filtering logic & toggle containers
    const tabButtons = document.querySelectorAll('.tab');
    tabButtons.forEach(tab => {
      tab.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tab.classList.add('active');

        const type = tab.dataset.type;

        const postsContainer = document.getElementById('posts-list');
        const commentsContainer = document.getElementById('comments-list');

        if (type === 'comment') {
          postsContainer.style.display = 'none';
          commentsContainer.style.display = 'block';
          renderComments(allComments);
        } else {
          commentsContainer.style.display = 'none';
          postsContainer.style.display = 'block';
          renderPosts(allPosts, type);
        }
      });
    });
    console.log('Tab buttons found and event listeners added');

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
