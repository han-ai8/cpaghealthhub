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
import adminAppointmentRoutes from './routes/adminAppointments.js';
import clinicRoutes from './routes/clinicRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { initializeSocket } from './socket/socket.js';
import clinicScheduleRoutes from './routes/clinicSchedule.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const server = http.createServer(app);
const io = initializeSocket(server);
app.set('io', io);


// Connect to MongoDB
await connectDB();

// Serve static uploads folder for images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ FIXED CORS configuration - return the origin instead of just 'true'
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:5000'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    console.log('Request origin:', origin);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      // Return the origin that made the request
      return callback(null, origin);
    } else {
      console.warn('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin']
}));

// ✅ Body parser - MUST BE BEFORE ROUTES!
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/users', userRoutes);
app.use('/api/clinic-schedule', clinicScheduleRoutes);
// ✅ Separate session middleware for USER and ADMIN
app.use((req, res, next) => {
  const isAdminRoute = req.path.startsWith('/api/admin') || 
                       req.path.startsWith('/api/auth/admin');
  
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    },
    name: isAdminRoute ? 'admin.sid' : 'user.sid'
  };
  
  session(sessionConfig)(req, res, next);
});

// Debug middleware
app.use((req, res, next) => {
  console.log('Request to:', req.method, req.path, 'Session ID:', req.sessionID, 'User ID:', req.session?.userId, 'Role:', req.session?.role);
  next();
});

// Health check
app.get('/', (req, res) => res.send('Server is running'));

// ✅ Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminAppointmentRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api', apiRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/messages', messageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io initialized and ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});