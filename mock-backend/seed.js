const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Skill = require('./models/Skill');
const Team = require('./models/Team');
const Opportunity = require('./models/Opportunity');
const Question = require('./models/Question');
const Channel = require('./models/Channel');
const Message = require('./models/Message');

const seedDatabase = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // 1. Seed Skills
        console.log('Seeding skills...');
        await Skill.deleteMany({});
        const skillsData = [
            { name: 'Python', colorAccent: '#3776AB' },
            { name: 'MERN Stack', colorAccent: '#61DAFB' },
            { name: 'AI/ML', colorAccent: '#FF9900' },
            { name: 'DSA', colorAccent: '#4CAF50' },
            { name: 'UI/UX', colorAccent: '#FF4081' },
            { name: 'Cybersecurity', colorAccent: '#000000' }
        ];
        const createdSkills = await Skill.insertMany(skillsData);
        console.log(`Seeded ${createdSkills.length} skills.`);

        // 2. Seed Users
        console.log('Seeding users...');
        await User.deleteMany({});
        const hashedPassword = await bcrypt.hash('password123', 10);

        const usersData = [
            {
                name: 'Test Student',
                email: 'test@tkmce.ac.in',
                password: hashedPassword,
                batch: '2025',
                skills: ['Python', 'AI/ML', 'MERN Stack'],
                bio: 'Passionate full-stack & AI learner. Building scalable web apps and collaborative open-source tools.',
                isMentor: false,
                avatar: null,
                stats: { queriesResolved: 15, teamsAdvised: 3, sessionsLed: 2 },
                projects: [
                    { title: 'Campus Hub', description: 'Real-time collaborative note taking app for university students.', link: 'https://github.com' }
                ]
            },
            {
                name: 'Sarah Jenkins',
                email: 'sarah.j@vercel.com',
                password: hashedPassword,
                batch: 'Alumni',
                skills: ['React', 'Architecture', 'UI/UX'],
                bio: 'Senior Frontend Engineer at Vercel. Happy to review portfolios or discuss state management at scale.',
                isMentor: true,
                avatar: null,
                stats: { queriesResolved: 342, teamsAdvised: 14, sessionsLed: 28 },
                projects: [
                    { title: 'Next.js Turbopack Core', description: 'Core contributor to high speed bundler ecosystem.', link: 'https://nextjs.org' }
                ]
            },
            {
                name: 'CyberNovice',
                email: 'novice.sec@tkmce.ac.in',
                password: hashedPassword,
                batch: '2024',
                skills: ['Cybersecurity', 'Python'],
                bio: 'Transitioned from Web Dev to Security Research. I can help you build an offensive security portfolio.',
                isMentor: true,
                avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM_CDkM4KN6j4dM6WLMqTrMjwfz3OBO7IRV6-bSjWAWLNXNOfE1k3ZlgDKIdR9yNloHgQltXr9SzhC0ux8WzvKgrFlymfosn9LVk2PyEuJqw87ixlSNrOv7GxFtYHtwhRjQKdT9udz0CQJ2_fpIr6J9gNZRGI5XiGNhmraRXk2RcR9V6qRgP0L60QC3ndp0kbCeVWujuDMCHgBUHgbLpjyAWCqaH1x7o57ftWaUvpWgPchxXVqyNZGg4_wyUbk4cdKdItC1wZQf69o',
                stats: { queriesResolved: 88, teamsAdvised: 6, sessionsLed: 12 }
            }
        ];
        const createdUsers = await User.insertMany(usersData);
        console.log(`Seeded ${createdUsers.length} users.`);

        const student = createdUsers[0];
        const mentor = createdUsers[1];

        // 3. Seed Channels
        console.log('Seeding channels...');
        await Channel.deleteMany({});
        const channelsData = createdSkills.map(skill => ({
            name: `#${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-help`,
            skillId: skill._id.toString(),
            memberCount: Math.floor(Math.random() * 100) + 20,
            unreadCount: 0
        }));
        const createdChannels = await Channel.insertMany(channelsData);
        console.log(`Seeded ${createdChannels.length} channels.`);

        // 4. Seed Messages
        console.log('Seeding messages...');
        await Message.deleteMany({});
        const firstChannel = createdChannels[0];
        await Message.create({
            channelId: firstChannel._id.toString(),
            authorId: student._id,
            authorName: student.name,
            authorAvatar: student.avatar,
            text: "Hello everyone! Excited to collaborate on our upcoming hackathon projects here.",
            threadCount: 0
        });

        // 5. Seed Teams
        console.log('Seeding teams...');
        await Team.deleteMany({});
        const teamsData = [
            {
                projectType: 'Hackathon',
                title: 'AI Agent Swarm Platform',
                description: 'Building a multi-agent framework for automated code reviews. Need backend devs familiar with LangChain.',
                requiredSkills: [{ name: 'Python', match: true }, { name: 'AI/ML', match: true }, { name: 'FastAPI', match: false }],
                authorId: student._id,
                authorName: student.name,
                authorAvatar: student.avatar,
                lookingForCount: 2
            },
            {
                projectType: 'Long-term',
                title: 'Zero-Knowledge Voting App',
                description: 'Creating a decentralized, mathematically provable voting system for campus organizations. Need Rust expertise.',
                requiredSkills: [{ name: 'Rust', match: true }, { name: 'Cryptography', match: true }, { name: 'Next.js', match: false }],
                authorName: 'Sarah K.',
                authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqnH5D6CS5QgUEZjpR_9dzHLDd1OPK30LYBOUeswyshA8YnoKKvwQMHsjLBJGOxAXcx6zpeFDWmyhUW6MNCVbirlzwzWkVyI_ICL6DlkVoZOl29cL2gR6Sf54bxCN4e0sLji-jZXR4zYIQxIyZsGD99RbAOmF2tjVzY2dpH8GJcZnlD38URlDpbnT1MtBhi6WB7dBq4_2QUxcM6kKYH7MVrTnVaBKuLU6dCH1ZdKfU544D9Crrgy5eadkp11gMmR_PTC2JCZI7ZJVV',
                lookingForCount: 1
            },
            {
                projectType: 'Study Group',
                title: 'LeetCode Grind Squad',
                description: 'Meeting twice a week to tackle Hard problems. Preparing for FAANG interviews this upcoming cycle.',
                requiredSkills: [{ name: 'Algorithms', match: false }, { name: 'Data Structures', match: false }],
                authorName: 'James T.',
                authorAvatar: null,
                lookingForCount: 3
            }
        ];
        await Team.insertMany(teamsData);
        console.log(`Seeded ${teamsData.length} teams.`);

        // 6. Seed Opportunities
        console.log('Seeding opportunities...');
        await Opportunity.deleteMany({});
        const oppsData = [
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
        await Opportunity.insertMany(oppsData);
        console.log(`Seeded ${oppsData.length} opportunities.`);

        // 7. Seed Questions
        console.log('Seeding mentorship questions...');
        await Question.deleteMany({});
        const questionsData = [
            {
                question: 'How do you optimize large SQL queries with multiple JOINs?',
                askedById: student._id,
                askedByName: student.name,
                skillTags: ['Database', 'PostgreSQL'],
                answerCount: 1,
                answers: [
                    {
                        text: 'Make sure foreign keys and join condition columns have indexes. Check EXPLAIN ANALYZE for sequential scans.',
                        answeredById: mentor._id,
                        answeredByName: mentor.name,
                        isMentor: true
                    }
                ]
            },
            {
                question: 'What is the best way to handle global state in modern React 19?',
                askedById: student._id,
                askedByName: student.name,
                skillTags: ['React', 'Frontend'],
                answerCount: 0,
                answers: []
            }
        ];
        await Question.insertMany(questionsData);
        console.log(`Seeded ${questionsData.length} questions.`);

        console.log('✅ Database successfully seeded!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};

seedDatabase();
