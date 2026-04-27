# AI Learning Platform - Codebase & Feature Analysis

This document provides a comprehensive analysis of the **AI Learning Platform**, detailing the technology stack, system architecture, and all core features currently implemented in the project. It is intended to be shared with stakeholders, developers, and users to provide a clear understanding of the platform's capabilities.

## 1. Technology Stack

The platform is built using a modern, scalable JavaScript/TypeScript stack, structurally resembling a highly advanced MERN/Next.js stack.

### Frontend Architecture
- **Framework**: Next.js (Version 16.1.1) utilizing the modern App Router (`src/app/`).
- **UI Library**: React (Version 19.2.3).
- **Styling**: Tailwind CSS v4 for utility-first, highly responsive, and customizable styling.
- **Icons**: Lucide React for clean, consistent iconography.
- **State & Data Management**: `@tanstack/react-query` for robust server-state management, caching, and data fetching. Native React Context API (e.g., `AuthContext`, `NotificationContext`).
- **Authentication Handling**: `jwt-decode` for client-side token parsing.

### Backend Architecture
- **Environment**: Node.js.
- **Framework**: Express.js (Version 5.2.1) for creating highly extensible RESTful APIs.
- **Database Engine**: MongoDB via `mongoose` (Version 9.1.1) for flexible, document-based data modeling.
- **Security & Optimization**: `cors`, `bcryptjs` for password hashing, and `jsonwebtoken` for secure JWT-based stateless authentication.
- **AI Integrations**: Native SDKs for leading AI providers:
  - `@google/generative-ai` (Google Gemini)
  - `openai` (OpenAI GPT models)
  - `groq-sdk` (Groq for ultra-fast inference)
  - `bytez.js`

## 2. Platform Architecture & Data Flow

The platform follows a decoupled client-server architecture:
- **Client (Frontend)**: Handles all user interactions, UI rendering, and routing. It communicates securely with the backend via REST endpoints.
- **Server (Backend)**: Orchestrates business logic, manages database transactions, and acts as a bridge to external AI models (OpenAI, Gemini, Groq). Large payloads (up to 10mb) are supported to handle complex data like Base64 files or intensive AI prompts.
- **Database**: Stores all system assets—user profiles, learner metrics, missions, and progress statistics.

## 3. Comprehensive Feature Set

The platform is packed with innovative, AI-driven educational and personal growth features.

### Core Foundation
- **Authentication & User Management**: Secure JWT login, registration, and user session handling (`/api/auth`, `/api/user`).
- **Dashboard**: Centralized hub offering users a high-level view of their learning progress, momentum, and active tasks.

### AI & Intelligence Systems
- **AI Tools & Intelligence** (`/api/ai`, `/api/tools`): A suite of dynamic AI utilities accessible by the user for enhanced learning, problem-solving, and content generation.
- **Cognitive Companion** (`/api/companion`): A virtual AI companion that provides customized learning assistance, guidance, and interacts securely with the user context.
- **Cognitive Guardian System** (`/api/guardian`): An algorithmic overwatch system designed to protect, guide, and ensure a healthy, on-track learning environment for users.

### Learning & Progression
- **Learning Missions System** (`/api/missions`): A gamified, structured path where learning objectives are broken down into actionable "missions". Includes tracking of user progress within these missions.
- **Momentum Tracking** (`/api/momentum`): An advanced progress tracking algorithm that calculates "momentum" (consistency, speed, and success rate) to keep learners motivated and engaged.
- **Personal Knowledge Genome (PKG)** (`/api/pkg`): A cutting-edge concept that maps exactly what a user knows. It builds a mathematical/graphical representation of the learner's brain within the platform, tying closely with customized learning paths.
- **YouTube Integration** (`/api/youtube`): Allows fetching, parsing, and perhaps interacting with educational YouTube content directly within the platform.

### Skill Assessment
- **Skill Analysis** (`/api/skill-analysis`): AI-driven evaluation of a user's current skill sets based on tests, project work, and mission completion.
- **Skill Health** (`/api/skill-health`): A diagnostic tool providing insights into the "health" of a user's skills (e.g., are they out of practice? are they mastering it?).

### Professional & Career Tools
- **Public Portfolio Bridge** (`/api/portfolio`): Allows users to generate, manage, and showcase a dynamic, public-facing portfolio based on their platform achievements, PKG, and skills.
- **AI Resume Builder Orchestrator** (`/api/ai-resume`): Automatically structures, writes, and optimizes professional resumes tailored to specific roles by leveraging the user's data and advanced AI generation.

### Wellbeing & Growth
- Dedicated modules for **Personalization** (`/api/personalization`), **Growth**, and **Wellbeing**, ensuring the platform adapts not just to what a user wants to learn, but how they learn best and how they are feeling, promoting sustainable education output.

---

### Summary
The platform is a highly advanced, next-generation Learning Management System (LMS). It transcends traditional video-and-quiz platforms by implementing concepts like a *Personal Knowledge Genome*, *Cognitive Guardians*, and *Skill Health*. Powered by cutting-edge Next.js architecture on the front and a robust, multi-LLM integrated Node/Express backend, it is fully equipped to provide a deeply personalized, highly engaging, and career-accelerating learning experience.
