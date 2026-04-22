import express from 'express';
import cors from 'cors';
import challengeRoute from './routes/challengeRoute';
import locationsRoute from './routes/locationRoute';
import authRoute from "./routes/authRoute"
import { errorHandler } from './middleware/errorMiddleWare'

const allowedOrigins = [
  "http://localhost:5173",
]

const app = express();

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use('/challenges', challengeRoute);

app.get('/', (_req, res) => {
  res.send('API is running for Shimmering Shrews pretty app!');
});

app.use('/locations', locationsRoute)
app.use("/api/auth", authRoute)

app.use(errorHandler);

export default app;
