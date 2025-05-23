//fetches the current amount of posts and populates the like button with the response
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("post-container").addEventListener("click", async (event) => {
    const button = event.target.closest(".post-like");
    if (!button) return;
    const postId = button.dataset.id;
    const liked = button.classList.contains("liked");

    try {
      const res = await fetch(`/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        button.classList.toggle("liked");
        button.innerHTML = `<i class="bi ${!liked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}"></i> ${data.likesCount}`;
      } else {
        console.error("Failed to like/unlike post:", res.statusText);
      }
    } catch (err) {
      console.error("Error liking/unliking post:", err);
    }
  });
});

async function loadPostLikes(postId) {
  try {
    const res = await fetch(`/posts/${postId}/like`, {
      method: "GET",
      credentials: "include"
    });
    const data = await res.json();
    const button = document.querySelector(`.post-like[data-id="${postId}"]`);
    if (button) {
        data.liked ? button.classList.add("liked") : button.classList.remove("liked");
    button.innerHTML = `<i class="bi ${data.liked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}"></i> ${data.likesCount}`;
    }

  } catch (err) {
    console.error("Failed to load post likes:", err);
  }
}
