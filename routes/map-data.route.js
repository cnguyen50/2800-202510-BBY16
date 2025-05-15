// routes/map-data.route.js
const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const User = require('../models/user.model');
const { EventPost } = require('../models/post.model');

function makeMapDataRouter() {
    const router = express.Router();

    // GET all events in the logged‑in user’s neighbourhood
    router.get('/', requireAuth, async (req, res) => {
        try {
        //load the user
        const user = await User.findById(req.session.userId).lean();
        if (!user.neighbourhood) {
            return res.status(400).json({ error: 'No neighbourhood set on your profile' });
        }

        // fetch events in that neighbourhood
        const events = await EventPost
            .find({ neighbourhood: user.neighbourhood })
            .select('event_name event_date lat lng')
            .lean();

        // return them
        res.json(events);
        } catch (err) {
        res.status(500).json({ error: err.message });
        }
    });

    return router;
}

module.exports = makeMapDataRouter;
