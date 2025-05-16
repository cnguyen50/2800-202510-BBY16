const cron = require('node-cron');
const {EventPost, PollPost} = require('../models/post.model.js');
const Notification = require('../models/notification.model.js');
const RSVP = require('../models/rsvp.model.js');

module.exports = function startReminders(io) {
    cron.schedule('*/2 * * * *', async () => {
        console.log('[cron-tick]', new Date().toISOString(), 'checking for reminders');
        const now = Date.now();
        const windowLow = new Date(now + 59*60*1000);
        const windowHigh = new Date(now + 61*60*1000);

        const events = await EventPost.find({
            event_date: {
                $gte: windowLow,
                $lt: windowHigh
            },
            reminder_sent: false
        });

        for (const event of events) {
            const rsvps = await RSVP.find({event_id: event._id, status: {$in: ['yes', 'maybe']}}).select('user_id');
            const userIds = rsvps.map(rsvp => rsvp.user_id);

            await Promise.all(userIds.map(userId => {
                Notification.create({
                    user_id: userId,
                    type: 'event-reminder',
                    data: {
                        event_id: event._id,
                        title: event.event_name
                    }
                }).then(notification => io.to(String(userId)).emit('notification', notification));
            }))

            event.reminder_sent = true;
            await event.save();
        }

        const polls = await PollPost.find({
            expires_at: {
                $gte: windowLow,
                $lt: windowHigh
            },
            reminder_sent: false
        });

       for (const poll of polls) {
        
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
          console.log('[poll-reminder]', poll._id.toString(), '→', uid);
        }

        poll.reminder_sent = true;
        await poll.save();
      }
    })
}
