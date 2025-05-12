#!/usr/bin/env node
// scripts/seedPosts.js
// -------------------------------------------------------------
// Inserts 24 fake posts (8 news + 8 polls + 8 events).
// Pass --clean to wipe the Posts collection first.
// -------------------------------------------------------------

require('dotenv').config();
const { faker } = require('@faker-js/faker');
const { connectDB, mongoose } = require('./db.js');

const User = require('../models/user.model.js');
const {                       // ⬅️ the discriminators you created earlier
    Post,
    EventPost,
    PollPost,
    NewsPost
} = require('../models/post.model.js');

(async () => {
    try {
        /* ------------------------------------------------------------------ */
        /* 1. connect                                                          */
        /* ------------------------------------------------------------------ */
        await connectDB();

        /* ------------------------------------------------------------------ */
        /* 2. optionally wipe Posts                                            */
        /* ------------------------------------------------------------------ */
        if (process.argv.includes('--clean')) {
            await Post.deleteMany({});
            console.log('🗑️  cleared Posts collection');
        }

        /* ------------------------------------------------------------------ */
        /* 3. fetch user ids to reference                                      */
        /* ------------------------------------------------------------------ */
        const users = await User.find().select('_id');
        if (users.length === 0) {
            console.log('❌  Need at least one user in the DB to seed posts.');
            return;
        }
        const randomUser = () => faker.helpers.arrayElement(users)._id;

        /* ------------------------------------------------------------------ */
        /* 4. factories for each type                                          */
        /* ------------------------------------------------------------------ */
        const makeNews = () => ({
            user_id: '6812a0b3581952016d55094c',
            headline: faker.company.catchPhrase(),
            body: faker.lorem.paragraphs(2),
            image_url: faker.image.urlPicsumPhotos()
        });

        const makePoll = () => ({
            user_id: '6812a0b3581952016d55094c',
            text: faker.lorem.sentence(),
            expires_at: faker.date.soon({ days: 3 }),
            options: [
                { label: faker.word.adjective() },
                { label: faker.word.adjective() },
                { label: faker.word.adjective() }
            ]
        });

        const makeEvent = () => ({
            user_id: "6812a0b3581952016d55094c",
            event_name: `${faker.company.buzzPhrase()} Meetup`,
            event_date: faker.date.soon({ days: 30 }),
            location: faker.location.city(),
            description: faker.lorem.sentences(3)
        });


        /* ------------------------------------------------------------------ */
        /* 5. build arrays of 8 docs each                                      */
        /* ------------------------------------------------------------------ */
        const newsDocs = Array.from({ length: 8 }, makeNews);
        const pollDocs = Array.from({ length: 8 }, makePoll);
        const eventDocs = Array.from({ length: 8 }, makeEvent);

        /* ------------------------------------------------------------------ */
        /* 6. bulk insert through the correct model (validates each set)       */
        /* ------------------------------------------------------------------ */
        await EventPost.insertMany(eventDocs);
        await PollPost.insertMany(pollDocs);
        await NewsPost.insertMany(newsDocs);

        console.log('✅  inserted 8 events, 8 polls, 8 news posts');
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
})();