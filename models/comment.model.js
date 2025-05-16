const {Schema, model} = require('mongoose');
const { link } = require('../routes/polls.route');

// helper: reject $ and . in strings (mongo‑operator injection)
const noDollarDot = v => !/[$.]/.test(v);

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
        required: true,
        validate: {
            validator: v => v.length > 0 && v.length <= 1000,
            message: 'Comment must be between 1 and 1000 characters',
            noDollarDot
        }
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