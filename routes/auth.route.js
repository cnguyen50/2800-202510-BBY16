const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user.model.js');   

// most error handling in this file is created by ai

function makeAuthRouter() {
    const router = express.Router();

    router.post('/register', async (req, res) => {
        try{
            const {username, password, email, neighbourhood} = req.body;
        
            //$or is MongoDB "or" operator
            if(await User.exists({$or: [{username}, {email}]})) 
                return res.status(409).json({error: 'Username or email already exists'});

            const hash = await bcrypt.hash(password, 10);

            const user = await User.create({
                role_id: "Resident",
                username,
                password: hash,
                email,
                neighbourhood
            });

            req.session.userId = user._id;
            res.status(201).json({_id: user._id, username, email, neighbourhood});
        } catch (err) {
            res.status(400).json({error: err.message});
        }
    });

    router.post('/login', async (req, res) => {
        const {username, password, email, neighbourhood} = req.body;

        let user = await User.findOne({username});

        if(!user) {
            try {
                const hash = await bcrypt.hash(password, 10);

                user = await User.create({
                    role_id: "Resident",
                    username,
                    password: hash,
                    email,
                    neighbourhood
                });
            } catch (err) {
                return res.status(400).json({error: "Registration failed: " + err.message});
            }
        }

        const ok = await bcrypt.compare(password, user.password);
        if(!ok) return res.status(400).json({error: 'Invalid credentials'});

        req.session.userId = user._id;
        res.json({ message: 'Logged in', userId: user._id});
    });

    router.get('/profile', (req, res) => {
        if(!req.session.userId) return res.status(401).json({error: 'Unauthorized'});
        res.json({userId: req.session.userId});
    });

    router.post('/logout', (req, res) => {
        req.session.destroy(() => res.status(204).end());
    });

    return router;

}

module.exports = makeAuthRouter;