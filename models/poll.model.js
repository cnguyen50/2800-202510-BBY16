const { Schema, model } = require('mongoose');

module.exports = model('poll', new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    expires_at: {
        type: Date,
        required: true,
        default: () => Date.now() + 24 * 60 * 60 * 1000
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: false
    }
}))