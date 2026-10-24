const express = require('express');
const Opportunity = require('../models/Opportunity');
const { protect } = require('../middleware/auth');

const router = express.Router();

const SEED_OPPORTUNITIES = [
    {
        title: 'Frontend Engineering Intern - Summer 2025',
        organization: 'Vercel',
        category: 'internship',
        deadline: 'Ends in 5 days',
        tags: ['React', 'Next.js', 'TypeScript', 'TailwindCSS'],
        link: 'https://vercel.com/careers',
        description: 'Join the team shaping the future of the Web. Collaborate on Turbopack, Next.js framework features, and design systems.',
        typeColor: 'primary',
        icon: 'work'
    },
    {
        title: 'Global AI Agents Hackathon: Autonomous Workflows',
        organization: 'Hugging Face & AWS',
        category: 'hackathon',
        deadline: 'Ends in 48 hours',
        tags: ['AI/ML', 'Python', 'LangChain', 'Open Source'],
        link: 'https://huggingface.co',
        description: 'Build innovative agentic workflows with leading open-weights models and distributed GPU infrastructure. $50,000 in prizes.',
        typeColor: '#a855f7',
        icon: 'terminal'
    },
    {
        title: 'Systems Architecture & Rust Concurrency Workshop',
        organization: 'Rust Foundation',
        category: 'workshop',
        deadline: 'Nov 12, 2026',
        tags: ['Rust', 'Systems', 'Concurrency', 'Low-Level'],
        link: 'https://foundation.rust-lang.org',
        description: 'Hands-on interactive masterclass covering memory safety guarantees, zero-cost abstractions, and asynchronous async-std architectures.',
        typeColor: '#3b82f6',
        icon: 'code'
    },
    {
        title: 'Google Summer of Code (GSoC) - Open Source Contributor',
        organization: 'Google Open Source',
        category: 'open_source',
        deadline: 'Ends in 3 weeks',
        tags: ['Open Source', 'Git', 'Mentorship', 'Remote'],
        link: 'https://summerofcode.withgoogle.com',
        description: 'Spend your summer contributing to real-world open-source software libraries with one-on-one mentorship from core maintainers.',
        typeColor: '#10b981',
        icon: 'diversity_3'
    }
];

const formatOpportunity = (opp) => {
    const rawCategory = (opp.category || opp.type || 'internship').toLowerCase();
    const validCategory = ['internship', 'hackathon', 'workshop', 'open_source'].includes(rawCategory)
        ? rawCategory
        : (rawCategory.includes('hack') ? 'hackathon' : rawCategory.includes('event') ? 'workshop' : 'internship');

    return {
        id: opp._id ? opp._id.toString() : opp.id,
        _id: opp._id ? opp._id.toString() : opp.id,
        title: opp.title,
        organization: opp.organization || opp.company || 'Tech Organization',
        company: opp.organization || opp.company || 'Tech Organization',
        category: validCategory,
        type: validCategory.toUpperCase(),
        deadline: opp.deadline || 'Ongoing',
        tags: Array.isArray(opp.tags) ? opp.tags : [],
        link: opp.link || '',
        description: opp.description || '',
        icon: opp.icon || 'work',
        typeColor: opp.typeColor || 'primary',
        postedBy: opp.postedBy ? opp.postedBy.toString() : null,
        applicantCount: (opp.applicants || []).length,
        createdAt: opp.createdAt
    };
};

// GET /api/opportunities - List all opportunities
router.get('/', async (req, res) => {
    try {
        let opps = await Opportunity.find().sort({ createdAt: -1 });

        // Auto-seed if database collection is empty so UI is immediately populated
        if (!opps || opps.length === 0) {
            try {
                await Opportunity.insertMany(SEED_OPPORTUNITIES);
                opps = await Opportunity.find().sort({ createdAt: -1 });
            } catch (seedErr) {
                console.error('Opportunity seed error:', seedErr.message);
            }
        }

        return res.json((opps || []).map(formatOpportunity));
    } catch (error) {
        console.error('Error fetching opportunities:', error);
        return res.json([]);
    }
});

// POST /api/opportunities - Post a new opportunity
router.post('/', protect, async (req, res) => {
    try {
        const { title, organization, company, category, deadline, tags, link, description } = req.body;

        const orgName = organization || company;
        if (!title || !orgName) {
            return res.status(400).json({ message: 'Title and organization are required' });
        }

        // Normalize tags: can accept array or comma-separated string
        let normalizedTags = [];
        if (Array.isArray(tags)) {
            normalizedTags = tags.map(t => String(t).trim()).filter(Boolean);
        } else if (typeof tags === 'string') {
            normalizedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }

        // Normalize category
        let normalizedCategory = (category || 'internship').toLowerCase().replace(/\s+/g, '_');
        if (!['internship', 'hackathon', 'workshop', 'open_source'].includes(normalizedCategory)) {
            normalizedCategory = 'internship';
        }

        const opportunity = await Opportunity.create({
            title: title.trim(),
            organization: orgName.trim(),
            company: orgName.trim(),
            category: normalizedCategory,
            type: normalizedCategory.toUpperCase(),
            deadline: deadline ? deadline.trim() : 'Rolling basis',
            tags: normalizedTags,
            link: link ? link.trim() : '',
            description: description ? description.trim() : '',
            postedBy: req.user._id,
            applicants: []
        });

        const formatted = formatOpportunity(opportunity);
        return res.status(201).json({
            success: true,
            opportunity: formatted,
            ...formatted
        });
    } catch (error) {
        console.error('Error creating opportunity:', error);
        return res.status(500).json({ message: 'Failed to create opportunity', error: error.message });
    }
});

// POST /api/opportunities/:id/register - Register for opportunity
router.post('/:id/register', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const opp = await Opportunity.findById(id);

        if (!opp) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }

        if (req.user && !opp.applicants.includes(req.user._id)) {
            opp.applicants.push(req.user._id);
            await opp.save();
        }

        return res.json({ success: true, message: 'Successfully registered for opportunity' });
    } catch (error) {
        console.error('Error registering for opportunity:', error);
        return res.status(500).json({ message: 'Failed to register', error: error.message });
    }
});

module.exports = router;
