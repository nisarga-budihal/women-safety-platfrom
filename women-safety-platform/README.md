# 🛡️ SafeGuard — Women Safety & Emergency Assistance Platform

A full-stack web application enabling women to instantly request emergency help, share real-time location, and connect with nearby verified volunteers.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Tech Stack](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![Tech Stack](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb)
![Tech Stack](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io)
![Tech Stack](https://img.shields.io/badge/TailwindCSS-Styling-06B6D4?logo=tailwindcss)

---

## 🚀 Features

### 👩 User Module
- ✅ User registration & JWT authentication
- ✅ Personal safety profile management
- ✅ Emergency contacts (add/edit/delete)
- ✅ **One-click SOS button** with animated UI
- ✅ Live GPS location sharing via maps
- ✅ View nearby volunteers
- ✅ Emergency alert history dashboard
- ✅ **Panic button** (simulated shake detection)
- ✅ Live chat with volunteers

### 🚑 Volunteer Module
- ✅ Volunteer registration with ID verification
- ✅ Receive nearby SOS alerts in real-time
- ✅ Accept / decline emergency requests
- ✅ View user location and incident details
- ✅ Navigation to victim via map
- ✅ Availability toggle (online/offline)
- ✅ Response statistics and rating

### 🛡️ Admin Module
- ✅ Dashboard with KPI analytics
- ✅ Emergency trend charts
- ✅ User management (activate/deactivate)
- ✅ Volunteer verification workflow
- ✅ Emergency monitoring with detail view

### ⚡ Real-Time Features
- ✅ Socket.IO for instant SOS alerts
- ✅ Live location tracking
- ✅ Real-time chat between user & volunteer
- ✅ Notification sounds for SOS alerts
- ✅ SMS alerts to emergency contacts (simulated)

---

## 🗂️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Real-time | Socket.IO |
| Maps | Leaflet.js + OpenStreetMap |
| Auth | JWT (JSON Web Tokens) |
| Charts | Recharts |
| Icons | Lucide React |
| Animations | Framer Motion |
| Notifications | React Hot Toast |

---

## 📦 Prerequisites

- **Node.js** v18+ (https://nodejs.org)
- **MongoDB** v6+ running locally, OR a MongoDB Atlas connection string
  - [Install MongoDB Community](https://www.mongodb.com/docs/manual/installation/)
  - OR [Create free Atlas cluster](https://www.mongodb.com/atlas)
- **Git** (optional)

---

## ⚙️ Setup Instructions

### 1️⃣ Clone / Navigate to the project

```bash
cd women-safety-platform
```

### 2️⃣ Setup Backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp ../.env.example .env
# Edit .env if needed (MongoDB URI, JWT secret, etc.)

# Seed the database with demo accounts
npm run seed

# Start development server
npm run dev
```

The backend will run at **http://localhost:5000**

### 3️⃣ Setup Frontend

```bash
# Open a new terminal, navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run at **http://localhost:5173**

### 4️⃣ Open in Browser

Visit **http://localhost:5173** and use the demo accounts:

| Role | Email | Password |
|------|-------|----------|
| 👩 User | `user@safeguard.com` | `user123` |
| 🚑 Volunteer | `volunteer@safeguard.com` | `volunteer123` |
| 🛡️ Admin | `admin@safeguard.com` | `admin123` |

---

## 🗄️ Database Schema

### User
```
{
  name: String,
  email: String (unique),
  phone: String,
  password: String (bcrypt hashed),
  role: 'user' | 'volunteer' | 'admin',
  emergencyContacts: [{ name, phone, relationship }],
  location: { type: 'Point', coordinates: [lng, lat] },
  isActive: Boolean,
  lastSeen: Date
}
```

### Volunteer
```
{
  userId: ObjectId → User,
  idVerification: { documentType, documentNumber, status, verifiedAt },
  availability: Boolean,
  location: { type: 'Point', coordinates },
  responseCount: Number,
  avgResponseTime: Number,
  rating: Number,
  specializations: [String],
  bio: String
}
```

### Emergency
```
{
  userId: ObjectId → User,
  location: { type: 'Point', coordinates },
  status: 'pending' | 'accepted' | 'in_progress' | 'resolved' | 'cancelled',
  assignedVolunteer: ObjectId → User,
  description: String,
  emergencyType: String,
  locationHistory: [{ coordinates, timestamp }],
  chatMessages: [{ sender, message, timestamp }],
  responseTime: Number (seconds),
  resolvedAt: Date
}
```

---

## 🔌 API Endpoints

See [API_DOCS.md](API_DOCS.md) for complete API documentation.

### Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user/volunteer |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile |
| POST | `/api/emergency/sos` | Trigger SOS |
| GET | `/api/emergency/active` | Active emergency |
| PUT | `/api/volunteer/availability` | Toggle availability |
| GET | `/api/admin/dashboard` | Admin analytics |

---

## 🚀 Deployment

### Option 1: Railway / Render

1. Push code to GitHub
2. Connect backend repo to Railway/Render
3. Set environment variables
4. Deploy frontend to Vercel/Netlify

### Option 2: VPS (DigitalOcean, AWS EC2)

```bash
# Build frontend
cd client && npm run build

# Server serves built frontend
# Set NODE_ENV=production
# Use PM2 for process management
npm install -g pm2
cd server
pm2 start server.js --name safeguard-api
```

### Environment Variables (Production)

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/women-safety
JWT_SECRET=<strong-random-secret>
JWT_EXPIRE=7d
CLIENT_URL=https://your-frontend-domain.com
NODE_ENV=production
```

---

## 🔒 Security Notes

- ⚠️ Change `JWT_SECRET` in production
- ⚠️ Change default admin password after deployment
- ⚠️ Enable HTTPS in production
- ⚠️ Add rate limiting for API routes
- ⚠️ Implement CORS whitelist for production domain

---

## 📈 Future Enhancements

- 📱 React Native mobile app
- 🤖 AI-based danger prediction
- 🎤 Voice-activated SOS
- 🚔 Police system integration
- 📲 Twilio SMS integration
- 🔔 Push notifications
- 📊 Advanced analytics
- 🌍 Multi-language support

---

## 📄 License

MIT License — Free for educational and commercial use.
