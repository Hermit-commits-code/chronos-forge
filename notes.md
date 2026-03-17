# 🛠 CHRONOS FORGE: ARCHITECTURAL LEDGER
*Last Updated: 2026-03-16*

---

## 🏗 THE STACK (Phase 1)
| Component | Technology | Role |
| :--- | :--- | :--- |
| **The Brain** | Golang (Gin) | High-speed API & Concurrency |
| **The Memory** | PostgreSQL | "Fort Knox" persistent data |
| **The Face** | Next.js 15 | Modern UI & React Compiler |
| **The Bridge** | REST / JSON | Communication between Face and Brain |

---

## 🧠 THE ARCHITECT'S BRIEFINGS (Key Concepts)

### 1. The 100% Rule
No feature is "Done" until it is:
1. **Stable:** Compiled without errors.
2. **Tested:** Verified by a Go Test (`_test.go`).
3. **Annotated:** Every line has an explanation for why it exists.

### 2. Pointers vs. Values (Golang)
* **Value (`time.Time`):** A rigid box. Must have data. Used for **Start** times.
* **Pointer (`*time.Time`):** An address to a box. Can be `nil` (NULL). Used for **End** times to represent a project currently in progress.

### 3. The Reserved Keyword Conflict
* **Problem:** SQL "owns" the word `end`. Using it as a column name causes syntax errors.
* **Solution:** Use "Quoted Identifiers" (`"end"`) in raw SQL strings to tell the database it's a column name, not a command.

### 4. Atomic Transactions
* **Logic:** When switching projects, we must **Stop** the old one and **Start** the new one at the exact same millisecond.
* **Mechanism:** `db.Transaction` ensures if the "Start" fails, the "Stop" is rolled back. No corrupted data.

---

## 🚦 SYSTEM PORTS
* **8080:** Go Backend (The Brain)
* **3000/3001:** Next.js Frontend (The Face)
* **5432:** PostgreSQL (The Memory)

---

## 🛠 RECOVERY COMMANDS
```bash
# Verify the Database
psql -h localhost -U postgres -d chronos_forge -c "SELECT * FROM time_entries;"

# Run the TDD Suite
go test -v ./backend/...
```
## 🌉 THE FACE-BRAIN BRIDGE (Deep Dive)

### 1. The Preflight (OPTIONS)
- **Concept:** Browsers send an 'OPTIONS' request before a 'POST' to verify safety.
- **The Protocol:** The server must return a '204 No Content' to satisfy this check.

### 2. Middleware Architecture
- **Concept:** A 'Middleman' function that intercepts requests.
- **Utility:** Handles security (CORS), logging, and authentication globally so individual routes stay "Thin" and clean.

### 3. Cross-Origin Identity
- **Logic:** Ports 3001 (Frontend) and 8080 (Backend) are seen as different "Origins."
- **Verification:** The 'Access-Control-Allow-Origin' header is the digital ID check that allows them to talk.

### 🎙 THE CONVERSATION LOG (Mental Models)
- **The Browser's Preflight:**
  - *Browser:* "Hey Port 8080, I have a sensitive JSON packet from Port 3001. Are you a stranger?"
  - *Go Backend:* "Nope, I have a Middleware 'ID Check' that says 3001 is a friend. Send it over."
  - *Status:* 204 (The silent 'Go ahead').

- **The Middleware Guard (JWT Preview):**
  - *User:* Clicks "Clock In."
  - *Middleware:* "Hold on. Before you talk to the Database, show me your JWT (Passport)."
  - *User:* "Here it is."
  - *Middleware:* "Passport is valid. You may enter the POST function."
  - *Architect's Note:* This prevents us from having to check the "Passport" inside every single function.

### 🏁 PHASE 1 COMPLETION CRITERIA
- **Verification:** No code enters 'main' without a passing test suite in both Go and TypeScript.
- **Documentation:** The 'Why' is logged before the 'How' is forgotten.
- **Isolation:** Features are forged in branches and merged only when 'Green'.

### 🚧 THE PORT TRAP (CORS)
- **Problem:** TDD passes, but the browser shows 'NetworkError'.
- **Root Cause:** The 'Access-Control-Allow-Origin' in Go must be an IDENTICAL match to the URL in the browser bar (including the Port).
- **The Lesson:** `localhost:3000` is NOT the same as `localhost:3001`. Always check the 'Network' tab in DevTools to see which port the browser is currently using.

### ✅ PHASE 1: FULL STACK SUCCESS
- **The Brain:** Go API correctly queries Postgres and returns JSON.
- **The Handshake:** CORS resolved for localhost:3000.
- **The Evidence:** Manual API verification shows active projects (end: null) and closed shifts.

### 🌊 THE STREAM RULE
- **Concept:** Response bodies (like from `fetch`) are streams that can only be read ONCE.
- **Error:** 'Body has already been consumed' means you called `.json()` or `.text()` twice on the same response object.
- **Solution:** Always parse the body into a variable first if you need to log it and use it.

### 🏆 MISSION COMPLETE: THE FOUNDATION
- **Logic:** Atomic toggle (Stop old/Start new) is verified in DB.
- **UI:** Real-time refresh and conditional styling (Active Pulse) are working.
- **Tests:** Vitest and Go test suites are Green.
- **Stability:** CORS and JSON Stream errors have been fully documented and patched.

### 🛠️ GIT OPS: THE BRANCH DRIFT
- **Scenario:** Development happened on 'main' instead of a feature branch.
- **Solution:** Committed directly to 'main' using Conventional Commits to preserve 'Green' state.
- **Lesson:** Always check `git branch` before striking the anvil, but don't panic if you're on 'main'—just commit and move forward.

## 🔐 PHASE 2: SECURITY & IDENTITY
### 1. The User Model
- **Concept:** Information Hiding. We use the `json:"-"` tag to ensure sensitive data (passwords) never reaches the browser.
- **Relational Data:** Every `TimeEntry` now belongs to a `User` via a `UserID` foreign key.

### 🔑 THE BCRYPT STANDARD
- **Hiding vs. Hashing:** `json:"-"` hides the data from the UI. Bcrypt transforms the data so even the Database Admin can't read the actual password.
- **Salt:** Bcrypt automatically adds a "salt" (random data) to the hash, ensuring that two users with the same password will have completely different hashes.

### 🏗️ PRODUCTION READINESS: ENV VARIABLES
- **Security:** Secrets are no longer hardcoded in `main.go`.
- **Tooling:** Using `godotenv` for local development parity with production environments.
- **Safety:** `.env` added to `.gitignore` to prevent credential leaks.

### ⏹️ UI FEATURE: THE KILL SWITCH
- **Logic:** Updated Go backend to interpret "STOP" as a termination command.
- **Ternary UI:** Frontend now swaps "Clock In" for "Clock Out" based on the active project state.
- **Database:** No new rows are created when clocking out, keeping history clean.

### 🏁 PHASE 2 COMPLETE: THE SECURE FORGE
- **Authentication:** Bcrypt hashing and JWT token issuance are live.
- **Middleware:** The backend now guards the 'Toggle' and 'History' routes.
- **Persistence:** JWT is stored in localStorage for seamless sessions.
- **UI/UX:** Login overlay implemented with branded input styling.

### 📊 PHASE 3: ANALYTICS & REFINEMENT
- **Summary API:** Created endpoint to calculate total daily work time.
- **Active Math:** Logic accounts for ongoing shifts in the total tally.
- **UI:** Added Daily Total display to the main dashboard header.

### 📈 PHASE 3: ANALYTICS & REFINEMENT
- **Progress Bar:** Implemented visual goal tracking (8hr default).
- **Manual Forge:** Added backend endpoint for retroactive time entry.
- **Validation:** Implemented logic to prevent "Time Paradoxes" (Start > End).

### 🛠️ FEATURE: RETROACTIVE FORGING
- **UI:** Implemented manual entry form with datetime-local inputs.
- **Conversion:** Frontend now handles ISO-8601 string conversion for Go compatibility.
- **UX:** Form uses "Progressive Disclosure" to stay hidden until needed.
