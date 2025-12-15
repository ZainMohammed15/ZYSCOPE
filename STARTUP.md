# 🚀 ZYSCOPE Startup Guide

## Quick Start

### Option 1: Automatic Start (Recommended)
```bash
# Terminal 1 - Backend
node server.js

# Terminal 2 - Frontend  
npm run dev -- --port 5173
```

**Visit:** http://localhost:5173

### Option 2: Production Build
```bash
npm run build
node server.js
# Serve dist/ folder from backend
```

## 📊 System Status

| Component | Port | Status |
|-----------|------|--------|
| Backend API | 3000 | ✅ Running |
| Frontend Dev | 5173 | ✅ Running |
| Database | SQLite | ✅ Operational |
| Countries | 195 | ✅ Loaded |

## 🎯 Key Pages

- **Home**: http://localhost:5173
- **Explore**: http://localhost:5173/explore
- **Compare**: http://localhost:5173/compare  
- **Reviews**: http://localhost:5173/reviews
- **Dashboard**: http://localhost:5173/dashboard
- **Profile**: http://localhost:5173/profile
- **Leaderboard**: http://localhost:5173/leaderboard

## ✨ Features

- 195+ interactive countries
- Comparison charts and analytics
- Community reviews with emoji support
- User profiles and leaderboards
- Dark theme UI
- Audio feedback system
- Real-time country data

## 🔧 Troubleshooting

**Port Already In Use?**
```bash
# Kill existing Node processes
Stop-Process -Name node -Force

# Then restart
node server.js
npm run dev -- --port 5173
```

**Frontend Not Loading?**
- Verify backend is running: http://localhost:3000/health
- Clear browser cache (Ctrl+Shift+Delete)
- Restart dev server

**Database Issues?**
- Delete `zyscope.sqlite` to reset
- Server will recreate it automatically

## 📦 Dependencies

- Node.js 16+
- Express
- React + Vite
- SQLite3
- Leaflet (maps)

Ready to explore! 🌍
