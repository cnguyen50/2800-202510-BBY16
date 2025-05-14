const {Schema, model} = require('mongoose');
const { link } = require('../routes/polls.route');

module.exports = model('Comment', new Schema({
    post_id: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    likes: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
},
{
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'false'
    }
}));