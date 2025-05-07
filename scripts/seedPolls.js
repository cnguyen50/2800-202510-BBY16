#!/usr/bin/env node
// scripts/seedPolls.js
// -------------------------------------------------------------
// Inserts N fake polls linked to random users, with options.
// -------------------------------------------------------------

require('dotenv').config();
const { faker } = require('@faker-js/faker');
const { connectDB, mongoose } = require('./db.js');
const User = require('../models/user.model.js');
const Poll = require('../models/poll.model.js');
const Post = require('../models/post.model.js');
const PollOption = require('../models/pollOption.model.js');

(async () => {
    try {
        await connectDB();

        // Wipe if --clean flag is passed
        if (process.argv.includes('--clean')) {
            await Poll.deleteMany({});
            await PollOption.deleteMany({});
            await Post.deleteMany({ type: 'poll' }); // Only remove poll-type posts
            console.log('cleared Polls and PollOptions collections');
        }

        const N = Number(process.argv[2] || 10); // Default 10 polls

        const users = await User.find().select('_id');
        if (!users.length) {
            console.log('Need at least one user to seed polls');
            return;
        }

        const pollList = [];

        for (let i = 0; i < N; i++) {
            const user = faker.helpers.arrayElement(users);
            const text = faker.lorem.sentence();

            // Create the poll
            const poll = await Poll.create({
                user_id: user._id,
                text,
                expires_at: new Date(Date.now() + faker.number.int({ min: 1, max: 12 }) * 60 * 60 * 1000) // 1–12 hrs
            });

            const optionCount = faker.number.int({ min: 3, max: 5 });
            const options = Array.from({ length: optionCount }).map(() => ({
                poll_id: poll._id,
                text: faker.word.words({ count: 1 }),
                option_type: 'radio',
                votes_count: faker.number.int({ min: 0, max: 25 })
            }));

            await PollOption.insertMany(options);

            //Create the post so it shows in the feed
            const postId = new mongoose.Types.ObjectId();
            await Post.create({
                _id: postId,
                post_id: postId,
                user_id: user._id,
                content: text,
                type: 'poll',
                poll_id: poll._id // Link to the poll
            });

            pollList.push(poll.text);
        }

        console.log(`Inserted ${pollList.length} fake polls`);
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
})();
