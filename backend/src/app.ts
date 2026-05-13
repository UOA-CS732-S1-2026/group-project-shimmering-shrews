import express from 'express';
import cors from 'cors';
import challengeRoute from './routes/challengeRoute';
import locationsRoute from './routes/locationRoute';
import authRoute from "./routes/authRoute"
import profileRoute from './routes/profileRoute'
import userRoute from "./routes/userRoute"
import { errorHandler } from './middleware/errorMiddleWare'
import userChallengeRoute from './routes/userChallengeRoute';

// Matches any localhost or 127.0.0.1 origin regardless of port. Used for development.
const allowedOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/

// Production frontend URLs loaded from environment variable as a comma-separated list.
const productionOrigins =
  process.env.WEBSERVER_URLS?.split(',').map(origin => origin.trim()) || [];

const app = express();

// Configure CORS to allow requests from the frontend in both development and production.
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost in development
    if (
      process.env.NODE_ENV !== 'production' &&
      allowedOriginPattern.test(origin)
    ) {
      return callback(null, true);
    }

    // Allow configured production frontend URLs
    if (
      process.env.NODE_ENV === 'production' &&
      productionOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'))
  },
  credentials: true
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Route definitions
app.use('/challenges', challengeRoute);
app.use('/user-challenges', userChallengeRoute);

// Health check endpoint
app.get('/', (_req, res) => {
  res.send('API is running for Shimmering Shrews pretty app!');
});

app.use('/locations', locationsRoute)
app.use("/api/auth", authRoute)
app.use('/api/profile', profileRoute)
app.use("/api/user", userRoute)

// Global error handler — must be registered last
app.use(errorHandler);

export default app;