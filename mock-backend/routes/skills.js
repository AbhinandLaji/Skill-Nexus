const express = require('express');
const Skill = require('../models/Skill');

const router = express.Router();

const DEFAULT_SKILLS = [
    { name: 'Python', colorAccent: '#3776AB' },
    { name: 'MERN Stack', colorAccent: '#61DAFB' },
    { name: 'AI/ML', colorAccent: '#FF9900' },
    { name: 'DSA', colorAccent: '#4CAF50' },
    { name: 'UI/UX', colorAccent: '#FF4081' },
    { name: 'Cybersecurity', colorAccent: '#000000' }
];

// GET /api/skills
router.get('/', async (req, res) => {
    try {
        let skills = await Skill.find();

        if (!skills || skills.length === 0) {
            // Auto-seed default skills if collection is empty
            skills = await Skill.insertMany(DEFAULT_SKILLS);
        }

        const formattedSkills = skills.map(s => ({
            id: s._id.toString(),
            _id: s._id.toString(),
            name: s.name,
            colorAccent: s.colorAccent
        }));

        return res.json(formattedSkills);
    } catch (error) {
        // Fallback to static in case of any database hiccup
        return res.json(
            DEFAULT_SKILLS.map((s, index) => ({
                id: (index + 1).toString(),
                name: s.name,
                colorAccent: s.colorAccent
            }))
        );
    }
});

module.exports = router;