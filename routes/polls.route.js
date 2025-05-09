// routes/polls.js
const makeTypedRouter = require('../routes/postTypes.route.js');
const { PollPost }    = require('../models/post.model');
const requireAuth     = require('../middleware/requireAuth');
const mongoose        = require('mongoose');

const pollsRouter = makeTypedRouter(PollPost);   // ← list/create/update/delete

/* --- extra Poll‑specific routes --------------------------------------- */

// Cast a vote
pollsRouter.post('/:pollId/vote', requireAuth, async (req, res) => {
  const { pollId }  = req.params;
  const { optionId }= req.body;
  const userId      = req.session.userId;

  if (!mongoose.Types.ObjectId.isValid(pollId) ||
      !mongoose.Types.ObjectId.isValid(optionId)) {
    return res.status(400).json({ error: 'Invalid poll or option ID' });
  }

  const poll = await PollPost.findById(pollId);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });

  if (poll.expires_at && Date.now() > poll.expires_at)
    return res.status(400).json({ error: 'Poll has expired' });

  if (poll.voted_user_ids?.includes(String(userId)))
    return res.status(400).json({ error: 'You already voted' });

  const option = poll.options.id(optionId);
  if (!option) return res.status(400).json({ error: 'Option not found' });

  option.votes += 1;
  poll.voted_user_ids.push(String(userId));
  await poll.save();

  res.redirect(`/polls/${pollId}/view`);
});

// Results
pollsRouter.get('/:pollId/results', requireAuth, async (req, res) => {
  const poll = await PollPost.findById(req.params.pollId);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });

  const voted   = poll.voted_user_ids?.includes(String(req.session.userId));
  const expired = Date.now() > poll.expires_at;

  if (!voted && !expired)
    return res.status(403).json({ error: 'Results after voting or expiry' });

  res.json({ question: poll.text, results: poll.options });
});

// Pretty HTML view (optional)
pollsRouter.get('/:pollId/view', requireAuth, async (req, res) => {
  const poll = await PollPost.findById(req.params.pollId);
  if (!poll) return res.status(404).send('Poll not found');

  const hasVoted = poll.voted_user_ids?.includes(String(req.session.userId));
  const expired  = Date.now() > poll.expires_at;

  res.render('poll', { poll, hasVoted, expired });
});

/* ---------------------------------------------------------------------- */
module.exports = pollsRouter;
