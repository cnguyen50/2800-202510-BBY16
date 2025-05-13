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

async function loadComments(postId, container) {
    try {
        const res = await fetch(`/comments/post/${postId}`);
        const comments = await res.json();
        container.innerHTML = comments.map(c => `
        <div class="comment"><strong>@${c.user_id.username}</strong>: ${c.content}</div>
        `).join("");
    } catch (err) {
        console.error("Failed to load comments:", err);
    }
}
