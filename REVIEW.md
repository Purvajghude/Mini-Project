# Review day — Mesh Connect

Everything you need for tomorrow, in the order you will need it.

The submission is the **Java full-stack project in [`server/`](server/)** (Spring Boot API)
plus its React client in [`webapp/`](webapp/). The Flutter code elsewhere in this repo is
the earlier hackathon prototype the idea came from — mention it as prior work if it helps,
but the project being reviewed is the Java one.

---

## 1. Before you leave the house

```bash
cd server && .\mvnw.cmd spring-boot:run
```

Wait for `Started MeshConnectApplication`, open <http://localhost:8080>, and sign in once
to confirm it works. That is the whole setup — no database to start, no Docker, no second
terminal.

Sign-in: **`demo@college.edu`** / **`MeshDemo2026`** (signs you in as Purvaj Ghude)

> If the projector machine is not yours, it needs a JDK 21 and nothing else. Everything
> else (Maven, Node) is fetched by the build.

---

## 2. Five-minute demo script

**① The problem (30 seconds, before you touch anything)**

> "When students look for project partners, they end up asking friends, so teams form by
> social circle. You get five people who all know the same thing. Mesh Connect matches on
> *complementary* skills instead — the person who fills the gap in what you can already do."

**①b The landing page (20 seconds)**

Before signing in, scroll the landing page once. The skills wheel is the real catalogue
the engine scores against, and the pairing under it changes as you scroll — that is the
product's argument in one line.

> "Every skill on here is missing something. That is the whole premise."

**② Discover — the centrepiece (90 seconds)**

Sign in. The **Top picks** deck is a physical pile of cards you can flick through; the
ranked list below it holds the same people in a scannable form. Point at the ranking:

> "I am signed in as a backend student — strong Java, Spring, PostgreSQL, no design or data
> skills. The top two suggestions are a **designer** and a **data scientist**. The bottom
> one is **another Java and Spring developer** — the person most similar to me is ranked
> *last*. That is the whole idea: this is not similarity search."

Click a card, then point at the score breakdown in the right panel:

> "Every suggestion explains itself. The score is four weighted components — how much of my
> gap they fill, whether we share enough common ground to work together, how deep their
> skill actually is, and whether they bring a different discipline entirely."

**③ The match handshake (60 seconds)**

> "Interest is mutual and directed. Two students are waiting on me here."

Click **Accept** → lands in Connections with the conversation open.

> "Accepting created the match and opened a private conversation. Nobody can message anyone
> who has not agreed — and that is enforced in the service layer, not just hidden in the UI."

**④ Prove the backend is real (90 seconds)**

Open <http://localhost:8080/swagger-ui.html>:

> "The whole REST API is documented and executable from the browser. Twenty-five endpoints
> across authentication, profiles, recommendations, interests, matches, messaging, the help
> board, and moderation."

Then in a second terminal:

```bash
cd server && .\mvnw.cmd test
```

> "Twenty-five tests. The integration tests mock nothing — real HTTP, real security filter
> chain, real Flyway migrations against a real database."

**⑤ Close (20 seconds)**

> "One command, one artifact: the React client is built into the Spring Boot jar and served
> from the same port, so there is no CORS setup and nothing to configure to run it."

---

## 3. Questions you will probably get

**"Why Spring Boot and not plain servlets/JSP?"**
Dependency injection gives testable layers; Spring Security gives a filter chain I would
otherwise write badly; Spring Data removes DAO boilerplate; and it packages to a single
runnable jar. The trade-off is a heavier framework — justified here because the project is
genuinely multi-layered.

**"Walk me through what happens when you log in."**
`AuthController` validates the request → `AuthService` looks the user up by email and
verifies the password with BCrypt → `JwtService` signs an HS384 token carrying the user id
and role → the client stores it and sends it as a bearer header → `JwtAuthenticationFilter`
parses it on each request and populates the `SecurityContext` → `CurrentUserService` reads
the authenticated identity in the service layer.

**"How does the recommendation actually work?"** → `ComplementarityScorer.java`. Four
weighted components: gap fill 45%, shared ground 20%, depth 20%, category reach 15%. Gap
fill uses `1 - e^(-raw/1.5)` so it saturates smoothly instead of clipping — an earlier
version clamped, and every candidate with two or more relevant skills came out identical.

**"Why is that class separate from the service?"**
Because it holds no repositories. It is a pure function over loaded data, so the ranking
rules can be unit-tested without a database — that is the 10-test `ComplementarityScorerTest`.

**"Is this secure?"**
Passwords BCrypt-hashed; stateless JWT; API closed by default with public routes listed
explicitly; per-resource authorization (a non-member of a conversation gets 403, tested);
identical responses for wrong password and unknown email; secrets read from the environment
in production.

**"What about SQL injection / N+1 queries?"**
All data access goes through JPA with bound parameters — no string-concatenated SQL.
Associations are `LAZY` with `@EntityGraph` on the queries that need them, candidate skills
are loaded in one batched query rather than per candidate, and the match list fetches only
the newest message per conversation instead of the entire history.

**"Can it use a real database?"**
Yes — `SPRING_PROFILES_ACTIVE=prod` switches to PostgreSQL. The migrations are portable
ANSI SQL, so the *same* files build both. Hibernate runs `ddl-auto: validate`, so the
mapping is checked against the migrated schema at startup instead of being auto-generated.

**"What would you do next?"**
Search across students, WebSocket messaging instead of fetch-on-open, notifications, and
moving skills to a taxonomy with synonyms so "JS" and "JavaScript" score as one skill.

---

## 4. Numbers, if asked

| | |
|---|---|
| Java source files | 65 (plus 2 test classes) |
| REST endpoints | 25 |
| Database tables | 11 |
| Tests | 25, all passing |
| Java version | 21 (LTS) |
| Spring Boot | 3.4.5 |

---

## 5. If something breaks live

| Symptom | Fix |
|---|---|
| Port 8080 already in use | Close the other process, or `SERVER_PORT=8081 .\mvnw.cmd spring-boot:run` |
| Page loads but sign-in fails | The API is up but the seed did not run — restart; the in-memory database rebuilds from scratch every time |
| Build tries to download Node and there is no Wi-Fi | `.\mvnw.cmd spring-boot:run -P '!with-frontend'` runs the API alone; Swagger UI still demonstrates the whole backend |
| Everything is on fire | The packaged jar is already built: `java -jar server/target/mesh-connect-api-1.0.0.jar` |

**Have a backup.** Copy `server/target/mesh-connect-api-1.0.0.jar` to a USB stick tonight.
It runs anywhere with a JDK 21 and needs no build step at all.
