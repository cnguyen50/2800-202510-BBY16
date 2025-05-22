const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/user.model.js');
const requireAuth = require('../middleware/requireAuth.js');
const fs = require('fs');

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
  })

  // purely-JSON version
  router.get('/:id/json', async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  });

  
  router.put('/me/location', requireAuth, async (req,res) => {
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Invalid coords' });
    }

    try {
      //updating with Mongoose
      const updated = await User.findByIdAndUpdate(
        req.session.userId, {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        },
        {
          new: true,
          select: 'location'
        }
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

    router.put('/me/neighbourhood', requireAuth, async (req, res) => {
    const { neighbourhood } = req.body;
    if (typeof neighbourhood !== 'string') {
      return res.status(400).json({ error: 'neighbourhood must be a string' });
    }
    try {
      const user = await User.findByIdAndUpdate(
        req.session.userId,
        { neighbourhood },
        { new: true, select: '-password' }
      );
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      console.error('Error updating neighbourhood:', err);
      res.status(500).json({ error: 'Server error' });
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
  router.get('/:id', async (req, res) => {
    //console.log('Fetching user with ID:', req.params.id);
    const user = await User.findById(req.params.id);
    console.log('Fetched user:', user);
    if (!user) return res.status(404).json({ error: 'Not found' });
      const svgDir = path.join(process.cwd(), './public/img/svg/');
            fs.readdir(svgDir, (err, files) => {
              if (err) {
                console.error('Failed to load SVGs', err);
                // Optionally, still render with empty svgs array or handle error page
                return res.status(500).send('Server error loading SVGs');
              }
    
              const svgs = files.filter(file => file.endsWith('.svg'));
              const shuffled = svgs.sort(() => 0.5 - Math.random());
              const count = Math.floor(Math.random() * 6) + 5; // between 5 and 10
              const selectedSvgs = shuffled.slice(0, count);
    
              res.render('profile', {
                title: 'Profile',
                headerLinks: [
                  { rel: 'stylesheet', href: '/styles/loggedIn.css' },
                  { rel: 'stylesheet', href: '/styles/profile.css' }
                ],
                footerScripts: [
                  { src: '/scripts/profile.js', type: 'module' },
                  { src: '/scripts/comment.js' },
                  { src: '/scripts/pollChart.js' }
                ],
                user,  // Pass the user object to the EJS template
                svgs: selectedSvgs, // Pass svgs here so your EJS template can use it
                viewingOtherUser: true  // Flag to indicate if viewing own profile
              });
            });
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
