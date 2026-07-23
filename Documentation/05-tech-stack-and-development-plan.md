# Technology Stack and Development Plan

## 1. Recommended stack

| Area | Technology | Why we selected it |
|---|---|---|
| Backend | Java 21, Spring Boot 3 | Required Java full-stack focus; mature ecosystem |
| REST API | Spring Web | Simple controller-based API development |
| Security | Spring Security + JWT | Secure login and role protection |
| Persistence | Spring Data JPA / Hibernate | Entity mapping and repository support |
| Database | PostgreSQL 16 | Reliable relational database with strong constraints |
| DB migration | Flyway | Database versions stay inside Git |
| Frontend | React + Vite + Bootstrap | Quick responsive screens and clean API separation |
| Testing | JUnit 5, Mockito, Spring Boot Test | Unit and integration testing |
| API testing | Postman | Easy demonstration and manual API testing |
| Build | Maven | Standard Java dependency/build tool |
| Deployment | Docker Compose | Reproducible local setup |

If the department specifically wants Java-only UI, replace React with Thymeleaf and Bootstrap. We should make this decision with the guide before starting frontend work.

## 2. Why this is a full-stack Java project

The central business logic, authentication, REST endpoints, validation, data access and matching algorithm are written in Java. PostgreSQL stores relational data. The frontend consumes Java APIs. This is not simply a static website with a Java login page; the main application workflow is implemented in Spring Boot.

## 3. Development phases

| Week | Deliverable | Main tasks |
|---|---|---|
| 1 | Foundation | Create repo structure, database, Flyway migrations, Spring Boot setup, basic UI shell |
| 2 | Accounts and profile | Registration, login, JWT, profile edit, skills catalogue and user skills |
| 3 | Core matching | Recommendation algorithm, interest request flow, match creation and test data |
| 4 | Collaboration features | Match list, messages, help-feed and comments |
| 5 | Quality and submission | Security checks, tests, screenshots, report, PPT and demo rehearsal |

## 4. Suggested team division

| Member area | Tasks |
|---|---|
| Backend member 1 | Authentication, Spring Security, user/profile/skill modules |
| Backend member 2 | Recommendation, interest/match/message modules, database queries |
| Frontend member | Screens, forms, API calls, responsive design |
| Documentation and testing member | ER diagram, test cases, Postman collection, report, PPT and integration checks |

For a smaller team, one person can take both backend areas and rotate testing/documentation work. Everyone should understand the complete flow before the viva.

## 5. Git workflow

```text
main
  feature/auth-profile
  feature/recommendations
  feature/match-chat
  feature/feed
  docs/report
```

Each feature branch should be merged only after it runs locally. Commit messages should describe the work, for example `feat: create mutual match on interest acceptance` rather than `changes`.

## 6. Development conventions

- Use camelCase for Java variables and methods, PascalCase for classes.
- Keep request/response DTOs separate from JPA entities.
- Do not place business rules inside controllers.
- Add JavaDoc only for public classes or non-obvious algorithms; avoid writing comments that repeat the code.
- Make every schema change through a Flyway migration.
- Store secrets in `.env`/environment variables and include only an `.env.example` file in Git.

## 7. Minimum viable demo

The demo does not need every screen to be perfect. It must show one complete story:

1. Log in as Student A.
2. Show Student A's skills and recommendation list.
3. Explain why Student B is recommended.
4. Send or accept interest using a prepared second account.
5. Open the new match and send a message.
6. Open the help-feed and show a post with a comment/solution.

## 8. Future enhancement plan

After the basic project is complete, we can add WebSocket chat, email verification, profile images, GitHub skill import, AI-generated project pitches, recommendation feedback, notifications and admin analytics. This directly connects the Java project back to the larger hackathon vision.

