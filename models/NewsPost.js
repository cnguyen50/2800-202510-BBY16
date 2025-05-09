const Post = require('./Post'); 
const { Schema } = require('mongoose');

// Define the NewsPost schema as a discriminator of the base Post model
module.exports = Post.discriminator(
    'News',
    new Schema({
        // Fields specific to the News post type
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
        }
    })
);