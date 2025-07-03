// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target);
            const isClickOnHamburger = hamburger.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnHamburger && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    // Load featured blog posts on home page
    if (document.getElementById('featured-blogs')) {
        loadFeaturedBlogs();
    }
});

// Load featured blog posts for home page
async function loadFeaturedBlogs() {
    try {
        const response = await fetch('/api/blogs?limit=3');
        const data = await response.json();
        
        const container = document.getElementById('featured-blogs');
        if (data.blogs && data.blogs.length > 0) {
            container.innerHTML = data.blogs.map(blog => `
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
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-gray-500">No blog posts available yet.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading featured blogs:', error);
        const container = document.getElementById('featured-blogs');
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-red-500">Error loading blog posts. Please try again later.</p>
            </div>
        `;
    }
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Smooth scrolling for anchor links
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Add scroll effect to navigation
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.backgroundColor = 'white';
            navbar.style.backdropFilter = 'none';
        }
    }
});

// Initialize animations when elements come into view
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.service-card, .blog-card, .quiz-card');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
});