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
