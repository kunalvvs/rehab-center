import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import blogRoutes from './routes/blogRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rehab_center');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/blogs', blogRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/auth', authRoutes);

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/blog.html'));
});

app.get('/quiz', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/quiz.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/admin/dashboard.html'));
});

// SEO-friendly blog URLs
app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/blog-detail.html'));
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});