import express from 'express';
import jwt from 'jsonwebtoken';
import { Quiz, QuizAttempt } from '../models/Quiz.js';

const router = express.Router();

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Get all active quizzes (public)
router.get('/', async (req, res) => {
    try {
        const quizzes = await Quiz.find({ active: true })
            .select('title description category difficulty createdAt')
            .sort({ createdAt: -1 });
        
        // Add question count to each quiz
        const quizzesWithCount = await Promise.all(
            quizzes.map(async (quiz) => {
                const fullQuiz = await Quiz.findById(quiz._id);
                return {
                    ...quiz.toObject(),
                    questionCount: fullQuiz.questions ? fullQuiz.questions.length : 0
                };
            })
        );
        
        res.json(quizzesWithCount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get quiz by ID (with questions) - public
router.get('/:id', async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz || !quiz.active) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        
        // Remove correct answers from response
        const quizData = {
            ...quiz.toObject(),
            questions: quiz.questions.map(q => ({
                question: q.question,
                options: q.options,
                _id: q._id
            }))
        };
        
        res.json(quizData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Submit quiz attempt (public)
router.post('/:id/submit', async (req, res) => {
    try {
        const { patientName, patientEmail, answers } = req.body;
        const quiz = await Quiz.findById(req.params.id);
        
        if (!quiz || !quiz.active) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Calculate score
        let score = 0;
        const results = [];
        
        quiz.questions.forEach((question, index) => {
            const userAnswer = answers.find(a => a.questionIndex === index);
            const isCorrect = userAnswer && userAnswer.selectedAnswer === question.correctAnswer;
            
            if (isCorrect) score++;
            
            results.push({
                question: question.question,
                correctAnswer: question.correctAnswer,
                userAnswer: userAnswer ? userAnswer.selectedAnswer : -1,
                isCorrect,
                explanation: question.explanation
            });
        });

        // Save attempt
        const attempt = new QuizAttempt({
            quizId: quiz._id,
            patientName,
            patientEmail,
            answers,
            score,
            totalQuestions: quiz.questions.length
        });

        await attempt.save();

        res.json({
            score,
            totalQuestions: quiz.questions.length,
            percentage: Math.round((score / quiz.questions.length) * 100),
            results,
            attemptId: attempt._id
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Admin routes - require authentication
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const quiz = new Quiz(req.body);
        await quiz.save();
        res.status(201).json(quiz);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.json(quiz);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/admin/all', verifyAdmin, async (req, res) => {
    try {
        const quizzes = await Quiz.find().sort({ createdAt: -1 });
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/admin/attempts', verifyAdmin, async (req, res) => {
    try {
        const attempts = await QuizAttempt.find()
            .populate('quizId', 'title')
            .sort({ completedAt: -1 });
        res.json(attempts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;