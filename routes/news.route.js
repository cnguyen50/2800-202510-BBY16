const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const News = require('../models/news.model'); 

const router = express.Router();

// Setup multer storage(Photos)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '..', 'public', 'uploads');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const { title, body, neighborhood } = req.body;
        const userId = req.session.user._id;

        const newNews = new News({
            user_id: userId,
            title,
            body,
            neighborhood,
            image_url: req.file ? `/uploads/${req.file.filename}` : undefined
        });

        await newNews.save();

        res.redirect('/home'); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to post news');
    }
});

router.get('/', async (req, res) => {
    try {
        const news = await News.find().sort({ created_at: -1 }).lean();
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

module.exports = () => router;
