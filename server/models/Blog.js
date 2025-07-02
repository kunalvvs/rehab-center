import mongoose from 'mongoose';
import slugify from 'slugify';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 200
  },
  imageUrl: {
    type: String,
    required: true
  },
  author: {
    type: String,
    default: 'Admin'
  },
  category: {
    type: String,
    enum: ['Mental Health', 'Physical Therapy', 'Addiction Recovery', 'Wellness', 'General'],
    default: 'General'
  },
  tags: [{
    type: String
  }],
  published: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create slug from title before saving
blogSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '-');
  }
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Blog', blogSchema);