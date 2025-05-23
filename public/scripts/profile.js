// Chart, pagination, and filter state variables
let currentChartType = "doughnut";
let postsPerPage = 5;
let currentPostIndex = 0;
let currentFilterType = 'all';

// Utility to fetch JSON data from API with credentials
async function fetchJson(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    console.error(`Request failed: ${res.status}`);
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

// Render a list of posts to the UI with filter and pagination support
function renderPosts(list, filterType = 'all', append = false) {
  const container = document.getElementById('posts-list');
  if (!append) {
    container.innerHTML = '';
    currentPostIndex = 0;
  }
  currentFilterType = filterType;

  // Filter posts by type
  const filtered = list.filter(post => {
    if (filterType === 'all') return true;
    return post.type?.toLowerCase() === filterType;
  });

  // Get posts for current page
  const postsToShow = filtered.slice(currentPostIndex, currentPostIndex + postsPerPage);

  // Display a message if no posts found
  if (!append && !postsToShow.length) {
    container.textContent = 'No posts to display.';
    return;
  }

  postsToShow.forEach(post => {
    const div = document.createElement('div');
    div.className = 'post';
    div.style.cursor = 'pointer';

    const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });

    // Prepare post display details based on type
    let postTitle = '';
    let postBody = '';
    const type = post.type?.toLowerCase();
    const chartId = `chart-${post._id}`;

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
      const optionsHtml = post.options?.map(opt => `
        <li>
          <span>${opt.label}</span>
          <span class="badge bg-secondary">${opt.votes} vote(s)</span>
        </li>
      `).join('') || '';

      postBody = `
        <p><strong>Poll:</strong> ${post.text || 'No description.'}</p>
        <ul class="list-unstyled ps-3">${optionsHtml}</ul>
        <div class="chart-controls mb-2" data-controls-id="${post._id}">
        <button class="btn btn-sm btn-outline-secondary chart-type-btn" data-type="bar" data-chart-id="${chartId}">Bar</button>
        <button class="btn btn-sm btn-outline-secondary chart-type-btn" data-type="pie" data-chart-id="${chartId}">Pie</button>
        <button class="btn btn-sm btn-outline-secondary chart-type-btn" data-type="doughnut" data-chart-id="${chartId}">Doughnut</button>
        </div>
        <canvas id="${chartId}" class="poll-chart mt-3" height="250"></canvas>
        <a href="/polls/${post._id}/view" class="btn btn-outline-primary btn-sm mt-2">Vote or View Results</a>
      `;
    } else if (type === 'news') {
      postTitle = post.headline || 'Untitled News';
      postBody = `<p>${post.body || 'No content.'}</p>`;
    } else {
      postTitle = post.title || 'Untitled';
      postBody = `<p>${post.content || 'No content available.'}</p>`;
    }

    // Build main post HTML
    div.innerHTML = `
      <div class="post-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <p><strong>${post.type}</strong> • ${formattedDate}</p>
          <h4 style="margin: 0;">${postTitle}</h4>
        </div>
        <span class="dropdown-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
    <path d="M480-360 280-560h400L480-360Z"/>
  </svg>
        </span>
      </div>
      <div class="post-preview" style="margin-top: 10px;">
        ${postBody}
        ${post.image_url ? `<img src="${post.image_url}" alt="Post image" style="max-width: 100%; height: auto;" />` : ''}
      </div>
    `;

    // Dropdown toggle to expand/collapse post preview (and show poll chart if needed)
    const dropdown = div.querySelector('.dropdown-arrow');
    const preview = div.querySelector('.post-preview');
    dropdown.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = preview.classList.toggle('open');
      dropdown.classList.toggle('open', isOpen);

      if (type === 'poll') {
        const canvas = div.querySelector(`#${chartId}`);
        renderPollChart(canvas, post, currentChartType);
      }
    });

    // Redirect on click: polls to /polls/:id/view, others to /posts/:id/view
    div.addEventListener('click', () => {
      const type = post.type?.toLowerCase();
      if (type === 'poll') {
        window.location.href = `/polls/${post._id}/view`;
      } else {
        window.location.href = `/posts/${post._id}/view`;
      }
    });

    // Allow switching poll chart type via local chart buttons
    div.addEventListener('click', e => {
      const target = e.target;
      if (target.classList.contains('chart-type-btn')) {
        const newType = target.dataset.type;
        const chartId = target.dataset.chartId;
        const canvas = document.getElementById(chartId);
        const postId = chartId.replace('chart-', '');
        const post = allPosts.find(p => p._id === postId);
        if (canvas && post) {
          currentChartType = newType;
          renderPollChart(canvas, post, newType);
        }
      }
    });

    container.appendChild(div);
  });
  currentPostIndex += postsPerPage;

  // Handle "Load More" button
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (currentPostIndex >= filtered.length) {
    loadMoreBtn.style.display = 'none';
  } else {
    loadMoreBtn.style.display = 'inline-block';
  }
}

// Render a chart for poll results
function renderPollChart(canvas, poll, type = "doughnut") {
  if (!canvas || !poll) return;

  const ctx = canvas.getContext('2d');
  const labels = poll.options.map(o => o.label);
  const votes = poll.options.map(o => o.votes);

  // Destroy previous chart instance if exists
  if (canvas.chartInstance) {
    canvas.chartInstance.destroy();
  }

  canvas.chartInstance = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        label: 'Votes',
        data: votes,
        backgroundColor: ['#AEBFF3', '#FAF0A5', '#BEE5B4', '#FAD8E2'],
        borderColor: '#fff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: type !== "bar",
          labels: { font: { size: 12 } }
        }
      },
      scales: type === "bar" ? {
        x: { ticks: { font: { size: 12 } } },
        y: { ticks: { font: { size: 12 }, beginAtZero: true } }
      } : {}
    }
  });
}

// Render a list of user comments
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

// Render user profile information
function renderUser(user) {
  document.getElementById('username').textContent = user.username || 'N/A';
  document.getElementById('email').textContent = user.email || 'N/A';
  document.getElementById('neighbourhood').textContent = user.neighbourhood || 'N/A';
}

// Upload profile picture using a form and update display
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

// Global variables for posts and comments
let allPosts = [];
let allComments = [];

// Main initialization function for profile page
async function init() {
  try {
    const userId = window.profileUserId;
    const isSelf = window.isSelfProfile;
    // Fetch user, their comments, and posts
    const [user, comments, posts] = await Promise.all([
      fetchJson(isSelf ? '/users/me' : `/users/${userId}/json`),
      fetchJson(isSelf ? '/comments/my' : `/comments/users/${userId}`),
      fetchJson(isSelf ? '/posts/me' : `/posts/users/${userId}`)
    ]);

    // Set profile header name
    let profileName = document.getElementById('profile-name');
    profileName.innerText = user.username;

    if (user) {
      renderUser(user);
      document.getElementById('profilePic').src = ' /img/yellowguy.PNG';
    } else {
      document.getElementById('profilePic').src = '/img/yellowguy.PNG';
      document.getElementById('username').textContent = 'Login required';
      document.getElementById('email').textContent = 'N/A';
      document.getElementById('neighbourhood').textContent = 'N/A';
      document.getElementById('uploadMessage').textContent = 'Please log in to update your profile.';
    }

    allPosts = posts || [];
    allComments = comments || [];

    renderPosts(allPosts);
    renderComments(allComments);

    // If it's your own profile, set up profile pic upload
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

    // Tab logic for switching between posts/comments
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
          document.getElementById('loadMoreBtn').style.display = 'none';
          renderComments(allComments);
        } else {
          commentsContainer.style.display = 'none';
          postsContainer.style.display = 'block';
          renderPosts(allPosts, type);
        }
      });
    });

  } catch (err) {
    console.error('Error initializing:', err);
    document.getElementById('username').textContent = 'Login required';
    document.getElementById('email').textContent = 'N/A';
    document.getElementById('neighbourhood').textContent = 'N/A';
    document.getElementById('profilePic').src = '/img/yellowguy.PNG';
    document.getElementById('uploadMessage').textContent = 'Error loading user data. Please try again.';
  }
}

// Randomly position SVG icons for a dynamic background effect
const svgIcons = document.querySelectorAll(".svg-icon");
svgIcons.forEach(icon => {
  icon.style.top = Math.floor(Math.random() * 90) + "vh";
  icon.style.left = Math.floor(Math.random() * 90) + "vw";
  icon.style.position = "absolute";
  icon.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
});

// Load more posts on button click
document.getElementById('loadMoreBtn').addEventListener('click', () => {
  renderPosts(allPosts, currentFilterType, true);
});

// Initialize everything on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);
