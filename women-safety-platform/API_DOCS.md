# 📡 SafeGuard API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require `Authorization: Bearer <token>` header.

---

## 🔐 Authentication

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+91-9876543210",
  "password": "securepass",
  "role": "user"          // "user" or "volunteer"
}

// Volunteer additional fields:
{
  ...
  "role": "volunteer",
  "documentType": "aadhar",
  "documentNumber": "1234-5678-9012",
  "specializations": ["first_aid", "general"],
  "bio": "Community helper"
}

Response 201:
{
  "token": "jwt.token.here",
  "user": { "_id", "name", "email", "phone", "role", ... }
}
```

### Login
```
POST /api/auth/login

{ "email": "jane@example.com", "password": "securepass" }

Response 200:
{ "token": "jwt.token.here", "user": { ... } }
```

### Get Profile
```
GET /api/auth/me
Authorization: Bearer <token>

Response 200:
{ "user": { "_id", "name", "email", "role", "emergencyContacts", "location", ... } }
```

### Update Profile
```
PUT /api/auth/profile
Authorization: Bearer <token>

{ "name": "Jane Updated", "phone": "+91-1111111111" }
```

### Update Emergency Contacts
```
PUT /api/auth/emergency-contacts
Authorization: Bearer <token>

{
  "emergencyContacts": [
    { "name": "Mom", "phone": "+91-1234567890", "relationship": "Parent" },
    { "name": "Best Friend", "phone": "+91-0987654321", "relationship": "Friend" }
  ]
}
```

### Update Location
```
PUT /api/auth/location
Authorization: Bearer <token>

{ "coordinates": [77.5946, 12.9716] }  // [longitude, latitude]
```

---

## 🚨 Emergency

### Trigger SOS
```
POST /api/emergency/sos
Authorization: Bearer <token>

{
  "coordinates": [77.5946, 12.9716],
  "description": "Need help immediately",
  "emergencyType": "harassment"  // harassment|stalking|assault|accident|medical|other
}

Response 201:
{
  "message": "SOS alert triggered successfully",
  "emergency": { ... },
  "nearbyVolunteers": 5
}
```

### Get Active Emergency
```
GET /api/emergency/active
Authorization: Bearer <token>

Response 200:
{ "emergency": { ... } or null }
```

### Get History
```
GET /api/emergency/history?page=1&limit=10
Authorization: Bearer <token>

Response 200:
{ "emergencies": [...], "page": 1, "pages": 3, "total": 25 }
```

### Update Live Location
```
PUT /api/emergency/:id/location
Authorization: Bearer <token>

{ "coordinates": [77.5950, 12.9720] }
```

### Cancel Emergency
```
PUT /api/emergency/:id/cancel
Authorization: Bearer <token>

{ "reason": "False alarm" }
```

### Resolve Emergency
```
PUT /api/emergency/:id/resolve
Authorization: Bearer <token>
```

### Send Chat Message
```
POST /api/emergency/:id/chat
Authorization: Bearer <token>

{ "message": "I'm near the bus stop" }
```

---

## 🚑 Volunteer

### Register as Volunteer
```
POST /api/volunteer/register
Authorization: Bearer <token>

{
  "documentType": "aadhar",
  "documentNumber": "1234-5678-9012",
  "specializations": ["first_aid"],
  "bio": "Experienced first responder"
}
```

### Get Profile
```
GET /api/volunteer/profile
Authorization: Bearer <token>  (role: volunteer)
```

### Toggle Availability
```
PUT /api/volunteer/availability
Authorization: Bearer <token>  (role: volunteer)

Response: { "availability": true/false }
```

### Get Nearby Alerts
```
GET /api/volunteer/alerts
Authorization: Bearer <token>  (role: volunteer)

Response: { "emergencies": [...] }
```

### Accept Emergency
```
PUT /api/volunteer/:emergencyId/accept
Authorization: Bearer <token>  (role: volunteer)
```

### Decline Emergency
```
PUT /api/volunteer/:emergencyId/decline
Authorization: Bearer <token>  (role: volunteer)
```

### Update Location
```
PUT /api/volunteer/location
Authorization: Bearer <token>  (role: volunteer)

{ "coordinates": [77.5946, 12.9716] }
```

---

## 🛡️ Admin

All admin routes require `role: admin`.

### Dashboard Analytics
```
GET /api/admin/dashboard
Authorization: Bearer <token>

Response: {
  "stats": { totalUsers, totalVolunteers, verifiedVolunteers, activeEmergencies, avgResponseTime, ... },
  "recentEmergencies": [...],
  "dailyTrend": [...],
  "typeDistribution": [...]
}
```

### List Users
```
GET /api/admin/users?page=1&search=jane&role=user
Authorization: Bearer <token>
```

### List Volunteers
```
GET /api/admin/volunteers?status=pending
Authorization: Bearer <token>
```

### Verify Volunteer
```
PUT /api/admin/volunteer/:id/verify
Authorization: Bearer <token>

{ "status": "verified" }  // or "rejected" with "rejectionReason"
```

### List Emergencies
```
GET /api/admin/emergencies?status=pending&page=1
Authorization: Bearer <token>
```

### Toggle User Status
```
PUT /api/admin/user/:id/toggle
Authorization: Bearer <token>
```

---

## 📡 Socket.IO Events

Connect: `io(SERVER_URL, { auth: { token: 'jwt_token' } })`

### Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `sos:alert` | Server → Client | `{ emergencyId, userName, userPhone, location, description }` |
| `sos:accepted` | Server → User | `{ emergencyId, volunteer: { name, phone } }` |
| `location:update` | Bidirectional | `{ emergencyId, coordinates, timestamp }` |
| `chat:message` | Bidirectional | `{ emergencyId, sender, message, timestamp }` |
| `emergency:resolved` | Server → All | `{ emergencyId, responseTime }` |
| `emergency:cancelled` | Server → All | `{ emergencyId }` |
| `emergency:taken` | Server → Volunteers | `{ emergencyId }` |
| `emergency:join` | Client → Server | `emergencyId` |
| `emergency:leave` | Client → Server | `emergencyId` |

---

## 🔒 Error Responses

```json
// 400 Bad Request
{ "message": "Validation error description" }

// 401 Unauthorized
{ "message": "Not authorized — no token provided" }

// 403 Forbidden
{ "message": "Access denied. Required role(s): admin" }

// 404 Not Found
{ "message": "Resource not found" }

// 500 Internal Server Error
{ "message": "Server error" }
```

---

## 📊 Health Check

```
GET /api/health

Response: { "status": "ok", "timestamp": "...", "uptime": 12345 }
```
