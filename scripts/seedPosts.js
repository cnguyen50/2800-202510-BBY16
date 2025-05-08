#!/usr/bin/env node
// scripts/seedPosts.js
// -------------------------------------------------------------
// Inserts N fake posts linked to random users.
// -------------------------------------------------------------

require('dotenv').config();
const { faker }  = require('@faker-js/faker');
const { connectDB, mongoose } = require('./db.js');
const User    = require('../models/user.model.js');
const Post    = require('../models/post.model.js');

(async () => {
  try {
    // open Mongo connection
    await connectDB();

    // wipe collection if --clean flag present
    if (process.argv.includes('--clean')) {
      await Post.deleteMany({});
      console.log('cleared Posts collection');
    }

    // how many posts to create? default 30
    const N = Number(process.argv[2] || 30);

    // get user IDs to reference
    const users = await User.find().select('_id');
    if (!users.length) {
      console.log('Need at least one user to seed posts');
      return;
    }

    // possible post types
    const types = ['news', 'poll', 'event'];

    // build docs
    const docs = Array.from({ length: N }).map(() => ({
      post_id:   faker.helpers.arrayElement(users)._id, // treat each as its own root post
      user_id:   faker.helpers.arrayElement(users)._id,
      content:   faker.lorem.paragraphs( faker.number.int({ min: 1, max: 3 })  ),
      type:      faker.helpers.arrayElement(types),
      // omit created_at so mongoose timestamps apply automatically
    }));

    // bulk insert
    await Post.insertMany(docs);
    console.log(`inserted ${N} fake posts`);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
})();
