import { Router, Request, Response } from 'express';
import { SolanaService } from '../services/solanaService';
import { apiKeyMiddleware } from '../middleware/apiKey';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = Router();
const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const solanaService = new SolanaService(rpcUrl);

/**
 * @route GET /identity/:wallet
 * @desc Get identity and risk data for a wallet address
 * @access Private (API Key)
 */
router.get('/:wallet', apiKeyMiddleware, rateLimitMiddleware, async (req: Request, res: Response) => {
  const { wallet } = req.params;

  if (!wallet || wallet.length < 32) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid wallet address format',
    });
  }

  try {
    const data = await solanaService.getIdentity(wallet);

    if (!data) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Identity data not found for the specified wallet',
      });
    }

    return res.json(data);
  } catch (err) {
    console.error(`Route error for ${wallet}:`, err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve identity data',
    });
  }
});

export default router;
