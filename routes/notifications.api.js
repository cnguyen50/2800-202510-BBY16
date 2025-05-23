// routes/notifications.api.js
const express = require('express');
const router  = express.Router();
const Notification = require('../models/notification.model.js');

router.get('/', async (req, res) => {
  const list = await Notification
    .find({ user_id: req.session.userId })
    .sort({ created_at: -1 })
    .limit(50);
  res.json(list);
});

router.patch('/:id/read', async (req, res) => {
 const ONE_DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  await Notification.findByIdAndUpdate(req.params.id, {
    read: true, 
    read_at: now,
    expire_at: new Date(now.getTime() + ONE_DAY)
  });
  res.sendStatus(204);
});

module.exports = router;
