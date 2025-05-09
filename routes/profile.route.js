const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/user.model');
const router = express.Router();

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

// GET user profile data
router.get('/me', async (req, res) => {
    console.log('Session in /profile/me:', req.session);

    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to upload profile picture
router.post('/upload', upload.single('profilePic'), async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user's profilePic field with the new uploaded file's URL
        const profilePicUrl = `/uploads/${req.file.filename}`;
        user.profilePic = profilePicUrl;

        // Save the user with the new profile picture
        await user.save();

        res.json({
            profilePic: profilePicUrl,
            user: {
                username: user.username,
                email: user.email,
                neighbourhood: user.neighbourhood,
                profilePic: user.profilePic
            }
        });
    } catch (err) {
        console.error('Error uploading profile picture:', err);
        res.status(500).json({ error: 'Server error while uploading picture' });
    }
});


module.exports = router;
