import express from 'express';
import { Quiz, QuizAttempt } from '../models/Quiz.js';

const router = express.Router();

// Get all active quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ active: true })
      .select('title description category difficulty createdAt')
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get quiz by ID (with questions)
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

// Submit quiz attempt
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

// Create new quiz (admin only)
router.post('/', async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update quiz
router.put('/:id', async (req, res) => {
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

// Delete quiz
router.delete('/:id', async (req, res) => {
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

// Get all quizzes for admin
router.get('/admin/all', async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get quiz attempts
router.get('/admin/attempts', async (req, res) => {
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