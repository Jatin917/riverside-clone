# 🎙️ Riverside.fm Clone

A full-stack clone of [Riverside.fm](https://riverside.fm) built to showcase my developer skills in real-time media streaming, session management, and scalable service architecture using Docker Compose.

> 🚧 **Note**: Deployment is in progress. The app will be deployed via Docker Compose, and the live link will be added here once it's ready.

---

## 🧠 Project Purpose

This clone project is designed to demonstrate my ability to build a complex, real-world application with multiple moving parts. It reflects my skills in full-stack development, WebRTC, Docker, and modular architecture — mimicking platforms like Riverside.fm.

---

## ✅ Features (Implemented So Far)

- 🎥 Create a studio (host a session)
- 🔗 Generate a link to invite others
- 🔒 Join a studio using an invite link
- 👋 Leave session gracefully
- 🧠 Backend logic with Livekit for real-time media

---

## 🧰 Tech Stack

**Frontend**
- Next.js (App Router)
- Tailwind CSS

**Backend**
- Node.js (Express or custom setup)
- Prisma ORM

**Infra & Tools**
- PostgreSQL (via Docker)
- Redis (for session handling)
- Docker & Docker Compose
- LiveKit setup (for real-time media)

---

## 🐳 Dockerized Setup

This project is built with Docker Compose support. No need to modify the Dockerfiles inside `apps/web` and `apps/api`.

### 🔐 Environment Variables

You’ll find the following example env files in the root of the project:

- `.env.db.eg` → DB credentials
- `.env.api.eg` → API environment config
- `.env.web.eg` → Web/Frontend config

To get started, copy and rename them:

```bash
cp .env.db.eg .env.db
cp .env.api.eg .env.api
cp .env.web.eg .env.web
