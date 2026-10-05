# Skill-Nexus — API Documentation

This file covers all the backend API routes for Skill-Nexus. The server runs on Express and talks to MongoDB via Mongoose.

> **Base URL:** `http://localhost:5000/api`
>
> Routes marked with 🔒 need a JWT token:
> ```
> Authorization: Bearer <your_token>
> ```
> You get the token when you register or log in.

---

## Auth

### `POST /auth/register`
Creates a new account.

```json
// send this
{
  "name": "Sreeraj",
  "email": "sreeraj@example.com",
  "password": "mypassword",
  "batch": "2025",
  "skills": ["Python", "JavaScript"]
}

// you get back
{
  "message": "Registration successful",
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Sreeraj", "email": "...", "isMentor": false }
}
```

| Code | What went wrong |
|---|---|
| 400 | Name, email, or password is missing |
| 409 | Someone already registered with that email |
| 500 | Something broke on the server |

---

### `POST /auth/login`
Log in and get your token.

```json
// send this
{ "email": "sreeraj@example.com", "password": "mypassword" }

// you get back
{ "message": "Login successful", "token": "eyJhbGci...", "user": { ... } }
```

| Code | What went wrong |
|---|---|
| 400 | Email or password missing |
| 401 | Wrong credentials |

---

## Users

### `GET /users/me` 🔒
Returns your own profile — useful to load the dashboard after login.

```json
// response
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

### `PATCH /users/me` 🔒
Update your profile. You don't have to send all fields — only what changed.

```json
// send any combination
{
  "bio": "Now I also do backend stuff",
  "skills": ["Python", "Node.js"],
  "isMentor": true,
  "projects": [{ "title": "Skill-Nexus", "description": "This app!", "link": "https://github.com/..." }]
}
```

| Code | What went wrong |
|---|---|
| 404 | Your user wasn't found (shouldn't happen normally) |
| 500 | Update failed |

---

### `GET /users/:id`
Fetch anyone's public profile using their user ID.

| Code | What went wrong |
|---|---|
| 404 | No user with that ID |

---

## Skills

### `GET /skills`
Returns all skill tags on the platform — Python, AI/ML, DSA, etc. If none exist yet, it seeds a default list automatically.

```json
[
  { "id": "...", "name": "Python", "colorAccent": "#3776AB" },
  { "id": "...", "name": "AI/ML",  "colorAccent": "#FF9900" }
]
```

---

## Teams

### `GET /teams`
Browse all team posts, newest first.

```json
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

### `POST /teams` 🔒
Post a new team listing so others can find and join you.

```json
// send this
{
  "title": "My Team",
  "description": "Building something cool, need a frontend dev",
  "projectType": "Hackathon",
  "requiredSkills": ["HTML", "CSS"],
  "lookingForCount": 1,
  "deadline": "2024-12-15"
}
// you get back the created team object
```

| Code | What went wrong |
|---|---|
| 400 | Title or description is missing |
| 500 | Couldn't save to DB |

---

### `POST /teams/:id/join` 🔒
### `POST /teams/:id/join-request` 🔒
Send a join request to a team. Both routes do the same thing.

```json
// response
{ "success": true, "status": "requested" }
```

---

## Opportunities

### `GET /opportunities`
Lists all internships, hackathons, and events.

```json
[
  {
    "id": "...",
    "type": "INTERNSHIP",
    "title": "Frontend Engineering Intern",
    "company": "Vercel • San Francisco, CA",
    "deadline": "Ends in 3 days",
    "description": "Join the team shaping the future of the web."
  }
]
```

---

### `POST /opportunities/:id/register` 🔒
Mark yourself as interested in an opportunity.

```json
{ "success": true, "message": "Successfully registered for opportunity" }
```

---

## Mentors

### `GET /mentors`
Returns all users who've marked themselves as mentors (`isMentor: true`).

```json
[
  {
    "id": "...",
    "name": "Sarah Jenkins",
    "expertise": ["React", "System Design"],
    "bio": "Senior engineer, happy to help with career and tech advice."
  }
]
```

---

### `POST /mentors/:id/request` 🔒
Send a mentorship request to someone.

```json
{ "success": true, "message": "Mentorship request sent successfully" }
```

---

## Mentorship Q&A

### `GET /mentorship/questions`
All community questions, newest first — answers are included in the response.

```json
[
  {
    "id": "...",
    "question": "How do I optimize SQL queries with multiple JOINs?",
    "askedByName": "alex_dev",
    "skillTags": ["Database", "PostgreSQL"],
    "answerCount": 1,
    "answers": [
      {
        "text": "Index your join columns and check EXPLAIN ANALYZE...",
        "answeredByName": "Sarah Jenkins",
        "isMentor": true
      }
    ]
  }
]
```

---

### `POST /mentorship/questions` 🔒
Post a question to the community.

```json
// send this
{ "question": "Best way to manage state in a vanilla JS app?", "skillTags": ["JavaScript"] }

// you get back the created question object
```

| Code | What went wrong |
|---|---|
| 400 | Question text is empty |

---

### `POST /mentorship/questions/:id/answers` 🔒
Answer someone else's question.

```json
// send this
{ "text": "You can use a simple event bus pattern or localStorage for lightweight state..." }

// you get back
{ "answer": { "id": "...", "text": "...", "answeredByName": "You", "isMentor": false } }
```

| Code | What went wrong |
|---|---|
| 400 | Answer text is empty |
| 404 | That question doesn't exist |

---

## Channels

### `GET /channels`
All skill-based chat channels on the platform.

```json
[{ "id": "...", "name": "#python-help", "memberCount": 124, "unreadCount": 0 }]
```

---

### `GET /channels/:id/messages`
Messages inside a channel, oldest first.

```json
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

### `POST /channels/:id/messages` 🔒
Send a message to a channel. You can attach a code snippet too.

```json
// send this
{
  "text": "Try downcasting your floats before merging",
  "codeSnippet": {
    "language": "python",
    "code": "df['col'] = df['col'].astype('float32')"
  }
}
// you get back the created message object
```

| Code | What went wrong |
|---|---|
| 400 | Message text is empty |
| 500 | Couldn't save the message |

---

## Health Check

### `GET /health`
Just to check if the server is up.

```json
{ "status": "ok", "timestamp": "2024-10-05T05:51:39.000Z" }
```
