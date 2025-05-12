const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/user.model.js');
const requireAuth = require('../middleware/requireAuth.js');

function makeUsersRouter() {
  const router = express.Router();

  // Multer storage setup for profile picture uploads (Tom's addition)
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

  // GET all users
  router.get('/', async (_req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  });

  // POST create new user
  router.post('/', async (req, res) => {
    try {
      const user = await User.create(req.body);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // GET logged-in user's profile
  router.get('/me', requireAuth, async (req, res) => {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
<<<<<<< HEAD
  })
  
  router.put('/me/location', requireAuth, async (req,res) => {
=======
  });

  // PUT update logged-in user's location
  router.put('/me/location', requireAuth, async (req, res) => {
>>>>>>> Tommy
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Invalid coords' });
    }

    try {
<<<<<<< HEAD
      //updating with Mongoose
      const updated = await User.findByIdAndUpdate(
        req.session.userId, {
=======
      const updated = await User.findByIdAndUpdate(
        req.session.userId,
        {
>>>>>>> Tommy
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        },
        {
          new: true,
          select: 'location'
        }
<<<<<<< HEAD
      )

      // Error handle if user isn't found
      if (!updated) {
        return res.status(404).json({ error: 'User not found' })
      }

      //Return updated location
      return res.json({ location: updated.location })
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  })

=======
      );

      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ location: updated.location });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST upload profile picture (Tom's feature)
  router.post('/me/upload', requireAuth, upload.single('profilePic'), async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const profilePicUrl = `/uploads/${req.file.filename}`;
      user.profilePic = profilePicUrl;

      await user.save();

      res.json({
        profilePic: `/uploads/${req.file.filename}`,
        user
      });
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      res.status(500).json({ error: 'Server error while uploading picture' });
    }
  });

  // GET user by ID
>>>>>>> Tommy
  router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  });

  // PUT update user by ID
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

  // DELETE user by ID
  router.delete('/:id', async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  });

  return router;
}

module.exports = makeUsersRouter;
