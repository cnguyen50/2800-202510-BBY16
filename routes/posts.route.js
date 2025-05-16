const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });
const { Post } = require('../models/post.model.js')
const requireAuth = require('../middleware/requireAuth.js');

function makePostsRouter() {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const type = req.query.type;
    const query = type ? { type } : {}; // ← no filter = return all types

    try {
      const posts = await Post.find(query).sort({ createdAt: -1 }).populate('user_id', 'username');
      res.json(posts);
    } catch (err) {
      console.error("GET /posts error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/me', requireAuth, async (req, res) => {
    const posts = await Post.find({ user_id: req.session.userId }).sort({ createdAt: -1 });
    res.json(posts);
  });

  router.get('/:id/view', async (req, res) => {
    try {
      const post = await Post.findById(req.params.id).populate('user_id', 'username');
      if (!post) return res.status(404).send('Post not found');

      res.render('post', {
        post,
        title: post.title || 'Post Details',  // pass a title for the page
        headerLinks: [],
        footerScripts: []
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });


  router.get('/:id', async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json(post);
  });

  router.put('/:id', async (req, res) => {
    try {
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!post) return res.status(404).json({ error: 'Not found' });
      res.json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Not found' });

      // Delete related comments
      await Comment.deleteMany({ parent_id: post._id });

      // Delete uploaded image file from disk
      if (post.image_url && post.image_url.startsWith('/uploads/')) {
        const imgPath = path.join(__dirname, '../public', post.image_url);
        fs.unlink(imgPath, (err) => {
          if (err) console.warn('Failed to delete image:', imgPath);
        });
      }

      await post.deleteOne(); // or Post.findByIdAndDelete
      res.status(204).end();
    } catch (err) {
      console.error('Error deleting post:', err);
      res.status(500).json({ error: err.message });
    }
  });
  return router;
}

module.exports = makePostsRouter;