# Backend Design and API Contract

## 1. Backend responsibility

The Spring Boot backend is the single trusted layer between the web UI and the database. It performs authentication, authorization, validation, recommendation scoring and transactional updates. The browser must never decide whether two users are allowed to message each other; that check belongs on the server.

## 2. Package structure

```text
com.meshconnect
  config/          Security, CORS, OpenAPI configuration
  controller/      REST controllers
  dto/             Request and response objects
  entity/          JPA entities and enums
  repository/      Spring Data repositories
  service/         Business logic
  security/        JWT utilities and authentication filter
  exception/       Global exception handling
```

## 3. Main backend services

| Service | Main responsibility |
|---|---|
| AuthService | Registration, login, password hashing and token generation |
| ProfileService | Profile edits and user skill updates |
| RecommendationService | Candidate filtering, scoring and explanation generation |
| InterestService | Send, accept, decline and cancel interest requests |
| MatchService | Create/list matches and verify participation |
| MessageService | Read/send messages after checking match participation |
| PostService | Create/list posts, comments and mark a solution |
| ModerationService | Report content, block users and expose admin reports |

## 4. REST endpoint summary

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Return JWT token |
| GET | `/api/profile/me` | Student | Get own profile |
| PUT | `/api/profile/me` | Student | Update own profile |
| PUT | `/api/profile/me/skills` | Student | Replace/update selected skills |
| GET | `/api/recommendations` | Student | Get scored collaborator suggestions |
| POST | `/api/interests/{userId}` | Student | Send interest |
| PATCH | `/api/interests/{id}/accept` | Student | Accept received interest and create match |
| PATCH | `/api/interests/{id}/decline` | Student | Decline received interest |
| GET | `/api/matches` | Student | List own matches |
| GET | `/api/matches/{id}/messages` | Participant | Read match messages |
| POST | `/api/matches/{id}/messages` | Participant | Send message |
| GET | `/api/posts` | Student | Paginated feed |
| POST | `/api/posts` | Student | Create help/project post |
| GET | `/api/posts/{id}/comments` | Student | Read comments |
| POST | `/api/posts/{id}/comments` | Student | Add comment |
| PATCH | `/api/posts/{id}/solution/{commentId}` | Author | Mark solution |
| POST | `/api/blocks/{userId}` | Student | Block another user |
| POST | `/api/reports` | Student | Report content |
| GET | `/api/admin/reports` | Admin | Review reports |

## 5. Important DTO examples

### Register request

```json
{
  "username": "aisha_dev",
  "email": "aisha@college.edu",
  "password": "ExamplePassword123",
  "displayName": "Aisha"
}
```

### Recommendation response

```json
{
  "userId": 24,
  "displayName": "Rohan Shah",
  "department": "Computer Engineering",
  "score": 78.5,
  "complementarySkills": ["Java", "PostgreSQL"],
  "sharedSkills": ["Git"],
  "reason": "Rohan is strong in Java and PostgreSQL, which fills your backend gap."
}
```

### Message request

```json
{
  "content": "Hi, I saw that you have UI/UX experience. Want to discuss our project idea?"
}
```

## 6. Recommendation service pseudocode

```text
currentSkills = skills of logged-in user
candidates = active users except current user

for each candidate:
    skip if blocked, already matched, or previous request exists
    candidateSkills = candidate's skills
    complementary = candidate skills where current user has no skill
                     or current user level is below 3
    shared = skills common to both users
    if complementary is empty: skip

    complementScore = weighted count of complementary skills
    sharedScore = min(shared count / 2, 1.0)
    levelScore = average candidate level for complementary skills / 5
    finalScore = 0.60*complementScore + 0.25*sharedScore + 0.15*levelScore
    create explanation using top two complementary skills

return candidates sorted by finalScore descending
```

## 7. Security design

- Password is encoded using `BCryptPasswordEncoder`; it is never stored or logged in plain text.
- Login returns a signed JWT with user ID and role.
- A JWT filter authenticates every protected request.
- Services use the authenticated user ID from the security context, not a user ID sent by the browser.
- Methods such as `sendMessage` call `matchService.assertParticipant(matchId, currentUserId)` before saving data.
- Bean Validation handles basic input rules: `@NotBlank`, `@Email`, length limits and custom checks.
- A global exception handler returns clean error bodies such as `{ "message": "Interest request not found" }`.
- Use `@Transactional` when accepting an interest and creating a match.

## 8. Error response convention

```json
{
  "timestamp": "2026-07-24T10:30:00Z",
  "status": 403,
  "message": "You are not a participant in this match",
  "path": "/api/matches/12/messages"
}
```

## 9. Mapping from the existing app

| Existing Mesh component | Java replacement |
|---|---|
| Flutter screens and Riverpod state | React pages/state or Thymeleaf views |
| Supabase Auth | Spring Security + JWT |
| Supabase Postgres/RLS | PostgreSQL + service authorization + Spring Security |
| Supabase RPC functions | Java service methods/repository queries |
| FastAPI endpoints | Spring Boot controllers/services |
| Python complementarity ranking | `RecommendationService` in Java |
| Groq project pitches | Future enhancement through a separate `AiPitchService` |

