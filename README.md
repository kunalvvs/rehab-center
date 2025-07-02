# Rehabilitation Center Website

A full-stack rehabilitation center website with blog and quiz management system.

## Features

- 📝 Blog System with admin management
- 🧠 Patient Quiz System with scoring
- 🔐 Admin authentication
- 📱 Responsive design
- 🚀 SEO-friendly URLs

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT

## Deployment on Render

### Prerequisites

1. MongoDB Atlas account with a database cluster
2. Render account

### Steps

1. **Fork/Clone this repository**

2. **Set up MongoDB Atlas**:
   - Create a cluster on MongoDB Atlas
   - Get your connection string
   - Whitelist Render's IP addresses (or use 0.0.0.0/0 for all IPs)

3. **Deploy on Render**:
   - Connect your GitHub repository to Render
   - Create a new Web Service
   - Use the following settings:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Node Version**: 18 or higher

4. **Environment Variables**:
   Set these in your Render dashboard:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secure_jwt_secret_key
   NODE_ENV=production
   ```

5. **MongoDB Connection String Format**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
   ```

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Fill in your MongoDB URI and JWT secret

3. **Run the application**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Main site: `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin`

## Admin Access

1. Go to `/admin`
2. Register a new admin account (first time)
3. Login with your credentials
4. Manage blogs and quizzes

## API Endpoints

### Blogs
- `GET /api/blogs` - Get all published blogs
- `GET /api/blogs/:slug` - Get blog by slug
- `POST /api/blogs` - Create new blog (admin)
- `PUT /api/blogs/:id` - Update blog (admin)
- `DELETE /api/blogs/:id` - Delete blog (admin)

### Quizzes
- `GET /api/quiz` - Get all active quizzes
- `GET /api/quiz/:id` - Get quiz by ID
- `POST /api/quiz/:id/submit` - Submit quiz attempt
- `POST /api/quiz` - Create new quiz (admin)
- `PUT /api/quiz/:id` - Update quiz (admin)
- `DELETE /api/quiz/:id` - Delete quiz (admin)

### Authentication
- `POST /api/auth/register` - Register admin
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

## License

MIT License