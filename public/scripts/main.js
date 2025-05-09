document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-post-form");
  const postContainer = document.getElementById("post-container");

  document.getElementById("post-type").addEventListener("change", (e) => {
    const type = e.target.value;
    const eventFields = document.getElementById("event-fields");
    eventFields.style.display = (type === "event") ? "block" : "none";
  });

  // Filter
  document.getElementById('post-select').addEventListener('change', async (e) => {
    const filter = e.target.value;
    postContainer.innerHTML = '';

    const typeMap = {
      event: 'Event',
      poll: 'Poll',
      news: 'News'
    };

    let endpoint;
    if (filter === 'all') {
      endpoint = '/posts';
    } else {
      endpoint = `/${filter}s`;
    }

    try {
      const res = await fetch(endpoint, { credentials: "include" });
      const posts = await res.json();
      posts.slice(0, 10).forEach(renderPost);
    } catch (err) {
      console.error("Filter failed:", err);
    }
  });

  // Submit post from modal
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const rawType = document.getElementById("post-type").value;
    const typeMap = {
      post: "Post",
      event: "Event",
      poll: "Poll",
      news: "News"
    };

    const type = typeMap[rawType];
    const formData = new FormData();

    formData.append("type", type);
    formData.append("content", document.getElementById("post-content").value);

    if (type === "Event") {
      formData.append("event_name", document.getElementById("event-name").value);
      formData.append("event_date", document.getElementById("event-date").value);
      formData.append("location", document.getElementById("event-location").value);
      formData.append("description", document.getElementById("event-description").value);
    }

    const fileInput = document.getElementById("post-image");
    if (fileInput.files.length > 0) {
      formData.append("image", fileInput.files[0]);
    }

    try {
      const endpoint = (type === "Event") ? "/events" : "/posts";

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const newPost = await res.json();
      renderPost(newPost);
      form.reset();
      document.getElementById("event-fields").style.display = "none";
      const modal = bootstrap.Modal.getInstance(document.getElementById("postModal"));
      modal.hide();
    } catch (err) {
      console.error("Error creating post:", err);
    }
  });

  async function loadPosts() {
    try {
      const [postsRes, eventsRes, pollsRes, newsRes] = await Promise.all([
        fetch("/posts", { credentials: "include" }),
        fetch("/events", { credentials: "include" }),
        fetch("/polls", { credentials: "include" }),
        fetch("/news", { credentials: "include" })
      ]);

      const posts = await postsRes.json();
      const events = await eventsRes.json();
      const polls = await pollsRes.json();
      const news = await newsRes.json();

      const allPosts = [...posts, ...events, ...polls, ...news];

      // Sort by newest date
      allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      allPosts.forEach(post => renderPost(post));
    } catch (err) {
      console.error("Failed to load posts:", err);
    }
  }

  loadPosts();

  // Renderers by type
  function renderPost(post) {
    const div = document.createElement("div");
    div.classList.add("post-card", `post-${post.type}`);

    const typeLabel = {
      event: "Event",
      post: "Post",
      poll: "Poll",
      news: "News"
    }[post.type] || post.type;

    const date = new Date(post.createdAt).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });

    const username = post.user_id?.username || 'Anonymous';

    let html = "";
    switch (post.type?.toLowerCase()) {
      case "event":
        html = renderEvent(post, username, date, typeLabel); break;
      case "news":
        html = renderNews(post, username, date, typeLabel); break;
      case "poll":
        html = renderPoll(post, username, date, typeLabel); break;
      default:
        html = renderDefault(post, username, date, typeLabel); break;
    }

    div.innerHTML = html;
    document.getElementById("post-container").appendChild(div);
  }

  function renderEvent(post, username, date, typeLabel) {
    return `
    <div class="post-header">
      <strong>@${username}</strong>
      <span class="post-date">${date}</span>
    </div>
    <div class="post-type-label">${typeLabel}</div>
    <p><strong>${post.event_name}</strong> — <em>${new Date(post.event_date).toLocaleDateString()}</em></p>
    <p><strong>Location:</strong> ${post.location}</p>
    <p>${post.description}</p>
    ${post.image_url ? `<img src="${post.image_url}" class="img-fluid rounded mt-2">` : ""}
    <div class="post-footer">
      <div class="post-actions-left">
        <span><i class="bi bi-hand-thumbs-up-fill"></i> 0</span>
        <span><i class="bi bi-chat-dots-fill"></i> 0</span>
        <span><i class="bi bi-share-fill"></i></span>
      </div>
      <div class="post-bookmark">
        <span><i class="bi bi-bookmark-fill"></i></span>
      </div>
    </div>

  `;
  }

  function renderDefault(post, username, date, typeLabel) {
    return `
    <div class="post-header">
      <strong>@${username}</strong>
      <span class="post-date">${date}</span>
    </div>
    <div class="post-type-label">${typeLabel}</div>
    ${post.image_url ? `<img src="${post.image_url}" class="img-fluid rounded mt-2">` : ""}
    <div class="post-footer">
      <div class="post-actions-left">
        <span><i class="bi bi-hand-thumbs-up-fill"></i> 0</span>
        <span><i class="bi bi-chat-dots-fill"></i> 0</span>
        <span><i class="bi bi-share-fill"></i></span>
      </div>
      <div class="post-bookmark">
        <span><i class="bi bi-bookmark-fill"></i></span>
      </div>
    </div>
  `;
  }
});
