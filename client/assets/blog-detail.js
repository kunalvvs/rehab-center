// Blog detail page functionality
document.addEventListener('DOMContentLoaded', function() {
    loadBlogPost();
});

async function loadBlogPost() {
    try {
        // Get slug from URL
        const pathParts = window.location.pathname.split('/');
        const slug = pathParts[pathParts.length - 1];
        
        console.log('Loading blog with slug:', slug);
        
        if (!slug || slug === 'blog') {
            window.location.href = '/blog';
            return;
        }

        const response = await fetch(`/api/blogs/${slug}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showNotFound();
            } else {
                showError('Error loading article. Please try again later.');
            }
            return;
        }

        const blog = await response.json();
        console.log('Blog loaded:', blog);
        displayBlogPost(blog);
        loadRelatedArticles(blog.category, blog._id);
        updatePageMeta(blog);
        
    } catch (error) {
        console.error('Error loading blog post:', error);
        showError('Error loading article. Please try again later.');
    }
}

function displayBlogPost(blog) {
    // Update title and meta
    document.getElementById('article-title').textContent = blog.title;
    document.getElementById('article-title-breadcrumb').textContent = blog.title;
    document.getElementById('article-category').textContent = blog.category;
    document.getElementById('article-date').textContent = formatDate(blog.createdAt);
    document.getElementById('article-author').textContent = `By ${blog.author}`;
    
    // Update image
    const articleImage = document.getElementById('article-image');
    articleImage.src = blog.imageUrl;
    articleImage.alt = blog.title;
    
    // Update content
    const articleBody = document.getElementById('article-body');
    articleBody.innerHTML = formatContent(blog.content);
    
    // Update tags
    const tagsContainer = document.getElementById('article-tags');
    if (blog.tags && blog.tags.length > 0) {
        tagsContainer.innerHTML = blog.tags.map(tag => 
            `<span class="tag">#${tag}</span>`
        ).join('');
    } else {
        tagsContainer.style.display = 'none';
    }
}

function formatContent(content) {
    // Basic content formatting
    return content
        .split('\n\n')
        .map(paragraph => {
            if (paragraph.trim()) {
                // Check if it's a heading (starts with #)
                if (paragraph.startsWith('# ')) {
                    return `<h2>${paragraph.substring(2)}</h2>`;
                } else if (paragraph.startsWith('## ')) {
                    return `<h3>${paragraph.substring(3)}</h3>`;
                } else if (paragraph.startsWith('### ')) {
                    return `<h4>${paragraph.substring(4)}</h4>`;
                } else {
                    return `<p>${paragraph}</p>`;
                }
            }
            return '';
        })
        .join('');
}

async function loadRelatedArticles(category, currentId) {
    try {
        const response = await fetch(`/api/blogs?category=${category}&limit=3`);
        const data = await response.json();
        
        // Filter out current article
        const relatedArticles = data.blogs.filter(blog => blog._id !== currentId);
        
        const container = document.getElementById('related-articles');
        
        if (relatedArticles.length > 0) {
            container.innerHTML = relatedArticles.map(blog => `
                <article class="blog-card">
                    <img src="${blog.imageUrl}" alt="${blog.title}" loading="lazy">
                    <div class="blog-card-content">
                        <div class="blog-meta">
                            <span class="blog-category">${blog.category}</span>
                            <span>${formatDate(blog.createdAt)}</span>
                        </div>
                        <h3><a href="/blog/${blog.slug}">${blog.title}</a></h3>
                        <p class="blog-excerpt">${blog.excerpt}</p>
                        <a href="/blog/${blog.slug}" class="read-more">Read More →</a>
                    </div>
                </article>
            `).join('');
        } else {
            document.querySelector('.related-articles').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading related articles:', error);
        document.querySelector('.related-articles').style.display = 'none';
    }
}

function updatePageMeta(blog) {
    // Update page title
    document.title = `${blog.title} - Hope Rehabilitation Center`;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.content = blog.excerpt;
    }
}

function showNotFound() {
    const container = document.querySelector('.article-detail .container');
    container.innerHTML = `
        <div class="text-center py-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
            <p class="text-xl text-gray-600 mb-8">The article you're looking for doesn't exist or has been moved.</p>
            <div class="space-x-4">
                <a href="/blog" class="btn btn-primary">Browse Articles</a>
                <a href="/" class="btn btn-outline">Go Home</a>
            </div>
        </div>
    `;
    
    // Hide related articles section
    document.querySelector('.related-articles').style.display = 'none';
}

function showError(message) {
    const container = document.querySelector('.article-detail .container');
    container.innerHTML = `
        <div class="text-center py-12">
            <h1 class="text-4xl font-bold text-red-600 mb-4">Error</h1>
            <p class="text-xl text-gray-600 mb-8">${message}</p>
            <div class="space-x-4">
                <button onclick="loadBlogPost()" class="btn btn-primary">Try Again</button>
                <a href="/blog" class="btn btn-outline">Browse Articles</a>
            </div>
        </div>
    `;
    
    // Hide related articles section
    document.querySelector('.related-articles').style.display = 'none';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}