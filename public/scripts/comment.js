// Fetch current user ID once
fetch('/users/me')
    .then(res => res.json())
    .then(user => {
        currentUserId = user._id;
    })
    .catch(err => console.error("Could not fetch user info:", err));

// Add event listener for creating a comment on a post and loading them
document.addEventListener("submit", async (e) => {
    if (e.target.matches(".comment-form")) {
        e.preventDefault();
        const form = e.target;
        const postId = form.closest(".comment-section").dataset.postId;
        const input = form.querySelector("input[name='comment']");
        const content = input.value.trim();
        if (!content) return;

        try {
            const res = await fetch("/comments", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ post_id: postId, content })
            });
            const newComment = await res.json();
            input.value = "";
            loadComments(postId, form.nextElementSibling);
        } catch (err) {
            console.error("Failed to post comment:", err);
        }
    }
});

// Add event listener for like button on comments
document.addEventListener("click", async (e) => {
    if (e.target.closest(".like-btn")) {
        const button = e.target.closest(".like-btn");
        const commentDiv = e.target.closest(".comment");
        const commentId = commentDiv?.dataset?.commentId;

        if (!commentId) {
            console.error("Missing comment ID");
            return;
        }

        try {
            const res = await fetch(`/comments/${commentId}/like`, {
                method: "POST",
                credentials: "include"
            });

            const data = await res.json();
            button.innerHTML = `
            <i class="bi ${data.liked ? 'bi-heart-fill' : 'bi-heart'}"></i> ${data.likesCount}
            `;
        } catch (err) {
            console.error("Failed to like comment:", err);
        }
    }
});

// Function to load comments for a specific post
async function loadComments(postId, container) {
    try {
        const res = await fetch(`/comments/post/${postId}`);
        const comments = await res.json();
        container.innerHTML = comments.map(c => {
            const liked = currentUserId && c.likes.includes(currentUserId);
            return `
            <div class="comment" data-comment-id="${c._id}">
            <strong>@${c.user_id.username}</strong>: ${c.content}
            <button class="like-btn btn">
                <i class="bi ${liked ? 'bi-heart-fill' : 'bi-heart'}"></i> ${c.likes.length}
            </button>
            </div>
        `;
        }).join("");
    } catch (err) {
        console.error("Failed to load comments:", err);
    }
}
