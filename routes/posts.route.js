const express = require('express');
const {Post} = require('../models/post.model.js')
const requireAuth = require('../middleware/requireAuth.js');

function makePostsRouter() {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const type = req.query.type;
    const query = type ? { type } : {}; // ← no filter = return all types
  
    try {
      const posts = await Post.find(query).sort({ createdAt: -1 }).limit(10).populate('user_id', 'username');
      res.json(posts);
    } catch (err) {
      console.error("GET /posts error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
      const post = await Post.create({...req.body, type: 'post', user_id: req.session.userId});
      res.status(201).json(post);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/me', requireAuth, async (req,res) => {
    const posts = await Post.find({user_id: req.session.userId}).sort({createdAt: -1});
    res.json(posts);
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
