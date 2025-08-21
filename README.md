# FastKart Backend API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start MongoDB service

3. Create admin user:
```bash
POST /api/auth/register-admin
{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "admin123"
}
```

4. Start server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register-admin` - Register admin

### Blogs
- `GET /api/blogs` - Get all blogs
- `GET /api/blogs/:id` - Get blog by ID or slug
- `POST /api/blogs` - Create blog
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog

### Tags
- `GET /api/tags` - Get all tags
- `GET /api/tags/:id` - Get tag by ID
- `POST /api/tags` - Create tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## Sample Payloads

### Create Blog
```json
{
  "title": "Sample Blog Post",
  "slug": "sample-blog-post",
  "description": "This is a sample blog post description",
  "content": "This is the full content of the blog post...",
  "meta_title": "Sample Blog Post - SEO Title",
  "meta_description": "SEO description for the blog post",
  "blog_thumbnail": {
    "original_url": "assets/images/data/blog.png"
  },
  "is_featured": false,
  "is_sticky": false,
  "status": 1,
  "categories": [
    {
      "name": "Technology",
      "slug": "technology"
    }
  ],
  "tags": [
    {
      "name": "JavaScript",
      "slug": "javascript"
    }
  ]
}
```

### Create Tag
```json
{
  "name": "JavaScript",
  "slug": "javascript",
  "description": "JavaScript programming language",
  "status": 1
}
```

### Create Category
```json
{
  "name": "Technology",
  "slug": "technology",
  "description": "Technology related posts",
  "status": 1
}
```

## Environment Variables
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fastkart
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```