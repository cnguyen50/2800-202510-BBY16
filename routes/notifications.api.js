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
  await Notification.findByIdAndUpdate(req.params.id, {
    read: true, read_at: new Date()
  });
  res.sendStatus(204);
});

module.exports = router;
