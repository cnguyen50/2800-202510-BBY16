const cron = require('node-cron');
const {PollPost} = require('../models/post.model.js');
const Notification = require('../models/notification.model.js');

module.exports = function startReminders(io) {
     console.log('[reminders] cron job initialised');
    cron.schedule('*/2 * * * *', async () => {
        console.log('[reminders] running at', new Date().toISOString());
        const now = Date.now();
        const windowLow = new Date(now + 59*60*1000);
        const windowHigh = new Date(now + 61*60*1000);

        const polls = await PollPost.find({
            expires_at: {
                $gte: windowLow,
                $lt: windowHigh
            },
            reminder_sent: false
        });

       for (const poll of polls) {
        console.log(poll);
        const userIds = new Set(
          poll.voted_user_ids.map(String).concat(String(poll.user_id))
        );

        for (const uid of userIds) {
          const notif = await Notification.create({
            user_id: uid,
            type: 'poll-reminder',
            data: { poll_id: poll._id, title: poll.text }
          });
          io.to(uid).emit('notification', notif);
        }

        poll.reminder_sent = true;
        await poll.save();
      }
    })
}
