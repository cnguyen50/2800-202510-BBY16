const express = require('express');
const { PollPost } = require('../models/post.model.js');
const requireAuth = require('../middleware/requireAuth.js');
const mongoose = require('mongoose');

function makePollsRouter() {
    const router = express.Router();

    // Cast a vote using optionId
    router.post('/:pollId/vote', requireAuth, async (req, res) => {
        const { pollId } = req.params;
        const { optionId } = req.body;
        const userId = req.session.userId;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(pollId) || !mongoose.Types.ObjectId.isValid(optionId)) {
            return res.status(400).json({ error: 'Invalid poll or option ID' });
        }

        try {
            const poll = await PollPost.findById(pollId);
            if (!poll || poll.type !== 'Poll') {
                return res.status(404).json({ error: 'Poll not found' });
            }

            // Check for expiration
            if (poll.expires_at && new Date() > poll.expires_at) {
                return res.status(400).json({ error: 'Poll has expired' });
            }

            // Check if already voted
            poll.voted_user_ids = poll.voted_user_ids || [];
            if (poll.voted_user_ids.includes(userId.toString())) {
                return res.status(400).json({ error: 'You have already voted' });
            }

            // Find and update the selected option
            const option = poll.options.id(optionId);
            if (!option) {
                return res.status(400).json({ error: 'Poll option not found' });
            }

            option.votes += 1;
            poll.voted_user_ids.push(userId.toString());

            await poll.save();
            res.status(200).json({ message: 'Vote recorded' });

        } catch (err) {
            res.status(500).json({ error: 'Server error: ' + err.message });
        }
    });

    // View results if voted or poll is expired
    router.get('/:pollId/results', requireAuth, async (req, res) => {
        const { pollId } = req.params;
        const userId = req.session.userId;

        try {
            const poll = await PollPost.findById(pollId);

            if (!poll || poll.type !== 'Poll') {
                return res.status(404).json({ error: 'Poll not found' });
            }

            const voted = poll.voted_user_ids?.includes(userId.toString());
            const expired = new Date() > poll.expires_at;

            if (!voted && !expired) {
                return res.status(403).json({ error: 'Results only available after voting or expiration' });
            }

            res.json({ question: poll.text, results: poll.options });

        } catch (err) {
            res.status(500).json({ error: 'Server error: ' + err.message });
        }
    });

    router.get('/:pollId/view', requireAuth, async (req, res) => {
        const { pollId } = req.params;
        const userId = req.session.userId;

        const poll = await PollPost.findById(pollId);
        if (!poll || poll.type !== 'Poll') return res.status(404).send('Poll not found');

        const hasVoted = poll.voted_user_ids?.includes(userId.toString());
        const expired = new Date() > poll.expires_at;

        res.render('poll', { poll, hasVoted, expired });
    });


    return router;
}

module.exports = makePollsRouter;
