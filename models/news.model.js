const { Schema, model } = require('mongoose');

const NewsSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userProfilePic: {
        type: String,
        default: '/uploads/default.jpg'
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
});

module.exports = model('News', NewsSchema);
