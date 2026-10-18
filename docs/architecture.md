# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep the React UI focused on rendering the four capability pages, loading states, empty states, and accessible error alerts while delegating all data access to the shared API client and Vite proxy.
- Logic tier decision: Implement the Express API as thin route handlers over a single service module so validation, aggregation, and business logic stay in the backend and do not leak into the frontend.
- Data tier decision: Use Mongoose schemas and a seeded dataset that is idempotent across repeated runs, preserving the seeded user/team fixtures while allowing app-created records to coexist safely.
- Activity tracking approach: Validate `userId` and `teamId` as real references, reject malformed or missing IDs with deliberate 4xx responses, and compute `points` and `occurredAt` server-side before persisting the activity.
- Team management approach: Enforce required team metadata (`name`, `mascot`) and store member references as ObjectIds while returning the list with member IDs preserved for frontend display.
- Leaderboard approach: Aggregate activities by team, sum `points`, sort descending by total, and assign 1-based ranks in the returned leaderboard payload.
- Workout suggestions approach: Match by seeded user email, inspect recent activity patterns or fitness goals, and return the highest-priority workout suggestions with a reason string that explains the match.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — verifies schema requirements, seed idempotence, and representative Mongo data behavior before API wiring.
- API command: `npm run test:api --prefix octofit-tracker/backend` — validates the Express routes and service logic for activity creation, teams, leaderboard aggregation, and workout suggestions with deliberate 4xx handling.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — checks that each route loads data from the API, exposes loading/empty/error states, and renders accessible status text.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — catches TypeScript or import problems in the logic and data layers.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — confirms the React app compiles and the Vite project is wired correctly.
- Failure interpretation: if a lower-tier test fails, fix the data model or service first; if the UI fails after the backend is green, the issue is in presentation logic or the API contract assumptions, not the database layer.
 