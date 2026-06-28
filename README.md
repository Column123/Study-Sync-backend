# Study Backend API

> A structured Node.js backend for authentication, AI-powered Q&A, and adaptive study roadmap management.

---

## Quick Navigation
- [1. Project Overview](#1-project-overview)
- [2. Features](#2-features)
- [3. Tech Stack](#3-tech-stack)
- [4. Folder Structure](#4-folder-structure)
- [5. Architecture](#5-architecture)
- [6. Request Flow](#6-request-flow)
- [7. Database Structure (Firestore)](#7-database-structure-firestore)
- [8. Authentication Flow](#8-authentication-flow)
- [9. API Endpoints](#9-api-endpoints)
- [10. Environment Variables](#10-environment-variables)
- [11. Installation](#11-installation)
- [12. Running Locally](#12-running-locally)
- [13. AI Integration](#13-ai-integration)
- [14. Error Handling](#14-error-handling)
- [15. Future Improvements](#15-future-improvements)
- [16. Contributing](#16-contributing)

---

## 1. Project Overview
The backend acts as the coordination layer between users, AI services, and persistent data.

This project is a Node.js + Express backend for a study platform that provides:
- User authentication (register, login, refresh token, logout)
- User profile retrieval and update
- AI-assisted Q&A (Gemini + Cohere answers to user questions)
- AI roadmap generation and roadmap progress tracking

Data is stored in Firebase Firestore using Firebase Admin SDK.

---

## 2. Features
- Intelligent learning paths: user-specific roadmap generation (Gemini), save, fetch, and progress update
- Progress visibility: user-level stats in profile (questions asked, total paths, completed paths)
- Community feedback signals: answer voting (like/dislike) with Firestore transactions
- Guided categorization: public category listing for questions
- Secure session flow: JWT-based access token authentication with refresh token via HTTP-only cookie
- Safe onboarding: account creation with password hashing (bcrypt)
- Fast doubt resolution: authenticated question posting with automatic AI answers

---

## 3. Tech Stack
Core stack by responsibility:

| Responsibility | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | Google Firestore (Firebase Admin SDK) |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | `bcrypt` |
| AI services | Google Gemini (`@google/genai`), Cohere (`cohere-ai`) |
| Middleware | `cors`, `cookie-parser`, `dotenv` |
| Development | `nodemon` |

---

## 4. Folder Structure
```text
backend/
	config/
		firebase/
			firebaseAdminConfig.json
		firebaseConfig.js
	controllers/
		accounts/
			accountsController.js
		auth/
			authenticate.js
			createAccount.js
			logoutController.js
			refreshAccessToken.js
		doubts/
			doubtsController.js
			doubtsControllerPublic.js
		roadmap/
			roadmapController.js
	middleware/
		verifyJWT.js
	models/
		AnswerModel.js
		Categories.js
		DisLikedUserModel.js
		LikedUserModel.js
		QuestionModel.js
		RoadmapModel.js
		UserModel.js
		UserProfileModel.js
	router/
		accounts_routes/accounts.js
		authentication_routes/{register.js,logIn.js,logout.js,refresh.js}
		doubts_routes/doubts.js
		roadmap_routes/roadmap.js
	utils/
		AI/{gemini.js,cohere.js}
		RoadmapAI/roadmapGenerator.js
	server.js
	package.json
```

---

## 5. Architecture
Layered architecture:

Request-to-data pipeline:
- `server.js`: entrypoint wiring, CORS policy, parser middleware, route mounting
- `router/*`: endpoint map and HTTP method-to-controller binding
- `middleware/*`: cross-cutting guardrails (`verifyJWT`)
- `controllers/*`: orchestration, validation, and business decisions
- `models/*`: document blueprints for Firestore writes
- `config/*`: Firebase Admin initialization + exported Firestore collections
- `utils/*`: external intelligence layer (Gemini/Cohere integrations)

---

## 6. Request Flow
Typical flow for protected endpoints:
1. Request hits Express route mounted in `server.js`.
2. Route-level middleware `verifyJWT` validates `Authorization: Bearer <token>`.
3. Controller executes business logic.
4. Controller reads/writes Firestore collections and subcollections.
5. JSON response is returned with HTTP status code.

Authentication token lifecycle:
1. `POST /login` validates user credentials.
2. Server creates short-lived access token (`10m`) and refresh token (`7d`).
3. Refresh token is saved in Firestore (`users.refreshToken`) and as `jwt` cookie.
4. `GET /refresh` verifies cookie refresh token and issues a new access token.
5. `GET /logout` clears refresh token in Firestore and clears cookie.

---

## 7. Database Structure (Firestore)
Collections and shape inferred from model/controller code:

### `users` (identity and authentication core)
Document fields:
- `name` (string)
- `username` (string)
- `email` (string)
- `password` (bcrypt hash)
- `refreshToken` (string or `null`)
- `createdAt` (ISO string)

### `userProfiles` (extended learner profile)
Document ID: same as user ID (created in same batch during registration)

Fields:
- `username`
- `bio`
- `currentEducationLevel`
- `currentInstitution`
- `major`
- `githubUrl`
- `linkedinUrl`
- `website`
- `reputationScore` (number)
- `questionsAsked` (number)
- `totalPath` (number)
- `completedPath` (number)

### `questions` (knowledge exchange records)
Document fields:
- `title`
- `question`
- `category`
- `user_ref` (DocumentReference -> `users/{id}`)
- `response` (number; vote/activity counter)
- `createdBy` (username)
- `createdAt` (Date)

Subcollection: `answers`
- `answer`
- `ai_model`
- `likes` (number)
- `dislikes` (number)

Nested under each answer:
- `likes/{userId}` with `likedAt`
- `dislikes/{userId}` with `disLikedAt`

### `roadmaps` (personal learning journey graphs)
Document fields:
- `title`
- `topics`
- `totalModules`
- `percentageCompleted`
- `userId`
- `roadmap` (array of nodes)
- `createdAt` (server timestamp)

Roadmap node schema is generated by AI with fields:
- `title`, `description`, `id`, `previous_node`, `time_required`, `status`, `resources`, `difficulty`, `test_status`

---

## 8. Authentication Flow
### Register
- `POST /register`
- Validates required fields (`name`, `username`, `email`, `password`)
- Checks uniqueness for email and username
- Hashes password using bcrypt (salt rounds `10`)
- Creates `users` + `userProfiles` docs in one Firestore batch

### Login
- `POST /login`
- Accepts either `email` or `username`, plus `password`
- Validates password with bcrypt compare
- Returns access token JSON and sets refresh cookie `jwt`

### Access Control
- Protected routes require `Authorization: Bearer <accessToken>`
- `verifyJWT` verifies token using `ACCESS_TOKEN_SECRET`
- On success sets `req.user = { username, id, iat, exp }`

### Refresh
- `GET /refresh`
- Reads cookie `jwt`
- Verifies token and matches Firestore user by stored refresh token
- Issues new access token

### Logout
- `GET /logout`
- Reads cookie `jwt`
- Clears stored refresh token in Firestore
- Clears cookie

---

## 9. API Endpoints
Base URL: `http://localhost:<PORT>`

### Health / Basic
- `GET /` -> returns `"hello world"`
- `GET /test` -> returns `req.user` (note: route is not protected)

### Authentication
- `POST /register`
	- Body: `{ name, username, email, password }`
- `POST /login`
	- Body: `{ password, email? , username? }`
	- Response: `{ accessToken, username }` + `jwt` cookie
- `GET /refresh`
	- Requires refresh cookie `jwt`
	- Response: `{ accessToken }`
- `GET /logout`
	- Requires cookie `jwt` for token invalidation path

### Accounts
- `GET /profile/:username`
	- Public
	- Returns merged user + profile data
- `PATCH /profile/:username`
	- Protected
	- Uses `req.user.id` for profile doc update
	- Updatable fields: `bio`, `currentEducationLevel`, `currentInstitution`, `major`, `githubUrl`, `linkedinUrl`, `website`

### Doubts / Q&A
- `GET /doubts` (protected)
	- Optional query filters: `category`, `createdBy`
	- Returns questions and answers with like/dislike flags for current user
- `POST /doubts` (protected)
	- Body: `{ title, question }`
	- Generates Gemini + Cohere answers, stores question + answers in batch
- `GET /doubts/category`
	- Public
	- Returns allowed categories
- `GET /doubts/userQuestions` (protected)
	- Returns questions by current user
- `GET /doubts/answer/:questionId` (protected)
	- Returns answers ordered by likes desc
- `POST /doubts/like/:questionId/:answerId` (protected)
	- Toggles like, handles mutual exclusion with dislike
- `POST /doubts/dislike/:questionId/:answerId` (protected)
	- Toggles dislike, handles mutual exclusion with like

### Roadmaps
- `POST /roadmap/create` (protected)
	- Body: `{ topics, time }`
	- Returns generated roadmap without persisting
- `POST /roadmap/save` (protected)
	- Body: `{ title, topics, roadmap }`
	- Saves roadmap and increments `userProfiles.totalPath`
- `GET /roadmap` (protected)
	- Returns user roadmap list + profile stats (`totalPath`, `completedPath`)
- `GET /roadmap/:roadmapId` (protected)
	- Returns roadmap if it belongs to current user
- `PATCH /roadmap/:roadmapId` (protected)
	- Body: `{ nodeId }`
	- Marks node complete if dependencies satisfied
	- Recalculates completion percentage

---

## 10. Environment Variables
Defined/used in code:
- `PORT` (optional, defaults to `5000`)
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `GEMINI_API_KEY`
- `COHERE_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT` (stringified JSON service-account object)

Important: Firebase credentials are loaded from `FIREBASE_SERVICE_ACCOUNT` using `JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)`.

---

## 11. Installation
```bash
npm install
```

---

## 12. Running Locally
1. Copy `.env.example` to `.env`.
2. Fill all values in `.env`.
3. For `FIREBASE_SERVICE_ACCOUNT`, keep the JSON on a single line and preserve escaped newlines (`\\n`) inside `private_key`.
4. Start server:

```bash
npm run start
```

For development with auto-reload:

```bash
npm run start:dev
```

Server starts on `http://localhost:5000` unless `PORT` is set.

---

## 13. AI Integration
### Q&A AI (`POST /doubts`)
- Gemini (`utils/AI/gemini.js`):
	- Produces structured JSON with `answer` and `assignedCategory`
	- Uses constrained category enum from `models/Categories.js`
- Cohere (`utils/AI/cohere.js`):
	- Produces a text answer
- Both responses are saved as separate answer docs under the same question.

### Roadmap AI (`POST /roadmap/create`)
- Gemini (`utils/RoadmapAI/roadmapGenerator.js`) generates a JSON array roadmap schema.
- Enforces DAG-like dependencies via prompt instructions.
- Handles 503 and 429 API conditions with explicit custom errors.

---

## 14. Error Handling
Current error-handling pattern:
- Input validation returns `400` with message in many controllers
- Missing auth/token commonly returns `401` or `403`
- Not found uses `404`
- Some idempotent/no-content logout paths return `204`
- Unhandled exceptions generally log to console and return `500`

There is no centralized global error middleware; handling is per-controller.

---

## 15. Future Improvements
Based strictly on observed code:
- Move Firebase service account secret out of repo and load via secure env/secret manager
- Add centralized error middleware + uniform error response schema
- Harden cookie settings (`secure: true`, consistent `sameSite`) for production
- Add request validation layer (e.g., Zod/Joi) on all endpoints
- Add tests (currently no tests implemented)
- Fix naming/casing consistency (`RoadMapModel` import vs `RoadmapModel.js`) for cross-platform safety
- Resolve answer-like status inconsistency in `getAnswers` (`liked_users` read path differs from `likes` write path)
- Add pagination for questions and answers
- Add rate limiting and auth brute-force protection

---

## 16. Contributing
No explicit contribution guidelines are present in this repository.

Suggested basic workflow:
1. Fork/branch from main codebase.
2. Make focused changes.
3. Add/update tests where applicable.
4. Open a pull request with clear description.

---

