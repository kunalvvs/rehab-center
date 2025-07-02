// Quiz page functionality
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let patientInfo = {};

document.addEventListener('DOMContentLoaded', function() {
    loadQuizzes();
});

async function loadQuizzes() {
    try {
        const response = await fetch('/api/quiz');
        const quizzes = await response.json();
        
        displayQuizzes(quizzes);
    } catch (error) {
        console.error('Error loading quizzes:', error);
        showError('Error loading quizzes. Please try again later.');
    }
}

function displayQuizzes(quizzes) {
    const container = document.getElementById('quiz-list');
    
    if (!quizzes || quizzes.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 col-span-full">
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No quizzes available</h3>
                <p class="text-gray-500">Please check back later for assessment quizzes.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = quizzes.map(quiz => `
        <div class="quiz-card" onclick="selectQuiz('${quiz._id}')">
            <div class="quiz-header">
                <span class="quiz-difficulty">${quiz.difficulty}</span>
            </div>
            <h3>${quiz.title}</h3>
            <p>${quiz.description}</p>
            <div class="quiz-meta">
                <span class="blog-category">${quiz.category}</span>
                <span>${quiz.questions ? quiz.questions.length : 0} Questions</span>
            </div>
            <div class="text-center mt-4">
                <button class="btn btn-primary">Start Assessment</button>
            </div>
        </div>
    `).join('');
}

async function selectQuiz(quizId) {
    try {
        const response = await fetch(`/api/quiz/${quizId}`);
        currentQuiz = await response.json();
        
        // Show patient information form
        document.getElementById('quiz-selection').style.display = 'none';
        document.getElementById('quiz-container').style.display = 'block';
        document.getElementById('patient-form').style.display = 'block';
        
        // Update quiz title
        document.getElementById('quiz-title').textContent = currentQuiz.title;
        
    } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Error loading quiz. Please try again.');
    }
}

function goBackToQuizList() {
    document.getElementById('quiz-selection').style.display = 'block';
    document.getElementById('quiz-container').style.display = 'none';
    currentQuiz = null;
    currentQuestionIndex = 0;
    userAnswers = [];
    patientInfo = {};
}

// Patient information form submission
document.getElementById('patient-info-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('patient-name').value.trim();
    const email = document.getElementById('patient-email').value.trim();
    
    if (!name || !email) {
        alert('Please fill in all required fields.');
        return;
    }
    
    patientInfo = { name, email };
    startQuiz();
});

function startQuiz() {
    if (!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) {
        alert('Quiz data is not available. Please try again.');
        return;
    }
    
    // Hide patient form and show quiz interface
    document.getElementById('patient-form').style.display = 'none';
    document.getElementById('quiz-interface').style.display = 'block';
    
    // Initialize quiz state
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuiz.questions.length).fill(-1);
    
    displayQuestion();
    updateProgress();
}

function displayQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    const container = document.getElementById('question-container');
    
    container.innerHTML = `
        <div class="question-text">
            Question ${currentQuestionIndex + 1}: ${question.question}
        </div>
        <div class="options-container">
            ${question.options.map((option, index) => `
                <label class="option ${userAnswers[currentQuestionIndex] === index ? 'selected' : ''}" 
                       onclick="selectAnswer(${index})">
                    <input type="radio" name="question-${currentQuestionIndex}" value="${index}" 
                           ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}>
                    ${option}
                </label>
            `).join('')}
        </div>
    `;
}

function selectAnswer(answerIndex) {
    userAnswers[currentQuestionIndex] = answerIndex;
    
    // Update visual selection
    const options = document.querySelectorAll('.option');
    options.forEach((option, index) => {
        option.classList.toggle('selected', index === answerIndex);
    });
    
    updateNavigationButtons();
}

function updateProgress() {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    
    const isLastQuestion = currentQuestionIndex === currentQuiz.questions.length - 1;
    
    if (isLastQuestion) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        updateProgress();
        updateNavigationButtons();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        updateProgress();
        updateNavigationButtons();
    }
}

async function submitQuiz() {
    // Check if all questions are answered
    const unansweredQuestions = userAnswers.some(answer => answer === -1);
    
    if (unansweredQuestions) {
        const proceed = confirm('Some questions are not answered. Do you want to submit anyway?');
        if (!proceed) return;
    }
    
    try {
        // Prepare submission data
        const submissionData = {
            patientName: patientInfo.name,
            patientEmail: patientInfo.email,
            answers: userAnswers.map((answer, index) => ({
                questionIndex: index,
                selectedAnswer: answer
            })).filter(answer => answer.selectedAnswer !== -1)
        };
        
        const response = await fetch(`/api/quiz/${currentQuiz._id}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit quiz');
        }
        
        const results = await response.json();
        displayResults(results);
        
    } catch (error) {
        console.error('Error submitting quiz:', error);
        alert('Error submitting quiz. Please try again.');
    }
}

function displayResults(results) {
    // Hide quiz interface and show results
    document.getElementById('quiz-interface').style.display = 'none';
    document.getElementById('quiz-results').style.display = 'block';
    
    // Display score
    document.getElementById('score-percentage').textContent = `${results.percentage}%`;
    document.getElementById('score-text').textContent = `${results.score} out of ${results.totalQuestions}`;
    
    // Display detailed results
    const detailsContainer = document.getElementById('results-details');
    detailsContainer.innerHTML = `
        <h3>Detailed Results</h3>
        ${results.results.map((result, index) => `
            <div class="result-item">
                <div class="result-question">
                    <strong>Question ${index + 1}:</strong> ${result.question}
                </div>
                <div class="result-answer ${result.isCorrect ? 'correct-answer' : 'incorrect-answer'}">
                    <strong>Your Answer:</strong> ${result.userAnswer >= 0 ? currentQuiz.questions[index].options[result.userAnswer] : 'Not answered'} 
                    ${result.isCorrect ? '✓' : '✗'}
                </div>
                ${!result.isCorrect ? `
                    <div class="result-answer correct-answer">
                        <strong>Correct Answer:</strong> ${currentQuiz.questions[index].options[result.correctAnswer]} ✓
                    </div>
                ` : ''}
                ${result.explanation ? `
                    <div class="result-explanation">
                        <strong>Explanation:</strong> ${result.explanation}
                    </div>
                ` : ''}
            </div>
        `).join('')}
        
        <div class="results-summary">
            <h4>Assessment Summary</h4>
            <p>Thank you for completing the ${currentQuiz.title} assessment. Your results have been recorded and can help guide your rehabilitation journey.</p>
            ${getResultsRecommendation(results.percentage)}
        </div>
    `;
}

function getResultsRecommendation(percentage) {
    if (percentage >= 80) {
        return `
            <div class="alert alert-success">
                <strong>Excellent!</strong> You demonstrate a strong understanding of the topic. Continue with your current approach and consider sharing your knowledge with others.
            </div>
        `;
    } else if (percentage >= 60) {
        return `
            <div class="alert alert-info">
                <strong>Good job!</strong> You have a solid foundation. Consider reviewing the areas where you missed questions and explore additional resources in our blog section.
            </div>
        `;
    } else if (percentage >= 40) {
        return `
            <div class="alert alert-info">
                <strong>Fair performance.</strong> There's room for improvement. We recommend reading our educational articles and possibly scheduling a consultation with our professionals.
            </div>
        `;
    } else {
        return `
            <div class="alert alert-error">
                <strong>Additional support recommended.</strong> Consider reaching out to our professionals for personalized guidance and support. Our team is here to help you on your journey.
            </div>
        `;
    }
}

function showError(message) {
    const container = document.getElementById('quiz-list');
    container.innerHTML = `
        <div class="text-center py-12 col-span-full">
            <h3 class="text-xl font-semibold text-red-600 mb-2">Error</h3>
            <p class="text-gray-500">${message}</p>
            <button onclick="loadQuizzes()" class="btn btn-primary mt-4">Try Again</button>
        </div>
    `;
}