# MindVault AI

**MindVault AI** is a secure, private, AI-powered personal knowledge and reflection platform built for learning, brainstorming, and journaling.

MindVault AI pairs multi-turn **Gemini** intelligence with strict, user-isolated **Cloud Firestore** document storage, **Firebase Authentication**, and **Google Cloud Secret Manager**.

---

## 🌟 Key Features

### 1. User Authentication (Firebase Auth)
- Authenticate securely using **Google Sign-In**.
- Session state is preserved across reloads.
- Authoritative user identity (`uid`) strictly gates all database read/write operations.
- Unauthenticated visitors are gated with a secure, explanatory sign-in experience.

### 2. Multi-Turn Gemini AI Interaction
- Conversational partner powered by `gemini-3.8-flash` via the official `@google/genai` SDK.
- Ideal for deep-dive technical research, creative brainstorming, and introspective journaling.
- **Server-Side Security**: All Gemini API calls are executed on the Node.js Express server. API keys and credentials are never exposed to the client or browser.

### 3. Automatic Summarization & Tagging
- One-click **"Save to Vault"** triggers Gemini server-side to generate:
  - An executive conversation title (max 7 words).
  - A structured summary highlighting key concepts and decisions.
  - 2–5 domain topic tags.
- Automatically saves to your private Cloud Firestore collection.

### 4. Zero-Knowledge Private Storage (Cloud Firestore)
- Stored under strictly isolated paths: `users/{userId}/conversations/{id}` and `users/{userId}/reflections/{id}`.
- Enforced at both the Firestore security rules layer and the application layer.
- Users can view conversation history, search by keyword or topic tag, and delete individual records.

### 5. Signature Feature: AI Weekly Reflection
- Analyzes the authenticated user's recent saved conversations across **5 strict pillars**:
  1. **Main Topics Discussed**: High-level themes explored during the cycle.
  2. **What You Learned**: Conceptual synthesis of knowledge and breakthroughs.
  3. **Recurring Interests & Patterns**: Emerging curiosities, cognitive models, or challenges.
  4. **Recommended Next Steps**: Exactly 3 actionable steps with an interactive progress tracker.
  5. **Motivational AI Insight**: A personalized, uplifting reflection tailored to the user's demonstrated thoughts.
- Completely isolated to the authenticated user's own data.

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Client (React)                   │
│   - Firebase Auth (Google Sign-In)                          │
│   - Tailored UI (Tailwind CSS, Lucide Icons, ReactMarkdown) │
│   - Firestore SDK (Direct client read/write with Rules)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
               Bearer Token    │  /api/gemini/*
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Node.js Backend (Express + Vite)              │
│   - Port 3000 Ingress                                       │
│   - Auth Bearer Token Validation                            │
│   - Google Cloud Secret Manager Service Client              │
│   - Gemini AI Service Client (@google/genai)                │
└──────────────────────────────┬──────────────────────────────┘
                               │
             Secret Fetch      │  API Inference
                               ▼
┌──────────────────────────────┴──────────────────────────────┐
│                  Google Cloud Infrastructure                │
│   - Google Cloud Secret Manager (GEMINI_API_KEY)            │
│   - Cloud Run (Containerized Server)                        │
│   - Cloud Firestore (Multi-tenant data isolation)           │
│   - Firebase Authentication                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security & Privacy Posture

1. **Gemini API Key Protection**:
   - `GEMINI_API_KEY` is strictly server-side.
   - Initialized lazily and never embedded in frontend bundles or `VITE_` variables.
   - Compatible with Google Cloud Secret Manager for enterprise credential rotation.

2. **Firestore Security Rules**:
   - Deployed rules restrict all read, create, update, and delete access to `request.auth.uid == userId`.
   - Unauthorized reads or writes from other users or unauthenticated clients are rejected at the database engine level.

3. **No Fake Data**:
   - All conversations, summaries, and reflections are generated in real-time by the Gemini API and persisted to live Firestore collections.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Google Gemini API Key (`GEMINI_API_KEY`)
- A Firebase Project with Firestore and Google Authentication enabled

### Environment Configuration
Copy `.env.example` to `.env`:

```bash
# Server-side Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Google Cloud Secret Manager configuration
USE_SECRET_MANAGER=false
GCP_PROJECT_ID=
GEMINI_SECRET_NAME=GEMINI_API_KEY

# Cloud Run execution port
PORT=3000
```

### Installation & Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Open your browser at `http://localhost:3000`.

### Production Build & Run
```bash
# Compile client and bundle Express server with esbuild
npm run build

# Start production server
npm run start
```

---

## ☁️ Google Cloud Run Deployment

MindVault AI is pre-configured for single-container Cloud Run deployment:

1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy directly via Cloud SDK:
   ```bash
   gcloud run deploy mindvault-ai \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="GEMINI_API_KEY=projects/PROJECT_ID/secrets/GEMINI_API_KEY:latest"
   ```

---

## 📄 License
Apache-2.0
