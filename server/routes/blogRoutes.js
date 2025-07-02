import express from 'express';
import Blog from '../models/Blog.js';
import slugify from 'slugify';

const router = express.Router();

// Get all blogs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const query = { published: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('title slug excerpt imageUrl author category tags createdAt');

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get blog by slug
router.get('/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, published: true });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new blog (admin only)
// router.post('/', async (req, res) => {
//   try {
//     const blog = new Blog(req.body);
//     await blog.save();
//     res.status(201).json(blog);
//   } catch (error) {
//     if (error.code === 11000) {
//       res.status(400).json({ message: 'Blog with this title already exists' });
//     } else {
//       res.status(400).json({ message: error.message });
//     }
//   }
// });
router.post('/', async (req, res) => {
  try {
    const { title, content, excerpt, imageUrl, author, category, tags, published } = req.body;

    const slug = slugify(title, { lower: true, strict: true });

    const blog = new Blog({
      title,
      slug,
      content,
      excerpt,
      imageUrl,
      author,
      category,
      tags,
      published: published ?? true
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Blog with this title already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});


// Update blog
router.put('/:id', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete blog
router.delete('/:id', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all blogs for admin (including unpublished)
router.get('/admin/all', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;