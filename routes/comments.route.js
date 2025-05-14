const express = require('express');
const Comment    = require('../models/comment.model.js');
const requireAuth = require('../middleware/requireAuth.js');
const { Post }= require('../models/post.model.js');
const Notification = require('../models/notification.model.js');
const User = require('../models/user.model.js');

function makeCommentsRouter() {
    const router = express.Router();

    router.post('/', requireAuth, async (req,res) => {
        const {post_id, content} = req.body;
        const user_id = req.session.userId;

        try{
            const comment = await Comment.create({post_id, user_id, content});
            const post = await Post.findById(post_id).select('user_id');
            const commenter = await User.findById(user_id).select('username');
            comment
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

                console.log('[emit]', post.user_id.toString(), notification._id.toString());
                req.app.io.to(String(post.user_id)).emit('notification', notification);
            }

            res.status(201).json(comment);
        } catch (error) {
            res.status(400).json({error: error.message});
        }
    })

    router.get('/post/:postId', async (req,res) => {
        const comments = await Comment.find({post_id: req.params.postId}).populate('user_id', 'username').sort({created_at:1});
        res.json(comments);
    });

    router.get('/user/:userId', async(req,res) => {
        const comments = await Comment.find({user_id: req.params.userId}).populate('post_id', 'text').sort({create_at:-1});
        res.json(comments);
    })

    router.get('/my', requireAuth, async (req, res) => {
        const comments = await Comment.find({user_id: req.session.userId}).populate('post_id', 'text').sort({created_at:-1});
        res.json(comments);
    });

    return router;
}

module.exports = makeCommentsRouter;