
  
  document.getElementById("post-type").addEventListener("change", (e) => {
    const type = e.target.value;
    const eventFields = document.getElementById("event-fields");
  
    if (type === "event") {
      eventFields.style.display = "block";
    } else {
      eventFields.style.display = "none";
    }
  });
  
  // Post
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("create-post-form");
    const postContainer = document.getElementById("post-container");
    const typeSelect = document.getElementById("post-type");
  
    // Submit post from modal
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
    
      const type = document.getElementById("post-type").value;
      const formData = new FormData();
    
      formData.append("type", type);
      formData.append("content", document.getElementById("post-content").value);
      
      if (type === "event") {
        // Add extra event-related fields
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
        document.getElementById("event-fields").style.display = "none"; // reset visibility
        const modal = bootstrap.Modal.getInstance(document.getElementById("postModal"));
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