import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

/**
 * @route POST /auth/login
 * @desc Login via wallet signature
 * @access Public
 */
router.post('/login', async (req: Request, res: Response) => {
  const { wallet, signature, message } = req.body;

  if (!wallet || !signature || !message) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing wallet, signature or message' });
  }

  try {
    // Verify signature
    const isVerified = nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      bs58.decode(signature),
      bs58.decode(wallet)
    );

    if (!isVerified) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid signature' });
    }

    // Generate JWT
    const token = jwt.sign({ wallet }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token, wallet });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Verification failed' });
  }
});

export default router;
