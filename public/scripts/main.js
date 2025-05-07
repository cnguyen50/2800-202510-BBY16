document.addEventListener("DOMContentLoaded", () => {
  fetch("../text/nav.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("navPlaceholder").innerHTML += data;
    })
    .catch(err => console.error("Error loading nav:", err));
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-post-form");
  const postContainer = document.getElementById("post-container");
  const typeSelect = document.getElementById("post-type");
  const showFormBtn = document.getElementById("show-post-form-btn");
  const formSection = document.getElementById("create-post-wrapper");

  showFormBtn.addEventListener("click", () => {
    formSection.style.display = formSection.style.display === "none" ? "block" : "none";
  });
  showFormBtn.textContent = formSection.style.display === "none" ? "Create a Post" : "Hide Post Form";

  // Load existing posts
  fetch("/api/posts")
    .then(res => res.json())
    .then(posts => posts.forEach(renderPost));

  // Submit post
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
