import express from 'express';
import cors from 'cors';
import testRoute from './routes/testRoute';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('API is running for Shimmering Shrews pretty app!');
});

app.use('/', testRoute);

export default app;