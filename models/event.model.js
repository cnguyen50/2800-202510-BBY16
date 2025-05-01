const {Schema, model} = require('mongoose');

module.exports = model('Event', new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event_name: {
        type: String,
        required: true
    },
    event_date: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String
    }
}));