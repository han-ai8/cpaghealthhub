import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import connectDB from './configs/db.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import appointmentRoutes from './routes/appointments.js';
import adminAppointmentRoutes from './routes/adminAppointmentRoutes.js';
import clinicRoutes from './routes/clinicRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js'; 
import { initializeSocket } from './socket/socket.js';
import clinicScheduleRoutes from './routes/clinicSchedule.js';
import sessionRoutes from './routes/sessionManagement.js';
import hivAnalyticsRoutes from './routes/hivAnalytics.js';
import NotificationService from './services/notificationService.js'; 
import adminManagementRoutes from './routes/adminManagement.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);
app.set('io', io);


const notificationService = new NotificationService(io);

app.set('io', io);
app.set('notificationService', notificationService);

// Connect to database
await connectDB();

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// CORS CONFIGURATION - FIXED
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'https://cpaghealthhub-qyuh.onrender.com',
  'https://api.cpaghealthhub.com',
  'https://www.cpaghealthhub.com',
  'https://cpaghealthhub.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));


// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// SESSION CONFIGURATION - FIXED DATABASE CASE
// ============================================
const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL;

if (!mongoUrl) {
  console.error('❌ MONGODB_URI is not defined!');
  process.exit(1);
}

// Ensure the database name matches the existing case (HealthHub not healthhub)
const correctedMongoUrl = mongoUrl.replace(/\/healthhub(\?|$)/, '/HealthHub$1');

const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: correctedMongoUrl,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60 // 7 days
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  },
  name: 'sessionId'
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/', (req, res) => res.json({ 
  status: 'Server is running',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString()
}));

// API health check
app.get('/api/health', (req, res) => res.json({ 
  status: 'ok',
  timestamp: new Date().toISOString()
}));

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminAppointmentRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clinic-schedule', clinicScheduleRoutes);
app.use('/api/hiv', hivAnalyticsRoutes);
app.use('/api/admin', adminManagementRoutes);
app.use('/api', apiRoutes);

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log('\n🚀 HealthHub Server Started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.io initialized and ready`);
  console.log(`🔔 Notification service initialized`);
  console.log(`🔗 Allowed origins:`, allowedOrigins);
  console.log('\n');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, closing server gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});