// Blog page functionality
let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', function() {
    initializeBlogPage();
});

function initializeBlogPage() {
    loadBlogs();
    setupEventListeners();
}

function setupEventListeners() {
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentCategory = this.value;
            currentPage = 1;
            loadBlogs();
        });
    }

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            performSearch();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

function performSearch() {
    const searchInput = document.getElementById('search-input');
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    loadBlogs();
}

async function loadBlogs() {
    showLoading();
    
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 12,
            category: currentCategory,
            search: currentSearch
        });

        const response = await fetch(`/api/blogs?${params}`);
        const data = await response.json();
        
        displayBlogs(data.blogs);
        displayPagination(data.currentPage, data.totalPages);
        hideLoading();
    } catch (error) {
        console.error('Error loading blogs:', error);
        showError('Error loading blog posts. Please try again later.');
        hideLoading();
    }
}

function displayBlogs(blogs) {
    const container = document.getElementById('blog-posts');
    
    if (!blogs || blogs.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No articles found</h3>
                <p class="text-gray-500">Try adjusting your search criteria or browse other categories.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = blogs.map(blog => `
        <article class="blog-card">
            <img src="${blog.imageUrl}" alt="${blog.title}" loading="lazy">
            <div class="blog-card-content">
                <div class="blog-meta">
                    <span class="blog-category">${blog.category}</span>
                    <span>${formatDate(blog.createdAt)}</span>
                    <span>By ${blog.author}</span>
                </div>
                <h3><a href="/blog/${blog.slug}">${blog.title}</a></h3>
                <p class="blog-excerpt">${blog.excerpt}</p>
                <div class="blog-tags">
                    ${blog.tags ? blog.tags.map(tag => `<span class="tag">#${tag}</span>`).join('') : ''}
                </div>
                <a href="/blog/${blog.slug}" class="read-more">Read Full Article →</a>
            </div>
        </article>
    `).join('');
}

function displayPagination(currentPage, totalPages) {
    const container = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button onclick="changePage(${currentPage - 1})">Previous</button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span>...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button onclick="changePage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span>...</span>`;
        }
        paginationHTML += `<button onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="changePage(${currentPage + 1})">Next</button>`;
    }
    
    container.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = parseInt(page);
    loadBlogs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLoading() {
    const loading = document.getElementById('loading');
    const blogPosts = document.getElementById('blog-posts');
    const pagination = document.getElementById('pagination');
    
    if (loading) loading.style.display = 'flex';
    if (blogPosts) blogPosts.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    const blogPosts = document.getElementById('blog-posts');
    const pagination = document.getElementById('pagination');
    
    if (loading) loading.style.display = 'none';
    if (blogPosts) blogPosts.style.display = 'grid';
    if (pagination) pagination.style.display = 'flex';
}

function showError(message) {
    const container = document.getElementById('blog-posts');
    container.innerHTML = `
        <div class="col-span-full text-center py-12">
            <h3 class="text-xl font-semibold text-red-600 mb-2">Error</h3>
            <p class="text-gray-500">${message}</p>
            <button onclick="loadBlogs()" class="btn btn-primary mt-4">Try Again</button>
        </div>
    `;
    container.style.display = 'grid';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}