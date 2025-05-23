// models/post.model.js
const { Schema, model } = require('mongoose');

// helper: reject $ and . in strings (mongo‑operator injection)
const noDollar = v => !/\$/.test(v);

const BasePostSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parent_id: { type: Schema.Types.ObjectId, ref: 'Post' },      // replies

    userNeighbourhood: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],

    }
  },
  {
    timestamps: true,
    collection: 'Posts',
    discriminatorKey: 'type'
  }
);

const Post = model('Post', BasePostSchema);

const EventPost = Post.discriminator(
  'Event',
  new Schema({
    event_name: { type: String, required: true, maxlength: 1000, validate: noDollar },
    event_date: {
      type: Date,
      required: true,
      validate: { validator: d => d > Date.now(), message: 'Date must be in the future' }
    },
    location: { type: String, required: true, minlength: 2, maxlength: 200, validate: noDollar },
    description: { type: String, maxlength: 2000, validate: noDollar },
      image_url: {
      type: String,
      validate: { validator: v => !v || /^https?:\/\//.test(v), message: 'Bad image URL' }
    },               // inherits URL regex above if you like
    neighbourhood: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  })
);

const PollPost = Post.discriminator(
  'Poll',
  new Schema({
    text: { type: String, required: true, maxlength: 1000, validate: noDollar },
    expires_at: {
      type: Date,
      default: () => Date.now() + 24 * 60 * 60 * 1000,
      validate: { validator: d => d > Date.now(), message: 'Expiry must be in the future' }
    },
    options: [{
      label: { type: String, required: true, maxlength: 280, validate: noDollar },
      votes: { type: Number, default: 0 }
    }],
    voted_user_ids: [String],
    reminder_sent: {type:Boolean, default: false}
  })
);

const NewsPost = Post.discriminator(
  'News',
  new Schema({
    headline  : { type: String, required: true, minlength: 3, maxlength: 1000, validate: noDollar },
    body      : { type: String, required: true, validate: noDollar },
     image_url: {
      type: String,
      validate: { validator: v => !v || /^https?:\/\//.test(v), message: 'Bad image URL' }
    },
  })
);

module.exports = { Post, EventPost, PollPost, NewsPost };
