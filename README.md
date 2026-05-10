# 🛡️ OS Security Vulnerability Detection Framework

A full-stack cybersecurity final year project built with **Node.js**, **Express**, **MongoDB**, and **Socket.IO**.

---

## 🚀 Quick Deploy on Vercel

### Step 1 — MongoDB Atlas (Free)
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free cluster
2. Create a database user (username + password)
3. Allow all IPs: `0.0.0.0/0` under Network Access
4. Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/os_security_db`

### Step 2 — Deploy on Vercel
1. Push this folder to a **GitHub repo**
2. Go to [vercel.com](https://vercel.com) → Import repository
3. Add these **Environment Variables** in Vercel dashboard:

| Variable | Value |
|----------|-------|
| `MONGO_URI` | `mongodb+srv://...` (Atlas string) |
| `JWT_SECRET` | Any random 32+ char string |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `VERCEL` | `1` |

4. Click **Deploy** ✓

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET

# 3. Seed database (creates demo users)
node seed.js

# 4. Start dev server
npm run dev

# Open: http://localhost:5000
```

## 🔑 Login Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ossecurity.com | admin123 |
| User | analyst@ossecurity.com | analyst123 |

---

## 📁 Project Structure

```
os-security-framework/
├── server.js              ← Entry point (Vercel + local)
├── app.js                 ← Express app + routes
├── seed.js                ← DB seeder
├── vercel.json            ← Vercel deployment config
├── package.json
│
├── routes/                ← API route definitions
├── controllers/           ← Business logic
├── models/                ← Mongoose schemas
├── middlewares/           ← JWT auth + RBAC
├── sockets/               ← Socket.IO events
│
└── public/                ← Frontend (HTML, CSS, JS)
    ├── css/style.css
    ├── js/app.js
    ├── login.html
    ├── dashboard.html
    ├── attacks.html
    ├── monitoring.html
    ├── processes.html
    ├── memory.html
    ├── ipc.html
    ├── ai.html
    └── reports.html
```

---

## ✨ Features

- **10 Attack Simulations**: Buffer Overflow, Trapdoor, Backdoor, Cache Poisoning, Malware, Deadlock, CPU Starvation, Unauthorized Access, Suspicious IPC, Memory Abuse
- **CPU Scheduling**: FCFS, SJF, Round Robin, Priority with Gantt charts
- **Memory Management**: FIFO, LRU, Optimal page replacement + Segmentation
- **IPC Simulation**: Pipes, Shared Memory, Message Queues, Producer-Consumer, Dining Philosophers
- **AI Prevention Tips**: Expert security recommendations per attack type
- **Real-time Monitoring**: CPU/Memory charts, live alerts via Socket.IO
- **Report Generation**: Downloadable security reports
- **JWT Authentication**: RBAC with Admin and User roles

---

## 🌐 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Auth | JWT + bcryptjs |
| Deployment | Vercel |
