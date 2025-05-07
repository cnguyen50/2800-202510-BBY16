const express = require('express');
const Post = require('../models/post.model.js');
const requireAuth = require('../middleware/requireAuth');
const multer = require('multer');
const upload = multer({ dest: './public/image/' });

function makePostsRouter() {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  });

  router.post('/', requireAuth, upload.single('image'), async (req, res) => {
    try {
      const postData = {
        user_id: req.user._id,
        content: req.body.content,
        type: req.body.type,
        image_url: req.file ? `/image/${req.file.filename}` : undefined
      };
  
      const post = await Post.create(postData);
      res.status(201).json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
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

  router.delete('/:id', async (req, res) => {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  });

  return router;
}

module.exports = makePostsRouter;
