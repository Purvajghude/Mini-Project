# MESH live-demo runbook

This project is ready to be deployed as a React frontend, a Spring Boot API, and a managed PostgreSQL database. The browser mock mode is useful for design work, but two demo accounts need the API and database below.

## 1. Create the shared database

Create a Supabase project and open **Connect → JDBC**. Use the Session Pooler JDBC URL, username, and database password. The Spring API uses JPA/Flyway over JDBC; do not put a Supabase service-role key in the web application.

Set these backend variables:

```text
MESH_DATABASE_URL=jdbc:postgresql://[Supabase Session Pooler host]:5432/postgres?sslmode=require
MESH_DATABASE_USERNAME=[Supabase Session Pooler username]
MESH_DATABASE_PASSWORD=[Supabase database password]
MESH_JWT_SECRET=[a Base64-encoded random value of at least 32 bytes]
```

The API runs Flyway migrations on startup, including GitHub evidence and Discord room mappings.

## 2. Deploy the API

Create a Render Blueprint from this repository. It reads [`render.yaml`](../render.yaml) and runs the Spring API from `/backend`.

After the service receives its public URL, for example `https://mesh-api.onrender.com`, set:

```text
MESH_ALLOWED_ORIGINS=https://[your-vercel-project].vercel.app
GITHUB_REDIRECT_URI=https://mesh-api.onrender.com/api/v1/github/callback
DISCORD_REDIRECT_URI=https://mesh-api.onrender.com/api/v1/discord/callback
```

Use `https://mesh-api.onrender.com/api/v1/actuator/health` as the health check.

## 3. Deploy the frontend

Import the repository into Vercel. Vercel reads [`vercel.json`](../vercel.json) and serves the Vite single-page app.

Set this build-time frontend variable before deploying:

```text
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://mesh-api.onrender.com/api/v1
```

Redeploy after changing the backend URL. The frontend URL must then be copied back into `MESH_ALLOWED_ORIGINS` and the OAuth success/error redirects.

## 4. Configure GitHub evidence

Create a GitHub OAuth App. Set its callback to the deployed `GITHUB_REDIRECT_URI`, then add:

```text
GITHUB_CLIENT_ID=[OAuth app client ID]
GITHUB_CLIENT_SECRET=[OAuth app client secret]
GITHUB_SUCCESS_REDIRECT_URI=https://[your-vercel-project].vercel.app/settings?github=connected
GITHUB_ERROR_REDIRECT_URI=https://[your-vercel-project].vercel.app/settings?github=error
```

MESH uses PKCE and only requests public owned repository metadata. It never persists GitHub access tokens.

## 5. Configure the Discord project-room bot

1. Create a Discord application and bot in the Developer Portal.
2. Enable the bot, then invite it into the MESH Discord server with **Manage Channels**, **Manage Roles**, **Create Instant Invite**, **Send Messages**, and **View Channels** permissions.
3. Copy the server ID with Discord Developer Mode enabled. Optionally create a `Project rooms` category and copy its ID.
4. Add `https://mesh-api.onrender.com/api/v1/discord/callback` as an OAuth redirect in the Discord application.
5. Add these server-only variables:

```text
DISCORD_CLIENT_ID=[Discord application ID]
DISCORD_CLIENT_SECRET=[Discord application secret]
DISCORD_BOT_TOKEN=[Discord bot token]
DISCORD_GUILD_ID=[MESH server ID]
DISCORD_CATEGORY_ID=[optional Project rooms category ID]
DISCORD_SUCCESS_REDIRECT_URI=https://[your-vercel-project].vercel.app/settings?discord=connected
DISCORD_ERROR_REDIRECT_URI=https://[your-vercel-project].vercel.app/settings?discord=error
```

Each project member links Discord with the `identify` scope. The owner then creates or syncs the room. The API creates a channel, denies the server-wide role, and grants View Channel, Send Messages, and Read Message History only to linked project members.

## 6. Presentation script

1. Register your account and your friend’s account on separate devices.
2. Each person adds skills and connects a GitHub account.
3. Open Discover and explain the visible recommendation signals.
4. Send and accept a connection request.
5. Create a project and add the accepted connection as a member.
6. Both members link Discord, then the owner creates the private project room.
7. Open the room through MESH and send a message in Discord.

LinkedIn should remain a voluntary profile URL and submitted certificate field for the demo. Do not describe it as scraped or independently verified.
