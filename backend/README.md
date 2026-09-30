# MESH API

Java 21 / Spring Boot modular-monolith backend. Its public HTTP contract is maintained in [`../contracts/openapi.yaml`](../contracts/openapi.yaml).

## Local setup

1. Install Java 21, Maven 3.9+, and PostgreSQL 16+.
2. Create a local PostgreSQL database and least-privilege user, or create a Supabase project. For Supabase, use the JDBC details from **Connect**. Spring Data JPA must use the direct connection or Session Pooler, never the Transaction Pooler. MESH uses Supabase as managed PostgreSQL, not the Supabase Data API: keep the Data API disabled for these application tables unless you later add RLS policies deliberately.
3. Copy `.env.example` to a shell-specific local environment file. Set all four `MESH_DATABASE_*` values and `MESH_JWT_SECRET`. The JWT value must be a Base64-encoded random value of at least 32 bytes; it is never committed.
4. From this directory run `mvn spring-boot:run`.

For browser access, `MESH_ALLOWED_ORIGINS` defaults to `http://localhost:5173`. Set it to a comma-separated list of exact frontend origins at deployment time, for example `https://mesh.example.com`. Do not use `*`; MESH accepts bearer tokens in an `Authorization` header.

Flyway creates the schema and reference catalogues at startup. Catalogue rows are product reference data, not student demo data. No demo student accounts are inserted automatically.

Supabase initializes `public` with platform-owned objects, so MESH baselines Flyway at version `0` and then applies its own migrations `V1` through `V8`. This does not baseline or skip any MESH table creation.

For deployment health checks, use `GET /api/v1/actuator/health`. It is public and reports application/database readiness without exposing management details.

For Supabase, the database URL must use SSL. A typical Session Pooler configuration is:

```text
MESH_DATABASE_URL=jdbc:postgresql://[pooler-host]:5432/postgres?sslmode=require
MESH_DATABASE_USERNAME=postgres.[project-ref]
MESH_DATABASE_PASSWORD=[database-password]
```

Take the exact host and username from Supabase's **Connect → JDBC** panel; do not construct them manually.

### MESH Supabase quick start

This MESH project uses an IPv4-only network, so its direct database hostname cannot resolve locally. Use the Supabase **Session Pooler** (not the Transaction Pooler) and run the included helper:

```powershell
cd "C:\Users\Rover\Documents\Github\Mini Project\backend"
.\run-local.ps1
```

The helper supplies MESH's Session Pooler host and username, securely prompts for the database password only if it is not already set for that PowerShell session, and starts the built JAR. It generates a temporary JWT secret if one is absent; set `MESH_JWT_SECRET` yourself when you want logins to remain valid across restarts. It does not write any credentials to disk.

### Optional GitHub public-evidence setup

GitHub connection is optional. To enable it, create a GitHub **OAuth App** and set the `GITHUB_*` values in your local environment (see `.env.example`). For local development, set the OAuth callback URL to:

```text
http://localhost:8080/api/v1/github/callback
```

MESH requests **no GitHub scopes** and uses PKCE. After the student explicitly authorizes the redirect, the API reads only their owned public repositories and language metadata, then discards the access token. It does not collect private repositories, does not store GitHub access tokens, and never scrapes LinkedIn. A GitHub-language match supports a self-declared skill; it does not prove expertise.

## Feature layout

Implemented feature areas:

- `auth`: email/password registration, BCrypt password hashing, signed JWTs, stateless Spring Security.
- `profiles` and `skills`: student profile, self-declared skills, goals, interests, desired collaborator skills, domains, and weekly availability.
- `recommendations`: deterministic scoring and same-domain/adjacent-domain Discover allocation.
- `connections`: pass, save, block, connection requests, and established connections. A block also hides the connection and prevents direct messages until removed.
- `projects`, `messages`, and `tasks`: project groups, owner-controlled membership and ownership transfer, persistent group messages, and shared tasks.
- `calendar`: member-managed project events and availability polls that an owner can close and schedule.
- `github`: explicit OAuth authorization with PKCE, public-repository language evidence, evidence deletion on disconnect, and explainable evidence support in profiles and recommendations.
- `discord`: explicit Discord identity linking with PKCE and owner-created private project text rooms. The bot token stays server-side; a room is created only after each project member has linked Discord.

## Discord project rooms

MESH does not embed Discord's chat UI. Instead, it links each student's Discord identity, then the project owner can create a Discord text channel from MESH. The API denies the server-wide role and grants the channel only to linked project members. Configure `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, and `DISCORD_GUILD_ID` as documented in [`.env.example`](.env.example). The bot needs permission to manage channels, create invites, view channels, and send messages.

GitHub endpoints are implemented but `POST /github/authorization-url` intentionally returns `503` until `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are provided.

## Verification

Run:

```text
mvn test
npx --yes @redocly/cli lint ../contracts/openapi.yaml
```

The unit tests cover recommendation weights, Discover allocation, and PKCE challenge generation. Full Flyway/JPA endpoint verification requires a running PostgreSQL or Supabase database and GitHub flow verification requires an OAuth App configured with the callback URL above.
