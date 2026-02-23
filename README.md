# 🥗 QeviDiet — AI-Powered Diet Planner

> Personalized weekly meal plans powered by BMR/TDEE science and AI nutrition intelligence.

![QeviDiet Dashboard](https://img.shields.io/badge/Stack-Next.js%20%7C%20Node.js%20%7C%20Supabase-00d4ff?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-00ff87?style=for-the-badge)

---

## ✨ Features

- 🧠 **AI-Powered Meal Plans** — 7-day personalized plans using Mifflin-St Jeor formula
- 📊 **BMR & TDEE Calculator** — scientifically accurate calorie targets
- 🥩 **Macro Tracking** — protein, carbs & fat optimised for your goal
- 🍽️ **Food Log** — log meals with search from food database
- 📈 **Progress Dashboard** — weight trends, charts, weekly compliance
- 🔐 **JWT Auth** — secure registration & login
- 📱 **Fully Responsive** — works on mobile, tablet & desktop

## 🎯 Supported Goals

| Goal | Description |
|------|-------------|
| 🔥 Fat Loss | −500 kcal deficit |
| 💪 Muscle Gain | +300 kcal surplus |
| ⚡ Lean Body | Body recomposition |
| 🏆 Good Physique | −200 kcal mild deficit |
| ⚖️ Maintenance | TDEE matched |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React, Framer Motion, Recharts |
| Backend | Node.js, Express.js, JWT Auth |
| Database | Supabase (PostgreSQL) |
| Styling | Vanilla CSS, glassmorphism dark theme |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone the repository
```bash
git clone https://github.com/arunrajkp/QeviFit.git
cd QeviFit
```

### 2. Set up the database
1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard)
2. Copy and run `backend/scripts/schema.sql`
3. Make sure to run: `ALTER TABLE users DISABLE ROW LEVEL SECURITY;` (and other tables)

### 3. Configure environment variables

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Fill in your Supabase URL, anon key, and service_role key
```

**Frontend** (`frontend/.env.local`):
```bash
cp frontend/.env.local.example frontend/.env.local
# Fill in your Supabase URL and anon key
```

### 4. Install dependencies & run

```bash
# Backend
cd backend
npm install
npm run dev   # runs on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev   # runs on http://localhost:3001
```

### 5. Open the app
Visit **http://localhost:3001** — register and complete onboarding!

---

## 📁 Project Structure

```
QeviFit/
├── backend/
│   ├── config/         # Supabase client
│   ├── middleware/      # JWT auth middleware
│   ├── routes/         # API routes (auth, profile, diet, logs, nutrition)
│   ├── scripts/        # Schema SQL, setup scripts
│   ├── utils/          # Nutrition calculation engine
│   └── server.js
└── frontend/
    ├── src/
    │   ├── app/        # Next.js pages (dashboard, auth, onboarding)
    │   ├── context/    # Auth context
    │   └── lib/        # API client
    └── public/
```

---

## 📄 License

MIT © 2026 QeviDiet
