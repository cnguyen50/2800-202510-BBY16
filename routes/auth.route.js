const express = require('express');
const bcrypt  = require('bcrypt');
const User    = require('../models/user.model.js');
const { registerSchema, loginSchema } = require('../middleware/validateUser.js');
const validateBody = require('../middleware/validate.js');
/*
  makeAuthRouter() returns an Express Router
  each route handles a piece of authentication logic
*/
function makeAuthRouter() {
  const router = express.Router();


  // router.post(path, handler) → login (auto-register if not found)
  // purpose: sign in existing user or create one on the fly
  router.post('/login', validateBody(loginSchema), async (req, res) => {
   const username = req.body.username.trim();
    const password = req.body.password.trim();
    const email = req.body.email.trim();
    const neighbourhood = req.body.neighbourhood.trim();


    username.trim();
    password.trim();
    email.trim();
    neighbourhood.trim();
    // User.findOne finds user by username
    let user = await User.findOne({ username });

    // if not found, create new account
    if (!user && (!email || !neighbourhood)) {

        return res.redirect(303, '/login?error=USER_NOT_FOUND');
    }

    if(!user && email && neighbourhood) {
      // User.create creates new user
      const hash = await bcrypt.hash(password, 10);

      user = await User.create({
        username,
        password: hash,
        email,
        neighbourhood: neighbourhood.toLowerCase().trim()
      });
    }    

    if(user) {
      // bcrypt.compare(plain, hash) checks password against hash
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });
      req.session.userId = user._id;
      req.session.neighbourhood = user.neighbourhood;


      console.log(req.session.neighbourhood);
      res.redirect('/profile');
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.redirect(303, '/login?error=BAD_PASSWORD');

    req.session.userId = user._id;
    res.redirect('/profile');
  
  });

  router.post('/logout', async (req, res) => {
    if(req.session.userId) {
      req.session.destroy(err => {
        if(err) return res.status(500).json({ error: 'Logout failed: ' + err.message });
        res.clearCookie('sessionId');
        res.redirect('/');
      });
    
    } else {
    res.redirect('/');
    }
  });

  // router.get(path, handler) → quick session check
  // purpose: return current user id (used by client JS)
  router.post('/profile', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ userId: req.session.userId });
  });

  return router;
}

module.exports = makeAuthRouter;
