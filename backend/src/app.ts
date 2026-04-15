import express from 'express';
import cors from 'cors';
import testRoute from './routes/testRoute';
import challengeRoute from './routes/challengeRoute';
import locationsRoute from './routes/locationsRoute';
import { errorHandler } from './middleware/errorMiddleWare'

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('API is running for Shimmering Shrews pretty app!');
});

app.use('/', testRoute);
app.use('/challenges', challengeRoute)
app.use('/locations-test', locationsRoute)

app.use(errorHandler);

export default app;