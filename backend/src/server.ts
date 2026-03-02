import express, { Request, Response } from 'express';
import cors from 'cors';
import identityRouter from './routes/identity';
import authRouter from './routes/auth';
import syncRouter from './routes/sync';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Global middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/sync', syncRouter);
app.use('/identity', identityRouter);

/**
 * @route GET /health
 * @desc Service status check
 * @access Public
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'So1ana Public Identity API',
  });
});

// Error handling for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist' });
});

app.listen(PORT, () => {
  console.log(`[So1ana-API] Server is running on port ${PORT}`);
});
