import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import connectDB from './configs/db.js';
import authRoutes from './routes/auth.js';

const app = express();

// Connect to MongoDB
await connectDB();

// CORS configuration - IMPORTANT: must allow credentials
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Vite default port
  credentials: true // Allow cookies to be sent
}));

app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in production
    sameSite: 'lax'
  }
}));

app.get('/', (req, res) => res.send('Server is running'));

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));