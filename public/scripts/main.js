document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("create-post-form");
  const locInput = document.getElementById("event-location");
  const suggList = document.getElementById("loc-suggestions");
  const latField = document.getElementById("event-lat");
  const lngField = document.getElementById("event-lng");
  const btn = document.getElementById("refreshBtn");

  // Refresh button
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    location.reload();
  });

  // SVG icons
  let currentUserId;
  let currentUserNeighbourhood
  const postContainer = document.getElementById("post-container");
  const svgIcons = document.querySelectorAll(".svg-icon");

  svgIcons.forEach(icon => {
    icon.style.top = Math.floor(Math.random() * 90) + "vh";   // Random vertical position
    icon.style.left = Math.floor(Math.random() * 90) + "vw";  // Random horizontal position
    icon.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`; // Random rotation

  });

  // Filter Dropdown setup
  const filterTrigger = document.getElementById('filterTrigger');
  const filterBox = document.getElementById('filterOptions');
  const select = document.getElementById('post-select');

  // Toggle dropdown visibility when the trigger is clicked
  filterTrigger.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent outside click from closing immediately
    filterBox.classList.toggle('show'); // Toggle visibility by adding/removing .show class
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!filterBox.contains(e.target) && !filterTrigger.contains(e.target)) {
      filterBox.classList.remove('show');
    }
  });

  // When an option is clicked
  document.querySelectorAll('.filter-option').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-value');
      select.value = value;
      select.dispatchEvent(new Event('change'));
      filterBox.classList.remove('show');
      filterTrigger.textContent = button.textContent;
    });
  });

  postContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-post')) {
      const postId = e.target.getAttribute('data-id');
      // Show a SweetAlert confirmation popup before deleting the post
      Swal.fire({
        title: 'Delete this post?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            // Send DELETE request to the backend to delete the post
            await fetch(`/posts/${postId}`, {
              method: 'DELETE',
              credentials: 'include'
            });

            e.target.closest('.post-card').remove();

            Swal.fire('Deleted!', 'Your post has been deleted.', 'success');
          } catch (err) {
            console.error('Failed to delete post:', err);
            Swal.fire('Error', 'Could not delete post.', 'error');
          }
        }
      });
    }
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
  const fileContainer = document.getElementById("post-image");

  // Show only the fields related to the selected post type and hide others
  eventFields.style.display = (type === "event") ? "block" : "none";
  pollFields.style.display = (type === "poll") ? "block" : "none";
  newsFields.style.display = (type === "news") ? "block" : "none";
  fileContainer.style.display = (type === "poll") ? "none" : "block";
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
    offset = 0;

    // Store for access from Load More
    window.loadedPosts = allPosts;

    // Reset Load More button
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = "Load More";
    document.getElementById("no-more-msg").style.display = "none";

    // Clear post container and show first 10
    postContainer.innerHTML = '';
    loadMorePosts();
  } catch (err) {
    console.error("Filter failed:", err);
  }
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

  formData.append("userNeighbourhood", currentUserNeighbourhood);
    console.log(currentUserNeighbourhood);
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

      //Error handling when submitting
      const errorPopup = document.getElementById("event-date-error-popup");
      const errorPopupMessage = document.getElementById("event-date-error-popup-message");
      function showEventDateError(message) {
        errorPopupMessage.textContent = message;
        errorPopup.style.display = "block";
        errorPopup.classList.remove("show", "hide");
        void errorPopup.offsetWidth;
        errorPopup.classList.add("show");
        setTimeout(() => {
          errorPopup.classList.remove("show");
          errorPopup.classList.add("hide");
          setTimeout(() => {
            errorPopup.style.display = "none";
            errorPopup.classList.remove("hide"); // reset for next use
          }, 500);
        }, 3000);
      }
      // Date validation
      const eventDateInput = document.getElementById("event-date");
      const inputVal = eventDateInput.value;
      if (!inputVal) {
        showEventDateError("Please select a valid event date (today or in the future).");
        return;
      }
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      // Compare input date string with today string
      if (inputVal < todayStr) {
        showEventDateError("Please select a valid event date (today or in the future).");
        return;
      }

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
    formData.append("headline", document.getElementById("news-headline").value.trim());
    console.log(document.getElementById("news-headline").value);
    formData.append("body", document.getElementById("news-body").value.trim());
    console.log(document.getElementById("news-body").value);
    formData.append("image_url", document.getElementById("news-image-url").value.trim());
  }

  console.log([...formData.entries()]);


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
    console.log("Form data before image append:", formData.get('content'), formData.get('body'), formData.get('neighbourhood'));

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
    Swal.fire({
      icon: 'success',
      title: 'Post Created!',
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      location.reload();
    });

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
    div.id = `post-${post._id}`; // add unique ID to each post wrapper to refresh it individually later

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
      
      </div>
     
    </div>

  `;
}

  function renderPoll(post, username, date, typeLabel, userId) {
    const now = Date.now();
    const expired = new Date(post.expires_at) < now;
    const hasVoted = post.voted_user_ids?.includes(currentUserId);

    let pollStateClass = '';
    if (!hasVoted && !expired) {
      pollStateClass = 'poll-unvoted';
    } else if (hasVoted && !expired) {
      pollStateClass = 'poll-voted';
    } else {
      pollStateClass = 'poll-expired';
    }

    let optionsHtml = '';

    if (!hasVoted && !expired) {
      // Show clickable buttons to vote
      optionsHtml = post.options.map(option => `
      <li>
        <button type="button" class="btn btn-outline-primary vote-option"
                data-post-id="${post._id}"
                data-option-id="${option._id}">
          ${option.label}
        </button>
      </li>
    `).join('');
    } else {
      // Show results with vote counts
      optionsHtml = post.options.map(option => `
      <li>
        <span class="poll-label">${option.label}</span>
        <span class="badge bg-secondary">${option.votes} vote(s)</span>
      </li>
    `).join('');
    }

  const chartId = `chart-${post._id}`;

  return `
      <div class="post-header">
        <a href="/users/${userId}" class="text-decoration-none">
        <strong>@${username}</strong>
        <span class="post-date">${date}</span>
      </a>
      </div>
      <div class="post-type-label ${pollStateClass}">${typeLabel}</div>
      <p><strong>Poll:</strong> ${post.text}</p>
      <ul class="list-unstyled ps-3 ${pollStateClass}">
        ${optionsHtml}
      </ul>

      ${hasVoted || expired ? `
      <div class="d-grid gap-2 col-6 mx-auto">
        <button class="btn btn-sm btn-outline-info toggle-chart" data-post-id="${post._id}">Show Chart</button>
      </div>
      
      <div class="chart-controls d-none" data-controls-id="${post._id}">
        <div class="d-flex justify-content-center gap-2 mt-2">
        <button class="btn btn-sm btn-outline-secondary chart-type-btn" data-type="bar" data-chart-id="${chartId}">Bar</button>
        <button class="btn btn-sm btn-outline-secondary chart-type-btn" data-type="pie" data-chart-id="${chartId}">Pie</button>
        <button class="btn btn-sm btn-outline-secondary chart-type-btn" data-type="doughnut" data-chart-id="${chartId}">Doughnut</button>
        </div>
      </div>

      <canvas id="${chartId}" class="mt-3 d-none" height="250"></canvas>
      ` : ''}

      <div class="post-footer">
        <div class="post-actions-left">
          <button class="post-like" data-id="${post._id}">
          <i class="bi bi-hand-thumbs-up-fill"></i> 0
        </button>
        
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

  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('vote-option')) {
      const postId = e.target.dataset.postId;
      const optionId = e.target.dataset.optionId;

      try {
        const res = await fetch(`/polls/${postId}/vote`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optionId })
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "Voting failed");
          return;
        }

        // Update frontend state
        const postIndex = allPosts.findIndex(p => p._id === postId);
        if (postIndex !== -1) {
          const updatedPoll = { ...allPosts[postIndex] };
          const votedOption = updatedPoll.options.find(o => o._id === optionId);
          if (votedOption) votedOption.votes += 1;

          updatedPoll.voted_user_ids.push(currentUserId);
          allPosts[postIndex] = updatedPoll;
          window.loadedPosts = allPosts;

          // Re-render just this one post
          const card = document.getElementById(`post-${postId}`);
          if (card) {
            const username = updatedPoll.user_id?.username || 'Anonymous';
            const date = new Date(updatedPoll.createdAt).toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric"
            });

            card.innerHTML = renderPoll(updatedPoll, username, date, "Poll");
          }
        }

      } catch (err) {
        console.error("Voting failed:", err);
      }
    }
  });

  // Dynamic poll option management
  const optionContainer = document.getElementById('poll-options-container');
  const addOptionBtn = document.getElementById('add-option-btn');

  function updateRemoveButtons() {
    const removeButtons = optionContainer.querySelectorAll('.remove-option');
    removeButtons.forEach(btn => {
      btn.onclick = () => {
        if (optionContainer.children.length > 2) {
          btn.closest('.poll-option-group').remove();
        }
      };
    });
  }

  addOptionBtn.addEventListener('click', () => {
    const count = optionContainer.querySelectorAll('.poll-option-group').length;
    if (count >= 7) return;

    const newOption = document.createElement('div');
    newOption.className = 'input-group mb-2 poll-option-group';
    newOption.innerHTML = `
    <input type="text" class="form-control poll-option" placeholder="Option ${count + 1}" required>
    <button type="button" class="btn btn-outline-danger remove-option">×</button>
  `;
    optionContainer.appendChild(newOption);
    updateRemoveButtons();
  });

  updateRemoveButtons(); // for initial 2 options


  // Instant error handling for calendar
  const eventDateInput = document.getElementById("event-date");
  const eventDateError = document.getElementById("event-date-error");

  if (eventDateInput && eventDateError) {
    eventDateInput.addEventListener("change", () => {
      const inputVal = eventDateInput.value;
      if (!inputVal) {
        eventDateError.classList.remove("d-none");
        return;
      }
      // Convert date strings to YYYY-MM-DD format for easy comparison
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      if (inputVal < todayStr) {
        eventDateError.classList.remove("d-none");
      } else {
        eventDateError.classList.add("d-none");
      }
    });
  }

});
