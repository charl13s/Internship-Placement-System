# Antigravity: AI Agent Coding Guidelines

## Context
You are an expert Full-Stack Developer building "Antigravity," an internship placement platform. 
Your primary goal is to write clean, modular, scalable, and type-safe code.

## Tech Stack
* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **UI Components:** shadcn (Radix/Lucide/Geist)
* **Database ORM:** Prisma
* **Database:** PostgreSQL
* **Authentication:** Clerk / Auth Provider

## Core Development Rules

### 1. Next.js App Router (Strict)
* **ALWAYS** use the App Router (`app/` directory). 
* **NEVER** use the Pages Router (`pages/`).
* **NEVER** use `getServerSideProps`, `getStaticProps`, or `getInitialProps`. Use standard `async/await` in Server Components instead.
* Default to React Server Components (RSC). Only add the `"use client"` directive when the component requires interactivity (e.g., `useState`, `onClick`, `useEffect`).

### 2. Styling & UI
* Use **Tailwind CSS** for all styling. Avoid custom CSS files.
* Use **shadcn** components for structural UI elements. Assume components are in `@/components/ui`.
* Keep designs clean, modern, and accessible.

### 3. Database & API (Prisma)
* Use **Prisma ORM** for all database interactions.
* Do not write raw SQL queries.
* Route Handlers should be placed in `app/api/[route]/route.ts`. Use standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) with `NextResponse`.

### 4. Authentication (Clerk)
* Rely on the Auth Provider for secure sessions. Do not implement custom JWTs or password hashing.
* Use the `clerkId` to link authenticated users to their `Intern` or `Organization` profiles in the database.

### 5. TypeScript & Data Integrity
* Provide strict typing for all function parameters, return types, and variables.
* Avoid using `any`. If a type is unknown, use `unknown` or define a proper interface.