const express = require('express');
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');
const { EventPost } = require('../models/post.model');

function makeEventsRouter() {
    const router = express.Router();
    const upload = multer({ dest: 'public/uploads/' });

    // list all events
    router.get('/', async (_req, res) => {
        const events = await EventPost.find()
        .sort({ createdAt: -1 })
        .populate('user_id', 'username');
        res.json(events);
    });

    // create and geocode
    router.post(
        '/',
        upload.single('image'),
        requireAuth,
        async (req, res) => {
        try {
            const { event_name, event_date, location, description, neighbourhood } = req.body;
            const image_url = req.file ? `/uploads/${req.file.filename}` : null;

            // Geocode the free‑text location
            const nomParams = new URLSearchParams({
                format:       'jsonv2',
                limit:        '1',
                q:            location,
                countrycodes: 'ca',
                viewbox:      '-123.224,49.316,-123.022,49.227',
                bounded:      '1',
                addressdetails: '1'
            });
            
            const nomURL  = `https://nominatim.openstreetmap.org/search?${nomParams}`;

            // read the coords user selected
            const lat = parseFloat(req.body.lat);
            const lng = parseFloat(req.body.lng);
            if (isNaN(lat) || isNaN(lng)) {
                return res.status(400).json({ error: 'Please select a valid address from the suggestions.' });
            }

            // Create and respond
            const event = await EventPost.create({
                user_id : req.session.userId,
                event_name,
                event_date : new Date(event_date),
                location,
                description,
                image_url,
                neighbourhood,
                lat,
                lng
            });
            res.status(201).json(event);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
        }
    );

    // GET a single event
    router.get('/:id', async (req, res) => {
        const ev = await EventPost.findById(req.params.id);
        if (!ev) return res.status(404).json({ error: 'Not found' });
        res.json(ev);
    });

    router.put('/:id', requireAuth, async (req, res) => {
        try {
        const updated = await EventPost.findByIdAndUpdate(req.params.id, req.body, {
            new: true, runValidators: true
        });
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json(updated);
        } catch (err) {
        res.status(400).json({ error: err.message });
        }
    });

    router.delete('/:id', requireAuth, async (req, res) => {
        const deleted = await EventPost.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Not found' });
        res.status(204).end();
    });

    return router;
}

module.exports = makeEventsRouter;
