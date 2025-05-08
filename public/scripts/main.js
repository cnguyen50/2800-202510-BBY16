const form = document.getElementById("create-post-form");
const postContainer = document.getElementById("post-container");

document.getElementById("post-type").addEventListener("change", (e) => {
  const type = e.target.value;
  const eventFields = document.getElementById("event-fields");
  eventFields.style.display = (type === "event") ? "block" : "none";
});

// Filter
document.getElementById('filter-select').addEventListener('change', async (e) => {
  const filter = e.target.value;
  postContainer.innerHTML = '';

  let endpoint;
  if (filter === 'all') {
    endpoint = '/posts';
  } else if (filter === 'post') {
    endpoint = '/posts?type=post';
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

  const type = document.getElementById("post-type").value;
  const formData = new FormData();

  formData.append("type", type);
  formData.append("content", document.getElementById("post-content").value);

  if (type === "event") {
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
    const res = await fetch("/posts", {
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
    const res = await fetch("/posts", { credentials: "include" });
    const posts = await res.json();
    posts.forEach(post => renderPost(post));
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
  switch (post.type) {
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
    <div class="post-footer">
      <span><i class="bi bi-hand-thumbs-up-fill"></i> 0</span>
      <span><i class="bi bi-chat-dots-fill"></i> 0</span>
      <span><i class="bi bi-share-fill"></i></span>
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
    <p>${post.content}</p>
    <div class="post-footer">
      <span><i class="bi bi-hand-thumbs-up-fill"></i> 0</span>
      <span><i class="bi bi-chat-dots-fill"></i> 0</span>
      <span><i class="bi bi-share-fill"></i></span>
    </div>
  `;
}