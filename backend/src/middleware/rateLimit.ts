import { Request, Response, NextFunction } from 'express';

const WINDOW_SIZE_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

const ipRequestMap = new Map<string, { count: number; lastReset: number }>();

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();

  const record = ipRequestMap.get(ip);

  if (!record || now - record.lastReset > WINDOW_SIZE_MS) {
    ipRequestMap.set(ip, { count: 1, lastReset: now });
    return next();
  }

  if (record.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }

  record.count++;
  next();
};
