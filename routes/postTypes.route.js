// routes/makeTypedRouter.js
const express = require('express');
const requireAuth = require('../middleware/requireAuth.js');

module.exports = function makeTypedRouter(Model) {
    const router = express.Router();

    // LIST  /events  /polls  /news
    router.get('/', async (_req, res) => {
        const docs = await Model.find().sort({ createdAt: -1 });
        res.json(docs);
    });

    // CREATE
    router.post('/', requireAuth, async (req, res) => {
        try {
            // force the correct discriminator `type`
            const doc = await Model.create({ ...req.body, user_id: req.session.userId });
            res.status(201).json(doc);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // READ ONE
    router.get('/:id', async (req, res) => {
        const doc = await Model.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        res.json(doc);
    });

    // UPDATE
    router.put('/:id', requireAuth, async (req, res) => {
        try {
            const doc = await Model.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!doc) return res.status(404).json({ error: 'Not found' });
            res.json(doc);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // DELETE
    router.delete('/:id', requireAuth, async (req, res) => {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        res.status(204).end();
    });

    return router;
};