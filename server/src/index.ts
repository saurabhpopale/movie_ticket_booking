import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db.js';

import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import bookingRoutes from './routes/bookings.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup supporting CLIENT_URL from .env
const rawClientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;
const allowedOrigins = rawClientUrl
  ? rawClientUrl.split(',').map((u) => u.trim().replace(/\/+$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(cleanOrigin) ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// In production, serve the built client SPA if available
const cwd = process.cwd();
const possibleClientDistPaths = [
  path.resolve(cwd, 'client/dist'),
  path.resolve(cwd, '../client/dist'),
  path.resolve(__dirname, '../../client/dist'),
];
const clientDistPath = possibleClientDistPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  console.log(`📦 Serving static client files from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

import { Movie } from './models/Movie.js';
import { seedDatabase } from './seed.js';

const startServer = async () => {
  try {
    await connectDB();

    const movieCount = await Movie.countDocuments();
    if (movieCount === 0) {
      console.log('🎬 Initializing database with demo movies, users, and showtimes...');
      await seedDatabase(false);
    }

    app.listen(PORT, () => {
      console.log(`🚀 CinePass Server running on port ${PORT} [http://localhost:${PORT}]`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
