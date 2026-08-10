const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    res.json([
        { id: '1', name: 'Python' },
        { id: '2', name: 'MERN Stack' },
        { id: '3', name: 'AI/ML' },
        { id: '4', name: 'DSA' },
        { id: '5', name: 'UI/UX' },
        { id: '6', name: 'Cybersecurity' }
    ]);
});

module.exports = router;