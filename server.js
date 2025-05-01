require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongo');
const { connectDB } = require('./scripts/db.js'); // Adjust the path as necessary
const makePostsRouter = require('./routes/posts.route.js');
const makeUsersRouter = require('./routes/users.route.js');
const makeAuthRouter = require('./routes/auth.route.js');
const path = require('path');
const makeCommentsRouter = require('./routes/comments.route.js');

(async () => {
    try {
        const { db, client } = await connectDB();

        const app = express();
        app.use(express.json());

        app.use(
            session({
                name: 'sessionId',
                secret: process.env.SESSION_SECRET,
                resave: false,
                saveUninitialized: false,
                store: MongoDBStore.create({
                    client,
                    collectionName: 'sessions',
                    ttl: 14 * 24 * 60 * 60, 
                }),
                cookie: {
                    httpOnly: true,
                    sameSite: 'lax',
                    // secure: process.env.NODE_ENV === 'production',
                    maxAge: 14 * 24 * 60 * 60 * 1000, 
                }
            })
        );

        app.use(express.urlencoded({ extended: true }));
        
        app.use('/auth', makeAuthRouter());
        
        app.use('/posts', makePostsRouter());

        app.use('/users', makeUsersRouter());

        app.use('/comments', makeCommentsRouter());
        
        app.use(express.static('public'));

        app.get('/', (_req, res) =>
            res.sendFile(path.join(__dirname, './public/index.html'))
        );

        app.get('/profile', (_req, res) =>
            res.sendFile(path.join(__dirname, './public/profile.html'))
        );

        app.get('/home', (_req, res) =>
            res.sendFile(path.join(__dirname, './public/main.html'))
        );

        app.use('/login', (req, res) => {
            if (req.session.user) {
                res.redirect('/main.html');
            } else {
                res.sendFile(path.join(__dirname, './public/login.html'));
            }
        });

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1); // Exit the process with failure
    }
})();