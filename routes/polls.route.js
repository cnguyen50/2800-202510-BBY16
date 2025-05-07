const express = require('express');
const Poll = require('../models/poll.model.js');
const PollOption = require('../models/pollOption.model.js');
const Post = require('../models/post.model.js');
const requireAuth = require('../middleware/requireAuth.js');


function makePollsRouter() {
    const router = express.Router();

    router.get('/', async (_req, res) => {
        const polls = await Poll.find().sort({ created_at: -1 });
        res.json(polls);
    });


    // Create a poll with options
    router.post('/', requireAuth, async (req, res) => {
        try {
            const { text, expires_at, options } = req.body;

            if (!text || !Array.isArray(options) || options.length < 2) {
                return res.status(400).json({ error: 'Poll must have a question and at least 2 options.' });
            }

            const poll = await Poll.create({
                user_id: req.session.userId,
                text,
                expires_at: expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hrs default
            });

            const optionDocs = options.map((opt) => ({
                poll_id: poll._id,
                option_type: 'radio',
                text: opt
            }));

            await PollOption.insertMany(optionDocs);

            // Create a post for the poll
            await Post.create({
                post_id: poll._id,
                user_id: req.session.userId,
                content: text,
                type: 'poll'
            });

            res.status(201).json(poll);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // Get my polls
    router.get('/me', requireAuth, async (req, res) => {
        const polls = await Poll.find({ user_id: req.session.userId }).sort({ created_at: -1 });
        res.json(polls);
    });

    // Get one poll with options
    router.get('/:id', async (req, res) => {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });

        const options = await PollOption.find({ poll_id: req.params.id });
        res.json({ poll, options });
    });

    // Update poll (text/expiry)
    router.put('/:id', requireAuth, async (req, res) => {
        try {
            const poll = await Poll.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!poll) return res.status(404).json({ error: 'Poll not found' });
            res.json(poll);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // Delete poll + its options
    router.delete('/:id', requireAuth, async (req, res) => {
        const poll = await Poll.findByIdAndDelete(req.params.id);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });

        await PollOption.deleteMany({ poll_id: req.params.id });
        res.status(204).end();
    });

    // Vote on a poll
    router.post('/:id/vote', requireAuth, async (req, res) => {
        const { optionId } = req.body;

        const option = await PollOption.findOne({ _id: optionId, poll_id: req.params.id });
        if (!option) return res.status(404).json({ error: 'Option not found' });

        await PollOption.updateOne({ _id: optionId }, { $inc: { votes_count: 1 } });
        res.json({ message: 'Vote recorded' });
    });

    // Get poll results
    router.get('/:id/results', requireAuth, async (req, res) => {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ error: 'Poll not found' });

        if (new Date() < poll.expires_at) {
            return res.status(403).json({ error: 'Poll has not yet expired.' });
        }

        const results = await PollOption.find({ poll_id: req.params.id }).select('text votes_count');
        res.json({ question: poll.text, results });
    });

    return router;
}

module.exports = makePollsRouter;