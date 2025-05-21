document.addEventListener("DOMContentLoaded", () => {

  const form       = document.getElementById("create-post-form");
  const locInput   = document.getElementById("event-location");
  const suggList   = document.getElementById("loc-suggestions");
  const latField   = document.getElementById("event-lat");
  const lngField   = document.getElementById("event-lng");

  let currentUserId;
  let currentUserNeighbourhood
  const postContainer = document.getElementById("post-container");
  const svgIcons = document.querySelectorAll(".svg-icon");

  svgIcons.forEach(icon => {
    icon.style.top = Math.floor(Math.random() * 90) + "vh";   // Random vertical position
    icon.style.left = Math.floor(Math.random() * 90) + "vw";  // Random horizontal position
    icon.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`; // Random rotation
  });


  // Add a change event listener to the dropdown/select element for post type
  document.getElementById("post-type").addEventListener("change", (e) => {
    type = e.target.value;

    let debounceTimer;

    // ─── Autocomplete for event-location ───
    locInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      const q = locInput.value.trim();

      if (!q) {
        suggList.innerHTML = "";
        return;
      }

      debounceTimer = setTimeout(async () => {
        const params = new URLSearchParams({
          format: "jsonv2",
          q,
          limit: "5",
          countrycodes: "ca",
        });

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
          const list = await res.json();
          suggList.innerHTML = list.map(place =>
            `<li data-lat="${place.lat}" data-lon="${place.lon}">
              ${place.display_name.trim()}
            </li>`
          ).join("");

        } catch (err) {
          console.error("Autocomplete error:", err);
        }
      }, 300);
  });

  suggList.addEventListener("click", (e) => {
    if (e.target.tagName === "LI") {
      locInput.value = e.target.textContent.trim();
      latField.value = e.target.dataset.lat;
      lngField.value = e.target.dataset.lon;
      suggList.innerHTML = "";

      console.log("Selected location:", locInput.value);
    }
  });
})

  //helper function to shorten location data
  function shortLocation(loc) {
  const parts = loc.split(',').map(s => s.trim());
    return parts.length >= 3
      ? `${parts[0]}, ${parts[2]}`
      : loc;
  }

  document.getElementById("post-type").addEventListener("change", (e) => {
    type = e.target.value;

    const eventFields = document.getElementById("event-fields");
    const pollFields = document.getElementById("poll-fields");
    const newsFields = document.getElementById("news-fields");

    // Show only the fields related to the selected post type and hide others
    eventFields.style.display = (type === "event") ? "block" : "none";
    pollFields.style.display = (type === "poll") ? "block" : "none";
    newsFields.style.display = (type === "news") ? "block" : "none";
  });

  // Add event listener to the main post filter dropdown
  document.getElementById('post-select').addEventListener('change', async (e) => {
    const filter = e.target.value;
    // Clear the current post container so new filtered posts can be rendered
    postContainer.innerHTML = '';

    const typeMap = {
      event: 'Event',
      poll: 'Poll',
      news: 'News'
    };

    let endpoint;
    if (filter === 'all') {
      endpoint = '/posts';
    } else if (filter === 'news') {
      endpoint = '/news';
    } else {
      endpoint = `/${filter}s`;
    }

    try {
      const res = await fetch(endpoint, { credentials: "include" });

      const posts = await res.json();

      // Sort posts by creation date (newest first)
      allPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      // Reset offset (for pagination/load more logic)
      offset = 0;

      // Reset "Load More" button to visible and enabled state
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = "Load More";
      // Hide the "no more posts" message
      document.getElementById("no-more-msg").style.display = "none";

      // Render first batch
      loadMorePosts();
    } catch (err) {
      console.error("Filter failed:", err);
    }
  });

  // Add click event listener to the filter trigger button to show/hide the filter menu)
  document.getElementById('filterTrigger').addEventListener('click', () => {
    const filterBox = document.getElementById('filterOptions');
    filterBox.style.display = (filterBox.style.display === 'none') ? 'block' : 'none';
  });

  // Add click event listeners to all filter option buttons inside the filter box
  document.querySelectorAll('.filter-option').forEach(button => {
    button.addEventListener('click', () => {
      // Get the value associated with the clicked filter button (from data-value attribute)
      const value = button.getAttribute('data-value');
      // Set the value of the main select element
      const select = document.getElementById('post-select');
      select.value = value;
      select.dispatchEvent(new Event('change')); // triggers main.js logic

      // Close filter window
      document.getElementById('filterOptions').style.display = 'none';

      // Optional: update the trigger button text
      document.getElementById('filterTrigger').textContent = button.textContent;
    });
  });


  // Submit post from modal
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    const type = document.getElementById("post-type").value;

    //getting neighbourhood from profile
    const meRes = await fetch('/users/me', { credentials: 'include' });
    if (!meRes.ok) throw new Error('Not authenticated');
    const { neighbourhood } = await meRes.json();

    const rawType = document.getElementById("post-type").value.trim();

    formData.append("content", document.getElementById("post-content").value.trim());

    formData.append("userNeighbourhood", currentUserNeighbourhood);
    if (type === "event") {
      formData.append("event_name", document.getElementById("event-name").value.trim());
      const day = document.getElementById('event-date').value.trim();  // '2025-05-20'
      formData.append('event_date', day ? `${day}T23:59` : ''); // → '2025-05-20T23:59'
      // formData.append("location", document.getElementById("event-location").value);
      formData.append("description", document.getElementById("event-description").value.trim());
      formData.append("neighbourhood", neighbourhood.trim());
      formData.append("location", locInput.value.trim());
      formData.append("lat", latField.value.trim());
      formData.append("lng", lngField.value.trim());

    } else if (type === "poll") {
      const pollText = document.getElementById('poll-text').value.trim();
      const pollOptions = Array.from(document.querySelectorAll('.poll-option'))
        .map(o => o.value.trim())
        .filter(Boolean);
      
      formData.append('text', pollText);
      pollOptions.forEach((label, i) => {
        formData.append(`options[${i}][label]`, label);
      });

    } else if (type === "news") {
      formData.append("headline", document.getElementById("news-headline").value);
      console.log(document.getElementById("news-headline").value);
      formData.append("body", document.getElementById("news-body").value);
      console.log(document.getElementById("news-body").value);
      formData.append("image_url", document.getElementById("news-image-url").value);
    }

    console.log("Form data before image append:", formData.get('content'), formData.get('body'), formData.get('neighborhood'));

    const fileInput = document.getElementById("post-image");
    if (fileInput.files.length > 0) {
      formData.append("image", fileInput.files[0]);
    }

    try {
      // const endpoint = (type === "Event") ? "/events" : "/posts";

      let endpoint;
      if (type === "poll") {
        endpoint = "/polls";
      } else if (type === "event") {
        endpoint = "/events";
      } else if (type === "news") {
        endpoint = "/news";
      }

      console.log(endpoint);
      console.log(type);

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Unknown server error');
      }

      const newPost = await res.json();
      renderPost(newPost, currentUserId);

      form.reset();
      document.getElementById("event-fields").style.display = "none";
      document.getElementById("poll-fields").style.display = "none";
      document.getElementById("news-fields").style.display = "none";
      const postModal = new bootstrap.Modal(document.getElementById('postModal'));
      postModal.hide();
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

      const res2 = await fetch('/users/me', { credentials: "include" });
      const user = await res2.json();
      currentUserId = user._id;
      currentUserNeighbourhood = user.neighbourhood;
      console.log(currentUserId);
      // Sort posts by newest first
      allPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // make allPosts available globally for charts to access
      window.loadedPosts = posts;

      loadMorePosts();
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  }

  function loadMorePosts() {
    const nextPosts = allPosts.slice(offset, offset + limit);
    console.log(currentUserId);
    nextPosts.forEach(post => {

      renderPost(post, currentUserId)
    });
    offset += limit;

    // Disable button if no more posts
    if (offset >= allPosts.length) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = "No more posts";
      document.getElementById("no-more-msg").style.display = "block";
    }
  }

  loadMoreBtn.addEventListener("click", () => loadMorePosts(currentUserId));

  fetchAllPosts();


  // Renderers by type
  function renderPost(post, currentUserId) {
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
    const userId = post.user_id?._id || 'Unknown';
    
    let html = "";
    switch (post.type?.toLowerCase()) {
      case "event":
        html = renderEvent(post, username, date, typeLabel, userId); break;
      case "news":
        html = renderNews(post, username, date, typeLabel, userId); break;
      case "poll":
        html = renderPoll(post, username, date, typeLabel, userId); break;
      default:
        html = renderDefault(post, username, date, typeLabel, userId); break;
    }

    console.log(currentUserId);

    if (post.user_id?._id === currentUserId) {
      html += `
        <div class="text-end mt-2">
          <button class="btn delete-post" data-id="${post._id}">Delete</button>
        </div>
      `;
    }

    div.innerHTML = html;

    const commentHtml = `
    <div class="comment-section" data-post-id="${post._id}">
      <form class="comment-form mt-2">
        <input type="text" class="form-control mb-2" name="comment" placeholder="Write a comment..." required>
        <button type="submit" class="btn btn-outline-secondary btn-sm">Post</button>
      </form>
      <div class="comments-list"></div>
    </div>
  `;

    
    div.innerHTML += commentHtml;
    loadComments(post._id, div.querySelector(".comments-list"));
    loadPostLikes(post._id);
    document.getElementById("post-container").appendChild(div);

  }

  function renderEvent(post, username, date, typeLabel, userId) {
    
    return `
    <div class="post-header">
      <a href="/users/${userId}" class="text-decoration-none">
        <strong>@${username}</strong>
        <span class="post-date">${date}</span>
      </a>
    </div>
    <div class="post-type-label">${typeLabel}</div>
    <p><strong>${post.event_name}</strong> — <em>${new Date(post.event_date).toLocaleDateString()}</em></p>
    <p><strong>Location:</strong> ${shortLocation(post.location)}</p>
    <p>${post.description}</p>
    ${post.image_url ? `<img src="${post.image_url}" class="img-fluid rounded mt-2">` : ""}
    <div class="post-footer">
      <div class="post-actions-left">
        <button class="post-like" data-id="${post._id}">
          <i class="bi bi-hand-thumbs-up"></i> 0
        </button>
        <span><i class="bi bi-share-fill"></i></span>
      </div>
      <div class="post-bookmark">
        <span><i class="bi bi-bookmark-fill"></i></span>
      </div>
    </div>

  `;
  }

  function renderPoll(post, username, date, typeLabel, userId) {
    const optionsHtml = post.options.map(option => `
      <li>
        <span>${option.label}</span>
        <span class="badge bg-secondary">${option.votes} vote(s)</span>
      </li>
    `).join('');

    const chartId = `chart-${post._id}`;

    return `
      <div class="post-header">
       <a href="/users/${userId}" class="text-decoration-none">
        <strong>@${username}</strong>
        <span class="post-date">${date}</span>
      </a>
      </div>
      <div class="post-type-label">${typeLabel}</div>
      <p><strong>Poll:</strong> ${post.text}</p>
      <ul class="list-unstyled ps-3">
        ${optionsHtml}
      </ul>

      <button class="btn btn-sm btn-outline-primary toggle-chart" data-post-id="${post._id}">Show Chart</button>
      <div class="chart-controls d-none" data-controls-id="${post._id}">
      <button class="btn btn-sm btn-outline-secondary chart-type-btn" data-type="bar" data-chart-id="${chartId}">Bar</button>
      <button class="btn btn-sm btn-outline-secondary chart-type-btn" data-type="pie" data-chart-id="${chartId}">Pie</button>
      <button class="btn btn-sm btn-outline-secondary chart-type-btn" data-type="doughnut" data-chart-id="${chartId}">Doughnut</button>
      </div>

      <canvas id="${chartId}" class="mt-3 d-none" height="250"></canvas>

      <a href="/polls/${post._id}/view" class="btn btn-outline-primary btn-sm">Vote or View Results</a>

      <div class="post-footer">
        <div class="post-actions-left">
          <button class="post-like" data-id="${post._id}">
          <i class="bi bi-hand-thumbs-up-fill"></i> 0
        </button>
          <span><i class="bi bi-share"></i></span>
        </div>
        <div class="post-bookmark">
          <span><i class="bi bi-bookmark-fill"></i></span>
        </div>
      </div>
    `;
  }


  function renderDefault(post, username, date, typeLabel, userId) {
    return `
    <div class="post-header">
     <a href="/users/${userId}" class="text-decoration-none">
      <strong>@${username}</strong>
      <span class="post-date">${date}</span>
    </a>
    </div>
    <div class="post-type-label">${typeLabel}</div>
    ${post.image_url ? `<img src="${post.image_url}" class="img-fluid rounded mt-2">` : ""}
    <div class="post-footer">
      <div class="post-actions-left">
        <button class="post-like" data-id="${post._id}">
          <i class="bi bi-hand-thumbs-up"></i> 0
        </button>
        <span><i class="bi bi-share-fill"></i></span>
      </div>
      <div class="post-bookmark">
        <span><i class="bi bi-bookmark-fill"></i></span>
      </div>
    </div>
  `;
  }

  function renderNews(post, username, date, typeLabel, userId) {
    return `
    <div class="post-header">
     <a href='/users/${userId}' class="text-decoration-none">
      <strong>@${username}</strong>
      <span class="post-date">${date}</span>
    </a>
    </div>
    <div class="post-type-label">${typeLabel}</div>
    <h5>${post.headline}</h5>
    <p>${post.body}</p>
    ${post.image_url ? `<img src="${post.image_url}" class="img-fluid rounded mt-2">` : ""}
    <p><strong>Neighborhood:</strong> ${post.neighborhood || 'N/A'}</p>
    <div class="post-footer">
      <div class="post-actions-left">
        <button class="post-like" data-id="${post._id}">
          <i class="bi bi-hand-thumbs-up"></i> 0
        </button>
        <span><i class="bi bi-share-fill"></i></span>
      </div>
      <div class="post-bookmark">
        <span><i class="bi bi-bookmark-fill"></i></span>
      </div>
    </div>
  `;
  }

  postContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-post')) {
      const postId = e.target.getAttribute('data-id');
      if (!confirm('Are you sure you want to delete this post?')) return;

      try {
        await fetch(`/posts/${postId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        // Remove the post element from the DOM
        e.target.closest('.post-card').remove();
      } catch (err) {
        console.error('Failed to delete post:', err);
        alert('Could not delete post.');
      }
    }
  })
});
