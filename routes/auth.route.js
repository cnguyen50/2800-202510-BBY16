const express = require('express');
const bcrypt  = require('bcrypt');
const User    = require('../models/user.model.js');

/*
  makeAuthRouter() returns an Express Router
  each route handles a piece of authentication logic
*/
function makeAuthRouter() {
  const router = express.Router();

  // router.post(path, handler) → create new account
  // purpose: register user, reject duplicates, start session
  router.post('/register', async (req, res) => {
    try {
      const { username, password, email, neighbourhood } = req.body;

      // User.exists(query) checks for duplicate username OR email
      if (await User.exists({ $or: [{ username }, { email }] }))
        return res.status(409).json({ error: 'Username or email already exists' });

      // bcrypt.hash(plain, saltRounds) hashes the password
      const hash = await bcrypt.hash(password, 10);

      // User.create(doc) inserts user
      const user = await User.create({
        username,
        password: hash,
        email,
        neighbourhood
      });

      // req.session.userId stores login in session cookie
      req.session.userId = user._id;
      res.status(201).json({ _id: user._id, username, email, neighbourhood });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // router.post(path, handler) → login (auto-register if not found)
  // purpose: sign in existing user or create one on the fly
  router.post('/login', async (req, res) => {
    const { username, password, email, neighbourhood } = req.body;

    // User.findOne finds user by username
    let user = await User.findOne({ username });

    // if not found, create new account
    if (!user) {
      try {
        const hash = await bcrypt.hash(password, 10);

        user = await User.create({
          username,
          password: hash,
          email,
          neighbourhood
        });
      } catch (err) {
        return res.status(400).json({ error: 'Registration failed: ' + err.message });
      }
    }

    // bcrypt.compare checks password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    req.session.userId = user._id;
    res.redirect('/home');
  });

  // router.get(path, handler) → quick session check
  // purpose: return current user id (used by client JS)
  router.get('/profile', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ userId: req.session.userId });
  });

  // router.post(path, handler) → destroy session
  // purpose: log user out
  router.post('/logout', (req, res) => {
    req.session.destroy(() => res.status(204).end());
  });

  return router;
}

module.exports = makeAuthRouter;
