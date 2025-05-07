const express = require('express');
const Poll = require('../models/poll.model.js');
const requireAuth = require('../middleware/requireAuth.js');


function makePollsRouter() {
    const router = express.Router();

    router.get('/', async (_req, res) => {
        const polls = await Poll.find().sort({ createdAt: -1 });
        res.json(polls);
    });
    // Implementation of the Polls router

    return router;
}

module.exports = makePollsRouter;