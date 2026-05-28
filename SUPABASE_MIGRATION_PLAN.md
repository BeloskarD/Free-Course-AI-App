# 🚀 Supabase Migration Blueprint: Express & MongoDB-to-PostgreSQL

This blueprint details a professional, low-friction engineering strategy for migrating the database architecture of **Zeeklect** from MongoDB (Mongoose) to **Supabase (PostgreSQL)**. 

Thanks to the clean **Repository Pattern** already implemented in your Express backend, we can swap out the database engine completely **without modifying a single line of code in your controllers, services, middleware, or Next.js frontend!**

---

## 📊 Architectural Context

Currently, the platform relies on the following database setup:
*   **Mongoose ODM**: Manages highly nested, document-oriented Schemas (`User`, `LearnerProfile`, `Mission`, etc.).
*   **Repository Layer (`src/repositories/`)**: Abstracted via `IBaseRepository`, decoupling Express route controllers from Mongoose.
*   **Agenda Job Queue**: Manages background AI execution, storing jobs in MongoDB.

### The "Zero-Logic-Change" Strategy
To migrate to Supabase with minimal changes and 100% schema parity:
1.  **Keep the Express Backend**: The Node/Express server remains the orchestrator for route logic and AI models.
2.  **Use PostgreSQL JSONB columns**: Instead of normalizing MongoDB documents into 30+ relational SQL tables (which would require complex JOINs, foreign keys, and massive codebase edits), store nested objects and dynamic arrays in native Postgres `JSONB` columns.
3.  **Leverage Prisma ORM**: Swapping Mongoose for Prisma (pointing to Supabase PostgreSQL) allows us to write database operations in a highly familiar, type-safe query syntax (e.g. `prisma.user.findUnique()`).
4.  **Rewrite Repositories Only**: Write Postgres equivalents of your repositories and swap the active export in `src/repositories/index.js`.

---

## 🛠️ Step-by-Step Migration Plan

### Step 1: Provision Supabase
1. Create a free-tier project at [supabase.com](https://supabase.com).
2. Go to **Settings > Database > Connection string** and copy your Transaction/Session connection URI (`DATABASE_URL`).
3. Add this URI to your backend `.env` file:
   ```env
   DATABASE_URL="postgres://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres?pgbouncer=true"
   ```

### Step 2: Install Prisma ORM
Run the following commands inside the `backend/` directory:
```bash
npm install @prisma/client
npm install prisma --save-dev
npx prisma init
```
This generates a new `prisma/schema.prisma` file.

### Step 3: Define the Prisma Schema (`schema.prisma`)
Configure `prisma/schema.prisma` to map your Mongoose schemas to PostgreSQL. Here is the exact production-ready mapping for `User` and `LearnerProfile` models using `JSONB` for nested fields:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id               String          @id @default(uuid())
  email            String          @unique
  password         String?
  authProvider     String          @default("local") @map("auth_provider")
  providerId       String?         @map("provider_id")
  name             String          @default("")
  avatar           String          @default("")
  
  // Stored as JSONB arrays/objects for 100% MongoDB document parity
  savedCourses     Json            @default("[]") @map("saved_courses")
  gamification     Json            @default("{}") @map("gamification")
  savedAnalyses    Json            @default("[]") @map("saved_analyses")
  savedTools       Json            @default("[]") @map("saved_tools")
  
  subscriptionTier String          @default("free") @map("subscription_tier")
  billing          Json            @default("{}") @map("billing")
  usage            Json            @default("{}") @map("usage")
  onboardingStatus Json            @default("{}") @map("onboarding_status")
  sessionCount     Int             @default(0) @map("session_count")
  aiProfile        Json            @default("{}") @map("ai_profile")
  
  createdAt        DateTime        @default(now()) @map("created_at")
  updatedAt        DateTime        @updatedAt @map("updated_at")

  learnerProfile   LearnerProfile?

  @@map("users")
}

model LearnerProfile {
  id               String          @id @default(uuid())
  userId           String          @unique @map("user_id")
  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Fully preserving LearnerProfile's massive schema inside SQL JSONB 
  goals            Json            @default("{}") @map("goals")
  preferences      Json            @default("{}") @map("preferences")
  masteredSkills   Json            @default("[]") @map("mastered_skills")
  adaptiveVelocity Json            @default("{}") @map("adaptive_velocity")
  currentPlan      Json            @default("{}") @map("current_plan")
  recentSessions   Json            @default("[]") @map("recent_sessions")
  careerReadiness  Json            @default("{}") @map("career_readiness")
  wellbeing        Json            @default("{}") @map("wellbeing")
  portfolio        Json            @default("{}") @map("portfolio")
  
  lastUpdated      DateTime        @default(now()) @map("last_updated")
  createdAt        DateTime        @default(now()) @map("created_at")
  updatedAt        DateTime        @updatedAt @map("updated_at")

  @@map("learner_profiles")
}
```

Push this schema directly to Supabase to create the tables instantly:
```bash
npx prisma db push
```

---

## 🔄 Code Parity: Mongoose vs. Prisma

Because your repositories return POJOs, we can write a Prisma-backed repository that does the exact same things. Look at how clean and identical the transition is:

### Mongoose Implementation (`mongoose/UserRepository.js`)
```javascript
import User from '../../models/User.js';
import IUserRepository from '../UserRepository.js';

class MongoUserRepository extends IUserRepository {
    async findById(id) {
        const user = await User.findById(id);
        return this.toPOJO(user);
    }

    async findByEmail(email) {
        const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        return this.toPOJO(user);
    }

    async create(userData) {
        const user = new User(userData);
        await user.save();
        return this.toPOJO(user);
    }

    async update(id, updateData) {
        const user = await User.findByIdAndUpdate(id, updateData, { new: true });
        return this.toPOJO(user);
    }
}
```

### PostgreSQL (Prisma) Implementation (`postgres/UserRepository.js`)
```javascript
import { PrismaClient } from '@prisma/client';
import IUserRepository from '../UserRepository.js';

const prisma = new PrismaClient();

class PostgresUserRepository extends IUserRepository {
    async findById(id) {
        const user = await prisma.user.findUnique({ where: { id } });
        return user; // Prisma returns POJOs naturally!
    }

    async findByEmail(email) {
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });
        return user;
    }

    async create(userData) {
        const user = await prisma.user.create({ data: userData });
        return user;
    }

    async update(id, updateData) {
        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });
        return user;
    }
}

export default new PostgresUserRepository();
```

---

## 🔌 Toggling Database Provider

Once all repositories are written under `repositories/postgres/`, just toggle the active exports in `src/repositories/index.js`:

```javascript
// Change this:
// import userRepository from './mongoose/UserRepository.js';
// To this:
import userRepository from './postgres/UserRepository.js';
```

---

## ⚡ Querying inside JSONB columns (Stripe & Deep Nested Queries)

You might wonder: *How do we query or update fields stored inside JSONB?* PostgreSQL is incredibly efficient here. 

### 1. Simple JSONB Updates (e.g. updating a user's subscription status)
To update `billing.subscriptionStatus` inside the JSONB structure in PostgreSQL:
```javascript
await prisma.user.update({
  where: { id: userId },
  data: {
    billing: {
      update: {
        subscriptionStatus: "active"
      }
    }
  }
});
```

### 2. Searching inside JSONB (e.g., Stripe Webhook user lookup)
If a Stripe webhook arrives and you need to find the user by their `billing.stripeCustomerId` inside JSONB:
```javascript
const user = await prisma.user.findFirst({
  where: {
    billing: {
      path: ['stripeCustomerId'],
      equals: stripeCustomerId
    }
  }
});
```

### 3. Creating Functional Indexes (Production Performance)
To make searches inside JSONB run at native compiled speed, you can create a functional index inside Supabase:
```sql
CREATE INDEX idx_users_stripe_customer_id ON users ((billing->>'stripeCustomerId'));
```

---

## ⏱️ AI Background Jobs (Agenda) Migration Plan

Your Express backend currently uses `Agenda` (`@agendajs/mongo-backend`) to process background AI jobs. Since Agenda is inherently tied to MongoDB, you have three options for background jobs:

| Option | Approach | Implementation Complexity | Infrastructure Cost |
|---|---|---|---|
| **Option A (Highly Recommended)** | **Hybrid Database** | **Extremely Low** | **Free** |
| Keep a free MongoDB cluster (like MongoDB Atlas Shared Tier) *strictly* to run the Agenda queue, and run all main app tables inside Supabase. | Zero changes to backend workers/jobs. | $0 (both MongoDB Atlas & Supabase have free tiers). |
| **Option B** | **Migrate to Pg-Boss** | **Medium** | **Free** |
| Replace `agenda` with `pg-boss` (a Node.js background job library built specifically for PostgreSQL). | Requires replacing Agenda initialization with Pg-Boss in `backend/src/workers/index.js`. | $0 (runs inside your Supabase Postgres database using LISTEN/NOTIFY). |
| **Option C** | **Supabase Edge Functions** | **High** | **Free / Serverless** |
| Trigger background tasks using Supabase Edge Functions with Database Webhooks or pg_cron scheduler. | Requires migrating Express background workers to TypeScript Edge Functions. | $0 (Serverless limits apply). |

---

## 🚀 Migration Verification Checklist

Before releasing, execute this validation run:
- [ ] Spin up Supabase project & update `.env` connection string.
- [ ] Push database schemas using `npx prisma db push`.
- [ ] Seed roles taxonomy: Ensure the startup script successfully seeds roles (`src/services/roleTaxonomy.service.js`).
- [ ] Run backend tests locally: Ensure authentication, JWT issuance, and AI analyses return valid responses.
- [ ] Test Next.js UI integration: Navigate the Opportunity Radar and click learning paths to confirm SQL JSONB objects are mapped perfectly to the React view.

This architecture offers a robust, highly resilient, and zero-downtime path to Supabase. By keeping your schemas documented as POJOs and using PostgreSQL JSONB, your platform gains PostgreSQL's relational strength and SQL speed, while retaining the simplicity of document structures.
