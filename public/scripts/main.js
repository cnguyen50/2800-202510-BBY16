document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-post-form");
  const postContainer = document.getElementById("post-container");

  let type = "news";

  document.getElementById("post-type").addEventListener("change", (e) => {
    type = e.target.value;

    const eventFields = document.getElementById("event-fields");
    const pollFields = document.getElementById("poll-fields");
    const newsFields = document.getElementById("news-fields");
    eventFields.style.display = (type === "event") ? "block" : "none";
    pollFields.style.display = (type === "poll") ? "block" : "none";
    newsFields.style.display = (type === "news") ? "block" : "none";
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

      allPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      offset = 0;

      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Load More";
      document.getElementById("no-more-msg").style.display = "none";

      // Render first batch
      loadMorePosts();
    } catch (err) {
      console.error("Filter failed:", err);
    }
  });

  // Toggle filter window
  document.getElementById('filterTrigger').addEventListener('click', () => {
    const filterBox = document.getElementById('filterOptions');
    filterBox.style.display = (filterBox.style.display === 'none') ? 'block' : 'none';
  });

  // Filter option buttons
  document.querySelectorAll('.filter-option').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-value');
      const select = document.getElementById('post-select');
      select.value = value;
      select.dispatchEvent(new Event('change')); // triggers your main.js logic

      // Close filter window
      document.getElementById('filterOptions').style.display = 'none';

      // Optional: update the trigger button text
      document.getElementById('filterTrigger').textContent = button.textContent;
    });
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

    if (type === 'Poll') {
      const pollText = document.getElementById('poll-text').value.trim();
      const pollOptions = Array.from(document.querySelectorAll('.poll-option'))
        .map(o => o.value.trim())
        .filter(Boolean);                 // drop empty boxes

      formData.append('text', pollText);

      // 👇 send each option as: options[0][label], options[1][label], …
      pollOptions.forEach((label, i) => {
        formData.append(`options[${i}][label]`, label);
      });
    }

    if (type === "News") {
      formData.append("headline", document.getElementById("news-headline").value);
      formData.append("body", document.getElementById("news-body").value);
      formData.append("image_url", document.getElementById("news-image-url").value);
      formData.append("neighborhood", document.getElementById("news-neighborhood").value);


      console.log(formData);
    }

    const fileInput = document.getElementById("post-image");
    if (fileInput.files.length > 0) {
      formData.append("image", fileInput.files[0]);
    }

    try {
      // const endpoint = (type === "Event") ? "/events" : "/posts";

      let endpoint;
      if (type === "Poll") {
        endpoint = "/polls";
      } else if (type === "Event") {
        endpoint = "/events";
      } else {
        endpoint = "/posts";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const newPost = await res.json();
      renderPost(newPost);
      form.reset();
      document.getElementById("event-fields").style.display = "none";
      document.getElementById("poll-fields").style.display = "none";
      document.getElementById("news-fields").style.display = "none";
      const modal = bootstrap.Modal.getInstance(document.getElementById("postModal"));
      modal.hide();
    } catch (err) {
      console.error("Error creating post:", err);
    }
  });

  // Pagination control variables
  let offset = 0;                // Number of posts already displayed
  const limit = 10;              // Number of posts to show per batch
  let allPosts = [];             // Array to store all fetched posts

  // Get reference to the "Load More" button
  const loadMoreBtn = document.getElementById("load-more-btn");

  // Fetch all posts from the server and initialize the feed
  async function fetchAllPosts() {
    try {
      const res = await fetch("/posts", { credentials: "include" });
      const posts = await res.json();

      // Sort posts by newest first
      allPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      loadMorePosts();
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  }

  function loadMorePosts() {
    const nextPosts = allPosts.slice(offset, offset + limit);
    nextPosts.forEach(renderPost);
    offset += limit;

    // Disable button if no more posts
    if (offset >= allPosts.length) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = "No more posts";
      document.getElementById("no-more-msg").style.display = "block";
    }
  }
  // Listen for "Load More" button clicks
  loadMoreBtn.addEventListener("click", loadMorePosts);

  fetchAllPosts();


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

  function renderPoll(post, username, date, typeLabel) {
    const optionsHtml = post.options.map(option => `
      <li>
        <span>${option.label}</span>
        <span class="badge bg-secondary">${option.votes} vote(s)</span>
      </li>
    `).join('');

    return `
      <div class="post-header">
        <strong>@${username}</strong>
        <span class="post-date">${date}</span>
      </div>
      <div class="post-type-label">${typeLabel}</div>
      <p><strong>Poll:</strong> ${post.text}</p>
      <ul class="list-unstyled ps-3">
        ${optionsHtml}
      </ul>
      <a href="/polls/${post._id}/view" class="btn btn-outline-primary btn-sm">Vote or View Results</a>
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

function renderNews(post, username, date, typeLabel) {
  return `
    <div class="post-header">
      <strong>@${username}</strong>
      <span class="post-date">${date}</span>
    </div>
    <div class="post-type-label">${typeLabel}</div>
    <h5>${post.headline}</h5>
    <p>${post.body}</p>
    ${post.image_url ? `<img src="${post.image_url}" class="img-fluid rounded mt-2">` : ""}
    <p><strong>Neighborhood:</strong> ${post.neighborhood || 'N/A'}</p>
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
