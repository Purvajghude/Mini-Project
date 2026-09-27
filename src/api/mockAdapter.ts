import {
  AuthResponse,
  CandidateRecommendation,
  ChatMessage,
  ConnectionMatch,
  IncomingInterest,
  LoginRequest,
  PrivacySettings,
  Profile,
  ProfileSkill,
  Project,
  ProjectTask,
  RegisterRequest,
  ReplaceSkillsRequest,
  Skill,
  UpdateProfileRequest,
  AvailabilityPoll,
} from '../types/api';
import { ApiClient, ApiError } from './client';

const STORAGE_KEY = 'mesh_mock_database_v2';

interface MockDatabase {
  currentUser: Profile;
  skills: Skill[];
  recommendations: CandidateRecommendation[];
  incomingInterests: IncomingInterest[];
  matches: ConnectionMatch[];
  conversations: Record<string, ChatMessage[]>;
  projects: Project[];
  privacySettings: PrivacySettings;
}

const DEFAULT_SKILLS: Skill[] = [
  { id: 1, name: 'React', category: 'Frontend' },
  { id: 2, name: 'TypeScript', category: 'Languages' },
  { id: 3, name: 'JavaScript', category: 'Languages' },
  { id: 4, name: 'Java', category: 'Languages' },
  { id: 5, name: 'Spring Boot', category: 'Backend' },
  { id: 6, name: 'Python', category: 'Languages' },
  { id: 7, name: 'PostgreSQL', category: 'Database' },
  { id: 8, name: 'Docker', category: 'DevOps' },
  { id: 9, name: 'Figma', category: 'Design' },
  { id: 10, name: 'UI/UX Research', category: 'Design' },
  { id: 11, name: 'Machine Learning', category: 'AI & Data' },
  { id: 12, name: 'FastAPI', category: 'Backend' },
  { id: 13, name: 'REST APIs', category: 'Architecture' },
  { id: 14, name: 'Node.js', category: 'Backend' },
  { id: 15, name: 'GraphQL', category: 'Architecture' },
  { id: 16, name: 'Kotlin', category: 'Languages' },
];

function getInitialDatabase(): MockDatabase {
  const currentProfileSkills: ProfileSkill[] = [
    { id: 1, name: 'React', category: 'Frontend', proficiency: 4, evidenceSupported: false },
    { id: 2, name: 'TypeScript', category: 'Languages', proficiency: 4, evidenceSupported: false },
    { id: 3, name: 'JavaScript', category: 'Languages', proficiency: 5, evidenceSupported: false },
    { id: 4, name: 'Java', category: 'Languages', proficiency: 2, evidenceSupported: false },
    { id: 9, name: 'Figma', category: 'Design', proficiency: 3, evidenceSupported: false },
  ];

  const currentUser: Profile = {
    id: 'usr-self-9901',
    username: 'purvaj.builds',
    displayName: 'Purvaj Ghude',
    department: 'Computer Science & Engineering',
    yearOfStudy: 3,
    bio: 'Frontend and web systems builder. Passionate about human-centric interfaces, performance, and solid software architecture.',
    avatarKey: 'blue',
    availability: '8–10 hrs / week',
    primaryDomain: 'Frontend & Web Systems',
    onboardingComplete: true,
    skills: currentProfileSkills,
  };

  const recommendations: CandidateRecommendation[] = [
    {
      userId: 'cand-001',
      username: 'divya.dev',
      displayName: 'Divya Kokane',
      avatarKey: 'sapphire',
      department: 'Information Technology',
      yearOfStudy: 3,
      bio: 'Java and Spring Boot engineer. I focus on resilient APIs, clean database schema design, and microservices.',
      availability: '10–12 hrs / week',
      primaryDomain: 'Backend & Distributed Systems',
      score: 95,
      reason: 'Outstanding backend depth fills your distributed systems gap. Shared experience shipping RESTful web prototypes.',
      skills: [
        { id: 4, name: 'Java', category: 'Languages', proficiency: 5, evidenceSupported: false },
        { id: 5, name: 'Spring Boot', category: 'Backend', proficiency: 5, evidenceSupported: false },
        { id: 7, name: 'PostgreSQL', category: 'Database', proficiency: 4, evidenceSupported: false },
        { id: 8, name: 'Docker', category: 'DevOps', proficiency: 3, evidenceSupported: false },
      ],
      sharedSkills: ['Java', 'REST APIs'],
      complementarySkills: ['Spring Boot', 'PostgreSQL', 'Docker'],
      breakdown: {
        gapFill: 96,
        sharedGround: 88,
        depth: 94,
        categoryReach: 92,
      },
      githubEvidence: {
        connected: true,
        githubUsername: 'divyakokane',
        verifiedCommits: 384,
        topLanguages: [
          { language: 'Java', percentage: 65 },
          { language: 'SQL', percentage: 22 },
          { language: 'Go', percentage: 13 },
        ],
        pinnedRepos: [
          {
            name: 'distributed-queue-engine',
            description: 'High-throughput transactional queue built with Spring Boot and Redis.',
            stars: 24,
            forks: 7,
            primaryLanguage: 'Java',
            updatedAt: '2 days ago',
            verified: true,
            commitsCount: 142,
          },
          {
            name: 'campus-exam-portal-api',
            description: 'Secure REST microservices for semester exam scheduling.',
            stars: 12,
            forks: 3,
            primaryLanguage: 'Java',
            updatedAt: '1 week ago',
            verified: true,
            commitsCount: 88,
          },
        ],
        lastSyncedAt: 'Yesterday at 19:40',
      },
      savedForLater: false,
      status: 'none',
    },
    {
      userId: 'cand-002',
      username: 'pooja.design',
      displayName: 'Pooja Ghule',
      avatarKey: 'amber',
      department: 'Design & Human-Computer Interaction',
      yearOfStudy: 2,
      bio: 'Product designer obsessed with student friction points, accessibility, and clean design systems in Figma.',
      availability: '6–8 hrs / week',
      primaryDomain: 'Product Design & UX',
      score: 89,
      reason: 'Brings strong user research, information architecture, and UI polish to elevate your functional code into a product.',
      skills: [
        { id: 9, name: 'Figma', category: 'Design', proficiency: 5, evidenceSupported: false },
        { id: 10, name: 'UI/UX Research', category: 'Design', proficiency: 5, evidenceSupported: false },
        { id: 1, name: 'React', category: 'Frontend', proficiency: 2, evidenceSupported: false },
      ],
      sharedSkills: ['React', 'Figma'],
      complementarySkills: ['UI/UX Research', 'Design Systems', 'Accessibility'],
      breakdown: {
        gapFill: 91,
        sharedGround: 78,
        depth: 92,
        categoryReach: 95,
      },
      githubEvidence: {
        connected: true,
        githubUsername: 'poojadesign',
        verifiedCommits: 98,
        topLanguages: [
          { language: 'CSS', percentage: 48 },
          { language: 'HTML', percentage: 32 },
          { language: 'JavaScript', percentage: 20 },
        ],
        pinnedRepos: [
          {
            name: 'mesh-design-tokens',
            description: 'Material Design 3 tokens and accessibility spec sheet for academic tools.',
            stars: 18,
            forks: 4,
            primaryLanguage: 'CSS',
            updatedAt: '3 days ago',
            verified: true,
            commitsCount: 64,
          },
        ],
        lastSyncedAt: '2 days ago',
      },
      savedForLater: false,
      status: 'none',
    },
    {
      userId: 'cand-003',
      username: 'sanskar.ml',
      displayName: 'Sanskar Bandekar',
      avatarKey: 'emerald',
      department: 'Artificial Intelligence & Data Science',
      yearOfStudy: 3,
      bio: 'Data scientist who builds small, high-leverage ML pipelines and FastAPI backends.',
      availability: '5–7 hrs / week',
      primaryDomain: 'Machine Learning & Analytics',
      score: 84,
      reason: 'Offers strong ML and data modeling skills to power recommendation engines or predictive models for your project.',
      skills: [
        { id: 6, name: 'Python', category: 'Languages', proficiency: 5, evidenceSupported: false },
        { id: 11, name: 'Machine Learning', category: 'AI & Data', proficiency: 4, evidenceSupported: false },
        { id: 12, name: 'FastAPI', category: 'Backend', proficiency: 4, evidenceSupported: false },
      ],
      sharedSkills: ['Python'],
      complementarySkills: ['Machine Learning', 'FastAPI', 'Data Pipelines'],
      breakdown: {
        gapFill: 88,
        sharedGround: 72,
        depth: 86,
        categoryReach: 90,
      },
      githubEvidence: {
        connected: true,
        githubUsername: 'sanskarb',
        verifiedCommits: 215,
        topLanguages: [
          { language: 'Python', percentage: 82 },
          { language: 'Jupyter', percentage: 14 },
          { language: 'Shell', percentage: 4 },
        ],
        pinnedRepos: [
          {
            name: 'student-clustering-engine',
            description: 'Vector-based recommendation engine matching student skills with cosine similarity.',
            stars: 31,
            forks: 9,
            primaryLanguage: 'Python',
            updatedAt: '5 days ago',
            verified: true,
            commitsCount: 112,
          },
        ],
        lastSyncedAt: '3 days ago',
      },
      savedForLater: false,
      status: 'none',
    },
    {
      userId: 'cand-004',
      username: 'ananya.cloud',
      displayName: 'Ananya Sharma',
      avatarKey: 'violet',
      department: 'Computer Science & Engineering',
      yearOfStudy: 4,
      bio: 'Cloud architecture and DevOps enthusiast. Docker, Kubernetes, and CI/CD automation.',
      availability: '8–10 hrs / week',
      primaryDomain: 'Cloud & Infrastructure',
      score: 81,
      reason: 'Brings deployment automation and containerization expertise to ensure our projects scale reliably.',
      skills: [
        { id: 8, name: 'Docker', category: 'DevOps', proficiency: 5, evidenceSupported: false },
        { id: 6, name: 'Python', category: 'Languages', proficiency: 4, evidenceSupported: false },
        { id: 2, name: 'TypeScript', category: 'Languages', proficiency: 3, evidenceSupported: false },
      ],
      sharedSkills: ['TypeScript', 'Docker'],
      complementarySkills: ['Kubernetes', 'CI/CD Pipelines', 'Cloud Native'],
      breakdown: {
        gapFill: 84,
        sharedGround: 76,
        depth: 82,
        categoryReach: 82,
      },
      githubEvidence: {
        connected: true,
        githubUsername: 'ananyasharma',
        verifiedCommits: 310,
        topLanguages: [
          { language: 'Dockerfile', percentage: 40 },
          { language: 'Go', percentage: 35 },
          { language: 'Python', percentage: 25 },
        ],
        pinnedRepos: [
          {
            name: 'k8s-academic-lab',
            description: 'Automated cluster deployment scripts with Helm and GitHub Actions.',
            stars: 19,
            forks: 5,
            primaryLanguage: 'Go',
            updatedAt: 'Just now',
            verified: true,
            commitsCount: 175,
          },
        ],
        lastSyncedAt: 'Today at 08:00',
      },
      savedForLater: false,
      status: 'none',
    },
  ];

  const incomingInterests: IncomingInterest[] = [
    {
      id: 'req-101',
      senderId: 'cand-001',
      senderName: 'Divya Kokane',
      senderDepartment: 'Information Technology',
      senderYear: 3,
      avatarKey: 'sapphire',
      status: 'PENDING',
      note: 'Hey Purvaj! I saw your frontend work on the campus navigation portal. I am building the Spring Boot backend and would love to collaborate.',
      reason: 'Spring Boot & PostgreSQL fills your data layer gap with 95% synergy.',
      matchScore: 95,
      sentAt: '2 hours ago',
    },
    {
      id: 'req-102',
      senderId: 'cand-002',
      senderName: 'Pooja Ghule',
      senderDepartment: 'Design & HCI',
      senderYear: 2,
      avatarKey: 'amber',
      status: 'PENDING',
      note: 'Loved your focus on clean interfaces! Looking for a developer partner for the upcoming campus hackathon.',
      reason: 'Figma and UX research complements your coding skills with 89% synergy.',
      matchScore: 89,
      sentAt: 'Yesterday',
    },
  ];

  const matches: ConnectionMatch[] = [
    {
      id: 'm-201',
      collaborator: {
        id: 'cand-005',
        username: 'mrunali.s',
        displayName: 'Mrunali Shinde',
        department: 'Design',
        yearOfStudy: 3,
        bio: 'Interaction designer turning complex student workflows into seamless touchpoints.',
        avatarKey: 'orange',
        availability: '6–8 hrs / week',
        primaryDomain: 'Interaction Design',
        onboardingComplete: true,
        skills: [
          { id: 9, name: 'Figma', category: 'Design', proficiency: 5, evidenceSupported: false },
          { id: 10, name: 'UI/UX Research', category: 'Design', proficiency: 4, evidenceSupported: false },
        ],
      },
      projectTitle: 'Campus Accessibility Navigator',
      projectId: 'proj-1',
      status: 'ACTIVE',
      fitDescription: 'You implement the responsive UI while Mrunali conducts student accessibility tests.',
      lastMessage: 'I updated the user testing notes in the project workspace!',
      lastMessageAt: '10:45 AM',
      unreadCount: 1,
    },
    {
      id: 'm-202',
      collaborator: {
        id: 'cand-006',
        username: 'parth.p',
        displayName: 'Parth Patil',
        department: 'Computer Science',
        yearOfStudy: 3,
        bio: 'Systems software and distributed database enthusiast.',
        avatarKey: 'blue',
        availability: '8–10 hrs / week',
        primaryDomain: 'Backend Core',
        onboardingComplete: true,
        skills: [
          { id: 4, name: 'Java', category: 'Languages', proficiency: 4, evidenceSupported: false },
          { id: 7, name: 'PostgreSQL', category: 'Database', proficiency: 4, evidenceSupported: false },
        ],
      },
      projectTitle: 'Placement Preparation Tracker',
      projectId: 'proj-2',
      status: 'ACTIVE',
      fitDescription: 'You drive the candidate dashboard while Parth architects the question bank schema.',
      lastMessage: 'Let us sync on the schema during the availability window.',
      lastMessageAt: 'Yesterday',
      unreadCount: 0,
    },
  ];

  const conversations: Record<string, ChatMessage[]> = {
    'm-201': [
      {
        id: 'msg-1',
        senderId: 'cand-005',
        senderName: 'Mrunali Shinde',
        content: 'Hi Purvaj! Excited to collaborate on the Campus Accessibility Navigator project.',
        sentAt: 'Yesterday, 14:10',
        isSelf: false,
      },
      {
        id: 'msg-2',
        senderId: 'usr-self-9901',
        senderName: 'Purvaj Ghude',
        content: 'Great to meet you Mrunali! I have set up the Material Design 3 foundation with clean navigation.',
        sentAt: 'Yesterday, 14:25',
        isSelf: true,
      },
      {
        id: 'msg-3',
        senderId: 'cand-005',
        senderName: 'Mrunali Shinde',
        content: 'I updated the user testing notes in the project workspace!',
        sentAt: '10:45 AM',
        isSelf: false,
      },
    ],
    'm-202': [
      {
        id: 'msg-4',
        senderId: 'cand-006',
        senderName: 'Parth Patil',
        content: 'Hey! The PostgreSQL database schema draft is ready for review.',
        sentAt: '2 days ago',
        isSelf: false,
      },
      {
        id: 'msg-5',
        senderId: 'usr-self-9901',
        senderName: 'Purvaj Ghude',
        content: 'Looks solid! Will test the endpoints against our mock adapter.',
        sentAt: 'Yesterday',
        isSelf: true,
      },
      {
        id: 'msg-6',
        senderId: 'cand-006',
        senderName: 'Parth Patil',
        content: 'Let us sync on the schema during the availability window.',
        sentAt: 'Yesterday',
        isSelf: false,
      },
    ],
  };

  const projects: Project[] = [
    {
      id: 'proj-1',
      title: 'Campus Accessibility Navigator',
      slug: 'campus-accessibility-navigator',
      description: 'An open-source interactive campus map tailored for students with mobility impairments, providing step-free routing, elevator statuses, and accessible entrance guides.',
      category: 'Civic & Social Impact',
      status: 'ACTIVE',
      lead: {
        id: 'usr-self-9901',
        displayName: 'Purvaj Ghude',
        username: 'purvaj.builds',
      },
      members: [
        {
          id: 'usr-self-9901',
          displayName: 'Purvaj Ghude',
          username: 'purvaj.builds',
          role: 'Frontend & System Lead',
          avatarKey: 'blue',
        },
        {
          id: 'cand-005',
          displayName: 'Mrunali Shinde',
          username: 'mrunali.s',
          role: 'UI/UX Researcher',
          avatarKey: 'orange',
        },
      ],
      openRoles: [
        {
          title: 'Backend Route Optimization Engineer',
          skillsNeeded: ['Python', 'Graph Algorithms', 'PostGIS'],
          capacity: 1,
        },
        {
          title: 'Mobile Testing Lead',
          skillsNeeded: ['Screen Readers', 'WCAG 2.1'],
          capacity: 1,
        },
      ],
      tags: ['Accessibility', 'React', 'TypeScript', 'Campus Map'],
      tasks: [
        {
          id: 'task-1',
          title: 'Implement accessible high-contrast map tiles',
          description: 'Ensure color contrast meets WCAG AAA standards on outdoor campus pathways.',
          status: 'DONE',
          priority: 'HIGH',
          assignee: { id: 'usr-self-9901', displayName: 'Purvaj Ghude', avatarKey: 'blue' },
          dueDate: '2026-10-01',
          tags: ['A11y', 'Frontend'],
        },
        {
          id: 'task-2',
          title: 'Interview 5 students with wheelchair assistance',
          description: 'Document elevator reliability and ramp grade friction in the Science Quad.',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assignee: { id: 'cand-005', displayName: 'Mrunali Shinde', avatarKey: 'orange' },
          dueDate: '2026-10-04',
          tags: ['Research'],
        },
        {
          id: 'task-3',
          title: 'Add offline caching for indoor floor plans',
          description: 'Use IndexedDB/service worker to preserve floor plans when basement Wi-Fi drops.',
          status: 'TODO',
          priority: 'MEDIUM',
          assignee: { id: 'usr-self-9901', displayName: 'Purvaj Ghude', avatarKey: 'blue' },
          dueDate: '2026-10-10',
          tags: ['Performance'],
        },
        {
          id: 'task-4',
          title: 'Conduct peer review of API contracts',
          description: 'Review route geometry GeoJSON contract with the backend team.',
          status: 'IN_REVIEW',
          priority: 'MEDIUM',
          tags: ['API'],
        },
      ],
      events: [
        {
          id: 'ev-1',
          title: 'Sprint Planning & User Feedback Review',
          description: 'Review Mrunali’s student interviews and finalize map routing tickets.',
          startDate: '2026-09-30T16:00:00Z',
          endDate: '2026-09-30T17:30:00Z',
          type: 'MEETING',
          location: 'Innovation Lab 204 & Google Meet',
        },
        {
          id: 'ev-2',
          title: 'Milestone 1: Alpha Prototype on Staging',
          description: 'Complete initial end-to-end route search and campus building directory.',
          startDate: '2026-10-15T23:59:00Z',
          endDate: '2026-10-15T23:59:00Z',
          type: 'MILESTONE',
        },
      ],
      availabilityPolls: [
        {
          id: 'poll-1',
          title: 'Weekly Core Team Sync Time',
          description: 'Select times you can regularly join our 45-minute sprint check-in.',
          status: 'OPEN',
          voterCount: 2,
          slots: [
            { id: 'slot-1', day: 'Tuesday', timeRange: '16:00 - 17:00', votes: ['usr-self-9901', 'cand-005'] },
            { id: 'slot-2', day: 'Wednesday', timeRange: '17:00 - 18:00', votes: ['usr-self-9901'] },
            { id: 'slot-3', day: 'Thursday', timeRange: '15:30 - 16:30', votes: ['cand-005'] },
            { id: 'slot-4', day: 'Friday', timeRange: '14:00 - 15:00', votes: ['usr-self-9901', 'cand-005'] },
          ],
        },
      ],
      githubRepoUrl: 'https://github.com/mesh-campus/accessibility-nav',
      createdAt: '2026-09-15',
    },
    {
      id: 'proj-2',
      title: 'LabLoop: Equipment & Resource Booking',
      slug: 'labloop-booking',
      description: 'Streamlined university hardware lab booking system replacing paper registers with real-time slot locks and equipment telemetry.',
      category: 'Campus Infrastructure',
      status: 'ACTIVE',
      lead: {
        id: 'cand-006',
        displayName: 'Parth Patil',
        username: 'parth.p',
      },
      members: [
        {
          id: 'cand-006',
          displayName: 'Parth Patil',
          username: 'parth.p',
          role: 'Backend Architect',
          avatarKey: 'blue',
        },
        {
          id: 'usr-self-9901',
          displayName: 'Purvaj Ghude',
          username: 'purvaj.builds',
          role: 'Frontend Collaborator',
          avatarKey: 'blue',
        },
      ],
      openRoles: [
        {
          title: 'Embedded IoT Integrator',
          skillsNeeded: ['ESP32', 'MQTT', 'C++'],
          capacity: 1,
        },
      ],
      tags: ['Spring Boot', 'PostgreSQL', 'Hardware Labs'],
      tasks: [
        {
          id: 'task-10',
          title: 'Design database schema for equipment reservations',
          description: 'Avoid double-booking with transactional row locks.',
          status: 'DONE',
          priority: 'HIGH',
          assignee: { id: 'cand-006', displayName: 'Parth Patil' },
          dueDate: '2026-09-28',
          tags: ['Database'],
        },
        {
          id: 'task-11',
          title: 'Build booking calendar UI',
          description: 'Calendar view showing available oscilloscopes and soldering stations.',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assignee: { id: 'usr-self-9901', displayName: 'Purvaj Ghude' },
          dueDate: '2026-10-05',
          tags: ['Frontend'],
        },
      ],
      events: [
        {
          id: 'ev-10',
          title: 'Hardware Lab Manager Demo',
          description: 'Show demo to Department Lab Assistant to confirm slot intervals.',
          startDate: '2026-10-08T11:00:00Z',
          endDate: '2026-10-08T12:00:00Z',
          type: 'DEADLINE',
          location: 'Electronics Block Room 102',
        },
      ],
      availabilityPolls: [
        {
          id: 'poll-2',
          title: 'Lab Assistant Interview Slot',
          description: 'When are you free to walk the lab floor together?',
          status: 'OPEN',
          voterCount: 1,
          slots: [
            { id: 'slot-10', day: 'Monday', timeRange: '11:00 - 12:00', votes: ['cand-006'] },
            { id: 'slot-11', day: 'Tuesday', timeRange: '14:00 - 15:00', votes: ['cand-006', 'usr-self-9901'] },
          ],
        },
      ],
      githubRepoUrl: 'https://github.com/mesh-campus/labloop',
      createdAt: '2026-09-18',
    },
  ];

  const privacySettings: PrivacySettings = {
    profileVisibility: 'CAMPUS',
    showEmail: false,
    allowDiscovery: true,
    notifyOnMatch: true,
    notifyOnMessage: true,
    githubSyncEnabled: true,
  };

  return {
    currentUser,
    skills: DEFAULT_SKILLS,
    recommendations,
    incomingInterests,
    matches,
    conversations,
    projects,
    privacySettings,
  };
}

export class MockApiAdapter implements ApiClient {
  private db: MockDatabase;
  private token: string | null = 'mock-bearer-token-12345';

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): MockDatabase {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    const fresh = getInitialDatabase();
    this.persist(fresh);
    return fresh;
  }

  private persist(db: MockDatabase = this.db): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }

  private async latency(ms = 120): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  // --- OpenAPI 3.1.0 Contract Endpoints ---

  async register(body: RegisterRequest): Promise<AuthResponse> {
    await this.latency(200);

    if (!body.email || !body.password || !body.displayName || !body.username) {
      throw new ApiError('Validation error', 400, {
        displayName: !body.displayName ? 'Display name is required' : '',
        email: !body.email ? 'Valid email required' : '',
      });
    }

    const newUser: Profile = {
      id: `usr-${Date.now()}`,
      username: body.username,
      displayName: body.displayName,
      department: null,
      yearOfStudy: null,
      bio: null,
      avatarKey: 'blue',
      availability: null,
      primaryDomain: null,
      onboardingComplete: false,
      skills: [],
    };

    this.db.currentUser = newUser;
    this.persist();

    return {
      token: 'mock-jwt-token-' + Date.now(),
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      user: newUser,
    };
  }

  async login(body: LoginRequest): Promise<AuthResponse> {
    await this.latency(200);

    if (!body.email || !body.password) {
      throw new ApiError('Email and password are required', 400);
    }

    return {
      token: 'mock-jwt-token-active',
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
      user: this.db.currentUser,
    };
  }

  async getProfile(): Promise<Profile> {
    await this.latency(80);
    return JSON.parse(JSON.stringify(this.db.currentUser));
  }

  async updateProfile(body: UpdateProfileRequest): Promise<Profile> {
    await this.latency(150);

    this.db.currentUser = {
      ...this.db.currentUser,
      displayName: body.displayName ?? this.db.currentUser.displayName,
      department: body.department !== undefined ? body.department : this.db.currentUser.department,
      yearOfStudy: body.yearOfStudy !== undefined ? body.yearOfStudy : this.db.currentUser.yearOfStudy,
      bio: body.bio !== undefined ? body.bio : this.db.currentUser.bio,
      avatarKey: body.avatarKey !== undefined ? body.avatarKey : this.db.currentUser.avatarKey,
      availability: body.availability !== undefined ? body.availability : this.db.currentUser.availability,
      primaryDomain: body.primaryDomain !== undefined ? body.primaryDomain : this.db.currentUser.primaryDomain,
      onboardingComplete: body.onboardingComplete !== undefined ? body.onboardingComplete : this.db.currentUser.onboardingComplete,
    };

    this.persist();
    return JSON.parse(JSON.stringify(this.db.currentUser));
  }

  async replaceSkills(body: ReplaceSkillsRequest): Promise<Profile> {
    await this.latency(150);

    const updatedProfileSkills: ProfileSkill[] = body.skills.map((item) => {
      const match = this.db.skills.find((s) => s.id === item.skillId);
      return {
        id: item.skillId,
        name: match ? match.name : `Skill #${item.skillId}`,
        category: match ? match.category : 'General',
        proficiency: item.proficiency,
        evidenceSupported: false,
      };
    });

    this.db.currentUser.skills = updatedProfileSkills;
    this.persist();
    return JSON.parse(JSON.stringify(this.db.currentUser));
  }

  async getSkills(): Promise<Skill[]> {
    await this.latency(80);
    return [...this.db.skills];
  }

  // --- Extended Domain Flows ---

  async getRecommendations(): Promise<CandidateRecommendation[]> {
    await this.latency(100);
    return JSON.parse(JSON.stringify(this.db.recommendations));
  }

  async sendInterest(candidateId: string): Promise<{ matchId?: string; status: string }> {
    await this.latency(180);
    const candidate = this.db.recommendations.find((c) => c.userId === candidateId);
    if (!candidate) throw new ApiError('Candidate not found', 404);

    candidate.status = 'interested';

    // Check if the candidate already has an incoming interest to us (handshake completion)
    const existingIncomingIndex = this.db.incomingInterests.findIndex((i) => i.senderId === candidateId);

    if (existingIncomingIndex !== -1) {
      // Mutual match created!
      this.db.incomingInterests.splice(existingIncomingIndex, 1);
      const matchId = `m-${Date.now()}`;
      const newMatch: ConnectionMatch = {
        id: matchId,
        collaborator: {
          id: candidate.userId,
          username: candidate.username,
          displayName: candidate.displayName,
          department: candidate.department,
          yearOfStudy: candidate.yearOfStudy,
          bio: candidate.bio,
          avatarKey: candidate.avatarKey,
          availability: candidate.availability,
          primaryDomain: candidate.primaryDomain,
          onboardingComplete: true,
          skills: candidate.skills,
        },
        projectTitle: `${candidate.displayName} Collaboration`,
        status: 'ACTIVE',
        fitDescription: candidate.reason,
        lastMessage: 'You matched! Send your project context to get started.',
        lastMessageAt: 'Just now',
        unreadCount: 0,
      };

      this.db.matches.unshift(newMatch);
      this.db.conversations[matchId] = [];
      this.persist();
      return { matchId, status: 'MATCHED' };
    }

    this.persist();
    return { status: 'REQUEST_SENT' };
  }

  async passCandidate(candidateId: string): Promise<void> {
    await this.latency(80);
    const candidate = this.db.recommendations.find((c) => c.userId === candidateId);
    if (candidate) {
      candidate.status = 'passed';
      this.persist();
    }
  }

  async saveCandidate(candidateId: string): Promise<void> {
    await this.latency(80);
    const candidate = this.db.recommendations.find((c) => c.userId === candidateId);
    if (candidate) {
      candidate.savedForLater = !candidate.savedForLater;
      candidate.status = candidate.savedForLater ? 'saved' : 'none';
      this.persist();
    }
  }

  async getIncomingInterests(): Promise<IncomingInterest[]> {
    await this.latency(100);
    return JSON.parse(JSON.stringify(this.db.incomingInterests));
  }

  async acceptInterest(interestId: string): Promise<{ matchId: string }> {
    await this.latency(180);
    const interestIndex = this.db.incomingInterests.findIndex((i) => i.id === interestId);
    if (interestIndex === -1) throw new ApiError('Request not found', 404);

    const interest = this.db.incomingInterests[interestIndex];
    this.db.incomingInterests.splice(interestIndex, 1);

    const matchId = `m-${Date.now()}`;
    const newMatch: ConnectionMatch = {
      id: matchId,
      collaborator: {
        id: interest.senderId,
        username: interest.senderName.toLowerCase().replace(/\s+/g, '.'),
        displayName: interest.senderName,
        department: interest.senderDepartment || 'Engineering',
        yearOfStudy: interest.senderYear || 3,
        bio: interest.note,
        avatarKey: interest.avatarKey || 'blue',
        availability: 'Available',
        primaryDomain: 'Peer Collaborator',
        onboardingComplete: true,
        skills: [],
      },
      projectTitle: `${interest.senderName} Project Channel`,
      status: 'ACTIVE',
      fitDescription: interest.reason,
      lastMessage: interest.note,
      lastMessageAt: 'Just now',
      unreadCount: 0,
    };

    this.db.matches.unshift(newMatch);
    this.db.conversations[matchId] = [
      {
        id: `msg-${Date.now()}`,
        senderId: interest.senderId,
        senderName: interest.senderName,
        content: interest.note,
        sentAt: 'Just now',
        isSelf: false,
      },
    ];

    this.persist();
    return { matchId };
  }

  async declineInterest(interestId: string): Promise<void> {
    await this.latency(120);
    this.db.incomingInterests = this.db.incomingInterests.filter((i) => i.id !== interestId);
    this.persist();
  }

  async getMatches(): Promise<ConnectionMatch[]> {
    await this.latency(100);
    return JSON.parse(JSON.stringify(this.db.matches));
  }

  async getMessages(matchId: string): Promise<ChatMessage[]> {
    await this.latency(80);
    return JSON.parse(JSON.stringify(this.db.conversations[matchId] || []));
  }

  async sendMessage(matchId: string, content: string): Promise<ChatMessage> {
    await this.latency(100);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: this.db.currentUser.id,
      senderName: this.db.currentUser.displayName,
      content,
      sentAt: 'Just now',
      isSelf: true,
    };

    if (!this.db.conversations[matchId]) {
      this.db.conversations[matchId] = [];
    }
    this.db.conversations[matchId].push(newMsg);

    // Update match preview
    const match = this.db.matches.find((m) => m.id === matchId);
    if (match) {
      match.lastMessage = content;
      match.lastMessageAt = 'Just now';
    }

    this.persist();
    return newMsg;
  }

  async getProjects(): Promise<Project[]> {
    await this.latency(100);
    return JSON.parse(JSON.stringify(this.db.projects));
  }

  async getProject(projectId: string): Promise<Project | null> {
    await this.latency(80);
    const p = this.db.projects.find((proj) => proj.id === projectId);
    return p ? JSON.parse(JSON.stringify(p)) : null;
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    await this.latency(150);
    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      tasks: project.tasks || [],
      events: project.events || [],
      availabilityPolls: project.availabilityPolls || [],
    };
    this.db.projects.unshift(newProject);
    this.persist();
    return JSON.parse(JSON.stringify(newProject));
  }

  async createProjectTask(projectId: string, task: Omit<ProjectTask, 'id'>): Promise<ProjectTask> {
    await this.latency(150);
    const project = this.db.projects.find((p) => p.id === projectId);
    if (!project) throw new ApiError('Project not found', 404);

    const newTask: ProjectTask = {
      ...task,
      id: `task-${Date.now()}`,
    };

    project.tasks.push(newTask);
    this.persist();
    return newTask;
  }

  async updateProjectTask(projectId: string, taskId: string, updates: Partial<ProjectTask>): Promise<ProjectTask> {
    await this.latency(100);
    const project = this.db.projects.find((p) => p.id === projectId);
    if (!project) throw new ApiError('Project not found', 404);

    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) throw new ApiError('Task not found', 404);

    Object.assign(task, updates);
    this.persist();
    return JSON.parse(JSON.stringify(task));
  }

  async createProjectEvent(projectId: string, event: Omit<import('../types/api').ProjectEvent, 'id'>): Promise<import('../types/api').ProjectEvent> {
    await this.latency(120);
    const project = this.db.projects.find((p) => p.id === projectId);
    if (!project) throw new ApiError('Project not found', 404);

    const newEvent: import('../types/api').ProjectEvent = {
      ...event,
      id: `ev-${Date.now()}`,
    };

    project.events.push(newEvent);
    this.persist();
    return JSON.parse(JSON.stringify(newEvent));
  }

  async votePollSlot(projectId: string, pollId: string, slotId: string): Promise<AvailabilityPoll> {
    await this.latency(120);
    const project = this.db.projects.find((p) => p.id === projectId);
    if (!project) throw new ApiError('Project not found', 404);

    const poll = project.availabilityPolls.find((pol) => pol.id === pollId);
    if (!poll) throw new ApiError('Poll not found', 404);

    const slot = poll.slots.find((s) => s.id === slotId);
    if (!slot) throw new ApiError('Slot not found', 404);

    const selfId = this.db.currentUser.id;
    const hasVoted = slot.votes.includes(selfId);

    if (hasVoted) {
      slot.votes = slot.votes.filter((id) => id !== selfId);
    } else {
      slot.votes.push(selfId);
    }

    // Recompute unique voter count
    const allVoters = new Set<string>();
    poll.slots.forEach((s) => s.votes.forEach((v) => allVoters.add(v)));
    poll.voterCount = allVoters.size;

    this.persist();
    return JSON.parse(JSON.stringify(poll));
  }

  async createAvailabilityPoll(projectId: string, poll: Omit<AvailabilityPoll, 'id' | 'voterCount'>): Promise<AvailabilityPoll> {
    await this.latency(120);
    const project = this.db.projects.find((p) => p.id === projectId);
    if (!project) throw new ApiError('Project not found', 404);

    const newPoll: AvailabilityPoll = {
      ...poll,
      id: `poll-${Date.now()}`,
      voterCount: 0,
      slots: poll.slots.map((s, idx) => ({ ...s, id: s.id || `slot-${Date.now()}-${idx}`, votes: s.votes || [] })),
    };

    project.availabilityPolls.push(newPoll);
    this.persist();
    return JSON.parse(JSON.stringify(newPoll));
  }

  async getPrivacySettings(): Promise<PrivacySettings> {
    await this.latency(50);
    return JSON.parse(JSON.stringify(this.db.privacySettings));
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    await this.latency(100);
    this.db.privacySettings = {
      ...this.db.privacySettings,
      ...settings,
    };
    this.persist();
    return JSON.parse(JSON.stringify(this.db.privacySettings));
  }
}
