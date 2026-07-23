# Testing, Deployment and Viva Notes

## 1. Testing strategy

We will test the project at three levels:

| Level | What we test | Tool |
|---|---|---|
| Unit test | Score calculation, validation and service rules | JUnit 5 + Mockito |
| Integration test | Controller, security and database interactions | Spring Boot Test + test PostgreSQL/H2 where suitable |
| Manual UI test | Forms, navigation and complete student flow | Browser + Postman |

## 2. Important test cases

| ID | Scenario | Expected result |
|---|---|---|
| TC-01 | Register with valid details | Account and empty profile are created |
| TC-02 | Register with existing email | Request is rejected with a readable error |
| TC-03 | Login with wrong password | Request is rejected; no token is issued |
| TC-04 | Add same skill twice | Duplicate relation is not created |
| TC-05 | Get recommendations | Self, blocked and already-actioned users are excluded |
| TC-06 | Candidate has complementary skill | Candidate receives score and explanation |
| TC-07 | Accept an interest request | One match is created and request status changes |
| TC-08 | Accept same request twice | No duplicate match is created |
| TC-09 | Non-participant reads match messages | API returns 403 Forbidden |
| TC-10 | Matched user sends message | Message is stored with correct sender and time |
| TC-11 | Post author marks solution | Post status updates successfully |
| TC-12 | Other user marks solution | API returns 403 Forbidden |
| TC-13 | Block a user | Blocked user disappears from recommendations |

## 3. Sample test for matching logic

Create test users with known skills:

| User | Skills |
|---|---|
| Aisha | Figma (4), HTML (3), Git (2) |
| Rohan | Java (5), PostgreSQL (4), Git (3) |
| Neha | Figma (4), HTML (4), Canva (3) |

Rohan should rank above Neha for Aisha because Rohan fills the backend/database gap while still sharing Git. Neha is similar to Aisha but provides less complementarity. This is an easy test case to explain in the viva.

## 4. Deployment plan

### Local development

Run PostgreSQL locally or with Docker. Start the Spring Boot API through Maven and start the frontend development server separately.

```text
docker compose up -d db
./mvnw spring-boot:run
npm run dev
```

### Demonstration deployment

For college evaluation, local deployment is enough and safer because it does not depend on internet availability. Keep a backup database seed file and a Postman collection. If online hosting is needed, package the backend as a Docker image, use a managed PostgreSQL instance and configure environment variables on the host.

## 5. Security checklist before submission

- Confirm `.env`, database passwords and JWT secrets are ignored by Git.
- Check that password hashes are not visible in API responses.
- Check that every protected endpoint rejects missing or invalid tokens.
- Check that message endpoints verify match participation.
- Check that a student cannot edit another student's profile or post.
- Check validation errors for blank text, invalid email, long messages and invalid skill levels.
- Do not use real student phone numbers or personal data in screenshots/seed data.

## 6. Limitations to state honestly

- Recommendations are rule-based and depend on self-entered skill levels.
- The first version supports only one-to-one matching.
- Chat may use polling/manual refresh before WebSocket support is added.
- The system is intended for a college-scale dataset, not a public production launch.
- Content reports are reviewed manually by an administrator.

## 7. Viva explanation in simple words

**What problem does the project solve?** It helps students find collaborators based on missing and complementary skills rather than only friend circles.

**Why did you choose Java?** Spring Boot gives us a structured backend for authentication, APIs, business logic and database access. It is suitable for a real multi-user web application.

**How does matching work?** We compare the logged-in user's skills with another user's skills. Skills that the candidate has and the user lacks get the highest weight. A small shared-skill score is added because some common ground helps collaboration.

**How do you stop duplicate matches?** The service sorts the two user IDs before saving and the database has a unique constraint on that pair. The acceptance action is also inside a transaction.

**How is chat protected?** The backend takes the user identity from the JWT. Before reading or sending a message, it verifies that the user belongs to that match.

**What was taken from the hackathon application?** The core idea and data model: skills, complementarity, matching, chat and feed. The original had Flutter, Supabase and Python AI services; our college version converts the core workflow into Spring Boot and PostgreSQL.

## 8. Submission checklist

- Source code with clean README and setup instructions
- Database migration files and seed data
- ER diagram and architecture diagram
- SRS/project proposal
- API list or Postman collection
- Test cases and screenshots
- PPT with problem, solution, stack, diagrams, demo flow and future scope
- Short demo video if required by the department

