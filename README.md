# Wanderly

A full-stack travel booking platform (React 19 + Node/Express + MongoDB), built as a placement portfolio project.

## Stack

Frontend: React 19, Vite, React Router, Redux Toolkit, Tailwind CSS, Axios, Framer Motion
Backend: Node.js, Express, MongoDB Atlas (Mongoose)
Auth: JWT access + refresh tokens, RBAC, bcrypt
Payments: Stripe · Images: Cloudinary
Testing: Jest + Supertest

## Getting started

```bash
npm install                       # root tooling (husky, lint-staged, commitlint)
cd frontend && npm install
cd ../backend && npm install
cp backend/.env.example backend/.env   # fill in your own MONGO_URI
```

From the root:

```bash
npm run dev          # runs frontend (5173) and backend (5000) together
npm run lint          # lints both apps
npm run test:server   # backend Jest + Supertest suite
```

## Structure

```
frontend/   React 19 + Vite SPA
backend/    Node + Express API
```

See `frontend/src/*` and `backend/src/*` for the module layout — each domain (auth, listings, bookings, payments, reviews) gets its own folder on both sides.

## Commit convention

Commits are linted via commitlint (Conventional Commits): `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`, `ci:`, `style:`, `revert:`.
