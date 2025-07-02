// Admin dashboard functionality
let currentUser = null;
let editingBlog = null;
let editingQuiz = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // Blog form
    document.getElementById('blog-form').addEventListener('submit', handleBlogSubmit);
    
    // Quiz form
    document.getElementById('quiz-form').addEventListener('submit', handleQuizSubmit);
}

async function checkAuthStatus() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showLoginForm();
        return;
    }
    
    try {
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showDashboard();
        } else {
            localStorage.removeItem('adminToken');
            showLoginForm();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('adminToken');
        showLoginForm();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            currentUser = data.user;
            showDashboard();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            currentUser = data.user;
            showDashboard();
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

function showLoginForm() {
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    
    document.getElementById('admin-username').textContent = `Welcome, ${currentUser.username}`;
    
    loadDashboardData();
}

function logout() {
    localStorage.removeItem('adminToken');
    currentUser = null;
    showLoginForm();
}

async function loadDashboardData() {
    await Promise.all([
        loadStatistics(),
        loadBlogsTable(),
        loadQuizzesTable(),
        loadQuizAttempts()
    ]);
}

async function loadStatistics() {
    try {
        const [blogsResponse, quizzesResponse, attemptsResponse] = await Promise.all([
            fetch('/api/blogs/admin/all', { headers: getAuthHeaders() }),
            fetch('/api/quiz/admin/all', { headers: getAuthHeaders() }),
            fetch('/api/quiz/admin/attempts', { headers: getAuthHeaders() })
        ]);
        
        const blogs = await blogsResponse.json();
        const quizzes = await quizzesResponse.json();
        const attempts = await attemptsResponse.json();
        
        document.getElementById('total-blogs').textContent = blogs.length;
        document.getElementById('total-quizzes').textContent = quizzes.length;
        document.getElementById('total-attempts').textContent = attempts.length;
        
        // Calculate average score
        if (attempts.length > 0) {
            const avgScore = attempts.reduce((sum, attempt) => {
                return sum + (attempt.score / attempt.totalQuestions) * 100;
            }, 0) / attempts.length;
            document.getElementById('avg-score').textContent = `${Math.round(avgScore)}%`;
        } else {
            document.getElementById('avg-score').textContent = '0%';
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

async function loadBlogsTable() {
    try {
        const response = await fetch('/api/blogs/admin/all', { headers: getAuthHeaders() });
        const blogs = await response.json();
        
        const tbody = document.getElementById('blogs-table');
        tbody.innerHTML = blogs.map(blog => `
            <tr>
                <td>${blog.title}</td>
                <td><span class="blog-category">${blog.category}</span></td>
                <td>${formatDate(blog.createdAt)}</td>
                <td><span class="status-badge ${blog.published ? 'status-published' : 'status-draft'}">${blog.published ? 'Published' : 'Draft'}</span></td>
                <td class="table-actions">
                    <button class="btn-small btn-edit" onclick="editBlog('${blog._id}')">Edit</button>
                    <button class="btn-small btn-delete" onclick="deleteBlog('${blog._id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading blogs:', error);
    }
}

async function loadQuizzesTable() {
    try {
        const response = await fetch('/api/quiz/admin/all', { headers: getAuthHeaders() });
        const quizzes = await response.json();
        
        const tbody = document.getElementById('quizzes-table');
        tbody.innerHTML = quizzes.map(quiz => `
            <tr>
                <td>${quiz.title}</td>
                <td><span class="blog-category">${quiz.category}</span></td>
                <td>${quiz.questions ? quiz.questions.length : 0}</td>
                <td><span class="quiz-difficulty">${quiz.difficulty}</span></td>
                <td><span class="status-badge ${quiz.active ? 'status-active' : 'status-inactive'}">${quiz.active ? 'Active' : 'Inactive'}</span></td>
                <td class="table-actions">
                    <button class="btn-small btn-edit" onclick="editQuiz('${quiz._id}')">Edit</button>
                    <button class="btn-small btn-delete" onclick="deleteQuiz('${quiz._id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading quizzes:', error);
    }
}

async function loadQuizAttempts() {
    try {
        const response = await fetch('/api/quiz/admin/attempts', { headers: getAuthHeaders() });
        const attempts = await response.json();
        
        const tbody = document.getElementById('attempts-table');
        tbody.innerHTML = attempts.map(attempt => `
            <tr>
                <td>${attempt.patientName}</td>
                <td>${attempt.patientEmail}</td>
                <td>${attempt.quizId ? attempt.quizId.title : 'Unknown Quiz'}</td>
                <td>${attempt.score}/${attempt.totalQuestions}</td>
                <td>${Math.round((attempt.score / attempt.totalQuestions) * 100)}%</td>
                <td>${formatDate(attempt.completedAt)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading quiz attempts:', error);
    }
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).style.display = 'block';
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Blog Management
function showAddBlogForm() {
    editingBlog = null;
    document.getElementById('blog-form-title').textContent = 'Add New Blog Post';
    document.getElementById('blog-form').reset();
    document.getElementById('blog-id').value = '';
    document.getElementById('blog-form-container').style.display = 'block';
}

function hideBlogForm() {
    document.getElementById('blog-form-container').style.display = 'none';
    editingBlog = null;
}

async function editBlog(blogId) {
    try {
        const response = await fetch(`/api/blogs/admin/all`, { headers: getAuthHeaders() });
        const blogs = await response.json();
        const blog = blogs.find(b => b._id === blogId);
        
        if (blog) {
            editingBlog = blog;
            document.getElementById('blog-form-title').textContent = 'Edit Blog Post';
            document.getElementById('blog-id').value = blog._id;
            document.getElementById('blog-title').value = blog.title;
            document.getElementById('blog-category').value = blog.category;
            document.getElementById('blog-image').value = blog.imageUrl;
            document.getElementById('blog-excerpt').value = blog.excerpt;
            document.getElementById('blog-content').value = blog.content;
            document.getElementById('blog-tags').value = blog.tags ? blog.tags.join(', ') : '';
            document.getElementById('blog-form-container').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading blog for editing:', error);
        alert('Error loading blog for editing.');
    }
}

async function handleBlogSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('blog-title').value.trim();
    const category = document.getElementById('blog-category').value;
    const imageUrl = document.getElementById('blog-image').value.trim();
    const excerpt = document.getElementById('blog-excerpt').value.trim();
    const content = document.getElementById('blog-content').value.trim();
    const tags = document.getElementById('blog-tags').value;
    
    // Validate required fields
    if (!title || !category || !imageUrl || !excerpt || !content) {
        alert('Please fill in all required fields.');
        return;
    }
    
    const blogData = {
        title,
        category,
        imageUrl,
        excerpt,
        content,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    try {
        const blogId = document.getElementById('blog-id').value;
        const url = blogId ? `/api/blogs/${blogId}` : '/api/blogs';
        const method = blogId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(blogData)
        });
        
        if (response.ok) {
            hideBlogForm();
            loadBlogsTable();
            loadStatistics();
            alert(blogId ? 'Blog updated successfully!' : 'Blog created successfully!');
        } else {
            const data = await response.json();
            alert(data.message || 'Error saving blog');
        }
    } catch (error) {
        console.error('Error saving blog:', error);
        alert('Error saving blog. Please try again.');
    }
}

async function deleteBlog(blogId) {
    if (!confirm('Are you sure you want to delete this blog post?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/blogs/${blogId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            loadBlogsTable();
            loadStatistics();
            alert('Blog deleted successfully!');
        } else {
            alert('Error deleting blog');
        }
    } catch (error) {
        console.error('Error deleting blog:', error);
        alert('Error deleting blog. Please try again.');
    }
}

// Quiz Management
function showAddQuizForm() {
    editingQuiz = null;
    document.getElementById('quiz-form-title').textContent = 'Add New Quiz';
    document.getElementById('quiz-form').reset();
    document.getElementById('quiz-id').value = '';
    document.getElementById('questions-container').innerHTML = '';
    addQuestion(); // Add one question by default
    document.getElementById('quiz-form-container').style.display = 'block';
}

function hideQuizForm() {
    document.getElementById('quiz-form-container').style.display = 'none';
    editingQuiz = null;
}

function addQuestion() {
    const container = document.getElementById('questions-container');
    const questionIndex = container.children.length;
    
    const questionHTML = `
        <div class="question-item" data-index="${questionIndex}">
            <div class="question-header">
                <span class="question-number">Question ${questionIndex + 1}</span>
                <button type="button" class="remove-question" onclick="removeQuestion(${questionIndex})">Remove</button>
            </div>
            <div class="form-group">
                <label>Question Text *</label>
                <textarea name="question-text" rows="2" required></textarea>
            </div>
            <div class="form-group">
                <label>Options *</label>
                <div class="options-grid">
                    <div class="option-input">
                        <input type="radio" name="correct-${questionIndex}" value="0" required>
                        <input type="text" name="option-0" placeholder="Option A" required>
                    </div>
                    <div class="option-input">
                        <input type="radio" name="correct-${questionIndex}" value="1" required>
                        <input type="text" name="option-1" placeholder="Option B" required>
                    </div>
                    <div class="option-input">
                        <input type="radio" name="correct-${questionIndex}" value="2" required>
                        <input type="text" name="option-2" placeholder="Option C" required>
                    </div>
                    <div class="option-input">
                        <input type="radio" name="correct-${questionIndex}" value="3" required>
                        <input type="text" name="option-3" placeholder="Option D" required>
                    </div>
                </div>
                <small>Select the correct answer by clicking the radio button</small>
            </div>
            <div class="form-group">
                <label>Explanation (Optional)</label>
                <textarea name="explanation" rows="2" placeholder="Explain why this is the correct answer..."></textarea>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
}

function removeQuestion(questionIndex) {
    const questionItem = document.querySelector(`[data-index="${questionIndex}"]`);
    if (questionItem) {
        questionItem.remove();
        updateQuestionNumbers();
    }
}

function updateQuestionNumbers() {
    const questions = document.querySelectorAll('.question-item');
    questions.forEach((question, index) => {
        question.setAttribute('data-index', index);
        question.querySelector('.question-number').textContent = `Question ${index + 1}`;
        
        // Update radio button names
        const radios = question.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.name = `correct-${index}`;
        });
    });
}

async function editQuiz(quizId) {
    try {
        const response = await fetch(`/api/quiz/admin/all`, { headers: getAuthHeaders() });
        const quizzes = await response.json();
        const quiz = quizzes.find(q => q._id === quizId);
        
        if (quiz) {
            editingQuiz = quiz;
            document.getElementById('quiz-form-title').textContent = 'Edit Quiz';
            document.getElementById('quiz-id').value = quiz._id;
            document.getElementById('quiz-title').value = quiz.title;
            document.getElementById('quiz-description').value = quiz.description;
            document.getElementById('quiz-category').value = quiz.category;
            document.getElementById('quiz-difficulty').value = quiz.difficulty;
            
            // Load questions
            const container = document.getElementById('questions-container');
            container.innerHTML = '';
            
            quiz.questions.forEach((question, index) => {
                addQuestion();
                const questionItem = container.children[index];
                
                questionItem.querySelector('[name="question-text"]').value = question.question;
                questionItem.querySelector('[name="explanation"]').value = question.explanation || '';
                
                question.options.forEach((option, optionIndex) => {
                    questionItem.querySelector(`[name="option-${optionIndex}"]`).value = option;
                });
                
                questionItem.querySelector(`[name="correct-${index}"][value="${question.correctAnswer}"]`).checked = true;
            });
            
            document.getElementById('quiz-form-container').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading quiz for editing:', error);
        alert('Error loading quiz for editing.');
    }
}

async function handleQuizSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('quiz-title').value.trim();
    const description = document.getElementById('quiz-description').value.trim();
    const category = document.getElementById('quiz-category').value;
    const difficulty = document.getElementById('quiz-difficulty').value;
    
    if (!title || !description || !category || !difficulty) {
        alert('Please fill in all required quiz fields.');
        return;
    }
    
    const questions = [];
    const questionItems = document.querySelectorAll('.question-item');
    
    for (let i = 0; i < questionItems.length; i++) {
        const item = questionItems[i];
        const questionText = item.querySelector('[name="question-text"]').value.trim();
        const options = [];
        
        for (let j = 0; j < 4; j++) {
            const optionValue = item.querySelector(`[name="option-${j}"]`).value.trim();
            if (!optionValue) {
                alert(`Please fill in all options for Question ${i + 1}`);
                return;
            }
            options.push(optionValue);
        }
        
        const correctAnswerRadio = item.querySelector(`[name="correct-${i}"]:checked`);
        if (!correctAnswerRadio) {
            alert(`Please select the correct answer for Question ${i + 1}`);
            return;
        }
        
        const correctAnswer = parseInt(correctAnswerRadio.value);
        const explanation = item.querySelector('[name="explanation"]').value.trim();
        
        if (!questionText) {
            alert(`Please enter the question text for Question ${i + 1}`);
            return;
        }
        
        questions.push({
            question: questionText,
            options,
            correctAnswer,
            explanation
        });
    }
    
    if (questions.length === 0) {
        alert('Please add at least one question.');
        return;
    }
    
    const quizData = {
        title,
        description,
        category,
        difficulty,
        questions
    };
    
    try {
        const quizId = document.getElementById('quiz-id').value;
        const url = quizId ? `/api/quiz/${quizId}` : '/api/quiz';
        const method = quizId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(quizData)
        });
        
        if (response.ok) {
            hideQuizForm();
            loadQuizzesTable();
            loadStatistics();
            alert(quizId ? 'Quiz updated successfully!' : 'Quiz created successfully!');
        } else {
            const data = await response.json();
            alert(data.message || 'Error saving quiz');
        }
    } catch (error) {
        console.error('Error saving quiz:', error);
        alert('Error saving quiz. Please try again.');
    }
}

async function deleteQuiz(quizId) {
    if (!confirm('Are you sure you want to delete this quiz?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/quiz/${quizId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            loadQuizzesTable();
            loadStatistics();
            alert('Quiz deleted successfully!');
        } else {
            alert('Error deleting quiz');
        }
    } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Error deleting quiz. Please try again.');
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Authorization': `Bearer ${token}`
    };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}