# 🎙️ Riverside.fm Clone

A full-stack clone of **Riverside.fm**, built to showcase my expertise in real-time media streaming, session management, and scalable service architecture using **Docker Compose**.

> 🚧 **Note:** Deployment is in progress. The app will be deployed using Docker Compose. The live demo link will be added here once it's ready.

---

## 🧠 Project Purpose

This project demonstrates my ability to build a complex, real-world application with multiple moving parts. It highlights my full-stack skills in:

- Modular architecture  
- WebRTC-based media streaming  
- Session handling with Redis  
- Database management with Prisma ORM  
- Infrastructure automation with Docker  

Inspired by platforms like Riverside.fm, this clone replicates core features and real-time behavior.

---

## ✅ Features (Implemented)

- 🎥 Host a session (Create a studio)  
- 🔗 Generate invite links  
- 🔒 Join a studio via invite link  
- 👋 Graceful session exit  
- 🧠 Real-time media handled via **LiveKit**

---

## 🧰 Tech Stack

### Frontend

- **Next.js (App Router)**  
- **Tailwind CSS**

### Backend

- **Node.js** (Express or custom setup)  
- **Prisma ORM**

### Infra & DevOps

- **PostgreSQL** (via Docker)  
- **Redis** (for session handling)  
- **LiveKit** (for real-time media)  
- **Docker & Docker Compose**

---

## 🐳 Dockerized Setup

This project supports a full Docker Compose setup. No need to edit Dockerfiles inside `apps/web` and `apps/api`.

### 🔧 Environment Setup

In the root of the project, you’ll find example `.env` files:

- `.env.db.eg` → PostgreSQL config  
- `.env.api.eg` → API config  
- `.env.web.eg` → Frontend config  

To get started, copy and rename them:

```bash
cp .env.db.eg .env.db
cp .env.api.eg .env.api
cp .env.web.eg .env.web
```

## ▶️ How to Run
⚠️ Important
Before running any app (web or API), you must initialize the database by running the following from the packages/db folder with redis(with this name) and db(with this name) running manually already running:
```bash
cd packages/db
npx prisma generate
npx prisma migrate dev
```

##▶️ Run Full App (Web + API) via Docker
1. Start the Redis container with name redis
2. Start the PostgreSQL container with name db
3. Build and run the app using Docker Compose:

```bash
docker compose up --build
```


## ▶️ Run Frontend Manually
1. Ensure PostgreSQL container is running with the name db
2. Initialize Prisma (if not already done):
```bash
cd packages/db
npx prisma generate
npx prisma migrate dev
```

3. Start the frontend app:
```bash
cd apps/web
npm install
npm run dev
```

## ▶️ Run Backend Manually
1. Ensure both Redis and PostgreSQL containers are running with names redis and db respectively
2. Initialize Prisma:

```bash
cd packages/db
npx prisma generate
npx prisma migrate dev
```

3. Start the backend API:

```bash
cd apps/api
npm install
npm run dev
```
