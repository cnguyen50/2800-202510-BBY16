const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const User = require('../models/user.model');
const Neighbourhood = require('../models/neighbourhood.model');
const { EventPost } = require('../models/post.model');

router.get('/', requireAuth, async (req, res, next) => {
    try {
        // Load the logged‑in user
        const user = await User.findById(req.session.userId).lean();
            if (!user.neighbourhood) {
            return res.status(400).json({ error: 'No neighbourhood set on your profile' });
        }

        //Look up that neighbourhood’s center coords
        const hood = await Neighbourhood.findOne({
        neighbourhood_name: user.neighbourhood
        }).lean();

        if (!hood) {
            return res.status(404).json({ error: 'Unknown neighbourhood' });
        }

        const [lng, lat] = hood.center.coordinates;

        //Fetch all EventPosts tagged with that same string
        const events = await EventPost
            .find({ neighbourhood: user.neighbourhood })
            .select('event_name event_date')
            .lean();

        //Stamp each event with the coords, and send back
        const payload = events.map(e => ({
            event_name:  e.event_name,
            event_date:  e.event_date,
            lat,
            lng
        }));

        res.json(payload);
        
    } catch (err) {
        next(err);
    }
});

module.exports = router;
