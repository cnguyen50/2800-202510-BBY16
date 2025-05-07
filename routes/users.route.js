const express = require('express');
const User    = require('../models/user.model.js');
const requireAuth = require('../middleware/requireAuth.js');

function makeUsersRouter() {
  const router = express.Router();

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

  router.get('/me', requireAuth, async (req,res) => {
    const user = await User.findById(req.session.userId).select('-password');
    if(!user) return res.status(404).json({error: 'Not found'});
    res.json(user);
  })
  
  router.put('/me/location', requireAuth, async (req,res) => {
    const { latitude, longitude } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Invalid coords' });
    }

    try {
      //updating with Mongoose
      const updated = await User.findByIdAndUpdate(
        req.session.user.Id, {
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
