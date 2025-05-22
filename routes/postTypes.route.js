// routes/makeTypedRouter.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const Comment = require('../models/comment.model.js');
const upload = multer({ dest: 'public/uploads/' });
const requireAuth = require('../middleware/requireAuth.js');

module.exports = function makeTypedRouter(Model) {
  const router = express.Router();

  // LIST  /events  /polls  /news
  router.get('/', async (_req, res) => {
    const docs = await Model.find().sort({ createdAt: -1 }).populate('user_id', 'username');
    res.json(docs);
  });

  // CREATE
  router.post('/', upload.single('image'), requireAuth, async (req, res) => {
    try {
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;

      const doc = await Model.create({
        ...req.body,
        user_id: req.session.userId,
        neighbourhood: req.session.neighbourhood,
        image_url
      });


      res.status(201).json(doc);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // READ ONE
  router.get('/:id', async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  });

  // UPDATE
  router.put('/:id', requireAuth, async (req, res) => {
    try {
      const doc = await Model.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE
  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const post = await Model.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Not found' });

      await Comment.deleteMany({ parent_id: post._id });

      if (post.image_url && post.image_url.startsWith('/uploads/')) {
        const imgPath = path.join(__dirname, '../public', post.image_url);
        try {
          await fs.unlink(imgPath);
        } catch (err) {
          console.warn('Failed to delete image:', imgPath, err.message);
        }
      }

      await mongoose.model(post.constructor.modelName).deleteOne({ _id: post._id });

      res.status(204).end();
    } catch (err) {
      console.error('Error deleting typed post:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/sameNeighbourhood', requireAuth, async (req, res) => {
  });

  return router;
};
