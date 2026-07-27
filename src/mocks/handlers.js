import { http, HttpResponse } from 'msw';
import { db, generateMessage, generateTeam, generateQuestion } from './db';

// Simulate a slight delay for realistic network feel
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const handlers = [
  // Auth
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    const user = db.users[0]; // mock return first user
    user.name = body.name;
    user.email = body.email;
    await delay();
    return HttpResponse.json({ user, token: 'mock-jwt-token' });
  }),

  http.post('/api/users/me', async ({ request }) => {
    // wait a bit
    await new Promise(resolve => setTimeout(resolve, 800));
    const data = await request.json();
    return HttpResponse.json({ user: { ...db.users[0], skills: data.skills } });
  }),
  
  http.patch('/api/users/me', async ({ request }) => {
    // wait a bit
    await new Promise(resolve => setTimeout(resolve, 800));
    const data = await request.json();
    return HttpResponse.json({ user: { ...db.users[0], skills: data.skills } });
  }),

  // Teams & Matchmaking
  http.get('/api/teams', () => {
    return HttpResponse.json([
      {
        id: '1',
        projectType: 'Hackathon',
        title: 'AI Agent Swarm Platform',
        description: 'Building a multi-agent framework for automated code reviews. Need backend devs familiar with LangChain.',
        requiredSkills: [{name: 'Python', match: true}, {name: 'AI/ML', match: true}, {name: 'FastAPI', match: false}],
        authorName: 'Alex C.',
        authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsHJDZxJ1hjDac3CtSnYZ3I5eO5RRiXZ53a0fZDb3Tl4Q92HrghG4uHZMmgtlTMavs46ZXaDIdFGxaotuiudngTwPO9bcLe4qNb_5GO8wABlyN6S18hkqKJHLTb7YKZx1Bak6U-T3he4xOrQqCI583cgDyMqUdDhOanRjsQivenLuqJaEBfajmB3LrxUvW2hlw-yMHiWsGVX5SN7Mxy52l7D87Kt4yuGlC6tPIZGQGPe559tchpdYPiiYKIuFanmdloXwNkJ6lmf3L',
        lookingForCount: 2
      },
      {
        id: '2',
        projectType: 'Long-term',
        title: 'Zero-Knowledge Voting App',
        description: 'Creating a decentralized, mathematically provable voting system for campus organizations. Need Rust expertise.',
        requiredSkills: [{name: 'Rust', match: true}, {name: 'Cryptography', match: true}, {name: 'Next.js', match: false}],
        authorName: 'Sarah K.',
        authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqnH5D6CS5QgUEZjpR_9dzHLDd1OPK30LYBOUeswyshA8YnoKKvwQMHsjLBJGOxAXcx6zpeFDWmyhUW6MNCVbirlzwzWkVyI_ICL6DlkVoZOl29cL2gR6Sf54bxCN4e0sLji-jZXR4zYIQxIyZsGD99RbAOmF2tjVzY2dpH8GJcZnlD38URlDpbnT1MtBhi6WB7dBq4_2QUxcM6kKYH7MVrTnVaBKuLU6dCH1ZdKfU544D9Crrgy5eadkp11gMmR_PTC2JCZI7ZJVV',
        lookingForCount: 1
      },
      {
        id: '3',
        projectType: 'Study Group',
        title: 'LeetCode Grind Squad',
        description: 'Meeting twice a week to tackle Hard problems. Preparing for FAANG interviews this upcoming cycle.',
        requiredSkills: [{name: 'Algorithms', match: false}, {name: 'Data Structures', match: false}],
        authorName: 'James T.',
        authorAvatar: null,
        lookingForCount: 3
      }
    ]);
  }),

  http.post('/api/teams', async ({ request }) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/teams/:id/join', async ({ params }) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return HttpResponse.json({ success: true });
  }),

  // Mentorship & Opportunities
  http.get('/api/opportunities', () => {
    return HttpResponse.json([
      {
        id: '1',
        type: 'INTERNSHIP',
        typeColor: 'primary',
        title: 'Frontend Engineering Intern - Summer 2024',
        company: 'Vercel • San Francisco, CA (Hybrid)',
        deadline: 'Ends in 3 days',
        icon: 'schedule'
      },
      {
        id: '2',
        type: 'HACKATHON',
        typeColor: '#a855f7',
        title: 'Global AI Build-a-thon: Generative Agents',
        company: 'HuggingFace & AWS • Remote',
        deadline: 'Ends in 12 hrs',
        icon: 'schedule'
      },
      {
        id: '3',
        type: 'EVENT',
        typeColor: '#3b82f6',
        title: 'Rust Foundation: Core Systems Architecture Panel',
        company: 'Rust Foundation • Virtual',
        deadline: 'Oct 15, 2023',
        icon: 'calendar_today'
      }
    ]);
  }),

  http.post('/api/opportunities/:id/register', async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return HttpResponse.json({ success: true });
  }),

  http.get('/api/mentors', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Sarah Jenkins',
        role: 'Senior Verified',
        expertise: ['React', 'Architecture'],
        bio: 'Senior Frontend Engineer at Vercel. Happy to review portfolios or discuss state management at scale.',
        avatar: null
      },
      {
        id: '2',
        name: 'CyberNovice', // Using the second HTML item adapted to a mentor profile
        role: 'Security Researcher',
        expertise: ['Cyber', 'Career'],
        bio: 'Transitioned from Web Dev to Security Research. I can help you build an offensive security portfolio.',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM_CDkM4KN6j4dM6WLMqTrMjwfz3OBO7IRV6-bSjWAWLNXNOfE1k3ZlgDKIdR9yNloHgQltXr9SzhC0ux8WzvKgrFlymfosn9LVk2PyEuJqw87ixlSNrOv7GxFtYHtwhRjQKdT9udz0CQJ2_fpIr6J9gNZRGI5XiGNhmraRXk2RcR9V6qRgP0L60QC3ndp0kbCeVWujuDMCHgBUHgbLpjyAWCqaH1x7o57ftWaUvpWgPchxXVqyNZGg4_wyUbk4cdKdItC1wZQf69o'
      }
    ]);
  }),

  http.post('/api/mentors/:id/request', async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const user = db.users.find(u => u.email === 'test@tkmce.ac.in') || db.users[0];
    await delay();
    return HttpResponse.json({ user, token: 'mock-jwt-token' });
  }),

  http.post('/api/auth/verify-email', async () => {
    await delay();
    return HttpResponse.json({ verified: true });
  }),

  // Users
  http.get('/api/users/me', async () => {
    const user = db.users.find(u => u.email === 'test@tkmce.ac.in') || db.users[0];
    await delay();
    return HttpResponse.json(user);
  }),

  http.patch('/api/users/me', async ({ request }) => {
    const body = await request.json();
    const user = db.users.find(u => u.email === 'test@tkmce.ac.in') || db.users[0];
    Object.assign(user, body);
    await delay();
    return HttpResponse.json({ user });
  }),

  // Skills
  http.get('/api/skills', async () => {
    await delay();
    return HttpResponse.json(db.skills);
  }),

  // Channels & Messages
  http.get('/api/channels', async () => {
    await delay();
    return HttpResponse.json(db.channels);
  }),

  http.get('/api/channels/:id/messages', async ({ params }) => {
    const channelId = params.id;
    const messages = db.messages.filter(m => m.channelId === channelId);
    await delay();
    return HttpResponse.json(messages);
  }),

  http.post('/api/channels/:id/messages', async ({ params, request }) => {
    const channelId = params.id;
    const body = await request.json();
    const user = db.users.find(u => u.email === 'test@tkmce.ac.in') || db.users[0];
    
    const message = generateMessage(channelId, user.id, user.name, user.avatar);
    message.text = body.text;
    message.codeSnippet = body.codeSnippet || null;
    message.attachment = body.attachment || null;
    
    db.messages.push(message);
    await delay();
    return HttpResponse.json({ message }, { status: 201 });
  }),

  // Teams
  http.get('/api/teams', async () => {
    await delay();
    return HttpResponse.json(db.teams);
  }),

  http.post('/api/teams', async ({ request }) => {
    const body = await request.json();
    const user = db.users.find(u => u.email === 'test@tkmce.ac.in') || db.users[0];
    
    const team = generateTeam(body.skillsNeeded, user.id, user.name, user.avatar);
    team.title = body.title;
    team.description = body.description;
    team.type = body.type;
    team.deadline = body.deadline;
    
    db.teams.push(team);
    await delay();
    return HttpResponse.json({ team }, { status: 201 });
  }),

  http.post('/api/teams/:id/join-request', async () => {
    await delay();
    return HttpResponse.json({ status: "requested" });
  }),

  // Opportunities
  http.get('/api/opportunities', async () => {
    await delay();
    return HttpResponse.json(db.opportunities);
  }),

  // Mentorship
  http.get('/api/mentorship/questions', async () => {
    await delay();
    return HttpResponse.json(db.questions);
  }),

  http.post('/api/mentorship/questions', async ({ request }) => {
    const body = await request.json();
    const user = db.users.find(u => u.email === 'test@tkmce.ac.in') || db.users[0];
    
    const question = generateQuestion(body.skillTags, user.id, user.name);
    question.question = body.question;
    
    db.questions.push(question);
    await delay();
    return HttpResponse.json({ question }, { status: 201 });
  }),

  http.post('/api/mentorship/questions/:id/answers', async ({ params, request }) => {
    const questionId = params.id;
    const body = await request.json();
    const user = db.users.find(u => u.email === 'test@tkmce.ac.in') || db.users[0];
    
    const question = db.questions.find(q => q.id === questionId);
    if (!question) {
      return HttpResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    const answer = {
      id: Math.random().toString(36).substring(7),
      text: body.text,
      answeredById: user.id,
      answeredByName: user.name,
      isMentor: user.isMentor
    };
    
    question.answers.push(answer);
    question.answerCount += 1;
    
    await delay();
    return HttpResponse.json({ answer }, { status: 201 });
  })
];
