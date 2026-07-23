# Mesh Connect - Java Mini Project Documentation

## What this folder is for

This folder contains the planning documents for converting our hackathon app, **Mesh**, into a full-stack Java mini project. The documents are based on the features that already exist in the Flutter/Supabase version, but the proposed Java build is deliberately smaller and easier to demonstrate in a college viva.

The project name used in these documents is **Mesh Connect: Skill-Based Collaboration Platform**. We can change the name later without changing the design.

## Recommended mini-project scope

The first Java version will allow students to:

1. Register and log in.
2. Create a profile and add skills with a proficiency level.
3. View suggested collaborators based on complementary skills.
4. Send an interest request and create a match when both users accept.
5. Chat with matched users.
6. Post a help request or a project idea in a small community feed.

AI pitch generation, GitHub proof, skill crafting, credit economy, push notifications and image moderation are good future enhancements. They should be mentioned in the viva as future scope, not made compulsory for the first submission.

## Documents

| File | Use |
|---|---|
| [01-project-proposal-and-srs.md](01-project-proposal-and-srs.md) | Problem statement, objectives, requirements and scope |
| [02-architecture-and-system-design.md](02-architecture-and-system-design.md) | Architecture, modules, flows and non-functional design |
| [03-data-model-and-database-design.md](03-data-model-and-database-design.md) | ER model, relational schema and data rules |
| [04-backend-design-and-api-contract.md](04-backend-design-and-api-contract.md) | Spring Boot layers, APIs, validation and security |
| [05-tech-stack-and-development-plan.md](05-tech-stack-and-development-plan.md) | Stack decisions, work plan, responsibilities and milestones |
| [06-testing-deployment-and-viva-notes.md](06-testing-deployment-and-viva-notes.md) | Testing plan, deployment notes, limitations and viva preparation |

## Important wording for the report

Write that the current hackathon prototype was researched and analysed by the team. Do not claim that every original feature was rewritten in Java. Our proposed Java project keeps the main problem statement - finding compatible collaborators - and implements it with a conventional Spring Boot and PostgreSQL stack.

