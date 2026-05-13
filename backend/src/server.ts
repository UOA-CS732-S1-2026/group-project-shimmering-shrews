import dotenv from 'dotenv';

// Load environment variables before importing app to ensure they are available at startup
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 5001;

// Start the Express server on the configured port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});