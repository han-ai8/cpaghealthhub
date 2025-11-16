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

await connectDB();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:5000'];
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, origin);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    },
    name: isAdminRoute ? 'admin.sid' : 'user.sid'
  };
  
  session(sessionConfig)(req, res, next);
});

app.use((req, res, next) => {
  console.log('Request to:', req.method, req.path);
  next();
});

app.get('/', (req, res) => res.send('Server is running'));

// Routes mounting
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

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 running `);
  console.log(`📡 initialized and ready`);
  console.log(`🔔 initialized`); // ✅ NEW
  console.log(`🌍 Environment: 'development'}`);
});

process.on('unhandledRejection', (err) => {
  server.close(() => process.exit(1));
});