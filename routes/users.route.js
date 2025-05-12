const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/user.model.js');
const requireAuth = require('../middleware/requireAuth.js');

function makeUsersRouter() {
  const router = express.Router();

  // Set up storage for Multer (Profile Picture Upload) -- Tom
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}${ext}`;
      cb(null, filename);
    }
  });
  const upload = multer({ storage: storage });

  router.get('/', async (_req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  });

  router.post('/', async (req, res) => {
    try {
      const user = await User.create(req.body);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // POST upload a profile picture - Tom
  router.post('/me/upload', requireAuth, upload.single('profilePic'), async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update profilePic field
      const profilePicUrl = `/uploads/${req.file.filename}`;
      user.profilePic = profilePicUrl;

      // Save user with updated profile picture
      await user.save();

      res.json({
        profilePic: profilePicUrl,
        user: {
          username: user.username,
          email: user.email,
          neighbourhood: user.neighbourhood,
          profilePic: user.profilePic
        }
      });
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      res.status(500).json({ error: 'Server error while uploading picture' });
    }
  });

  router.get('/me', requireAuth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching user data.' });
    }
  });

  router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  });

  router.put('/:id', async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!user) return res.status(404).json({ error: 'Not found' });
      res.json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  });

  return router;
}

module.exports = makeUsersRouter;
