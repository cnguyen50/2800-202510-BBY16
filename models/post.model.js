const { Schema, model } = require('mongoose');

const BasePostSchema = new Schema(
  {
    user_id   : { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parent_id : { type: Schema.Types.ObjectId, ref: 'Post' }, // replies
    image_url : { type: String }
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
    reminder_sent: {type: Boolean, default: false},
    location   : { type: String, required: true },
    description: String,
    image_url: { type: String }
  })
);

const PollPost = Post.discriminator(
  'Poll',
  new Schema({
    text       : { type: String, required: true },
    expires_at : { type: Date, default: () => Date.now() + 62*60*1000 }, // 62 minutes
    reminder_sent: {type: Boolean, default: false},
    options    : [{
      label : String,
      votes : { type: Number, default: 0 }
    }],
    voted_user_ids: [String] // 👈 new field to track who voted
  })
);

const NewsPost = Post.discriminator(
  'News',
  new Schema({
    headline : { type: String, required: true },
    body     : { type: String, required: true },
    image_url   : { type: String },
    neighborhood: { type: String, required: true }
  })
);

module.exports = { Post, EventPost, PollPost, NewsPost };
