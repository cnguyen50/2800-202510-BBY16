const eventForm = document.getElementById("create-event-form");

document.addEventListener("DOMContentLoaded", () => {
  fetch("../text/nav.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("navPlaceholder").innerHTML += data;
    })
    .catch(err => console.error("Error loading nav:", err));
});

// Post
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-post-form");
  const postContainer = document.getElementById("post-container");
  const typeSelect = document.getElementById("post-type");

  // Load existing posts
  // Submit post from modal
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = document.getElementById("post-content").value;
    const type = document.getElementById("post-type").value;

    const postData = {
      user_id: "guest", // temporary or replace with actual user
      content,
      type
    };

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData)
      });

      const newPost = await res.json();
      renderPost(newPost);
      form.reset();

      // Hide modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('postModal'));
      modal.hide();
    } catch (err) {
      console.error("Error creating post:", err);
    }
  });

  function renderPost(post) {
    const div = document.createElement("div");
    div.classList.add("post-card");

    let typeLabel = {
      news: "📰 News",
      event: "📅 Event",
      post: "💬 Post"
    }[post.type] || post.type;

    div.innerHTML = `
      <div class="post-header">
        <strong>${post.user_id}</strong> — <span class="badge bg-secondary">${typeLabel}</span><br>
        <small>${new Date(post.created_at).toLocaleString()}</small>
      </div>
      <p>${post.content}</p>
    `;

    postContainer.prepend(div);
  }
});

// Event
eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const eventData = {
    user_id: "guest", // Replace with actual logged-in user ID
    event_name: document.getElementById("event-name").value,
    event_date: document.getElementById("event-date").value,
    location: document.getElementById("event-location").value,
    description: document.getElementById("event-description").value
  };

  try {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData)
    });

    if (!res.ok) throw new Error("Event creation failed");

    // Hide modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('eventModal'));
    modal.hide();
    eventForm.reset();

    // Optionally: alert or refresh event feed
    alert("Event created!");
  } catch (err) {
    console.error(err);
    alert("Something went wrong while creating the event.");
  }
});

