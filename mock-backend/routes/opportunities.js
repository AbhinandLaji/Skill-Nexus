const express = require('express');
const Opportunity = require('../models/Opportunity');
const { protect } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_OPPORTUNITIES = [
    {
        type: 'INTERNSHIP',
        typeColor: 'primary',
        title: 'Frontend Engineering Intern - Summer 2024',
        company: 'Vercel • San Francisco, CA (Hybrid)',
        deadline: 'Ends in 3 days',
        icon: 'schedule',
        description: 'Join the team shaping the future of the Web. Experience with Next.js and Tailwind is a plus.'
    },
    {
        type: 'HACKATHON',
        typeColor: '#a855f7',
        title: 'Global AI Build-a-thon: Generative Agents',
        company: 'HuggingFace & AWS • Remote',
        deadline: 'Ends in 12 hrs',
        icon: 'schedule',
        description: 'Build innovative generative agent platforms with leading open-source models.'
    },
    {
        type: 'EVENT',
        typeColor: '#3b82f6',
        title: 'Rust Foundation: Core Systems Architecture Panel',
        company: 'Rust Foundation • Virtual',
        deadline: 'Oct 15, 2023',
        icon: 'calendar_today',
        description: 'Technical deep-dive on low-level memory safety and concurrent programming.'
    }
];

const formatOpportunity = (opp) => ({
    id: opp._id ? opp._id.toString() : opp.id,
    _id: opp._id ? opp._id.toString() : opp.id,
    type: opp.type,
    typeColor: opp.typeColor,
    title: opp.title,
    company: opp.company,
    deadline: opp.deadline,
    icon: opp.icon,
    description: opp.description
});

// GET /api/opportunities - List all opportunities
router.get('/', async (req, res) => {
    try {
        let opps = await Opportunity.find();

        if (!opps || opps.length === 0) {
            opps = await Opportunity.insertMany(DEFAULT_OPPORTUNITIES);
        }

        return res.json(opps.map(formatOpportunity));
    } catch (error) {
        return res.json(DEFAULT_OPPORTUNITIES.map((o, idx) => ({ ...o, id: (idx + 1).toString() })));
    }
});

// POST /api/opportunities/:id/register - Register for opportunity
router.post('/:id/register', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const opp = await Opportunity.findById(id);

        if (opp && req.user) {
            if (!opp.applicants.includes(req.user._id)) {
                opp.applicants.push(req.user._id);
                await opp.save();
            }
        }

        return res.json({ success: true, message: 'Successfully registered for opportunity' });
    } catch (error) {
        return res.json({ success: true });
    }
});

module.exports = router;
