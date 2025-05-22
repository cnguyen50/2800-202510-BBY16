document.addEventListener("DOMContentLoaded", () => {

  let currentUserId;
  const postContainer = document.getElementById("post-container");
  const svgIcons = document.querySelectorAll(".svg-icon");

  svgIcons.forEach(icon => {
    icon.style.top = Math.floor(Math.random() * 90) + "vh";   // Random vertical position
    icon.style.left = Math.floor(Math.random() * 90) + "vw";  // Random horizontal position
    icon.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`; // Random rotation
  });


   function shortLocation(loc) {
  const parts = loc.split(',').map(s => s.trim());
    return parts.length >= 3
      ? `${parts[0]}, ${parts[2]}`
      : loc;
  }

  // Pagination control variables
  let offset = 0;                // Number of posts already displayed
  const limit = 10;              // Number of posts to show per batch
  let allPosts = [];             // Array to store all fetched posts

  // Get reference to the "Load More" button
  const loadMoreBtn = document.getElementById("load-more-btn");

  // Fetch all posts from the server and initialize the feed
  async function fetchAllPosts() {
    try {
      const res2 = await fetch('/users/me', { credentials: "include" });
      const user = await res2.json();
 
      const neighbourhood = user.neighbourhood;
  
      const res = await fetch(`/posts/sameNeighbourhood?neighbourhood=${neighbourhood}`, { credentials: "include" });
      const posts = await res.json();

      currentUserId = user._id;
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
    nextPosts.forEach(post => {
 console.log(post.user_id.username);
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

      console.log(post.user_id?.username);
  console.log(post);
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

  function renderEvent(post, username, date, typeLabel) {
    return `
    <div class="post-header">
      <strong>@${username}</strong>
      <span class="post-date">${date}</span>
      <span class="post-neighbourhood">${makeFirstUpperCase(post.userNeighbourhood)}</span>
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

  function renderPoll(post, username, date, typeLabel) {
    const optionsHtml = post.options.map(option => `
      <li>
        <span>${option.label}</span>
        <span class="badge bg-secondary">${option.votes} vote(s)</span>
      </li>
    `).join('');

    const chartId = `chart-${post._id}`;

    return `
      <div class="post-header">
        <strong>@${username}</strong>
        <span class="post-date">${date}</span>
         <span class="post-neighbourhood">${makeFirstUpperCase(post.userNeighbourhood)}</span>
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


  function renderDefault(post, username, date, typeLabel) {
    return `
    <div class="post-header">
      <strong>@${username}</strong>
      <span class="post-date">${date}</span>
       <span class="post-neighbourhood">${makeFirstUpperCase(post.userNeighbourhood)}</span>
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

  function renderNews(post, username, date, typeLabel) {
    return `
    <div class="post-header">
      <strong>@${username}</strong>
      <span class="post-date">${date}</span>
       <span class="post-neighbourhood">${makeFirstUpperCase(post.userNeighbourhood)}</span>
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

  function makeFirstUpperCase(string) {
    let firstLetter = string.charAt(0);
    let firstLetterCap = firstLetter.toUpperCase();
    let remainingLetters = string.slice(1);
    return firstLetterCap + remainingLetters;
  }

});
