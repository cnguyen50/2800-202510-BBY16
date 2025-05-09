// profile.js – ES module
async function fetchJson(url) {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }
  
  function renderUser(user) {
    document.getElementById('username').textContent = user.username;
    document.getElementById('email').textContent = user.email;
    document.getElementById('neighbourhood').textContent = user.neighbourhood;
    
  }
  
  function renderComments(list) {
    const container = document.getElementById('comments-list');
    container.innerHTML = ''; // clear “Loading…”
  
    if (!list.length) {
      container.textContent = 'No comments yet.';
      return;
    }
  
    list.forEach(({ content, created_at, post_id }) => {
      const div = document.createElement('div');
      div.className = 'comment';
      div.innerHTML = `
        <p>${content}</p>
        <time>${new Date(created_at).toLocaleString()}</time>
        ${post_id?.text ? `<p><em>on post:</em> ${post_id.text}</p>` : ''}
      `;
      container.appendChild(div);
    });
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
  
  async function init() {
    try {
      const [user, comments, posts] = await Promise.all([
        fetchJson('/users/me'),
        fetchJson('/comments/my'),
        fetchJson('/posts/me')
      ]);
      renderUser(user);
      renderComments(comments);
      renderPosts(posts);
    } catch (err) {
      console.error(err);
      document.body.innerHTML = `<p style="color:red">Error loading profile. Please log in again.</p>`;
    }
  }
  
  document.addEventListener('DOMContentLoaded', init);
  