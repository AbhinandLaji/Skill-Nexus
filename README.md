# Skill-Nexus 🚀

Ever struggled to find the right teammate for a hackathon, or wished you had a senior to help you debug that one annoying bug? That's exactly why we built Skill-Nexus.

It's a platform for students — built by students — to find collaborators, get mentored, share knowledge, and discover opportunities, all in one place. The backend is powered by **Express + MongoDB**, and the frontend is built with **HTML, CSS and JavaScript**.

---

## What can you do with it?

- 🤝 **Find teammates** — Post or browse teams for hackathons, long-term projects, or study groups
- 🧑‍🏫 **Get mentorship** — Ask questions, get answers from verified seniors/mentors
- 💬 **Skill channels** — Chat in topic-based rooms like `#python-help` or `#dsa-prep`
- ✉️ **Direct and group messages** — Start private chats with registered members and call by audio or video
- 🌐 **Opportunities** — Browse internships, hackathons, and tech events
- 👤 **Your profile** — Showcase your skills, projects, and batch

Channel messages are saved through the REST API and broadcast live to authenticated channel members with Socket.IO. Message history remains available through the existing API when a user opens a channel.

Text channel messages support emoji reactions, threaded replies, and pinned messages. Reactions and threads are available to channel members; channel owners can pin or unpin messages.

Community channels can be created as text, forum, or voice channels and assigned to a category that groups them in the sidebar. Forum channels support discussion posts and replies. Community members can schedule events and RSVP from a channel. Voice channels use browser WebRTC for microphone audio and screen sharing, with Socket.IO for authenticated signaling. Microphone and screen capture require browser permission and a secure origin (HTTPS or localhost). The current peer-to-peer setup uses a public STUN server and does not include a TURN relay, so connections may fail on restrictive networks; production deployments should configure TURN and consider an SFU for larger rooms.

Direct and group messages are stored in MongoDB. Start a conversation with one or more registered email addresses (up to eight members total). Audio and video calls use peer-to-peer WebRTC with the same browser permissions and network limitations as voice channels.

---

## Tech Stack

| What | Tools used |
|---|---|
| Frontend | HTML, React |
| Backend | Node.js, Express 5 |
| Database | MongoDB + Mongoose 9 |
| Auth | JWT + bcryptjs |
| Dev | MSW (mock API) |

---

## Folder Structure

Here's how the project is laid out:

```
Skill-Nexus/
│
├── src/                      # Frontend source
│   ├── components/           # Shared UI pieces
│   ├── pages/                # Individual page views
│   ├── services/             # API call helpers
│   └── mocks/                # MSW handlers for local dev
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

### Open the frontend

Just open `index.html` in your browser, or serve it with any static server:

```bash
# from project root
npx serve .
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
# Optional email delivery (local development shows the OTP in the app if these are unset/invalid)
EMAIL_USER=your-sender@gmail.com
EMAIL_PASS=your-gmail-app-password
# For non-Gmail SMTP providers, also set:
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
# Optional verified sender address:
EMAIL_FROM=your-sender@example.com
```

Signup and unverified login require email OTP verification. In development, if SMTP is missing or unavailable, the app displays a development-only OTP so local signup can continue. Set `NODE_ENV=production` in production; production never returns OTP codes and requires working SMTP settings. Keep `.env` private and never commit provider passwords.

---

## API Docs

All the API routes, request/response examples, and error codes are documented separately here:

👉 **[API_DOCS.md](./API_DOCS.md)**

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
```
