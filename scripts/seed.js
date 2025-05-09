#!/usr/bin/env node
require('dotenv').config();
const bcrypt   = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const { connectDB, mongoose } = require('./db.js');  // ← reuse your singleton
const User     = require('../models/user.model.js');

(async () => {
  try {
    await connectDB();

    // 1) (optional) wipe existing users
    if (process.argv.includes('--clean')) {
      await User.deleteMany({});
      console.log('🗑️  cleared Users collection');
    }

    // 2) generate N fake users
    const N = Number(process.argv[2] || 20);       // default: 20
    const neighbourhoods = ['Kitsilano', 'Downtown', 'Mount Pleasant', 'Commercial'];

    const docs = Array.from({ length: N }).map(() => {
      const pwdPlain = faker.internet.password(10);
      return {
        role_id:     "Resident",
        username:    faker.internet.username(),
        password:    bcrypt.hashSync(pwdPlain, 8),
        email:       faker.internet.email(),
        neighbourhood: faker.helpers.arrayElement(neighbourhoods),
      };
    });

    await User.insertMany(docs);
    console.log(`✅ inserted ${N} fake users`);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();   // neat exit
  }
})();
