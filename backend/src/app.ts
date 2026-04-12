import express from 'express';
import cors from 'cors';
import testRoute from './routes/testRoute';
import challengeRoute from './routes/challengeRoute';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('API is running for Shimmering Shrews pretty app!');
});

app.use('/', testRoute);
app.use('/challenges', challengeRoute)

export default app;