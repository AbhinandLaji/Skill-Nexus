const express = require('express');
const Question = require('../models/Question');
const { protect } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_QUESTIONS = [
    {
        question: 'How do you optimize large SQL queries with multiple JOINs?',
        askedByName: 'alex_dev',
        skillTags: ['Database', 'PostgreSQL'],
        answerCount: 1,
        answers: [
            {
                text: 'Make sure your foreign keys and join condition columns have indexes. Check EXPLAIN ANALYZE for sequential scans.',
                answeredByName: 'Sarah Jenkins',
                isMentor: true
            }
        ]
    },
    {
        question: 'What is the best way to handle global state in modern React 19?',
        askedByName: 'sarah_data',
        skillTags: ['React', 'Frontend'],
        answerCount: 0,
        answers: []
    }
];

const formatQuestion = (q) => ({
    id: q._id ? q._id.toString() : q.id,
    _id: q._id ? q._id.toString() : q.id,
    question: q.question,
    askedById: q.askedById ? q.askedById.toString() : null,
    askedByName: q.askedByName || 'Anonymous',
    skillTags: q.skillTags || [],
    answerCount: q.answerCount || (q.answers ? q.answers.length : 0),
    answers: (q.answers || []).map(a => ({
        id: a._id ? a._id.toString() : a.id,
        _id: a._id ? a._id.toString() : a.id,
        text: a.text,
        answeredById: a.answeredById ? a.answeredById.toString() : null,
        answeredByName: a.answeredByName || 'Community Member',
        isMentor: a.isMentor || false,
        createdAt: a.createdAt || new Date()
    }))
});

// GET /api/mentorship/questions
router.get('/questions', async (req, res) => {
    try {
        let questions = await Question.find().sort({ createdAt: -1 });

        if (!questions || questions.length === 0) {
            questions = await Question.insertMany(DEFAULT_QUESTIONS);
        }

        return res.json(questions.map(formatQuestion));
    } catch (error) {
        return res.json(DEFAULT_QUESTIONS.map((q, idx) => ({ ...q, id: (idx + 1).toString() })));
    }
});

// POST /api/mentorship/questions
router.post('/questions', protect, async (req, res) => {
    try {
        const { question, skillTags } = req.body;

        if (!question) {
            return res.status(400).json({ message: 'Question content is required' });
        }

        const newQuestion = await Question.create({
            question,
            skillTags: Array.isArray(skillTags) ? skillTags : [],
            askedById: req.user._id,
            askedByName: req.user.name || 'Anonymous',
            answerCount: 0,
            answers: []
        });

        const formatted = formatQuestion(newQuestion);
        return res.status(201).json({
            question: formatted,
            ...formatted
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to post question', error: error.message });
    }
});

// POST /api/mentorship/questions/:id/answers
router.post('/questions/:id/answers', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Answer text is required' });
        }

        const question = await Question.findById(id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const answer = {
            text,
            answeredById: req.user._id,
            answeredByName: req.user.name || 'Community Member',
            isMentor: req.user.isMentor || false
        };

        question.answers.push(answer);
        question.answerCount = question.answers.length;
        await question.save();

        const createdAnswer = question.answers[question.answers.length - 1];

        return res.status(201).json({
            answer: {
                id: createdAnswer._id.toString(),
                text: createdAnswer.text,
                answeredById: createdAnswer.answeredById?.toString(),
                answeredByName: createdAnswer.answeredByName,
                isMentor: createdAnswer.isMentor
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to submit answer', error: error.message });
    }
});

module.exports = router;
