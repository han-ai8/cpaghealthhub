import express from 'express';
import http from 'http';
import cors from 'cors';
import 'dotenv/config';
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

const notificationService = new NotificationService(io);

app.set('io', io);
app.set('notificationService', notificationService);

// Connect to database
await connectDB();

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// CORS CONFIGURATION
// ============================================
app.use(cors({
  origin: function (origin, callback) {
    // Get allowed origins from environment variable or use defaults
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',')
      : [
          'https://www.cpaghealthhub.com',
          'https://cpaghealthhub.com',
          'http://localhost:5173',
          'http://localhost:5000'
        ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, origin);
    } else {
      console.log('❌ Blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// SESSION CONFIGURATION
// ============================================
app.use((req, res, next) => {
  const isAdminRoute = req.path.startsWith('/api/admin') || 
                       req.path.startsWith('/api/auth/admin');
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: isAdminRoute ? 'admin_sessions' : 'user_sessions'
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: isProduction, // true in production for HTTPS
      sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin in production
      domain: isProduction ? '.cpaghealthhub.com' : undefined // Share across subdomains
    },
    name: isAdminRoute ? 'admin.sid' : 'user.sid'
  };
  
  session(sessionConfig)(req, res, next);
});

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
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\n🚀 HealthHub Server Started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.io initialized and ready`);
  console.log(`🔔 Notification service initialized`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Frontend: https://www.cpaghealthhub.com`);
    console.log(`🔗 API: https://api.cpaghealthhub.com`);
  } else {
    console.log(`🌐 Frontend: http://localhost:5173`);
    console.log(`🔗 API: http://localhost:${PORT}`);
  }
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