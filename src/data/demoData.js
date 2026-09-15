export const currentUser = {
  id: 'u-ava-01',
  username: 'purvaj',
  displayName: 'Purvaj Ghude',
  headline: 'Frontend developer who likes useful, human software.',
  course: 'B.Tech CSE · 3rd year',
  college: 'NITK',
  availability: '6–8 hrs / week',
  goals: ['Hackathon teammate', 'Open-source project'],
  skills: [
    { id: 's-1', name: 'React', proficiency: 4, offering: true },
    { id: 's-2', name: 'JavaScript', proficiency: 4, offering: true },
    { id: 's-3', name: 'Java', proficiency: 2, offering: false },
    { id: 's-4', name: 'Figma', proficiency: 2, offering: false },
  ],
  stats: { collaborators: 6, helped: 18, reputation: 4.8 },
  about:
    'I enjoy taking rough product ideas and making them clear enough to use. Looking for people who care about the problem as much as the demo.',
};

export const recommendations = [
  {
    id: 'u-sana-02',
    username: 'divya',
    displayName: 'Divya Kokane',
    accent: 'blue',
    headline: 'Java + Spring Boot developer. I make the invisible parts dependable.',
    course: 'B.Tech IT · 3rd year',
    availability: '8–10 hrs / week',
    score: 94,
    reason:
      'Strong backend depth fills your API and data-model gap; both of you have shipped frontend prototypes.',
    skills: [
      { name: 'Java', level: 5 },
      { name: 'Spring Boot', level: 4 },
      { name: 'PostgreSQL', level: 4 },
      { name: 'Docker', level: 3 },
    ],
    lookingFor: ['Hackathon teammate', 'Frontend collaborator'],
    project: 'Campus queue manager',
    bio: 'I enjoy making clean APIs, boringly reliable database code, and practical student tools.',
  },
  {
    id: 'u-kabir-03',
    username: 'pooja',
    displayName: 'Pooja Ghule',
    accent: 'orange',
    headline: 'Product designer turning research into interfaces people understand.',
    course: 'B.Des · 2nd year',
    availability: '5–7 hrs / week',
    score: 88,
    reason:
      'You can build the interface together; Pooja brings research and visual-system strength your current work lacks.',
    skills: [
      { name: 'Product research', level: 5 },
      { name: 'Figma', level: 5 },
      { name: 'Prototyping', level: 4 },
      { name: 'UX writing', level: 3 },
    ],
    lookingFor: ['Social-impact project', 'Developer collaborator'],
    project: 'Accessible campus map',
    bio: 'I like messy student problems, short feedback loops, and interfaces that do not need an instruction manual.',
  },
  {
    id: 'u-rahul-04',
    username: 'sanskar',
    displayName: 'Sanskar Bandekar',
    accent: 'green',
    headline: 'Data person with a bias for prototypes that answer one real question.',
    course: 'B.Tech AI & DS · 3rd year',
    availability: '4–6 hrs / week',
    score: 82,
    reason:
      'Her data and ML skills complement your product delivery skills, with enough shared JavaScript experience to move quickly.',
    skills: [
      { name: 'Python', level: 5 },
      { name: 'Data analysis', level: 4 },
      { name: 'FastAPI', level: 4 },
      { name: 'Machine learning', level: 3 },
    ],
    lookingFor: ['Research prototype', 'Hackathon teammate'],
    project: 'Study-pattern insights',
    bio: 'I build small models only when they help a person make a better decision.',
  },
];

export const matches = [
  {
    id: 'm-101',
    status: 'ACTIVE',
    profile: {
      id: 'u-meera-11',
      username: 'mrunali',
      displayName: 'Mrunali Shinde',
      accent: 'orange',
      headline: 'UX designer who asks the question behind the question.',
    },
    project: 'Campus accessibility navigator',
    lastMessage: 'I added the route notes to the shared outline.',
    lastMessageAt: '10:32',
    unread: 2,
    fit: 'You build the flow; Mrunali validates it with users.',
  },
  {
    id: 'm-102',
    status: 'ACTIVE',
    profile: {
      id: 'u-aditya-12',
      username: 'parth',
      displayName: 'Parth Patil',
      accent: 'blue',
      headline: 'Java developer interested in systems that stay understandable.',
    },
    project: 'Placement prep tracker',
    lastMessage: 'I can take the schema tonight.',
    lastMessageAt: 'Yesterday',
    unread: 0,
    fit: 'You own product flow; Parth owns the application core.',
  },
  {
    id: 'm-103',
    status: 'PENDING',
    profile: {
      id: 'u-noor-13',
      username: 'sejal',
      displayName: 'Sejal Pawar',
      accent: 'green',
      headline: 'Researcher and writer with a thing for civic technology.',
    },
    project: 'Local blood donation coordinator',
    lastMessage: 'Waiting for a response',
    lastMessageAt: 'Mon',
    unread: 0,
    fit: 'A shared civic-tech goal and complementary research skills.',
  },
];

export const conversations = {
  'm-101': [
    {
      id: 'msg-1',
      sender: 'them',
      content: 'Hey Purvaj — I read your project note. The accessibility angle is really solid.',
      time: '10:08',
    },
    {
      id: 'msg-2',
      sender: 'me',
      content: 'Thank you! I was hoping to talk to students who actually navigate campus differently.',
      time: '10:16',
    },
    {
      id: 'msg-3',
      sender: 'them',
      content: 'I added the route notes to the shared outline.',
      time: '10:32',
    },
  ],
  'm-102': [
    {
      id: 'msg-4',
      sender: 'me',
      content: 'Would a simple Java + PostgreSQL stack work for you?',
      time: 'Yesterday',
    },
    {
      id: 'msg-5',
      sender: 'them',
      content: 'Absolutely. I can take the schema tonight.',
      time: 'Yesterday',
    },
  ],
};

export const feedItems = [
  {
    id: 'f-1',
    author: { displayName: 'Divyesh Iyer', username: 'tanya.i', initials: 'TI', accent: 'orange' },
    kind: 'HELP',
    createdAt: '28 min ago',
    title: 'Need a second pair of eyes on a Spring Security redirect loop',
    body: 'Login works locally, but the browser keeps returning to /login after a successful sign-in. I have narrowed it down to my security config.',
    tags: ['Spring Boot', 'Spring Security'],
    replies: 3,
    helped: false,
  },
  {
    id: 'f-2',
    author: { displayName: 'Dev Malhotra', username: 'dev.m', initials: 'DM', accent: 'blue' },
    kind: 'SHOWCASE',
    createdAt: '1 hr ago',
    title: 'Our team shipped the first version of LabLoop',
    body: 'A small equipment-booking tool for the electronics lab. The best feedback so far: staff stopped using the whiteboard.',
    tags: ['Java', 'PostgreSQL', 'Team project'],
    replies: 8,
    helped: true,
  },
  {
    id: 'f-3',
    author: { displayName: 'Priya Menon', username: 'priya.m', initials: 'PM', accent: 'green' },
    kind: 'HELP',
    createdAt: '3 hrs ago',
    title: 'Looking for a UI partner for a hostel maintenance tracker',
    body: 'Backend is ready in Spring Boot. I need someone who can simplify the request flow before we show it to the warden.',
    tags: ['Frontend', 'Spring Boot', 'Civic tech'],
    replies: 5,
    helped: false,
  },
];

export const activity = [
  { label: 'Responded to Divyesh’s Spring Security question', when: 'Today' },
  { label: 'Matched with Mrunali Shinde', when: 'Yesterday' },
  { label: 'Added Java to your profile', when: 'Jul 20' },
];

export const skillCatalog = [
  'Java',
  'Spring Boot',
  'PostgreSQL',
  'React',
  'JavaScript',
  'Python',
  'Figma',
  'Docker',
  'Git',
  'REST APIs',
  'Machine learning',
  'Data analysis',
];

// Pending collaboration requests, used only by the offline demo workspace. The live
// application loads the same shape from GET /api/v1/interests/incoming.
export const interestRequests = [
  {
    id: 'demo-req-1',
    senderId: 901,
    senderName: 'Divya Kokane',
    status: 'PENDING',
    note: 'Design · Year 2',
    reason: 'Brings Figma and UI/UX Design — design work that is missing from your current skill set.',
  },
  {
    id: 'demo-req-2',
    senderId: 902,
    senderName: 'Pooja Ghule',
    status: 'PENDING',
    note: 'Data Science · Year 3',
    reason: 'Brings Data Analysis and Python — data work that is missing from your current skill set.',
  },
];
