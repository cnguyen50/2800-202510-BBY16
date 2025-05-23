const {Schema, model} = require('mongoose');

const NotificationSchema = new Schema( {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['comment', 'event-reminder', 'poll-reminder'], required: true },
    data: Schema.Types.Mixed,
    read: { type: Boolean, default: false},
    read_at: { type: Date, default: null },
    expire_at: { type: Date, default: null }
}, {timestamps: {
    createdAt: 'created_at',
}});

NotificationSchema.index({ expire_at: 1 }, { expireAfterSeconds: 0 });

module.exports = model('Notification', NotificationSchema);