# Local Installation, Deployment & User Operations Manual

## 1. System Requirements & Prerequisites
Ensure the target machine has the following installed:
- **Operating System:** Windows 10/11, macOS, or Linux
- **Python:** Version 3.10 or higher (Python 3.13 tested)
- **Node.js:** Version 18.0 or higher (Node v24 tested)
- **Package Managers:** `pip` and `npm`

---

## 2. Step-by-Step Installation Instructions

### Step 1: Open the Project Directory
```bash
cd MicroTask
```

### Step 2: Configure the Backend Environment
1. Create a Python virtual environment:
   ```bash
   python -m venv backend/venv
   ```
2. Activate the virtual environment:
   - **Windows PowerShell:**
     ```powershell
     .\backend\venv\Scripts\Activate.ps1
     ```
   - **Windows Command Prompt (cmd):**
     ```cmd
     .\backend\venv\Scripts\activate.bat
     ```
   - **macOS / Linux:**
     ```bash
     source backend/venv/bin/activate
     ```
3. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

### Step 3: Initialize & Seed the Relational Database
Populate SQLite with realistic software engineering tasks, defect histories, and team accounts:
```bash
python backend/scripts/seed_data.py
```
*(You will see: `Database successfully seeded with realistic demonstration records.`)*

### Step 4: Install Frontend Dependencies
In a separate terminal or root window:
```bash
cd frontend
npm install
cd ..
```

---

## 3. Launching the Application Locally

### Terminal 1: Launch the Backend API Service (Port 5000)
```powershell
.\backend\venv\Scripts\python .\backend\run.py
```
- API will be accessible at: `http://127.0.0.1:5000/api`
- Health check endpoint: `http://127.0.0.1:5000/api/health`

### Terminal 2: Launch the Frontend Dev Server (Port 5173)
```powershell
cd frontend
npm run dev
```
- Web Application will be accessible at: **`http://localhost:5173`**

---

## 4. Demo Account Credentials (Viva Ready)

All demo accounts share the password: **`Demo@12345`**

| Role | Username | Full Name | Primary Capabilities |
|---|---|---|---|
| **Administrator** | `admin` | Dr. Sarah Jenkins | Full system settings, user creation, seed reset |
| **Project Manager** | `pm_alex` | Alex Morgan | Task creation, assignment, reports, CSV export |
| **Team Member** | `dev_priya` | Priya Sharma | Task execution, status updates, defect reporting |
| **Team Member** | `dev_john` | John Doe | Full-stack engineering, work logging |

*(Tip: The login screen includes 1-click quick-fill buttons for Admin, Manager, and Developer for fast viva demonstration).*

---

## 5. Executing the Automated Tests
To run the automated Pytest test suite verifying authentication, metrics arithmetic, and boundary cases:
```powershell
.\backend\venv\Scripts\pytest backend\tests -v
```

---

## 6. Limitations & Future Enhancements

### Current Limitations
- **Local Storage Engine:** Currently relies on SQLite (optimal for college submissions and local setups; not designed for high-concurrency multi-node clusters).
- **Single Currency Hours:** Effort tracking is denominated purely in decimal hours.

### Future Enhancements
1. **Git Webhook Integration:** Automate task transitions when pull requests are merged on GitHub or GitLab.
2. **Burndown & Velocity Charts:** Add story point burn-up/burn-down projections.
3. **PostgreSQL / MySQL Connector:** Add database connection switching for enterprise deployments.
4. **WebSocket Push Notifications:** Upgrade from HTTP polling to bidirectional WebSockets.
