const mongoose = require('mongoose');
const slugify = require('slugify');
const sanitizeHtml = require('sanitize-html');

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
  'img', 'h1', 'h2', 'h3', 'figure', 'figcaption'
]);

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 180
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true,
    trim: true,
    maxlength: 280
  },
  coverImage: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  readTime: {
    type: Number,
    required: true,
    min: 1,
    max: 60
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true
  },
  isSticky: {
    type: Boolean,
    default: false,
    index: true
  },
  publishedAt: {
    type: Date,
    default: null,
    index: true
  },
  author: {
    name: {
      type: String,
      default: 'CoinCash Editorial'
    },
    role: {
      type: String,
      default: 'Faucet Strategy Team'
    },
    bio: {
      type: String,
      default: 'We publish practical earning guides, security notes, and withdrawal tips for faucet users.'
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

blogPostSchema.pre('validate', function createSlug(next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

blogPostSchema.virtual('safeContent').get(function safeContent() {
  return sanitizeHtml(this.content, {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      '*': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' })
    }
  });
});

blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

module.exports = mongoose.model('BlogPost', blogPostSchema);
