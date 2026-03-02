import { Request, Response, NextFunction } from 'express';

const API_KEY = process.env.API_KEY || 's1-dev-key-777';

export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const providedKey = req.header('x-api-key');

  if (!providedKey || providedKey !== API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key',
    });
  }

  next();
};
