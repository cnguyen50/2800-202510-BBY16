require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongo');
const { connectDB } = require('./db.js');
const makePostsRouter = require('../routes/posts.route.js');
const makeUsersRouter = require('../routes/users.route.js');
const makeAuthRouter = require('../routes/auth.route.js');

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
                    ttl: 14 * 24 * 60 * 60, // 14 days
                }),
                cookie: {
                    httpOnly: true,
                    sameSite: 'lax',
                    // secure: process.env.NODE_ENV === 'production',
                    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
                }
            })
        );

        app.use('/auth', makeAuthRouter());
        
        app.use('/posts', makePostsRouter());

        app.use('/users', makeUsersRouter());
        
        app.get('/', (_req, res) =>
        res.json({status:'ok', db: db.databaseName, time: new Date().toISOString()})
        );

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1); // Exit the process with failure
    }
})();