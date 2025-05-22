// models/post.model.js
const { Schema, model } = require('mongoose');

// helper: reject $ and . in strings (mongo‑operator injection)
const noDollarDot = v => !/[$.]/.test(v);

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
      validate: {
        validator: v => !v || /^https?:\/\//.test(v) || v.startsWith('/uploads/'),
        message: 'Bad image URL'
      }
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
    event_name: { type: String, required: true, maxlength: 40, validate: noDollarDot },
    event_date: {
      type: Date,
      required: true,
      validate: { validator: d => d > Date.now(), message: 'Date must be in the future' }
    },
    location: { type: String, required: true, minlength: 2, maxlength: 200, validate: noDollarDot },
    description: { type: String, maxlength: 2000, validate: noDollarDot },
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
    text: { type: String, required: true, maxlength: 1000, validate: noDollarDot },
    expires_at: {
      type: Date,
      default: () => Date.now() + 62 * 60 * 1000,
      validate: { validator: d => d > Date.now(), message: 'Expiry must be in the future' }
    },
    options: [{
      label: { type: String, required: true, maxlength: 280, validate: noDollarDot },
      votes: { type: Number, default: 0 }
    }],
    voted_user_ids: [String]
  })
);

const NewsPost = Post.discriminator(
  'News',
  new Schema({
    headline  : { type: String, required: true, minlength: 3, maxlength: 200, validate: noDollarDot },
    body      : { type: String, required: true, validate: noDollarDot },
     image_url: {
      type: String,
      validate: { validator: v => !v || /^https?:\/\//.test(v), message: 'Bad image URL' }
    },
  })
);

module.exports = { Post, EventPost, PollPost, NewsPost };
