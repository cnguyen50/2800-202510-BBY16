const express = require('express');
const Comment = require('../models/comment.model.js');
const requireAuth = require('../middleware/requireAuth.js');

function makeCommentsRouter() {
    const router = express.Router();

    router.post('/', requireAuth, async (req, res) => {
        const { post_id, content } = req.body;
        const user_id = req.session.userId;

        try {
            const comment = await Comment.create({ post_id, user_id, content });
            res.status(201).json(comment);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    })

    // Adding like functionality to comments
    router.post('/:id/like', requireAuth, async (req, res) => {
        try {
            const comment = await Comment.findById(req.params.id);
            const userId = req.session.userId;

            if (!comment) return res.status(404).json({ error: 'Comment not found' });

            // Check if the user has already liked this comment
            const alreadyLiked = comment.likes.some(id => id.equals(userId));

            if (alreadyLiked) {
                comment.likes = comment.likes.filter(id => !id.equals(userId)); // unlike
            } else {
                comment.likes.push(userId); // like
            }

            await comment.save();

            res.json({ likesCount: comment.likes.length, liked: !alreadyLiked });
        } catch (err) {
            console.error("Like error:", err);  // Log actual error to terminal
            res.status(500).json({ error: err.message });
        }
    });



    router.get('/post/:postId', async (req, res) => {
        const comments = await Comment.find({ post_id: req.params.postId }).populate('user_id', 'username').sort({ created_at: 1 });
        res.json(comments);
    });

    router.get('/user/:userId', async (req, res) => {
        const comments = await Comment.find({ user_id: req.params.userId }).populate('post_id', 'text').sort({ create_at: -1 });
        res.json(comments);
    })

    router.get('/my', requireAuth, async (req, res) => {
        const comments = await Comment.find({ user_id: req.session.userId }).populate('post_id', 'text').sort({ created_at: -1 });
        res.json(comments);
    });

    return router;
}

module.exports = makeCommentsRouter;