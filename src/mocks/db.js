import { faker } from '@faker-js/faker';

export const db = {
  users: [],
  skills: [],
  channels: [],
  messages: [],
  teams: [],
  opportunities: [],
  questions: []
};

export const generateSkill = (name, colorAccent) => ({
  id: faker.string.uuid(),
  name,
  colorAccent
});

export const generateUser = (skillIds = []) => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email({ provider: 'tkmce.ac.in' }).toLowerCase(),
  verified: faker.datatype.boolean(),
  password: 'password123',
  batch: faker.helpers.arrayElement(["2024", "2025", "2026", "2027"]),
  skills: skillIds,
  bio: faker.person.bio(),
  isMentor: faker.datatype.boolean(0.2),
  avatar: faker.image.avatar()
});

export const generateChannel = (skillId, name) => ({
  id: faker.string.uuid(),
  skillId,
  name,
  memberCount: faker.number.int({ min: 10, max: 200 }),
  unreadCount: faker.number.int({ min: 0, max: 15 })
});

export const generateMessage = (channelId, userId, userName, userAvatar) => ({
  id: faker.string.uuid(),
  channelId,
  authorId: userId,
  authorName: userName,
  authorAvatar: userAvatar,
  text: faker.lorem.paragraph(),
  codeSnippet: faker.datatype.boolean(0.3) ? {
    language: "javascript",
    code: "console.log('Hello world');"
  } : null,
  attachment: faker.datatype.boolean(0.1) ? {
    filename: "logs.txt",
    size: "12kb"
  } : null,
  threadReplyCount: faker.number.int({ min: 0, max: 5 }),
  createdAt: faker.date.recent().toISOString()
});

export const generateTeam = (skillIds, userId, userName, userAvatar) => ({
  id: faker.string.uuid(),
  title: faker.company.catchPhrase(),
  description: faker.lorem.paragraphs(2),
  skillsNeeded: faker.helpers.arrayElements(skillIds, { min: 1, max: 3 }),
  postedById: userId,
  postedByName: userName,
  postedByAvatar: userAvatar,
  type: faker.helpers.arrayElement(["hackathon", "project", "study-group"]),
  deadline: faker.date.soon({ days: 30 }).toISOString()
});

export const generateOpportunity = () => ({
  id: faker.string.uuid(),
  type: faker.helpers.arrayElement(["internship", "hackathon", "event"]),
  title: faker.person.jobTitle(),
  organizer: faker.company.name(),
  description: faker.lorem.paragraph(),
  deadline: faker.date.soon({ days: 60 }).toISOString()
});

export const generateQuestion = (skillIds, userId, userName) => ({
  id: faker.string.uuid(),
  question: faker.lorem.sentence() + "?",
  askedById: userId,
  askedByName: userName,
  skillTags: faker.helpers.arrayElements(skillIds, { min: 1, max: 2 }),
  answerCount: 0,
  answers: []
});

export const seed = () => {
  const predefinedSkills = [
    { name: "Python", colorAccent: "#3776AB" },
    { name: "MERN Stack", colorAccent: "#61DAFB" },
    { name: "AI/ML", colorAccent: "#FF9900" },
    { name: "DSA", colorAccent: "#4CAF50" },
    { name: "UI/UX", colorAccent: "#FF4081" },
    { name: "Cybersecurity", colorAccent: "#000000" }
  ];

  predefinedSkills.forEach(s => {
    db.skills.push(generateSkill(s.name, s.colorAccent));
  });

  for (let i = 0; i < 20; i++) {
    const userSkills = faker.helpers.arrayElements(db.skills.map(s => s.id), { min: 1, max: 3 });
    db.users.push(generateUser(userSkills));
  }

  // Current logged in user (for auth testing)
  const myUser = generateUser(db.skills.map(s => s.id));
  myUser.email = 'test@tkmce.ac.in';
  myUser.name = 'Test User';
  myUser.password = 'password123';
  db.users.push(myUser);

  db.skills.forEach(skill => {
    const channelName = `#${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-help`;
    const channel = generateChannel(skill.id, channelName);
    db.channels.push(channel);

    for (let i = 0; i < 15; i++) {
      const randomUser = faker.helpers.arrayElement(db.users);
      db.messages.push(generateMessage(channel.id, randomUser.id, randomUser.name, randomUser.avatar));
    }
  });

  for (let i = 0; i < 8; i++) {
    const randomUser = faker.helpers.arrayElement(db.users);
    const skillIds = db.skills.map(s => s.id);
    db.teams.push(generateTeam(skillIds, randomUser.id, randomUser.name, randomUser.avatar));
  }

  for (let i = 0; i < 6; i++) {
    db.opportunities.push(generateOpportunity());
  }

  for (let i = 0; i < 12; i++) {
    const randomUser = faker.helpers.arrayElement(db.users);
    const skillIds = db.skills.map(s => s.id);
    const q = generateQuestion(skillIds, randomUser.id, randomUser.name);

    const numAnswers = faker.number.int({ min: 0, max: 3 });
    q.answerCount = numAnswers;
    for (let j = 0; j < numAnswers; j++) {
      const answerer = faker.helpers.arrayElement(db.users);
      q.answers.push({
        id: faker.string.uuid(),
        text: faker.lorem.paragraph(),
        answeredById: answerer.id,
        answeredByName: answerer.name,
        isMentor: answerer.isMentor
      });
    }
    db.questions.push(q);
  }
};

seed();
