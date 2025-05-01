#!/usr/bin/env node
// scripts/seedComments.js
// -------------------------------------------------------------
// Inserts N fake comments linked to random users and posts.
// -------------------------------------------------------------

require('dotenv').config();
const { faker }  = require('@faker-js/faker');
const bcrypt     = require('bcryptjs');               // not used, just mirroring style
const { connectDB, mongoose } = require('./db.js');   // same singleton
const User    = require('../models/user.model.js');
const Post    = require('../models/post.model.js');
const Comment = require('../models/comment.model.js');

(async () => {
  try {
    // open Mongo connection
    await connectDB();

    // wipe collection if --clean flag present
    if (process.argv.includes('--clean')) {
      await Comment.deleteMany({});
      console.log('cleared Comments collection');
    }

    // how many comments to create?  default 30
    const N = Number(process.argv[2] || 30);

    // get IDs we can reference
    const users = await User.find().select('_id');
    const posts = await Post.find().select('_id');

    if (!users.length || !posts.length) {
      console.log('Need at least one user and one post to seed comments');
      return;
    }

    // build docs
    const docs = Array.from({ length: N }).map(() => ({
      user_id: faker.helpers.arrayElement(users)._id,
      post_id: faker.helpers.arrayElement(posts)._id,
      content: faker.lorem.sentence({ min: 6, max: 16 }),
      created_at: faker.date.recent(10),  // last 10 days
    }));

    // bulk insert
    await Comment.insertMany(docs);
    console.log(`inserted ${N} fake comments`);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
})();
