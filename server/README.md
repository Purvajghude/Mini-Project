# Mesh Connect

A full-stack Java web application that connects college students by **complementary
skills** rather than by popularity. Instead of recommending people like you, it looks for
people who fill the gaps in what you can already do, explains why, and turns a mutual
signal of interest into a private project conversation.

**Stack:** Java 21 · Spring Boot 3.4 · Spring Security (JWT) · Spring Data JPA · Flyway ·
H2 / PostgreSQL · React 19 (Vite) · Maven

---

## Run it

You need a **JDK 21** and nothing else. No database to install, no Docker, no Node — the
Maven wrapper fetches Maven, and the build fetches Node for the frontend automatically.

```bash
cd server && ./mvnw spring-boot:run
```

On Windows PowerShell:

```bash
cd server; .\mvnw.cmd spring-boot:run
```

Then open **http://localhost:8080** and sign in:

| Field | Value |
|---|---|
| Email | `demo@college.edu` (Purvaj Ghude) |
| Password | `MeshDemo2026` |

Every seeded account uses the same password. `admin@college.edu` has the `ADMIN` role.

| What | Where |
|---|---|
| Web application | http://localhost:8080 |
| API documentation (Swagger UI) | http://localhost:8080/swagger-ui.html |
| OpenAPI schema | http://localhost:8080/v3/api-docs |
| Health check | http://localhost:8080/actuator/health |
| Database console (dev only) | http://localhost:8080/h2-console |

Run the tests:

```bash
cd server && ./mvnw test
```

---

## Architecture

```
                    ┌──────────────────────────────────────────┐
   Browser  ───────▶│  Spring Boot application (port 8080)     │
                    │                                          │
                    │  ┌────────────────────────────────────┐  │
                    │  │ Static resources: React SPA        │  │
                    │  │ (built by Vite into the jar)       │  │
                    │  └────────────────────────────────────┘  │
                    │                                          │
                    │  ┌────────────────────────────────────┐  │
                    │  │ JwtAuthenticationFilter            │  │
                    │  │   ↓                                │  │
                    │  │ @RestController   /api/v1/**       │  │
                    │  │   ↓                                │  │
                    │  │ @Service          business rules   │  │
                    │  │   ↓                                │  │
                    │  │ @Repository       Spring Data JPA  │  │
                    │  └────────────────────────────────────┘  │
                    │                    ↓                     │
                    │            Flyway migrations             │
                    └────────────────────┬─────────────────────┘
                                         ↓
                          H2 (dev)  ·  PostgreSQL (prod)
```

The React client and the API ship as **one artifact on one port**. The client calls
relative `/api/v1` paths, so there is no CORS configuration and no environment variable to
set for the packaged build.

### Layering

Each layer only talks to the one below it:

| Package | Responsibility |
|---|---|
| `controller` | HTTP shape only: routes, status codes, request validation |
| `service` | Business rules and transaction boundaries |
| `repository` | Spring Data JPA interfaces |
| `entity` | JPA-mapped domain model |
| `dto` | Request and response records; entities are never serialised directly |
| `security` | JWT issuing, the authentication filter, and the filter chain |
| `exception` | Typed exceptions and one global handler producing a single error shape |
| `config` | OpenAPI, SPA route forwarding, development data seeding |

---

## The recommendation engine

This is the part of the project worth reading first: `service/ComplementarityScorer.java`.

The naive approach to "who should I work with?" is similarity search, which returns your
own duplicate — the least useful person to build with. This scores the opposite question:
**can the two of us build something neither of us could alone?**

Four components, each normalised to 0–1, combined with fixed weights:

| Component | Weight | What it measures |
|---|---|---|
| Gap fill | 45% | How much of what you lack they bring, weighted by their proficiency and by how large the gap is |
| Shared ground | 20% | Enough overlap to communicate; peaks at two shared skills, because more overlap past that is redundancy, not value |
| Depth | 20% | How strong they actually are in the skills that fill your gaps |
| Category reach | 15% | Whether they bring a *different discipline* (design, data, management) rather than more of the same |

Gap fill saturates smoothly (`1 - e^(-raw/1.5)`) instead of being clipped. An earlier
version divided and clamped, which flattened everyone with two or more relevant skills to
an identical score; the exponential keeps a usable gradient across a real cohort.

**You can see this working in the seeded data.** Signed in as the demo student (strong
Java/Spring, no design or data skills), Discover ranks:

```
64.0  Divya Kokane   Brings Figma and UI/UX Design - design work that is missing
                     from your current skill set.
64.0  Pooja Ghule    Strong in Data Analysis and Python, which fills a gap in your
                     current skill set.
...
51.8  Parth Patil    Brings Docker, and you already share Spring Boot and PostgreSQL.
```

Parth Patil is another Java/Spring developer — the student most *similar* to the demo account,
and the one the engine ranks **last**. That inversion is the entire thesis of the product.

Every card also carries a plain-English reason and an inspectable score breakdown, because
a score without a reason is not actionable.

Scoring is a pure function over already-loaded data with no repository access, which is
why it can be unit-tested directly (`ComplementarityScorerTest`, 10 tests, no database).

---

## Data model

11 tables, created by Flyway migration `V1__initial_schema.sql`.

```
app_users ──1:1── profiles
    │
    ├──< user_skills >── skills
    │
    ├──< interests >──┐      (directed: sender → receiver)
    │                 │
    ├──< matches >────┘      (undirected pair, stored canonically)
    │        │
    │        └──< messages
    │
    ├──< posts ──< comments
    │        └──── solved_comment_id ──> comments
    │
    ├──< blocks
    └──< reports
```

Two constraints worth pointing at in a review:

- **`ck_matches_canonical_pair`** — members are stored with `user_one_id < user_two_id`, so
  an unordered pair has exactly one possible row. A duplicate or reversed match is
  impossible *in the database*, not merely avoided by careful application code.
- **`uq_interest_direction`** — one row per direction, which is what makes the mutual
  handshake well-defined.

The migrations are written in portable ANSI SQL (identity columns,
`timestamp with time zone`), so the **same migration files** build both the embedded H2
development database and PostgreSQL in production. Hibernate runs with
`ddl-auto: validate`, so the entity mapping is verified against the migrated schema on
every startup rather than being silently generated.

---

## API

All routes are prefixed `/api/v1`. Everything except register and login requires
`Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Exchange credentials for a JWT |
| `GET` | `/profile/me` | The signed-in student's profile |
| `PUT` | `/profile/me` | Update profile details |
| `PUT` | `/profile/me/skills` | Replace the skill set |
| `GET` | `/profiles/{userId}` | Another student's public profile |
| `GET` | `/skills` | The skill catalogue |
| `GET` | `/recommendations?limit=` | Ranked complementary students, with reasons |
| `POST` | `/interests/{userId}` | Send interest; returns `matchId` if this completes a handshake |
| `GET` | `/interests/incoming` | Requests waiting on you |
| `GET` | `/interests/sent` | Requests you have sent |
| `PATCH` | `/interests/{id}/accept` | Accept, creating the match |
| `PATCH` | `/interests/{id}/decline` | Decline |
| `GET` | `/matches` | Your connections with a conversation preview |
| `GET` | `/matches/{id}/messages` | Read a conversation (also marks it read) |
| `POST` | `/matches/{id}/messages` | Send a message |
| `GET` | `/posts?page=&size=` | The help board, paged |
| `POST` | `/posts` | Publish an ask, project or showcase |
| `GET` | `/posts/{id}/comments` | Answers on a post |
| `POST` | `/posts/{id}/comments` | Answer a post |
| `PATCH` | `/posts/{id}/solution/{commentId}` | Author marks the accepted answer |
| `POST` | `/blocks/{userId}` · `DELETE` | Block / unblock |
| `POST` | `/reports` | Report content |
| `GET` | `/admin/reports` | Moderation queue (`ADMIN` only) |

---

## Security

- **Passwords** are hashed with BCrypt and never leave the server; a test asserts the hash
  is absent from responses.
- **Stateless JWT** (HS384, 8-hour expiry). No server session, so nothing to hijack.
- **Closed by default** — `anyRequest().authenticated()`; public routes are listed
  explicitly rather than the reverse.
- **Authorization is enforced per resource, not per route.** Being authenticated is not
  enough: `MatchService.requireParticipant` rejects any non-member of a conversation, and
  only a post's author can mark its solution. Tests cover both.
- **Errors say nothing useful to an attacker.** A wrong password and an unknown email
  return the same response; unexpected exceptions are logged in full server-side and
  returned as a generic message.
- **CSRF is disabled deliberately** and safely: the API is stateless and authenticates from
  an `Authorization` header, which a browser will not attach cross-site the way it attaches
  a session cookie.
- **No credentials in source control.** The prod profile reads every secret from the
  environment; the development JWT key is a throwaway and is documented as such.

---

## Testing

25 tests, all passing.

```
ComplementarityScorerTest  10 tests   ranking rules, no database
ApiIntegrationTest         15 tests   real HTTP, real security chain, real migrations
```

The integration tests mock nothing. They drive the application through `MockMvc` against
an H2 database built by the production Flyway migrations, so a passing run means the
wiring actually holds together. They cover the mutual-interest handshake end to end,
rejection of duplicate and self-directed interest, a non-participant being refused access
to a conversation (403), role-protected admin routes, and structured validation errors.

---

## Configuration

Profiles are selected with `SPRING_PROFILES_ACTIVE`.

| Profile | Database | Demo data | Use |
|---|---|---|---|
| `dev` *(default)* | H2 in-memory | seeded | Local development and the demo |
| `test` | H2, isolated | off | Automated tests |
| `prod` | PostgreSQL | off | Deployment |

Production expects `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` (base64, ≥32 bytes) and
optionally `DB_HOST`, `DB_PORT`, `DB_NAME`, `FRONTEND_ORIGIN`.

```bash
SPRING_PROFILES_ACTIVE=prod DB_USER=... DB_PASSWORD=... JWT_SECRET=... \
  java -jar target/mesh-connect-api-1.0.0.jar
```

## Build

```bash
./mvnw clean package          # builds the React client and packages one runnable jar
./mvnw clean package -P '!with-frontend'   # API only, skips the Node toolchain
java -jar target/mesh-connect-api-1.0.0.jar
```

The `with-frontend` profile (active by default) downloads a pinned Node version, runs
`npm ci`-equivalent install and `vite build` in `../webapp`, and copies the output into the
jar's static resources.

## Frontend development

For hot reload, run the API and the Vite dev server side by side. The Vite proxy forwards
`/api` to port 8080, so the client code is identical in both modes.

```bash
cd webapp && npm run dev      # http://localhost:5173
```
