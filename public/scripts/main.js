document.addEventListener("DOMContentLoaded", () => {
  fetch("../text/nav.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("navPlaceholder").innerHTML += data;
    })
    .catch(err => console.error("Error loading nav:", err));
});

document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/posts")
    .then(res => res.json())
    .then(posts => {
      const container = document.getElementById("post-container");

      if (posts.length === 0) {
        container.innerHTML = "<p>No posts available yet.</p>";
        return;
      }

      posts.forEach(post => {
        const postElement = document.createElement("div");
        postElement.classList.add("post-card");

        postElement.innerHTML = `
          <div class="post-header">
            <strong>User:</strong> ${post.user_id}<br />
            <small>${new Date(post.created_at).toLocaleString()}</small>
          </div>
          <p class="post-content">${post.content}</p>
          <div class="post-footer">
            <span class="post-type">Type: ${post.type}</span>
          </div>
        `;

        container.appendChild(postElement);
      });
    })
    .catch(err => {
      console.error("Failed to fetch posts:", err);
      document.getElementById("post-container").innerHTML =
        "<p>Failed to load posts. Please try again later.</p>";
    });
});
