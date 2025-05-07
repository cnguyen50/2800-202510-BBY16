const express = require('express');
const Event = require('../models/event.model.js');
const { requireAuth } = require('../middleware/requireAuth.js');

function makeEventsRouter() {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const events = await Event.find().sort({ event_date: 1 });
      res.json(events);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create event
  router.post('/', async (req, res) => {
    try {
      const event = await Event.create(req.body);
      res.status(201).json(event);
    } catch (err) {
      console.error("Event creation error:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // GET one event by ID
  router.get('/:id', async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  });

  // PUT update event
  router.put('/:id', async (req, res) => {
    try {
      const updated = await Event.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE event
  router.delete('/:id', async (req, res) => {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  });

  return router;
}

module.exports = makeEventsRouter;