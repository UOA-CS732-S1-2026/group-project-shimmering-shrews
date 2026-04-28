import express from 'express';
import cors from 'cors';
import challengeRoute from './routes/challengeRoute';
import locationsRoute from './routes/locationRoute';
import authRoute from "./routes/authRoute"
import profileRoute from './routes/profileRoute'
import userRoute from "./routes/userRoute"
import { errorHandler } from './middleware/errorMiddleWare'

const allowedOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOriginPattern.test(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origin not allowed by CORS'))
  },
  credentials: true
}));
app.use(express.json());
app.use('/challenges', challengeRoute);

app.get('/', (_req, res) => {
  res.send('API is running for Shimmering Shrews pretty app!');
});

app.use('/locations', locationsRoute)
app.use("/api/auth", authRoute)
app.use('/api/profile', profileRoute)
app.use("/api/user", userRoute)

app.use(errorHandler);

export default app;
