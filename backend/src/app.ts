import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { ENV } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import conversationRoutes from './modules/conversation/conversation.routes';
import { globalErrorHandler } from './middleware/error.middleware';
import { globalLimiter, authLimiter } from './middleware/rateLimiter';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: ENV.FRONTEND_URL,
    credentials: true,
  }),
);

// Global rate limit
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// NoSQL injection & HTTP parameter pollution protection
app.use(mongoSanitize());
app.use(hpp());

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);

// Global error handler
app.use(globalErrorHandler);

export default app;
