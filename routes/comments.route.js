const express = require('express');
const Comment = require('../models/comment.model.js');
const requireAuth = require('../middleware/requireAuth.js');
const { Post }= require('../models/post.model.js');
const Notification = require('../models/notification.model.js');
const User = require('../models/user.model.js');

function makeCommentsRouter() {
    const router = express.Router();

    router.post('/', requireAuth, async (req, res) => {
        const { post_id, content } = req.body;
        const user_id = req.session.userId;

        try{
            const comment = await Comment.create({post_id, user_id, content});
            const post = await Post.findById(post_id).select('user_id');
            const commenter = await User.findById(user_id).select('username');
  
            if(post && String(post.user_id) !== String(user_id)) {
                const notification = await Notification.create({
                    user_id: post.user_id,
                    type: 'comment',
                    data: {
                        post_id,
                        comment_id: comment._id,
                        content,
                        from_user_id : user_id,
                        from_username: commenter.username,
                    }
                })

              
                req.app.io.to(String(post.user_id)).emit('notification', notification);
            }

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

    router.get('/users/:userId', async (req, res) => {
        const comments = await Comment.find({ user_id: req.params.userId }).populate('post_id', 'title headline event_name text').sort({ create_at: -1 });
        //console.log(comments);
        res.json(comments);
    })

    router.get('/my', requireAuth, async (req, res) => {
        const comments = await Comment.find({ user_id: req.session.userId }).populate('post_id', 'title headline event_name text').sort({ created_at: -1 });
        res.json(comments);
    });

    return router;
}

module.exports = makeCommentsRouter;