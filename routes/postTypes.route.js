// routes/makeTypedRouter.js
const express = require('express');
<<<<<<< HEAD
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });
=======
>>>>>>> Veronica
const requireAuth = require('../middleware/requireAuth.js');

module.exports = function makeTypedRouter(Model) {
    const router = express.Router();

<<<<<<< HEAD
  // LIST  /events  /polls  /news
  router.get('/', async (_req, res) => {
<<<<<<< HEAD
    const docs = await Model.find().sort({ createdAt: -1 }).populate('user_id', 'username');
=======
    const docs = await Model.find().sort({ createdAt: -1 });
>>>>>>> Veronica
    res.json(docs);
  });

  // CREATE
<<<<<<< HEAD
  router.post('/', upload.single('image'), requireAuth, async (req, res) => {
    try {
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;
=======
    // LIST  /events  /polls  /news
    router.get('/', async (_req, res) => {
        const docs = await Model.find().sort({ createdAt: -1 }).populate('user_id', 'username');
        res.json(docs);
    });

    // CREATE
    router.post('/', upload.single('image'), requireAuth, async (req, res) => {
        try {
            console.log("BODY:", req.body);
            const image_url = req.file ? `/uploads/${req.file.filename}` : null;
>>>>>>> Leen

            const doc = await Model.create({
                ...req.body,
                user_id: req.session.userId,
                image_url
            });

<<<<<<< HEAD
=======
  router.post('/', requireAuth, async (req, res) => {
    try {
      // force the correct discriminator `type`
      const doc = await Model.create({ ...req.body, type: 'post', user_id: req.session.userId });
>>>>>>> Veronica
      res.status(201).json(doc);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
=======
            res.status(201).json(doc);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });
>>>>>>> Leen

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
