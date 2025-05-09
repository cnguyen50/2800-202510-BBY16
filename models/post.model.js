const { Schema, model } = require('mongoose');

const BasePostSchema = new Schema(
  {
    user_id   : { type: Schema.Types.ObjectId, ref: 'User', required: true },
<<<<<<< HEAD
    parent_id : { type: Schema.Types.ObjectId, ref: 'Post' }, // replies
    image_url : { type: String }
=======
    parent_id : { type: Schema.Types.ObjectId, ref: 'Post' } // replies
>>>>>>> Veronica
  },
  {
    timestamps      : true,
    collection      : 'Posts',
    discriminatorKey: 'type'   
  }
);

const Post = model('Post', BasePostSchema);

const EventPost = Post.discriminator(
  'Event',
  new Schema({
    event_name : { type: String, required: true },
    event_date : { type: Date,   required: true },
    location   : { type: String, required: true },
<<<<<<< HEAD
    description: String,
    image_url: { type: String }
=======
    description: String
>>>>>>> Veronica
  })
);

const PollPost = Post.discriminator(
  'Poll',
  new Schema({
    text       : { type: String, required: true },
    expires_at : { type: Date,   default: () => Date.now() + 24*60*60*1000 },
    options    : [{
      label : String,
      votes : { type: Number, default: 0 }
    }]
  })
);

const NewsPost = Post.discriminator(
  'News',
  new Schema({
    headline : { type: String, required: true },
    body     : { type: String, required: true },
    image_url: String
  })
);

module.exports = { Post, EventPost, PollPost, NewsPost };
