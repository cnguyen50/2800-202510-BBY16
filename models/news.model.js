const {Schema, model} = require('mongoose');

module.exports = model('News', new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    image_url: {
        type: String 
    },
    neighborhood: {
        type: String, 
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}));