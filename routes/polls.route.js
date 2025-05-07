const express = require('express');
const Poll = require('../models/poll.model.js');
const requireAuth = require('../middleware/requireAuth.js');

// Implementation of the Polls router

module.exports = makePollsRouter;