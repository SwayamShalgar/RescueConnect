# 🚨 RescueConnect - Community Crisis Response Platform

## 📋 Project Overview

**RescueConnect** is a comprehensive, full-stack disaster management and emergency response platform built with Next.js 15.3.3. The application provides real-time crisis communication, AI-powered disaster analysis, interactive mapping, and community coordination tools to help communities respond effectively to emergencies and natural disasters.

---

## 🎯 Core Purpose

RescueConnect serves as a centralized hub for:
- **Real-time Emergency Communication** - WebSocket-powered live chat
- **AI-Powered Disaster Analysis** - Google Gemini AI for image-based disaster assessment
- **Interactive Disaster Mapping** - NASA EONET API integration for global disaster tracking
- **Emergency Request Management** - User-staff coordination system
- **Volunteer Coordination** - Community response team management
- **Multi-language Support** - Google Translate integration for accessibility

---

## 🏗️ Technical Architecture

### **Frontend Stack**
- **Framework**: Next.js 15.3.3 (App Router)
- **React Version**: 19.0.0
- **Styling**: Tailwind CSS 4 with PostCSS
- **Animations**: Framer Motion 12.15.0
- **Icons**: React Icons 5.5.0
- **Mapping**: Leaflet 1.9.4 + React-Leaflet 5.0.0 + Leaflet Routing Machine

### **Backend Stack**
- **Database**: PostgreSQL (NeonDB - Serverless)
- **ORM/Query**: pg 8.16.0, @neondatabase/serverless 1.0.0
- **Authentication**: JWT (jsonwebtoken 9.0.2, jwt-decode 4.0.0)
- **Password Hashing**: bcrypt 6.0.0
- **WebSocket**: ws 8.18.2 + Express 5.1.0

### **Third-Party Integrations**
- **AI**: Google Gemini 2.5 Flash (Vision API)
- **Email Notifications**: Nodemailer 7.0.3 (Gmail SMTP)
- **Cloud Storage**: Cloudinary 2.6.1
- **Disaster Data**: NASA EONET API
- **Video Chat**: PeerJS 1.5.4
- **Phone Validation**: libphonenumber-js 1.12.8

### **Deployment**
- **Hosting**: Vercel (Serverless)
- **WebSocket Server**: Separate deployment required (Render/Railway/Heroku)
- **Database**: NeonDB (Serverless PostgreSQL with connection pooling)

---

## 📁 Project Structure

```
desistercrise/
├── src/app/                          # Next.js App Router
│   ├── page.js                       # Landing page
│   ├── layout.js                     # Root layout
│   ├── globals.css                   # Global styles
│   │
│   ├── api/                          # API Routes (Server-side)
│   │   ├── alerts/route.js           # Alert management
│   │   ├── requests/route.js         # Emergency request handling
│   │   ├── volunteers/route.js       # Volunteer management
│   │   ├── ai/
│   │   │   └── analyze-image/route.js  # Gemini AI image analysis
│   │   ├── staff/
│   │   │   ├── login/route.js        # Staff authentication
│   │   │   ├── signup/route.js       # Staff registration
│   │   │   ├── alerts/route.js       # Staff alert management
│   │   │   ├── requests/route.js     # Staff request management
│   │   │   └── volunteersdashboard/route.js
│   │   └── user/
│   │       ├── login/route.js        # User authentication
│   │       └── signup/route.js       # User registration
│   │
│   ├── components/                   # Reusable React Components
│   │   ├── DisasterMap.js            # Leaflet disaster map component
│   │   └── GoogleTranslate.js        # Language translation widget
│   │
│   ├── utils/                        # Utility Functions
│   │   ├── cities.js                 # City geolocation data
│   │   └── offlineStorage.js         # Offline sync & PWA support
│   │
│   ├── login/page.js                 # Landing page login
│   ├── signup/page.js                # Landing page signup
│   │
│   ├── user/                         # User-specific pages
│   │   ├── login/page.js             # User authentication page
│   │   └── signup/page.js            # User registration page
│   │
│   ├── userdashboard/page.js         # Main user dashboard (5 sections)
│   ├── volunteersdashboard/page.js   # Volunteer/Staff dashboard
│   │
│   ├── maps/page.js                  # Disaster mapping (NASA EONET)
│   ├── chat/page.js                  # Real-time WebSocket chat
│   ├── ai/page.js                    # AI text chat interface
│   └── ai-image/page.js              # AI image analysis interface
│
├── lib/                              # Core Libraries
│   ├── db.js                         # PostgreSQL connection pool
│   └── jwt.js                        # JWT token utilities
│
├── public/                           # Static Assets
│   ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
│
├── server.js                         # WebSocket server (port 8080)
├── package.json                      # Dependencies & scripts
├── next.config.mjs                   # Next.js configuration
├── jsconfig.json                     # JavaScript config
├── postcss.config.mjs                # PostCSS config
├── tailwind.config.js                # Tailwind CSS config (implied)
├── .env.local                        # Environment variables
└── README.md                         # Project documentation
```

---

## 🌟 Key Features

### 1. **User Dashboard** (`/userdashboard`)
A comprehensive 5-tab interface:
- **Request Tab**: Submit emergency assistance requests with location
- **Maps Tab**: View real-time disaster events from NASA EONET API
- **Alert Tab**: Receive and view community alerts
- **Live Chat**: Real-time WebSocket communication with group chat
- **AI Chat**: Navigate to AI image analysis page

### 2. **AI-Powered Disaster Analysis** (`/ai-image`)
- **Image Upload**: Drag-drop or file picker for disaster images
- **Google Gemini AI**: Advanced vision model (gemini-2.5-flash) analyzes images
- **Formatted Output**: Color-coded sections with structured guidance
  - 🔍 Disaster Type & Severity
  - ⚠️ Immediate Dangers
  - 🛡️ Safety Actions
  - 🆘 Emergency Response (evacuation, contacts, supplies)
  - 📋 Next Steps (recovery guidance)
- **Mobile Responsive**: Optimized for mobile devices
- **Location-Aware**: Integrates user's current location

### 3. **Interactive Disaster Map** (`/maps`)
- **NASA EONET Integration**: Real-time global disaster events
- **Leaflet Mapping**: Interactive pan/zoom with custom markers
- **Disaster Types**: Wildfires, storms, floods, earthquakes, volcanoes, etc.
- **Color-Coded Markers**: Visual severity indicators
- **User Location**: Geolocation-based positioning
- **Routing**: Calculate routes to/from disaster zones
- **Mobile Responsive**: Touch-friendly controls

### 4. **Real-Time Chat System** (`/chat`)
- **WebSocket Communication**: Low-latency messaging
- **Group Chat**: City-based and custom groups
- **User Presence**: Online user list
- **Message History**: Persistent chat logs
- **Reconnection Logic**: Auto-reconnect on disconnect
- **Mobile Responsive**: Scrollable chat interface

### 5. **Emergency Request Management**
- **User Requests**: Submit help requests with details
- **Staff Dashboard**: View and respond to requests
- **Status Tracking**: Pending/In Progress/Resolved states
- **Location-Based**: Coordinate responses by geography
- **Priority System**: Critical/High/Medium/Low

### 6. **Alert Broadcasting**
- **Staff Alerts**: Government/admin broadcast messages
- **User Alerts**: Community-wide notifications
- **Severity Levels**: Color-coded alert types
- **Real-Time Updates**: Instant notification delivery

### 7. **Volunteer Coordination**
- **Volunteer Dashboard**: Task assignment interface
- **Availability Tracking**: Online/offline status
- **Skill Matching**: Match volunteers to needs
- **Communication**: Direct messaging with users

### 8. **Multi-Language Support**
- **Google Translate Widget**: 100+ languages
- **Persistent Placement**: Available on all pages
- **Accessibility**: Ensures global reach

---

## 🔐 Authentication & Security

### **JWT-Based Authentication**
- **Token Generation**: Secure JWT tokens with expiry
- **Role-Based Access**: User vs Staff permissions
- **Password Security**: bcrypt hashing (salt rounds)
- **Session Management**: Token validation on protected routes

### **Database Security**
- **SSL Connections**: NeonDB with SSL/TLS
- **Connection Pooling**: Prevents connection exhaustion
- **SQL Injection Protection**: Parameterized queries

### **API Security**
- **Environment Variables**: Sensitive keys in .env.local
- **CORS Configuration**: Controlled API access
- **Rate Limiting**: (Recommended to implement)

---

## 🗄️ Database Schema

### **Users Table**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  city VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Requests Table**
```sql
CREATE TABLE requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  request_type VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Alerts Table**
```sql
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  message TEXT,
  severity VARCHAR(50),
  city VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);
```

### **Volunteers Table**
```sql
CREATE TABLE volunteers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  skills TEXT[],
  availability VARCHAR(50),
  status VARCHAR(50) DEFAULT 'available',
  assigned_requests INTEGER[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🌐 API Endpoints

### **Authentication**
- `POST /api/user/signup` - User registration
- `POST /api/user/login` - User authentication
- `POST /api/staff/signup` - Staff registration
- `POST /api/staff/login` - Staff authentication

### **Emergency Requests**
- `GET /api/requests` - Fetch all requests
- `POST /api/requests` - Create new request
- `PUT /api/requests/:id` - Update request status
- `DELETE /api/requests/:id` - Delete request

### **Alerts**
- `GET /api/alerts` - Fetch alerts (by city/severity)
- `POST /api/alerts` - Create alert (staff only)
- `GET /api/staff/alerts` - Staff alert management

### **Volunteers**
- `GET /api/volunteers` - List available volunteers
- `POST /api/volunteers` - Register as volunteer
- `PUT /api/volunteers/:id` - Update availability

### **AI Analysis**
- `POST /api/ai/analyze-image` - Analyze disaster image with Gemini AI
  - **Input**: Base64 image + optional prompt
  - **Output**: Structured disaster analysis

### **Staff Operations**
- `GET /api/staff/requests` - View all requests (staff view)
- `GET /api/staff/volunteersdashboard` - Volunteer coordination
- `PUT /api/staff/update-location` - Update staff location

---

## 🔌 WebSocket Server

### **Server Configuration** (`server.js`)
- **Port**: 8080 (configurable via `process.env.PORT`)
- **Protocol**: WebSocket (ws library)
- **Features**:
  - User join/leave events
  - Group chat creation
  - Message broadcasting
  - User presence tracking

### **Message Types**
```javascript
// Join a group
{ type: 'join', userId, username, city, group }

// Create a group
{ type: 'createGroup', groupName, username }

// Send a message
{ type: 'message', userId, username, text, city, group, timestamp }

// Server broadcasts
{ type: 'users', users: [...] }
{ type: 'groups', groups: [...] }
```

### **Deployment Notes**
- **Cannot run on Vercel** (serverless limitation)
- **Separate Hosting Required**: Render, Railway, or Heroku
- **Environment Variable**: `NEXT_PUBLIC_WS_URL` must point to WebSocket server
- **Fallback**: Defaults to `ws://localhost:8080` for development

---

## 🤖 AI Integration (Google Gemini)

### **Model**: gemini-2.5-flash
- **Type**: Vision model (image + text input)
- **Capabilities**: Multi-modal understanding, disaster recognition
- **Configuration**:
  - Temperature: 0.4 (balanced creativity/accuracy)
  - Max Tokens: 2048
  - Top K: 32, Top P: 1.0

### **Prompt Engineering**
Optimized for brevity and actionability:
```
🔍 DISASTER TYPE: [Type] | SEVERITY: [Low/Medium/High/Critical]
⚠️ IMMEDIATE DANGERS: [2-3 key hazards]
🛡️ SAFETY ACTIONS: [3-4 immediate actions]
🆘 EMERGENCY: [Evacuation guidance, contacts, supplies]
📋 NEXT STEPS: [2-3 short-term actions]
```

### **Response Formatting**
Custom React component parses emoji-delimited sections:
- Color-coded cards (blue, orange, red, green, purple)
- Border highlights for visual hierarchy
- Mobile-optimized typography
- Bullet point parsing

---

## 🌍 Environment Variables

### **Required Variables** (`.env.local`)
```bash
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT Authentication
JWT_SECRET=your_secret_key_here

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...  # Server-side
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...  # Client-side

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Notifications (Nodemailer - Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password  # Use Gmail App Password, not regular password

# Government Contact
GOVERNMENT_EMAIL=government@example.com

# WebSocket (Production)
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com
```

---

## 🚀 Deployment Guide

### **1. Vercel Deployment (Main App)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables → Add each variable
```

### **2. WebSocket Server (Separate Hosting)**

#### **Option A: Render**
1. Create new **Web Service**
2. Connect GitHub repository
3. **Build Command**: `npm install`
4. **Start Command**: `node server.js`
5. Set `PORT` environment variable (auto-assigned)
6. Copy WebSocket URL → Add to Vercel as `NEXT_PUBLIC_WS_URL`

#### **Option B: Railway**
```bash
# Install Railway CLI
npm i -g railway

# Login & deploy
railway login
railway init
railway up

# Link to project
railway link
```

#### **Option C: Heroku**
```bash
# Install Heroku CLI
npm i -g heroku

# Create app
heroku create rescueconnect-ws

# Deploy
git push heroku main

# Set port (auto-assigned)
heroku ps:scale web=1
```

### **3. Database (NeonDB)**
- Already configured in `.env.local`
- Connection pooling enabled
- SSL required for security

---

## 📱 Mobile Responsiveness

### **Responsive Design Patterns**
- **Tailwind Breakpoints**: `sm:`, `md:`, `lg:`, `xl:` prefixes
- **Flexible Layouts**: Flexbox and Grid with responsive columns
- **Touch-Friendly**: Large tap targets (min 44x44px)
- **Optimized Typography**: Scalable font sizes (`text-sm sm:text-base`)

### **Mobile-Specific Features**
- **Collapsible Navigation**: Hamburger menu on mobile
- **Swipe Gestures**: Touch-friendly map controls
- **Adaptive Cards**: Stack vertically on small screens
- **Image Optimization**: Compressed uploads (max 10MB)

### **Pages Optimized for Mobile**
- ✅ `/ai-image` - AI image analysis
- ✅ `/maps` - Disaster mapping
- ✅ `/chat` - Real-time chat
- ✅ `/userdashboard` - User dashboard
- ✅ `/volunteersdashboard` - Volunteer dashboard

---

## 🧪 Testing & Development

### **Run Development Server**
```bash
npm run dev
# Runs on http://localhost:3000 (Turbopack enabled)
```

### **Build for Production**
```bash
npm run build
npm start
```

### **Linting**
```bash
npm run lint
```

### **WebSocket Server (Local)**
```bash
node server.js
# Runs on ws://localhost:8080
```

---

## 🐛 Known Issues & Solutions

### **1. Chat Not Working on Vercel**
**Problem**: WebSocket server can't run on serverless Vercel.  
**Solution**: Deploy `server.js` separately (Render/Railway/Heroku) and set `NEXT_PUBLIC_WS_URL`.

### **2. AI Not Working on Mobile**
**Problem**: CORS or API key issues.  
**Solution**: 
- Ensure `GEMINI_API_KEY` is set in Vercel environment variables
- Check browser console for CORS errors
- Verify image size < 10MB

### **3. Map Not Loading**
**Problem**: Leaflet SSR conflict.  
**Solution**: Already fixed with `dynamic(() => import('...'), { ssr: false })`

### **4. Location Permission Denied**
**Problem**: Browser blocks geolocation.  
**Solution**: User must enable location services in browser settings.

### **5. Database Connection Issues**
**Problem**: SSL certificate errors.  
**Solution**: Set `ssl: { rejectUnauthorized: false }` in `lib/db.js`.

---

## 🔮 Future Enhancements

### **Planned Features**
1. **Push Notifications**: Service workers for real-time alerts
2. **Offline Mode**: PWA with offline data sync
3. **Video Chat**: PeerJS integration for video calls
4. **Analytics Dashboard**: Disaster statistics and heatmaps
5. **Multi-Platform**: Mobile apps (React Native)
6. **Blockchain**: Transparent donation tracking
7. **AR Integration**: Augmented reality disaster visualization
8. **Voice Commands**: Hands-free emergency requests
9. **Drone Integration**: Aerial disaster assessment
10. **Machine Learning**: Predictive disaster modeling

### **Technical Improvements**
- Rate limiting on API routes
- Redis caching for frequent queries
- CDN for static assets
- Automated testing (Jest, Cypress)
- CI/CD pipeline (GitHub Actions)
- Docker containerization
- Kubernetes orchestration

---

## 📚 Documentation Files

- **PROJECT_SUMMARY.md** - This comprehensive overview
- **README.md** - Quick start guide
- **CHAT_DEPLOYMENT.md** - WebSocket deployment guide (if exists)
- **GEMINI_AI_SETUP.md** - AI integration guide (if exists)

---

## 👥 User Roles & Permissions

### **User (Citizen)**
- Submit emergency requests
- View disaster maps
- Chat with community
- Analyze disaster images with AI
- Receive alerts

### **Staff (Emergency Personnel)**
- All user permissions
- Manage requests (assign, update, close)
- Broadcast alerts
- Coordinate volunteers
- View staff-only dashboards

### **Volunteer**
- User permissions + volunteer dashboard
- Accept assigned tasks
- Update task status
- Communicate with staff

### **Admin (Future)**
- All permissions
- User management
- System configuration
- Analytics access

---

## 🔧 Technology Decisions

### **Why Next.js 15?**
- App Router for modern routing
- Server Components for performance
- Built-in API routes
- Optimized image handling
- Vercel deployment integration

### **Why PostgreSQL (NeonDB)?**
- Serverless auto-scaling
- Connection pooling
- ACID compliance
- Geospatial queries
- Free tier for development

### **Why WebSocket over HTTP Polling?**
- Real-time communication (< 100ms latency)
- Reduced server load
- Bidirectional data flow
- Lower bandwidth usage

### **Why Google Gemini?**
- Multi-modal AI (image + text)
- Free tier with generous limits
- State-of-the-art vision models
- Low latency responses
- Reliable API uptime

### **Why Leaflet over Google Maps?**
- Open-source and free
- Lightweight (39KB gzipped)
- Customizable markers
- NASA EONET integration
- No API key required

---

## 📊 Performance Metrics

### **Target Performance**
- **Lighthouse Score**: 90+ (all categories)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **WebSocket Latency**: < 100ms
- **AI Response Time**: < 3s

### **Optimization Techniques**
- Code splitting with dynamic imports
- Image optimization (Next.js Image component)
- Lazy loading components
- Minified production builds
- CDN for static assets (Vercel)

---

## 🌐 Browser Support

- **Chrome**: 90+ ✅
- **Firefox**: 88+ ✅
- **Safari**: 14+ ✅
- **Edge**: 90+ ✅
- **Mobile Chrome**: 90+ ✅
- **Mobile Safari**: 14+ ✅

---

## 📞 Contact & Support

**Project Owner**: SwayamShalgar  
**Repository**: [RescueConnect](https://github.com/SwayamShalgar/RescueConnect)  
**Issues**: Use GitHub Issues for bug reports  
**Email**: shalgarswayam@gmail.com

---

## 📄 License

This project is currently **unlicensed**. Contact the owner for usage permissions.

---

## 🙏 Acknowledgments

- **NASA EONET** - Real-time disaster data
- **Google Gemini AI** - Image analysis capabilities
- **Vercel** - Hosting platform
- **NeonDB** - Serverless PostgreSQL
- **OpenStreetMap** - Mapping tiles for Leaflet
- **Gmail/Nodemailer** - Email notifications
- **Cloudinary** - Image storage

---

## 📈 Version History

### **v0.1.0** (Current)
- ✅ User authentication (JWT)
- ✅ Emergency request system
- ✅ Real-time chat (WebSocket)
- ✅ AI disaster analysis (Gemini)
- ✅ Interactive maps (NASA EONET)
- ✅ Alert broadcasting
- ✅ Volunteer coordination
- ✅ Multi-language support
- ✅ Mobile responsive design

---

## 🎯 Success Metrics

### **Key Performance Indicators (KPIs)**
- **User Adoption**: 1,000+ registered users (goal)
- **Response Time**: < 5 minutes average staff response
- **AI Accuracy**: 85%+ disaster classification accuracy
- **Uptime**: 99.5% platform availability
- **User Satisfaction**: 4.5+ stars (goal)

---

## 🚨 Emergency Contacts (Hardcoded in App)

```javascript
const EMERGENCY_CONTACTS = {
  police: '911',
  fire: '911',
  ambulance: '911',
  disasterHotline: '1-800-DISASTER',
  redCross: '1-800-RED-CROSS',
  fema: '1-800-621-FEMA',
};
```

---

## 🏁 Quick Start Summary

```bash
# 1. Clone repository
git clone https://github.com/SwayamShalgar/RescueConnect.git
cd RescueConnect

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run database migrations (if any)
# [Migration commands if applicable]

# 5. Start WebSocket server
node server.js &

# 6. Start Next.js dev server
npm run dev

# 7. Open browser
# http://localhost:3000
```

---

**Built with ❤️ by SwayamShalgar for safer communities worldwide** 🌍🚨

*Last Updated: October 8, 2025*
