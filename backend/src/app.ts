import express from 'express';
import cors from 'cors';
import testRoute from './routes/testRoute';
import challengeRoute from './routes/challengeRoute';
import authRoute from "./routes/authRoute"
import userRoute from "./routes/userRoute"
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

app.get('/', (_req, res) => {
  res.send('API is running for Shimmering Shrews pretty app!');
});

app.use('/', testRoute);
app.use('/challenges', challengeRoute)
app.use("/api/auth", authRoute)
app.use("/api/user", userRoute)

app.use(errorHandler);

export default app;