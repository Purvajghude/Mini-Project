# Mesh Connect: Skill-Based Collaboration Platform

## 1. Introduction

Students often have useful skills but do not know who to approach when they need help for a project, hackathon, club activity or assignment. Most social platforms show people based on popularity or mutual friends. They do not clearly answer a practical question: **who has the skills that my project is missing?**

Mesh Connect is a web application that helps students discover collaborators through skills. A user creates a profile, adds skills and chooses a proficiency level. The system suggests students whose skills complement the user's skills. When two students show interest in each other, they become a match and can start a conversation. A small help-feed is also included for students who need quick help on a specific topic.

The idea comes from our hackathon application, Mesh. The original version is a Flutter application with Supabase and a Python AI service. For this mini project, we are converting the central idea into a maintainable Java full-stack application.

## 2. Problem statement

There is no simple campus-focused platform where students can find people based on what they can contribute to a project. Group formation is usually random, based on friend circles, or done at the last moment. This can lead to uneven work distribution and missed opportunities for cross-domain collaboration.

## 3. Proposed solution

Mesh Connect provides a skill profile for each student and uses a simple, explainable matching score. For example, a student who knows Java and database design can be suggested to a student who has an idea and UI skills but lacks backend skills. The suggested result includes a short reason such as, “Strong in Java and SQL, which fills your backend gap.”

The first version is designed for one college or department. It is a web application with a Java Spring Boot backend, PostgreSQL database and responsive browser UI.

## 4. Objectives

- Build a full-stack Java web application with secure user accounts.
- Store student profiles and skills in a normalized relational database.
- Suggest collaborators using a transparent skill-complementarity algorithm.
- Support mutual interest, matching and one-to-one messaging.
- Provide a help-feed for project questions and collaboration requests.
- Demonstrate proper backend layering, REST APIs, database relationships and validation.

## 5. Users and roles

| Role | Main permissions |
|---|---|
| Student | Manage own profile, skills, requests, matches, messages and posts |
| Administrator | View reports, manage inappropriate posts/users and maintain the skill catalogue |

For the demo, the administrator panel can be limited to a protected page that lists reported content. Student functionality is the main focus.

## 6. Functional requirements

### FR-01: Authentication

The system shall allow a student to register with name, college email, username and password. The student shall be able to log in and log out. Passwords must be stored only as BCrypt hashes.

### FR-02: Profile management

The student shall be able to edit display name, department, short bio and profile visibility. Each student can add or remove skills.

### FR-03: Skill management

The system shall store skills in a common catalogue. A student can attach a skill to their profile and select a level from 1 to 5. This avoids spelling duplicates such as “Java”, “java” and “JAVA”.

### FR-04: Collaboration recommendations

The system shall show recommended students after excluding the logged-in user, blocked users and users already acted on. The result shall include a score and a short explanation.

### FR-05: Interest and match

The student can send an interest request to a recommended student. When the other student accepts, the system creates one match record. A pair must never have duplicate matches.

### FR-06: Messaging

Only matched students may send messages to each other. Messages are stored with sender, match and time. The initial version may refresh messages manually; WebSocket-based live chat is an enhancement.

### FR-07: Help-feed

The student can create a post with title, description, category and tags. Other students can comment. The author may mark one comment as the solution.

### FR-08: Safety

The student can report a post/comment and block another student. Blocked users should not appear in recommendations and cannot message each other.

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| Usability | Important actions should be reachable within two or three screens. |
| Performance | Normal API requests should respond within about two seconds for a college-sized dataset. |
| Security | Password hashes, JWT/session protection, server-side authorization and input validation are required. |
| Reliability | Database constraints must prevent duplicate profile skills, duplicate interest actions and duplicate matches. |
| Maintainability | Backend should follow controller-service-repository separation. |
| Portability | The application should run locally through Docker or standard Maven commands. |

## 8. Scope boundaries

### Included in the mini project

Authentication, profiles, skills, recommendation logic, interest/match workflow, messages, help-feed, comments, basic report/block feature, and an admin view.

### Not included in the first version

Real AI/LLM calls, social-media imports, image verification, payments/credits, push notifications, native mobile application, video calls, and automatic moderation. These features are present or planned in the hackathon product, but are not required to prove a solid Java mini project.

## 9. Feasibility

### Technical feasibility

Spring Boot, Spring Data JPA and PostgreSQL are widely used and have good documentation. The matching algorithm can run in Java without depending on an external AI API.

### Operational feasibility

Students can use the website from a phone or laptop browser. A small initial skill catalogue can be seeded by the team. The workflow is easy to explain during a demonstration.

### Economic feasibility

The project can be developed using free tools: IntelliJ Community or VS Code, Java, PostgreSQL, Maven, GitHub and Docker. Hosting can be done locally for evaluation or on a free/student cloud tier if available.

## 10. Success criteria

The project is successful if a new user can register, add skills, see reasonable recommendations, form a match through mutual interest, exchange messages and create/read a help post in one demo session.

