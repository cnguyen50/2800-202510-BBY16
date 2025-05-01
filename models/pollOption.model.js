const {Schema, model} = require('mongoose');
module.exports = model('PollOption', new Schema({
    poll_id: {
        type: Schema.Types.ObjectId, 
        ref: 'Poll',
        required: true
    },
    option_type: {
        type: String,
        enum: [
            'radio',
            'checkbox',
            'rating'
        ],
        required:true
    },
    text: {
        type: String,
        required: true
    },
    votes_count: {
        type:Number,
        default: 0
    }
}));