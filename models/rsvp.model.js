module.exports = model('RSVP', new Schema({
    event_id: {
        type: Schema.Types.ObjectId,
        ref: 'Event', 
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required:true
    },
    status: {
        type: String,
        enum: [
            'yes',
            'no',
            'maybe'
        ],
        default: 'yes'
    }
}))