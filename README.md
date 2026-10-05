# Skill-Nexus 🚀

Ever struggled to find the right teammate for a hackathon, or wished you had a senior to help you debug that one annoying bug? That's exactly why we built Skill-Nexus.

It's a platform for students — built by students — to find collaborators, get mentored, share knowledge, and discover opportunities, all in one place. The backend is powered by **Express + MongoDB**, and the frontend is a **React + Vite** app.

---

## What can you do with it?

- 🤝 **Find teammates** — Post or browse teams for hackathons, long-term projects, or study groups
- 🧑‍🏫 **Get mentorship** — Ask questions, get answers from verified seniors/mentors
- 💬 **Skill channels** — Chat in topic-based rooms like `#python-help` or `#dsa-prep`
- 🌐 **Opportunities** — Browse internships, hackathons, and tech events
- 👤 **Your profile** — Showcase your skills, projects, and batch

---

## Tech Stack

| What | Tools used |
|---|---|
| Frontend | React 19, Vite, React Router v7, Tailwind CSS v4, Framer Motion |
| Backend | Node.js, Express 5 |
| Database | MongoDB + Mongoose 9 |
| Auth | JWT + bcryptjs |
| Dev | MSW (mock API), Faker.js, Oxlint |

---

## Folder Structure

Here's how the project is laid out:

```
Skill-Nexus/
│
├── src/                      # Everything React
│   ├── components/           # Shared UI pieces
│   ├── pages/                # Individual page views
│   ├── services/             # API call helpers
│   ├── mocks/                # MSW handlers for local dev
│   ├── App.jsx
│   └── main.jsx
│
└── mock-backend/             # The Express + MongoDB server
    ├── middleware/
    │   └── auth.js           # JWT verification
    ├── models/               # Mongoose schemas (User, Team, etc.)
    ├── routes/               # One file per resource
    ├── server.js             # Entry point — starts everything
    └── seed.js               # Loads sample data into DB
```

---

## Running it locally

### You'll need

- Node.js 18+
- MongoDB running locally (or a free [Atlas](https://www.mongodb.com/atlas) cluster)
- npm 9+

### Start the backend

```bash
cd mock-backend
npm install

# set up your .env first (see below)
npm run dev
# → running on http://localhost:5000
```

### Start the frontend

```bash
# from project root
npm install
npm run dev
# → running on http://localhost:5173
```

### Seed some data (optional but recommended)

```bash
cd mock-backend
npm run seed
```

---

## Environment Variables

Create a `.env` file inside `mock-backend/`:

```env
MONGODB_URI=mongodb://localhost:27017/skillnexus
JWT_SECRET=pick_something_strong_here
PORT=5000
NODE_ENV=development
```

---

## API Reference

> **Base URL:** `http://localhost:5000/api`
> 
> Routes marked with 🔒 need a JWT token in the header:
> ```
> Authorization: Bearer <token>
> ```

---

### Auth

#### `POST /auth/register`
Creates a new account.

```json
// Request
{
  "name": "Sreeraj",
  "email": "sreeraj@example.com",
  "password": "mypassword",
  "batch": "2025",
  "skills": ["Python", "React"]
}

// Response 201
{
  "message": "Registration successful",
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Sreeraj", "email": "...", "isMentor": false }
}
```

| Code | Means |
|---|---|
| 400 | Missing name / email / password |
| 409 | That email's already taken |

---

#### `POST /auth/login`
Log in and get a token back.

```json
// Request
{ "email": "sreeraj@example.com", "password": "mypassword" }

// Response 200
{ "message": "Login successful", "token": "eyJhbGci...", "user": { ... } }
```

| Code | Means |
|---|---|
| 400 | Missing fields |
| 401 | Wrong email or password |

---

### Users

#### `GET /users/me` 🔒
Returns your own profile.

```json
// Response 200
{
  "id": "...",
  "name": "Sreeraj",
  "email": "sreeraj@example.com",
  "skills": ["Python"],
  "bio": "CS undergrad, batch 2025",
  "isMentor": false,
  "stats": { "queriesResolved": 2, "teamsAdvised": 0, "sessionsLed": 0 },
  "projects": []
}
```

---

#### `PATCH /users/me` 🔒
Update your profile — send only the fields you want to change.

```json
// Request (any subset)
{
  "bio": "Now I know Go too",
  "skills": ["Python", "Go"],
  "isMentor": true,
  "projects": [{ "title": "SkillNexus", "description": "This app!", "link": "https://github.com/..." }]
}
```

---

#### `GET /users/:id`
Get anyone's public profile by their user ID.

---

### Skills

#### `GET /skills`
Lists all skill tags used across the platform (Python, AI/ML, DSA, etc.). Auto-seeds defaults if empty.

```json
// Response 200
[
  { "id": "...", "name": "Python", "colorAccent": "#3776AB" },
  { "id": "...", "name": "AI/ML",  "colorAccent": "#FF9900" }
]
```

---

### Teams

#### `GET /teams`
Browse all team posts, newest first.

```json
// Response 200
[
  {
    "id": "...",
    "title": "AI Agent Swarm Platform",
    "description": "Need backend devs familiar with LangChain.",
    "projectType": "Hackathon",
    "requiredSkills": [{ "name": "Python", "match": true }],
    "authorName": "Alex C.",
    "lookingForCount": 2
  }
]
```

---

#### `POST /teams` 🔒
Post a new team listing.

```json
// Request
{
  "title": "My Team",
  "description": "Building something cool, need a frontend dev",
  "projectType": "Hackathon",
  "requiredSkills": ["React", "Figma"],
  "lookingForCount": 1,
  "deadline": "2024-12-15"
}
// Response 201: the created team object
```

| Code | Means |
|---|---|
| 400 | Missing title or description |

---

#### `POST /teams/:id/join` 🔒
#### `POST /teams/:id/join-request` 🔒
Send a join request to a team.

```json
// Response 200
{ "success": true, "status": "requested" }
```

---

### Opportunities

#### `GET /opportunities`
Lists internships, hackathons, and events.

```json
// Response 200
[
  {
    "id": "...",
    "type": "INTERNSHIP",
    "title": "Frontend Engineering Intern",
    "company": "Vercel • San Francisco, CA",
    "deadline": "Ends in 3 days"
  }
]
```

---

#### `POST /opportunities/:id/register` 🔒
Mark yourself as interested in an opportunity.

```json
// Response 200
{ "success": true, "message": "Successfully registered for opportunity" }
```

---

### Mentors

#### `GET /mentors`
Lists all users who've set themselves as mentors.

```json
// Response 200
[
  {
    "id": "...",
    "name": "Sarah Jenkins",
    "expertise": ["React", "System Design"],
    "bio": "Senior engineer at Vercel, happy to help with career advice."
  }
]
```

---

#### `POST /mentors/:id/request` 🔒
Send a mentorship request to someone.

```json
// Response 200
{ "success": true, "message": "Mentorship request sent successfully" }
```

---

### Mentorship Q&A

#### `GET /mentorship/questions`
All community questions, newest first — with answers attached.

```json
// Response 200
[
  {
    "id": "...",
    "question": "How do I optimize SQL queries with multiple JOINs?",
    "askedByName": "alex_dev",
    "skillTags": ["Database", "PostgreSQL"],
    "answerCount": 1,
    "answers": [
      { "text": "Index your join columns...", "answeredByName": "Sarah Jenkins", "isMentor": true }
    ]
  }
]
```

---

#### `POST /mentorship/questions` 🔒
Ask a question to the community.

```json
// Request
{ "question": "Best way to manage state in React 19?", "skillTags": ["React"] }
// Response 201: created question object
```

| Code | Means |
|---|---|
| 400 | Question text is empty |

---

#### `POST /mentorship/questions/:id/answers` 🔒
Answer someone's question.

```json
// Request
{ "text": "Try useReducer + Context for complex state trees..." }

// Response 201
{ "answer": { "id": "...", "text": "...", "answeredByName": "You", "isMentor": false } }
```

| Code | Means |
|---|---|
| 400 | Answer text is empty |
| 404 | Question doesn't exist |

---

### Channels

#### `GET /channels`
All skill-based chat channels.

```json
// Response 200
[{ "id": "...", "name": "#python-help", "memberCount": 124, "unreadCount": 0 }]
```

---

#### `GET /channels/:id/messages`
Messages in a channel (oldest first).

```json
// Response 200
[
  {
    "id": "...",
    "type": "text",
    "authorName": "alex_dev",
    "text": "Anyone know how to optimize a pandas merge for 2M rows?",
    "timestamp": "09:45 AM"
  }
]
```

---

#### `POST /channels/:id/messages` 🔒
Send a message (plain text or with a code snippet).

```json
// Request
{
  "text": "Try downcasting your floats before merging",
  "codeSnippet": { "language": "python", "code": "df['col'] = df['col'].astype('float32')" }
}
// Response 201: the sent message object
```

---

### Health Check

#### `GET /health`
Just checks if the server is alive.

```json
{ "status": "ok", "timestamp": "2024-10-05T05:51:39.000Z" }
```

---

## How auth works

All protected routes go through [`middleware/auth.js`](./mock-backend/middleware/auth.js). It:

1. Reads `Authorization: Bearer <token>` from the request header
2. Verifies it against `JWT_SECRET`
3. Looks up the user from DB and attaches them to `req.user`
4. If anything fails → `401 Unauthorized`

---

## Database Models at a Glance

| Model | What it stores |
|---|---|
| `User` | Accounts — skills, bio, batch, mentor status, projects |
| `Team` | Team listings — type, required skills, join requests |
| `Channel` | Chat rooms tied to a skill |
| `Message` | Messages inside channels (supports code snippets) |
| `Opportunity` | Internships, hackathons, events |
| `Question` | Community Q&A with nested answers |
| `Skill` | Skill tags with display colors |

---

## Scripts

```bash
# Backend
npm run dev      # start with live reload
npm run start    # production start
npm run seed     # fill DB with sample data

# Frontend
npm run dev      # Vite dev server
npm run build    # production build
npm run lint     # run oxlint
```
