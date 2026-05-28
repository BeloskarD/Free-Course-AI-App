# 🏛️ Zeeklect Target Architecture Specification & Database Isolation Blueprint

This document represents the permanent, production-grade **Target Architecture Specification** for the **Zeeklect** backend. It establishes strict, database-agnostic domain boundaries, completely isolates business logic from infrastructure details, and sets the standard for all future development.

---

## 🎯 System Topology: The Pure Domain Layer

We enforce a highly decoupled, four-tier architecture to completely isolate database semantics:

```
┌────────────────────────────────────────────────────────┐
│                   Web Presentation Tier                │  ◄── Thin controllers, parses params,
│                    (src/controllers/*)                 │      triggers validators, formats JSON
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼ (Clean DTOs / Request Objects)
┌────────────────────────────────────────────────────────┐
│                    Domain Service Tier                 │  ◄── Domain Orchestration, AI Engines,
│                     (src/services/*)                   │      XP Systems, Streaks, Gamification
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼ (Rich Domain Entities)
┌────────────────────────────────────────────────────────┐
│                   Domain Repository Tier               │  ◄── Strict Domain Interfaces
│                    (src/repositories/*)                │      (No CRUD CRUD models or query leaks)
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌──────────────────────────┐ ┌──────────────────────────┐
│  Mongoose Adapter Layer  │ │  PostgreSQL/Prisma Layer │  ◄── Data Mapping, database transactions,
│  (repositories/mongoose) │ │  (repositories/postgres) │      hydrated Mongoose / SQL entities
└──────────────────────────┘ └──────────────────────────┘
```

---

## 1. ⚙️ Domain Service Layer (DSL)

To prevent controller bloat, all route controllers must be made **ultra-thin**. Controllers contain **zero** business logic, **zero** transaction logic, and **zero** direct model calls.

### Architectural Rules
*   **Controllers** perform only three tasks:
    1. Extract authorization context (`req.userId`, subscription status).
    2. Parse request payloads and trigger schema validators.
    3. Delegate execution directly to the **Domain Service Layer** and format the HTTP response.
*   **Domain Services** orchestrate business domain workflows, including gamification XP calculation, learning velocity updates, portfolio analysis, and AI prompt generation.

### Service Boundaries & Folder Structure
```
src/
├── controllers/            # Ultra-thin HTTP handlers
│   └── mission.controller.js
└── services/
    ├── domain/             # High-level business orchestration services
    │   ├── MissionDomainService.js
    │   ├── PortfolioDomainService.js
    │   └── UserDomainService.js
    └── infrastructure/      # AI models, Stripe integrations, mailing services
        └── aiService.js
```

### Example Implementation: `MissionDomainService.js`
```javascript
import missionRepository from '../../repositories/MissionRepository.js';
import userProgressRepository from '../../repositories/UserProgressRepository.js';
import eventEmitter from '../../events/EventEmitter.js';
import transactionManager from '../../repositories/TransactionManager.js';

class MissionDomainService {
    /**
     * Orchestrates complete mission validation, completion, XP, and event triggers.
     * @param {String} userId 
     * @param {String} missionId 
     * @returns {Promise<Object>} Completed mission payload
     */
    async completeMission(userId, missionId) {
        return await transactionManager.run(async (trx) => {
            // 1. Fetch user's mission progress via domain-oriented repository
            const progress = await missionRepository.getUserMissionProgress(userId, missionId, trx);
            if (!progress) throw new Error("Mission progress not found.");
            if (progress.status === 'completed') throw new Error("Mission already completed.");

            // 2. Perform business logic calculations
            const pointsEarned = progress.stages.length * 100;

            // 3. Persist domain state changes via atomic operations
            const updatedProgress = await missionRepository.completeMission(userId, missionId, pointsEarned, trx);
            await userProgressRepository.creditUserPoints(userId, pointsEarned, trx);

            // 4. Trigger Domain Event (processed async-safely outside active transaction)
            eventEmitter.emit('MissionCompletedEvent', {
                userId,
                missionId,
                pointsEarned,
                completedAt: updatedProgress.completedAt
            });

            return updatedProgress;
        });
    }
}

export default new MissionDomainService();
```

---

## 2. 🛡️ Removing Generic CRUD Repository Inheritance

Inheriting generic CRUD methods (like `create`, `update`, `delete`, `find`) in domain interfaces creates **query-semantic leaks** because calling layers begin constructing database-specific filter objects (e.g. `$regex` or `where` blocks).

### revised Repository Structure
We discard `IBaseRepository` completely. Domain repositories expose **only** intentional, highly explicit domain functions.

```javascript
// src/repositories/UserRepository.js
class IUserRepository {
    // 100% Intentional domain contracts, zero generic queries allowed!
    async getUserById(id) { throw new Error(); }
    async getUserByEmail(email) { throw new Error(); }
    async findByStripeCustomerId(stripeCustomerId) { throw new Error(); }
    async createNewUser(userData) { throw new Error(); }
    
    // Mutation: Atomic Domain Operations (No returning hydrated documents)
    async updateSubscriptionDetails(userId, tier, billingData) { throw new Error(); }
    async creditGamificationXP(userId, xpAmount, levelUpTriggered) { throw new Error(); }
}
export default IUserRepository;
```

### Safe Repository Principles
1.  **No Chaining allowed:** Repository methods must be completely self-contained. Chaining query builder functions (e.g., `.select().populate().sort()`) is strictly forbidden outside database adapters.
2.  **Explicit Projections only:** If an endpoint needs specific fields to optimize performance, the repository contract must expose a specific method (e.g. `getUserProfileSummary(userId)`), returning exactly that payload.

---

## 3. 📣 Domain Event System (DES)

To decouple high-risk operations (such as notifying users, re-evaluating readiness scores, or updating third-party Stripe sessions) from primary transaction streams, we introduce a lightweight event-driven layer.

### System Architecture
```
[Domain Service] ──► Emits event ──► [IEventEmitter]
                                            │
                                            ▼ (Async Processing)
                                     ┌──────┴──────┐
                                     ▼             ▼
                              [Audit logger]   [WS Handler]  (WebSockets)
```

### Event Contracts: `src/events/EventEmitter.js`
```javascript
import EventEmitter from 'events';

class SafeEventEmitter {
    constructor() {
        this.emitter = new EventEmitter();
    }

    emit(eventName, payload) {
        // Run immediately on process nextTick to prevent blocking the active HTTP thread
        process.nextTick(() => {
            try {
                this.emitter.emit(eventName, payload);
            } catch (err) {
                console.error(`❌ Event Emission Error on [${eventName}]:`, err);
            }
        });
    }

    on(eventName, handler) {
        this.emitter.on(eventName, async (payload) => {
            try {
                await handler(payload);
            } catch (err) {
                console.error(`❌ Event Handler Failed for [${eventName}]:`, err);
                // Hook in Retry strategy or Dead Letter Queue here
            }
        });
    }
}

export default new SafeEventEmitter();
```

### Transactional Consistency Rule
> [!IMPORTANT]
> **Event Emission Boundary:** Domain events must **never** be emitted inside an active database transaction. Doing so risks triggering side-effects (like capturing Stripe checkouts) even if the primary database transaction is aborted/rolled back later. Always emit events *after* successful database commit.

---

## 4. 🗺️ Data Mapper Layer (DML)

To isolate Mongoose sub-document mechanics and Prisma SQL schemes, we introduce a strict **Data Mapper Layer**. Database entities are fully converted into clean **Domain Entities** prior to escaping the adapter layer.

### Data Flow Diagram
```
┌──────────────────────┐      ┌────────────────────┐      ┌──────────────────┐
│  Raw Database Doc    │ ──►  │    Data Mapper     │ ──►  │  Domain Entity   │ (Clean POJO)
│  (Mongoose / Prisma) │      │  (src/mappers/*)   │      │  (src/entities/*)│
└──────────────────────┘      └────────────────────┘      └──────────────────┘
```

### Example Mapper: `UserMapper.js`
```javascript
export class UserMapper {
    /**
     * Maps database data into a highly strict, immutable Domain Entity.
     * Prevents database Schema leaks (e.g. MongoDB ObjectIds, __v).
     */
    static toDomain(dbUser) {
        if (!dbUser) return null;
        
        return Object.freeze({
            id: dbUser._id ? dbUser._id.toString() : dbUser.id,
            email: dbUser.email,
            name: dbUser.name || 'Anonymous User',
            avatar: dbUser.avatar || '',
            subscriptionTier: dbUser.subscriptionTier || 'free',
            
            // Standardizing dynamic Mongoose nested schemas / SQL JSONB columns
            gamification: {
                level: dbUser.gamification?.level || 1,
                xp: dbUser.gamification?.xp || 0,
                achievements: dbUser.gamification?.achievements || []
            },
            billing: {
                stripeCustomerId: dbUser.billing?.stripeCustomerId || null,
                subscriptionStatus: dbUser.billing?.subscriptionStatus || 'inactive'
            },
            
            createdAt: dbUser.createdAt instanceof Date ? dbUser.createdAt.toISOString() : dbUser.createdAt,
            updatedAt: dbUser.updatedAt instanceof Date ? dbUser.updatedAt.toISOString() : dbUser.updatedAt
        });
    }
}
```

---

## 🔒 5. Database Safety Rules

To prevent developers from accidentally reintroducing Mongoose dependencies, we establish strict static engineering constraints:

### Forbidden outside `/repositories/adapters/`
1.  **imports:** Importing Mongoose `mongoose` or Prisma client `@prisma/client`.
2.  **MongoDB Identifiers:** Instantiating `new ObjectId()` or referencing `mongoose.Types.ObjectId`.
3.  **Mongoose Hydrated Helpers:** Calling `.save()`, `.populate()`, `.select()`, or `.lean()`.
4.  **Raw Query Mutation:** Mutating sub-document properties directly on database-returned entities.

### Linting & Enforcement Strategy
We recommend setting up an automated architectural gating rule inside ESLint (`.eslintrc.json`):
```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "mongoose",
        "message": "Direct Mongoose imports are strictly forbidden outside repositories/mongoose adapters."
      }]
    }]
  }
}
```

---

## 🧪 6. Testing & Regression Strategy

To ensure zero logic leaks and maintain absolute backward compatibility, our verification plan enforces a rigorous testing topology:

```
                   ┌──────────────────────────────────┐
                   │    Payload Snapshot Tests        │ ◄── Assures matching JSON shapes
                   └────────────────┬─────────────────┘
                                    │
                   ┌────────────────┴─────────────────┐
                   │    Database Compatibility Tests  │ ◄── Evaluates Mongo vs. SQL outputs
                   └────────────────┬─────────────────┘
                                    │
                   ┌────────────────┴─────────────────┐
                   │    Transaction Rollback Tests    │ ◄── Verifies transaction integrity
                   └──────────────────────────────────┘
```

1.  **Contract Tests:** Ensure both `mongoose/` and `postgres/` repository adapters accept and return identical argument types and formats.
2.  **Payload Snapshot Tests:** Prior to implementation, we dump production database mock responses. Refactored controllers will be evaluated against these static snapshots to verify **zero API changes**.
3.  **Transaction Rollback Tests:** Tests that purposefully throw errors midway through transactional flows (such as mission completions) to verify that updates to the database are cleanly rolled back in both engines.

---

## 📂 7. Target Directory Structure

The following is the clean, decoupled folder structure that will govern the Zeeklect backend repository:

```
src/
├── controllers/             # Ultra-thin request parsing, schema triggers, JSON formats
│   ├── user.controller.js
│   └── mission.controller.js
├── services/
│   └── domain/              # Orchestration engines, XP calculations, scoring rules
│       ├── UserDomainService.js
│       └── MissionDomainService.js
├── entities/                # Standardized domain-entity data structures
│   ├── UserEntity.js
│   └── MissionEntity.js
├── mappers/                 # Converts Database models to standardized Entities
│   ├── UserMapper.js
│   └── MissionMapper.js
├── events/                  # Decoupled Domain Event System (Outbox Pattern handlers)
│   ├── EventEmitter.js
│   └── handlers/
│       └── UserEngagementHandler.js
├── repositories/            # Decoupled Repository interfaces
│   ├── UserRepository.js
│   ├── MissionRepository.js
│   ├── TransactionManager.js
│   ├── mongoose/            # Mongoose Concrete adapters
│   │   ├── UserRepository.js
│   │   └── MongooseTransactionManager.js
│   └── postgres/            # Prisma PostgreSQL concrete adapters (skeletons)
│       ├── UserRepository.js
│       └── PostgresTransactionManager.js
├── models/                  # Mongoose Schemas (Confined STRICTLY to mongoose adapters)
│   ├── User.js
│   └── Mission.js
└── workers/                 # Isolated background queue workers
    └── usageReset.worker.js
```
