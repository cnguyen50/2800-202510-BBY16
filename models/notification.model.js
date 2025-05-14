const {Schema, model} = require('mongoose');

module.exports = model('Notification', new Schema( {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['comment', 'event-reminder', 'poll-reminder'], required: true },
    data: Schema.Types.Mixed,
    read: { type: Boolean, default: false},
    read_at: { type: Date, default: null }
}, {timestamps: {createdAt: 'created_at'}}));